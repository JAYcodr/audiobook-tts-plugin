import test from 'node:test'
import assert from 'node:assert/strict'
import { EventEmitter } from 'node:events'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { DEFAULTS, Store, maskKey, redact } from '../src/config.mjs'
import { TtsService } from '../src/service.mjs'
import { encodeWav, parseWav } from '../src/wav.mjs'

const fresh = (p = 'mimo-oa-srv-') => mkdtempSync(join(tmpdir(), p))

function makeReq({ method = 'GET', url = '/', headers = {}, body = '' }) {
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

async function callSvc(svc, opts) {
  const res = makeRes()
  await svc.handle(makeReq(opts), res)
  return res
}

test('config.mjs 支持 openaiServer / tunnel 默认值、掩码还原、参数校验与环境变量种子', () => {
  const dir = fresh()
  try {
    assert.equal(DEFAULTS.openaiServer.enabled, false)
    assert.equal(DEFAULTS.openaiServer.mp3Fallback, 'wav')
    assert.equal(DEFAULTS.tunnel.protocol, 'http2')

    const store = new Store(dir)
    const seeded = store.load({
      OPENAI_SERVER_ENABLED: 'true',
      OPENAI_SERVER_API_KEY: 'sk-test-env-seed-1234',
    })
    assert.equal(seeded.openaiServer.enabled, true)
    assert.equal(seeded.openaiServer.apiKey, 'sk-test-env-seed-1234')

    const masked = redact(store.config).openaiServer.apiKey
    assert.equal(masked, maskKey('sk-test-env-seed-1234'))
    assert.ok(!masked.includes('1234') || masked.includes('…'))

    const keep = store.update({
      openaiServer: { apiKey: masked, mp3Fallback: 'strict' },
      tunnel: { protocol: 'quic', kvSync: { publicRelayUrl: 'https://relay.example.workers.dev' } },
    })
    assert.deepEqual(keep.problems, [])
    assert.equal(store.config.openaiServer.apiKey, 'sk-test-env-seed-1234')
    assert.equal(store.config.openaiServer.mp3Fallback, 'strict')
    assert.equal(store.config.tunnel.protocol, 'quic')

    const badMask = store.update({
      openaiServer: { apiKey: 'sk-fake…9999' },
    })
    assert.equal(badMask.problems.length, 1)
    assert.equal(store.config.openaiServer.apiKey, 'sk-test-env-seed-1234')

    const bad = store.update({
      openaiServer: { mp3Fallback: 'ogg', voiceMap: ['bad'] },
      tunnel: { protocol: 'ssh', kvSync: { publicRelayUrl: 'http://insecure.example.com' } },
    })
    assert.ok(bad.problems.length >= 4)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('默认关闭返回 404，CORS 预检返回 204，Bearer 与 x-api-key 鉴权正确拦截', async () => {
  const dir = fresh()
  try {
    const store = new Store(dir)
    store.load({})
    const svc = new TtsService({ store, log: () => {} })
    svc.listening = true

    const optModels = await callSvc(svc, { method: 'OPTIONS', url: '/v1/models' })
    assert.equal(optModels.status, 204)
    assert.equal(optModels.headers['Access-Control-Allow-Origin'], '*')
    assert.match(optModels.headers['Access-Control-Allow-Headers'], /Authorization/i)

    const optSpeech = await callSvc(svc, { method: 'OPTIONS', url: '/v1/audio/speech' })
    assert.equal(optSpeech.status, 204)

    const disabledModels = await callSvc(svc, { method: 'GET', url: '/v1/models' })
    assert.equal(disabledModels.status, 404)
    assert.equal(JSON.parse(disabledModels.bodyText).error.code, 'endpoint_disabled')

    const disabledSpeech = await callSvc(svc, {
      method: 'POST',
      url: '/v1/audio/speech',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ input: '你好' }),
    })
    assert.equal(disabledSpeech.status, 404)

    // 开启端点且不配独立 key -> 复用 auth.token
    store.update({ openaiServer: { enabled: true } })
    const token = store.config.auth.token

    const noAuth = await callSvc(svc, { method: 'GET', url: '/v1/models' })
    assert.equal(noAuth.status, 401)
    assert.equal(JSON.parse(noAuth.bodyText).error.code, 'invalid_api_key')

    const okLowerBearer = await callSvc(svc, {
      method: 'GET',
      url: '/v1/models',
      headers: { authorization: `bearer ${token}` },
    })
    assert.equal(okLowerBearer.status, 200)
    const modelsBody = JSON.parse(okLowerBearer.bodyText)
    assert.equal(modelsBody.object, 'list')
    const ids = modelsBody.data.map((m) => m.id)
    for (const id of ['audiobook-tts', 'tts-1', 'tts-1-hd', 'gpt-4o-mini-tts']) {
      assert.ok(ids.includes(id), `应包含模型 ${id}`)
    }

    // 配置独立 key 后，旧 auth.token 失效，x-api-key 与 Bearer 新 key 均有效
    const customKey = 'sk-test-custom-openai-srv-8888'
    store.update({ openaiServer: { apiKey: customKey } })

    const oldTokenFail = await callSvc(svc, {
      method: 'GET',
      url: '/v1/models',
      headers: { authorization: `Bearer ${token}` },
    })
    assert.equal(oldTokenFail.status, 401)

    const okCustomHeader = await callSvc(svc, {
      method: 'GET',
      url: '/v1/models',
      headers: { 'x-api-key': customKey },
    })
    assert.equal(okCustomHeader.status, 200)

    await svc.stop()
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('POST /v1/audio/speech 复用规则切分/缓存/计量，支持 wav/pcm/mp3回退与strict 400/角色映射', async () => {
  const dir = fresh()
  try {
    const store = new Store(dir)
    store.load({})
    store.update({
      auth: { enabled: false },
      upstream: { provider: 'mimo', keys: ['sk-test-mimo-key-0001'] },
      synth: { maxTextChars: 120 },
      textRules: {
        enabled: true,
        items: [{ id: 'r1', name: '清理PS', pattern: 'PS:.*$', replace: '', regex: true, flags: 'gm', scope: 'all', enabled: true }],
      },
      openaiServer: {
        enabled: true,
        apiKey: 'sk-test-oa-endpoint-9999',
        splitDialogue: true,
        mp3Fallback: 'wav',
      },
    })

    const svc = new TtsService({ store, log: () => {} })
    svc.listening = true

    const captured = []
    svc.mimo.synthesize = async (req) => {
      captured.push({ ...req })
      return encodeWav(Buffer.alloc(4800), 24000, 1, 16)
    }

    const authHeaders = {
      'content-type': 'application/json',
      authorization: 'Bearer sk-test-oa-endpoint-9999',
    }

    // 1) 完整管线：lexicon 清洗 + 引号切分旁白/对话 + 语速档位 + 真实时长 WAV + 计量
    const resWav = await callSvc(svc, {
      method: 'POST',
      url: '/v1/audio/speech',
      headers: authHeaders,
      body: JSON.stringify({
        model: 'audiobook-tts',
        input: '他推开门说：“你终于来了。”\nPS:作者的话',
        voice: 'alloy',
        response_format: 'wav',
        speed: 1.4,
      }),
    })
    assert.equal(resWav.status, 200)
    assert.equal(resWav.headers['Content-Type'], 'audio/wav')
    assert.equal(Number(resWav.headers['Content-Length']), resWav.bodyBuffer.length)
    assert.equal(resWav.headers['X-Audiobook-Source'], 'mimo')
    assert.equal(resWav.headers['X-Audiobook-Segments'], '2')
    assert.ok(Number(resWav.headers['X-Audiobook-Duration-S']) > 0.15)
    assert.equal(parseWav(resWav.bodyBuffer).sampleRate, 24000)
    assert.equal(captured.length, 2)
    assert.equal(captured[0].voice, '冰糖')
    assert.equal(captured[1].voice, '苏打')
    assert.match(captured[0].style, /语速偏快/)
    assert.ok(!captured.some((c) => c.text.includes('作者的话')), '应先经过 lexicon 全局规则过滤')

    const snap1 = svc.metrics.snapshot()
    assert.equal(snap1.totals.requests, 1)
    assert.equal(snap1.recent.at(-1).format, 'openai-wav')

    // 2) 再次请求同样内容命中缓存
    const beforeHits = captured.length
    const resCached = await callSvc(svc, {
      method: 'POST',
      url: '/v1/audio/speech',
      headers: authHeaders,
      body: JSON.stringify({
        model: 'audiobook-tts',
        input: '他推开门说：“你终于来了。”\nPS:作者的话',
        voice: 'alloy',
        response_format: 'wav',
        speed: 1.4,
      }),
    })
    assert.equal(resCached.status, 200)
    assert.equal(captured.length, beforeHits)

    // 3) response_format: 'pcm' 输出裸 PCM 且计量 format 为 openai-pcm
    const resPcm = await callSvc(svc, {
      method: 'POST',
      url: '/v1/audio/speech',
      headers: authHeaders,
      body: JSON.stringify({
        input: '“只有对话。”',
        voice: 'echo',
        response_format: 'pcm',
        speed: 0.8,
      }),
    })
    assert.equal(resPcm.status, 200)
    assert.equal(resPcm.headers['Content-Type'], 'audio/pcm')
    assert.notEqual(resPcm.bodyBuffer.toString('ascii', 0, 4), 'RIFF')
    assert.equal(resPcm.bodyBuffer.length, 4800)
    assert.equal(svc.metrics.snapshot().recent.at(-1).format, 'openai-pcm')
    assert.match(captured.at(-1).style, /语速偏慢/)

    // 4) mp3 默认兼容回退 WAV，并附 X-Audiobook-Format-Fallback: wav
    const resMp3Fallback = await callSvc(svc, {
      method: 'POST',
      url: '/v1/audio/speech',
      headers: authHeaders,
      body: JSON.stringify({ input: '兼容回退。', voice: 'shimmer', response_format: 'mp3' }),
    })
    assert.equal(resMp3Fallback.status, 200)
    assert.equal(resMp3Fallback.headers['Content-Type'], 'audio/wav')
    assert.equal(resMp3Fallback.headers['X-Audiobook-Format-Fallback'], 'wav')
    assert.equal(captured.at(-1).voice, '冰糖')

    // 5) mp3 strict 模式返回 400
    store.update({ openaiServer: { mp3Fallback: 'strict' } })
    const resMp3Strict = await callSvc(svc, {
      method: 'POST',
      url: '/v1/audio/speech',
      headers: authHeaders,
      body: JSON.stringify({ input: '严格报错。', response_format: 'mp3' }),
    })
    assert.equal(resMp3Strict.status, 400)
    assert.equal(JSON.parse(resMp3Strict.bodyText).error.code, 'unsupported_format')

    // 6) 超长文本 413 与空文本 400
    const resTooLong = await callSvc(svc, {
      method: 'POST',
      url: '/v1/audio/speech',
      headers: authHeaders,
      body: JSON.stringify({ input: '字'.repeat(150) }),
    })
    assert.equal(resTooLong.status, 413)

    const resEmpty = await callSvc(svc, {
      method: 'POST',
      url: '/v1/audio/speech',
      headers: authHeaders,
      body: JSON.stringify({ input: '   ' }),
    })
    assert.equal(resEmpty.status, 400)

    // 7) 透传 PRESET_VOICES、refsStore 参考音克隆、未知音色回退 auto
    const resPreset = await callSvc(svc, {
      method: 'POST',
      url: '/v1/audio/speech',
      headers: authHeaders,
      body: JSON.stringify({ input: '直接指定预置音色。', voice: '茉莉' }),
    })
    assert.equal(resPreset.status, 200)
    assert.equal(captured.at(-1).voice, '茉莉')
    assert.equal(captured.at(-1).mode, 'preset')

    const resRef = await callSvc(svc, {
      method: 'POST',
      url: '/v1/audio/speech',
      headers: authHeaders,
      body: JSON.stringify({ input: '直接指定参考音克隆。', voice: 'builtin:narrator-14s' }),
    })
    assert.equal(resRef.status, 200)
    assert.equal(captured.at(-1).mode, 'clone')
    assert.ok(captured.at(-1).voice.startsWith('data:audio/'))

    const resUnknown = await callSvc(svc, {
      method: 'POST',
      url: '/v1/audio/speech',
      headers: authHeaders,
      body: JSON.stringify({ input: '未知音色回退：“你好。”', voice: 'nonexistent-voice' }),
    })
    assert.equal(resUnknown.status, 200)
    assert.equal(captured.at(-2).voice, '冰糖')
    assert.equal(captured.at(-1).voice, '苏打')

    // 8) splitDialogue = false 时全部走旁白音色
    store.update({ openaiServer: { splitDialogue: false } })
    const resNoSplit = await callSvc(svc, {
      method: 'POST',
      url: '/v1/audio/speech',
      headers: authHeaders,
      body: JSON.stringify({ input: '“不切分对话。”', voice: 'alloy' }),
    })
    assert.equal(resNoSplit.status, 200)
    assert.equal(captured.at(-1).voice, '冰糖')

    await svc.stop()
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('底层为 OpenAI Provider 时透传自定义 voice 与 speed 且正确隔离缓存键', async () => {
  const dir = fresh('mimo-oa-pass-')
  const prevFetch = globalThis.fetch
  const upstreamCalls = []
  globalThis.fetch = async (_url, init = {}) => {
    const body = JSON.parse(String(init.body || '{}'))
    upstreamCalls.push(body)
    return new Response(encodeWav(Buffer.alloc(4800), 24000, 1, 16), { status: 200 })
  }
  let svc
  try {
    const store = new Store(dir)
    store.load({})
    store.update({
      auth: { enabled: false },
      upstream: {
        provider: 'openai',
        openai: {
          baseUrl: 'http://127.0.0.1:8880/v1',
          model: 'kokoro',
          narratorVoice: 'zf_xiaoxiao',
          dialogueVoice: 'zm_yunjian',
          speed: 1.0,
        },
      },
      openaiServer: { enabled: true, apiKey: 'sk-test-oa-pass-7777' },
    })
    svc = new TtsService({ store, log: () => {} })
    svc.listening = true

    const headers = {
      'content-type': 'application/json',
      authorization: 'Bearer sk-test-oa-pass-7777',
    }
    const r1 = await callSvc(svc, {
      method: 'POST',
      url: '/v1/audio/speech',
      headers,
      body: JSON.stringify({ input: '自定义音色测试。', voice: 'af_sky', speed: 1.25 }),
    })
    assert.equal(r1.status, 200)
    assert.equal(upstreamCalls.length, 1)
    assert.equal(upstreamCalls[0].voice, 'af_sky')
    assert.equal(upstreamCalls[0].speed, 1.25)

    // 同文本同音色不同 speed 不命中旧缓存
    const r2 = await callSvc(svc, {
      method: 'POST',
      url: '/v1/audio/speech',
      headers,
      body: JSON.stringify({ input: '自定义音色测试。', voice: 'af_sky', speed: 0.9 }),
    })
    assert.equal(r2.status, 200)
    assert.equal(upstreamCalls.length, 2)
    assert.equal(upstreamCalls[1].speed, 0.9)

    // 上游为 OpenAI Provider 时，与 MiMo 预置同名的英文音色（如 Mia）也应原样透传
    const r3 = await callSvc(svc, {
      method: 'POST',
      url: '/v1/audio/speech',
      headers,
      body: JSON.stringify({ input: '同名音色透传测试。', voice: 'Mia' }),
    })
    assert.equal(r3.status, 200)
    assert.equal(upstreamCalls.length, 3)
    assert.equal(upstreamCalls[2].voice, 'Mia')
  } finally {
    globalThis.fetch = prevFetch
    await svc?.stop().catch(() => {})
    rmSync(dir, { recursive: true, force: true })
  }
})
