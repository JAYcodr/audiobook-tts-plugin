import test from 'node:test'
import assert from 'node:assert/strict'
import { EventEmitter } from 'node:events'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Store } from '../src/config.mjs'
import { TtsService } from '../src/service.mjs'
import { encodeWav, parseWav } from '../src/wav.mjs'

const fresh = (p = 'mimo-stream-') => mkdtempSync(join(tmpdir(), p))

function makeReq({ method = 'POST', url = '/listening', headers = {}, body = '' }) {
  const req = new EventEmitter()
  req.method = method
  req.url = url
  req.headers = { host: '127.0.0.1:8291', ...headers }
  req.socket = { remoteAddress: '127.0.0.1' }
  req.destroy = () => {}
  queueMicrotask(() => {
    if (body) req.emit('data', Buffer.from(body))
    req.emit('end')
  })
  return req
}

function makeRes() {
  const chunks = []
  const writeTimes = []
  return {
    status: 0,
    headers: {},
    headersSent: false,
    writeHead(s, h = {}) {
      this.status = s
      this.headers = h
      this.headersSent = true
    },
    write(b) {
      if (b) {
        chunks.push(Buffer.from(b))
        writeTimes.push({ at: Date.now(), bytes: b.length })
      }
    },
    end(b) {
      if (b) chunks.push(Buffer.from(b))
    },
    writeTimes,
    get bodyBuffer() { return Buffer.concat(chunks) },
  }
}

function sseStreamFromChunks(pcmChunks, delayMs = 20) {
  const encoder = new TextEncoder()
  return new ReadableStream({
    async start(controller) {
      for (const pcm of pcmChunks) {
        const line = `data: ${JSON.stringify({ choices: [{ delta: { audio: { data: pcm.toString('base64') } } }] })}\n\n`
        controller.enqueue(encoder.encode(line))
        if (delayMs > 0) await new Promise((r) => setTimeout(r, delayMs))
      }
      controller.enqueue(encoder.encode('data: [DONE]\n\n'))
      controller.close()
    },
  })
}

