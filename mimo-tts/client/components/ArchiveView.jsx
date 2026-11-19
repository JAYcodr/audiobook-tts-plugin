import React, { useMemo } from 'react'
import { clamp, fmtBytes, fmtInt, hm, latQ, num, todayKeyUTC, weekdayOfDay } from '../format.js'
import { sortedDays } from '../timeline-math.js'
import { Rowx } from './Primitives.jsx'

export function ArchiveView({ live, range, setRange, selectedDay, onSelectDay, onExportCsv }) {
  const totals = live?.totals || {}
  const lat = live?.latency || {}
  const asc = useMemo(() => sortedDays(live?.days), [live])
  const days = range === 30 ? asc.slice(-30) : asc.slice(-7)
  const sumSec = days.reduce((a, d) => a + num(d.seconds), 0)
  const sel = days.find((d) => d.day === selectedDay) || days[days.length - 1] || null
  const todayKey = todayKeyUTC()
  const n = days.length

  const widths = days.map((d) => (sumSec > 0 ? (num(d.seconds) / sumSec) * 100 : 100 / Math.max(1, n)))
  const lefts = []
  let acc = 0
  widths.forEach((w) => {
    lefts.push(acc)
    acc += w
  })
  const midOf = (i) => lefts[i] + widths[i] / 2

  const notes = []
  if (n) {
    const peakIdx = days.reduce((best, d, i) => (num(d.seconds) > num(days[best].seconds) ? i : best), 0)
    const todayIdx = days.findIndex((d) => d.day === todayKey)
    const peak = days[peakIdx]
    if (todayIdx >= 0 && todayIdx === peakIdx) {
      notes.push(
        <div key="peak" className="peak-note" style={{ left: `${clamp(midOf(todayIdx), 1, 99).toFixed(3)}%` }}>
          {`峰值 · 今日 ${Math.round(num(peak.seconds) / 60)} 分 · ${fmtInt(peak.segments)} 段`}
        </div>,
      )
    } else {
      notes.push(
        <div key="peak" className="peak-note" style={{ left: `${clamp(midOf(peakIdx), 1, 99).toFixed(3)}%` }}>
          {`峰值 ${String(peak.day).slice(5)} · ${Math.round(num(peak.seconds) / 60)} 分 · ${fmtInt(peak.segments)} 段`}
        </div>,
      )
      if (todayIdx >= 0) {
        notes.push(
          <div
            key="today"
            className="today-note"
            style={{ left: `${clamp(midOf(todayIdx), 1, 99).toFixed(3)}%`, transform: 'translateX(-100%)' }}
          >
            {`今日 ${Math.round(num(days[todayIdx].seconds) / 60)} 分`}
          </div>,
        )
      }
    }
  }

  const axis = []
  days.forEach((d, i) => {
    const day = String(d.day || '')
    if (i === 0 || day.endsWith('-01')) {
      axis.push(<span key={`mt-${i}`} className="mtick" style={{ left: `${lefts[i].toFixed(3)}%` }} />)
      axis.push(
        <span
          key={`ml-${i}`}
          className="mlabel"
          style={{ left: `${lefts[i].toFixed(3)}%`, transform: i === 0 ? 'none' : undefined }}
        >
          {`${parseInt(day.slice(5, 7), 10)}月`}
        </span>,
      )
    }
  })

  const rangeRequests = days.reduce((a, d) => a + num(d.requests), 0)
  const rangeErrors = days.filter((d) => num(d.errors) > 0).length
  const rangeLabel = `${range === 30 ? '30' : '7'} 日`

  const leftTotals = [
    ['累计时长', hm(totals.seconds)],
    ['累计字数', fmtInt(totals.chars)],
    ['累计请求', fmtInt(totals.requests)],
    ['累计段数', fmtInt(totals.segments)],
    ['累计错误', String(num(totals.errors))],
    ['缓存命中', fmtInt(totals.cacheHits)],
  ]

  return (
    <section className="view view--archive" id="view-archive" aria-label="工程史">
      <div className="arch-left">
        <div>
          <h2>工程史</h2>
          <div className="sub">Session Archive</div>
        </div>
        <div className="range-keys" role="group" aria-label="档案范围">
          <button
            className="range-key"
            type="button"
            data-range="30"
            aria-pressed={String(range === 30)}
            onClick={() => setRange(30)}
          >
            <b>30 天</b>
            <small>ALL TAKES</small>
          </button>
          <button
            className="range-key"
            type="button"
            data-range="7"
            aria-pressed={String(range === 7)}
            onClick={() => setRange(7)}
          >
            <b>7 天</b>
            <small>RECENT</small>
          </button>
        </div>
        <div className="totals" id="totalsList">
          {leftTotals.map(([k, v]) => (
            <div key={k} className="trow">
              <span>{k}</span>
              <b>{v}</b>
            </div>
          ))}
        </div>
        <div className="foot">
          <button className="btn" type="button" data-action="export-csv" onClick={onExportCsv}>
            导出 CSV · 日表
          </button>
          <p className="hint" style={{ margin: 0 }}>
            累计 = 服务启用以来（totals）；日带 = 按 UTC 自然日统计的合成音频秒数（days）。
          </p>
        </div>
      </div>

      <div className="arch-main">
        <div className="arch-top">
          <div className="ah">
            <span className="silk">DAILY TAPE</span>
            <b>压缩日带</b>
            <span className="silk">{`${n} 日 / ${rangeLabel}`}</span>
          </div>
          <div className="ameta">
            {n
              ? `${String(days[0].day).slice(5)} → ${String(days[n - 1].day).slice(5)} · 一天一格 · 宽度 = 当日合成音频秒数`
              : '还没有跨天记录 · 产生跨天流量后这里会出现压缩日带'}
          </div>
        </div>
        <div className="daytape-wrap">
          {notes}
          <div className="daytape" aria-label={`${rangeLabel}压缩日带`}>
            {days.map((d, i) => (
              <button
                key={d.day}
                className={`day${d.day === todayKey ? ' today' : ''}`}
                type="button"
                data-day={d.day}
                aria-selected={String(Boolean(sel) && d.day === sel.day)}
                style={{ width: `${widths[i].toFixed(3)}%` }}
                title={`${d.day} · ${fmtInt(d.requests)} 请求 · ${fmtInt(d.segments)} 段 · ${hm(d.seconds)} · ${fmtInt(d.chars)} 字${num(d.errors) ? ` · 错误 ${num(d.errors)}` : ''}`}
                onClick={() => onSelectDay(d.day)}
              >
                <span className="dn">{range === 30 ? String(d.day).slice(8) : String(d.day).slice(5)}</span>
                {num(d.errors) ? <span className="err" aria-hidden="true" /> : null}
              </button>
            ))}
          </div>
          <div className="day-axis">{axis}</div>
        </div>
        <div className="ledger-wrap">
          <div className="scroll">
            <table className="ledger" id="ledger">
              <thead>
                <tr>
                  <th style={{ width: 96 }}>日期</th>
                  <th style={{ width: 64 }}>请求</th>
                  <th style={{ width: 64 }}>段</th>
                  <th style={{ width: 96 }}>合成时长</th>
                  <th style={{ width: 110 }}>字数</th>
                  <th style={{ width: 90 }}>字节</th>
                  <th>错误</th>
                </tr>
              </thead>
              <tbody>
                {days.length ? (
                  days.slice().reverse().map((d) => (
                    <tr
                      key={d.day}
                      data-day={d.day}
                      tabIndex={0}
                      aria-selected={String(Boolean(sel) && d.day === sel.day)}
                      onClick={() => onSelectDay(d.day)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          onSelectDay(d.day)
                        }
                      }}
                    >
                      <td className="d">{String(d.day)}</td>
                      <td>{fmtInt(d.requests)}</td>
                      <td>{fmtInt(d.segments)}</td>
                      <td>{hm(d.seconds)}</td>
                      <td>{fmtInt(d.chars)}</td>
                      <td>{fmtBytes(d.bytes)}</td>
                      <td className={num(d.errors) ? 'e' : undefined}>{num(d.errors) ? String(num(d.errors)) : '—'}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} style={{ color: 'var(--ink-3)', padding: '10px 4px' }}>
                      还没有日统计。跨天后 /api/state 的 days[] 会自动带出每天一行。
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <aside className="arch-right">
        <div className="ins-hd" style={{ borderTop: 0, paddingTop: 0 }}>
          <span className="silk">
            SESSION <b>选中日</b>
          </span>
          <span className="cn">{sel ? weekdayOfDay(sel.day) : '—'}</span>
        </div>
        <div className="day-detail" id="dayDetail">
          {sel ? (
            <>
              <div className="kv wide">
                <span className="k">日期 DATE</span>
                <span className="v">{`${sel.day} · ${weekdayOfDay(sel.day)}`}</span>
              </div>
              <div className="kv"><span className="k">请求</span><span className="v">{fmtInt(sel.requests)}</span></div>
              <div className="kv"><span className="k">段</span><span className="v">{fmtInt(sel.segments)}</span></div>
              <div className="kv"><span className="k">合成时长</span><span className="v">{hm(sel.seconds)}</span></div>
              <div className="kv"><span className="k">字数</span><span className="v">{fmtInt(sel.chars)}</span></div>
              <div className="kv"><span className="k">字节</span><span className="v">{fmtBytes(sel.bytes)}</span></div>
              <div className="kv"><span className="k">错误</span><span className="v">{String(num(sel.errors))}</span></div>
            </>
          ) : (
            <div className="kv wide">
              <span className="k">日期 DATE</span>
              <span className="v">—</span>
            </div>
          )}
        </div>
        <div className="arch-sec">
          <span className="silk">RANGE <b>本段合计</b></span>
          <Rowx k="日数" v={String(n)} />
          <Rowx k="请求" v={fmtInt(rangeRequests)} />
          <Rowx k="合成时长" v={hm(sumSec)} />
          <Rowx k="错误日" v={`${rangeErrors} 天`} />
        </div>
        <div className="arch-sec">
          <span className="silk">LATENCY <b>本窗分位</b></span>
          <Rowx k="p50" v={latQ(lat.p50, lat.samples)} />
          <Rowx k="p95" v={latQ(lat.p95, lat.samples)} />
          <Rowx k="max" v={latQ(lat.max, lat.samples)} />
          <Rowx k="样本" v={fmtInt(lat.samples)} />
        </div>
        <div className="arch-sec" style={{ marginTop: 'auto' }}>
          <Rowx k="记录自" v={asc.length ? String(asc[0].day) : '—'} />
          <Rowx k="档案口径" v="UTC 自然日" />
        </div>
      </aside>
    </section>
  )
}
