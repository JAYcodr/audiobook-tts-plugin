import test from 'node:test'
import assert from 'node:assert/strict'
import { EventEmitter } from 'node:events'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { BUILTIN_VOICE_PROFILES, Store } from '../src/config.mjs'
import { TtsService } from '../src/service.mjs'
import { RefsStore, MAX_REF_BYTES } from '../src/refs-store.mjs'
import { silentWav, parseWav } from '../src/wav.mjs'

const fresh = (p = 'mimo-refs-') => mkdtempSync(join(tmpdir(), p))

function makeReq({ method = 'GET', url = '/', headers = {}, body = '' }) {
  const req = new EventEmitter()
  req.method = method
  req.url = url
  req.headers = { host: '127.0.0.1:8291', ...headers }
  req.socket = { remoteAddress: '127.0.0.1' }
  req.destroy = () => {}
  queueMicrotask(() => {
    if (body) req.emit('data', Buffer.from(body))
    req.emit('end')
  })
  return req
}

function makeRes() {
  const chunks = []
  return {
    status: 0,
    headers: {},
    headersSent: false,
    writeHead(s, h = {}) {
      this.status = s
      this.headers = h
      this.headersSent = true
    },
    write(b) { if (b) chunks.push(Buffer.from(b)) },
    end(b) { if (b) chunks.push(Buffer.from(b)) },
    get bodyBuffer() { return Buffer.concat(chunks) },
    get bodyText() { return this.bodyBuffer.toString('utf8') },
  }
}

async function callSvc(svc, opts) {
  const res = makeRes()
  await svc.handle(makeReq(opts), res)
  return res
}

