/**
 * 对外 OpenAI 兼容 TTS 服务端点（GET /v1/models & POST /v1/audio/speech）。
 *
 * 默认关闭（openaiServer.enabled = false，返回 404）；开启后按 Bearer Token 鉴权，
 * 并复用完整文本切分 / 发音规则 / AudioCache / RpmGate / Metrics 合成管线。
 */
import { clientKeyOf, safeEqual } from './auth.mjs'
import {
  computeResponseEtag,
  computeSegmentKeys,
  etagMatches,
  resolveHttpCachePolicy,
} from './cache.mjs'
import { PRESET_VOICES } from './config.mjs'
import { encodeHintHeader, humanizeError } from './hints.mjs'
import { HttpInputError, readJson } from './http.mjs'
import { toRequests } from './split.mjs'
import { OPENAI_FORMATS, resolveFfmpegPath, transcodeWav } from './transcode.mjs'

const EXPOSE_HEADERS = 'ETag, X-Cache, X-Audiobook-Duration-S, X-Audiobook-Source, X-Audiobook-Segments, X-Audiobook-Format-Fallback, X-Audiobook-Fallback-Reason, X-Audiobook-Hint'

const OPENAI_MODELS = [
  { id: 'audiobook-tts', object: 'model', created: 1700000000, owned_by: 'audiobook-tts-plugin' },
  { id: 'tts-1', object: 'model', created: 1700000000, owned_by: 'audiobook-tts-plugin' },
  { id: 'tts-1-hd', object: 'model', created: 1700000000, owned_by: 'audiobook-tts-plugin' },
  { id: 'gpt-4o-mini-tts', object: 'model', created: 1700000000, owned_by: 'audiobook-tts-plugin' },
]

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type, X-API-Key, If-None-Match',
  'Access-Control-Expose-Headers': EXPOSE_HEADERS,
}

function sendOpenAiJson(res, status, payload, extraHeaders = {}) {
  const body = Buffer.from(JSON.stringify(payload, null, 2))
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': body.length,
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Expose-Headers': EXPOSE_HEADERS,
    ...extraHeaders,
  })
  res.end(body)
}

function sendOpenAiError(res, status, message, type = 'invalid_request_error', code = 'invalid_request', hint = '') {
  const extra = {}
  const encodedHint = encodeHintHeader(hint)
  if (encodedHint) extra['X-Audiobook-Hint'] = encodedHint
  sendOpenAiJson(res, status, {
    error: { message, type, code },
  }, extra)
}

function extractBearerToken(req) {
  const authHeader = String(req.headers?.authorization || '').trim()
  const match = /^Bearer\s+(.+)$/i.exec(authHeader)
  if (match) return match[1].trim()
  const apiKeyHeader = req.headers?.['x-api-key']
  if (typeof apiKeyHeader === 'string' && apiKeyHeader.trim()) {
    return apiKeyHeader.trim()
  }
  return ''
}

function authorizeOpenAiRequest(req, cfg) {
  const provided = extractBearerToken(req)
  if (!provided) return false
  const customKey = String(cfg.openaiServer?.apiKey || '').trim()
  if (customKey) return safeEqual(provided, customKey)
  const adminToken = String(cfg.auth?.token || '').trim()
  if (adminToken && safeEqual(provided, adminToken)) return true
  const readTokens = Array.isArray(cfg.auth?.readTokens) ? cfg.auth.readTokens : []
  let matchedRead = false
  for (const rt of readTokens) {
    if (rt?.token && safeEqual(provided, rt.token)) matchedRead = true
  }
  return matchedRead
}

function mapSpeed(rawSpeed) {
  const num = rawSpeed === undefined || rawSpeed === null || rawSpeed === '' ? 1.0 : Number(rawSpeed)
  const openaiSpeed = Number.isFinite(num) ? Math.max(0.25, Math.min(4.0, num)) : 1.0
  const legadoSpeed = openaiSpeed >= 1.35
    ? 24
    : openaiSpeed >= 1.15
      ? 16
      : openaiSpeed <= 0.85
        ? 3
        : 0
  return { openaiSpeed, legadoSpeed }
}

