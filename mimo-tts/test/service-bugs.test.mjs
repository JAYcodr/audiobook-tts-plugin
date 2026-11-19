import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { createServer } from 'node:net'
import { EventEmitter } from 'node:events'
import { Store, maskKey } from '../src/config.mjs'
import { TtsService } from '../src/service.mjs'
import { validateModelDir, LocalError } from '../src/local.mjs'
import { encodeWav } from '../src/wav.mjs'
import { apply } from '../index.js'

function pickFreePort() {
  return new Promise((resolve, reject) => {
    const srv = createServer()
    srv.once('error', reject)
    srv.listen(0, '127.0.0.1', () => {
      const { port } = srv.address()
      srv.close(() => resolve(port))
    })
  })
}

const fresh = (prefix = 'mimo-svc-') => mkdtempSync(join(tmpdir(), prefix))

function makeSampleWav() {
  return encodeWav(Buffer.alloc(2400), 24000, 1, 16)
}

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

test('独立模式 POST /api/preview 正常返回 WAV 与 X-Mimo-Source 头（不报 ReferenceError）', async () => {
  const dir = fresh()
  try {
    const store = new Store(dir)
    store.load({})
    store.update({ auth: { enabled: false }, upstream: { keys: ['sk-test-1234567890'] } })
    const svc = new TtsService({ store, log: () => {} })
    const sample = makeSampleWav()
    svc.mimo.synthesize = async () => sample

    const req = makeFakeReq({
      method: 'POST',
      url: '/api/preview',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text: '山道上起了雾。', role: 'narrator' }),
    })
    const res = makeFakeRes()
    await svc.handle(req, res)
    assert.equal(res.status, 200)
    assert.equal(res.headers['Content-Type'], 'audio/wav')
    assert.equal(res.headers['X-Mimo-Source'], 'mimo')
    assert.ok(Number(res.headers['X-Mimo-Duration-S']) > 0)
    assert.equal(res.bodyBuffer.toString('ascii', 0, 4), 'RIFF')
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('独立模式 PUT /api/config 混合掩码 Key 与新 Key 时保留旧真值', async () => {
  const dir = fresh()
  try {
    const store = new Store(dir)
    store.load({})
    const oldKey = 'sk-existing-00001111'
    const newKey = 'sk-appended-22223333'
    store.update({ auth: { enabled: false }, upstream: { keys: [oldKey] } })
    const svc = new TtsService({ store, log: () => {} })

    const req = makeFakeReq({
      method: 'PUT',
      url: '/api/config',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ upstream: { keys: [maskKey(oldKey), newKey] } }),
    })
    const res = makeFakeRes()
    await svc.handle(req, res)
    assert.equal(res.status, 200)
    assert.deepEqual(store.config.upstream.keys, [oldKey, newKey])
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('宿主路由 /mimo-tts/api/validate 使用深合并校验局部补丁', async () => {
  const dshHome = fresh('mimo-dsh-')
  const prevHome = process.env.DSH_HOME
  process.env.DSH_HOME = dshHome
  const freePort = await pickFreePort()
  const pluginDataDir = join(dshHome, 'plugin-data', 'mimo-tts')
  mkdirSync(pluginDataDir, { recursive: true })
  writeFileSync(join(pluginDataDir, 'config.json'), JSON.stringify({
    server: { host: '127.0.0.1', port: freePort },
    auth: { enabled: false },
  }))
  const routes = {}
  const cleanups = []
  try {
    const ctx = {
      effect(fn) {
        const c = fn()
        if (typeof c === 'function') cleanups.push(c)
      },
      inject(_deps, cb) {
        cb({
          effect(fn) {
            const c = fn()
            if (typeof c === 'function') cleanups.push(c)
          },
          webServer: {
            register({ path, handler }) {
              routes[path] = handler
              return () => {}
            },
          },
        })
      },
    }
    apply(ctx)
    const registeredHandler = routes['/mimo-tts']
    const aliasHandler = routes['/audiobook-tts']
    assert.equal(typeof registeredHandler, 'function')
    assert.equal(typeof aliasHandler, 'function')

    const stateRes = makeFakeRes()
    await aliasHandler(makeFakeReq({ method: 'GET', url: '/audiobook-tts/api/state' }), stateRes)
    assert.equal(stateRes.status, 200)
    assert.ok(JSON.parse(stateRes.bodyText).service)

    const req = makeFakeReq({
      method: 'POST',
      url: '/mimo-tts/api/validate',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ upstream: { model: 'mimo-v2.5-tts' }, server: { port: 8299 } }),
    })
    const res = makeFakeRes()
    await registeredHandler(req, res)
    assert.equal(res.status, 200)
    const body = JSON.parse(res.bodyText)
    assert.deepEqual(body.problems, [])

    const badReq = makeFakeReq({
      method: 'POST',
      url: '/mimo-tts/api/validate',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ upstream: { provider: 'local' } }),
    })
    const badRes = makeFakeRes()
    await registeredHandler(badReq, badRes)
    assert.equal(badRes.status, 200)
    const badBody = JSON.parse(badRes.bodyText)
    assert.ok(badBody.problems.some((p) => p.includes('pythonPath')))
  } finally {
    await new Promise((r) => setTimeout(r, 30))
    for (const c of cleanups) {
      try { await c() } catch { /* ignore */ }
    }
    if (prevHome === undefined) delete process.env.DSH_HOME
    else process.env.DSH_HOME = prevHome
    rmSync(dshHome, { recursive: true, force: true })
  }
})

test('validateModelDir 运行时拦截缺失或截断的声码器权重 speech_tokenizer/model.safetensors', () => {
  const modelDir = fresh('mimo-model-')
  try {
    assert.throws(
      () => validateModelDir(join(modelDir, 'missing')),
      (err) => err instanceof LocalError && err.code === 'missing_model',
    )

    writeFileSync(join(modelDir, 'config.json'), '{}')
    assert.throws(
      () => validateModelDir(modelDir),
      (err) => err instanceof LocalError && err.code === 'missing_vocoder',
    )

    mkdirSync(join(modelDir, 'speech_tokenizer'), { recursive: true })
    writeFileSync(join(modelDir, 'speech_tokenizer', 'model.safetensors'), 'too-small')
    assert.throws(
      () => validateModelDir(modelDir),
      (err) => err instanceof LocalError && err.code === 'corrupt_vocoder',
    )

    writeFileSync(join(modelDir, 'model.safetensors'), 'small-main')
    assert.throws(
      () => validateModelDir(modelDir, { minVocoderBytes: 5, minModelBytes: 100 }),
      (err) => err instanceof LocalError && err.code === 'corrupt_model',
    )

    assert.doesNotThrow(() => validateModelDir(modelDir, { minVocoderBytes: 5, minModelBytes: 5 }))
  } finally {
    rmSync(modelDir, { recursive: true, force: true })
  }
})
