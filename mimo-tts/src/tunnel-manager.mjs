/**
 * 低门槛 HTTPS 隧道管理器（TunnelManager）与本机穿透工具只读探测。
 *
 * 安全红线：
 *   - 只允许执行白名单命令：
 *     `cloudflared tunnel --no-autoupdate --url http://127.0.0.1:<port> --protocol <http2|quic|auto>`
 *     严禁拼接 shell；
 *   - 单实例互斥锁；停服或退出时按进程组 SIGTERM -> SIGKILL 彻底回收，杜绝孤儿进程；
 *   - detectHttpsTools() 严格只读且超时 3 秒，绝不修改用户配置或触发登录。
 */
import { execFile, spawn, spawnSync } from 'node:child_process'
import { accessSync, constants, existsSync } from 'node:fs'
import { delimiter, join } from 'node:path'
import { promisify } from 'node:util'
import { resolveRepoRoot } from './paths.mjs'

const execFileAsync = promisify(execFile)

export const ALLOWED_TUNNEL_PROTOCOLS = new Set(['http2', 'quic', 'auto'])
export const TRY_CLOUDFLARE_FIND_RE = /https:\/\/[a-z0-9-]+\.trycloudflare\.com/i
export const TRY_CLOUDFLARE_STRICT_RE = /^https:\/\/[a-z0-9-]+\.trycloudflare\.com$/
const LOG_RING_LIMIT = 200
const DETECT_TIMEOUT_MS = 3000

const EXTRA_BIN_DIRS = ['/opt/homebrew/bin', '/usr/local/bin', '/usr/bin', '/bin']

export class TunnelError extends Error {
  constructor(message, status = 400, code = 'tunnel_error') {
    super(message)
    this.name = 'TunnelError'
    this.status = status
    this.code = code
  }
}

function defaultRunSync(cmd, args, timeout = DETECT_TIMEOUT_MS) {
  return spawnSync(cmd, args, { encoding: 'utf8', timeout })
}

export function findBinary(name, probe = {}) {
  if (probe?.binaries && Object.hasOwn(probe.binaries, name)) {
    return String(probe.binaries[name] || '')
  }
  const pathDirs = String(process.env.PATH || '').split(delimiter).filter(Boolean)
  const candidates = [...new Set([...pathDirs, ...EXTRA_BIN_DIRS])]
  const suffix = process.platform === 'win32' ? '.exe' : ''
  for (const dir of candidates) {
    const full = join(dir, `${name}${suffix}`)
    try {
      if (existsSync(full)) {
        accessSync(full, constants.X_OK)
        return full
      }
    } catch { /* try next dir */ }
  }
  if (name === 'tailscale' && process.platform === 'darwin') {
    const appBin = '/Applications/Tailscale.app/Contents/MacOS/Tailscale'
    try {
      if (existsSync(appBin)) {
        accessSync(appBin, constants.X_OK)
        return appBin
      }
    } catch { /* ignore */ }
  }
  return ''
}

function firstLine(text) {
  return String(text || '')
    .split(/\r?\n/)
    .map((s) => s.trim())
    .find(Boolean) || ''
}

/**
 * 只读短超时（3s）探测本机 HTTPS 工具状态：cloudflared / tailscale / wrangler。
 */
