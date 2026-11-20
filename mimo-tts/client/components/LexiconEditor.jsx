import React, { useRef, useState } from 'react'
import { exportRulesCsv, exportRulesJson, importRulesFromText } from '../../src/lexicon.mjs'
import { previewTextApi } from '../api.js'
import { ROLE_CN } from '../constants.js'
import { download } from '../delivery.js'
import { Toggle } from './Primitives.jsx'

const DEFAULT_TEST_TEXT = '====\n夜深了，“Lv.9 怪兽来了！别在血泊里埋怨，去包扎创伤！”单于低声提醒。\nPS：求月票，明天三更！'

export function LexiconEditor({
  enabled,
  polyphoneEnabled = true,
  disabledPresets = [],
  items,
  presets,
  polyphonePresets = [],
  maxSegmentChars,
  onToggle,
  onTogglePolyphone,
  onChangeDisabledPresets,
  onChangeItems,
  showToast,
}) {
  const [sampleText, setSampleText] = useState(DEFAULT_TEST_TEXT)
  const [debugOut, setDebugOut] = useState(null)
  const [debugErr, setDebugErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [showPolyTable, setShowPolyTable] = useState(false)
  const importInputRef = useRef(null)

  const list = Array.isArray(items) ? items : []
  const presetList = Array.isArray(presets) ? presets : []
  const polyList = Array.isArray(polyphonePresets) ? polyphonePresets : []
  const disabledSet = new Set(Array.isArray(disabledPresets) ? disabledPresets : [])

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

  const toggleBuiltinPoly = (id) => {
    if (!onChangeDisabledPresets) return
    const next = new Set(disabledSet)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    onChangeDisabledPresets([...next])
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
        textRules: {
          enabled: Boolean(enabled),
          polyphoneEnabled: Boolean(polyphoneEnabled),
          disabledPresets: [...disabledSet],
          items: list,
        },
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

  const handleExport = (fmt) => {
    const activeBuiltins = polyphoneEnabled
      ? polyList.filter((p) => !disabledSet.has(p.id))
      : []
    const combined = [...list, ...activeBuiltins]
    const content = fmt === 'csv' ? exportRulesCsv(combined) : exportRulesJson(combined)
    const filename = fmt === 'csv' ? 'audiobook-lexicon-rules.csv' : 'audiobook-lexicon-rules.json'
    const mime = fmt === 'csv' ? 'text/csv;charset=utf-8' : 'application/json;charset=utf-8'
    const ok = download(filename, content, mime)
    showToast(ok ? `已导出 ${combined.length} 条规则（${fmt.toUpperCase()}）` : '浏览器拦截了下载')
  }

  const handleImportFile = (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const fmt = file.name.toLowerCase().endsWith('.json') ? 'json' : 'auto'
      const { items: imported, problems } = importRulesFromText(String(reader.result || ''), fmt)
      if (problems.length) {
        showToast(`导入校验失败：${problems[0]}`)
        return
      }
      const merged = list.slice()
      let added = 0
      for (const item of imported) {
        const dup = merged.some((r) => r.pattern === item.pattern && (r.scope || 'all') === (item.scope || 'all'))
        if (!dup) {
          merged.push(item)
          added++
        }
      }
      onChangeItems(merged)
      showToast(`已导入 ${added} 条规则（跳过重复 ${imported.length - added} 条，保存后生效）`)
    }
    reader.onerror = () => showToast('读取规则文件失败')
    reader.readAsText(file)
  }

  const activePolyCount = polyList.filter((p) => !disabledSet.has(p.id)).length

  return (
    <div className="lex-box">
      <div className="ctrl-row">
        <div className="cl">
          <b>启用发音与断句替换</b>
          <i>LEXICON &amp; CLEANUP</i>
        </div>
        <Toggle label="启用文本替换规则" checked={Boolean(enabled)} onChange={onToggle} />
      </div>

      <div className="ctrl-row">
        <div className="cl">
          <b>内置多音字读音纠正词表（按词匹配 · 默认启用）</b>
          <i>{`POLYPHONE PRESET · ${polyphoneEnabled ? `启用 ${activePolyCount}/${polyList.length} 词` : '已停用'}`}</i>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {polyList.length > 0 ? (
            <button
              className="btn btn--sm"
              type="button"
              onClick={() => setShowPolyTable((v) => !v)}
            >
              {showPolyTable ? '收起词表' : `查看/微调 (${activePolyCount})`}
            </button>
          ) : null}
          {onTogglePolyphone ? (
            <Toggle label="内置多音字读音纠正" checked={Boolean(polyphoneEnabled)} onChange={onTogglePolyphone} />
          ) : null}
        </div>
      </div>

      {showPolyTable && polyList.length > 0 ? (
        <div className="lex-presets" style={{ padding: '6px 8px', background: 'var(--panel)', border: '1px solid var(--line)' }}>
          {polyList.map((p) => {
            const on = !disabledSet.has(p.id)
            return (
              <button
                key={p.id}
                type="button"
                className="chip"
                aria-pressed={String(on)}
                title={on ? '点击临时停用该内置词条' : '点击重新启用该内置词条'}
                onClick={() => toggleBuiltinPoly(p.id)}
              >
                {on ? '✓ ' : '○ '}
                {p.pattern} → {p.replace}
              </button>
            )
          })}
        </div>
      ) : null}

      <div className="lex-presets">
        <span className="silk">常用清洗预设</span>
        {presetList.map((p) => (
          <button key={p.id} className="btn btn--sm" type="button" onClick={() => addPreset(p)}>
            + {p.name}
          </button>
        ))}
        <span style={{ marginLeft: 'auto', display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          <input
            ref={importInputRef}
            type="file"
            accept=".json,.csv,application/json,text/csv"
            style={{ display: 'none' }}
            onChange={handleImportFile}
          />
          <button className="btn btn--sm" type="button" onClick={() => importInputRef.current?.click()}>
            导入 JSON/CSV
          </button>
          <button className="btn btn--sm" type="button" onClick={() => handleExport('csv')}>
            导出 CSV
          </button>
          <button className="btn btn--sm" type="button" onClick={() => handleExport('json')}>
            导出 JSON
          </button>
          <button className="btn btn--sm btn--tape" type="button" onClick={addEmpty}>
            + 新增规则
          </button>
        </span>
      </div>

      {list.length === 0 ? (
        <div className="dirty-empty">暂未添加自定义规则（内置多音字词表已在生效中，也可点击上方清洗预设或「+ 新增规则」）</div>
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
            {debugOut.afterText && debugOut.afterText !== debugOut.originalText ? (
              <div className="mono" style={{ fontSize: 11, color: 'var(--tape-2)', background: 'var(--panel-2)', padding: '4px 6px', border: '1px dashed var(--line)' }}>
                {`替换结果：${debugOut.afterText}`}
              </div>
            ) : null}
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
