/**
 * 文本发音与断句替换规则引擎（Text Lexicon）。
 *
 * 两阶段执行：
 *   1. scope === 'all' 规则在 splitText 之前作用于全文（适合过滤 PS 附言、章节分割线等）
 *   2. scope === 'narrator' / 'dialogue' 规则在 splitText 之后按角色段执行（适合修对话口癖或多音字）
 *
 * 所有正则经过长度上限、合法语法、合法标志与嵌套量词 ReDoS 静态扫描。
 */
import { splitText } from './split.mjs'

export const MAX_TEXT_RULES = 200
export const MAX_RULE_PATTERN_LEN = 200
export const MAX_RULE_REPLACE_LEN = 500
export const MAX_EXPANDED_TEXT_LEN = 200_000

const VALID_SCOPES = new Set(['all', 'narrator', 'dialogue'])
const ALLOWED_FLAGS = new Set(['g', 'i', 'm', 'u'])

export const BUILTIN_RULE_PRESETS = [
  {
    id: 'preset:strip-ps',
    name: '过滤章末 PS 作者附言',
    pattern: '^(?:PS|P\\.S\\.|作者的话)[：:].*$',
    replace: '',
    regex: true,
    flags: 'gim',
    scope: 'all',
    enabled: true,
  },
  {
    id: 'preset:strip-separators',
    name: '清洗装饰性分割线（==== / ---- / ****）',
    pattern: '[=\\-*~]{4,}',
    replace: '',
    regex: true,
    flags: 'g',
    scope: 'all',
    enabled: true,
  },
  {
    id: 'preset:strip-bracket-ads',
    name: '过滤【求月票/求推荐】互动标签',
    pattern: '【(?:求月票|求推荐|求收藏|求订阅|求打赏)[^】]{0,20}】',
    replace: '',
    regex: true,
    flags: 'g',
    scope: 'all',
    enabled: true,
  },
  {
    id: 'preset:rpg-level',
    name: '英文缩写朗读修正（Lv. → 等级）',
    pattern: '\\bLv\\.?\\s*',
    replace: '等级 ',
    regex: true,
    flags: 'gi',
    scope: 'all',
    enabled: true,
  },
]

function readQuantifier(pattern, start) {
  const ch = pattern[start]
  if (ch === '*' || ch === '+') {
    const lazy = pattern[start + 1] === '?' ? 1 : 0
    return { consumed: 1 + lazy, isRepeating: true }
  }
  if (ch === '?') {
    const lazy = pattern[start + 1] === '?' ? 1 : 0
    return { consumed: 1 + lazy, isRepeating: false }
  }
  if (ch === '{') {
    const m = /^\{(\d+)(?:,(\d*))?\}/.exec(pattern.slice(start))
    if (!m) return null
    const min = Number(m[1])
    const max = m[2] === undefined ? min : (m[2] === '' ? Infinity : Number(m[2]))
    const afterBrace = start + m[0].length
    const lazy = pattern[afterBrace] === '?' ? 1 : 0
    return { consumed: m[0].length + lazy, isRepeating: max === Infinity || max > 1 }
  }
  return null
}

/** 静态扫描正则中的嵌套量词（如 (a+)+ / (.*)*），防范灾难性回溯 ReDoS。 */
export function findRegexSafetyIssue(pattern) {
  let escaped = false
  let inClass = false
  const stack = [{ hasQuant: false }]

  for (let i = 0; i < pattern.length; i++) {
    const ch = pattern[i]
    if (escaped) {
      escaped = false
      continue
    }
    if (ch === '\\') {
      escaped = true
      continue
    }
    if (inClass) {
      if (ch === ']') inClass = false
      continue
    }
    if (ch === '[') {
      inClass = true
      continue
    }
    if (ch === '(') {
      stack.push({ hasQuant: false })
      continue
    }
    if (ch === ')') {
      const frame = stack.length > 1 ? stack.pop() : { hasQuant: false }
      const q = readQuantifier(pattern, i + 1)
      if (q) {
        i += q.consumed
        if (q.isRepeating && frame.hasQuant) {
          return '检测到嵌套量词（如 (a+)+），存在正则回溯卡死风险'
        }
        if (q.isRepeating && stack.length > 0) stack[stack.length - 1].hasQuant = true
      }
      if (frame.hasQuant && stack.length > 0) stack[stack.length - 1].hasQuant = true
      continue
    }
    if (ch === '*' || ch === '+' || ch === '{') {
      const q = readQuantifier(pattern, i)
      if (q) {
        i += q.consumed - 1
        if (q.isRepeating && stack.length > 0) stack[stack.length - 1].hasQuant = true
      }
    }
  }
  return ''
}

function normalizeFlags(flags) {
  const raw = String(flags || 'g')
  for (const ch of raw) {
    if (!ALLOWED_FLAGS.has(ch)) {
      return { flags: '', error: `不支持的正则标志 "${ch}"（仅允许 g / i / m / u）` }
    }
  }
  const uniq = new Set(['g', ...raw])
  return { flags: [...uniq].join(''), error: '' }
}

