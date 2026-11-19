/**
 * 听书服务内核：HTTP 服务 + 合成流水线。
 *
 * 这个模块**不认识 DSH**。它既能被插件宿主 import 进同一个进程，
 * 也能 `node bin/mimo-tts.mjs` 单独跑 —— 「开箱即用」的前提是它不绑在某一个容器上。
 *
 * 对外只有一组路由：
 *   POST/GET /listening      Legado 用的朗读入口
 *   GET      /health         存活探针（免鉴权）
 *   GET      /legado.json    Legado 一键导入的 HttpTTS 配置
 *   GET      /api/live       控制台值守页
 *   GET      /api/stats      累计与每日
 *   GET/PUT  /api/config     读写配置（写的是 config.json）
 *   POST     /api/preview    试听一段文本
 */
import { createServer } from 'node:http'
import { timingSafeEqual, createHash } from 'node:crypto'
import { splitText, toRequests } from './split.mjs'
import { concatWavs, encodeWav, streamingWavHeader, silentWav, parseWav, normalizeWav } from './wav.mjs'
import { MimoClient, UpstreamError } from './mimo.mjs'
import { AudioCache, cacheKey } from './cache.mjs'
import { Metrics, RpmGate } from './metrics.mjs'
import { redact } from './config.mjs'
import { LocalEngine } from './local.mjs'

const VERSION = '0.2.0'
const PAUSE_GAP_MS = 20_000
const LONG_PARAGRAPH_CHARS = 60
const CHAPTER_TITLE_RE = /^\s*第[0-9零一二三四五六七八九十百千万两]+[章节回卷]/
const RECENT_TEXTS = 5
const LOCAL_GEN_BASE_SEC = 1.8
const LOCAL_GEN_PER_CHAR = 0.11
const HYBRID_CLOUD_BUDGET_MS = 4000

export class TtsService {
  /**
   * @param {object} deps
   * @param {import('./config.mjs').Store} deps.store
   * @param {(line:string)=>void} [deps.log]
   */
  constructor({ store, log }) {
    this.store = store
    this.log = log || ((line) => console.log(line))
    this.metrics = new Metrics(store.config.log.ring)
    this.cache = new AudioCache(() => this.store.config.cache)
    this.gate = new RpmGate(() => this.store.config.limits.rpm)
    this.mimo = new MimoClient(() => this.store.config)
    this.local = new LocalEngine({
      getConfig: () => this.store.config,
      dataDir: this.store.dataDir,
      log: this.log,
    })
    this.server = null
    this.startedAt = 0
    this.listening = false
    this.bootstrapCount = 0
    this.lastSource = ''
    this.lastSwitchReason = ''
    this.bootstrapWarned = false
    this.sessions = new Map()
  }

  get config() { return this.store.config }

  get provider() { return this.config.upstream?.provider || 'mimo' }

  // ───────────────────────── 生命周期 ─────────────────────────

