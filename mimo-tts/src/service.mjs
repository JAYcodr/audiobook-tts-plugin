/**
 * 听书服务内核：HTTP 服务 + 合成流水线调度。
 *
 * 通过标准 TTSProvider + ProviderRegistry 解耦各引擎（MiMo / Local / Hybrid / OpenAI 兼容），
 * 自身只负责 HTTP 监听、/listening 文本切分流水线、配置变更通知与模块装配。
 * 不 import 任何 DSH 宿主依赖，既可作为插件内核，也可 `node bin/audiobook-tts.mjs` 独立运行。
 */
import { createServer } from 'node:http'
import { join } from 'node:path'
import { authorized, clientKeyOf } from './auth.mjs'
import {
  AudioCache,
  computeResponseEtag,
  computeSegmentKeys,
  etagMatches,
  resolveHttpCachePolicy,
} from './cache.mjs'
import { validatePatch } from './config.mjs'
import { createControlHandler } from './control-api.mjs'
import { encodeHintHeader, humanizeError } from './hints.mjs'
import { HttpInputError, readBody, sendJson } from './http.mjs'
import { handleLegadoJson } from './legado.mjs'
import { applyGlobalRules, applySegmentRules } from './lexicon.mjs'
import { Metrics, NoopGate, RpmGate } from './metrics.mjs'
import { createOpenAiServerHandler } from './openai-server.mjs'
import { ProviderError, ProviderRegistry } from './providers/base.mjs'
import { HybridProvider } from './providers/hybrid.mjs'
import { LocalProvider } from './providers/local.mjs'
import { MimoProvider } from './providers/mimo.mjs'
import { OpenAiTtsProvider } from './providers/openai.mjs'
import { RefsStore } from './refs-store.mjs'
import { SetupManager } from './setup-manager.mjs'
import { splitText, toRequests } from './split.mjs'
import { LEGADO_FORMATS, transcodeWav } from './transcode.mjs'
import { TunnelManager } from './tunnel-manager.mjs'
import { concatWavs } from './wav.mjs'

export const VERSION = '0.5.2'

export class TtsService {
  /**
   * @param {object} deps
   * @param {import('./config.mjs').Store} deps.store
   * @param {(line:string)=>void} [deps.log]
   * @param {object} [deps.transcodeOpts]
   */
  constructor({ store, log, transcodeOpts }) {
    this.store = store
    this.log = log || ((line) => console.log(line))
    this.transcodeOpts = transcodeOpts || {}
    const metricsFile = store.dataDir ? join(store.dataDir, 'metrics.json') : ''
    this.metrics = new Metrics({
      ringSize: store.config.log.ring,
      filePath: metricsFile,
      log: this.log,
    })
    this.metrics.load()
    this.cache = new AudioCache(() => this.store.config.cache)
    const mimoGate = new RpmGate(() => this.store.config.limits.rpm)
    const openaiGate = new RpmGate(() => this.store.config.limits.rpm)
    const localGate = new NoopGate()
    this.gates = new Map([
      ['mimo', mimoGate],
      ['openai', openaiGate],
      ['local', localGate],
      ['hybrid', mimoGate],
    ])
    // 向后兼容属性（测试与外部脚本可能直接访问 svc.gate）
    this.gate = mimoGate
    this.refs = new RefsStore({ dataDir: store.dataDir || '', log: this.log }).load()
    if (store && typeof store === 'object') store.refsStore = this.refs

    this.registry = new ProviderRegistry()
    this.mimoProvider = this.registry.register(new MimoProvider({
      getConfig: () => this.store.config,
      refsStore: this.refs,
      cache: this.cache,
      gate: mimoGate,
      log: this.log,
    }))
    this.localProvider = this.registry.register(new LocalProvider({
      getConfig: () => this.store.config,
      dataDir: this.store.dataDir,
      refsStore: this.refs,
      cache: this.cache,
      gate: localGate,
      log: this.log,
    }))
    this.openaiProvider = this.registry.register(new OpenAiTtsProvider({
      getConfig: () => this.store.config,
      cache: this.cache,
      gate: openaiGate,
      log: this.log,
    }))
    this.hybridProvider = this.registry.register(new HybridProvider({
      getConfig: () => this.store.config,
      refsStore: this.refs,
      cache: this.cache,
      gate: mimoGate,
      log: this.log,
      mimoProvider: this.mimoProvider,
      localProvider: this.localProvider,
    }))

    // 向后兼容属性（测试与外部脚本可能直接访问）
    this.mimo = this.mimoProvider.client
    this.local = this.localProvider.engine
    this.setup = new SetupManager({
      dataDir: store.dataDir || '',
      refsStore: this.refs,
      getConfig: () => this.store.config,
      log: this.log,
    })
    this.tunnel = new TunnelManager({
      getConfig: () => this.store.config,
      log: this.log,
    })

    this.controlHandler = createControlHandler({ service: this, requireAuth: true })
    this.openaiServerHandler = createOpenAiServerHandler({ service: this })
    this.server = null
    this.startedAt = 0
    this.listening = false
  }

