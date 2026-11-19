import React from 'react'
import { TZ_LABEL } from '../constants.js'
import { clamp, clock, dateStr, hms, mmssPad, num, weekdayOfTs } from '../format.js'

function Lamp({ on, label, value, warn }) {
  return (
    <div className={`lamp${on ? ' on' : warn ? ' warn' : ' idle'}`}>
      <span className="dot" />
      <span>{label}</span>
      <b>{value}</b>
    </div>
  )
}

const START_ICON = (
  <svg viewBox="0 0 12 12" aria-hidden="true">
    <path d="M3.2 2.2v7.6L10 6z" fill="currentColor" stroke="none" />
  </svg>
)
const STOP_ICON = (
  <svg viewBox="0 0 12 12" aria-hidden="true">
    <rect x={3} y={3} width={6} height={6} fill="currentColor" stroke="none" />
  </svg>
)
const RESTART_ICON = (
  <svg viewBox="0 0 12 12" aria-hidden="true">
    <path d="M9.5 6a3.5 3.5 0 1 1-1.1-2.5" />
    <path d="M9.6 1.9v2.4H7.2" />
  </svg>
)
const PAUSE_ICON = (
  <svg viewBox="0 0 12 12" aria-hidden="true">
    <rect x={3} y={2.5} width={2} height={7} fill="currentColor" stroke="none" />
    <rect x={7} y={2.5} width={2} height={7} fill="currentColor" stroke="none" />
  </svg>
)

const VIEW_KEYS = [
  { id: 'timeline', cn: '时间线', en: 'TIMELINE' },
  { id: 'settings', cn: '渲染设置', en: 'RENDER' },
  { id: 'archive', cn: '工程史', en: 'ARCHIVE' },
  { id: 'delivery', cn: '交付', en: 'DELIVER' },
]

