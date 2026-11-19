/**
 * 路径工具：家目录 `~` 展开与仓库/包根目录定位。
 */
import { existsSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const PACKAGE_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')

/**
 * 将 `~` / `~/...` / `~\...` 展开为用户家目录绝对路径；其余路径保持不变。
 * @param {string} input
 * @returns {string}
 */
export function expandHomePath(input) {
  const s = String(input || '').trim()
  if (!s) return ''
  if (s === '~') return homedir()
  if (s.startsWith('~/') || s.startsWith('~\\')) return join(homedir(), s.slice(2))
  return s
}

/** 返回插件包目录（mimo-tts/）。 */
export function resolvePackageRoot() {
  return PACKAGE_ROOT
}

/** 返回仓库根目录（优先上级目录中含 setup/ 或 refs/ 的目录，找不到则退回包目录）。 */
export function resolveRepoRoot() {
  const parent = resolve(PACKAGE_ROOT, '..')
  if (existsSync(join(parent, 'setup')) || existsSync(join(parent, 'refs'))) {
    return parent
  }
  return PACKAGE_ROOT
}
