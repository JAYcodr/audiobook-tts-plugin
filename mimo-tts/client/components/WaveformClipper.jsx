import React, { useEffect, useRef, useState } from 'react'
import WaveSurfer from 'wavesurfer.js'
import RegionsPlugin from 'wavesurfer.js/dist/plugins/regions.esm.js'
import { clearRefClipApi, clipRefApi, refAudioUrl, refRawAudioUrl } from '../api.js'

const clamp = (v, min, max) => Math.max(min, Math.min(max, v))

/**
 * 参考音交互式波形裁剪器（WaveSurfer v7 + Regions）：
 * - 拖拽选区定位 5–15 秒纯净人声，实时预览试听（选区 vs 当前成片 A/B 对比）；
 * - 后端非破坏性裁剪 + 可选 RMS 响度归一，并保留原始文件随时恢复。
 */
export function WaveformClipper({ item, onRefsChange, onClose, showToast }) {
  const waveElRef = useRef(null)
  const wsRef = useRef(null)
  const regionRef = useRef(null)
  const abAudioRef = useRef(null)
  const endBoundRef = useRef(12)
  const mountedRef = useRef(true)

  const initStart = Number.isFinite(Number(item?.clipStart)) ? Number(item.clipStart) : 0
  const initEnd = Number.isFinite(Number(item?.clipEnd))
    ? Number(item.clipEnd)
    : Math.min(Number(item?.rawDurationSec || item?.durationSec || 12) || 12, 12)

  const [totalDur, setTotalDur] = useState(Number(item?.rawDurationSec || item?.durationSec || 0) || 0)
  const [startSec, setStartSec] = useState(Number(initStart.toFixed(2)))
  const [endSec, setEndSec] = useState(Number(initEnd.toFixed(2)))
  const [normalize, setNormalize] = useState(item?.clipNormalized !== false)
  const [loading, setLoading] = useState(true)
  const [wsError, setWsError] = useState('')
  const [playingRegion, setPlayingRegion] = useState(false)
  const [playingClip, setPlayingClip] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      if (abAudioRef.current) {
        try { abAudioRef.current.pause() } catch { /* ignore */ }
        abAudioRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (typeof document === 'undefined' || !waveElRef.current) return undefined
    setLoading(true)
    setWsError('')
    setPlayingRegion(false)

    const regions = RegionsPlugin.create()
    const ws = WaveSurfer.create({
      container: waveElRef.current,
      url: `${refRawAudioUrl(item.id)}&v=${item.rawWav ? 'raw' : (item.updatedAt || 0)}`,
      waveColor: '#9aa39b',
      progressColor: '#1f3b33',
      cursorColor: '#b13a22',
      height: 64,
      barWidth: 2,
      barGap: 1,
      normalize: true,
      plugins: [regions],
    })
    wsRef.current = ws

    ws.on('ready', (dur) => {
      if (!mountedRef.current) return
      const d = Number(dur) || 0
      setTotalDur(Number(d.toFixed(2)))
      const s = Number.isFinite(Number(item?.clipStart)) ? clamp(Number(item.clipStart), 0, Math.max(0, d - 1)) : 0
      const defaultE = Number.isFinite(Number(item?.clipEnd))
        ? Number(item.clipEnd)
        : Math.min(d, Math.max(s + 10, 12))
      const e = clamp(defaultE, Math.min(d, s + 1), d)
      setStartSec(Number(s.toFixed(2)))
      setEndSec(Number(e.toFixed(2)))
      endBoundRef.current = e
      regions.clearRegions()
      regionRef.current = regions.addRegion({
        start: s,
        end: e,
        color: 'rgba(177, 58, 34, 0.22)',
        drag: true,
        resize: true,
        minLength: 1,
      })
      setLoading(false)
    })

    regions.on('region-updated', (reg) => {
      if (!mountedRef.current) return
      const s = Number(Number(reg.start || 0).toFixed(2))
      const e = Number(Number(reg.end || 0).toFixed(2))
      setStartSec(s)
      setEndSec(e)
      endBoundRef.current = e
    })

    ws.on('timeupdate', (t) => {
      if (ws.isPlaying() && t >= endBoundRef.current) {
        ws.pause()
        if (mountedRef.current) setPlayingRegion(false)
      }
    })
    ws.on('finish', () => {
      if (mountedRef.current) setPlayingRegion(false)
    })
    ws.on('pause', () => {
      if (mountedRef.current) setPlayingRegion(false)
    })
    ws.on('error', (err) => {
      if (!mountedRef.current) return
      setLoading(false)
      setWsError(`波形解码失败：${String(err?.message || err)}`)
    })

    return () => {
      try { ws.destroy() } catch { /* ignore */ }
      wsRef.current = null
      regionRef.current = null
    }
  }, [item.id])

  const updateNumericRange = (nextS, nextE) => {
    const maxD = totalDur > 0 ? totalDur : 300
    const s = clamp(Number(nextS) || 0, 0, Math.max(0, maxD - 1))
    const e = clamp(Number(nextE) || s + 1, Math.min(maxD, s + 1), maxD)
    setStartSec(Number(s.toFixed(2)))
    setEndSec(Number(e.toFixed(2)))
    endBoundRef.current = e
    if (regionRef.current) {
      try { regionRef.current.setOptions({ start: s, end: e }) } catch { /* ignore */ }
    }
  }

  const togglePlayRegion = () => {
    const ws = wsRef.current
    if (!ws) return
    if (abAudioRef.current) {
      try { abAudioRef.current.pause() } catch { /* ignore */ }
      setPlayingClip(false)
    }
    if (playingRegion) {
      ws.pause()
      setPlayingRegion(false)
      return
    }
    endBoundRef.current = endSec
    ws.setTime(startSec)
    ws.play()
    setPlayingRegion(true)
  }

  const togglePlayClippedB = () => {
    if (wsRef.current?.isPlaying()) {
      wsRef.current.pause()
      setPlayingRegion(false)
    }
    if (playingClip && abAudioRef.current) {
      abAudioRef.current.pause()
      setPlayingClip(false)
      return
    }
    if (typeof Audio === 'undefined') return
    if (abAudioRef.current) {
      try { abAudioRef.current.pause() } catch { /* ignore */ }
    }
    const url = `${refAudioUrl(item.id)}?v=${item.updatedAt || Date.now()}`
    const audio = new Audio(url)
    abAudioRef.current = audio
    audio.onended = () => { if (mountedRef.current) setPlayingClip(false) }
    audio.onpause = () => { if (mountedRef.current) setPlayingClip(false) }
    audio.play().then(() => {
      if (mountedRef.current) setPlayingClip(true)
    }).catch((err) => {
      showToast?.(`播放失败：${String(err?.message || err)}`)
    })
  }

  const handleSaveClip = async () => {
    setBusy(true)
    try {
      const res = await clipRefApi(item.id, { startSec, endSec, normalize })
      onRefsChange?.(res.refs || [])
      showToast?.(`已应用裁剪（${res.item?.clipDuration || (endSec - startSec).toFixed(2)}s）并刷新克隆缓存`)
    } catch (err) {
      showToast?.(`裁剪失败：${String(err?.message || err)}`)
    } finally {
      if (mountedRef.current) setBusy(false)
    }
  }

  const handleClearClip = async () => {
    setBusy(true)
    try {
      const res = await clearRefClipApi(item.id)
      onRefsChange?.(res.refs || [])
      showToast?.('已恢复原始参考音文件')
    } catch (err) {
      showToast?.(`恢复原版失败：${String(err?.message || err)}`)
    } finally {
      if (mountedRef.current) setBusy(false)
    }
  }

  const span = Math.max(0, Number((endSec - startSec).toFixed(2)))
  const inSweetSpot = span >= 5 && span <= 15

  return (
    <div className="ref-clipper">
      <div className="ref-clip-hd">
        <span className="silk">WAVEFORM TRIM <b>波形裁剪 · A/B 对比</b></span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span className={`tag ${inSweetSpot ? 'tape' : 'grease'}`}>
            {`选区 ${span.toFixed(1)}s${inSweetSpot ? ' · 推荐 5–15s' : span < 5 ? ' · 偏短 (<5s)' : ' · 偏长 (>15s)'}`}
          </span>
          {totalDur > 0 && <span className="mono" style={{ fontSize: 11 }}>{`全长 ${totalDur.toFixed(1)}s`}</span>}
        </div>
      </div>

      <div className="ref-wave-well" ref={waveElRef} aria-label="音频波形选区">
        {loading && !wsError ? <div className="ref-wave-msg">载入原始音频波形中…</div> : null}
        {wsError ? <div className="ref-wave-msg">{wsError}</div> : null}
      </div>

      <div className="ref-clip-bar">
        <label className="mono" style={{ fontSize: 11, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          起
          <input
            className="input ref-sec-inp"
            type="number"
            min="0"
            max={Math.max(0, endSec - 1)}
            step="0.1"
            value={startSec}
            onChange={(e) => updateNumericRange(e.target.value, endSec)}
          />
          s
        </label>
        <label className="mono" style={{ fontSize: 11, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          止
          <input
            className="input ref-sec-inp"
            type="number"
            min={startSec + 1}
            max={totalDur > 0 ? totalDur : 300}
            step="0.1"
            value={endSec}
            onChange={(e) => updateNumericRange(startSec, e.target.value)}
          />
          s
        </label>
        <label style={{ fontSize: 11.5, display: 'inline-flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={normalize}
            onChange={(e) => setNormalize(e.target.checked)}
          />
          <span>RMS 归一 (0.126)</span>
        </label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginLeft: 'auto' }}>
          <button
            className="btn btn--sm"
            type="button"
            disabled={loading || Boolean(wsError)}
            onClick={togglePlayRegion}
          >
            {playingRegion ? '暂停选区 (A)' : '试听选区 (A)'}
          </button>
          {item.hasClip ? (
            <button className="btn btn--sm" type="button" onClick={togglePlayClippedB}>
              {playingClip ? '暂停成片 (B)' : '对比成片 (B)'}
            </button>
          ) : null}
          <button
            className="btn btn--sm btn--tape"
            type="button"
            disabled={busy || span < 1 || span > 30}
            onClick={handleSaveClip}
          >
            {busy ? '处理中…' : '应用裁剪'}
          </button>
          {item.hasClip ? (
            <button className="btn btn--sm" type="button" disabled={busy} onClick={handleClearClip}>
              恢复原版
            </button>
          ) : null}
          <button className="btn btn--sm btn--ghost" type="button" onClick={onClose}>
            收起
          </button>
        </div>
      </div>
    </div>
  )
}
