/**
 * sidecar 生命周期回归：起真 Python 进程，只把 mlx_audio 换成桩（PYTHONPATH）。
 *
 * 这两条是 0.6.2 真实事故的护栏：
 *   1. 父进程被强杀后，2.29GB 的引擎还活着、占着 8398 端口；
 *   2. watchdog 记日志抛异常（磁盘满/路径被卸载）会把监视线程掀翻，从此不再退出。
 *
 * 旧实现删掉 server.py 里 watchdog 的 try/except，或去掉 orphan 分支，这里必须红。
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { spawn, spawnSync } from 'node:child_process'
import { closeSync, existsSync, mkdirSync, mkdtempSync, openSync, readFileSync, rmSync, unlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

const PYTHON = process.env.PYTHON || process.env.PYTHON3 || 'python3'
const ROOT = resolve(import.meta.dirname, '..')
const FAKE_MLX = resolve(import.meta.dirname, 'fixtures/fake-mlx')
const PARENT_SCRIPT = resolve(import.meta.dirname, 'fixtures/sidecar-parent.mjs')

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// 没有 numpy 的开发机（或没装依赖的容器）跳过而不是红：CI 的 node-ci 已显式安装。
const HAS_NUMPY = spawnSync(PYTHON, ['-c', 'import numpy'], { stdio: 'ignore' }).status === 0
const lifecycleTest = HAS_NUMPY ? test : test.skip

async function waitFor(predicate, { timeoutMs = 15_000, intervalMs = 100, label = '条件' } = {}) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    if (predicate()) return true
    await sleep(intervalMs)
  }
  throw new Error(`等待超时：${label}`)
}

function isAlive(pid) {
  try {
    process.kill(pid, 0)
    return true
  } catch (err) {
    return err.code !== 'ESRCH'
  }
}

/** 44 字节的最小合法 WAV：server.py 只检查文件存在，load_audio 由桩接管。 */
function minimalWav() {
  const buf = Buffer.alloc(44)
  buf.write('RIFF', 0, 'ascii')
  buf.writeUInt32LE(36, 4)
  buf.write('WAVE', 8, 'ascii')
  buf.write('fmt ', 12, 'ascii')
  buf.writeUInt32LE(16, 16)
  buf.writeUInt16LE(1, 20)
  buf.writeUInt16LE(1, 22)
  buf.writeUInt32LE(24000, 24)
  buf.writeUInt32LE(48000, 28)
  buf.writeUInt16LE(2, 32)
  buf.writeUInt16LE(16, 34)
  buf.write('data', 36, 'ascii')
  buf.writeUInt32LE(0, 40)
  return buf
}

function makeRefs(dir) {
  const wav = join(dir, 'narrator.wav')
  writeFileSync(wav, minimalWav())
  const refs = join(dir, 'refs.json')
  writeFileSync(refs, JSON.stringify({ narrator: { wav, text: '测试参考文本，只用来过启动校验。' } }))
  return refs
}

function sidecarArgs(refsPath, logPath, idleTimeout = 1) {
  return [
    join(ROOT, 'sidecar/server.py'),
    // 不存在的目录会让 validate_model_dir 直接放行，真正的 load_model 由 mlx_audio 桩接管
    '--model', join(tmpdir(), 'mimo-test-no-model'),
    '--refs', refsPath,
    '--port', '0',
    '--idle-timeout', String(idleTimeout),
    '--log', logPath,
  ]
}

const env = () => ({ ...process.env, PYTHONPATH: `${FAKE_MLX}:${process.env.PYTHONPATH || ''}` })

function spawnSidecar(args, outPath) {
  const fd = openSync(outPath, 'a')
  const child = spawn(PYTHON, args, { cwd: ROOT, env: env(), stdio: ['ignore', fd, fd] })
  closeSync(fd)
  return child
}

async function waitReady(outPath) {
  await waitFor(() => {
    try { return readFileSync(outPath, 'utf8').includes('"event": "ready"') } catch { return false }
  }, { label: 'sidecar 打出 ready' })
}

