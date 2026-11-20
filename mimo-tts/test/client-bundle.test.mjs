import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import vm from 'node:vm'
import { buildDraftSnapshot, buildPatch, diffFields, fromConfig } from '../client/config-draft.js'
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

function findNodes(node, pred, acc = []) {
  if (!node || typeof node !== 'object') return acc
  if (Array.isArray(node)) {
    for (const item of node) findNodes(item, pred, acc)
    return acc
  }
  if (pred(node)) acc.push(node)
  if (node.props?.children) findNodes(node.props.children, pred, acc)
  return acc
}

function collectText(node, out = []) {
  if (node == null || typeof node === 'boolean') return out
  if (typeof node === 'string' || typeof node === 'number') {
    out.push(String(node))
    return out
  }
  if (Array.isArray(node)) {
    for (const it of node) collectText(it, out)
    return out
  }
  if (node.props?.dangerouslySetInnerHTML?.__html) {
    out.push(String(node.props.dangerouslySetInnerHTML.__html))
  }
  if (node.props?.children) collectText(node.props.children, out)
  return out
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
    service: { running: true, port: 8291, provider: 'openai', uptimeSec: 120, version: '0.5.0', hybrid: {}, openai: { ready: true, model: 'kokoro' }, openaiServer: { enabled: true } },
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
      server: { host: '0.0.0.0', port: 8291, publicUrl: 'https://tts.example.com' },
      upstream: { provider: 'openai', keys: [], openai: { baseUrl: 'http://127.0.0.1:8880/v1', model: 'kokoro', narratorVoice: 'zf_xiaoxiao', dialogueVoice: 'zm_yunjian', responseFormat: 'wav', speed: 1 } },
      voices: { narrator: { mode: 'preset', voice: '冰糖', style: '' }, dialogue: { mode: 'preset', voice: '苏打', style: '' } },
      voiceProfiles: { active: 'builtin:story-warm', items: [] },
      textRules: { enabled: true, items: [] },
      synth: { maxSegmentChars: 100, maxTextChars: 10000, concurrency: 4, stream: false },
      cache: { enabled: true, maxEntries: 500, ttlSeconds: 7200 },
      auth: { enabled: true, user: 'admin', pass: '', token: 'tok-123' },
      legado: { name: '听书值守 TTS', extraHeaders: {} },
      limits: { rpm: 100 },
      log: { ring: 500 },
      openaiServer: {
        enabled: true,
        apiKey: 'sk-ab…test',
        splitDialogue: true,
        defaultModel: 'audiobook-tts',
        mp3Fallback: 'wav',
        voiceMap: { alloy: 'auto', nova: 'auto', shimmer: 'narrator', echo: 'dialogue', onyx: 'dialogue', fable: 'narrator' },
      },
      tunnel: {
        protocol: 'http2',
        kvSync: { enabled: false, mode: 'wrangler', kvNamespaceId: '', accountId: '', keyName: 'tunnel_url', publicRelayUrl: '' },
      },
    },
    import: {
      jsonUrl: 'http://127.0.0.1:8291/legado.json?token=tok-123',
      publicJsonUrl: 'https://tts.example.com/legado.json?token=tok-123',
      listenUrl: 'http://127.0.0.1:8291/listening?token=tok-123',
      quickTunnelUrl: 'https://bundle-test.trycloudflare.com',
      quickJsonUrl: 'https://bundle-test.trycloudflare.com/legado.json?token=tok-123',
      relayBaseUrl: '',
      openaiBaseUrl: 'https://tts.example.com/v1',
      openaiQuickBaseUrl: 'https://bundle-test.trycloudflare.com/v1',
      openaiLanBaseUrl: 'http://127.0.0.1:8291/v1',
      openaiEnabled: true,
      openaiUsesCustomKey: true,
      lanUrls: ['http://192.168.1.10:8291'],
      hasToken: true,
    },
    tunnel: { state: 'running', quickUrl: 'https://bundle-test.trycloudflare.com', protocol: 'http2', kvSync: { state: 'idle' } },
    presetVoices: ['冰糖', '苏打'],
    builtinVoiceProfiles: [{ id: 'builtin:story-warm', name: '经典说书', builtin: true, voices: {} }],
    builtinRulePresets: [{ id: 'preset:strip-ps', name: '过滤 PS', pattern: '^PS:.*$', replace: '', regex: true, flags: 'gim', scope: 'all', enabled: true }],
    builtinPolyphonePresets: [{ id: 'poly:xuepo', name: '血泊 → 血坡', pattern: '血泊', replace: '血坡', regex: false, scope: 'all', enabled: true }],
    refs: [{ id: 'builtin:narrator-14s', name: '旁白女声 14s', builtin: true, exists: true, durationSec: 14.2, text: '测试文本' }],
    setupSummary: { state: 'idle', platformSupported: true, readyForLocal: false },
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

    const flatText = collectText(tree).join(' ')
    // 非 hybrid 模式下「混合」灯必须灭灯显示 OFF
    const lamps = findNodes(tree, (n) => String(n.props?.className || '').includes('lamp'))
    const hybridLamp = lamps.find((l) => collectText(l).join('').includes('混合'))
    assert.ok(hybridLamp)
    assert.ok(!hybridLamp.props.className.includes(' on'), '非 hybrid 模式下混合灯不能点亮')
    assert.ok(collectText(hybridLamp).join('').includes('OFF'))

    if (view === 'settings') {
      assert.ok(flatText.includes('GROUP 01'))
      assert.ok(flatText.includes('GROUP 02'))
      assert.ok(flatText.includes('GROUP 03'))
      assert.ok(flatText.includes('GROUP 04'))
      assert.ok(flatText.includes('统一参考音库'))
      assert.ok(flatText.includes('文本发音与断句规则'))
      assert.ok(flatText.includes('PREVIEW DRAFT'))
      assert.ok(flatText.includes('对外 OpenAI 兼容端点'))
      assert.ok(flatText.includes('生成随机密钥'))
      assert.ok(flatText.includes('音色映射表'))
    }
    if (view === 'delivery') {
      assert.ok(flatText.includes('公网 HTTPS 四选一接入与 Quick Tunnel'))
      assert.ok(flatText.includes('只读分享地址'))
      assert.ok(flatText.includes('OpenAI 兼容阅读软件接入单'))
      assert.ok(flatText.includes('局域网扫码导入'))
      assert.ok(flatText.includes('公网穿透扫码导入'))
      assert.ok(flatText.includes('临时 HTTPS 扫码导入'))
      assert.ok(flatText.includes('OpenAI 端点'))
      assert.ok(flatText.includes('HTTPS 通道'))
      assert.ok(flatText.includes('<svg xmlns="http://www.w3.org/2000/svg"'), 'uqr 应输出离线 SVG 二维码')
    }
  }

  // 未配置 MiMo Key 时展示可收起初始化引导条
  const unconfiguredState = {
    ...sampleState,
    service: { ...sampleState.service, provider: 'mimo' },
    config: { ...sampleState.config, upstream: { ...sampleState.config.upstream, provider: 'mimo', keys: [] } },
  }
  const warnReact = createRenderReact({ state: unconfiguredState, view: 'timeline' })
  const warnMod = loadClientBundle(warnReact.React)
  const warnRegs = []
  warnMod.apply({
    slots: {
      inject(slotName, fn) { warnRegs.push({ slotName, entry: fn() }) },
      register(meta, comp) { return { meta, comp } },
    },
  })
  const warnTree = warnRegs[0].entry.comp({})
  assert.ok(collectText(warnTree).join(' ').includes('MiMo 云端尚未填写 API Key'))
})