  async start() {
    if (this.server) return this.info()
    const { host, port } = this.config.server
    const server = createServer((req, res) => {
      this.handle(req, res).catch((err) => {
        this.log(`[error] ${req.method} ${req.url} → ${err?.message || err}`)
        if (!res.headersSent) sendJson(res, 500, { error: String(err?.message || err) })
        else res.end()
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
    this.sessions.clear()
    await this.local.shutdown().catch((err) => this.log(`[warn] 本地引擎停止失败：${err?.message || err}`))
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
    }
  }

  cloudAvailable() {
    const up = this.config.upstream || {}
    return Boolean(up.keys?.length && up.baseUrl)
  }

  hybridStatus() {
    const h = this.config.upstream?.hybrid || {}
    return {
      enabled: this.provider === 'hybrid',
      cloudReady: this.cloudAvailable(),
      bootstrapCount: this.bootstrapCount,
      maxCloudBootstrap: Number(h.maxCloudBootstrap) || 0,
      localWarm: this.local.isWarm(),
      lastSource: this.lastSource,
      lastSwitchReason: this.lastSwitchReason,
    }
  }

  // ───────────────────────── 路由 ─────────────────────────

  async handle(req, res) {
    const url = new URL(req.url, 'http://localhost')
    const path = url.pathname

    if (path === '/health') {
      return sendJson(res, 200, {
        status: 'ok',
        ...this.info(),
        cache: this.cache.stats(),
        rpm: this.gate.usage(),
        local: this.local.status(),
      })
    }

    if (path === '/listening') return this.handleListening(req, res, url)
    if (path === '/legado.json') return this.handleLegadoJson(req, res, url)
    if (path === '/api/preview') return this.handlePreview(req, res, url)

    if (!this.authorized(req, url)) return sendJson(res, 401, { error: '需要鉴权' }, { basic: true })

    if (path === '/api/live') {
      return sendJson(res, 200, {
        service: this.info(),
        rpm: this.gate.usage(),
        cache: this.cache.stats(),
        local: this.local.status(),
        ...this.metrics.snapshot(),
      })
    }
    if (path === '/api/stats') {
      return sendJson(res, 200, { cache: this.cache.stats(), rpm: this.gate.usage(), local: this.local.status(), ...this.metrics.snapshot() })
    }
    if (path === '/api/config') {
      if (req.method === 'GET') return sendJson(res, 200, redact(this.config))
      if (req.method === 'PUT') return this.handleConfigPut(req, res)
      return sendJson(res, 405, { error: 'method not allowed' })
    }
    if (path === '/api/local') {
      if (req.method === 'GET') return sendJson(res, 200, { local: this.local.status() })
      if (req.method === 'POST') {
        const body = await readBody(req, 10_000)
        let action = 'status'
        try { action = String(JSON.parse(body.toString('utf8') || '{}').action || 'status') } catch { /* 默认 status */ }
        if (action === 'unload') await this.local.stop('manual')
        else if (action === 'start' || action === 'load') await this.local.preload()
        else if (action !== 'status') return sendJson(res, 400, { error: 'action 必须是 start / unload / status' })
        return sendJson(res, 200, { local: this.local.status() })
      }
      return sendJson(res, 405, { error: 'method not allowed' })
    }
    if (path === '/api/cache' && req.method === 'DELETE') {
      this.cache.clear()
      return sendJson(res, 200, { ok: true })
    }
    if (path === '/api/service') {
      const action = url.searchParams.get('action')
      if (action === 'start') await this.start()
      else if (action === 'stop') await this.stop()
      else if (action === 'restart') await this.restart()
      else return sendJson(res, 400, { error: 'action 必须是 start/stop/restart' })
      return sendJson(res, 200, this.info())
    }

    return sendJson(res, 404, { error: 'not found' })
  }

  // ───────────────────────── 鉴权 ─────────────────────────

  /** Basic 或 URL/Header token，二选一即可。 */
  authorized(req, url) {
    const auth = this.config.auth
    if (!auth.enabled) return true

    const token = url.searchParams.get('token') || req.headers['x-mimo-token']
    if (auth.token && token && safeEqual(String(token), auth.token)) return true

    const header = req.headers.authorization || ''
    if (header.startsWith('Basic ')) {
      const decoded = Buffer.from(header.slice(6), 'base64').toString('utf8')
      const idx = decoded.indexOf(':')
      if (idx >= 0) {
        const user = decoded.slice(0, idx)
        const pass = decoded.slice(idx + 1)
        if (safeEqual(user, auth.user) && safeEqual(pass, auth.pass)) return true
      }
    }
    return false
  }

  // ───────────────────────── /listening ─────────────────────────

  async handleListening(req, res, url) {
    if (!this.authorized(req, url)) return sendJson(res, 401, { error: '需要鉴权' }, { basic: true })
    if (!this.listening) return sendJson(res, 503, { error: '服务未启动' })

    let text = ''
    let bookId = ''
    let speed = 0
    let wantStream = url.searchParams.has('stream')
      ? truthy(url.searchParams.get('stream'))
      : Boolean(this.config.synth.stream)
    speed = Number(url.searchParams.get('speed') || 0) || speed

    if (req.method === 'POST') {
      const body = await readBody(req, 1_000_000)
      const ct = (req.headers['content-type'] || '').toLowerCase()
      if (ct.includes('application/json')) {
        try {
          const json = JSON.parse(body.toString('utf8') || '{}')
          text = String(json.text ?? '')
          bookId = String(json.id ?? json.bookId ?? '')
          speed = Number(json.speed) || speed
        } catch {
          return sendJson(res, 400, { error: 'JSON 解析失败' })
        }
      } else {
        const params = new URLSearchParams(body.toString('utf8'))
        text = params.get('text') || ''
        bookId = params.get('id') || ''
        speed = Number(params.get('speed')) || speed
      }
    } else if (req.method === 'GET') {
      text = url.searchParams.get('text') || ''
      bookId = url.searchParams.get('id') || ''
    } else {
      return sendJson(res, 405, { error: 'method not allowed' })
    }

    text = text.trim()
    if (!text) return sendJson(res, 400, { error: 'text 不能为空' })
    if (text.length > this.config.synth.maxTextChars) {
      return sendJson(res, 413, { error: `文本超过 ${this.config.synth.maxTextChars} 字` })
    }

    const clientKey = clientKeyOf(req)
    const started = Date.now()
    const segments = splitText(text, { maxSegmentChars: this.config.synth.maxSegmentChars })
    if (!segments.length) return sendJson(res, 400, { error: '切分后没有内容' })

    this.metrics.touch(clientKey, { text: text.slice(0, 60), chars: text.length, bookId })

    const requests = toRequests(segments, this.effectiveVoices(speed))
    // 整段是什么角色：全对话 / 全旁白 / 混合（值守页的角色标签用它）
    const role = requests.every((r) => r.role === 'dialogue') ? 'dialogue'
      : requests.every((r) => r.role === 'narrator') ? 'narrator' : 'mixed'

    try {
      if (wantStream && requests.length > 1 && this.provider === 'mimo') {
        return await this.respondStreaming(res, requests, { started, text, bookId, clientKey, role })
      }
      const { wav, durationSec, hits, source } = await this.synthesize(requests, { clientKey, started, speed })
      const latency = Date.now() - started
      this.metrics.record({
        chars: text.length,
        segments: requests.length,
        bytes: wav.length,
        audioSeconds: durationSec,
        latencyMs: latency,
        cacheHit: hits === requests.length,
        client: clientKey,
        bookId,
        role,
        text: text.slice(0, 60),
        format: 'wav',
        source,
      })
      res.writeHead(200, {
        'Content-Type': 'audio/wav',
        'Content-Length': wav.length,
        'Cache-Control': 'no-store',
        'X-Mimo-Segments': String(requests.length),
        'X-Mimo-Latency-Ms': String(latency),
        'X-Mimo-Duration-S': durationSec.toFixed(2),
        'X-Mimo-Source': source,
      })
      res.end(wav)
    } catch (err) {
      const latency = Date.now() - started
      this.metrics.record({
        chars: text.length, segments: requests.length, bytes: 0, latencyMs: latency,
        error: true, client: clientKey, bookId, role, text: text.slice(0, 60),
      })
      this.log(`[error] 合成失败: ${err?.message || err}`)
      const status = err instanceof UpstreamError && err.status >= 400 && err.status < 500 ? 502 : 502
      return sendJson(res, status, { error: String(err?.message || err) })
    }
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

  /**
   * 合成一组请求：命中缓存直接取，其余并发拉取（受 RPM 闸门与并发上限约束）。
   *
   * hybrid 的切换判据不是「本地一热就切」，而是看播放队列还有多少余量：
   *   buffer = 首响时刻 + 已下发音频 - 本次请求开始时刻
   * 只有 buffer 足以覆盖当前段本地生成时间（再留 1–2 s 余量）才切。
   * 长段留在云端攒缓冲，切换到它的下一段——在长段本身上切会把刚攒的缓冲吃掉。
   */
  async synthesize(requests, ctx = {}) {
    const provider = this.provider
    const localCfg = this.config.upstream.local || {}
    const refTag = createHash('sha1').update(JSON.stringify(localCfg.refs || {})).digest('hex').slice(0, 8)
    const hybrid = provider === 'hybrid'
    const cloud = this.cloudAvailable()
    const now = Number(ctx.started) || Date.now()
    const totalChars = requests.reduce((sum, r) => sum + (r.text?.length || 0), 0)
    const fullText = requests.map((r) => r.text || '').join('')
    let session = hybrid && ctx.clientKey ? this.sessionFor(ctx.clientKey, now) : null
    let resetReason = ''
    if (hybrid && session) {
      const title = CHAPTER_TITLE_RE.test(fullText)
      const repeat = Array.isArray(session.recentTexts) && session.recentTexts.includes(fullText)
      const speedChanged = session.speed !== undefined && Number(ctx.speed || 0) !== session.speed
      if (title) resetReason = '章节标题'
      else if (repeat) resetReason = '回退/重读'
      else if (speedChanged) resetReason = '语速变化'
      if (resetReason) {
        this.sessions.delete(ctx.clientKey)
        session = null
      }
    }
    const localWarm = hybrid && this.local.isWarm()
    if (hybrid && localWarm) this.bootstrapCount = 0

    let useLocal = false
    let reason = ''
    if (provider === 'local') {
      useLocal = true
      reason = 'local'
    } else if (provider === 'mimo') {
      reason = 'mimo'
    } else if (!localWarm) {
      useLocal = !cloud
      reason = cloud ? 'cold-cloud' : 'cold-no-cloud'
    } else if (!session) {
      useLocal = true
      reason = 'start-or-resume'
    } else if (session.switchedToLocal) {
      // 已经切到本地就不要再回云；长段也只会在「还没切」时用来攒缓冲
      useLocal = true
      reason = 'already-local'
    } else {
      const bufferSec = Math.max(0, (session.firstAt + session.servedSec * 1000 - now) / 1000)
      const estimate = this.estimateLocalSec(totalChars)
      const isLong = totalChars >= LONG_PARAGRAPH_CHARS
      const afterLong = (session.lastChars || 0) >= LONG_PARAGRAPH_CHARS
      const margin = afterLong ? 3 : 6
      if (isLong && cloud) {
        useLocal = false
        reason = `long-build-buffer ${totalChars}字/${bufferSec.toFixed(1)}s`
      } else if (!cloud) {
        useLocal = true
        reason = 'no-cloud'
      } else if (bufferSec >= estimate + margin) {
        useLocal = true
        reason = `buffer-ok ${bufferSec.toFixed(1)}>=${(estimate + margin).toFixed(1)}`
      } else {
        useLocal = false
        reason = `buffer-wait ${bufferSec.toFixed(1)}<${(estimate + margin).toFixed(1)}`
      }
    }
    this.lastSwitchReason = resetReason ? `${reason} (reset:${resetReason})` : reason
    let source = hybrid ? (useLocal ? 'hybrid-local' : 'hybrid-cloud') : provider
    this.lastSource = source

    if (hybrid && !useLocal && !localWarm) {
      this.bootstrapCount++
      // 先让云端请求发出去，再起本地加载；避免 2.2 GB 模型读盘/编译拖慢首段上传
      const warmReq = requests[0]
      const timer = setTimeout(() => { this.maybeWarm(warmReq) }, 500)
      timer.unref?.()
    }

    const model = hybrid
      ? `hybrid:${localCfg.modelPath}:${refTag}`
      : useLocal ? `local:${localCfg.modelPath}:${refTag}` : this.config.upstream.model
    const keys = requests.map((req) => cacheKey({ ...req, model }))

    if (hybrid && !useLocal) {
      const out = await this.synthesizeHybridCloud(requests, { model, keys, localWarm })
      this.lastSource = out.source
      this.lastSwitchReason = out.reason
      let finalWav = out.wav
      const targetRms = Number(this.config.upstream.hybrid?.targetRms) || 0
      if (targetRms > 0) {
        try {
          finalWav = normalizeWav(out.wav, { targetRms })
        } catch (err) {
          this.log(`[warn] 响度归一失败，保留原音量：${err?.message || err}`)
        }
      }
      if (ctx.clientKey) {
        this.updateSession(ctx.clientKey, {
          durationSec: out.durationSec, source: out.source, chars: totalChars, text: fullText, speed: ctx.speed,
        })
      }
      return { wav: finalWav, durationSec: out.durationSec, hits: out.hits, source: out.source }
    }

    const results = new Array(requests.length)
    let hits = 0
    const tasks = requests.map((req, i) => async () => {
      const key = keys[i]
      const cached = this.cache.get(key)
      if (cached) {
        if (useLocal) this.local.touch()
        hits++
        results[i] = cached
        return
      }
      await this.gate.acquire()
      let wav
      if (useLocal) {
        wav = await this.local.synthesize({ text: req.text, role: req.role })
      } else {
        try {
          wav = await this.mimo.synthesize({ ...req, model })
        } catch (err) {
          this.log(`[warn] 段 ${i + 1} 失败，插入静音: ${err?.message || err}`)
          wav = silentWav(0.4)
        }
      }
      this.cache.set(key, wav)
      results[i] = wav
    })
    const limit = useLocal ? 1 : Math.max(1, Math.min(8, this.config.synth.concurrency || 4))
    await runLimited(tasks, limit)
    const { wav, durationSec } = concatWavs(results)
    let finalWav = wav
    const targetRms = Number(this.config.upstream.hybrid?.targetRms) || 0
    if (hybrid && targetRms > 0) {
      try {
        finalWav = normalizeWav(wav, { targetRms })
      } catch (err) {
        this.log(`[warn] 响度归一失败，保留原音量：${err?.message || err}`)
      }
    }
    if (hybrid && ctx.clientKey) {
      this.updateSession(ctx.clientKey, {
        durationSec, source, chars: totalChars, text: fullText, speed: ctx.speed,
      })
    }
    return { wav: finalWav, durationSec, hits, source }
  }

  /**
   * 混合启动的云端阶段：
   * - 本地已经热：云/本地同时整段跑，谁先完成用谁（不混段内音色）
   * - 本地还在预热：云先跑；超过 4s 预算就等预热结束切本地，warmup 失败才回云
   * 整段胜出者才写缓存，失败的那一方不会留下半段音频。
   */
  async synthesizeHybridCloud(requests, { model, keys, localWarm }) {
    const cloudResults = new Array(requests.length)
    const localResults = new Array(requests.length)
    let hits = 0
    const buildTasks = (kind, results) => requests.map((req, i) => async () => {
      const key = keys[i]
      const cached = this.cache.get(key)
      if (cached) {
        hits++
        results[i] = cached
        return
      }
      await this.gate.acquire()
      results[i] = kind === 'cloud'
        ? await this.cloudClone(req)
        : await this.local.synthesize({ text: req.text, role: req.role })
    })
    const cloudTasks = buildTasks('cloud', cloudResults)
    const cloudLimit = Math.max(1, Math.min(2, Number(this.config.upstream.hybrid?.cloudConcurrency) || 2))
    let source = 'hybrid-cloud'
    let results = cloudResults
    let reason = 'cold-cloud'

    if (localWarm) {
      const localTasks = buildTasks('local', localResults)
      const winner = await Promise.any([
        runLimited(cloudTasks, cloudLimit).then(() => 'cloud'),
        runLimited(localTasks, 1).then(() => 'local'),
      ])
      if (winner === 'local') {
        source = 'hybrid-local'
        results = localResults
        reason = 'race-local'
      } else {
        reason = 'race-cloud'
      }
    } else {
      let timer
      const deadline = new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error('cloud-budget')), HYBRID_CLOUD_BUDGET_MS)
        timer.unref?.()
      })
      try {
        await Promise.race([runLimited(cloudTasks, cloudLimit), deadline])
        reason = 'cold-cloud'
      } catch (err) {
        if (err?.message !== 'cloud-budget') {
          reason = `cloud-failed-local: ${err?.message || err}`
        } else {
          const ok = await this.local.warmup('预热一下。', 'narrator').catch(() => false)
          if (ok) {
            reason = 'budget-local'
          } else {
            await runLimited(cloudTasks, cloudLimit)
            reason = 'budget-warmup-failed-cloud'
          }
        }
        if (reason !== 'budget-warmup-failed-cloud') {
          const localTasks = buildTasks('local', localResults)
          await runLimited(localTasks, 1)
          source = 'hybrid-local'
          results = localResults
        }
      } finally {
        clearTimeout(timer)
      }
    }

    for (let i = 0; i < results.length; i++) {
      if (results[i]) this.cache.set(keys[i], results[i])
    }
    const { wav, durationSec } = concatWavs(results)
    this.lastSwitchReason = reason
    return { wav, durationSec, hits, source, reason }
  }

