#!/usr/bin/env bash
# 只下模型：Qwen3-TTS-12Hz-0.6B-Base-8bit（MLX 8bit，约 1.9 GB）
#
#   ./setup/download-model.sh
#   HF_ENDPOINT=https://hf-mirror.com ./setup/download-model.sh   # 强制镜像
#   MODEL=/some/where ./setup/download-model.sh                    # 下到别处
#
# 会校验：model.safetensors（1.2 GB）和 speech_tokenizer/model.safetensors（682 MB）。
# 少了声码器权重，mlx-audio 不报错、直接输出噪声 —— 这是踩过的坑，所以必须查。
set -euo pipefail

DATA="${MIMO_DATA:-$HOME/.dsh/plugin-data/mimo-tts}"
MODEL="${MODEL:-$DATA/models/qwen3tts-0.6b-base-8bit}"
VENV="${VENV:-$DATA/venv}"
REPO="mlx-community/Qwen3-TTS-12Hz-0.6B-Base-8bit"

if [ -x "$VENV/bin/python" ]; then
  PY="$VENV/bin/python"
else
  PY="$(command -v python3 || true)"
  [ -n "$PY" ] || { echo "找不到 python3" >&2; exit 1; }
fi

if ! "$PY" -c 'import huggingface_hub' >/dev/null 2>&1; then
  echo "[0/3] 装 huggingface_hub"
  "$PY" -m pip install --quiet --upgrade huggingface_hub
fi

ok() {
  [ -f "$MODEL/config.json" ] &&
  [ -f "$MODEL/model.safetensors" ] &&
  [ -f "$MODEL/speech_tokenizer/model.safetensors" ]
}

if ok; then
  echo "[$MODEL] 已经齐了，跳过下载"
else
  mkdir -p "$MODEL"
  echo "[1/3] 目标目录 $MODEL"
  echo "[2/3] 下载 $REPO（约 1.9 GB，断了重跑会续传）"
  done_ok=0
  for endpoint in "${HF_ENDPOINT:-}" "https://hf-mirror.com" "https://huggingface.co"; do
    [ -n "$endpoint" ] || endpoint="https://huggingface.co"
    echo "  → 使用 $endpoint"
    if HF_ENDPOINT="$endpoint" "$PY" - "$MODEL" "$REPO" <<'PY'
import sys
from huggingface_hub import snapshot_download
snapshot_download(repo_id=sys.argv[2], local_dir=sys.argv[1])
PY
    then
      ok && { done_ok=1; break; }
    fi
    echo "  ! 这个源没下全，换下一个"
  done
  [ "$done_ok" = 1 ] || { echo "下载失败。手动办法见 setup/README-model.md" >&2; exit 1; }
fi

echo "[3/3] 校验权重"
sz() { stat -f%z "$1" 2>/dev/null || stat -c%s "$1" 2>/dev/null || echo 0; }
M="$(sz "$MODEL/model.safetensors")"
T="$(sz "$MODEL/speech_tokenizer/model.safetensors")"
printf '  model.safetensors            %s MB\n' "$((M/1024/1024))"
printf '  speech_tokenizer/…           %s MB（必须 ≥ 600）\n' "$((T/1024/1024))"
[ "$M" -gt 900000000 ] || { echo "主权重不完整，删掉重下：rm -rf $MODEL" >&2; exit 1; }
[ "$T" -gt 600000000 ] || { echo "声码器权重缺失/不完整，删掉重下：rm -rf $MODEL" >&2; exit 1; }

cat <<EOF

模型就绪：$MODEL

控制台「渲染设置 → 本地引擎」里填：
  模型目录  $MODEL
EOF
