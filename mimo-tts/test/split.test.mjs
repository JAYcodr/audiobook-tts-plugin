import test from 'node:test'
import assert from 'node:assert/strict'
import { splitText, toRequests } from '../src/split.mjs'

test('纯旁白合并成一段', () => {
  const segs = splitText('他推开门。风灌了进来。')
  assert.equal(segs.length, 1)
  assert.equal(segs[0].role, 'narrator')
  assert.equal(segs[0].text, '他推开门。风灌了进来。')
})

test('引号内切到对话音色', () => {
  const segs = splitText('她说：“你终于来了。”')
  assert.deepEqual(segs.map((s) => s.role), ['narrator', 'dialogue'])
})

test('角括号是道具/术语标记，不切对话角色', () => {
  // 小说里「」『』标的是道具名、招式名、系统提示，不是对白
  const item = splitText('他拿起「青锋剑」，转身走了出去。')
  assert.deepEqual(item.map((s) => s.role), ['narrator'])
  assert.equal(item[0].text, '他拿起「青锋剑」，转身走了出去。')

  const nested = splitText('他掏出「回气丹」，又看了一眼【任务提示】：前往「落霞谷」。')
  assert.deepEqual(nested.map((s) => s.role), ['narrator'])

  // 对话里嵌「」不影响外层对话判定
  const said = splitText('他说：“这是「青锋剑」。”')
  assert.deepEqual(said.map((s) => s.role), ['narrator', 'dialogue'])
})

test('ASCII 直引号按对归一化并正确闭合，不会把后续旁白误判为对话', () => {
  const segs = splitText('He said: "come here." then left.')
  assert.ok(segs.every((s) => s.text.length > 1), JSON.stringify(segs))
  assert.ok(!segs.some((s) => s.text === '"'))
  assert.deepEqual(segs.map((s) => s.role), ['narrator', 'dialogue', 'narrator'])
  assert.equal(segs[1].text, '“come here.”')
  assert.equal(segs[2].text.trim(), 'then left.')
})

test('中文混排成对英文双引号 "你好" 能正确闭合', () => {
  const segs = splitText('她说："你好"然后转身走了。')
  assert.deepEqual(segs.map((s) => s.role), ['narrator', 'dialogue', 'narrator'])
  assert.deepEqual(segs.map((s) => s.text), ['她说：', '“你好”', '然后转身走了。'])
})

test('英文缩写撇号与跨句对话切分正确', () => {
  const segs = splitText('He said: "I don\'t know. Wait for O\'Brien!" And left.')
  assert.deepEqual(segs.map((s) => s.role), ['narrator', 'dialogue', 'narrator'])
  assert.ok(segs[1].text.includes('don’t'))
  assert.ok(segs[1].text.includes('O’Brien'))

  const multi = splitText('他说："第一句。第二句。"他走了。')
  assert.deepEqual(multi.map((s) => s.role), ['narrator', 'dialogue', 'narrator'])
  assert.equal(multi[1].text, '“第一句。第二句。”')
})

test('上一段未闭合引号不污染换行后的下一段旁白', () => {
  const segs = splitText('她说："这句话忘了闭合。\n下一段是旁白。')
  assert.deepEqual(segs.map((s) => s.role), ['narrator', 'dialogue', 'narrator'])
  assert.equal(segs[2].text, '下一段是旁白。')
})

test('连续句号归一化成省略号，不逐字切开', () => {
  const segs = splitText('他停住了。。。。')
  assert.equal(segs.length, 1)
  assert.ok(segs[0].text.includes('\u2026'))
})

test('超长句按逗号切分，且每段不超过上限', () => {
  const long = '这是一个很长的句子，'.repeat(20)
  const segs = splitText(long, { maxSegmentChars: 40 })
  assert.ok(segs.length > 1)
  assert.ok(segs.every((s) => s.text.length <= 40), segs.map((s) => s.text.length).join(','))
})

test('旁白与对话交替时不会把同角色段合并错位', () => {
  const segs = splitText('“甲。”乙。“丙。”')
  assert.deepEqual(segs.map((s) => s.role), ['dialogue', 'narrator', 'dialogue'])
})

test('toRequests 按角色挂音色与风格', () => {
  const voices = {
    narrator: { voice: '冰糖', style: '旁白', mode: 'preset' },
    dialogue: { voice: '苏打', style: '对白', mode: 'preset' },
  }
  const reqs = toRequests(splitText('他说：“走。”'), voices)
  assert.equal(reqs[0].voice, '冰糖')
  assert.equal(reqs.at(-1).voice, '苏打')
  assert.equal(reqs.at(-1).mode, 'preset')
})

test('空文本返回空数组', () => {
  assert.deepEqual(splitText('   '), [])
  assert.deepEqual(splitText(null), [])
})
