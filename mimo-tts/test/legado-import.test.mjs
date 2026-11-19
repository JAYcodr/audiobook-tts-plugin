import test from 'node:test'
import assert from 'node:assert/strict'
import { TtsService } from '../src/service.mjs'

const config = {
  server: { host: '0.0.0.0', port: 8292 },
  auth: { enabled: true, user: 'admin', pass: '', token: 'tok-abc' },
  upstream: { baseUrl: 'https://api.xiaomimimo.com/v1', keys: [], model: 'mimo-v2.5-tts', timeoutMs: 1000, maxRetry: 0 },
  voices: { narrator: { voice: '冰糖', style: '旁白' }, dialogue: { voice: '苏打', style: '对话' } },
  synth: { maxSegmentChars: 100, concurrency: 4, stream: false },
  cache: { enabled: false, maxEntries: 10, maxBytes: 1e6, ttlSeconds: 60 },
  limits: { rpm: 100 },
  log: { ring: 10 },
}

function fakeService() {
  const store = { config, update: () => ({ problems: [] }), save: () => config }
  return new TtsService({ store, log: () => {} })
}

function fakeReq(remoteAddress, host = '192.168.1.54:8292') {
  return { socket: { remoteAddress }, headers: { host }, method: 'GET' }
}

function fakeRes() {
  const chunks = []
  return {
    status: 0,
    headers: {},
    headersSent: false,
    writeHead(s, h) { this.status = s; this.headers = h; this.headersSent = true },
    end(b) { if (b) chunks.push(Buffer.from(b)) },
    get body() { return Buffer.concat(chunks).toString('utf8') },
  }
}

const run = async (svc, req, rawUrl) => {
  const res = fakeRes()
  await svc.handleLegadoJson(req, res, new URL(rawUrl, 'http://x'))
  return res
}

test('内网来源裸地址（不带令牌）也能拿到导入 JSON', async () => {
  const res = await run(fakeService(), fakeReq('192.168.1.61'), '/legado.json')
  assert.equal(res.status, 200)
  const arr = JSON.parse(res.body)
  assert.equal(Array.isArray(arr), true)
  assert.equal(arr[0].name, '听书值守 TTS')
  assert.ok(arr[0].url.includes('token=tok-abc'), '导入的朗读地址要带令牌')
  assert.ok(arr[0].url.includes('{{java.encodeURI(speakText)}}'))
})

test('公网来源不带令牌：401 且是纯文本，不能回 JSON', async () => {
  const res = await run(fakeService(), fakeReq('8.8.8.8', 'example.com:8292'), '/legado.json')
  assert.equal(res.status, 401)
  // Legado 会把任意 JSON 对象当成引擎去读 $.name（!! 强解），抛出 message 为 null 的
  // NPE，界面只显示 ImportError:null —— 所以这里必须是纯文本。
  assert.ok(!res.body.trimStart().startsWith('{'), `不能回 JSON，实际：${res.body.slice(0, 40)}`)
  assert.match(res.body, /token/)
  assert.match(res.headers['Content-Type'], /text\/plain/)
})

test('公网来源带正确令牌：正常返回', async () => {
  const res = await run(fakeService(), fakeReq('8.8.8.8', 'example.com:8292'), '/legado.json?token=tok-abc')
  assert.equal(res.status, 200)
  assert.equal(JSON.parse(res.body)[0].name, '听书值守 TTS')
})

test('关掉鉴权时谁都能拿', async () => {
  const svc = fakeService()
  svc.store.config = { ...config, auth: { ...config.auth, enabled: false } }
  const res = await run(svc, fakeReq('8.8.8.8', 'example.com:8292'), '/legado.json')
  assert.equal(res.status, 200)
  assert.ok(!JSON.parse(res.body)[0].url.includes('token='), '无鉴权时不该拼令牌')
})

const entryOf = (res) => JSON.parse(res.body)[0]

test('配了 publicUrl：朗读地址用公网域名，而不是内网 IP', async () => {
  const svc = fakeService()
  svc.store.config = { ...config, server: { ...config.server, publicUrl: 'https://tts.example.com/' } }
  const res = await run(svc, fakeReq('192.168.1.61'), '/legado.json')
  const e = entryOf(res)
  assert.ok(e.url.startsWith('https://tts.example.com/listening?token=tok-abc,'), e.url.slice(0, 60))
})

test('没配 publicUrl 但走了反代：按 X-Forwarded-Proto/Host 推导', async () => {
  const svc = fakeService()
  const req = {
    socket: { remoteAddress: '192.168.1.61' },
    headers: {
      host: '192.168.1.54:8292',
      'x-forwarded-host': 'tts.example.com',
      'x-forwarded-proto': 'https',
    },
    method: 'GET',
  }
  const res = await run(svc, req, '/legado.json?token=tok-abc')
  assert.equal(res.status, 200)
  assert.ok(entryOf(res).url.startsWith('https://tts.example.com/listening'), entryOf(res).url.slice(0, 60))
})

test('直连时用请求里的 Host，协议是 http', async () => {
  const svc = fakeService()
  const res = await run(svc, fakeReq('192.168.1.61', '192.168.1.54:8292'), '/legado.json')
  assert.ok(entryOf(res).url.startsWith('http://192.168.1.54:8292/listening'), entryOf(res).url.slice(0, 60))
})

test('附加请求头会被写进导出的引擎（Cloudflare Access 场景）', async () => {
  const svc = fakeService()
  svc.store.config = {
    ...config,
    legado: { extraHeaders: { 'CF-Access-Client-Id': 'id.access', 'CF-Access-Client-Secret': 'secret' } },
  }
  const res = await run(svc, fakeReq('192.168.1.61'), '/legado.json')
  const e = entryOf(res)
  const option = JSON.parse(e.url.slice(e.url.indexOf(',{') + 1))
  assert.equal(option.header['CF-Access-Client-Id'], 'id.access')
  assert.equal(option.header['CF-Access-Client-Secret'], 'secret')
  assert.equal(option.header['Content-Type'], 'application/x-www-form-urlencoded')
})

test('隧道后面（带转发头、对端是内网）不带令牌 → 仍然 401', async () => {
  const svc = fakeService()
  // cloudflared 从 NAS 发起，对端是内网地址；但带着 CF 转发头 = 公网请求
  const req = {
    socket: { remoteAddress: '192.168.1.15' },
    headers: { host: 'tts.example.com', 'cf-connecting-ip': '203.0.113.9' },
    method: 'GET',
  }
  const res = await run(svc, req, '/legado.json')
  assert.equal(res.status, 401)
  assert.ok(!res.body.trimStart().startsWith('{'))
})

test('隧道后面带正确令牌 → 200，且地址用公网域名', async () => {
  const svc = fakeService()
  const req = {
    socket: { remoteAddress: '192.168.1.15' },
    headers: {
      host: '192.168.1.54:8292',
      'cf-connecting-ip': '203.0.113.9',
      'x-forwarded-host': 'tts.example.com',
      'x-forwarded-proto': 'https',
    },
    method: 'GET',
  }
  const res = await run(svc, req, '/legado.json?token=tok-abc')
  assert.equal(res.status, 200)
  assert.ok(entryOf(res).url.startsWith('https://tts.example.com/listening'), entryOf(res).url.slice(0, 60))
})
