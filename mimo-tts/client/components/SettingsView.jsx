import React, { useMemo, useState } from 'react'
import { buildDraftSnapshot, fmtDirtyVal } from '../config-draft.js'
import { fmtBytes, fmtInt, localStateText, ttlText } from '../format.js'
import { LexiconEditor } from './LexiconEditor.jsx'
import { PreviewPlayer } from './PreviewPlayer.jsx'
import { Chips, Field, Input, Knob, Rowx, Seg, Textarea, Toggle } from './Primitives.jsx'
import { RefVoiceLibrary } from './RefVoiceLibrary.jsx'

function settingsChainValue(live, draft) {
  const cache = live?.cache || {}
  return {
    cache: `${fmtInt(cache.entries)} / ${fmtInt(cache.maxEntries)}`,
    engine: String(draft?.['upstream.provider'] || 'mimo'),
    concurrency: String(draft?.['synth.concurrency'] || '4'),
  }
}

function scrollToModule(id) {
  const el = document.getElementById(id)
  if (!el) return
  const reduced = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches
  el.scrollIntoView({ block: 'start', behavior: reduced ? 'auto' : 'smooth' })
}

const NAV_GROUPS = [
  {
    title: '一 · 引擎与服务',
    items: [
      ['mod-engine', '01', '引擎与接入'],
      ['mod-local', '02', '本地 Qwen3'],
      ['mod-openai', '03', 'OpenAI 兼容'],
    ],
  },
  {
    title: '二 · 音色与参考音库',
    items: [
      ['mod-voice', '04', '方案 / 音色 / 试听'],
      ['mod-refs', '05', '参考音库'],
    ],
  },
  {
    title: '三 · 文本与合成',
    items: [
      ['mod-lexicon', '06', '发音 / 断句规则'],
      ['mod-synth', '07', '切分 / 缓存'],
    ],
  },
  {
    title: '四 · 交付与安全',
    items: [
      ['mod-transport', '08', '端口 / Legado'],
      ['mod-auth', '09', '鉴权 / 日志'],
    ],
  },
]

function RoleVoiceCard({
  roleKey, label, sub, provider, d, onSet, presetVoices, refsList,
}) {
  const modePath = `voices.${roleKey}.mode`
  const voicePath = `voices.${roleKey}.voice`
  const stylePath = `voices.${roleKey}.style`
  const refPath = `voices.${roleKey}.refId`
  const mode = d[modePath] || 'preset'

  return (
    <div className="role-card">
      <div className="role-card-hd">
        <b>{label} <i>{sub}</i></b>
        {provider === 'mimo' ? (
          <Seg
            options={[
              { value: 'preset', label: '预置' },
              { value: 'design', label: '文字造音' },
              { value: 'clone', label: '克隆' },
            ]}
            value={mode}
            ariaLabel={`${label}模式`}
            onChange={(v) => onSet(modePath, v)}
          />
        ) : (
          <span className="tag">{provider === 'openai' ? 'OpenAI 音色在上方设置' : `MiMo ${mode}`}</span>
        )}
      </div>

      {mode === 'preset' ? (
        <>
          <div className="field">
            <span className="fl">预置音色 <i>PRESET</i></span>
            <Chips options={presetVoices} value={d[voicePath]} ariaLabel={`${label}音色`} onChange={(v) => onSet(voicePath, v)} />
          </div>
          <Field label="自然语言风格" sub="STYLE">
            <Input value={d[stylePath]} onChange={(v) => onSet(stylePath, v)} placeholder="如：温润端庄的中文女声，吐字清晰" />
          </Field>
        </>
      ) : null}

      {mode === 'design' ? (
        <Field label="音色描述（mimo-v2.5-tts-voicedesign）" sub="必填 STYLE">
          <Textarea
            value={d[stylePath]}
            rows={2}
            placeholder="详细描述性别、年龄、音色与情绪，例如：声音清润温柔的年轻说书女声，从容舒缓"
            onChange={(v) => onSet(stylePath, v)}
          />
        </Field>
      ) : null}

      {mode === 'clone' ? (
        <>
          <Field label="从统一参考音库选择" sub="REF ID">
            <select className="input" value={d[refPath] || ''} onChange={(e) => onSet(refPath, e.target.value)}>
              <option value="">-- 使用下方手动路径 --</option>
              {refsList.map((r) => (
                <option key={r.id} value={r.id}>
                  {`${r.name}${r.durationSec ? ` (${r.durationSec}s)` : ''}${r.builtin ? ' [内置]' : ''}`}
                </option>
              ))}
            </select>
          </Field>
          {!d[refPath] ? (
            <Field label="或填写音频路径 / URL（支持 ~/）" sub="VOICE FILE">
              <Input
                value={d[voicePath]}
                spellCheck={false}
                placeholder="~/voices/sample.wav"
                onChange={(v) => onSet(voicePath, v)}
              />
            </Field>
          ) : null}
        </>
      ) : null}
    </div>
  )
}

