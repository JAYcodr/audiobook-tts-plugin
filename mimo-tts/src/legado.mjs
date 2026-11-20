/**
 * Legado（阅读）导入配置生成：构造 /legado.json 与客户端导入信息。
 */
import { hasProxyHeaders, isPrivateAddress, lanAddresses, publicBase, resolveAuth } from './auth.mjs'
import { encodeHintHeader } from './hints.mjs'
import { sendJson } from './http.mjs'

export const LEGADO_BODY = 'text={{java.encodeURI(speakText)}}&speed={{speakSpeed}}'

export function buildLegadoEntry({
  baseUrl,
  tokenQuery = '',
  extraHeaders = {},
  name = '听书值守 TTS',
  concurrentRate = '4',
  audioFormat = 'wav',
}) {
  // 用 form-urlencoded 而不是 JSON：`{{java.encodeURI(speakText)}}` 是 Legado 自带的
  // URLEncoder，中文和引号都能安全过；JSON body 则要处理 `"` 转义，书里一出现引号就炸。
  const option = {
    method: 'POST',
    body: LEGADO_BODY,
    header: {
      'Content-Type': 'application/x-www-form-urlencoded',
      ...extraHeaders,
    },
  }
  const contentType = String(audioFormat || 'wav').trim().toLowerCase() === 'mp3'
    ? 'audio/mpeg'
    : 'audio/wav'
  return {
    name,
    url: `${baseUrl}/listening${tokenQuery},${JSON.stringify(option)}`,
    contentType,
    concurrentRate: String(concurrentRate || '4'),
  }
}

export function handleLegadoJson(req, res, url, config) {
  const auth = config.auth || {}
  const authRes = resolveAuth(req, url, auth)
  if (auth.enabled && auth.token) {
    // 走 Cloudflare Tunnel 时 TCP 对端可能是内网宿主机，因此带了转发头就一律按公网处理，必须带令牌。
    if (!authRes.ok && (hasProxyHeaders(req) || !isPrivateAddress(req.socket?.remoteAddress))) {
      // 绝不能回 JSON：Legado 会把任意 JSON 对象当成一个朗读引擎强读 $.name 抛出 NPE（ImportError:null）。
      res.writeHead(401, {
        'Content-Type': 'text/plain; charset=utf-8',
        'X-Audiobook-Hint': encodeHintHeader('需要令牌：请在地址末尾加上 ?token=…（完整地址见控制台「交付」页）'),
      })
      return res.end('需要令牌：请在地址末尾加上 ?token=…（完整地址见控制台「交付」页）')
    }
  }
  const configuredRelay = String(config.tunnel?.kvSync?.publicRelayUrl || '').trim().replace(/\/+$/, '')
  const relayOriginHeader = String(req?.headers?.['x-relay-origin'] || '').trim().replace(/\/+$/, '')
  const base = (!String(config.server?.publicUrl || '').trim() && configuredRelay && relayOriginHeader === configuredRelay)
    ? configuredRelay
    : publicBase(req, config.server)
  // 若来访者使用的是只读分享令牌，必须签发同一个只读令牌，绝不能把主管理 token 泄露出去。
  const effectiveToken = authRes.ok && authRes.role === 'read' ? authRes.token : auth.token
  const tokenQuery = auth.enabled && effectiveToken ? `?token=${encodeURIComponent(effectiveToken)}` : ''
  const entry = buildLegadoEntry({
    baseUrl: base,
    tokenQuery,
    extraHeaders: config.legado?.extraHeaders || {},
    name: config.legado?.name || '听书值守 TTS',
    concurrentRate: String(config.synth?.concurrency || 4),
    audioFormat: config.audio?.format || 'wav',
  })
  return sendJson(res, 200, [entry])
}

