/**
 * 鉴权与来源地址推导：Basic / URL Token / Header Token、内网判定、反代基地址与网卡探测。
 */
import { timingSafeEqual, createHash } from 'node:crypto'
import { networkInterfaces } from 'node:os'

export function safeEqual(a, b) {
  const ba = Buffer.from(String(a))
  const bb = Buffer.from(String(b))
  if (ba.length !== bb.length) return false
  return timingSafeEqual(ba, bb)
}

export function extractRequestToken(req, url) {
  return String(
    url?.searchParams?.get('token')
    || req?.headers?.['x-mimo-token']
    || req?.headers?.['x-audiobook-token']
    || '',
  ).trim()
}

/**
 * 解析当前请求的权限角色：
 *   - `admin`: auth.enabled=false、主 auth.token 或 Basic 账密通过
 *   - `read`: 命中 auth.readTokens[] 中某条只读分享令牌
 *   - `none`: 未通过鉴权
 */
export function resolveAuth(req, url, auth) {
  if (!auth?.enabled) return { ok: true, role: 'admin', tokenId: '', tokenLabel: '', token: '' }

  const token = extractRequestToken(req, url)
  if (auth.token && token && safeEqual(token, auth.token)) {
    return { ok: true, role: 'admin', tokenId: 'admin', tokenLabel: '管理主令牌', token: auth.token }
  }

  const readTokens = Array.isArray(auth.readTokens) ? auth.readTokens : []
  if (token && readTokens.length) {
    let matched = null
    for (const rt of readTokens) {
      if (rt?.token && safeEqual(token, rt.token)) matched = rt
    }
    if (matched) {
      return {
        ok: true,
        role: 'read',
        tokenId: String(matched.id || ''),
        tokenLabel: String(matched.label || ''),
        token: String(matched.token),
      }
    }
  }

  const header = req?.headers?.authorization || ''
  if (header.startsWith('Basic ')) {
    const decoded = Buffer.from(header.slice(6), 'base64').toString('utf8')
    const idx = decoded.indexOf(':')
    if (idx >= 0) {
      const user = decoded.slice(0, idx)
      const pass = decoded.slice(idx + 1)
      if (safeEqual(user, auth.user) && safeEqual(pass, auth.pass)) {
        return { ok: true, role: 'admin', tokenId: 'basic', tokenLabel: 'Basic', token: '' }
      }
    }
  }
  return { ok: false, role: 'none', tokenId: '', tokenLabel: '', token: '' }
}

/** Basic 或 URL/Header token，二选一即可。默认仅放行管理权限；朗读路由需显式传 `{ allowRead: true }`。 */
export function authorized(req, url, auth, { allowRead = false } = {}) {
  const res = resolveAuth(req, url, auth)
  if (!res.ok) return false
  if (res.role === 'read' && !allowRead) return false
  return true
}

/** 请求是否经过隧道/反代（有转发头就说明不是直连）。 */
export function hasProxyHeaders(req) {
  const h = req.headers || {}
  return Boolean(h['cf-connecting-ip'] || h['x-forwarded-for'] || h['x-forwarded-host'] || h['x-real-ip'])
}

/**
 * 真实来源地址：反代/隧道下取 CF-Connecting-IP（或 X-Forwarded-For 第一跳），
 * 直连时取 socket 对端。值守页的「谁在读」靠它区分设备。
 */
export function clientAddress(req) {
  const h = req.headers || {}
  const first = (v) => String(v || '').split(',')[0].trim()
  const ip = first(h['cf-connecting-ip'])
    || first(h['x-forwarded-for'])
    || first(h['x-real-ip'])
    || req.socket?.remoteAddress
    || ''
  return ip.replace(/^::ffff:/i, '')
}

/** 内网来源判定：回环 + 10/8 + 172.16/12 + 192.168/16（含 IPv6 映射写法）。 */
export function isPrivateAddress(ip) {
  const addr = String(ip || '').replace(/^::ffff:/i, '')
  if (addr === '::1' || addr.startsWith('127.')) return true
  const m = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(addr)
  if (!m) return false
  const a = Number(m[1])
  const b = Number(m[2])
  return a === 10 || (a === 192 && b === 168) || (a === 172 && b >= 16 && b <= 31)
}

export function clientKeyOf(req) {
  const ip = clientAddress(req)
  const ua = String(req.headers?.['user-agent'] || '')
  return `${createHash('sha1').update(`${ip}|${ua}`).digest('hex').slice(0, 8)}@${ip}`
}

/**
 * 对外基地址（不含尾斜杠）。优先级：
 *   1. server.publicUrl —— 明确配置的对外域名，反代/隧道下最可靠
 *   2. X-Forwarded-Proto / X-Forwarded-Host（Cloudflare Tunnel 会带）
 *   3. 请求的 Host 头
 */
export function publicBase(req, server) {
  const configured = String(server?.publicUrl || '').trim().replace(/\/+$/, '')
  if (configured) return configured

  const headers = req.headers || {}
  const host = String(headers['x-forwarded-host'] || headers.host || '').split(',')[0].trim()
  if (!host) return `http://127.0.0.1:${server?.port || 8291}`
  const proto = String(headers['x-forwarded-proto'] || '').split(',')[0].trim() || 'http'
  return `${proto}://${host}`
}

/** 非回环 IPv4，优先 192.168 / 10. / 172.16-31（手机能连上的那些）。 */
export function lanAddresses() {
  const out = []
  for (const list of Object.values(networkInterfaces())) {
    for (const net of list || []) {
      if (net.family !== 'IPv4' || net.internal) continue
      // 198.18.0.0/15 是代理软件的 TUN 网段（Clash 等），手机连不上
      if (/^198\.1[89]\./.test(net.address)) continue
      out.push(net.address)
    }
  }
  const score = (ip) => (ip.startsWith('192.168.') ? 3 : ip.startsWith('10.') ? 2 : ip.startsWith('172.') ? 1 : 0)
  return out.sort((a, b) => score(b) - score(a))
}