function resolveVoiceSpec(voiceRaw, cfg, service) {
  const voice = String(voiceRaw ?? 'alloy').trim() || 'alloy'
  const rawMap = cfg.openaiServer?.voiceMap
  const voiceMap = rawMap && typeof rawMap === 'object' && !Array.isArray(rawMap) ? rawMap : {}
  const target = Object.hasOwn(voiceMap, voice) ? String(voiceMap[voice] ?? '').trim() : voice

  if (target === 'auto') return { kind: 'auto' }
  if (target === 'narrator') return { kind: 'narrator' }
  if (target === 'dialogue') return { kind: 'dialogue' }
  if (target && service.provider === 'openai') return { kind: 'openai-custom', voice: target }
  if (PRESET_VOICES.includes(target)) return { kind: 'preset', voice: target }
  if (target && service.refs?.get(target)) return { kind: 'clone', refId: target }
  return { kind: 'auto' }
}

function buildRequestsForSpeech({ text, cfg, service, voiceSpec, legadoSpeed }) {
  const rawSegments = service.prepareSegments(text, cfg)
  if (!rawSegments.length) return []

  const splitDialogue = cfg.openaiServer?.splitDialogue !== false
  const voices = service.effectiveVoices(legadoSpeed)
  const speedHint = legadoSpeed >= 22
    ? '语速偏快'
    : legadoSpeed >= 14
      ? '语速稍快'
      : legadoSpeed > 0 && legadoSpeed <= 4
        ? '语速偏慢'
        : ''

  if (voiceSpec.kind === 'narrator') {
    return toRequests(rawSegments.map((s) => ({ ...s, role: 'narrator' })), voices)
  }
  if (voiceSpec.kind === 'dialogue') {
    return toRequests(rawSegments.map((s) => ({ ...s, role: 'dialogue' })), voices)
  }
  if (voiceSpec.kind === 'preset') {
    const presetObj = { mode: 'preset', voice: voiceSpec.voice, style: speedHint, refId: '' }
    return toRequests(rawSegments, { narrator: presetObj, dialogue: presetObj })
  }
  if (voiceSpec.kind === 'clone') {
    const cloneObj = { mode: 'clone', voice: '', style: '', refId: voiceSpec.refId }
    return toRequests(rawSegments, { narrator: cloneObj, dialogue: cloneObj })
  }
  if (voiceSpec.kind === 'openai-custom') {
    const segs = splitDialogue ? rawSegments : rawSegments.map((s) => ({ ...s, role: 'narrator' }))
    return toRequests(segs, voices).map((r) => ({ ...r, openaiVoice: voiceSpec.voice }))
  }

  const segs = splitDialogue ? rawSegments : rawSegments.map((s) => ({ ...s, role: 'narrator' }))
  return toRequests(segs, voices)
}

