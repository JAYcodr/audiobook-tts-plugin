/**
 * Issue #2 测试：MP3 / Opus 管道转码、Legado 格式白名单与流式互斥、/legado.json 与 OpenAI 端点输出格式。
 */
import { EventEmitter } from 'node:events'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { PassThrough } from 'node:stream'
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { DEFAULTS, Store, applyEnv, validate } from '../src/config.mjs'
import { findBinary } from '../src/paths.mjs'
import { TtsService } from '../src/service.mjs'
import { runDoctor } from '../src/setup-manager.mjs'
import { buildFfmpegArgs, contentTypeForFormat, transcodeWav } from '../src/transcode.mjs'
import { encodeWav } from '../src/wav.mjs'

function makeTestWav(samples = 4800) {
  const pcm = Buffer.alloc(samples * 2)
  for (let i = 0; i < samples; i++) {
    pcm.writeInt16LE(Math.round(Math.sin(i / 20) * 4000), i * 2)
  }
  return encodeWav(pcm, 24000, 1, 16)
}

function makeFakeSpawn({ output = Buffer.from('FAKE_ENCODED_AUDIO'), code = 0, stderr = '', seenArgs = [] } = {}) {
  return (bin, args) => {
    seenArgs.push({ bin, args })
    const child = new EventEmitter()
    child.stdin = new PassThrough()
    child.stdout = new PassThrough()
    child.stderr = new PassThrough()
    child.kill = () => {}
    child.stdin.on('finish', () => {
      queueMicrotask(() => {
        if (stderr) child.stderr.end(Buffer.from(stderr))
        else child.stderr.end()
        if (output && code === 0) child.stdout.end(output)
        else child.stdout.end()
        child.emit('close', code, null)
      })
    })
    return child
  }
}

async function callSvc(svc, { method = 'GET', url = '/', headers = {}, body = '' } = {}) {
  let status = 200
  let resHeaders = {}
  const chunks = []
  let resolveDone
  const done = new Promise((r) => { resolveDone = r })

  const req = Object.assign(new EventEmitter(), {
    method,
    url,
    headers,
    socket: { remoteAddress: '127.0.0.1' },
  })
  const res = {
    headersSent: false,
    setHeader(k, v) { resHeaders[k] = v },
    writeHead(s, h = {}) {
      status = s
      resHeaders = { ...resHeaders, ...h }
      res.headersSent = true
    },
    write(chunk) { chunks.push(Buffer.from(chunk)); return true },
    end(chunk) {
      if (chunk !== undefined) chunks.push(Buffer.from(chunk))
      resolveDone()
    },
  }

  const p = svc.handle(req, res)
  queueMicrotask(() => {
    if (body) req.emit('data', Buffer.isBuffer(body) ? body : Buffer.from(body))
    req.emit('end')
  })
  await Promise.all([p, done])
  const buf = Buffer.concat(chunks)
  return { status, headers: resHeaders, bodyBuffer: buf, bodyText: buf.toString('utf8') }
}

test('config audio 默认值、校验与 ENV_KEYS', () => {
  assert.deepEqual(DEFAULTS.audio, { format: 'wav', bitrate: 64 })

  const cfg = structuredClone(DEFAULTS)
  cfg.upstream.keys = ['sk-test-audio-0001']
  cfg.audio = { format: 'opus', bitrate: 48 }
  assert.deepEqual(validate(cfg), [])

  cfg.audio = { format: 'flac', bitrate: 96 }
  const probs = validate(cfg)
  assert.ok(probs.some((p) => p.includes('audio.format')))
  assert.ok(probs.some((p) => p.includes('audio.bitrate')))

  const envCfg = structuredClone(DEFAULTS)
  applyEnv(envCfg, { AUDIO_FORMAT: 'MP3', AUDIO_BITRATE: '128' })
  assert.equal(envCfg.audio.format, 'mp3')
  assert.equal(envCfg.audio.bitrate, 128)
})

