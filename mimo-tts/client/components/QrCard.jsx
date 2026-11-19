import React, { useEffect, useMemo, useState } from 'react'
import { renderSVG } from 'uqr'

export function QrCard({ title, badge, url, copyKind, onCopy }) {
  const [zoomOpen, setZoomOpen] = useState(false)

  const svgMarkup = useMemo(() => {
    if (!url || url === '—') return ''
    try {
      return renderSVG(url, { whiteColor: '#f6f3eb', blackColor: '#242a26', border: 2 })
    } catch {
      return ''
    }
  }, [url])

  useEffect(() => {
    if (!zoomOpen) return undefined
    const onEsc = (e) => {
      if (e.key === 'Escape') setZoomOpen(false)
    }
    document.addEventListener('keydown', onEsc)
    return () => document.removeEventListener('keydown', onEsc)
  }, [zoomOpen])

  if (!svgMarkup) return null

  return (
    <div className="qr-card">
      <div className="qr-hd">
        <b>{title}</b>
        {badge ? <span className="tag">{badge}</span> : null}
      </div>
      <button
        type="button"
        className="qr-thumb"
        title="点击放大二维码"
        onClick={() => setZoomOpen(true)}
        dangerouslySetInnerHTML={{ __html: svgMarkup }}
      />
      <div className="qr-acts">
        <button className="btn btn--sm" type="button" onClick={() => setZoomOpen(true)}>放大</button>
        {onCopy && copyKind ? (
          <button className="btn btn--sm" type="button" onClick={() => onCopy(copyKind)}>复制</button>
        ) : null}
      </div>

      {zoomOpen ? (
        <div className="mtt-modal-backdrop" role="dialog" aria-modal="true" aria-label={title} onClick={() => setZoomOpen(false)}>
          <div className="mtt-qr-modal" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-hd">
              <span className="silk">{title}</span>
              <button className="btn btn--sm" type="button" onClick={() => setZoomOpen(false)}>关闭</button>
            </div>
            <div className="qr-zoom-svg" dangerouslySetInnerHTML={{ __html: svgMarkup }} />
            <code className="qr-zoom-url">{url}</code>
          </div>
        </div>
      ) : null}
    </div>
  )
}
