/**
 * HTTP 工具：统一请求体读取与 JSON 响应输出，避免宿主路由与独立服务各自实现一份。
 */

export class HttpInputError extends Error {
  constructor(message, status = 400) {
    super(message)
    this.name = 'HttpInputError'
    this.status = status
  }
}

export function sendJson(res, status, payload, opts = {}) {
  const body = Buffer.from(JSON.stringify(payload, null, 2))
  const headers = {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': body.length,
    'Cache-Control': 'no-store',
  }
  if (opts.basic) headers['WWW-Authenticate'] = 'Basic realm="audiobook-tts"'
  res.writeHead(status, headers)
  res.end(body)
}

export function readBody(req, limit = 1_000_000) {
  return new Promise((resolve, reject) => {
    const chunks = []
    let size = 0
    let failed = false
    req.on('data', (c) => {
      if (failed) return
      size += c.length
      if (size > limit) {
        failed = true
        reject(new HttpInputError('请求体过大', 413))
        req.destroy()
      } else {
        chunks.push(c)
      }
    })
    req.on('end', () => {
      if (!failed) resolve(Buffer.concat(chunks))
    })
    req.on('error', (err) => {
      if (!failed) reject(err)
    })
  })
}

export async function readJson(req, limit = 1_000_000) {
  const buf = await readBody(req, limit)
  try {
    return JSON.parse(buf.toString('utf8') || '{}')
  } catch {
    throw new HttpInputError('JSON 解析失败', 400)
  }
}
