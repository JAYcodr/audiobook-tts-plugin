/**
 * MiMo TTS 上游客户端。
 *
 * 三个模型对应三种音色来源：
 *   mimo-v2.5-tts             预置音色（9 个）
 *   mimo-v2.5-tts-voicedesign 用一段文字描述「造」一个音色，无需样本
 *   mimo-v2.5-tts-voiceclone  拿一段 mp3/wav 样本克隆音色
 *
 * 只有 mimo-v2.5-tts 的低延迟流式可用；另外两个即使 stream:true 也是
 * 「推理完再一次吐出来」，所以流式路径只对预置音色开放。
 */

import { readFileSync } from 'node:fs'
import { extname } from 'node:path'

const MAX_STREAM_BYTES = 64 * 1024 * 1024

export class UpstreamError extends Error {
  constructor(message, { status = 0, retryable = false } = {}) {
    super(message)
    this.name = 'UpstreamError'
    this.status = status
    this.retryable = retryable
  }
}

/** key 池：轮转 + 冷却。401/403 冷却久，429 冷却短，5xx 不影响 key。 */
export class KeyPool {
  constructor() { this.index = 0; this.cool = new Map() }

  set(keys) { this.keys = Array.isArray(keys) ? keys.filter(Boolean) : [] }

  get size() { return this.keys.length }

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
    // 全在冷却：用最早解冻的那把，让它去撞，失败由上层重试
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
  sampleDataUrl(path) {
    if (!path) throw new UpstreamError('缺少克隆参考音路径')
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

  clearSamples() { this.samples.clear() }

  cfg() {
    const c = this.getConfig()
    if (this.lastKeysRef !== c.upstream.keys) {
      this.pool.set(c.upstream.keys)
      this.lastKeysRef = c.upstream.keys
    }
    return c.upstream
  }

  buildPayload({ text, voice, style, mode = 'preset' }, format) {
    const up = this.cfg()
    const model = mode === 'design' ? 'mimo-v2.5-tts-voicedesign'
      : mode === 'clone' ? 'mimo-v2.5-tts-voiceclone'
        : up.model

    const body = {
      model,
      messages: [
        // user 消息是「风格/音色描述」，不读出来；voicedesign 时它才是必填的音色描述
        { role: 'user', content: mode === 'clone' ? '' : (style || '') },
        { role: 'assistant', content: text },
      ],
      audio: { format },
    }
    if (mode === 'preset') body.audio.voice = voice || '冰糖'
    if (mode === 'clone') body.audio.voice = voice
    return body
  }

  /** 非流式：一次拿到完整 WAV */
  async synthesize(req) {
    const up = this.cfg()
    const payload = this.buildPayload(req, 'wav')
    let lastErr
    for (let attempt = 0; attempt <= up.maxRetry; attempt++) {
      const key = this.pool.acquire()
      try {
        const res = await fetch(`${up.baseUrl}/chat/completions`, {
          method: 'POST',
          headers: { 'api-key': key, 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(up.timeoutMs),
        })
        if (!res.ok) {
          this.pool.report(key, res.status)
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
        if (attempt >= up.maxRetry) break
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
  async *synthesizeStream(req) {
    const up = this.cfg()
    const payload = this.buildPayload(req, 'pcm16')
    payload.stream = true
    const key = this.pool.acquire()
    const res = await fetch(`${up.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: { 'api-key': key, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(up.timeoutMs),
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

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)) }
