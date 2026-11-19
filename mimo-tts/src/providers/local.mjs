/**
 * 本地 Qwen3-TTS (MLX sidecar) Provider。
 */
import { createHash } from 'node:crypto'
import { TTSProvider } from './base.mjs'
import { LocalEngine } from '../local.mjs'

export class LocalProvider extends TTSProvider {
  constructor(deps) {
    super({ ...deps, id: 'local', label: '本地 Qwen3-TTS' })
    this.engine = new LocalEngine({
      getConfig: deps.getConfig,
      dataDir: deps.dataDir,
      log: this.log,
    })
  }

  modelKey() {
    const localCfg = this.getConfig().upstream?.local || {}
    const refTag = createHash('sha1').update(JSON.stringify(localCfg.refs || {})).digest('hex').slice(0, 8)
    return `local:${localCfg.modelPath || ''}:${refTag}`
  }

  onCacheHit() {
    this.engine.touch()
  }

  async synthesizeSegment(req) {
    return this.engine.synthesize({ text: req.text, role: req.role })
  }

  async synthesizeBatch(requests, ctx = {}) {
    return super.synthesizeBatch(requests, { ...ctx, concurrency: 1 })
  }

  status() {
    return this.engine.status()
  }

  async onConfigChange(before, after) {
    const changed = before?.upstream?.provider !== after?.upstream?.provider
      || JSON.stringify(before?.upstream?.local) !== JSON.stringify(after?.upstream?.local)
    if (changed) {
      await this.engine.invalidate().catch((err) => this.log(`[warn] 本地引擎重启失败：${err?.message || err}`))
    }
  }

  async shutdown() {
    await this.engine.shutdown().catch((err) => this.log(`[warn] 本地引擎停止失败：${err?.message || err}`))
  }
}
