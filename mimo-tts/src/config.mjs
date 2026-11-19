/**
 * 配置：默认值、读写、迁移、校验。
 *
 * 一条铁律：**配置是运行时可改的**。控制台改端口/音色/上限，服务立刻生效，
 * 不重启进程、不改环境变量。所以各模块只拿 config 的引用，不缓存快照值。
 */
import { readFileSync, writeFileSync, mkdirSync, renameSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { randomBytes } from 'node:crypto'

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
    user: 'hamelin',
    pass: '',
    // URL token：Legado 的导入契约里没法塞 Basic 头，所以鉴权走一个可拼进 URL 的令牌。
    // 首次启动自动生成，用户不用理解它。
    token: '',
  },
  upstream: {
    // mimo = 小米云 API；local = 本机 Qwen3-TTS sidecar（macOS/MLX）
    provider: 'mimo',
    baseUrl: 'https://api.xiaomimimo.com/v1',
    keys: [],
    model: 'mimo-v2.5-tts',
    timeoutMs: 120000,
    maxRetry: 3,
    // 混合启动：冷启动前几段用 MiMo 克隆顶住，同时后台把本地模型焐热，热了切本地。
    hybrid: {
      maxCloudBootstrap: 6,
      cloudConcurrency: 2,
      targetRms: 0.126,
      warmup: true,
    },
    // 本地引擎。模型不常驻：第一次请求才拉起，空闲 idleUnloadSeconds 秒后杀掉。
    local: {
      pythonPath: '',
      serverScript: '',
      modelPath: '',
      port: 8398,
      idleUnloadSeconds: 300,
      startupTimeoutMs: 180000,
      requestTimeoutMs: 180000,
      refs: {
        narrator: { wav: '', text: '' },
        dialogue: { wav: '', text: '' },
      },
    },
  },
  voices: {
    // mode: preset | design | clone
    narrator: { mode: 'preset', voice: '冰糖', style: '温润端庄的中文女声，有从容气度，适合旁白' },
    dialogue: { mode: 'preset', voice: '苏打', style: '沉稳自然的中文男声，语速适中' },
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
    extraHeaders: {},
  },
  limits: {
    rpm: 100,
  },
  log: {
    ring: 500,
  },
}

export const PRESET_VOICES = ['mimo_default', '冰糖', '茉莉', '苏打', '白桦', 'Mia', 'Chloe', 'Milo', 'Dean']

/** 深合并：数组整体替换（keys、等），对象逐键递归。 */
export function merge(base, patch) {
  if (Array.isArray(patch) || patch === null || typeof patch !== 'object') return patch
  const out = Array.isArray(base) ? [...base] : { ...base }
  for (const [k, v] of Object.entries(patch)) {
    out[k] = k in out && out[k] && typeof out[k] === 'object' && !Array.isArray(out[k])
      ? merge(out[k], v)
      : merge(undefined, v)
  }
  return out
}

const ENV_KEYS = {
  'MIMO_TTS_PORT': (c, v) => { c.server.port = Number(v) },
  'MIMO_TTS_HOST': (c, v) => { c.server.host = v },
  'TTS_PROVIDER': (c, v) => { c.upstream.provider = v },
  'LOCAL_PYTHON': (c, v) => { c.upstream.local.pythonPath = v },
  'LOCAL_MODEL': (c, v) => { c.upstream.local.modelPath = v },
  'LOCAL_PORT': (c, v) => { c.upstream.local.port = Number(v) },
  'LOCAL_IDLE_SECONDS': (c, v) => { c.upstream.local.idleUnloadSeconds = Number(v) },
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

export function validate(cfg) {
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
  if (!['mimo', 'local', 'hybrid'].includes(provider)) problems.push('upstream.provider 必须是 mimo / local / hybrid')
  if (provider === 'local' || provider === 'hybrid') {
    const local = cfg.upstream?.local || {}
    if (!local.pythonPath) problems.push('本地引擎：upstream.local.pythonPath 不能为空')
    if (!local.modelPath) problems.push('本地引擎：upstream.local.modelPath 不能为空')
    const ref = local.refs?.narrator
    if (!ref?.wav) problems.push('本地引擎：旁白参考音（refs.narrator.wav）不能为空')
    if (!ref?.text) problems.push('本地引擎：旁白参考文本（refs.narrator.text）不能为空')
    const lp = Number(local.port)
    if (!Number.isInteger(lp) || lp < 1 || lp > 65535) problems.push('本地引擎端口必须是 1–65535')
    const idle = Number(local.idleUnloadSeconds)
    if (!Number.isFinite(idle) || idle < 0 || idle > 86400) problems.push('本地引擎空闲卸载必须是 0–86400 秒')
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
  return problems
}

export class Store {
  /**
   * @param {string} dataDir 插件数据目录（插件由宿主传入，独立运行时用 MIMO_TTS_DATA 或 ./data）
   */
  constructor(dataDir) {
    this.dataDir = dataDir
    this.file = join(dataDir, 'config.json')
    this.backupFile = `${this.file}.bak`
    this.config = null
    this.log = null
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

  /** 补丁式更新：只改传入的键，其余保留。返回 {config, problems, secrets} */
  update(patch) {
    const next = merge(merge({}, this.config), patch)
    const problems = validate(next)
    if (problems.length) return { problems, config: this.config }
    this.config = next
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
    },
    auth: { ...cfg.auth, pass: cfg.auth.pass ? '••••••' : '' },
  }
}

export function maskKey(k) {
  if (typeof k !== 'string' || k.length < 10) return '••••'
  return `${k.slice(0, 6)}…${k.slice(-4)}`
}
