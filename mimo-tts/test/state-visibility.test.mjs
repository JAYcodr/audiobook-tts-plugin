/**
 * Issue #26 / #21 / #17 的后端回归：
 * 状态读数看得见、按令牌记账不被伪造客户端标识带偏、参考音变更后回收旧缓存。
 * 前端黄条、交付页展示属于 UI 设计，本测试只断言接口字段。
 */
import test from 'node:test'
import assert from 'node:assert/strict'
import { EventEmitter } from 'node:events'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Store } from '../src/config.mjs'
import { Metrics } from '../src/metrics.mjs'
import { TtsService } from '../src/service.mjs'
import { invalidateIfRefUsed } from '../src/control-api.mjs'

const fresh = () => mkdtempSync(join(tmpdir(), 'mimo-state-'))

function makeReq({ method = 'GET', url = '/', body = '' }) {
  const req = new EventEmitter()
  req.method = method
  req.url = url
  req.headers = { host: '127.0.0.1:8291' }
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
    writeHead(s, h = {}) { this.status = s; this.headers = h },
    write(b) { if (b) chunks.push(Buffer.from(b)) },
    end(b) { if (b) chunks.push(Buffer.from(b)) },
    get bodyText() { return Buffer.concat(chunks).toString('utf8') },
  }
}

test('按令牌聚合今日用量，伪造 client 标识不能把账记到别人头上', () => {
  const m = new Metrics({ ringSize: 50 })
  m.record({ tokenId: 'tok-a', tokenLabel: '平板', client: 'device-1', chars: 10, segments: 1 })
  m.record({ tokenId: 'tok-a', tokenLabel: '平板', client: 'device-1', chars: 10, segments: 1 })
  m.record({ tokenId: 'tok-b', tokenLabel: '朋友的手机', client: 'device-1', chars: 5, segments: 1 })

  const snap = m.snapshot()
  const a = snap.byToken.find((t) => t.tokenId === 'tok-a')
  const b = snap.byToken.find((t) => t.tokenId === 'tok-b')
  assert.equal(a.chars, 20)
  assert.equal(a.requests, 2)
  assert.equal(a.label, '平板')
  assert.equal(b.chars, 5)
  assert.equal(b.requests, 1)
  assert.equal(snap.byToken.length, 2)
})

test('令牌聚合单独封顶 20 条，不会挤掉按客户端的历史', () => {
  const m = new Metrics({ ringSize: 50 })
  for (let i = 0; i < 25; i++) {
    m.record({ tokenId: 'tok-' + i, client: 'client-' + i, chars: 1 })
  }
  assert.equal(m.snapshot().byToken.length, 20)
  assert.equal(m.snapshot().clients.length, 6)
})

test('令牌聚合随统计文件持久化并在 reset 后清空', () => {
  const dir = fresh()
  try {
    const file = join(dir, 'metrics.json')
    const m = new Metrics({ filePath: file, flushDebounceMs: 0 })
    m.record({ tokenId: 'tok-a', chars: 7 })
    const restored = new Metrics({ filePath: file }).load()
    assert.equal(restored.snapshot().byToken.find((t) => t.tokenId === 'tok-a').chars, 7)
    restored.reset()
    assert.equal(restored.snapshot().byToken.length, 0)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('GET /api/state 暴露回退、ffmpeg 与 sidecar 版本读数', async () => {
  const dir = fresh()
  try {
    const st = new Store(dir)
    st.load({})
    st.update({ auth: { enabled: false } })
    const svc = new TtsService({ store: st, log: () => {} })
    const res = makeRes()
    await svc.handle(makeReq({ url: '/api/state' }), res)
    assert.equal(res.status, 200)
    const state = JSON.parse(res.bodyText)
    assert.equal(state.audioFallback, null)
    assert.equal(typeof state.ffmpegAvailable, 'boolean')
    assert.equal(typeof state.local.mlxCacheMb === 'number' || state.local.mlxCacheMb === null, true)
    assert.ok('sidecarVersion' in state.local)
    assert.equal(state.local.sidecarVersionMismatch, false)
    assert.ok(Array.isArray(state.live.byToken))
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('参考音变更后回收音频缓存条目', async () => {
  const dir = fresh()
  try {
    const st = new Store(dir)
    st.load({})
    st.update({ auth: { enabled: false } })
    const svc = new TtsService({ store: st, log: () => {} })
    svc.cache.set('old-ref-a', Buffer.from('wav-a'))
    svc.cache.set('old-ref-b', Buffer.from('wav-b'))
    assert.equal(svc.cache.stats().entries, 2)
    await invalidateIfRefUsed(svc, 'builtin:narrator-14s')
    assert.equal(svc.cache.stats().entries, 0)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})
