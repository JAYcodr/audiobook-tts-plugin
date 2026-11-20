import test from 'node:test'
import assert from 'node:assert/strict'
import { EventEmitter } from 'node:events'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Store, maskKey } from '../src/config.mjs'
import { TtsService } from '../src/service.mjs'
import {
  BUILTIN_POLYPHONE_PRESETS,
  BUILTIN_RULE_PRESETS,
  applyGlobalRules,
  applySegmentRules,
  exportRulesCsv,
  exportRulesJson,
  importRulesFromText,
  previewTextPipeline,
  validateTextRules,
} from '../src/lexicon.mjs'
import { parseWav, silentWav } from '../src/wav.mjs'

const fresh = (p = 'mimo-lex-') => mkdtempSync(join(tmpdir(), p))

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
    writeHead(s, h = {}) {
      this.status = s
      this.headers = h
      this.headersSent = true
    },
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

test('validateTextRules 校验规则长度、数量、语法、标志与 ReDoS 嵌套量词', () => {
  assert.deepEqual(validateTextRules({ enabled: true, items: BUILTIN_RULE_PRESETS }), [])

  const badRedos = validateTextRules({
    items: [{ name: 'bad1', pattern: '(a+)+', replace: '', regex: true }],
  })
  assert.ok(badRedos.some((p) => p.includes('嵌套量词')))

  const badRedos2 = validateTextRules({
    items: [{ name: 'bad2', pattern: '([a-z]*){2,}', replace: '', regex: true }],
  })
  assert.ok(badRedos2.some((p) => p.includes('嵌套量词')))

  const badSyntax = validateTextRules({
    items: [{ name: 'syn', pattern: '[unclosed', replace: '', regex: true }],
  })
  assert.ok(badSyntax.some((p) => p.includes('语法错误')))

  const badFlags = validateTextRules({
    items: [{ name: 'flg', pattern: 'abc', replace: '', regex: true, flags: 'gx' }],
  })
  assert.ok(badFlags.some((p) => p.includes('正则标志')))

  const tooLong = validateTextRules({
    items: [{ name: 'long', pattern: 'a'.repeat(201), replace: '', regex: false }],
  })
  assert.ok(tooLong.some((p) => p.includes('200')))

  const tooMany = validateTextRules({
    items: Array.from({ length: 201 }, (_, i) => ({ name: `r${i}`, pattern: `x${i}`, replace: 'y' })),
  })
  assert.ok(tooMany.some((p) => p.includes('200')))
})

test('Lexicon 两阶段替换按 scope 隔离（all -> split -> narrator/dialogue）且支持字面/正则', () => {
  const rules = {
    enabled: true,
    items: [
      { name: '清洗分割线', pattern: '[=-]{4,}', replace: '', regex: true, flags: 'g', scope: 'all', enabled: true },
      { name: '仅旁白多音字', pattern: '五行', replace: '五形', regex: false, scope: 'narrator', enabled: true },
      { name: '仅对话口癖', pattern: '俺', replace: '我', regex: false, scope: 'dialogue', enabled: true },
      { name: '字面 $1 不转义', pattern: '￥100', replace: '$1百元', regex: false, scope: 'all', enabled: true },
    ],
  }

  const raw = '====\n旁白里的五行和￥100。\n“俺也有五行。”他笑道。\nPS：求月票'
  const withPs = { ...rules, items: [...rules.items, BUILTIN_RULE_PRESETS[0]] }
  const out = previewTextPipeline(raw, { textRules: withPs, maxSegmentChars: 100 })

  assert.ok(!out.afterGlobalText.includes('===='))
  assert.ok(!out.afterGlobalText.includes('求月票'))
  assert.ok(out.afterGlobalText.includes('$1百元'))

  const narr = out.segments.find((s) => s.role === 'narrator')
  const dial = out.segments.find((s) => s.role === 'dialogue')
  assert.ok(narr.text.includes('五形'))
  assert.ok(dial.text.includes('我也有五行'), 'dialogue 不应应用 narrator 规则，仅应用 dialogue 规则')

  assert.equal(applyGlobalRules('keep', { enabled: false, items: rules.items }), 'keep')
  assert.equal(applySegmentRules([{ role: 'narrator', text: '   ' }], { enabled: true, items: [] }).length, 1)
})

