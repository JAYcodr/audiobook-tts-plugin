/**
 * 表单用「扁平 path → 值」保存草稿，保存时再还原成嵌套 patch。
 * 保留已保存掩码行并支持追加新 Key（由服务端 sanitizeConfigPatch 安全还原真实 Key）。
 */

export const FIELDS = [
  { path: 'server.host', label: '监听地址', module: 'transport' },
  { path: 'server.port', label: '服务端口', module: 'transport' },
  { path: 'server.publicUrl', label: '对外地址', module: 'transport' },
  { path: 'upstream.provider', label: '渲染来源', module: 'engine' },
  { path: 'upstream.baseUrl', label: '上游地址', module: 'transport' },
  { path: 'upstream.model', label: '云端模型', module: 'engine' },
  { path: 'upstream.keys', label: 'API Key', module: 'transport' },
  { path: 'upstream.timeoutMs', label: '上游超时', module: 'transport' },
  { path: 'upstream.maxRetry', label: '最大重试', module: 'transport' },
  { path: 'upstream.hybrid.maxCloudBootstrap', label: '云顶班上限', module: 'engine' },
  { path: 'upstream.hybrid.cloudConcurrency', label: '云并发', module: 'engine' },
  { path: 'upstream.hybrid.targetRms', label: '目标响度', module: 'engine' },
  { path: 'upstream.hybrid.warmup', label: '本地预热', module: 'engine' },
  { path: 'upstream.openai.baseUrl', label: 'OpenAI 地址', module: 'openai' },
  { path: 'upstream.openai.apiKey', label: 'OpenAI Key', module: 'openai' },
  { path: 'upstream.openai.model', label: 'OpenAI 模型', module: 'openai' },
  { path: 'upstream.openai.narratorVoice', label: 'OpenAI 旁白音色', module: 'openai' },
  { path: 'upstream.openai.dialogueVoice', label: 'OpenAI 对话音色', module: 'openai' },
  { path: 'upstream.openai.responseFormat', label: 'OpenAI 响应格式', module: 'openai' },
  { path: 'upstream.openai.speed', label: 'OpenAI 语速', module: 'openai' },
  { path: 'upstream.openai.instructions', label: 'OpenAI 指令', module: 'openai' },
  { path: 'upstream.openai.timeoutMs', label: 'OpenAI 超时', module: 'openai' },
  { path: 'upstream.openai.maxRetry', label: 'OpenAI 重试', module: 'openai' },
  { path: 'upstream.local.pythonPath', label: 'Python 路径', module: 'local' },
  { path: 'upstream.local.serverScript', label: 'Sidecar 脚本', module: 'local' },
  { path: 'upstream.local.modelPath', label: '模型目录', module: 'local' },
  { path: 'upstream.local.port', label: '本地端口', module: 'local' },
  { path: 'upstream.local.idleUnloadSeconds', label: '空闲卸载', module: 'local' },
  { path: 'upstream.local.startupTimeoutMs', label: '启动超时', module: 'local' },
  { path: 'upstream.local.requestTimeoutMs', label: '请求超时', module: 'local' },
  { path: 'upstream.local.refs.narrator.refId', label: '旁白参考音选择', module: 'local' },
  { path: 'upstream.local.refs.narrator.wav', label: '旁白参考音路径', module: 'local' },
  { path: 'upstream.local.refs.narrator.text', label: '旁白参考文本', module: 'local' },
  { path: 'upstream.local.refs.dialogue.refId', label: '对话参考音选择', module: 'local' },
  { path: 'upstream.local.refs.dialogue.wav', label: '对话参考音路径', module: 'local' },
  { path: 'upstream.local.refs.dialogue.text', label: '对话参考文本', module: 'local' },
  { path: 'voices.narrator.mode', label: '旁白模式', module: 'voice' },
  { path: 'voices.narrator.voice', label: '旁白音色', module: 'voice' },
  { path: 'voices.narrator.style', label: '旁白风格', module: 'voice' },
  { path: 'voices.narrator.refId', label: '旁白参考音', module: 'voice' },
  { path: 'voices.dialogue.mode', label: '对话模式', module: 'voice' },
  { path: 'voices.dialogue.voice', label: '对话音色', module: 'voice' },
  { path: 'voices.dialogue.style', label: '对话风格', module: 'voice' },
  { path: 'voices.dialogue.refId', label: '对话参考音', module: 'voice' },
  { path: 'voiceProfiles.active', label: '音色方案', module: 'voice' },
  { path: 'voiceProfiles.items', label: '自定义音色方案', module: 'voice' },
  { path: 'textRules.enabled', label: '启用文本规则', module: 'lexicon' },
  { path: 'textRules.items', label: '文本替换规则', module: 'lexicon' },
  { path: 'synth.maxSegmentChars', label: '每段字数', module: 'synth' },
  { path: 'synth.maxTextChars', label: '最长文本', module: 'synth' },
  { path: 'synth.concurrency', label: '合成并发', module: 'synth' },
  { path: 'synth.stream', label: '流式返回', module: 'synth' },
  { path: 'cache.enabled', label: '启用缓存', module: 'synth' },
  { path: 'cache.maxEntries', label: '缓存条目', module: 'synth' },
  { path: 'cache.ttlSeconds', label: '缓存 TTL', module: 'synth' },
  { path: 'limits.rpm', label: '限速 RPM', module: 'synth' },
  { path: 'auth.enabled', label: 'Basic 鉴权', module: 'auth' },
  { path: 'auth.user', label: '用户名', module: 'auth' },
  { path: 'auth.pass', label: '口令', module: 'auth' },
  { path: 'auth.token', label: 'URL 令牌', module: 'auth' },
  { path: 'legado.name', label: 'Legado 引擎名', module: 'transport' },
  { path: 'legado.extraHeaders', label: '附加请求头', module: 'transport' },
  { path: 'log.ring', label: '日志环', module: 'auth' },
]

