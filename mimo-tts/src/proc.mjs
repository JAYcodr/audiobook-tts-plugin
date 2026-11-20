/**
 * 子进程执行与生命周期辅助（基于 execa v9）：
 * - 统一同步探测（runSyncCmd）；
 * - 进程组级 SIGTERM -> SIGKILL 级联清理，避免 bash 子孙进程残留；
 * - 并行 stdout/stderr 逐行流式读取。
 */
import { execaSync } from 'execa'

/** 同步执行只读探针命令并统一返回 `{ status, stdout, stderr }`。 */
export function runSyncCmd(cmd, args, timeout = 4000) {
  const res = execaSync(cmd, args, {
    timeout,
    reject: false,
    stdin: 'ignore',
  })
  return {
    status: typeof res.exitCode === 'number' ? res.exitCode : (res.failed ? 1 : 0),
    stdout: String(res.stdout || ''),
    stderr: String(res.stderr || ''),
  }
}

/** 对 POSIX 进程组（降级单进程 PID）发送终止信号。 */
export function signalProcessGroup(pid, signal = 'SIGTERM') {
  if (!pid) return
  if (process.platform !== 'win32') {
    try {
      process.kill(-pid, signal)
      return
    } catch { /* fallback to single pid */ }
  }
  try {
    process.kill(pid, signal)
  } catch { /* process already exited */ }
}

/** 将 AbortSignal 绑定到整个子进程组：先 SIGTERM，超时未退再 SIGKILL。 */
export function bindGroupCancel(sub, signal, forceAfterMs = 2500) {
  if (!signal) return () => {}
  let killTimer = null
  const onAbort = () => {
    const pid = sub?.pid
    signalProcessGroup(pid, 'SIGTERM')
    if (forceAfterMs > 0 && pid) {
      killTimer = setTimeout(() => signalProcessGroup(pid, 'SIGKILL'), forceAfterMs)
      killTimer.unref?.()
    }
  }
  if (signal.aborted) onAbort()
  else signal.addEventListener('abort', onAbort, { once: true })
  return () => {
    signal.removeEventListener('abort', onAbort)
    if (killTimer) {
      clearTimeout(killTimer)
      killTimer = null
    }
  }
}

/** 通过 execa `.iterable()` 并行消费 stdout / stderr 文本行。 */
export function streamLines(sub, { onStdout, onStderr } = {}) {
  const pump = async (from, onLine) => {
    if (!onLine || typeof sub?.iterable !== 'function') return
    try {
      for await (const rawLine of sub.iterable({ from })) {
        const line = String(rawLine).replace(/\r/g, '').trimEnd()
        if (line) onLine(line)
      }
    } catch {
      // 主 subprocess promise 统一处理非零退出或取消状态，此处防止 unhandled rejection
    }
  }
  return Promise.all([pump('stdout', onStdout), pump('stderr', onStderr)])
}