test('POST /api/text/preview 调试分词结果并拦截非法正则草稿', async () => {
  const dir = fresh()
  try {
    const st = new Store(dir)
    st.load({})
    st.update({ auth: { enabled: false } })
    const svc = new TtsService({ store: st, log: () => {} })

    const okRes = await callSvc(svc, {
      url: '/api/text/preview',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        text: '--------\n夜深了，“Lv.9 怪兽来了！”他说。\nPS：明天三更',
        textRules: { enabled: true, items: BUILTIN_RULE_PRESETS },
        maxSegmentChars: 80,
      }),
    })
    assert.equal(okRes.status, 200)
    const body = JSON.parse(okRes.bodyText)
    assert.ok(!body.afterText.includes('----'))
    assert.ok(!body.afterText.includes('明天三更'))
    assert.ok(body.afterText.includes('等级 9'))
    assert.ok(body.segments.some((s) => s.role === 'dialogue'))
    assert.equal(body.stats.segmentCount, body.segments.length)

    const badRes = await callSvc(svc, {
      url: '/api/text/preview',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        text: '测试',
        textRules: { enabled: true, items: [{ name: 'redos', pattern: '(.*)*', replace: '', regex: true }] },
      }),
    })
    assert.equal(badRes.status, 422)

    await svc.stop()
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('POST /listening 与草稿态 POST /api/preview（含 mixed 与保留掩码 Key）工作正常且不改写配置', async () => {
  const dir = fresh()
  const prevFetch = globalThis.fetch
  const calls = []
  try {
    const wavSample = silentWav(0.25)
    globalThis.fetch = async (url, init) => {
      const parsedBody = JSON.parse(init.body)
      calls.push({ url: String(url), headers: init.headers, body: parsedBody })
      if (String(url).endsWith('/audio/speech')) {
        return new Response(wavSample, { status: 200, headers: { 'Content-Type': 'audio/wav' } })
      }
      return new Response(JSON.stringify({
        choices: [{ message: { audio: { data: wavSample.toString('base64') } } }],
      }), { status: 200, headers: { 'Content-Type': 'application/json' } })
    }

    const oldKey = 'sk-test-secret-123456'
    const st = new Store(dir)
    st.load({})
    st.update({
      auth: { enabled: false },
      upstream: { provider: 'mimo', keys: [oldKey] },
      voices: {
        narrator: { mode: 'preset', voice: '冰糖', style: '旁白默认' },
        dialogue: { mode: 'preset', voice: '苏打', style: '对话默认' },
      },
      textRules: {
        enabled: true,
        items: [{ name: '替换', pattern: '错字', replace: '正字', scope: 'all', enabled: true }],
      },
    })
    const svc = new TtsService({ store: st, log: () => {} })
    svc.listening = true

    // 1. /listening 先应用 textRules 再切分合成
    const listenRes = await callSvc(svc, {
      url: '/listening',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text: '这里有错字。' }),
    })
    assert.equal(listenRes.status, 200)
    assert.equal(calls.at(-1).body.messages[1].content, '这里有正字。')

    // 2. 草稿态试听：保留掩码 Key、未保存切换成 design + mixed 多角色拼接，绝不修改 store.config
    const previewRes = await callSvc(svc, {
      url: '/api/preview',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        role: 'mixed',
        text: '错字消失。“我是对话！”',
        draft: {
          upstream: { provider: 'mimo', keys: [maskKey(oldKey)] },
          voices: {
            narrator: { mode: 'design', style: '未保存草稿旁白风格' },
            dialogue: { mode: 'preset', voice: 'Chloe', style: '未保存对话' },
          },
        },
      }),
    })
    assert.equal(previewRes.status, 200)
    assert.ok(parseWav(previewRes.bodyBuffer).durationSec >= 0.45)

    const lastTwo = calls.slice(-2)
    assert.equal(lastTwo[0].headers['api-key'], oldKey, '草稿预览应还原真实密钥而不写入掩码')
    assert.equal(lastTwo[0].body.model, 'mimo-v2.5-tts-voicedesign')
    assert.equal(lastTwo[0].body.messages[0].content, '未保存草稿旁白风格')
    assert.equal(lastTwo[0].body.messages[1].content, '正字消失。')
    assert.equal(lastTwo[1].body.audio.voice, 'Chloe')

    // store.config 必须保持原样未被草稿污染
    assert.equal(svc.config.voices.narrator.mode, 'preset')
    assert.equal(svc.config.voices.dialogue.voice, '苏打')

    // 3. 草稿态切换未保存的 openai provider 也直接走新 provider，并支持无保存校验拦截
    const openaiDraftRes = await callSvc(svc, {
      url: '/api/preview',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        role: 'narrator',
        text: '测试草稿切 OpenAI',
        draft: {
          upstream: {
            provider: 'openai',
            openai: { baseUrl: 'http://127.0.0.1:8880/v1', model: 'kokoro', narratorVoice: 'zf_xiaobei' },
          },
        },
      }),
    })
    assert.equal(openaiDraftRes.status, 200)
    assert.equal(openaiDraftRes.headers['X-Mimo-Source'], 'openai')
    assert.equal(calls.at(-1).body.voice, 'zf_xiaobei')
    assert.equal(svc.config.upstream.provider, 'mimo')

    const badDraftRes = await callSvc(svc, {
      url: '/api/preview',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        role: 'narrator',
        text: '测试异常草稿',
        draft: { upstream: { keys: ['sk-broken…9999'] } },
      }),
    })
    assert.equal(badDraftRes.status, 422)

    await svc.stop()
  } finally {
    globalThis.fetch = prevFetch
    rmSync(dir, { recursive: true, force: true })
  }
})

