/**
 * 混合启动 Provider（Hybrid）：
 * 冷启动前几段由 MiMo 克隆顶住，同时后台把本地模型焐热；
 * 只有当播放队列剩余缓冲足以覆盖下一段本地推理耗时，才切到本地且不回退云端。
 */
import { TTSProvider, runLimited } from './base.mjs'
import { cacheKey } from '../cache.mjs'
import { humanizeSwitchReason } from '../hints.mjs'
import { computeRefsDigest } from '../refs-store.mjs'
import { concatWavs, normalizeWav } from '../wav.mjs'

const PAUSE_GAP_MS = 20_000
const LONG_PARAGRAPH_CHARS = 60
const CHAPTER_TITLE_RE = /^\s*第[0-9零一二三四五六七八九十百千万两]+[章节回卷]/
const RECENT_TEXTS = 5
const LOCAL_GEN_BASE_SEC = 1.8
const LOCAL_GEN_PER_CHAR = 0.11
const HYBRID_CLOUD_BUDGET_MS = 4000

export class SessionTracker {
  constructor() {
    this.sessions = new Map()
  }

  clear() {
    this.sessions.clear()
  }

  delete(clientKey) {
    this.sessions.delete(clientKey)
  }

  /** 20 s 内有后续请求才算同一次连续播放；暂停/换章后重新起算。 */
  forClient(clientKey, now = Date.now()) {
    const s = this.sessions.get(clientKey)
    if (!s) return null
    if (now - s.lastAt > PAUSE_GAP_MS) {
      this.sessions.delete(clientKey)
      return null
    }
    return s
  }

  update(clientKey, { durationSec, source, chars, text, speed }) {
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
}

export class HybridProvider extends TTSProvider {
  constructor(deps) {
    super({ ...deps, id: 'hybrid', label: '混合启动 (云 + 本地)' })
    this.mimo = deps.mimoProvider
    this.local = deps.localProvider
    this.refsStore = deps.refsStore || null
    this.sessions = new SessionTracker()
    this.bootstrapCount = 0
    this.lastSource = ''
    this.lastSwitchReason = ''
    this.bootstrapWarned = false
  }

  cloudAvailable(cfgOverride = null) {
    const up = cfgOverride?.upstream || this.getConfig().upstream || {}
    return Boolean(up.keys?.length && up.baseUrl)
  }

  modelKey() {
    const localCfg = this.getConfig().upstream?.local || {}
    return `hybrid:${localCfg.modelPath || ''}:${computeRefsDigest(localCfg.refs, this.refsStore)}`
  }

  estimateLocalSec(chars) {
    return Math.max(2, LOCAL_GEN_BASE_SEC + chars * LOCAL_GEN_PER_CHAR)
  }

  status() {
    const h = this.getConfig().upstream?.hybrid || {}
    return {
      enabled: this.getConfig().upstream?.provider === 'hybrid',
      cloudReady: this.cloudAvailable(),
      bootstrapCount: this.bootstrapCount,
      maxCloudBootstrap: Number(h.maxCloudBootstrap) || 0,
      localWarm: this.local.engine.isWarm(),
      lastSource: this.lastSource,
      lastSwitchReason: this.lastSwitchReason,
      lastSwitchReasonText: humanizeSwitchReason(this.lastSwitchReason),
    }
  }

  maybeWarm(req) {
    const cfg = this.getConfig()
    if (!req || !cfg.upstream?.hybrid?.warmup) return
    const engine = this.local.engine
    if (engine.isWarm() || engine.warming || engine.isCoolingDown()) return
    const max = Number(cfg.upstream.hybrid?.maxCloudBootstrap) || 0
    if (max > 0 && this.bootstrapCount > max) {
      if (!this.bootstrapWarned) {
        this.bootstrapWarned = true
        this.log(`[hybrid] 已顶 ${this.bootstrapCount - 1} 段云，本地仍未热；继续云兜底`)
      }
      return
    }
    engine.warmup('预热一下。', 'narrator').catch((err) => {
      this.log(`[warn] 本地预热异常：${err?.message || err}`)
    })
  }

  async preview({ text, role = 'narrator' }, ctx = {}) {
    if (this.local.engine.isWarm() || !this.cloudAvailable(ctx?.config)) {
      const wav = await this.local.engine.synthesize({ text, role })
      return { wav, source: 'hybrid-local' }
    }
    const wav = await this.mimo.cloudClone({ text, role }, ctx)
    return { wav, source: 'hybrid-cloud' }
  }

