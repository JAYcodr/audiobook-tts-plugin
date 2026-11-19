/**
 * 文本切分：把一段书页文本拆成「旁白 / 对话」交替的段，并合并同角色相邻句。
 *
 * 这是听感的核心：一段里引号内的话换用对话音色，引号外维持旁白。
 * 规则与旧 Python 实现逐条对齐（含几处踩过坑的修复），因为它们都是拿真实
 * 书源跑出来的结论，不是设计偏好：
 *
 * 1. ASCII 直引号 `"` `'` 按段落配对归一化成中文弯引号（同时保护英文缩写撇号如 don't）——
 *    否则 `"` 会被当成独立单字符段，或因单向替换成开引号导致整段无法闭合。
 * 2. 连续中文句号 `。。。。` 归一化成 `…`，书源常拿它当省略号；不归一化会把
 *    每个 `。` 都当句子边界切碎，切出一堆单字请求。
 * 3. 纯引号段（如收尾的 `”`）并回前一句。
 * 4. 超长句先按逗号切，仍超长才硬截断 —— 保证每段不超过上限。
 */

/** 弯引号 / 角括号 / ASCII 引号，全部视为引号字符（用于合并纯引号残段） */
const QUOTE_CHARS = new Set(['\u201c', '\u201d', '\u2018', '\u2019', '\u300c', '\u300d', '\u300e', '\u300f', '"', "'"])
const SENTENCE_END_RE = /[。！？!；;]/
const SPLIT_RE = /([。！？!；;]+)/

const QUOTE_PAIRS = new Map([
  ['\u201c', '\u201d'],
  ['\u300c', '\u300d'],
  ['\u300e', '\u300f'],
])
const CLOSE_QUOTES = new Set(QUOTE_PAIRS.values())

/**
 * 将 ASCII 直引号按段落配对归一化为弯引号，同时保护英文缩写/所有格撇号。
 * 按换行符重置配对状态，避免某段未闭合的引号污染后续全部段落。
 */
export function normalizeQuotes(text) {
  return String(text || '')
    .split(/\r?\n/)
    .map((line) => normalizeLineQuotes(line))
    .join('\n')
}

function normalizeLineQuotes(line) {
  let out = ''
  let doubleDepth = 0
  let singleDepth = 0
  const chars = [...line]
  const isWordChar = (c) => /[A-Za-z0-9]/.test(c)

  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i]
    if (ch === '\u201c') {
      doubleDepth++
      out += ch
    } else if (ch === '\u201d') {
      doubleDepth = Math.max(0, doubleDepth - 1)
      out += ch
    } else if (ch === '"') {
      if (doubleDepth === 0) {
        out += '\u201c'
        doubleDepth = 1
      } else {
        out += '\u201d'
        doubleDepth = 0
      }
    } else if (ch === '\u2018') {
      singleDepth++
      out += ch
    } else if (ch === '\u2019') {
      singleDepth = Math.max(0, singleDepth - 1)
      out += ch
    } else if (ch === "'") {
      const prev = i > 0 ? chars[i - 1] : ''
      const next = i + 1 < chars.length ? chars[i + 1] : ''
      // 单词内部缩写撇号（don't, O'Brien）或复数词尾所有格（students' books）不触发开引号
      if (isWordChar(prev) && isWordChar(next)) {
        out += '\u2019'
      } else if (singleDepth === 0 && (prev === 's' || prev === 'S') && (!next || /[\s,.!?;:)]/.test(next))) {
        out += '\u2019'
      } else if (singleDepth === 0) {
        out += '\u2018'
        singleDepth = 1
      } else {
        out += '\u2019'
        singleDepth = 0
      }
    } else {
      out += ch
    }
  }
  return out
}

/**
 * @param {string} text 原文
 * @param {{maxSegmentChars?:number}} [opts]
 * @returns {{text:string, role:'narrator'|'dialogue'}[]}
 */
