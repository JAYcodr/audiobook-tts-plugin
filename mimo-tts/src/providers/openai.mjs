/**
 * OpenAI 兼容 TTS Provider（POST /v1/audio/speech）。
 *
 * 可直接对接 OpenAI TTS、Kokoro-FastAPI、Edge-TTS-OpenAI、CosyVoice、OpenedAI-Speech、
 * Speaches 等社区兼容 `/v1/audio/speech` 协议的服务（本地自托管服务可留空 apiKey）。
 */
import { ProviderError, TTSProvider } from './base.mjs'
import { encodeWav } from '../wav.mjs'

export class OpenAiTtsProvider extends TTSProvider {
  constructor(deps) {
    super({ ...deps, id: 'openai', label: 'OpenAI 兼容' })
  }

  cfg(ctx = null) {
    return (ctx?.config || this.getConfig()).upstream?.openai || {}
  }

  isAvailable() {
    const c = this.cfg()
    return Boolean(/^https?:\/\//.test(String(c.baseUrl || '')) && String(c.model || '').trim())
  }

  voiceFor(roleOrReq, ctx = null) {
    if (roleOrReq && typeof roleOrReq === 'object') {
      if (roleOrReq.openaiVoice) return String(roleOrReq.openaiVoice)
      return this.voiceFor(roleOrReq.role, ctx)
    }
    if (ctx?.openaiVoice) return String(ctx.openaiVoice)
    const c = this.cfg(ctx)
    if (roleOrReq === 'dialogue') return String(c.dialogueVoice || c.narratorVoice || 'echo')
    return String(c.narratorVoice || 'alloy')
  }

  effectiveSpeed(ctx = null) {
    const c = this.cfg(ctx)
    const raw = ctx?.openaiSpeed !== undefined ? ctx.openaiSpeed : c.speed
    return Number.isFinite(Number(raw)) ? Math.max(0.25, Math.min(4.0, Number(raw))) : 1.0
  }

  modelKey(ctx = null) {
    const c = this.cfg(ctx)
    const base = String(c.baseUrl || '').replace(/\/+$/, '')
    const fmt = c.responseFormat || 'wav'
    const speed = this.effectiveSpeed(ctx)
    return `openai:${base}:${c.model || 'tts-1'}:${fmt}:${speed}:${c.instructions || ''}`
  }

  cacheDescriptor(req, ctx = null) {
    return {
      text: req.text,
      role: req.role,
      voice: this.voiceFor(req, ctx),
      style: String(this.cfg(ctx).instructions || ''),
      mode: 'openai',
      model: this.modelKey(ctx),
    }
  }

  async synthesizeSegment(req, ctx = null) {
    const c = this.cfg(ctx)
    const base = String(c.baseUrl || '').replace(/\/+$/, '')
    if (!/^https?:\/\//.test(base)) {
      throw new ProviderError('OpenAI 兼容引擎缺少合法的 baseUrl', { code: 'not_configured', provider: 'openai' })
    }
    const format = c.responseFormat === 'pcm' ? 'pcm' : 'wav'
    const speed = this.effectiveSpeed(ctx)
    const body = {
      model: String(c.model || 'tts-1'),
      input: req.text,
      voice: this.voiceFor(req, ctx),
      response_format: format,
      speed,
    }
    if (c.instructions) body.instructions = String(c.instructions)

    const headers = { 'Content-Type': 'application/json' }
    if (c.apiKey) headers.Authorization = `Bearer ${c.apiKey}`

    const maxRetry = Math.max(0, Number(c.maxRetry ?? 2))
    const timeoutMs = Math.max(1000, Number(c.timeoutMs ?? 60000))
    let lastErr

    for (let attempt = 0; attempt <= maxRetry; attempt++) {
      try {
        const res = await fetch(`${base}/audio/speech`, {
          method: 'POST',
          headers,
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(timeoutMs),
        })
        if (!res.ok) {
          const text = await res.text().catch(() => '')
          const retryable = res.status >= 500 || res.status === 429
          const err = new ProviderError(`OpenAI TTS 上游 ${res.status}: ${text.slice(0, 200)}`, {
            status: res.status,
            retryable,
            code: 'upstream_error',
            provider: 'openai',
          })
          if (!retryable) throw err
          lastErr = err
          await sleep(500 * 2 ** attempt)
          continue
        }
        const buf = Buffer.from(await res.arrayBuffer())
        if (format === 'pcm') {
          if (!buf.length) throw new ProviderError('OpenAI TTS 返回空 PCM 数据', { retryable: true, provider: 'openai' })
          return encodeWav(buf, 24000, 1, 16)
        }
        if (buf.length < 44 || buf.toString('ascii', 0, 4) !== 'RIFF') {
          throw new ProviderError(`OpenAI TTS 返回非 WAV 字节 (${buf.length}B)`, {
            retryable: true,
            code: 'bad_wav',
            provider: 'openai',
          })
        }
        return buf
      } catch (err) {
        if (err instanceof ProviderError && !err.retryable) throw err
        lastErr = err
        if (attempt >= maxRetry) break
        await sleep(500 * 2 ** attempt)
      }
    }

    throw lastErr instanceof ProviderError
      ? lastErr
      : new ProviderError(`OpenAI TTS 请求失败: ${String(lastErr?.message || lastErr)}`, { provider: 'openai' })
  }

  status() {
    const c = this.cfg()
    return {
      id: this.id,
      label: this.label,
      ready: this.isAvailable(),
      baseUrl: c.baseUrl || '',
      model: c.model || '',
      hasKey: Boolean(c.apiKey),
    }
  }
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}