export function detectHttpsTools({ probe = {} } = {}) {
  const runSync = probe.runSync || defaultRunSync

  const cfBin = findBinary('cloudflared', probe)
  let cloudflared = { installed: false, path: '', version: '' }
  if (cfBin) {
    const res = runSync(cfBin, ['--version'], DETECT_TIMEOUT_MS)
    const ver = firstLine(res?.stdout || res?.stderr)
    cloudflared = {
      installed: res?.status === 0 || Boolean(ver),
      path: cfBin,
      version: ver,
    }
  }

  const tsBin = findBinary('tailscale', probe)
  let tailscale = {
    installed: false,
    path: '',
    online: false,
    loggedIn: false,
    backendState: '',
    dnsName: '',
    funnelEnabled: false,
    funnelUrl: '',
    funnelStatus: '',
  }
  if (tsBin) {
    const statusRes = runSync(tsBin, ['status', '--json'], DETECT_TIMEOUT_MS)
    let backendState = ''
    let dnsName = ''
    let online = false
    let loggedIn = false
    try {
      const parsed = JSON.parse(String(statusRes?.stdout || '{}'))
      backendState = String(parsed?.BackendState || '')
      dnsName = String(parsed?.Self?.DNSName || '').replace(/\.$/, '')
      online = backendState === 'Running' && parsed?.Self?.Online !== false
      loggedIn = backendState === 'Running' || Boolean(dnsName)
    } catch { /* ignore invalid json */ }

    let funnelEnabled = false
    let funnelStatus = ''
    if (online || statusRes?.status === 0) {
      const funnelRes = runSync(tsBin, ['funnel', 'status'], DETECT_TIMEOUT_MS)
      const txt = String(funnelRes?.stdout || funnelRes?.stderr || '').trim()
      funnelStatus = txt.slice(0, 300)
      funnelEnabled = Boolean(funnelRes?.status === 0 && /https:\/\/|funnel on/i.test(txt))
    }

    tailscale = {
      installed: true,
      path: tsBin,
      online,
      loggedIn,
      backendState,
      dnsName,
      funnelEnabled,
      funnelUrl: dnsName ? `https://${dnsName}` : '',
      funnelStatus,
    }
  }

  const wrBin = findBinary('wrangler', probe)
  let wrangler = { installed: false, path: '', version: '' }
  if (wrBin) {
    const res = runSync(wrBin, ['--version'], DETECT_TIMEOUT_MS)
    const ver = firstLine(res?.stdout || res?.stderr)
    wrangler = {
      installed: res?.status === 0 || Boolean(ver),
      path: wrBin,
      version: ver,
    }
  }

  return {
    checkedAt: Date.now(),
    cloudflared,
    tailscale,
    wrangler,
  }
}

export class TunnelManager {
  constructor({
    getConfig = () => ({}),
    log = () => {},
    cloudflaredBin = '',
    syncScriptPath = '',
    syncKvImpl = null,
    spawnImpl = spawn,
    execFileImpl = execFileAsync,
    probe = null,
  } = {}) {
    this.getConfig = getConfig
    this.log = log
    this.cloudflaredBin = cloudflaredBin
    this.syncScriptPath = syncScriptPath
    this.syncKvImpl = syncKvImpl
    this.spawnImpl = spawnImpl
    this.execFileImpl = execFileImpl
    this.probe = probe

    this.state = 'idle' // idle | starting | running | stopping | error
    this.quickUrl = ''
    this.protocol = 'http2'
    this.port = 0
    this.startedAt = 0
    this.pid = null
    this.error = ''
    this.logs = []
    this.proc = null
    this.stopping = false
    this.kvSync = {
      state: 'idle', // idle | syncing | ok | skipped | error
      lastSyncAt: 0,
      lastUrl: '',
      message: '',
    }
  }

  isActive() {
    return Boolean(this.proc) || this.state === 'starting' || this.state === 'running'
  }

  status() {
    return {
      state: this.state,
      quickUrl: this.quickUrl,
      protocol: this.protocol,
      port: this.port,
      startedAt: this.startedAt,
      pid: this.pid,
      error: this.error,
      logs: this.logs.slice(),
      kvSync: { ...this.kvSync },
    }
  }

