/**
 * 本地环境探测、UI 托管安装任务调度与在线诊断 Doctor（SetupManager）。
 *
 * 安全红线：
 *   - 仅允许执行白名单任务（install-local / download-model），绝不执行前端传入的任意 shell 命令；
 *   - hfEndpoint 仅允许留空、https://hf-mirror.com 或 https://huggingface.co；
 *   - 单任务互斥锁；取消或停服时按进程组 SIGTERM -> SIGKILL 彻底回收子进程；
 *   - 在线连通性探测绝不在日志或诊断文本中回显真实 API Key。
 */
import { spawn, spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { lanAddresses } from './auth.mjs'
import { DEFAULT_MIN_MODEL_BYTES, DEFAULT_MIN_VOCODER_BYTES, validateModelDir } from './local.mjs'
import { expandHomePath, findBinary, resolveRepoRoot } from './paths.mjs'
import { detectHttpsTools } from './tunnel-manager.mjs'

const DEFAULT_SIDECAR_SCRIPT = fileURLToPath(new URL('../sidecar/server.py', import.meta.url))
const LOG_RING_LIMIT = 800

const ALLOWED_HF_ENDPOINTS = new Set([
  '',
  'https://hf-mirror.com',
  'https://huggingface.co',
])

const STEP_RE = /\[(\d+)\/(\d+)\]\s*(.+?)(?:\s*=+)?$/

export class SetupError extends Error {
  constructor(message, status = 400, code = 'setup_error') {
    super(message)
    this.name = 'SetupError'
    this.status = status
    this.code = code
  }
}

function defaultRunSync(cmd, args, timeout = 4000) {
  return spawnSync(cmd, args, { encoding: 'utf8', timeout })
}

function fileSizeMb(path) {
  try {
    return Math.round(statSync(path).size / (1024 * 1024))
  } catch {
    return 0
  }
}

function findSystemPython(runSync) {
  const candidates = ['python3', '/opt/homebrew/bin/python3', '/usr/local/bin/python3', '/usr/bin/python3']
  for (const bin of candidates) {
    if (bin !== 'python3' && !existsSync(bin)) continue
    const res = runSync(bin, ['--version'], 3000)
    if (res && res.status === 0) {
      const version = String(res.stdout || res.stderr || '').trim()
      return { found: true, path: bin, version }
    }
  }
  return { found: false, path: '', version: '' }
}

/**
 * 探测当前机器的 Apple Silicon、Python3、venv（含 mlx_audio）、本地模型目录与内置参考音状态，
 * 并生成一键回填用的 suggestedPatch。
 */
export function detectEnvironment({
  dataDir = '',
  refsStore = null,
  config = null,
  minVocoderBytes = DEFAULT_MIN_VOCODER_BYTES,
  minModelBytes = DEFAULT_MIN_MODEL_BYTES,
  probe = {},
} = {}) {
  const os = probe.platform || process.platform
  const arch = probe.arch || process.arch
  const runSync = probe.runSync || defaultRunSync
  const isAppleSilicon = os === 'darwin' && arch === 'arm64'

  const python3 = probe.python3 || findSystemPython(runSync)

  const configuredPy = expandHomePath(config?.upstream?.local?.pythonPath)
  const defaultVenvPy = dataDir ? join(dataDir, 'venv', 'bin', 'python') : ''
  const venvPy = configuredPy || defaultVenvPy
  const venvExists = Boolean(venvPy && existsSync(venvPy))
  let venvVersion = ''
  let mlxAudioOk = false
  if (venvExists) {
    const verRes = runSync(venvPy, ['--version'], 3000)
    if (verRes?.status === 0) venvVersion = String(verRes.stdout || verRes.stderr || '').trim()
    const modRes = runSync(venvPy, ['-c', 'import mlx_audio, huggingface_hub, numpy'], 5000)
    mlxAudioOk = modRes?.status === 0
  }

  const configuredModel = expandHomePath(config?.upstream?.local?.modelPath)
  const defaultModelDir = dataDir ? join(dataDir, 'models', 'qwen3tts-0.6b-base-8bit') : ''
  const modelDir = configuredModel || defaultModelDir
  const modelExists = Boolean(modelDir && existsSync(modelDir))
  let modelValid = false
  let modelError = ''
  if (modelDir) {
    try {
      validateModelDir(modelDir, { minVocoderBytes, minModelBytes })
      modelValid = true
    } catch (err) {
      modelError = String(err?.message || err)
    }
  } else {
    modelError = '未配置数据目录或模型目录'
  }
  const mainMb = modelDir ? fileSizeMb(join(modelDir, 'model.safetensors')) : 0
  const vocoderMb = modelDir ? fileSizeMb(join(modelDir, 'speech_tokenizer', 'model.safetensors')) : 0

  const builtins = refsStore ? refsStore.builtinList() : []
  const availableBuiltins = builtins.filter((r) => r.exists)
  const recommendedRef = availableBuiltins.find((r) => r.id === 'builtin:narrator-14s') || availableBuiltins[0] || null

  const sidecarExists = existsSync(DEFAULT_SIDECAR_SCRIPT)
  const readyForLocal = Boolean(
    isAppleSilicon
    && venvExists
    && mlxAudioOk
    && modelValid
    && availableBuiltins.length > 0
    && sidecarExists,
  )

  const suggestedPatch = {
    upstream: {
      provider: readyForLocal ? 'local' : (config?.upstream?.provider || 'mimo'),
      local: {
        pythonPath: venvExists ? venvPy : (configuredPy || defaultVenvPy),
        modelPath: modelValid ? modelDir : (configuredModel || defaultModelDir),
        refs: {
          narrator: recommendedRef
            ? { refId: recommendedRef.id, wav: '', text: '' }
            : (config?.upstream?.local?.refs?.narrator || { refId: '', wav: '', text: '' }),
        },
      },
    },
  }

  return {
    checkedAt: Date.now(),
    platform: { os, arch, isAppleSilicon },
    python3,
    venv: {
      path: venvPy,
      defaultPath: defaultVenvPy,
      exists: venvExists,
      version: venvVersion,
      mlxAudioOk,
    },
    model: {
      path: modelDir,
      defaultPath: defaultModelDir,
      exists: modelExists,
      valid: modelValid,
      error: modelError,
      mainMb,
      vocoderMb,
    },
    refs: {
      builtinCount: builtins.length,
      builtinAvailableCount: availableBuiltins.length,
      recommendedRefId: recommendedRef?.id || '',
    },
    sidecarScript: { path: DEFAULT_SIDECAR_SCRIPT, exists: sidecarExists },
    readyForLocal,
    suggestedPatch,
  }
}

async function probeHttpEndpoint({ url, headers = {}, fetchImpl = fetch }) {
  try {
    const res = await fetchImpl(url, {
      method: 'GET',
      headers,
      signal: AbortSignal.timeout(5000),
    })
    if (res.status === 401 || res.status === 403) {
      return { status: 'fail', message: `鉴权失败（HTTP ${res.status}）`, hint: '请核对 API Key 是否有效、未过期或具备 TTS 权限' }
    }
    if (res.ok || res.status === 404 || res.status === 405) {
      return { status: 'pass', message: `上游连通正常（HTTP ${res.status}）` }
    }
    return { status: 'warn', message: `上游响应 HTTP ${res.status}`, hint: '请检查 baseUrl 或服务端状态' }
  } catch (err) {
    return { status: 'fail', message: `连接上游失败：${String(err?.message || err)}`, hint: '检查网络、代理或 baseUrl 地址' }
  }
}

function checkMimoAndVoices(cfg, refsStore) {
  const up = cfg.upstream || {}
  const keys = Array.isArray(up.keys) ? up.keys.filter(Boolean) : []
  if (!keys.length) {
    return { status: 'fail', message: '未配置 MiMo API Key', hint: '请填写至少一把 Xiaomi MiMo API Key' }
  }
  if (!/^https?:\/\//.test(String(up.baseUrl || ''))) {
    return { status: 'fail', message: 'MiMo baseUrl 格式无效' }
  }
  for (const role of ['narrator', 'dialogue']) {
    const v = cfg.voices?.[role] || {}
    const mode = v.mode || 'preset'
    if (mode === 'design' && !String(v.style || '').trim()) {
      return { status: 'fail', message: `MiMo 文字造音（${role}）缺少音色描述 style` }
    }
    if (mode === 'clone') {
      const resolved = refsStore ? refsStore.resolveRef({ refId: v.refId, wav: v.voice }) : null
      const ok = resolved ? (resolved.wav && resolved.exists) : Boolean(String(v.voice || '').trim())
      if (!ok) return { status: 'fail', message: `MiMo 克隆音色（${role}）找不到有效参考音文件` }
    }
  }
  return { status: 'pass', message: `MiMo 云端就绪（${keys.length} 把 Key，模型 ${up.model}）` }
}

/**
 * 在线体检 Doctor：输出监听、LAN IP、鉴权、当前活动引擎及可选上游连通性的逐项检查报告。
 */
export async function runDoctor({
  service,
  checkNetwork = false,
  minVocoderBytes = DEFAULT_MIN_VOCODER_BYTES,
  minModelBytes = DEFAULT_MIN_MODEL_BYTES,
  probe = {},
} = {}) {
  const cfg = service.config || {}
  const checks = []
  const provider = cfg.upstream?.provider || 'mimo'

  const info = service.info ? service.info() : { running: false, host: '0.0.0.0', port: 8291 }
  checks.push(info.running
    ? { id: 'listen', label: 'HTTP 服务监听', status: 'pass', message: `运行中：${info.url}` }
    : { id: 'listen', label: 'HTTP 服务监听', status: 'warn', message: '服务当前未启动', hint: '可在顶栏点「启动」开始监听' })

  const ips = (probe.lanAddresses || lanAddresses)()
  checks.push(ips.length
    ? { id: 'lan', label: '局域网网卡', status: 'pass', message: `可用 LAN IP：${ips.join(', ')}` }
    : { id: 'lan', label: '局域网网卡', status: 'warn', message: '未检测到可用局域网 IPv4（已排除 198.18.x.x TUN 网卡）', hint: '确认本机已接入与手机相同的 Wi-Fi' })

  const auth = cfg.auth || {}
  if (cfg.server?.publicUrl && !/^https?:\/\//.test(cfg.server.publicUrl)) {
    checks.push({ id: 'auth', label: '鉴权与对外地址', status: 'fail', message: 'server.publicUrl 必须以 http:// 或 https:// 开头' })
  } else if (auth.enabled && !auth.token) {
    checks.push({ id: 'auth', label: '鉴权与对外地址', status: 'warn', message: '已开启鉴权但 URL token 为空', hint: '重新保存配置将自动补全令牌' })
  } else {
    checks.push({
      id: 'auth',
      label: '鉴权与对外地址',
      status: 'pass',
      message: auth.enabled ? '鉴权已开启（URL Token 就绪）' : '鉴权已关闭（仅建议内网使用）',
    })
  }

  const refsStore = service.refs || null
  const env = detectEnvironment({
    dataDir: service.store?.dataDir || '',
    refsStore,
    config: cfg,
    minVocoderBytes,
    minModelBytes,
    probe,
  })

  if (provider === 'mimo') {
    const baseCheck = checkMimoAndVoices(cfg, refsStore)
    checks.push({ id: 'provider', label: 'MiMo 云端引擎', ...baseCheck })
    if (checkNetwork && baseCheck.status !== 'fail') {
      const up = cfg.upstream || {}
      const netRes = await probeHttpEndpoint({
        url: `${String(up.baseUrl || '').replace(/\/+$/, '')}/models`,
        headers: { 'api-key': up.keys[0] },
        fetchImpl: probe.fetch || fetch,
      })
      checks.push({ id: 'network', label: 'MiMo 上游连通性', ...netRes })
    }
  } else if (provider === 'openai') {
    const oa = cfg.upstream?.openai || {}
    if (!/^https?:\/\//.test(String(oa.baseUrl || '')) || !String(oa.model || '').trim() || !String(oa.narratorVoice || '').trim()) {
      checks.push({ id: 'provider', label: 'OpenAI 兼容引擎', status: 'fail', message: '缺少合法的 baseUrl / model / 旁白音色' })
    } else {
      checks.push({ id: 'provider', label: 'OpenAI 兼容引擎', status: 'pass', message: `${oa.baseUrl} · 模型 ${oa.model}` })
      if (checkNetwork) {
        const netRes = await probeHttpEndpoint({
          url: `${String(oa.baseUrl).replace(/\/+$/, '')}/models`,
          headers: oa.apiKey ? { Authorization: `Bearer ${oa.apiKey}` } : {},
          fetchImpl: probe.fetch || fetch,
        })
        checks.push({ id: 'network', label: 'OpenAI 兼容连通性', ...netRes })
      }
    }
  } else if (provider === 'local' || provider === 'hybrid') {
    if (!env.platform.isAppleSilicon) {
      checks.push({
        id: 'platform',
        label: '芯片架构',
        status: 'fail',
        message: `当前为 ${env.platform.os}/${env.platform.arch}，本地 MLX 引擎仅支持 macOS Apple Silicon (arm64)`,
        hint: '建议改用 OpenAI 兼容或 MiMo 云端引擎',
      })
    } else {
      checks.push({ id: 'platform', label: '芯片架构', status: 'pass', message: 'macOS Apple Silicon (arm64)' })
    }

    if (!env.venv.exists) {
      checks.push({ id: 'python', label: '本地 Python 环境', status: 'fail', message: `Python 不存在：${env.venv.path || '未配置'}`, hint: '在「初始化向导」运行一键安装' })
    } else if (!env.venv.mlxAudioOk) {
      checks.push({ id: 'python', label: '本地 Python 环境', status: 'fail', message: `${env.venv.path} 缺少 mlx_audio / huggingface_hub / numpy` })
    } else {
      checks.push({ id: 'python', label: '本地 Python 环境', status: 'pass', message: `${env.venv.version || 'python3'} + mlx_audio 就绪` })
    }

    if (!env.model.valid) {
      checks.push({
        id: 'model',
        label: '模型与声码器权重',
        status: 'fail',
        message: env.model.error || '模型目录不完整',
        hint: '可在向导中运行「仅下载/修复模型」自动校验补全（含声码器 ≥600MB）',
      })
    } else {
      checks.push({
        id: 'model',
        label: '模型与声码器权重',
        status: 'pass',
        message: `主权重 ${env.model.mainMb} MB · 声码器 ${env.model.vocoderMb} MB`,
      })
    }

    const refSpec = cfg.upstream?.local?.refs?.narrator
    const refRes = refsStore ? refsStore.resolveRef(refSpec) : null
    if (!refRes?.wav || !refRes.exists || !refRes.text) {
      checks.push({ id: 'local-ref', label: '本地旁白参考音', status: 'fail', message: '缺少有效的旁白参考音文件或逐字参考文本' })
    } else {
      checks.push({ id: 'local-ref', label: '本地旁白参考音', status: 'pass', message: `${refRes.name || refRes.wav}（已配逐字文本）` })
    }

    if (provider === 'hybrid') {
      const up = cfg.upstream || {}
      if (!up.keys?.length) {
        checks.push({
          id: 'hybrid-cloud',
          label: 'Hybrid 云端克隆顶班',
          status: 'warn',
          message: '未配置 MiMo Key，冷启动期间将等待本地预热而无法云端顶班',
        })
      } else {
        checks.push({ id: 'hybrid-cloud', label: 'Hybrid 云端克隆顶班', status: 'pass', message: `已配置 ${up.keys.length} 把 MiMo Key 顶班` })
        if (checkNetwork) {
          const netRes = await probeHttpEndpoint({
            url: `${String(up.baseUrl || '').replace(/\/+$/, '')}/models`,
            headers: { 'api-key': up.keys[0] },
            fetchImpl: probe.fetch || fetch,
          })
          checks.push({ id: 'network', label: 'MiMo 云端连通性', ...netRes })
        }
      }
    }
  }

  if (env.refs.builtinAvailableCount === 0) {
    checks.push({ id: 'refs', label: '内置参考音库', status: 'warn', message: '未发现内置 refs/ 样本（可通过参考音库上传自定义音频）' })
  } else {
    checks.push({ id: 'refs', label: '内置参考音库', status: 'pass', message: `${env.refs.builtinAvailableCount}/${env.refs.builtinCount} 个内置样本可用` })
  }

  const oaSrv = cfg.openaiServer || {}
  if (oaSrv.enabled) {
    const hasCustomKey = Boolean(String(oaSrv.apiKey || '').trim())
    const hasAuthToken = Boolean(String(auth.token || '').trim())
    if (!hasCustomKey && !hasAuthToken) {
      checks.push({
        id: 'openai-server',
        label: 'OpenAI 端点状态',
        status: 'warn',
        message: '已开启对外 /v1/audio/speech，但未配置独立 apiKey 且缺少 auth.token',
        hint: '建议在设置 Module 09 生成独立 Bearer 密钥',
      })
    } else {
      checks.push({
        id: 'openai-server',
        label: 'OpenAI 端点状态',
        status: 'pass',
        message: hasCustomKey ? '已开启（独立 Bearer 密钥鉴权）' : '已开启（复用 URL Token 鉴权）',
      })
    }
  } else {
    checks.push({
      id: 'openai-server',
      label: 'OpenAI 端点状态',
      status: 'pass',
      message: '已关闭（默认安全模式，仅暴露 Legado 接口）',
    })
  }

  const ffmpegPath = findBinary('ffmpeg', probe)
  const audioFmt = String(cfg.audio?.format || 'wav').trim().toLowerCase()
  if (ffmpegPath) {
    checks.push({
      id: 'ffmpeg',
      label: '音频转码器 ffmpeg',
      status: 'pass',
      message: `已就绪（${ffmpegPath}，支持 MP3 / Opus 压缩输出）`,
    })
  } else {
    checks.push({
      id: 'ffmpeg',
      label: '音频转码器 ffmpeg',
      status: 'warn',
      message: audioFmt !== 'wav'
        ? `当前配置为 ${audioFmt}，但未检测到 ffmpeg（运行时将自动回退 WAV）`
        : '未检测到 ffmpeg（仅影响 MP3 / Opus 压缩输出，默认 WAV 不受影响）',
      hint: 'Mac 可运行 brew install ffmpeg，Linux 可运行 apt install ffmpeg',
    })
  }

  const httpsTools = probe.httpsTools || detectHttpsTools({ probe })
  const tunnelSt = service.tunnel ? service.tunnel.status() : null
  const publicUrl = String(cfg.server?.publicUrl || '').trim()
  const relayUrl = String(cfg.tunnel?.kvSync?.publicRelayUrl || '').trim()
  if (tunnelSt?.state === 'running' && tunnelSt.quickUrl) {
    checks.push({
      id: 'https-tunnel',
      label: 'HTTPS 隧道状态',
      status: 'pass',
      message: `Quick Tunnel 运行中：${tunnelSt.quickUrl}`,
    })
  } else if (publicUrl || relayUrl) {
    checks.push({
      id: 'https-tunnel',
      label: 'HTTPS 隧道状态',
      status: 'pass',
      message: `已配置固定 HTTPS：${publicUrl || relayUrl}`,
    })
  } else if (httpsTools.tailscale?.funnelEnabled && httpsTools.tailscale?.funnelUrl) {
    checks.push({
      id: 'https-tunnel',
      label: 'HTTPS 隧道状态',
      status: 'pass',
      message: `Tailscale Funnel 已启用：${httpsTools.tailscale.funnelUrl}`,
    })
  } else if (httpsTools.cloudflared?.installed) {
    checks.push({
      id: 'https-tunnel',
      label: 'HTTPS 隧道状态',
      status: 'warn',
      message: `未开启公网 HTTPS（cloudflared 已就绪：${httpsTools.cloudflared.version || httpsTools.cloudflared.path}）`,
      hint: '可在「交付」页一键启动 Quick Tunnel，或按 HTTPS-GUIDE.md 配置固定域名',
    })
  } else {
    checks.push({
      id: 'https-tunnel',
      label: 'HTTPS 隧道状态',
      status: 'warn',
      message: '仅局域网可用（未检测到 cloudflared / 固定对外地址）',
      hint: '公网听书推荐运行 brew install cloudflared 后使用 Quick Tunnel',
    })
  }

  const summary = {
    pass: checks.filter((c) => c.status === 'pass').length,
    warn: checks.filter((c) => c.status === 'warn').length,
    fail: checks.filter((c) => c.status === 'fail').length,
  }
  const ok = summary.fail === 0
  return {
    ok,
    provider,
    checkedAt: Date.now(),
    headline: ok ? (summary.warn ? '核心就绪（存在提示项）' : '全部体检通过') : `发现 ${summary.fail} 项异常需修复`,
    summary,
    checks,
    detect: env,
  }
}

export class SetupManager {
  constructor({
    dataDir = '',
    refsStore = null,
    getConfig = () => ({}),
    log = () => {},
    minVocoderBytes = DEFAULT_MIN_VOCODER_BYTES,
    minModelBytes = DEFAULT_MIN_MODEL_BYTES,
    scriptOverrides = null,
  } = {}) {
    this.dataDir = dataDir
    this.refsStore = refsStore
    this.getConfig = getConfig
    this.log = log
    this.minVocoderBytes = minVocoderBytes
    this.minModelBytes = minModelBytes

    const repoRoot = resolveRepoRoot()
    this.scripts = {
      'install-local': scriptOverrides?.['install-local'] || join(repoRoot, 'setup', 'install-local-engine.sh'),
      'download-model': scriptOverrides?.['download-model'] || join(repoRoot, 'setup', 'download-model.sh'),
    }

    this.state = 'idle' // idle | running | succeeded | failed | cancelled
    this.task = ''
    this.hfEndpoint = ''
    this.step = 0
    this.totalSteps = 0
    this.progressText = ''
    this.startedAt = 0
    this.finishedAt = 0
    this.exitCode = null
    this.error = ''
    this.lines = []
    this.nextSeq = 1
    this.proc = null
    this.stopping = false
    this.lastDetect = null
  }

  detect(probe = {}) {
    this.lastDetect = detectEnvironment({
      dataDir: this.dataDir,
      refsStore: this.refsStore,
      config: this.getConfig(),
      minVocoderBytes: this.minVocoderBytes,
      minModelBytes: this.minModelBytes,
      probe,
    })
    return this.lastDetect
  }

  /** 轻量状态摘要（纯文件存在性检查，不衍生子进程，保证 /api/state 低延迟） */
  quickSummary() {
    const cfg = this.getConfig()
    const py = expandHomePath(cfg?.upstream?.local?.pythonPath) || (this.dataDir ? join(this.dataDir, 'venv', 'bin', 'python') : '')
    const model = expandHomePath(cfg?.upstream?.local?.modelPath) || (this.dataDir ? join(this.dataDir, 'models', 'qwen3tts-0.6b-base-8bit') : '')
    const hasVenv = this.lastDetect ? this.lastDetect.venv.exists : Boolean(py && existsSync(py))
    const hasModel = this.lastDetect
      ? this.lastDetect.model.valid
      : Boolean(model && existsSync(join(model, 'config.json')) && existsSync(join(model, 'speech_tokenizer', 'model.safetensors')))
    const builtins = this.refsStore ? this.refsStore.builtinList().filter((r) => r.exists).length : 0
    return {
      state: this.state,
      task: this.task,
      step: this.step,
      totalSteps: this.totalSteps,
      progressText: this.progressText,
      platformSupported: process.platform === 'darwin' && process.arch === 'arm64',
      hasVenv,
      hasModel,
      readyForLocal: this.lastDetect
        ? this.lastDetect.readyForLocal
        : (process.platform === 'darwin' && process.arch === 'arm64' && hasVenv && hasModel && builtins > 0),
      builtinRefsCount: builtins,
    }
  }

  status({ since = 0 } = {}) {
    const cursor = Number(since) || 0
    const slice = cursor > 0 ? this.lines.filter((it) => it.seq > cursor) : this.lines.slice()
    return {
      state: this.state,
      task: this.task,
      hfEndpoint: this.hfEndpoint,
      step: this.step,
      totalSteps: this.totalSteps,
      progressText: this.progressText,
      startedAt: this.startedAt,
      finishedAt: this.finishedAt,
      exitCode: this.exitCode,
      error: this.error,
      lines: slice,
      nextCursor: this.nextSeq - 1,
      detect: this.lastDetect,
    }
  }

  start({ task, hfEndpoint = '' } = {}) {
    if (this.state === 'running' || this.proc) {
      throw new SetupError('已有安装或下载任务正在运行，请等待完成或先取消', 409, 'setup_running')
    }
    const cleanTask = String(task || '').trim()
    if (!Object.hasOwn(this.scripts, cleanTask)) {
      throw new SetupError('仅支持 install-local 或 download-model 白名单任务', 400, 'invalid_task')
    }
    const cleanEndpoint = String(hfEndpoint || '').trim()
    if (!ALLOWED_HF_ENDPOINTS.has(cleanEndpoint)) {
      throw new SetupError('hfEndpoint 仅允许留空、https://hf-mirror.com 或 https://huggingface.co', 400, 'invalid_endpoint')
    }
    const script = this.scripts[cleanTask]
    if (!existsSync(script)) {
      throw new SetupError(`找不到安装脚本：${script}`, 500, 'missing_script')
    }
    if (!this.dataDir) {
      throw new SetupError('未配置插件数据目录，无法执行本地安装', 500, 'no_data_dir')
    }
    mkdirSync(this.dataDir, { recursive: true })

    this.state = 'running'
    this.task = cleanTask
    this.hfEndpoint = cleanEndpoint
    this.step = 0
    this.totalSteps = cleanTask === 'install-local' ? 4 : 3
    this.progressText = '准备启动安装脚本…'
    this.startedAt = Date.now()
    this.finishedAt = 0
    this.exitCode = null
    this.error = ''
    this.lines = []
    this.stopping = false

    const env = {
      ...process.env,
      AUDIOBOOK_DATA: this.dataDir,
      MIMO_DATA: this.dataDir,
      VENV: join(this.dataDir, 'venv'),
      MODEL: join(this.dataDir, 'models', 'qwen3tts-0.6b-base-8bit'),
      HF_ENDPOINT: cleanEndpoint,
      PYTHONUNBUFFERED: '1',
    }
    const proc = spawn('bash', [script], {
      cwd: this.dataDir,
      env,
      detached: process.platform !== 'win32',
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    this.proc = proc
    this.#appendLine('stdout', `[setup] 启动任务 ${cleanTask}${cleanEndpoint ? ` (${cleanEndpoint})` : ''}`)

    this.#bindStream(proc.stdout, 'stdout')
    this.#bindStream(proc.stderr, 'stderr')

    proc.on('error', (err) => {
      if (this.proc !== proc) return
      this.proc = null
      this.finishedAt = Date.now()
      this.error = String(err?.message || err)
      this.state = this.stopping ? 'cancelled' : 'failed'
      this.#appendLine('stderr', `[setup] 进程错误：${this.error}`)
      this.detect()
    })

    proc.on('close', (code) => {
      if (this.proc !== proc) return
      this.proc = null
      this.finishedAt = Date.now()
      this.exitCode = code
      if (this.stopping) {
        this.state = 'cancelled'
        this.progressText = '任务已手动取消'
        this.#appendLine('stderr', '[setup] 任务已取消')
      } else if (code === 0) {
        this.state = 'succeeded'
        this.step = this.totalSteps
        this.progressText = '全部步骤已完成'
        this.#appendLine('stdout', '[setup] 任务执行成功')
      } else {
        this.state = 'failed'
        this.error = this.error || `脚本退出码 ${code}`
        this.#appendLine('stderr', `[setup] 任务失败，退出码 ${code}`)
      }
      this.detect()
    })

    return this.status({ since: 0 })
  }

  async cancel() {
    const proc = this.proc
    if (!proc) {
      return this.status({ since: 0 })
    }
    this.stopping = true
    this.#appendLine('stderr', '[setup] 正在终止任务进程组…')
    const waitClose = new Promise((resolve) => {
      const killer = setTimeout(() => {
        this.#killGroup(proc, 'SIGKILL')
        resolve()
      }, 2500)
      killer.unref?.()
      proc.once('close', () => {
        clearTimeout(killer)
        resolve()
      })
    })
    this.#killGroup(proc, 'SIGTERM')
    await waitClose
    return this.status({ since: 0 })
  }

  async shutdown() {
    if (this.proc) await this.cancel()
  }

  #killGroup(proc, sig) {
    if (process.platform !== 'win32' && proc.pid) {
      try {
        process.kill(-proc.pid, sig)
        return
      } catch { /* fallback to single pid */ }
    }
    try { proc.kill(sig) } catch { /* ignore */ }
  }

  #bindStream(stream, streamName) {
    let buf = ''
    stream.setEncoding('utf8')
    stream.on('data', (chunk) => {
      buf += chunk
      let nl
      while ((nl = buf.indexOf('\n')) !== -1) {
        const line = buf.slice(0, nl).replace(/\r/g, '').trimEnd()
        buf = buf.slice(nl + 1)
        if (line) this.#handleLine(streamName, line)
      }
    })
    stream.on('end', () => {
      const tail = buf.replace(/\r/g, '').trimEnd()
      if (tail) this.#handleLine(streamName, tail)
    })
  }

  #handleLine(streamName, line) {
    this.#appendLine(streamName, line)
    const m = STEP_RE.exec(line)
    if (m) {
      this.step = Number(m[1])
      this.totalSteps = Number(m[2])
      this.progressText = m[3].trim()
    }
  }

  #appendLine(stream, line) {
    const entry = {
      seq: this.nextSeq++,
      at: Date.now(),
      stream,
      line: String(line).slice(0, 500),
    }
    this.lines.push(entry)
    if (this.lines.length > LOG_RING_LIMIT) {
      this.lines.splice(0, this.lines.length - LOG_RING_LIMIT)
    }
    this.log(entry.line)
  }
}