async function waitExit(child, timeoutMs = 15_000) {
  return Promise.race([
    new Promise((resolveExit) => child.once('exit', (code, signal) => resolveExit({ code, signal }))),
    sleep(timeoutMs).then(() => ({ timeout: true })),
  ])
}

lifecycleTest('父进程被 SIGKILL 后，孤儿 sidecar 必须自己退出并记 orphan_exit', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'mimo-orphan-'))
  const refs = makeRefs(dir)
  const logPath = join(dir, 'sidecar.jsonl')
  const outPath = join(dir, 'stdout.log')
  const pidFile = join(dir, 'sidecar.pid')
  const args = sidecarArgs(refs, logPath, 0) // idle=0：只能靠 orphan 分支退出，排除误判

  const parent = spawn(process.execPath, [PARENT_SCRIPT, pidFile, outPath, PYTHON, ...args], {
    cwd: ROOT,
    env: env(),
    stdio: ['ignore', 'ignore', 'inherit'],
  })
  let sidecarPid = 0
  try {
    await waitReady(outPath)
    sidecarPid = Number(readFileSync(pidFile, 'utf8'))
    assert.ok(sidecarPid > 0, '没拿到 sidecar pid')
    assert.ok(isAlive(sidecarPid), 'sidecar 应该已经在跑')

    parent.kill('SIGKILL')
    await new Promise((r) => parent.once('exit', r))

    // watchdog 5s 一轮；给到 12s 还活着就是孤儿没清理
    await waitFor(() => !isAlive(sidecarPid), {
      timeoutMs: 12_000,
      label: `孤儿 sidecar(pid=${sidecarPid}) 自行退出`,
    })
    assert.ok(!isAlive(sidecarPid), '孤儿 sidecar 仍然活着')

    const log = readFileSync(logPath, 'utf8')
    assert.match(log, /"event": "orphan_exit"/, `jsonl 里没有 orphan_exit：\n${log.slice(-800)}`)
  } finally {
    try { parent.kill('SIGKILL') } catch { /* 已退出 */ }
    if (sidecarPid && isAlive(sidecarPid)) {
      try { process.kill(sidecarPid, 'SIGKILL') } catch { /* ignore */ }
    }
    rmSync(dir, { recursive: true, force: true })
  }
})

lifecycleTest('空闲超时正常退出，jsonl 记 idle_exit', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'mimo-idle-'))
  const refs = makeRefs(dir)
  const logPath = join(dir, 'sidecar.jsonl')
  const outPath = join(dir, 'stdout.log')
  const child = spawnSidecar(sidecarArgs(refs, logPath, 1), outPath)
  try {
    await waitReady(outPath)
    const exited = await waitExit(child, 15_000)
    assert.ok(!exited.timeout, 'idle-timeout=1 之后 sidecar 仍在跑')
    assert.equal(exited.code, 0)
    const log = readFileSync(logPath, 'utf8')
    assert.match(log, /"event": "idle_exit"/, `jsonl 里没有 idle_exit：\n${log.slice(-800)}`)
  } finally {
    try { child.kill('SIGKILL') } catch { /* 已退出 */ }
    rmSync(dir, { recursive: true, force: true })
  }
})

lifecycleTest('日志写不进去时 watchdog 仍要退出（0.6.2 事故回归）', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'mimo-logfail-'))
  const refs = makeRefs(dir)
  const logPath = join(dir, 'sidecar.jsonl')
  const outPath = join(dir, 'stdout.log')
  const child = spawnSidecar(sidecarArgs(refs, logPath, 1), outPath)
  try {
    await waitReady(outPath)
    // 把日志文件换成同名目录：open(path, 'a') 必然 IsADirectoryError
    unlinkSync(logPath)
    mkdirSync(logPath)

    const exited = await waitExit(child, 15_000)
    assert.ok(!exited.timeout, '日志写失败后 sidecar 没有退出（watchdog 被异常掀翻）')
    assert.equal(exited.code, 0)
    assert.ok(existsSync(logPath), '目录还在，只是没写进日志')
  } finally {
    try { child.kill('SIGKILL') } catch { /* 已退出 */ }
    rmSync(dir, { recursive: true, force: true })
  }
})
