/**
 * 配置 CLI / DSH Host 工具的唯一实现。
 *
 * 目标只有一个：让「读 / 改 / 校验 / 热更新 / 导出 / 迁移」变成稳定接口，
 * agent 不必手写 config.json、也不必自己猜校验规则。
 *
 * 三条约束：
 *   1. 校验逻辑不复制：全部走 `config.mjs` 的 Store / validatePatch / sanitizeConfigPatch / redact；
 *   2. 任何输出都不出现明文密钥：展示前一律过 redact()（token 额外整段遮掉）；
 *   3. 进程退出码约定：0 成功 / 1 一般错误 / 2 校验失败 / 3 已写文件但热更新失败。
 *
 * 同一份 `runConfigAction` 既被 `bin/config.mjs`（CLI）调用，也被 `index.js`（DSH 工具）调用。
 */
import { accessSync, constants, existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { createConnection } from 'node:net'
import { homedir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import {
  DEFAULTS, Store, isMaskedSecret, merge, redact, validate, validatePatch,
} from './config.mjs'
import { validateModelDir } from './local.mjs'
import { expandHomePath } from './paths.mjs'
import { RefsStore } from './refs-store.mjs'
import { findBinary } from './tunnel-manager.mjs'

const PKG_VERSION = (() => {
  try {
    return JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')).version
  } catch {
    return 'unknown'
  }
})()

const SECRET_FULL_MASK = '••••••'
const UNSAFE_SEGMENTS = new Set(['__proto__', 'constructor', 'prototype'])
const READ_ONLY_ACTIONS = new Set(['get', 'list', 'validate', 'export', 'doctor'])
const KNOWN_COMMANDS = new Set(['get', 'set', 'list', 'validate', 'export', 'import', 'doctor'])

/** 可预期的命令行错误：直接带退出码，由 runConfigAction 统一转成结果对象。 */
export class ConfigCliError extends Error {
  constructor(message, exitCode = 1) {
    super(message)
    this.name = 'ConfigCliError'
    this.exitCode = exitCode
  }
}

/**
 * 解析插件数据目录，顺序与任务卡一致：
 * `--data` > AUDIOBOOK_TTS_DATA > MIMO_TTS_DATA > DSH 插件数据目录（旧目录存在时优先）> ./data。
 * 读操作传 `create: false`，避免体检/导出这类只读命令顺手建目录。
 *
 * 兼容旧签名 `resolveDataDir(env)`（index.js 以前就是这么导出的）：第一个参数直接给 env 对象时按旧行为处理。
 */
export function resolveDataDir(options = process.env) {
  const normalized = normalizeDataDirArgs(options)
  const { env, data, create } = normalized
  const explicit = String(data || '').trim() || env.AUDIOBOOK_TTS_DATA || env.MIMO_TTS_DATA
  if (explicit) {
    const dir = resolve(expandHomePath(explicit))
    if (create) mkdirSync(dir, { recursive: true })
    return dir
  }
  const home = env.DSH_HOME ? resolve(expandHomePath(env.DSH_HOME)) : join(homedir(), '.dsh')
  const modernDir = join(home, 'plugin-data', 'audiobook-tts-plugin')
  const legacyDir = join(home, 'plugin-data', 'mimo-tts')
  const targetDir = (!existsSync(modernDir) && existsSync(legacyDir)) ? legacyDir : modernDir
  if (!create) return targetDir
  try {
    mkdirSync(targetDir, { recursive: true })
    return targetDir
  } catch {
    return join(process.cwd(), 'data')
  }
}

function normalizeDataDirArgs(options) {
  if (!options || typeof options !== 'object') return { env: process.env, data: '', create: true }
  const keys = Object.keys(options)
  if (!keys.length) return { env: process.env, data: '', create: true }
  const looksLikeOptions = keys.some((key) => key === 'env' || key === 'data' || key === 'create')
  if (looksLikeOptions) {
    return { env: options.env || process.env, data: options.data || '', create: options.create !== false }
  }
  // 旧签名：resolveDataDir({ DSH_HOME })，直接当 env 用
  return { env: options, data: '', create: true }
}

/** 只读快照：解析 config.json 并以 DEFAULTS 补齐；不建目录、不生成令牌、不改名坏文件。 */
export function readConfigSnapshot(dataDir) {
  const file = join(dataDir, 'config.json')
  const exists = existsSync(file)
  let raw = null
  let parseError = ''
  let bytes = 0
  if (exists) {
    try {
      bytes = statSync(file).size
      const parsed = JSON.parse(readFileSync(file, 'utf8'))
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        parseError = '根节点必须是 JSON 对象'
      } else {
        raw = parsed
      }
    } catch (err) {
      parseError = err instanceof SyntaxError ? `JSON 语法错误：${err.message}` : `读取失败：${err?.message || err}`
    }
  }
  return {
    file,
    exists,
    raw,
    parseError,
    bytes,
    config: merge(merge({}, DEFAULTS), raw || {}),
  }
}

/** 展示用配置：密钥走 maskKey，token 整段遮掉（12 位令牌用 maskKey 等于全露）。 */
export function redactedConfig(config) {
  const out = redact(config)
  out.auth = { ...out.auth, token: config?.auth?.token ? SECRET_FULL_MASK : '' }
  return out
}

/** 被掩码的密钥字段数量（导出摘要用）。 */
function countMaskedFields(config) {
  let count = Array.isArray(config?.upstream?.keys) ? config.upstream.keys.length : 0
  if (config?.upstream?.openai?.apiKey) count += 1
  if (config?.openaiServer?.apiKey) count += 1
  if (config?.auth?.pass) count += 1
  if (config?.auth?.token) count += 1
  return count
}

/** 点路径 → 段数组；拒绝空段与原型链污染键。 */
export function parsePath(path) {
  const text = String(path || '').trim()
  if (!text) throw new ConfigCliError('路径不能为空，例如 upstream.provider')
  const segments = text.split('.')
  for (const segment of segments) {
    if (!segment) throw new ConfigCliError(`路径 "${text}" 里有空段（连续的点）`)
    if (UNSAFE_SEGMENTS.has(segment)) throw new ConfigCliError(`路径 "${text}" 含不允许的键名：${segment}`)
  }
  return segments
}

function isIndex(segment) {
  return /^\d+$/.test(String(segment))
}

function toIndex(segment) {
  if (!isIndex(segment)) return null
  return Number(segment)
}

/** 按点路径读取（数组用数字索引）。 */
export function getAtPath(root, segments) {
  let current = root
  for (let i = 0; i < segments.length; i += 1) {
    const segment = segments[i]
    if (Array.isArray(current)) {
      const index = toIndex(segment)
      if (index === null || index < 0 || index >= current.length) return { found: false, missingAt: i }
      current = current[index]
    } else if (current && typeof current === 'object') {
      if (!Object.hasOwn(current, segment)) return { found: false, missingAt: i }
      current = current[segment]
    } else {
      return { found: false, missingAt: i }
    }
  }
  return { found: true, value: current }
}

function notFoundMessage(root, segments, path) {
  let current = root
  let missingAt = segments.length
  for (let i = 0; i < segments.length; i += 1) {
    const segment = segments[i]
    if (Array.isArray(current)) {
      const index = toIndex(segment)
      if (index === null || index < 0 || index >= current.length) { missingAt = i; break }
      current = current[index]
    } else if (current && typeof current === 'object' && Object.hasOwn(current, segment)) {
      current = current[segment]
    } else {
      missingAt = i
      break
    }
  }
  let message = `配置里没有路径 "${path}"`
  if (missingAt < segments.length && current && typeof current === 'object' && !Array.isArray(current)) {
    const keys = Object.keys(current).slice(0, 20)
    if (keys.length) message += `；当前位置可用键：${keys.join(', ')}`
  } else if (Array.isArray(current)) {
    message += `；当前是数组（长度 ${current.length}），索引请用数字`
  }
  return message
}

function nestPatch(segments, value) {
  let patch = value
  for (let i = segments.length - 1; i >= 0; i -= 1) {
    patch = { [segments[i]]: patch }
  }
  return patch
}

/** 在数组副本上按剩余路径赋值，支持 `keys.0` 与 `items.0.voices.narrator`。 */
function setInArray(array, segments, value, label) {
  const index = toIndex(segments[0])
  if (index === null) {
    throw new ConfigCliError(`路径 ${label}.${segments[0]} 需要数组索引（数字）`)
  }
  if (index < 0 || index > array.length) {
    throw new ConfigCliError(`数组索引 ${index} 超出范围（${label} 当前长度 ${array.length}，追加请用 ${array.length}）`)
  }
  if (segments.length === 1) {
    array[index] = value
    return
  }
  const nextSegment = segments[1]
  let child = array[index]
  if (child === undefined) {
    child = isIndex(nextSegment) ? [] : {}
  } else {
    child = structuredClone(child)
  }
  if (isIndex(nextSegment)) {
    if (!Array.isArray(child)) throw new ConfigCliError(`路径 ${label}.${segments[0]} 不是数组，不能用索引赋值`)
    setInArray(child, segments.slice(1), value, `${label}.${segments[0]}`)
  } else {
    if (!child || typeof child !== 'object' || Array.isArray(child)) {
      throw new ConfigCliError(`路径 ${label}.${segments[0]} 不是对象，不能用键名赋值`)
    }
    child[nextSegment] = segments.length === 2 ? value : buildChild(child[nextSegment], segments.slice(2), value, `${label}.${segments[0]}.${nextSegment}`)
  }
  array[index] = child
}

function buildChild(current, segments, value, label) {
  if (segments.length === 0) return value
  if (isIndex(segments[0])) {
    const base = Array.isArray(current) ? structuredClone(current) : (current === undefined ? [] : null)
    if (!base) throw new ConfigCliError(`路径 ${label} 不是数组，不能用索引赋值`)
    setInArray(base, segments, value, label)
    return base
  }
  const child = current && typeof current === 'object' && !Array.isArray(current) ? structuredClone(current) : {}
  child[segments[0]] = segments.length === 1 ? value : buildChild(child[segments[0]], segments.slice(1), value, `${label}.${segments[0]}`)
  return child
}

/**
 * 构造一个「能完整表达数组」的补丁。
 * 深合并对数组是整体替换，所以带索引的路径必须把整个数组一起放进补丁里，
 * 否则 `set upstream.keys.0 x` 会把其余 Key 抹掉。
 */
export function buildPatch(currentConfig, segments, value) {
  if (!segments.length) throw new ConfigCliError('路径不能为空')
  if (isIndex(segments[0])) {
    throw new ConfigCliError('路径必须以顶层配置键开头，例如 upstream.keys.0')
  }
  const firstIndexPosition = segments.findIndex((segment) => isIndex(segment))
  if (firstIndexPosition < 0) {
    return { patch: nestPatch(segments, value), path: segments.join('.') }
  }
  const arrayRootSegments = segments.slice(0, firstIndexPosition)
  const arrayLabel = arrayRootSegments.join('.')
  const hit = getAtPath(currentConfig, arrayRootSegments)
  let array
  if (!hit.found) array = []
  else if (!Array.isArray(hit.value)) throw new ConfigCliError(`路径 ${arrayLabel} 不是数组，不能用索引赋值`)
  else array = structuredClone(hit.value)
  setInArray(array, segments.slice(firstIndexPosition), value, arrayLabel)
  return { patch: nestPatch(arrayRootSegments, array), path: segments.join('.') }
}

/** 值解析：默认先按 JSON 解析，失败当字符串；`--type` 可强制。 */
export function parseCliValue(raw, type) {
  const text = String(raw)
  const mode = String(type || '').trim().toLowerCase()
  if (mode) {
    if (mode === 'string') return text
    if (mode === 'number') {
      const number = Number(text)
      if (!text.trim() || !Number.isFinite(number)) throw new ConfigCliError(`无法把 "${text}" 解析为数字`)
      return number
    }
    if (mode === 'boolean') {
      const token = text.trim().toLowerCase()
      if (['true', '1', 'yes', 'on'].includes(token)) return true
      if (['false', '0', 'no', 'off'].includes(token)) return false
      throw new ConfigCliError(`无法把 "${text}" 解析为布尔值（true / false）`)
    }
    if (mode === 'json') {
      try {
        return JSON.parse(text)
      } catch (err) {
        throw new ConfigCliError(`值不是合法 JSON：${err.message}`)
      }
    }
    throw new ConfigCliError(`未知的 --type：${type}（可选 string / number / boolean / json）`)
  }
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

/** 叶子节点展平：对象递归，数组与标量当叶子。 */
export function flattenLeaves(value, prefix = '', out = []) {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const keys = Object.keys(value)
    if (!keys.length) {
      out.push({ path: prefix, value })
      return out
    }
    for (const key of keys) flattenLeaves(value[key], prefix ? `${prefix}.${key}` : key, out)
    return out
  }
  out.push({ path: prefix, value })
  return out
}

/** 两份配置的叶子差异（入参应已脱敏）。 */
export function diffConfigs(before, after) {
  const left = new Map(flattenLeaves(before).map((item) => [item.path, item.value]))
  const right = new Map(flattenLeaves(after).map((item) => [item.path, item.value]))
  const paths = [...new Set([...left.keys(), ...right.keys()])].sort()
  const changed = []
  for (const path of paths) {
    const from = left.get(path)
    const to = right.get(path)
    if (JSON.stringify(from) !== JSON.stringify(to)) changed.push({ path, from, to })
  }
  return changed
}

function previewValue(value, max = 100) {
  if (value === undefined) return '（未设置）'
  if (typeof value === 'string') return value.length > max ? `${value.slice(0, max)}…` : value
  let text
  try {
    text = JSON.stringify(value)
  } catch {
    text = String(value)
  }
  return text.length > max ? `${text.slice(0, max)}…` : text
}

function openRefs(dataDir) {
  try {
    return new RefsStore({ dataDir }).load()
  } catch {
    return null
  }
}

/** 可写 Store：坏 JSON 时拒绝写入（Store.load 会把坏文件改名并回落默认值，不能让它掩盖问题）。 */
function openWritableStore(dataDir) {
  const snapshot = readConfigSnapshot(dataDir)
  if (snapshot.exists && snapshot.parseError) {
    throw new ConfigCliError(`config.json 无法解析：${snapshot.parseError}。为避免覆盖已停止写入，请先修复，或从 ${snapshot.file}.bak 恢复`)
  }
  const notes = []
  const store = new Store(dataDir)
  store.log = (line) => notes.push(line)
  try {
    store.load({})
  } catch (err) {
    throw new ConfigCliError(`读取配置失败：${err?.message || err}`)
  }
  const refs = new RefsStore({ dataDir, log: (line) => notes.push(line) })
  try {
    refs.load()
  } catch {
    /* 索引损坏不影响 CLI 主流程 */
  }
  store.refsStore = refs
  return { store, notes }
}

function realHost(host) {
  const text = String(host || '').trim()
  if (!text || text === '0.0.0.0' || text === '::') return '127.0.0.1'
  return text
}

async function probeHealth({ host, port, timeoutMs = 3000, fetchImpl = fetch }) {
  try {
    const res = await fetchImpl(`http://${host}:${port}/health`, { signal: AbortSignal.timeout(timeoutMs) })
    if (!res.ok) return { reachable: true, isService: false, status: res.status }
    const body = await res.json().catch(() => null)
    return { reachable: true, isService: Boolean(body && body.status === 'ok'), status: res.status, body }
  } catch (err) {
    return { reachable: false, isService: false, error: err?.code || err?.name || 'network_error' }
  }
}

/**
 * 热更新：探活 → PUT /api/config（带 token，只在内部请求里出现）→ 归类结果。
 * status: hot（已应用）/ rejected（422）/ failed（网络或其他状态）/ no-service（服务没在跑）/ skipped。
 */
async function hotReload(patch, config, options = {}) {
  const fetchImpl = options.fetchImpl || fetch
  const port = Number(config?.server?.port)
  const host = realHost(config?.server?.host)
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    return { attempted: false, status: 'failed', message: `配置里的 server.port 无效（${config?.server?.port}），无法热更新` }
  }
  const probe = await probeHealth({ host, port, timeoutMs: 3000, fetchImpl: options.fetchImpl })
  if (!probe.reachable) {
    return { attempted: true, status: 'no-service', serviceUrl: `http://${host}:${port}`, message: '服务未运行，配置已写入，下次启动生效' }
  }
  if (!probe.isService) {
    return { attempted: true, status: 'no-service', serviceUrl: `http://${host}:${port}`, message: '该端口上的服务不是听书服务（/health 不匹配），配置已写入，需手动重启听书服务生效' }
  }
  const token = String(config?.auth?.token || '')
  const url = `http://${host}:${port}/api/config${token ? `?token=${encodeURIComponent(token)}` : ''}`
  try {
    const res = await fetchImpl(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
      signal: AbortSignal.timeout(10_000),
    })
    if (res.status === 200) {
      return { attempted: true, status: 'hot', serviceUrl: `http://${host}:${port}`, message: '已热更新（服务已应用新配置）' }
    }
    if (res.status === 422) {
      const body = await res.json().catch(() => ({}))
      const problems = Array.isArray(body.problems) ? body.problems : [String(body.error || '服务拒绝了补丁')]
      return {
        attempted: true,
        status: 'rejected',
        serviceUrl: `http://${host}:${port}`,
        problems,
        message: '文件已更新，服务拒绝该补丁，请检查',
      }
    }
    return { attempted: true, status: 'failed', serviceUrl: `http://${host}:${port}`, httpStatus: res.status, message: `文件已更新，热更新失败（HTTP ${res.status}），需重启服务生效` }
  } catch (err) {
    return {
      attempted: true,
      status: 'failed',
      serviceUrl: `http://${host}:${port}`,
      error: err?.code || err?.name || 'network_error',
      message: '文件已更新，热更新请求失败，需重启服务生效',
    }
  }
}

