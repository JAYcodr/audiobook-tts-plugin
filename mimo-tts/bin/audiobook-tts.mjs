#!/usr/bin/env node
/**
 * 独立运行入口：不依赖 DSH，`node bin/audiobook-tts.mjs`（或 `mimo-tts` 别名）即可直接起服务。
 *
 * 数据目录优先级：--data <dir> > AUDIOBOOK_TTS_DATA > MIMO_TTS_DATA > ./data
 * 环境变量只做首次种子，config.json 一旦存在以文件为准。
 */
import { resolve } from 'node:path'
import { Store } from '../src/config.mjs'
import { TtsService } from '../src/service.mjs'

const args = process.argv.slice(2)
const flag = (name) => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 ? args[i + 1] : undefined
}

const dataDir = resolve(flag('data') || process.env.AUDIOBOOK_TTS_DATA || process.env.MIMO_TTS_DATA || 'data')
const store = new Store(dataDir)
store.log = (line) => console.log(new Date().toISOString().slice(11, 19), line)
const config = store.load()

const port = flag('port')
if (port) config.server.port = Number(port)
const host = flag('host')
if (host) config.server.host = host

const service = new TtsService({
  store,
  log: (line) => console.log(new Date().toISOString().slice(11, 19), line),
})

const shutdown = async (signal) => {
  console.log(`\n收到 ${signal}，停止服务…`)
  await service.stop()
  process.exit(0)
}
process.on('SIGINT', () => shutdown('SIGINT'))
process.on('SIGTERM', () => shutdown('SIGTERM'))

await service.start()
const info = service.info()
console.log('')
console.log(`  Audiobook TTS 听书服务  v${info.version} (${info.provider})`)
console.log(`  服务地址   http://${info.host}:${info.port}`)
console.log(`  配置目录   ${dataDir}`)
console.log(`  朗读入口   ${info.url}/listening`)
console.log(`  Legado 导入 ${info.url}/legado.json${config.auth.token ? '?token=…' : ''}`)
console.log('')
if (info.provider === 'mimo' && !config.upstream.keys.length) {
  console.log('  ⚠ 还没有 MiMo API Key：在控制台「传输」里填，或启动前设 MIMO_API_KEY')
  console.log('')
}
