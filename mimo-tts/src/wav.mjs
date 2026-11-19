/**
 * WAV：解析、拼接、编码。
 *
 * MiMo 固定返回 24kHz / 单声道 / PCM16，所以「合并」在正常路径上就是拼字节。
 * 但上游一旦改格式（多声道、不同采样率），拼接必须仍然正确 —— 所以解析器
 * 走完整的 RIFF chunk 遍历，不假设 44 字节定长头。
 */

const RIFF = 0x52494646 // 'RIFF'
const WAVE = 0x57415645 // 'WAVE'
const FMT = 0x666d7420 // ' fmt'
const DATA = 0x64617461 // 'data'

/** @returns {{sampleRate:number, channels:number, bitsPerSample:number, pcm:Buffer, durationSec:number}} */
export function parseWav(buf) {
  if (!Buffer.isBuffer(buf) || buf.length < 12) throw new Error('WAV 太短')
  if (buf.readUInt32BE(0) !== RIFF || buf.readUInt32BE(8) !== WAVE) throw new Error('不是 RIFF/WAVE')

  let off = 12
  let fmt = null
  let data = null
  while (off + 8 <= buf.length) {
    const id = buf.readUInt32BE(off)
    const size = buf.readUInt32LE(off + 4)
    const body = off + 8
    // 有些流式 WAV 会写 0xFFFFFFFF / 0，实际长度以文件尾为准
    const avail = Math.max(0, buf.length - body)
    const take = size > avail || size === 0xffffffff ? avail : Math.min(size, avail)

    if (id === FMT && take >= 16) {
      fmt = {
        audioFormat: buf.readUInt16LE(body),
        channels: buf.readUInt16LE(body + 2),
        sampleRate: buf.readUInt32LE(body + 4),
        bitsPerSample: buf.readUInt16LE(body + 14),
      }
    } else if (id === DATA) {
      data = buf.subarray(body, body + take)
    }
    if (fmt && data) break
    off = body + take + (take % 2) // chunk 偶数对齐
    if (take === 0 && id !== DATA) break
  }

  if (!fmt || !data) throw new Error('WAV 缺少 fmt/data 块')
  if (fmt.audioFormat !== 1) throw new Error(`不支持的 WAV 编码 ${fmt.audioFormat}（只处理 PCM）`)
  const bytesPerSample = fmt.bitsPerSample / 8
  const durationSec = data.length / (fmt.sampleRate * fmt.channels * bytesPerSample)
  return { sampleRate: fmt.sampleRate, channels: fmt.channels, bitsPerSample: fmt.bitsPerSample, pcm: data, durationSec }
}

/** 生成标准 44 字节头的 WAV。长度真实，播放器能算出时长。 */
export function encodeWav(pcm, sampleRate = 24000, channels = 1, bitsPerSample = 16) {
  const byteRate = (sampleRate * channels * bitsPerSample) / 8
  const blockAlign = (channels * bitsPerSample) / 8
  const header = Buffer.alloc(44)
  header.write('RIFF', 0, 'ascii')
  header.writeUInt32LE(36 + pcm.length, 4)
  header.write('WAVE', 8, 'ascii')
  header.write('fmt ', 12, 'ascii')
  header.writeUInt32LE(16, 16)
  header.writeUInt16LE(1, 20) // PCM
  header.writeUInt16LE(channels, 22)
  header.writeUInt32LE(sampleRate, 24)
  header.writeUInt32LE(byteRate, 28)
  header.writeUInt16LE(blockAlign, 32)
  header.writeUInt16LE(bitsPerSample, 34)
  header.write('data', 36, 'ascii')
  header.writeUInt32LE(pcm.length, 40)
  return Buffer.concat([header, pcm])
}

/**
 * 长度未知的流式 WAV 头（兼容旧行为）。
 *
 * ⚠️ 只在明确要「边合成边发」时使用：ExoPlayer 会把时长算成约 13 小时，
 * Legado 的段落内进度与自动翻页会因此失真。默认路径不用它。
 */
export function streamingWavHeader(sampleRate = 24000, channels = 1, bitsPerSample = 16) {
  const dataSize = 0x7fffffff
  const byteRate = (sampleRate * channels * bitsPerSample) / 8
  const blockAlign = (channels * bitsPerSample) / 8
  const h = Buffer.alloc(44)
  h.write('RIFF', 0, 'ascii')
  h.writeUInt32LE(36 + dataSize, 4)
  h.write('WAVE', 8, 'ascii')
  h.write('fmt ', 12, 'ascii')
  h.writeUInt32LE(16, 16)
  h.writeUInt16LE(1, 20)
  h.writeUInt16LE(channels, 22)
  h.writeUInt32LE(sampleRate, 24)
  h.writeUInt32LE(byteRate, 28)
  h.writeUInt16LE(blockAlign, 32)
  h.writeUInt16LE(bitsPerSample, 34)
  h.write('data', 36, 'ascii')
  h.writeUInt32LE(dataSize, 40)
  return h
}

