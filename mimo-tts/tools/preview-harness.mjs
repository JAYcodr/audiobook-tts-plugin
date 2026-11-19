#!/usr/bin/env node
/**
 * 本地独立 UI 预览 Harness（默认监听 127.0.0.1:8711）。
 *
 * 将构建产物 `client.js` 加载到一个内置轻量 React 18 Hooks DOM 垫片中，
 * 支持：
 *   - `--fixture`（默认）：使用内置丰富示例数据启动无依赖预览面板，供审美走查与截图；
 *   - `--live --data <dir>`：挂载真实 `TtsService` 数据目录。
 */
import { createServer } from 'node:http'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { BUILTIN_VOICE_PROFILES, PRESET_VOICES, Store } from '../src/config.mjs'
import { BUILTIN_RULE_PRESETS, previewTextPipeline } from '../src/lexicon.mjs'
import { TtsService } from '../src/service.mjs'
import { silentWav } from '../src/wav.mjs'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const CLIENT_JS = join(ROOT, 'client.js')

const args = process.argv.slice(2)
const flagVal = (name, fallback = '') => {
  const idx = args.indexOf(name)
  return idx >= 0 && args[idx + 1] ? args[idx + 1] : fallback
}
const hasFlag = (name) => args.includes(name)

const PORT = Number(flagVal('--port', '8711')) || 8711
const LIVE_MODE = hasFlag('--live')
const DATA_DIR = flagVal('--data', '')

