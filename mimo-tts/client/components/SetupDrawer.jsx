import React, { useEffect, useRef, useState } from 'react'
import {
  cancelSetupTaskApi,
  fetchEnvDetectApi,
  fetchSetupStatusApi,
  runDoctorApi,
  startSetupTaskApi,
} from '../api.js'

function isConfigIncomplete(provider, config, setupSummary) {
  if (provider === 'mimo') return !(config?.upstream?.keys?.length > 0)
  if (provider === 'openai') {
    const oa = config?.upstream?.openai || {}
    return !oa.baseUrl || !oa.model || !oa.narratorVoice
  }
  if (provider === 'local' || provider === 'hybrid') {
    const loc = config?.upstream?.local || {}
    if (!loc.pythonPath || !loc.modelPath) return true
    if (setupSummary && !setupSummary.readyForLocal) return true
  }
  return false
}

export function SetupBanner({
  setupSummary, config, doctorReport, dismissed, onDismiss, onOpenDrawer,
}) {
  if (dismissed || !config) return null
  const provider = config?.upstream?.provider || 'mimo'
  const taskRunning = setupSummary?.state === 'running'
  const taskFailed = setupSummary?.state === 'failed'
  const doctorFailed = doctorReport && doctorReport.ok === false
  const incomplete = isConfigIncomplete(provider, config, setupSummary)

  if (!taskRunning && !taskFailed && !doctorFailed && !incomplete) return null

  let headline = '当前引擎尚未完成初始化配置'
  if (taskRunning) {
    headline = `本地安装任务运行中：${setupSummary.progressText || setupSummary.task}`
  } else if (taskFailed) {
    headline = '上一次本地安装/下载任务失败，可打开向导查看日志并重试'
  } else if (doctorFailed) {
    headline = `体检发现 ${doctorReport.summary?.fail || 1} 项异常，建议打开向导排查`
  } else if (provider === 'mimo') {
    headline = 'MiMo 云端尚未填写 API Key — 打开向导体检或切到渲染设置填写'
  } else if (provider === 'openai') {
    headline = 'OpenAI 兼容引擎缺少接口地址、模型或音色'
  } else if (setupSummary && !setupSummary.platformSupported) {
    headline = '当前主机非 Apple Silicon，不支持本地 MLX；请在设置切到 MiMo 或 OpenAI 兼容'
  } else {
    headline = '本地 Qwen3-TTS 尚未探测到完整 Python / 声码器模型，可点开向导一键安装'
  }

  return (
    <div className={`setup-banner${taskFailed || doctorFailed ? ' is-warn' : ''}`} role="region" aria-label="初始化引导">
      <span className="sb-dot" />
      <span className="sb-txt">{headline}</span>
      <div className="sb-acts">
        <button className="btn btn--sm btn--tape" type="button" onClick={onOpenDrawer}>
          {taskRunning ? '查看安装进度' : '打开向导与体检'}
        </button>
        <button className="btn btn--sm btn--ghost" type="button" onClick={onDismiss}>
          收起
        </button>
      </div>
    </div>
  )
}

function StatusPill({ status, text }) {
  const cls = status === 'pass' ? 'tag tape' : status === 'warn' ? 'tag cloud' : 'tag grease'
  return <span className={cls}>{text}</span>
}