test('transcodeWav：wav/pcm 直通、mp3/opus 管道参数、无 ffmpeg 与错误回退', async () => {
  const wav = makeTestWav()

  const passthrough = await transcodeWav(wav, { format: 'wav' })
  assert.equal(passthrough.fallback, false)
  assert.equal(passthrough.format, 'wav')
  assert.equal(passthrough.buffer, wav)

  const pcm = await transcodeWav(wav, { format: 'pcm' })
  assert.equal(pcm.format, 'pcm')
  assert.equal(pcm.contentType, 'audio/pcm')
  assert.equal(pcm.buffer.length, 9600)

  const missing = await transcodeWav(wav, { format: 'mp3', findBinaryImpl: () => '' })
  assert.equal(missing.fallback, true)
  assert.equal(missing.reason, 'ffmpeg_missing')
  assert.equal(missing.format, 'wav')
  assert.equal(missing.buffer, wav)

  const seenMp3 = []
  const mp3Ok = await transcodeWav(wav, {
    format: 'mp3',
    bitrate: 128,
    findBinaryImpl: () => '/usr/bin/ffmpeg',
    spawnImpl: makeFakeSpawn({ output: Buffer.from('ID3_MP3'), seenArgs: seenMp3 }),
  })
  assert.equal(mp3Ok.fallback, false)
  assert.equal(mp3Ok.format, 'mp3')
  assert.equal(mp3Ok.contentType, 'audio/mpeg')
  assert.equal(mp3Ok.buffer.toString('utf8'), 'ID3_MP3')
  assert.deepEqual(seenMp3[0].args, buildFfmpegArgs('mp3', 128))

  const seenOpus = []
  const opusOk = await transcodeWav(wav, {
    format: 'opus',
    bitrate: 48,
    findBinaryImpl: () => '/usr/bin/ffmpeg',
    spawnImpl: makeFakeSpawn({ output: Buffer.from('OggS_OPUS'), seenArgs: seenOpus }),
  })
  assert.equal(opusOk.fallback, false)
  assert.equal(opusOk.format, 'opus')
  assert.equal(opusOk.contentType, contentTypeForFormat('opus'))
  assert.deepEqual(seenOpus[0].args, buildFfmpegArgs('opus', 48))

  const failOut = await transcodeWav(wav, {
    format: 'mp3',
    findBinaryImpl: () => '/usr/bin/ffmpeg',
    spawnImpl: makeFakeSpawn({ code: 1, stderr: 'encoder error' }),
  })
  assert.equal(failOut.fallback, true)
  assert.equal(failOut.reason, 'transcode_failed')
  assert.equal(failOut.buffer, wav)

  const realFfmpeg = findBinary('ffmpeg')
  if (realFfmpeg) {
    const realMp3 = await transcodeWav(wav, { format: 'mp3', bitrate: 64 })
    assert.equal(realMp3.fallback, false)
    assert.equal(realMp3.format, 'mp3')
    assert.ok(realMp3.buffer.length > 100)

    const realOpus = await transcodeWav(wav, { format: 'opus', bitrate: 48 })
    assert.equal(realOpus.fallback, false)
    assert.equal(realOpus.format, 'opus')
    assert.equal(realOpus.buffer.subarray(0, 4).toString('ascii'), 'OggS')
  }
})