/** 多声道降混为单声道（int16） */
function downmix(pcm, channels) {
  if (channels === 1) return pcm
  const frames = Math.floor(pcm.length / (2 * channels))
  const out = Buffer.alloc(frames * 2)
  for (let i = 0; i < frames; i++) {
    let sum = 0
    for (let c = 0; c < channels; c++) sum += pcm.readInt16LE((i * channels + c) * 2)
    const v = Math.max(-32768, Math.min(32767, Math.round(sum / channels)))
    out.writeInt16LE(v, i * 2)
  }
  return out
}

/** 线性插值重采样（只在采样率不一致时兜底用） */
function resample(pcm, from, to) {
  if (from === to) return pcm
  const srcFrames = pcm.length / 2
  const dstFrames = Math.max(1, Math.round((srcFrames * to) / from))
  const out = Buffer.alloc(dstFrames * 2)
  for (let i = 0; i < dstFrames; i++) {
    const pos = (i * (srcFrames - 1)) / Math.max(1, dstFrames - 1)
    const i0 = Math.floor(pos)
    const i1 = Math.min(srcFrames - 1, i0 + 1)
    const t = pos - i0
    const a = pcm.readInt16LE(i0 * 2)
    const b = pcm.readInt16LE(i1 * 2)
    out.writeInt16LE(Math.round(a + (b - a) * t), i * 2)
  }
  return out
}

/**
 * 拼接多个 WAV：统一成第一个可解析段的采样率/单声道/16bit 后直接拼 PCM。
 * 解析失败的段用 0.4s 静音占位 —— 宁可多一段静音，也不要整段消失。
 */
export function concatWavs(buffers) {
  const parsed = []
  let sampleRate = 24000
  for (const buf of buffers) {
    if (!buf || !buf.length) { parsed.push(null); continue }
    try {
      const w = parseWav(buf)
      if (!parsed.length) sampleRate = w.sampleRate
      parsed.push(w)
    } catch {
      parsed.push(null)
    }
  }

  const parts = []
  let totalSec = 0
  for (const w of parsed) {
    if (!w) {
      parts.push(Buffer.alloc(Math.round(sampleRate * 0.4) * 2)) // 静音占位
      totalSec += 0.4
      continue
    }
    let pcm = w.bitsPerSample === 16 ? w.pcm : convertTo16(w)
    pcm = downmix(pcm, w.channels)
    pcm = resample(pcm, w.sampleRate, sampleRate)
    parts.push(pcm)
    totalSec += pcm.length / 2 / sampleRate
  }
  const pcm = Buffer.concat(parts)
  return { wav: encodeWav(pcm, sampleRate, 1, 16), pcm, sampleRate, durationSec: totalSec }
}

function convertTo16(w) {
  // 只处理 8/24/32bit 的少见情况；32bit float 不在此列（上游不会发）
  const bytes = w.bitsPerSample / 8
  const frames = w.pcm.length / (bytes * w.channels)
  const out = Buffer.alloc(frames * w.channels * 2)
  for (let i = 0; i < frames * w.channels; i++) {
    const off = i * bytes
    let v
    if (bytes === 1) v = (w.pcm[off] - 128) * 256
    else if (bytes === 3) v = w.pcm.readIntLE(off, 3) >> 8
    else v = w.pcm.readInt32LE(off) >> 16
    out.writeInt16LE(Math.max(-32768, Math.min(32767, v)), i * 2)
  }
  return out
}

/**
 * 把一段 16bit 单声道 WAV 归一到目标 RMS（长听书里云端/本地混用时的音量对齐）。
 * 峰值超过 peakCap 时优先压增益，避免削波；变化小于 1% 时原样返回。
 */
export function normalizeWav(buf, { targetRms = 0.126, peakCap = 0.95 } = {}) {
  const w = parseWav(buf)
  if (w.bitsPerSample !== 16 || w.channels !== 1 || !w.pcm.length) return buf
  const frames = w.pcm.length / 2
  let sum = 0
  let peak = 0
  for (let i = 0; i < frames; i++) {
    const v = w.pcm.readInt16LE(i * 2) / 32768
    sum += v * v
    const a = Math.abs(v)
    if (a > peak) peak = a
  }
  const rms = Math.sqrt(sum / frames)
  if (rms < 1e-6 || peak < 1e-6) return buf
  let gain = targetRms / rms
  if (peak * gain > peakCap) gain = peakCap / peak
  if (Math.abs(gain - 1) < 0.01) return buf
  const out = Buffer.alloc(w.pcm.length)
  for (let i = 0; i < frames; i++) {
    const v = Math.max(-32768, Math.min(32767, Math.round(w.pcm.readInt16LE(i * 2) * gain)))
    out.writeInt16LE(v, i * 2)
  }
  return encodeWav(out, w.sampleRate, 1, 16)
}

/** 静音 WAV（合成失败时的占位） */
export function silentWav(durationSec = 0.4, sampleRate = 24000) {
  return encodeWav(Buffer.alloc(Math.round(sampleRate * durationSec) * 2), sampleRate)
}
