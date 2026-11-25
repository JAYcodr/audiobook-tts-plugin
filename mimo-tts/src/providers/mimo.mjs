/**
 * MiMo 云端 TTS Provider。
 *
 * 三个模型对应三种音色来源：
 *   mimo-v2.5-tts             预置音色（9 个）
 *   mimo-v2.5-tts-voicedesign 用一段文字描述「造」一个音色，无需样本
 *   mimo-v2.5-tts-voiceclone  拿一段 mp3/wav 样本克隆音色
 *
 * 只有 mimo-v2.5-tts 的低延迟流式可用；另外两个即使 stream:true 也是
 * 「推理完再一次吐出来」，所以流式路径只对预置音色开放。
 */
import { readFileSync, statSync } from 'node:fs'
import { extname } from 'node:path'
import { createHash } from 'node:crypto'
import { ProviderError, TTSProvider, runLimited } from './base.mjs'
import { cacheKey } from '../cache.mjs'
import { expandHomePath } from '../paths.mjs'
import { computeRefsDigest } from '../refs-store.mjs'
import { encodeWav, parseWav, resample, silentWav, streamingWavHeader } from '../wav.mjs'

const MAX_STREAM_BYTES = 64 * 1024 * 1024

export class UpstreamError extends ProviderError {
  constructor(message, { status = 0, retryable = false } = {}) {
    super(message, { status, retryable, code: 'upstream_error', provider: 'mimo' })
    this.name = 'UpstreamError'
  }
}

/** key 池：轮转 + 冷却。401/403 冷却久，429 冷却短，5xx 不影响 key。 */
export class KeyPool {
  constructor() {
    this.index = 0
    this.cool = new Map()
    this.keys = []
  }

  set(keys) {
    this.keys = Array.isArray(keys) ? keys.filter(Boolean) : []
  }

  get size() {
    return this.keys.length
  }

  acquire() {
    if (!this.keys.length) throw new UpstreamError('未配置 API Key', { status: 0 })
    const now = Date.now()
    for (let i = 0; i < this.keys.length; i++) {
      const idx = (this.index + i) % this.keys.length
      const key = this.keys[idx]
      if ((this.cool.get(key) || 0) <= now) {
        this.index = (idx + 1) % this.keys.length
        return key
      }
    }
    const key = this.keys[this.index]
    this.index = (this.index + 1) % this.keys.length
    return key
  }

  report(key, status) {
    if (status === 401 || status === 403) this.cool.set(key, Date.now() + 10 * 60_000)
    else if (status === 429) this.cool.set(key, Date.now() + 30_000)
  }
}

export class MimoClient {
  /** @param {() => any} getConfig 每次调用都取最新配置，控制台改完即时生效 */
  constructor(getConfig) {
    this.getConfig = getConfig
    this.pool = new KeyPool()
    this.lastKeysRef = null
    this.samples = new Map()
  }

  /** 把参考音读成 MiMo clone 要的 data URL；按路径缓存，配置变更时 clearSamples()。 */
  sampleDataUrl(rawPath) {
    const path = expandHomePath(rawPath)
    if (!path) throw new UpstreamError('缺少克隆参考音路径')
    if (path.startsWith('data:')) return path
    const hit = this.samples.get(path)
    if (hit) return hit
    let buf
    try {
      buf = readFileSync(path)
    } catch (err) {
      throw new UpstreamError(`读不到参考音：${path}（${err.code || err.message}）`)
    }
    const ext = extname(path).toLowerCase()
    const mime = ext === '.mp3' ? 'audio/mpeg' : ext === '.m4a' ? 'audio/mp4' : 'audio/wav'
    const url = `data:${mime};base64,${buf.toString('base64')}`
    this.samples.set(path, url)
    return url
  }

  clearSamples() {
    this.samples.clear()
  }

  cfg() {
    const c = this.getConfig()
    if (this.lastKeysRef !== c.upstream.keys) {
      this.pool.set(c.upstream.keys)
      this.lastKeysRef = c.upstream.keys
    }
    return c.upstream
  }

