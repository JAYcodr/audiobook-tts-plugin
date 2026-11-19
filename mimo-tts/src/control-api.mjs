/**
 * 共享控制台 HTTP API 路由处理器（/api/*）：
 * 由独立 HTTP 服务（service.mjs）和 DSH 插件宿主（index.js）共同挂载，保证行为完全一致。
 */
import { authorized } from './auth.mjs'
import { BUILTIN_VOICE_PROFILES, PRESET_VOICES, redact, validatePatch } from './config.mjs'
import { HttpInputError, readJson, sendJson } from './http.mjs'
import { buildImportInfo } from './legado.mjs'
import { BUILTIN_RULE_PRESETS, previewTextPipeline, validateTextRules } from './lexicon.mjs'
import { RefError } from './refs-store.mjs'
import { parseWav } from './wav.mjs'

export function buildStatePayload(service, req) {
  const cfg = service.config
  return {
    service: service.info(),
    config: redact(cfg),
    local: service.local.status(),
    live: {
      rpm: service.gate.usage(),
      cache: service.cache.stats(),
      local: service.local.status(),
      ...service.metrics.snapshot(),
    },
    import: buildImportInfo(req, cfg),
    presetVoices: PRESET_VOICES,
    builtinVoiceProfiles: BUILTIN_VOICE_PROFILES,
    builtinRulePresets: BUILTIN_RULE_PRESETS,
    refs: service.refs.list(),
    providers: service.registry.list().map((p) => p.status()),
    dataDir: service.store.dataDir,
  }
}

/**
 * 创建 /api/* 处理器。
 * @param {object} opts
 * @param {import('./service.mjs').TtsService} opts.service
 * @param {boolean} [opts.requireAuth] 独立服务端口暴露到局域网/公网需鉴权；DSH 同源宿主管线免鉴权
 */