test('Issue #13: Hybrid + stream=true 首段走真 SSE synthesizeStream() 抢首包，记录 hybrid-cloud 并触发本地预热', async () => {
  const dir = fresh()
  const prevFetch = globalThis.fetch
  let svc
  try {
    const refWav = join(dir, 'narr.wav')
    writeFileSync(refWav, encodeWav(Buffer.alloc(2400), 24000, 1, 16))
    const store = new Store(dir)
    store.load({})
    store.update({
      auth: { enabled: false },
      synth: { stream: true },
      upstream: {
        provider: 'hybrid',
        keys: ['sk-test-stream-123456'],
        local: {
          pythonPath: '/opt/venv/bin/python',
          modelPath: '/models/qwen',
          refs: { narrator: { wav: refWav, text: '旁白参考' } },
        },
        hybrid: { maxCloudBootstrap: 4, cloudConcurrency: 2, targetRms: 0, warmup: true },
      },
    })

    const sseCalls = []
    const chunkA = Buffer.alloc(4800, 1)
    const chunkB = Buffer.alloc(4800, 2)
    globalThis.fetch = async (_url, init) => {
      const body = JSON.parse(String(init.body || '{}'))
      sseCalls.push(body)
      assert.equal(body.stream, true)
      assert.equal(body.audio.format, 'pcm16')
      assert.equal(body.model, 'mimo-v2.5-tts')
      return new Response(sseStreamFromChunks([chunkA, chunkB], 40), {
        status: 200,
        headers: { 'Content-Type': 'text/event-stream' },
      })
    }

    const logs = []
    svc = new TtsService({ store, log: (l) => logs.push(l) })
    svc.listening = true

    let warmupCalled = 0
    svc.local.warmup = async () => {
      warmupCalled++
      svc.local.state = 'ready'
      svc.local.warm = true
      return true
    }
    svc.local.synthesize = async () => encodeWav(Buffer.alloc(4800, 3), 24000, 1, 16)

    // 100 字单段请求也必须走流式（不能被 >1 段限制拦截）
    const text100 = '夜雾落在青石长街上，远处打更声缓缓传来。'.repeat(4)
    const res = makeRes()
    const t0 = Date.now()
    await svc.handle(makeReq({
      method: 'POST',
      url: '/listening',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text: text100 }),
    }), res)

    assert.equal(res.status, 200)
    assert.equal(res.headers['X-Mimo-Source'], 'hybrid-cloud')
    assert.equal(sseCalls.length, 1)
    // 第一批写出应包括 44B WAV 头与第一片 PCM，且早于全部流结束
    assert.ok(res.writeTimes.length >= 3)
    assert.ok(res.writeTimes[1].at - t0 < 400)
    const parsed = parseWav(res.bodyBuffer)
    assert.equal(parsed.pcm.length, chunkA.length + chunkB.length)

    // metrics 应记为 hybrid-cloud 而不是 mimo
    const snap = svc.metrics.snapshot()
    assert.equal(snap.recent.at(-1).source, 'hybrid-cloud')
    assert.equal(snap.recent.at(-1).format, 'wav-stream')

    // 等 maybeWarm 500ms timer 触发本地预热
    await new Promise((r) => setTimeout(r, 600))
    assert.equal(warmupCalled, 1)
    assert.equal(svc.local.isWarm(), true)

    // 本地热后新章节切回 hybrid-local，同时打 [stream] 降级日志
    const resLocal = makeRes()
    await svc.handle(makeReq({
      method: 'POST',
      url: '/listening',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text: '第一章 本地接管测试。' }),
    }), resLocal)
    assert.equal(resLocal.status, 200)
    assert.equal(resLocal.headers['X-Mimo-Source'], 'hybrid-local')
    assert.ok(logs.some((l) => l.includes('[stream]') && l.includes('退回整段合成')))
  } finally {
    globalThis.fetch = prevFetch
    await svc?.stop().catch(() => {})
    rmSync(dir, { recursive: true, force: true })
  }
})

test('Issue #13: 流式首段失败写入 0.4s 静音 PCM 兜底且不污染缓存，后续段并发照常拼接', async () => {
  const dir = fresh()
  const prevFetch = globalThis.fetch
  let svc
  try {
    const store = new Store(dir)
    store.load({})
    store.update({
      auth: { enabled: false },
      synth: { stream: true, concurrency: 2 },
      upstream: { provider: 'mimo', keys: ['sk-test-stream-err-123'] },
    })

    let callIdx = 0
    globalThis.fetch = async (_url, init) => {
      const body = JSON.parse(String(init.body || '{}'))
      callIdx++
      if (body.stream) {
        return new Response('upstream failure', { status: 500 })
      }
      return new Response(JSON.stringify({
        choices: [{ message: { audio: { data: encodeWav(Buffer.alloc(4800, 9), 24000, 1, 16).toString('base64') } } }],
      }), { status: 200, headers: { 'Content-Type': 'application/json' } })
    }

    svc = new TtsService({ store, log: () => {} })
    svc.listening = true

    const res = makeRes()
    await svc.handle(makeReq({
      method: 'POST',
      url: '/listening',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text: '旁白失败。“对话正常。”' }),
    }), res)

    assert.equal(res.status, 200)
    assert.equal(callIdx, 2)
    const parsed = parseWav(res.bodyBuffer)
    // 0.4s @ 24kHz PCM16 (19200B) + 第 2 段 4800B = 24000B
    assert.equal(parsed.pcm.length, 19200 + 4800)
    // 失败的第 0 段不得写脏缓存；只有成功的第 1 段入缓存
    assert.equal(svc.cache.stats().entries, 1)
  } finally {
    globalThis.fetch = prevFetch
    await svc?.stop().catch(() => {})
    rmSync(dir, { recursive: true, force: true })
  }
})
