/**
 * 本地 Qwen3-TTS 引擎的生命周期管理。
 *
 * 设计就一条：**模型不该常驻**。听书是间歇性的，没人听的时候把 2.3GB 的
 * Python/MLX 进程留着没有意义，所以：
 *
 *   - 第一次请求才 spawn sidecar（懒加载）
 *   - 空闲 `idleUnloadSeconds` 秒后杀掉进程（模型和内存一起还回去）
 *   - 下一次请求再重拉；模型加载 4s，首请求多一次编译 ~7s
 *
 * Node 只通过 127.0.0.1 的 HTTP 和它说话，不知道 MLX/Python 的存在。
 * 这样 `bin/mimo-tts.mjs` 单独跑、DSH 插件跑、以后换别的本地引擎，都是同一套。
 */
import { spawn } from 'node:child_process'
import { createServer } from 'node:net'
import {
  appendFileSync, existsSync, mkdirSync, readFileSync, renameSync, statSync, writeFileSync,
} from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { randomUUID } from 'node:crypto'
import { expandHomePath } from './paths.mjs'

const DEFAULT_SCRIPT = fileURLToPath(new URL('../sidecar/server.py', import.meta.url))
const MAX_LOG_BYTES = 2 * 1024 * 1024
export const DEFAULT_MIN_VOCODER_BYTES = 600_000_000
export const DEFAULT_MIN_MODEL_BYTES = 500_000_000

/**
 * 校验本地 MLX 模型目录完整性：
 * 必须存在 config.json、主权重（model.safetensors 或分片索引）以及声码器权重
 * `speech_tokenizer/model.safetensors`（>= 600MB，缺失会导致 mlx-audio 静默使用随机权重输出噪声）。
 */
export function validateModelDir(rawModelPath, {
  minVocoderBytes = DEFAULT_MIN_VOCODER_BYTES,
  minModelBytes = DEFAULT_MIN_MODEL_BYTES,
} = {}) {
  const modelPath = expandHomePath(rawModelPath)
  if (!modelPath) throw new LocalError('本地引擎缺少模型目录（upstream.local.modelPath）', 'not_configured')
  if (!existsSync(modelPath)) throw new LocalError(`模型目录不存在：${modelPath}`, 'missing_model')
  if (!statSync(modelPath).isDirectory()) throw new LocalError(`模型路径不是目录：${modelPath}`, 'missing_model')

  const cfgFile = join(modelPath, 'config.json')
  if (!existsSync(cfgFile)) {
    throw new LocalError(`模型目录缺少 config.json：${cfgFile}`, 'incomplete_model')
  }

  const tokFile = join(modelPath, 'speech_tokenizer', 'model.safetensors')
  if (!existsSync(tokFile)) {
    throw new LocalError(
      `缺少声码器权重：${tokFile}（缺失会导致 mlx-audio 输出噪声，请重新下载模型）`,
      'missing_vocoder',
    )
  }
  const tokSize = statSync(tokFile).size
  if (tokSize < minVocoderBytes) {
    throw new LocalError(
      `声码器权重不完整：${tokFile}（当前 ${Math.round(tokSize / 1048576)} MB，需 ≥ ${Math.round(minVocoderBytes / 1000000)} MB）`,
      'corrupt_vocoder',
    )
  }

  const mainFile = join(modelPath, 'model.safetensors')
  const indexFile = join(modelPath, 'model.safetensors.index.json')
  if (existsSync(mainFile)) {
    const mainSize = statSync(mainFile).size
    if (mainSize < minModelBytes) {
      throw new LocalError(
        `主权重文件不完整：${mainFile}（当前 ${Math.round(mainSize / 1048576)} MB，需 ≥ ${Math.round(minModelBytes / 1000000)} MB）`,
        'corrupt_model',
      )
    }
  } else if (existsSync(indexFile)) {
    let parsed
    try {
      parsed = JSON.parse(readFileSync(indexFile, 'utf8'))
    } catch {
      throw new LocalError(`模型分片索引损坏：${indexFile}`, 'corrupt_model')
    }
    const shards = [...new Set(Object.values(parsed?.weight_map || {}))]
    if (!shards.length) throw new LocalError(`模型分片索引为空：${indexFile}`, 'corrupt_model')
    for (const shard of shards) {
      const sp = join(modelPath, String(shard))
      if (!existsSync(sp) || statSync(sp).size <= 0) {
        throw new LocalError(`缺少模型权重分片：${sp}`, 'missing_model_weights')
      }
    }
  } else {
    throw new LocalError(`模型目录缺少主权重：${mainFile}`, 'missing_model_weights')
  }
}