function failure(action, message, exitCode = 1, extra = {}) {
  return { ok: false, action, exitCode, error: message, problems: [], ...extra }
}

/** 导入时把「整段遮罩」的 token 去掉：保留现有令牌，绝不把 •••••• 写进配置。 */
function stripMaskedToken(patch) {
  if (!patch || typeof patch !== 'object' || Array.isArray(patch)) return patch
  if (patch.auth && typeof patch.auth === 'object' && !Array.isArray(patch.auth) && isMaskedSecret(patch.auth.token)) {
    const copy = structuredClone(patch)
    delete copy.auth.token
    return copy
  }
  return patch
}

function getAction(args, dataDir) {
  const path = String(args.path || '').trim()
  if (!path) throw new ConfigCliError('get 需要点路径，例如 upstream.provider')
  const segments = parsePath(path)
  const snapshot = readConfigSnapshot(dataDir)
  if (!snapshot.exists) throw new ConfigCliError(`配置文件不存在：${snapshot.file}（先运行 set / import，或启动一次服务）`)
  if (snapshot.parseError) throw new ConfigCliError(`${snapshot.file} 无法解析：${snapshot.parseError}`)
  const hit = getAtPath(snapshot.config, segments)
  if (!hit.found) throw new ConfigCliError(notFoundMessage(snapshot.config, segments, path))
  const masked = getAtPath(redactedConfig(snapshot.config), segments)
  return {
    ok: true,
    action: 'get',
    exitCode: 0,
    path,
    value: masked.found ? masked.value : undefined,
    dataDir,
    configFile: snapshot.file,
  }
}