test('RefsStore 自动纳管包内 refs/ 样本并支持只读保护', () => {
  const dir = fresh()
  try {
    const store = new RefsStore({ dataDir: dir }).load()
    const items = store.list()
    assert.ok(items.some((r) => r.id === 'builtin:narrator-14s' && r.builtin && r.exists))
    assert.ok(items.some((r) => r.id === 'builtin:narrator-10s' && r.builtin && r.exists))
    assert.ok(items.some((r) => r.id === 'builtin:narrator-5s' && r.builtin && r.exists))

    const main = store.get('builtin:narrator-14s')
    assert.ok(main.durationSec > 10)
    assert.ok(main.text.includes('想要守护'))

    assert.throws(() => store.update('builtin:narrator-14s', { name: '改名' }), (e) => e.status === 403)
    assert.throws(() => store.remove('builtin:narrator-14s'), (e) => e.status === 403)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('RefsStore 支持上传 .wav/.mp3/.m4a、限制路径穿越/扩展名/体积并可编辑删除', async () => {
  const dir = fresh()
  try {
    const st = new Store(dir)
    st.load({})
    st.update({ auth: { enabled: false } })
    const svc = new TtsService({ store: st, log: () => {} })

    const shortWav = silentWav(1.5)
    const uploadRes = await callSvc(svc, {
      method: 'POST',
      url: '/api/refs',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        name: '我的自定义女声',
        filename: 'custom-voice.wav',
        dataBase64: shortWav.toString('base64'),
        text: '',
        tags: ['温柔', '旁白'],
      }),
    })
    assert.equal(uploadRes.status, 201)
    const created = JSON.parse(uploadRes.bodyText)
    assert.ok(created.item.id.startsWith('custom:'))
    assert.ok(existsSync(join(dir, 'refs', created.item.filename)))
    assert.ok(created.item.warnings.some((w) => w.includes('过短')))
    assert.ok(created.item.warnings.some((w) => w.includes('逐字参考文本')))

    // mp3/m4a upload allowed without WAV header
    const mp3Res = await callSvc(svc, {
      method: 'POST',
      url: '/api/refs',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        name: '广播剧片段',
        filename: 'clip.mp3',
        dataBase64: Buffer.from('ID3-fake-mp3-data').toString('base64'),
        text: '测试参考文本',
      }),
    })
    assert.equal(mp3Res.status, 201)

    // GET /api/refs/:id & /audio
    const audioRes = await callSvc(svc, { url: `/api/refs/${encodeURIComponent(created.item.id)}/audio` })
    assert.equal(audioRes.status, 200)
    assert.equal(audioRes.headers['Content-Type'], 'audio/wav')
    assert.equal(audioRes.bodyBuffer.length, shortWav.length)

    // Update custom ref text & name
    const putRes = await callSvc(svc, {
      method: 'PUT',
      url: `/api/refs/${encodeURIComponent(created.item.id)}`,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: '更新后女声', text: '现在已有逐字文本。' }),
    })
    assert.equal(putRes.status, 200)
    const updated = JSON.parse(putRes.bodyText)
    assert.equal(updated.item.name, '更新后女声')
    assert.ok(!updated.item.warnings.some((w) => w.includes('逐字参考文本')))

    // Builtin 403 via HTTP
    const delBuiltin = await callSvc(svc, { method: 'DELETE', url: '/api/refs/builtin%3Anarrator-5s' })
    assert.equal(delBuiltin.status, 403)

    // Traversal, bad ext, broken wav, oversized payload rejected
    const badPath = await callSvc(svc, {
      method: 'POST',
      url: '/api/refs',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'x', filename: '../../evil.wav', dataBase64: shortWav.toString('base64') }),
    })
    assert.equal(badPath.status, 400)

    const badExt = await callSvc(svc, {
      method: 'POST',
      url: '/api/refs',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'x', filename: 'evil.sh', dataBase64: shortWav.toString('base64') }),
    })
    assert.equal(badExt.status, 400)

    const brokenWav = await callSvc(svc, {
      method: 'POST',
      url: '/api/refs',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'x', filename: 'bad.wav', dataBase64: Buffer.from('not-wav').toString('base64') }),
    })
    assert.equal(brokenWav.status, 400)

    const reloaded = new RefsStore({ dataDir: dir }).load()
    assert.equal(reloaded.get(created.item.id).name, '更新后女声')

    // Delete removes file + metadata
    const delRes = await callSvc(svc, {
      method: 'DELETE',
      url: `/api/refs/${encodeURIComponent(created.item.id)}`,
    })
    assert.equal(delRes.status, 200)
    assert.ok(!existsSync(join(dir, 'refs', created.item.filename)))

    assert.throws(() => reloaded.add({
      name: '超大文件',
      filename: 'huge.mp3',
      dataBase64: Buffer.alloc(MAX_REF_BYTES + 8).toString('base64'),
    }), (e) => e.status === 413)

    await svc.stop()
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('配置校验支持 refId、MiMo 三模式约束以及 Voice Profiles 内置方案', () => {
  const dir = fresh()
  try {
    const st = new Store(dir)
    st.load({})
    const svc = new TtsService({ store: st, log: () => {} })

    assert.ok(BUILTIN_VOICE_PROFILES.length >= 3)

    // Local with builtin refId passes without raw wav/text strings
    const okLocal = st.update({
      upstream: {
        provider: 'local',
        local: {
          pythonPath: '/venv/bin/python',
          modelPath: '/models/qwen3',
          refs: { narrator: { refId: 'builtin:narrator-14s', wav: '', text: '' } },
        },
      },
    })
    assert.deepEqual(okLocal.problems, [])

    const missingRef = st.update({
      upstream: {
        provider: 'local',
        local: { refs: { narrator: { refId: 'custom:missing-999' } } },
      },
    })
    assert.ok(missingRef.problems.some((p) => p.includes('找不到旁白参考音')))

    const badDesign = st.update({
      upstream: { provider: 'mimo' },
      voices: { narrator: { mode: 'design', style: '' } },
    })
    assert.ok(badDesign.problems.some((p) => p.includes('style')))

    const badClone = st.update({
      upstream: { provider: 'mimo' },
      voices: { narrator: { mode: 'clone', voice: '', style: '', refId: '' } },
    })
    assert.ok(badClone.problems.some((p) => p.includes('声音克隆')))
    assert.ok(svc.refs.list().length >= 3)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('MiMo 三模式（preset / design / clone+refId）与缓存键隔离生效', async () => {
  const dir = fresh()
  const prevFetch = globalThis.fetch
  const calls = []
  try {
    const sampleWav = silentWav(0.3)
    globalThis.fetch = async (url, init) => {
      calls.push({ url: String(url), body: JSON.parse(init.body) })
      return new Response(JSON.stringify({
        choices: [{ message: { audio: { data: sampleWav.toString('base64') } } }],
      }), { status: 200, headers: { 'Content-Type': 'application/json' } })
    }

    const st = new Store(dir)
    st.load({})
    st.update({
      auth: { enabled: false },
      upstream: { provider: 'mimo', keys: ['sk-test-1234567890'] },
      voices: {
        narrator: { mode: 'design', voice: 'mimo_default', style: '温柔古风女声', refId: '' },
        dialogue: { mode: 'clone', voice: '', style: '', refId: 'builtin:narrator-5s' },
      },
    })
    const svc = new TtsService({ store: st, log: () => {} })
    svc.listening = true

    const res = await callSvc(svc, {
      method: 'POST',
      url: '/listening',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text: '夜深了。“快走！”他低声说。' }),
    })
    assert.equal(res.status, 200)
    assert.ok(parseWav(res.bodyBuffer).durationSec > 0.3)

    const designCall = calls.find((c) => c.body.model === 'mimo-v2.5-tts-voicedesign')
    const cloneCall = calls.find((c) => c.body.model === 'mimo-v2.5-tts-voiceclone')
    assert.ok(designCall, 'narrator 应走 voicedesign 模型')
    assert.equal(designCall.body.messages[0].content, '温柔古风女声')
    assert.equal(designCall.body.audio.voice, undefined)

    assert.ok(cloneCall, 'dialogue 应走 voiceclone 模型')
    assert.ok(String(cloneCall.body.audio.voice).startsWith('data:audio/wav;base64,'))

    // 切换为 preset 模式同一句话不得误命中 design/clone 缓存
    const beforeCalls = calls.length
    st.update({ voices: { narrator: { mode: 'preset', voice: '冰糖', style: '' } } })
    const resPreset = await callSvc(svc, {
      method: 'POST',
      url: '/listening',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text: '夜深了。' }),
    })
    assert.equal(resPreset.status, 200)
    assert.ok(calls.length > beforeCalls, '不同 mode 不得串用缓存')
    assert.equal(calls.at(-1).body.model, 'mimo-v2.5-tts')

    await svc.stop()
  } finally {
    globalThis.fetch = prevFetch
    rmSync(dir, { recursive: true, force: true })
  }
})