export function buildImportInfo(req, config, { tunnelStatus = null } = {}) {
  const { token, enabled, readTokens } = config.auth || {}
  const port = config.server?.port || 8291
  const hostFromReq = String(req?.headers?.host || '').split(':')[0]
  const ips = lanAddresses()
  const host = ips.includes(hostFromReq) || (!ips.length && hostFromReq)
    ? hostFromReq
    : (ips[0] || hostFromReq || '127.0.0.1')
  const q = enabled && token ? `?token=${encodeURIComponent(token)}` : ''
  const activeReads = Array.isArray(readTokens) ? readTokens.filter((rt) => rt && rt.token) : []
  const primaryRead = activeReads[0] || null
  const sq = enabled && primaryRead?.token ? `?token=${encodeURIComponent(primaryRead.token)}` : ''
  const publicUrl = String(config.server?.publicUrl || '').trim().replace(/\/+$/, '')
  const quickTunnelUrl = String(tunnelStatus?.quickUrl || '').trim().replace(/\/+$/, '')
  const relayBaseUrl = String(config.tunnel?.kvSync?.publicRelayUrl || '').trim().replace(/\/+$/, '')
  const lanBaseUrl = `http://${host}:${port}`
  const lanList = ips.map((ip) => `http://${ip}:${port}`)
  const bestOpenAiBase = publicUrl || relayBaseUrl || quickTunnelUrl || lanBaseUrl
  const bestShareBase = publicUrl || relayBaseUrl || quickTunnelUrl || lanBaseUrl
  const makeShareLinks = (rt) => {
    const tq = enabled && rt?.token ? `?token=${encodeURIComponent(rt.token)}` : ''
    return {
      id: rt.id,
      label: rt.label,
      createdAt: rt.createdAt || 0,
      token: rt.token,
      jsonUrl: `${lanBaseUrl}/legado.json${tq}`,
      listenUrl: `${lanBaseUrl}/listening${tq}`,
      publicJsonUrl: publicUrl ? `${publicUrl}/legado.json${tq}` : '',
      quickJsonUrl: quickTunnelUrl ? `${quickTunnelUrl}/legado.json${tq}` : '',
      relayJsonUrl: relayBaseUrl ? `${relayBaseUrl}/legado.json${tq}` : '',
      bestJsonUrl: `${bestShareBase}/legado.json${tq}`,
    }
  }
  return {
    jsonUrl: `${lanBaseUrl}/legado.json${q}`,
    listenUrl: `${lanBaseUrl}/listening${q}`,
    publicJsonUrl: publicUrl ? `${publicUrl}/legado.json${q}` : '',
    publicListenUrl: publicUrl ? `${publicUrl}/listening${q}` : '',
    quickTunnelUrl,
    quickJsonUrl: quickTunnelUrl ? `${quickTunnelUrl}/legado.json${q}` : '',
    relayBaseUrl,
    relayJsonUrl: relayBaseUrl ? `${relayBaseUrl}/legado.json${q}` : '',
    shareJsonUrl: sq ? `${lanBaseUrl}/legado.json${sq}` : '',
    shareListenUrl: sq ? `${lanBaseUrl}/listening${sq}` : '',
    sharePublicJsonUrl: publicUrl && sq ? `${publicUrl}/legado.json${sq}` : '',
    shareQuickJsonUrl: quickTunnelUrl && sq ? `${quickTunnelUrl}/legado.json${sq}` : '',
    shareRelayJsonUrl: relayBaseUrl && sq ? `${relayBaseUrl}/legado.json${sq}` : '',
    shareBestJsonUrl: sq ? `${bestShareBase}/legado.json${sq}` : '',
    shareToken: primaryRead?.token || '',
    shareTokens: activeReads.map(makeShareLinks),
    hasReadToken: Boolean(enabled && primaryRead?.token),
    openaiBaseUrl: `${bestOpenAiBase}/v1`,
    openaiQuickBaseUrl: quickTunnelUrl ? `${quickTunnelUrl}/v1` : '',
    openaiLanBaseUrl: `${lanBaseUrl}/v1`,
    openaiEnabled: Boolean(config.openaiServer?.enabled),
    openaiUsesCustomKey: Boolean(String(config.openaiServer?.apiKey || '').trim()),
    lanUrls: lanList,
    hasToken: Boolean(enabled && token),
  }
}