function describeValue(value) {
  if (Array.isArray(value)) return `数组 · ${value.length} 项`
  if (value && typeof value === 'object') return `对象 · ${Object.keys(value).length} 个键`
  if (typeof value === 'string') return '字符串'
  if (typeof value === 'number') return '数字'
  if (typeof value === 'boolean') return '布尔'
  if (value === null) return 'null'
  return typeof value
}

function listAction(args, dataDir) {
  const snapshot = readConfigSnapshot(dataDir)
  if (!snapshot.exists) throw new ConfigCliError(`配置文件不存在：${snapshot.file}`)
  if (snapshot.parseError) throw new ConfigCliError(`${snapshot.file} 无法解析：${snapshot.parseError}`)
  const group = String(args.group || '').trim()
  const masked = redactedConfig(snapshot.config)
  if (group) {
    const segments = parsePath(group)
    const hit = getAtPath(masked, segments)
    if (!hit.found) throw new ConfigCliError(notFoundMessage(masked, segments, group))
    return { ok: true, action: 'list', exitCode: 0, group, value: hit.value, dataDir, configFile: snapshot.file }
  }
  const groups = Object.keys(snapshot.config).map((name) => ({
    name,
    type: describeValue(snapshot.config[name]),
  }))
  return { ok: true, action: 'list', exitCode: 0, groups, dataDir, configFile: snapshot.file }
}

