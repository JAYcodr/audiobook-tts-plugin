/**
 * 人话错误诊断与混推状态翻译（Issue #6）。
 *
 * 设计约束：
 * - 所有诊断文本先做纯 ASCII `encodeURIComponent()` 编码再写入 HTTP 头（`X-Audiobook-Hint`），
 *   避免 Node.js `writeHead`/`setHeader` 遇非 Latin-1 中文字符直接抛出 `ERR_INVALID_CHAR`；
 * - 不篡改既有 JSON 错误体字段结构，只附加提示头与控制面板可读诊断；
 * - 提供可操作的一键修复动作标识，供「交付 / 时间线」界面提示用户切换引擎或启停服务。
 */

/** 将中文或 Unicode 诊断提示编码为纯 ASCII HTTP Header 安全字符串。 */
export function encodeHintHeader(hint) {
  const s = String(hint || '').replace(/[\r\n]+/g, ' ').trim().slice(0, 240)
  return s ? encodeURIComponent(s) : ''
}

/**
 * 将底层错误或 HTTP 状态码翻译成人话诊断对象。
 * @param {any} errOrStatus Error 实例（含 status/code/message）或 HTTP 状态码数字
 * @param {{provider?:string,localReady?:boolean,maxTextChars?:number,endpoint?:string}} [ctx]
 * @returns {{code:string,httpStatus:number,message:string,hint:string,action:string}}
 */
export function humanizeError(errOrStatus, ctx = {}) {
  const isNum = typeof errOrStatus === 'number'
  const rawStatus = isNum ? errOrStatus : Number(errOrStatus?.status || 0)
  const rawCode = isNum ? '' : String(errOrStatus?.code || '')
  const rawMsg = isNum ? '' : String(errOrStatus?.message || errOrStatus || '')
  const lower = rawMsg.toLowerCase()
  const localReady = Boolean(ctx.localReady)

  if (rawStatus === 401 && ctx.endpointAuth) {
    return {
      code: 'unauthorized',
      httpStatus: 401,
      message: '鉴权未通过：URL 令牌或口令不正确',
      hint: '请从控制台「交付」页重新复制带令牌的导入地址，或生成只读分享链接',
      action: '',
    }
  }

  if (
    rawStatus === 402
    || /insufficient_quota|insufficient balance|余额不足|quota.*exceeded|out of credits/i.test(rawMsg)
  ) {
    return {
      code: 'quota_exhausted',
      httpStatus: 402,
      message: '云端 TTS 账号余额或免费额度已用尽',
      hint: localReady
        ? '本机 Qwen3-TTS 已就绪，可立即切为「本地」或「混合启动」免费继续听书'
        : '请登录云端控制台充值或到「设置 02」更换 API Key',
      action: localReady ? 'switch-local' : 'open-settings',
    }
  }

  if (
    rawStatus === 401
    || rawStatus === 403
    || /未配置\s*api\s*key|invalid.*api.?key|incorrect.*api.?key|authentication/i.test(rawMsg)
  ) {
    return {
      code: 'upstream_auth_failed',
      httpStatus: 502,
      message: '上游 TTS API Key 未配置、已失效或无权限',
      hint: localReady
        ? '请在「设置 02」核对 API Key，或临时切换为本地 Qwen3-TTS 离线继续听书'
        : '请在「设置 02」核对或更换有效的 API Key',
      action: localReady ? 'switch-local' : 'open-settings',
    }
  }

  if (rawStatus === 429 || /rate.?limit|too many requests|429/.test(lower)) {
    return {
      code: 'rate_limited',
      httpStatus: 429,
      message: '触发云端每分钟并发/速率限制 (429)',
      hint: '请在「设置 07」适当调大「每段字数」、降低并发数或调低限速 RPM',
      action: 'open-settings',
    }
  }

  if (rawStatus === 413 || /超过.*字|exceeds maxtextchars/i.test(rawMsg)) {
    return {
      code: 'text_too_long',
      httpStatus: 413,
      message: `单次请求文本过长${ctx.maxTextChars ? `（上限 ${ctx.maxTextChars} 字）` : ''}`,
      hint: '请在阅读器中开启分段发送，或在「设置 07」调大「最长文本」上限',
      action: 'open-settings',
    }
  }

  if (
    rawCode === 'service_stopped'
    || (rawStatus === 503 && /未启动/.test(rawMsg))
  ) {
    return {
      code: 'service_stopped',
      httpStatus: 503,
      message: '听书服务当前处于停止状态',
      hint: '请先在顶栏或控制台点击「启动」开始监听，再发起朗读请求',
      action: 'start-service',
    }
  }

  if (
    rawCode === 'missing_python'
    || rawCode === 'missing_model'
    || rawCode === 'missing_script'
    || ctx.provider === 'local'
    || /sidecar|本地.*(未就绪|退出|失败|不存在)|模型目录不存在/i.test(rawMsg)
  ) {
    return {
      code: 'local_engine_error',
      httpStatus: 503,
      message: rawMsg ? `本地引擎异常：${rawMsg}` : '本地 Qwen3-TTS 引擎未就绪或意外退出',
      hint: '可打开「运行体检 / 环境安装」修复本地环境，或临时切回 MiMo 云端渲染',
      action: 'open-setup',
    }
  }

  if (
    rawStatus === 504
    || rawCode === 'ETIMEDOUT'
    || rawCode === 'TimeoutError'
    || /timeout|timed out|etimedout|enotfound|econnrefused|econnreset|fetch failed/i.test(rawMsg)
  ) {
    return {
      code: 'upstream_timeout',
      httpStatus: 504,
      message: '连接上游 TTS 服务超时或网络不可达',
      hint: localReady
        ? '请检查本机网络/代理，或点击一键切到本地 Qwen3-TTS 引擎离线朗读'
        : '请检查本机网络、代理及上游 Base URL 是否可连通',
      action: localReady ? 'switch-local' : 'open-settings',
    }
  }

  if (rawStatus === 400 || rawStatus === 405) {
    return {
      code: 'bad_request',
      httpStatus: rawStatus,
      message: rawMsg || '请求参数格式不合法',
      hint: '请检查文本参数、JSON 格式或音频 format（Legado 仅支持 wav / mp3）',
      action: '',
    }
  }

  return {
    code: rawCode || 'synthesis_failed',
    httpStatus: rawStatus >= 500 && rawStatus <= 599 ? rawStatus : 502,
    message: rawMsg ? `合成失败：${rawMsg}` : '音频合成失败',
    hint: localReady
      ? '可前往「时间线」查看详情或「体检」，也可切到本地 Qwen3-TTS 兜底'
      : '请前往「设置 / 交付 -> 运行体检」检查上游密钥、参考音与网络状态',
    action: localReady ? 'switch-local' : 'open-setup',
  }
}