  /** 本地生成耗时粗估：实测 0.10–0.12 s/字 + 固定开销，取保守值。 */
  estimateLocalSec(chars) {
    return Math.max(2, LOCAL_GEN_BASE_SEC + chars * LOCAL_GEN_PER_CHAR)
  }

  /** 60 s 内有后续请求才算同一次连续播放；人暂停/换章后重新起算。 */
  sessionFor(clientKey, now) {
    const s = this.sessions.get(clientKey)
    if (!s) return null
    if (now - s.lastAt > PAUSE_GAP_MS) {
      this.sessions.delete(clientKey)
      return null
    }
    return s
  }

  updateSession(clientKey, { durationSec, source, chars, text, speed }) {
    let s = this.sessions.get(clientKey)
    const at = Date.now()
    if (!s) {
      s = {
        firstAt: at, servedSec: 0, lastAt: at, lastChars: 0, lastSource: '',
        switchedToLocal: false, recentTexts: [], speed: undefined,
      }
      this.sessions.set(clientKey, s)
    }
    s.servedSec += Number(durationSec) || 0
    s.lastAt = at
    s.lastChars = chars
    s.lastSource = source
    if (source === 'hybrid-local') s.switchedToLocal = true
    s.speed = Number(speed) || 0
    s.recentTexts = [...(s.recentTexts || []), String(text || '')].slice(-RECENT_TEXTS)
    if (this.sessions.size > 64) {
      for (const [key, v] of this.sessions) {
        if (at - v.lastAt > 10 * 60_000) this.sessions.delete(key)
      }
    }
  }

