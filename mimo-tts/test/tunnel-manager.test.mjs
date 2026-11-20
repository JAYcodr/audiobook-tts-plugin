import test from 'node:test'
import assert from 'node:assert/strict'
import { EventEmitter } from 'node:events'
import { chmodSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:net'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Store } from '../src/config.mjs'
import { buildImportInfo } from '../src/legado.mjs'
import { TtsService } from '../src/service.mjs'
import { runDoctor } from '../src/setup-manager.mjs'
import { TunnelError, TunnelManager, detectHttpsTools } from '../src/tunnel-manager.mjs'

const fresh = (p = 'mimo-tun-') => mkdtempSync(join(tmpdir(), p))

function pickFreePort() {
  return new Promise((resolve, reject) => {
    const srv = createServer()
    srv.once('error', reject)
    srv.listen(0, '127.0.0.1', () => {
      const { port } = srv.address()
      srv.close(() => resolve(port))
    })
  })
}

function makeFakeReq({ method = 'GET', url = '/', headers = {}, body = '' }) {
  const req = new EventEmitter()
  req.method = method
  req.url = url
  req.headers = { host: '192.168.1.10:8291', ...headers }
  req.socket = { remoteAddress: '127.0.0.1' }
  req.destroy = () => {}
  queueMicrotask(() => {
    if (body) req.emit('data', Buffer.from(body))
    req.emit('end')
  })
  return req
}

function makeFakeRes() {
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
    get bodyText() { return Buffer.concat(chunks).toString('utf8') },
  }
}

async function callSvc(svc, opts) {
  const res = makeFakeRes()
  await svc.handle(makeFakeReq(opts), res)
  return res
}

function createMockCloudflared(dir, urlToPrint = 'https://mock-tunnel-123.trycloudflare.com') {
  const bin = join(dir, 'mock-cloudflared')
  const argsLog = join(dir, 'cf-args.log')
  const pidFile = join(dir, 'cf-pid.log')
  const script = [
    `#!${process.execPath}`,
    "const { appendFileSync, writeFileSync } = require('node:fs')",
    `appendFileSync(${JSON.stringify(argsLog)}, JSON.stringify(process.argv.slice(2)) + '\\n')`,
    `writeFileSync(${JSON.stringify(pidFile)}, String(process.pid))`,
    `console.error('INF +-------------------------------------------+')`,
    `console.error('INF |  ${urlToPrint}  |')`,
    "for (let i = 1; i <= 210; i++) console.log('INF log line ' + i)",
    "const timer = setInterval(() => {}, 1000)",
    "process.on('SIGTERM', () => { clearInterval(timer); process.exit(0) })",
  ].join('\n')
  writeFileSync(bin, script)
  chmodSync(bin, 0o755)
  return { bin, argsLog, pidFile }
}

test('detectHttpsTools 只读探测 cloudflared / tailscale / wrangler 状态', () => {
  const res = detectHttpsTools({
    probe: {
      binaries: {
        cloudflared: '/opt/homebrew/bin/cloudflared',
        tailscale: '/usr/local/bin/tailscale',
        wrangler: '',
      },
      runSync: (cmd, args) => {
        if (cmd.endsWith('cloudflared') && args[0] === '--version') {
          return { status: 0, stdout: 'cloudflared version 2026.1.0 (built 2026-01-01)', stderr: '' }
        }
        if (cmd.endsWith('tailscale') && args[0] === 'status') {
          return {
            status: 0,
            stdout: JSON.stringify({
              BackendState: 'Running',
              Self: { Online: true, DNSName: 'mac-mini.tail1234.ts.net.' },
            }),
            stderr: '',
          }
        }
        if (cmd.endsWith('tailscale') && args[0] === 'funnel') {
          return {
            status: 0,
            stdout: 'https://mac-mini.tail1234.ts.net (Funnel on)\n|-- / proxy http://127.0.0.1:8291',
            stderr: '',
          }
        }
        return { status: 1, stdout: '', stderr: 'not found' }
      },
    },
  })

  assert.equal(res.cloudflared.installed, true)
  assert.match(res.cloudflared.version, /2026\.1\.0/)
  assert.equal(res.tailscale.installed, true)
  assert.equal(res.tailscale.online, true)
  assert.equal(res.tailscale.dnsName, 'mac-mini.tail1234.ts.net')
  assert.equal(res.tailscale.funnelEnabled, true)
  assert.equal(res.tailscale.funnelUrl, 'https://mac-mini.tail1234.ts.net')
  assert.equal(res.wrangler.installed, false)
})