function buildFixtureState() {
  const now = Date.now()
  const dayStr = (offset) => new Date(now - offset * 86_400_000).toISOString().slice(0, 10)
  const days = Array.from({ length: 14 }, (_, i) => {
    const off = 13 - i
    return {
      day: dayStr(off),
      requests: 12 + (i % 5) * 4,
      segments: 34 + (i % 6) * 9,
      seconds: 210 + (i % 7) * 55,
      chars: 2800 + (i % 5) * 650,
      bytes: 9_600_000 + i * 320_000,
      errors: i === 4 ? 1 : 0,
    }
  })
  const recent = [
    { at: now - 54_000, chars: 76, segments: 2, audioSeconds: 11.4, latencyMs: 1420, cacheHit: false, client: 'a1b2@192.168.1.24', role: 'narrator', source: 'hybrid-cloud', text: '夜雾渐渐浓了，山道尽头的石灯笼晃了两晃。' },
    { at: now - 42_000, chars: 38, segments: 1, audioSeconds: 5.2, latencyMs: 910, cacheHit: false, client: 'a1b2@192.168.1.24', role: 'dialogue', source: 'hybrid-cloud', text: '“你来了，我等你很久了。”' },
    { at: now - 28_000, chars: 94, segments: 3, audioSeconds: 14.8, latencyMs: 45, cacheHit: true, client: 'a1b2@192.168.1.24', role: 'mixed', source: 'hybrid-local', text: '他把斗笠压低，“城门亥时闭，走小路。”' },
    { at: now - 12_000, chars: 62, segments: 2, audioSeconds: 9.1, latencyMs: 1850, cacheHit: false, client: 'a1b2@192.168.1.24', role: 'narrator', source: 'hybrid-local', text: '风吹过竹林，沙沙作响，远处传来打更声。' },
  ]
  return {
    service: {
      running: true,
      host: '0.0.0.0',
      port: 8291,
      url: 'http://127.0.0.1:8291',
      uptimeSec: 3842,
      version: '0.4.0',
      provider: 'hybrid',
      hybrid: { enabled: true, cloudReady: true, bootstrapCount: 2, maxCloudBootstrap: 6, localWarm: true, lastSource: 'hybrid-local', lastSwitchReason: 'buffer-ok 16.6>=12.0' },
      openai: { ready: false },
    },
    local: { state: 'ready', enabled: true, warm: true, pid: 41092, port: 8398, rssMb: 2140, requests: 18, lastError: '' },
    live: {
      rpm: { used: 6, limit: 100, waiting: 0 },
      cache: { entries: 42, maxEntries: 500, bytes: 18_400_000, maxBytes: 512 * 1024 * 1024, hits: 19, misses: 23, hitRate: 0.45 },
      local: { state: 'ready', enabled: true, warm: true, rssMb: 2140 },
      today: { segments: 128, seconds: 742, chars: 11240, errors: 0 },
      totals: { requests: 418, segments: 1420, chars: 128400, seconds: 8420, errors: 2, cacheHits: 510 },
      latency: { p50: 980, p95: 2350, max: 3120, samples: 120 },
      days,
      active: [{ client: 'a1b2@192.168.1.24', at: now - 12_000, idleMs: 12_000 }],
      recent,
    },
    config: {
      server: { host: '0.0.0.0', port: 8291, publicUrl: 'https://tts-demo.example.com' },
      upstream: {
        provider: 'hybrid',
        baseUrl: 'https://api.xiaomimimo.com/v1',
        keys: ['sk-demo…0001'],
        model: 'mimo-v2.5-tts',
        timeoutMs: 120000,
        maxRetry: 3,
        openai: { baseUrl: 'https://api.openai.com/v1', apiKey: '', model: 'tts-1', narratorVoice: 'alloy', dialogueVoice: 'echo', responseFormat: 'wav', speed: 1.0, instructions: '', timeoutMs: 60000, maxRetry: 2 },
        hybrid: { maxCloudBootstrap: 6, cloudConcurrency: 2, targetRms: 0.126, warmup: true },
        local: {
          pythonPath: '~/.dsh/plugin-data/audiobook-tts-plugin/venv/bin/python',
          serverScript: '',
          modelPath: '~/.dsh/plugin-data/audiobook-tts-plugin/models/qwen3tts-0.6b-base-8bit',
          port: 8398,
          idleUnloadSeconds: 300,
          startupTimeoutMs: 180000,
          requestTimeoutMs: 180000,
          refs: {
            narrator: { refId: 'builtin:narrator-14s', wav: '', text: '' },
            dialogue: { refId: '', wav: '', text: '' },
          },
        },
      },
      voices: {
        narrator: { mode: 'preset', voice: '冰糖', style: '温润端庄的中文女声，有从容气度，适合旁白', refId: '' },
        dialogue: { mode: 'preset', voice: '苏打', style: '沉稳自然的中文男声，语速适中', refId: '' },
      },
      voiceProfiles: { active: 'builtin:story-warm', items: [] },
      textRules: { enabled: true, items: [BUILTIN_RULE_PRESETS[0], BUILTIN_RULE_PRESETS[1]] },
      synth: { maxSegmentChars: 100, maxTextChars: 10000, concurrency: 4, stream: false },
      cache: { enabled: true, maxEntries: 500, maxBytes: 512 * 1024 * 1024, ttlSeconds: 7200 },
      legado: { name: '听书值守 TTS', extraHeaders: {} },
      auth: { enabled: true, user: 'admin', pass: '', token: 'demo-token-2026' },
      limits: { rpm: 100 },
      log: { ring: 500 },
    },
    import: {
      jsonUrl: 'http://192.168.1.100:8291/legado.json?token=demo-token-2026',
      publicJsonUrl: 'https://tts-demo.example.com/legado.json?token=demo-token-2026',
      listenUrl: 'http://192.168.1.100:8291/listening?token=demo-token-2026',
      lanUrls: ['http://192.168.1.100:8291'],
      hasToken: true,
    },
    presetVoices: PRESET_VOICES,
    builtinVoiceProfiles: BUILTIN_VOICE_PROFILES,
    builtinRulePresets: BUILTIN_RULE_PRESETS,
    refs: [
      { id: 'builtin:narrator-14s', name: '旁白女声 · 14s 完整句（推荐）', builtin: true, exists: true, durationSec: 14.18, sampleRate: 24000, text: '我能隐隐约约感觉到，你和我一样，都有想要守护的东西……是那种，一步都不能退让，用尽一切办法都要守护的东西。', warnings: [] },
      { id: 'builtin:narrator-10s', name: '旁白女声 · 10s 紧凑', builtin: true, exists: true, durationSec: 10.0, sampleRate: 24000, text: '我能隐隐约约感觉到，你和我一样，都有想要守护的东西，是那种，一步都不能退', warnings: [] },
      { id: 'builtin:narrator-5s', name: '旁白女声 · 5s 轻量', builtin: true, exists: true, durationSec: 5.0, sampleRate: 24000, text: '我能隐隐约约感觉到，你和我一样，都有想要守护', warnings: [] },
    ],
    setupSummary: { state: 'idle', platformSupported: true, hasVenv: true, hasModel: true, readyForLocal: true, builtinRefsCount: 3 },
    providers: [{ id: 'mimo', label: 'MiMo 云端', ready: true }],
    dataDir: '~/.dsh/plugin-data/audiobook-tts-plugin',
  }
}

