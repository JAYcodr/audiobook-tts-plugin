import React from 'react'
import { fmtDirtyVal } from '../config-draft.js'
import { fmtBytes, fmtInt, localStateText, ttlText } from '../format.js'
import { Chips, Field, Input, Knob, Rowx, Seg, Textarea, Toggle } from './Primitives.jsx'

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

const MOD_NAV = [
  ['mod-engine', '01', '引擎'],
  ['mod-local', '02', '本地引擎'],
  ['mod-openai', '03', 'OpenAI 兼容'],
  ['mod-voice', '04', '音色'],
  ['mod-synth', '05', '合成与缓存'],
  ['mod-transport', '06', '传输'],
  ['mod-auth', '07', '鉴权'],
]

export function SettingsView({
  live, localInfo, draft, applied, changes, presetVoices,
  saving, savedAt, onSet, onSave, onRevert, onExportConfig, onPreview, previewBusy,
}) {
  const d = draft || applied || {}
  const dirty = (path) => changes.some((c) => c.path === path)
  const moduleDirty = (name) => changes.some((c) => c.module === name)
  const set = (path) => (value) => onSet(path, value)
  const chain = settingsChainValue(live, d)

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

  const moduleShell = (id, no, title, silk, name, children) => (
    <div className={`module${moduleDirty(name) ? ' is-dirty' : ''}`} id={id} data-module="true">
      <div className="module-hd">
        <span className="mh">
          <span className="mnum">{no}</span>
          <b>{title}</b>
          <span className="silk">{silk}</span>
        </span>
        <span className="dirty-dot" title="有未保存改动" />
      </div>
      {children}
    </div>
  )

  const localTag = !localInfo?.enabled ? '随渲染来源切换' : localStateText(localInfo)

  return (
    <section className="view view--settings" id="view-settings" aria-label="渲染设置">
      <div className="set-grid">
        <div className="set-left">
          <div>
            <h2>渲染设置</h2>
            <div className="sub">Render Rack</div>
          </div>
          <div className="chain" aria-label="信号链">
            <div className="chain-node"><span className="ld" /><b>章节正文</b> <span className="muted">TEXT</span></div>
            <div className="chain-link" />
            <div className="chain-node"><span className="ld" /><b>切分</b> <span className="muted">旁白 / 对话</span></div>
            <div className="chain-link" />
            <div className="chain-node"><span className="ld" /><b>合成队列</b> <span className="muted">{`CONCURRENCY ${chain.concurrency}`}</span></div>
            <div className="chain-link" />
            <div className="chain-node"><span className="ld" /><b>缓存带</b> <span className="muted">{chain.cache}</span></div>
            <div className="chain-link" />
            <div className="chain-node"><span className="ld" /><b>引擎</b> <span className="muted">{chain.engine}</span></div>
            <div className="chain-link" />
            <div className="chain-node"><span className="ld" /><b>WAV</b> <span className="muted">整段 · 真实时长</span></div>
          </div>
          <p className="chain-note">改动先落草稿，点「保存并生效」才写入运行配置。密钥只在本机，页面拿到的永远是掩码。</p>
          <nav className="mod-index" aria-label="模块定位">
            {MOD_NAV.map(([id, no, name]) => (
              <button key={id} type="button" data-scroll={id} onClick={() => scrollToModule(id)}>
                <span className="n">{no}</span>
                {name}
              </button>
            ))}
          </nav>
        </div>

        <div className="modules" id="modules">
          {moduleShell('mod-engine', '01', '引擎', 'ENGINE', 'engine', [
            <div key="prov" className="ctrl-row">
              <div className="cl"><b>渲染来源</b><i>PROVIDER</i></div>
              <Seg
                options={[
                  { value: 'mimo', label: '云端' },
                  { value: 'local', label: '本地' },
                  { value: 'hybrid', label: '混合' },
                  { value: 'openai', label: 'OpenAI' },
                ]}
                value={d['upstream.provider']}
                ariaLabel="渲染来源"
                onChange={(v) => onSet('upstream.provider', v)}
              />
            </div>,
            <div key="knobs" className="knob-row">
              {knob('upstream.hybrid.maxCloudBootstrap', '云顶班', 0, 30, 1, '段', '云顶班上限（段）')}
              {knob('upstream.hybrid.cloudConcurrency', '云并发', 1, 2, 1, '路', '云并发（路，MiMo 克隆最多 2 路）')}
              <div className="knob-wrap" data-label="本地预热">
                <span className="kl">本地预热</span>
                {toggle('upstream.hybrid.warmup', '本地预热')}
              </div>
            </div>,
            <Field key="rms" label="目标响度" sub="RMS">{input('upstream.hybrid.targetRms', { inputMode: 'decimal', type: 'text' })}</Field>,
            <Field key="model" label="MiMo 云端模型" sub="MODEL">{input('upstream.model', { spellCheck: false })}</Field>,
          ])}

          {moduleShell('mod-local', '02', '本地引擎', 'LOCAL QWEN3-TTS', 'local', [
            <div key="st" className="ctrl-row">
              <div className="cl"><b>本地引擎</b><i>ENABLED</i></div>
              <span className="tag">{localTag}</span>
            </div>,
            <Field key="py" label="Python" sub="VENV">{input('upstream.local.pythonPath', { spellCheck: false })}</Field>,
            <Field key="sc" label="Sidecar 脚本" sub="SERVER">{input('upstream.local.serverScript', { spellCheck: false })}</Field>,
            <Field key="md" label="模型目录" sub="MLX MODEL">{input('upstream.local.modelPath', { spellCheck: false })}</Field>,
            twoCol(
              <Field key="lp" label="端口" sub="PORT" style={{ padding: 0 }}>{input('upstream.local.port', { type: 'number' })}</Field>,
              <Field key="lt" label="启动超时" sub="MS" style={{ padding: 0 }}>{input('upstream.local.startupTimeoutMs', { type: 'number' })}</Field>,
            ),
            <div key="idle" className="knob-row">
              {knob('upstream.local.idleUnloadSeconds', '空闲卸载', 0, 3600, 30, 's', '空闲卸载（秒，0=常驻）')}
              <Field label="请求超时" sub="MS" style={{ flex: '1', padding: 0 }}>
                {input('upstream.local.requestTimeoutMs', { type: 'number' })}
              </Field>
            </div>,
            twoCol(
              <Field key="nw" label="旁白参考音" sub="WAV" style={{ padding: 0 }}>{input('upstream.local.refs.narrator.wav', { spellCheck: false })}</Field>,
              <Field key="dw" label="对话参考音" sub="WAV" style={{ padding: 0 }}>{input('upstream.local.refs.dialogue.wav', { spellCheck: false })}</Field>,
            ),
            twoCol(
              <Field key="nt" label="旁白参考文本" sub="REF TEXT" style={{ padding: 0 }}>{input('upstream.local.refs.narrator.text')}</Field>,
              <Field key="dt" label="对话参考文本" sub="REF TEXT" style={{ padding: 0 }}>{input('upstream.local.refs.dialogue.text')}</Field>,
            ),
          ])}

          {moduleShell('mod-openai', '03', 'OpenAI 兼容', 'OPENAI / KOKORO / EDGE-TTS', 'openai', [
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
          ])}

          {moduleShell('mod-voice', '04', '音色', 'VOICE PRESET', 'voice', [
            <div key="nv" className="field">
              <span className="fl">旁白 <i>NARRATOR · 模式 preset</i></span>
              <Chips options={presetVoices} value={d['voices.narrator.voice']} ariaLabel="旁白音色" onChange={(v) => onSet('voices.narrator.voice', v)} />
            </div>,
            <Field key="ns" label="旁白风格" sub="STYLE">{input('voices.narrator.style')}</Field>,
            <div key="dv" className="field">
              <span className="fl">对话 <i>DIALOGUE · 模式 preset</i></span>
              <Chips options={presetVoices} value={d['voices.dialogue.voice']} ariaLabel="对话音色" onChange={(v) => onSet('voices.dialogue.voice', v)} />
            </div>,
            <Field key="ds" label="对话风格" sub="STYLE">{input('voices.dialogue.style')}</Field>,
            <div key="pv" style={{ display: 'flex', gap: 6, marginTop: 6 }}>
              <button className="btn btn--sm btn--tape" type="button" disabled={Boolean(previewBusy)} onClick={() => onPreview('narrator')}>
                {previewBusy === 'narrator' ? '合成中…' : '试听旁白'}
              </button>
              <button className="btn btn--sm" type="button" disabled={Boolean(previewBusy)} onClick={() => onPreview('dialogue')}>
                {previewBusy === 'dialogue' ? '合成中…' : '试听对话'}
              </button>
            </div>,
            <p key="vh" className="hint">混合启动的云端阶段使用参考音克隆；这里的 MiMo 预置音色只在纯云端模式生效。</p>,
          ])}

          {moduleShell('mod-synth', '05', '合成与缓存', 'SYNTH · CACHE', 'synth', [
            <div key="k1" className="knob-row">
              {knob('synth.concurrency', '并发', 1, 8, 1, '路', '合成并发（路）')}
              {knob('synth.maxSegmentChars', '每段字数', 10, 300, 10, '字', '每段最大字数')}
              {knob('limits.rpm', '限速', 10, 300, 10, '/min', '每分钟请求上限')}
            </div>,
            <div key="st" className="ctrl-row">
              <div className="cl"><b>流式返回</b><i>STREAM</i></div>
              {toggle('synth.stream', '流式返回')}
            </div>,
            <div key="ce" className="ctrl-row">
              <div className="cl"><b>缓存</b><i>CACHE</i></div>
              {toggle('cache.enabled', '启用缓存')}
            </div>,
            <div key="k2" className="knob-row">
              {knob('cache.maxEntries', '缓存条目', 50, 5000, 50, '条', '缓存条目上限')}
              {knob('cache.ttlSeconds', '缓存 TTL', 600, 86400, 600, 's', '缓存 TTL（秒）')}
              {knob('synth.maxTextChars', '最长文本', 1000, 20000, 1000, '字', '单次最长文本')}
            </div>,
            <div key="cb" className="rowx" style={{ marginTop: 4 }}>
              <span>缓存上限</span>
              <b>{fmtBytes(live?.cache?.maxBytes || 0)}</b>
            </div>,
          ])}

          {moduleShell('mod-transport', '06', '传输', 'TRANSPORT', 'transport', [
            twoCol(
              <Field key="sh" label="监听地址" sub="HOST" style={{ padding: 0 }}>{input('server.host', { spellCheck: false })}</Field>,
              <Field key="sp" label="端口" sub="PORT" style={{ padding: 0 }}>{input('server.port', { type: 'number' })}</Field>,
            ),
            <Field key="pu" label="对外地址" sub="PUBLIC URL · 隧道/反代时填">{input('server.publicUrl', { spellCheck: false, placeholder: 'https://tts.example.com' })}</Field>,
            <Field key="ub" label="MiMo 地址" sub="BASE URL">{input('upstream.baseUrl', { spellCheck: false })}</Field>,
            <Field key="uk" label="MiMo API Key" sub="每行一个 · 保留掩码行可追加新 Key">
              <Textarea
                value={d['upstream.keys']}
                rows={2}
                spellCheck={false}
                placeholder="sk-…（保留已有掩码行即可追加新 Key）"
                onChange={set('upstream.keys')}
              />
            </Field>,
            twoCol(
              <Field key="ut" label="超时" sub="MS" style={{ padding: 0 }}>{input('upstream.timeoutMs', { type: 'number' })}</Field>,
              <Field key="ur" label="重试" sub="MAX RETRY" style={{ padding: 0 }}>{input('upstream.maxRetry', { type: 'number' })}</Field>,
            ),
            <Field key="ln" label="Legado 引擎名" sub="EXPORT NAME">{input('legado.name', { spellCheck: false })}</Field>,
            <Field key="lh" label="附加请求头" sub="JSON · 会写进导出的朗读引擎">
              <Textarea value={d['legado.extraHeaders']} rows={2} spellCheck={false} onChange={set('legado.extraHeaders')} />
            </Field>,
          ])}

          {moduleShell('mod-auth', '07', '鉴权', 'AUTH', 'auth', [
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
            <Rowx k="渲染来源" v={String(d['upstream.provider'] || 'mimo')} />
            <Rowx k="监听" v={`${d['server.host'] || '—'}:${d['server.port'] || '—'}`} />
            <Rowx k="云端模型" v={d['upstream.provider'] === 'openai' ? String(d['upstream.openai.model'] || '—') : String(d['upstream.model'] || '—')} />
            <Rowx k="本地端口" v={String(d['upstream.local.port'] || '—')} />
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
          <p className="hint">保存后写入 PUT /api/config，脏标 → 保存中 → 已生效时间戳。</p>
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