export const NUMERIC_FIELDS = new Set([
  'server.port', 'upstream.timeoutMs', 'upstream.maxRetry',
  'upstream.hybrid.maxCloudBootstrap', 'upstream.hybrid.cloudConcurrency', 'upstream.hybrid.targetRms',
  'upstream.openai.speed', 'upstream.openai.timeoutMs', 'upstream.openai.maxRetry',
  'upstream.local.port', 'upstream.local.idleUnloadSeconds',
  'upstream.local.startupTimeoutMs', 'upstream.local.requestTimeoutMs',
  'synth.maxSegmentChars', 'synth.maxTextChars', 'synth.concurrency',
  'cache.maxEntries', 'cache.ttlSeconds', 'limits.rpm', 'log.ring',
])

export const BOOL_FIELDS = new Set([
  'upstream.hybrid.warmup', 'synth.stream', 'cache.enabled', 'auth.enabled', 'textRules.enabled',
])

export const ARRAY_FIELDS = new Set([
  'voiceProfiles.items', 'textRules.items',
])

const str = (v, d = '') => (v == null ? d : String(v))
const cloneArr = (arr) => (Array.isArray(arr) ? JSON.parse(JSON.stringify(arr)) : [])

export function fromConfig(cfg) {
  const c = cfg || {}
  const srv = c.server || {}
  const up = c.upstream || {}
  const hy = up.hybrid || {}
  const oa = up.openai || {}
  const lo = up.local || {}
  const refs = lo.refs || {}
  const nref = refs.narrator || {}
  const dref = refs.dialogue || {}
  const voices = c.voices || {}
  const nv = voices.narrator || {}
  const dv = voices.dialogue || {}
  const vp = c.voiceProfiles || {}
  const tr = c.textRules || {}
  const synth = c.synth || {}
  const cache = c.cache || {}
  const auth = c.auth || {}
  const legado = c.legado || {}
  const limits = c.limits || {}
  const log = c.log || {}
  const headers = legado.extraHeaders && typeof legado.extraHeaders === 'object' && !Array.isArray(legado.extraHeaders)
    ? legado.extraHeaders
    : {}

  return {
    'server.host': str(srv.host, '0.0.0.0'),
    'server.port': str(srv.port, '8291'),
    'server.publicUrl': str(srv.publicUrl),
    'upstream.provider': str(up.provider, 'mimo'),
    'upstream.baseUrl': str(up.baseUrl),
    'upstream.model': str(up.model),
    'upstream.keys': Array.isArray(up.keys) ? up.keys.join('\n') : '',
    'upstream.timeoutMs': str(up.timeoutMs, '120000'),
    'upstream.maxRetry': str(up.maxRetry, '3'),
    'upstream.hybrid.maxCloudBootstrap': str(hy.maxCloudBootstrap, '6'),
    'upstream.hybrid.cloudConcurrency': str(hy.cloudConcurrency, '2'),
    'upstream.hybrid.targetRms': str(hy.targetRms, '0.126'),
    'upstream.hybrid.warmup': Boolean(hy.warmup),
    'upstream.openai.baseUrl': str(oa.baseUrl, 'https://api.openai.com/v1'),
    'upstream.openai.apiKey': str(oa.apiKey),
    'upstream.openai.model': str(oa.model, 'tts-1'),
    'upstream.openai.narratorVoice': str(oa.narratorVoice, 'alloy'),
    'upstream.openai.dialogueVoice': str(oa.dialogueVoice, 'echo'),
    'upstream.openai.responseFormat': str(oa.responseFormat, 'wav'),
    'upstream.openai.speed': str(oa.speed, '1'),
    'upstream.openai.instructions': str(oa.instructions),
    'upstream.openai.timeoutMs': str(oa.timeoutMs, '60000'),
    'upstream.openai.maxRetry': str(oa.maxRetry, '2'),
    'upstream.local.pythonPath': str(lo.pythonPath),
    'upstream.local.serverScript': str(lo.serverScript),
    'upstream.local.modelPath': str(lo.modelPath),
    'upstream.local.port': str(lo.port, '8398'),
    'upstream.local.idleUnloadSeconds': str(lo.idleUnloadSeconds, '300'),
    'upstream.local.startupTimeoutMs': str(lo.startupTimeoutMs, '180000'),
    'upstream.local.requestTimeoutMs': str(lo.requestTimeoutMs, '180000'),
    'upstream.local.refs.narrator.refId': str(nref.refId),
    'upstream.local.refs.narrator.wav': str(nref.wav),
    'upstream.local.refs.narrator.text': str(nref.text),
    'upstream.local.refs.dialogue.refId': str(dref.refId),
    'upstream.local.refs.dialogue.wav': str(dref.wav),
    'upstream.local.refs.dialogue.text': str(dref.text),
    'voices.narrator.mode': str(nv.mode, 'preset'),
    'voices.narrator.voice': str(nv.voice),
    'voices.narrator.style': str(nv.style),
    'voices.narrator.refId': str(nv.refId),
    'voices.dialogue.mode': str(dv.mode, 'preset'),
    'voices.dialogue.voice': str(dv.voice),
    'voices.dialogue.style': str(dv.style),
    'voices.dialogue.refId': str(dv.refId),
    'voiceProfiles.active': str(vp.active, 'builtin:story-warm'),
    'voiceProfiles.items': cloneArr(vp.items),
    'textRules.enabled': tr.enabled !== false,
    'textRules.items': cloneArr(tr.items),
    'synth.maxSegmentChars': str(synth.maxSegmentChars, '100'),
    'synth.maxTextChars': str(synth.maxTextChars, '10000'),
    'synth.concurrency': str(synth.concurrency, '4'),
    'synth.stream': Boolean(synth.stream),
    'cache.enabled': Boolean(cache.enabled),
    'cache.maxEntries': str(cache.maxEntries, '500'),
    'cache.ttlSeconds': str(cache.ttlSeconds, '7200'),
    'limits.rpm': str(limits.rpm, '100'),
    'auth.enabled': Boolean(auth.enabled),
    'auth.user': str(auth.user),
    'auth.pass': str(auth.pass),
    'auth.token': str(auth.token),
    'legado.name': str(legado.name, '听书值守 TTS'),
    'legado.extraHeaders': JSON.stringify(headers, null, 2),
    'log.ring': str(log.ring, '500'),
  }
}