function validateAction(args, dataDir) {
  const snapshot = readConfigSnapshot(dataDir)
  if (!snapshot.exists) throw new ConfigCliError(`配置文件不存在：${snapshot.file}`)
  if (snapshot.parseError) throw new ConfigCliError(`${snapshot.file} 无法解析：${snapshot.parseError}`)
  const refs = openRefs(dataDir)
  const problems = validate(snapshot.config, refs ? { refsStore: refs } : {})
  return {
    ok: problems.length === 0,
    action: 'validate',
    exitCode: problems.length ? 2 : 0,
    problems,
    ...(problems.length ? { error: '配置校验未通过' } : {}),
    dataDir,
    configFile: snapshot.file,
  }
}

function exportAction(args, dataDir, cwd) {
  const targetText = String(args.path || '').trim()
  if (!targetText) throw new ConfigCliError('export 需要导出文件路径')
  const snapshot = readConfigSnapshot(dataDir)
  if (!snapshot.exists) throw new ConfigCliError(`配置文件不存在：${snapshot.file}`)
  if (snapshot.parseError) throw new ConfigCliError(`${snapshot.file} 无法解析：${snapshot.parseError}`)
  const includeSecrets = Boolean(args.includeSecrets)
  const payload = includeSecrets ? snapshot.config : redactedConfig(snapshot.config)
  const target = resolve(cwd, targetText)
  const parent = dirname(target)
  if (!existsSync(parent)) throw new ConfigCliError(`导出目录不存在：${parent}`)
  const text = `${JSON.stringify(payload, null, 2)}\n`
  writeFileSync(target, text, { mode: includeSecrets ? 0o600 : 0o644 })
  const result = {
    ok: true,
    action: 'export',
    exitCode: 0,
    file: target,
    includeSecrets,
    maskedFields: includeSecrets ? 0 : countMaskedFields(snapshot.config),
    bytes: Buffer.byteLength(text),
    dataDir,
    configFile: snapshot.file,
  }
  if (includeSecrets) result.warning = '已导出明文密钥（含 API Key / token / 口令），请妥善保管并限制文件权限'
  return result
}

