import test from 'node:test'
import assert from 'node:assert/strict'
import { encodeWav, parseWav, concatWavs, streamingWavHeader, silentWav, normalizeWav } from '../src/wav.mjs'

const pcmOf = (samples) => {
  const b = Buffer.alloc(samples.length * 2)
  samples.forEach((v, i) => b.writeInt16LE(v, i * 2))
  return b
}

test('编码后解析回同样的采样与参数', () => {
  const pcm = pcmOf([1, -1, 100, -100])
  const wav = encodeWav(pcm, 24000, 1, 16)
  const p = parseWav(wav)
  assert.equal(p.sampleRate, 24000)
  assert.equal(p.channels, 1)
  assert.equal(p.bitsPerSample, 16)
  assert.equal(p.pcm.length, pcm.length)
  assert.equal(wav.length, 44 + pcm.length)
})

test('RIFF 头里写的是真实长度（播放器能算出时长）', () => {
  const wav = encodeWav(pcmOf(new Array(24000).fill(0)))
  assert.equal(wav.readUInt32LE(4), wav.length - 8)
  assert.equal(wav.readUInt32LE(40), wav.length - 44)
  assert.ok(Math.abs(parseWav(wav).durationSec - 1) < 0.001)
})

test('拼接两段后长度与时长相加', () => {
  const a = encodeWav(pcmOf(new Array(24000).fill(10)))
  const b = encodeWav(pcmOf(new Array(12000).fill(20)))
  const out = concatWavs([a, b])
  assert.equal(out.pcm.length, 72000)
  assert.ok(Math.abs(out.durationSec - 1.5) < 0.001)
})

test('坏段用静音占位，不让整段消失', () => {
  const good = encodeWav(pcmOf(new Array(24000).fill(7)))
  const out = concatWavs([good, Buffer.from('not a wav')])
  assert.ok(out.pcm.length > 24000 * 2, '应该多出静音')
})

test('采样率不一致时重采样到第一段的采样率', () => {
  const a = encodeWav(pcmOf(new Array(24000).fill(1)), 24000)
  const b = encodeWav(pcmOf(new Array(48000).fill(1)), 48000) // 1 秒
  const out = concatWavs([a, b])
  assert.equal(out.sampleRate, 24000)
  assert.ok(Math.abs(out.pcm.length / 2 / 24000 - 2) < 0.05)
})

test('立体声降混成单声道', () => {
  const frames = 24000
  const stereo = Buffer.alloc(frames * 4)
  for (let i = 0; i < frames; i++) { stereo.writeInt16LE(100, i * 4); stereo.writeInt16LE(300, i * 4 + 2) }
  const out = concatWavs([encodeWav(stereo, 24000, 2, 16)])
  assert.equal(out.pcm.length / 2, frames)
  assert.equal(out.pcm.readInt16LE(0), 200)
})

test('流式头标记长度未知（只在显式要求时使用）', () => {
  const h = streamingWavHeader(24000)
  assert.equal(h.readUInt32LE(40), 0x7fffffff)
  assert.equal(h.toString('ascii', 0, 4), 'RIFF')
})

test('静音占位是合法 WAV', () => {
  const w = silentWav(0.2)
  const p = parseWav(w)
  assert.ok(Math.abs(p.durationSec - 0.2) < 0.01)
})


test('RMS 归一后音量一致，且不削波', () => {
  const quiet = pcmOf(new Array(2400).fill(0).map((_, i) => (i % 2 ? 2000 : -2000)))
  const wav = encodeWav(quiet, 24000, 1, 16)
  const out = parseWav(normalizeWav(wav, { targetRms: 0.126, peakCap: 0.95 }))
  let sum = 0
  let peak = 0
  for (let i = 0; i < out.pcm.length / 2; i++) {
    const v = out.pcm.readInt16LE(i * 2) / 32768
    sum += v * v
    peak = Math.max(peak, Math.abs(v))
  }
  assert.ok(Math.abs(Math.sqrt(sum / (out.pcm.length / 2)) - 0.126) < 0.005)
  assert.ok(peak <= 0.9501)
  assert.equal(out.sampleRate, 24000)
})
