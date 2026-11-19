import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import vm from 'node:vm'
import { buildPatch, diffFields, fromConfig } from '../client/config-draft.js'
import { buildTimeline, rulerTicks } from '../client/timeline-math.js'

function createRenderReact(stateOverrides = {}) {
  let hookIdx = 0
  const stateValues = new Map([
    [0, stateOverrides.state ?? null],
    [2, stateOverrides.view ?? 'timeline'],
  ])
  const React = {
    Fragment: Symbol('Fragment'),
    createElement(type, props, ...children) {
      const p = { ...(props || {}), children }
      if (typeof type === 'function') return type(p)
      return { type, props: p }
    },
    useState(init) {
      const idx = hookIdx++
      if (stateValues.has(idx)) return [stateValues.get(idx), () => {}]
      return [typeof init === 'function' ? init() : init, () => {}]
    },
    useEffect() {},
    useRef(v) { return { current: v } },
    useMemo(fn) { return fn() },
    useCallback(fn) { return fn },
  }
  const resetHooks = () => { hookIdx = 0 }
  return { React, resetHooks }
}

function loadClientBundle(React) {
  const code = readFileSync(resolve(import.meta.dirname, '../client.js'), 'utf8')
  let loaded = null
  const sandbox = {
    window: {
      __ModuleLoader__: {
        load(spec) { loaded = spec },
      },
    },
    document: { hidden: false, addEventListener() {}, removeEventListener() {} },
    Date,
    Math,
    Number,
    String,
    Boolean,
    Array,
    Object,
    Set,
    Map,
    JSON,
    URL,
    Promise,
    Error,
    navigator: {},
  }
  sandbox.globalThis = sandbox
  vm.runInNewContext(code, sandbox, { filename: 'client.js' })
  assert.ok(loaded, 'window.__ModuleLoader__.load 应被调用')
  assert.equal(loaded.id, 'audiobook-tts-plugin')
  const mod = loaded.factory((id) => {
    assert.equal(id, 'react')
    return React
  })
  return mod
}