export function createControlHandler({ service, requireAuth = false }) {
  return async function handleControlApi(req, res, path, url) {
    if (requireAuth && !authorized(req, url, service.config.auth)) {
      sendJson(res, 401, { error: '需要鉴权' }, { basic: true })
      return true
    }

    if (path === '/api/state' && req.method === 'GET') {
      sendJson(res, 200, buildStatePayload(service, req))
      return true
    }

    if (path === '/api/live' && req.method === 'GET') {
      sendJson(res, 200, {
        service: service.info(),
        rpm: service.gate.usage(),
        cache: service.cache.stats(),
        local: service.local.status(),
        ...service.metrics.snapshot(),
      })
      return true
    }

    if (path === '/api/stats' && req.method === 'GET') {
      sendJson(res, 200, {
        cache: service.cache.stats(),
        rpm: service.gate.usage(),
        local: service.local.status(),
        ...service.metrics.snapshot(),
      })
      return true
    }

    if (path === '/api/service') {
      if (req.method !== 'POST' && req.method !== 'GET') {
        sendJson(res, 405, { error: 'method not allowed' })
        return true
      }
      let action = url.searchParams.get('action') || ''
      if (!action && req.method === 'POST') {
        const body = await readJson(req, 100_000).catch(() => ({}))
        action = String(body.action || '')
      }
      if (action === 'start') await service.start()
      else if (action === 'stop') await service.stop()
      else if (action === 'restart') await service.restart()
      else {
        sendJson(res, 400, { error: 'action 必须是 start / stop / restart' })
        return true
      }
      sendJson(res, 200, buildStatePayload(service, req))
      return true
    }

    if (path === '/api/config') {
      if (req.method === 'GET') {
        sendJson(res, 200, redact(service.config))
        return true
      }
      if (req.method !== 'PUT') {
        sendJson(res, 405, { error: 'method not allowed' })
        return true
      }
      let patch
      try {
        patch = await readJson(req, 1_000_000)
      } catch (err) {
        sendJson(res, err instanceof HttpInputError ? err.status : 400, { error: err.message })
        return true
      }
      const result = await service.applyPatch(patch)
      if (result.problems?.length) {
        sendJson(res, 422, { error: result.problems.join('；'), problems: result.problems })
        return true
      }
      sendJson(res, 200, buildStatePayload(service, req))
      return true
    }

    if (path === '/api/validate' && req.method === 'POST') {
      let patch
      try {
        patch = await readJson(req, 1_000_000)
      } catch (err) {
        sendJson(res, err instanceof HttpInputError ? err.status : 400, { error: err.message })
        return true
      }
      const { problems } = validatePatch(service.config, patch, { refsStore: service.refs })
      sendJson(res, 200, { problems })
      return true
    }

    if (path === '/api/preview') {
      if (req.method !== 'POST' && req.method !== 'GET') {
        sendJson(res, 405, { error: 'method not allowed' })
        return true
      }
      let text = url.searchParams.get('text') || ''
      const qRole = url.searchParams.get('role')
      let role = qRole === 'dialogue' ? 'dialogue' : (qRole === 'mixed' ? 'mixed' : 'narrator')
      let draft = null
      let applyTextRules = true
      if (req.method === 'POST') {
        let body
        try {
          body = await readJson(req, 400_000)
        } catch (err) {
          sendJson(res, err instanceof HttpInputError ? err.status : 400, { error: err.message })
          return true
        }
        if (body.text) text = String(body.text)
        if (body.role === 'dialogue' || body.role === 'mixed' || body.role === 'narrator') role = body.role
        if (body.draft && typeof body.draft === 'object') draft = body.draft
        if (body.applyTextRules === false) applyTextRules = false
      }
      text = text.trim()
      if (!text) {
        sendJson(res, 400, { error: 'text 不能为空' })
        return true
      }
      const started = Date.now()
      try {
        const { wav, source } = await service.preview({
          text: text.slice(0, 600),
          role,
          draft,
          applyTextRules,
        })
        const { durationSec } = parseWav(wav)
        res.writeHead(200, {
          'Content-Type': 'audio/wav',
          'Content-Length': wav.length,
          'Cache-Control': 'no-store',
          'X-Mimo-Latency-Ms': String(Date.now() - started),
          'X-Mimo-Duration-S': durationSec.toFixed(2),
          'X-Mimo-Source': source,
        })
        res.end(wav)
      } catch (err) {
        const status = err instanceof HttpInputError ? err.status : 502
        sendJson(res, status, { error: String(err?.message || err) })
      }
      return true
    }

    if (path === '/api/text/preview') {
      if (req.method !== 'POST') {
        sendJson(res, 405, { error: 'method not allowed' })
        return true
      }
      let body
      try {
        body = await readJson(req, 300_000)
      } catch (err) {
        sendJson(res, err instanceof HttpInputError ? err.status : 400, { error: err.message })
        return true
      }
      let textRules = service.config.textRules
      let maxSegmentChars = service.config.synth?.maxSegmentChars || 100
      if (body.draft && typeof body.draft === 'object') {
        const checked = validatePatch(service.config, body.draft, { refsStore: service.refs })
        if (checked.problems.length) {
          sendJson(res, 422, { error: checked.problems.join('；'), problems: checked.problems })
          return true
        }
        textRules = checked.merged.textRules
        maxSegmentChars = checked.merged.synth?.maxSegmentChars || maxSegmentChars
      } else if (body.textRules !== undefined) {
        const problems = validateTextRules(body.textRules)
        if (problems.length) {
          sendJson(res, 422, { error: problems.join('；'), problems })
          return true
        }
        textRules = body.textRules
      }
      const explicitMax = Number(body.maxSegmentChars)
      if (Number.isInteger(explicitMax) && explicitMax >= 10 && explicitMax <= 300) {
        maxSegmentChars = explicitMax
      }
      const rawText = String(body.text ?? '').slice(0, 20_000)
      const result = previewTextPipeline(rawText, { textRules, maxSegmentChars })
      sendJson(res, 200, result)
      return true
    }

    if (path === '/api/local') {
      if (req.method !== 'GET' && req.method !== 'POST') {
        sendJson(res, 405, { error: 'method not allowed' })
        return true
      }
      if (req.method === 'POST') {
        const body = await readJson(req, 10_000).catch(() => ({}))
        const action = String(body.action || 'status')
        if (action === 'unload') await service.local.stop('manual')
        else if (action === 'start' || action === 'load') await service.local.preload()
        else if (action !== 'status') {
          sendJson(res, 400, { error: 'action 必须是 start / unload / status' })
          return true
        }
      }
      sendJson(res, 200, { local: service.local.status() })
      return true
    }

    if (path === '/api/cache' && req.method === 'DELETE') {
      service.cache.clear()
      sendJson(res, 200, { ok: true, cache: service.cache.stats() })
      return true
    }

    if (path === '/api/metrics' && req.method === 'DELETE') {
      service.metrics.reset()
      sendJson(res, 200, { ok: true, ...service.metrics.snapshot() })
      return true
    }

    const handledRef = await handleRefRoutes(service, req, res, path)
    if (handledRef) return true

    return false
  }
}