  /** 混合启动：用当前段把本地模型焐热（不阻塞本次云响应）。 */
  maybeWarm(req) {
    if (!req || !this.config.upstream.hybrid?.warmup) return
    if (this.local.isWarm() || this.local.warming || this.local.isCoolingDown()) return
    const max = Number(this.config.upstream.hybrid?.maxCloudBootstrap) || 0
    if (max > 0 && this.bootstrapCount > max) {
      if (!this.bootstrapWarned) {
        this.bootstrapWarned = true
        this.log(`[hybrid] 已顶 ${this.bootstrapCount - 1} 段云，本地仍未热；继续云兜底`)
      }
      return
    }
    // 预热不需要整段原文；短句更快完成编译，首段真本地时不用再等一遍
    this.local.warmup('预热一下。', 'narrator').catch((err) => {
      this.log(`[warn] 本地预热异常：${err?.message || err}`)
    })
  }

  cloudClone(req) {
    const local = this.config.upstream.local || {}
    const ref = local.refs?.[req.role] || local.refs?.narrator
    if (!ref?.wav) throw new UpstreamError('混合启动缺少旁白参考音')
    const voice = this.mimo.sampleDataUrl(ref.wav)
    return this.mimo.synthesize({ text: req.text, voice, style: '', mode: 'clone' })
  }

