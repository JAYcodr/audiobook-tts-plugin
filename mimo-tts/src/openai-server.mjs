/**
 * 对外 OpenAI 兼容 TTS 服务端点（GET /v1/models & POST /v1/audio/speech）。
 *
 * 默认关闭（openaiServer.enabled = false，返回 404）；开启后按 Bearer Token 鉴权，
 * 并复用完整文本切分 / 发音规则 / AudioCache / RpmGate / Metrics 合成管线。
 */
import { clientKeyOf, safeEqual } from './auth.mjs'
import { PRESET_VOICES } from './config.mjs'
import { HttpInputError, readJson } from './http.mjs'
import { toRequests } from './split.mjs'
import { parseWav } from './wav.mjs'

const OPENAI_MODELS = [
  { id: 'audiobook-tts', object: 'model', created: 1700000000, owned_by: 'audiobook-tts-plugin' },
  { id: 'tts-1', object: 'model', created: 1700000000, owned_by: 'audiobook-tts-plugin' },
  { id: 'tts-1-hd', object: 'model', created: 1700000000, owned_by: 'audiobook-tts-plugin' },
  { id: 'gpt-4o-mini-tts', object: 'model', created: 1700000000, owned_by: 'audiobook-tts-plugin' },
]

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type, X-API-Key',
}

function sendOpenAiJson(res, status, payload) {
  const body = Buffer.from(JSON.stringify(payload, null, 2))
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': body.length,
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': '*',
  })
  res.end(body)
}

function sendOpenAiError(res, status, message, type = 'invalid_request_error', code = 'invalid_request') {
  sendOpenAiJson(res, status, {
    error: { message, type, code },
  })
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
  const customKey = String(cfg.openaiServer?.apiKey || '').trim()
  const expected = customKey || String(cfg.auth?.token || '').trim()
  const provided = extractBearerToken(req)
  if (!expected || !provided) return false
  return safeEqual(provided, expected)
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
      sendOpenAiError(res, 401, 'Invalid API key', 'authentication_error', 'invalid_api_key')
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
      sendOpenAiError(res, 503, 'TTS service is not running', 'service_unavailable_error', 'service_stopped')
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
      sendOpenAiError(
        res,
        413,
        `input length (${text.length}) exceeds maxTextChars (${maxChars})`,
        'invalid_request_error',
        'input_too_long',
      )
      return true
    }

    const rawFmt = String(body.response_format ?? 'wav').trim().toLowerCase() || 'wav'
    let targetFmt = rawFmt
    let formatFallback = false
    if (rawFmt !== 'wav' && rawFmt !== 'pcm') {
      const fallbackPolicy = cfg.openaiServer?.mp3Fallback || 'wav'
      if (fallbackPolicy === 'strict') {
        sendOpenAiError(
          res,
          400,
          `Unsupported response_format "${rawFmt}". Supported formats: wav, pcm.`,
          'invalid_request_error',
          'unsupported_format',
        )
        return true
      }
      targetFmt = 'wav'
      formatFallback = true
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
    const isPcm = targetFmt === 'pcm'
    const metricFormat = isPcm ? 'openai-pcm' : 'openai-wav'

    service.metrics.touch(clientKey, { text: text.slice(0, 60), chars: text.length, bookId: model })

    try {
      const { wav, durationSec, hits, source } = await service.synthesize(requests, {
        clientKey,
        started,
        speed: legadoSpeed,
        openaiSpeed,
      })

      let outBuf = wav
      let contentType = 'audio/wav'
      let finalDurationSec = durationSec

      if (isPcm) {
        const parsed = parseWav(wav)
        outBuf = parsed.pcm
        contentType = 'audio/pcm'
        if (Number.isFinite(parsed.durationSec) && parsed.durationSec > 0) {
          finalDurationSec = parsed.durationSec
        }
      }

      const latency = Date.now() - started
      service.metrics.record({
        chars: text.length,
        segments: requests.length,
        bytes: outBuf.length,
        audioSeconds: finalDurationSec,
        latencyMs: latency,
        cacheHit: hits === requests.length,
        client: clientKey,
        bookId: model,
        role,
        text: text.slice(0, 60),
        format: metricFormat,
        source,
      })

      const headers = {
        'Content-Type': contentType,
        'Content-Length': outBuf.length,
        'Cache-Control': 'no-store',
        'Access-Control-Allow-Origin': '*',
        'X-Audiobook-Duration-S': finalDurationSec.toFixed(2),
        'X-Audiobook-Source': source,
        'X-Audiobook-Segments': String(requests.length),
      }
      if (formatFallback) headers['X-Audiobook-Format-Fallback'] = 'wav'

      res.writeHead(200, headers)
      res.end(outBuf)
      return true
    } catch (err) {
      const latency = Date.now() - started
      service.metrics.record({
        chars: text.length,
        segments: requests.length,
        bytes: 0,
        latencyMs: latency,
        error: true,
        client: clientKey,
        bookId: model,
        role,
        text: text.slice(0, 60),
        format: metricFormat,
      })
      service.log(`[error] OpenAI TTS 合成失败: ${err?.message || err}`)
      sendOpenAiError(
        res,
        502,
        String(err?.message || err),
        'upstream_error',
        err?.code || 'synthesis_failed',
      )
      return true
    }
  }
}