test('TunnelManager 验证白名单协议、捕获 trycloudflare URL、互斥锁、KV 同步与进程组回收', async () => {
  const dir = fresh()
  try {
    const { bin, argsLog, pidFile } = createMockCloudflared(dir, 'https://fast-book-99.trycloudflare.com')
    const syncedUrls = []
    const currentCfg = {
      server: { port: 8291 },
      tunnel: { protocol: 'http2', kvSync: { enabled: true } },
    }

    const mgr = new TunnelManager({
      getConfig: () => currentCfg,
      cloudflaredBin: bin,
      syncKvImpl: async ({ url }) => {
        syncedUrls.push(url)
        return { message: `synced ${url}` }
      },
      log: () => {},
    })

    // 1) 拒绝非法协议
    await assert.rejects(
      () => mgr.startQuick({ port: 8291, protocol: 'http2; rm -rf /' }),
      (err) => err instanceof TunnelError && err.code === 'invalid_protocol',
    )

    // 2) 启动并捕获 URL，校验白名单参数数组与 200 行日志截断
    const st = await mgr.startQuick({ port: 8291, protocol: 'quic' })
    assert.equal(st.state, 'running')
    assert.equal(st.quickUrl, 'https://fast-book-99.trycloudflare.com')
    assert.ok(st.pid > 0)
    assert.ok(st.startedAt > 0)
    assert.ok(st.logs.length <= 200)

    const recordedArgs = JSON.parse(readFileSync(argsLog, 'utf8').trim().split('\n')[0])
    assert.deepEqual(recordedArgs, [
      'tunnel', '--no-autoupdate', '--url', 'http://127.0.0.1:8291', '--protocol', 'quic',
    ])

    // 等异步自动 KV 同步落定
    await new Promise((r) => setTimeout(r, 40))
    assert.deepEqual(syncedUrls, ['https://fast-book-99.trycloudflare.com'])
    assert.equal(mgr.status().kvSync.state, 'ok')

    // 3) 单实例互斥锁
    await assert.rejects(
      () => mgr.startQuick({ port: 8291 }),
      (err) => err instanceof TunnelError && err.code === 'tunnel_running',
    )

    // 4) 手动 syncKv
    const manualSync = await mgr.syncKv()
    assert.equal(manualSync.ok, true)
    assert.equal(syncedUrls.length, 2)

    // 5) stop() 彻底杀掉进程组
    const spawnedPid = Number(readFileSync(pidFile, 'utf8').trim())
    const stopped = await mgr.stop()
    assert.equal(stopped.state, 'idle')
    assert.equal(stopped.quickUrl, '')
    assert.equal(stopped.pid, null)
    assert.throws(() => process.kill(spawnedPid, 0), { code: 'ESRCH' })

    // 6) execa 启动异常 (spawn ENOENT) 返回 TunnelError('spawn_failed') 且清理状态
    const brokenMgr = new TunnelManager({
      getConfig: () => currentCfg,
      cloudflaredBin: join(dir, 'nonexistent-cloudflared'),
      log: () => {},
    })
    await assert.rejects(
      () => brokenMgr.startQuick({ port: 8291, protocol: 'http2', waitUrlMs: 2000 }),
      (err) => err instanceof TunnelError && err.code === 'spawn_failed',
    )
    assert.equal(brokenMgr.status().state, 'error')
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('buildImportInfo 按优先级推导 OpenAI Base URL 与 Quick/Relay 地址', () => {
  const baseCfg = {
    server: { port: 8291, publicUrl: '' },
    auth: { enabled: true, token: 'tok-xyz' },
    openaiServer: { enabled: true, apiKey: 'sk-test-custom-key-0001' },
    tunnel: { kvSync: { publicRelayUrl: '' } },
  }
  const req = { headers: { host: '192.168.1.50:8291' } }

  // 无公网/Relay/Quick -> LAN
  const lanOnly = buildImportInfo(req, baseCfg, { tunnelStatus: { quickUrl: '' } })
  assert.equal(lanOnly.openaiEnabled, true)
  assert.equal(lanOnly.openaiUsesCustomKey, true)
  assert.match(lanOnly.openaiBaseUrl, /^http:\/\/[^/]+:8291\/v1$/)
  assert.equal(lanOnly.quickTunnelUrl, '')

  // 有 Quick Tunnel -> 优先 Quick
  const withQuick = buildImportInfo(req, baseCfg, {
    tunnelStatus: { quickUrl: 'https://demo-quick.trycloudflare.com' },
  })
  assert.equal(withQuick.quickTunnelUrl, 'https://demo-quick.trycloudflare.com')
  assert.equal(withQuick.quickJsonUrl, 'https://demo-quick.trycloudflare.com/legado.json?token=tok-xyz')
  assert.equal(withQuick.openaiBaseUrl, 'https://demo-quick.trycloudflare.com/v1')
  assert.equal(withQuick.openaiQuickBaseUrl, 'https://demo-quick.trycloudflare.com/v1')

  // 有 Relay -> Relay > Quick
  const withRelay = buildImportInfo(
    req,
    { ...baseCfg, tunnel: { kvSync: { publicRelayUrl: 'https://tts.workers.dev/' } } },
    { tunnelStatus: { quickUrl: 'https://demo-quick.trycloudflare.com' } },
  )
  assert.equal(withRelay.relayBaseUrl, 'https://tts.workers.dev')
  assert.equal(withRelay.openaiBaseUrl, 'https://tts.workers.dev/v1')

  // 有 publicUrl -> publicUrl > Relay > Quick
  const withPublic = buildImportInfo(
    req,
    {
      ...baseCfg,
      server: { port: 8291, publicUrl: 'https://tts.dpdns.org/' },
      tunnel: { kvSync: { publicRelayUrl: 'https://tts.workers.dev' } },
    },
    { tunnelStatus: { quickUrl: 'https://demo-quick.trycloudflare.com' } },
  )
  assert.equal(withPublic.openaiBaseUrl, 'https://tts.dpdns.org/v1')
})

test('控制路由 /api/tunnel/*、/api/openai-server/gen-key、换端口重启隧道与 runDoctor 集成', async () => {
  const dir = fresh('mimo-tun-svc-')
  let svc
  try {
    const port1 = await pickFreePort()
    const port2 = await pickFreePort()
    const { bin, argsLog } = createMockCloudflared(dir, 'https://route-test.trycloudflare.com')

    const store = new Store(dir)
    store.load({})
    store.update({
      auth: { enabled: false },
      server: { host: '127.0.0.1', port: port1 },
      upstream: { keys: ['sk-test-mimo-0001'] },
    })

    const logs = []
    svc = new TtsService({ store, log: (l) => logs.push(l) })
    svc.tunnel = new TunnelManager({
      getConfig: () => store.config,
      cloudflaredBin: bin,
      syncKvImpl: async ({ url }) => ({ message: `ok:${url}` }),
      log: (l) => logs.push(l),
    })
    await svc.start()

    // 1) 生成随机 OpenAI Bearer Key（不打日志）
    const genRes = await callSvc(svc, { method: 'POST', url: '/api/openai-server/gen-key' })
    assert.equal(genRes.status, 200)
    const generatedKey = JSON.parse(genRes.bodyText).apiKey
    assert.ok(generatedKey.startsWith('sk-ab-'))
    assert.ok(!logs.some((l) => l.includes(generatedKey)), '生成的密钥绝不能写入日志')

    // 2) 启动 Quick Tunnel
    const startRes = await callSvc(svc, {
      method: 'POST',
      url: '/api/tunnel/quick',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ action: 'start', protocol: 'http2' }),
    })
    assert.equal(startRes.status, 200)
    const startState = JSON.parse(startRes.bodyText)
    assert.equal(startState.tunnel.state, 'running')
    assert.equal(startState.import.quickTunnelUrl, 'https://route-test.trycloudflare.com')

    // 3) 查询 status?detect=1 与 sync-kv
    const stRes = await callSvc(svc, { url: '/api/tunnel/status?detect=1' })
    assert.equal(stRes.status, 200)
    const stJson = JSON.parse(stRes.bodyText)
    assert.ok(stJson.tools?.cloudflared)

    const kvRes = await callSvc(svc, { method: 'POST', url: '/api/tunnel/sync-kv' })
    assert.equal(kvRes.status, 200)
    assert.equal(JSON.parse(kvRes.bodyText).ok, true)

    // 4) 换端口时 Quick Tunnel 自动重启指向新端口
    await svc.applyPatch({ server: { port: port2 } })
    const allArgs = readFileSync(argsLog, 'utf8').trim().split('\n').map((l) => JSON.parse(l))
    assert.equal(allArgs.length, 2)
    assert.equal(allArgs[1][3], `http://127.0.0.1:${port2}`)

    // 5) runDoctor 包含 OpenAI 端点状态与 HTTPS 隧道状态
    const doc = await runDoctor({
      service: svc,
      probe: {
        lanAddresses: () => ['192.168.1.50'],
        httpsTools: { cloudflared: { installed: true, version: '2026.1.0' }, tailscale: { installed: false }, wrangler: { installed: false } },
      },
    })
    assert.ok(doc.checks.some((c) => c.id === 'openai-server'))
    assert.ok(doc.checks.some((c) => c.id === 'https-tunnel' && c.status === 'pass'))

    // 6) service.stop() 自动停止隧道
    await svc.stop()
    assert.equal(svc.tunnel.status().state, 'idle')
  } finally {
    await svc?.stop().catch(() => {})
    rmSync(dir, { recursive: true, force: true })
  }
})
