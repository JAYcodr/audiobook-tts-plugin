#!/usr/bin/env node
/**
 * 发布包内容门禁（Issue #34）。
 *
 * 发布前断言「包里该有什么、不该有什么」，而不是靠人记清单。
 * 用法（CI 与本地同一份）：
 *   npm pack --dry-run --json > /tmp/pack.json
 *   node tools/pack-gate.mjs /tmp/pack.json
 * 或：npm pack --dry-run --json | node tools/pack-gate.mjs
 *
 * entryCount 只打印不断言：文件总数会随日常删改漂移，精确断言才拦得住漏发。
 */
import { readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const inputPath = process.argv[2]
let raw
try {
  raw = inputPath ? readFileSync(inputPath, 'utf8') : readFileSync(0, 'utf8')
} catch (err) {
  console.error(`[pack-gate] 读不到打包清单: ${err.message}`)
  process.exit(1)
}

let entry
try {
  const parsed = JSON.parse(raw)
  entry = Array.isArray(parsed) ? parsed[0] : parsed
} catch (err) {
  console.error(`[pack-gate] 打包清单不是合法 JSON: ${err.message}`)
  process.exit(1)
}

const files = (entry?.files || []).map((f) => String(typeof f === 'string' ? f : f.path || ''))
const under = (prefix) => files.filter((p) => p.startsWith(prefix))
const setup = under('setup/')
const refs = under('refs/')
const deploy = under('deploy/')

const checks = []
const expect = (name, actual, wanted, detail) => {
  checks.push({ name, actual, wanted, ok: actual === wanted, detail })
}

expect('setup/ 文件数', setup.length, 5, setup.length ? `实际: ${setup.join(', ')}` : '包里没有 setup/ 目录')
expect('refs/ 文件数', refs.length, 3, refs.length ? `实际: ${refs.join(', ')}` : '包里没有 refs/ 目录')
expect('refs/ 非 wav 文件数', refs.filter((p) => !p.endsWith('.wav')).length, 0, 'refs/README.md 等说明文件不应进包')
expect('deploy/ 文件数', deploy.length, 0, '可选附件不应进主包')
expect('agent-preflight 残留数', files.filter((p) => p.includes('agent-preflight')).length, 0, '已删除的探针不应再进包')

// 仓库内运行时顺带断言 CI 没有裸 setup/ 路径；包内发布形态没有 .github/，跳过即可。
const ciFile = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', '.github', 'workflows', 'ci.yml')
if (existsSync(ciFile)) {
  const ci = readFileSync(ciFile, 'utf8')
  const bare = [...ci.matchAll(/(?<!mimo-tts\/)setup\//g)]
  expect('ci.yml 裸 setup/ 引用数', bare.length, 0, '目录搬进包后 CI glob 必须带 mimo-tts/ 前缀')
} else {
  console.log('[pack-gate] 未找到仓库 CI 文件，跳过 ci.yml 断言（包内形态）')
}

console.log(`[pack-gate] entryCount=${entry?.entryCount ?? files.length}（只打印，不断言）`)
let failed = 0
for (const c of checks) {
  if (c.ok) {
    console.log(`[pack-gate] PASS ${c.name} = ${c.actual}`)
  } else {
    failed += 1
    console.error(`[pack-gate] FAIL ${c.name}: 期望 ${c.wanted}，实际 ${c.actual}；${c.detail}`)
  }
}
console.log(`[pack-gate] ${checks.length - failed}/${checks.length} 通过`)
process.exit(failed ? 1 : 0)