async function importAction(args, dataDir, cwd, options) {
  const sourceText = String(args.path || '').trim()
  if (!sourceText) throw new ConfigCliError('import 需要导入文件路径')
  const source = resolve(cwd, sourceText)
  let text
  try {
    text = readFileSync(source, 'utf8')
  } catch (err) {
    throw new ConfigCliError(`读取导入文件失败：${err?.message || err}`)
  }
  let parsed
  try {
    parsed = JSON.parse(text)
  } catch (err) {
    throw new ConfigCliError(`导入文件不是合法 JSON：${err.message}`)
  }
  const patch = stripMaskedToken(parsed)
  const opened = openWritableStore(dataDir)
  const { store } = opened
  const beforeConfig = structuredClone(store.config)
  const checked = validatePatch(beforeConfig, patch, { refsStore: store.refsStore })
  if (checked.problems?.length) {
    return {
      ok: false,
      action: 'import',
      exitCode: 2,
      error: '导入配置校验未通过，未写入文件',
      problems: checked.problems,
      dataDir,
      configFile: store.file,
    }
  }
  const dryRun = Boolean(args.dryRun)
  const before = redactedConfig(beforeConfig)
  const projected = redactedConfig(checked.merged)
  const projectedChanges = diffConfigs(before, projected)
  if (dryRun) {
    return {
      ok: true,
      action: 'import',
      exitCode: 0,
      dryRun: true,
      changed: projectedChanges,
      dataDir,
      configFile: store.file,
      warnings: opened.notes,
    }
  }
  const updated = store.update(patch)
  if (updated.problems?.length) {
    return {
      ok: false,
      action: 'import',
      exitCode: 2,
      error: '导入配置校验未通过，未写入文件',
      problems: updated.problems,
      dataDir,
      configFile: store.file,
    }
  }
  const after = redactedConfig(store.config)
  const changed = diffConfigs(before, after)
  let reload
  if (!changed.length) {
    reload = { attempted: false, status: 'skipped', message: '配置无变化，无需热更新' }
  } else if (args.noReload) {
    reload = { attempted: false, status: 'skipped', message: '已跳过热更新（--no-reload）' }
  } else {
    reload = await hotReload(patch, store.config, options)
  }
  const hardFail = reload.status === 'rejected' || reload.status === 'failed'
  return {
    ok: !hardFail,
    action: 'import',
    exitCode: hardFail ? 3 : 0,
    dryRun: false,
    changed,
    reload,
    ...(reload.problems ? { problems: reload.problems } : {}),
    warnings: opened.notes,
    dataDir,
    configFile: store.file,
  }
}

async function setAction(args, dataDir, options) {
  const path = String(args.path || '').trim()
  if (!path) throw new ConfigCliError('set 需要点路径，例如 upstream.provider')
  if (args.value === undefined) throw new ConfigCliError('set 需要值，例如 `config set upstream.provider hybrid`')
  const segments = parsePath(path)
  const opened = openWritableStore(dataDir)
  const { store } = opened
  const beforeConfig = structuredClone(store.config)
  const maskedBefore = getAtPath(redactedConfig(beforeConfig), segments)
  const built = buildPatch(store.config, segments, args.value)
  const warnings = [...opened.notes]
  if (!maskedBefore.found && !segments.some((segment) => isIndex(segment))) {
    warnings.push(`路径 ${path} 原本不存在，已作为新键写入；确认不是拼写错误`)
  }
  const updated = store.update(built.patch)
  if (updated.problems?.length) {
    return {
      ok: false,
      action: 'set',
      exitCode: 2,
      path,
      error: '配置校验未通过，未写入文件',
      problems: updated.problems,
      dataDir,
      configFile: store.file,
    }
  }
  const maskedAfter = getAtPath(redactedConfig(store.config), segments)
  const before = maskedBefore.found ? maskedBefore.value : undefined
  const after = maskedAfter.found ? maskedAfter.value : undefined
  const changed = JSON.stringify(before) !== JSON.stringify(after)
  let reload
  if (args.noReload) {
    reload = { attempted: false, status: 'skipped', message: '已跳过热更新（--no-reload）' }
  } else {
    reload = await hotReload(built.patch, store.config, options)
  }
  const hardFail = reload.status === 'rejected' || reload.status === 'failed'
  return {
    ok: !hardFail,
    action: 'set',
    exitCode: hardFail ? 3 : 0,
    path,
    before,
    after,
    changed,
    fileUpdated: true,
    reload,
    ...(reload.problems ? { problems: reload.problems } : {}),
    warnings,
    dataDir,
    configFile: store.file,
  }
}

function fileSizeMb(file) {
  try {
    return Math.round(statSync(file).size / 1048576)
  } catch {
    return 0
  }
}

function check(id, label, status, message, hint, extra = {}) {
  return { id, label, status, message, ...(hint ? { hint } : {}), ...extra }
}

function checkDataDir(dataDir) {
  if (!existsSync(dataDir)) {
    return check('dataDir', '数据目录', 'warn', `目录不存在：${dataDir}`, '运行 set / import 会自动创建')
  }
  try {
    accessSync(dataDir, constants.W_OK)
  } catch {
    return check('dataDir', '数据目录', 'fail', `目录不可写：${dataDir}`, '检查目录权限，或用 --data 指定可写目录')
  }
  return check('dataDir', '数据目录', 'pass', dataDir)
}

function checkLocalEngine(config, dataDir) {
  const provider = config?.upstream?.provider || 'mimo'
  const relevant = provider === 'local' || provider === 'hybrid'
  const local = config?.upstream?.local || {}
  const venv = expandHomePath(local.pythonPath) || join(dataDir, 'venv', 'bin', 'python')
  const modelPath = expandHomePath(local.modelPath) || join(dataDir, 'models', 'qwen3tts-0.6b-base-8bit')
  const venvExists = Boolean(venv && existsSync(venv))
  let modelError = ''
  try {
    validateModelDir(modelPath)
  } catch (err) {
    modelError = String(err?.message || err)
  }
  const vocoderMb = fileSizeMb(join(modelPath, 'speech_tokenizer', 'model.safetensors'))
  const modelMb = fileSizeMb(join(modelPath, 'model.safetensors'))

  if (!relevant) {
    if (venvExists && !modelError) {
      return check('localEngine', '本地引擎', 'pass', `已就绪（当前引擎 ${provider}，暂未启用）：主权重 ${modelMb} MB，声码器 ${vocoderMb} MB`)
    }
    return check('localEngine', '本地引擎', 'skip', `当前引擎 ${provider}，本地引擎未启用（可选）`)
  }
  if (!venvExists) {
    return check('localEngine', '本地引擎', 'fail', `venv Python 不存在：${venv || '(未配置)'}`, '在控制台「向导抽屉」一键安装，或设置 upstream.local.pythonPath')
  }
  if (modelError) {
    return check('localEngine', '本地引擎', 'fail', '模型目录不完整', modelError)
  }
  return check('localEngine', '本地引擎', 'pass', `venv 就绪；模型 ${modelPath}（主权重 ${modelMb} MB，声码器 ${vocoderMb} MB）`)
}

