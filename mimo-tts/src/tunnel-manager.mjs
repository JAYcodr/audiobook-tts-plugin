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
import { execa } from 'execa'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { findBinary, resolveRepoRoot } from './paths.mjs'
import { bindGroupCancel, runSyncCmd, streamLines } from './proc.mjs'

export { findBinary }

export const ALLOWED_TUNNEL_PROTOCOLS = new Set(['http2', 'quic', 'auto'])
export const TRY_CLOUDFLARE_FIND_RE = /https:\/\/[a-z0-9-]+\.trycloudflare\.com/i
export const TRY_CLOUDFLARE_STRICT_RE = /^https:\/\/[a-z0-9-]+\.trycloudflare\.com$/
const LOG_RING_LIMIT = 200
const DETECT_TIMEOUT_MS = 3000

export class TunnelError extends Error {
  constructor(message, status = 400, code = 'tunnel_error') {
    super(message)
    this.name = 'TunnelError'
    this.status = status
    this.code = code
  }
}

function defaultRunSync(cmd, args, timeout = DETECT_TIMEOUT_MS) {
  return runSyncCmd(cmd, args, timeout)
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
    execaImpl = execa,
    probe = null,
  } = {}) {
    this.getConfig = getConfig
    this.log = log
    this.cloudflaredBin = cloudflaredBin
    this.syncScriptPath = syncScriptPath
    this.syncKvImpl = syncKvImpl
    this.execaImpl = execaImpl
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
    this.cancelCtrl = null
    this.donePromise = null
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
    const ac = new AbortController()
    const sub = this.execaImpl(bin, args, {
      detached: process.platform !== 'win32',
      stdin: 'ignore',
      cancelSignal: ac.signal,
      forceKillAfterDelay: 2500,
      reject: false,
    })
    this.proc = sub
    this.cancelCtrl = ac
    this.pid = sub.pid || null
    const cleanupCancel = bindGroupCancel(sub, ac.signal, 2500)
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
      if (this.proc !== sub || this.stopping) return
      if (!TRY_CLOUDFLARE_STRICT_RE.test(captured)) return
      if (!this.quickUrl) {
        this.quickUrl = captured
        this.state = 'running'
        this.startedAt = Date.now()
        this.pid = sub.pid || null
        this.log(`[tunnel] Quick Tunnel 就绪: ${captured}`)
        if (this.getConfig().tunnel?.kvSync?.enabled) {
          this.#triggerAutoKvSync(captured)
        }
        finishReady(null)
      }
    }

    const drainLines = streamLines(sub, {
      onStdout: (line) => this.#handleLine(line, onUrl),
      onStderr: (line) => this.#handleLine(line, onUrl),
    })

    const done = (async () => {
      try {
        const res = await sub
        await drainLines
        if (this.proc !== sub) return
        const wasStopping = this.stopping
        const hadUrl = Boolean(this.quickUrl)
        this.quickUrl = ''
        this.startedAt = 0
        if (wasStopping || res?.isCanceled) {
          this.state = 'idle'
          this.#appendLog('[tunnel] Quick Tunnel 已停止')
          finishReady(null)
          return
        }
        if (res?.failed && !sub.pid) {
          this.state = 'error'
          this.error = String(res.shortMessage || res.originalMessage || 'spawn failed')
          this.#appendLog(`[tunnel] 进程启动异常: ${this.error}`)
          finishReady(new TunnelError(`cloudflared 启动失败：${this.error}`, 502, 'spawn_failed'))
          return
        }
        if (!hadUrl || (res?.exitCode !== 0 && res?.exitCode != null) || res?.failed) {
          this.state = 'error'
          this.error = this.error
            || String(res?.shortMessage || '')
            || `cloudflared 意外退出 (code=${res?.exitCode})`
          this.#appendLog(`[tunnel] ${this.error}`)
          finishReady(new TunnelError(this.error, 502, 'tunnel_exited'))
          return
        }
        this.state = 'idle'
        finishReady(null)
      } catch (err) {
        if (this.proc !== sub) return
        this.quickUrl = ''
        this.startedAt = 0
        this.error = String(err?.message || err)
        this.state = this.stopping ? 'idle' : 'error'
        this.#appendLog(`[tunnel] 进程启动异常: ${this.error}`)
        finishReady(this.stopping ? null : new TunnelError(`cloudflared 启动失败：${this.error}`, 502, 'spawn_failed'))
      } finally {
        cleanupCancel()
        if (this.proc === sub) {
          this.proc = null
          this.cancelCtrl = null
          this.donePromise = null
          this.pid = null
        }
      }
    })()
    this.donePromise = done

    return readyPromise
  }

  async stop() {
    if (!this.proc) {
      this.state = 'idle'
      this.quickUrl = ''
      this.pid = null
      this.startedAt = 0
      return this.status()
    }
    this.stopping = true
    this.state = 'stopping'
    this.#appendLog('[tunnel] 正在终止 Quick Tunnel 进程组…')
    this.cancelCtrl?.abort()
    await this.donePromise

    this.proc = null
    this.cancelCtrl = null
    this.donePromise = null
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
          message: '未找到同步脚本 deploy/cf-worker-relay/sync-tunnel-url.mjs：该脚本只在克隆仓库时提供，不随 npm 发布包分发；请单独部署 deploy/cf-worker-relay/ 或改用 API 同步模式（见 HTTPS-GUIDE.md 方案 D）',
        }
        return { ok: false, skipped: true, kvSync: { ...this.kvSync }, tunnel: this.status() }
      }

      const mode = kv.mode === 'api' ? 'api' : 'wrangler'
      const args = [scriptPath, '--url', targetUrl, '--mode', mode]
      if (kv.kvNamespaceId) args.push('--namespace-id', String(kv.kvNamespaceId).trim())
      if (kv.accountId) args.push('--account-id', String(kv.accountId).trim())
      if (kv.keyName) args.push('--key', String(kv.keyName).trim())

      const { stdout } = await this.execaImpl(process.execPath, args, {
        timeout: 15_000,
        env: process.env,
        stdin: 'ignore',
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
