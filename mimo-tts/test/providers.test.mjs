import test from 'node:test'
import assert from 'node:assert/strict'
import { EventEmitter } from 'node:events'
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { Store, redact, maskKey } from '../src/config.mjs'
import { TtsService } from '../src/service.mjs'
import { TTSProvider } from '../src/providers/base.mjs'
import { encodeWav, parseWav } from '../src/wav.mjs'
import { resolveDataDir } from '../index.js'

const fresh = (p = 'mimo-prov-') => mkdtempSync(join(tmpdir(), p))

function makeFakeReq({ method = 'GET', url = '/', headers = {}, body = '' }) {
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

function makeFakeRes() {
  const chunks = []
  return {
    status: 0,
    headers: {},
    headersSent: false,
    writeHead(s, h = {}) {
      this.status = s
      this.headers = h
      this.headersSent = true
    },
    write(b) { if (b) chunks.push(Buffer.from(b)) },
    end(b) { if (b) chunks.push(Buffer.from(b)) },
    get bodyBuffer() { return Buffer.concat(chunks) },
    get bodyText() { return this.bodyBuffer.toString('utf8') },
  }
}

test('OpenAiTtsProvider 支持 wav/pcm 格式、按角色切音色、可选 Bearer Key、重试与缓存失效', async () => {
  const dir = fresh()
  const seen = []
  let failOnce = true
  const prevFetch = globalThis.fetch
  globalThis.fetch = async (url, init = {}) => {
    const body = JSON.parse(String(init.body || '{}'))
    const auth = init.headers?.Authorization || ''
    seen.push({ url: String(url), auth, body })
    if (failOnce) {
      failOnce = false
      return new Response('busy', { status: 503 })
    }
    if (body.response_format === 'pcm') {
      return new Response(Buffer.alloc(4800), { status: 200 })
    }
    return new Response(encodeWav(Buffer.alloc(4800), 24000, 1, 16), { status: 200 })
  }

  let svc
  try {
    const store = new Store(dir)
    store.load({})
    const r = store.update({
      auth: { enabled: false },
      upstream: {
        provider: 'openai',
        openai: {
          baseUrl: 'http://127.0.0.1:8880/v1',
          apiKey: '',
          model: 'kokoro',
          narratorVoice: 'zf_xiaoxiao',
          dialogueVoice: 'zm_yunjian',
          responseFormat: 'wav',
          speed: 1.1,
          maxRetry: 1,
        },
      },
    })
    assert.deepEqual(r.problems, [])

    svc = new TtsService({ store, log: () => {} })
    svc.listening = true

    // 1) 首次请求含旁白与对话，同时验证 503 重试恢复与按角色切换 voice
    const res1 = makeFakeRes()
    await svc.handle(makeFakeReq({
      method: 'POST',
      url: '/listening',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ text: '她轻声说："你好。"' }).toString(),
    }), res1)
    assert.equal(res1.status, 200)
    assert.equal(res1.headers['X-Mimo-Source'], 'openai')
    assert.ok(parseWav(res1.bodyBuffer).durationSec > 0.1)

    assert.ok(seen.every((x) => x.url === 'http://127.0.0.1:8880/v1/audio/speech' && x.auth === ''))
    const voicesUsed = new Set(seen.map((x) => x.body.voice))
    assert.ok(voicesUsed.has('zf_xiaoxiao'))
    assert.ok(voicesUsed.has('zm_yunjian'))

    // 2) 再次请求同一文本：命中缓存，不再请求上游
    const beforeCount = seen.length
    const res2 = makeFakeRes()
    await svc.handle(makeFakeReq({
      method: 'POST',
      url: '/listening',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ text: '她轻声说："你好。"' }).toString(),
    }), res2)
    assert.equal(res2.status, 200)
    assert.equal(seen.length, beforeCount)

    // 3) 切换 pcm + Bearer apiKey + 新音色，验证缓存自动失效与掩码保护
    await svc.applyPatch({
      upstream: {
        openai: {
          apiKey: 'sk-openai-secret-9999',
          narratorVoice: 'nova',
          responseFormat: 'pcm',
        },
      },
    })
    assert.equal(redact(store.config).upstream.openai.apiKey, maskKey('sk-openai-secret-9999'))

    const keepMask = await svc.applyPatch({
      upstream: { openai: { apiKey: maskKey('sk-openai-secret-9999'), model: 'gpt-4o-mini-tts' } },
    })
    assert.deepEqual(keepMask.problems, [])
    assert.equal(store.config.upstream.openai.apiKey, 'sk-openai-secret-9999')

    const prevRes = makeFakeRes()
    await svc.handle(makeFakeReq({
      method: 'POST',
      url: '/api/preview',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text: '试听一句。', role: 'narrator' }),
    }), prevRes)
    assert.equal(prevRes.status, 200)
    assert.equal(prevRes.headers['X-Mimo-Source'], 'openai')
    assert.equal(prevRes.bodyBuffer.toString('ascii', 0, 4), 'RIFF')
    assert.equal(seen.at(-1).auth, 'Bearer sk-openai-secret-9999')
    assert.equal(seen.at(-1).body.voice, 'nova')
    assert.equal(seen.at(-1).body.response_format, 'pcm')
  } finally {
    globalThis.fetch = prevFetch
    await svc?.stop().catch(() => {})
    rmSync(dir, { recursive: true, force: true })
  }
})

