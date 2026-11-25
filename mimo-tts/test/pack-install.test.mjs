/**
 * 发布形态冒烟：真打 tgz、真装进临时目录、真冷启。
 *
 * pack-gate 只看 `npm pack --dry-run` 的文件清单，清单对不代表装完能跑：
 * files 少写一个 `sidecar/`、bin 丢了执行位、依赖装不上，dry-run 全是绿的。
 * 这条用例把「发布出去的包」当成用户拿到的东西来验。
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { spawn, spawnSync } from 'node:child_process'
import { createServer } from 'node:net'
import { existsSync, mkdirSync, mkdtempSync, readdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

const PKG_ROOT = resolve(import.meta.dirname, '..')
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm'

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function freePort() {
  const srv = createServer()
  await new Promise((r) => srv.listen(0, '127.0.0.1', r))
  const { port } = srv.address()
  await new Promise((r) => srv.close(r))
  return port
}

async function waitHealth(port, timeoutMs = 20_000) {
  const deadline = Date.now() + timeoutMs
  let lastErr = null
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/health`)
      if (res.ok) return await res.json()
      lastErr = new Error(`HTTP ${res.status}`)
    } catch (err) {
      lastErr = err
    }
    await sleep(200)
  }
  throw new Error(`冷启后 /health 没起来：${lastErr?.message || lastErr}`)
}

test('npm pack 真装 + 冷启 /health + SIGTERM 退出', { timeout: 180_000 }, async () => {
  const tmp = mkdtempSync(join(tmpdir(), 'mimo-pack-'))
  const tarballDir = join(tmp, 'tgz')
  mkdirSync(tarballDir, { recursive: true })
  const installDir = join(tmp, 'install')
  const dataDir = join(tmp, 'data')
  let tgz = ''
  let child = null
  try {
    // 1) 真打包（不是 --dry-run）
    const packed = spawnSync(npm, ['pack', '--json', PKG_ROOT], {
      cwd: tarballDir,
      encoding: 'utf8',
      env: { ...process.env, npm_config_loglevel: 'error' },
    })
    assert.equal(packed.status, 0, `npm pack 失败：\n${packed.stderr}`)
    const meta = JSON.parse(packed.stdout)
    tgz = join(tarballDir, meta[0].filename)
    assert.ok(existsSync(tgz), `没生成 tgz：${tgz}`)

    // 2) 真装进干净的临时 prefix（模拟用户 npm i 这个包）
    const installed = spawnSync(npm, [
      'install',
      '--prefix', installDir,
      '--no-audit', '--no-fund', '--ignore-scripts', '--no-save',
      tgz,
    ], {
      cwd: tmp,
      encoding: 'utf8',
      timeout: 120_000,
      env: { ...process.env, npm_config_loglevel: 'error' },
    })
    assert.equal(installed.status, 0, `npm install 装包失败：\n${installed.stderr}`)

    const pkgDir = join(installDir, 'node_modules', 'audiobook-tts-plugin')
    assert.ok(existsSync(join(pkgDir, 'index.js')), '包里缺 index.js（插件入口）')
    assert.ok(existsSync(join(pkgDir, 'client.js')), '包里缺 client.js（浏览器半边）')
    assert.ok(existsSync(join(pkgDir, 'sidecar', 'server.py')), '包里缺 sidecar/server.py')
    assert.ok(existsSync(join(pkgDir, 'sidecar', 'requirements.txt')), '包里缺 sidecar/requirements.txt')
    assert.ok(existsSync(join(pkgDir, 'bin', 'audiobook-tts.mjs')), '包里缺 CLI 入口')

    // setup/ 一共 5 个文件：3 个 .sh + README-model.md + config.example.json
    const setupFiles = readdirSync(join(pkgDir, 'setup'))
    assert.equal(setupFiles.length, 5, `setup/ 下应是 5 个文件，实际 ${setupFiles.join(', ')}`)
    for (const name of ['install-local-engine.sh', 'check-env.sh', 'download-model.sh']) {
      assert.ok(setupFiles.includes(name), `包内 setup/ 缺 ${name}`)
    }
    const refWavs = readdirSync(join(pkgDir, 'refs')).filter((f) => f.endsWith('.wav'))
    assert.equal(refWavs.length, 3, `refs/ 下应是 3 个参考音，实际 ${refWavs.join(', ')}`)

    // 3) 真冷启：用装出来的路径起服务，而不是仓库里的源码
    const port = await freePort()
    child = spawn(process.execPath, [
      join(pkgDir, 'bin', 'audiobook-tts.mjs'),
      '--data', dataDir,
      '--port', String(port),
    ], {
      cwd: tmp,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, AUDIOBOOK_TTS_DATA: '' },
    })
    let stderr = ''
    child.stderr.on('data', (d) => { stderr += d.toString() })

    const health = await waitHealth(port).catch((err) => {
      throw new Error(`${err.message}\nCLI stderr:\n${stderr.slice(-2000)}`)
    })
    assert.equal(health.status, 'ok')
    assert.equal(health.running, true)
    assert.equal(typeof health.version, 'string')

    // 4) SIGTERM 必须能干净退出（不靠 SIGKILL 收尸）
    child.kill('SIGTERM')
    const exit = await Promise.race([
      new Promise((r) => child.once('exit', (code, signal) => r({ code, signal }))),
      sleep(10_000).then(() => ({ timeout: true })),
    ])
    assert.ok(!exit.timeout, 'SIGTERM 之后 CLI 没有退出')
    assert.equal(exit.code, 0, `CLI 退出码应为 0，实际 ${exit.code}（stderr: ${stderr.slice(-500)}）`)
  } finally {
    if (child && child.exitCode === null) {
      try { child.kill('SIGKILL') } catch { /* 已退出 */ }
    }
    rmSync(tmp, { recursive: true, force: true })
  }
})
