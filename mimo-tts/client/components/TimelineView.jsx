import React, { useMemo } from 'react'
import { PROVIDER_CN, ROLE_CN, ROLE_GLYPH } from '../constants.js'
import {
  ago, clamp, clock, deviceOf, fmtBytes, fmtInt, hashOf, hm, ipOf, latQ, latSec,
  localStateText, mmss, mmssPad, mmssTenth, num, pad2, ttlText,
} from '../format.js'
import { rulerTicks } from '../timeline-math.js'
import { HeadRow, Rowx, VuTable } from './Primitives.jsx'

function clipLabel(item) {
  const src = item.sourceLabel === '—' ? '来源未知' : item.sourceLabel
  return [
    `第 ${item.index + 1} 段`,
    ROLE_CN[item.role] || item.role,
    src,
    item.error ? '渲染失败' : item.cacheHit ? '缓存命中' : '未命中',
    `延迟 ${latSec(item.latencyMs)}`,
    `${item.chars} 字`,
    item.audioSeconds > 0 ? `音频 ${item.audioSeconds.toFixed(1)}s` : '音频 —',
    clock(item.at),
    hashOf(item.client) ? `设备 ${hashOf(item.client)}` : '',
  ].filter(Boolean).join(' · ')
}

export function TrackHeads({
  running, live, service, localInfo, items, totalAudio, totalChars, cacheHits,
  avgLatency, maxLatency, selectedItem, compact,
}) {
  const today = live?.today || {}
  const lat = live?.latency || {}
  const hybrid = service?.hybrid || {}
  const openai = service?.openai || {}
  const active = Array.isArray(live?.active) ? live.active : []
  const provider = service?.provider || 'mimo'
  const localWarm = Boolean(localInfo?.warm) || localInfo?.state === 'ready'

  let mainRows
  let latRows
  if (!running) {
    mainRows = [
      <HeadRow key="w" k="本窗" v={<b>—</b>} />,
      <HeadRow key="a" k="音频总长" v={<b>—</b>} />,
      <HeadRow key="t" k="今日" v={<b>—</b>} />,
      <HeadRow key="c" k="缓存" v={<b>—</b>} />,
    ]
    latRows = [
      <HeadRow key="avg" k="均值" v={<b>—</b>} />,
      <HeadRow key="p95" k="p95" v={<b>—</b>} />,
      <HeadRow key="max" k="最慢" v={<b>—</b>} />,
    ]
  } else {
    mainRows = compact
      ? [
        <HeadRow key="sc" k="段/字" v={<b>{`${items.length} / ${fmtInt(totalChars)}`}</b>} />,
        <HeadRow key="au" k="音频" v={<b>{mmssPad(totalAudio)}</b>} />,
      ]
      : [
        <HeadRow key="sc" k="本窗 段 / 字" v={<b>{`${items.length} / ${fmtInt(totalChars)}`}</b>} />,
        <HeadRow key="au" k="音频总长" v={<b>{mmssPad(totalAudio)}</b>} />,
        <HeadRow key="td" k="今日" v={<b>{`${fmtInt(today.segments)} 段 · ${hm(today.seconds)}`}</b>} />,
        <HeadRow key="ch" k="缓存命中" v={<b>{`${cacheHits} / ${items.length}`}</b>} />,
      ]
    latRows = compact
      ? [
        <HeadRow key="avg" k="均值" v={<b>{latSec(avgLatency)}</b>} />,
        <HeadRow key="p95" k="p95" v={<b>{latSec(lat.p95)}</b>} />,
      ]
      : [
        <HeadRow key="avg" k="均值" v={<b>{latSec(avgLatency)}</b>} />,
        <HeadRow key="p95" k="p95" v={<b>{latSec(lat.p95)}</b>} />,
        <HeadRow key="max" k="最慢" v={<b>{latSec(maxLatency)}</b>} />,
      ]
  }

  let windowRows
  if (!running || !items.length) {
    windowRows = [
      <div key="hd" className="silk" style={{ display: 'block', marginBottom: 2 }}>WINDOW <b>本窗</b></div>,
      <HeadRow key="s" k="起" v={<b>—</b>} />,
      <HeadRow key="e" k="止" v={<b>—</b>} />,
      <HeadRow key="d" k="跨度" v={<b>—</b>} />,
    ]
  } else {
    const first = items[0]
    const last = items[items.length - 1]
    windowRows = [
      <div key="hd" className="silk" style={{ display: 'block', marginBottom: 2 }}>WINDOW <b>本窗</b></div>,
      <HeadRow key="s" k="起" v={<b>{clock(first.at)}</b>} />,
      <HeadRow key="e" k="止" v={<b>{clock(last.at)}</b>} />,
      <HeadRow key="d" k="跨度" v={<b>{`${Math.round((last.at - first.at) / 1000)} 秒${compact ? '' : ` · 末 ${items.length} 段`}`}</b>} />,
      compact ? null : <HeadRow key="c" k="CUE 选中" v={<b>{selectedItem ? mmssTenth(selectedItem.startSec) : '—'}</b>} />,
    ].filter(Boolean)
  }

  let note
  if (!running) note = '走带停止 · 无信号'
  else if (hybrid.enabled) {
    const reason = hybrid.lastSwitchReasonText || hybrid.lastSwitchReason || (localWarm ? '本地已就绪，云端顶班结束' : '离线，本地尚未就绪')
    note = `混合顶班 ${num(hybrid.bootstrapCount)}/${num(hybrid.maxCloudBootstrap)} · ${reason}`
  } else if (provider === 'local') note = '纯本地渲染 · 云端待命'
  else if (provider === 'openai') note = `OpenAI 兼容 · ${openai.model || 'tts-1'}`
  else note = '纯云端渲染 · 本地未参与'

  let readerNodes
  if (!running) {
    readerNodes = (
      <div className="reader off">
        <span className="ld" />
        <b>无设备</b>
        <span className="idle">—</span>
        <small>服务未运行</small>
      </div>
    )
  } else if (!active.length) {
    readerNodes = (
      <div className="reader off">
        <span className="ld" />
        <b>无设备</b>
        <span className="idle">—</span>
        <small>还没有活跃读者</small>
      </div>
    )
  } else {
    readerNodes = active.slice(0, 3).map((r, i) => {
      const idle = num(r.idleMs) > 120000
      return (
        <div key={`${r.client || i}-${i}`} className={i === 0 ? 'reader' : 'reader off'}>
          <span className="ld" />
          <b>{ipOf(r.client)}</b>
          <span className="idle">{ago(r.at)}</span>
          <small>{`${hashOf(r.client) || '设备'} · ${idle ? `最后活动 ${clock(r.at)}` : '活跃'}`}</small>
        </div>
      )
    })
  }

  const maxBootstrap = num(hybrid.maxCloudBootstrap)
  const bootstrap = num(hybrid.bootstrapCount)
  const cellBoxes = maxBootstrap > 0 && maxBootstrap <= 8
    ? Array.from({ length: maxBootstrap }, (_, i) => <i key={i} className={i < bootstrap ? 'on' : undefined} />)
    : []

  const cloudHeadTitle = provider === 'openai' ? 'OPENAI' : 'CLOUD'
  const cloudHeadState = !running
    ? '已停止'
    : provider === 'openai'
      ? (openai.ready ? `${openai.model || 'tts-1'} · 就绪` : 'OpenAI · 未配置')
      : (hybrid.cloudReady ? '云端 · 备用' : '云端 · 不可用')

  return (
    <div className="heads" aria-label="轨道头">
      <div className="heads-top">
        <span className="silk">TRACKS <b>通道</b></span>
        <span className="silk">{running ? `${items.length} 段` : '停机'}</span>
      </div>
      <div className="heads-core">
        <div className="head head--take">
          <div>
            <span className="counter">{running ? mmssPad(totalAudio) : '--:--'}</span>
            <small>TAPE</small>
          </div>
        </div>
        <div className="head head--main">
          <div className="h-title">
            <span className="idx">01</span>
            <b>PROGRAM</b>
            <small>主带</small>
          </div>
          <div className="head-rows">{mainRows}</div>
        </div>
        <div className="head head--lat">
          <div className="h-title">
            <span className="idx">LAT</span>
            <b>渲染耗时</b>
          </div>
          <div className="head-rows">{latRows}</div>
        </div>
        <div className="head head--local">
          <span className="idx">02</span>
          <b>LOCAL</b>
          <span className="st">{running ? localStateText(localInfo) : '已停止'}</span>
        </div>
        <div className="head head--cloud">
          <span className="idx">03</span>
          <b>{cloudHeadTitle}</b>
          <span className="st">{cloudHeadState}</span>
        </div>
      </div>
      <div className="heads-gap" aria-hidden="true" />
      <div className="head head--readers">
        <div className="silk" style={{ marginBottom: 1 }}>READERS <b>读者</b></div>
        <div className="readers">{readerNodes}</div>
        <div className="hybrid-cells" aria-label="混合顶班配额">
          {cellBoxes}
          <span>{`顶班 ${bootstrap}/${maxBootstrap}`}</span>
        </div>
        <div className="head-window">{windowRows}</div>
        <div className="heads-note">{note}</div>
      </div>
    </div>
  )
}

