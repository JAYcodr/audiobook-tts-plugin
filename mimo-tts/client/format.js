import { WEEK_CN } from './constants.js'

/** 工具函数：宿主接口只保证字段存在性，不保证数值类型，一律容错。 */
export const num = (v, d = 0) => {
  const n = Number(v)
  return Number.isFinite(n) ? n : d
}

export const pad2 = (n) => String(n).padStart(2, '0')
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v))
export const fmtInt = (n) => num(n).toLocaleString('en-US')

/** 字节 → "512 MB" */
export const fmtBytes = (n) => `${fmtInt(Math.round(num(n) / 1048576))} MB`

/** 秒 → "3:03"（分:秒，时间线刻度） */
export const mmss = (sec) => `${Math.floor(num(sec) / 60)}:${pad2(Math.floor(num(sec) % 60))}`

/** 秒 → "03:03"（带盘计数） */
export const mmssPad = (sec) => `${pad2(Math.floor(num(sec) / 60))}:${pad2(Math.floor(num(sec) % 60))}`

/** 秒 → "2:45.4"（拾取头区间） */
export const mmssTenth = (sec) => `${Math.floor(num(sec) / 60)}:${pad2(Math.floor(num(sec) % 60))}.${Math.floor((num(sec) % 1) * 10)}`

/** 秒 → "223:21"（累计时长，时:分） */
export const hm = (sec) => `${Math.floor(num(sec) / 3600)}:${pad2(Math.floor((num(sec) % 3600) / 60))}`

/** 秒 → "1:27:00"（运行时长，时:分:秒） */
export const hms = (sec) => {
  const s = Math.max(0, Math.floor(num(sec)))
  return `${Math.floor(s / 3600)}:${pad2(Math.floor((s % 3600) / 60))}:${pad2(s % 60)}`
}

export const latSec = (ms) => (num(ms) > 0 ? `${(num(ms) / 1000).toFixed(2)}s` : '—')

/** 分位数：没有样本时显示 — */
export const latQ = (ms, samples) => (num(samples) > 0 ? (num(ms) / 1000).toFixed(2) : '—')

export const clock = (ts) => {
  const d = ts ? new Date(num(ts)) : new Date()
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`
}

export const dateStr = (ts) => {
  const d = ts ? new Date(num(ts)) : new Date()
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}

export const weekdayOfTs = (ts) => `周${WEEK_CN[new Date(num(ts)).getDay()]}`
export const weekdayOfDay = (day) => `周${WEEK_CN[new Date(`${day}T12:00:00Z`).getUTCDay()]}`
export const todayKeyUTC = () => new Date().toISOString().slice(0, 10)

export const ago = (ts, now) => {
  if (!ts) return '—'
  const diff = Math.max(0, num(now || Date.now()) - num(ts))
  if (diff < 3000) return '刚刚'
  if (diff < 60000) return `${Math.round(diff / 1000)} 秒前`
  if (diff < 3600000) return `${Math.round(diff / 60000)} 分钟前`
  return `${Math.round(diff / 3600000)} 小时前`
}

export const ipOf = (client) => {
  const s = String(client || '')
  const at = s.indexOf('@')
  if (at >= 0) return s.slice(at + 1) || '—'
  return s || '—'
}

export const hashOf = (client) => {
  const s = String(client || '')
  const at = s.indexOf('@')
  return at > 0 ? s.slice(0, at) : ''
}

export const deviceOf = (client) => hashOf(client) || ipOf(client)

export function sourceOf(r) {
  const s = String(r?.source || '')
  if (s.includes('local')) return { label: '本地', key: 'local' }
  if (s === 'openai') return { label: 'OpenAI', key: 'cloud' }
  if (s.includes('cloud') || s === 'mimo' || r?.format === 'wav-stream') return { label: '云端', key: 'cloud' }
  return { label: s || '—', key: '' }
}

export function ttlText(sec) {
  const s = num(sec)
  if (s >= 3600) {
    const hours = s / 3600
    return `${Number.isInteger(hours) ? hours : hours.toFixed(1)} 小时`
  }
  return `${s} 秒`
}

export function localStateText(localInfo) {
  const state = localInfo?.state || 'disabled'
  if (state === 'ready' || localInfo?.warm) return '本地 · 热'
  if (state === 'starting') return '预热中'
  if (state === 'stopping') return '卸载中'
  if (state === 'error') return '本地 · 出错'
  if (state === 'disabled') return '本地 · 未启用'
  return '本地 · 已卸载'
}