function checkPort(host, port, timeoutMs = 1500) {
  return new Promise((resolvePromise) => {
    if (!Number.isInteger(port) || port < 1 || port > 65535) {
      resolvePromise({ open: false, invalid: true })
      return
    }
    const socket = createConnection({ host, port })
    let settled = false
    const finish = (state) => {
      if (settled) return
      settled = true
      socket.destroy()
      resolvePromise(state)
    }
    socket.setTimeout(timeoutMs)
    socket.once('connect', () => finish({ open: true }))
    socket.once('timeout', () => finish({ open: false, code: 'ETIMEDOUT' }))
    socket.once('error', (err) => finish({ open: false, code: err?.code || 'ECONNREFUSED' }))
  })
}

async function doctorAction(dataDir, options) {
  const snapshot = readConfigSnapshot(dataDir)
  const checks = []

  if (!snapshot.exists) {
    checks.push(check('config', '配置文件', 'warn', `配置文件不存在：${snapshot.file}`, '运行 set / import，或启动一次服务会自动创建'))
  } else if (snapshot.parseError) {
    checks.push(check('config', '配置文件', 'fail', `config.json 无法解析：${snapshot.parseError}`, `先修复，或从 ${snapshot.file}.bak 恢复`))
  } else {
    checks.push(check('config', '配置文件', 'pass', `config.json 可解析（${snapshot.bytes} 字节）`))
  }

  if (snapshot.exists && !snapshot.parseError) {
    const refs = openRefs(dataDir)
    const problems = validate(snapshot.config, refs ? { refsStore: refs } : {})
    checks.push(problems.length
      ? check('validation', '配置校验', 'fail', `校验未通过（${problems.length} 项）`, problems[0], { problems })
      : check('validation', '配置校验', 'pass', 'validate 校验通过'))

    const defaultPaths = flattenLeaves(DEFAULTS).map((item) => item.path)
    const missing = defaultPaths.filter((path) => !getAtPath(snapshot.raw, path.split('.')).found)
    if (missing.length) {
      checks.push(check('defaults', '默认结构', 'warn', `配置落后于默认结构：缺 ${missing.length} 个键`, missing.slice(0, 8).join('、') + (missing.length > 8 ? ' …' : ''), { missing }))
    } else {
      checks.push(check('defaults', '默认结构', 'pass', '未缺默认键'))
    }
    const extraKeys = Object.keys(snapshot.raw).filter((key) => !Object.hasOwn(DEFAULTS, key))
    if (extraKeys.length) {
      checks.push(check('extras', '未知顶层键', 'warn', `默认结构之外的顶层键：${extraKeys.join('、')}`, '可能是旧版本残留或手写键，确认无用后可删除', { extraKeys }))
    }
  } else {
    checks.push(check('validation', '配置校验', 'skip', '无可用配置文件，跳过校验'))
    checks.push(check('defaults', '默认结构', 'skip', '无可用配置文件，跳过'))
  }

  checks.push(checkDataDir(dataDir))

  const port = Number(snapshot.config.server?.port)
  const host = realHost(snapshot.config.server?.host)
  const portState = await checkPort(host, port)
  if (portState.invalid) {
    checks.push(check('port', '服务端口', 'fail', `server.port 无效：${snapshot.config.server?.port}`, '改成 1–65535 之间的整数'))
  } else {
    checks.push(portState.open
      ? check('port', '服务端口', 'pass', `端口 ${port} 已被占用（${host}）`)
      : check('port', '服务端口', 'pass', `端口 ${port} 空闲（服务未运行）`))
  }

  const health = await probeHealth({ host, port, timeoutMs: 3000, fetchImpl: options.fetchImpl })
  if (health.isService) {
    const body = health.body || {}
    const mismatch = body.version && body.version !== PKG_VERSION
      ? `；注意版本不一致：服务 ${body.version}，本地包 ${PKG_VERSION}`
      : ''
    checks.push(check('service', '听书服务', 'pass', `运行中：http://${host}:${port}（引擎 ${body.provider || '未知'}，v${body.version || '?'}）${mismatch}`))
  } else if (health.reachable) {
    checks.push(check('service', '听书服务', 'warn', `端口 ${port} 有 HTTP 响应，但不是听书服务`, '换一个 server.port，或停掉占用端口的进程'))
  } else {
    checks.push(check('service', '听书服务', 'warn', '服务未运行（离线配置不受影响）', `启动：node bin/audiobook-tts.mjs --data ${dataDir}`))
  }

  checks.push(checkLocalEngine(snapshot.config, dataDir))

  const ffmpeg = findBinary('ffmpeg')
  checks.push(ffmpeg
    ? check('ffmpeg', 'ffmpeg', 'pass', `已安装：${ffmpeg}`)
    : check('ffmpeg', 'ffmpeg', 'warn', '未找到 ffmpeg', '后续音视频处理（issue #2）会用到；macOS 可 brew install ffmpeg'))

  const tunnelTools = ['cloudflared', 'tailscale', 'wrangler']
    .map((name) => ({ name, path: findBinary(name) }))
    .filter((item) => item.path)
  checks.push(tunnelTools.length
    ? check('tunnelTools', '公网接入工具', 'pass', `已安装：${tunnelTools.map((item) => item.name).join(' / ')}`)
    : check('tunnelTools', '公网接入工具', 'warn', '未检测到 cloudflared / tailscale / wrangler', '公网 HTTPS 四选一为可选项，需要时再装'))

  const summary = { pass: 0, warn: 0, fail: 0, skip: 0 }
  for (const item of checks) summary[item.status] = (summary[item.status] || 0) + 1

  return {
    ok: summary.fail === 0,
    action: 'doctor',
    exitCode: 0,
    version: PKG_VERSION,
    dataDir,
    configFile: snapshot.file,
    configExists: snapshot.exists,
    checks,
    summary,
  }
}

/**
 * 唯一入口：CLI 与 DSH 工具都调它。
 * @param {object} args action / path / value / data / group / type / noReload / includeSecrets / dryRun
 * @param {object} [options] env / cwd / fetchImpl
 */
