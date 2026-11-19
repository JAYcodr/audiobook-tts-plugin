import React from 'react'
import { BODY_TEXT, ERR_CODES, PROVIDER_CN } from '../constants.js'
import { curlText, legadoPayload } from '../delivery.js'
import { num } from '../format.js'
import { PreviewPlayer } from './PreviewPlayer.jsx'
import { Rowx } from './Primitives.jsx'
import { QrCard } from './QrCard.jsx'

export function DeliveryView({
  service, config, importInfo, onCopy, onExportConfig, onOpenSetup, showToast,
}) {
  const imp = importInfo || {}
  const cfg = config || {}
  const running = Boolean(service?.running)
  const hasToken = Boolean(imp.hasToken)
  const lanUrls = Array.isArray(imp.lanUrls) ? imp.lanUrls : []
  const publicJson = imp.publicJsonUrl || ''
  const jsonUrl = imp.jsonUrl || '—'
  const listenUrl = imp.listenUrl || '—'
  const token = cfg.auth?.token || ''
  const extraHeaders = cfg.legado?.extraHeaders && typeof cfg.legado.extraHeaders === 'object' ? cfg.legado.extraHeaders : {}
  const extraCount = Object.keys(extraHeaders).length
  const payload = legadoPayload(imp, cfg)
  const curl = curlText(listenUrl)
  const concurrency = num(cfg.synth?.concurrency)
  const rpm = num(cfg.limits?.rpm)
  const provider = service?.provider || cfg.upstream?.provider || 'mimo'
  const dlvMeta = running
    ? `局域网直连 · ${hasToken ? '令牌已配置' : '令牌未启用'}${publicJson ? ' · 对外地址已设置' : ''}`
    : '服务已停止 · 先启动再交付'

  const checks = [
    [running, '服务运行', running ? 'RUN' : 'STOP'],
    [hasToken, 'URL 令牌', hasToken ? '已配置' : '缺失'],
    [Boolean(cfg.auth?.enabled), 'Basic 鉴权', cfg.auth?.enabled ? '开启' : '关闭'],
    [lanUrls.length > 0, '局域网入口', `${lanUrls.length} 个`],
    [Boolean(publicJson), '对外地址', publicJson || '未设置'],
    [extraCount > 0, '附加请求头', extraCount ? `${extraCount} 项` : '未设置'],
    [true, '端口', `${service?.host || cfg.server?.host || '—'}:${service?.port || cfg.server?.port || '—'}`],
    [true, '引擎', PROVIDER_CN[provider] || provider],
  ]

  const specRow = (sk, sv, sa) => (
    <React.Fragment key={sk}>
      <span className="sk">{sk}</span>
      <span className="sv">{sv}</span>
      <span className="sa">{sa || null}</span>
    </React.Fragment>
  )

  return (
    <section className="view view--delivery" id="view-delivery" aria-label="交付">
      <div className="dlv-left">
        <div>
          <h2>交付</h2>
          <div className="sub">Master Delivery</div>
        </div>
        <p className="chain-note" style={{ margin: 0 }}>
          交付物 = 一条 Legado 在线朗读引擎。
          <br />
          支持手机离线扫码或复制 URL 导入。
        </p>
        <ol className="steps">
          <li className="step">
            <span className="sn">01</span>
            <div>
              <b>确认服务在跑</b>
              <span>{`transport 显示 RUN，端口 ${service?.port || cfg.server?.port || '—'} 在监听`}</span>
            </div>
          </li>
          <li className="step">
            <span className="sn">02</span>
            <div>
              <b>扫码或复制地址</b>
              <span>同 Wi-Fi 用「局域网扫码」；穿透公网用「公网导入码」</span>
            </div>
          </li>
          <li className="step">
            <span className="sn">03</span>
            <div>
              <b>在阅读里导入</b>
              <span>朗读界面 → 设置 → 在线朗读 → 网络导入 → 粘贴或识别文本</span>
            </div>
          </li>
          <li className="step">
            <span className="sn">04</span>
            <div>
              <b>在线交互试听</b>
              <span>下方可直接合成旁白/对话/混排 WAV 验证音色与链路</span>
            </div>
          </li>
        </ol>
        <div className="arch-sec" style={{ marginTop: 'auto' }}>
          <Rowx k="并发" v={`${concurrency} 路`} />
          <Rowx k="限速" v={`${rpm} 次 / 分钟`} />
          <Rowx k="Body" v="form-urlencoded" />
        </div>
      </div>

      <div className="dlv-main">
        <div className="dlv-top">
          <div className="dh">
            <span className="silk">DELIVERY NOTE</span>
            <b>母带交付单</b>
          </div>
          <div className="dmeta">{dlvMeta}</div>
        </div>

        <div className="qr-grid" aria-label="离线导入二维码">
          <QrCard
            title="局域网扫码导入"
            badge="LAN"
            url={imp.jsonUrl}
            copyKind="import"
            onCopy={onCopy}
          />
          {publicJson ? (
            <QrCard
              title="公网穿透扫码导入"
              badge="WAN"
              url={publicJson}
              copyKind="public-import"
              onCopy={onCopy}
            />
          ) : null}
        </div>

        <div className="labelblock">
          <div className="lb-hd">
            <span className="silk">IMPORT URL <b>一键导入地址</b></span>
            <span className="silk">{publicJson ? 'WAN' : 'LAN'}</span>
          </div>
          <div className="addr">
            <code id="importUrl">{jsonUrl}</code>
            <button className="btn btn--sm btn--tape" type="button" data-copy="import" onClick={() => onCopy('import')}>
              复制导入地址
            </button>
          </div>
          {publicJson ? (
            <div className="addr" style={{ marginTop: 6 }}>
              <code id="publicImportUrl">{publicJson}</code>
              <button className="btn btn--sm" type="button" data-copy="public-import" onClick={() => onCopy('public-import')}>
                复制公网
              </button>
            </div>
          ) : null}
          <div className="addr-note" id="importNote">
            {lanUrls.length
              ? `局域网 ${lanUrls[0]} · 手机与电脑需在同一网段${publicJson ? '' : ' · 对外地址未设置'}`
              : '宿主还没探测到局域网地址 · 仍可用下方 curl 或「试听」在本机验证'}
          </div>
        </div>

        <div className="labelblock">
          <div className="lb-hd">
            <span className="silk">LISTEN URL <b>朗读接口</b></span>
            <span className="silk">POST · WAV</span>
          </div>
          <div className="addr">
            <code id="listenUrl">{listenUrl}</code>
            <button className="btn btn--sm" type="button" data-copy="listen" onClick={() => onCopy('listen')}>
              复制朗读
            </button>
          </div>
          <div className="spec" style={{ marginTop: 7 }}>
            {specRow('METHOD', 'POST')}
            {specRow('CONTENT-TYPE', 'application/x-www-form-urlencoded')}
            {specRow(
              'BODY',
              BODY_TEXT,
              <button className="btn btn--sm btn--ghost" type="button" data-copy="body" onClick={() => onCopy('body')}>
                复制
              </button>,
            )}
            {specRow(
              'URL 令牌',
              token ? `?token=${token}` : '未启用',
              token ? (
                <button className="btn btn--sm btn--ghost" type="button" data-copy="token" onClick={() => onCopy('token')}>
                  复制
                </button>
              ) : null,
            )}
            {specRow('并发 / 限速', `${concurrency} 路 · ${rpm} 次 / 分钟`)}
          </div>
        </div>

        <div className="labelblock grease">
          <div className="lb-hd">
            <span className="silk">MASTER CONTENT <b>母带内容 · legado.json</b></span>
            <button className="btn btn--sm" type="button" data-copy="json" onClick={() => onCopy('json')}>
              复制 JSON
            </button>
          </div>
          <pre className="code json" id="jsonBlock">{JSON.stringify(payload, null, 2)}</pre>
        </div>

        <div className="labelblock">
          <div className="lb-hd">
            <span className="silk">SMOKE TEST <b>在线试听与 curl 验收</b></span>
            <button className="btn btn--sm" type="button" data-copy="curl" onClick={() => onCopy('curl')}>
              复制 curl
            </button>
          </div>
          <PreviewPlayer
            draftPatch={null}
            showToast={showToast}
            defaultRole="narrator"
            showRuleToggle={true}
            title="已保存配置直接试听"
          />
          <pre className="code" id="curlBlock" style={{ marginTop: 8 }}>{curl}</pre>
        </div>
      </div>

      <aside className="dlv-right">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
          <div>
            <h2>交付校验</h2>
            <div className="sub">Preflight</div>
          </div>
          <button className="btn btn--sm" type="button" onClick={onOpenSetup}>
            运行体检
          </button>
        </div>
        <div className="checklist">
          {checks.map(([ok, label, value]) => (
            <div key={label} className={`check${ok ? '' : ' warn'}`}>
              <span className="ck">{ok ? '✓' : '○'}</span>
              <span className="cn2">{label}</span>
              <span className="cv" title={String(value)}>{String(value)}</span>
            </div>
          ))}
        </div>
        <div className="errcodes">
          <span className="silk" style={{ marginBottom: 3 }}>ERROR CODES <b>错误码</b></span>
          {ERR_CODES.map(([code, fix]) => (
            <div key={code} className="errcode">
              <b>{code}</b>
              <span>{fix}</span>
            </div>
          ))}
        </div>
        <div className="dlv-actions">
          <button className="btn btn--sm" type="button" data-copy="import" onClick={() => onCopy('import')}>
            复制导入地址
          </button>
          <button className="btn btn--sm" type="button" data-copy="json" onClick={() => onCopy('json')}>
            复制 JSON
          </button>
          <button className="btn btn--sm" type="button" data-copy="curl" onClick={() => onCopy('curl')}>
            复制 curl
          </button>
          <button className="btn btn--sm" type="button" data-action="export-config" onClick={onExportConfig}>
            导出配置
          </button>
        </div>
        <p className="hint" style={{ marginTop: 'auto' }}>
          手机相机或 Legado 二维码识别可直接扫上方二维码（纯离线 SVG 生成，不经第三方服务器）。
        </p>
      </aside>
    </section>
  )
}