  /** 流式：先发长度未知的头，再按顺序把已完成的段拼上去。 */
  async respondStreaming(res, requests, meta) {
    const model = this.config.upstream.model
    const pending = requests.map(async (req) => {
      const key = cacheKey({ ...req, model })
      const cached = this.cache.get(key)
      if (cached) return cached
      await this.gate.acquire()
      try {
        const wav = await this.mimo.synthesize({ ...req, model })
        this.cache.set(key, wav)
        return wav
      } catch {
        return silentWav(0.4)
      }
    })

    res.writeHead(200, {
      'Content-Type': 'audio/wav',
      'Cache-Control': 'no-store',
      'X-Mimo-Segments': String(requests.length),
    })
    let sampleRate = 24000
    let wroteHeader = false
    let totalBytes = 0
    let seconds = 0
    for (const p of pending) {
      const wav = await p
      let parsed
      try { parsed = parseWav(wav) } catch { parsed = null }
      if (!wroteHeader) {
        sampleRate = parsed?.sampleRate || 24000
        res.write(streamingWavHeader(sampleRate, 1, 16))
        wroteHeader = true
      }
      if (!parsed) continue
      res.write(parsed.pcm)
      totalBytes += parsed.pcm.length
      seconds += parsed.durationSec
    }
    if (!wroteHeader) res.write(streamingWavHeader(sampleRate, 1, 16))
    res.end()

    this.metrics.record({
      chars: meta.text.length,
      segments: requests.length,
      bytes: totalBytes,
      audioSeconds: seconds,
      latencyMs: Date.now() - meta.started,
      client: meta.clientKey,
      bookId: meta.bookId,
      role: meta.role,
      text: meta.text.slice(0, 60),
      format: 'wav-stream',
      source: 'mimo',
    })
  }

