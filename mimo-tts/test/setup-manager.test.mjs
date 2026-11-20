import test from 'node:test'
import assert from 'node:assert/strict'
import { EventEmitter } from 'node:events'
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Store } from '../src/config.mjs'
import { RefsStore } from '../src/refs-store.mjs'
import { SetupManager, detectEnvironment, runDoctor } from '../src/setup-manager.mjs'
import { TtsService } from '../src/service.mjs'

const fresh = (p = 'mimo-setup-') => mkdtempSync(join(tmpdir(), p))

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

function createFakeLocalEnv(dir, { withVocoder = true } = {}) {
  const venvPy = join(dir, 'venv', 'bin', 'python')
  mkdirSync(join(dir, 'venv', 'bin'), { recursive: true })
  writeFileSync(venvPy, '#!/bin/sh\necho Python 3.12.0\n')
  chmodSync(venvPy, 0o755)

  const modelDir = join(dir, 'models', 'qwen3tts-0.6b-base-8bit')
  mkdirSync(join(modelDir, 'speech_tokenizer'), { recursive: true })
  writeFileSync(join(modelDir, 'config.json'), '{}')
  writeFileSync(join(modelDir, 'model.safetensors'), Buffer.alloc(1024))
  if (withVocoder) {
    writeFileSync(join(modelDir, 'speech_tokenizer', 'model.safetensors'), Buffer.alloc(1024))
  }
  return { venvPy, modelDir }
}