  /** 纯决策逻辑（commit=false 时无副作用，可供 supportsStreaming 预判）。 */
  decideBatch(requests, ctx = {}, { commit = false } = {}) {
    const engine = this.local.engine
    const cloud = this.cloudAvailable()
    const now = Number(ctx.started) || Date.now()
    const totalChars = requests.reduce((sum, r) => sum + (r.text?.length || 0), 0)
    const fullText = requests.map((r) => r.text || '').join('')

    let session = ctx.clientKey ? this.sessions.forClient(ctx.clientKey, now) : null
    let resetReason = ''
    if (session) {
      const title = CHAPTER_TITLE_RE.test(fullText)
      const repeat = Array.isArray(session.recentTexts) && session.recentTexts.includes(fullText)
      const speedChanged = session.speed !== undefined && Number(ctx.speed || 0) !== session.speed
      if (title) resetReason = '章节标题'
      else if (repeat) resetReason = '回退/重读'
      else if (speedChanged) resetReason = '语速变化'
      if (resetReason) {
        if (commit && ctx.clientKey) this.sessions.delete(ctx.clientKey)
        session = null
      }
    }

    const localWarm = engine.isWarm()
    if (commit && localWarm) this.bootstrapCount = 0

    let useLocal = false
    let reason = ''
    if (!localWarm) {
      useLocal = !cloud
      reason = cloud ? 'cold-cloud' : 'cold-no-cloud'
    } else if (!session) {
      useLocal = true
      reason = 'start-or-resume'
    } else if (session.switchedToLocal) {
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

    const switchReason = resetReason ? `${reason} (reset:${resetReason})` : reason
    const source = useLocal ? 'hybrid-local' : 'hybrid-cloud'
    if (commit) {
      this.lastSwitchReason = switchReason
      this.lastSource = source
    }
    return { useLocal, reason, switchReason, resetReason, localWarm, totalChars, fullText, source }
  }

  supportsStreaming(requests, ctx = {}) {
    if (!Array.isArray(requests) || !requests.length || !this.cloudAvailable()) return false
    const d = this.decideBatch(requests, ctx, { commit: false })
    return !d.useLocal
  }

  async respondStreaming(res, requests, meta, metrics) {
    const d = this.decideBatch(requests, meta, { commit: true })
    if (!d.localWarm) {
      this.bootstrapCount++
      const warmReq = requests[0]
      const timer = setTimeout(() => { this.maybeWarm(warmReq) }, 500)
      timer.unref?.()
    }
    // 方案 A：混合冷启动走流式时优先使用预置音色真 SSE 抢 <1s 首包，待本地热后自动切回本地克隆音色
    const streamReqs = requests.map((r) => (
      (r.mode || 'preset') === 'preset'
        ? r
        : { ...r, mode: 'preset', voice: r.voice || (r.role === 'dialogue' ? '苏打' : '冰糖') }
    ))
    const out = await this.mimo.respondStreaming(res, streamReqs, { ...meta, source: 'hybrid-cloud' }, metrics)
    this.lastSource = 'hybrid-cloud'
    if (meta?.clientKey) {
      this.sessions.update(meta.clientKey, {
        durationSec: out?.durationSec || 0,
        source: 'hybrid-cloud',
        chars: d.totalChars,
        text: d.fullText,
        speed: meta.speed,
      })
    }
    return out
  }

  async synthesizeBatch(requests, ctx = {}) {
    const cfg = this.getConfig()
    const engine = this.local.engine
    const { useLocal, localWarm, totalChars, fullText, source } = this.decideBatch(requests, ctx, { commit: true })

    if (!useLocal && !localWarm) {
      this.bootstrapCount++
      const warmReq = requests[0]
      const timer = setTimeout(() => { this.maybeWarm(warmReq) }, 500)
      timer.unref?.()
    }

    const model = this.modelKey()
    // 云端克隆（MiMo）与本地（Qwen3-TTS + 参考音）是两套引擎，同一句产出的音频不同。
    // 两者共用一份键时，先写入的一方会替另一方作答，表现为「同一句突然换嗓子」且无从归因。
    const cloudKeys = requests.map((req) => cacheKey({ ...req, model: `${model}|cloud` }))
    const localKeys = requests.map((req) => cacheKey({ ...req, model: `${model}|local` }))

    if (!useLocal) {
      const out = await this.#synthesizeHybridCloud(requests, { cloudKeys, localKeys, localWarm })
      this.lastSource = out.source
      this.lastSwitchReason = out.reason
      const finalWav = this.#applyRms(out.wav, cfg)
      if (ctx.clientKey) {
        this.sessions.update(ctx.clientKey, {
          durationSec: out.durationSec, source: out.source, chars: totalChars, text: fullText, speed: ctx.speed,
        })
      }
      return { wav: finalWav, durationSec: out.durationSec, hits: out.hits, source: out.source }
    }

    const results = new Array(requests.length)
    let hits = 0
    const tasks = requests.map((req, i) => async () => {
      const key = localKeys[i]
      const cached = this.cache.get(key)
      if (cached) {
        engine.touch()
        hits++
        results[i] = cached
        return
      }
      if (this.local?.gate) await this.local.gate.acquire()
      const wav = await engine.synthesize({ text: req.text, role: req.role })
      this.cache.set(key, wav)
      results[i] = wav
    })
    await runLimited(tasks, 1)
    const { wav, durationSec } = concatWavs(results)
    const finalWav = this.#applyRms(wav, cfg)
    if (ctx.clientKey) {
      this.sessions.update(ctx.clientKey, {
        durationSec, source, chars: totalChars, text: fullText, speed: ctx.speed,
      })
    }
    return { wav: finalWav, durationSec, hits, source }
  }

  #applyRms(wav, cfg) {
    const targetRms = Number(cfg.upstream?.hybrid?.targetRms) || 0
    if (targetRms <= 0) return wav
    try {
      return normalizeWav(wav, { targetRms })
    } catch (err) {
      this.log(`[warn] 响度归一失败，保留原音量：${err?.message || err}`)
      return wav
    }
  }