  // ───────────────────────── 其余路由 ─────────────────────────

  /** Legado 的「导入在线朗读」直接吃这份 JSON。 */
  async handleLegadoJson(req, res, url) {
    const auth = this.config.auth
    if (auth.enabled && auth.token) {
      const provided = url.searchParams.get('token')
      const ok = safeEqual(String(provided || ''), auth.token)
      // 手机上最容易的做法是把主机地址直接贴进来（不带令牌）。局域网内网来源允许
      // 这种「引导式」访问：服务本来就只在内网开，令牌在返回的 URL 里照旧带着。
      //
      // ⚠️ 但走 Cloudflare Tunnel 时，TCP 对端永远是隧道宿主（192.168.31.15，内网地址），
      // 只看对端会把公网请求也放进来。所以带了转发头（CF-Connecting-IP / X-Forwarded-For）
      // 就一律按公网处理，必须带令牌。
      if (!ok && (hasProxyHeaders(req) || !isPrivateAddress(req.socket?.remoteAddress))) {
        // 关键：这里绝不能回 JSON。Legado 会把任意 JSON 对象当成一个朗读引擎去读
        // `$.name`（!! 强解），于是抛出 message 为 null 的 NPE，界面只显示
        // 「ImportError:null」。回纯文本才会落到「格式不正确」这条可读分支。
        res.writeHead(401, { 'Content-Type': 'text/plain; charset=utf-8' })
        return res.end('需要令牌：请在地址末尾加上 ?token=…（完整地址见控制台「接入」页）')
      }
    }
    const base = publicBase(req, this.config.server)
    const tokenQuery = auth.enabled && auth.token ? `?token=${encodeURIComponent(auth.token)}` : ''
    // 用 form-urlencoded 而不是 JSON：`{{java.encodeURI(speakText)}}` 是 Legado 自带的
    // URLEncoder，中文和引号都能安全过；JSON body 则要处理 `"` 转义，书里一出现引号就炸。
    const option = {
      method: 'POST',
      body: 'text={{java.encodeURI(speakText)}}&speed={{speakSpeed}}',
      header: {
        'Content-Type': 'application/x-www-form-urlencoded',
        // 走 Cloudflare Access 时，Legado 需要带上服务令牌，否则会拿到登录页
        ...(this.config.legado?.extraHeaders || {}),
      },
    }
    const entry = {
      name: 'MiMo TTS 听书',
      url: `${base}/listening${tokenQuery},${JSON.stringify(option)}`,
      contentType: 'audio/wav',
      concurrentRate: '4',
    }
    return sendJson(res, 200, [entry])
  }

