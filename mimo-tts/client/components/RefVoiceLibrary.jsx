import React, { useState } from 'react'
import { deleteRefApi, refAudioUrl, updateRefApi, uploadRefApi } from '../api.js'

const MAX_BYTES = 10 * 1024 * 1024

export function RefVoiceLibrary({ refs, onRefsChange, showToast }) {
  const [name, setName] = useState('')
  const [text, setText] = useState('')
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [playingId, setPlayingId] = useState('')
  const [editingId, setEditingId] = useState('')
  const [editName, setEditName] = useState('')
  const [editText, setEditText] = useState('')
  const [confirmDelId, setConfirmDelId] = useState('')
  const [busyId, setBusyId] = useState('')

  const list = Array.isArray(refs) ? refs : []

  const handleFilePick = (e) => {
    const picked = e.target.files?.[0] || null
    setFile(picked)
    if (picked && !name.trim()) {
      setName(picked.name.replace(/\.(wav|mp3|m4a)$/i, '').slice(0, 60))
    }
  }

  const handleUpload = async (e) => {
    e.preventDefault()
    if (!file) {
      showToast('请先选择 .wav / .mp3 / .m4a 音频文件')
      return
    }
    if (file.size > MAX_BYTES) {
      showToast('参考音不能超过 10 MB')
      return
    }
    if (!name.trim()) {
      showToast('请填写参考音名称')
      return
    }
    setUploading(true)
    try {
      const dataBase64 = await new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => {
          const raw = String(reader.result || '')
          resolve(raw.includes(',') ? raw.split(',')[1] : raw)
        }
        reader.onerror = () => reject(new Error('读取本地文件失败'))
        reader.readAsDataURL(file)
      })
      const res = await uploadRefApi({
        name: name.trim(),
        filename: file.name,
        dataBase64,
        text: text.trim(),
      })
      onRefsChange?.(res.refs || [])
      setName('')
      setText('')
      setFile(null)
      showToast(`已导入参考音 · ${res.item?.name || file.name}`)
    } catch (err) {
      showToast(`上传失败：${String(err?.message || err)}`)
    } finally {
      setUploading(false)
    }
  }

  const beginEdit = (item) => {
    setEditingId(item.id)
    setEditName(item.name || '')
    setEditText(item.text || '')
    setConfirmDelId('')
  }

  const saveEdit = async (id) => {
    setBusyId(id)
    try {
      const res = await updateRefApi(id, { name: editName, text: editText })
      onRefsChange?.(res.refs || [])
      setEditingId('')
      showToast('参考音信息已更新')
    } catch (err) {
      showToast(`更新失败：${String(err?.message || err)}`)
    } finally {
      setBusyId('')
    }
  }

  const removeCustom = async (id) => {
    setBusyId(id)
    try {
      const res = await deleteRefApi(id)
      onRefsChange?.(res.refs || [])
      setConfirmDelId('')
      if (playingId === id) setPlayingId('')
      showToast('参考音已删除')
    } catch (err) {
      showToast(`删除失败：${String(err?.message || err)}`)
    } finally {
      setBusyId('')
    }
  }

  return (
    <div className="ref-lib">
      <div className="ref-list">
        {list.map((it) => {
          const isEditing = editingId === it.id
          const isConfirmDel = confirmDelId === it.id
          return (
            <div key={it.id} className={`ref-row${it.exists ? '' : ' is-missing'}`}>
              <div className="ref-top">
                <span className={`tag ${it.builtin ? 'tape' : 'cloud'}`}>
                  {it.builtin ? '内置' : '自定义'}
                </span>
                <b>{it.name}</b>
                <span className="mono ref-meta">
                  {it.durationSec ? `${it.durationSec}s` : it.ext || ''}
                  {it.sampleRate ? ` · ${Math.round(it.sampleRate / 1000)}kHz` : ''}
                  {!it.exists ? ' · 文件缺失' : ''}
                </span>
                <div className="ref-acts">
                  {it.exists ? (
                    <button
                      className="btn btn--sm"
                      type="button"
                      onClick={() => setPlayingId(playingId === it.id ? '' : it.id)}
                    >
                      {playingId === it.id ? '收起试听' : '播放样本'}
                    </button>
                  ) : null}
                  {!it.builtin ? (
                    <>
                      <button className="btn btn--sm" type="button" onClick={() => beginEdit(it)}>
                        编辑
                      </button>
                      {isConfirmDel ? (
                        <>
                          <button
                            className="btn btn--sm btn--tape"
                            type="button"
                            disabled={busyId === it.id}
                            onClick={() => removeCustom(it.id)}
                          >
                            确认删
                          </button>
                          <button className="btn btn--sm" type="button" onClick={() => setConfirmDelId('')}>
                            取消
                          </button>
                        </>
                      ) : (
                        <button className="btn btn--sm" type="button" onClick={() => setConfirmDelId(it.id)}>
                          删除
                        </button>
                      )}
                    </>
                  ) : null}
                </div>
              </div>

              {isEditing ? (
                <div className="ref-edit">
                  <input
                    className="input"
                    value={editName}
                    placeholder="名称"
                    onChange={(e) => setEditName(e.target.value)}
                  />
                  <textarea
                    className="input"
                    rows={2}
                    value={editText}
                    placeholder="逐字参考文本（本地 Qwen3-TTS 必填）"
                    onChange={(e) => setEditText(e.target.value)}
                  />
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      className="btn btn--sm btn--tape"
                      type="button"
                      disabled={busyId === it.id}
                      onClick={() => saveEdit(it.id)}
                    >
                      保存
                    </button>
                    <button className="btn btn--sm" type="button" onClick={() => setEditingId('')}>
                      取消
                    </button>
                  </div>
                </div>
              ) : (
                <div className="ref-text">
                  {it.text ? `逐字文本：「${it.text}」` : '未填逐字参考文本（仅 MiMo 克隆可用，本地引擎需补充）'}
                </div>
              )}

              {Array.isArray(it.warnings) && it.warnings.length ? (
                <div className="ref-warns">
                  {it.warnings.map((w, idx) => <span key={idx} className="tag grease">{w}</span>)}
                </div>
              ) : null}

              {playingId === it.id ? (
                <audio
                  className="ref-audio"
                  controls
                  autoPlay
                  src={refAudioUrl(it.id)}
                />
              ) : null}
            </div>
          )
        })}
      </div>

      <form className="ref-upload" onSubmit={handleUpload}>
        <div className="fl" style={{ marginBottom: 4 }}>
          <b>上传自定义参考音</b>
          <i>.WAV / .MP3 / .M4A · ≤ 10MB（推荐 5–15 秒纯净人声）</i>
        </div>
        <div className="ref-up-grid">
          <input className="input" type="file" accept=".wav,.mp3,.m4a,audio/wav,audio/mpeg,audio/mp4" onChange={handleFilePick} />
          <input
            className="input"
            value={name}
            placeholder="音色名称（如：沧桑老者）"
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <textarea
          className="input"
          rows={2}
          value={text}
          placeholder="音频对应的逐字文本（本地引擎必填；MiMo 克隆可留空）"
          onChange={(e) => setText(e.target.value)}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button className="btn btn--sm btn--tape" type="submit" disabled={uploading}>
            {uploading ? '上传中…' : '上传并加入音库'}
          </button>
          <span className="hint" style={{ margin: 0 }}>
            上传后同时可用于本地 Qwen3-TTS、Hybrid 启动与 MiMo 声音克隆。
          </span>
        </div>
      </form>
    </div>
  )
}
