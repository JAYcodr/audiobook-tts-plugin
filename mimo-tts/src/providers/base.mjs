/**
 * 标准 TTSProvider 接口定义、通用分段并发执行器与 Provider 注册表。
 *
 * 任何新 TTS 引擎（MiMo / 本地 MLX / OpenAI 兼容 / Edge-TTS / CosyVoice / Kokoro 等）
 * 只需继承 TTSProvider 并注册进 ProviderRegistry，即可无缝接入 TtsService。
 */
import { cacheKey } from '../cache.mjs'
import { concatWavs } from '../wav.mjs'

export class ProviderError extends Error {
  constructor(message, { status = 0, retryable = false, code = 'provider_error', provider = '' } = {}) {
    super(message)
    this.name = 'ProviderError'
    this.status = status
    this.retryable = retryable
    this.code = code
    this.provider = provider
  }
}

export class TTSProvider {
  /**
   * @param {object} deps
   * @param {string} deps.id
   * @param {string} [deps.label]
   * @param {() => any} deps.getConfig
   * @param {import('../cache.mjs').AudioCache} deps.cache
   * @param {import('../metrics.mjs').RpmGate} deps.gate
   * @param {(line:string)=>void} [deps.log]
   */
  constructor({ id, label, getConfig, cache, gate, log }) {
    this.id = id
    this.label = label || id
    this.getConfig = getConfig
    this.cache = cache
    this.gate = gate
    this.log = log || (() => {})
  }

  /** 是否在当前请求组上启用流式响应 */
  supportsStreaming(_requests) {
    return false
  }

  /** 用于缓存键的模型标识 */
  modelKey() {
    return this.id
  }

  /** 允许子类补充影响音色/语速的缓存键字段 */
  cacheDescriptor(req) {
    return { ...req, model: this.modelKey() }
  }

  /** 合成单段，返回完整 WAV Buffer */
  async synthesizeSegment(_req, _ctx) {
    throw new ProviderError(`Provider "${this.id}" 未实现 synthesizeSegment()`, { code: 'not_implemented', provider: this.id })
  }

  /**
   * 合成整组段落：查缓存 -> 过限速闸门 -> 并发拉取 -> 写缓存 -> 拼接 WAV。
   * 子类可通过 concurrency / onSegmentError 定制行为，或完全覆写（如 HybridProvider）。
   */
  async synthesizeBatch(requests, ctx = {}) {
    const cfg = this.getConfig()
    const concurrency = Math.max(1, Math.min(8, Number(ctx.concurrency ?? cfg.synth?.concurrency) || 4))
    const keys = requests.map((req) => cacheKey(this.cacheDescriptor(req)))
    const results = new Array(requests.length)
    let hits = 0

    const tasks = requests.map((req, i) => async () => {
      const key = keys[i]
      const cached = this.cache.get(key)
      if (cached) {
        this.onCacheHit()
        hits++
        results[i] = cached
        return
      }
      await this.gate.acquire()
      let wav
      try {
        wav = await this.synthesizeSegment(req, ctx)
      } catch (err) {
        if (typeof ctx.onSegmentError === 'function') {
          wav = ctx.onSegmentError(err, i, req)
        } else {
          throw err
        }
      }
      this.cache.set(key, wav)
      results[i] = wav
    })

    await runLimited(tasks, concurrency)
    const { wav, durationSec } = concatWavs(results)
    return { wav, durationSec, hits, source: this.id, reason: this.id }
  }

  onCacheHit() {}

  /** 试听（不走缓存） */
  async preview({ text, role = 'narrator', voices }) {
    const v = voices?.[role] || voices?.narrator || { voice: '', style: '', mode: 'preset' }
    const wav = await this.synthesizeSegment({
      text,
      role,
      voice: v.voice,
      style: v.style,
      mode: v.mode || 'preset',
    }, { preview: true })
    return { wav, source: this.id }
  }

  status() {
    return { id: this.id, label: this.label, ready: true }
  }

  async onConfigChange(_before, _after) {}

  async shutdown() {}
}

export class ProviderRegistry {
  constructor() {
    this.providers = new Map()
  }

  register(provider) {
    this.providers.set(provider.id, provider)
    return provider
  }

  get(id) {
    return this.providers.get(id) || null
  }

  has(id) {
    return this.providers.has(id)
  }

  list() {
    return [...this.providers.values()]
  }

  async onConfigChange(before, after) {
    for (const p of this.providers.values()) {
      await p.onConfigChange(before, after)
    }
  }

  async shutdown() {
    for (const p of this.providers.values()) {
      await p.shutdown()
    }
  }
}

export async function runLimited(tasks, limit) {
  const queue = tasks.slice()
  const workers = Array.from({ length: Math.min(limit, queue.length) }, async () => {
    while (queue.length) {
      const task = queue.shift()
      await task()
    }
  })
  await Promise.all(workers)
}