test('detectEnvironment 探测本地 venv/模型/内置 refs 并生成 suggestedPatch', () => {
  const dir = fresh()
  try {
    const { venvPy, modelDir } = createFakeLocalEnv(dir, { withVocoder: true })
    const refs = new RefsStore({ dataDir: dir }).load()
    const env = detectEnvironment({
      dataDir: dir,
      refsStore: refs,
      minVocoderBytes: 128,
      minModelBytes: 128,
      probe: {
        platform: 'darwin',
        arch: 'arm64',
        runSync: () => ({ status: 0, stdout: 'Python 3.12.0', stderr: '' }),
      },
    })
    assert.equal(env.platform.isAppleSilicon, true)
    assert.equal(env.venv.path, venvPy)
    assert.equal(env.venv.exists, true)
    assert.equal(env.venv.mlxAudioOk, true)
    assert.equal(env.model.valid, true)
    assert.equal(env.readyForLocal, true)
    assert.equal(env.suggestedPatch.upstream.provider, 'local')
    assert.equal(env.suggestedPatch.upstream.local.pythonPath, venvPy)
    assert.equal(env.suggestedPatch.upstream.local.modelPath, modelDir)
    assert.equal(env.suggestedPatch.upstream.local.refs.narrator.refId, 'builtin:narrator-14s')

    // 缺失 vocoder 时 readyForLocal 必须为 false
    rmSync(join(modelDir, 'speech_tokenizer', 'model.safetensors'))
    const envNoVocoder = detectEnvironment({
      dataDir: dir,
      refsStore: refs,
      minVocoderBytes: 128,
      minModelBytes: 128,
      probe: {
        platform: 'darwin',
        arch: 'arm64',
        runSync: () => ({ status: 0, stdout: 'Python 3.12.0', stderr: '' }),
      },
    })
    assert.equal(envNoVocoder.model.valid, false)
    assert.equal(envNoVocoder.readyForLocal, false)
    assert.ok(envNoVocoder.model.error.includes('speech_tokenizer'))
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('runDoctor 检查模型声码器、芯片架构、LAN 与可选 MiMo 连通性（绝不泄露 Key）', async () => {
  const dir = fresh()
  try {
    const { venvPy, modelDir } = createFakeLocalEnv(dir, { withVocoder: false })
    const st = new Store(dir)
    st.load({})
    const secretKey = 'sk-test-doctor-secret-9999'
    st.update({
      auth: { enabled: false },
      upstream: {
        provider: 'local',
        keys: [secretKey],
        local: {
          pythonPath: venvPy,
          modelPath: modelDir,
          refs: { narrator: { refId: 'builtin:narrator-14s', wav: '', text: '' } },
        },
      },
    })
    const svc = new TtsService({ store: st, log: () => {} })

    const localReport = await runDoctor({
      service: svc,
      minVocoderBytes: 128,
      minModelBytes: 128,
      probe: {
        platform: 'linux',
        arch: 'x64',
        runSync: () => ({ status: 0, stdout: 'Python 3.12.0', stderr: '' }),
        lanAddresses: () => ['192.168.1.25'],
      },
    })
    assert.equal(localReport.ok, false)
    assert.ok(localReport.checks.some((c) => c.id === 'platform' && c.status === 'fail'))
    assert.ok(localReport.checks.some((c) => c.id === 'model' && c.status === 'fail' && c.message.includes('speech_tokenizer')))

    // 切换 MiMo 并开启网络探测，模拟 401 鉴权失败，检查绝不泄露秘钥
    st.update({ upstream: { provider: 'mimo' } })
    const netReport = await runDoctor({
      service: svc,
      checkNetwork: true,
      probe: {
        lanAddresses: () => [],
        fetch: async () => new Response('unauthorized', { status: 401 }),
      },
    })
    assert.equal(netReport.ok, false)
    const netCheck = netReport.checks.find((c) => c.id === 'network')
    assert.equal(netCheck.status, 'fail')
    assert.ok(netCheck.message.includes('401'))
    assert.ok(!JSON.stringify(netReport).includes(secretKey), 'Doctor 结果绝不能泄露明文 Key')
    assert.ok(netReport.checks.some((c) => c.id === 'lan' && c.status === 'warn'))

    await svc.stop()
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('SetupManager 仅允许白名单任务与合法镜像、支持流式日志增量拉取、互斥锁与取消', async () => {
  const dir = fresh()
  try {
    const okScript = join(dir, 'ok-install.sh')
    writeFileSync(okScript, [
      '#!/usr/bin/env bash',
      'echo "== [1/4] 建 venv =="',
      'sleep 0.05',
      'echo "== [2/4] 安装依赖 =="',
      'sleep 0.05',
      'echo "== [4/4] 参考音 =="',
      'echo "endpoint=$HF_ENDPOINT"',
    ].join('\n'))
    chmodSync(okScript, 0o755)

    const childPidFile = join(dir, 'setup-child.pid')
    const slowScript = join(dir, 'slow-download.sh')
    writeFileSync(slowScript, [
      '#!/usr/bin/env bash',
      'echo "[1/3] 开始下载"',
      'sleep 30 &',
      `echo $! > "${childPidFile}"`,
      'wait',
    ].join('\n'))
    chmodSync(slowScript, 0o755)

    const st = new Store(dir)
    st.load({})
    st.update({ auth: { enabled: false } })
    const svc = new TtsService({ store: st, log: () => {} })
    svc.setup = new SetupManager({
      dataDir: dir,
      refsStore: svc.refs,
      getConfig: () => st.config,
      minVocoderBytes: 128,
      minModelBytes: 128,
      scriptOverrides: { 'install-local': okScript, 'download-model': slowScript },
    })

    // 拒绝非白名单任务与非法 endpoint
    const badTask = await callSvc(svc, {
      method: 'POST',
      url: '/api/setup/run',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ task: 'rm -rf /' }),
    })
    assert.equal(badTask.status, 400)

    const badEndpoint = await callSvc(svc, {
      method: 'POST',
      url: '/api/setup/run',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ task: 'install-local', hfEndpoint: 'https://evil.example.com' }),
    })
    assert.equal(badEndpoint.status, 400)

    // 启动白名单任务 + 检查互斥锁
    const runRes = await callSvc(svc, {
      method: 'POST',
      url: '/api/setup/run',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ task: 'install-local', hfEndpoint: 'https://hf-mirror.com' }),
    })
    assert.equal(runRes.status, 202)
    const busyRes = await callSvc(svc, {
      method: 'POST',
      url: '/api/setup/run',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ task: 'download-model' }),
    })
    assert.equal(busyRes.status, 409)

    // 轮询直到成功
    let stPayload
    for (let i = 0; i < 40; i++) {
      await new Promise((r) => setTimeout(r, 50))
      const res = await callSvc(svc, { url: '/api/setup/status?since=0' })
      stPayload = JSON.parse(res.bodyText)
      if (stPayload.state !== 'running') break
    }
    assert.equal(stPayload.state, 'succeeded')
    assert.equal(stPayload.step, 4)
    assert.ok(stPayload.lines.some((l) => l.line.includes('endpoint=https://hf-mirror.com')))

    // 增量游标 since=nextCursor 应返回空数组
    const tailRes = await callSvc(svc, { url: `/api/setup/status?since=${stPayload.nextCursor}` })
    assert.deepEqual(JSON.parse(tailRes.bodyText).lines, [])

    // 启动长任务并取消：验证父进程组与后台子孙进程（sleep 30 &）均彻底回收
    const runSlow = await callSvc(svc, {
      method: 'POST',
      url: '/api/setup/run',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ task: 'download-model' }),
    })
    assert.equal(runSlow.status, 202)
    await new Promise((r) => setTimeout(r, 120))
    const setupChildPid = Number(readFileSync(childPidFile, 'utf8').trim())
    assert.ok(setupChildPid > 0)
    const cancelRes = await callSvc(svc, { method: 'POST', url: '/api/setup/cancel' })
    assert.equal(cancelRes.status, 200)
    assert.equal(JSON.parse(cancelRes.bodyText).state, 'cancelled')
    assert.throws(() => process.kill(setupChildPid, 0), { code: 'ESRCH' })

    const detectRes = await callSvc(svc, { url: '/api/env/detect' })
    assert.equal(detectRes.status, 200)
    assert.ok('suggestedPatch' in JSON.parse(detectRes.bodyText))

    const docRes = await callSvc(svc, {
      method: 'POST',
      url: '/api/doctor',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ checkNetwork: false }),
    })
    assert.equal(docRes.status, 200)
    assert.ok(Array.isArray(JSON.parse(docRes.bodyText).checks))

    await svc.stop()
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})
