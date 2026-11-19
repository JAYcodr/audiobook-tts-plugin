import React, { useRef } from 'react'
import { clamp, num } from '../format.js'

const KNOB_TICKS = (() => {
  const out = []
  const cx = 24
  const cy = 24
  for (let i = 0; i <= 10; i++) {
    const a = ((-135 + 270 * (i / 10)) * Math.PI) / 180
    out.push({
      x1: cx + 17.2 * Math.sin(a),
      y1: cy - 17.2 * Math.cos(a),
      x2: cx + 21.2 * Math.sin(a),
      y2: cy - 21.2 * Math.cos(a),
    })
  }
  return out
})()

function KnobTicks() {
  return (
    <svg className="knob-ticks" viewBox="0 0 48 48" aria-hidden="true">
      {KNOB_TICKS.map((t, i) => (
        <line
          key={i}
          x1={t.x1.toFixed(2)}
          y1={t.y1.toFixed(2)}
          x2={t.x2.toFixed(2)}
          y2={t.y2.toFixed(2)}
          stroke="#aaa492"
          strokeWidth={1}
        />
      ))}
    </svg>
  )
}

export function Knob({ label, value, min, max, step, unit, dirty, onChange, ariaLabel }) {
  const v = clamp(num(value, min), min, max)
  const ratio = max > min ? (v - min) / (max - min) : 0
  const angle = -135 + 270 * ratio
  const drag = useRef(null)

  const commit = (next) => {
    const snapped = clamp(Math.round(next / step) * step, min, max)
    onChange(snapped)
  }
  const onPointerDown = (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return
    e.preventDefault()
    try { e.currentTarget.focus() } catch { /* noop */ }
    try { e.currentTarget.setPointerCapture(e.pointerId) } catch { /* noop */ }
    drag.current = { y: e.clientY, value: v }
  }
  const onPointerMove = (e) => {
    if (!drag.current) return
    const range = max - min
    commit(drag.current.value + ((drag.current.y - e.clientY) / 120) * range)
  }
  const endDrag = () => { drag.current = null }
  const onKeyDown = (e) => {
    let next = null
    if (e.key === 'ArrowUp' || e.key === 'ArrowRight') next = v + step
    else if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') next = v - step
    else if (e.key === 'PageUp') next = v + step * 5
    else if (e.key === 'PageDown') next = v - step * 5
    else if (e.key === 'Home') next = min
    else if (e.key === 'End') next = max
    if (next == null) return
    e.preventDefault()
    e.stopPropagation()
    commit(next)
  }

  return (
    <div className={dirty ? 'knob-wrap is-dirty' : 'knob-wrap'} data-label={label}>
      <span className="kl">{label}</span>
      <div className="knob-holder">
        <KnobTicks />
        <div
          className="knob"
          tabIndex={0}
          role="slider"
          aria-label={ariaLabel || `${label}（${unit || ''}）`}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={v}
          title={`${label} · ${v}${unit || ''}（拖动或方向键）`}
          data-min={min}
          data-max={max}
          data-step={step}
          data-unit={unit || ''}
          style={{ '--angle': `${angle.toFixed(2)}deg` }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onKeyDown={onKeyDown}
        />
      </div>
      <output className="knob-val">{String(v)}</output>
    </div>
  )
}

export function Toggle({ label, checked, onChange, disabled }) {
  return (
    <div className="toggle-wrap">
      <button
        className="toggle"
        type="button"
        role="switch"
        aria-checked={Boolean(checked)}
        aria-label={label}
        disabled={Boolean(disabled)}
        onClick={() => onChange(!checked)}
      />
      <span className="tv">{checked ? '开' : '关'}</span>
    </div>
  )
}

export function Chips({ options, value, onChange, ariaLabel }) {
  return (
    <div className="chips" role="group" aria-label={ariaLabel}>
      {(options || []).map((opt) => (
        <button
          key={opt}
          className="chip"
          type="button"
          aria-pressed={String(opt === value)}
          onClick={() => onChange(opt)}
        >
          {opt}
        </button>
      ))}
    </div>
  )
}

export function Seg({ options, value, onChange, ariaLabel }) {
  return (
    <div className="seg" role="group" aria-label={ariaLabel}>
      {(options || []).map((opt) => (
        <button
          key={opt.value}
          className="seg-key"
          type="button"
          aria-pressed={String(opt.value === value)}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

export function Field({ label, sub, children, style }) {
  return (
    <label className="field" style={style}>
      <span className="fl">
        {label}
        {sub ? <i>{sub}</i> : null}
      </span>
      {children}
    </label>
  )
}

export function Input({ value, onChange, type = 'text', inputMode, placeholder, spellCheck, disabled, style, step }) {
  return (
    <input
      className="input"
      type={type}
      step={step}
      inputMode={inputMode}
      value={value == null ? '' : value}
      placeholder={placeholder}
      spellCheck={spellCheck === true}
      disabled={Boolean(disabled)}
      style={style}
      onChange={(e) => onChange(e.target.value)}
    />
  )
}

export function Textarea({ value, onChange, rows = 2, placeholder, spellCheck }) {
  return (
    <textarea
      className="input"
      rows={rows}
      value={value == null ? '' : value}
      placeholder={placeholder}
      spellCheck={spellCheck === true}
      onChange={(e) => onChange(e.target.value)}
    />
  )
}

export function HeadRow({ k, v }) {
  return (
    <div className="head-row">
      <span>{k}</span>
      {v}
    </div>
  )
}

export function Rowx({ k, v }) {
  return (
    <div className="rowx">
      <span>{k}</span>
      <b>{v}</b>
    </div>
  )
}

const VU_GEOM = (() => {
  const cx = 100
  const cy = 90
  const R = 62
  const pt = (a, r) => [cx + r * Math.sin((a * Math.PI) / 180), cy - r * Math.cos((a * Math.PI) / 180)]
  const a0 = -62
  const a1 = 62
  const [x0, y0] = pt(a0, R)
  const [x1, y1] = pt(a1, R)
  const arc = `M ${x0.toFixed(2)} ${y0.toFixed(2)} A ${R} ${R} 0 0 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`
  const [rx, ry] = pt(a0 + 124 * 0.86, R)
  const redArc = `M ${rx.toFixed(2)} ${ry.toFixed(2)} A ${R} ${R} 0 0 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`
  const ticks = []
  for (let v = 0; v <= 100; v += 5) {
    const a = a0 + 124 * (v / 100)
    const [ix, iy] = pt(a, R - 6)
    const [ox, oy] = pt(a, R)
    ticks.push({ ix: ix.toFixed(2), iy: iy.toFixed(2), ox: ox.toFixed(2), oy: oy.toFixed(2), major: v % 25 === 0 })
  }
  return { cx, cy, R, arc, redArc, ticks }
})()

export function VuTable({ ratio }) {
  const r = clamp(num(ratio), 0, 1)
  const angle = -62 + 124 * r
  return (
    <svg viewBox="0 0 200 100" role="img" aria-label={`缓存占用 ${Math.round(r * 100)}%`}>
      <rect x={0.5} y={0.5} width={199} height={99} fill="#f0ece3" stroke="#c9c3b3" />
      <path d={VU_GEOM.arc} fill="none" stroke="#4b524c" strokeWidth={1.2} />
      <path d={VU_GEOM.redArc} fill="none" stroke="#b13a22" strokeWidth={2.4} />
      {VU_GEOM.ticks.map((t, i) => (
        <line
          key={i}
          x1={t.ix}
          y1={t.iy}
          x2={t.ox}
          y2={t.oy}
          stroke="#242a26"
          strokeWidth={t.major ? 1.1 : 0.7}
          opacity={t.major ? 0.85 : 0.5}
        />
      ))}
      <circle cx={VU_GEOM.cx} cy={VU_GEOM.cy} r={2.4} fill="#242a26" />
      <line
        x1={VU_GEOM.cx}
        y1={VU_GEOM.cy}
        x2={VU_GEOM.cx}
        y2={VU_GEOM.cy - VU_GEOM.R + 8}
        stroke="#b13a22"
        strokeWidth={1.6}
        strokeLinecap="round"
        style={{ transformOrigin: `${VU_GEOM.cx}px ${VU_GEOM.cy}px`, transform: `rotate(${angle.toFixed(2)}deg)` }}
      />
    </svg>
  )
}

export function PanelGlyph({ size = 16 } = {}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      focusable="false"
      aria-hidden="true"
      style={{ flex: 'none', display: 'block' }}
    >
      <rect x={4} y={3.2} width={16} height={17.6} stroke="currentColor" strokeWidth={1.4} />
      <path d="M7.4 8.4h9.2M7.4 11.6h9.2M7.4 14.8h5.6" stroke="currentColor" strokeWidth={1.2} opacity={0.6} />
      <circle cx={17.4} cy={17.6} r={2.1} stroke="currentColor" strokeWidth={1.3} />
    </svg>
  )
}
