/**
 * MiMo TTS 听书 · 宿主半边
 *
 * 职责只有三件：
 *   1. 拥有配置（config.json 落在 DSH 的插件数据目录里，重启不丢）
 *   2. 拥有服务生命周期（启动 / 停止 / 换端口后重启）
 *   3. 在 DSH 自己的 HTTP 服务上挂 /mimo-tts/api/*，给浏览器半边用
 *
 * 它不代理朗读本身：手机上的 Legado 直接连服务自己开的端口（0.0.0.0:8291）。
 * 这样即使 DSH 关了，同一份内核也能用 `node bin/mimo-tts.mjs` 单独跑。
 */
import { networkInterfaces, homedir } from 'node:os'
import { join } from 'node:path'
import { mkdirSync } from 'node:fs'
import { Store, redact, validatePatch } from './src/config.mjs'
import { TtsService } from './src/service.mjs'
import { parseWav } from './src/wav.mjs'

export const name = 'mimo-tts'
export const ROUTE_PREFIX = '/mimo-tts'

/** 插件数据目录：DSH_HOME/plugin-data/mimo-tts，退回 ~/.dsh/…，再退回 ./data。 */
function resolveDataDir() {
  const home = process.env.DSH_HOME || join(homedir(), '.dsh')
  const dir = join(home, 'plugin-data', 'mimo-tts')
  try {
    mkdirSync(dir, { recursive: true })
    return dir
  } catch {
    return join(process.cwd(), 'data')
  }
}

export function apply(ctx) {
  const dataDir = resolveDataDir()
  const store = new Store(dataDir)
  const log = (line) => console.log(`[mimo-tts] ${line}`)
  store.log = log
  store.load()
  const service = new TtsService({ store, log })

  // 自动启动：端口被占之类的失败只记录，不能把插件加载流程带崩。
  service.start().catch((err) => log(`自动启动失败：${err?.message || err}`))

  // 卸载时把监听关掉。cordis 的 effect 是标准 API，但插件不该因为一个可选钩子
  // 缺失就整块不加载，所以留一条 dispose 事件兜底。
  const stopOnDispose = () => () => service.stop().catch(() => {})
  if (typeof ctx.effect === 'function') ctx.effect(stopOnDispose, 'mimo-tts: service lifetime')
  else if (typeof ctx.on === 'function') ctx.on('dispose', stopOnDispose())

  const lanUrls = () => lanAddresses().map((ip) => `http://${ip}:${store.config.server.port}`)

  const cfgPublic = () => store.config.server?.publicUrl || ''

  function importInfo(req) {
    const { token, enabled } = store.config.auth
    const port = store.config.server.port
    const hostFromReq = String(req.headers.host || '').split(':')[0]
    // 手机要用局域网地址；请求来自本机时改写成第一条局域网 IP。
    const ips = lanAddresses()
    const host = ips.includes(hostFromReq) || (!ips.length && hostFromReq) ? hostFromReq : (ips[0] || hostFromReq || '127.0.0.1')
    const q = enabled && token ? `?token=${encodeURIComponent(token)}` : ''
    // 配了对外地址就一并给出公网导入地址，方便在手机上或异地导入
    const publicUrl = String(cfgPublic() || '').replace(/\/+$/, '')
    return {
      jsonUrl: `http://${host}:${port}/legado.json${q}`,
      listenUrl: `http://${host}:${port}/listening${q}`,
      publicJsonUrl: publicUrl ? `${publicUrl}/legado.json${q}` : '',
      publicListenUrl: publicUrl ? `${publicUrl}/listening${q}` : '',
      lanUrls: lanUrls(),
      hasToken: Boolean(enabled && token),
    }
  }

  function state(req) {
    const cfg = store.config
    return {
      service: service.info(),
      config: redact(cfg),
      local: service.local.status(),
      live: {
        rpm: service.gate.usage(),
        cache: service.cache.stats(),
        local: service.local.status(),
        ...service.metrics.snapshot(),
      },
      import: importInfo(req),
      presetVoices: PRESETS,
      dataDir,
    }
  }

  const handler = async (req, res) => {
    const url = new URL(req.url, 'http://localhost')
    const path = url.pathname.slice(ROUTE_PREFIX.length) || '/'
    try {
      if (path === '/api/state' && req.method === 'GET') {
        return json(res, 200, state(req))
      }

      if (path === '/api/service' && req.method === 'POST') {
        const body = await readJson(req)
        const action = String(body.action || '')
        if (action === 'start') await service.start()
        else if (action === 'stop') await service.stop()
        else if (action === 'restart') await service.restart()
        else return json(res, 400, { error: 'action 必须是 start / stop / restart' })
        return json(res, 200, state(req))
      }

      if (path === '/api/config' && (req.method === 'GET' || req.method === 'PUT')) {
        if (req.method === 'GET') return json(res, 200, redact(store.config))
        const patch = await readJson(req)
        const result = await service.applyPatch(patch)
        if (result.problems?.length) return json(res, 422, { error: result.problems.join('；'), problems: result.problems })
        return json(res, 200, state(req))
      }

      if (path === '/api/preview' && req.method === 'POST') {
        const body = await readJson(req)
        const text = String(body.text || '').trim()
        if (!text) return json(res, 400, { error: 'text 不能为空' })
        const role = body.role === 'dialogue' ? 'dialogue' : 'narrator'
        const started = Date.now()
        const { wav, source } = await service.preview({ text: text.slice(0, 300), role })
        const { durationSec } = parseWav(wav)
        res.writeHead(200, {
          'Content-Type': 'audio/wav',
          'Content-Length': wav.length,
          'Cache-Control': 'no-store',
          'X-Mimo-Latency-Ms': String(Date.now() - started),
          'X-Mimo-Duration-S': durationSec.toFixed(2),
          'X-Mimo-Source': source,
        })
        return res.end(wav)
      }

      if (path === '/api/local' && ['GET', 'POST'].includes(req.method)) {
        if (req.method === 'POST') {
          const body = await readJson(req)
          const action = String(body.action || 'status')
          if (action === 'unload') await service.local.stop('manual')
          else if (action === 'start' || action === 'load') await service.local.preload()
          else if (action !== 'status') return json(res, 400, { error: 'action 必须是 start / unload / status' })
        }
        return json(res, 200, { local: service.local.status() })
      }

      if (path === '/api/cache' && req.method === 'DELETE') {
        service.cache.clear()
        return json(res, 200, { ok: true, cache: service.cache.stats() })
      }

      if (path === '/api/validate' && req.method === 'POST') {
        const patch = await readJson(req)
        const { problems } = validatePatch(store.config, patch)
        return json(res, 200, { problems })
      }

      return json(res, 404, { error: 'not found' })
    } catch (err) {
      log(`[error] ${req.method} ${req.url} → ${err?.message || err}`)
      if (!res.headersSent) return json(res, 500, { error: String(err?.message || err) })
      res.end()
    }
  }

  ctx.inject(['webServer'], (webCtx) => {
    webCtx.effect(() => {
      const unregister = webCtx.webServer.register({ kind: 'prefix', path: ROUTE_PREFIX, handler })
      log(`路由就绪 ${ROUTE_PREFIX}/api/state`)
      return () => unregister()
    }, 'mimo-tts: host route')
  })
}

