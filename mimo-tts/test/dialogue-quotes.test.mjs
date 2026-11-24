/**
 * Issue #25：台版排版用「」标对白，0.6.2 起被当成道具名，双音色静默失效。
 * 验收以 /api/text/preview 的 dialogueCount 与 /api/stats 的 cache.entries 为准，不听声音。
 */
import test from 'node:test'
import assert from 'node:assert/strict'
import { EventEmitter } from 'node:events'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Store } from '../src/config.mjs'
import { TtsService } from '../src/service.mjs'
import { splitText } from '../src/split.mjs'

const fresh = () => mkdtempSync(join(tmpdir(), 'mimo-quotes-'))
const SAMPLE = '「青锋剑」他说：「走吧。」'

function makeReq({ method = 'POST', url = '/', headers = {}, body = '' }) {
  const req = new EventEmitter()
  req.method = method
  req.url = url
  req.headers = { host: '127.0.0.1:8291', ...headers }
  req.socket = { remoteAddress: '127.0.0.1' }
  req.destroy = () => {}
  queueMicrotask(() => {
    if (body) req.emit('data', Buffer.from(body))
    req.emit('end')
  })
  return req
}

function makeRes() {
  const chunks = []
  return {
    status: 0,
    headers: {},
    headersSent: false,
    writeHead(s, h = {}) { this.status = s; this.headers = h; this.headersSent = true },
    write(b) { if (b) chunks.push(Buffer.from(b)) },
    end(b) { if (b) chunks.push(Buffer.from(b)) },
    get bodyBuffer() { return Buffer.concat(chunks) },
    get bodyText() { return this.bodyBuffer.toString('utf8') },
  }
}

async function callSvc(svc, opts) {
  const res = makeRes()
  await svc.handle(makeReq(opts), res)
  return res
}

test('引号三态：standard 只认弯引号，both 与 auto 认「」', () => {
  const count = (mode) => splitText(SAMPLE, { dialogueQuoteChars: mode })
    .filter((s) => s.role === 'dialogue').length
  assert.equal(count('standard'), 0)
  assert.equal(count('both'), 1)
  assert.equal(count('auto'), 1)

  // 弯引号在三种模式下都照常工作
  assert.equal(splitText('她说：“走吧。”', { dialogueQuoteChars: 'standard' })
    .filter((s) => s.role === 'dialogue').length, 1)

  // 纯「」段不应被当成引号残段剥掉：两套口径必须统一
  const plain = splitText('他拿起「青锋剑」。', { dialogueQuoteChars: 'standard' })
  assert.equal(plain.length, 1)
  assert.equal(plain[0].text, '他拿起「青锋剑」。')
})

test('POST /api/text/preview 按 draft.synth.dialogueQuoteChars 切换口径并拦非法值', async () => {
  const dir = fresh()
  try {
    const st = new Store(dir)
    st.load({})
    st.update({ auth: { enabled: false } })
    const svc = new TtsService({ store: st, log: () => {} })
    const post = (dialogueQuoteChars) => callSvc(svc, {
      method: 'POST',
      url: '/api/text/preview',
      body: JSON.stringify({ text: SAMPLE, draft: { synth: { dialogueQuoteChars } } }),
    })

    const off = await post('standard')
    assert.equal(off.status, 200)
    assert.equal(JSON.parse(off.bodyText).stats.dialogueCount, 0)

    const on = await post('both')
    assert.equal(on.status, 200)
    assert.equal(JSON.parse(on.bodyText).stats.dialogueCount, 1)

    const auto = await post('auto')
    assert.equal(auto.status, 200)
    assert.equal(JSON.parse(auto.bodyText).stats.dialogueCount, 1)

    const bad = await post('nonsense')
    assert.equal(bad.status, 422)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('翻转引号口径落盘后清空音频缓存（缓存键不含 role）', async () => {
  const dir = fresh()
  try {
    const st = new Store(dir)
    st.load({})
    st.update({ auth: { enabled: false } })
    const svc = new TtsService({ store: st, log: () => {} })

    svc.cache.set('old-segment', Buffer.from('old-wav'))
    assert.equal(svc.cache.stats().entries, 1)

    await svc.applyPatch({ synth: { dialogueQuoteChars: 'both' } })
    assert.equal(svc.config.synth.dialogueQuoteChars, 'both')
    assert.equal(svc.cache.stats().entries, 0, 'role 变了但段文本没变，必须清掉旧旁白音频')

    svc.cache.set('another-segment', Buffer.from('wav'))
    await svc.applyPatch({ synth: { maxSegmentChars: 110 } })
    assert.equal(svc.cache.stats().entries, 1, '无关配置变更不应误清缓存')
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})
