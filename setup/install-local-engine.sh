#!/usr/bin/env bash
# 本地 Qwen3-TTS 引擎的一键准备：venv + mlx-audio + 模型 + 自检。
#
#   ./setup/install-local-engine.sh
#   HF_ENDPOINT=https://hf-mirror.com ./setup/install-local-engine.sh
#
# 只支持 macOS + Apple Silicon（MLX）。Intel Mac / Windows / Linux 用云端即可。
# 不碰插件的 config.json —— 装完把打印出来的两条路径填进控制台。
set -euo pipefail

DATA="${MIMO_DATA:-$HOME/.dsh/plugin-data/mimo-tts}"
VENV="${VENV:-$DATA/venv}"
MODEL="${MODEL:-$DATA/models/qwen3tts-0.6b-base-8bit}"
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "== 环境 =="
echo "  平台: $(uname -sm)"
if [ "$(uname -s)" != "Darwin" ] || [ "$(uname -m)" != "arm64" ]; then
  echo "! 本地引擎只支持 macOS Apple Silicon（MLX）。" >&2
  echo "! 这台机器请用云端路线，见 INSTALL.md 第 5 节。" >&2
  exit 1
fi

PYTHON="${PYTHON:-python3}"
command -v "$PYTHON" >/dev/null || { echo "找不到 python3" >&2; exit 1; }
echo "  python: $("$PYTHON" -V 2>&1)"

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
echo "== [2/4] 装 mlx-audio =="
"$PY" -m pip install --quiet --upgrade pip || true
if ! "$PY" -m pip install -U "mlx-audio>=0.6.4"; then
  echo "  官方 PyPI 失败，改用清华镜像重试"
  "$PY" -m pip install -U "mlx-audio>=0.6.4" -i https://pypi.tuna.tsinghua.edu.cn/simple
fi
"$PY" -c 'import mlx_audio, huggingface_hub; print("  mlx-audio ok")'

echo
echo "== [3/4] 下载模型 =="
MIMO_DATA="$DATA" VENV="$VENV" MODEL="$MODEL" HF_ENDPOINT="${HF_ENDPOINT:-}" "$HERE/download-model.sh"

echo
echo "== [4/4] 参考音 =="
REFDIR="$(cd "$HERE/.." && pwd)/refs"
if [ -f "$REFDIR/narrator-14s.wav" ]; then
  echo "  示例参考音: $REFDIR/narrator-14s.wav"
  echo "  逐字文本见: $REFDIR/README.md（必须一致）"
else
  echo "  包里没找到 refs/narrator-14s.wav，自己准备一条 5–15 秒的 wav 也行。"
fi

cat <<EOF

== 完成，把这三条填进控制台「渲染设置 → 本地引擎」==

  Python      $VENV/bin/python
  模型目录    $MODEL
  参考音 wav  $REFDIR/narrator-14s.wav
  参考文本    见 $REFDIR/README.md

然后「引擎 → 渲染来源」选「本地」，保存，去「交付」页跑一次 curl。

第一次出声约 12 秒（进程 + 模型 + MLX 编译），之后 3–6 秒/段；
空闲 300 秒自动卸载，内存还给系统。
EOF
