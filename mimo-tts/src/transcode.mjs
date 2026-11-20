/**
 * 音频格式转码工具：通过本机 ffmpeg 管道把合成后的 WAV 实时转码为 MP3 / Opus。
 *
 * 设计约束：
 * - 零新增 npm 依赖：直接调用本机 `ffmpeg` 子进程 stdin/stdout 管道，不写临时文件；
 * - 无 ffmpeg 或转码异常时自动安全回退 WAV，并附带可追踪的 fallback/reason，保证听书不断流；
 * - 支持测试注入 `findBinaryImpl` / `spawnImpl` / `probe`，确保单元测试宿主机无关。
 */
import { spawn } from 'node:child_process'
import { findBinary } from './paths.mjs'
import { parseWav } from './wav.mjs'

export const AUDIO_FORMATS = new Set(['wav', 'mp3', 'opus'])
export const LEGADO_FORMATS = new Set(['wav', 'mp3'])
export const OPENAI_FORMATS = new Set(['wav', 'mp3', 'opus', 'pcm'])
export const ALLOWED_BITRATES = [32, 48, 64, 128]
const DEFAULT_BITRATE = 64
const DEFAULT_TIMEOUT_MS = 30_000

const CONTENT_TYPES = {
  wav: 'audio/wav',
  mp3: 'audio/mpeg',
  opus: 'audio/ogg; codecs=opus',
  pcm: 'audio/pcm',
}

/** 返回指定格式对应的 HTTP Content-Type。 */
export function contentTypeForFormat(format) {
  const fmt = String(format || 'wav').trim().toLowerCase() || 'wav'
  return CONTENT_TYPES[fmt] || CONTENT_TYPES.wav
}

/** 规范化码率到允许档位（32 / 48 / 64 / 128 kbps）。 */
export function normalizeBitrate(value, fallback = DEFAULT_BITRATE) {
  const n = Number(value)
  return ALLOWED_BITRATES.includes(n) ? n : fallback
}

/** 检测本机 ffmpeg 可执行文件路径，找不到返回空串。 */
export function resolveFfmpegPath({ findBinaryImpl, probe } = {}) {
  const fn = typeof findBinaryImpl === 'function' ? findBinaryImpl : findBinary
  return String(fn('ffmpeg', probe) || '')
}

/** 构造 ffmpeg 管道转码参数（仅允许 mp3 / opus 白名单）。 */
export function buildFfmpegArgs(format, bitrate = DEFAULT_BITRATE) {
  const br = normalizeBitrate(bitrate)
  const base = ['-hide_banner', '-loglevel', 'error', '-f', 'wav', '-i', 'pipe:0']
  if (format === 'mp3') {
    return [...base, '-c:a', 'libmp3lame', '-b:a', `${br}k`, '-f', 'mp3', 'pipe:1']
  }
  if (format === 'opus') {
    return [
      ...base,
      '-c:a', 'libopus',
      '-b:a', `${br}k`,
      '-vbr', 'on',
      '-application', 'voip',
      '-f', 'ogg',
      'pipe:1',
    ]
  }
  throw new Error(`Unsupported transcode target format: ${format}`)
}

function runFfmpegPipe({ ffmpegPath, args, input, spawnImpl = spawn, timeoutMs = DEFAULT_TIMEOUT_MS }) {
  return new Promise((resolve, reject) => {
    let settled = false
    const finish = (err, buf) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      if (err) reject(err)
      else resolve(buf)
    }

    let child
    try {
      child = spawnImpl(ffmpegPath, args, { stdio: ['pipe', 'pipe', 'pipe'] })
    } catch (err) {
      return finish(err)
    }

    const outChunks = []
    const errChunks = []
    const timer = setTimeout(() => {
      try { child.kill?.('SIGKILL') } catch { /* ignore */ }
      finish(new Error(`ffmpeg 转码超时（>${timeoutMs}ms）`))
    }, timeoutMs)
    timer.unref?.()

    child.stdout?.on('data', (chunk) => outChunks.push(Buffer.from(chunk)))
    child.stderr?.on('data', (chunk) => errChunks.push(Buffer.from(chunk)))
    child.on('error', (err) => finish(err))
    child.stdin?.on('error', () => { /* ignore EPIPE if ffmpeg exited early */ })

    child.on('close', (code, signal) => {
      const out = Buffer.concat(outChunks)
      if (code === 0 && out.length > 0) {
        return finish(null, out)
      }
      const stderr = Buffer.concat(errChunks).toString('utf8').trim()
      const detail = stderr || `exit code=${code ?? 'null'} signal=${signal || '-'}`
      finish(new Error(`ffmpeg 转码失败：${detail}`))
    })

    try {
      child.stdin?.end(input)
    } catch (err) {
      finish(err)
    }
  })
}

/**
 * 将 WAV 缓冲转换为目标格式（wav / pcm / mp3 / opus）。
 * @returns {Promise<{buffer:Buffer,format:string,contentType:string,durationSec?:number,fallback:boolean,reason:string,error?:string}>}
 */
export async function transcodeWav(wavBuf, {
  format = 'wav',
  bitrate = DEFAULT_BITRATE,
  findBinaryImpl,
  spawnImpl,
  probe,
  timeoutMs = DEFAULT_TIMEOUT_MS,
} = {}) {
  const fmt = String(format || 'wav').trim().toLowerCase() || 'wav'
  if (fmt === 'wav') {
    return {
      buffer: wavBuf,
      format: 'wav',
      contentType: CONTENT_TYPES.wav,
      fallback: false,
      reason: '',
    }
  }
  if (fmt === 'pcm') {
    const parsed = parseWav(wavBuf)
    return {
      buffer: parsed.pcm,
      format: 'pcm',
      contentType: CONTENT_TYPES.pcm,
      durationSec: Number.isFinite(parsed.durationSec) ? parsed.durationSec : undefined,
      fallback: false,
      reason: '',
    }
  }
  if (fmt !== 'mp3' && fmt !== 'opus') {
    return {
      buffer: wavBuf,
      format: 'wav',
      contentType: CONTENT_TYPES.wav,
      fallback: true,
      reason: 'unsupported_format',
      error: `unsupported target format: ${fmt}`,
    }
  }

  const ffmpegPath = resolveFfmpegPath({ findBinaryImpl, probe })
  if (!ffmpegPath) {
    return {
      buffer: wavBuf,
      format: 'wav',
      contentType: CONTENT_TYPES.wav,
      fallback: true,
      reason: 'ffmpeg_missing',
    }
  }

  try {
    const args = buildFfmpegArgs(fmt, bitrate)
    const out = await runFfmpegPipe({
      ffmpegPath,
      args,
      input: wavBuf,
      spawnImpl: spawnImpl || spawn,
      timeoutMs,
    })
    return {
      buffer: out,
      format: fmt,
      contentType: contentTypeForFormat(fmt),
      fallback: false,
      reason: '',
    }
  } catch (err) {
    return {
      buffer: wavBuf,
      format: 'wav',
      contentType: CONTENT_TYPES.wav,
      fallback: true,
      reason: 'transcode_failed',
      error: String(err?.message || err),
    }
  }
}
