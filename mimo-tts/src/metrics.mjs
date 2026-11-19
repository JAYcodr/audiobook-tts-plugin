/**
 * 计数、流水、限速闸门。
 *
 * 三件事都服务于同一个目的：**让「现在到底在发生什么」可读**。
 * 控制台的值守页、/api/live、以及「快到 100 RPM 就排队而不是吃 429」
 * 全从这一个对象取数。
 */

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
    while (true) {
      const now = Date.now()
      this.stamps = this.stamps.filter((t) => now - t < 60_000)
      if (this.stamps.length < rpm) {
        this.stamps.push(now)
        return 0
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
    return { used: this.stamps.length, limit: Math.max(1, Number(this.getRpm()) || 100), waiting: this.waiting }
  }
}

export class Metrics {
  constructor(ringSize = 500) {
    this.ringSize = ringSize
    this.startedAt = Date.now()
    this.recent = []
    this.days = new Map()
    this.active = new Map()
    this.clients = new Map()
    this.totals = {
      requests: 0, segments: 0, chars: 0, bytes: 0, seconds: 0,
      errors: 0, cacheHits: 0, latencyMs: 0,
    }
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

    // 按客户端累计：值守页的「谁在读、本机听多久」都从这里来
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
