/**
 * 孤儿退出测试用的「中间父进程」。
 *
 * 测试要杀的是 sidecar 的父进程，不能杀测试进程自己，所以让这个脚本当父：
 *   node sidecar-parent.mjs <pidFile> <outFile> <python> <sidecar args...>
 *
 * 它把 sidecar 的 pid 写进 pidFile，把 stdout/stderr 重定向到 outFile（文件而不是管道：
 * 父进程被 SIGKILL 后管道断裂会让 sidecar 的 print 抛 BrokenPipe，测到的就不是 orphan 分支了），
 * 然后挂着等测试来收尸。
 */
import { spawn } from 'node:child_process'
import { closeSync, openSync, writeFileSync } from 'node:fs'

const [pidFile, outFile, python, ...rest] = process.argv.slice(2)
if (!pidFile || !outFile || !python) {
  console.error('用法: node sidecar-parent.mjs <pidFile> <outFile> <python> <args...>')
  process.exit(2)
}

const outFd = openSync(outFile, 'a')
const child = spawn(python, [...rest, '--parent-pid', String(process.pid)], {
  stdio: ['ignore', outFd, outFd],
  env: process.env,
})
closeSync(outFd)
writeFileSync(pidFile, String(child.pid))

child.on('exit', () => process.exit(0))
// 保持事件循环活跃，等测试 SIGKILL
setInterval(() => {}, 1 << 30)
