/**
 * Issue #3 测试：ETag / If-None-Match 304 / Cache-Control / X-Cache / CORS Expose-Headers。
 */
import { EventEmitter } from 'node:events'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { DEFAULTS, Store, applyEnv, validate } from '../src/config.mjs'
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

test('config cache.httpMaxAgeSeconds 默认值、校验与 ENV_KEYS', () => {
  assert.equal(DEFAULTS.cache.httpMaxAgeSeconds, 3600)

  const cfg = structuredClone(DEFAULTS)
  cfg.upstream.keys = ['sk-test-cache-0001']
  cfg.cache.httpMaxAgeSeconds = 600
  assert.deepEqual(validate(cfg), [])

  cfg.cache.httpMaxAgeSeconds = 999999
  assert.ok(validate(cfg).some((p) => p.includes('httpMaxAgeSeconds')))

  const envCfg = structuredClone(DEFAULTS)
  applyEnv(envCfg, { CACHE_HTTP_MAX_AGE: '1200' })
  assert.equal(envCfg.cache.httpMaxAgeSeconds, 1200)
})

test('/listening 与 /v1/audio/speech 支持 ETag、304 Not Modified、Cache-Control 与 X-Cache', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'tts-http-cache-'))
  try {
    const store = new Store(dir)
    store.load({})
    store.update({
      auth: { enabled: false },
      upstream: { provider: 'mimo', keys: ['sk-test-httpcache-0001'] },
      openaiServer: { enabled: true, apiKey: 'sk-test-oa-cache-9999' },
      cache: { enabled: true, maxEntries: 100, ttlSeconds: 7200, httpMaxAgeSeconds: 3600 },
    })

    const svc = new TtsService({ store, log: () => {} })
    svc.listening = true

    const wav = encodeWav(Buffer.alloc(4800), 24000, 1, 16)
    let synthCalls = 0
    svc.mimo.synthesize = async () => {
      synthCalls++
      return wav
    }
    let streamCalls = 0
    svc.mimo.synthesizeStream = async () => {
      streamCalls++
      return {
        async *[Symbol.asyncIterator]() {
          yield Buffer.alloc(1600)
        },
      }
    }

    // 1) GET /listening 首次未命中
    const r1 = await callSvc(svc, { method: 'GET', url: '/listening?text=缓存头测试。' })
    assert.equal(r1.status, 200)
    assert.equal(r1.headers['Cache-Control'], 'private, max-age=3600')
    assert.equal(r1.headers['X-Cache'], 'MISS')
    assert.ok(r1.headers.ETag && r1.headers.ETag.startsWith('"tts-'))
    assert.equal(synthCalls, 1)

    // 2) 同请求再次访问命中内存缓存：X-Cache: HIT，相同 ETag，零上游请求
    const r2 = await callSvc(svc, { method: 'GET', url: '/listening?text=缓存头测试。' })
    assert.equal(r2.status, 200)
    assert.equal(r2.headers['X-Cache'], 'HIT')
    assert.equal(r2.headers.ETag, r1.headers.ETag)
    assert.equal(synthCalls, 1)

    // 3) 条件请求 If-None-Match 命中 304（含强/弱 ETag）
    const r3 = await callSvc(svc, {
      method: 'GET',
      url: '/listening?text=缓存头测试。',
      headers: { 'if-none-match': r1.headers.ETag },
    })
    assert.equal(r3.status, 304)
    assert.equal(r3.bodyBuffer.length, 0)
    assert.equal(r3.headers.ETag, r1.headers.ETag)
    assert.equal(r3.headers['Cache-Control'], 'private, max-age=3600')
    assert.equal(r3.headers['X-Cache'], 'HIT')
    assert.equal(synthCalls, 1)

    const r3Weak = await callSvc(svc, {
      method: 'GET',
      url: '/listening?text=缓存头测试。',
      headers: { 'if-none-match': `W/${r1.headers.ETag}` },
    })
    assert.equal(r3Weak.status, 304)

    // 4) 更改音色后 ETag 必须失效并重新合成
    store.update({ voices: { narrator: { voice: '茉莉' } } })
    const r4 = await callSvc(svc, {
      method: 'GET',
      url: '/listening?text=缓存头测试。',
      headers: { 'if-none-match': r1.headers.ETag },
    })
    assert.equal(r4.status, 200)
    assert.equal(r4.headers['X-Cache'], 'MISS')
    assert.notEqual(r4.headers.ETag, r1.headers.ETag)
    assert.equal(synthCalls, 2)

    // 5) OpenAI /v1/audio/speech 支持 ETag / 304 与 CORS Expose-Headers
    const oaHeaders = {
      'content-type': 'application/json',
      authorization: 'Bearer sk-test-oa-cache-9999',
    }
    const oa1 = await callSvc(svc, {
      method: 'POST',
      url: '/v1/audio/speech',
      headers: oaHeaders,
      body: JSON.stringify({ input: 'OpenAI 缓存头校验。', response_format: 'wav' }),
    })
    assert.equal(oa1.status, 200)
    assert.equal(oa1.headers['Cache-Control'], 'private, max-age=3600')
    assert.equal(oa1.headers['X-Cache'], 'MISS')
    assert.ok(oa1.headers.ETag)
    assert.match(oa1.headers['Access-Control-Expose-Headers'], /\bETag\b/)
    assert.match(oa1.headers['Access-Control-Expose-Headers'], /\bX-Cache\b/)

    const oa304 = await callSvc(svc, {
      method: 'POST',
      url: '/v1/audio/speech',
      headers: { ...oaHeaders, 'if-none-match': oa1.headers.ETag },
      body: JSON.stringify({ input: 'OpenAI 缓存头校验。', response_format: 'wav' }),
    })
    assert.equal(oa304.status, 304)
    assert.equal(oa304.bodyBuffer.length, 0)
    assert.equal(oa304.headers.ETag, oa1.headers.ETag)

    // 6) 格式回退（无 ffmpeg）绝不被长时间强缓存，保持 Cache-Control: no-store
    svc.transcodeOpts = { findBinaryImpl: () => '' }
    const oaFallback = await callSvc(svc, {
      method: 'POST',
      url: '/v1/audio/speech',
      headers: oaHeaders,
      body: JSON.stringify({ input: '回退不缓存。', response_format: 'mp3' }),
    })
    assert.equal(oaFallback.status, 200)
    assert.equal(oaFallback.headers['Cache-Control'], 'no-store')
    assert.equal(oaFallback.headers.ETag, undefined)
    svc.transcodeOpts = {}

    // 7) httpMaxAgeSeconds = 0 或流式输出保持 no-store 且跳过 304
    store.update({ cache: { httpMaxAgeSeconds: 0 } })
    const rNoStore = await callSvc(svc, {
      method: 'GET',
      url: '/listening?text=缓存头测试。',
      headers: { 'if-none-match': r4.headers.ETag },
    })
    assert.equal(rNoStore.status, 200)
    assert.equal(rNoStore.headers['Cache-Control'], 'no-store')
    assert.equal(rNoStore.headers.ETag, undefined)
    assert.equal(rNoStore.headers['X-Cache'], 'HIT')

    store.update({ cache: { httpMaxAgeSeconds: 3600 } })
    const rStream = await callSvc(svc, {
      method: 'GET',
      url: '/listening?stream=1&text=流式跳过缓存。',
    })
    assert.equal(rStream.status, 200)
    assert.equal(rStream.headers['Cache-Control'], 'no-store')
    assert.equal(streamCalls, 1)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})
