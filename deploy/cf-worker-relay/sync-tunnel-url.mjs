#!/usr/bin/env node
/**
 * 将当前 Quick Tunnel URL（https://xxx.trycloudflare.com）同步写入 Cloudflare KV。
 * 零第三方 npm 依赖，支持 --mode wrangler 或 --mode api，以及本地状态去重。
 *
 * 用法示例：
 *   AUDIOBOOK_API_TOKEN=<URL_TOKEN> node deploy/cf-worker-relay/sync-tunnel-url.mjs \
 *     --from-api http://127.0.0.1:8291/api/tunnel/status \
 *     --mode wrangler --namespace-id <KV_NAMESPACE_ID>
 */
import { spawnSync } from 'node:child_process'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'

const VALID_TUNNEL_RE = /^https:\/\/[a-z0-9-]+\.trycloudflare\.com$/

function parseArgs(argv) {
  const opts = {
    url: '',
    fromApi: '',
    mode: process.env.CF_KV_SYNC_MODE || 'wrangler',
    namespaceId: process.env.CF_KV_NAMESPACE_ID || '',
    accountId: process.env.CF_ACCOUNT_ID || '',
    keyName: process.env.CF_KV_KEY_NAME || 'tunnel_url',
    stateFile: join(tmpdir(), 'audiobook-tts-kv-sync.json'),
    force: false,
  }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    const next = () => (i + 1 < argv.length ? argv[++i] : '')
    if (a === '--url') opts.url = next()
    else if (a === '--from-api') opts.fromApi = next()
    else if (a === '--mode') opts.mode = next()
    else if (a === '--namespace-id') opts.namespaceId = next()
    else if (a === '--account-id') opts.accountId = next()
    else if (a === '--key') opts.keyName = next()
    else if (a === '--state-file') opts.stateFile = next()
    else if (a === '--force') opts.force = true
    else if (a === '-h' || a === '--help') {
      console.log('Usage: sync-tunnel-url.mjs (--url <url> | --from-api <statusUrl>) [--mode wrangler|api] [--namespace-id <id>] [--account-id <id>] [--key <name>] [--state-file <path>] [--force]')
      process.exit(0)
    }
  }
  return opts
}

async function resolveTunnelUrl(opts) {
  if (opts.url) return String(opts.url).trim().toLowerCase()
  if (!opts.fromApi) throw new Error('必须提供 --url 或 --from-api')

  const headers = {}
  const apiToken = process.env.AUDIOBOOK_API_TOKEN || process.env.MIMO_API_TOKEN || ''
  if (apiToken) headers['X-Audiobook-Token'] = apiToken

  const res = await fetch(opts.fromApi, { headers, signal: AbortSignal.timeout(5000) })
  if (!res.ok) throw new Error(`拉取隧道状态失败: HTTP ${res.status}`)
  const data = await res.json()
  return String(data?.tunnel?.quickUrl || data?.quickUrl || '').trim().toLowerCase()
}

function readPreviousState(stateFile) {
  try {
    return JSON.parse(readFileSync(stateFile, 'utf8'))
  } catch {
    return null
  }
}

function writeCurrentState(stateFile, state) {
  mkdirSync(dirname(stateFile), { recursive: true })
  writeFileSync(stateFile, JSON.stringify(state, null, 2))
}

async function syncViaWrangler({ url, namespaceId, keyName }) {
  if (!namespaceId) throw new Error('wrangler 模式必须指定 --namespace-id 或设置 CF_KV_NAMESPACE_ID')
  const args = ['kv', 'key', 'put', keyName, url, '--namespace-id', namespaceId, '--remote']
  const res = spawnSync('wrangler', args, { encoding: 'utf8', timeout: 20_000 })
  if (res.error) throw new Error(`执行 wrangler 失败: ${res.error.message}`)
  if (res.status !== 0) {
    throw new Error(`wrangler 退出码 ${res.status}: ${String(res.stderr || res.stdout || '').trim().slice(0, 200)}`)
  }
}

async function syncViaApi({ url, namespaceId, accountId, keyName }) {
  const apiToken = String(process.env.CF_API_TOKEN || '').trim()
  if (!apiToken) throw new Error('api 模式必须设置环境变量 CF_API_TOKEN')
  if (!accountId) throw new Error('api 模式必须指定 --account-id 或设置 CF_ACCOUNT_ID')
  if (!namespaceId) throw new Error('api 模式必须指定 --namespace-id 或设置 CF_KV_NAMESPACE_ID')

  const endpoint = `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(accountId)}/storage/kv/namespaces/${encodeURIComponent(namespaceId)}/values/${encodeURIComponent(keyName)}`
  const res = await fetch(endpoint, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${apiToken}`,
      'Content-Type': 'text/plain; charset=utf-8',
    },
    body: url,
    signal: AbortSignal.timeout(10_000),
  })
  if (!res.ok) {
    const errText = await res.text().catch(() => '')
    throw new Error(`Cloudflare KV REST API 返回 HTTP ${res.status}: ${errText.slice(0, 160)}`)
  }
}

async function main() {
  const opts = parseArgs(process.argv.slice(2))
  if (!['wrangler', 'api'].includes(opts.mode)) {
    throw new Error(`不支持的 --mode: ${opts.mode}（仅允许 wrangler 或 api）`)
  }

  const tunnelUrl = await resolveTunnelUrl(opts)
  if (!VALID_TUNNEL_RE.test(tunnelUrl)) {
    throw new Error(`非法隧道地址（必须匹配 ${VALID_TUNNEL_RE}）：${tunnelUrl || '(空)'}`)
  }

  const prev = readPreviousState(opts.stateFile)
  if (
    !opts.force
    && prev
    && prev.url === tunnelUrl
    && prev.mode === opts.mode
    && prev.namespaceId === opts.namespaceId
    && prev.keyName === opts.keyName
  ) {
    console.log(`Unchanged (${tunnelUrl}), skipping KV write.`)
    return
  }

  if (opts.mode === 'wrangler') {
    await syncViaWrangler({ url: tunnelUrl, namespaceId: opts.namespaceId, keyName: opts.keyName })
  } else {
    await syncViaApi({
      url: tunnelUrl,
      namespaceId: opts.namespaceId,
      accountId: opts.accountId,
      keyName: opts.keyName,
    })
  }

  writeCurrentState(opts.stateFile, {
    url: tunnelUrl,
    mode: opts.mode,
    namespaceId: opts.namespaceId,
    keyName: opts.keyName,
    syncedAt: new Date().toISOString(),
  })
  console.log(`Synced ${opts.keyName} -> ${tunnelUrl} (${opts.mode})`)
}

main().catch((err) => {
  console.error(`[sync-tunnel-url] ${err?.message || err}`)
  process.exit(1)
})
