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

test('全角引号与角括号都算对话', () => {
  assert.equal(splitText('「走吧。」').at(-1).role, 'dialogue')
  assert.equal(splitText('『别动。』').at(-1).role, 'dialogue')
})

test('ASCII 直引号被归一化，不会切出孤立单引号段', () => {
  const segs = splitText('He said: "come here." then left.')
  assert.ok(segs.every((s) => s.text.length > 1), JSON.stringify(segs))
  assert.ok(!segs.some((s) => s.text === '"'))
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