  async #synthesizeHybridCloud(requests, { cloudKeys, localKeys, localWarm }) {
    const cfg = this.getConfig()
    const engine = this.local.engine
    const cloudResults = new Array(requests.length)
    const localResults = new Array(requests.length)
    const hits = { cloud: 0, local: 0 }
    const buildTasks = (kind, keys, results) => requests.map((req, i) => async () => {
      const key = keys[i]
      const cached = this.cache.get(key)
      if (cached) {
        hits[kind]++
        results[i] = cached
        return
      }
      const segGate = kind === 'cloud' ? this.mimo?.gate : this.local?.gate
      if (segGate) await segGate.acquire()
      results[i] = kind === 'cloud'
        ? await this.mimo.cloudClone(req)
        : await engine.synthesize({ text: req.text, role: req.role })
    })
    const cloudTasks = buildTasks('cloud', cloudKeys, cloudResults)
    const cloudLimit = Math.max(1, Math.min(2, Number(cfg.upstream.hybrid?.cloudConcurrency) || 2))
    let source = 'hybrid-cloud'
    let results = cloudResults
    let reason = 'cold-cloud'

    if (localWarm) {
      const localTasks = buildTasks('local', localKeys, localResults)
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
          const ok = await engine.warmup('预热一下。', 'narrator').catch(() => false)
          if (ok) {
            reason = 'budget-local'
          } else {
            await runLimited(cloudTasks, cloudLimit)
            reason = 'budget-warmup-failed-cloud'
          }
        }
        if (reason !== 'budget-warmup-failed-cloud') {
          const localTasks = buildTasks('local', localKeys, localResults)
          await runLimited(localTasks, 1)
          source = 'hybrid-local'
          results = localResults
        }
      } finally {
        clearTimeout(timer)
      }
    }

    // 写回按实际来源记账：竞速/兜底可能最终采用本地那组，不能一律写到云端键上。
    const usedKeys = results === cloudResults ? cloudKeys : localKeys
    for (let i = 0; i < results.length; i++) {
      if (results[i]) this.cache.set(usedKeys[i], results[i])
    }
    const { wav, durationSec } = concatWavs(results)
    this.lastSwitchReason = reason
    return {
      wav,
      durationSec,
      hits: results === cloudResults ? hits.cloud : hits.local,
      source,
      reason,
    }
  }

  async onConfigChange(before, after) {
    const changed = before?.upstream?.provider !== after?.upstream?.provider
      || JSON.stringify(before?.upstream?.local) !== JSON.stringify(after?.upstream?.local)
    if (changed) {
      this.bootstrapCount = 0
      this.bootstrapWarned = false
      this.lastSource = ''
      this.lastSwitchReason = ''
      this.sessions.clear()
    }
  }

  async shutdown() {
    this.sessions.clear()
  }
}