  async startQuick({ port, protocol, waitUrlMs = 15000 } = {}) {
    if (this.proc || this.state === 'starting' || this.state === 'running' || this.state === 'stopping') {
      throw new TunnelError('Quick Tunnel 已在运行或正在处理中，请先停止', 409, 'tunnel_running')
    }

    const cfg = this.getConfig()
    const cleanProto = String(protocol || cfg.tunnel?.protocol || 'http2').trim()
    if (!ALLOWED_TUNNEL_PROTOCOLS.has(cleanProto)) {
      throw new TunnelError('tunnel.protocol 仅允许 http2 / quic / auto', 400, 'invalid_protocol')
    }

    const cleanPort = Number(port ?? cfg.server?.port ?? 8291)
    if (!Number.isInteger(cleanPort) || cleanPort < 1 || cleanPort > 65535) {
      throw new TunnelError('port 必须是 1–65535 整数', 400, 'invalid_port')
    }

    const bin = this.cloudflaredBin || findBinary('cloudflared', this.probe || {})
    if (!bin) {
      throw new TunnelError('未检测到 cloudflared，请先执行 brew install cloudflared 安装', 400, 'missing_cloudflared')
    }

    this.state = 'starting'
    this.quickUrl = ''
    this.protocol = cleanProto
    this.port = cleanPort
    this.startedAt = 0
    this.pid = null
    this.error = ''
    this.logs = []
    this.stopping = false

    const args = [
      'tunnel',
      '--no-autoupdate',
      '--url',
      `http://127.0.0.1:${cleanPort}`,
      '--protocol',
      cleanProto,
    ]
    const proc = this.spawnImpl(bin, args, {
      detached: process.platform !== 'win32',
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    this.proc = proc
    this.pid = proc.pid || null
    this.#appendLog(`[tunnel] 启动 Quick Tunnel (${cleanProto} -> 127.0.0.1:${cleanPort})`)

    let settled = false
    let resolveReady
    let rejectReady
    const readyPromise = new Promise((resolve, reject) => {
      resolveReady = resolve
      rejectReady = reject
    })

    const finishReady = (err = null) => {
      if (settled) return
      settled = true
      if (timer) clearTimeout(timer)
      if (err) rejectReady(err)
      else resolveReady(this.status())
    }

    const timer = waitUrlMs > 0
      ? setTimeout(() => finishReady(null), waitUrlMs)
      : null
    timer?.unref?.()

    const onUrl = (captured) => {
      if (this.proc !== proc || this.stopping) return
      if (!TRY_CLOUDFLARE_STRICT_RE.test(captured)) return
      if (!this.quickUrl) {
        this.quickUrl = captured
        this.state = 'running'
        this.startedAt = Date.now()
        this.pid = proc.pid || null
        this.log(`[tunnel] Quick Tunnel 就绪: ${captured}`)
        if (this.getConfig().tunnel?.kvSync?.enabled) {
          this.#triggerAutoKvSync(captured)
        }
        finishReady(null)
      }
    }

    if (proc.stdout) this.#bindStream(proc.stdout, onUrl)
    if (proc.stderr) this.#bindStream(proc.stderr, onUrl)

    proc.on('error', (err) => {
      if (this.proc !== proc) return
      this.proc = null
      this.pid = null
      this.quickUrl = ''
      this.startedAt = 0
      this.error = String(err?.message || err)
      this.state = this.stopping ? 'idle' : 'error'
      this.#appendLog(`[tunnel] 进程启动异常: ${this.error}`)
      finishReady(this.stopping ? null : new TunnelError(`cloudflared 启动失败：${this.error}`, 502, 'spawn_failed'))
    })

    proc.on('close', (code) => {
      if (this.proc !== proc) return
      this.proc = null
      this.pid = null
      const wasStopping = this.stopping
      const hadUrl = Boolean(this.quickUrl)
      this.quickUrl = ''
      this.startedAt = 0
      if (wasStopping) {
        this.state = 'idle'
        this.#appendLog('[tunnel] Quick Tunnel 已停止')
        finishReady(null)
        return
      }
      if (!hadUrl || (code !== 0 && code !== null)) {
        this.state = 'error'
        this.error = this.error || `cloudflared 意外退出 (code=${code})`
        this.#appendLog(`[tunnel] ${this.error}`)
        finishReady(new TunnelError(this.error, 502, 'tunnel_exited'))
        return
      }
      this.state = 'idle'
      finishReady(null)
    })

    return readyPromise
  }

  async stop() {
    const proc = this.proc
    if (!proc) {
      this.state = 'idle'
      this.quickUrl = ''
      this.pid = null
      this.startedAt = 0
      return this.status()
    }
    this.stopping = true
    this.state = 'stopping'
    this.#appendLog('[tunnel] 正在终止 Quick Tunnel 进程组…')

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

    this.proc = null
    this.pid = null
    this.quickUrl = ''
    this.startedAt = 0
    this.state = 'idle'
    this.stopping = false
    return this.status()
  }

  async shutdown() {
    await this.stop()
  }

  async syncKv(urlOverride = '') {
    const targetUrl = String(urlOverride || this.quickUrl || '').trim().toLowerCase()
    if (!TRY_CLOUDFLARE_STRICT_RE.test(targetUrl)) {
      throw new TunnelError('当前没有合法的 trycloudflare.com 地址可同步', 400, 'invalid_tunnel_url')
    }

    const cfg = this.getConfig()
    const kv = cfg.tunnel?.kvSync || {}
    this.kvSync = {
      ...this.kvSync,
      state: 'syncing',
      message: '正在同步隧道地址至 Cloudflare KV…',
    }

    try {
      if (typeof this.syncKvImpl === 'function') {
        const res = await this.syncKvImpl({ url: targetUrl, config: cfg })
        this.kvSync = {
          state: 'ok',
          lastSyncAt: Date.now(),
          lastUrl: targetUrl,
          message: String(res?.message || '已同步至 Cloudflare KV'),
        }
        return { ok: true, kvSync: { ...this.kvSync }, tunnel: this.status() }
      }

      const scriptPath = this.syncScriptPath || join(resolveRepoRoot(), 'deploy', 'cf-worker-relay', 'sync-tunnel-url.mjs')
      if (!existsSync(scriptPath)) {
        this.kvSync = {
          state: 'skipped',
          lastSyncAt: Date.now(),
          lastUrl: targetUrl,
          message: '未找到同步脚本 deploy/cf-worker-relay/sync-tunnel-url.mjs',
        }
        return { ok: false, skipped: true, kvSync: { ...this.kvSync }, tunnel: this.status() }
      }

      const mode = kv.mode === 'api' ? 'api' : 'wrangler'
      const args = [scriptPath, '--url', targetUrl, '--mode', mode]
      if (kv.kvNamespaceId) args.push('--namespace-id', String(kv.kvNamespaceId).trim())
      if (kv.accountId) args.push('--account-id', String(kv.accountId).trim())
      if (kv.keyName) args.push('--key', String(kv.keyName).trim())

      const { stdout } = await this.execFileImpl(process.execPath, args, {
        timeout: 15_000,
        env: process.env,
      })
      this.kvSync = {
        state: 'ok',
        lastSyncAt: Date.now(),
        lastUrl: targetUrl,
        message: firstLine(stdout) || '已同步至 Cloudflare KV',
      }
      return { ok: true, kvSync: { ...this.kvSync }, tunnel: this.status() }
    } catch (err) {
      const msg = String(err?.stderr || err?.message || err).trim().slice(0, 240)
      this.kvSync = {
        state: 'error',
        lastSyncAt: Date.now(),
        lastUrl: targetUrl,
        message: msg || 'KV 同步失败',
      }
      throw new TunnelError(`KV 同步失败：${this.kvSync.message}`, 502, 'kv_sync_failed')
    }
  }

  #triggerAutoKvSync(url) {
    this.syncKv(url).catch((err) => {
      this.log(`[warn] 自动同步 Cloudflare KV 失败：${err?.message || err}`)
    })
  }

  #killGroup(proc, sig) {
    if (process.platform !== 'win32' && proc.pid) {
      try {
        process.kill(-proc.pid, sig)
        return
      } catch { /* fallback */ }
    }
    try { proc.kill(sig) } catch { /* ignore */ }
  }

  #bindStream(stream, onUrl) {
    let buf = ''
    stream.setEncoding('utf8')
    stream.on('data', (chunk) => {
      buf += chunk
      let nl
      while ((nl = buf.indexOf('\n')) !== -1) {
        const line = buf.slice(0, nl).replace(/\r/g, '').trimEnd()
        buf = buf.slice(nl + 1)
        if (line) this.#handleLine(line, onUrl)
      }
    })
    stream.on('end', () => {
      const tail = buf.replace(/\r/g, '').trimEnd()
      if (tail) this.#handleLine(tail, onUrl)
    })
  }

  #handleLine(line, onUrl) {
    this.#appendLog(line)
    const m = TRY_CLOUDFLARE_FIND_RE.exec(line)
    if (m) onUrl(m[0].toLowerCase())
  }

  #appendLog(line) {
    const clean = String(line).slice(0, 500)
    this.logs.push(clean)
    if (this.logs.length > LOG_RING_LIMIT) {
      this.logs.splice(0, this.logs.length - LOG_RING_LIMIT)
    }
    this.log(clean)
  }
}
