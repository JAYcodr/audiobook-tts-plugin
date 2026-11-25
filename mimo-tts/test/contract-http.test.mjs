/**
 * 接口契约测试：真 HTTP server + 真 socket + 本地假上游。
 *
 * 这些断言用假 req/res 做不到：
 *   - 413 必须先于 socket 掐断写出去（旧实现客户端只收到 ECONNRESET）；
 *   - chunked 分帧与 Content-Length 只有真实响应才有；
 *   - 客户端 abort 依赖真实 socket close 事件才能触达上游；
 *   - 上游非 200 透传要经过 provider 的 fetch 与重试链。
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { request as httpRequest } from 'node:http'
import {
  httpJson,
  httpRequest as rawRequest,
  makePatch,
  requestAndAbort,
  sleep,
  startFakeMiMo,
  startTestServer,
} from './helpers/http-server.mjs'

/** 收完整响应，同时记录每个数据块到达的时间，用来判断首块是否早于末块。 */
function collectStream(port, path) {
  return new Promise((resolve, reject) => {
    const t0 = Date.now()
    const chunks = []
    const req = httpRequest({ host: '127.0.0.1', port, path, method: 'GET' }, (res) => {
      res.on('data', (chunk) => chunks.push({ at: Date.now() - t0, len: chunk.length }))
      res.on('end', () => resolve({
        status: res.statusCode,
        headers: res.headers,
        chunks,
        totalMs: Date.now() - t0,
      }))
      res.on('error', reject)
    })
    req.on('error', reject)
    req.end()
  })
}

test('/health 在服务没起来时不能报 ok', async () => {
  const upstream = await startFakeMiMo()
  const app = await startTestServer({ patch: makePatch(upstream.url) })
  try {
    const live = await httpJson(app.port, '/health')
    assert.equal(live.status, 200)
    assert.equal(live.json.status, 'ok')
    assert.equal(live.json.running, true)

    app.svc.listening = false
    const dead = await httpJson(app.port, '/health')
    assert.equal(dead.status, 200, '端口还在，HTTP 层仍然可连')
    assert.notEqual(dead.json.status, 'ok', '听书服务已停，status 不能再是 ok')
    assert.equal(dead.json.running, false)
  } finally {
    await app.close()
    await upstream.close()
  }
})

test('超过 1MB 的请求体必须拿到 413 JSON，而不是连接被重置', async () => {
  const upstream = await startFakeMiMo()
  const app = await startTestServer({ patch: makePatch(upstream.url) })
  try {
    const result = await new Promise((resolve, reject) => {
      const req = httpRequest({
        host: '127.0.0.1',
        port: app.port,
        path: '/listening',
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
      }, (res) => {
        const chunks = []
        res.on('data', (c) => chunks.push(c))
        res.on('end', () => resolve({
          status: res.statusCode,
          headers: res.headers,
          body: Buffer.concat(chunks).toString('utf8'),
        }))
      })
      req.on('error', reject)
      // 不 end：阅读器发到一半被拒是常态，服务端必须在读满 1MB 时就把 413 写出来
      req.write(`text=${'a'.repeat(1_100_000)}`)
      setTimeout(() => req.destroy(), 3000).unref()
    })
    assert.equal(result.status, 413, `期望 413，实际 ${result.status}`)
    assert.match(result.headers['content-type'], /application\/json/)
    const body = JSON.parse(result.body)
    assert.match(body.error, /请求体过大/)
  } finally {
    await app.close()
    await upstream.close()
  }
})

test('GET /legado.json 之外的动作用 405，不能静默当 GET 返回 JSON', async () => {
  const upstream = await startFakeMiMo()
  const app = await startTestServer({ patch: makePatch(upstream.url) })
  try {
    const get = await httpJson(app.port, '/legado.json')
    assert.equal(get.status, 200)
    assert.ok(Array.isArray(get.json))

    for (const method of ['PUT', 'DELETE', 'POST']) {
      const res = await rawRequest(app.port, '/legado.json', { method })
      assert.equal(res.status, 405, `${method} /legado.json 必须是 405`)
      assert.equal(res.headers.allow, 'GET, HEAD')
    }
  } finally {
    await app.close()
    await upstream.close()
  }
})

test('上游 5xx 透传成同状态码与 upstream_error，不吞成 200', async () => {
  const upstream = await startFakeMiMo({ failWith: 503 })
  const app = await startTestServer({
    patch: makePatch(upstream.url, { upstream: { maxRetry: 0 } }),
  })
  try {
    const res = await httpJson(
      app.port,
      `/listening?text=${encodeURIComponent('上游故障时这句要报错。')}`,
    )
    assert.equal(res.status, 503)
    assert.equal(res.json.code, 'upstream_error')
    assert.match(res.json.error, /合成失败|上游/)
    assert.ok(res.headers['x-audiobook-hint'], '错误响应仍要带可读提示头')
  } finally {
    await app.close()
    await upstream.close()
  }
})