export async function runConfigAction(args = {}, options = {}) {
  const action = String(args.action || '').trim()
  const env = options.env || process.env
  const cwd = options.cwd || process.cwd()
  try {
    if (!action) return failure('', '缺少 action（get / set / list / validate / export / import / doctor）')
    if (!KNOWN_COMMANDS.has(action)) return failure(action, `未知的 action："${action}"`)
    const dataDir = resolveDataDir({ env, data: args.data || '', create: !READ_ONLY_ACTIONS.has(action) })
    if (action === 'get') return getAction(args, dataDir)
    if (action === 'set') return await setAction(args, dataDir, options)
    if (action === 'list') return listAction(args, dataDir)
    if (action === 'validate') return validateAction(args, dataDir)
    if (action === 'export') return exportAction(args, dataDir, cwd)
    if (action === 'import') return await importAction(args, dataDir, cwd, options)
    return await doctorAction(dataDir, options)
  } catch (err) {
    const exitCode = err instanceof ConfigCliError ? err.exitCode : 1
    return failure(action, err?.message || String(err), exitCode)
  }
}

/** 参数表：位置参数按命令取，选项已解析成 camelCase。 */
export function parseCliArgv(argv = []) {
  const valueFlags = new Map([['--data', 'data'], ['--group', 'group'], ['--type', 'type']])
  const booleanFlags = new Map([
    ['--json', 'json'],
    ['--no-reload', 'noReload'],
    ['--include-secrets', 'includeSecrets'],
    ['--dry-run', 'dryRun'],
  ])
  const positionals = []
  const opts = { json: false, noReload: false, includeSecrets: false, dryRun: false }
  for (let i = 0; i < argv.length; i += 1) {
    const arg = String(argv[i])
    if (arg === '--') {
      positionals.push(...argv.slice(i + 1).map(String))
      break
    }
    if (arg === '-h' || arg === '--help') {
      opts.help = true
      continue
    }
    if (arg.startsWith('--')) {
      const eq = arg.indexOf('=')
      const name = eq >= 0 ? arg.slice(0, eq) : arg
      const inline = eq >= 0 ? arg.slice(eq + 1) : undefined
      if (valueFlags.has(name)) {
        const value = inline !== undefined ? inline : argv[i + 1]
        if (value === undefined) throw new ConfigCliError(`选项 ${name} 缺少值`)
        if (inline === undefined) i += 1
        opts[valueFlags.get(name)] = String(value)
        continue
      }
      if (booleanFlags.has(name)) {
        if (inline !== undefined) throw new ConfigCliError(`选项 ${name} 不接受值`)
        opts[booleanFlags.get(name)] = true
        continue
      }
      throw new ConfigCliError(`未知选项：${name}`)
    }
    if (arg.startsWith('-') && arg.length > 1 && !/^-\d/.test(arg)) {
      throw new ConfigCliError(`未知选项：${arg}`)
    }
    positionals.push(arg)
  }
  const command = positionals.shift() || ''
  return { command, positionals, opts }
}

export function usageText() {
  return [
    '用法：audiobook-tts config <命令> [参数] [选项]',
    '',
    '命令：',
    '  get <路径>                读取配置（密钥自动脱敏）',
    '  set <路径> <值>           修改配置，并尝试热更新运行中的服务',
    '  list [--group <组>]       列出顶层分组，或查看某一组（脱敏）',
    '  validate                  只读校验当前 config.json',
    '  export <文件>             导出配置（默认脱敏）',
    '  import <文件>             导入配置（先校验，失败不落盘）',
    '  doctor                    离线体检，输出 JSON 或清单',
    '',
    '选项：',
    '  --data <目录>             数据目录（默认 ~/.dsh/plugin-data/audiobook-tts-plugin）',
    '  --json                    输出机器可读 JSON',
    '  --type <类型>             set 的值类型：string / number / boolean / json',
    '  --no-reload               只写文件，不热更新',
    '  --include-secrets         export 时导出明文密钥（危险）',
    '  --dry-run                 import 时只打印差异，不写入',
    '  -h, --help                显示帮助',
    '',
    '路径示例：upstream.provider、upstream.keys.0、voices.narrator.voice',
    '退出码：0 成功；1 一般错误；2 校验失败；3 已写文件但热更新失败',
  ].join('\n')
}

function commandArgs(command, positionals, opts) {
  const [first, second] = positionals
  const extra = (names) => {
    if (positionals.length !== names) {
      throw new ConfigCliError(`${command} 需要 ${names} 个位置参数，实际收到 ${positionals.length} 个`)
    }
  }
  if (command === 'get') {
    extra(1)
    return { action: 'get', path: first, data: opts.data }
  }
  if (command === 'set') {
    extra(2)
    return { action: 'set', path: first, value: parseCliValue(second, opts.type), data: opts.data, noReload: opts.noReload }
  }
  if (command === 'list') {
    extra(0)
    return { action: 'list', group: opts.group, data: opts.data }
  }
  if (command === 'validate') {
    extra(0)
    return { action: 'validate', data: opts.data }
  }
  if (command === 'export') {
    extra(1)
    return { action: 'export', path: first, includeSecrets: opts.includeSecrets, data: opts.data }
  }
  if (command === 'import') {
    extra(1)
    return { action: 'import', path: first, dryRun: opts.dryRun, noReload: opts.noReload, data: opts.data }
  }
  extra(0)
  return { action: 'doctor', data: opts.data }
}

function statusLine(result) {
  const warnings = Array.isArray(result.warnings) ? result.warnings : []
  return warnings
}