test('Issue #5: 内置多音字词表默认启用、按词匹配且不破坏引号切分，支持开关与 CSV/JSON 导入导出', async () => {
  const dir = fresh()
  try {
    const st = new Store(dir)
    const cfg = st.load({})
    st.update({ auth: { enabled: false } })
    assert.equal(cfg.textRules.polyphoneEnabled, true)
    assert.ok(BUILTIN_POLYPHONE_PRESETS.length >= 10)

    const svc = new TtsService({ store: st, log: () => {} })

    // 1) 默认状态下 /api/text/preview 生效：按词纠正「血泊/埋怨/单于」，不影响引号角色切分
    const prevRes = await callSvc(svc, {
      url: '/api/text/preview',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        text: '单于站在营帐外，“别在血泊里埋怨！”他说。',
      }),
    })
    assert.equal(prevRes.status, 200)
    const prevJson = JSON.parse(prevRes.bodyText)
    assert.ok(prevJson.afterText.includes('蝉于'))
    assert.ok(prevJson.afterText.includes('血坡'))
    assert.ok(prevJson.afterText.includes('瞒怨'))
    assert.equal(prevJson.segments.filter((s) => s.role === 'dialogue').length, 1)
    assert.equal(prevJson.segments.filter((s) => s.role === 'narrator').length, 2)

    // 2) 关闭 polyphoneEnabled 或单条禁用 poly:xuepo 后，原词保持不变
    const offRes = await callSvc(svc, {
      url: '/api/text/preview',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        text: '单于站在血泊边。',
        textRules: { enabled: true, polyphoneEnabled: false, items: [] },
      }),
    })
    assert.equal(offRes.status, 200)
    assert.ok(JSON.parse(offRes.bodyText).afterText.includes('单于站在血泊边'))

    const partialRes = await callSvc(svc, {
      url: '/api/text/preview',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        text: '单于站在血泊边。',
        textRules: { enabled: true, polyphoneEnabled: true, disabledPresets: ['poly:xuepo'], items: [] },
      }),
    })
    assert.equal(partialRes.status, 200)
    const partialText = JSON.parse(partialRes.bodyText).afterText
    assert.ok(partialText.includes('蝉于'))
    assert.ok(partialText.includes('血泊'))

    // 3) CSV / JSON 导入导出往返一致，并拦截 ReDoS 规则导入
    const csv = exportRulesCsv(BUILTIN_POLYPHONE_PRESETS.slice(0, 3))
    const impCsv = importRulesFromText(csv, 'csv')
    assert.deepEqual(impCsv.problems, [])
    assert.equal(impCsv.items.length, 3)
    assert.equal(impCsv.items[0].pattern, BUILTIN_POLYPHONE_PRESETS[0].pattern)
    assert.equal(impCsv.items[0].replace, BUILTIN_POLYPHONE_PRESETS[0].replace)

    const json = exportRulesJson(BUILTIN_POLYPHONE_PRESETS.slice(0, 2))
    const impJson = importRulesFromText(json, 'json')
    assert.deepEqual(impJson.problems, [])
    assert.equal(impJson.items.length, 2)

    const badImp = importRulesFromText(JSON.stringify([{ name: 'redos', pattern: '(a+)+', replace: '', regex: true }]))
    assert.ok(badImp.problems.some((p) => p.includes('嵌套量词')))

    await svc.stop()
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})