  get config() { return this.store.config }

  get provider() { return this.config.upstream?.provider || 'mimo' }

  get sessions() { return this.hybridProvider.sessions }

  /** 允许外部扩展注册自定义 TTSProvider 实例 */
  registerProvider(provider) {
    return this.registry.register(provider)
  }

  activeGate() {
    return this.gates.get(this.provider) || this.gate
  }

  rpmUsageByProvider() {
    return {
      mimo: this.gates.get('mimo')?.usage() || { used: 0, limit: 100, waiting: 0, unlimited: false },
      openai: this.gates.get('openai')?.usage() || { used: 0, limit: 100, waiting: 0, unlimited: false },
      local: this.gates.get('local')?.usage() || { used: 0, limit: null, waiting: 0, unlimited: true },
    }
  }

  activeProvider() {
    const p = this.registry.get(this.provider)
    if (!p) throw new ProviderError(`未知的 TTS 引擎：${this.provider}`, { code: 'unknown_provider' })
    return p
  }

  // ───────────────────────── 生命周期 ─────────────────────────

  async start() {
    if (this.server) return this.info()
    const { host, port } = this.config.server
    const server = createServer((req, res) => {
      this.handle(req, res).catch((err) => {
        this.log(`[error] ${req.method} ${req.url} → ${err?.message || err}`)
        if (!res.headersSent) {
          const status = err instanceof HttpInputError ? err.status : 500
          sendJson(res, status, { error: String(err?.message || err) })
        } else {
          res.end()
        }
      })
    })
    server.keepAliveTimeout = 65_000
    await new Promise((resolve, reject) => {
      server.once('error', reject)
      server.listen(port, host, () => {
        server.off('error', reject)
        resolve()
      })
    })
    this.server = server
    this.startedAt = Date.now()
    this.listening = true
    this.log(`[ok] 听书服务已启动 http://${host}:${port}`)
    return this.info()
  }

  /** 只关 HTTP 监听，不动本地 sidecar（换端口时不该把模型也杀了）。 */
  async stopServer() {
    if (!this.server) return this.info()
    const server = this.server
    this.server = null
    this.listening = false
    await new Promise((resolve) => server.close(() => resolve()))
    this.log('[ok] 听书服务已停止')
    return this.info()
  }

  async stop() {
    this.metrics.flush()
    await Promise.all([
      this.setup?.shutdown().catch(() => {}),
      this.tunnel?.shutdown().catch(() => {}),
      this.registry.shutdown(),
    ])
    return this.stopServer()
  }

  async restart() {
    await this.stopServer()
    return this.start()
  }

  info() {
    const { host, port } = this.config.server
    return {
      running: this.listening,
      host,
      port,
      url: `http://${host === '0.0.0.0' ? '127.0.0.1' : host}:${port}`,
      uptimeSec: this.listening ? Math.round((Date.now() - this.startedAt) / 1000) : 0,
      version: VERSION,
      provider: this.provider,
      local: this.local.status(),
      hybrid: this.hybridStatus(),
      openai: this.openaiProvider.status(),
      openaiServer: {
        enabled: Boolean(this.config.openaiServer?.enabled),
        defaultModel: this.config.openaiServer?.defaultModel || 'audiobook-tts',
        mp3Fallback: this.config.openaiServer?.mp3Fallback || 'wav',
      },
    }
  }

  cloudAvailable() {
    return this.mimoProvider.isAvailable()
  }

  hybridStatus() {
    return this.hybridProvider.status()
  }

  // ───────────────────────── HTTP 路由 ─────────────────────────

  async handle(req, res) {
    const url = new URL(req.url, 'http://localhost')
    const path = url.pathname

    if (path === '/health') {
      return sendJson(res, 200, {
        status: 'ok',
        ...this.info(),
        cache: this.cache.stats(),
        rpm: this.activeGate().usage(),
        rpmByProvider: this.rpmUsageByProvider(),
        local: this.local.status(),
      })
    }

    if (path === '/listening') return this.handleListening(req, res, url)
    if (path === '/legado.json') return this.handleLegadoJson(req, res, url)
    if (path === '/v1/models' || path === '/v1/audio/speech') {
      return this.openaiServerHandler(req, res, path, url)
    }

    if (path.startsWith('/api/')) {
      const handled = await this.controlHandler(req, res, path, url)
      if (handled) return
    }

    return sendJson(res, 404, { error: 'not found' })
  }

