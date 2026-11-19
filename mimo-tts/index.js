/**
 * Audiobook TTS（听书值守）· DSH 宿主半边
 *
 * 职责只有三件：
 *   1. 拥有配置（config.json 落在 DSH 的插件数据目录里，重启不丢）
 *   2. 拥有服务生命周期（启动 / 停止 / 换端口后重启）
 *   3. 在 DSH 自己的 HTTP 服务上挂 /mimo-tts/api/* 与 /audiobook-tts/api/*，给浏览器半边用
 */
import { homedir } from 'node:os'
import { join } from 'node:path'
import { existsSync, mkdirSync } from 'node:fs'
import { PRESET_VOICES, Store } from './src/config.mjs'
import { createControlHandler } from './src/control-api.mjs'
import { HttpInputError, sendJson } from './src/http.mjs'
import { TtsService } from './src/service.mjs'

// 保留 cordis 组件名与 /mimo-tts 主路由以确保已有 DSH profile 与前端面板无缝兼容
export const name = 'mimo-tts'
export const ROUTE_PREFIX = '/mimo-tts'
export const ROUTE_PREFIXES = ['/mimo-tts', '/audiobook-tts']

/**
 * 插件数据目录：
 * - 显式指定 AUDIOBOOK_TTS_DATA / MIMO_TTS_DATA 时优先使用；
 * - 否则在 DSH_HOME/plugin-data/ 下检查旧目录 mimo-tts 是否已存在（平滑兼容升级），
 *   全新安装默认使用 plugin-data/audiobook-tts-plugin，最终兜底 ./data。
 */
export function resolveDataDir(env = process.env) {
  const explicit = env.AUDIOBOOK_TTS_DATA || env.MIMO_TTS_DATA
  if (explicit) {
    mkdirSync(explicit, { recursive: true })
    return explicit
  }
  const home = env.DSH_HOME || join(homedir(), '.dsh')
  const modernDir = join(home, 'plugin-data', 'audiobook-tts-plugin')
  const legacyDir = join(home, 'plugin-data', 'mimo-tts')
  const targetDir = (!existsSync(modernDir) && existsSync(legacyDir)) ? legacyDir : modernDir
  try {
    mkdirSync(targetDir, { recursive: true })
    return targetDir
  } catch {
    return join(process.cwd(), 'data')
  }
}

export function apply(ctx) {
  const dataDir = resolveDataDir()
  const store = new Store(dataDir)
  const log = (line) => console.log(`[audiobook-tts] ${line}`)
  store.log = log
  store.load()
  const service = new TtsService({ store, log })

  service.start().catch((err) => log(`自动启动失败：${err?.message || err}`))

  const stopOnDispose = () => () => service.stop().catch(() => {})
  if (typeof ctx.effect === 'function') ctx.effect(stopOnDispose, 'mimo-tts: service lifetime')
  else if (typeof ctx.on === 'function') ctx.on('dispose', stopOnDispose())

  const controlHandler = createControlHandler({ service, requireAuth: false })

  const createRouteHandler = (prefix) => async (req, res) => {
    const url = new URL(req.url, 'http://localhost')
    const matched = ROUTE_PREFIXES.find((p) => url.pathname === p || url.pathname.startsWith(`${p}/`)) || prefix
    const path = url.pathname.startsWith(matched) ? (url.pathname.slice(matched.length) || '/') : url.pathname
    try {
      const handled = await controlHandler(req, res, path, url)
      if (!handled) sendJson(res, 404, { error: 'not found' })
    } catch (err) {
      log(`[error] ${req.method} ${req.url} → ${err?.message || err}`)
      if (!res.headersSent) {
        const status = err instanceof HttpInputError ? err.status : 500
        sendJson(res, status, { error: String(err?.message || err) })
      } else {
        res.end()
      }
    }
  }

  ctx.inject(['webServer'], (webCtx) => {
    webCtx.effect(() => {
      const unregisters = ROUTE_PREFIXES.map((prefix) => webCtx.webServer.register({
        kind: 'prefix',
        path: prefix,
        handler: createRouteHandler(prefix),
      }))
      log(`路由就绪 ${ROUTE_PREFIX}/api/state`)
      return () => {
        for (const unreg of unregisters) unreg()
      }
    }, 'mimo-tts: host route')
  })
}

export const PRESETS = PRESET_VOICES
