import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { api, resetMetricsApi } from '../api.js'
import { buildPatch, diffFields, fromConfig } from '../config-draft.js'
import { BODY_TEXT, COPY_LABEL, HINTS, ROLE_CN } from '../constants.js'
import { curlText, download, legadoPayload, writeClipboard } from '../delivery.js'
import { clamp, clock, deviceOf, latSec } from '../format.js'
import deckCss from '../styles/deck.css'
import { buildTimeline, sortedDays } from '../timeline-math.js'
import { ArchiveView } from './ArchiveView.jsx'
import { DeliveryView } from './DeliveryView.jsx'
import { SettingsView } from './SettingsView.jsx'
import { SetupBanner, SetupDrawer } from './SetupDrawer.jsx'
import { StatusBar } from './StatusBar.jsx'
import { Inspector, TapeArea, TrackHeads } from './TimelineView.jsx'
import { Transport } from './Transport.jsx'

export function Panel() {
  const [state, setState] = useState(null)
  const [error, setError] = useState('')
  const [view, setView] = useState('timeline')
  const [paused, setPaused] = useState(false)
  const [frozen, setFrozen] = useState(null)
  const [toast, setToast] = useState('')
  const [busy, setBusy] = useState('')
  const [saving, setSaving] = useState(false)
  const [draft, setDraft] = useState(null)
  const [savedAt, setSavedAt] = useState('')
  const [selAt, setSelAt] = useState(null)
  const [selSig, setSelSig] = useState('')
  const [panelW, setPanelW] = useState(0)
  const [range, setRange] = useState(30)
  const [selectedDay, setSelectedDay] = useState('')
  const [hoverAt, setHoverAt] = useState(null)
  const [now, setNow] = useState(() => Date.now())
  const [lastSync, setLastSync] = useState(0)
  const [setupOpen, setSetupOpen] = useState(false)
  const [bannerDismissed, setBannerDismissed] = useState(false)
  const [doctorReport, setDoctorReport] = useState(null)
  const toastTimer = useRef(null)
  const syncedRef = useRef('')
  const rootObs = useRef(null)
  const roRaf = useRef(0)
  const lastPanelW = useRef(0)

  const showToast = useCallback((text) => {
    setToast(text)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(''), 2400)
  }, [])

  useEffect(() => () => {
    if (toastTimer.current) clearTimeout(toastTimer.current)
  }, [])

  const refresh = useCallback(async () => {
    try {
      const next = await api('/state')
      setState(next)
      setError('')
      setLastSync(Date.now())
    } catch (err) {
      setError(String(err?.message || err))
    }
  }, [])

  useEffect(() => {
    refresh()
    const timer = setInterval(() => {
      if (!document.hidden) refresh()
    }, 4000)
    return () => clearInterval(timer)
  }, [refresh])

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => () => {
    if (roRaf.current) cancelAnimationFrame(roRaf.current)
    if (rootObs.current) rootObs.current.disconnect()
  }, [])

  const service = state?.service || {}
  const running = Boolean(service.running)
  const provider = service.provider || state?.config?.upstream?.provider || 'mimo'
  const localInfo = state?.local || state?.live?.local || {}
  const config = state?.config || {}
  const presetVoices = Array.isArray(state?.presetVoices) ? state.presetVoices : []
  const live = paused && frozen ? frozen.live : state?.live
  const clockNow = paused && frozen ? frozen.at : now
  const pausedAt = paused && frozen ? frozen.at : 0

  const tm = useMemo(() => buildTimeline(live?.recent), [live])
  const items = tm.list
  const lastSelRef = useRef(-1)
  const selIndex = (() => {
    if (!items.length) return -1
    if (selAt == null) return items.length - 1
    const byAt = items.findIndex((x) => x.at === selAt)
    if (byAt >= 0) return byAt
    if (selSig) {
      const bySig = items.findIndex((x) => x.sig === selSig)
      if (bySig >= 0) return bySig
    }
    return clamp(lastSelRef.current, 0, items.length - 1)
  })()
  const selItem = selIndex >= 0 ? items[selIndex] : null
  lastSelRef.current = selIndex
  const compact = panelW > 0 ? panelW < 1050 : false
  const hoverItem = hoverAt != null ? items.find((x) => x.at === hoverAt) : null

  const appliedFlat = useMemo(() => fromConfig(state?.config), [state?.config])
  const changes = useMemo(() => (draft ? diffFields(draft, appliedFlat) : []), [draft, appliedFlat])

  useEffect(() => {
    if (!state?.config) return
    const key = JSON.stringify(appliedFlat)
    if (changes.length) return
    if (syncedRef.current === key) return
    syncedRef.current = key
    setDraft(appliedFlat)
  }, [appliedFlat, changes.length, state?.config])

  const onSet = useCallback((path, value) => {
    setDraft((d) => (d ? { ...d, [path]: value } : d))
  }, [])

  const onSetBatch = useCallback((entries) => {
    setDraft((d) => (d ? { ...d, ...entries } : d))
  }, [])

  const onRefsChange = useCallback((nextRefs) => {
    setState((prev) => (prev ? { ...prev, refs: nextRefs } : prev))
  }, [])

  const applySetupPatch = useCallback(async (patch) => {
    const next = await api('/config', { method: 'PUT', body: JSON.stringify(patch) })
    setState(next)
    const nextFlat = fromConfig(next?.config)
    setDraft(nextFlat)
    syncedRef.current = JSON.stringify(nextFlat)
    setSavedAt(clock(Date.now()))
  }, [])

  const resetMetrics = useCallback(async () => {
    try {
      await resetMetricsApi()
      await refresh()
      showToast('已清空工程史统计数据')
    } catch (err) {
      showToast(`清空失败：${String(err?.message || err)}`)
    }
  }, [refresh, showToast])

  const act = useCallback(async (action) => {
    if (busy) return
    setBusy(action)
    try {
      const next = await api('/service', { method: 'POST', body: JSON.stringify({ action }) })
      setState(next)
      setError('')
      setLastSync(Date.now())
      if (action === 'stop') {
        setPaused(false)
        setFrozen(null)
      }
      showToast(action === 'start' ? '服务已启动 · 走带开始' : action === 'stop' ? '服务已停止 · 实时数据为空态' : '服务已重启 · 走带恢复')
    } catch (err) {
      showToast(String(err?.message || err))
    } finally {
      setBusy('')
    }
  }, [busy, showToast])

  const actLocal = useCallback(async (action) => {
    if (busy) return
    setBusy(`local:${action}`)
    try {
      await api('/local', { method: 'POST', body: JSON.stringify({ action }) })
      await refresh()
      showToast(action === 'unload' ? '本地模型已卸载 · 下段由云端顶班' : '本地模型已加载')
    } catch (err) {
      showToast(String(err?.message || err))
    } finally {
      setBusy('')
    }
  }, [busy, refresh, showToast])

  const toggleLocalResident = useCallback(async () => {
    if (busy) return
    const curIdle = Number(state?.config?.upstream?.local?.idleUnloadSeconds ?? 1800)
    const nextIdle = curIdle === 0 ? 1800 : 0
    setBusy('local:resident')
    try {
      const next = await api('/config', {
        method: 'PUT',
        body: JSON.stringify({ upstream: { local: { idleUnloadSeconds: nextIdle } } }),
      })
      setState(next)
      if (!changes.length) {
        const nextFlat = fromConfig(next?.config)
        setDraft(nextFlat)
        syncedRef.current = JSON.stringify(nextFlat)
      }
      showToast(nextIdle === 0 ? '已切换为常驻模式（不再空闲卸载，约占 1–2.3 GB）' : '已切换为省内存模式（空闲 30 分钟后自动卸载）')
    } catch (err) {
      showToast(String(err?.message || err))
    } finally {
      setBusy('')
    }
  }, [busy, changes.length, showToast, state?.config])

  const togglePause = useCallback(() => {
    if (!running) {
      showToast('服务未运行，没有可暂停的实时数据')
      return
    }
    if (paused) {
      setPaused(false)
      setFrozen(null)
      showToast('已恢复实时刷新')
    } else {
      setFrozen({ live: state?.live, at: Date.now() })
      setPaused(true)
      showToast(`已暂停实时刷新 · 数据冻结 ${clock(Date.now())}`)
    }
  }, [running, paused, state?.live, showToast])

  const onSelect = useCallback((item) => {
    if (!item) return
    setSelAt(item.at)
    setSelSig(item.sig)
  }, [])
  const onHover = useCallback((item) => {
    setHoverAt(item ? item.at : null)
  }, [])

  const save = async () => {
    if (saving) return
    const list = changes
    if (!list.length) {
      showToast('没有需要保存的改动')
      return
    }
    const { patch, problems } = buildPatch(draft || {}, list)
    if (problems.length) {
      showToast(problems[0])
      return
    }
    if (!Object.keys(patch).length) {
      showToast('没有需要提交的改动（密钥掩码不写回）')
      return
    }
    setSaving(true)
    try {
      const next = await api('/config', { method: 'PUT', body: JSON.stringify(patch) })
      setState(next)
      setError('')
      setLastSync(Date.now())
      const nextFlat = fromConfig(next?.config)
      setDraft(nextFlat)
      syncedRef.current = JSON.stringify(nextFlat)
      const at = clock(Date.now())
      setSavedAt(at)
      showToast(`已保存并生效 · ${at}`)
    } catch (err) {
      showToast(String(err?.message || err))
    } finally {
      setSaving(false)
    }
  }

  const revert = () => {
    if (saving) return
    setDraft(appliedFlat)
    syncedRef.current = JSON.stringify(appliedFlat)
    showToast('已还原为当前生效值')
  }

  const exportConfig = () => {
    const ok = download('audiobook-tts-config.json', JSON.stringify(state?.config || {}, null, 2), 'application/json')
    showToast(ok ? '已导出配置 · audiobook-tts-config.json' : '浏览器拦截了下载')
  }

  const exportCsv = () => {
    const asc = sortedDays(live?.days)
    const days = range === 30 ? asc.slice(-30) : asc.slice(-7)
    const header = 'day,requests,segments,chars,seconds,bytes,errors'
    const lines = [header].concat(days.map((d) => [
      d.day, Number(d.requests) || 0, Number(d.segments) || 0,
      Number(d.chars) || 0, Number(d.seconds) || 0, Number(d.bytes) || 0, Number(d.errors) || 0,
    ].join(',')))
    const ok = download(`audiobook-tts-days-${range}.csv`, lines.join('\n'), 'text/csv;charset=utf-8')
    showToast(ok ? `已导出 CSV · ${days.length} 日` : '浏览器拦截了下载')
  }

  const onCopy = async (kind) => {
    const imp = state?.import || {}
    const cfg = state?.config || {}
    const tokenQuery = cfg.auth?.enabled && cfg.auth?.token ? `?token=${encodeURIComponent(cfg.auth.token)}` : ''
    const openaiBase = imp.openaiBaseUrl || `http://127.0.0.1:${service?.port || cfg.server?.port || 8291}/v1`
    const openaiModel = cfg.openaiServer?.defaultModel || 'audiobook-tts'
    const openaiUsesCustomKey = Boolean(imp.openaiUsesCustomKey || cfg.openaiServer?.apiKey)
    const keyHint = openaiUsesCustomKey ? '<独立 Bearer Key（见设置 09）>' : (cfg.auth?.token || '')
    let text = ''
    if (kind === 'import') text = imp.jsonUrl || ''
    else if (kind === 'share-import') text = imp.shareBestJsonUrl || imp.sharePublicJsonUrl || imp.shareRelayJsonUrl || imp.shareQuickJsonUrl || imp.shareJsonUrl || ''
    else if (kind === 'share-token') text = imp.shareToken || ''
    else if (kind === 'public-import') text = imp.publicJsonUrl || ''
    else if (kind === 'quick-import') text = imp.quickJsonUrl || ''
    else if (kind === 'relay-import') text = imp.relayJsonUrl || (imp.relayBaseUrl ? `${imp.relayBaseUrl}/legado.json${tokenQuery}` : '')
    else if (kind === 'quick-url') text = imp.quickTunnelUrl || state?.tunnel?.quickUrl || ''
    else if (kind === 'listen') text = imp.listenUrl || ''
    else if (kind === 'body') text = BODY_TEXT
    else if (kind === 'json') text = JSON.stringify(legadoPayload(imp, cfg), null, 2)
    else if (kind === 'curl') text = curlText(imp.listenUrl)
    else if (kind === 'token') text = cfg.auth?.token || ''
    else if (kind === 'openai-base') text = openaiBase
    else if (kind === 'openai-card') {
      text = [
        `Base URL: ${openaiBase}`,
        `API Key: ${keyHint}`,
        `Model: ${openaiModel}`,
        'Voice: alloy（自动旁白/对话分音色）',
      ].join('\n')
    } else if (kind === 'openai-curl') {
      text = [
        `curl -X POST '${openaiBase}/audio/speech' \\`,
        `  -H 'Authorization: Bearer ${keyHint}' \\`,
        "  -H 'Content-Type: application/json' \\",
        `  -d '{"model":"${openaiModel}","input":"山道上起了雾。","voice":"alloy","response_format":"wav"}' \\`,
        '  --output openai-test.wav',
      ].join('\n')
    }
    if (!text) {
      showToast('没有可复制的内容')
      return
    }
    const ok = await writeClipboard(text)
    showToast(ok ? `已复制 · ${COPY_LABEL[kind] || kind}` : '复制被浏览器拦截，请手动选中')
  }

  const onOpenSettings = useCallback((moduleId = '') => {
    setView('settings')
    if (moduleId) {
      setTimeout(() => {
        const el = document.getElementById(moduleId)
        el?.scrollIntoView?.({ block: 'start' })
      }, 60)
    }
  }, [])

  useEffect(() => {
    const onKey = (e) => {
      const tag = String(e.target?.tagName || '').toLowerCase()
      const typing = tag === 'input' || tag === 'textarea' || tag === 'select'
      if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S') && view === 'settings') {
        e.preventDefault()
        save()
        return
      }
      if (typing) return
      if (['1', '2', '3', '4'].includes(e.key)) {
        e.preventDefault()
        setView(['timeline', 'settings', 'archive', 'delivery'][Number(e.key) - 1])
        return
      }
      if (view === 'timeline' && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
        if (!running || !items.length) return
        e.preventDefault()
        const dir = e.key === 'ArrowRight' ? 1 : -1
        const nextIdx = clamp(selIndex + dir, 0, items.length - 1)
        setSelAt(items[nextIdx].at)
        setSelSig(items[nextIdx].sig)
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  })

  const rootRef = useCallback((node) => {
    if (roRaf.current) {
      cancelAnimationFrame(roRaf.current)
      roRaf.current = 0
    }
    if (rootObs.current) {
      rootObs.current.disconnect()
      rootObs.current = null
    }
    if (node && typeof ResizeObserver !== 'undefined') {
      const ro = new ResizeObserver((entries) => {
        const w = Math.round(entries[0]?.contentRect?.width || 0)
        if (!w || w === lastPanelW.current) return
        if (roRaf.current) cancelAnimationFrame(roRaf.current)
        roRaf.current = requestAnimationFrame(() => {
          roRaf.current = 0
          lastPanelW.current = w
          setPanelW(w)
        })
      })
      ro.observe(node)
      rootObs.current = ro
    }
  }, [])

  if (!state) {
    return (
      <div className="mtt" ref={rootRef}>
        <style dangerouslySetInnerHTML={{ __html: deckCss }} />
        <div className="deck" style={{ gridTemplateRows: '1fr' }}>
          <div
            style={{
              height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', gap: 10, fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--ink-2)',
              background: 'var(--panel)',
            }}
          >
            <b style={{ fontSize: 14, color: 'var(--ink)', letterSpacing: '.04em' }}>
              {error ? '读不到宿主接口' : '正在连接宿主…'}
            </b>
            <span>{error || 'GET /mimo-tts/api/state'}</span>
            {error ? <button className="btn" type="button" onClick={refresh}>重试</button> : null}
          </div>
        </div>
        <div className={`toast${toast ? ' show' : ''}`} role="status" aria-live="polite">
          <span className="tdot" />
          <span>{toast}</span>
        </div>
      </div>
    )
  }

  const hint = error
    ? `读不到宿主接口：${error}`
    : hoverItem
      ? `第 ${hoverItem.index + 1} 段 · ${ROLE_CN[hoverItem.role]} · ${hoverItem.sourceLabel} · ${hoverItem.error ? '失败' : latSec(hoverItem.latencyMs)} · ${hoverItem.chars} 字 · ${clock(hoverItem.at)} · ${deviceOf(hoverItem.client)}`
      : HINTS[view] || ''

  let viewNode
  if (view === 'timeline') {
    viewNode = (
      <section className="view view--timeline" id="view-timeline" aria-label="时间线工作台">
        <TrackHeads
          running={running}
          live={live}
          service={service}
          localInfo={localInfo}
          items={items}
          totalAudio={tm.totalAudio}
          totalChars={tm.totalChars}
          cacheHits={tm.cacheHits}
          avgLatency={tm.avgLatency}
          maxLatency={tm.maxLatency}
          selectedItem={selItem}
          compact={compact}
        />
        <TapeArea
          running={running}
          paused={paused}
          items={items}
          live={live}
          service={service}
          totalAudio={tm.totalAudio}
          totalChars={tm.totalChars}
          cacheHits={tm.cacheHits}
          avgLatency={tm.avgLatency}
          latScale={tm.latScale}
          selectedIndex={selIndex}
          selItem={selItem}
          onSelect={onSelect}
          onHover={onHover}
          hoverAt={hoverAt}
          onAct={act}
        />
        <Inspector
          running={running}
          live={live}
          service={service}
          localInfo={localInfo}
          config={config}
          item={selItem}
          items={items}
          onAct={act}
          onActLocal={actLocal}
          onToggleResident={toggleLocalResident}
          busy={busy}
          lastSync={lastSync}
        />
      </section>
    )
  } else if (view === 'settings') {
    viewNode = (
      <SettingsView
        live={live}
        localInfo={localInfo}
        draft={draft}
        applied={appliedFlat}
        changes={changes}
        presetVoices={presetVoices}
        builtinVoiceProfiles={state?.builtinVoiceProfiles}
        builtinRulePresets={state?.builtinRulePresets}
        builtinPolyphonePresets={state?.builtinPolyphonePresets}
        refs={state?.refs}
        importInfo={state?.import || {}}
        onRefsChange={onRefsChange}
        onRefreshState={refresh}
        onOpenSetup={() => setSetupOpen(true)}
        saving={saving}
        savedAt={savedAt}
        onSet={onSet}
        onSetBatch={onSetBatch}
        onSave={save}
        onRevert={revert}
        onExportConfig={exportConfig}
        showToast={showToast}
      />
    )
  } else if (view === 'archive') {
    viewNode = (
      <ArchiveView
        live={live}
        range={range}
        setRange={setRange}
        selectedDay={selectedDay}
        onSelectDay={(day) => setSelectedDay(day)}
        onExportCsv={exportCsv}
        onResetMetrics={resetMetrics}
      />
    )
  } else {
    viewNode = (
      <DeliveryView
        service={service}
        live={live}
        config={config}
        importInfo={state.import || {}}
        tunnel={state.tunnel || {}}
        onRefreshState={refresh}
        onOpenSettings={onOpenSettings}
        onCopy={onCopy}
        onExportConfig={exportConfig}
        onOpenSetup={() => setSetupOpen(true)}
        onDiagAction={async (action) => {
          if (action === 'start-service') {
            await act('start')
            return
          }
          if (action === 'switch-local') {
            await applySetupPatch({ upstream: { provider: 'local' } })
            showToast('已切换渲染来源为：本地 Qwen3-TTS')
          }
        }}
        showToast={showToast}
      />
    )
  }

  return (
    <div className="mtt" ref={rootRef}>
      <style dangerouslySetInnerHTML={{ __html: deckCss }} />
      <div className="deck">
        <div className="tp-stack">
          <Transport
            service={service}
            localInfo={localInfo}
            live={live}
            items={items}
            totalAudio={tm.totalAudio}
            view={view}
            setView={setView}
            paused={paused}
            onPause={togglePause}
            busy={busy}
            act={act}
            now={clockNow}
            error={error}
          />
          <SetupBanner
            setupSummary={state?.setupSummary}
            config={config}
            doctorReport={doctorReport}
            dismissed={bannerDismissed}
            onDismiss={() => setBannerDismissed(true)}
            onOpenDrawer={() => setSetupOpen(true)}
          />
        </div>
        <main className="bench">{viewNode}</main>
        <StatusBar
          running={running}
          paused={paused}
          error={error}
          lastSync={lastSync}
          pausedAt={pausedAt}
          version={service.version}
          port={service.port}
          provider={provider}
          hint={hint}
        />
      </div>
      <SetupDrawer
        open={setupOpen}
        onClose={() => setSetupOpen(false)}
        onApplyPatch={applySetupPatch}
        onRefreshState={refresh}
        onDoctorReport={(rep) => {
          setDoctorReport(rep)
          if (rep && rep.ok === false) setBannerDismissed(false)
        }}
        showToast={showToast}
      />
      <div className={`toast${toast ? ' show' : ''}`} role="status" aria-live="polite">
        <span className="tdot" />
        <span>{toast}</span>
      </div>
    </div>
  )
}