export class LocalError extends Error {
  constructor(message, code = 'local_error') {
    super(message)
    this.name = 'LocalError'
    this.code = code
  }
}

export class LocalEngine {
  /**
   * @param {object} deps
   * @param {() => any} deps.getConfig
   * @param {string} deps.dataDir
   * @param {(line:string)=>void} [deps.log]
   */
  constructor({ getConfig, dataDir, refsStore = null, log, minVocoderBytes, minModelBytes }) {
    this.getConfig = getConfig
    this.dataDir = dataDir
    this.refsStore = refsStore || null
    this.log = log || (() => {})
    this.minVocoderBytes = minVocoderBytes ?? DEFAULT_MIN_VOCODER_BYTES
    this.minModelBytes = minModelBytes ?? DEFAULT_MIN_MODEL_BYTES
    this.proc = null
    this.pid = null
    this.port = null
    this.instanceId = null
    this.state = 'stopped' // stopped | starting | ready | stopping | error
    this.starting = null
    this.stopping = false
    this.active = 0
    this.requests = 0
    this.warm = false
    this.warming = null
    this.warmStartedAt = 0
    this.warmError = ''
    this.warmRetryAt = 0
    this.processGeneration = 0
    this.lastStopReason = ''
    this.rssMb = null
    this.loadS = null
    this.lastUsed = 0
    this.lastError = ''
    this.recent = []
    this.stoppingPromise = null
    this.lastHealthAt = 0
    this.scriptPath = DEFAULT_SCRIPT
    this.timer = setInterval(() => { this.#tick().catch(() => {}) }, 5000)
    this.timer.unref?.()
  }

  provider() {
    return this.getConfig().upstream?.provider || 'mimo'
  }

  cfg() {
    return this.getConfig().upstream?.local || {}
  }

  warmHoldUntil() {
    const w = Math.max(0, Number(this.cfg().warmupWindowSeconds ?? 900) || 0)
    if (!this.warmStartedAt || w <= 0) return 0
    return this.warmStartedAt + w * 1000
  }

  status() {
    const cfg = this.cfg()
    const enabled = this.provider() === 'local' || this.provider() === 'hybrid'
    const idle = Math.max(0, Number(cfg.idleUnloadSeconds) || 0)
    const warmWindow = Math.max(0, Number(cfg.warmupWindowSeconds ?? 900) || 0)
    const holdUntil = this.warmHoldUntil()
    const holdRemainSec = this.state === 'ready' && holdUntil > Date.now()
      ? Math.ceil((holdUntil - Date.now()) / 1000)
      : 0
    return {
      provider: this.provider(),
      enabled,
      state: enabled ? this.state : 'disabled',
      mode: idle === 0 ? 'resident' : 'powersave',
      pid: this.pid,
      port: this.port,
      lastUsed: this.lastUsed || null,
      lastError: this.lastError || '',
      active: this.active,
      requests: this.requests,
      warm: this.isWarm(),
      warming: Boolean(this.warming),
      warmError: this.warmError || '',
      rssMb: this.rssMb,
      loadS: this.loadS,
      idleUnloadSeconds: idle,
      warmupWindowSeconds: warmWindow,
      warmHoldRemainingSec: holdRemainSec,
    }
  }

  /** 只把状态写成一行，给宿主日志用。 */
  summary() {
    const s = this.status()
    const mem = s.rssMb ? ` ${s.rssMb}MB` : ''
    return `${s.state}${s.pid ? ` pid=${s.pid}` : ''}${s.port ? ` :${s.port}` : ''}${mem}`
  }

  // ───────────────────── 启动 / 就绪 ─────────────────────

  async ensureStarted() {
    const p = this.provider()
    if (p !== 'local' && p !== 'hybrid') throw new LocalError('当前上游不是本地引擎', 'not_local')
    if (this.stoppingPromise) await this.stoppingPromise
    if (this.proc && this.state === 'ready') return
    if (this.starting) return this.starting
    this.starting = this.#start().finally(() => { this.starting = null })
    return this.starting
  }

  async #start() {
    this.processGeneration++
    this.warm = false
    this.warmStartedAt = 0
    this.warmError = ''
    this.warmRetryAt = 0
    // 上一次进程如果还挂在 error/stopped 状态，先清掉；不能走 stop()，
    // 那会 await 当前这个 starting promise，自己等自己。
    if (this.proc) {
      try { this.proc.kill('SIGKILL') } catch { /* ignore */ }
      this.proc = null
      this.pid = null
    }
    const cfg = this.cfg()
    try {
      this.#validate(cfg)
    } catch (err) {
      this.state = 'error'
      this.lastError = String(err?.message || err)
      throw err
    }
    this.state = 'starting'
    this.lastError = ''
    this.stopping = false
    mkdirSync(this.dataDir, { recursive: true })
    this.#rotateLog()

    const refsPath = join(this.dataDir, 'local-refs.json')
    this.#writeRefs(refsPath, cfg)

    const preferred = Number(cfg.port) || 8398
    const port = await pickPort(preferred)
    const instanceId = randomUUID()
    this.instanceId = instanceId
    this.port = port

    const script = cfg.serverScript ? resolve(expandHomePath(cfg.serverScript)) : this.scriptPath
    if (!existsSync(script)) throw new LocalError(`sidecar 脚本不存在：${script}`, 'missing_script')
    const pythonPath = expandHomePath(cfg.pythonPath)
    const modelPath = expandHomePath(cfg.modelPath)
    const idle = Math.max(0, Number(cfg.idleUnloadSeconds) || 0)
    const warmWindow = Math.max(0, Number(cfg.warmupWindowSeconds ?? 900) || 0)
    const fallbackIdle = idle > 0 ? Math.max(idle, warmWindow) + 60 : 0
    const args = [
      script,
      '--model', modelPath,
      '--refs', refsPath,
      '--host', '127.0.0.1',
      '--port', String(port),
      '--idle-timeout', String(fallbackIdle),
      '--parent-pid', String(process.pid),
      '--instance-id', instanceId,
      '--log', join(this.dataDir, 'local-engine.jsonl'),
    ]
    this.log(`[local] 启动 sidecar ${pythonPath} ${script} :${port}`)
    const proc = spawn(pythonPath, args, {
      cwd: this.dataDir,
      env: { ...process.env, PYTHONUNBUFFERED: '1' },
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    this.proc = proc
    this.pid = proc.pid

    const ready = new Promise((resolveReady, rejectReady) => {
      let settled = false
      const finish = (fn, value) => {
        if (settled) return
        settled = true
        clearTimeout(timer)
        fn(value)
      }
      const timer = setTimeout(() => {
        finish(rejectReady, new LocalError(
          `本地引擎启动超时（${Math.round((Number(cfg.startupTimeoutMs) || 180000) / 1000)}s）`,
          'start_timeout'))
        try { proc.kill('SIGKILL') } catch { /* ignore */ }
      }, Number(cfg.startupTimeoutMs) || 180000)
      timer.unref?.()

      this.#pipeLines(proc, (line, isErr) => {
        this.#remember(line)
        if (!isErr) {
          try {
            const evt = JSON.parse(line)
            if (evt.event === 'loaded') this.log(`[local] 模型加载完成 ${evt.load_s}s`)
            if (evt.event === 'ready') this.port = evt.port || this.port
            if (evt.event === 'idle_exit') this.log('[local] sidecar 自行空闲退出')
          } catch { /* 非 JSON 行，忽略 */ }
        }
      })

      proc.once('error', (err) => {
        this.state = 'error'
        this.lastError = `无法启动 Python：${err.message}`
        finish(rejectReady, new LocalError(this.lastError, 'spawn_failed'))
      })
      proc.once('exit', (code, signal) => {
        // 新进程已经顶上来时，旧进程的 exit 不能再清掉新进程的状态
        if (this.proc !== proc) {
          finish(rejectReady, new LocalError(this.lastError || 'sidecar 已退出', 'exited'))
          return
        }
        const wasStopping = this.stopping
        this.proc = null
        this.pid = null
        this.state = wasStopping ? 'stopped' : (code === 0 ? 'stopped' : 'error')
        if (!wasStopping && code !== 0) {
          this.lastError = `sidecar 退出 code=${code} signal=${signal || '-'}：${this.recent.slice(-3).join(' | ')}`
        }
        if (!wasStopping) this.log(`[local] sidecar 退出 code=${code} signal=${signal || '-'}`)
        finish(rejectReady, new LocalError(this.lastError || 'sidecar 已退出', 'exited'))
      })

      this.#waitHealth(instanceId, Number(cfg.startupTimeoutMs) || 180000)
        .then((health) => {
          if (this.proc !== proc) return
          this.state = 'ready'
          this.port = health.port || port
          this.rssMb = health.footprint_mb ?? health.maxrss_mb ?? null
          this.loadS = health.load_s ?? null
          this.lastHealthAt = Date.now()
          this.lastUsed = Date.now()
          this.log(`[local] 就绪 ${this.summary()}`)
          finish(resolveReady, true)
        })
        .catch((err) => finish(rejectReady, err))
    })

    return ready
  }

  #resolveRoleRef(rawRef) {
    if (this.refsStore) return this.refsStore.resolveRef(rawRef)
    const wav = expandHomePath(rawRef?.wav)
    const text = String(rawRef?.text || '').trim()
    return {
      id: '',
      name: '',
      wav,
      text,
      builtin: false,
      exists: Boolean(wav && existsSync(wav)),
    }
  }

