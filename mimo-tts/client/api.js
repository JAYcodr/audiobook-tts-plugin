import { API } from './constants.js'

export async function api(path, init) {
  const res = await fetch(API + path, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
  const text = await res.text()
  let json = null
  try { json = JSON.parse(text) } catch { /* 可能是音频 */ }
  if (!res.ok) throw new Error(json?.error || text.slice(0, 160) || `HTTP ${res.status}`)
  return json
}

export async function fetchPreviewWav({ text, role = 'narrator' }) {
  const res = await fetch(`${API}/preview`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, role }),
  })
  if (!res.ok) {
    const bodyText = await res.text().catch(() => '')
    let json = null
    try { json = JSON.parse(bodyText) } catch { /* ignore */ }
    throw new Error(json?.error || bodyText.slice(0, 160) || `HTTP ${res.status}`)
  }
  const blob = await res.blob()
  return {
    blob,
    source: res.headers.get('X-Mimo-Source') || '',
    durationS: res.headers.get('X-Mimo-Duration-S') || '',
    latencyMs: res.headers.get('X-Mimo-Latency-Ms') || '',
  }
}