export function Transport({ service, localInfo, live, items, totalAudio, view, setView, paused, onPause, busy, act, now, error }) {
  const running = Boolean(service?.running)
  const hybrid = service?.hybrid || {}
  const openai = service?.openai || {}
  const provider = service?.provider || 'mimo'
  const rpm = live?.rpm || {}
  const localState = localInfo?.state || 'disabled'
  const localWarm = Boolean(localInfo?.warm) || localState === 'ready'
  const localStarting = localState === 'starting'
  const localText = localWarm ? 'READY' : localStarting ? 'LOAD' : localState === 'error' ? 'ERR' : localState === 'disabled' ? 'OFF' : 'STOP'
  const cloudReady = provider === 'openai' ? Boolean(openai.ready) : Boolean(hybrid.cloudReady)
  const cloudLabel = provider === 'openai' ? 'OAI' : '云端'
  const cloudVal = provider === 'openai' ? (running && openai.ready ? 'ON' : 'OFF') : (running && cloudReady ? 'STBY' : 'OFF')
  const busyName = busy || ''
  const transCls = ['transport']
  if (running) transCls.push('is-running', 'is-playing')
  if (paused) transCls.push('is-paused')
  if (!running) transCls.push('is-stopped')

  const renderKey = (action, icon, zh, en, title, disabled) => (
    <button
      className="key"
      type="button"
      data-action={action}
      title={title}
      disabled={Boolean(disabled)}
      onClick={() => act(action)}
    >
      {icon}
      <span className="zi">{zh}</span>
      <span className="ze">{en}</span>
    </button>
  )

  const startZh = busyName === 'start' || busyName === 'restart' ? '启动中' : '启动'
  const stopZh = busyName === 'stop' ? '停止中' : '停止'
  const restartZh = busyName === 'restart' ? '重启中' : '重启'

  const ratio = clamp(num(rpm.used) / Math.max(1, num(rpm.limit, 100)), 0, 1)
  const liveCls = error ? 'rail-live paused' : running ? (paused ? 'rail-live paused' : 'rail-live') : 'rail-live stopped'
  const liveWord = error ? 'ERR' : running ? (paused ? 'PAUSED' : 'LIVE') : 'STOP'

  return (
    <header className={transCls.join(' ')} id="transport" aria-label="走带台">
      <div className="tp-bar">
        <div className="tp-cell" style={{ paddingLeft: 0 }}>
          <div className="plate">
            <svg className="reel" viewBox="0 0 32 32" aria-hidden="true">
              <circle cx={16} cy={16} r={13.4} fill="none" stroke="#5c6b62" strokeWidth={1} />
              <g className="rot">
                <circle cx={16} cy={16} r={8.4} fill="none" stroke="#cdd5cb" strokeWidth={1.3} />
                <path d="M16 7.6v16.8M8.9 11.8l14.2 8.4M8.9 20.2l14.2-8.4" stroke="#cdd5cb" strokeWidth={1} opacity={0.4} />
                <circle cx={16} cy={16} r={2.7} fill="#b13a22" />
                <circle cx={16} cy={6.9} r={1.2} fill="#cdd5cb" />
              </g>
            </svg>
            <div className="brand-txt">
              <b>听书值守</b>
              <small>{`LISTENING DECK · M-${service?.port || '—'}`}</small>
            </div>
          </div>
        </div>

        <div className="tp-cell tp-keys" role="group" aria-label="服务启停">
          {renderKey('start', START_ICON, startZh, 'START', '启动服务', running || Boolean(busy))}
          {renderKey('stop', STOP_ICON, stopZh, 'STOP', '停止服务', !running || Boolean(busy))}
          {renderKey('restart', RESTART_ICON, restartZh, 'RESTART', '重启服务', Boolean(busy))}
        </div>

        <div className="tp-cell">
          <div className="lamps" aria-label="机器状态">
            <Lamp on={running} label="RUN" value={running ? hms(service?.uptimeSec) : '—'} />
            <Lamp on={localWarm} label="本地" value={localText} warn={localStarting || localState === 'error'} />
            <Lamp on={running && cloudReady} label={cloudLabel} value={cloudVal} />
            <Lamp on={running} label="混合" value={`${num(hybrid.bootstrapCount)}/${num(hybrid.maxCloudBootstrap)}`} />
          </div>
        </div>

        <div className="tp-cell">
          <div className="clock">
            <b>{clock(now)}</b>
            <small>{`${dateStr(now)} ${weekdayOfTs(now)} · ${TZ_LABEL}`}</small>
          </div>
        </div>

        <div className="tp-pause-wrap">
          <button
            className="key key--pause"
            type="button"
            data-action="pause"
            title={paused ? '继续实时刷新' : '暂停实时刷新（客户端冻结当前快照）'}
            data-active={String(paused)}
            disabled={!running}
            onClick={onPause}
          >
            {PAUSE_ICON}
            <span className="zi">{paused ? '继续' : '暂停'}</span>
            <span className="ze">PAUSE</span>
          </button>
        </div>
      </div>

      <div className="tp-rail">
        <span className="rail-label">工作面 VIEW</span>
        <div className="viewkeys" role="group" aria-label="工作面切换（快捷键 1–4）">
          {VIEW_KEYS.map((v) => (
            <button
              key={v.id}
              className="viewkey"
              type="button"
              data-view={v.id}
              aria-pressed={String(view === v.id)}
              onClick={() => setView(v.id)}
            >
              <span className="vc">{v.cn}</span>
              <span className="ve">{v.en}</span>
            </button>
          ))}
        </div>
        <div className="rail-meters">
          <div className="meter" title="每分钟请求数 — 滑动 60 秒窗口">
            <span className="ml">RPM</span>
            <span className="meter-bar">
              <i style={{ width: `${Math.max(1.5, ratio * 100)}%` }} />
            </span>
            <span className="mv">{`${num(rpm.used)} / ${num(rpm.limit, 100)}`}</span>
          </div>
          <div className="meter">
            <span className="ml">队列</span>
            <span className="mv">{String(num(rpm.waiting))}</span>
          </div>
          <div className="meter">
            <span className="ml">本窗</span>
            <span className="mv">{`${items.length} 段 · ${mmssPad(totalAudio)}`}</span>
          </div>
        </div>
        <div className={liveCls}>
          <span className="dot" />
          <i>{liveWord}</i>
          <span>{clock(now)}</span>
        </div>
      </div>
    </header>
  )
}