export function splitText(text, opts = {}) {
  const maxLen = Math.max(10, Math.min(300, Number(opts.maxSegmentChars) || 100))
  if (typeof text !== 'string' || !text.trim()) return []

  const normalized = normalizeQuotes(text).replace(/。{2,}/g, '\u2026')
  const paragraphs = normalized.split(/\n+/)
  const segments = []

  for (const para of paragraphs) {
    if (!para.trim()) continue
    const pieces = splitParagraphToPieces(para, maxLen)
    // 同段落内跨句子保留引号栈，确保跨句对话（“第一句。第二句。”）与超长句二次切分不断开角色
    const quoteStack = []
    for (const sentence of pieces) {
      for (const piece of splitByQuotes(sentence, quoteStack)) {
        const last = segments[segments.length - 1]
        if (last && last.role === piece.role && last.text.length + piece.text.length <= maxLen) {
          last.text += piece.text
        } else {
          segments.push({ ...piece })
        }
      }
    }
  }
  return segments
}

function splitParagraphToPieces(para, maxLen) {
  const raw = para.split(SPLIT_RE)
  const sentences = []
  for (let i = 0; i < raw.length; i++) {
    const piece = raw[i]
    if (i + 1 < raw.length && SENTENCE_END_RE.test(raw[i + 1])) {
      sentences.push(piece + raw[i + 1])
      i++
    } else if (piece.trim()) {
      sentences.push(piece.trim())
    }
  }

  // 纯引号段或以收尾引号开头的残段（如「!” then left」里的 `”`）并回前一句
  const cleaned = []
  for (const s of sentences) {
    if (cleaned.length && s && [...s].every((c) => QUOTE_CHARS.has(c))) {
      cleaned[cleaned.length - 1] += s
    } else if (cleaned.length && s) {
      const m = /^([\u201d\u300d\u300f\u2019]+)(.*)$/s.exec(s)
      if (m) {
        cleaned[cleaned.length - 1] += m[1]
        if (m[2].trim()) cleaned.push(m[2])
      } else {
        cleaned.push(s)
      }
    } else {
      cleaned.push(s)
    }
  }

  // 超长句二次切分
  const pieces = []
  for (const s of cleaned) {
    const t = s.trim()
    if (!t) continue
    if (t.length > maxLen) splitLong(t, maxLen, pieces)
    else pieces.push(t)
  }
  return pieces
}

/**
 * 把一句话按引号栈切成若干个 run（栈由调用方在同段内跨句维护）。
 * 未闭合的开引号：同段后续内容一律算对话（书里常见整段引用）。
 */
function splitByQuotes(sentence, stack = []) {
  const out = []
  let buf = ''
  for (const ch of sentence) {
    const expectedClose = QUOTE_PAIRS.get(ch)
    if (expectedClose) {
      if (stack.length === 0) {
        if (buf.trim()) out.push({ text: buf, role: 'narrator' })
        buf = ch
      } else {
        buf += ch
      }
      stack.push(expectedClose)
    } else if (CLOSE_QUOTES.has(ch) && stack.length > 0) {
      buf += ch
      const matchIdx = stack.lastIndexOf(ch)
      if (matchIdx >= 0) stack.splice(matchIdx)
      if (stack.length === 0) {
        out.push({ text: buf, role: 'dialogue' })
        buf = ''
      }
    } else {
      buf += ch
    }
  }
  if (buf.trim()) out.push({ text: buf, role: stack.length > 0 ? 'dialogue' : 'narrator' })
  return out.filter((p) => p.text.trim())
}

function splitLong(s, maxLen, out) {
  const parts = s.split(/([，,、]+)/)
  let current = ''
  for (const part of parts) {
    if (current && (current + part).length > maxLen) {
      out.push(current.trim())
      current = part
    } else {
      current += part
    }
  }
  const rest = current.trim()
  if (!rest) return
  if (rest.length > maxLen) {
    for (let i = 0; i < rest.length; i += maxLen) out.push(rest.slice(i, i + maxLen))
  } else {
    out.push(rest)
  }
}

/**
 * 把段落映射到「实际要发给上游的请求」：角色决定音色与风格。
 * 同一角色、同一音色/风格的相邻段在上游可以合并，但这里不合并 ——
 * 段大小已经由 splitText 的上限控制，合并只会拉长首音延迟。
 */
export function toRequests(segments, voices) {
  return segments.map((seg) => {
    const v = voices[seg.role] || voices.narrator
    return {
      text: seg.text,
      role: seg.role,
      voice: v.voice,
      style: v.style,
      mode: v.mode || 'preset',
      refId: v.refId || '',
    }
  })
}
