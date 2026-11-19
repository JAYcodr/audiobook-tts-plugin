/**
 * 文本切分：把一段书页文本拆成「旁白 / 对话」交替的段，并合并同角色相邻句。
 *
 * 这是听感的核心：一段里引号内的话换用对话音色，引号外维持旁白。
 * 规则与旧 Python 实现逐条对齐（含几处踩过坑的修复），因为它们都是拿真实
 * 书源跑出来的结论，不是设计偏好：
 *
 * 1. ASCII 直引号 `"` `'` 先归一化成中文弯引号 —— 否则 `"` 会被当成独立单字符段
 *    发给上游，返回空/坏字节，最终导致整段消失。
 * 2. 连续中文句号 `。。。。` 归一化成 `…`，书源常拿它当省略号；不归一化会把
 *    每个 `。` 都当句子边界切碎，切出一堆单字请求。
 * 3. 纯引号段（如收尾的 `”`）并回前一句。
 * 4. 超长句先按逗号切，仍超长才硬截断 —— 保证每段不超过上限。
 */

/** 弯引号 / 角括号 / ASCII 引号，全部视为「这是对话」 */
const QUOTE_RE = /[\u201c\u201d\u2018\u2019\u300c\u300d\u300e\u300f\u0022\u0027]/
const QUOTE_CHARS = new Set(['\u201c', '\u201d', '\u2018', '\u2019', '\u300c', '\u300d', '\u300e', '\u300f', '"', "'"])
const SENTENCE_END_RE = /[。！？!\n；;]/
const SPLIT_RE = /([。！？!\n；;]+)/

/**
 * @param {string} text 原文
 * @param {{maxSegmentChars?:number}} [opts]
 * @returns {{text:string, role:'narrator'|'dialogue'}[]}
 */
export function splitText(text, opts = {}) {
  const maxLen = Math.max(10, Math.min(300, Number(opts.maxSegmentChars) || 100))
  if (typeof text !== 'string' || !text.trim()) return []

  let normalized = text
    .replace(/\u0022/g, '\u201c')
    .replace(/\u0027/g, '\u2018')
    .replace(/。{2,}/g, '\u2026')

  const raw = normalized.split(SPLIT_RE)
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

  // 纯引号段并回前一句
  const cleaned = []
  for (const s of sentences) {
    if (cleaned.length && s && [...s].every((c) => QUOTE_CHARS.has(c))) {
      cleaned[cleaned.length - 1] += s
    } else {
      cleaned.push(s)
    }
  }

  // 超长句二次切分
  const pieces = []
  for (const s of cleaned) {
    const t = s.trim()
    if (!t) continue
    if (t.length > maxLen * 2) splitLong(t, maxLen, pieces)
    else pieces.push(t)
  }

  // 按引号把句子切成「旁白 / 对话」交替 —— 不是按句子整体判角色。
  // 旧实现只要句子里有引号就整句算对话，于是「她低声说：」这种引导语也被
  // 对话音色念出来。这里把引号外的部分单独留给旁白。
  const segments = []
  for (const sentence of pieces) {
    for (const piece of splitByQuotes(sentence)) {
      const last = segments[segments.length - 1]
      if (last && last.role === piece.role && last.text.length + piece.text.length <= maxLen) {
        last.text += piece.text
      } else {
        segments.push({ ...piece })
      }
    }
  }
  return segments
}

/**
 * 把一句话按引号深度切成若干个 run。
 * 未闭合的开引号：其后内容一律算对话（书里常见整段引用）。
 */
function splitByQuotes(sentence) {
  const out = []
  let buf = ''
  let depth = 0
  for (const ch of sentence) {
    const open = ch === '\u201c' || ch === '\u300c' || ch === '\u300e'
    const close = ch === '\u201d' || ch === '\u300d' || ch === '\u300f'
    if (open && depth === 0) {
      if (buf.trim()) out.push({ text: buf, role: 'narrator' })
      buf = ch
      depth = 1
    } else if (close && depth > 0) {
      buf += ch
      depth = 0
      out.push({ text: buf, role: 'dialogue' })
      buf = ''
    } else {
      buf += ch
    }
  }
  if (buf.trim()) out.push({ text: buf, role: depth > 0 ? 'dialogue' : 'narrator' })
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
 * 把段落到「实际要发给上游的请求」：角色决定音色与风格。
 * 同一角色、同一音色/风格的相邻段在上游可以合并，但这里不合并 ——
 * 段大小已经由 splitText 的上限控制，合并只会拉长首音延迟。
 */
export function toRequests(segments, voices) {
  return segments.map((seg) => {
    const v = voices[seg.role] || voices.narrator
    return { text: seg.text, role: seg.role, voice: v.voice, style: v.style, mode: v.mode || 'preset' }
  })
}
