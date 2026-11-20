/**
 * 路径工具：家目录 `~` 展开与仓库/包根目录定位。
 */
import { accessSync, constants, existsSync } from 'node:fs'
import { homedir } from 'node:os'
import { delimiter, dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const PACKAGE_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const EXTRA_BIN_DIRS = ['/opt/homebrew/bin', '/usr/local/bin', '/usr/bin', '/bin']

/**
 * 查找可执行文件（优先读取测试注入的 probe.binaries，再扫描 PATH 与常见系统目录）。
 * @param {string} name
 * @param {object} [probe]
 * @returns {string}
 */
export function findBinary(name, probe = {}) {
  if (probe?.binaries && Object.hasOwn(probe.binaries, name)) {
    return String(probe.binaries[name] || '')
  }
  const pathDirs = String(process.env.PATH || '').split(delimiter).filter(Boolean)
  const candidates = [...new Set([...pathDirs, ...EXTRA_BIN_DIRS])]
  const suffix = process.platform === 'win32' ? '.exe' : ''
  for (const dir of candidates) {
    const full = join(dir, `${name}${suffix}`)
    try {
      if (existsSync(full)) {
        accessSync(full, constants.X_OK)
        return full
      }
    } catch { /* try next dir */ }
  }
  if (name === 'tailscale' && process.platform === 'darwin') {
    const appBin = '/Applications/Tailscale.app/Contents/MacOS/Tailscale'
    try {
      if (existsSync(appBin)) {
        accessSync(appBin, constants.X_OK)
        return appBin
      }
    } catch { /* ignore */ }
  }
  return ''
}

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
