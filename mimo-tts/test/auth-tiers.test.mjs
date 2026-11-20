import test from 'node:test'
import assert from 'node:assert/strict'
import { EventEmitter } from 'node:events'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Store, redact } from '../src/config.mjs'
import { redactedConfig } from '../src/config-cli.mjs'
import { TtsService } from '../src/service.mjs'
import { encodeWav } from '../src/wav.mjs'

const fresh = (p = 'mimo-auth-') => mkdtempSync(join(tmpdir(), p))

function makeReq({ method = 'GET', url = '/', headers = {}, body = '', remoteAddress = '127.0.0.1' }) {
  const req = new EventEmitter()
  req.method = method
  req.url = url
  req.headers = { host: '127.0.0.1:8291', ...headers }
  req.socket = { remoteAddress }
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

test('Issue #8: 只读 token 调 /api/* 返回 403，但能正常听书、拉取隔离版 legado.json 与调 OpenAI 端点', async () => {
  const dir = fresh()
  let svc
  try {
    const store = new Store(dir)
    store.load({})
    const adminToken = store.config.auth.token
    store.update({
      auth: {
        enabled: true,
        token: adminToken,
        readTokens: [
          { id: 'rt:dev1', label: '朋友手机', token: 'rt_friend_device_01', createdAt: 1000 },
          { id: 'rt:dev2', label: '备用平板', token: 'rt_tablet_device_02', createdAt: 2000 },
        ],
      },
      upstream: { provider: 'mimo', keys: ['sk-test-auth-123456'] },
      openaiServer: { enabled: true, apiKey: '' },
    })

    svc = new TtsService({ store, log: () => {} })
    svc.listening = true
    const sample = encodeWav(Buffer.alloc(2400), 24000, 1, 16)
    svc.mimo.synthesize = async () => sample

    // 1) 无 token 调 /api/config -> 401
    const unauth = await callSvc(svc, { url: '/api/config' })
    assert.equal(unauth.status, 401)

    // 2) 只读 token 调 /api/config、/api/state、/api/service -> 全部 403
    for (const apiPath of ['/api/config', '/api/state', '/api/live', '/api/service']) {
      const res = await callSvc(svc, { url: `${apiPath}?token=rt_friend_device_01` })
      assert.equal(res.status, 403, `${apiPath} 对只读 token 必须返回 403`)
    }
    const header403 = await callSvc(svc, {
      url: '/api/config',
      headers: { 'x-audiobook-token': 'rt_tablet_device_02' },
    })
    assert.equal(header403.status, 403)

    // 3) 管理主 token 调 /api/config -> 200，且 readTokens 在 config 响应中掩码
    const adminRes = await callSvc(svc, { url: `/api/config?token=${encodeURIComponent(adminToken)}` })
    assert.equal(adminRes.status, 200)
    const adminJson = JSON.parse(adminRes.bodyText)
    assert.equal(adminJson.auth.readTokens[0].token, '••••••')

    // 4) 只读 token 正常调 /listening
    const listenRes = await callSvc(svc, {
      method: 'POST',
      url: `/listening?token=rt_friend_device_01`,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text: '只读听书测试。' }),
    })
    assert.equal(listenRes.status, 200)
    assert.equal(listenRes.headers['Content-Type'], 'audio/wav')

    // 5) 只读 token 调 /legado.json 返回的朗读地址必须用同一个只读 token，绝不泄露主 token
    const legRes = await callSvc(svc, {
      url: '/legado.json?token=rt_friend_device_01',
      remoteAddress: '8.8.8.8',
    })
    assert.equal(legRes.status, 200)
    const legArr = JSON.parse(legRes.bodyText)
    assert.ok(legArr[0].url.includes('token=rt_friend_device_01'))
    assert.ok(!legArr[0].url.includes(adminToken), '只读 /legado.json 绝不能泄露主管理 token')

    // 6) 只读 token 调 OpenAI /v1/models 与 /v1/audio/speech -> 200
    const oaModels = await callSvc(svc, {
      url: '/v1/models',
      headers: { authorization: 'Bearer rt_friend_device_01' },
    })
    assert.equal(oaModels.status, 200)

    const oaSpeech = await callSvc(svc, {
      method: 'POST',
      url: '/v1/audio/speech',
      headers: { authorization: 'Bearer rt_friend_device_01', 'content-type': 'application/json' },
      body: JSON.stringify({ input: '只读 OpenAI 测试。', voice: 'alloy' }),
    })
    assert.equal(oaSpeech.status, 200)

    // 7) 吊销其中一台只读设备：该设备立刻变 401，另一台设备仍可用
    const delRes = await callSvc(svc, {
      method: 'DELETE',
      url: `/api/auth/read-tokens/${encodeURIComponent('rt:dev1')}?token=${encodeURIComponent(adminToken)}`,
    })
    assert.equal(delRes.status, 200)

    const revokedListen = await callSvc(svc, {
      method: 'POST',
      url: '/listening?token=rt_friend_device_01',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text: '吊销后失败。' }),
    })
    assert.equal(revokedListen.status, 401)

    const stillOk = await callSvc(svc, {
      method: 'POST',
      url: '/listening?token=rt_tablet_device_02',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text: '未吊销设备继续正常。' }),
    })
    assert.equal(stillOk.status, 200)

    // 8) 签发新只读令牌 + CLI redactedConfig 脱敏 + sanitizeConfigPatch 掩码还原
    const createRes = await callSvc(svc, {
      method: 'POST',
      url: `/api/auth/read-tokens?token=${encodeURIComponent(adminToken)}`,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ label: '新平板' }),
    })
    assert.equal(createRes.status, 201)
    const created = JSON.parse(createRes.bodyText)
    assert.ok(created.item.token.startsWith('rt_'))
    assert.ok(created.import.shareJsonUrl.includes('token='))

    const maskedCli = redactedConfig(store.config)
    assert.equal(maskedCli.auth.token, '••••••')
    assert.ok(maskedCli.auth.readTokens.every((rt) => rt.token === '••••••'))
    assert.ok(redact(store.config).auth.readTokens.every((rt) => rt.token === '••••••'))

    // 保留掩码回写配置不应覆盖真 token
    const realTablet = store.config.auth.readTokens.find((r) => r.id === 'rt:dev2').token
    const keepUpdate = store.update({ auth: { readTokens: redact(store.config).auth.readTokens } })
    assert.deepEqual(keepUpdate.problems, [])
    assert.equal(store.config.auth.readTokens.find((r) => r.id === 'rt:dev2').token, realTablet)
  } finally {
    await svc?.stop().catch(() => {})
    rmSync(dir, { recursive: true, force: true })
  }
})
