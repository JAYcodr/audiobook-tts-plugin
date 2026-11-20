/**
 * 统一参考音库（RefsStore）：
 * 自动纳管仓库内置 `refs/` 样本与用户上传的自定义参考音（存放在 dataDir/refs/），
 * 供本地 Qwen3-TTS、混合启动与 MiMo 声音克隆三种路径共用。
 */
import { spawn } from 'node:child_process'
import {
  existsSync, mkdirSync, readFileSync, renameSync, statSync, unlinkSync, writeFileSync,
} from 'node:fs'
import { basename, extname, join, resolve, sep } from 'node:path'
import { createHash, randomUUID } from 'node:crypto'
import { expandHomePath, findBinary, resolvePackageRoot, resolveRepoRoot } from './paths.mjs'
import { normalizeWav, parseWav, sliceWav } from './wav.mjs'

export const MAX_REF_BYTES = 10 * 1024 * 1024 // 10 MB
const ALLOWED_EXTS = new Set(['.wav', '.mp3', '.m4a'])

const BUILTIN_SPECS = [
  {
    id: 'builtin:narrator-14s',
    name: '旁白女声 · 14s 完整句（推荐）',
    filename: 'narrator-14s.wav',
    text: '我能隐隐约约感觉到，你和我一样，都有想要守护的东西……是那种，一步都不能退让，用尽一切办法都要守护的东西。',
    tags: ['旁白', '女声', '推荐'],
  },
  {
    id: 'builtin:narrator-10s',
    name: '旁白女声 · 10s 紧凑',
    filename: 'narrator-10s.wav',
    text: '我能隐隐约约感觉到，你和我一样，都有想要守护的东西，是那种，一步都不能退',
    tags: ['旁白', '女声'],
  },
  {
    id: 'builtin:narrator-5s',
    name: '旁白女声 · 5s 轻量',
    filename: 'narrator-5s.wav',
    text: '我能隐隐约约感觉到，你和我一样，都有想要守护',
    tags: ['旁白', '女声'],
  },
]

export class RefError extends Error {
  constructor(message, status = 400, code = 'ref_error') {
    super(message)
    this.name = 'RefError'
    this.status = status
    this.code = code
  }
}

export function mimeForExt(ext) {
  const e = String(ext || '').toLowerCase()
  if (e === '.mp3') return 'audio/mpeg'
  if (e === '.m4a') return 'audio/mp4'
  return 'audio/wav'
}

function inspectAudio(buf, ext) {
  const warnings = []
  let durationSec = null
  let sampleRate = null
  let channels = null
  if (ext === '.wav') {
    let parsed
    try {
      parsed = parseWav(buf)
    } catch (err) {
      throw new RefError(`WAV 格式无效：${err?.message || err}`, 400, 'invalid_wav')
    }
    durationSec = Number(parsed.durationSec.toFixed(2))
    sampleRate = parsed.sampleRate
    channels = parsed.channels
    if (durationSec < 5) warnings.push(`时长仅 ${durationSec}s（建议 5–15s，过短易音色飘移）`)
    if (durationSec > 20) warnings.push(`时长 ${durationSec}s（建议 5–15s，过长会增加冷启动与推理耗时）`)
  }
  return { durationSec, sampleRate, channels, warnings }
}

function decodeAudioRangeWithFfmpeg({
  ffmpegPath,
  inputPath,
  startSec,
  endSec,
  spawnImpl = spawn,
  timeoutMs = 30_000,
}) {
  return new Promise((resolvePromise, rejectPromise) => {
    let settled = false
    const finish = (err, buf) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      if (err) rejectPromise(err)
      else resolvePromise(buf)
    }

    const args = [
      '-hide_banner',
      '-loglevel', 'error',
      '-ss', String(startSec),
      '-to', String(endSec),
      '-i', inputPath,
      '-ac', '1',
      '-ar', '24000',
      '-sample_fmt', 's16',
      '-f', 'wav',
      'pipe:1',
    ]
    let child
    try {
      child = spawnImpl(ffmpegPath, args, { stdio: ['ignore', 'pipe', 'pipe'] })
    } catch (err) {
      return finish(err)
    }

    const outChunks = []
    const errChunks = []
    const timer = setTimeout(() => {
      try { child.kill?.('SIGKILL') } catch { /* ignore */ }
      finish(new Error('ffmpeg 裁剪超时'))
    }, timeoutMs)
    timer.unref?.()

    child.stdout?.on('data', (c) => outChunks.push(Buffer.from(c)))
    child.stderr?.on('data', (c) => errChunks.push(Buffer.from(c)))
    child.on('error', (err) => finish(err))
    child.on('close', (code) => {
      const out = Buffer.concat(outChunks)
      if (code === 0 && out.length >= 44) return finish(null, out)
      const detail = Buffer.concat(errChunks).toString('utf8').trim() || `exit code=${code}`
      finish(new Error(`ffmpeg 裁剪失败：${detail}`))
    })
  })
}

