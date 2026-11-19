import React, { useEffect, useState } from 'react'
import {
  controlQuickTunnelApi,
  fetchTunnelStatusApi,
  syncTunnelKvApi,
} from '../api.js'
import { writeClipboard } from '../delivery.js'
import { Seg } from './Primitives.jsx'

export function HttpsAccessCard({
  service, config, importInfo, tunnel, onRefreshState, onCopy, showToast,
}) {
  const imp = importInfo || {}
  const cfg = config || {}
  const tun = tunnel || {}
  const port = service?.port || cfg.server?.port || 8291
  const defaultTab = imp.relayBaseUrl ? 'relay' : (imp.publicJsonUrl ? 'named' : 'quick')

  const [tab, setTab] = useState(defaultTab)
  const [protocol, setProtocol] = useState(tun.protocol || cfg.tunnel?.protocol || 'http2')
  const [tools, setTools] = useState(null)
  const [busy, setBusy] = useState('')

  const copyCommand = async (cmd, label) => {
    const ok = await writeClipboard(cmd)
    showToast?.(ok ? `已复制 · ${label}` : '复制被浏览器拦截，请手动选中')
  }

  const probeTools = async (silent = false) => {
    if (!silent) setBusy('detect')
    try {
      const res = await fetchTunnelStatusApi(true)
      if (res?.tools) setTools(res.tools)
      if (!silent) showToast?.('已完成本机穿透工具探测')
    } catch (err) {
      if (!silent) showToast?.(`探测失败：${String(err?.message || err)}`)
    } finally {
      if (!silent) setBusy('')
    }
  }

  useEffect(() => {
    probeTools(true)
  }, [])

  const actQuick = async (action) => {
    if (busy) return
    setBusy(action)
    try {
      await controlQuickTunnelApi({ action, protocol })
      await onRefreshState?.()
      showToast?.(
        action === 'start'
          ? 'Quick Tunnel 已启动'
          : action === 'stop'
            ? 'Quick Tunnel 已停止'
            : 'Quick Tunnel 已重启',
      )
    } catch (err) {
      showToast?.(String(err?.message || err))
    } finally {
      setBusy('')
    }
  }

  const runSyncKv = async () => {
    if (busy) return
    setBusy('sync')
    try {
      const res = await syncTunnelKvApi()
      await onRefreshState?.()
      showToast?.(res?.kvSync?.message || '已触发 Cloudflare KV 同步')
    } catch (err) {
      showToast?.(String(err?.message || err))
    } finally {
      setBusy('')
    }
  }

  const tState = tun.state || 'idle'
  const quickUrl = tun.quickUrl || imp.quickTunnelUrl || ''
  const kvSync = tun.kvSync || {}
  const cfTool = tools?.cloudflared
  const tsTool = tools?.tailscale
  const wrTool = tools?.wrangler

  let badgeText = 'LAN ONLY'
  let badgeCls = 'tag'
  if (tState === 'running' && quickUrl) {
    badgeText = 'QUICK RUN'
    badgeCls = 'tag tape'
  } else if (tState === 'starting') {
    badgeText = 'STARTING…'
    badgeCls = 'tag cloud'
  } else if (tState === 'error') {
    badgeText = 'TUNNEL ERR'
    badgeCls = 'tag grease'
  } else if (imp.publicJsonUrl) {
    badgeText = 'NAMED WAN'
    badgeCls = 'tag tape'
  } else if (imp.relayBaseUrl) {
    badgeText = 'RELAY'
    badgeCls = 'tag tape'
  }

  const tailscaleCmd = `tailscale funnel --bg ${port}`
  const namedCmd = [
    'cloudflared tunnel login',
    'cloudflared tunnel create audiobook-tts',
    'cloudflared tunnel route dns audiobook-tts tts.example.dpdns.org',
  ].join('\n')
  const relaySyncCmd = `node deploy/cf-worker-relay/sync-tunnel-url.mjs --from-api http://127.0.0.1:${port}/mimo-tts/api/tunnel/status --mode wrangler`

  return (
    <div className="labelblock https-card" id="httpsAccessCard">
      <div className="lb-hd">
        <span className="silk">HTTPS ACCESS <b>公网 HTTPS 四选一接入与 Quick Tunnel</b></span>
        <span className={badgeCls}>{badgeText}</span>
      </div>

      <div className="https-tabs">
        <Seg
          options={[
            { value: 'quick', label: 'A · Quick Tunnel' },
            { value: 'tailscale', label: 'B · Tailscale Funnel' },
            { value: 'named', label: 'C · 命名隧道' },
            { value: 'relay', label: 'D · Worker + KV 中转' },
          ]}
          value={tab}
          ariaLabel="公网 HTTPS 方案选择"
          onChange={setTab}
        />
        <button
          className="btn btn--sm"
          type="button"
          disabled={Boolean(busy)}
          onClick={() => probeTools(false)}
        >
          {busy === 'detect' ? '探测中…' : '刷新工具探测'}
        </button>
      </div>

      {tab === 'quick' ? (
        <div className="https-pane">
          <div className="https-bar">
            <Seg
              options={[
                { value: 'http2', label: 'HTTP/2（推荐）' },
                { value: 'quic', label: 'QUIC' },
              ]}
              value={protocol === 'quic' ? 'quic' : 'http2'}
              ariaLabel="Quick Tunnel 协议"
              onChange={setProtocol}
            />
            <div className="https-acts">
              {tState === 'running' || tState === 'starting' ? (
                <>
                  <button
                    className="btn btn--sm"
                    type="button"
                    disabled={Boolean(busy)}
                    onClick={() => actQuick('stop')}
                  >
                    {busy === 'stop' ? '停止中…' : '停止隧道'}
                  </button>
                  <button
                    className="btn btn--sm btn--tape"
                    type="button"
                    disabled={Boolean(busy)}
                    onClick={() => actQuick('restart')}
                  >
                    {busy === 'restart' ? '重启中…' : '重启'}
                  </button>
                </>
              ) : (
                <button
                  className="btn btn--sm btn--tape"
                  type="button"
                  disabled={Boolean(busy)}
                  onClick={() => actQuick('start')}
                >
                  {busy === 'start' ? '启动中…' : '一键启动 Quick Tunnel'}
                </button>
              )}
            </div>
            <span className="mono https-tool-pill">
              {cfTool
                ? (cfTool.installed ? `cloudflared ${cfTool.version || '已就绪'}` : '未检测到 cloudflared')
                : '正在探测 cloudflared…'}
            </span>
          </div>

          {cfTool && !cfTool.installed ? (
            <div className="addr https-install">
              <code>brew install cloudflared</code>
              <button
                className="btn btn--sm"
                type="button"
                onClick={() => copyCommand('brew install cloudflared', '安装命令')}
              >
                复制 brew 安装命令
              </button>
            </div>
          ) : null}

          {quickUrl ? (
            <div className="addr">
              <code id="quickTunnelUrl">{quickUrl}</code>
              <button
                className="btn btn--sm"
                type="button"
                data-copy="quick-url"
                onClick={() => onCopy?.('quick-url')}
              >
                复制公网
              </button>
              <button
                className="btn btn--sm btn--tape"
                type="button"
                data-copy="quick-import"
                onClick={() => onCopy?.('quick-import')}
              >
                复制 Legado 导入
              </button>
            </div>
          ) : null}

          {tun.error ? (
            <div className="https-err mono">{`隧道异常：${tun.error}`}</div>
          ) : null}

          <div className="https-warn">
            <b>临时通道警示：</b>
            重启后域名会变化 · 仅建议个人测试与临时分享 · 上限 ≤200 并发请求 · 不支持 SSE 流式。长期固定域名请改用 B/C/D 方案。
          </div>
        </div>
      ) : null}

      {tab === 'tailscale' ? (
        <div className="https-pane">
          <div className="https-status-row mono">
            <span>
              {tsTool?.installed
                ? `Tailscale 已安装 · ${tsTool.online ? `在线 (${tsTool.dnsName || '已登录'})` : `离线 (${tsTool.backendState || '未登录'})`}`
                : '未检测到 Tailscale CLI（需安装官方 Tailscale 客户端并登录同一账号）'}
            </span>
            {tsTool?.funnelEnabled && tsTool?.funnelUrl ? (
              <span className="tag tape">{`Funnel 已开: ${tsTool.funnelUrl}`}</span>
            ) : null}
          </div>
          <div className="addr">
            <code>{tailscaleCmd}</code>
            <button
              className="btn btn--sm btn--tape"
              type="button"
              onClick={() => copyCommand(tailscaleCmd, 'Tailscale Funnel 命令')}
            >
              复制命令
            </button>
          </div>
          <p className="hint">
            零域名、免费自带 Let&apos;s Encrypt HTTPS 证书；适合自用与已加入同一个 Tailnet 的设备（需在 Tailscale 管理台开启 Funnel ACL）。
          </p>
        </div>
      ) : null}

      {tab === 'named' ? (
        <div className="https-pane">
          <p className="hint" style={{ marginTop: 0 }}>
            <b>免费域名推荐：</b>
            DigitalPlat FreeDomain（<code>.dpdns.org</code> / <code>.us.kg</code> / <code>.qzz.io</code>）或 <code>eu.org</code>（支持完整 Cloudflare NS 托管）。配置完在「渲染设置 → 08 对外地址」填入域名即可。
          </p>
          <div className="https-pitfalls">
            <b>避坑红线：</b>
            ✗ 严禁自签证书（Android 7+ 默认拒绝用户 CA，Legado 直接 SSL 握手失败） · ✗ 严禁 ClouDNS 免费子域（不支持改 NS） · ✗ 严禁 Freenom（已停服） · ✗ 勿将 <code>*.pages.dev</code> 直接绑定命名隧道。
          </div>
          <div className="addr">
            <code style={{ whiteSpace: 'pre-wrap' }}>{namedCmd}</code>
            <button
              className="btn btn--sm"
              type="button"
              onClick={() => copyCommand(namedCmd, '命名隧道命令')}
            >
              复制命令
            </button>
          </div>
        </div>
      ) : null}

      {tab === 'relay' ? (
        <div className="https-pane">
          <div className="https-status-row mono">
            <span>
              {`wrangler: ${wrTool?.installed ? (wrTool.version || '已安装') : '未安装'} · 中转地址: ${imp.relayBaseUrl || '未填写（在设置 08 填写 publicRelayUrl）'}`}
            </span>
            {kvSync.state && kvSync.state !== 'idle' ? (
              <span className={`tag${kvSync.state === 'ok' ? ' tape' : kvSync.state === 'error' ? ' grease' : ''}`}>
                {`KV: ${kvSync.state}${kvSync.message ? ` · ${kvSync.message}` : ''}`}
              </span>
            ) : null}
          </div>
          <div className="https-bar">
            <button
              className="btn btn--sm btn--tape"
              type="button"
              disabled={!quickUrl || Boolean(busy)}
              title={quickUrl ? '把当前 Quick Tunnel 地址立即写入 Cloudflare KV' : '请先启动 Quick Tunnel'}
              onClick={runSyncKv}
            >
              {busy === 'sync' ? '同步中…' : '立即同步 KV'}
            </button>
            <button
              className="btn btn--sm"
              type="button"
              onClick={() => copyCommand(relaySyncCmd, 'KV 同步脚本命令')}
            >
              复制 5 分钟 Cron 同步命令
            </button>
          </div>
          <p className="hint">
            使用仓库内 <code>deploy/cf-worker-relay/worker.js</code> 暴露固定 <code>*.workers.dev</code> 地址：仅放行听书与 OpenAI 路由、严禁转发 <code>/api/*</code> 管理接口，并校验 KV 目标为 <code>trycloudflare.com</code>（防 SSRF）。
          </p>
        </div>
      ) : null}
    </div>
  )
}
