import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const src = readFileSync(new URL('../src/local.mjs', import.meta.url), 'utf8')

test('本地引擎内存数优先取 footprint（活动监视器口径）', () => {
  assert.match(src, /this\.rssMb = health\.footprint_mb \?\? health\.maxrss_mb \?\? null/)
  assert.match(src, /this\.rssMb = h\.footprint_mb \?\? h\.maxrss_mb \?\? this\.rssMb/)
})

test('不存在裸读 maxrss 的地方（会少报一半）', () => {
  assert.doesNotMatch(src, /rssMb = (?:health|h)\.maxrss_mb/)
})