  /** 试听：不走缓存，只合成一段。 */
  async preview({ text, role = 'narrator' }) {
    const voice = this.config.voices[role] || this.config.voices.narrator
    if (this.provider === 'local') return this.local.synthesize({ text, role })
    if (this.provider === 'hybrid') {
      if (this.local.isWarm() || !this.cloudAvailable()) return this.local.synthesize({ text, role })
      return this.cloudClone({ text, role })
    }
    return this.mimo.synthesize({ text, voice: voice.voice, style: voice.style, mode: voice.mode })
  }

  async handlePreview(req, res, url) {
    if (!this.authorized(req, url)) return sendJson(res, 401, { error: '需要鉴权' }, { basic: true })
    let text = url.searchParams.get('text') || ''
    let role = url.searchParams.get('role') === 'dialogue' ? 'dialogue' : 'narrator'
    if (req.method === 'POST') {
      const body = await readBody(req, 200_000)
      try {
        const json = JSON.parse(body.toString('utf8') || '{}')
        if (json.text) text = String(json.text)
        if (json.role === 'dialogue') role = 'dialogue'
      } catch { /* 用 query 的值 */ }
    }
    if (!text.trim()) return sendJson(res, 400, { error: 'text 不能为空' })
    const started = Date.now()
    try {
      const wav = await this.preview({ text: text.slice(0, 300), role })
      const { durationSec } = parseWav(wav)
      res.writeHead(200, {
        'Content-Type': 'audio/wav',
        'Content-Length': wav.length,
        'X-Mimo-Latency-Ms': String(Date.now() - started),
        'X-Mimo-Duration-S': durationSec.toFixed(2),
        'X-Mimo-Source': source,
      })
      res.end(wav)
    } catch (err) {
      sendJson(res, 502, { error: String(err?.message || err) })
    }
  }

  async handleConfigPut(req, res) {
    const body = await readBody(req, 1_000_000)
    let patch
    try { patch = JSON.parse(body.toString('utf8') || '{}') } catch {
      return sendJson(res, 400, { error: 'JSON 解析失败' })
    }
    // 前端回传的掩码值不能覆盖真值
    if (patch.upstream?.keys && patch.upstream.keys.every((k) => String(k).includes('…'))) {
      delete patch.upstream.keys
    }
    if (patch.auth && typeof patch.auth.pass === 'string' && patch.auth.pass.includes('••')) {
      delete patch.auth.pass
    }
    const result = await this.applyPatch(patch)
    if (result.problems?.length) {
      return sendJson(res, 422, { error: result.problems.join('；'), problems: result.problems })
    }
    return sendJson(res, 200, { config: redact(this.config), service: this.info() })
  }

  /**
   * 统一写配置：校验 → 落盘 → 本地引擎/端口需要时重启。
   * 控制台（宿主路由）和独立服务共用这一条，避免两边行为漂移。
   */
  async applyPatch(patch) {
    const before = {
      provider: this.config.upstream.provider,
      local: JSON.stringify(this.config.upstream.local),
      host: this.config.server.host,
      port: this.config.server.port,
    }
    const result = this.store.update(patch)
    if (result.problems?.length) return result

    const localChanged = before.provider !== this.config.upstream.provider
      || before.local !== JSON.stringify(this.config.upstream.local)
    if (localChanged) {
      this.mimo.clearSamples()
      this.bootstrapCount = 0
      this.bootstrapWarned = false
      this.lastSource = ''
      this.lastSwitchReason = ''
      this.sessions.clear()
      await this.local.invalidate().catch((err) => this.log(`[warn] 本地引擎重启失败：${err?.message || err}`))
    }
    const { host, port } = this.config.server
    if (before.host !== host || before.port !== port) {
      const running = Boolean(this.server)
      if (running) await this.restart()
    }
    return { problems: [], config: this.config, service: this.info() }
  }
}