/**
 * 将 HybridProvider 内部的英文切源状态码翻译成可读中文说明。
 * 例：`buffer-ok 16.6>=12.0` -> `缓冲充裕，已切回本地（16.6s ≥ 12.0s）`
 */
export function humanizeSwitchReason(rawReason) {
  const s = String(rawReason || '').trim()
  if (!s) return ''

  let main = s
  let suffix = ''
  const resetMatch = /^(.*)\s*\(reset:([^)]+)\)$/.exec(s)
  if (resetMatch) {
    main = resetMatch[1].trim()
    suffix = `（会话因「${resetMatch[2].trim()}」已重置）`
  }

  let base = main
  if (main === 'cold-cloud') base = '冷启动云端极速顶班'
  else if (main === 'cold-no-cloud') base = '无可用云端 Key，本地冷启动直出'
  else if (main === 'start-or-resume') base = '本地已热，续读直接由本机直出'
  else if (main === 'already-local') base = '稳定缓冲期，持续由本地直出'
  else if (main === 'no-cloud') base = '未配置云端 Key，由本地兜底直出'
  else if (main === 'race-local') base = '云端与本地竞速，本地率先完成'
  else if (main === 'race-cloud') base = '云端与本地竞速，云端率先完成'
  else if (main === 'budget-local') base = '云端超出 12s 预算，已预热并切回本地'
  else if (main === 'budget-warmup-failed-cloud') base = '云端超预算但本地预热失败，继续云端'
  else if (main === 'hybrid-stream-cloud' || main === 'hybrid-cloud') base = '流式冷启动：预置音色抢首包中'
  else if (main.startsWith('buffer-ok ')) {
    const m = /^buffer-ok\s+([\d.]+)>=([\d.]+)/.exec(main)
    base = m
      ? `缓冲充裕，已切回本地（${m[1]}s ≥ ${m[2]}s）`
      : '缓冲充裕，已切回本地'
  } else if (main.startsWith('buffer-wait ')) {
    const m = /^buffer-wait\s+([\d.]+)<([\d.]+)/.exec(main)
    base = m
      ? `缓冲累积中，继续云端顶班（${m[1]}s < ${m[2]}s）`
      : '缓冲累积中，继续云端顶班'
  } else if (main.startsWith('long-build-buffer ')) {
    const rest = main.slice('long-build-buffer '.length).trim()
    base = `长段由云端快速攒缓冲（${rest}）`
  } else if (main.startsWith('cloud-failed-local')) {
    base = '云端异常，已自动切回本地兜底'
  }

  return `${base}${suffix}`
}
