export const PANEL_ID = 'mimo-tts'
export const API = '/mimo-tts/api'

/** 时区标签按运行机器的真实偏移算，不硬编码 UTC+8。 */
export const TZ_LABEL = (() => {
  const off = -new Date().getTimezoneOffset() / 60
  const shown = Number.isInteger(off) ? String(off) : off.toFixed(1)
  return `UTC${off >= 0 ? '+' : ''}${shown}`
})()

export const ROLE_CN = { narrator: '旁白', dialogue: '对话', mixed: '混合' }
export const ROLE_GLYPH = { narrator: '旁', dialogue: '对', mixed: '混' }
export const PROVIDER_CN = {
  mimo: '云端 MiMo',
  local: '本地 Qwen3',
  hybrid: '混合启动',
  openai: 'OpenAI 兼容',
}
export const WEEK_CN = ['日', '一', '二', '三', '四', '五', '六']
export const BODY_TEXT = 'text={{java.encodeURI(speakText)}}&speed={{speakSpeed}}'
export const CURL_SAMPLE = '瑞贝卡垂下眼皮，以掩饰自己眼中的疲惫。'
export const PREVIEW_SAMPLE = {
  narrator: '山道上起了雾，他把灯举高了一点。',
  dialogue: '“你终于来了，我等你很久了。”',
  mixed: '夜深了，山道上起了雾。\n“你终于来了，我等你很久了。”他低声说。',
}

export const HINTS = {
  timeline: '← → 选择片段 · 1–4 切换工作面 · 悬停流水看读数',
  settings: '拖动旋钮或方向键微调 · Ctrl/⌘+S 保存并生效 · 还原丢弃草稿',
  archive: '点日带或日表选中一天 · 30/7 切换范围 · CSV 导出当前范围',
  delivery: '复制导入地址即可交付 · 令牌已拼进 URL · 错误码在右侧',
}

export const ERR_CODES = [
  ['401', '令牌或口令不对 — 从本页重新复制导入地址'],
  ['429', '触发每分钟限速 — 调大「每段字数」减少分段请求'],
  ['502', '上游或本地引擎报错 — 查看时间线流水或切换引擎兜底'],
  ['413', '文本超过单次上限 — 调大「最长文本」或分段发送'],
  ['503', '服务未启动 — 回时间线启动服务'],
  ['500', '服务内部错误 — 看宿主控制台日志'],
]

export const COPY_LABEL = {
  import: '导入地址',
  'public-import': '公网导入地址',
  listen: '朗读地址',
  body: 'BODY',
  json: 'legado.json',
  curl: 'curl',
  token: 'URL 令牌',
}