function findBuiltinRefsDir() {
  const candidates = [
    join(resolveRepoRoot(), 'refs'),
    join(resolvePackageRoot(), 'refs'),
  ]
  for (const dir of candidates) {
    if (existsSync(dir)) return dir
  }
  return candidates[0]
}

export class RefsStore {
  /**
   * @param {object} [opts]
   * @param {string} [opts.dataDir]
   * @param {string} [opts.builtinDir]
   * @param {(line:string)=>void} [opts.log]
   */
  constructor({ dataDir = '', builtinDir = '', log } = {}) {
    this.dataDir = dataDir
    this.refsDir = dataDir ? resolve(dataDir, 'refs') : ''
    this.indexFile = dataDir ? resolve(dataDir, 'refs-index.json') : ''
    this.backupFile = this.indexFile ? `${this.indexFile}.bak` : ''
    this.builtinDir = builtinDir || findBuiltinRefsDir()
    this.log = log || (() => {})
    this.custom = []
    this.loaded = false
    this.builtinMetaCache = new Map()
  }

  load() {
    this.loaded = true
    if (!this.indexFile) {
      this.custom = []
      return this
    }
    let raw = null
    try {
      raw = JSON.parse(readFileSync(this.indexFile, 'utf8'))
    } catch (err) {
      if (err.code !== 'ENOENT') {
        try { renameSync(this.indexFile, `${this.indexFile}.broken-${Date.now()}`) } catch { /* ignore */ }
      }
      if (this.backupFile) {
        try {
          raw = JSON.parse(readFileSync(this.backupFile, 'utf8'))
          this.log?.(`[refs] 主索引缺失或损坏，已从 ${this.backupFile} 恢复`)
        } catch { /* ignore */ }
      }
    }
    const items = Array.isArray(raw?.items) ? raw.items : []
    this.custom = items.filter((it) => it && typeof it.id === 'string' && typeof it.filename === 'string')
    return this
  }

