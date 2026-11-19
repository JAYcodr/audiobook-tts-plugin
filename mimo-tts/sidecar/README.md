# 本地 Qwen3-TTS sidecar

插件默认走 MiMo 云。这个目录是**可选**的本地引擎，只在 macOS Apple Silicon 上跑
（MLX），由插件按需拉起、空闲自动退出。

## 它做什么

- 加载 `Qwen3-TTS-12Hz-0.6B-Base-8bit`（MLX，Apache-2.0）与两条参考音
- `POST /synthesize` `{text, role}` → 完整 24 kHz PCM16 WAV
- `GET /health` → 状态 / pid / RSS / 已处理请求数
- 空闲 `--idle-timeout` 秒无请求 → 退出；父进程（Node）消失也会退出
- 只绑 `127.0.0.1`，不对外

Node 侧通过 `upstream.local` 配置它，不关心 Python/MLX 的存在。

## 安装（一次性）

```bash
# 建 venv + 装 mlx-audio + 下模型（已有模型可 MODEL=... 复用）
./sidecar/install.sh
```

或者手动：

```bash
DATA="$HOME/.dsh/plugin-data/mimo-tts"
python3 -m venv "$DATA/venv"
"$DATA/venv/bin/pip" install -U "mlx-audio>=0.6.4"

# 模型：已有 MLX 目录可以直接用；没有就下（约 2 GB）
"$DATA/venv/bin/python" - <<'PY'
from huggingface_hub import snapshot_download
snapshot_download(
    "mlx-community/Qwen3-TTS-12Hz-0.6B-Base-8bit",
    local_dir="$HOME/.dsh/plugin-data/mimo-tts/models/qwen3tts-0.6b-base-8bit",
)
PY
```

**必查**：`models/qwen3tts-0.6b-base-8bit/speech_tokenizer/model.safetensors` 存在
（约 682 MB）。缺了它 `mlx-audio` 不报错，会用随机声码器输出噪声 —— 这是上一轮
评测踩过的坑。启动时缺文件会直接退出。

参考音：任意 5–15 秒、带逐字文本的 wav。插件控制台「参数 → 引擎」里填两条
（旁白 / 对话），或直接写进 `config.json`：

```json
{
  "upstream": {
    "provider": "local",
    "local": {
      "pythonPath": "/Users/you/.dsh/plugin-data/mimo-tts/venv/bin/python",
      "modelPath": "/Users/you/.dsh/plugin-data/mimo-tts/models/qwen3tts-0.6b-base-8bit",
      "port": 8398,
      "idleUnloadSeconds": 300,
      "refs": {
        "narrator": { "wav": "/path/narrator.wav", "text": "参考音里逐字说出的内容" },
        "dialogue": { "wav": "/path/dialogue.wav", "text": "…" }
      }
    }
  }
}
```

## 手动跑（排查用）

```bash
"$DATA/venv/bin/python" /path/to/mimo-tts-plugin/sidecar/server.py \
  --model "$DATA/models/qwen3tts-0.6b-base-8bit" \
  --refs /tmp/refs.json --port 8398 --idle-timeout 60
```

`refs.json` 就是上面的 `{role:{wav,text}}`。然后：

```bash
curl -s localhost:8398/health
curl -s -X POST localhost:8398/synthesize \
  -H 'Content-Type: application/json' \
  -d '{"text":"山道上起了雾。","role":"narrator"}' -o /tmp/x.wav
```

## 时间预期（M4 / 16 GB，实测）

| 阶段 | 耗时 |
|---|---|
| 加载模型 | ~3.2–3.9 s |
| 空闲卸载后首个请求（含编译） | ~8–12 s |
| 热请求，10 字 | ~2.7 s |
| 热请求，45 字 | ~6 s |
| 整章累计 RTF | ~0.65 |

内存常驻约 **2.27 GB**；卸载后进程退出，内存归还。整章速度报告见
`../bench/REPORT.md`。

## 限制

- 只支持 macOS Apple Silicon（MLX）；`rk3566`/Linux NAS 用不了
- 模型加载+首请求编译 ~12 s，这是「闲时卸载」的代价
- 本地没有情感/风格指令通道；`style` 字段在本地路径被忽略
- 返回完整 WAV，不走流式；Legado 的进度依赖真实时长
