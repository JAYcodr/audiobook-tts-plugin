#!/usr/bin/env bash
# 一次性准备本地引擎：venv + mlx-audio + 模型权重。
#
#   ./sidecar/install.sh
#   MODEL=/path/to/existing/qwen3tts-0.6b-base-8bit ./sidecar/install.sh   # 复用已有模型
#
# 只负责运行时依赖，不碰插件的 config.json；引用路径会打印出来，填到控制台即可。
set -euo pipefail

DATA="${DATA:-$HOME/.dsh/plugin-data/mimo-tts}"
VENV="${VENV:-$DATA/venv}"
MODEL="${MODEL:-$DATA/models/qwen3tts-0.6b-base-8bit}"
PY="${PYTHON:-python3}"

mkdir -p "$DATA/models"

if [ ! -x "$VENV/bin/python" ]; then
  echo "[1/3] 建 venv: $VENV"
  "$PY" -m venv "$VENV"
else
  echo "[1/3] 复用 venv: $VENV"
fi

echo "[2/3] 安装 mlx-audio"
"$VENV/bin/pip" install -U "mlx-audio>=0.6.4"

if [ -f "$MODEL/config.json" ]; then
  echo "[3/3] 复用模型: $MODEL"
else
  echo "[3/3] 下载模型（约 2 GB，慢的话先手动放到 $MODEL）"
  "$VENV/bin/python" - "$MODEL" <<'PY'
import sys
from huggingface_hub import snapshot_download
snapshot_download(
    "mlx-community/Qwen3-TTS-12Hz-0.6B-Base-8bit",
    local_dir=sys.argv[1],
)
PY
fi

TOK="$MODEL/speech_tokenizer/model.safetensors"
if [ ! -f "$TOK" ]; then
  echo "缺少声码器权重：$TOK" >&2
  echo "没有它 mlx-audio 会静默用随机权重，输出噪声。" >&2
  exit 1
fi

cat <<EOF

完成。控制台「参数 → 引擎 → 本地 Qwen3-TTS」里填：

  Python    $VENV/bin/python
  模型目录  $MODEL

参考音（wav + 逐字文本）需要你自己选两条，例如声线库里的旁白/对话样本。
EOF