  #ensureLoaded() {
    if (!this.loaded) this.load()
  }

  #save() {
    if (!this.indexFile) return
    mkdirSync(this.refsDir, { recursive: true })
    const text = JSON.stringify({ version: 1, items: this.custom }, null, 2)
    const tmp = `${this.indexFile}.tmp`
    writeFileSync(tmp, text)
    renameSync(tmp, this.indexFile)
    try { writeFileSync(this.backupFile, text) } catch { /* ignore */ }
  }

  builtinList() {
    return BUILTIN_SPECS.map((spec) => {
      const wav = join(this.builtinDir, spec.filename)
      const exists = existsSync(wav)
      let meta = { durationSec: null, sampleRate: null, channels: null, warnings: [] }
      let sizeBytes = 0
      if (exists) {
        try {
          const st = statSync(wav)
          sizeBytes = st.size
          const cached = this.builtinMetaCache.get(wav)
          if (cached && cached.size === st.size && cached.mtimeMs === st.mtimeMs) {
            meta = cached.meta
          } else {
            meta = inspectAudio(readFileSync(wav), '.wav')
            this.builtinMetaCache.set(wav, { size: st.size, mtimeMs: st.mtimeMs, meta })
          }
        } catch { /* ignore */ }
      }
      return {
        id: spec.id,
        name: spec.name,
        filename: spec.filename,
        ext: '.wav',
        wav: exists ? wav : '',
        text: spec.text,
        tags: spec.tags,
        builtin: true,
        exists,
        sizeBytes,
        ...meta,
      }
    })
  }

  list() {
    this.#ensureLoaded()
    const customs = this.custom.map((it) => {
      const activeName = it.clipFilename || it.filename
      const wav = this.#safeFilePath(activeName)
      const rawWav = this.#safeFilePath(it.filename)
      const exists = Boolean(wav && existsSync(wav))
      return {
        ...it,
        wav: exists ? wav : '',
        rawWav: (rawWav && existsSync(rawWav)) ? rawWav : '',
        hasClip: Boolean(it.clipFilename && exists),
        builtin: false,
        exists,
      }
    })
    return [...this.builtinList(), ...customs]
  }

  get(id) {
    return this.list().find((it) => it.id === id) || null
  }

  #safeFilePath(filename) {
    if (!this.refsDir) return ''
    const base = basename(String(filename || ''))
    if (!base || base !== filename || base.includes('..')) return ''
    const target = resolve(this.refsDir, base)
    if (!target.startsWith(this.refsDir + sep)) return ''
    return target
  }

  /** 上传自定义参考音，校验路径穿越、白名单扩展名、大小上限及 WAV 完整性。 */
  add({ name, filename, dataBase64, text = '', tags = [] }) {
    this.#ensureLoaded()
    if (!this.refsDir) throw new RefError('当前实例未配置数据目录，无法保存参考音', 500, 'no_data_dir')

    const cleanName = String(name || '').trim().slice(0, 80)
    if (!cleanName) throw new RefError('参考音名称不能为空', 400, 'missing_name')

    const rawFilename = String(filename || '').trim()
    if (!rawFilename || rawFilename.includes('..') || rawFilename.includes('/') || rawFilename.includes('\\')) {
      throw new RefError('非法文件名或包含路径穿越字符', 400, 'unsafe_path')
    }
    const rawBase = basename(rawFilename)
    const ext = extname(rawBase).toLowerCase()
    if (!ALLOWED_EXTS.has(ext)) {
      throw new RefError('仅支持上传 .wav / .mp3 / .m4a 音频文件', 400, 'bad_extension')
    }

    const rawB64 = String(dataBase64 || '').trim().replace(/^data:[^;]+;base64,/i, '')
    if (!rawB64) throw new RefError('音频内容不能为空', 400, 'empty_audio')
    const buf = Buffer.from(rawB64, 'base64')
    if (!buf.length) throw new RefError('音频解码为空', 400, 'empty_audio')
    if (buf.length > MAX_REF_BYTES) {
      throw new RefError(`参考音大小超过 10 MB 上限（当前 ${(buf.length / 1048576).toFixed(1)} MB）`, 413, 'too_large')
    }

    const meta = inspectAudio(buf, ext)
    const id = `custom:${randomUUID().slice(0, 8)}`
    const safeFilename = `${id.replace(':', '-')}${ext}`
    const target = this.#safeFilePath(safeFilename)
    if (!target) throw new RefError('非法文件路径', 400, 'unsafe_path')

    mkdirSync(this.refsDir, { recursive: true })
    const tmp = `${target}.tmp`
    writeFileSync(tmp, buf)
    renameSync(tmp, target)

    const cleanText = String(text || '').trim().slice(0, 500)
    if (!cleanText) meta.warnings.push('未填写逐字参考文本（本地 Qwen3-TTS 必须填写，MiMo 克隆可不填）')

    const cleanTags = Array.isArray(tags)
      ? tags.map((t) => String(t).trim()).filter(Boolean).slice(0, 6)
      : []

    const entry = {
      id,
      name: cleanName,
      filename: safeFilename,
      ext,
      text: cleanText,
      tags: cleanTags,
      sizeBytes: buf.length,
      durationSec: meta.durationSec,
      sampleRate: meta.sampleRate,
      channels: meta.channels,
      warnings: meta.warnings,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    this.custom.push(entry)
    this.#save()
    return { ...entry, wav: target, builtin: false, exists: true }
  }

  update(id, { name, text, tags }) {
    this.#ensureLoaded()
    if (String(id || '').startsWith('builtin:')) {
      throw new RefError('内置参考音为只读样本，不可修改', 403, 'builtin_readonly')
    }
    const idx = this.custom.findIndex((it) => it.id === id)
    if (idx < 0) throw new RefError(`未找到参考音：${id}`, 404, 'not_found')

    const cur = this.custom[idx]
    if (name !== undefined) {
      const cleanName = String(name || '').trim().slice(0, 80)
      if (!cleanName) throw new RefError('参考音名称不能为空', 400, 'missing_name')
      cur.name = cleanName
    }
    if (text !== undefined) cur.text = String(text || '').trim().slice(0, 500)
    if (tags !== undefined && Array.isArray(tags)) {
      cur.tags = tags.map((t) => String(t).trim()).filter(Boolean).slice(0, 6)
    }
    cur.warnings = (cur.warnings || []).filter((w) => !w.includes('逐字参考文本'))
    if (!cur.text) cur.warnings.push('未填写逐字参考文本（本地 Qwen3-TTS 必须填写，MiMo 克隆可不填）')
    cur.updatedAt = Date.now()
    this.#save()
    return this.get(id)
  }

  /**
   * 对自定义参考音进行非破坏性区间裁剪（生成独立 *-clip.wav，保留原始文件可供重选或恢复）。
   */
  async clip(id, {
    startSec = 0,
    endSec,
    normalize = false,
    targetRms = 0.126,
    findBinaryImpl,
    spawnImpl,
    probe,
  } = {}) {
    this.#ensureLoaded()
    if (String(id || '').startsWith('builtin:')) {
      throw new RefError('内置参考音为只读样本，不可裁剪', 403, 'builtin_readonly')
    }
    const idx = this.custom.findIndex((it) => it.id === id)
    if (idx < 0) throw new RefError(`未找到参考音：${id}`, 404, 'not_found')

    const cur = this.custom[idx]
    const origPath = this.#safeFilePath(cur.filename)
    if (!origPath || !existsSync(origPath)) {
      throw new RefError(`原始参考音文件丢失：${id}`, 404, 'not_found')
    }

    const start = Number(startSec)
    const end = Number(endSec)
    if (!Number.isFinite(start) || !Number.isFinite(end) || start < 0 || end <= start) {
      throw new RefError('裁剪起止秒数不合法', 400, 'bad_clip_range')
    }
    const span = end - start
    if (span < 1 || span > 30) {
      throw new RefError('裁剪时长需在 1–30 秒内（推荐 5–15 秒）', 400, 'bad_clip_duration')
    }

    let outWav
    let clippedMeta
    if (cur.ext === '.wav') {
      try {
        const sliced = sliceWav(readFileSync(origPath), {
          startSec: start,
          endSec: end,
          normalize: Boolean(normalize),
          targetRms,
        })
        outWav = sliced.wav
        clippedMeta = sliced
      } catch (err) {
        throw new RefError(String(err?.message || err), 400, 'clip_failed')
      }
    } else {
      const ffmpegPath = (typeof findBinaryImpl === 'function' ? findBinaryImpl : findBinary)('ffmpeg', probe)
      if (!ffmpegPath) {
        throw new RefError('裁剪 MP3 / M4A 参考音需要本机安装 ffmpeg（或改传 WAV 文件）', 501, 'ffmpeg_missing')
      }
      try {
        let decoded = await decodeAudioRangeWithFfmpeg({
          ffmpegPath,
          inputPath: origPath,
          startSec: start,
          endSec: end,
          spawnImpl,
        })
        if (normalize) decoded = normalizeWav(decoded, { targetRms })
        const p = parseWav(decoded)
        outWav = decoded
        clippedMeta = {
          sampleRate: p.sampleRate,
          channels: p.channels,
          durationSec: Number(p.durationSec.toFixed(2)),
        }
      } catch (err) {
        throw new RefError(String(err?.message || err), 400, 'clip_failed')
      }
    }

    const clipFilename = `${cur.id.replace(':', '-')}-clip.wav`
    const clipPath = this.#safeFilePath(clipFilename)
    if (!clipPath) throw new RefError('非法裁剪路径', 400, 'unsafe_path')
    mkdirSync(this.refsDir, { recursive: true })
    const tmp = `${clipPath}.tmp`
    writeFileSync(tmp, outWav)
    renameSync(tmp, clipPath)

    if (cur.rawDurationSec === undefined) cur.rawDurationSec = cur.durationSec
    const meta = inspectAudio(outWav, '.wav')
    if (meta.durationSec > 15 && meta.durationSec <= 20) {
      meta.warnings.push(`时长 ${meta.durationSec}s（推荐 5–15s 黄金克隆区间）`)
    }
    if (!cur.text) meta.warnings.push('未填写逐字参考文本（本地 Qwen3-TTS 必须填写，MiMo 克隆可不填）')

    cur.clipFilename = clipFilename
    cur.clipStart = Number(start.toFixed(2))
    cur.clipEnd = Number(end.toFixed(2))
    cur.clipDuration = clippedMeta.durationSec
    cur.clipNormalized = Boolean(normalize)
    cur.durationSec = clippedMeta.durationSec
    cur.sampleRate = meta.sampleRate
    cur.channels = meta.channels
    cur.warnings = meta.warnings
    cur.updatedAt = Date.now()
    this.#save()
    return this.get(id)
  }

  /** 删除裁剪产物并恢复为原始上传参考音。 */
  clearClip(id) {
    this.#ensureLoaded()
    if (String(id || '').startsWith('builtin:')) {
      throw new RefError('内置参考音为只读样本', 403, 'builtin_readonly')
    }
    const idx = this.custom.findIndex((it) => it.id === id)
    if (idx < 0) throw new RefError(`未找到参考音：${id}`, 404, 'not_found')

    const cur = this.custom[idx]
    if (cur.clipFilename) {
      const oldClip = this.#safeFilePath(cur.clipFilename)
      if (oldClip && existsSync(oldClip)) {
        try { unlinkSync(oldClip) } catch { /* ignore */ }
      }
    }
    delete cur.clipFilename
    delete cur.clipStart
    delete cur.clipEnd
    delete cur.clipDuration
    delete cur.clipNormalized

    const origPath = this.#safeFilePath(cur.filename)
    let warnings = []
    if (origPath && existsSync(origPath) && cur.ext === '.wav') {
      const meta = inspectAudio(readFileSync(origPath), '.wav')
      cur.durationSec = meta.durationSec
      cur.sampleRate = meta.sampleRate
      cur.channels = meta.channels
      warnings = meta.warnings
    } else if (cur.rawDurationSec !== undefined) {
      cur.durationSec = cur.rawDurationSec
    }
    if (!cur.text) warnings.push('未填写逐字参考文本（本地 Qwen3-TTS 必须填写，MiMo 克隆可不填）')
    cur.warnings = warnings
    cur.updatedAt = Date.now()
    this.#save()
    return this.get(id)
  }

  remove(id) {
    this.#ensureLoaded()
    if (String(id || '').startsWith('builtin:')) {
      throw new RefError('内置参考音不可删除', 403, 'builtin_readonly')
    }
    const idx = this.custom.findIndex((it) => it.id === id)
    if (idx < 0) throw new RefError(`未找到参考音：${id}`, 404, 'not_found')

    const [removed] = this.custom.splice(idx, 1)
    for (const fname of [removed.filename, removed.clipFilename]) {
      if (!fname) continue
      const target = this.#safeFilePath(fname)
      if (target && existsSync(target)) {
        try { unlinkSync(target) } catch { /* ignore */ }
      }
    }
    this.#save()
    return { ok: true, id }
  }

  readAudio(id, { raw = false } = {}) {
    const item = this.get(id)
    const targetPath = raw ? (item?.rawWav || item?.wav) : item?.wav
    if (!item || !targetPath || !existsSync(targetPath)) {
      throw new RefError(`参考音文件不存在：${id}`, 404, 'not_found')
    }
    const ext = raw ? (item.ext || extname(targetPath)) : extname(targetPath)
    return {
      item,
      buffer: readFileSync(targetPath),
      mime: mimeForExt(ext),
      filename: raw ? item.filename : (item.clipFilename || item.filename),
    }
  }

  /**
   * 统一解析 refId 或旧格式 { wav, text }：
   * 返回 { id, name, wav, text, builtin, exists, missing, warnings }
   */
  resolveRef(refSpec) {
    if (!refSpec) return { id: '', name: '', wav: '', text: '', builtin: false, exists: false }
    if (typeof refSpec === 'string') {
      const found = this.get(refSpec)
      if (found) return found
      const wav = expandHomePath(refSpec)
      return { id: '', name: '', wav, text: '', builtin: false, exists: Boolean(wav && existsSync(wav)) }
    }
    const refId = String(refSpec.refId || '').trim()
    if (refId) {
      const found = this.get(refId)
      if (!found) {
        return {
          id: refId,
          name: '',
          wav: '',
          text: String(refSpec.text || '').trim(),
          builtin: refId.startsWith('builtin:'),
          exists: false,
          missing: true,
        }
      }
      return {
        ...found,
        text: String(refSpec.text || '').trim() || found.text,
      }
    }
    const wav = expandHomePath(refSpec.wav)
    const text = String(refSpec.text || '').trim()
    return {
      id: '',
      name: '',
      wav,
      text,
      builtin: false,
      exists: Boolean(wav && existsSync(wav)),
    }
  }
}

/** 计算参考音配置摘要（用于 Local/Hybrid/MiMo 缓存键失效判定） */
export function computeRefsDigest(refsCfg, refsStore = null) {
  const parts = ['narrator', 'dialogue'].map((role) => {
    const r = refsCfg?.[role]
    const res = refsStore
      ? refsStore.resolveRef(r)
      : { id: '', wav: expandHomePath(r?.wav), text: String(r?.text || '').trim() }
    let stTag = ''
    if (res.wav) {
      try {
        const st = statSync(res.wav)
        stTag = `${Math.trunc(st.mtimeMs)}:${st.size}`
      } catch { stTag = '' }
    }
    return [
      res.id || '',
      res.wav || '',
      stTag,
      res.text || '',
      res.clipStart || 0,
      res.clipEnd || 0,
      res.clipNormalized ? 1 : 0,
    ]
  })
  return createHash('sha1').update(JSON.stringify(parts)).digest('hex').slice(0, 8)
}