  authorized(req, url, opts) {
    return authorized(req, url, this.config.auth, opts)
  }

  handleLegadoJson(req, res, url) {
    return handleLegadoJson(req, res, url, this.config)
  }

  localReadyForFallback() {
    if (this.provider === 'local') return false
    if (this.local?.isWarm?.()) return true
    const lo = this.config.upstream?.local || {}
    return Boolean(String(lo.pythonPath || '').trim() && String(lo.modelPath || '').trim())
  }

  diagnosticContext(extra = {}) {
    return {
      provider: this.provider,
      localReady: this.localReadyForFallback(),
      maxTextChars: this.config.synth?.maxTextChars,
      ...extra,
    }
  }

  // ───────────────────────── 朗读与合成流水线 ─────────────────────────

  async handleListening(req, res, url) {
    if (!this.authorized(req, url, { allowRead: true })) {
      const diag = humanizeError(401, this.diagnosticContext({ endpointAuth: true }))
      return sendJson(res, 401, { error: '需要鉴权', hint: diag.hint, code: diag.code }, {
        basic: true,
        headers: { 'X-Audiobook-Hint': encodeHintHeader(diag.hint) },
      })
    }
    if (!this.listening) {
      const diag = humanizeError(Object.assign(new Error('服务未启动'), { code: 'service_stopped', status: 503 }), this.diagnosticContext())
      this.metrics.noteError(diag)
      return sendJson(res, 503, { error: '服务未启动', hint: diag.hint, code: diag.code }, {
        headers: { 'X-Audiobook-Hint': encodeHintHeader(diag.hint) },
      })
    }

    let text = ''
    let bookId = ''
    let speed = Number(url.searchParams.get('speed') || 0) || 0
    let rawFormat = String(url.searchParams.get('format') || '').trim()
    const wantStream = url.searchParams.has('stream')
      ? truthy(url.searchParams.get('stream'))
      : Boolean(this.config.synth.stream)

    if (req.method === 'POST') {
      const body = await readBody(req, 1_000_000)
      const ct = (req.headers['content-type'] || '').toLowerCase()
      if (ct.includes('application/json')) {
        try {
          const json = JSON.parse(body.toString('utf8') || '{}')
          text = String(json.text ?? '')
          bookId = String(json.id ?? json.bookId ?? '')
          speed = Number(json.speed) || speed
          if (!rawFormat && json.format !== undefined && json.format !== null) {
            rawFormat = String(json.format).trim()
          }
        } catch {
          return sendJson(res, 400, { error: 'JSON 解析失败' })
        }
      } else {
        const params = new URLSearchParams(body.toString('utf8'))
        text = params.get('text') || ''
        bookId = params.get('id') || ''
        speed = Number(params.get('speed')) || speed
        if (!rawFormat && params.get('format')) {
          rawFormat = String(params.get('format')).trim()
        }
      }
    } else if (req.method === 'GET') {
      text = url.searchParams.get('text') || ''
      bookId = url.searchParams.get('id') || ''
    } else {
      return sendJson(res, 405, { error: 'method not allowed' })
    }

    let targetFormat = 'wav'
    if (rawFormat) {
      const lowerFmt = rawFormat.toLowerCase()
      if (!LEGADO_FORMATS.has(lowerFmt)) {
        return sendJson(res, 400, {
          error: `Legado 接口不支持音频格式 "${rawFormat}"，仅支持 wav 或 mp3`,
        })
      }
      targetFormat = lowerFmt
    } else {
      const cfgFmt = String(this.config.audio?.format || 'wav').trim().toLowerCase()
      // Legado 兼容白名单仅 wav / mp3；全局设为 opus 时未显式指定 ?format= 则安全退回 wav。
      targetFormat = cfgFmt === 'mp3' ? 'mp3' : 'wav'
    }

    text = text.trim()
    if (!text) return sendJson(res, 400, { error: 'text 不能为空' })
    if (text.length > this.config.synth.maxTextChars) {
      const diag = humanizeError(413, this.diagnosticContext())
      this.metrics.noteError(diag)
      return sendJson(res, 413, {
        error: `文本超过 ${this.config.synth.maxTextChars} 字`,
        hint: diag.hint,
        code: diag.code,
      }, {
        headers: { 'X-Audiobook-Hint': encodeHintHeader(diag.hint) },
      })
    }

    const clientKey = clientKeyOf(req)
    const started = Date.now()
    const segments = this.prepareSegments(text, this.config)
    if (!segments.length) return sendJson(res, 400, { error: '切分或规则替换后没有内容' })

    this.metrics.touch(clientKey, { text: text.slice(0, 60), chars: text.length, bookId })

    const requests = toRequests(segments, this.effectiveVoices(speed))
    const role = requests.every((r) => r.role === 'dialogue') ? 'dialogue'
      : requests.every((r) => r.role === 'narrator') ? 'narrator' : 'mixed'

    try {
      const provider = this.activeProvider()
      const streamCtx = { clientKey, speed, started }
      const streamingPath = wantStream
        && targetFormat === 'wav'
        && provider.supportsStreaming(requests, streamCtx)
        && typeof provider.respondStreaming === 'function'
      if (wantStream && targetFormat === 'wav' && !streamingPath) {
        this.log(`[stream] provider=${this.provider} 当前请求不支持流式，已退回整段合成`)
      } else if (wantStream && targetFormat !== 'wav') {
        this.log(`[stream] 目标格式为 ${targetFormat}（非 wav），已跳过流式直出并走整段转码`)
      }
      if (streamingPath) {
        return await provider.respondStreaming(res, requests, { started, text, bookId, clientKey, role, speed }, this.metrics)
      }

      const cachePolicy = resolveHttpCachePolicy(this.config.cache)
      const segKeys = cachePolicy.enabled
        ? computeSegmentKeys(provider, requests, { clientKey, started, speed, config: this.config })
        : []
      const etag = cachePolicy.enabled
        ? computeResponseEtag({
            segmentKeys: segKeys,
            format: targetFormat,
            bitrate: this.config.audio?.bitrate ?? 64,
          })
        : ''
      if (etag && etagMatches(req.headers?.['if-none-match'], etag)) {
        res.writeHead(304, {
          'Cache-Control': cachePolicy.cacheControl,
          ETag: etag,
          'X-Cache': 'HIT',
        })
        return res.end()
      }

      const { wav, durationSec, hits, source } = await this.synthesize(requests, { clientKey, started, speed })
      const tx = targetFormat === 'wav'
        ? { buffer: wav, format: 'wav', contentType: 'audio/wav', fallback: false, reason: '' }
        : await transcodeWav(wav, {
            format: targetFormat,
            bitrate: this.config.audio?.bitrate ?? 64,
            ...(this.transcodeOpts || {}),
          })
      if (tx.fallback) {
        this.log(`[audio] ${targetFormat} 转码已回退 WAV（reason=${tx.reason}${tx.error ? `: ${tx.error}` : ''}）`)
      }
      const cacheHit = this.config.cache?.enabled !== false && requests.length > 0 && hits === requests.length
      const latency = Date.now() - started
      this.metrics.record({
        chars: text.length,
        segments: requests.length,
        bytes: tx.buffer.length,
        audioSeconds: durationSec,
        latencyMs: latency,
        cacheHit,
        client: clientKey,
        bookId,
        role,
        text: text.slice(0, 60),
        format: tx.format,
        source,
      })
      const headers = {
        'Content-Type': tx.contentType,
        'Content-Length': tx.buffer.length,
        'Cache-Control': (!tx.fallback && cachePolicy.enabled) ? cachePolicy.cacheControl : 'no-store',
        'X-Cache': cacheHit ? 'HIT' : 'MISS',
        'X-Mimo-Segments': String(requests.length),
        'X-Mimo-Latency-Ms': String(latency),
        'X-Mimo-Duration-S': durationSec.toFixed(2),
        'X-Mimo-Source': source,
      }
      if (!tx.fallback && etag) headers.ETag = etag
      if (tx.fallback) {
        headers['X-Audiobook-Format-Fallback'] = 'wav'
        if (tx.reason) headers['X-Audiobook-Fallback-Reason'] = tx.reason
      }
      res.writeHead(200, headers)
      res.end(tx.buffer)
    } catch (err) {
      const diag = humanizeError(err, this.diagnosticContext())
      const latency = Date.now() - started
      this.metrics.record({
        chars: text.length,
        segments: requests.length,
        bytes: 0,
        latencyMs: latency,
        error: true,
        errorStatus: diag.httpStatus,
        errorCode: diag.code,
        errorMessage: diag.message,
        errorHint: diag.hint,
        errorAction: diag.action,
        client: clientKey,
        bookId,
        role,
        text: text.slice(0, 60),
      })
      this.log(`[error] 合成失败 (${diag.httpStatus}/${diag.code}): ${err?.message || err} -> ${diag.message}`)
      return sendJson(res, diag.httpStatus, {
        error: diag.message || String(err?.message || err),
        hint: diag.hint,
        code: diag.code,
      }, {
        headers: { 'X-Audiobook-Hint': encodeHintHeader(`${diag.message}：${diag.hint}`) },
      })
    }
  }