export function diffFields(draft, applied) {
  const out = []
  if (!draft || !applied) return out
  for (const f of FIELDS) {
    if (JSON.stringify(draft[f.path]) !== JSON.stringify(applied[f.path])) {
      out.push({ path: f.path, label: f.label, module: f.module, from: applied[f.path], to: draft[f.path] })
    }
  }
  return out
}

function setPath(obj, path, value) {
  const keys = String(path).split('.')
  let cur = obj
  for (let i = 0; i < keys.length - 1; i++) {
    const k = keys[i]
    if (cur[k] == null || typeof cur[k] !== 'object') cur[k] = {}
    cur = cur[k]
  }
  cur[keys[keys.length - 1]] = value
}

export function buildPatch(draft, changes) {
  const patch = {}
  const problems = []
  for (const ch of changes) {
    const path = ch.path
    const v = draft[path]
    if (path === 'upstream.keys') {
      const lines = String(v == null ? '' : v).split(/\r?\n/).map((s) => s.trim()).filter(Boolean)
      setPath(patch, path, lines)
      continue
    }
    if (path === 'auth.pass' || path === 'upstream.openai.apiKey') {
      const s = String(v == null ? '' : v)
      if (/[\u2026\u2022\u00b7]/.test(s)) continue
      setPath(patch, path, s)
      continue
    }
    if (path === 'legado.extraHeaders') {
      let obj
      try {
        obj = JSON.parse(String(v == null ? '' : v) || '{}')
      } catch {
        problems.push('附加请求头不是合法 JSON')
        continue
      }
      if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
        problems.push('附加请求头必须是 JSON 对象')
        continue
      }
      setPath(patch, path, obj)
      continue
    }
    if (ARRAY_FIELDS.has(path)) {
      setPath(patch, path, Array.isArray(v) ? v : [])
      continue
    }
    if (BOOL_FIELDS.has(path)) {
      setPath(patch, path, Boolean(v))
      continue
    }
    if (NUMERIC_FIELDS.has(path)) {
      const n = Number(v)
      if (String(v == null ? '' : v).trim() === '' || !Number.isFinite(n)) {
        problems.push(`${ch.label} 必须是数字`)
        continue
      }
      setPath(patch, path, n)
      continue
    }
    setPath(patch, path, v == null ? '' : v)
  }
  return { patch, problems }
}

/** 构造完整草稿补丁（供未保存态 /api/preview 与 /api/text/preview 试用） */
export function buildDraftSnapshot(draft) {
  if (!draft) return null
  const { patch } = buildPatch(draft, FIELDS)
  return patch
}

export function fmtDirtyVal(v) {
  if (typeof v === 'boolean') return v ? '开' : '关'
  if (Array.isArray(v)) return `${v.length} 项`
  if (v == null || v === '') return '—'
  const s = String(v).replace(/\s+/g, ' ')
  return s.length > 34 ? `${s.slice(0, 32)}…` : s
}
