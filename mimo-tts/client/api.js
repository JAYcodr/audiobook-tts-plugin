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

export async function fetchPreviewWav({ text, role = 'narrator', draft = null, applyTextRules = true }) {
  const payload = { text, role, applyTextRules }
  if (draft && typeof draft === 'object') payload.draft = draft
  const res = await fetch(`${API}/preview`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
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

export const previewTextApi = (payload) => api('/text/preview', { method: 'POST', body: JSON.stringify(payload) })
export const fetchRefsApi = () => api('/refs')
export const uploadRefApi = (payload) => api('/refs', { method: 'POST', body: JSON.stringify(payload) })
export const updateRefApi = (id, payload) => api(`/refs/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(payload) })
export const deleteRefApi = (id) => api(`/refs/${encodeURIComponent(id)}`, { method: 'DELETE' })
export const refAudioUrl = (id) => `${API}/refs/${encodeURIComponent(id)}/audio`

export const fetchEnvDetectApi = () => api('/env/detect')
export const runDoctorApi = (checkNetwork = false) => api('/doctor', { method: 'POST', body: JSON.stringify({ checkNetwork }) })
export const fetchSetupStatusApi = (since = 0) => api(`/setup/status?since=${Number(since) || 0}`)
export const startSetupTaskApi = (payload) => api('/setup/run', { method: 'POST', body: JSON.stringify(payload) })
export const cancelSetupTaskApi = () => api('/setup/cancel', { method: 'POST' })
export const resetMetricsApi = () => api('/metrics', { method: 'DELETE' })

export const fetchTunnelStatusApi = (detect = false) => api(`/tunnel/status${detect ? '?detect=1' : ''}`)
export const controlQuickTunnelApi = (payload) => api('/tunnel/quick', { method: 'POST', body: JSON.stringify(payload) })
export const syncTunnelKvApi = (payload = {}) => api('/tunnel/sync-kv', { method: 'POST', body: JSON.stringify(payload) })
export const genOpenAiServerKeyApi = () => api('/openai-server/gen-key', { method: 'POST' })