export function SettingsView({
  live, localInfo, draft, applied, changes, presetVoices, builtinVoiceProfiles,
  builtinRulePresets, refs, onRefsChange, onOpenSetup,
  saving, savedAt, onSet, onSetBatch, onSave, onRevert, onExportConfig, showToast,
}) {
  const [expandLocal, setExpandLocal] = useState(false)
  const [expandOpenai, setExpandOpenai] = useState(false)
  const [newProfileName, setNewProfileName] = useState('')

  const d = draft || applied || {}
  const provider = String(d['upstream.provider'] || 'mimo')
  const dirty = (path) => changes.some((c) => c.path === path)
  const moduleDirty = (name) => changes.some((c) => c.module === name)
  const set = (path) => (value) => onSet(path, value)
  const chain = settingsChainValue(live, d)
  const refsList = Array.isArray(refs) ? refs : []

  const draftPatch = useMemo(() => buildDraftSnapshot(d), [d])

  const allProfiles = useMemo(() => {
    const builtins = Array.isArray(builtinVoiceProfiles) ? builtinVoiceProfiles : []
    const custom = Array.isArray(d['voiceProfiles.items']) ? d['voiceProfiles.items'] : []
    return [...builtins, ...custom]
  }, [builtinVoiceProfiles, d['voiceProfiles.items']])

  const input = (path, opts = {}) => <Input value={d[path]} onChange={set(path)} {...opts} />
  const knob = (path, label, min, max, step, unit, ariaLabel) => (
    <Knob
      key={path}
      label={label}
      value={d[path]}
      min={min}
      max={max}
      step={step}
      unit={unit}
      ariaLabel={ariaLabel}
      dirty={dirty(path)}
      onChange={(v) => onSet(path, String(v))}
    />
  )
  const toggle = (path, label) => <Toggle label={label} checked={Boolean(d[path])} onChange={(v) => onSet(path, v)} />
  const twoCol = (...children) => (
    <div className="field" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
      {children}
    </div>
  )

  const moduleShell = (id, no, title, silk, name, children, opts = {}) => (
    <div className={`module${opts.wide ? ' module--wide' : ''}${moduleDirty(name) ? ' is-dirty' : ''}`} id={id} data-module="true">
      <div className="module-hd">
        <span className="mh">
          <span className="mnum">{no}</span>
          <b>{title}</b>
          <span className="silk">{silk}</span>
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {opts.right}
          <span className="dirty-dot" title="有未保存改动" />
        </div>
      </div>
      {children}
    </div>
  )

  const localActive = provider === 'local' || provider === 'hybrid'
  const showLocalBody = localActive || expandLocal || moduleDirty('local')
  const openaiActive = provider === 'openai'
  const showOpenaiBody = openaiActive || expandOpenai || moduleDirty('openai')
  const localTag = !localInfo?.enabled ? '随渲染来源切换' : localStateText(localInfo)

  const applyVoiceProfile = (profileId) => {
    const prof = allProfiles.find((p) => p.id === profileId)
    if (!prof) return
    const nextMap = { 'voiceProfiles.active': prof.id }
    for (const role of ['narrator', 'dialogue']) {
      const v = prof.voices?.[role]
      if (v) {
        nextMap[`voices.${role}.mode`] = v.mode || 'preset'
        nextMap[`voices.${role}.voice`] = v.voice || ''
        nextMap[`voices.${role}.style`] = v.style || ''
        nextMap[`voices.${role}.refId`] = v.refId || ''
      }
      const lr = prof.localRefs?.[role]
      if (lr) {
        nextMap[`upstream.local.refs.${role}.refId`] = lr.refId || ''
        nextMap[`upstream.local.refs.${role}.wav`] = lr.wav || ''
        nextMap[`upstream.local.refs.${role}.text`] = lr.text || ''
      }
    }
    onSetBatch(nextMap)
    showToast(`已载入音色方案：${prof.name}（保存后持久化）`)
  }

  const saveCurrentProfile = () => {
    const cleanName = newProfileName.trim()
    if (!cleanName) {
      showToast('请输入新方案名称')
      return
    }
    const id = `custom:${Date.now().toString(36)}`
    const nextItem = {
      id,
      name: cleanName,
      builtin: false,
      voices: {
        narrator: {
          mode: d['voices.narrator.mode'] || 'preset',
          voice: d['voices.narrator.voice'] || '',
          style: d['voices.narrator.style'] || '',
          refId: d['voices.narrator.refId'] || '',
        },
        dialogue: {
          mode: d['voices.dialogue.mode'] || 'preset',
          voice: d['voices.dialogue.voice'] || '',
          style: d['voices.dialogue.style'] || '',
          refId: d['voices.dialogue.refId'] || '',
        },
      },
      localRefs: {
        narrator: {
          refId: d['upstream.local.refs.narrator.refId'] || '',
          wav: d['upstream.local.refs.narrator.wav'] || '',
          text: d['upstream.local.refs.narrator.text'] || '',
        },
        dialogue: {
          refId: d['upstream.local.refs.dialogue.refId'] || '',
          wav: d['upstream.local.refs.dialogue.wav'] || '',
          text: d['upstream.local.refs.dialogue.text'] || '',
        },
      },
    }
    const existing = Array.isArray(d['voiceProfiles.items']) ? d['voiceProfiles.items'] : []
    onSetBatch({
      'voiceProfiles.items': [...existing, nextItem],
      'voiceProfiles.active': id,
    })
    setNewProfileName('')
    showToast(`已添加到草稿音色方案：${cleanName}`)
  }

  const deleteCustomProfile = (profileId) => {
    const existing = Array.isArray(d['voiceProfiles.items']) ? d['voiceProfiles.items'] : []
    const nextItems = existing.filter((p) => p.id !== profileId)
    const patch = { 'voiceProfiles.items': nextItems }
    if (d['voiceProfiles.active'] === profileId) patch['voiceProfiles.active'] = 'builtin:story-warm'
    onSetBatch(patch)
    showToast('已从草稿移除自定义音色方案（保存后生效）')
  }

  const assignRefToRole = (roleKey, item) => {
    const roleCn = roleKey === 'dialogue' ? '对话' : '旁白'
    if (provider === 'mimo') {
      onSetBatch({
        [`voices.${roleKey}.mode`]: 'clone',
        [`voices.${roleKey}.refId`]: item.id,
        [`voices.${roleKey}.voice`]: '',
      })
      showToast(`已将「${item.name}」绑定为 MiMo ${roleCn}克隆音色（草稿）`)
      return
    }
    onSetBatch({
      [`upstream.local.refs.${roleKey}.refId`]: item.id,
      [`upstream.local.refs.${roleKey}.wav`]: '',
      [`upstream.local.refs.${roleKey}.text`]: '',
    })
    showToast(`已将「${item.name}」设为本地 ${roleCn}参考音（草稿）`)
  }

  const renderLocalRefPicker = (roleKey, label) => {
    const refPath = `upstream.local.refs.${roleKey}.refId`
    const wavPath = `upstream.local.refs.${roleKey}.wav`
    const textPath = `upstream.local.refs.${roleKey}.text`
    const selected = refsList.find((r) => r.id === d[refPath])
    return (
      <div className="local-ref-slot">
        <Field label={`${label}参考音库选择`} sub="REF">
          <select className="input" value={d[refPath] || ''} onChange={(e) => onSet(refPath, e.target.value)}>
            <option value="">-- 手动填写本地路径（兼容旧配置）--</option>
            {refsList.map((r) => (
              <option key={r.id} value={r.id}>
                {`${r.name}${r.durationSec ? ` (${r.durationSec}s)` : ''}${r.text ? '' : ' [缺文本]'}`}
              </option>
            ))}
          </select>
        </Field>
        {selected ? (
          <div className="mono ref-picked-note">
            已关联：{selected.text ? `「${selected.text}」` : '⚠️ 该样本未填写逐字文本，请在下方参考音库补充'}
          </div>
        ) : (
          twoCol(
            <Field label={`${label}路径`} sub="WAV (支持 ~/)" style={{ padding: 0 }}>{input(wavPath, { spellCheck: false })}</Field>,
            <Field label={`${label}逐字文本`} sub="TEXT" style={{ padding: 0 }}>{input(textPath)}</Field>,
          )
        )}
      </div>
    )
  }

  return (
    <section className="view view--settings" id="view-settings" aria-label="渲染设置">
      <div className="set-grid">
        <div className="set-left">
          <div>
            <h2>渲染设置</h2>
            <div className="sub">Render Rack · 4 Groups</div>
          </div>
          <div className="chain" aria-label="信号链">
            <div className="chain-node"><span className="ld" /><b>正文 + 替换</b> <span className="muted">LEXICON</span></div>
            <div className="chain-link" />
            <div className="chain-node"><span className="ld" /><b>切分</b> <span className="muted">旁白 / 对话</span></div>
            <div className="chain-link" />
            <div className="chain-node"><span className="ld" /><b>并发队列</b> <span className="muted">{`x${chain.concurrency}`}</span></div>
            <div className="chain-link" />
            <div className="chain-node"><span className="ld" /><b>缓存带</b> <span className="muted">{chain.cache}</span></div>
            <div className="chain-link" />
            <div className="chain-node"><span className="ld" /><b>引擎</b> <span className="muted">{chain.engine}</span></div>
          </div>
          <nav className="mod-index" aria-label="模块分组定位">
            {NAV_GROUPS.map((g) => (
              <div key={g.title} className="mod-group-nav">
                <div className="mgn-title">{g.title}</div>
                {g.items.map(([id, no, name]) => (
                  <button key={id} type="button" data-scroll={id} onClick={() => scrollToModule(id)}>
                    <span className="n">{no}</span>
                    {name}
                  </button>
                ))}
              </div>
            ))}
          </nav>
        </div>

        <div className="modules" id="modules">
          <div className="mod-group-hd">
            <span className="silk">GROUP 01 · <b>引擎与服务</b></span>
            <button className="btn btn--sm btn--tape" type="button" onClick={onOpenSetup}>
              打开向导与体检
            </button>
          </div>

          {moduleShell('mod-engine', '01', '渲染来源与云端接入', 'ENGINE', 'engine', [
            <div key="prov" className="ctrl-row">
              <div className="cl"><b>渲染来源</b><i>PROVIDER</i></div>
              <Seg
                options={[
                  { value: 'mimo', label: '云端' },
                  { value: 'local', label: '本地' },
                  { value: 'hybrid', label: '混合' },
                  { value: 'openai', label: 'OpenAI' },
                ]}
                value={provider}
                ariaLabel="渲染来源"
                onChange={(v) => onSet('upstream.provider', v)}
              />
            </div>,
            provider === 'mimo' || provider === 'hybrid' ? (
              <div key="mimo-conn" className="mimo-conn">
                <Field label="MiMo API Key" sub="每行一个 · 保留掩码行可追加">
                  <Textarea
                    value={d['upstream.keys']}
                    rows={2}
                    spellCheck={false}
                    placeholder="sk-…（保留已有掩码行即可追加新 Key）"
                    onChange={set('upstream.keys')}
                  />
                </Field>
                {twoCol(
                  <Field label="云端模型" sub="MODEL" style={{ padding: 0 }}>{input('upstream.model', { spellCheck: false })}</Field>,
                  <Field label="上游地址" sub="BASE URL" style={{ padding: 0 }}>{input('upstream.baseUrl', { spellCheck: false })}</Field>,
                )}
                {twoCol(
                  <Field label="超时 (ms)" sub="TIMEOUT" style={{ padding: 0 }}>{input('upstream.timeoutMs', { type: 'number' })}</Field>,
                  <Field label="重试次数" sub="RETRY" style={{ padding: 0 }}>{input('upstream.maxRetry', { type: 'number' })}</Field>,
                )}
              </div>
            ) : null,
            provider === 'hybrid' ? (
              <div key="hy-box">
                <div className="knob-row">
                  {knob('upstream.hybrid.maxCloudBootstrap', '云顶班', 0, 30, 1, '段', '云顶班上限（段）')}
                  {knob('upstream.hybrid.cloudConcurrency', '云并发', 1, 2, 1, '路', '云并发（路）')}
                  <div className="knob-wrap" data-label="本地预热">
                    <span className="kl">本地预热</span>
                    {toggle('upstream.hybrid.warmup', '本地预热')}
                  </div>
                </div>
                <Field label="目标响度" sub="RMS">{input('upstream.hybrid.targetRms', { inputMode: 'decimal', type: 'text' })}</Field>
              </div>
            ) : null,
          ], {
            wide: true,
          })}

          {moduleShell('mod-local', '02', '本地引擎 (Qwen3-TTS MLX)', localActive ? 'ACTIVE' : 'COLLAPSED', 'local', showLocalBody ? [
            <div key="st" className="ctrl-row">
              <div className="cl"><b>引擎进程状态</b><i>{localTag}</i></div>
              <button className="btn btn--sm" type="button" onClick={onOpenSetup}>自动探测 / 安装</button>
            </div>,
            <Field key="py" label="Python (支持 ~/)" sub="VENV">{input('upstream.local.pythonPath', { spellCheck: false, placeholder: '~/.dsh/plugin-data/audiobook-tts-plugin/venv/bin/python' })}</Field>,
            <Field key="md" label="模型目录 (支持 ~/)" sub="MLX MODEL">{input('upstream.local.modelPath', { spellCheck: false, placeholder: '~/.dsh/plugin-data/audiobook-tts-plugin/models/qwen3tts-0.6b-base-8bit' })}</Field>,
            <Field key="sc" label="Sidecar 脚本（留空用内置）" sub="SERVER">{input('upstream.local.serverScript', { spellCheck: false })}</Field>,
            twoCol(
              <Field key="lp" label="端口" sub="PORT" style={{ padding: 0 }}>{input('upstream.local.port', { type: 'number' })}</Field>,
              <Field label="启动超时" sub="MS" style={{ padding: 0 }}>{input('upstream.local.startupTimeoutMs', { type: 'number' })}</Field>,
            ),
            <div key="idle" className="knob-row">
              {knob('upstream.local.idleUnloadSeconds', '空闲卸载', 0, 3600, 30, 's', '空闲卸载（秒，0=常驻）')}
              <Field label="请求超时" sub="MS" style={{ flex: '1', padding: 0 }}>
                {input('upstream.local.requestTimeoutMs', { type: 'number' })}
              </Field>
            </div>,
            <div key="nr">{renderLocalRefPicker('narrator', '旁白')}</div>,
            <div key="dr">{renderLocalRefPicker('dialogue', '对话（可选）')}</div>,
          ] : (
            <div key="col-loc" className="collapsed-note">
              <span>当前渲染来源为「{provider}」，本地 Qwen3-TTS 参数已折叠。</span>
              <button className="btn btn--sm" type="button" onClick={() => setExpandLocal(true)}>展开查看</button>
            </div>
          ), {
            right: !localActive && showLocalBody ? (
              <button className="btn btn--sm btn--ghost" type="button" onClick={() => setExpandLocal(false)}>收起</button>
            ) : null,
          })}

          {moduleShell('mod-openai', '03', 'OpenAI 兼容引擎', openaiActive ? 'ACTIVE' : 'COLLAPSED', 'openai', showOpenaiBody ? [
            <Field key="oab" label="接口地址" sub="BASE URL">{input('upstream.openai.baseUrl', { spellCheck: false, placeholder: 'http://127.0.0.1:8880/v1' })}</Field>,
            <Field key="oak" label="API Key" sub="可选 · 已掩码">{input('upstream.openai.apiKey', { spellCheck: false, placeholder: '本地 Kokoro/Edge-TTS 可留空' })}</Field>,
            twoCol(
              <Field key="oam" label="模型" sub="MODEL" style={{ padding: 0 }}>{input('upstream.openai.model', { spellCheck: false, placeholder: 'tts-1 / kokoro' })}</Field>,
              <Field key="oas" label="语速" sub="0.25–4.0" style={{ padding: 0 }}>{input('upstream.openai.speed', { type: 'number', step: '0.05' })}</Field>,
            ),
            twoCol(
              <Field key="oan" label="旁白音色" sub="NARRATOR" style={{ padding: 0 }}>{input('upstream.openai.narratorVoice', { spellCheck: false })}</Field>,
              <Field key="oad" label="对话音色" sub="DIALOGUE" style={{ padding: 0 }}>{input('upstream.openai.dialogueVoice', { spellCheck: false })}</Field>,
            ),
            <div key="oaf" className="ctrl-row">
              <div className="cl"><b>返回格式</b><i>FORMAT</i></div>
              <Seg
                options={[
                  { value: 'wav', label: 'WAV' },
                  { value: 'pcm', label: 'PCM (24k)' },
                ]}
                value={d['upstream.openai.responseFormat']}
                ariaLabel="OpenAI 响应格式"
                onChange={(v) => onSet('upstream.openai.responseFormat', v)}
              />
            </div>,
            <Field key="oai" label="风格指令" sub="INSTRUCTIONS · 可选">{input('upstream.openai.instructions', { placeholder: '如：沉稳温柔地朗读小说' })}</Field>,
          ] : (
            <div key="col-oa" className="collapsed-note">
              <span>当前未启用 OpenAI / Kokoro / Edge-TTS 兼容协议。</span>
              <button className="btn btn--sm" type="button" onClick={() => setExpandOpenai(true)}>展开查看</button>
            </div>
          ), {
            right: !openaiActive && showOpenaiBody ? (
              <button className="btn btn--sm btn--ghost" type="button" onClick={() => setExpandOpenai(false)}>收起</button>
            ) : null,
          })}

          <div className="mod-group-hd">
            <span className="silk">GROUP 02 · <b>音色方案、统一参考音库与试听</b></span>
          </div>

          {moduleShell('mod-voice', '04', '音色预设方案与 MiMo 三模式 / 草稿试听', 'VOICE & PROFILES', 'voice', [
            <div key="vp" className="vp-bar">
              <span className="silk">一键音色方案</span>
              <div className="vp-chips">
                {allProfiles.map((p) => (
                  <span key={p.id} className="vp-chip-wrap">
                    <button
                      type="button"
                      className="chip"
                      aria-pressed={String(d['voiceProfiles.active'] === p.id)}
                      onClick={() => applyVoiceProfile(p.id)}
                    >
                      {p.name}
                    </button>
                    {!p.builtin ? (
                      <button
                        type="button"
                        className="chip vp-del"
                        title={`删除自定义方案：${p.name}`}
                        aria-label={`删除 ${p.name}`}
                        onClick={() => deleteCustomProfile(p.id)}
                      >
                        ×
                      </button>
                    ) : null}
                  </span>
                ))}
              </div>
              <div className="vp-save">
                <input
                  className="input"
                  value={newProfileName}
                  placeholder="新方案名（保存当前旁白+对话组合）"
                  onChange={(e) => setNewProfileName(e.target.value)}
                />
                <button className="btn btn--sm" type="button" onClick={saveCurrentProfile}>
                  存为方案
                </button>
              </div>
            </div>,
            <div key="roles" className="role-grid">
              <RoleVoiceCard
                roleKey="narrator"
                label="旁白"
                sub="NARRATOR"
                provider={provider}
                d={d}
                onSet={onSet}
                presetVoices={presetVoices}
                refsList={refsList}
              />
              <RoleVoiceCard
                roleKey="dialogue"
                label="对话"
                sub="DIALOGUE"
                provider={provider}
                d={d}
                onSet={onSet}
                presetVoices={presetVoices}
                refsList={refsList}
              />
            </div>,
            <PreviewPlayer
              key="pv"
              draftPatch={draftPatch}
              showToast={showToast}
              defaultRole="narrator"
              title="PREVIEW DRAFT · 未保存草稿交互试听"
            />,
          ], { wide: true })}

          {moduleShell('mod-refs', '05', '统一参考音库', 'UNIFIED REF LIBRARY', 'refs', [
            <RefVoiceLibrary
              key="rl"
              refs={refsList}
              onRefsChange={onRefsChange}
              onAssignRef={assignRefToRole}
              showToast={showToast}
            />,
          ], { wide: true })}

          <div className="mod-group-hd">
            <span className="silk">GROUP 03 · <b>文本规则、切分与缓存</b></span>
          </div>

          {moduleShell('mod-lexicon', '06', '文本发音与断句规则', 'LEXICON', 'lexicon', [
            <LexiconEditor
              key="lx"
              enabled={Boolean(d['textRules.enabled'])}
              items={d['textRules.items']}
              presets={builtinRulePresets}
              maxSegmentChars={d['synth.maxSegmentChars']}
              onToggle={(val) => onSet('textRules.enabled', val)}
              onChangeItems={(items) => onSet('textRules.items', items)}
              showToast={showToast}
            />,
          ], { wide: true })}

          {moduleShell('mod-synth', '07', '合成与缓存', 'SYNTH · CACHE', 'synth', [
            <div key="scols" className="synth-cols">
              <div>
                <div className="knob-row">
                  {knob('synth.concurrency', '并发', 1, 8, 1, '路', '合成并发（路）')}
                  {knob('synth.maxSegmentChars', '每段字数', 10, 300, 10, '字', '每段最大字数')}
                  {knob('limits.rpm', '限速', 10, 300, 10, '/min', '每分钟请求上限')}
                </div>
                <div className="ctrl-row">
                  <div className="cl"><b>流式返回</b><i>STREAM</i></div>
                  {toggle('synth.stream', '流式返回')}
                </div>
              </div>
              <div>
                <div className="knob-row">
                  {knob('cache.maxEntries', '缓存条目', 50, 5000, 50, '条', '缓存条目上限')}
                  {knob('cache.ttlSeconds', '缓存 TTL', 600, 86400, 600, 's', '缓存 TTL（秒）')}
                  {knob('synth.maxTextChars', '最长文本', 1000, 20000, 1000, '字', '单次最长文本')}
                </div>
                <div className="ctrl-row">
                  <div className="cl"><b>缓存</b><i>{`上限 ${fmtBytes(live?.cache?.maxBytes || 0)}`}</i></div>
                  {toggle('cache.enabled', '启用缓存')}
                </div>
              </div>
            </div>,
          ], { wide: true })}

          <div className="mod-group-hd">
            <span className="silk">GROUP 04 · <b>网络端口、Legado 与安全鉴权</b></span>
          </div>

          {moduleShell('mod-transport', '08', '传输与 Legado 导出', 'TRANSPORT', 'transport', [
            twoCol(
              <Field key="sh" label="监听地址" sub="HOST" style={{ padding: 0 }}>{input('server.host', { spellCheck: false })}</Field>,
              <Field key="sp" label="端口" sub="PORT" style={{ padding: 0 }}>{input('server.port', { type: 'number' })}</Field>,
            ),
            <Field key="pu" label="对外地址" sub="PUBLIC URL · 隧道/反代时填">{input('server.publicUrl', { spellCheck: false, placeholder: 'https://tts.example.com' })}</Field>,
            <Field key="ln" label="Legado 引擎名" sub="EXPORT NAME">{input('legado.name', { spellCheck: false })}</Field>,
            <Field key="lh" label="附加请求头" sub="JSON · 会写进导出的朗读引擎">
              <Textarea value={d['legado.extraHeaders']} rows={2} spellCheck={false} onChange={set('legado.extraHeaders')} />
            </Field>,
          ])}

          {moduleShell('mod-auth', '09', '鉴权与日志', 'AUTH', 'auth', [
            <div key="ae" className="ctrl-row">
              <div className="cl"><b>Basic 鉴权</b><i>ENABLED</i></div>
              {toggle('auth.enabled', 'Basic 鉴权')}
            </div>,
            <Field key="au" label="用户名" sub="USER">{input('auth.user', { placeholder: '', spellCheck: false })}</Field>,
            <Field key="ap" label="口令" sub="PASS · 已掩码">{input('auth.pass')}</Field>,
            <Field key="at" label="URL 令牌" sub="TOKEN · 拼进导入地址">{input('auth.token', { spellCheck: false })}</Field>,
            <Field key="lr" label="日志环" sub="RING">{input('log.ring', { type: 'number' })}</Field>,
            <p key="ah" className="hint">令牌同时拼进 /legado.json 与 /listening 的 URL；改完保存后请重新复制导入地址。</p>,
          ])}
        </div>

        <aside className="apply" aria-label="生效与改动">
          <div>
            <h2>生效</h2>
            <div className="sub">Apply · Draft</div>
          </div>
          <div className="apply-sum" id="appliedSummary">
            <Rowx k="渲染来源" v={provider} />
            <Rowx k="监听" v={`${d['server.host'] || '—'}:${d['server.port'] || '—'}`} />
            <Rowx k="模型" v={provider === 'openai' ? String(d['upstream.openai.model'] || '—') : String(d['upstream.model'] || '—')} />
            <Rowx k="规则" v={d['textRules.enabled'] ? `${(d['textRules.items'] || []).length} 条` : '已关闭'} />
            <Rowx k="每段 / 并发" v={`${d['synth.maxSegmentChars'] || '—'} 字 / ${d['synth.concurrency'] || '—'} 路`} />
            <Rowx k="限速" v={`${d['limits.rpm'] || '—'} 次/分`} />
            <Rowx k="缓存" v={`${d['cache.maxEntries'] || '—'} 条 · TTL ${ttlText(d['cache.ttlSeconds'])}`} />
            <Rowx k="对外地址" v={d['server.publicUrl'] || '未设置'} />
          </div>
          <div className="rowx">
            <span>最后生效</span>
            <b id="appliedAt">{savedAt || '随快照装载'}</b>
          </div>
          <div className="dirty-wrap">
            <div className="ins-hd" style={{ paddingTop: 4, marginBottom: 0 }}>
              <span className="silk">UNSAVED <b>未保存改动</b></span>
              <span className="cn">{`${changes.length} 项`}</span>
            </div>
            {changes.length === 0 ? (
              <div className="dirty-empty">
                无未保存改动
                <br />
                草稿与运行配置一致
              </div>
            ) : (
              <ul className="dirty-list">
                {changes.map((c) => (
                  <li key={c.path}>
                    <b>{c.label}</b>：{fmtDirtyVal(c.from)} → {fmtDirtyVal(c.to)}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <p className="hint">所有密钥只在本机服务端保存；可点击各处「试听当前草稿」先行验证。</p>
        </aside>
      </div>

      <div className={`savebar${changes.length ? ' is-dirty' : ''}${saving ? ' is-saving' : ''}`} id="savebar">
        <div className="sb-msg">
          <span className="dot" />
          <span>
            {saving
              ? '保存中…'
              : changes.length
                ? `有 ${changes.length} 项未保存的修改`
                : savedAt ? `已生效 · ${savedAt}` : '无未保存改动'}
          </span>
        </div>
        <span className="sb-hint">
          {changes.length ? 'Ctrl/⌘+S 保存并生效；还原丢弃草稿' : '改动先落在草稿；保存后写回运行配置并刷新读数'}
        </span>
        <span className="sb-spacer" />
        <button className="btn" type="button" data-action="export-config" onClick={onExportConfig}>
          导出配置
        </button>
        <button className="btn" type="button" data-action="revert" id="btnRevert" disabled={saving || changes.length === 0} onClick={onRevert}>
          还原
        </button>
        <button className="btn btn--tape" type="button" data-action="save-config" id="btnSave" disabled={saving || changes.length === 0} onClick={onSave}>
          {saving ? '保存中…' : '保存并生效'}
        </button>
      </div>
    </section>
  )
}
