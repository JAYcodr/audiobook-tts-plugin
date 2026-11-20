/**
 * Issue #6 测试：人话错误诊断（401/402/413/429/503/504）、纯 ASCII HTTP 头编码、
 * Hybrid 切源状态中文翻译与 Delivery/Metrics 最近异常追踪。
 */
import { EventEmitter } from 'node:events'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { Store } from '../src/config.mjs'
import { encodeHintHeader, humanizeError, humanizeSwitchReason } from '../src/hints.mjs'
import { UpstreamError } from '../src/providers/mimo.mjs'
import { TtsService } from '../src/service.mjs'
import { encodeWav } from '../src/wav.mjs'

async function callSvc(svc, { method = 'GET', url = '/', headers = {}, body = '' } = {}) {
  let status = 200
  let resHeaders = {}
  const chunks = []
  let resolveDone
  const done = new Promise((r) => { resolveDone = r })

  const req = Object.assign(new EventEmitter(), {
    method,
    url,
    headers,
    socket: { remoteAddress: '127.0.0.1' },
  })
  const res = {
    headersSent: false,
    setHeader(k, v) { resHeaders[k] = v },
    writeHead(s, h = {}) {
      status = s
      resHeaders = { ...resHeaders, ...h }
      res.headersSent = true
    },
    write(chunk) { chunks.push(Buffer.from(chunk)); return true },
    end(chunk) {
      if (chunk !== undefined) chunks.push(Buffer.from(chunk))
      resolveDone()
    },
  }

  const p = svc.handle(req, res)
  queueMicrotask(() => {
    if (body) req.emit('data', Buffer.isBuffer(body) ? body : Buffer.from(body))
    req.emit('end')
  })
  await Promise.all([p, done])
  const buf = Buffer.concat(chunks)
  return { status, headers: resHeaders, bodyBuffer: buf, bodyText: buf.toString('utf8') }
}

test('humanizeError 与 encodeHintHeader：覆盖 401/402/413/429/503/504 且确保 HTTP 头纯 ASCII', () => {
  const encoded = encodeHintHeader('云端余额不足，请切到本地模式')
  assert.match(encoded, /^[\x20-\x7e]+$/)
  assert.equal(decodeURIComponent(encoded), '云端余额不足，请切到本地模式')

  const authEndpoint = humanizeError(401, { endpointAuth: true })
  assert.equal(authEndpoint.httpStatus, 401)
  assert.equal(authEndpoint.code, 'unauthorized')

  const quotaLocal = humanizeError(new UpstreamError('上游 402: insufficient_quota', { status: 402 }), { localReady: true })
  assert.equal(quotaLocal.httpStatus, 402)
  assert.equal(quotaLocal.code, 'quota_exhausted')
  assert.equal(quotaLocal.action, 'switch-local')

  const quotaCloudOnly = humanizeError(new UpstreamError('余额不足', { status: 402 }), { localReady: false })
  assert.equal(quotaCloudOnly.httpStatus, 402)
  assert.equal(quotaCloudOnly.action, 'open-settings')

  const rate = humanizeError(new UpstreamError('上游 429', { status: 429 }))
  assert.equal(rate.httpStatus, 429)
  assert.equal(rate.code, 'rate_limited')

  const tooLong = humanizeError(413, { maxTextChars: 5000 })
  assert.equal(tooLong.httpStatus, 413)
  assert.match(tooLong.message, /5000/)

  const stopped = humanizeError(Object.assign(new Error('服务未启动'), { code: 'service_stopped', status: 503 }))
  assert.equal(stopped.httpStatus, 503)
  assert.equal(stopped.action, 'start-service')

  const localErr = humanizeError(Object.assign(new Error('Python 不存在'), { code: 'missing_python' }), { provider: 'local' })
  assert.equal(localErr.httpStatus, 503)
  assert.equal(localErr.action, 'open-setup')

  const netErr = humanizeError(Object.assign(new Error('fetch failed ETIMEDOUT'), { code: 'ETIMEDOUT' }), { localReady: true })
  assert.equal(netErr.httpStatus, 504)
  assert.equal(netErr.action, 'switch-local')
})

test('humanizeSwitchReason 翻译所有 Hybrid 内部切源状态码', () => {
  assert.equal(humanizeSwitchReason('buffer-ok 16.6>=12.0'), '缓冲充裕，已切回本地（16.6s ≥ 12.0s）')
  assert.equal(humanizeSwitchReason('buffer-wait 5.2<12.0'), '缓冲累积中，继续云端顶班（5.2s < 12.0s）')
  assert.equal(humanizeSwitchReason('cold-cloud (reset:章节标题)'), '冷启动云端极速顶班（会话因「章节标题」已重置）')
  assert.equal(humanizeSwitchReason('budget-local'), '云端超出 12s 预算，已预热并切回本地')
  assert.equal(humanizeSwitchReason('hybrid-cloud'), '流式冷启动：预置音色抢首包中')
  assert.equal(humanizeSwitchReason('cloud-failed-local: network'), '云端异常，已自动切回本地兜底')
})

