/**
 * 共享控制台 HTTP API 路由处理器（/api/*）：
 * 由独立 HTTP 服务（service.mjs）和 DSH 插件宿主（index.js）共同挂载，保证行为完全一致。
 */
import { authorized } from './auth.mjs'
import { PRESET_VOICES, redact, validatePatch } from './config.mjs'
import { HttpInputError, readJson, sendJson } from './http.mjs'
import { buildImportInfo } from './legado.mjs'
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
      const { problems } = validatePatch(service.config, patch)
      sendJson(res, 200, { problems })
      return true
    }

    if (path === '/api/preview') {
      if (req.method !== 'POST' && req.method !== 'GET') {
        sendJson(res, 405, { error: 'method not allowed' })
        return true
      }
      let text = url.searchParams.get('text') || ''
      let role = url.searchParams.get('role') === 'dialogue' ? 'dialogue' : 'narrator'
      if (req.method === 'POST') {
        const body = await readJson(req, 200_000).catch(() => ({}))
        if (body.text) text = String(body.text)
        if (body.role === 'dialogue') role = 'dialogue'
      }
      text = text.trim()
      if (!text) {
        sendJson(res, 400, { error: 'text 不能为空' })
        return true
      }
      const started = Date.now()
      try {
        const { wav, source } = await service.preview({ text: text.slice(0, 300), role })
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
        sendJson(res, 502, { error: String(err?.message || err) })
      }
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

    return false
  }
}
