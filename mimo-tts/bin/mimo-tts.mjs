#!/usr/bin/env node
/**
 * 独立运行入口：不依赖 DSH，`node bin/mimo-tts.mjs` 就能起一个听书服务。
 *
 * 数据目录优先级：--data <dir> > MIMO_TTS_DATA > ./data
 * 环境变量只做种子（MIMO_API_KEY / MIMO_TTS_PORT / …），配置文件一旦存在以它为准。
 */
import { Store } from '../src/config.mjs'
import { TtsService } from '../src/service.mjs'
import { resolve } from 'node:path'

const args = process.argv.slice(2)
const flag = (name) => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 ? args[i + 1] : undefined
}

const dataDir = resolve(flag('data') || process.env.MIMO_TTS_DATA || 'data')
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
console.log(`  MiMo TTS 听书服务  v${info.version}`)
console.log(`  服务地址   http://${info.host}:${info.port}`)
console.log(`  配置目录   ${dataDir}`)
console.log(`  朗读入口   ${info.url}/listening`)
console.log(`  Legado 导入 ${info.url}/legado.json${config.auth.token ? '?token=…' : ''}`)
console.log('')
if (!config.upstream.keys.length) {
  console.log('  ⚠ 还没有 API Key：在控制台「上游」里填，或启动前设 MIMO_API_KEY')
  console.log('')
}