test('/listening 与 /v1/audio/speech 返回 X-Audiobook-Hint、拦截 402/401 致命错误并在恢复后标记 resolved', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'tts-hints-'))
  try {
    const store = new Store(dir)
    store.load({})
    store.update({
      auth: { enabled: true, token: 'tok-hint-admin-999' },
      upstream: {
        provider: 'mimo',
        keys: ['sk-test-hint-0001'],
        maxRetry: 0,
        local: {
          pythonPath: '/opt/venv/bin/python',
          modelPath: '/opt/models/qwen',
        },
      },
      openaiServer: { enabled: true, apiKey: 'sk-test-oa-hint-9999' },
    })

    const svc = new TtsService({ store, log: () => {} })

    // 1) 未启动服务请求 /listening -> 503 + X-Audiobook-Hint + lastError.action='start-service'
    const resStopped = await callSvc(svc, {
      method: 'GET',
      url: '/listening?token=tok-hint-admin-999&text=%E6%B5%8B%E8%AF%95',
    })
    assert.equal(resStopped.status, 503)
    assert.match(resStopped.headers['X-Audiobook-Hint'], /^[\x20-\x7e]+$/)
    assert.match(decodeURIComponent(resStopped.headers['X-Audiobook-Hint']), /启动/)
    assert.equal(svc.metrics.snapshot().lastError.status, 503)
    assert.equal(svc.metrics.snapshot().lastError.action, 'start-service')

    // 2) 未带令牌 -> 401 + X-Audiobook-Hint
    svc.listening = true
    const resUnauth = await callSvc(svc, {
      method: 'GET',
      url: '/listening?text=%E6%B5%8B%E8%AF%95',
    })
    assert.equal(resUnauth.status, 401)
    assert.match(decodeURIComponent(resUnauth.headers['X-Audiobook-Hint']), /复制/)

    // 3) 上游返回 402 额度耗尽：MiMoProvider 不返回纯静音 200，而是抛出 402 + 引导切本地 + 记录 lastError
    svc.mimo.synthesize = async () => {
      throw new UpstreamError('上游 402: insufficient_quota', { status: 402, retryable: false })
    }
    const res402 = await callSvc(svc, {
      method: 'GET',
      url: '/listening?token=tok-hint-admin-999&text=%E9%A2%9D%E5%BA%A6%E8%80%97%E5%B0%BD%E6%B5%8B%E8%AF%95',
    })
    assert.equal(res402.status, 402)
    assert.match(res402.headers['X-Audiobook-Hint'], /^[\x20-\x7e]+$/)
    assert.match(decodeURIComponent(res402.headers['X-Audiobook-Hint']), /余额|额度/)
    const snapErr = svc.metrics.snapshot()
    assert.equal(snapErr.lastError.status, 402)
    assert.equal(snapErr.lastError.action, 'switch-local')
    assert.equal(snapErr.lastError.resolved, false)

    // 4) OpenAI /v1/audio/speech 遇到 402 保持 { error: { message, type, code } } 结构并附 X-Audiobook-Hint
    const resOa402 = await callSvc(svc, {
      method: 'POST',
      url: '/v1/audio/speech',
      headers: {
        'content-type': 'application/json',
        authorization: 'Bearer sk-test-oa-hint-9999',
      },
      body: JSON.stringify({ input: '测试OpenAI额度错误提示。' }),
    })
    assert.equal(resOa402.status, 402)
    const oaBody = JSON.parse(resOa402.bodyText)
    assert.equal(oaBody.error.type, 'upstream_error')
    assert.equal(oaBody.error.code, 'quota_exhausted')
    assert.match(decodeURIComponent(resOa402.headers['X-Audiobook-Hint']), /余额|额度/)

    // 5) 下一次请求合成成功后 lastError.resolved 自动标记为 true
    svc.mimo.synthesize = async () => encodeWav(Buffer.alloc(4800), 24000, 1, 16)
    const resRecovered = await callSvc(svc, {
      method: 'GET',
      url: '/listening?token=tok-hint-admin-999&text=%E6%81%A2%E5%A4%8D%E6%B5%8B%E8%AF%95',
    })
    assert.equal(resRecovered.status, 200)
    assert.equal(svc.metrics.snapshot().lastError.resolved, true)

    // 6) Hybrid status 附带 lastSwitchReasonText
    svc.hybridProvider.lastSwitchReason = 'buffer-ok 16.6>=12.0'
    assert.equal(svc.hybridStatus().lastSwitchReasonText, '缓冲充裕，已切回本地（16.6s ≥ 12.0s）')
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})
