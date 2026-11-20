import test from 'node:test'
import assert from 'node:assert/strict'
import { EventEmitter } from 'node:events'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Store } from '../src/config.mjs'
import { TtsService } from '../src/service.mjs'
import { encodeWav } from '../src/wav.mjs'

const fresh = (p = 'mimo-gate-') => mkdtempSync(join(tmpdir(), p))

function makeReq(url) {
  const req = new EventEmitter()
  req.method = 'GET'
  req.url = url
  req.headers = { host: '127.0.0.1:8291' }
  req.socket = { remoteAddress: '127.0.0.1' }
  req.destroy = () => {}
  queueMicrotask(() => req.emit('end'))
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
    get bodyText() { return Buffer.concat(chunks).toString('utf8') },
  }
}

test('Issue #10: 本地引擎不受 limits.rpm 限流，N > rpm 段连续合成无等待', async () => {
  const dir = fresh()
  let svc
  try {
    const refWav = join(dir, 'narr.wav')
    writeFileSync(refWav, encodeWav(Buffer.alloc(2400), 24000, 1, 16))
    const store = new Store(dir)
    store.load({})
    store.update({
      auth: { enabled: false },
      limits: { rpm: 1 },
      cache: { enabled: false },
      upstream: {
        provider: 'local',
        local: {
          pythonPath: '/opt/venv/bin/python',
          modelPath: '/models/qwen3',
          refs: { narrator: { wav: refWav, text: '测试旁白' } },
        },
      },
    })

    svc = new TtsService({ store, log: () => {} })
    const sample = encodeWav(Buffer.alloc(2400), 24000, 1, 16)
    svc.local.synthesize = async () => sample

    const reqs = Array.from({ length: 5 }, (_, i) => ({
      text: `第 ${i + 1} 段本地合成。`,
      role: 'narrator',
    }))
    const started = Date.now()
    const out = await svc.synthesize(reqs)
    const elapsed = Date.now() - started

    assert.equal(out.source, 'local')
    assert.ok(elapsed < 500, `本地引擎不应受 rpm=1 等待 60s，实际耗时 ${elapsed}ms`)
    assert.equal(svc.activeGate().usage().unlimited, true)
    assert.equal(svc.rpmUsageByProvider().local.used, 5)
    assert.equal(svc.rpmUsageByProvider().mimo.used, 0)
  } finally {
    await svc?.stop().catch(() => {})
    rmSync(dir, { recursive: true, force: true })
  }
})

test('Issue #10: 混合模式下云端吃满 RPM 时，本地与 OpenAI 各自隔离不受阻塞', async () => {
  const dir = fresh()
  let svc
  try {
    const refWav = join(dir, 'narr.wav')
    writeFileSync(refWav, encodeWav(Buffer.alloc(2400), 24000, 1, 16))
    const store = new Store(dir)
    store.load({})
    store.update({
      auth: { enabled: false },
      limits: { rpm: 1 },
      cache: { enabled: false },
      upstream: {
        provider: 'hybrid',
        keys: ['sk-test-hybrid-123456'],
        local: {
          pythonPath: '/opt/venv/bin/python',
          modelPath: '/models/qwen3',
          refs: { narrator: { wav: refWav, text: '测试旁白' } },
        },
        hybrid: { maxCloudBootstrap: 4, cloudConcurrency: 2, targetRms: 0, warmup: false },
      },
    })

    svc = new TtsService({ store, log: () => {} })
    const sample = encodeWav(Buffer.alloc(2400), 24000, 1, 16)
    svc.mimo.synthesize = async () => sample
    svc.local.synthesize = async () => sample

    // 1) 云端耗尽 rpm=1 配额
    const rCloud = await svc.synthesize([{ text: '冷启动第一句。', role: 'narrator' }], { clientKey: 'd1', started: Date.now() })
    assert.equal(rCloud.source, 'hybrid-cloud')
    assert.equal(svc.rpmUsageByProvider().mimo.used, 1)
    assert.equal(svc.rpmUsageByProvider().openai.used, 0)

    // 2) 本地已热后立即合成 3 段，绝不能因为 mimo gate 满而卡住
    svc.local.state = 'ready'
    svc.local.warm = true
    const t0 = Date.now()
    const rLocal = await svc.synthesize(
      [
        { text: '第一章 本地第一句。', role: 'narrator' },
        { text: '第二句。', role: 'narrator' },
        { text: '第三句。', role: 'narrator' },
      ],
      { clientKey: 'd1', started: Date.now() },
    )
    const elapsed = Date.now() - t0
    assert.equal(rLocal.source, 'hybrid-local')
    assert.ok(elapsed < 500, `云端吃满时切本地应立即完成，实际耗时 ${elapsed}ms`)
    assert.equal(svc.rpmUsageByProvider().local.used, 3)

    // 3) /api/live 返回分引擎 rpmByProvider
    const liveRes = makeRes()
    await svc.handle(makeReq('/api/live'), liveRes)
    assert.equal(liveRes.status, 200)
    const liveJson = JSON.parse(liveRes.bodyText)
    assert.equal(liveJson.rpm.used, 1)
    assert.equal(liveJson.rpmByProvider.mimo.used, 1)
    assert.equal(liveJson.rpmByProvider.local.used, 3)
    assert.equal(liveJson.rpmByProvider.local.unlimited, true)
    assert.equal(liveJson.rpmByProvider.openai.used, 0)
  } finally {
    await svc?.stop().catch(() => {})
    rmSync(dir, { recursive: true, force: true })
  }
})
