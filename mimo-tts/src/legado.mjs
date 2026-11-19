/**
 * Legado（阅读）导入配置生成：构造 /legado.json 与客户端导入信息。
 */
import { hasProxyHeaders, isPrivateAddress, lanAddresses, publicBase, safeEqual } from './auth.mjs'
import { sendJson } from './http.mjs'

export const LEGADO_BODY = 'text={{java.encodeURI(speakText)}}&speed={{speakSpeed}}'

export function buildLegadoEntry({ baseUrl, tokenQuery = '', extraHeaders = {}, name = '听书值守 TTS', concurrentRate = '4' }) {
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
  return {
    name,
    url: `${baseUrl}/listening${tokenQuery},${JSON.stringify(option)}`,
    contentType: 'audio/wav',
    concurrentRate: String(concurrentRate || '4'),
  }
}

export function handleLegadoJson(req, res, url, config) {
  const auth = config.auth || {}
  if (auth.enabled && auth.token) {
    const provided = url.searchParams.get('token')
    const ok = safeEqual(String(provided || ''), auth.token)
    // 走 Cloudflare Tunnel 时 TCP 对端可能是内网宿主机，因此带了转发头就一律按公网处理，必须带令牌。
    if (!ok && (hasProxyHeaders(req) || !isPrivateAddress(req.socket?.remoteAddress))) {
      // 绝不能回 JSON：Legado 会把任意 JSON 对象当成一个朗读引擎强读 $.name 抛出 NPE（ImportError:null）。
      res.writeHead(401, { 'Content-Type': 'text/plain; charset=utf-8' })
      return res.end('需要令牌：请在地址末尾加上 ?token=…（完整地址见控制台「交付」页）')
    }
  }
  const base = publicBase(req, config.server)
  const tokenQuery = auth.enabled && auth.token ? `?token=${encodeURIComponent(auth.token)}` : ''
  const entry = buildLegadoEntry({
    baseUrl: base,
    tokenQuery,
    extraHeaders: config.legado?.extraHeaders || {},
    name: config.legado?.name || '听书值守 TTS',
    concurrentRate: String(config.synth?.concurrency || 4),
  })
  return sendJson(res, 200, [entry])
}

export function buildImportInfo(req, config, { tunnelStatus = null } = {}) {
  const { token, enabled } = config.auth || {}
  const port = config.server?.port || 8291
  const hostFromReq = String(req?.headers?.host || '').split(':')[0]
  const ips = lanAddresses()
  const host = ips.includes(hostFromReq) || (!ips.length && hostFromReq)
    ? hostFromReq
    : (ips[0] || hostFromReq || '127.0.0.1')
  const q = enabled && token ? `?token=${encodeURIComponent(token)}` : ''
  const publicUrl = String(config.server?.publicUrl || '').trim().replace(/\/+$/, '')
  const quickTunnelUrl = String(tunnelStatus?.quickUrl || '').trim().replace(/\/+$/, '')
  const relayBaseUrl = String(config.tunnel?.kvSync?.publicRelayUrl || '').trim().replace(/\/+$/, '')
  const lanBaseUrl = `http://${host}:${port}`
  const lanList = ips.map((ip) => `http://${ip}:${port}`)
  const bestOpenAiBase = publicUrl || relayBaseUrl || quickTunnelUrl || lanBaseUrl
  return {
    jsonUrl: `${lanBaseUrl}/legado.json${q}`,
    listenUrl: `${lanBaseUrl}/listening${q}`,
    publicJsonUrl: publicUrl ? `${publicUrl}/legado.json${q}` : '',
    publicListenUrl: publicUrl ? `${publicUrl}/listening${q}` : '',
    quickTunnelUrl,
    quickJsonUrl: quickTunnelUrl ? `${quickTunnelUrl}/legado.json${q}` : '',
    relayBaseUrl,
    relayJsonUrl: relayBaseUrl ? `${relayBaseUrl}/legado.json${q}` : '',
    openaiBaseUrl: `${bestOpenAiBase}/v1`,
    openaiQuickBaseUrl: quickTunnelUrl ? `${quickTunnelUrl}/v1` : '',
    openaiLanBaseUrl: `${lanBaseUrl}/v1`,
    openaiEnabled: Boolean(config.openaiServer?.enabled),
    openaiUsesCustomKey: Boolean(String(config.openaiServer?.apiKey || '').trim()),
    lanUrls: lanList,
    hasToken: Boolean(enabled && token),
  }
}