const HARNESS_HTML = `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>听书值守 · Audiobook TTS UI Preview Harness</title>
<style>html, body, #app { margin: 0; padding: 0; height: 100%; width: 100%; overflow: hidden; }</style>
</head>
<body>
<div id="app"></div>
<script>
(() => {
  const SVG_TAGS = new Set([
    'svg', 'circle', 'ellipse', 'g', 'line', 'path', 'polygon', 'polyline', 'rect', 'text',
  ])
  const UNITLESS = new Set(['opacity', 'fontWeight', 'lineHeight', 'zIndex', 'flex', 'flexGrow', 'flexShrink'])
  const hookStore = new Map()
  let scheduled = false
  let rootComp = null
  let rootEl = null

  function makeDom(vnode, path, usedPaths) {
    if (vnode == null || typeof vnode === 'boolean') return null
    if (Array.isArray(vnode)) {
      const frag = document.createDocumentFragment()
      vnode.forEach((child, idx) => {
        const node = makeDom(child, path + '[' + idx + ']', usedPaths)
        if (node) frag.appendChild(node)
      })
      return frag
    }
    if (typeof vnode === 'string' || typeof vnode === 'number') {
      return document.createTextNode(String(vnode))
    }
    if (typeof vnode.type === 'function') {
      const instKey = path + ':' + (vnode.type.name || 'Fn')
      usedPaths.add(instKey)
      let rec = hookStore.get(instKey)
      if (!rec) {
        rec = { hooks: [], cleanups: [] }
        hookStore.set(instKey, rec)
      }
      rec.cursor = 0
      const prevRec = currentRec
      currentRec = rec
      let out
      try {
        out = vnode.type(vnode.props || {})
      } finally {
        currentRec = prevRec
      }
      return makeDom(out, instKey, usedPaths)
    }
    if (vnode.type === React.Fragment) {
      return makeDom(vnode.props?.children, path + '/F', usedPaths)
    }
    const isSvg = SVG_TAGS.has(vnode.type)
    const el = isSvg
      ? document.createElementNS('http://www.w3.org/2000/svg', vnode.type)
      : document.createElement(vnode.type)
    const props = vnode.props || {}
    for (const [k, v] of Object.entries(props)) {
      if (k === 'children' || k === 'key' || v == null) continue
      if (k === 'ref') {
        if (typeof v === 'function') setTimeout(() => v(el), 0)
        else if (typeof v === 'object') v.current = el
        continue
      }
      if (k === 'dangerouslySetInnerHTML') {
        el.innerHTML = v.__html || ''
        continue
      }
      if (k === 'className') {
        el.setAttribute('class', v)
        continue
      }
      if (k === 'style' && typeof v === 'object') {
        for (const [sk, sv] of Object.entries(v)) {
          if (sv == null) continue
          if (sk.startsWith('--')) el.style.setProperty(sk, String(sv))
          else el.style[sk] = (typeof sv === 'number' && !UNITLESS.has(sk)) ? sv + 'px' : String(sv)
        }
        continue
      }
      if (k.startsWith('on') && typeof v === 'function') {
        const evt = k.slice(2).toLowerCase()
        if (evt === 'change') {
          const isToggleInput = el.tagName === 'SELECT' || props.type === 'checkbox' || props.type === 'file'
          el.addEventListener(isToggleInput ? 'change' : 'input', v)
        } else {
          el.addEventListener(evt, v)
        }
        continue
      }
      if (k === 'value' || k === 'checked' || k === 'disabled' || k === 'readOnly' || k === 'hidden') {
        if (k === 'value' && el.tagName === 'SELECT') el.dataset.pendingValue = String(v)
        el[k] = v
        if (k === 'disabled' && v) el.setAttribute('disabled', '')
        if (k === 'hidden' && v) el.setAttribute('hidden', '')
        continue
      }
      if (k === 'htmlFor') {
        el.setAttribute('for', String(v))
        continue
      }
      el.setAttribute(k, String(v))
    }
    const childDom = makeDom(props.children, path + '/' + vnode.type, usedPaths)
    if (childDom) el.appendChild(childDom)
    if (el.tagName === 'SELECT' && el.dataset.pendingValue !== undefined) {
      el.value = el.dataset.pendingValue
    }
    return el
  }

  let currentRec = null
  const pendingEffects = []

  function depsChanged(a, b) {
    if (!a || !b || a.length !== b.length) return true
    for (let i = 0; i < a.length; i++) if (!Object.is(a[i], b[i])) return true
    return false
  }

  function scheduleRender() {
    if (scheduled) return
    scheduled = true
    queueMicrotask(() => {
      scheduled = false
      if (!rootComp || !rootEl) return
      const active = document.activeElement
      const activeId = active?.id || ''
      const selStart = active?.selectionStart
      const selEnd = active?.selectionEnd
      const usedPaths = new Set()
      const dom = makeDom(React.createElement(rootComp, {}), 'root', usedPaths)
      for (const [key, rec] of [...hookStore.entries()]) {
        if (!usedPaths.has(key)) {
          rec.cleanups.forEach((fn) => { try { fn() } catch {} })
          hookStore.delete(key)
        }
      }
      rootEl.replaceChildren(dom)
      while (pendingEffects.length) {
        const eff = pendingEffects.shift()
        eff()
      }
      if (activeId) {
        const nextFocus = document.getElementById(activeId)
        if (nextFocus && typeof nextFocus.focus === 'function') {
          nextFocus.focus()
          if (typeof selStart === 'number' && typeof nextFocus.setSelectionRange === 'function') {
            try { nextFocus.setSelectionRange(selStart, selEnd) } catch {}
          }
        }
      }
    })
  }

  const React = {
    Fragment: Symbol('Fragment'),
    createElement(type, props, ...children) {
      return { type, props: { ...(props || {}), children } }
    },
    useState(init) {
      const rec = currentRec
      const idx = rec.cursor++
      if (!(idx in rec.hooks)) {
        rec.hooks[idx] = typeof init === 'function' ? init() : init
      }
      const setState = (val) => {
        const next = typeof val === 'function' ? val(rec.hooks[idx]) : val
        if (!Object.is(next, rec.hooks[idx])) {
          rec.hooks[idx] = next
          scheduleRender()
        }
      }
      return [rec.hooks[idx], setState]
    },
    useRef(init) {
      const rec = currentRec
      const idx = rec.cursor++
      if (!(idx in rec.hooks)) rec.hooks[idx] = { current: init }
      return rec.hooks[idx]
    },
    useMemo(fn, deps) {
      const rec = currentRec
      const idx = rec.cursor++
      const prev = rec.hooks[idx]
      if (!prev || depsChanged(prev.deps, deps)) {
        rec.hooks[idx] = { value: fn(), deps }
      }
      return rec.hooks[idx].value
    },
    useCallback(fn, deps) {
      return React.useMemo(() => fn, deps)
    },
    useEffect(fn, deps) {
      const rec = currentRec
      const idx = rec.cursor++
      const prev = rec.hooks[idx]
      if (!prev || deps === undefined || depsChanged(prev.deps, deps)) {
        rec.hooks[idx] = { deps }
        pendingEffects.push(() => {
          if (typeof prev?.cleanup === 'function') {
            try { prev.cleanup() } catch {}
          }
          const cleanup = fn()
          rec.hooks[idx].cleanup = typeof cleanup === 'function' ? cleanup : null
          if (rec.hooks[idx].cleanup) rec.cleanups.push(rec.hooks[idx].cleanup)
        })
      }
    },
  }

  let registeredMain = null
  window.__ModuleLoader__ = {
    load(spec) {
      const mod = spec.factory((id) => {
        if (id === 'react') return React
        throw new Error('Unsupported external: ' + id)
      })
      mod.apply({
        slots: {
          inject(slotName, fn) {
            if (slotName === 'main') registeredMain = fn()
          },
          register(meta, comp) { return { meta, comp } },
        },
      })
      rootEl = document.getElementById('app')
      rootComp = registeredMain.comp
      scheduleRender()
    },
  }
})()
</script>
<script src="/client.js"></script>
</body>
</html>
`

