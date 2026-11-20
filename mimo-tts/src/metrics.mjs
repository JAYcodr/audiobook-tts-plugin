/**
 * 计数、流水、限速闸门与工程史原子持久化。
 *
 * 三件事都服务于同一个目的：**让「现在到底在发生什么」可读**。
 * 控制台的值守页、/api/live、工程史 365 天记录、以及 RPM 闸门全从这一个对象取数。
 */
import { mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'

const MAX_PERSIST_DAYS = 365
const MAX_PERSIST_CLIENTS = 50
const EMPTY_TOTALS = () => ({
  requests: 0,
  segments: 0,
  chars: 0,
  bytes: 0,
  seconds: 0,
  errors: 0,
  cacheHits: 0,
  latencyMs: 0,
})

const dayKey = (t = Date.now()) => new Date(t).toISOString().slice(0, 10)

/** 滑动窗口限速：超过 rpm 就排队，而不是让上游返回 429。 */
export class RpmGate {
  constructor(getRpm) {
    this.getRpm = getRpm
    this.stamps = []
    this.waiting = 0
  }

  /** 等到有配额再放行；返回等待毫秒数 */
  async acquire() {
    const rpm = Math.max(1, Number(this.getRpm()) || 100)
    const started = Date.now()
    while (true) {
      const now = Date.now()
      this.stamps = this.stamps.filter((t) => now - t < 60_000)
      if (this.stamps.length < rpm) {
        this.stamps.push(now)
        return now - started
      }
      this.waiting++
      const wait = 60_000 - (now - this.stamps[0]) + 10
      try {
        await new Promise((r) => setTimeout(r, Math.min(wait, 5_000)))
      } finally {
        this.waiting--
      }
    }
  }

  usage() {
    const now = Date.now()
    this.stamps = this.stamps.filter((t) => now - t < 60_000)
    return {
      used: this.stamps.length,
      limit: Math.max(1, Number(this.getRpm()) || 100),
      waiting: this.waiting,
      unlimited: false,
    }
  }
}

/** 无限额闸门（本地 Qwen3-TTS 专用）：只统计近 60 秒吞吐，绝不按云端 RPM 排队。 */
export class NoopGate {
  constructor() {
    this.stamps = []
  }

  async acquire() {
    const now = Date.now()
    this.stamps = this.stamps.filter((t) => now - t < 60_000)
    this.stamps.push(now)
    return 0
  }

  usage() {
    const now = Date.now()
    this.stamps = this.stamps.filter((t) => now - t < 60_000)
    return {
      used: this.stamps.length,
      limit: null,
      waiting: 0,
      unlimited: true,
    }
  }
}

export class Metrics {
  /**
   * @param {number|{ringSize?:number,filePath?:string,flushDebounceMs?:number,log?:(s:string)=>void}} [opts]
   */
  constructor(opts = 500) {
    const o = typeof opts === 'number' ? { ringSize: opts } : (opts || {})
    this.ringSize = Math.max(10, Number(o.ringSize) || 500)
    this.filePath = o.filePath || ''
    this.backupFile = this.filePath ? `${this.filePath}.bak` : ''
    this.flushDebounceMs = o.flushDebounceMs ?? 5000
    this.log = o.log || null
    this.saveTimer = null
    this.startedAt = Date.now()
    this.recent = []
    this.days = new Map()
    this.active = new Map()
    this.clients = new Map()
    this.totals = EMPTY_TOTALS()
  }

  /** 启动时从磁盘恢复统计历史（主文件损坏或丢失时自动从 .bak 恢复）。 */
  load() {
    if (!this.filePath) return this
    let data = null
    try {
      data = JSON.parse(readFileSync(this.filePath, 'utf8'))
    } catch (err) {
      if (err.code !== 'ENOENT') {
        try { renameSync(this.filePath, `${this.filePath}.broken-${Date.now()}`) } catch { /* ignore */ }
      }
      if (this.backupFile) {
        try {
          data = JSON.parse(readFileSync(this.backupFile, 'utf8'))
          this.log?.(`[metrics] 主统计缺失或损坏，已从 ${this.backupFile} 恢复`)
        } catch { /* 无可用备份，全新开始 */ }
      }
    }
    if (!data || typeof data !== 'object') return this

    const t = data.totals || {}
    this.totals = {
      requests: Number(t.requests) || 0,
      segments: Number(t.segments) || 0,
      chars: Number(t.chars) || 0,
      bytes: Number(t.bytes) || 0,
      seconds: Number(t.seconds) || 0,
      errors: Number(t.errors) || 0,
      cacheHits: Number(t.cacheHits) || 0,
      latencyMs: Number(t.latencyMs) || 0,
    }

    this.days = new Map()
    if (data.days && typeof data.days === 'object') {
      const sorted = Object.entries(data.days)
        .filter(([k, v]) => /^\d{4}-\d{2}-\d{2}$/.test(k) && v && typeof v === 'object')
        .sort((a, b) => (a[0] < b[0] ? 1 : -1))
        .slice(0, MAX_PERSIST_DAYS)
      for (const [day, d] of sorted) {
        this.days.set(day, {
          requests: Number(d.requests) || 0,
          segments: Number(d.segments) || 0,
          chars: Number(d.chars) || 0,
          bytes: Number(d.bytes) || 0,
          seconds: Number(d.seconds) || 0,
          errors: Number(d.errors) || 0,
        })
      }
    }

    this.clients = new Map()
    if (Array.isArray(data.clients)) {
      for (const c of data.clients.slice(0, MAX_PERSIST_CLIENTS)) {
        if (c && c.key) {
          this.clients.set(String(c.key), {
            key: String(c.key),
            requests: Number(c.requests) || 0,
            segments: Number(c.segments) || 0,
            seconds: Number(c.seconds) || 0,
            chars: Number(c.chars) || 0,
            lastAt: Number(c.lastAt) || 0,
            text: String(c.text || ''),
            role: String(c.role || ''),
          })
        }
      }
    }

    this.recent = Array.isArray(data.recent) ? data.recent.slice(-this.ringSize) : []
    return this
  }

  scheduleSave() {
    if (!this.filePath) return
    if (this.flushDebounceMs <= 0) {
      this.flush()
      return
    }
    if (this.saveTimer) return
    this.saveTimer = setTimeout(() => {
      this.saveTimer = null
      this.flush()
    }, this.flushDebounceMs)
    this.saveTimer.unref?.()
  }

  /** 原子写盘（tmp → rename + .bak）。 */
  flush() {
    if (this.saveTimer) {
      clearTimeout(this.saveTimer)
      this.saveTimer = null
    }
    if (!this.filePath) return false
    try {
      mkdirSync(dirname(this.filePath), { recursive: true })
      const prunedDays = [...this.days.entries()]
        .sort((a, b) => (a[0] < b[0] ? 1 : -1))
        .slice(0, MAX_PERSIST_DAYS)
      this.days = new Map(prunedDays)

      const sortedClients = [...this.clients.values()]
        .sort((a, b) => b.lastAt - a.lastAt)
        .slice(0, MAX_PERSIST_CLIENTS)
      this.clients = new Map(sortedClients.map((c) => [c.key, c]))

      const payload = JSON.stringify({
        version: 1,
        savedAt: Date.now(),
        totals: this.totals,
        days: Object.fromEntries(prunedDays),
        clients: sortedClients,
        recent: this.recent.slice(-this.ringSize),
      }, null, 2)
      const tmp = `${this.filePath}.tmp`
      writeFileSync(tmp, payload)
      renameSync(tmp, this.filePath)
      try { writeFileSync(this.backupFile, payload) } catch { /* 备份写入失败不影响主流程 */ }
      return true
    } catch (err) {
      this.log?.(`[warn] 统计写盘失败：${err?.message || err}`)
      return false
    }
  }

  reset() {
    this.recent = []
    this.days.clear()
    this.active.clear()
    this.clients.clear()
    this.totals = EMPTY_TOTALS()
    this.flush()
  }

  /** 一次 /listening 请求结束时调用 */
  record(ev) {
    const t = Date.now()
    const item = { at: t, ...ev }
    this.recent.push(item)
    if (this.recent.length > this.ringSize) this.recent.shift()

    this.totals.requests++
    this.totals.segments += ev.segments || 0
    this.totals.chars += ev.chars || 0
    this.totals.bytes += ev.bytes || 0
    this.totals.seconds += ev.audioSeconds || 0
    this.totals.latencyMs += ev.latencyMs || 0
    if (ev.error) this.totals.errors++
    if (ev.cacheHit) this.totals.cacheHits++

    const d = this.days.get(dayKey(t)) || { requests: 0, segments: 0, chars: 0, bytes: 0, seconds: 0, errors: 0 }
    d.requests++
    d.segments += ev.segments || 0
    d.chars += ev.chars || 0
    d.bytes += ev.bytes || 0
    d.seconds += ev.audioSeconds || 0
    if (ev.error) d.errors++
    this.days.set(dayKey(t), d)

    if (ev.client) {
      const c = this.clients.get(ev.client) || {
        key: ev.client, requests: 0, segments: 0, seconds: 0, chars: 0, lastAt: 0, text: '', role: '',
      }
      c.requests++
      c.segments += ev.segments || 0
      c.seconds += ev.audioSeconds || 0
      c.chars += ev.chars || 0
      c.lastAt = t
      if (ev.text) c.text = ev.text
      if (ev.role) c.role = ev.role
      this.clients.set(ev.client, c)
    }
    this.scheduleSave()
    return item
  }

  /** 标记「某设备正在读某本书的某段」——读不到章节也能显示最近一段 */
  touch(clientKey, info) {
    this.active.set(clientKey, { ...info, at: Date.now() })
  }

  activeReaders() {
    const now = Date.now()
    return [...this.active.entries()]
      .filter(([, v]) => now - v.at < 120_000)
      .map(([k, v]) => ({ client: k, ...v, idleMs: now - v.at }))
  }

  snapshot() {
    const today = this.days.get(dayKey()) || { requests: 0, segments: 0, chars: 0, bytes: 0, seconds: 0, errors: 0 }
    const days = [...this.days.entries()]
      .sort((a, b) => (a[0] < b[0] ? 1 : -1))
      .slice(0, 30)
      .map(([day, v]) => ({ day, ...v }))
    const avgLatency = this.totals.requests
      ? Math.round(this.totals.latencyMs / this.totals.requests)
      : 0
    const latencies = this.recent.filter((r) => !r.error).map((r) => r.latencyMs).sort((a, b) => a - b)
    const pct = (p) => (latencies.length ? latencies[Math.min(latencies.length - 1, Math.floor(latencies.length * p))] : 0)
    return {
      uptimeSec: Math.round((Date.now() - this.startedAt) / 1000),
      totals: this.totals,
      today,
      days,
      avgLatencyMs: avgLatency,
      latency: { p50: pct(0.5), p95: pct(0.95), max: latencies.at(-1) || 0, samples: latencies.length },
      cacheHitRate: this.totals.requests ? this.totals.cacheHits / this.totals.requests : 0,
      active: this.activeReaders(),
      clients: [...this.clients.values()].sort((a, b) => b.lastAt - a.lastAt).slice(0, 6),
      recent: this.recent.slice(-40),
    }
  }
}