  buildPayload({ text, voice, style, mode = 'preset' }, format, up = this.cfg()) {
    const model = mode === 'design' ? 'mimo-v2.5-tts-voicedesign'
      : mode === 'clone' ? 'mimo-v2.5-tts-voiceclone'
        : up.model

    const body = {
      model,
      messages: [
        { role: 'user', content: mode === 'clone' ? '' : (style || '') },
        { role: 'assistant', content: text },
      ],
      audio: { format },
    }
    if (mode === 'preset') body.audio.voice = voice || '冰糖'
    if (mode === 'clone') body.audio.voice = voice
    return body
  }

  /** 非流式：一次拿到完整 WAV；支持传入临时 upstream（用于草稿态试听，不污染全局密钥池） */
  async synthesize(req, upOverride = null) {
    const up = upOverride || this.cfg()
    let pool = this.pool
    if (upOverride) {
      pool = new KeyPool()
      pool.set(upOverride.keys)
    }
    const payload = this.buildPayload(req, 'wav', up)
    let lastErr
    for (let attempt = 0; attempt <= (up.maxRetry ?? 0); attempt++) {
      const key = pool.acquire()
      try {
        const res = await fetch(`${up.baseUrl}/chat/completions`, {
          method: 'POST',
          headers: { 'api-key': key, 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(up.timeoutMs || 60_000),
        })
        if (!res.ok) {
          pool.report(key, res.status)
          const text = await res.text().catch(() => '')
          const err = new UpstreamError(`上游 ${res.status}: ${text.slice(0, 200)}`, {
            status: res.status,
            retryable: res.status >= 500 || res.status === 429,
          })
          if (!err.retryable) throw err
          lastErr = err
          await sleep(500 * 2 ** attempt)
          continue
        }
        const json = await res.json()
        const b64 = json?.choices?.[0]?.message?.audio?.data
        if (!b64) throw new UpstreamError('上游没有返回音频数据', { retryable: true })
        const buf = Buffer.from(b64, 'base64')
        if (buf.length < 44 || buf.toString('ascii', 0, 4) !== 'RIFF') {
          throw new UpstreamError(`上游返回非 WAV 字节 (${buf.length}B)`, { retryable: true })
        }
        return buf
      } catch (err) {
        if (err instanceof UpstreamError && !err.retryable) throw err
        lastErr = err
        if (attempt >= (up.maxRetry ?? 0)) break
        await sleep(500 * 2 ** attempt)
      }
    }
    throw lastErr instanceof UpstreamError
      ? lastErr
      : new UpstreamError(`上游请求失败: ${String(lastErr?.message || lastErr)}`)
  }

  /**
   * 流式：yield PCM16 分片（24kHz 单声道）。
   * 只在预置音色下有意义 —— voicedesign / voiceclone 会上游降级成「一次性返回」。
   */
  async *synthesizeStream(req, { signal = null } = {}) {
    const up = this.cfg()
    const payload = this.buildPayload(req, 'pcm16')
    payload.stream = true
    const key = this.pool.acquire()
    const timeoutSig = AbortSignal.timeout(up.timeoutMs || 60_000)
    const reqSignal = signal ? AbortSignal.any([signal, timeoutSig]) : timeoutSig
    const res = await fetch(`${up.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: { 'api-key': key, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: reqSignal,
    })
    if (!res.ok || !res.body) {
      this.pool.report(key, res.status)
      const text = await res.text().catch(() => '')
      throw new UpstreamError(`上游 ${res.status}: ${text.slice(0, 200)}`, { status: res.status })
    }

    const decoder = new TextDecoder()
    let buf = ''
    let sent = 0
    for await (const chunk of res.body) {
      buf += decoder.decode(chunk, { stream: true })
      let nl
      while ((nl = buf.indexOf('\n')) !== -1) {
        const line = buf.slice(0, nl).trim()
        buf = buf.slice(nl + 1)
        if (!line.startsWith('data:')) continue
        const payloadText = line.slice(5).trim()
        if (!payloadText || payloadText === '[DONE]') continue
        let json
        try { json = JSON.parse(payloadText) } catch { continue }
        const b64 = json?.choices?.[0]?.delta?.audio?.data
        if (!b64) continue
        const pcm = Buffer.from(b64, 'base64')
        sent += pcm.length
        if (sent > MAX_STREAM_BYTES) throw new UpstreamError('流式音频超过上限')
        yield pcm
      }
    }
  }
}

export class MimoProvider extends TTSProvider {
  constructor(deps) {
    super({ ...deps, id: 'mimo', label: 'MiMo 云端' })
    this.refsStore = deps.refsStore || null
    this.client = new MimoClient(deps.getConfig)
  }

  isAvailable() {
    const up = this.getConfig().upstream || {}
    return Boolean(up.keys?.length && up.baseUrl)
  }

  modelKey() {
    return this.getConfig().upstream?.model || 'mimo-v2.5-tts'
  }

  supportsStreaming(requests) {
    return Array.isArray(requests) && requests.length >= 1
      && requests.every((r) => (r.mode || 'preset') === 'preset')
  }

  #fileFingerprint(tag, wavPath) {
    try {
      const st = statSync(wavPath)
      return `${tag}:${Math.trunc(st.mtimeMs)}:${st.size}`
    } catch {
      return String(tag || '')
    }
  }

  #cloneDescriptorVoice(req) {
    if (req.refId) {
      const resolved = this.refsStore?.resolveRef({ refId: req.refId })
      if (resolved?.wav) return this.#fileFingerprint(resolved.id || resolved.wav, resolved.wav)
      return `ref:${req.refId}`
    }
    const raw = String(req.voice || '')
    if (!raw) return ''
    if (raw.startsWith('data:')) {
      return `data:${createHash('sha1').update(raw).digest('hex').slice(0, 12)}`
    }
    const resolved = this.refsStore ? this.refsStore.resolveRef(raw) : { id: '', wav: expandHomePath(raw) }
    const wavPath = resolved.wav || expandHomePath(raw)
    return this.#fileFingerprint(resolved.id || wavPath, wavPath)
  }

  resolveCloneSource(req) {
    if (req.refId) {
      if (!this.refsStore) throw new UpstreamError(`找不到克隆参考音：${req.refId}`, { status: 400 })
      const resolved = this.refsStore.resolveRef({ refId: req.refId })
      if (!resolved?.wav || !resolved.exists) {
        throw new UpstreamError(`找不到克隆参考音：${req.refId}`, { status: 400 })
      }
      return {
        voice: this.client.sampleDataUrl(resolved.wav),
        style: '',
        fingerprint: this.#fileFingerprint(resolved.id || resolved.wav, resolved.wav),
      }
    }
    const raw = String(req.voice || '')
    if (!raw) throw new UpstreamError('声音克隆模式缺少参考音频（refId 或音频路径）', { status: 400 })
    if (raw.startsWith('data:')) {
      return {
        voice: raw,
        style: '',
        fingerprint: `data:${createHash('sha1').update(raw).digest('hex').slice(0, 12)}`,
      }
    }
    const resolved = this.refsStore ? this.refsStore.resolveRef(raw) : { id: '', wav: expandHomePath(raw) }
    const wavPath = resolved.wav || expandHomePath(raw)
    return {
      voice: this.client.sampleDataUrl(wavPath),
      style: '',
      fingerprint: this.#fileFingerprint(resolved.id || wavPath, wavPath),
    }
  }

  cacheDescriptor(req, ctx = {}) {
    const mode = req.mode || 'preset'
    const up = ctx?.config?.upstream || this.getConfig().upstream || {}
    const model = up.model || 'mimo-v2.5-tts'
    if (mode === 'clone') {
      return {
        text: req.text,
        role: req.role,
        mode: 'clone',
        voice: this.#cloneDescriptorVoice(req),
        style: '',
        model,
      }
    }
    return {
      text: req.text,
      role: req.role,
      mode,
      voice: mode === 'design' ? '' : (req.voice || ''),
      style: req.style || '',
      model,
    }
  }

  async synthesizeSegment(req, ctx = {}) {
    const up = ctx?.config?.upstream
    const mode = req.mode || 'preset'
    if (mode === 'clone') {
      const resolved = this.resolveCloneSource(req)
      return this.client.synthesize({
        text: req.text,
        role: req.role,
        mode: 'clone',
        voice: resolved.voice,
        style: '',
        model: up?.model || this.modelKey(),
      }, up)
    }
    return this.client.synthesize({
      ...req,
      mode,
      model: up?.model || this.modelKey(),
    }, up)
  }

  async synthesizeBatch(requests, ctx = {}) {
    const fatalStatuses = new Set([401, 402, 403, 413])
    let failedCount = 0
    let lastSegErr = null
    const out = await super.synthesizeBatch(requests, {
      ...ctx,
      onSegmentError: (err, idx) => {
        if (fatalStatuses.has(err?.status) || !this.client.pool.size) {
          throw err
        }
        failedCount++
        lastSegErr = err
        this.log(`[warn] 段 ${idx + 1} 失败，插入静音: ${err?.message || err}`)
        const sil = silentWav(0.4)
        sil._noCache = true
        return sil
      },
    })
    if (failedCount >= requests.length && lastSegErr) {
      throw lastSegErr
    }
    return out
  }

  /** 用本地配置里的参考音走 MiMo clone（供混合启动与纯克隆调用）。 */
  cloudClone(req, ctx = {}) {
    const cfg = ctx?.config || this.getConfig()
    const local = cfg.upstream?.local || {}
    const rawRef = local.refs?.[req.role] || local.refs?.narrator
    const resolved = this.refsStore
      ? this.refsStore.resolveRef(rawRef)
      : { wav: expandHomePath(rawRef?.wav) }
    if (!resolved?.wav) throw new UpstreamError('混合启动缺少旁白参考音')
    const voice = this.client.sampleDataUrl(resolved.wav)
    return this.client.synthesize({ text: req.text, voice, style: '', mode: 'clone' }, cfg.upstream)
  }

  cloneModelTag() {
    const local = this.getConfig().upstream?.local || {}
    return computeRefsDigest(local.refs, this.refsStore)
  }

  /**
   * 真·流式响应：
   *   - 第 0 段优先走 `synthesizeStream()`（SSE pcm16 分片直出），抢到首包第一时间发往客户端；
   *   - 剩余段按并发上限并行整段合成，按顺序追加到同一个流式 WAV 响应；
   *   - 全部成功后各自入缓存，任何流式异常都写入 0.4s 静音 PCM 兜底（不写脏缓存）。
   */
  async respondStreaming(res, requests, meta, metrics) {
    const cfg = this.getConfig()
    const sourceTag = meta?.source || this.id
    const concurrency = Math.max(1, Math.min(8, Number(cfg.synth?.concurrency) || 4))
    const abortCtrl = new AbortController()
    // 正常写完 res.end() 之后也会触发 close，不能一律当成「客户端跑了」；
    // 只有响应还没写完就 close，才是真的中途断开。
    let clientGone = false
    const onClose = () => {
      if (!res.writableEnded) clientGone = true
      abortCtrl.abort()
    }
    res.on?.('close', onClose)

    // 先把第 1..N-1 段排队（受并发控制），与第 0 段流式同时起跑
    const tailSlots = requests.slice(1).map((req) => {
      let resolveSlot
      const promise = new Promise((resolve) => { resolveSlot = resolve })
      const key = cacheKey(this.cacheDescriptor(req))
      const run = async () => {
        const cached = this.cache.get(key)
        if (cached) {
          resolveSlot({ wav: cached, hit: true })
          return
        }
        if (this.gate) await this.gate.acquire()
        try {
          const wav = await this.synthesizeSegment(req)
          this.cache.set(key, wav)
          resolveSlot({ wav, hit: false })
        } catch (err) {
          this.log(`[warn] 流式后续段失败，插入静音: ${err?.message || err}`)
          resolveSlot({ wav: silentWav(0.4), hit: false })
        }
      }
      return { promise, run }
    })
    const tailRunning = tailSlots.length
      ? runLimited(tailSlots.map((s) => s.run), concurrency)
      : Promise.resolve()

    let sampleRate = 24000
    let wroteHeader = false
    let totalBytes = 0
    let seconds = 0
    let hits = 0

    const ensureHeaders = (sr = 24000) => {
      if (wroteHeader) return
      sampleRate = sr || 24000
      res.writeHead(200, {
        'Content-Type': 'audio/wav',
        'Cache-Control': 'no-store',
        'X-Mimo-Segments': String(requests.length),
        'X-Mimo-Source': sourceTag,
      })
      res.write(streamingWavHeader(sampleRate, 1, 16))
      wroteHeader = true
    }

    const writeSilenceFallback = () => {
      ensureHeaders(sampleRate)
      const silPcm = Buffer.alloc(Math.round(sampleRate * 0.4) * 2)
      res.write(silPcm)
      totalBytes += silPcm.length
      seconds += 0.4
    }

    try {
      // 第 0 段：命中缓存直接输出；未命中走真 SSE synthesizeStream()
      const req0 = requests[0]
      if (req0) {
        const key0 = cacheKey(this.cacheDescriptor(req0))
        const cached0 = this.cache.get(key0)
        if (cached0) {
          hits++
          let parsed0 = null
          try { parsed0 = parseWav(cached0) } catch { parsed0 = null }
          if (parsed0) {
            ensureHeaders(parsed0.sampleRate || 24000)
            res.write(parsed0.pcm)
            totalBytes += parsed0.pcm.length
            seconds += parsed0.durationSec
          } else {
            writeSilenceFallback()
          }
        } else {
          if (this.gate) await this.gate.acquire()
          const seg0Chunks = []
          let seg0Ok = true
          try {
            for await (const chunk of this.client.synthesizeStream(req0, { signal: abortCtrl.signal })) {
              if (!chunk?.length) continue
              ensureHeaders(24000)
              res.write(chunk)
              seg0Chunks.push(chunk)
              totalBytes += chunk.length
              seconds += chunk.length / 2 / sampleRate
            }
          } catch (err) {
            seg0Ok = false
            if (!abortCtrl.signal.aborted) {
              this.log(`[warn] 流式首段失败，写入静音 PCM 兜底：${err?.message || err}`)
            }
          }
          if (seg0Ok && seg0Chunks.length > 0) {
            const fullPcm = Buffer.concat(seg0Chunks)
            this.cache.set(key0, encodeWav(fullPcm, sampleRate, 1, 16))
          } else if (!abortCtrl.signal.aborted) {
            writeSilenceFallback()
          }
        }
      }

      // 第 1..N-1 段按序写出
      for (const slot of tailSlots) {
        if (abortCtrl.signal.aborted) break
        const { wav, hit } = await slot.promise
        if (hit) hits++
        let parsed
        try { parsed = parseWav(wav) } catch { parsed = null }
        if (!parsed || !parsed.pcm?.length) {
          writeSilenceFallback()
          continue
        }
        ensureHeaders(parsed.sampleRate || 24000)
        const pcm = parsed.sampleRate === sampleRate
          ? parsed.pcm
          : resample(parsed.pcm, parsed.sampleRate, sampleRate)
        res.write(pcm)
        totalBytes += pcm.length
        seconds += pcm.length / 2 / sampleRate
      }

      await tailRunning.catch(() => {})
      if (!wroteHeader) ensureHeaders(sampleRate)
      res.end()

      if (clientGone) {
        // 只发出去一段就断了：既没有完整交付，chars 又是全文长度，
        // 记成功会让「今日用量」按整章虚高，只留日志。
        this.log(`[stream] 客户端接收中断，本次不计入统计（已发出 ${totalBytes}B）`)
      } else {
        metrics?.record({
          chars: meta.text.length,
          segments: requests.length,
          bytes: totalBytes,
          audioSeconds: seconds,
          latencyMs: Date.now() - meta.started,
          cacheHit: hits === requests.length,
          client: meta.clientKey,
          bookId: meta.bookId,
          role: meta.role,
          text: meta.text.slice(0, 60),
          format: 'wav-stream',
          source: sourceTag,
        })
      }
      return { durationSec: seconds, bytes: totalBytes, hits, source: sourceTag }
    } finally {
      res.off?.('close', onClose)
    }
  }

  status() {
    const up = this.getConfig().upstream || {}
    return {
      id: this.id,
      label: this.label,
      ready: this.isAvailable(),
      model: up.model || '',
      keysCount: Array.isArray(up.keys) ? up.keys.length : 0,
    }
  }

  async onConfigChange() {
    this.client.clearSamples()
  }
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}