export function SetupDrawer({
  open, onClose, onApplyPatch, onRefreshState, showToast,
}) {
  const [detect, setDetect] = useState(null)
  const [detecting, setDetecting] = useState(false)
  const [setup, setSetup] = useState(null)
  const [lines, setLines] = useState([])
  const [hfEndpoint, setHfEndpoint] = useState('https://hf-mirror.com')
  const [doctor, setDoctor] = useState(null)
  const [checkNetwork, setCheckNetwork] = useState(false)
  const [docBusy, setDocBusy] = useState(false)
  const [applying, setApplying] = useState(false)
  const cursorRef = useRef(0)
  const logBoxRef = useRef(null)

  const runDetect = async () => {
    setDetecting(true)
    try {
      const res = await fetchEnvDetectApi()
      setDetect(res)
    } catch (err) {
      showToast(`环境探测失败：${String(err?.message || err)}`)
    } finally {
      setDetecting(false)
    }
  }

  const syncSetupStatus = async (reset = false) => {
    try {
      const since = reset ? 0 : cursorRef.current
      const st = await fetchSetupStatusApi(since)
      setSetup(st)
      if (reset) {
        setLines(st.lines || [])
      } else if (Array.isArray(st.lines) && st.lines.length) {
        setLines((prev) => [...prev, ...st.lines].slice(-800))
      }
      if (st.nextCursor != null) cursorRef.current = st.nextCursor
      if (st.detect) setDetect(st.detect)
      return st
    } catch {
      return null
    }
  }

  useEffect(() => {
    if (!open) return undefined
    runDetect()
    syncSetupStatus(true)
    const onEsc = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onEsc)
    return () => document.removeEventListener('keydown', onEsc)
  }, [open])

  useEffect(() => {
    if (!open || setup?.state !== 'running') return undefined
    const timer = setInterval(async () => {
      const st = await syncSetupStatus(false)
      if (st && st.state !== 'running') {
        await runDetect()
        await onRefreshState?.()
      }
    }, 800)
    return () => clearInterval(timer)
  }, [open, setup?.state])

  useEffect(() => {
    if (logBoxRef.current) {
      logBoxRef.current.scrollTop = logBoxRef.current.scrollHeight
    }
  }, [lines.length])

  if (!open) return null

  const startTask = async (task) => {
    try {
      cursorRef.current = 0
      setLines([])
      const st = await startSetupTaskApi({ task, hfEndpoint })
      setSetup(st)
      setLines(st.lines || [])
      cursorRef.current = st.nextCursor || 0
      showToast(task === 'install-local' ? '已启动全量本地安装任务' : '已启动模型下载/校验任务')
    } catch (err) {
      showToast(String(err?.message || err))
    }
  }

  const cancelTask = async () => {
    try {
      const st = await cancelSetupTaskApi()
      setSetup(st)
      showToast('已请求终止安装任务')
    } catch (err) {
      showToast(String(err?.message || err))
    }
  }

  const runDoc = async () => {
    setDocBusy(true)
    try {
      const res = await runDoctorApi(checkNetwork)
      setDoctor(res)
      showToast(res.headline || '体检完成')
    } catch (err) {
      showToast(`体检失败：${String(err?.message || err)}`)
    } finally {
      setDocBusy(false)
    }
  }

  const applyDetected = async () => {
    if (!detect?.suggestedPatch) return
    setApplying(true)
    try {
      await onApplyPatch(detect.suggestedPatch)
      showToast('已一键填入探测路径与内置旁白参考音')
    } catch (err) {
      showToast(`回填失败：${String(err?.message || err)}`)
    } finally {
      setApplying(false)
    }
  }

  const running = setup?.state === 'running'
  const appleOk = Boolean(detect?.platform?.isAppleSilicon)
  const pct = setup?.totalSteps ? Math.min(100, Math.round(((setup.step || 0) / setup.totalSteps) * 100)) : 0

  return (
    <div className="mtt-modal-backdrop" role="dialog" aria-modal="true" aria-label="初始化向导与在线体检" onClick={onClose}>
      <div className="mtt-drawer" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-hd">
          <div>
            <span className="silk">SETUP & DOCTOR <b>环境探测 · 托管安装 · 在线体检</b></span>
          </div>
          <button className="btn btn--sm" type="button" onClick={onClose}>关闭 (ESC)</button>
        </div>

        <div className="drawer-body">
          <section className="drawer-sec">
            <div className="ds-hd">
              <b>1. 环境自动探测</b>
              <div style={{ display: 'flex', gap: 6 }}>
                <button className="btn btn--sm" type="button" disabled={detecting} onClick={runDetect}>
                  {detecting ? '探测中…' : '重新探测'}
                </button>
                <button
                  className="btn btn--sm btn--tape"
                  type="button"
                  disabled={!detect?.suggestedPatch || applying}
                  onClick={applyDetected}
                >
                  {applying ? '写入中…' : (detect?.readyForLocal ? '一键填入并切换本地' : '填入已探测路径')}
                </button>
              </div>
            </div>
            {detect ? (
              <div className="detect-grid">
                <div className="dg-item">
                  <span>芯片架构</span>
                  <StatusPill
                    status={appleOk ? 'pass' : 'fail'}
                    text={`${detect.platform?.os}/${detect.platform?.arch}${appleOk ? ' · MLX 支持' : ' · 非 Apple Silicon'}`}
                  />
                </div>
                <div className="dg-item">
                  <span>Python / venv</span>
                  <StatusPill
                    status={detect.venv?.exists && detect.venv?.mlxAudioOk ? 'pass' : 'warn'}
                    text={detect.venv?.mlxAudioOk ? `${detect.venv.version || 'venv'} + mlx_audio` : (detect.venv?.exists ? '缺 mlx_audio' : '未建 venv')}
                  />
                </div>
                <div className="dg-item">
                  <span>模型与声码器</span>
                  <StatusPill
                    status={detect.model?.valid ? 'pass' : 'fail'}
                    text={detect.model?.valid ? `主 ${detect.model.mainMb}MB · 声码器 ${detect.model.vocoderMb}MB` : (detect.model?.error || '未下载')}
                  />
                </div>
                <div className="dg-item">
                  <span>内置参考音</span>
                  <StatusPill
                    status={detect.refs?.builtinAvailableCount > 0 ? 'pass' : 'warn'}
                    text={`${detect.refs?.builtinAvailableCount || 0}/${detect.refs?.builtinCount || 0} 个可用`}
                  />
                </div>
              </div>
            ) : <div className="hint">正在读取环境信息…</div>}
          </section>

          <section className="drawer-sec">
            <div className="ds-hd">
              <b>2. 全 UI 托管安装本地 Qwen3-TTS（macOS Apple Silicon）</b>
              <div className="seg" role="group" aria-label="模型下载源">
                {[
                  ['https://hf-mirror.com', '国内镜像 hf-mirror'],
                  ['https://huggingface.co', 'HuggingFace 官方'],
                ].map(([val, label]) => (
                  <button
                    key={val}
                    type="button"
                    className="seg-key"
                    aria-pressed={String(hfEndpoint === val)}
                    disabled={running}
                    onClick={() => setHfEndpoint(val)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
              <button
                className="btn btn--sm btn--tape"
                type="button"
                disabled={running || !appleOk}
                title={appleOk ? '安装 venv、依赖并下载 1.9GB MLX 模型' : '仅支持 macOS Apple Silicon'}
                onClick={() => startTask('install-local')}
              >
                {running && setup?.task === 'install-local' ? '安装运行中…' : '一键安装本地引擎'}
              </button>
              <button
                className="btn btn--sm"
                type="button"
                disabled={running || !appleOk}
                onClick={() => startTask('download-model')}
              >
                {running && setup?.task === 'download-model' ? '下载中…' : '仅下载 / 修复模型与声码器'}
              </button>
              {running ? (
                <button className="btn btn--sm" type="button" onClick={cancelTask}>
                  取消任务
                </button>
              ) : null}
              <span className="mono" style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--ink-2)' }}>
                {setup?.state && setup.state !== 'idle'
                  ? `[${setup.state}] ${setup.step || 0}/${setup.totalSteps || 0} · ${setup.progressText || ''}`
                  : '空闲 · 白名单脚本受控执行'}
              </span>
            </div>
            {setup && setup.state !== 'idle' ? (
              <div className="setup-prog" aria-label="安装进度">
                <i style={{ width: `${pct}%` }} />
              </div>
            ) : null}
            <pre className="code setup-log" id="setupLogs" ref={logBoxRef}>
              {lines.length ? lines.map((l) => l.line).join('\n') : '点击上方按钮即可在控制台内查看实时安装/下载日志。'}
            </pre>
          </section>

          <section className="drawer-sec">
            <div className="ds-hd">
              <b>3. 在线体检（Doctor）</b>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <label className="mono" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, cursor: 'pointer' }}>
                  <input type="checkbox" checked={checkNetwork} onChange={(e) => setCheckNetwork(e.target.checked)} />
                  同时探测上游连通性 (5s)
                </label>
                <button className="btn btn--sm btn--tape" type="button" disabled={docBusy} onClick={runDoc}>
                  {docBusy ? '体检中…' : '运行体检'}
                </button>
              </div>
            </div>
            {doctor ? (
              <div className="doctor-list">
                <div className="mono" style={{ fontSize: 11, marginBottom: 4 }}>
                  结果：<b>{doctor.headline}</b>（通过 {doctor.summary?.pass || 0} · 提示 {doctor.summary?.warn || 0} · 异常 {doctor.summary?.fail || 0}）
                </div>
                {(doctor.checks || []).map((c) => (
                  <div key={c.id} className={`doc-row ${c.status}`}>
                    <span className="doc-badge">{c.status === 'pass' ? '✓' : c.status === 'warn' ? '!' : '✕'}</span>
                    <b className="doc-lbl">{c.label}</b>
                    <div className="doc-msg">
                      <span>{c.message}</span>
                      {c.hint ? <small>{c.hint}</small> : null}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="hint">检查端口监听、局域网地址、声码器权重（600MB+）、参考音文本与 API 连通性。</div>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}