function createFixtureHandler() {
  const fixture = buildFixtureState()
  return async (req, res, path, url) => {
    const readJson = () => new Promise((resolveBody) => {
      const chunks = []
      req.on('data', (c) => chunks.push(c))
      req.on('end', () => {
        try { resolveBody(JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}')) } catch { resolveBody({}) }
      })
    })
    const send = (status, obj) => {
      const buf = Buffer.from(JSON.stringify(obj, null, 2))
      res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Content-Length': buf.length })
      res.end(buf)
    }

    if (path === '/api/state' && req.method === 'GET') return send(200, fixture)
    if (path === '/api/live' && req.method === 'GET') return send(200, { service: fixture.service, ...fixture.live })
    if (path === '/api/env/detect') {
      return send(200, {
        platform: { os: 'darwin', arch: 'arm64', isAppleSilicon: true },
        python3: { found: true, path: 'python3', version: 'Python 3.12.6' },
        venv: { path: fixture.config.upstream.local.pythonPath, exists: true, version: 'Python 3.12.6', mlxAudioOk: true },
        model: { path: fixture.config.upstream.local.modelPath, exists: true, valid: true, mainMb: 1210, vocoderMb: 682, error: '' },
        refs: { builtinCount: 3, builtinAvailableCount: 3, recommendedRefId: 'builtin:narrator-14s' },
        readyForLocal: true,
        suggestedPatch: { upstream: { provider: 'local' } },
      })
    }
    if (path === '/api/doctor') {
      return send(200, {
        ok: true,
        headline: '全部体检通过',
        summary: { pass: 6, warn: 0, fail: 0 },
        checks: [
          { id: 'listen', label: 'HTTP 服务监听', status: 'pass', message: '运行中：http://0.0.0.0:8291' },
          { id: 'lan', label: '局域网网卡', status: 'pass', message: '可用 LAN IP：192.168.1.100' },
          { id: 'model', label: '模型与声码器权重', status: 'pass', message: '主权重 1210 MB · 声码器 682 MB' },
        ],
      })
    }
    if (path === '/api/setup/status') {
      return send(200, { state: 'idle', task: '', step: 0, totalSteps: 0, lines: [], nextCursor: Number(url.searchParams.get('since') || 0) })
    }
    if (path === '/api/text/preview' && req.method === 'POST') {
      const body = await readJson()
      return send(200, previewTextPipeline(body.text || '', {
        textRules: body.textRules || fixture.config.textRules,
        maxSegmentChars: Number(body.maxSegmentChars) || 100,
      }))
    }
    if (path === '/api/preview') {
      const wav = silentWav(0.8)
      res.writeHead(200, {
        'Content-Type': 'audio/wav',
        'Content-Length': wav.length,
        'X-Mimo-Source': 'fixture',
        'X-Mimo-Duration-S': '0.80',
        'X-Mimo-Latency-Ms': '12',
      })
      return res.end(wav)
    }
    if (path === '/api/refs' && req.method === 'GET') return send(200, { refs: fixture.refs })
    if (path === '/api/refs/builtin%3Anarrator-14s/audio' || path.endsWith('/audio')) {
      const wav = silentWav(1.0)
      res.writeHead(200, { 'Content-Type': 'audio/wav', 'Content-Length': wav.length })
      return res.end(wav)
    }
    if (path === '/api/config' && req.method === 'PUT') return send(200, fixture)
    if (path === '/api/service' && req.method === 'POST') return send(200, fixture)
    send(404, { error: 'fixture endpoint not mocked' })
  }
}

let tempDir = ''
let service = null
let apiHandler

if (LIVE_MODE) {
  const dir = DATA_DIR || (tempDir = mkdtempSync(join(tmpdir(), 'mimo-harness-')))
  const store = new Store(dir)
  store.load({})
  store.update({ auth: { enabled: false } })
  service = new TtsService({ store, log: console.log })
  apiHandler = async (req, res, path, url) => {
    const handled = await service.controlHandler(req, res, path, url)
    if (!handled) {
      res.writeHead(404)
      res.end('not found')
    }
  }
} else {
  apiHandler = createFixtureHandler()
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://127.0.0.1:${PORT}`)
  if (url.pathname === '/' || url.pathname === '/index.html') {
    const html = Buffer.from(HARNESS_HTML, 'utf8')
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Content-Length': html.length })
    return res.end(html)
  }
  if (url.pathname === '/client.js') {
    const js = readFileSync(CLIENT_JS)
    res.writeHead(200, { 'Content-Type': 'application/javascript; charset=utf-8', 'Content-Length': js.length })
    return res.end(js)
  }
  for (const prefix of ['/mimo-tts', '/audiobook-tts']) {
    if (url.pathname.startsWith(`${prefix}/api/`)) {
      const apiPath = url.pathname.slice(prefix.length)
      return apiHandler(req, res, apiPath, url)
    }
  }
  res.writeHead(404)
  res.end('not found')
})

server.listen(PORT, '127.0.0.1', () => {
  console.log(`[preview-harness] ${LIVE_MODE ? 'LIVE' : 'FIXTURE'} mode listening on http://127.0.0.1:${PORT}/`)
})

const cleanup = async () => {
  server.close()
  if (service) await service.stop()
  if (tempDir) rmSync(tempDir, { recursive: true, force: true })
  process.exit(0)
}
process.on('SIGINT', cleanup)
process.on('SIGTERM', cleanup)
