/**
 * Cloudflare Worker 固定域名中转脚本（方案 D）：
 *
 * 安全边界：
 *   1. 严格路径白名单：仅放行 /health、/legado.json、/listening、/v1/models、/v1/audio/speech；
 *      严禁放行 /mimo-tts/api/*、/audiobook-tts/api/*、/api/* 控制管理路由（一律 404）；
 *   2. 防 SSRF：KV 中的上游地址必须严格匹配 ^https://[a-z0-9-]+\.trycloudflare\.com$；
 *   3. 流式透传请求体与响应体，不缓存整段音频，兼容 Workers 免费版 10ms CPU 限制；
 *   4. 严禁打印任何 Authorization、API Key 或 ?token= 日志。
 */

const VALID_TUNNEL_ORIGIN_RE = /^https:\/\/[a-z0-9-]+\.trycloudflare\.com$/

const ALLOWED_ROUTES = new Map([
  ['/health', new Set(['GET'])],
  ['/legado.json', new Set(['GET'])],
  ['/listening', new Set(['GET', 'POST'])],
  ['/v1/models', new Set(['GET', 'OPTIONS'])],
  ['/v1/audio/speech', new Set(['POST', 'OPTIONS'])],
])

const FORWARD_HEADERS = [
  'authorization',
  'content-type',
  'x-api-key',
  'x-mimo-token',
  'x-audiobook-token',
  'cf-connecting-ip',
  'user-agent',
  'accept',
]

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type, X-API-Key',
  'Access-Control-Max-Age': '86400',
}

function jsonResponse(status, payload, extraHeaders = {}) {
  return new Response(JSON.stringify(payload, null, 2), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      ...extraHeaders,
    },
  })
}

export default {
  async fetch(request, env) {
    const reqUrl = new URL(request.url)
    const pathname = reqUrl.pathname
    const method = String(request.method || 'GET').toUpperCase()

    const allowedMethods = ALLOWED_ROUTES.get(pathname)
    if (!allowedMethods) {
      return jsonResponse(404, { error: 'not_found', message: 'Route not allowed by relay policy' })
    }
    if (!allowedMethods.has(method)) {
      return jsonResponse(405, { error: 'method_not_allowed', message: `Method ${method} not allowed` })
    }

    if (method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS })
    }

    const keyName = (env && env.KV_KEY_NAME) || 'tunnel_url'
    let rawTarget = ''
    try {
      rawTarget = env && env.TUNNEL_KV ? String((await env.TUNNEL_KV.get(keyName)) || '').trim() : ''
    } catch {
      return jsonResponse(503, { error: 'kv_read_failed', message: 'Failed to read upstream tunnel from KV' })
    }

    if (!VALID_TUNNEL_ORIGIN_RE.test(rawTarget)) {
      return jsonResponse(503, {
        error: 'tunnel_unavailable',
        message: 'Upstream Quick Tunnel URL missing or invalid in KV',
      })
    }

    const targetUrl = new URL(pathname + reqUrl.search, rawTarget)
    if (targetUrl.origin !== rawTarget) {
      return jsonResponse(503, { error: 'invalid_upstream_origin', message: 'Upstream origin mismatch' })
    }

    const headers = new Headers()
    for (const h of FORWARD_HEADERS) {
      const val = request.headers.get(h)
      if (val) headers.set(h, val)
    }
    headers.set('X-Forwarded-Host', reqUrl.host)
    headers.set('X-Forwarded-Proto', reqUrl.protocol.replace(':', ''))
    headers.set('X-Relay-Origin', reqUrl.origin)

    const init = {
      method,
      headers,
      redirect: 'manual',
    }
    if (method !== 'GET' && method !== 'HEAD' && request.body != null) {
      init.body = request.body
      init.duplex = 'half'
    }

    let upstreamRes
    try {
      upstreamRes = await fetch(targetUrl.toString(), init)
    } catch {
      return jsonResponse(503, {
        error: 'upstream_unreachable',
        message: 'Quick Tunnel upstream connection failed or timed out',
      })
    }

    const upstreamCt = (upstreamRes.headers.get('content-type') || '').toLowerCase()
    const isGatewayError = (upstreamRes.status === 502 && !upstreamCt.includes('application/json'))
      || upstreamRes.status === 530
      || upstreamRes.status === 521
      || upstreamRes.status === 522
      || upstreamRes.status === 524
    if (isGatewayError) {
      return jsonResponse(503, {
        error: 'upstream_tunnel_error',
        upstreamStatus: upstreamRes.status,
        message: 'Quick Tunnel is offline or returning gateway error; restart tunnel and sync KV',
      })
    }

    const respHeaders = new Headers(upstreamRes.headers)
    if (pathname.startsWith('/v1/') && !respHeaders.has('Access-Control-Allow-Origin')) {
      respHeaders.set('Access-Control-Allow-Origin', '*')
    }
    respHeaders.set('X-Relay-Worker', 'audiobook-tts-relay')

    return new Response(upstreamRes.body, {
      status: upstreamRes.status,
      headers: respHeaders,
    })
  },
}