test('LocalEngine 通过 refId 解析内置参考音并写入 local-refs.json', async () => {
  const dir = fresh()
  try {
    const modelDir = join(dir, 'model')
    mkdirSync(join(modelDir, 'speech_tokenizer'), { recursive: true })
    writeFileSync(join(modelDir, 'config.json'), '{}')
    writeFileSync(join(modelDir, 'model.safetensors'), '12345678')
    writeFileSync(join(modelDir, 'speech_tokenizer', 'model.safetensors'), '12345678')
    const fakePy = join(dir, 'python3')
    writeFileSync(fakePy, '#!/bin/sh\nexit 1\n')

    const st = new Store(dir)
    st.load({})
    const refs = new RefsStore({ dataDir: dir }).load()
    st.refsStore = refs
    st.update({
      upstream: {
        provider: 'local',
        local: {
          pythonPath: fakePy,
          serverScript: join(dir, 'missing-server.py'),
          modelPath: modelDir,
          refs: { narrator: { refId: 'builtin:narrator-14s', wav: '', text: '' } },
        },
      },
    })
    const svc = new TtsService({ store: st, log: () => {} })
    svc.local.minVocoderBytes = 4
    svc.local.minModelBytes = 4

    await assert.rejects(() => svc.local.preload(), /sidecar 脚本不存在/)
    const written = JSON.parse(readFileSync(join(dir, 'local-refs.json'), 'utf8'))
    assert.ok(written.narrator.wav.endsWith('narrator-14s.wav'))
    assert.ok(written.narrator.text.includes('想要守护'))

    await svc.stop()
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})
