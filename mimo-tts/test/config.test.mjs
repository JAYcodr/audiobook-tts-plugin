import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, writeFileSync, readFileSync, rmSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { Store, DEFAULTS } from '../src/config.mjs'

const fresh = () => mkdtempSync(join(tmpdir(), 'mimo-cfg-'))

test('首次运行生成令牌并落盘', () => {
  const dir = fresh()
  try {
    const store = new Store(dir)
    const cfg = store.load({})
    assert.ok(cfg.auth.token)
    assert.deepEqual(cfg.server, DEFAULTS.server)
    assert.ok(existsSync(join(dir, 'config.json')))
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('保存后重新加载，自定义值与密钥都在', () => {
  const dir = fresh()
  try {
    const a = new Store(dir)
    a.load({})
    a.update({ server: { port: 8297 }, upstream: { keys: ['sk-test-1234567890'] } })
    const b = new Store(dir)
    const cfg = b.load({})
    assert.equal(cfg.server.port, 8297)
    assert.deepEqual(cfg.upstream.keys, ['sk-test-1234567890'])
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('主配置被删时用备份恢复，不回到默认值', () => {
  const dir = fresh()
  try {
    const a = new Store(dir)
    a.load({})
    a.update({ server: { port: 8301 }, upstream: { keys: ['sk-keep-me-000000'] } })
    rmSync(join(dir, 'config.json'))
    const logs = []
    const b = new Store(dir)
    b.log = (line) => logs.push(line)
    const cfg = b.load({})
    assert.equal(cfg.server.port, 8301, '备份应把端口带回来')
    assert.deepEqual(cfg.upstream.keys, ['sk-keep-me-000000'])
    assert.ok(logs.some((l) => l.includes('恢复')), '应记录恢复日志')
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('坏 JSON 不阻断启动，坏文件被改名保留', () => {
  const dir = fresh()
  try {
    writeFileSync(join(dir, 'config.json'), '{ this is not json')
    const store = new Store(dir)
    const cfg = store.load({})
    assert.ok(cfg.auth.token)
    const broken = readFileSync(join(dir, 'config.json'), 'utf8')
    assert.ok(broken.length > 0, '新配置已写回')
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('非法补丁被拒绝，原配置不变', () => {
  const dir = fresh()
  try {
    const store = new Store(dir)
    store.load({})
    const before = store.config.server.port
    const r = store.update({ server: { port: 99999 } })
    assert.ok(r.problems.length > 0)
    assert.equal(store.config.server.port, before)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('默认上游是 MiMo 云，本地引擎字段齐全但不启用', () => {
  const dir = fresh()
  try {
    const store = new Store(dir)
    const cfg = store.load({})
    assert.equal(cfg.upstream.provider, 'mimo')
    assert.equal(cfg.upstream.local.port, 8398)
    assert.equal(cfg.upstream.local.idleUnloadSeconds, 300)
    assert.deepEqual(cfg.upstream.local.refs.narrator, { wav: '', text: '' })
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('切到本地但缺 Python/模型/参考音时被拒绝', () => {
  const dir = fresh()
  try {
    const store = new Store(dir)
    store.load({})
    const r = store.update({ upstream: { provider: 'local' } })
    assert.ok(r.problems.some((p) => p.includes('pythonPath')))
    assert.ok(r.problems.some((p) => p.includes('modelPath')))
    assert.ok(r.problems.some((p) => p.includes('参考音')))
    assert.equal(store.config.upstream.provider, 'mimo', '失败时不能改掉原 provider')
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('完整的本地配置可保存，参考音与空闲卸载都在', () => {
  const dir = fresh()
  try {
    const store = new Store(dir)
    store.load({})
    const r = store.update({
      upstream: {
        provider: 'local',
        local: {
          pythonPath: '/opt/venv/bin/python',
          modelPath: '/models/qwen3tts-0.6b-base-8bit',
          port: 8390,
          idleUnloadSeconds: 90,
          refs: {
            narrator: { wav: '/voices/narr.wav', text: '旁白参考文本' },
            dialogue: { wav: '', text: '' },
          },
        },
      },
    })
    assert.deepEqual(r.problems, [])
    const b = new Store(dir)
    const cfg = b.load({})
    assert.equal(cfg.upstream.provider, 'local')
    assert.equal(cfg.upstream.local.port, 8390)
    assert.equal(cfg.upstream.local.idleUnloadSeconds, 90)
    assert.equal(cfg.upstream.local.refs.narrator.wav, '/voices/narr.wav')
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('环境变量可以把本地引擎种子进去', () => {
  const dir = fresh()
  try {
    const store = new Store(dir)
    const cfg = store.load({
      TTS_PROVIDER: 'local',
      LOCAL_PYTHON: '/venv/python',
      LOCAL_MODEL: '/models/qwen',
      LOCAL_PORT: '8391',
      LOCAL_IDLE_SECONDS: '30',
      LOCAL_REFS_JSON: JSON.stringify({ narrator: { wav: '/a.wav', text: 'a' } }),
    })
    assert.equal(cfg.upstream.provider, 'local')
    assert.equal(cfg.upstream.local.pythonPath, '/venv/python')
    assert.equal(cfg.upstream.local.port, 8391)
    assert.equal(cfg.upstream.local.idleUnloadSeconds, 30)
    assert.equal(cfg.upstream.local.refs.narrator.wav, '/a.wav')
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})


test('混合启动需要本地配置；没有 Key 也允许（退化为本地冷启动）', () => {
  const dir = fresh()
  try {
    const store = new Store(dir)
    store.load({})
    const ok = store.update({
      upstream: {
        provider: 'hybrid',
        local: {
          pythonPath: '/venv/python',
          modelPath: '/models/qwen',
          refs: { narrator: { wav: '/a.wav', text: 'a' } },
        },
        hybrid: { maxCloudBootstrap: 6, cloudConcurrency: 2, targetRms: 0.126 },
      },
    })
    assert.deepEqual(ok.problems, [])
    assert.equal(store.config.upstream.provider, 'hybrid')
    assert.deepEqual(store.config.upstream.keys, [])
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('混合启动的云顶段数/克隆并发非法时拒绝', () => {
  const dir = fresh()
  try {
    const store = new Store(dir)
    store.load({})
    const r = store.update({
      upstream: {
        provider: 'hybrid',
        local: {
          pythonPath: '/venv/python',
          modelPath: '/models/qwen',
          refs: { narrator: { wav: '/a.wav', text: 'a' } },
        },
        hybrid: { maxCloudBootstrap: 99, cloudConcurrency: 3 },
      },
    })
    assert.ok(r.problems.some((p) => p.includes('maxCloudBootstrap')))
    assert.ok(r.problems.some((p) => p.includes('cloudConcurrency')))
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})