test('HybridProvider 冷启动走云端克隆顶班，本地预热就绪后切回本地', async () => {
  const dir = fresh('mimo-hyb-')
  const refWav = join(dir, 'narr.wav')
  writeFileSync(refWav, encodeWav(Buffer.alloc(4800), 24000, 1, 16))
  let svc
  try {
    const store = new Store(dir)
    store.load({})
    store.update({
      auth: { enabled: false },
      upstream: {
        provider: 'hybrid',
        keys: ['sk-cloud-key-123456'],
        local: {
          pythonPath: '/opt/venv/bin/python',
          modelPath: '/models/qwen',
          refs: { narrator: { wav: refWav, text: '旁白参考' } },
        },
        hybrid: { maxCloudBootstrap: 4, cloudConcurrency: 2, targetRms: 0.126, warmup: false },
      },
    })
    svc = new TtsService({ store, log: () => {} })
    const sample = encodeWav(Buffer.alloc(4800, 10), 24000, 1, 16)
    svc.mimo.synthesize = async () => sample
    svc.local.synthesize = async () => sample

    // 本地未热：走 hybrid-cloud
    const r1 = await svc.synthesize([{ text: '第一句。', role: 'narrator' }], { clientKey: 'dev1', started: Date.now() })
    assert.equal(r1.source, 'hybrid-cloud')

    // 模拟本地预热就绪并已有充足缓冲（或新段落重置）
    svc.local.state = 'ready'
    svc.local.warm = true
    const r2 = await svc.synthesize([{ text: '第一章 开端', role: 'narrator' }], { clientKey: 'dev1', started: Date.now() })
    assert.equal(r2.source, 'hybrid-local')
    assert.equal(svc.hybridStatus().lastSource, 'hybrid-local')
  } finally {
    await svc?.stop().catch(() => {})
    rmSync(dir, { recursive: true, force: true })
  }
})

test('自定义 TTSProvider 可通过 registerProvider 接入流水线', async () => {
  const dir = fresh()
  try {
    const store = new Store(dir)
    store.load({})
    store.update({ auth: { enabled: false } })
    const svc = new TtsService({ store, log: () => {} })

    class EdgeMockProvider extends TTSProvider {
      async synthesizeSegment() {
        return encodeWav(Buffer.alloc(4800), 24000, 1, 16)
      }
    }
    svc.registerProvider(new EdgeMockProvider({
      id: 'edge-mock',
      label: 'Edge Mock',
      getConfig: () => store.config,
      cache: svc.cache,
      gate: svc.gate,
      log: svc.log,
    }))
    store.config.upstream.provider = 'edge-mock'

    const prev = await svc.preview({ text: '你好', role: 'narrator' })
    assert.equal(prev.source, 'edge-mock')
    assert.equal(prev.wav.toString('ascii', 0, 4), 'RIFF')

    const batch = await svc.synthesize([{ text: '第一句。', role: 'narrator', voice: 'a', style: '', mode: 'preset' }])
    assert.equal(batch.source, 'edge-mock')
    assert.ok(batch.durationSec > 0)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('resolveDataDir 兼容旧 plugin-data/mimo-tts 目录与新目录', () => {
  const home = fresh('mimo-home-')
  try {
    const legacy = join(home, 'plugin-data', 'mimo-tts')
    mkdirSync(legacy, { recursive: true })
    assert.equal(resolveDataDir({ DSH_HOME: home }), legacy)

    const freshHome = fresh('mimo-fresh-home-')
    try {
      assert.equal(
        resolveDataDir({ DSH_HOME: freshHome }),
        join(freshHome, 'plugin-data', 'audiobook-tts-plugin'),
      )
    } finally {
      rmSync(freshHome, { recursive: true, force: true })
    }
  } finally {
    rmSync(home, { recursive: true, force: true })
  }
})
