import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, mkdirSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { homedir, tmpdir } from 'node:os'
import { join } from 'node:path'
import { Metrics } from '../src/metrics.mjs'
import { expandHomePath } from '../src/paths.mjs'
import { Store } from '../src/config.mjs'
import { TtsService } from '../src/service.mjs'
import { validateModelDir } from '../src/local.mjs'

const fresh = (prefix = 'mimo-met-') => mkdtempSync(join(tmpdir(), prefix))

test('expandHomePath 正确展开 ~ 家目录路径，不影响常规路径', () => {
  const home = homedir()
  assert.equal(expandHomePath(''), '')
  assert.equal(expandHomePath('~'), home)
  assert.equal(expandHomePath('~/models/qwen'), join(home, 'models/qwen'))
  assert.equal(expandHomePath('~\\models\\qwen'), join(home, 'models\\qwen'))
  assert.equal(expandHomePath('/opt/models/qwen'), '/opt/models/qwen')
})

test('validateModelDir 支持 ~ 相对家目录路径展开', () => {
  const home = homedir()
  const subName = `.tmp-mimo-home-check-${process.pid}-${Date.now()}`
  const dir = join(home, subName)
  try {
    mkdirSync(join(dir, 'speech_tokenizer'), { recursive: true })
    writeFileSync(join(dir, 'config.json'), '{}')
    writeFileSync(join(dir, 'speech_tokenizer', 'model.safetensors'), '123456')
    writeFileSync(join(dir, 'model.safetensors'), '123456')
    assert.doesNotThrow(() => validateModelDir(`~/${subName}`, { minVocoderBytes: 4, minModelBytes: 4 }))
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('Metrics 记录并原子落盘，重启后 totals / days / clients / recent 完整恢复', () => {
  const dir = fresh()
  const filePath = join(dir, 'metrics.json')
  try {
    const a = new Metrics({ ringSize: 50, filePath, flushDebounceMs: 10000 })
    a.record({
      chars: 42,
      segments: 2,
      bytes: 9600,
      audioSeconds: 5.5,
      latencyMs: 650,
      cacheHit: false,
      client: 'abc@192.168.1.2',
      role: 'narrator',
      text: '测试持久化记录。',
      source: 'mimo',
    })
    assert.equal(a.flush(), true)
    assert.ok(existsSync(filePath))
    assert.ok(existsSync(`${filePath}.bak`))

    const b = new Metrics({ ringSize: 50, filePath }).load()
    const snap = b.snapshot()
    assert.equal(snap.totals.requests, 1)
    assert.equal(snap.totals.chars, 42)
    assert.equal(snap.totals.segments, 2)
    assert.equal(snap.days.length, 1)
    assert.equal(snap.clients.length, 1)
    assert.equal(snap.recent.length, 1)
    assert.equal(snap.recent[0].text, '测试持久化记录。')
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('Metrics 主文件丢失或损坏时自动从 .bak 恢复，坏文件改名保留', () => {
  const dir = fresh()
  const filePath = join(dir, 'metrics.json')
  try {
    const a = new Metrics({ filePath, flushDebounceMs: 0 })
    a.record({ chars: 10, segments: 1, bytes: 100, audioSeconds: 1.2, latencyMs: 100, client: 'c1@127.0.0.1' })

    // 1) 主文件被删除 → 从 .bak 恢复
    rmSync(filePath)
    const b = new Metrics({ filePath }).load()
    assert.equal(b.snapshot().totals.requests, 1)

    // 2) 主文件写坏 → 改名保留 .broken-* 且从 .bak 恢复
    writeFileSync(filePath, '{corrupted json')
    const logs = []
    const c = new Metrics({ filePath, log: (l) => logs.push(l) }).load()
    assert.equal(c.snapshot().totals.requests, 1)
    assert.ok(logs.some((l) => l.includes('恢复')))
    assert.ok(readdirSync(dir).some((n) => n.startsWith('metrics.json.broken-')))

    // 3) reset() 清空并落盘
    c.reset()
    const d = new Metrics({ filePath }).load()
    assert.equal(d.snapshot().totals.requests, 0)
    assert.equal(d.snapshot().days.length, 0)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('TtsService stop() 强制刷新持久化 metrics.json', async () => {
  const dir = fresh()
  try {
    const store = new Store(dir)
    store.load({})
    const svc = new TtsService({ store, log: () => {} })
    svc.metrics.record({ chars: 88, segments: 3, bytes: 4000, audioSeconds: 3.1, latencyMs: 420 })
    await svc.stop()

    const loaded = new Metrics({ filePath: join(dir, 'metrics.json') }).load()
    assert.equal(loaded.snapshot().totals.chars, 88)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})
