import { BODY_TEXT, CURL_SAMPLE } from './constants.js'

/**
 * 与 src/legado.mjs 同构；页面只读不发请求。
 * opts.audioFallback：服务端已经把 mp3/opus 回退成 WAV 时，交付单必须跟着改口，
 * 否则阅读器按 audio/mpeg 解析 WAV 字节，出问题只在用户那头。
 */
export function legadoPayload(imp, cfg, opts = {}) {
  const headers = {
    'Content-Type': 'application/x-www-form-urlencoded',
    ...((cfg && cfg.legado && cfg.legado.extraHeaders) || {}),
  }
  const listen = String(imp?.listenUrl || '')
  const option = { method: 'POST', body: BODY_TEXT, header: headers }
  const fallback = opts.audioFallback === 'wav' || opts.audioFallback === true
  const declared = fallback ? 'wav' : String(cfg?.audio?.format || 'wav').trim().toLowerCase()
  const contentType = declared === 'mp3' ? 'audio/mpeg' : 'audio/wav'
  return [{
    name: cfg?.legado?.name || '听书值守 TTS',
    url: `${listen},${JSON.stringify(option)}`,
    contentType,
    concurrentRate: String(cfg?.synth?.concurrency || 4),
  }]
}

export function curlText(listenUrl) {
  const url = String(listenUrl || '—')
  return [
    `curl -X POST '${url}' \\`,
    "  -H 'Content-Type: application/x-www-form-urlencoded' \\",
    `  --data-urlencode 'text=${CURL_SAMPLE}' \\`,
    '  --output test.wav',
  ].join('\n')
}

export function download(name, text, mime) {
  try {
    const blob = new Blob([text], { type: mime || 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = name
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1500)
    return true
  } catch {
    return false
  }
}

function execCopy(text) {
  try {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.setAttribute('readonly', '')
    ta.style.cssText = 'position:fixed;top:-1000px;left:0;opacity:0'
    document.body.appendChild(ta)
    ta.select()
    ta.setSelectionRange(0, text.length)
    const ok = document.execCommand('copy')
    ta.remove()
    return ok
  } catch {
    return false
  }
}

export function writeClipboard(text) {
  return new Promise((resolve) => {
    let done = false
    const fallback = () => {
      if (!done) {
        done = true
        resolve(execCopy(text))
      }
    }
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
          if (!done) {
            done = true
            resolve(true)
          }
        }).catch(fallback)
        return
      }
    } catch { /* 走兜底 */ }
    fallback()
  })
}
