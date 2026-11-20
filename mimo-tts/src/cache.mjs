/**
 * 音频缓存：LRU + TTL + 字节上限。
 *
 * 键是「文本 + 音色 + 风格 + 模型」的哈希 —— 换音色、改风格、换模型都必须
 * 自动失效，否则用户调完音色听到的还是旧声音（旧实现就踩过这个）。
 *
 * 双上限（条数 + 字节）是必须的：一条缓存可能是 256 字对应的 3.7MB WAV，
 * 只按条数限制会让内存悄悄涨到 GB 级。
 */
import { createHash } from 'node:crypto'

export function cacheKey({ text, voice, style, mode, model }) {
  return createHash('sha1')
    .update(`${mode || 'preset'}|${model || ''}|${voice || ''}|${style || ''}|${text}`)
    .digest('hex')
}

export function computeSegmentKeys(provider, requests, ctx = {}) {
  const fn = typeof provider?.cacheDescriptor === 'function'
    ? (r) => provider.cacheDescriptor(r, ctx)
    : null
  return requests.map((req) => cacheKey(fn ? fn(req) : req))
}

export function computeResponseEtag({ segmentKeys = [], format = 'wav', bitrate = 64 } = {}) {
  const fmt = String(format || 'wav').trim().toLowerCase() || 'wav'
  const br = fmt === 'mp3' || fmt === 'opus' ? Number(bitrate) || 64 : 0
  const hash = createHash('sha1')
    .update(`${fmt}|${br}|${segmentKeys.join(',')}`)
    .digest('hex')
    .slice(0, 24)
  return `"tts-${hash}"`
}

export function etagMatches(ifNoneMatch, etag) {
  if (!ifNoneMatch || !etag) return false
  const raw = String(ifNoneMatch).trim()
  if (!raw) return false
  if (raw === '*') return true
  const norm = (v) => String(v).trim().replace(/^W\//i, '').replace(/^"|"$/g, '')
  const target = norm(etag)
  return raw.split(',').some((part) => norm(part) === target)
}

export function resolveHttpCachePolicy(cacheCfg) {
  const enabled = cacheCfg?.enabled !== false
  const rawMax = Number(cacheCfg?.httpMaxAgeSeconds ?? 3600)
  const maxAge = enabled && Number.isFinite(rawMax)
    ? Math.max(0, Math.min(86400, Math.floor(rawMax)))
    : 0
  return {
    enabled: enabled && maxAge > 0,
    maxAge,
    cacheControl: enabled && maxAge > 0 ? `private, max-age=${maxAge}` : 'no-store',
  }
}

export class AudioCache {
  /** @param {() => {enabled:boolean,maxEntries:number,maxBytes:number,ttlSeconds:number}} getOpts */
  constructor(getOpts) {
    this.getOpts = getOpts
    this.map = new Map() // key -> {buf, at}
    this.bytes = 0
    this.hits = 0
    this.misses = 0
  }

  has(key) {
    const opts = this.getOpts()
    if (!opts.enabled) return false
    const hit = this.map.get(key)
    if (!hit) return false
    if (Date.now() - hit.at > opts.ttlSeconds * 1000) return false
    return true
  }

  get(key) {
    const opts = this.getOpts()
    if (!opts.enabled) return null
    const hit = this.map.get(key)
    if (!hit) { this.misses++; return null }
    if (Date.now() - hit.at > opts.ttlSeconds * 1000) {
      this.map.delete(key)
      this.bytes -= hit.buf.length
      this.misses++
      return null
    }
    // LRU：命中即挪到末尾（Map 保序）
    this.map.delete(key)
    this.map.set(key, hit)
    this.hits++
    return hit.buf
  }

  set(key, buf) {
    const opts = this.getOpts()
    if (!opts.enabled || !buf || !buf.length) return
    if (this.map.has(key)) {
      const old = this.map.get(key)
      this.bytes -= old.buf.length
      this.map.delete(key)
    }
    this.map.set(key, { buf, at: Date.now() })
    this.bytes += buf.length
    this.evict(opts)
  }

  evict(opts) {
    while (this.map.size > opts.maxEntries || this.bytes > opts.maxBytes) {
      const [k, v] = this.map.entries().next().value || []
      if (k === undefined) break
      this.map.delete(k)
      this.bytes -= v.buf.length
    }
  }

  clear() {
    this.map.clear()
    this.bytes = 0
  }

  stats() {
    const opts = this.getOpts()
    return {
      enabled: opts.enabled,
      entries: this.map.size,
      bytes: this.bytes,
      maxEntries: opts.maxEntries,
      maxBytes: opts.maxBytes,
      hits: this.hits,
      misses: this.misses,
      hitRate: this.hits + this.misses > 0 ? this.hits / (this.hits + this.misses) : 0,
    }
  }
}
