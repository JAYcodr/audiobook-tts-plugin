import test from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import worker from '../../deploy/cf-worker-relay/worker.js'

const SYNC_SCRIPT = resolve(import.meta.dirname, '../../deploy/cf-worker-relay/sync-tunnel-url.mjs')

function makeEnv(kvValue, keyName = 'tunnel_url') {
  return {
    KV_KEY_NAME: keyName,
    TUNNEL_KV: {
      async get(k) {
        return k === keyName ? kvValue : null
      },
    },
  }
}

test('worker.js 白名单放行听书与 OpenAI 路由并透传关键请求头', async () => {
  const prevFetch = globalThis.fetch
  const seen = []
  globalThis.fetch = async (url, init = {}) => {
    const headers = Object.fromEntries(new Headers(init.headers).entries())
    let bodyText = ''
    if (init.body) {
      const buf = await new Response(init.body).arrayBuffer()
      bodyText = Buffer.from(buf).toString('utf8')
    }
    seen.push({ url: String(url), method: init.method, headers, bodyText })
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    const env = makeEnv('https://valid-book-relay.trycloudflare.com')

    for (const [path, method, extraHeaders, body] of [
      ['/health', 'GET', {}, undefined],
      ['/legado.json?token=tok-123', 'GET', { 'cf-connecting-ip': '203.0.113.5' }, undefined],
      ['/listening', 'POST', { 'content-type': 'application/x-www-form-urlencoded', 'x-audiobook-token': 'tok-123' }, 'text=hello'],
      ['/v1/models', 'GET', { authorization: 'Bearer sk-test-relay-1234' }, undefined],
      ['/v1/audio/speech', 'POST', { authorization: 'Bearer sk-test-relay-1234', 'content-type': 'application/json', 'x-mimo-token': 'm1' }, '{"input":"hi"}'],
    ]) {
      const req = new Request(`https://relay.example.workers.dev${path}`, {
        method,
        headers: extraHeaders,
        body,
      })
      const res = await worker.fetch(req, env)
      assert.equal(res.status, 200, `${method} ${path} 应放行`)
      assert.equal(res.headers.get('X-Relay-Worker'), 'audiobook-tts-relay')
    }

    assert.equal(seen.length, 5)
    assert.equal(seen[1].url, 'https://valid-book-relay.trycloudflare.com/legado.json?token=tok-123')
    assert.equal(seen[1].headers['cf-connecting-ip'], '203.0.113.5')
    assert.equal(seen[2].headers['x-audiobook-token'], 'tok-123')
    assert.equal(seen[4].headers.authorization, 'Bearer sk-test-relay-1234')
    assert.equal(seen[4].bodyText, '{"input":"hi"}')
  } finally {
    globalThis.fetch = prevFetch
  }
})

test('worker.js 拦截控制管理路由与未知路径（404）并处理 CORS 预检', async () => {
  const prevFetch = globalThis.fetch
  let fetched = false
  globalThis.fetch = async () => {
    fetched = true
    return new Response('should not happen', { status: 200 })
  }

  try {
    const env = makeEnv('https://valid-book-relay.trycloudflare.com')

    for (const badPath of [
      '/mimo-tts/api/state',
      '/mimo-tts/api/config',
      '/audiobook-tts/api/config',
      '/api/tunnel/quick',
      '/api/openai-server/gen-key',
      '/etc/passwd',
      '/',
    ]) {
      const res = await worker.fetch(new Request(`https://relay.example.workers.dev${badPath}`), env)
      assert.equal(res.status, 404, `${badPath} 必须返回 404`)
    }

    const optApi = await worker.fetch(new Request('https://relay.example.workers.dev/api/config', { method: 'OPTIONS' }), env)
    assert.equal(optApi.status, 404)

    const wrongMethod = await worker.fetch(new Request('https://relay.example.workers.dev/health', { method: 'POST' }), env)
    assert.equal(wrongMethod.status, 405)

    const optModels = await worker.fetch(new Request('https://relay.example.workers.dev/v1/models', { method: 'OPTIONS' }), env)
    assert.equal(optModels.status, 204)
    assert.equal(optModels.headers.get('Access-Control-Allow-Origin'), '*')

    const optSpeech = await worker.fetch(new Request('https://relay.example.workers.dev/v1/audio/speech', { method: 'OPTIONS' }), env)
    assert.equal(optSpeech.status, 204)
    assert.match(optSpeech.headers.get('Access-Control-Allow-Headers') || '', /Authorization/i)

    assert.equal(fetched, false, '拦截路径与 OPTIONS 预检不应请求上游')
  } finally {
    globalThis.fetch = prevFetch
  }
})

test('worker.js 拦截非法 KV 上游（防 SSRF）并在上游超时/502/530 时返回 503', async () => {
  const prevFetch = globalThis.fetch
  let upstreamMode = 'ok'
  globalThis.fetch = async () => {
    if (upstreamMode === 'throw') throw new Error('network timeout')
    if (upstreamMode === '502') return new Response('Bad Gateway', { status: 502 })
    if (upstreamMode === '530') return new Response('Tunnel Error 1033', { status: 530 })
    return new Response('ok', { status: 200 })
  }

  try {
    for (const badTarget of [
      '',
      null,
      'http://127.0.0.1:8291',
      'http://localhost:8291',
      'https://169.254.169.254',
      'https://evil.example.com',
      'https://foo.trycloudflare.com/admin',
      'https://user@foo.trycloudflare.com',
      'https://FOO.trycloudflare.com',
    ]) {
      const res = await worker.fetch(
        new Request('https://relay.example.workers.dev/health'),
        makeEnv(badTarget),
      )
      assert.equal(res.status, 503, `非法 KV 地址 ${String(badTarget)} 应返回 503`)
    }

    const goodEnv = makeEnv('https://ok-relay-2026.trycloudflare.com')
    for (const mode of ['throw', '502', '530']) {
      upstreamMode = mode
      const res = await worker.fetch(new Request('https://relay.example.workers.dev/health'), goodEnv)
      assert.equal(res.status, 503, `上游模式 ${mode} 应返回友好 503 JSON`)
      const json = await res.json()
      assert.ok(json.error)
    }
  } finally {
    globalThis.fetch = prevFetch
  }
})

test('sync-tunnel-url.mjs 拒绝非法隧道域名并验证参数帮助', () => {
  const dir = mkdtempSync(join(tmpdir(), 'mimo-sync-'))
  try {
    const bad = spawnSync(process.execPath, [
      SYNC_SCRIPT,
      '--url',
      'https://evil.example.com',
      '--state-file',
      join(dir, 'state.json'),
    ], { encoding: 'utf8' })
    assert.notEqual(bad.status, 0)
    assert.match(bad.stderr, /非法隧道地址/)

    const help = spawnSync(process.execPath, [SYNC_SCRIPT, '--help'], { encoding: 'utf8' })
    assert.equal(help.status, 0)
    assert.match(help.stdout, /sync-tunnel-url\.mjs/)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})