export function TapeArea({
  running, paused, items, totalAudio, totalChars, cacheHits, avgLatency, live, service,
  selectedIndex, selItem, onSelect, onHover, hoverAt, onAct, latScale = 1000,
}) {
  const lat = live?.latency || {}
  const hybrid = service?.hybrid || {}
  const ticks = useMemo(() => rulerTicks(totalAudio), [totalAudio])
  const p95 = num(lat.p95)
  const p95Pct = p95 > 0 ? clamp((p95 / latScale) * 100, 0, 100) : 0
  const cloudCount = items.filter((x) => x.source === 'cloud').length
  const empty = !running || items.length === 0
  const first = items[0]
  const last = items[items.length - 1]

  const meta = running && items.length
    ? `${clock(first.at)} → ${clock(last.at)} · ${fmtInt(totalChars)} 字 · 渲染 ${((avgLatency * items.length) / 1000).toFixed(1)}s · 命中 ${cacheHits}/${items.length}`
    : '—'
  const recTagCls = paused ? 'rec-tag paused' : 'rec-tag'
  const recTagText = !running ? 'STOP' : paused ? 'PAUSED' : `REC ${mmssPad(totalAudio)}`

  return (
    <div className="timeline">
      <div className="tl-top">
        <div className="tl-title">
          <span className="eyebrow">TIMELINE</span>
          <b>{`本窗 · 末 ${items.length} 段`}</b>
          <span className={recTagCls}><i />{recTagText}</span>
        </div>
        <div className="tl-meta">{meta}</div>
      </div>
      <div className="tl-core">
        <div className="ruler" aria-hidden="true">
          {ticks.ticks.map((t, i) => (
            <span
              key={`tk${i}`}
              className={`tick ${t.major ? 'major' : 'minor'}`}
              style={{ left: `${t.pct.toFixed(3)}%` }}
            />
          ))}
          {ticks.ticks.filter((t) => t.major && t.t < totalAudio - 1).map((t, i) => (
            <span
              key={`tl${i}`}
              className={`tlabel${t.t === 0 ? ' edge-l' : ''}`}
              style={{ left: `${t.pct.toFixed(3)}%` }}
            >
              {mmss(t.t)}
            </span>
          ))}
          {selItem ? <span className="cue" style={{ left: `${clamp(selItem.startPct, 0, 100).toFixed(3)}%` }} /> : null}
        </div>
        <div className="tape" aria-label="节目带（按音频时长剪接的合成片段）">
          {items.map((item) => {
            const slow = !item.error && p95 > 0 && item.latencyMs > p95
            const cls = ['clip', item.cacheHit ? 'hit' : 'miss']
            if (slow) cls.push('slow')
            if (hoverAt != null && hoverAt === item.at) cls.push('is-hover')
            if (item.error) cls.push('error')
            const label = clipLabel(item)
            return (
              <button
                key={`${item.at}-${item.index}`}
                className={cls.join(' ')}
                type="button"
                role="listitem"
                aria-selected={String(item.index === selectedIndex)}
                aria-label={label}
                title={label}
                data-clip={item.index}
                style={{ flexBasis: `${item.wPct.toFixed(3)}%` }}
                onClick={() => onSelect(item)}
                onMouseEnter={() => onHover(item)}
                onMouseLeave={() => onHover(null)}
                onFocus={() => onHover(item)}
                onBlur={() => onHover(null)}
              >
                <span className="role">{ROLE_GLYPH[item.role] || '旁'}</span>
                <span className="wbar" aria-hidden="true"><i style={{ width: `${item.wbar.toFixed(1)}%` }} /></span>
                <span className="no" aria-hidden="true">{pad2(item.index + 1)}</span>
                <span className="cache" aria-hidden="true" />
                <span className="lat" aria-hidden="true"><i style={{ width: `${item.latPct.toFixed(1)}%` }} /></span>
                {item.segments > 1 ? <span className="seg" aria-hidden="true" /> : null}
              </button>
            )
          })}
        </div>
        <div className="latlane" aria-label="每段渲染耗时">
          {items.map((item) => (
            <span
              key={`lat-${item.at}-${item.index}`}
              className={`lbar${!item.error && p95 > 0 && item.latencyMs > p95 ? ' slow' : ''}`}
              style={{ flexBasis: `${item.wPct.toFixed(3)}%` }}
              title={item.error ? '失败' : latSec(item.latencyMs)}
            >
              <i style={{ height: `${item.latPct.toFixed(1)}%` }} />
            </span>
          ))}
          {p95 > 0 ? (
            <span className="p95" style={{ bottom: `${p95Pct.toFixed(2)}%` }}>
              <span>{`p95 ${(p95 / 1000).toFixed(2)}s`}</span>
            </span>
          ) : null}
        </div>
        <div className="rail rail--local" aria-label="本地来源泳道">
          {items.map((item) => (
            <span key={`rl-${item.at}-${item.index}`} className="rbar" style={{ flexBasis: `${item.wPct.toFixed(3)}%` }}>
              {item.source === 'local' ? <i /> : null}
            </span>
          ))}
        </div>
        <div className="rail rail--cloud" aria-label="云端来源泳道">
          {items.map((item) => (
            <span key={`rc-${item.at}-${item.index}`} className="rbar" style={{ flexBasis: `${item.wPct.toFixed(3)}%` }}>
              {item.source === 'cloud' ? <i /> : null}
            </span>
          ))}
          {running && !cloudCount ? (
            <span className="rail-note">
              {hybrid.enabled
                ? `本窗无云端段 · 启动时顶班 ${num(hybrid.bootstrapCount)}/${num(hybrid.maxCloudBootstrap)} 段，本地就绪后切回`
                : '本窗无云端/远程段'}
            </span>
          ) : null}
        </div>
        {running && items.length ? <div className="playhead" aria-hidden="true" /> : null}
        {empty ? (
          <div className="tl-empty">
            <div className="leader"><span>{running ? 'LEADER · 空带' : 'LEADER · 无信号'}</span></div>
            <h3>{running ? '走带空带 —— 还没有片段' : '走带停止 —— 服务未运行'}</h3>
            <p>
              {running
                ? '窗口里还没有任何朗读片段。让手机上的阅读 App 朗读一段，第一枚 clip 会落在带尾。'
                : '停机后实时片段与渲染读数全部冻结为空态。历史工程仍在「工程史」里，参数仍在「渲染设置」里。'}
            </p>
            {running ? null : (
              <button className="btn btn--tape" type="button" onClick={() => onAct('start')}>
                启动服务
              </button>
            )}
          </div>
        ) : null}
      </div>
      <div className="tl-gap" aria-hidden="true" />
      <div className="takes">
        <div className="takes-hd">
          <span className="silk">TAKES <b>场记 · 最近流水</b></span>
          <span className="th-meta">{running ? `最近 ${items.length} 条 · 与时间线同源` : '停机 · 无实时流水'}</span>
        </div>
        <div className="takes-list" role="list" aria-label="最近合成流水">
          {running ? (
            items.length ? (
              items.slice().reverse().map((item) => {
                const slow = !item.error && p95 > 0 && item.latencyMs > p95
                const cls = hoverAt != null && hoverAt === item.at ? 'take is-hover' : 'take'
                return (
                  <div
                    key={`take-${item.at}-${item.index}`}
                    className={cls}
                    role="listitem"
                    tabIndex={0}
                    data-clip={item.index}
                    aria-selected={String(item.index === selectedIndex)}
                    title={clipLabel(item)}
                    onClick={() => onSelect(item)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        onSelect(item)
                      }
                    }}
                    onMouseEnter={() => onHover(item)}
                    onMouseLeave={() => onHover(null)}
                    onFocus={() => onHover(item)}
                    onBlur={() => onHover(null)}
                  >
                    <span className="tt">{clock(item.at)}</span>
                    <span className="tr">{ROLE_GLYPH[item.role] || '旁'}</span>
                    <span className={`ts ${item.source || ''}`.trim()}>{item.sourceLabel === '—' ? '未知' : item.sourceLabel}</span>
                    <span className="tx">{item.text || '（没有文本）'}</span>
                    <span className="td" title={`${hashOf(item.client) || '设备'} · ${ipOf(item.client)}`}>
                      {hashOf(item.client) || ipOf(item.client)}
                    </span>
                    <span className={`tl${slow ? ' slow' : ''}`}>{item.error ? '失败' : latSec(item.latencyMs)}</span>
                    <span className={`tc ${item.error ? 'miss' : item.cacheHit ? 'hit' : 'miss'}`}>
                      {item.error ? '失败' : item.cacheHit ? '命中' : '未命中'}
                    </span>
                  </div>
                )
              })
            ) : (
              <div className="empty-takes">
                <b>走带空带，还没有片段</b>
                <span>让手机上的阅读 App 朗读一段，第一枚 clip 会落在带尾。</span>
              </div>
            )
          ) : (
            <div className="empty-takes">
              <b>走带停止，无实时流水</b>
              <span>{`最后快照 ${clock(last?.at || Date.now())} · 启动服务后，新片段会重新出现在带尾。`}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export function Inspector({ running, live, service, localInfo, config, item, items, onAct, onActLocal, onToggleResident, busy, lastSync }) {
  const cache = live?.cache || {}
  const today = live?.today || {}
  const lat = live?.latency || {}
  const provider = service?.provider || config?.upstream?.provider || 'mimo'
  const rpm = live?.rpm || {}
  const rpmByProvider = live?.rpmByProvider || null
  const rpmUnlimited = Boolean(rpm.unlimited) || (provider === 'local' && rpm.limit == null)
  const rpmLimit = rpmUnlimited ? null : Math.max(1, num(rpm.limit, 100))
  const rpmText = rpmUnlimited ? `${num(rpm.used)}/∞` : `${num(rpm.used)}/${rpmLimit}`
  const hybrid = service?.hybrid || {}
  const openai = service?.openai || {}
  const localState = localInfo?.state || 'disabled'
  const localWarm = Boolean(localInfo?.warm) || localState === 'ready'
  const localEnabled = Boolean(localInfo?.enabled) || provider === 'local' || provider === 'hybrid'
  const cloudReady = Boolean(hybrid.cloudReady)
  const p95 = num(lat.p95)
  const cacheRatio = num(cache.maxEntries) > 0 ? clamp(num(cache.entries) / num(cache.maxEntries), 0, 1) : 0
  const rpmRatio = rpmUnlimited ? 0 : clamp(num(rpm.used) / rpmLimit, 0, 1)
  const cfg = config || {}
  const ttl = cfg.cache?.ttlSeconds

  if (!running) {
    const rows = [
      ['今日段数', `${fmtInt(today.segments)} 段`],
      ['今日时长', hm(today.seconds)],
      ['平均延迟', latSec(live?.avgLatencyMs)],
      ['缓存命中', `${((num(cache.hitRate) || 0) * 100).toFixed(1)}%`],
      ['累计请求', fmtInt(live?.totals?.requests)],
      ['累计时长', hm(live?.totals?.seconds)],
    ]
    return (
      <aside className="inspector" aria-label="拾取头 · 选中片段与引擎读数">
        <div className="ins-offline">
          <div className="ins-hd">
            <span className="silk">PICKUP <b>拾取头</b></span>
            <span className="cn">停机</span>
          </div>
          <div className="ins-stopped">
            <div className="banner">
              <b>服务已停止，实时数据为空</b>
              <span>
                {`最后快照 ${clock(lastSync)}`}
                <br />
                停止后 /api/state 不再产生新片段；启动后恢复走带。
              </span>
            </div>
            <button className="btn btn--tape" type="button" onClick={() => onAct('start')}>
              启动服务
            </button>
          </div>
          <div className="ins-block" style={{ marginTop: 8 }}>
            <div className="ins-hd">
              <span className="silk">LAST SNAPSHOT <b>停机前读数</b></span>
            </div>
            <div className="cache-rows">
              {rows.map(([k, v]) => <Rowx key={k} k={k} v={v} />)}
            </div>
          </div>
        </div>
      </aside>
    )
  }

  const srcKey = item ? item.source : ''
  const tags = []
  if (item) {
    tags.push(
      <span key="src" className={`tag ${srcKey === 'local' ? 'tape' : srcKey === 'cloud' ? 'cloud' : 'hollow'}`}>
        {item.sourceLabel === '—' ? '来源未知' : item.sourceLabel}
      </span>,
    )
    tags.push(<span key="role" className="tag hollow">{ROLE_CN[item.role] || item.role}</span>)
    tags.push(
      <span key="cache" className={`tag ${item.error ? 'grease' : item.cacheHit ? 'hollow' : 'grease'}`}>
        {item.error ? '渲染失败' : item.cacheHit ? '命中' : '未命中'}
      </span>,
    )
    if (item.index === items.length - 1) tags.push(<span key="tail" className="tag grease pick-rec">带尾 · REC</span>)
    if (!item.error && p95 > 0 && item.latencyMs > p95) tags.push(<span key="slow" className="tag grease">慢渲染</span>)
  }

  const localRowCls = ['eng-row']
  if (localState === 'starting') localRowCls.push('warm')
  else if (!localWarm) localRowCls.push('off')
  const engLocalSub = !localEnabled
    ? '当前渲染来源不使用本地引擎'
    : localState === 'stopped'
      ? `内存已释放 · 空闲卸载 ${num(localInfo?.idleUnloadSeconds)}s`
      : localState === 'starting'
        ? `加载中… 首次约 ${localInfo?.loadS ? `${localInfo.loadS}s` : '数秒'}`
        : localState === 'error'
          ? (localInfo?.lastError || '本地引擎出错')
          : `pid ${localInfo?.pid || '—'} · :${localInfo?.port || '—'} · 加载 ${localInfo?.loadS ?? '—'}s · 最近 ${localInfo?.lastUsed ? clock(localInfo.lastUsed) : '—'}`
  const localBtnText = !localEnabled
    ? '本地未启用'
    : localState === 'starting'
      ? '加载中…'
      : localState === 'stopping'
        ? '卸载中…'
        : localWarm ? '卸下本地模型' : '加载本地模型'
  const localBtnDisabled = !localEnabled || localState === 'starting' || localState === 'stopping' || Boolean(busy)
  const localIdleSec = num(localInfo?.idleUnloadSeconds ?? config?.upstream?.local?.idleUnloadSeconds, 1800)
  const localResident = localIdleSec === 0
  const localHoldRemain = num(localInfo?.warmHoldRemainingSec)
  const localHint = !localEnabled
    ? '当前渲染来源不使用本地引擎'
    : localResident
      ? '常驻内存（不自动卸载 · 约 1–2.3 GB）'
      : localWarm
        ? (localHoldRemain > 0 ? `预热保活中（余 ${localHoldRemain}s）· 空闲 ${localIdleSec}s 卸载` : `空闲 ${localIdleSec}s 自动卸载`)
        : `云端顶班（最多 ${num(hybrid.maxCloudBootstrap)} 段）`
  const hybridNote = hybrid.enabled
    ? (localWarm
      ? `顶班 ${num(hybrid.bootstrapCount)}/${num(hybrid.maxCloudBootstrap)} 段 · ${hybrid.lastSwitchReasonText || hybrid.lastSwitchReason || '本地已就绪'}`
      : `云端顶班（最多 ${num(hybrid.maxCloudBootstrap)} 段）`)
    : provider === 'local'
      ? '纯本地渲染 · 云端待命'
      : provider === 'openai'
        ? `OpenAI 兼容 · ${cfg.upstream?.openai?.baseUrl || ''}`
        : '纯云端渲染 · 本地未参与'

  return (
    <aside className="inspector" aria-label="拾取头 · 选中片段与引擎读数">
      <div className="ins-online">
        <div className="ins-block">
          <div className="ins-hd">
            <span className="silk">PICKUP <b>拾取头</b></span>
            <span className="cn">{item ? `${mmssTenth(item.startSec)} – ${mmssTenth(item.endSec)}` : '等待片段'}</span>
          </div>
          <div className="pick-tags">{tags}</div>
          <p className="pick-text">
            {item ? (item.text || '（这段没有文本）') : '还没有片段。让阅读 App 朗读一段，这里会显示正在合成的句子。'}
          </p>
          {item?.error && (item.errorMessage || item.errorHint) && (
            <div style={{ fontSize: 11, color: 'var(--grease)', marginBottom: 6, lineHeight: 1.45 }}>
              <b>{item.errorMessage || '请求失败'}</b>
              {item.errorHint ? ` · ${item.errorHint}` : ''}
            </div>
          )}
          <div className="pick-meta">
            <div className="kv"><span className="k">延迟 LATENCY</span><span className="v">{item ? (item.error ? '失败' : latSec(item.latencyMs)) : '—'}</span></div>
            <div className="kv"><span className="k">字数 CHARS</span><span className="v">{item ? `${item.chars} 字` : '—'}</span></div>
            <div className="kv"><span className="k">音频 AUDIO</span><span className="v">{item && item.audioSeconds > 0 ? `${item.audioSeconds.toFixed(1)} s` : '—'}</span></div>
            <div className="kv"><span className="k">段 SEG</span><span className="v">{item ? `${item.segments} 段` : '—'}</span></div>
            <div className="kv"><span className="k">到达 AT</span><span className="v">{item ? clock(item.at) : '—'}</span></div>
            <div className="kv"><span className="k">角色 ROLE</span><span className="v">{item ? (ROLE_CN[item.role] || item.role) : '—'}</span></div>
          </div>
          <div className="pick-device">
            <span>设备</span>
            <b>{item ? `${deviceOf(item.client)} · ${ipOf(item.client)}` : '—'}</b>
          </div>
        </div>

        <div className="ins-block">
          <div className="ins-hd">
            <span className="silk">ENGINE <b>引擎</b></span>
            <span className="cn">{PROVIDER_CN[provider] || provider}</span>
          </div>
          <div className="eng">
            <div className={localRowCls.join(' ')}>
              <span className="ld" />
              <b>本地 Qwen3-TTS</b>
              <span className="st">{!localEnabled ? '未启用' : localWarm ? '热' : localState === 'starting' ? '加载中' : localState === 'error' ? '出错' : '已卸载'}</span>
              <span className="val">{localWarm && num(localInfo?.rssMb) > 0 ? `${(num(localInfo.rssMb) / 1024).toFixed(1)} GB` : '—'}</span>
            </div>
            <div className="eng-sub">{engLocalSub}</div>
            <div className="eng-act">
              <button
                className="btn btn--sm"
                type="button"
                disabled={localBtnDisabled}
                onClick={() => onActLocal(localWarm ? 'unload' : 'load')}
              >
                {localBtnText}
              </button>
              {localEnabled && onToggleResident ? (
                <button
                  className={`btn btn--sm${localResident ? ' btn--tape' : ''}`}
                  type="button"
                  disabled={Boolean(busy)}
                  title={localResident ? '当前常驻内存（约 1–2.3 GB），点击切回省内存（空闲 30 分钟卸载）' : '当前省内存模式，点击切为保持常驻'}
                  onClick={onToggleResident}
                >
                  {localResident ? '保持常驻' : '省内存'}
                </button>
              ) : null}
              <span className="eng-sub">{localHint}</span>
            </div>
            <div className={`eng-row${(provider === 'openai' ? openai.ready : cloudReady) ? '' : ' off'}`}>
              <span className="ld" />
              <b>{provider === 'openai' ? 'OpenAI 兼容' : 'MiMo 云端'}</b>
              <span className="st">{provider === 'openai' ? (openai.ready ? '已配置' : '未配置') : (cloudReady ? '就绪 · 备用' : '不可用')}</span>
              <span className="val" title={provider === 'openai' ? (openai.model || '') : (cfg.upstream?.model || '')}>
                {provider === 'openai' ? (openai.model || '未配置模型') : (cfg.upstream?.model || '未配置模型')}
              </span>
            </div>
            <div className="eng-sub">{hybridNote}</div>
          </div>
        </div>

        <div className="ins-block">
          <div className="ins-hd">
            <span className="silk">CACHE <b>缓存带</b></span>
            <span className="cn">{`命中 ${((num(cache.hitRate) || 0) * 100).toFixed(1)}%`}</span>
          </div>
          <div className="vu">
            <VuTable ratio={cacheRatio} />
            <div className="reads">
              <b>{`${Math.round(cacheRatio * 100)}%`}</b>
              <small>{`${fmtInt(cache.entries)} / ${fmtInt(cache.maxEntries)} 条`}</small>
              <small>{`${fmtBytes(cache.bytes)} / ${fmtBytes(cache.maxBytes)}`}</small>
            </div>
          </div>
          <div className="cache-rows">
            <Rowx k="命中" v={fmtInt(cache.hits)} />
            <Rowx k="未命中" v={fmtInt(cache.misses)} />
            <Rowx k="TTL" v={ttlText(ttl)} />
            <Rowx k="复用率" v={`${((num(cache.hitRate) || 0) * 100).toFixed(1)}%`} />
          </div>
        </div>

        <div className="ins-block">
          <div className="ins-hd">
            <span className="silk">TODAY <b>今日工程</b></span>
            <span className="cn">{`${fmtInt(today.segments)} 段 · ${hm(today.seconds)}`}</span>
          </div>
          <div className="today-grid">
            <div className="kv"><span className="k">合成时长</span><span className="v">{hm(today.seconds)}</span></div>
            <div className="kv"><span className="k">平均延迟</span><span className="v">{latSec(live?.avgLatencyMs)}</span></div>
            <div className="kv"><span className="k">字符</span><span className="v">{fmtInt(today.chars)}</span></div>
            <div className="kv"><span className="k">错误</span><span className="v">{String(num(today.errors))}</span></div>
          </div>
          <div className="lat-row" title={`最近 ${num(lat.samples)} 段延迟分位`}>
            <span>p50 <b>{latQ(lat.p50, lat.samples)}</b></span>
            <span>p95 <b>{latQ(lat.p95, lat.samples)}</b></span>
            <span>max <b>{latQ(lat.max, lat.samples)}</b></span>
            <span>{rpmUnlimited ? 'local/m' : 'rpm'} <b>{rpmText}</b></span>
          </div>
        </div>

        <div className="ins-block">
          <div className="ins-hd">
            <span className="silk">LIMITS <b>容量</b></span>
            <span className="cn">{`并发 ${num(cfg.synth?.concurrency)} · 队列 ${num(rpm.waiting)}`}</span>
          </div>
          <div className="limit-meter">
            <span className="ml">{rpmUnlimited ? 'LOCAL' : 'RPM'}</span>
            <span className="meter-bar"><i style={{ width: `${rpmUnlimited ? 0 : Math.max(1.5, rpmRatio * 100)}%` }} /></span>
            <span className="mv">{rpmUnlimited ? `${num(rpm.used)} / ∞` : `${num(rpm.used)} / ${rpmLimit}`}</span>
          </div>
          <div className="cache-rows">
            <Rowx k="并发" v={`${num(cfg.synth?.concurrency)} 路`} />
            <Rowx k="队列" v={String(num(rpm.waiting))} />
            {rpmByProvider ? (
              <>
                <Rowx k="云端 RPM" v={`${num(rpmByProvider.mimo?.used)} / ${num(rpmByProvider.mimo?.limit, 100)}`} />
                <Rowx k="本地 60s" v={`${num(rpmByProvider.local?.used)} / ∞`} />
              </>
            ) : null}
            <Rowx k="缓存 TTL" v={ttlText(ttl)} />
            <Rowx k="本地策略" v={localResident ? '常驻 (0s)' : `省内存 (${localIdleSec}s)`} />
          </div>
        </div>
      </div>
    </aside>
  )
}
