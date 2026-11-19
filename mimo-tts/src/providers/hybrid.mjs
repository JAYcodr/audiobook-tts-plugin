/**
 * 混合启动 Provider（Hybrid）：
 * 冷启动前几段由 MiMo 克隆顶住，同时后台把本地模型焐热；
 * 只有当播放队列剩余缓冲足以覆盖下一段本地推理耗时，才切到本地且不回退云端。
 */
import { createHash } from 'node:crypto'
import { TTSProvider, runLimited } from './base.mjs'
import { cacheKey } from '../cache.mjs'
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
    this.sessions = new SessionTracker()
    this.bootstrapCount = 0
    this.lastSource = ''
    this.lastSwitchReason = ''
    this.bootstrapWarned = false
  }

  cloudAvailable() {
    return this.mimo.isAvailable()
  }

  modelKey() {
    const localCfg = this.getConfig().upstream?.local || {}
    const refTag = createHash('sha1').update(JSON.stringify(localCfg.refs || {})).digest('hex').slice(0, 8)
    return `hybrid:${localCfg.modelPath || ''}:${refTag}`
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

  async preview({ text, role = 'narrator' }) {
    if (this.local.engine.isWarm() || !this.cloudAvailable()) {
      const wav = await this.local.engine.synthesize({ text, role })
      return { wav, source: 'hybrid-local' }
    }
    const wav = await this.mimo.cloudClone({ text, role })
    return { wav, source: 'hybrid-cloud' }
  }

  async synthesizeBatch(requests, ctx = {}) {
    const cfg = this.getConfig()
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
        this.sessions.delete(ctx.clientKey)
        session = null
      }
    }

    const localWarm = engine.isWarm()
    if (localWarm) this.bootstrapCount = 0

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

    this.lastSwitchReason = resetReason ? `${reason} (reset:${resetReason})` : reason
    const source = useLocal ? 'hybrid-local' : 'hybrid-cloud'
    this.lastSource = source

    if (!useLocal && !localWarm) {
      this.bootstrapCount++
      const warmReq = requests[0]
      const timer = setTimeout(() => { this.maybeWarm(warmReq) }, 500)
      timer.unref?.()
    }

    const model = this.modelKey()
    const keys = requests.map((req) => cacheKey({ ...req, model }))

    if (!useLocal) {
      const out = await this.#synthesizeHybridCloud(requests, { keys, localWarm })
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
      const key = keys[i]
      const cached = this.cache.get(key)
      if (cached) {
        engine.touch()
        hits++
        results[i] = cached
        return
      }
      await this.gate.acquire()
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

  async #synthesizeHybridCloud(requests, { keys, localWarm }) {
    const cfg = this.getConfig()
    const engine = this.local.engine
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
        ? await this.mimo.cloudClone(req)
        : await engine.synthesize({ text: req.text, role: req.role })
    })
    const cloudTasks = buildTasks('cloud', cloudResults)
    const cloudLimit = Math.max(1, Math.min(2, Number(cfg.upstream.hybrid?.cloudConcurrency) || 2))
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
          const ok = await engine.warmup('预热一下。', 'narrator').catch(() => false)
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