function sendRefError(res, err) {
  const status = err instanceof RefError
    ? err.status
    : (err instanceof HttpInputError ? err.status : 400)
  sendJson(res, status, { error: String(err?.message || err), code: err?.code || 'ref_error' })
}

async function invalidateIfRefUsed(service, refId) {
  service.mimo?.clearSamples()
  const localRefs = service.config?.upstream?.local?.refs || {}
  if (localRefs.narrator?.refId === refId || localRefs.dialogue?.refId === refId) {
    await service.local?.invalidate().catch(() => {})
  }
}

async function handleRefRoutes(service, req, res, path) {
  if (path === '/api/refs') {
    if (req.method === 'GET') {
      sendJson(res, 200, { refs: service.refs.list() })
      return true
    }
    if (req.method === 'POST') {
      try {
        const body = await readJson(req, 15_000_000)
        const item = service.refs.add(body)
        service.mimo?.clearSamples()
        sendJson(res, 201, { item, refs: service.refs.list() })
      } catch (err) {
        sendRefError(res, err)
      }
      return true
    }
    sendJson(res, 405, { error: 'method not allowed' })
    return true
  }

  const audioMatch = /^\/api\/refs\/([^/]+)\/audio$/.exec(path)
  if (audioMatch) {
    if (req.method !== 'GET') {
      sendJson(res, 405, { error: 'method not allowed' })
      return true
    }
    try {
      const id = decodeURIComponent(audioMatch[1])
      const { buffer, mime } = service.refs.readAudio(id)
      res.writeHead(200, {
        'Content-Type': mime,
        'Content-Length': buffer.length,
        'Cache-Control': 'no-store',
        'Content-Disposition': 'inline',
      })
      res.end(buffer)
    } catch (err) {
      sendRefError(res, err)
    }
    return true
  }

  const itemMatch = /^\/api\/refs\/([^/]+)$/.exec(path)
  if (itemMatch) {
    const id = decodeURIComponent(itemMatch[1])
    if (req.method === 'GET') {
      const item = service.refs.get(id)
      if (!item) {
        sendRefError(res, new RefError(`未找到参考音：${id}`, 404, 'not_found'))
      } else {
        sendJson(res, 200, { item })
      }
      return true
    }
    if (req.method === 'PUT') {
      try {
        const body = await readJson(req, 100_000)
        const item = service.refs.update(id, body)
        await invalidateIfRefUsed(service, id)
        sendJson(res, 200, { item, refs: service.refs.list() })
      } catch (err) {
        sendRefError(res, err)
      }
      return true
    }
    if (req.method === 'DELETE') {
      try {
        const result = service.refs.remove(id)
        await invalidateIfRefUsed(service, id)
        sendJson(res, 200, { ...result, refs: service.refs.list() })
      } catch (err) {
        sendRefError(res, err)
      }
      return true
    }
    sendJson(res, 405, { error: 'method not allowed' })
    return true
  }

  return false
}
