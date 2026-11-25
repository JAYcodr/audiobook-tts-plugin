/**
 * 真 HTTP 契约测试基座。
 *
 * 为什么不用假 req/res：
 *   - `readBody` 超限后先 reject 再 destroy，假 req 的 destroy 是空函数，
 *     测试永远「通过」，真实客户端拿到的是 ECONNRESET；
 *   - chunked 分帧、Content-Length、HEAD 语义、客户端 abort 只有在真实 socket 上才成立；
 *   - 响应头里非 ASCII 字符只有真实 writeHead 会抛 ERR_INVALID_CHAR。
 *
 * 上游用本地 HTTP 假服务模拟 MiMo 的 `/chat/completions`（SSE 与整段两种），
 * 不替换 provider 方法，所以 provider 的 HTTP 客户端、SSE 解析、重试都参与。
 */
import { createServer, request as nodeHttpRequest } from 'node:http'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Store } from '../../src/config.mjs'
import { TtsService } from '../../src/service.mjs'
import { encodeWav } from '../../src/wav.mjs'

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

export function makeDataDir(prefix = 'mimo-contract-') {
  return mkdtempSync(join(tmpdir(), prefix))
}

/** 把测试配置压成一条合法补丁：auth 默认关掉，上游指向假服务。 */
export function makePatch(baseUrl, extra = {}) {
  const { upstream: extraUpstream, ...rest } = extra
  return {
    auth: { enabled: false },
    ...rest,
    upstream: {
      provider: 'mimo',
      keys: ['sk-test-contract-0001'],
      baseUrl,
      ...(extraUpstream || {}),
    },
  }
}

async function listen(server) {
  await new Promise((resolve, reject) => {
    server.once('error', reject)
    server.listen(0, '127.0.0.1', resolve)
  })
  return server.address().port
}

/**
 * 起一个被测服务。端口由内核分配（listen(0)），请求走真实 socket。
 */
export async function startTestServer({ patch = {}, store: existing } = {}) {
  const dir = existing ? existing.dataDir : makeDataDir()
  const store = existing || new Store(dir)
  if (!existing) store.load({})
  if (patch && Object.keys(patch).length) store.update(patch)
  const svc = new TtsService({ store, log: () => {} })
  const server = createServer(svc.createRequestListener())
  const port = await listen(server)
  svc.listening = true
  return {
    svc,
    store,
    dataDir: dir,
    port,
    url: `http://127.0.0.1:${port}`,
    async close() {
      svc.listening = false
      await new Promise((resolve) => server.close(resolve))
      if (!existing) rmSync(dir, { recursive: true, force: true })
    },
  }
}

/** 发一个真实 HTTP 请求，返回状态码、原始头与完整 body。 */
export function httpRequest(port, path, { method = 'GET', headers = {}, body, timeoutMs = 10_000 } = {}) {
  return new Promise((resolve, reject) => {
    const req = nodeHttpRequest(
      { host: '127.0.0.1', port, path, method, headers },
      (res) => {
        const chunks = []
        res.on('data', (chunk) => chunks.push(chunk))
        res.on('end', () => resolve({
          status: res.statusCode,
          headers: res.headers,
          body: Buffer.concat(chunks),
          text: Buffer.concat(chunks).toString('utf8'),
        }))
        res.on('error', reject)
      },
    )
    req.setTimeout(timeoutMs, () => req.destroy(new Error(`请求超时 ${timeoutMs}ms`)))
    req.on('error', reject)
    if (body !== undefined) req.write(body)
    req.end()
  })
}

/** JSON 便捷入口。 */
export async function httpJson(port, path, { method = 'GET', headers = {}, body, timeoutMs } = {}) {
  const payload = body !== undefined && typeof body !== 'string' && !Buffer.isBuffer(body)
    ? JSON.stringify(body)
    : body
  const res = await httpRequest(port, path, {
    method,
    headers: payload !== undefined
      ? { 'content-type': 'application/json', ...headers }
      : headers,
    body: payload,
    timeoutMs,
  })
  try {
    res.json = JSON.parse(res.text)
  } catch {
    res.json = null
  }
  return res
}

/**
 * 发请求并在收到首个数据块后立刻掐断连接，用来验证「客户端挂了上游要停」。
 * 返回首块内容、到达耗时，以及一个等 aborted 的回调。
 */
export function requestAndAbort(port, path, { method = 'GET', headers = {}, body, abortAfterBytes = 1 } = {}) {
  return new Promise((resolve, reject) => {
    let firstChunkAt = 0
    const startedAt = Date.now()
    let received = 0
    const req = nodeHttpRequest({ host: '127.0.0.1', port, path, method, headers }, (res) => {
      res.on('data', (chunk) => {
        received += chunk.length
        if (!firstChunkAt) firstChunkAt = Date.now() - startedAt
        if (received >= abortAfterBytes) {
          req.destroy()
          resolve({
            firstChunkAt,
            status: res.statusCode,
            headers: res.headers,
            firstChunk: chunk,
          })
        }
      })
      res.on('error', () => {})
    })
    req.on('error', (err) => {
      // 主动 destroy 后的 ECONNRESET 属于预期，首块已经拿到就不算失败
      if (firstChunkAt) return
      reject(err)
    })
    if (body !== undefined) req.write(body)
    req.end()
  })
}

/**
 * 假 MiMo 上游。支持整段 WAV 与 SSE 流式两种响应。
 * @param {object} opts
 * @param {number} [opts.pcmSlices] 流式响应分几片（每片 0.1s / 4800B）
 * @param {number} [opts.sliceDelayMs] 片与片之间的延迟（用来证明首块没有等全部完成）
 * @param {number} [opts.failWith] 直接返回该状态码（用于上游 5xx 透传）
 * @param {(body:object, req:import('node:http').IncomingMessage)=>void} [opts.onRequest]
 */
export async function startFakeMiMo({ pcmSlices = 3, sliceDelayMs = 0, failWith = 0, onRequest } = {}) {
  const seen = { requests: [], aborted: 0, closed: 0 }
  const server = createServer((req, res) => {
    const chunks = []
    req.on('data', (c) => chunks.push(c))
    req.on('end', async () => {
      let body = {}
      try { body = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}') } catch { /* ignore */ }
      seen.requests.push({ url: req.url, body, headers: req.headers })
      onRequest?.(body, req, seen)
      res.on('close', () => { seen.closed += 1 })
      if (failWith) {
        res.writeHead(failWith, { 'content-type': 'application/json' })
        res.end(JSON.stringify({ error: { message: 'upstream boom' } }))
        return
      }
      if (body.stream) {
        res.writeHead(200, {
          'content-type': 'text/event-stream',
          'cache-control': 'no-cache',
          connection: 'keep-alive',
        })
        for (let i = 0; i < pcmSlices; i++) {
          if (i > 0 && sliceDelayMs) await sleep(sliceDelayMs)
          if (res.destroyed) return
          const pcm = Buffer.alloc(4800, i + 1)
          res.write(`data: ${JSON.stringify({ choices: [{ delta: { audio: { data: pcm.toString('base64') } } }] })}\n\n`)
        }
        res.write('data: [DONE]\n\n')
        res.end()
        return
      }
      const wav = encodeWav(Buffer.alloc(4800), 24000, 1, 16)
      res.writeHead(200, { 'content-type': 'application/json' })
      res.end(JSON.stringify({ choices: [{ message: { audio: { data: wav.toString('base64') } } }] }))
    })
  })
  const port = await listen(server)
  return {
    port,
    url: `http://127.0.0.1:${port}`,
    seen,
    async close() {
      await new Promise((resolve) => server.close(resolve))
    },
  }
}
