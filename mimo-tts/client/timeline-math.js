import { ROLE_CN } from './constants.js'
import { clamp, num, sourceOf } from './format.js'

/** 把 recent[] 变成一条首尾相接的节目带 */
export function buildTimeline(recent) {
  const rows = (Array.isArray(recent) ? recent : []).filter(Boolean).map((r) => ({
    at: num(r.at),
    chars: num(r.chars),
    segments: Math.max(1, num(r.segments, 1)),
    bytes: num(r.bytes),
    audioSeconds: Math.max(0, num(r.audioSeconds)),
    latencyMs: num(r.latencyMs),
    cacheHit: Boolean(r.cacheHit),
    role: ROLE_CN[r.role] ? r.role : 'narrator',
    source: sourceOf(r).key,
    sourceLabel: sourceOf(r).label,
    error: Boolean(r.error),
    client: r.client || '',
    text: r.text || '',
    format: r.format || '',
  }))
  rows.sort((a, b) => a.at - b.at)

  const totalAudio = rows.reduce((a, r) => a + r.audioSeconds, 0)
  const totalChars = rows.reduce((a, r) => a + r.chars, 0)
  let weights = rows.map((r) => r.audioSeconds)
  if (rows.length && totalAudio <= 0) weights = rows.map(() => 1)
  else if (rows.length) {
    const fill = Math.max(totalAudio * 0.01, 0.05)
    weights = weights.map((w) => (w > 0 ? w : fill))
  }
  const wSum = weights.reduce((a, w) => a + w, 0) || 1

  const maxChars = Math.max(1, ...rows.map((r) => r.chars))
  const maxLatency = Math.max(0, ...rows.map((r) => r.latencyMs))
  const latScale = Math.max(1000, Math.ceil(maxLatency / 1000) * 1000)
  const okLat = rows.filter((r) => !r.error && r.latencyMs > 0)
  const avgLatency = okLat.length ? okLat.reduce((a, r) => a + r.latencyMs, 0) / okLat.length : 0
  const cacheHits = rows.filter((r) => r.cacheHit).length

  let acc = 0
  const list = rows.map((r, i) => {
    const wPct = (weights[i] / wSum) * 100
    const startPct = acc
    acc += wPct
    const startSec = totalAudio > 0 ? (startPct / 100) * totalAudio : 0
    const endSec = totalAudio > 0 ? (acc / 100) * totalAudio : 0
    return {
      ...r,
      index: i,
      sig: `${r.text}|${r.chars}|${r.role}|${r.latencyMs}|${r.audioSeconds}|${r.segments}`,
      wPct,
      startPct,
      endPct: acc,
      startSec,
      endSec,
      wbar: clamp((r.chars / maxChars) * 100, 8, 100),
      latPct: clamp((r.latencyMs / latScale) * 100, 4, 100),
    }
  })

  return { list, totalAudio, totalChars, maxChars, maxLatency, latScale, avgLatency, cacheHits }
}

export function rulerTicks(total) {
  if (!(total > 0)) return { labelStep: 0, minorStep: 0, ticks: [] }
  const steps = [1, 2, 5, 10, 15, 30, 60, 120, 300, 600, 900, 1800]
  const nice = (raw) => {
    for (const s of steps) if (s >= raw) return s
    return 1800
  }
  const labelStep = nice(total / 8)
  const minorStep = Math.max(1, Math.round(labelStep / 6))
  const ticks = []
  for (let t = 0; t <= total + 1e-6; t += minorStep) {
    const isMajor = Math.abs(t / labelStep - Math.round(t / labelStep)) < 1e-6
    ticks.push({ t, pct: (t / total) * 100, major: isMajor })
    if (ticks.length > 400) break
  }
  return { labelStep, minorStep, ticks }
}

export function sortedDays(days) {
  return (Array.isArray(days) ? days : []).filter(Boolean)
    .slice()
    .sort((a, b) => (String(a.day) < String(b.day) ? -1 : String(a.day) > String(b.day) ? 1 : 0))
}