// ───────────────────────── 工具 ─────────────────────────

function sendJson(res, status, payload, opts = {}) {
  const body = Buffer.from(JSON.stringify(payload, null, 2))
  const headers = {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': body.length,
    'Cache-Control': 'no-store',
  }
  if (opts.basic) headers['WWW-Authenticate'] = 'Basic realm="mimo-tts"'
  res.writeHead(status, headers)
  res.end(body)
}

function readBody(req, limit) {
  return new Promise((resolve, reject) => {
    const chunks = []
    let size = 0
    req.on('data', (c) => {
      size += c.length
      if (size > limit) { reject(new Error('请求体过大')); req.destroy() }
      else chunks.push(c)
    })
    req.on('end', () => resolve(Buffer.concat(chunks)))
    req.on('error', reject)
  })
}

/** 请求是否经过隧道/反代（有转发头就说明不是直连）。 */
function hasProxyHeaders(req) {
  const h = req.headers || {}
  return Boolean(h['cf-connecting-ip'] || h['x-forwarded-for'] || h['x-forwarded-host'] || h['x-real-ip'])
}

/**
 * 真实来源地址：反代/隧道下取 CF-Connecting-IP（或 X-Forwarded-For 第一跳），
 * 直连时取 socket 对端。值守页的「谁在读」靠它区分设备。
 */
function clientAddress(req) {
  const h = req.headers || {}
  const first = (v) => String(v || '').split(',')[0].trim()
  const ip = first(h['cf-connecting-ip']) || first(h['x-forwarded-for']) || first(h['x-real-ip']) || req.socket?.remoteAddress || ''
  return ip.replace(/^::ffff:/i, '')
}

/** 内网来源判定：回环 + 10/8 + 172.16/12 + 192.168/16（含 IPv6 映射写法）。 */
function isPrivateAddress(ip) {
  const addr = String(ip || '').replace(/^::ffff:/i, '')
  if (addr === '::1' || addr.startsWith('127.')) return true
  const m = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(addr)
  if (!m) return false
  const a = Number(m[1])
  const b = Number(m[2])
  return a === 10 || (a === 192 && b === 168) || (a === 172 && b >= 16 && b <= 31)
}

function safeEqual(a, b) {
  const ba = Buffer.from(String(a))
  const bb = Buffer.from(String(b))
  if (ba.length !== bb.length) return false
  return timingSafeEqual(ba, bb)
}

function truthy(v) {
  return v === '' || v === '1' || v === 'true' || v === 'yes'
}

function clientKeyOf(req) {
  const ip = clientAddress(req)
  const ua = String(req.headers['user-agent'] || '')
  return createHash('sha1').update(`${ip}|${ua}`).digest('hex').slice(0, 8) + `@${ip}`
}

/** 尽量给出「手机能访问到」的地址：优先用请求的 Host，其次本机非回环 IPv4。 */
/**
 * 对外基地址（不含尾斜杠）。优先级：
 *   1. server.publicUrl —— 明确配置的对外域名，反代/隧道下最可靠
 *   2. X-Forwarded-Proto / X-Forwarded-Host（Cloudflare Tunnel 会带）
 *   3. 请求的 Host 头
 * 内网直接用 IP 访问时，Host 就是那个 IP，第 3 条即可。
 */
function publicBase(req, server) {
  const configured = String(server?.publicUrl || '').trim().replace(/\/+$/, '')
  if (configured) return configured

  const headers = req.headers || {}
  const host = String(headers['x-forwarded-host'] || headers.host || '').split(',')[0].trim()
  if (!host) return `http://127.0.0.1:${server?.port || 8291}`
  // 直连时没有这个头（我们只监听明文 http）；隧道/反代会带上
  const proto = String(headers['x-forwarded-proto'] || '').split(',')[0].trim() || 'http'
  return `${proto}://${host}`
}

async function runLimited(tasks, limit) {
  const queue = tasks.slice()
  const workers = Array.from({ length: Math.min(limit, queue.length) }, async () => {
    while (queue.length) {
      const task = queue.shift()
      await task()
    }
  })
  await Promise.all(workers)
}
