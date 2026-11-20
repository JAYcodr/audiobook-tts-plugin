/**
 * 配置：默认值、读写、迁移、校验。
 *
 * 一条铁律：**配置是运行时可改的**。控制台改端口/音色/上限，服务立刻生效，
 * 不重启进程、不改环境变量。所以各模块只拿 config 的引用，不缓存快照值。
 */
import { readFileSync, writeFileSync, mkdirSync, renameSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { randomBytes } from 'node:crypto'
import { validateTextRules } from './lexicon.mjs'

export const DEFAULTS = {
  server: {
    host: '0.0.0.0',
    port: 8291,
    // 对外地址（走 Cloudflare Tunnel / 反代时填），例如 https://tts.example.com。
    // 填了它，/legado.json 生成的朗读地址就用这个域名；留空则按请求头推导。
    publicUrl: '',
  },
  auth: {
    enabled: true,
    user: 'admin',
    pass: '',
    // URL token：Legado 的导入契约里没法塞 Basic 头，所以鉴权走一个可拼进 URL 的令牌。
    // 首次启动自动生成，用户不用理解它。
    token: '',
    // 只读分享令牌：仅允许 /listening、/legado.json 与 OpenAI 合成端点，访问 /api/* 一律 403。
    readTokens: [],
  },
  upstream: {
    // mimo = 小米云 API；local = 本机 Qwen3-TTS sidecar；hybrid = 混合启动；openai = OpenAI 兼容 TTS (/v1/audio/speech)
    provider: 'mimo',
    baseUrl: 'https://api.xiaomimimo.com/v1',
    keys: [],
    model: 'mimo-v2.5-tts',
    timeoutMs: 120000,
    maxRetry: 3,
    openai: {
      baseUrl: 'https://api.openai.com/v1',
      apiKey: '',
      model: 'tts-1',
      narratorVoice: 'alloy',
      dialogueVoice: 'echo',
      responseFormat: 'wav',
      speed: 1.0,
      instructions: '',
      timeoutMs: 60000,
      maxRetry: 2,
    },
    // 混合启动：冷启动前几段用 MiMo 克隆顶住，同时后台把本地模型焐热，热了切本地。
    hybrid: {
      maxCloudBootstrap: 6,
      cloudConcurrency: 2,
      targetRms: 0.126,
      warmup: true,
    },
    // 本地引擎：默认闲置 30 分钟（1800s）卸载释放 ~2.3GB 内存；设为 0 则常驻。
    local: {
      pythonPath: '',
      serverScript: '',
      modelPath: '',
      port: 8398,
      idleUnloadSeconds: 1800,
      warmupWindowSeconds: 900,
      startupTimeoutMs: 180000,
      requestTimeoutMs: 180000,
      refs: {
        narrator: { refId: '', wav: '', text: '' },
        dialogue: { refId: '', wav: '', text: '' },
      },
    },
  },
  voices: {
    // mode: preset | design | clone
    narrator: { mode: 'preset', voice: '冰糖', style: '温润端庄的中文女声，有从容气度，适合旁白', refId: '' },
    dialogue: { mode: 'preset', voice: '苏打', style: '沉稳自然的中文男声，语速适中', refId: '' },
  },
  voiceProfiles: {
    active: 'builtin:story-warm',
    items: [],
  },
  textRules: {
    enabled: true,
    polyphoneEnabled: true,
    disabledPresets: [],
    items: [],
  },
  synth: {
    // 每段最多多少字。越小 → 段更多、并发更快出首音；越大 → 请求更省。
    maxSegmentChars: 100,
    maxTextChars: 10000,
    concurrency: 4,
    // false = 返回长度正确的完整 WAV（Legado 进度正确）
    // true  = 返回长度未知的流式 WAV（首音更快，但 Legado 的时长/翻页会失真）
    stream: false,
  },
  cache: {
    enabled: true,
    maxEntries: 500,
    maxBytes: 512 * 1024 * 1024,
    ttlSeconds: 7200,
  },
  // 导出的 Legado 引擎里附带的自定义请求头（例如 Cloudflare Access 服务令牌）
  legado: {
    name: '听书值守 TTS',
    extraHeaders: {},
  },
  limits: {
    rpm: 100,
  },
  log: {
    ring: 500,
  },
  openaiServer: {
    enabled: false,
    apiKey: '',
    splitDialogue: true,
    defaultModel: 'audiobook-tts',
    mp3Fallback: 'wav',
    voiceMap: {
      alloy: 'auto',
      nova: 'auto',
      shimmer: 'narrator',
      echo: 'dialogue',
      onyx: 'dialogue',
      fable: 'narrator',
    },
  },
  tunnel: {
    protocol: 'http2',
    kvSync: {
      enabled: false,
      mode: 'wrangler',
      kvNamespaceId: '',
      accountId: '',
      keyName: 'tunnel_url',
      publicRelayUrl: '',
    },
  },
}

export const PRESET_VOICES = ['mimo_default', '冰糖', '茉莉', '苏打', '白桦', 'Mia', 'Chloe', 'Milo', 'Dean']

export const BUILTIN_VOICE_PROFILES = [
  {
    id: 'builtin:story-warm',
    name: '经典说书（温润女旁白 + 沉稳男对话）',
    builtin: true,
    voices: {
      narrator: { mode: 'preset', voice: '冰糖', style: '温润端庄的中文女声，有从容气度，适合旁白', refId: '' },
      dialogue: { mode: 'preset', voice: '苏打', style: '沉稳自然的中文男声，语速适中', refId: '' },
    },
    localRefs: {
      narrator: { refId: 'builtin:narrator-14s', wav: '', text: '' },
      dialogue: { refId: 'builtin:narrator-14s', wav: '', text: '' },
    },
  },
  {
    id: 'builtin:vivid-design',
    name: 'MiMo 文字造音（说书女声 + 青年男声）',
    builtin: true,
    voices: {
      narrator: { mode: 'design', voice: 'mimo_default', style: '声音清润温柔的年轻说书女声，吐字清晰，从容舒缓', refId: '' },
      dialogue: { mode: 'design', voice: 'mimo_default', style: '声线清朗稳重的青年中文男声，对话自然富有情绪张力', refId: '' },
    },
  },
  {
    id: 'builtin:clone-narrator',
    name: '参考音克隆统一声线（14s 旁白样本）',
    builtin: true,
    voices: {
      narrator: { mode: 'clone', voice: '', style: '', refId: 'builtin:narrator-14s' },
      dialogue: { mode: 'preset', voice: '苏打', style: '沉稳自然的中文男声，语速适中', refId: '' },
    },
    localRefs: {
      narrator: { refId: 'builtin:narrator-14s', wav: '', text: '' },
      dialogue: { refId: '', wav: '', text: '' },
    },
  },
]

const UNSAFE_KEYS = new Set(['__proto__', 'constructor', 'prototype'])

/** 深合并：数组整体替换（keys、等），对象逐键递归，并过滤原型链污染键。 */
export function merge(base, patch) {
  if (Array.isArray(patch) || patch === null || typeof patch !== 'object') return patch
  const out = Array.isArray(base) ? [...base] : { ...base }
  for (const [k, v] of Object.entries(patch)) {
    if (UNSAFE_KEYS.has(k)) continue
    out[k] = k in out && out[k] && typeof out[k] === 'object' && !Array.isArray(out[k])
      ? merge(out[k], v)
      : merge(undefined, v)
  }
  return out
}

function clonePlain(value) {
  if (Array.isArray(value)) return value.map((item) => clonePlain(item))
  if (value && typeof value === 'object') {
    const out = {}
    for (const [k, v] of Object.entries(value)) {
      if (UNSAFE_KEYS.has(k)) continue
      out[k] = clonePlain(v)
    }
    return out
  }
  return value
}

export function isMaskedSecret(val) {
  return typeof val === 'string' && /[\u2026\u2022\u00b7]/.test(val)
}

/**
 * 清洗配置补丁里的脱敏占位符：
 * - 如果传回的掩码 Key 能匹配到已保存的某条真实 Key，则还原为真实 Key（支持保留旧 Key 并追加新 Key）；
 * - 如果出现无法匹配已保存密钥的掩码字符串，直接报错拒绝，绝不把掩码当真 Key 写入配置；
 * - auth.pass 若为掩码占位符（••••••），保留原口令不覆盖。
 */
export function sanitizeConfigPatch(patch, currentConfig) {
  if (!patch || typeof patch !== 'object' || Array.isArray(patch)) {
    return { cleanPatch: {}, problems: ['配置补丁必须是 JSON 对象'] }
  }
  const cleanPatch = clonePlain(patch)
  const problems = []

  if (cleanPatch.upstream && typeof cleanPatch.upstream === 'object' && 'keys' in cleanPatch.upstream) {
    const rawKeys = cleanPatch.upstream.keys
    if (!Array.isArray(rawKeys)) {
      problems.push('upstream.keys 必须是数组')
    } else {
      const existing = Array.isArray(currentConfig?.upstream?.keys) ? currentConfig.upstream.keys : []
      const used = new Set()
      const resolved = []
      for (const item of rawKeys) {
        const k = String(item ?? '').trim()
        if (!k) continue
        if (!isMaskedSecret(k)) {
          resolved.push(k)
          continue
        }
        const matchIdx = existing.findIndex((realKey, idx) => !used.has(idx) && maskKey(realKey) === k)
        if (matchIdx >= 0) {
          used.add(matchIdx)
          resolved.push(existing[matchIdx])
        } else {
          problems.push('upstream.keys 包含无效的掩码占位符，请填写完整 API Key')
        }
      }
      cleanPatch.upstream.keys = resolved
    }
  }

  if (cleanPatch.upstream?.openai && typeof cleanPatch.upstream.openai === 'object') {
    const apiKey = cleanPatch.upstream.openai.apiKey
    if (typeof apiKey === 'string' && isMaskedSecret(apiKey)) {
      const existingApiKey = String(currentConfig?.upstream?.openai?.apiKey || '')
      if (existingApiKey && apiKey === maskKey(existingApiKey)) {
        delete cleanPatch.upstream.openai.apiKey
      } else {
        problems.push('upstream.openai.apiKey 包含无效的掩码字符，请填写完整密钥')
      }
    }
  }

  if (cleanPatch.openaiServer && typeof cleanPatch.openaiServer === 'object') {
    const apiKey = cleanPatch.openaiServer.apiKey
    if (typeof apiKey === 'string' && isMaskedSecret(apiKey)) {
      const existingApiKey = String(currentConfig?.openaiServer?.apiKey || '')
      if (existingApiKey && apiKey === maskKey(existingApiKey)) {
        delete cleanPatch.openaiServer.apiKey
      } else {
        problems.push('openaiServer.apiKey 包含无效的掩码字符，请填写完整密钥')
      }
    }
  }

  if (cleanPatch.auth && typeof cleanPatch.auth === 'object') {
    if (typeof cleanPatch.auth.pass === 'string' && isMaskedSecret(cleanPatch.auth.pass)) {
      const existingPass = String(currentConfig?.auth?.pass || '')
      if (existingPass && (cleanPatch.auth.pass === '••••••' || cleanPatch.auth.pass === '••••')) {
        delete cleanPatch.auth.pass
      } else {
        problems.push('auth.pass 包含无效的掩码字符，请重新输入完整口令')
      }
    }
    if (typeof cleanPatch.auth.token === 'string' && isMaskedSecret(cleanPatch.auth.token)) {
      if (currentConfig?.auth?.token) delete cleanPatch.auth.token
      else problems.push('auth.token 包含无效的掩码字符，请填写完整令牌')
    }
    if ('readTokens' in cleanPatch.auth) {
      const rawRead = cleanPatch.auth.readTokens
      if (!Array.isArray(rawRead)) {
        problems.push('auth.readTokens 必须是数组')
      } else {
        const existingRead = Array.isArray(currentConfig?.auth?.readTokens) ? currentConfig.auth.readTokens : []
        const byId = new Map(existingRead.filter((r) => r && r.id).map((r) => [r.id, r]))
        const resolved = []
        for (const item of rawRead) {
          if (!item || typeof item !== 'object' || Array.isArray(item)) {
            problems.push('auth.readTokens 元素必须是对象')
            continue
          }
          const copy = { ...item }
          if (typeof copy.token === 'string' && isMaskedSecret(copy.token)) {
            const matched = byId.get(copy.id)
            if (matched?.token) {
              copy.token = matched.token
            } else {
              problems.push(`auth.readTokens[${copy.label || copy.id || '?'}] 包含无效掩码令牌，请重新生成`)
              continue
            }
          }
          resolved.push(copy)
        }
        cleanPatch.auth.readTokens = resolved
      }
    }
  }

  return { cleanPatch, problems }
}

/** 对补丁执行脱敏还原 + 深合并 + 校验（供 /api/validate 与 Store.update 共用）。 */
export function validatePatch(currentConfig, patch, ctx = {}) {
  const { cleanPatch, problems: sanitizeProblems } = sanitizeConfigPatch(patch, currentConfig)
  if (sanitizeProblems.length) {
    return { problems: sanitizeProblems, merged: currentConfig, cleanPatch }
  }
  const merged = merge(merge({}, currentConfig), cleanPatch)
  if (
    merged.openaiServer?.voiceMap
    && typeof merged.openaiServer.voiceMap === 'object'
    && !Array.isArray(merged.openaiServer.voiceMap)
  ) {
    for (const [vk, vv] of Object.entries(merged.openaiServer.voiceMap)) {
      if (vv === null || vv === undefined) delete merged.openaiServer.voiceMap[vk]
    }
  }
  const problems = validate(merged, ctx)
  return { problems, merged, cleanPatch }
}

const ENV_KEYS = {
  'MIMO_TTS_PORT': (c, v) => { c.server.port = Number(v) },
  'MIMO_TTS_HOST': (c, v) => { c.server.host = v },
  'TTS_PROVIDER': (c, v) => { c.upstream.provider = v },
  'LOCAL_PYTHON': (c, v) => { c.upstream.local.pythonPath = v },
  'LOCAL_MODEL': (c, v) => { c.upstream.local.modelPath = v },
  'LOCAL_PORT': (c, v) => { c.upstream.local.port = Number(v) },
  'LOCAL_IDLE_SECONDS': (c, v) => { c.upstream.local.idleUnloadSeconds = Number(v) },
  'LOCAL_WARMUP_WINDOW_SECONDS': (c, v) => { c.upstream.local.warmupWindowSeconds = Number(v) },
  'HYBRID_MAX_BOOTSTRAP': (c, v) => { c.upstream.hybrid.maxCloudBootstrap = Number(v) },
  'HYBRID_TARGET_RMS': (c, v) => { c.upstream.hybrid.targetRms = Number(v) },
  'LOCAL_REFS_JSON': (c, v) => {
    try {
      const refs = JSON.parse(v)
      if (refs && typeof refs === 'object') c.upstream.local.refs = refs
    } catch { /* 坏 JSON 不阻断启动 */ }
  },
  'MIMO_API_KEY': (c, v) => { if (!c.upstream.keys.length) c.upstream.keys = [v] },
  'MIMO_API_KEYS': (c, v) => { c.upstream.keys = v.split(',').map(s => s.trim()).filter(Boolean) },
  'MIMO_BASE_URL': (c, v) => { c.upstream.baseUrl = v },
  'MIMO_MODEL': (c, v) => { c.upstream.model = v },
  'OPENAI_TTS_BASE_URL': (c, v) => { c.upstream.openai.baseUrl = v },
  'OPENAI_TTS_API_KEY': (c, v) => { c.upstream.openai.apiKey = v },
  'OPENAI_TTS_MODEL': (c, v) => { c.upstream.openai.model = v },
  'OPENAI_TTS_VOICE': (c, v) => { c.upstream.openai.narratorVoice = v },
  'OPENAI_TTS_DIALOGUE_VOICE': (c, v) => { c.upstream.openai.dialogueVoice = v },
  'OPENAI_TTS_FORMAT': (c, v) => { c.upstream.openai.responseFormat = v },
  'OPENAI_TTS_SPEED': (c, v) => { c.upstream.openai.speed = Number(v) },
  'TTS_AUTH_USER': (c, v) => { c.auth.user = v },
  'TTS_AUTH_PASS': (c, v) => { c.auth.pass = v },
  'NARRATOR_VOICE': (c, v) => { c.voices.narrator.voice = v },
  'NARRATOR_STYLE': (c, v) => { c.voices.narrator.style = v },
  'DIALOGUE_VOICE': (c, v) => { c.voices.dialogue.voice = v },
  'DIALOGUE_STYLE': (c, v) => { c.voices.dialogue.style = v },
  'MAX_MERGE_LEN': (c, v) => { c.synth.maxSegmentChars = Number(v) },
  'STREAM_ENABLED': (c, v) => { c.synth.stream = String(v).toLowerCase() === 'true' },
  'CACHE_MAX_SIZE': (c, v) => { c.cache.maxEntries = Number(v) },
  'CACHE_TTL_SECONDS': (c, v) => { c.cache.ttlSeconds = Number(v) },
  'OPENAI_SERVER_ENABLED': (c, v) => {
    c.openaiServer.enabled = ['1', 'true', 'yes'].includes(String(v).trim().toLowerCase())
  },
  'OPENAI_SERVER_API_KEY': (c, v) => { c.openaiServer.apiKey = v },
}

/** 环境变量只做「首次种子」和容器部署用；控制台写入的 config.json 优先级更高。 */
export function applyEnv(cfg, env = process.env) {
  for (const [name, fn] of Object.entries(ENV_KEYS)) {
    const raw = env[name]
    if (raw === undefined || raw === '') continue
    try { fn(cfg, raw) } catch { /* 坏环境变量不阻断启动 */ }
  }
  return cfg
}

export function validate(cfg, ctx = {}) {
  const problems = []
  const port = Number(cfg.server?.port)
  if (!Number.isInteger(port) || port < 1 || port > 65535) problems.push('server.port 必须是 1–65535')
  if (!cfg.upstream?.baseUrl?.startsWith('http')) problems.push('upstream.baseUrl 必须是 http(s) 地址')
  if (!Array.isArray(cfg.upstream?.keys)) problems.push('upstream.keys 必须是数组')
  if (cfg.server?.publicUrl && !/^https?:\/\//.test(cfg.server.publicUrl)) {
    problems.push('server.publicUrl 必须留空或写成 http(s):// 开头')
  }
  if (cfg.legado?.extraHeaders && typeof cfg.legado.extraHeaders !== 'object') {
    problems.push('legado.extraHeaders 必须是对象')
  }
  const n = Number(cfg.synth?.maxSegmentChars)
  if (!Number.isInteger(n) || n < 10 || n > 300) problems.push('synth.maxSegmentChars 必须是 10–300')

  const provider = cfg.upstream?.provider
  if (!['mimo', 'local', 'hybrid', 'openai'].includes(provider)) {
    problems.push('upstream.provider 必须是 mimo / local / hybrid / openai')
  }
  for (const roleKey of ['narrator', 'dialogue']) {
    const v = cfg.voices?.[roleKey] || {}
    const mode = v.mode || 'preset'
    if (!['preset', 'design', 'clone'].includes(mode)) {
      problems.push(`voices.${roleKey}.mode 必须是 preset / design / clone`)
    }
    if (provider === 'mimo') {
      if (mode === 'design' && !String(v.style || '').trim()) {
        problems.push(`MiMo 文字造音（${roleKey}）：style 音色描述不能为空`)
      }
      if (mode === 'clone' && !v.refId && !String(v.voice || '').trim()) {
        problems.push(`MiMo 声音克隆（${roleKey}）：请选择参考音或填写音频路径`)
      }
    }
  }
  if (cfg.voiceProfiles?.items !== undefined && !Array.isArray(cfg.voiceProfiles.items)) {
    problems.push('voiceProfiles.items 必须是数组')
  }
  problems.push(...validateTextRules(cfg.textRules))
  if (provider === 'openai') {
    const oa = cfg.upstream?.openai || {}
    if (!/^https?:\/\//.test(String(oa.baseUrl || ''))) {
      problems.push('OpenAI 兼容引擎：upstream.openai.baseUrl 必须是 http(s) 地址')
    }
    if (!String(oa.model || '').trim()) {
      problems.push('OpenAI 兼容引擎：upstream.openai.model 不能为空')
    }
    if (!String(oa.narratorVoice || '').trim()) {
      problems.push('OpenAI 兼容引擎：upstream.openai.narratorVoice 不能为空')
    }
    if (!['wav', 'pcm'].includes(oa.responseFormat || 'wav')) {
      problems.push('OpenAI 兼容引擎：responseFormat 必须是 wav 或 pcm')
    }
    const spd = Number(oa.speed ?? 1)
    if (!Number.isFinite(spd) || spd < 0.25 || spd > 4.0) {
      problems.push('OpenAI 兼容引擎：speed 必须是 0.25–4.0')
    }
  }
  if (provider === 'local' || provider === 'hybrid') {
    const local = cfg.upstream?.local || {}
    if (!local.pythonPath) problems.push('本地引擎：upstream.local.pythonPath 不能为空')
    if (!local.modelPath) problems.push('本地引擎：upstream.local.modelPath 不能为空')
    const ref = local.refs?.narrator
    if (ref?.refId) {
      if (ctx.refsStore) {
        const resolved = ctx.refsStore.resolveRef(ref)
        if (!resolved.wav || !resolved.exists) {
          problems.push(`本地引擎：找不到旁白参考音（${ref.refId}）`)
        } else if (!resolved.text) {
          problems.push('本地引擎：旁白参考文本不能为空')
        }
      }
    } else {
      if (!ref?.wav) problems.push('本地引擎：旁白参考音（refs.narrator.wav）不能为空')
      if (!ref?.text) problems.push('本地引擎：旁白参考文本（refs.narrator.text）不能为空')
    }
    const lp = Number(local.port)
    if (!Number.isInteger(lp) || lp < 1 || lp > 65535) problems.push('本地引擎端口必须是 1–65535')
    const idle = Number(local.idleUnloadSeconds)
    if (!Number.isFinite(idle) || idle < 0 || idle > 86400) problems.push('本地引擎空闲卸载必须是 0–86400 秒')
    const warmWin = Number(local.warmupWindowSeconds ?? 900)
    if (!Number.isFinite(warmWin) || warmWin < 0 || warmWin > 86400) {
      problems.push('本地引擎预热保活窗口必须是 0–86400 秒')
    }
  }
  if (provider === 'hybrid') {
    const h = cfg.upstream?.hybrid || {}
    const max = Number(h.maxCloudBootstrap)
    if (!Number.isInteger(max) || max < 0 || max > 30) problems.push('混合启动 maxCloudBootstrap 必须是 0–30')
    const conc = Number(h.cloudConcurrency)
    if (!Number.isInteger(conc) || conc < 1 || conc > 2) problems.push('混合启动 cloudConcurrency 必须是 1–2（MiMo 克隆最多 2 路）')
    const rms = Number(h.targetRms)
    if (Number(h.targetRms) !== 0 && (!Number.isFinite(rms) || rms < 0.02 || rms > 0.4)) {
      problems.push('混合启动 targetRms 必须是 0 或 0.02–0.4')
    }
  }
  if (cfg.openaiServer !== undefined) {
    const osrv = cfg.openaiServer
    if (!osrv || typeof osrv !== 'object' || Array.isArray(osrv)) {
      problems.push('openaiServer 必须是对象')
    } else {
      if (osrv.mp3Fallback !== undefined && !['wav', 'strict'].includes(osrv.mp3Fallback)) {
        problems.push('openaiServer.mp3Fallback 仅允许 wav 或 strict')
      }
      if (osrv.voiceMap !== undefined) {
        if (!osrv.voiceMap || typeof osrv.voiceMap !== 'object' || Array.isArray(osrv.voiceMap)) {
          problems.push('openaiServer.voiceMap 必须是纯对象')
        }
      }
    }
  }
  if (cfg.tunnel !== undefined) {
    const tun = cfg.tunnel
    if (!tun || typeof tun !== 'object' || Array.isArray(tun)) {
      problems.push('tunnel 必须是对象')
    } else {
      if (tun.protocol !== undefined && !['http2', 'quic', 'auto'].includes(tun.protocol)) {
        problems.push('tunnel.protocol 仅允许 http2 / quic / auto')
      }
      if (tun.kvSync !== undefined) {
        const kv = tun.kvSync
        if (!kv || typeof kv !== 'object' || Array.isArray(kv)) {
          problems.push('tunnel.kvSync 必须是对象')
        } else {
          if (kv.mode !== undefined && !['wrangler', 'api'].includes(kv.mode)) {
            problems.push('tunnel.kvSync.mode 仅允许 wrangler 或 api')
          }
          const relay = String(kv.publicRelayUrl || '').trim()
          if (relay && !relay.startsWith('https://')) {
            problems.push('tunnel.kvSync.publicRelayUrl 必须留空或以 https:// 开头')
          }
        }
      }
    }
  }
  if (cfg.auth?.readTokens !== undefined) {
    if (!Array.isArray(cfg.auth.readTokens)) {
      problems.push('auth.readTokens 必须是数组')
    } else {
      const seenIds = new Set()
      const seenTokens = new Set()
      const adminToken = String(cfg.auth?.token || '')
      for (let idx = 0; idx < cfg.auth.readTokens.length; idx++) {
        const rt = cfg.auth.readTokens[idx]
        const label = `auth.readTokens[${idx}]`
        if (!rt || typeof rt !== 'object' || Array.isArray(rt)) {
          problems.push(`${label} 必须是对象`)
          continue
        }
        const id = String(rt.id || '').trim()
        const rtLabel = String(rt.label || '').trim()
        const tok = String(rt.token || '').trim()
        if (!id) problems.push(`${label}.id 不能为空`)
        else if (seenIds.has(id)) problems.push(`${label}.id 重复：${id}`)
        else seenIds.add(id)
        if (!rtLabel || rtLabel.length > 80) problems.push(`${label}.label 必须为 1–80 字`)
        if (!tok || tok.length < 6) problems.push(`${label}.token 至少 6 个字符`)
        else if (adminToken && tok === adminToken) problems.push(`${label}.token 不能与主管理令牌相同`)
        else if (seenTokens.has(tok)) problems.push(`${label}.token 不能重复`)
        else seenTokens.add(tok)
      }
    }
  }
  return problems
}

export class Store {
  /**
   * @param {string} dataDir 插件数据目录（插件由宿主传入，独立运行时用 AUDIOBOOK_TTS_DATA / MIMO_TTS_DATA 或 ./data）
   */
  constructor(dataDir) {
    this.dataDir = dataDir
    this.file = join(dataDir, 'config.json')
    this.backupFile = `${this.file}.bak`
    this.config = null
    this.log = null
    this.refsStore = null
  }

  load(env = process.env) {
    mkdirSync(this.dataDir, { recursive: true })
    let saved = {}
    try {
      saved = JSON.parse(readFileSync(this.file, 'utf8'))
    } catch (err) {
      if (err.code === 'ENOENT') {
        // 主文件不见了。**不要**静默回到默认值：那会连带把 API Key 和令牌一起
        // 重置掉，而用户看到的只是「参数又变回默认了」。能读到上一次的备份就用备份。
        try {
          saved = JSON.parse(readFileSync(this.backupFile, 'utf8'))
          this.log?.(`主配置缺失，已从 ${this.backupFile} 恢复`)
        } catch { /* 备份也没有：首次运行，用默认值 */ }
      } else {
        // 坏配置不能阻断启动：备份后用默认值起来，让用户在控制台里修。
        try { renameSync(this.file, `${this.file}.broken-${Date.now()}`) } catch { /* 尽力而为 */ }
      }
    }
    const cfg = merge(merge({}, DEFAULTS), saved)
    this.config = applyEnv(cfg, env)
    if (!this.config.auth.token) {
      this.config.auth.token = randomBytes(9).toString('base64url')
      this.save()
    }
    return this.config
  }

  save() {
    mkdirSync(dirname(this.file), { recursive: true })
    const text = JSON.stringify(this.config, null, 2)
    const tmp = `${this.file}.tmp`
    writeFileSync(tmp, text)
    renameSync(tmp, this.file)
    // 留一份上一版：主文件被误删/写坏时还能捞回密钥与令牌
    try { writeFileSync(this.backupFile, text) } catch { /* 备份失败不影响主流程 */ }
    return this.config
  }

  /** 补丁式更新：只改传入的键，其余保留。返回 {config, problems} */
  update(patch) {
    const { problems, merged } = validatePatch(this.config, patch, { refsStore: this.refsStore })
    if (problems.length) return { problems, config: this.config }
    this.config = merged
    this.save()
    return { problems: [], config: this.config }
  }
}

/** 给前端看的配置：密钥只回传「有没有」，不回传明文。 */
export function redact(cfg) {
  return {
    ...cfg,
    upstream: {
      ...cfg.upstream,
      keys: cfg.upstream.keys.map((k) => maskKey(k)),
      openai: cfg.upstream.openai
        ? {
          ...cfg.upstream.openai,
          apiKey: cfg.upstream.openai.apiKey ? maskKey(cfg.upstream.openai.apiKey) : '',
        }
        : undefined,
    },
    auth: {
      ...cfg.auth,
      pass: cfg.auth.pass ? '••••••' : '',
      readTokens: Array.isArray(cfg.auth?.readTokens)
        ? cfg.auth.readTokens.map((rt) => ({
          ...rt,
          token: rt?.token ? '••••••' : '',
        }))
        : [],
    },
    openaiServer: cfg.openaiServer
      ? {
        ...cfg.openaiServer,
        apiKey: cfg.openaiServer.apiKey ? maskKey(cfg.openaiServer.apiKey) : '',
      }
      : undefined,
  }
}

export function maskKey(k) {
  if (typeof k !== 'string' || k.length < 10) return '••••'
  return `${k.slice(0, 6)}…${k.slice(-4)}`
}