/** 校验整组 textRules，返回问题描述数组（空数组代表全部合法）。 */
export function validateTextRules(textRules) {
  const problems = []
  if (textRules === undefined || textRules === null) return problems
  if (typeof textRules !== 'object' || Array.isArray(textRules)) {
    return ['textRules 必须是对象']
  }
  if (textRules.items === undefined) return problems
  if (!Array.isArray(textRules.items)) {
    return ['textRules.items 必须是数组']
  }
  if (textRules.items.length > MAX_TEXT_RULES) {
    problems.push(`发音/断句规则不能超过 ${MAX_TEXT_RULES} 条（当前 ${textRules.items.length} 条）`)
  }

  for (let idx = 0; idx < textRules.items.length; idx++) {
    const it = textRules.items[idx]
    const label = `规则 #${idx + 1}${it?.name ? `（${String(it.name).slice(0, 20)}）` : ''}`
    if (!it || typeof it !== 'object') {
      problems.push(`${label}：必须是对象`)
      continue
    }
    const pattern = String(it.pattern ?? '')
    if (!pattern) {
      problems.push(`${label}：匹配模式（pattern）不能为空`)
      continue
    }
    if (pattern.length > MAX_RULE_PATTERN_LEN) {
      problems.push(`${label}：匹配模式长度超过 ${MAX_RULE_PATTERN_LEN} 字符限制`)
    }
    const replace = String(it.replace ?? '')
    if (replace.length > MAX_RULE_REPLACE_LEN) {
      problems.push(`${label}：替换文本长度超过 ${MAX_RULE_REPLACE_LEN} 字符限制`)
    }
    const scope = it.scope || 'all'
    if (!VALID_SCOPES.has(scope)) {
      problems.push(`${label}：scope 必须是 all / narrator / dialogue`)
    }
    if (it.regex) {
      const { flags, error: flagErr } = normalizeFlags(it.flags)
      if (flagErr) {
        problems.push(`${label}：${flagErr}`)
        continue
      }
      const safetyErr = findRegexSafetyIssue(pattern)
      if (safetyErr) {
        problems.push(`${label}：${safetyErr}`)
        continue
      }
      try {
        new RegExp(pattern, flags)
      } catch (err) {
        problems.push(`${label}：正则表达式语法错误（${err?.message || err}）`)
      }
    }
  }
  return problems
}

function compileRules(textRules, targetScopes) {
  if (!textRules || textRules.enabled === false) return []
  const items = Array.isArray(textRules.items) ? textRules.items : []
  const compiled = []
  for (const it of items) {
    if (!it || it.enabled === false) continue
    const scope = it.scope || 'all'
    if (!targetScopes.has(scope)) continue
    const pattern = String(it.pattern ?? '')
    if (!pattern || pattern.length > MAX_RULE_PATTERN_LEN) continue
    const replace = String(it.replace ?? '').slice(0, MAX_RULE_REPLACE_LEN)
    if (it.regex) {
      const { flags, error } = normalizeFlags(it.flags)
      if (error || findRegexSafetyIssue(pattern)) continue
      try {
        compiled.push({ regex: true, re: new RegExp(pattern, flags), replace, scope, name: it.name || '' })
      } catch { /* skip broken rule */ }
    } else {
      compiled.push({ regex: false, pattern, replace, scope, name: it.name || '' })
    }
  }
  return compiled
}

function runRules(text, compiledRules) {
  let out = String(text ?? '')
  for (const r of compiledRules) {
    out = r.regex ? out.replace(r.re, r.replace) : out.replaceAll(r.pattern, () => r.replace)
    if (out.length > MAX_EXPANDED_TEXT_LEN) out = out.slice(0, MAX_EXPANDED_TEXT_LEN)
  }
  return out
}

/** 切分前对全文应用 scope==='all' 的规则。 */
export function applyGlobalRules(text, textRules) {
  const rules = compileRules(textRules, new Set(['all']))
  if (!rules.length) return String(text ?? '')
  return runRules(text, rules)
}

/** 切分后对段落按 role 应用 scope==='narrator'/'dialogue' 的规则，并过滤空段。 */
export function applySegmentRules(segments, textRules) {
  if (!Array.isArray(segments)) return []
  const narrRules = compileRules(textRules, new Set(['narrator']))
  const dialRules = compileRules(textRules, new Set(['dialogue']))
  if (!narrRules.length && !dialRules.length) return segments

  const out = []
  for (const seg of segments) {
    const rules = seg.role === 'dialogue' ? dialRules : narrRules
    const nextText = rules.length ? runRules(seg.text, rules).trim() : seg.text
    if (nextText) out.push({ ...seg, text: nextText })
  }
  return out
}

/**
 * 文本处理实时调试预览：原文 -> 全局替换 -> 角色切分 -> 角色段规则替换。
 */
export function previewTextPipeline(text, { textRules, maxSegmentChars = 100 } = {}) {
  const originalText = String(text ?? '')
  const afterGlobalText = applyGlobalRules(originalText, textRules)
  const rawSegments = splitText(afterGlobalText, { maxSegmentChars })
  const segments = applySegmentRules(rawSegments, textRules)
  return {
    originalText,
    afterGlobalText,
    afterText: segments.map((s) => s.text).join('\n'),
    segments,
    stats: {
      originalChars: originalText.length,
      afterGlobalChars: afterGlobalText.length,
      afterChars: segments.reduce((sum, s) => sum + s.text.length, 0),
      segmentCount: segments.length,
      narratorCount: segments.filter((s) => s.role === 'narrator').length,
      dialogueCount: segments.filter((s) => s.role === 'dialogue').length,
    },
  }
}
