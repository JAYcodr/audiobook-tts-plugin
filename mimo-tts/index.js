/**
 * Audiobook TTS（听书值守）· DSH 宿主半边
 *
 * 职责只有三件：
 *   1. 拥有配置（config.json 落在 DSH 的插件数据目录里，重启不丢）
 *   2. 拥有服务生命周期（启动 / 停止 / 换端口后重启）
 *   3. 在 DSH 自己的 HTTP 服务上挂 /mimo-tts/api/* 与 /audiobook-tts/api/*，给浏览器半边用
 *
 * 另外把同一个配置入口包一层 DSH 工具（audiobook_tts_config）：
 * 工具与 `audiobook-tts config` CLI 共用 src/config-cli.mjs，不各写一份校验。
 */
import { PRESET_VOICES, Store } from './src/config.mjs'
import { resolveDataDir, runConfigAction } from './src/config-cli.mjs'
import { createControlHandler } from './src/control-api.mjs'
import { HttpInputError, sendJson } from './src/http.mjs'
import { TtsService } from './src/service.mjs'

// 保留 cordis 组件名与 /mimo-tts 主路由以确保已有 DSH profile 与前端面板无缝兼容
export const name = 'mimo-tts'
export const ROUTE_PREFIX = '/mimo-tts'
export const ROUTE_PREFIXES = ['/mimo-tts', '/audiobook-tts']

/**
 * 数据目录解析在 src/config-cli.mjs（CLI 与工具共用），这里重新导出以兼容旧引用。
 */
export { resolveDataDir }

export const CONFIG_TOOL_NAME = 'audiobook_tts_config'

/**
 * 兜底版 defineTool：桌面版 profile 常常没有 `@deepseek-ai/dsh-tools` 这份 peer，
 * 裸 import 会让整条插件不激活，所以拿不到时用本地等价实现。
 * 宿主 Tools.register 只要求 output.schema 是受支持的 JSON Schema；参数表原样投影给模型，
 * 这里只做「作者简写 → 原始 JSON Schema」的转换。
 */
export function localDefineTool(options) {
  const properties = {}
  const required = []
  for (const [key, definition] of Object.entries(options.parameters || {})) {
    const { required: isRequired, ...rest } = definition || {}
    if (rest.type === 'json') {
      const { type: _type, ...annotations } = rest
      properties[key] = annotations
    } else {
      properties[key] = rest
    }
    if (isRequired === true) required.push(key)
  }
  const parameters = { type: 'object', properties, ...(required.length ? { required } : {}) }
  const outputSchema = options.output?.schema || {}
  const render = options.output?.render
    || ((_args, value) => [{ type: 'text', text: typeof value === 'string' ? value : JSON.stringify(value, null, 2) }])
  return {
    name: options.name,
    description: options.description,
    parameters,
    output: {
      schema: outputSchema.type === 'json' ? {} : outputSchema,
      render,
    },
    execute: options.execute,
  }
}

/** 拿宿主的 defineTool；拿不到返回本地等价实现（不抛错，插件照常加载）。 */
export async function loadDefineTool(log = () => {}) {
  try {
    const mod = await import('@deepseek-ai/dsh-tools')
    if (typeof mod?.defineTool === 'function') return mod.defineTool
  } catch {
    /* 走下面的本地实现 */
  }
  log('dsh-tools 不可用，配置工具使用本地等价定义')
  return localDefineTool
}

/** 构造工具定义（纯函数，测试可直接校验 schema 与 execute）。 */
export function buildConfigToolDefinition(defineTool, { dataDir = '' } = {}) {
  return defineTool({
    name: CONFIG_TOOL_NAME,
    description: '读或改「听书值守」插件的配置（get / set / list / validate / export / import / doctor）。改配置优先用它，不要手写 config.json：它会做校验、原子落盘，并尝试热更新运行中的服务。密钥与 token 一律以掩码返回。',
    parameters: {
      action: { type: 'string', required: true, description: 'get 读取点路径；set 写点路径；list 列分组；validate 校验；export 导出脱敏配置；import 导入；doctor 离线体检' },
      path: { type: 'string', description: 'get / set 时是配置点路径（如 upstream.provider、upstream.keys.0）；export / import 时是文件路径（建议绝对路径）' },
      value: { type: 'json', description: 'set 的新值（字符串 / 数字 / 布尔 / 对象 / 数组）' },
      dryRun: { type: 'boolean', description: 'action=import 时只返回差异，不写文件' },
    },
    output: {
      schema: { type: 'json' },
      render: (_args, value) => [{ type: 'text', text: JSON.stringify(value, null, 2) }],
    },
    async execute(args) {
      return runConfigAction({
        action: String(args.action || ''),
        path: args.path === undefined ? undefined : String(args.path),
        value: args.value,
        dryRun: Boolean(args.dryRun),
        data: dataDir,
      }, { env: process.env, cwd: process.cwd() })
    },
  })
}

/**
 * 注册 DSH 工具（薄包装）。没有 tools 服务的 profile 不报错：ctx.inject 不会回调。
 * 返回 { registered } 供启动日志/测试判断。
 */
export async function registerConfigTool(ctx, { dataDir = '', log } = {}) {
  if (!ctx || typeof ctx.inject !== 'function') return { registered: false, reason: 'ctx.inject 不可用' }
  const defineTool = await loadDefineTool(log)
  let registered = false
  let error = null
  ctx.inject(['tools'], (toolsCtx) => {
    const tools = toolsCtx?.tools
    if (!tools || typeof tools.register !== 'function') return
    const register = () => {
      try {
        tools.register(buildConfigToolDefinition(defineTool, { dataDir }))
        registered = true
      } catch (err) {
        error = err
        log?.(`[warn] 配置工具注册失败：${err?.message || err}`)
      }
    }
    if (typeof toolsCtx.effect === 'function') {
      toolsCtx.effect(register, 'mimo-tts: config tool')
    } else {
      register()
    }
  })
  return { registered, ...(error ? { error } : {}) }
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

  registerConfigTool(ctx, { dataDir, log })
    .then((result) => {
      if (result?.registered) log(`配置工具已注册：${CONFIG_TOOL_NAME}`)
    })
    .catch((err) => log(`[warn] 配置工具注册失败：${err?.message || err}`))
}

export const PRESETS = PRESET_VOICES