test('client.js 产物可在 DSH ModuleLoader 中加载并渲染全部工作面', () => {
  const { React } = createRenderReact()
  const mod = loadClientBundle(React)
  assert.deepEqual([...mod.inject], ['slots'])
  assert.equal(typeof mod.apply, 'function')

  const registered = []
  mod.apply({
    slots: {
      inject(slotName, fn) { registered.push({ slotName, entry: fn() }) },
      register(meta, comp) { return { meta, comp } },
    },
  })
  assert.equal(registered.length, 2)
  assert.equal(registered[0].slotName, 'main')
  assert.equal(registered[0].entry.meta.key, 'mimo-tts')
  assert.equal(registered[1].slotName, 'sidebar.panellist')
  assert.equal(registered[1].entry.meta.id, 'mimo-tts')
  assert.equal(registered[1].entry.meta.label(), '听书值守')

  const Glyph = registered[1].entry.comp
  assert.equal(Glyph({ size: 16 }).type, 'svg')

  const sampleState = {
    service: { running: true, port: 8291, provider: 'openai', uptimeSec: 120, version: '0.3.0', hybrid: {}, openai: { ready: true, model: 'kokoro' } },
    local: { state: 'disabled', enabled: false },
    live: {
      rpm: { used: 2, limit: 100, waiting: 0 },
      cache: { entries: 1, maxEntries: 500, bytes: 4800, maxBytes: 512 * 1024 * 1024, hits: 1, misses: 1, hitRate: 0.5 },
      today: { segments: 3, seconds: 12, chars: 60, errors: 0 },
      totals: { requests: 10, segments: 20, chars: 500, seconds: 120, errors: 0, cacheHits: 5 },
      latency: { p50: 400, p95: 800, max: 900, samples: 2 },
      days: [{ day: '2026-11-19', requests: 2, segments: 3, seconds: 12, chars: 60, bytes: 4800, errors: 0 }],
      active: [{ client: 'abc12345@192.168.1.2', at: Date.now(), idleMs: 1000 }],
      recent: [{ at: Date.now(), chars: 20, segments: 1, audioSeconds: 4, latencyMs: 500, role: 'narrator', source: 'openai', client: 'abc12345@192.168.1.2', text: '测试片段' }],
    },
    config: {
      server: { host: '0.0.0.0', port: 8291, publicUrl: '' },
      upstream: { provider: 'openai', keys: [], openai: { baseUrl: 'http://127.0.0.1:8880/v1', model: 'kokoro', narratorVoice: 'zf_xiaoxiao', dialogueVoice: 'zm_yunjian', responseFormat: 'wav', speed: 1 } },
      voices: { narrator: { voice: '冰糖', style: '' }, dialogue: { voice: '苏打', style: '' } },
      synth: { maxSegmentChars: 100, maxTextChars: 10000, concurrency: 4, stream: false },
      cache: { enabled: true, maxEntries: 500, ttlSeconds: 7200 },
      auth: { enabled: true, user: 'admin', pass: '', token: 'tok-123' },
      legado: { name: '听书值守 TTS', extraHeaders: {} },
      limits: { rpm: 100 },
      log: { ring: 500 },
    },
    import: { jsonUrl: 'http://127.0.0.1:8291/legado.json?token=tok-123', listenUrl: 'http://127.0.0.1:8291/listening?token=tok-123', lanUrls: ['http://192.168.1.10:8291'], hasToken: true },
    presetVoices: ['冰糖', '苏打'],
  }

  // 加载中态 + 4 个工作面全部无异常渲染
  const loadingTree = registered[0].entry.comp({})
  assert.equal(loadingTree.props.className, 'mtt')

  for (const view of ['timeline', 'settings', 'archive', 'delivery']) {
    const viewReact = createRenderReact({ state: sampleState, view })
    const viewMod = loadClientBundle(viewReact.React)
    const viewRegs = []
    viewMod.apply({
      slots: {
        inject(slotName, fn) { viewRegs.push({ slotName, entry: fn() }) },
        register(meta, comp) { return { meta, comp } },
      },
    })
    const tree = viewRegs[0].entry.comp({})
    assert.equal(tree.props.className, 'mtt', `${view} 应渲染根容器`)
  }
})

test('前端配置草稿保留旧掩码 Key 并支持追加新 Key 与 OpenAI 字段', () => {
  const applied = fromConfig({
    upstream: {
      provider: 'openai',
      keys: ['sk-old…7890'],
      openai: {
        baseUrl: 'http://127.0.0.1:8880/v1',
        apiKey: '',
        model: 'kokoro',
        narratorVoice: 'zf_xiaoxiao',
        dialogueVoice: 'zm_yunjian',
        responseFormat: 'wav',
        speed: 1.0,
      },
    },
  })
  const draft = {
    ...applied,
    'upstream.keys': 'sk-old…7890\nsk-new-key-999999',
    'upstream.openai.speed': '1.25',
  }
  const changes = diffFields(draft, applied)
  const { patch, problems } = buildPatch(draft, changes)
  assert.deepEqual(problems, [])
  assert.deepEqual(patch.upstream.keys, ['sk-old…7890', 'sk-new-key-999999'])
  assert.equal(patch.upstream.openai.speed, 1.25)
})

test('前端时间线数学函数处理 OpenAI 来源与空数据不产生 NaN', () => {
  const empty = buildTimeline([])
  assert.equal(empty.list.length, 0)
  assert.equal(empty.totalAudio, 0)
  assert.deepEqual(rulerTicks(0).ticks, [])

  const tm = buildTimeline([
    { at: 1000, chars: 20, segments: 1, audioSeconds: 4.5, latencyMs: 800, role: 'narrator', source: 'openai' },
  ])
  assert.equal(tm.list.length, 1)
  assert.equal(tm.list[0].source, 'cloud')
  assert.equal(tm.list[0].sourceLabel, 'OpenAI')
})
