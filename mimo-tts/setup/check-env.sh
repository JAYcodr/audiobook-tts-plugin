#!/usr/bin/env bash
# 体检脚本：只读，不改任何东西。装完 / 出问题时先跑这个。
#
#   ./setup/check-env.sh
#   PORT=8292 ./setup/check-env.sh
#
# 输出里 OK / WARN / FAIL 三类，最后一行是总结。
set -uo pipefail

resolve_data_dir() {
  if [ -n "${AUDIOBOOK_DATA:-${MIMO_DATA:-}}" ]; then
    printf '%s' "${AUDIOBOOK_DATA:-$MIMO_DATA}"
    return
  fi
  local dsh_home="${DSH_HOME:-$HOME/.dsh}"
  local modern="$dsh_home/plugin-data/audiobook-tts-plugin"
  local legacy="$dsh_home/plugin-data/mimo-tts"
  if [ ! -d "$modern" ] && [ -d "$legacy" ]; then
    printf '%s' "$legacy"
  else
    printf '%s' "$modern"
  fi
}

DATA="$(resolve_data_dir)"
CONFIG="$DATA/config.json"
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PACK="$(cd "$HERE/.." && pwd)"
PORT="${PORT:-}"

ok=0 warn=0 fail=0
p_ok()   { printf '  \033[32mOK\033[0m   %s\n' "$*"; ok=$((ok+1)); }
p_warn() { printf '  \033[33mWARN\033[0m %s\n' "$*"; warn=$((warn+1)); }
p_fail() { printf '  \033[31mFAIL\033[0m %s\n' "$*"; fail=$((fail+1)); }

json() {
  [ -f "$CONFIG" ] || return 1
  python3 - "$CONFIG" "$1" <<'PY' 2>/dev/null
import json, sys
d = json.load(open(sys.argv[1]))
for k in sys.argv[2].split('.'):
    if isinstance(d, list):
        d = d[int(k)]
    else:
        d = d.get(k) if isinstance(d, dict) else None
    if d is None:
        sys.exit(1)
print(d if not isinstance(d, (dict, list)) else json.dumps(d, ensure_ascii=False))
PY
}

echo "== 平台 =="
echo "  $(uname -sm)  ·  bash ${BASH_VERSION%%(*}"
if [ "$(uname -s)" = "Darwin" ] && [ "$(uname -m)" = "arm64" ]; then
  p_ok "可以跑本地引擎"
else
  p_warn "不是 macOS arm64 —— 本地引擎用不了，OpenAI 兼容与云端没问题"
fi

echo
echo "== 数据目录 =="
echo "  $DATA"
if [ -f "$CONFIG" ]; then
  p_ok "config.json 存在"
  provider="$(json upstream.provider || echo '?')"
  port_cfg="$(json server.port || echo '?')"
  keys="$(json upstream.keys || echo '[]')"
  token="$(json auth.token || echo '')"
  echo "       provider=$provider  port=$port_cfg"
  nkeys="$(printf '%s' "$keys" | python3 -c 'import json,sys;print(len(json.load(sys.stdin)))' 2>/dev/null || echo '?')"
  if [ -n "$token" ]; then tokstate="已生成"; else tokstate="缺失"; fi
  echo "       keys=${nkeys} 条  token=${tokstate}"
  [ -n "${PORT:-}" ] || PORT="$port_cfg"
else
  p_warn "还没有 config.json —— 插件可能没启动过，或还没装进 profile"
  PORT="${PORT:-8291}"
fi

echo
echo "== 服务 :$PORT =="
if curl -s --max-time 3 "http://127.0.0.1:$PORT/health" -o /tmp/mtts-health.$$ 2>/dev/null; then
  if grep -qE '"status": *"ok"' /tmp/mtts-health.$$ 2>/dev/null; then
    p_ok "health 正常"
    python3 - /tmp/mtts-health.$$ <<'PY' 2>/dev/null || true
import json, sys
d = json.load(open(sys.argv[1]))
print(f"       running={d.get('running')} provider={d.get('provider')} v={d.get('version')} up={d.get('uptimeSec')}s")
loc = d.get('local') or {}
print(f"       local={loc.get('state')} pid={loc.get('pid')} rss={loc.get('rssMb')}MB")
PY
  else
    p_fail "端口有响应但不是本服务（看看 /tmp/mtts-health.$$）"
  fi
else
  p_fail "连不上 127.0.0.1:$PORT —— 服务没起，或端口不对"
fi
rm -f /tmp/mtts-health.$$

if command -v lsof >/dev/null; then
  holder="$(lsof -nP -iTCP:"$PORT" -sTCP:LISTEN 2>/dev/null | awk 'NR==2{print $1" pid="$2}')"
  if [ -n "$holder" ]; then p_ok "端口被 $holder 占用（正常情况应该就是它自己）"
  else p_warn "端口 $PORT 上没有监听"; fi
fi

echo
echo "== 模型 =="
MODEL="${MODEL:-$DATA/models/qwen3tts-0.6b-base-8bit}"
if [ -f "$MODEL/config.json" ]; then
  sz() { stat -f%z "$1" 2>/dev/null || stat -c%s "$1" 2>/dev/null || echo 0; }
  t="$(sz "$MODEL/speech_tokenizer/model.safetensors")"
  if [ "$t" -gt 600000000 ]; then p_ok "声码器权重在（$((t/1024/1024)) MB）"
  else p_fail "声码器权重缺失/过小（$((t/1024/1024)) MB）—— 会输出噪声，删掉重下"; fi
else
  p_warn "没找到模型：${MODEL}（只在用本地引擎时才需要）"
fi

echo
echo "== 参考音 =="
if [ -d "$PACK/refs" ]; then
  for f in "$PACK/refs"/*.wav; do
    [ -f "$f" ] && p_ok "$(basename "$f")"
  done
else
  p_warn "包里没有 refs/ 目录"
fi

echo
echo "== 本地引擎运行时 =="
if [ -x "$DATA/venv/bin/python" ]; then
  p_ok "venv: $DATA/venv"
  "$DATA/venv/bin/python" -c 'import mlx_audio' 2>/dev/null \
    && p_ok "mlx_audio 可导入" || p_fail "mlx_audio 导入失败（重跑 install-local-engine.sh）"
else
  p_warn "没有 venv —— 用 OpenAI 兼容或云端时不需要"
fi

echo
printf '== 总结：%d OK  %d WARN  %d FAIL ==\n' "$ok" "$warn" "$fail"
[ "$fail" -eq 0 ] || exit 1