function renderResult(result, stdout, stderr) {
  const action = result.action
  if (action === 'get') {
    if (!result.ok) return renderFailure(result, stderr)
    const value = result.value
    stdout(typeof value === 'string' ? `${value}\n` : `${JSON.stringify(value, null, 2)}\n`)
    return
  }
  if (action === 'set') {
    if (result.path === undefined) return renderFailure(result, stderr)
    if (!result.fileUpdated) return renderFailure(result, stderr)
    const before = previewValue(result.before)
    const after = previewValue(result.after)
    stdout(`已写入 ${result.path}: ${result.changed ? `${before} → ${after}` : '值未变化'}\n`)
    const reload = result.reload || {}
    if (reload.status === 'hot') stdout(`${reload.message}\n`)
    else if (reload.status === 'no-service' || reload.status === 'skipped') stdout(`注意：${reload.message}\n`)
    else if (reload.status) {
      stderr(`✗ ${reload.message}\n`)
      for (const problem of reload.problems || []) stderr(`  - ${problem}\n`)
    }
    for (const warning of statusLine(result)) stderr(`注意：${warning}\n`)
    return
  }
  if (action === 'list') {
    if (!result.ok) return renderFailure(result, stderr)
    if (result.group !== undefined) {
      stdout(`${JSON.stringify(result.value, null, 2)}\n`)
      return
    }
    const lines = [`可用配置分组（数据目录：${result.dataDir}）：`]
    for (const group of result.groups || []) lines.push(`  ${String(group.name).padEnd(16)} ${group.type}`)
    lines.push('用 `config list --group <名字>` 查看某一组（密钥会脱敏）')
    stdout(`${lines.join('\n')}\n`)
    return
  }
  if (action === 'validate') {
    if (result.ok) {
      stdout(`配置校验通过：${result.configFile}\n`)
      return
    }
    stderr(`配置校验未通过（${(result.problems || []).length} 项）：\n`)
    for (const problem of result.problems || []) stderr(`  - ${problem}\n`)
    return
  }
  if (action === 'export') {
    if (!result.ok) return renderFailure(result, stderr)
    stdout(`已导出${result.includeSecrets ? '（含明文密钥）' : `（已脱敏，${result.maskedFields} 个密钥字段被掩码）`}：${result.file}\n`)
    if (result.warning) stderr(`⚠ ${result.warning}\n`)
    return
  }
  if (action === 'import') {
    if (!result.ok && !result.changed) return renderFailure(result, stderr)
    if (result.dryRun) {
      stdout(`预览差异 ${(result.changed || []).length} 项（--dry-run：只预览，未写入）\n`)
      renderChanges(result.changed || [], stdout)
      return
    }
    if (!result.changed?.length) stdout(`配置无变化：${result.configFile}\n`)
    else {
      stdout(`已导入 ${result.changed.length} 项变更：${result.configFile}\n`)
      renderChanges(result.changed, stdout)
    }
    const reload = result.reload || {}
    if (reload.status === 'hot') stdout(`${reload.message}\n`)
    else if (reload.status === 'no-service' || reload.status === 'skipped') stdout(`注意：${reload.message}\n`)
    else if (reload.status) {
      stderr(`✗ ${reload.message}\n`)
      for (const problem of reload.problems || []) stderr(`  - ${problem}\n`)
    }
    for (const warning of statusLine(result)) stderr(`注意：${warning}\n`)
    return
  }
  if (action === 'doctor') {
    const symbols = { pass: '✓', warn: '!', fail: '✗', skip: '-' }
    const lines = [`体检 · v${result.version}`, `数据目录  ${result.dataDir}`, `配置文件  ${result.configFile}`, '']
    for (const item of result.checks || []) {
      lines.push(`[${symbols[item.status] || '?'}] ${String(item.label).padEnd(10)} ${item.message}`)
      if (item.hint) lines.push(`    ${item.hint}`)
      for (const problem of item.problems || []) lines.push(`    - ${problem}`)
    }
    const summary = result.summary || {}
    lines.push('')
    lines.push(`结论：${summary.pass || 0} 项通过，${summary.warn || 0} 项警告，${summary.fail || 0} 项失败，${summary.skip || 0} 项跳过`)
    stdout(`${lines.join('\n')}\n`)
    return
  }
  renderFailure(result, stderr)
}

function renderChanges(changed, stdout) {
  for (const item of changed) {
    stdout(`  ± ${item.path}: ${previewValue(item.from)} → ${previewValue(item.to)}\n`)
  }
}

function renderFailure(result, stderr) {
  if (result.error) stderr(`错误：${result.error}\n`)
  for (const problem of result.problems || []) stderr(`  - ${problem}\n`)
}

/**
 * CLI 入口（供 bin/config.mjs 与 bin/audiobook-tts.mjs 的 config 子命令调用）。
 * io.stdout / io.stderr 是写入函数，测试可注入；返回进程退出码。
 */
export async function runConfigCli(argv = [], io = {}) {
  const stdout = typeof io.stdout === 'function' ? io.stdout : (text) => process.stdout.write(text)
  const stderr = typeof io.stderr === 'function' ? io.stderr : (text) => process.stderr.write(text)
  let parsed
  try {
    parsed = parseCliArgv(argv)
  } catch (err) {
    const json = argv.includes('--json')
    if (json) stdout(`${JSON.stringify({ ok: false, error: err?.message || String(err), problems: [], exitCode: 1 }, null, 2)}\n`)
    else {
      stderr(`错误：${err?.message || String(err)}\n`)
      stderr(`${usageText()}\n`)
    }
    return 1
  }
  if (parsed.opts.help) {
    stdout(`${usageText()}\n`)
    return 0
  }
  if (!parsed.command) {
    stderr(`${usageText()}\n`)
    return 1
  }
  if (!KNOWN_COMMANDS.has(parsed.command)) {
    stderr(`错误：未知命令 "${parsed.command}"\n${usageText()}\n`)
    return 1
  }
  let args
  try {
    args = commandArgs(parsed.command, parsed.positionals, parsed.opts)
    if (args.data === undefined && io.data) args.data = io.data
  } catch (err) {
    const result = failure(parsed.command, err?.message || String(err), err?.exitCode || 1)
    if (parsed.opts.json) stdout(`${JSON.stringify(result, null, 2)}\n`)
    else {
      renderFailure(result, stderr)
      stderr(`${usageText()}\n`)
    }
    return result.exitCode
  }
  const result = await runConfigAction(args, { env: io.env || process.env, cwd: io.cwd || process.cwd(), fetchImpl: io.fetchImpl })
  if (parsed.opts.json) {
    stdout(`${JSON.stringify(result, null, 2)}\n`)
    if (result.action === 'export' && result.warning) stderr(`⚠ ${result.warning}\n`)
  } else {
    renderResult(result, stdout, stderr)
  }
  return result.exitCode ?? (result.ok ? 0 : 1)
}