  /** 文本处理全链路：全局正则/字面替换 -> 对话/旁白切分 -> 角色定向规则 */
  prepareSegments(text, cfg = this.config) {
    const afterGlobal = applyGlobalRules(text, cfg.textRules)
    if (!afterGlobal.trim()) return []
    const raw = splitText(afterGlobal, { maxSegmentChars: cfg.synth?.maxSegmentChars })
    return applySegmentRules(raw, cfg.textRules)
  }

  /**
   * 把 Legado 的 speakSpeed（5–50，默认 5）映射成风格提示。
   * 用自然语言而不是给音频加速：重采样会让声音变调，听感比原速更差。
   */
  effectiveVoices(speed) {
    const base = this.config.voices
    const hint = speed >= 22 ? '，语速偏快' : speed >= 14 ? '，语速稍快' : speed > 0 && speed <= 4 ? '，语速偏慢' : ''
    if (!hint) return base
    const withHint = (v) => ({ ...v, style: `${v.style || ''}${hint}` })
    return { narrator: withHint(base.narrator), dialogue: withHint(base.dialogue) }
  }

  async synthesize(requests, ctx = {}) {
    return this.activeProvider().synthesizeBatch(requests, ctx)
  }

  async preview({ text, role = 'narrator', draft = null, applyTextRules = true } = {}) {
    let effCfg = this.config
    let ctx = {}
    if (draft && typeof draft === 'object' && !Array.isArray(draft)) {
      const checked = validatePatch(this.config, draft, { refsStore: this.refs })
      if (checked.problems.length) {
        throw new HttpInputError(checked.problems.join('；'), 422)
      }
      effCfg = checked.merged
      ctx = { config: effCfg }
    }

    const providerId = effCfg.upstream?.provider || 'mimo'
    const provider = this.registry.get(providerId)
    if (!provider) {
      throw new ProviderError(`未知的 TTS 引擎：${providerId}`, { code: 'unknown_provider' })
    }

    const cleanRole = role === 'dialogue' ? 'dialogue' : (role === 'mixed' ? 'mixed' : 'narrator')
    if (cleanRole === 'mixed') {
      const segments = applyTextRules !== false
        ? this.prepareSegments(text, effCfg)
        : splitText(text, { maxSegmentChars: effCfg.synth?.maxSegmentChars })
      if (!segments.length) throw new HttpInputError('规则替换或切分后没有可试听内容', 400)
      const requests = toRequests(segments, effCfg.voices)
      const wavs = []
      let lastSource = provider.id
      for (const req of requests) {
        const out = await provider.preview({ text: req.text, role: req.role, voices: effCfg.voices }, ctx)
        wavs.push(out.wav)
        if (out.source) lastSource = out.source
      }
      const { wav } = concatWavs(wavs)
      return { wav, source: lastSource }
    }

    let cleanText = String(text ?? '').trim()
    if (applyTextRules !== false) {
      const afterGlobal = applyGlobalRules(cleanText, effCfg.textRules)
      const segs = applySegmentRules([{ role: cleanRole, text: afterGlobal }], effCfg.textRules)
      cleanText = segs.map((s) => s.text).join('').trim()
      if (!cleanText) throw new HttpInputError('规则替换后没有可试听内容', 400)
    }
    return provider.preview({ text: cleanText, role: cleanRole, voices: effCfg.voices }, ctx)
  }

  /**
   * 统一写配置：校验 → 落盘 → 通知 Provider 清理状态 / 端口变化时重启 HTTP。
   */
  async applyPatch(patch) {
    const before = structuredClone(this.config)
    const result = this.store.update(patch)
    if (result.problems?.length) return result

    await this.registry.onConfigChange(before, this.config)

    const { host, port } = this.config.server
    if (before.server.host !== host || before.server.port !== port) {
      if (this.server) await this.restart()
      if (this.tunnel?.isActive()) {
        await this.tunnel.stop().catch(() => {})
        await this.tunnel.startQuick({
          port,
          protocol: this.config.tunnel?.protocol || 'http2',
        }).catch((err) => this.log(`[warn] Quick Tunnel 换端口重启失败：${err?.message || err}`))
      }
    }
    return { problems: [], config: this.config, service: this.info() }
  }
}

function truthy(v) {
  return v === '' || v === '1' || v === 'true' || v === 'yes'
}