  #validate(cfg) {
    const pythonPath = expandHomePath(cfg.pythonPath)
    if (!pythonPath) throw new LocalError('本地引擎缺少 Python 路径（upstream.local.pythonPath）', 'not_configured')
    if (!existsSync(pythonPath)) throw new LocalError(`Python 不存在：${pythonPath}`, 'missing_python')
    validateModelDir(cfg.modelPath, {
      minVocoderBytes: this.minVocoderBytes,
      minModelBytes: this.minModelBytes,
    })
    const resolved = this.#resolveRoleRef(cfg.refs?.narrator)
    if (!resolved.wav || !resolved.text) throw new LocalError('本地引擎缺少旁白参考音（wav + text）', 'missing_ref')
    if (!resolved.exists) throw new LocalError(`旁白参考音不存在：${resolved.wav}`, 'missing_ref')
  }

  #writeRefs(path, cfg) {
    const refs = {}
    for (const role of ['narrator', 'dialogue']) {
      const resolved = this.#resolveRoleRef(cfg.refs?.[role])
      if (resolved.wav && resolved.text) refs[role] = { wav: resolved.wav, text: resolved.text }
    }
    const tmp = `${path}.tmp`
    writeFileSync(tmp, JSON.stringify(refs, null, 2))
    renameSync(tmp, path)
  }

  async #waitHealth(instanceId, timeoutMs) {
    const deadline = Date.now() + timeoutMs
    let last
    while (Date.now() < deadline) {
      if (!this.proc) throw new LocalError(this.lastError || 'sidecar 启动失败', 'exited')
      try {
        const res = await fetch(`http://127.0.0.1:${this.port}/health`, { signal: AbortSignal.timeout(1500) })
        if (res.ok) {
          const health = await res.json()
          if (health.instanceId === instanceId) return health
          last = new Error('端口上的服务 instanceId 不匹配')
        } else {
          last = new Error(`health ${res.status}`)
        }
      } catch (err) {
        last = err
      }
      await sleep(250)
    }
    throw new LocalError(`本地引擎未在 ${Math.round(timeoutMs / 1000)}s 内就绪：${last?.message || 'timeout'}`, 'start_timeout')
  }

  // ───────────────────── 合成 ─────────────────────

  async synthesize({ text, role = 'narrator', markWarm = true }) {
    await this.ensureStarted()
    // 空闲卸载可能与请求撞车：等它停干净再重新拉一次
    if (this.state !== 'ready') await this.ensureStarted()
    const cfg = this.cfg()
    this.active++
    this.lastUsed = Date.now()
    try {
      const res = await fetch(`http://127.0.0.1:${this.port}/synthesize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, role }),
        signal: AbortSignal.timeout(Number(cfg.requestTimeoutMs) || 180000),
      })
      if (!res.ok) {
        const detail = await res.text().catch(() => '')
        throw new LocalError(`本地合成失败 ${res.status}：${detail.slice(0, 200)}`, 'http_error')
      }
      const buf = Buffer.from(await res.arrayBuffer())
      if (buf.length < 44 || buf.toString('ascii', 0, 4) !== 'RIFF') {
        throw new LocalError(`本地引擎返回非 WAV 字节 (${buf.length}B)`, 'bad_wav')
      }
      this.requests++
      if (markWarm) {
        if (!this.warmStartedAt) this.warmStartedAt = Date.now()
        this.warm = true
        this.warmError = ''
        this.warmRetryAt = 0
      }
      return buf
    } catch (err) {
      if (err instanceof LocalError) throw err
      // 进程半路死了 / 端口不通：把状态清掉，下一次请求重拉
      this.lastError = `本地引擎连接失败：${err?.message || err}`
      await this.stop('error').catch(() => {})
      this.state = 'error'
      throw new LocalError(this.lastError, 'unreachable')
    } finally {
      this.active = Math.max(0, this.active - 1)
      this.lastUsed = Date.now()
    }
  }

  isWarm() {
    return this.state === 'ready' && this.warm
  }

  isCoolingDown() {
    return Boolean(this.warmError && this.warmRetryAt > Date.now())
  }

  /**
   * 用一段真实文本把模型焐热（load + 一次完整合成，编译随之完成）。
   * 与 ensureStarted 不同：这个会真的跑一次 generate，所以之后的第一段是热的。
   */
  async warmup(text, role = 'narrator') {
    if (this.isWarm()) return true
    if (this.warming) return this.warming
    if (this.isCoolingDown()) return false
    this.warming = (async () => {
      try {
        await this.ensureStarted()
      } catch (err) {
        this.warmError = String(err?.message || err)
        this.warmRetryAt = Date.now() + 60_000
        this.log(`[warn] 本地预热启动失败，60s 内不再重试：${this.warmError}`)
        return false
      }
      const gen = this.processGeneration
      try {
        await this.synthesize({ text: text || '预热一下。', role, markWarm: false })
        if (gen !== this.processGeneration) return false
        this.warm = true
        if (!this.warmStartedAt) this.warmStartedAt = Date.now()
        this.warmError = ''
        this.warmRetryAt = 0
        this.log('[local] 预热完成')
        return true
      } catch (err) {
        if (gen === this.processGeneration || this.lastStopReason === 'error') {
          this.warmError = String(err?.message || err)
          this.warmRetryAt = Date.now() + 60_000
          this.log(`[warn] 本地预热失败，60s 内不再重试：${this.warmError}`)
        }
        return false
      } finally {
        this.warming = null
      }
    })()
    return this.warming
  }

  /** 缓存命中时也算「在用」，避免读缓存期间把模型卸载掉。 */
  touch() {
    if (this.state === 'ready') this.lastUsed = Date.now()
  }

  /** 手动预热：只拉起进程，不发合成请求（首请求仍有一次编译）。 */
  async preload() {
    await this.ensureStarted()
    return this.status()
  }

  // ───────────────────── 停止 ─────────────────────

  async stop(reason = 'manual') {
    if (this.starting) await this.starting.catch(() => {})
    if (this.stoppingPromise) return this.stoppingPromise
    const proc = this.proc
    if (!proc) {
      this.state = 'stopped'
      return this.status()
    }
    const p = this.#doStop(proc, reason).finally(() => { this.stoppingPromise = null })
    this.stoppingPromise = p
    return p
  }

  async #doStop(proc, reason) {
    this.lastStopReason = reason
    this.processGeneration++
    this.warm = false
    this.warmStartedAt = 0
    this.warmError = ''
    this.warmRetryAt = 0
    this.stopping = true
    this.state = 'stopping'
    this.log(`[local] 停止 sidecar（${reason}）`)
    const exited = new Promise((resolveExit) => {
      const t = setTimeout(() => {
        try { proc.kill('SIGKILL') } catch { /* ignore */ }
        resolveExit()
      }, 4000)
      t.unref?.()
      proc.once('exit', () => { clearTimeout(t); resolveExit() })
    })
    try { proc.kill('SIGTERM') } catch { /* ignore */ }
    await exited
    this.proc = null
    this.pid = null
    this.state = 'stopped'
    this.rssMb = null
    this.stopping = false
    return this.status()
  }

  async invalidate() {
    this.lastError = ''
    return this.stop('config')
  }

  async shutdown() {
    clearInterval(this.timer)
    return this.stop('shutdown')
  }

  // ───────────────────── 内部 ─────────────────────

  /** 同步最新空闲策略到运行中的 sidecar（切常驻/省内存时不重启重载模型）。 */
  async syncIdlePolicy() {
    if (!this.proc || this.state !== 'ready' || !this.port) return false
    const cfg = this.cfg()
    const idle = Math.max(0, Number(cfg.idleUnloadSeconds) || 0)
    const warmWindow = Math.max(0, Number(cfg.warmupWindowSeconds ?? 900) || 0)
    const fallbackIdle = idle > 0 ? Math.max(idle, warmWindow) + 60 : 0
    try {
      const res = await fetch(`http://127.0.0.1:${this.port}/policy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idle_timeout: fallbackIdle }),
        signal: AbortSignal.timeout(2000),
      })
      return res.ok
    } catch {
      return false
    }
  }

  async checkIdleUnload(now = Date.now()) {
    const p = this.provider()
    if (p !== 'local' && p !== 'hybrid') return false
    const cfg = this.cfg()
    const idle = Math.max(0, Number(cfg.idleUnloadSeconds) || 0)
    const holdUntil = this.warmHoldUntil()
    if (
      this.state === 'ready'
      && idle > 0
      && this.active === 0
      && (now - this.lastUsed > idle * 1000)
      && now >= holdUntil
    ) {
      await this.stop('idle')
      return true
    }
    return false
  }

  async #tick() {
    const p = this.provider()
    if (p !== 'local' && p !== 'hybrid') return
    if (await this.checkIdleUnload()) return
    if (this.state === 'ready' && Date.now() - this.lastHealthAt > 15_000) {
      try {
        const res = await fetch(`http://127.0.0.1:${this.port}/health`, { signal: AbortSignal.timeout(2000) })
        if (res.ok) {
          const h = await res.json()
          if (h.instanceId === this.instanceId) {
            this.rssMb = h.footprint_mb ?? h.maxrss_mb ?? this.rssMb
            this.lastHealthAt = Date.now()
          }
        }
      } catch { /* 下一次合成会暴露 */ }
    }
  }

  #pipeLines(proc, onLine) {
    const bind = (stream, isErr) => {
      let buf = ''
      stream.setEncoding('utf8')
      stream.on('data', (chunk) => {
        buf += chunk
        let nl
        while ((nl = buf.indexOf('\n')) !== -1) {
          const line = buf.slice(0, nl).trimEnd()
          buf = buf.slice(nl + 1)
          if (line) {
            onLine(line, isErr)
            this.#appendLog(line)
          }
        }
      })
    }
    bind(proc.stdout, false)
    bind(proc.stderr, true)
  }

  #remember(line) {
    this.recent.push(line.slice(0, 400))
    if (this.recent.length > 20) this.recent.shift()
  }

  #appendLog(line) {
    try {
      appendFileSync(join(this.dataDir, 'local-engine.log'), `${new Date().toISOString()} ${line}\n`)
    } catch { /* 日志失败不影响主流程 */ }
  }

  #rotateLog() {
    for (const name of ['local-engine.log', 'local-engine.jsonl']) {
      const path = join(this.dataDir, name)
      try {
        if (statSync(path).size > MAX_LOG_BYTES) renameSync(path, `${path}.1`)
      } catch { /* 文件不存在 */ }
    }
  }
}

// ───────────────────── 工具 ─────────────────────

async function pickPort(preferred) {
  if (preferred > 0 && await tryListen(preferred)) return preferred
  return await ephemeralPort()
}

function tryListen(port) {
  return new Promise((resolveTry) => {
    const srv = createServer()
    srv.once('error', () => resolveTry(false))
    srv.listen(port, '127.0.0.1', () => srv.close(() => resolveTry(true)))
  })
}

function ephemeralPort() {
  return new Promise((resolvePort, reject) => {
    const srv = createServer()
    srv.once('error', reject)
    srv.listen(0, '127.0.0.1', () => {
      const { port } = srv.address()
      srv.close(() => resolvePort(port))
    })
  })
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}
