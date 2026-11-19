/**
 * 配置 CLI / DSH 工具测试：路径、落盘、掩码、导出导入、热更新三态与 doctor。
 * 所有临时目录都在 os.tmpdir()，结束即清理；不向真实 $HOME 写文件。
 */
import test from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { Store, maskKey } from '../src/config.mjs'
import {
  buildPatch,
  parseCliValue,
  parsePath,
  resolveDataDir,
  runConfigCli,
} from '../src/config-cli.mjs'
import { buildConfigToolDefinition, localDefineTool, registerConfigTool } from '../index.js'

const fresh = () => mkdtempSync(join(tmpdir(), 'abtts-cli-'))
const configFile = (dir) => join(dir, 'config.json')
const readConfig = (dir) => JSON.parse(readFileSync(configFile(dir), 'utf8'))

function seedConfig(dir, patch = {}) {
  const store = new Store(dir)
  store.load({})
  if (Object.keys(patch).length) {
    const result = store.update(patch)
    assert.deepEqual(result.problems, [])
  }
  return readConfig(dir)
}

async function run(argv, { data, env = {}, cwd, fetchImpl } = {}) {
  const out = []
  const err = []
  const code = await runConfigCli(argv, {
    stdout: (text) => out.push(text),
    stderr: (text) => err.push(text),
    env,
    cwd,
    data,
    fetchImpl,
  })
  const stdout = out.join('')
  let json = null
  try {
    json = JSON.parse(stdout)
  } catch {
    json = null
  }
  return { code, out: stdout, err: err.join(''), json }
}

function jsonResponse(res, status, payload) {
  res.writeHead(status, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify(payload))
}

async function startMockService(mode = 'ok') {
  const calls = { health: 0, patch: null }
  const server = createServer(async (req, res) => {
    const url = new URL(req.url, 'http://mock')
    if (req.method === 'GET' && url.pathname === '/health') {
      calls.health += 1
      if (mode === 'not-service') {
        jsonResponse(res, 404, { error: 'nope' })
        return
      }
      jsonResponse(res, 200, { status: 'ok', version: '0.5.1', provider: 'mimo' })
      return
    }
    if (req.method === 'PUT' && url.pathname === '/api/config') {
      const chunks = []
      for await (const chunk of req) chunks.push(chunk)
      calls.patch = {
        token: url.searchParams.get('token'),
        body: JSON.parse(Buffer.concat(chunks).toString('utf8')),
      }
      if (mode === 'reject') jsonResponse(res, 422, { error: '拒绝', problems: ['模拟拒绝：补丁不合法'] })
      else jsonResponse(res, 200, { ok: true })
      return
    }
    jsonResponse(res, 404, { error: 'not found' })
  })
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  return {
    port: server.address().port,
    calls,
    close: () => new Promise((resolve) => server.close(resolve)),
  }
}

async function freePort() {
  const server = createServer(() => {})
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  const { port } = server.address()
  await new Promise((resolve) => server.close(resolve))
  return port
}

