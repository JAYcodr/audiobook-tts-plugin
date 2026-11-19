import React, { useEffect, useState } from 'react'
import { fetchPreviewWav } from '../api.js'
import { PREVIEW_SAMPLE, ROLE_CN } from '../constants.js'
import { Seg } from './Primitives.jsx'

export function PreviewPlayer({
  draftPatch = null,
  showToast,
  defaultRole = 'narrator',
  showRuleToggle = true,
  title = '交互试听（支持未保存草稿）',
}) {
  const [role, setRole] = useState(defaultRole)
  const [text, setText] = useState(PREVIEW_SAMPLE[defaultRole] || PREVIEW_SAMPLE.narrator)
  const [customEdited, setCustomEdited] = useState(false)
  const [applyTextRules, setApplyTextRules] = useState(true)
  const [busy, setBusy] = useState(false)
  const [audioUrl, setAudioUrl] = useState('')
  const [meta, setMeta] = useState(null)

  useEffect(() => () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl)
  }, [audioUrl])

  const changeRole = (nextRole) => {
    setRole(nextRole)
    if (!customEdited) {
      setText(PREVIEW_SAMPLE[nextRole] || PREVIEW_SAMPLE.narrator)
    }
  }

  const run = async () => {
    const clean = text.trim()
    if (!clean) {
      showToast('请输入试听文本')
      return
    }
    setBusy(true)
    try {
      const { blob, source, durationS, latencyMs } = await fetchPreviewWav({
        text: clean,
        role,
        draft: draftPatch || null,
        applyTextRules,
      })
      const nextUrl = URL.createObjectURL(blob)
      setAudioUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev)
        return nextUrl
      })
      setMeta({ source, durationS, latencyMs })
      showToast(`试听完成 · ${ROLE_CN[role] || role} · ${source || 'tts'} · ${durationS || '?'}s`)
    } catch (err) {
      showToast(`试听失败：${String(err?.message || err)}`)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="preview-box">
      <div className="pv-hd">
        <span className="silk">{title}</span>
        <Seg
          options={[
            { value: 'narrator', label: '旁白' },
            { value: 'dialogue', label: '对话' },
            { value: 'mixed', label: '旁白+对话混排' },
          ]}
          value={role}
          ariaLabel="试听角色"
          onChange={changeRole}
        />
      </div>

      <textarea
        className="input"
        rows={2}
        value={text}
        placeholder="输入试听文本…"
        onChange={(e) => {
          setCustomEdited(true)
          setText(e.target.value)
        }}
      />

      <div className="pv-bar">
        <button className="btn btn--sm btn--tape" type="button" disabled={busy} onClick={run}>
          {busy ? '合成中…' : (draftPatch ? '试听当前草稿' : '合成并试听')}
        </button>
        {showRuleToggle ? (
          <label className="mono" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, cursor: 'pointer' }}>
            <input type="checkbox" checked={applyTextRules} onChange={(e) => setApplyTextRules(e.target.checked)} />
            应用替换规则
          </label>
        ) : null}
        {meta ? (
          <span className="mono pv-meta">
            {`${meta.source || 'tts'} · ${meta.durationS || '?'}s · ${meta.latencyMs || '?'}ms`}
          </span>
        ) : null}
      </div>

      {audioUrl ? (
        <audio className="pv-audio" controls autoPlay src={audioUrl} />
      ) : null}
    </div>
  )
}
