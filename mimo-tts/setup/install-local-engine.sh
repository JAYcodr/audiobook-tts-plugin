#!/usr/bin/env bash
# 本地 Qwen3-TTS 引擎的一键准备（唯一规范入口）：venv + 锁定版本依赖 + 模型 + 自检。
#
#   ./setup/install-local-engine.sh
#   HF_ENDPOINT=https://hf-mirror.com ./setup/install-local-engine.sh
#
# 只支持 macOS + Apple Silicon（MLX）。Intel Mac / Windows / Linux 请用 OpenAI 兼容或云端。
# 不碰插件的 config.json —— 装完把打印出来的路径填进控制台。
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$HERE/.." && pwd)"
# setup/ 与 sidecar/ 同在包根下；两种安装形态都探测一遍，缺失时开头就报错，
# 别一路跑到 pip install 才炸「找不到依赖文件」（Issue #32 附）。
REQ_FILE=""
for candidate in "$REPO_ROOT/sidecar/requirements.txt" "$REPO_ROOT/mimo-tts/sidecar/requirements.txt"; do
  if [ -f "$candidate" ]; then REQ_FILE="$candidate"; break; fi
done

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
VENV="${VENV:-$DATA/venv}"
MODEL="${MODEL:-$DATA/models/qwen3tts-0.6b-base-8bit}"

echo "== 环境 =="
echo "  平台: $(uname -sm)"
if [ "$(uname -s)" != "Darwin" ] || [ "$(uname -m)" != "arm64" ]; then
  echo "! 本地引擎只支持 macOS Apple Silicon（MLX）。" >&2
  echo "! 这台机器请用 OpenAI 兼容或云端路线，见 INSTALL.md 第 5 节。" >&2
  exit 1
fi

PYTHON="${PYTHON:-python3}"
command -v "$PYTHON" >/dev/null || { echo "找不到 python3" >&2; exit 1; }
echo "  python: $("$PYTHON" -V 2>&1)"
echo "  数据目录: $DATA"
echo "  认定的包根: $REPO_ROOT"
if [ -z "$REQ_FILE" ]; then
  echo "找不到依赖锁定文件：已探测 $REPO_ROOT/sidecar/requirements.txt 与 $REPO_ROOT/mimo-tts/sidecar/requirements.txt" >&2
  echo "这通常说明发布包漏发了 sidecar/，请核对包内容而不是继续往下装。" >&2
  exit 1
fi

echo
echo "== [1/4] 建 venv =="
if [ -x "$VENV/bin/python" ]; then
  echo "  复用 $VENV"
else
  mkdir -p "$DATA"
  "$PYTHON" -m venv "$VENV"
  echo "  新建 $VENV"
fi
PY="$VENV/bin/python"

echo
echo "== [2/4] 安装锁定版本 Python 依赖 =="
"$PY" -m pip install --quiet --upgrade pip || true
if ! "$PY" -m pip install -r "$REQ_FILE"; then
  echo "  官方 PyPI 失败，改用清华镜像重试"
  "$PY" -m pip install -r "$REQ_FILE" -i https://pypi.tuna.tsinghua.edu.cn/simple
fi
"$PY" -c 'import mlx_audio, huggingface_hub, numpy; print("  mlx-audio ok")'

echo
echo "== [3/4] 下载模型 =="
AUDIOBOOK_DATA="$DATA" MIMO_DATA="$DATA" VENV="$VENV" MODEL="$MODEL" \
  HF_ENDPOINT="${HF_ENDPOINT:-}" "$HERE/download-model.sh"

echo
echo "== [4/4] 参考音 =="
REFDIR="$REPO_ROOT/refs"
if [ -f "$REFDIR/narrator-14s.wav" ]; then
  echo "  示例参考音: $REFDIR/narrator-14s.wav"
  echo "  逐字文本见: $REPO_ROOT/docs/refs-transcripts.md（必须一致）"
else
  echo "  包里没找到 refs/narrator-14s.wav，自己准备一条 5–15 秒的 wav 也行。"
fi

cat <<EOF

== 完成，把这三条填进控制台「渲染设置 → 本地引擎」==

  Python      $VENV/bin/python
  模型目录    $MODEL
  参考音 wav  $REFDIR/narrator-14s.wav
  参考文本    见 $REPO_ROOT/docs/refs-transcripts.md

然后「引擎 → 渲染来源」选「本地」，保存，在「交付」页点「试听旁白」或跑一次 curl。

第一次出声约 12 秒（进程 + 模型 + MLX 编译），之后 3–6 秒/段；
空闲 1800 秒（30 分钟）后自动卸载，内存还给系统。
EOF