test('get：点路径、数组索引、不存在路径', async () => {
  const dir = fresh()
  try {
    seedConfig(dir, {
      server: { port: 8299 },
      upstream: { keys: ['sk-test-aaaaaaaaaaaa', 'sk-test-bbbbbbbbbbbb'] },
    })
    const dot = await run(['get', 'server.port', '--json'], { data: dir })
    assert.equal(dot.code, 0)
    assert.equal(dot.json.value, 8299)

    const index = await run(['get', 'upstream.keys.1', '--json'], { data: dir })
    assert.equal(index.code, 0)
    assert.equal(index.json.value, maskKey('sk-test-bbbbbbbbbbbb'), '密钥必须脱敏')

    const missing = await run(['get', 'upstream.nope', '--json'], { data: dir })
    assert.equal(missing.code, 1)
    assert.equal(missing.json.ok, false)
    assert.match(missing.json.error, /没有路径/)
    assert.match(missing.json.error, /可用键/)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('set：合法值落盘；非法值退出码 2 且不落盘', async () => {
  const dir = fresh()
  try {
    seedConfig(dir)
    const ok = await run(['set', 'server.port', '8299', '--no-reload', '--json'], { data: dir })
    assert.equal(ok.code, 0)
    assert.equal(ok.json.before, 8291)
    assert.equal(ok.json.after, 8299)
    assert.equal(readConfig(dir).server.port, 8299)

    const before = readFileSync(configFile(dir), 'utf8')
    const bad = await run(['set', 'upstream.provider', 'nope', '--no-reload', '--json'], { data: dir })
    assert.equal(bad.code, 2)
    assert.equal(bad.json.ok, false)
    assert.ok(bad.json.problems.length > 0)
    assert.equal(readFileSync(configFile(dir), 'utf8'), before, '校验失败不得落盘')
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('set：数组索引保留其余元素，并在补丁里整段带数组', () => {
  const current = { upstream: { provider: 'mimo', keys: ['sk-test-aaaaaaaaaaaa', 'sk-test-bbbbbbbbbbbb'] } }
  const result = buildPatch(current, ['upstream', 'keys', '0'], 'sk-test-cccccccccccc')
  assert.deepEqual(result.patch, { upstream: { keys: ['sk-test-cccccccccccc', 'sk-test-bbbbbbbbbbbb'] } })
  assert.throws(() => buildPatch(current, ['upstream', 'keys', '5'], 'x'), /超出范围/)
  assert.throws(() => buildPatch(current, ['upstream', 'provider', '0'], 'x'), /不是数组/)
})

test('值解析：JSON 优先，--type 强制，坏值报错', () => {
  assert.equal(parseCliValue('true'), true)
  assert.equal(parseCliValue('123'), 123)
  assert.equal(parseCliValue('"123"'), '123')
  assert.equal(parseCliValue('abc'), 'abc')
  assert.equal(parseCliValue('123', 'string'), '123')
  assert.equal(parseCliValue('yes', 'boolean'), true)
  assert.deepEqual(parseCliValue('{"a":1}', 'json'), { a: 1 })
  assert.throws(() => parseCliValue('abc', 'number'), /解析为数字/)
  assert.throws(() => parseCliValue('{bad', 'json'), /合法 JSON/)
  assert.throws(() => parseCliValue('x', 'date'), /未知的 --type/)
})

test('掩码字段：set 保留原密钥，不把掩码写进配置', async () => {
  const dir = fresh()
  try {
    seedConfig(dir, { upstream: { keys: ['sk-test-aaaaaaaaaaaa'] } })
    const mask = maskKey('sk-test-aaaaaaaaaaaa')
    assert.match(mask, /…/)

    const restored = await run(['set', 'upstream.keys.0', mask, '--no-reload', '--json'], { data: dir })
    assert.equal(restored.code, 0)
    assert.deepEqual(readConfig(dir).upstream.keys, ['sk-test-aaaaaaaaaaaa'])

    const before = readFileSync(configFile(dir), 'utf8')
    const rejected = await run(['set', 'upstream.keys.0', 'sk-old…zzzz', '--no-reload', '--json'], { data: dir })
    assert.equal(rejected.code, 2)
    assert.match(rejected.json.problems.join('；'), /无效的掩码/)
    assert.equal(readFileSync(configFile(dir), 'utf8'), before, '失败不得落盘')
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('export：默认脱敏；--include-secrets 才写明文（stderr 警告）', async () => {
  const dir = fresh()
  try {
    seedConfig(dir, {
      auth: { pass: 'test-pass-123456' },
      upstream: { keys: ['sk-test-aaaaaaaaaaaa'] },
    })
    const plainFile = join(dir, 'export-redacted.json')
    const safe = await run(['export', plainFile, '--json'], { data: dir })
    assert.equal(safe.code, 0)
    const safeText = readFileSync(plainFile, 'utf8')
    const safeConfig = JSON.parse(safeText)
    assert.equal(safeConfig.upstream.keys[0], maskKey('sk-test-aaaaaaaaaaaa'))
    assert.equal(safeConfig.auth.token, '••••••')
    assert.equal(safeConfig.auth.pass, '••••••')
    assert.ok(!safeText.includes('sk-test-aaaaaaaaaaaa'), '默认导出不得出现明文 Key')

    const secretFile = join(dir, 'export-secret.json')
    const unsafe = await run(['export', secretFile, '--include-secrets', '--json'], { data: dir })
    assert.equal(unsafe.code, 0)
    assert.match(unsafe.err, /明文密钥/)
    const unsafeConfig = JSON.parse(readFileSync(secretFile, 'utf8'))
    assert.equal(unsafeConfig.upstream.keys[0], 'sk-test-aaaaaaaaaaaa')
    assert.ok(unsafeConfig.auth.token.length > 0)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('import：脱敏文件可回填；--dry-run 不写；改后值生效', async () => {
  const dir = fresh()
  try {
    seedConfig(dir, { upstream: { keys: ['sk-test-aaaaaaaaaaaa'] } })
    const exportFile = join(dir, 'export.json')
    await run(['export', exportFile], { data: dir })

    const dry = await run(['import', exportFile, '--dry-run', '--json'], { data: dir })
    assert.equal(dry.code, 0)
    assert.deepEqual(dry.json.changed, [])
    assert.deepEqual(readConfig(dir).upstream.keys, ['sk-test-aaaaaaaaaaaa'], '脱敏回填必须还原原 Key')

    const edited = JSON.parse(readFileSync(exportFile, 'utf8'))
    edited.upstream.provider = 'openai'
    edited.server.publicUrl = 'https://tts.example.com'
    const editedFile = join(dir, 'edited.json')
    writeFileSync(editedFile, JSON.stringify(edited, null, 2))

    const beforeText = readFileSync(configFile(dir), 'utf8')
    const preview = await run(['import', editedFile, '--dry-run', '--json'], { data: dir })
    assert.equal(preview.code, 0)
    assert.equal(preview.json.dryRun, true)
    assert.ok(preview.json.changed.some((item) => item.path === 'upstream.provider'))
    assert.ok(preview.json.changed.some((item) => item.path === 'server.publicUrl'))
    assert.equal(readFileSync(configFile(dir), 'utf8'), beforeText, '--dry-run 不得写文件')

    const applied = await run(['import', editedFile, '--no-reload', '--json'], { data: dir })
    assert.equal(applied.code, 0)
    assert.equal(applied.json.dryRun, false)
    const saved = readConfig(dir)
    assert.equal(saved.upstream.provider, 'openai')
    assert.equal(saved.server.publicUrl, 'https://tts.example.com')
    assert.deepEqual(saved.upstream.keys, ['sk-test-aaaaaaaaaaaa'])
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('热更新：200 成功；422 退出码 3；服务未跑只写文件', async () => {
  const okService = await startMockService('ok')
  const dir = fresh()
  const deadPort = await freePort()
  try {
    seedConfig(dir, { server: { port: okService.port }, auth: { token: 'test-token-123456' } })
    const ok = await run(['set', 'server.publicUrl', 'https://tts.example.com', '--json'], { data: dir })
    assert.equal(ok.code, 0)
    assert.equal(ok.json.reload.status, 'hot')
    assert.equal(okService.calls.patch.token, 'test-token-123456')
    assert.deepEqual(okService.calls.patch.body, { server: { publicUrl: 'https://tts.example.com' } })
    assert.equal(readConfig(dir).server.publicUrl, 'https://tts.example.com')
  } finally {
    await okService.close()
    rmSync(dir, { recursive: true, force: true })
  }

  const rejectService = await startMockService('reject')
  const rejectDir = fresh()
  try {
    seedConfig(rejectDir, { server: { port: rejectService.port }, auth: { token: 'test-token-123456' } })
    const rejected = await run(['set', 'server.publicUrl', 'https://tts.example.com', '--json'], { data: rejectDir })
    assert.equal(rejected.code, 3)
    assert.equal(rejected.json.ok, false)
    assert.equal(rejected.json.reload.status, 'rejected')
    assert.deepEqual(rejected.json.problems, ['模拟拒绝：补丁不合法'])
    assert.equal(readConfig(rejectDir).server.publicUrl, 'https://tts.example.com', '文件已写，提示需检查')
  } finally {
    await rejectService.close()
    rmSync(rejectDir, { recursive: true, force: true })
  }

  const offlineDir = fresh()
  try {
    seedConfig(offlineDir, { server: { port: deadPort } })
    const offline = await run(['set', 'synth.maxSegmentChars', '120', '--json'], { data: offlineDir })
    assert.equal(offline.code, 0)
    assert.equal(offline.json.reload.status, 'no-service')
    assert.match(offline.json.reload.message, /服务未运行/)
    assert.equal(readConfig(offlineDir).synth.maxSegmentChars, 120)
  } finally {
    rmSync(offlineDir, { recursive: true, force: true })
  }
})

test('热更新：--no-reload 不发请求；数组补丁整段带上', async () => {
  const service = await startMockService('ok')
  const dir = fresh()
  try {
    seedConfig(dir, {
      server: { port: service.port },
      auth: { token: 'test-token-123456' },
      upstream: { keys: ['sk-test-aaaaaaaaaaaa', 'sk-test-bbbbbbbbbbbb'] },
    })
    const skipped = await run(['set', 'server.publicUrl', 'https://x.example.com', '--no-reload', '--json'], { data: dir })
    assert.equal(skipped.code, 0)
    assert.equal(skipped.json.reload.status, 'skipped')
    assert.equal(service.calls.health, 0)
    assert.equal(service.calls.patch, null)

    const arraySet = await run(['set', 'upstream.keys.0', 'sk-test-cccccccccccc', '--json'], { data: dir })
    assert.equal(arraySet.code, 0)
    assert.deepEqual(service.calls.patch.body, {
      upstream: { keys: ['sk-test-cccccccccccc', 'sk-test-bbbbbbbbbbbb'] },
    })
    assert.deepEqual(readConfig(dir).upstream.keys, ['sk-test-cccccccccccc', 'sk-test-bbbbbbbbbbbb'])
  } finally {
    await service.close()
    rmSync(dir, { recursive: true, force: true })
  }
})

test('热更新：端口上是别的服务时不发 PUT', async () => {
  const service = await startMockService('not-service')
  const dir = fresh()
  try {
    seedConfig(dir, { server: { port: service.port }, auth: { token: 'test-token-123456' } })
    const result = await run(['set', 'server.port', String(service.port), '--json'], { data: dir })
    assert.equal(result.code, 0)
    assert.equal(result.json.reload.status, 'no-service')
    assert.match(result.json.reload.message, /不是听书服务/)
    assert.equal(service.calls.patch, null)
  } finally {
    await service.close()
    rmSync(dir, { recursive: true, force: true })
  }
})

test('validate 与 doctor：doctor --json 严格合法 JSON', async () => {
  const dir = fresh()
  try {
    seedConfig(dir)
    const validate = await run(['validate', '--json'], { data: dir })
    assert.equal(validate.code, 0)
    assert.equal(validate.json.ok, true)
    assert.deepEqual(validate.json.problems, [])

    const bad = await run(['set', 'upstream.provider', 'nope', '--no-reload', '--json'], { data: dir })
    assert.equal(bad.code, 2)

    const doctor = await run(['doctor', '--json'], { data: dir })
    assert.equal(doctor.code, 0)
    assert.ok(doctor.json, 'doctor --json 必须是严格 JSON')
    assert.equal(doctor.json.action, 'doctor')
    assert.ok(Array.isArray(doctor.json.checks))
    for (const id of ['config', 'validation', 'defaults', 'dataDir', 'port', 'service', 'localEngine', 'ffmpeg']) {
      assert.ok(doctor.json.checks.some((item) => item.id === id), `缺少体检项 ${id}`)
    }
    assert.ok(doctor.json.summary.pass >= 1)
    assert.ok(!/\u001b\[/.test(doctor.out), 'JSON 输出不得带 ANSI')

    writeFileSync(configFile(dir), '{ 坏掉的 json')
    const broken = await run(['doctor', '--json'], { data: dir })
    assert.equal(broken.code, 0)
    assert.equal(broken.json.ok, false)
    assert.equal(broken.json.checks.find((item) => item.id === 'config').status, 'fail')
    const brokenValidate = await run(['validate', '--json'], { data: dir })
    assert.equal(brokenValidate.code, 1)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('list：分组摘要与单组读取（脱敏）', async () => {
  const dir = fresh()
  try {
    seedConfig(dir, { upstream: { keys: ['sk-test-aaaaaaaaaaaa'] } })
    const groups = await run(['list', '--json'], { data: dir })
    assert.equal(groups.code, 0)
    assert.ok(groups.json.groups.some((item) => item.name === 'upstream' && item.type.startsWith('对象')))

    const group = await run(['list', '--group', 'upstream', '--json'], { data: dir })
    assert.equal(group.code, 0)
    assert.equal(group.json.value.keys[0], maskKey('sk-test-aaaaaaaaaaaa'))

    const missing = await run(['list', '--group', 'nope', '--json'], { data: dir })
    assert.equal(missing.code, 1)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('数据目录解析顺序与旧目录兼容', () => {
  const home = fresh()
  try {
    const legacy = join(home, 'plugin-data', 'mimo-tts')
    const modern = join(home, 'plugin-data', 'audiobook-tts-plugin')
    mkdirSync(legacy, { recursive: true })
    assert.equal(resolveDataDir({ env: { DSH_HOME: home }, create: false }), legacy)
    mkdirSync(modern, { recursive: true })
    assert.equal(resolveDataDir({ env: { DSH_HOME: home }, create: false }), modern)
    assert.equal(
      resolveDataDir({ env: { DSH_HOME: home, AUDIOBOOK_TTS_DATA: join(home, 'from-env') }, create: false }),
      join(home, 'from-env'),
    )
    assert.equal(
      resolveDataDir({ env: { DSH_HOME: home }, data: join(home, 'explicit'), create: false }),
      join(home, 'explicit'),
    )
    assert.equal(existsSync(join(home, 'explicit')), false, 'create:false 不得建目录')
  } finally {
    rmSync(home, { recursive: true, force: true })
  }
})

test('点路径解析：拒绝空段与原型链键', () => {
  assert.deepEqual(parsePath('upstream.keys.0'), ['upstream', 'keys', '0'])
  assert.throws(() => parsePath('upstream..provider'), /空段/)
  assert.throws(() => parsePath('__proto__.x'), /不允许的键名/)
})

test('DSH 工具：与 CLI 共用实现，注册后可直接调用', async () => {
  const dir = fresh()
  try {
    seedConfig(dir, { upstream: { provider: 'openai' } })

    const definition = buildConfigToolDefinition(localDefineTool, { dataDir: dir })
    assert.equal(definition.name, 'audiobook_tts_config')
    assert.equal(definition.parameters.type, 'object')
    assert.ok(definition.parameters.required.includes('action'))
    assert.equal(definition.parameters.properties.action.type, 'string')
    assert.deepEqual(definition.output.schema, {}, 'json 输出应转换为无约束 schema')

    const result = await definition.execute({ action: 'get', path: 'upstream.provider' })
    assert.equal(result.ok, true)
    assert.equal(result.value, 'openai')

    const setResult = await definition.execute({ action: 'set', path: 'server.port', value: 8301 })
    assert.equal(setResult.ok, true)
    assert.equal(readConfig(dir).server.port, 8301)

    let registered = null
    const fakeCtx = {
      inject: (deps, callback) => {
        assert.deepEqual(deps, ['tools'])
        callback({
          tools: {
            register: (spec) => {
              registered = spec
              return () => {}
            },
          },
          effect: (fn) => fn(),
        })
      },
    }
    const registration = await registerConfigTool(fakeCtx, { dataDir: dir, log: () => {} })
    assert.equal(registration.registered, true)
    assert.equal(registered.name, 'audiobook_tts_config')
    assert.equal(typeof registered.execute, 'function')

    const noTools = await registerConfigTool({}, { dataDir: dir })
    assert.equal(noTools.registered, false)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})