test('前端配置草稿保留旧掩码 Key 并支持 textRules / voiceProfiles / openaiServer / tunnel / buildDraftSnapshot', () => {
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
    openaiServer: {
      enabled: false,
      apiKey: 'sk-old…3210',
      splitDialogue: true,
      defaultModel: 'audiobook-tts',
      mp3Fallback: 'wav',
      voiceMap: { alloy: 'auto', customOld: 'narrator' },
    },
    tunnel: {
      protocol: 'http2',
      kvSync: { enabled: false, mode: 'wrangler', kvNamespaceId: '', accountId: '', keyName: 'tunnel_url', publicRelayUrl: '' },
    },
  })
  const draft = {
    ...applied,
    'upstream.keys': 'sk-old…7890\nsk-new-key-999999',
    'upstream.openai.speed': '1.25',
    'voices.narrator.mode': 'clone',
    'voices.narrator.refId': 'builtin:narrator-14s',
    'textRules.items': [{ id: 'r1', name: 'test', pattern: 'a', replace: 'b', scope: 'all', regex: false, enabled: true }],
    'audio.format': 'mp3',
    'audio.bitrate': '128',
    'openaiServer.enabled': true,
    'openaiServer.mp3Fallback': 'strict',
    'openaiServer.voiceMap': { alloy: 'auto', customNew: '冰糖' },
    'tunnel.protocol': 'quic',
    'tunnel.kvSync.publicRelayUrl': 'https://relay.example.workers.dev',
  }
  const changes = diffFields(draft, applied)
  const { patch, problems } = buildPatch(draft, changes)
  assert.deepEqual(problems, [])
  assert.deepEqual(patch.upstream.keys, ['sk-old…7890', 'sk-new-key-999999'])
  assert.equal(patch.upstream.openai.speed, 1.25)
  assert.equal(patch.voices.narrator.mode, 'clone')
  assert.equal(patch.voices.narrator.refId, 'builtin:narrator-14s')
  assert.equal(patch.textRules.items.length, 1)
  assert.equal(patch.audio.format, 'mp3')
  assert.equal(patch.audio.bitrate, 128)
  assert.equal(patch.openaiServer.enabled, true)
  assert.equal(patch.openaiServer.apiKey, undefined, '未修改的掩码 openaiServer.apiKey 不应写回')
  assert.equal(patch.openaiServer.mp3Fallback, 'strict')
  assert.equal(patch.openaiServer.voiceMap.customNew, '冰糖')
  assert.equal(patch.openaiServer.voiceMap.customOld, null, '移除的映射键应标 null 供服务端删除')
  assert.equal(patch.tunnel.protocol, 'quic')
  assert.equal(patch.tunnel.kvSync.publicRelayUrl, 'https://relay.example.workers.dev')

  const snap = buildDraftSnapshot(draft)
  assert.equal(snap.voices.narrator.refId, 'builtin:narrator-14s')
  assert.equal(snap.textRules.items[0].replace, 'b')
  assert.equal(snap.audio.format, 'mp3')
  assert.equal(snap.audio.bitrate, 128)
  assert.equal(snap.openaiServer.mp3Fallback, 'strict')
  assert.equal(snap.tunnel.protocol, 'quic')
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
