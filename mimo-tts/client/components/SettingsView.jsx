import React, { useMemo, useState } from 'react'
import { createReadTokenApi, deleteReadTokenApi, genOpenAiServerKeyApi, rotateAdminTokenApi } from '../api.js'
import { DEFAULT_OPENAI_VOICE_MAP, buildDraftSnapshot, fmtDirtyVal } from '../config-draft.js'
import { writeClipboard } from '../delivery.js'
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
      ['mod-transport', '08', '端口 / Legado / 隧道'],
      ['mod-openai-server', '09', '对外 OpenAI 端点'],
      ['mod-auth', '10', '鉴权 / 日志'],
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
  builtinRulePresets, builtinPolyphonePresets, refs, importInfo, onRefsChange, onRefreshState, onOpenSetup,
  saving, savedAt, onSet, onSetBatch, onSave, onRevert, onExportConfig, showToast,
}) {
  const [expandLocal, setExpandLocal] = useState(false)
  const [expandOpenai, setExpandOpenai] = useState(false)
  const [newProfileName, setNewProfileName] = useState('')
  const [genKeyBusy, setGenKeyBusy] = useState(false)
  const [newMapVoice, setNewMapVoice] = useState('')
  const [newMapTarget, setNewMapTarget] = useState('auto')
  const [newReadLabel, setNewReadLabel] = useState('')
  const [tokenBusy, setTokenBusy] = useState(false)
  const [lastCreatedRead, setLastCreatedRead] = useState(null)

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
    <div className="field field-two-col">
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

  const setMapEntry = (k, val) => {
    const cur = d['openaiServer.voiceMap'] && typeof d['openaiServer.voiceMap'] === 'object'
      ? d['openaiServer.voiceMap']
      : {}
    onSet('openaiServer.voiceMap', { ...cur, [k]: val })
  }

  const removeMapEntry = (k) => {
    const cur = d['openaiServer.voiceMap'] && typeof d['openaiServer.voiceMap'] === 'object'
      ? { ...d['openaiServer.voiceMap'] }
      : {}
    delete cur[k]
    onSet('openaiServer.voiceMap', cur)
  }

  const addMapEntry = () => {
    const key = newMapVoice.trim()
    const target = newMapTarget.trim()
    if (!key || !target) {
      showToast('请填写 OpenAI voice 名称和映射目标')
      return
    }
    setMapEntry(key, target)
    setNewMapVoice('')
    setNewMapTarget('auto')
    showToast(`已添加映射 ${key} → ${target}（保存后生效）`)
  }

  const generateOpenAiKey = async () => {
    if (genKeyBusy) return
    setGenKeyBusy(true)
    try {
      const res = await genOpenAiServerKeyApi()
      if (res?.apiKey) {
        onSet('openaiServer.apiKey', res.apiKey)
        await writeClipboard(res.apiKey).catch(() => {})
        showToast('已生成随机密钥并写入草稿（已尝试复制到剪贴板，保存后会掩码）')
      }
    } catch (err) {
      showToast(`生成密钥失败：${String(err?.message || err)}`)
    } finally {
      setGenKeyBusy(false)
    }
  }

  const voiceMapObj = d['openaiServer.voiceMap'] && typeof d['openaiServer.voiceMap'] === 'object' && !Array.isArray(d['openaiServer.voiceMap'])
    ? d['openaiServer.voiceMap']
    : DEFAULT_OPENAI_VOICE_MAP
  const voiceMapEntries = Object.entries(voiceMapObj)
  const rawOaServerKey = String(d['openaiServer.apiKey'] || '')
  const canCopyOaServerKey = Boolean(rawOaServerKey && !/[\u2026\u2022\u00b7]/.test(rawOaServerKey))
  const shareTokensList = Array.isArray(importInfo?.shareTokens) ? importInfo.shareTokens : []

  const issueReadToken = async () => {
    if (tokenBusy) return
    setTokenBusy(true)
    try {
      const label = newReadLabel.trim() || `分享设备 ${shareTokensList.length + 1}`
      const res = await createReadTokenApi(label)
      setNewReadLabel('')
      setLastCreatedRead(res?.item || null)
      await onRefreshState?.()
      if (res?.item?.token) await writeClipboard(res.item.token).catch(() => {})
      showToast(`已生成只读令牌「${label}」（已尝试复制）`)
    } catch (err) {
      showToast(`生成失败：${String(err?.message || err)}`)
    } finally {
      setTokenBusy(false)
    }
  }

  const revokeReadToken = async (id, label) => {
    if (tokenBusy) return
    setTokenBusy(true)
    try {
      await deleteReadTokenApi(id)
      if (lastCreatedRead?.id === id) setLastCreatedRead(null)
      await onRefreshState?.()
      showToast(`已吊销只读令牌：${label || id}`)
    } catch (err) {
      showToast(`吊销失败：${String(err?.message || err)}`)
    } finally {
      setTokenBusy(false)
    }
  }

  const rotateAdminToken = async () => {
    if (tokenBusy) return
    setTokenBusy(true)
    try {
      await rotateAdminTokenApi()
      await onRefreshState?.()
      showToast('主管理令牌已轮换，请到交付页重新复制自用导入地址')
    } catch (err) {
      showToast(`轮换失败：${String(err?.message || err)}`)
    } finally {
      setTokenBusy(false)
    }
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
    const shortRole = roleKey === 'dialogue' ? '对话' : '旁白'
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
            <Field label={`${shortRole}路径`} sub="WAV (~/)" style={{ padding: 0 }}>{input(wavPath, { spellCheck: false })}</Field>,
            <Field label={`${shortRole}文本`} sub="TEXT" style={{ padding: 0 }}>{input(textPath)}</Field>,
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
              <div className="cl">
                <b>引擎进程状态与内存</b>
                <i>
                  {`${localTag}${localInfo?.rssMb ? ` · ${(Number(localInfo.rssMb) / 1024).toFixed(2)} GB` : ' · 常驻约 1–2.3 GB'}`}
                </i>
              </div>
              <button className="btn btn--sm" type="button" onClick={onOpenSetup}>自动探测 / 安装</button>
            </div>,
            <div key="res-mode" className="ctrl-row">
              <div className="cl">
                <b>驻留策略</b>
                <i>{Number(d['upstream.local.idleUnloadSeconds'] || 0) === 0 ? '常驻（零冷启动，占 1–2.3 GB）' : `省内存（空闲 ${d['upstream.local.idleUnloadSeconds']}s 卸载）`}</i>
              </div>
              <Seg
                options={[
                  { value: 'resident', label: '保持常驻 (0s)' },
                  { value: 'powersave', label: '省内存 (30m)' },
                ]}
                value={Number(d['upstream.local.idleUnloadSeconds'] || 0) === 0 ? 'resident' : 'powersave'}
                ariaLabel="本地引擎驻留策略"
                onChange={(v) => onSet('upstream.local.idleUnloadSeconds', v === 'resident' ? '0' : '1800')}
              />
            </div>,
            <Field key="py" label="Python (支持 ~/)" sub="VENV">{input('upstream.local.pythonPath', { spellCheck: false, placeholder: '~/.dsh/plugin-data/audiobook-tts-plugin/venv/bin/python' })}</Field>,
            <Field key="md" label="模型目录 (支持 ~/)" sub="MLX MODEL">{input('upstream.local.modelPath', { spellCheck: false, placeholder: '~/.dsh/plugin-data/audiobook-tts-plugin/models/qwen3tts-0.6b-base-8bit' })}</Field>,
            <Field key="sc" label="Sidecar 脚本（留空用内置）" sub="SERVER">{input('upstream.local.serverScript', { spellCheck: false })}</Field>,
            twoCol(
              <Field key="lp" label="端口" sub="PORT" style={{ padding: 0 }}>{input('upstream.local.port', { type: 'number' })}</Field>,
              <Field label="启动超时" sub="MS" style={{ padding: 0 }}>{input('upstream.local.startupTimeoutMs', { type: 'number' })}</Field>,
            ),
            <div key="idle" className="knob-row">
              {knob('upstream.local.idleUnloadSeconds', '空闲卸载', 0, 7200, 60, 's', '空闲卸载（秒，0=常驻）')}
              {knob('upstream.local.warmupWindowSeconds', '预热窗口', 0, 3600, 60, 's', '首请求预热保活窗口（秒）')}
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
              polyphoneEnabled={d['textRules.polyphoneEnabled'] !== false}
              disabledPresets={d['textRules.disabledPresets']}
              items={d['textRules.items']}
              presets={builtinRulePresets}
              polyphonePresets={builtinPolyphonePresets}
              maxSegmentChars={d['synth.maxSegmentChars']}
              onToggle={(val) => onSet('textRules.enabled', val)}
              onTogglePolyphone={(val) => onSet('textRules.polyphoneEnabled', val)}
              onChangeDisabledPresets={(ids) => onSet('textRules.disabledPresets', ids)}
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
            <span className="silk">GROUP 04 · <b>网络端口、对外 OpenAI 端点、Legado 与安全鉴权</b></span>
          </div>

          {moduleShell('mod-transport', '08', '传输、Legado 与公网隧道', 'TRANSPORT · TUNNEL', 'transport', [
            <div key="trcols" className="synth-cols">
              <div>
                {twoCol(
                  <Field key="sh" label="监听地址" sub="HOST" style={{ padding: 0 }}>{input('server.host', { spellCheck: false })}</Field>,
                  <Field key="sp" label="端口" sub="PORT" style={{ padding: 0 }}>{input('server.port', { type: 'number' })}</Field>,
                )}
                <Field key="pu" label="对外地址" sub="PUBLIC URL · 命名隧道/反代时填">{input('server.publicUrl', { spellCheck: false, placeholder: 'https://tts.example.dpdns.org' })}</Field>
                <Field key="ln" label="Legado 引擎名" sub="EXPORT NAME">{input('legado.name', { spellCheck: false })}</Field>
                <Field key="lh" label="附加请求头" sub="JSON · 会写进导出的朗读引擎">
                  <Textarea value={d['legado.extraHeaders']} rows={2} spellCheck={false} onChange={set('legado.extraHeaders')} />
                </Field>
              </div>
              <div>
                <div className="ctrl-row">
                  <div className="cl"><b>Quick Tunnel 协议</b><i>PROTOCOL</i></div>
                  <Seg
                    options={[
                      { value: 'http2', label: 'HTTP/2' },
                      { value: 'quic', label: 'QUIC' },
                      { value: 'auto', label: 'Auto' },
                    ]}
                    value={d['tunnel.protocol'] || 'http2'}
                    ariaLabel="Quick Tunnel 协议"
                    onChange={(v) => onSet('tunnel.protocol', v)}
                  />
                </div>
                <Field label="方案 D 中转域名" sub="WORKER RELAY URL">{input('tunnel.kvSync.publicRelayUrl', { spellCheck: false, placeholder: 'https://audiobook-tts-relay.xxx.workers.dev' })}</Field>
                <div className="ctrl-row">
                  <div className="cl"><b>启动隧道时自动同步 KV</b><i>AUTO SYNC</i></div>
                  {toggle('tunnel.kvSync.enabled', '自动同步 KV')}
                </div>
                {twoCol(
                  <Field label="KV 同步模式" sub="MODE" style={{ padding: 0 }}>
                    <select className="input" value={d['tunnel.kvSync.mode'] || 'wrangler'} onChange={(e) => onSet('tunnel.kvSync.mode', e.target.value)}>
                      <option value="wrangler">wrangler CLI</option>
                      <option value="api">Cloudflare API</option>
                    </select>
                  </Field>,
                  <Field label="KV 键名" sub="KEY NAME" style={{ padding: 0 }}>{input('tunnel.kvSync.keyName', { spellCheck: false, placeholder: 'tunnel_url' })}</Field>,
                )}
                {twoCol(
                  <Field label="KV Namespace ID" sub="KV ID" style={{ padding: 0 }}>{input('tunnel.kvSync.kvNamespaceId', { spellCheck: false })}</Field>,
                  <Field label="Account ID" sub="API 模式" style={{ padding: 0 }}>{input('tunnel.kvSync.accountId', { spellCheck: false })}</Field>,
                )}
              </div>
            </div>,
          ], { wide: true })}

          {moduleShell('mod-openai-server', '09', '对外 OpenAI 兼容端点 (/v1/audio/speech)', d['openaiServer.enabled'] ? 'ENABLED' : 'DISABLED', 'openaiServer', [
            <div key="oas-sec" className="https-warn" style={{ marginBottom: 6 }}>
              <b>安全提示：</b>
              默认关闭（返回 404）。开启后将对外暴露 <code>/v1/models</code> 与 <code>/v1/audio/speech</code>（兼容 Readest 等阅读客户端）。公网部署请务必生成独立 Bearer 密钥，并避免在公共场所泄露。
            </div>,
            <div key="oas-cols" className="synth-cols">
              <div>
                <div className="ctrl-row">
                  <div className="cl"><b>启用对外 OpenAI 端点</b><i>ENABLED</i></div>
                  {toggle('openaiServer.enabled', '启用对外 OpenAI 端点')}
                </div>
                <div className="ctrl-row">
                  <div className="cl"><b>按引号切分旁白/对话</b><i>SPLIT DIALOGUE</i></div>
                  {toggle('openaiServer.splitDialogue', '按引号切分旁白/对话')}
                </div>
                <Field label="默认推荐模型名" sub="MODEL">{input('openaiServer.defaultModel', { spellCheck: false, placeholder: 'audiobook-tts' })}</Field>
              </div>
              <div>
                <div className="ctrl-row">
                  <div className="cl"><b>MP3 请求处理策略</b><i>MP3 FALLBACK</i></div>
                  <Seg
                    options={[
                      { value: 'wav', label: 'WAV 回退' },
                      { value: 'strict', label: '严格 400' },
                    ]}
                    value={d['openaiServer.mp3Fallback'] || 'wav'}
                    ariaLabel="MP3 格式回退策略"
                    onChange={(v) => onSet('openaiServer.mp3Fallback', v)}
                  />
                </div>
                <Field label="独立 Bearer 密钥" sub="留空复用 Token">
                  <div className="addr" style={{ gap: 6 }}>
                    {input('openaiServer.apiKey', { spellCheck: false, placeholder: '留空复用 Token，或点生成…' })}
                    <button
                      className="btn btn--sm btn--tape"
                      type="button"
                      disabled={genKeyBusy}
                      onClick={generateOpenAiKey}
                    >
                      {genKeyBusy ? '生成中…' : '生成随机密钥'}
                    </button>
                    {canCopyOaServerKey ? (
                      <button
                        className="btn btn--sm"
                        type="button"
                        onClick={async () => {
                          const ok = await writeClipboard(rawOaServerKey)
                          showToast(ok ? '已复制独立密钥' : '复制被浏览器拦截')
                        }}
                      >
                        复制
                      </button>
                    ) : null}
                  </div>
                </Field>
              </div>
            </div>,
            <div key="oas-vm" className="voicemap-box">
              <div className="ds-hd" style={{ marginBottom: 2 }}>
                <span className="silk">VOICE MAP <b>音色映射表</b></span>
                <button
                  className="btn btn--sm btn--ghost"
                  type="button"
                  onClick={() => onSet('openaiServer.voiceMap', { ...DEFAULT_OPENAI_VOICE_MAP })}
                >
                  恢复默认
                </button>
              </div>
              <p className="hint" style={{ marginTop: 0, marginBottom: 4 }}>
                支持填 <code>auto</code>（自动切分）、<code>narrator</code>（全段旁白）、<code>dialogue</code>（全段对话）、MiMo 预置名（如 <code>冰糖</code>/<code>茉莉</code>）、参考音 ID 或 OpenAI 自定义音色。
              </p>
              <div className="voicemap-table">
                {voiceMapEntries.map(([vk, vv]) => (
                  <div key={vk} className="voicemap-row">
                    <span className="mono vm-key" title={vk}>{vk}</span>
                    <span className="muted">→</span>
                    <input
                      className="input"
                      value={vv}
                      spellCheck={false}
                      aria-label={`音色映射 ${vk}`}
                      onChange={(e) => setMapEntry(vk, e.target.value)}
                    />
                    <select
                      className="input vm-quick"
                      value={['auto', 'narrator', 'dialogue', ...presetVoices].includes(vv) ? vv : ''}
                      aria-label={`快捷选择 ${vk}`}
                      onChange={(e) => { if (e.target.value) setMapEntry(vk, e.target.value) }}
                    >
                      <option value="">快捷…</option>
                      <option value="auto">auto · 自动</option>
                      <option value="narrator">narrator · 旁白</option>
                      <option value="dialogue">dialogue · 对话</option>
                      {presetVoices.map((pv) => <option key={pv} value={pv}>{pv}</option>)}
                    </select>
                    <button
                      className="btn btn--sm btn--ghost"
                      type="button"
                      title={`删除映射 ${vk}`}
                      onClick={() => removeMapEntry(vk)}
                    >
                      ×
                    </button>
                  </div>
                ))}
                <div className="voicemap-add">
                  <input
                    className="input"
                    value={newMapVoice}
                    placeholder="新增 voice 名（如 custom）"
                    spellCheck={false}
                    onChange={(e) => setNewMapVoice(e.target.value)}
                  />
                  <input
                    className="input"
                    value={newMapTarget}
                    placeholder="目标（auto / narrator / 音色）"
                    spellCheck={false}
                    onChange={(e) => setNewMapTarget(e.target.value)}
                  />
                  <button className="btn btn--sm" type="button" onClick={addMapEntry}>添加</button>
                </div>
              </div>
            </div>,
          ], { wide: true })}

          {moduleShell('mod-auth', '10', '鉴权、只读分享令牌与日志', 'AUTH & TOKENS', 'auth', [
            <div key="acols" className="synth-cols">
              <div>
                <div className="ctrl-row">
                  <div className="cl"><b>Basic 鉴权</b><i>ENABLED</i></div>
                  {toggle('auth.enabled', 'Basic 鉴权')}
                </div>
                <Field label="用户名" sub="USER">{input('auth.user', { placeholder: '', spellCheck: false })}</Field>
                <Field label="口令" sub="PASS · 已掩码">{input('auth.pass')}</Field>
              </div>
              <div>
                <Field label="主管理令牌" sub="ADMIN TOKEN · 泄露时请立即轮换">
                  <div className="addr" style={{ gap: 6 }}>
                    {input('auth.token', { spellCheck: false })}
                    <button
                      className="btn btn--sm"
                      type="button"
                      disabled={tokenBusy}
                      title="重新随机生成主管理令牌，旧管理地址立即失效"
                      onClick={rotateAdminToken}
                    >
                      轮换主令牌
                    </button>
                  </div>
                </Field>
                <Field label="日志环" sub="RING">{input('log.ring', { type: 'number' })}</Field>
                <p className="hint">主令牌拥有全部管理权，仅供自己使用；分享给他人或外接设备请使用下方只读令牌。</p>
              </div>
            </div>,
            <div key="rt-box" className="voicemap-box">
              <div className="ds-hd">
                <span className="silk">READ-ONLY SHARE TOKENS <b>只读分享令牌（按设备签发 / 可单独吊销）</b></span>
                <span className="cn">{`${shareTokensList.length} 个有效`}</span>
              </div>
              <div className="addr" style={{ gap: 6 }}>
                <input
                  className="input"
                  value={newReadLabel}
                  placeholder="设备或朋友备注名（如：朋友 iPhone / 备用安卓）"
                  onChange={(e) => setNewReadLabel(e.target.value)}
                />
                <button className="btn btn--sm btn--tape" type="button" disabled={tokenBusy} onClick={issueReadToken}>
                  {tokenBusy ? '处理中…' : '+ 签发只读令牌'}
                </button>
              </div>
              {lastCreatedRead?.token ? (
                <div className="https-warn" style={{ marginTop: 4 }}>
                  {`新签发「${lastCreatedRead.label}」令牌：`}
                  <code>{lastCreatedRead.token}</code>
                </div>
              ) : null}
              {shareTokensList.length === 0 ? (
                <div className="dirty-empty" style={{ marginTop: 4 }}>暂无只读令牌 · 只读令牌可听书及调用 OpenAI 合成端点，访问 /api/* 一律返回 403</div>
              ) : (
                <div className="ref-list" style={{ marginTop: 6 }}>
                  {shareTokensList.map((rt) => (
                    <div key={rt.id} className="ref-row" style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                      <div style={{ minWidth: 0 }}>
                        <b>{rt.label}</b>
                        <span className="mono ref-meta" style={{ marginLeft: 8 }}>
                          {rt.id} · 仅朗读/OpenAI (403 on /api/*)
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: 6, flex: 'none' }}>
                        <button
                          className="btn btn--sm"
                          type="button"
                          onClick={async () => {
                            const ok = await writeClipboard(rt.bestJsonUrl || rt.jsonUrl || rt.token)
                            showToast(ok ? `已复制「${rt.label}」只读导入地址` : '复制被浏览器拦截')
                          }}
                        >
                          复制分享地址
                        </button>
                        <button
                          className="btn btn--sm"
                          type="button"
                          disabled={tokenBusy}
                          onClick={() => revokeReadToken(rt.id, rt.label)}
                        >
                          吊销
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>,
          ], { wide: true })}
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
            <Rowx k="OpenAI 端点" v={d['openaiServer.enabled'] ? '已开启' : '已关闭'} />
            <Rowx
              k="对外地址"
              v={d['server.publicUrl'] || d['tunnel.kvSync.publicRelayUrl'] || '未设置'}
              title={d['server.publicUrl'] || d['tunnel.kvSync.publicRelayUrl'] || ''}
            />
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
