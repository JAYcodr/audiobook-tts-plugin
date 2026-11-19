import React, { useState } from 'react'
import { previewTextApi } from '../api.js'
import { ROLE_CN } from '../constants.js'
import { Toggle } from './Primitives.jsx'

const DEFAULT_TEST_TEXT = '====\n夜深了，“Lv.9 怪兽来了！别碰那块五行石！”他压低声音提醒。\nPS：求月票，明天三更！'

export function LexiconEditor({
  enabled, items, presets, maxSegmentChars, onToggle, onChangeItems, showToast,
}) {
  const [sampleText, setSampleText] = useState(DEFAULT_TEST_TEXT)
  const [debugOut, setDebugOut] = useState(null)
  const [debugErr, setDebugErr] = useState('')
  const [busy, setBusy] = useState(false)

  const list = Array.isArray(items) ? items : []
  const presetList = Array.isArray(presets) ? presets : []

  const addEmpty = () => {
    onChangeItems([
      ...list,
      {
        id: `rule:${Date.now().toString(36)}`,
        name: '新规则',
        pattern: '',
        replace: '',
        regex: false,
        flags: 'g',
        scope: 'all',
        enabled: true,
      },
    ])
  }

  const addPreset = (preset) => {
    const exists = list.some((r) => (preset.id && r.id === preset.id) || (r.pattern === preset.pattern && r.scope === preset.scope))
    if (exists) {
      showToast(`已包含预设：${preset.name}`)
      return
    }
    onChangeItems([...list, { ...preset }])
    showToast(`已添加：${preset.name}`)
  }

  const updateRow = (idx, patch) => {
    onChangeItems(list.map((it, i) => (i === idx ? { ...it, ...patch } : it)))
  }

  const removeRow = (idx) => {
    onChangeItems(list.filter((_, i) => i !== idx))
  }

  const moveRow = (idx, dir) => {
    const nextIdx = idx + dir
    if (nextIdx < 0 || nextIdx >= list.length) return
    const next = list.slice()
    const [picked] = next.splice(idx, 1)
    next.splice(nextIdx, 0, picked)
    onChangeItems(next)
  }

  const runDebug = async () => {
    setBusy(true)
    setDebugErr('')
    try {
      const res = await previewTextApi({
        text: sampleText,
        textRules: { enabled: Boolean(enabled), items: list },
        maxSegmentChars: Number(maxSegmentChars) || 100,
      })
      setDebugOut(res)
    } catch (err) {
      setDebugErr(String(err?.message || err))
      setDebugOut(null)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="lex-box">
      <div className="ctrl-row">
        <div className="cl">
          <b>启用发音与断句替换</b>
          <i>LEXICON & CLEANUP</i>
        </div>
        <Toggle label="启用文本替换规则" checked={Boolean(enabled)} onChange={onToggle} />
      </div>

      <div className="lex-presets">
        <span className="silk">常用预设</span>
        {presetList.map((p) => (
          <button key={p.id} className="btn btn--sm" type="button" onClick={() => addPreset(p)}>
            + {p.name}
          </button>
        ))}
        <button className="btn btn--sm btn--tape" type="button" style={{ marginLeft: 'auto' }} onClick={addEmpty}>
          + 新增规则
        </button>
      </div>

      {list.length === 0 ? (
        <div className="dirty-empty">暂未添加规则，可点击上方常用预设或「+ 新增规则」</div>
      ) : (
        <div className="lex-list">
          {list.map((r, idx) => (
            <div key={r.id || idx} className={`lex-row${r.enabled === false ? ' is-off' : ''}`}>
              <div className="lex-row-top">
                <label className="mono" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11 }}>
                  <input
                    type="checkbox"
                    checked={r.enabled !== false}
                    onChange={(e) => updateRow(idx, { enabled: e.target.checked })}
                  />
                  启用
                </label>
                <input
                  className="input"
                  value={r.name || ''}
                  placeholder="规则名称"
                  onChange={(e) => updateRow(idx, { name: e.target.value })}
                />
                <select
                  className="input"
                  style={{ width: 92, flex: 'none' }}
                  value={r.scope || 'all'}
                  onChange={(e) => updateRow(idx, { scope: e.target.value })}
                >
                  <option value="all">全部 (切分前)</option>
                  <option value="narrator">仅旁白</option>
                  <option value="dialogue">仅对话</option>
                </select>
                <button
                  type="button"
                  className="btn btn--sm"
                  aria-pressed={String(Boolean(r.regex))}
                  onClick={() => updateRow(idx, { regex: !r.regex })}
                >
                  {r.regex ? '正则' : '字面'}
                </button>
                <button className="btn btn--sm" type="button" disabled={idx === 0} onClick={() => moveRow(idx, -1)}>↑</button>
                <button className="btn btn--sm" type="button" disabled={idx === list.length - 1} onClick={() => moveRow(idx, 1)}>↓</button>
                <button className="btn btn--sm" type="button" onClick={() => removeRow(idx)}>删除</button>
              </div>
              <div className="lex-row-pair">
                <input
                  className="input"
                  value={r.pattern || ''}
                  placeholder={r.regex ? '正则表达式（≤200 字，禁止嵌套量词）' : '原文本匹配内容'}
                  spellCheck={false}
                  onChange={(e) => updateRow(idx, { pattern: e.target.value })}
                />
                <span className="mono" style={{ color: 'var(--ink-3)', alignSelf: 'center' }}>→</span>
                <input
                  className="input"
                  value={r.replace || ''}
                  placeholder="替换为（留空即删除）"
                  spellCheck={false}
                  onChange={(e) => updateRow(idx, { replace: e.target.value })}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="lex-debug">
        <div className="ds-hd">
          <span className="silk">LIVE DEBUGGER <b>原文 → 替换后 + 分段预览</b></span>
          <button className="btn btn--sm btn--tape" type="button" disabled={busy} onClick={runDebug}>
            {busy ? '测试中…' : '实时切分调试'}
          </button>
        </div>
        <textarea
          className="input"
          rows={3}
          value={sampleText}
          onChange={(e) => setSampleText(e.target.value)}
        />
        {debugErr ? <div className="tag grease">{debugErr}</div> : null}
        {debugOut ? (
          <div className="lex-result">
            <div className="mono" style={{ fontSize: 11, color: 'var(--ink-2)' }}>
              原文 {debugOut.stats?.originalChars || 0} 字 → 替换后 {debugOut.stats?.afterChars || 0} 字 · 共 {debugOut.stats?.segmentCount || 0} 段
            </div>
            <div className="lex-segs">
              {(debugOut.segments || []).map((s, i) => (
                <div key={i} className="lex-seg">
                  <span className={`tag ${s.role === 'dialogue' ? 'grease' : 'tape'}`}>
                    {ROLE_CN[s.role] || s.role}
                  </span>
                  <span>{s.text}</span>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
