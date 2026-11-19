import React from 'react'
import { PROVIDER_CN } from '../constants.js'
import { clock } from '../format.js'

export function StatusBar({ running, paused, error, lastSync, pausedAt, version, port, provider, hint }) {
  const dotCls = error ? 'dot warn' : !running ? 'dot off' : paused ? 'dot warn' : 'dot'
  const liveText = error
    ? 'ERROR · 读不到宿主接口'
    : !running
      ? 'STOPPED · 无实时数据'
      : paused
        ? `PAUSED · 数据冻结 ${clock(pausedAt || lastSync)}`
        : 'LIVE · /api/state'

  return (
    <footer className="statusbar" aria-label="走带状态">
      <span className="sb-l">
        <span className={dotCls} />
        <span>{liveText}</span>
      </span>
      <span className="sb-hint" title={error || hint}>
        {error ? `读不到宿主接口：${error}` : hint}
      </span>
      <span className="sb-r">
        <span>{`快照 ${lastSync ? clock(lastSync) : '—'}`}</span>
        <span className="sep">|</span>
        <span>{`v${version || '0.3.0'}`}</span>
        <span className="sep">|</span>
        <span>{`M-${port || '—'}`}</span>
        <span className="sep">|</span>
        <span className="opt">{`${PROVIDER_CN[provider] || provider || '—'} · 同源轮询 4s`}</span>
      </span>
    </footer>
  )
}