export function createOpenAiServerHandler({ service }) {
  return async function handleOpenAiRequest(req, res, path) {
    if (path !== '/v1/models' && path !== '/v1/audio/speech') {
      return false
    }

    if (req.method === 'OPTIONS') {
      res.writeHead(204, {
        ...CORS_HEADERS,
        'Access-Control-Max-Age': '86400',
      })
      res.end()
      return true
    }

    const cfg = service.config
    if (cfg.openaiServer?.enabled !== true) {
      sendOpenAiError(
        res,
        404,
        'OpenAI compatible TTS endpoint is disabled (enable openaiServer.enabled in settings)',
        'not_found_error',
        'endpoint_disabled',
      )
      return true
    }

    if (!authorizeOpenAiRequest(req, cfg)) {
      const diag = humanizeError(401, { endpointAuth: true })
      sendOpenAiError(res, 401, 'Invalid API key', 'authentication_error', 'invalid_api_key', diag.hint)
      return true
    }

    if (path === '/v1/models') {
      if (req.method !== 'GET') {
        sendOpenAiError(res, 405, 'Method not allowed', 'invalid_request_error', 'method_not_allowed')
        return true
      }
      sendOpenAiJson(res, 200, { object: 'list', data: OPENAI_MODELS })
      return true
    }

    if (req.method !== 'POST') {
      sendOpenAiError(res, 405, 'Method not allowed', 'invalid_request_error', 'method_not_allowed')
      return true
    }

    if (!service.listening) {
      const diag = humanizeError(Object.assign(new Error('服务未启动'), { code: 'service_stopped', status: 503 }))
      service.metrics.noteError(diag)
      sendOpenAiError(res, 503, 'TTS service is not running', 'service_unavailable_error', 'service_stopped', diag.hint)
      return true
    }

    let body
    try {
      body = await readJson(req, 1_000_000)
    } catch (err) {
      const status = err instanceof HttpInputError ? err.status : 400
      sendOpenAiError(res, status, err?.message || 'Invalid JSON body', 'invalid_request_error', 'invalid_json')
      return true
    }

    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      sendOpenAiError(res, 400, 'Request body must be a JSON object', 'invalid_request_error', 'invalid_body')
      return true
    }

    const text = typeof body.input === 'string' ? body.input.trim() : ''
    if (!text) {
      sendOpenAiError(res, 400, 'input must be a non-empty string', 'invalid_request_error', 'invalid_input')
      return true
    }
    const maxChars = Number(cfg.synth?.maxTextChars) || 10000
    if (text.length > maxChars) {
      const diag = humanizeError(413, { maxTextChars: maxChars })
      service.metrics.noteError(diag)
      sendOpenAiError(
        res,
        413,
        `input length (${text.length}) exceeds maxTextChars (${maxChars})`,
        'invalid_request_error',
        'input_too_long',
        diag.hint,
      )
      return true
    }

    const rawFmt = String(body.response_format ?? cfg.audio?.format ?? 'wav').trim().toLowerCase() || 'wav'
    const fallbackPolicy = cfg.openaiServer?.mp3Fallback || 'wav'
    const transcodeOpts = service.transcodeOpts || {}
    let targetFmt = rawFmt
    let formatFallback = false
    let fallbackReason = ''

    if (!OPENAI_FORMATS.has(rawFmt)) {
      if (fallbackPolicy === 'strict') {
        sendOpenAiError(
          res,
          400,
          `Unsupported response_format "${rawFmt}". Supported formats: wav, pcm, mp3, opus.`,
          'invalid_request_error',
          'unsupported_format',
        )
        return true
      }
      targetFmt = 'wav'
      formatFallback = true
      fallbackReason = 'unsupported_format'
    } else if ((rawFmt === 'mp3' || rawFmt === 'opus') && !resolveFfmpegPath(transcodeOpts)) {
      if (fallbackPolicy === 'strict') {
        sendOpenAiError(
          res,
          400,
          `Format "${rawFmt}" requires ffmpeg on host, which is not available.`,
          'invalid_request_error',
          'unsupported_format',
        )
        return true
      }
      targetFmt = 'wav'
      formatFallback = true
      fallbackReason = 'ffmpeg_missing'
    }

    const model = String(body.model || cfg.openaiServer?.defaultModel || 'audiobook-tts').trim() || 'audiobook-tts'
    const { openaiSpeed, legadoSpeed } = mapSpeed(body.speed)
    const voiceSpec = resolveVoiceSpec(body.voice, cfg, service)
    const requests = buildRequestsForSpeech({ text, cfg, service, voiceSpec, legadoSpeed })
    if (!requests.length) {
      sendOpenAiError(
        res,
        400,
        'No speakable content left after text rules or splitting',
        'invalid_request_error',
        'empty_segments',
      )
      return true
    }

    const role = requests.every((r) => r.role === 'dialogue')
      ? 'dialogue'
      : requests.every((r) => r.role === 'narrator')
        ? 'narrator'
        : 'mixed'
    const clientKey = clientKeyOf(req)
    const started = Date.now()
    const metricFormat = `openai-${targetFmt}`

    service.metrics.touch(clientKey, { text: text.slice(0, 60), chars: text.length, bookId: model })

    try {
      const provider = service.activeProvider()
      const synthCtx = { clientKey, started, speed: legadoSpeed, openaiSpeed, config: cfg }
      const cachePolicy = resolveHttpCachePolicy(cfg.cache)
      const allowHttpCache = cachePolicy.enabled && !formatFallback
      const segKeys = allowHttpCache ? computeSegmentKeys(provider, requests, synthCtx) : []
      const etag = allowHttpCache
        ? computeResponseEtag({
            segmentKeys: segKeys,
            format: targetFmt,
            bitrate: cfg.audio?.bitrate ?? 64,
          })
        : ''
      if (etag && etagMatches(req.headers?.['if-none-match'], etag)) {
        res.writeHead(304, {
          'Cache-Control': cachePolicy.cacheControl,
          ETag: etag,
          'X-Cache': 'HIT',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Expose-Headers': EXPOSE_HEADERS,
        })
        res.end()
        return true
      }

      const { wav, durationSec, hits, source } = await service.synthesize(requests, {
        clientKey,
        started,
        speed: legadoSpeed,
        openaiSpeed,
      })

      const tx = await transcodeWav(wav, {
        format: targetFmt,
        bitrate: cfg.audio?.bitrate ?? 64,
        ...transcodeOpts,
      })
      const outBuf = tx.buffer
      const contentType = tx.contentType
      const finalDurationSec = Number.isFinite(tx.durationSec) && tx.durationSec > 0
        ? tx.durationSec
        : durationSec
      if (tx.fallback) {
        formatFallback = true
        fallbackReason = fallbackReason || tx.reason || 'transcode_failed'
        service.log(`[audio] OpenAI ${targetFmt} 转码回退 WAV（reason=${fallbackReason}${tx.error ? `: ${tx.error}` : ''}）`)
      }

      const cacheHit = cfg.cache?.enabled !== false && requests.length > 0 && hits === requests.length
      const latency = Date.now() - started
      service.metrics.record({
        chars: text.length,
        segments: requests.length,
        bytes: outBuf.length,
        audioSeconds: finalDurationSec,
        latencyMs: latency,
        cacheHit,
        client: clientKey,
        bookId: model,
        role,
        text: text.slice(0, 60),
        format: `openai-${tx.format}`,
        source,
      })

      const headers = {
        'Content-Type': contentType,
        'Content-Length': outBuf.length,
        'Cache-Control': (!formatFallback && cachePolicy.enabled) ? cachePolicy.cacheControl : 'no-store',
        'X-Cache': cacheHit ? 'HIT' : 'MISS',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Expose-Headers': EXPOSE_HEADERS,
        'X-Audiobook-Duration-S': finalDurationSec.toFixed(2),
        'X-Audiobook-Source': source,
        'X-Audiobook-Segments': String(requests.length),
      }
      if (!formatFallback && etag) headers.ETag = etag
      if (formatFallback) {
        headers['X-Audiobook-Format-Fallback'] = 'wav'
        if (fallbackReason) headers['X-Audiobook-Fallback-Reason'] = fallbackReason
      }

      res.writeHead(200, headers)
      res.end(outBuf)
      return true
    } catch (err) {
      const diagCtx = typeof service.diagnosticContext === 'function'
        ? service.diagnosticContext()
        : { provider: service.provider, maxTextChars: cfg.synth?.maxTextChars }
      const diag = humanizeError(err, diagCtx)
      const latency = Date.now() - started
      service.metrics.record({
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
        bookId: model,
        role,
        text: text.slice(0, 60),
        format: metricFormat,
      })
      service.log(`[error] OpenAI TTS 合成失败 (${diag.httpStatus}/${diag.code}): ${err?.message || err}`)
      sendOpenAiError(
        res,
        diag.httpStatus,
        diag.message || String(err?.message || err),
        'upstream_error',
        diag.code || err?.code || 'synthesis_failed',
        `${diag.message}：${diag.hint}`,
      )
      return true
    }
  }
}