test('/listening、/legado.json 与 /v1/audio/speech 格式协商、流式互斥及 Doctor 检查', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'tts-transcode-'))
  try {
    const store = new Store(dir)
    store.load({})
    store.update({
      auth: { enabled: false },
      upstream: { provider: 'mimo', keys: ['sk-test-transcode-0001'] },
      openaiServer: { enabled: true, apiKey: 'sk-test-oa-transcode-1111' },
    })

    const logs = []
    const svc = new TtsService({
      store,
      log: (line) => logs.push(line),
      transcodeOpts: {
        findBinaryImpl: () => '/usr/bin/ffmpeg',
        spawnImpl: makeFakeSpawn({ output: Buffer.from('ENCODED_STREAM') }),
      },
    })
    svc.listening = true

    const wav = makeTestWav(4800)
    svc.mimo.synthesize = async () => wav
    let streamCalled = false
    svc.mimo.synthesizeStream = async () => { streamCalled = true }

    // 1) /listening 支持 ?format=mp3 且当 synth.stream=true 时跳过流式直出
    store.update({ synth: { stream: true } })
    const resMp3 = await callSvc(svc, {
      method: 'POST',
      url: '/listening?format=mp3',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: 'text=测试转码与流式互斥。',
    })
    assert.equal(resMp3.status, 200)
    assert.equal(resMp3.headers['Content-Type'], 'audio/mpeg')
    assert.equal(resMp3.bodyText, 'ENCODED_STREAM')
    assert.equal(streamCalled, false)
    assert.equal(svc.metrics.snapshot().recent.at(-1).format, 'mp3')

    // 2) /listening 显式传 ?format=opus 返回 400
    const resExplicitOpus = await callSvc(svc, {
      method: 'GET',
      url: '/listening?format=opus&text=%E6%B5%8B%E8%AF%95',
    })
    assert.equal(resExplicitOpus.status, 400)

    // 3) 全局 audio.format = opus 时，未传 ?format= 的 /listening 自动退回 wav，/legado.json 为 audio/wav
    store.update({ audio: { format: 'opus', bitrate: 48 }, synth: { stream: false } })
    const resImplicitLegado = await callSvc(svc, {
      method: 'GET',
      url: '/listening?text=%E6%B5%8B%E8%AF%95%E9%BB%98%E8%AE%A4WAV',
    })
    assert.equal(resImplicitLegado.status, 200)
    assert.equal(resImplicitLegado.headers['Content-Type'], 'audio/wav')

    const legadoOpus = await callSvc(svc, { method: 'GET', url: '/legado.json' })
    assert.equal(JSON.parse(legadoOpus.bodyText)[0].contentType, 'audio/wav')

    // 4) 全局 audio.format = mp3 时，/legado.json 为 audio/mpeg
    store.update({ audio: { format: 'mp3', bitrate: 64 } })
    const legadoMp3 = await callSvc(svc, { method: 'GET', url: '/legado.json' })
    assert.equal(JSON.parse(legadoMp3.bodyText)[0].contentType, 'audio/mpeg')

    // 5) /v1/audio/speech 支持 mp3 与 opus 转码
    const resOaOpus = await callSvc(svc, {
      method: 'POST',
      url: '/v1/audio/speech',
      headers: {
        'content-type': 'application/json',
        authorization: 'Bearer sk-test-oa-transcode-1111',
      },
      body: JSON.stringify({ input: 'OpenAI Opus 转码测试。', response_format: 'opus' }),
    })
    assert.equal(resOaOpus.status, 200)
    assert.equal(resOaOpus.headers['Content-Type'], 'audio/ogg; codecs=opus')
    assert.equal(resOaOpus.headers['X-Audiobook-Format-Fallback'], undefined)
    assert.equal(resOaOpus.bodyText, 'ENCODED_STREAM')
    assert.equal(svc.metrics.snapshot().recent.at(-1).format, 'openai-opus')

    // 6) /listening 无 ffmpeg 时自动回退 WAV 并附带回退头
    svc.transcodeOpts = { findBinaryImpl: () => '' }
    const resFallback = await callSvc(svc, {
      method: 'GET',
      url: '/listening?text=%E5%9B%9E%E9%80%80%E6%B5%8B%E8%AF%95',
    })
    assert.equal(resFallback.status, 200)
    assert.equal(resFallback.headers['Content-Type'], 'audio/wav')
    assert.equal(resFallback.headers['X-Audiobook-Format-Fallback'], 'wav')
    assert.equal(resFallback.headers['X-Audiobook-Fallback-Reason'], 'ffmpeg_missing')

    // 7) runDoctor 检查 ffmpeg 存在与缺失提示
    const docMissing = await runDoctor({
      service: svc,
      probe: { binaries: { ffmpeg: '', cloudflared: '', tailscale: '', wrangler: '' }, lanAddresses: () => ['192.168.1.2'] },
    })
    const ffMissing = docMissing.checks.find((c) => c.id === 'ffmpeg')
    assert.equal(ffMissing.status, 'warn')
    assert.match(ffMissing.message, /ffmpeg/)

    const docOk = await runDoctor({
      service: svc,
      probe: { binaries: { ffmpeg: '/opt/homebrew/bin/ffmpeg', cloudflared: '', tailscale: '', wrangler: '' }, lanAddresses: () => ['192.168.1.2'] },
    })
    const ffOk = docOk.checks.find((c) => c.id === 'ffmpeg')
    assert.equal(ffOk.status, 'pass')
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})