test('OPTIONS 预检放行插件自己的令牌头', async () => {
  const upstream = await startFakeMiMo()
  const app = await startTestServer({ patch: makePatch(upstream.url) })
  try {
    const res = await rawRequest(app.port, '/v1/audio/speech', {
      method: 'OPTIONS',
      headers: {
        origin: 'http://localhost:59373',
        'access-control-request-method': 'POST',
        'access-control-request-headers': 'x-audiobook-token, content-type',
      },
    })
    assert.equal(res.status, 204)
    const allow = String(res.headers['access-control-allow-headers'] || '').toLowerCase()
    for (const name of ['x-audiobook-token', 'x-mimo-token', 'authorization', 'content-type']) {
      assert.ok(allow.includes(name), `预检放行头里缺 ${name}：${allow}`)
    }
    assert.equal(res.headers['access-control-allow-origin'], '*')
  } finally {
    await app.close()
    await upstream.close()
  }
})

test('流式响应：chunked 无 Content-Length，首块远早于末块', async () => {
  const upstream = await startFakeMiMo({ pcmSlices: 3, sliceDelayMs: 300 })
  const app = await startTestServer({ patch: makePatch(upstream.url) })
  try {
    const res = await collectStream(
      app.port,
      `/listening?stream=1&text=${encodeURIComponent('流式首包要快。')}`,
    )
    assert.equal(res.status, 200)
    assert.equal(res.headers['content-type'], 'audio/wav')
    assert.equal(res.headers['transfer-encoding'], 'chunked')
    assert.equal(res.headers['content-length'], undefined, '流式响应不能带 Content-Length')
    assert.ok(res.chunks.length >= 2, `至少要分两段写出，实际 ${res.chunks.length}`)

    const firstAt = res.chunks[0].at
    const lastAt = res.chunks.at(-1).at
    assert.ok(firstAt < 250, `首块应在 250ms 内到达（上游第 2 片延迟 300ms），实际 ${firstAt}ms`)
    assert.ok(lastAt - firstAt >= 500, `首末块间隔应体现上游的 600ms 延迟，实际 ${lastAt - firstAt}ms`)
  } finally {
    await app.close()
    await upstream.close()
  }
})

test('客户端中途断开时，上游连接被取消，账上不记一次成功', async () => {
  const upstream = await startFakeMiMo({ pcmSlices: 4, sliceDelayMs: 200 })
  const app = await startTestServer({ patch: makePatch(upstream.url) })
  try {
    const got = await requestAndAbort(
      app.port,
      `/listening?stream=1&text=${encodeURIComponent('读到一半关掉。')}`,
      { abortAfterBytes: 1 },
    )
    assert.equal(got.status, 200)
    await sleep(500)

    assert.ok(upstream.seen.closed >= 1, '客户端断开后，上游 SSE 连接必须被关掉')
    const snap = app.svc.metrics.snapshot()
    const billed = snap.recent.filter((r) => !r.error && Number(r.chars) > 0)
    assert.equal(billed.length, 0, `中断的请求不能记成成功：${JSON.stringify(billed)}`)
  } finally {
    await app.close()
    await upstream.close()
  }
})

test('/api/state 的 config 段必须脱敏，只读令牌拿不到管理接口', async () => {
  const upstream = await startFakeMiMo()
  const app = await startTestServer({ patch: makePatch(upstream.url) })
  try {
    const adminToken = app.store.config.auth.token
    app.store.update({
      auth: {
        enabled: true,
        token: adminToken,
        readTokens: [{ id: 'rt1', label: '朋友手机', token: 'rt_friend_contract_01' }],
      },
    })
    const raw = await rawRequest(app.port, `/api/state?token=${encodeURIComponent(adminToken)}`)
    assert.equal(raw.status, 200)
    const state = JSON.parse(raw.text)

    // 主令牌对 admin 可见是有意的（设置页要能复制），只读令牌必须脱敏。
    const configJson = JSON.stringify(state.config)
    assert.ok(!configJson.includes('rt_friend_contract_01'), '/api/state 的 config 段泄露了只读令牌')
    assert.equal(state.config.auth.readTokens[0].token, '••••••')

    const readOnly = await rawRequest(app.port, '/api/state?token=rt_friend_contract_01')
    assert.equal(readOnly.status, 403, '只读令牌不能读管理接口')
  } finally {
    await app.close()
    await upstream.close()
  }
})

test('非流式响应带准确的 Content-Length，且能解析成合法 WAV', async () => {
  const upstream = await startFakeMiMo()
  const app = await startTestServer({ patch: makePatch(upstream.url) })
  try {
    const res = await rawRequest(
      app.port,
      `/listening?text=${encodeURIComponent('长度要对齐。')}`,
    )
    assert.equal(res.status, 200)
    assert.equal(Number(res.headers['content-length']), res.body.length)
    assert.equal(res.body.toString('ascii', 0, 4), 'RIFF')
    assert.equal(res.body.toString('ascii', 8, 12), 'WAVE')
  } finally {
    await app.close()
    await upstream.close()
  }
})

