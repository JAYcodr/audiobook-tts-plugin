import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Store } from '../src/config.mjs'
import { TtsService } from '../src/service.mjs'
import { encodeWav } from '../src/wav.mjs'

const fresh = (p = 'mimo-res-') => mkdtempSync(join(tmpdir(), p))

test('Issue #4: 预热保活窗口期内不卸载模型；过期且空闲后才触发卸载', async () => {
  const dir = fresh()
  let svc
  try {
    const store = new Store(dir)
    store.load({})
    store.update({
      auth: { enabled: false },
      upstream: {
        provider: 'local',
        local: {
          pythonPath: '/opt/venv/bin/python',
          modelPath: '/models/qwen',
          idleUnloadSeconds: 60,
          warmupWindowSeconds: 600,
          refs: { narrator: { wav: '/tmp/a.wav', text: '测试' } },
        },
      },
    })
    svc = new TtsService({ store, log: () => {} })
    const eng = svc.local
    const stopReasons = []
    eng.stop = async (reason) => {
      stopReasons.push(reason)
      eng.state = 'stopped'
      return eng.status()
    }
    eng.state = 'ready'
    eng.warm = true
    const t0 = 1_700_000_000_000
    eng.warmStartedAt = t0
    eng.lastUsed = t0

    // 空闲 120s (> idleUnloadSeconds=60s)，但仍在 600s 预热保活窗口内 -> 不卸载
    const unloadedInsideWindow = await eng.checkIdleUnload(t0 + 120_000)
    assert.equal(unloadedInsideWindow, false)
    assert.equal(eng.state, 'ready')
    assert.deepEqual(stopReasons, [])

    // 超过 600s 预热保活窗口且已空闲 > 60s -> 触发空闲卸载
    const unloadedAfterWindow = await eng.checkIdleUnload(t0 + 601_000)
    assert.equal(unloadedAfterWindow, true)
    assert.deepEqual(stopReasons, ['idle'])
  } finally {
    await svc?.stop().catch(() => {})
    rmSync(dir, { recursive: true, force: true })
  }
})

test('Issue #4: 常驻模式（idleUnloadSeconds=0）永不空闲卸载，切换策略不重载已热模型', async () => {
  const dir = fresh()
  let svc
  try {
    const store = new Store(dir)
    store.load({})
    store.update({
      auth: { enabled: false },
      upstream: {
        provider: 'local',
        local: {
          pythonPath: '/opt/venv/bin/python',
          modelPath: '/models/qwen',
          idleUnloadSeconds: 0,
          warmupWindowSeconds: 900,
          refs: { narrator: { wav: '/tmp/a.wav', text: '测试' } },
        },
      },
    })
    svc = new TtsService({ store, log: () => {} })
    const eng = svc.local
    let invalidated = 0
    let policySynced = 0
    eng.invalidate = async () => { invalidated++ }
    eng.syncIdlePolicy = async () => { policySynced++; return true }
    eng.state = 'ready'
    eng.warm = true
    const t0 = 1_700_000_000_000
    eng.warmStartedAt = t0
    eng.lastUsed = t0

    assert.equal(eng.status().mode, 'resident')
    const unloaded = await eng.checkIdleUnload(t0 + 86_400_000)
    assert.equal(unloaded, false)
    assert.equal(eng.state, 'ready')

    // 热切换回省内存策略：只同步策略，绝不调用 invalidate() 重载 2GB 模型
    const patchRes = await svc.applyPatch({ upstream: { local: { idleUnloadSeconds: 1800 } } })
    assert.deepEqual(patchRes.problems, [])
    assert.equal(invalidated, 0)
    assert.equal(policySynced, 1)
    assert.equal(eng.status().mode, 'powersave')
  } finally {
    await svc?.stop().catch(() => {})
    rmSync(dir, { recursive: true, force: true })
  }
})

test('Issue #14: 每次合成成功都顺延预热保活窗口', async () => {
  const dir = fresh()
  let svc
  const prevFetch = globalThis.fetch
  try {
    const store = new Store(dir)
    store.load({})
    store.update({
      auth: { enabled: false },
      upstream: {
        provider: 'local',
        local: {
          pythonPath: '/opt/venv/bin/python',
          modelPath: '/models/qwen',
          idleUnloadSeconds: 300,
          warmupWindowSeconds: 3600,
          refs: { narrator: { wav: '/tmp/a.wav', text: '测试' } },
        },
      },
    })
    svc = new TtsService({ store, log: () => {} })
    const eng = svc.local
    const wav = encodeWav(Buffer.alloc(2400), 24000, 1, 16)
    eng.state = 'ready'
    eng.ensureStarted = async () => {}
    eng.stop = async (reason) => {
      eng.state = 'stopped'
      eng.lastStopReason = reason
      return eng.status()
    }
    globalThis.fetch = async () => ({
      ok: true,
      arrayBuffer: async () => wav.buffer.slice(wav.byteOffset, wav.byteOffset + wav.length),
    })

    await eng.synthesize({ text: '第一段。', role: 'narrator' })
    const t1 = eng.warmStartedAt
    assert.ok(t1 > 0, '首次合成后应记录保活起点')

    await new Promise((r) => setTimeout(r, 5))
    await eng.synthesize({ text: '第二段。', role: 'narrator' })
    const t2 = eng.warmStartedAt
    assert.ok(t2 > t1, `第二次合成后保活窗口应重新起算，实际 t1=${t1} t2=${t2}`)

    // 窗口按最近一次合成起算：55 分钟仍热，65 分钟（且空闲 > idle）才卸载
    assert.equal(await eng.checkIdleUnload(t2 + 55 * 60_000), false)
    assert.equal(eng.state, 'ready')
    assert.equal(await eng.checkIdleUnload(t2 + 65 * 60_000), true)
    assert.equal(eng.state, 'stopped')
  } finally {
    globalThis.fetch = prevFetch
    await svc?.stop().catch(() => {})
    rmSync(dir, { recursive: true, force: true })
  }
})
