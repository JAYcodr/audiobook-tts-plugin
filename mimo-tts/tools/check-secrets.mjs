#!/usr/bin/env node
/**
 * 仓库敏感信息与个人痕迹扫描脚本（供本地与 CI 执行）：
 * 检查真实 API Key、私钥块、遗留个人用户名痕迹等高危模式。
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { extname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const PKG_ROOT = resolve(dirnameFromMeta(import.meta.url), '..')
const REPO_ROOT = resolve(PKG_ROOT, '..')

function dirnameFromMeta(url) {
  return resolve(fileURLToPath(url), '..')
}

const SKIP_DIRS = new Set(['.git', 'node_modules', '__pycache__', 'data', 'data-test', 'bench'])
const TEXT_EXTS = new Set([
  '.js', '.mjs', '.cjs', '.jsx', '.ts', '.tsx', '.py', '.sh',
  '.json', '.yml', '.yaml', '.md', '.txt', '.css', '.svg', '',
])
const SKIP_FILES = new Set(['package-lock.json', 'check-secrets.mjs'])

const RULES = [
  { name: 'API Key 字面量', re: /\b(?:sk|tp)-(?!test-|old-|new-|cloud-|appended-|existing-|openai-secret-|fake)[A-Za-z0-9_-]{16,}\b/g },
  { name: 'GitHub PAT', re: /\bgh[pousr]_[A-Za-z0-9]{20,}\b/g },
  { name: 'AWS Access Key', re: /\bAKIA[0-9A-Z]{16}\b/g },
  { name: '私钥块', re: /-----BEGIN [A-Z ]*PRIVATE KEY-----/g },
  { name: '个人用户名痕迹', re: /\bhamelin\b/gi },
]

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue
    const full = join(dir, name)
    const st = statSync(full)
    if (st.isDirectory()) {
      walk(full, out)
    } else if (st.isFile() && !SKIP_FILES.has(name) && TEXT_EXTS.has(extname(name).toLowerCase())) {
      out.push(full)
    }
  }
  return out
}

const findings = []
for (const file of walk(REPO_ROOT)) {
  const content = readFileSync(file, 'utf8')
  const rel = relative(REPO_ROOT, file)
  const lines = content.split(/\r?\n/)
  for (let idx = 0; idx < lines.length; idx++) {
    const line = lines[idx]
    for (const rule of RULES) {
      rule.re.lastIndex = 0
      if (rule.re.test(line)) {
        findings.push(`${rel}:${idx + 1} [${rule.name}] ${line.trim().slice(0, 100)}`)
      }
    }
  }
}

if (findings.length) {
  console.error('发现疑似敏感信息或个人痕迹：')
  for (const f of findings) console.error(`  - ${f}`)
  process.exit(1)
}
console.log('Secret scan passed: 0 issues found.')