export const PRESETS = ['mimo_default', '冰糖', '茉莉', '苏打', '白桦', 'Mia', 'Chloe', 'Milo', 'Dean']

/** 非回环 IPv4，优先 192.168 / 10. / 172.16-31（手机能连上的那些）。 */
function lanAddresses() {
  const out = []
  for (const list of Object.values(networkInterfaces())) {
    for (const net of list || []) {
      if (net.family !== 'IPv4' || net.internal) continue
      // 198.18.0.0/15 是代理软件的 TUN 网段（Clash 等），手机连不上，别推荐给用户
      if (/^198\.1[89]\./.test(net.address)) continue
      out.push(net.address)
    }
  }
  const score = (ip) => (ip.startsWith('192.168.') ? 3 : ip.startsWith('10.') ? 2 : ip.startsWith('172.') ? 1 : 0)
  return out.sort((a, b) => score(b) - score(a))
}

function json(res, status, payload) {
  const body = Buffer.from(JSON.stringify(payload))
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': body.length,
    'Cache-Control': 'no-store',
  })
  res.end(body)
}

function readJson(req, limit = 1_000_000) {
  return new Promise((resolve, reject) => {
    const chunks = []
    let size = 0
    req.on('data', (c) => {
      size += c.length
      if (size > limit) { reject(new Error('请求体过大')); req.destroy() }
      else chunks.push(c)
    })
    req.on('end', () => {
      try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}')) } catch { reject(new Error('JSON 解析失败')) }
    })
    req.on('error', reject)
  })
}
