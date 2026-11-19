# 模型下载：手动与排错

模型只有一份，两个地方会用：

- **本地引擎**（这个包）：`Qwen3-TTS-12Hz-0.6B-Base-8bit`，MLX 8bit 量化，1.9 GB
- **云端**：不需要下任何模型，Key 就够了

标准做法是跑 `./setup/install-local-engine.sh`，这里只讲它失败之后怎么办。

---

## 目标目录长这样

```
~/.dsh/plugin-data/mimo-tts/models/qwen3tts-0.6b-base-8bit/
├── config.json                        8 KB
├── generation_config.json             4 KB
├── model.safetensors                  1.2 GB   ← 主权重
├── model.safetensors.index.json        76 KB
├── merges.txt                         1.6 MB
├── vocab.json                         2.6 MB
├── tokenizer_config.json              8 KB
├── preprocessor_config.json           4 KB
└── speech_tokenizer/
    ├── config.json                    4 KB
    ├── configuration.json             4 KB
    ├── preprocessor_config.json       4 KB
    └── model.safetensors              651 MB   ← 声码器，缺了会出噪声
```

**两个大文件是硬要求**：`model.safetensors` > 1 GB，`speech_tokenizer/model.safetensors`
> 600 MB。只看 `config.json` 在不在就判断「下好了」是错的。

---

## 方式一：hf-mirror（国内首选）

```bash
DATA="$HOME/.dsh/plugin-data/mimo-tts"
MODEL="$DATA/models/qwen3tts-0.6b-base-8bit"

HF_ENDPOINT=https://hf-mirror.com "$DATA/venv/bin/python" - "$MODEL" <<'PY'
import sys
from huggingface_hub import snapshot_download
snapshot_download(
    repo_id="mlx-community/Qwen3-TTS-12Hz-0.6B-Base-8bit",
    local_dir=sys.argv[1],
    resume_download=True,
)
PY
```

断了就重跑同一条命令，会接着下，不会从头来。

---

## 方式二：从另一台机器拷

这份模型是纯文件，没有绝对路径依赖。在已经装好的机器上：

```bash
# 源机器
cd ~/.dsh/plugin-data/mimo-tts/models
tar czf qwen3tts-0.6b-base-8bit.tgz qwen3tts-0.6b-base-8bit

# 目标机器
mkdir -p ~/.dsh/plugin-data/mimo-tts/models
tar xzf qwen3tts-0.6b-base-8bit.tgz -C ~/.dsh/plugin-data/mimo-tts/models
```

拷完用 `./setup/check-env.sh` 校验大小。

---

## 方式三：单独 curl 大文件

只有 `huggingface-cli` 完全不可用时才用。两个大文件：

```bash
BASE=https://hf-mirror.com/mlx-community/Qwen3-TTS-12Hz-0.6B-Base-8bit/resolve/main
MODEL="$HOME/.dsh/plugin-data/mimo-tts/models/qwen3tts-0.6b-base-8bit"
mkdir -p "$MODEL/speech_tokenizer"

curl -L --retry 5 -C - -o "$MODEL/model.safetensors" "$BASE/model.safetensors"
curl -L --retry 5 -C - -o "$MODEL/speech_tokenizer/model.safetensors" \
  "$BASE/speech_tokenizer/model.safetensors"
```

小文件（config / tokenizer / vocab / merges）一起补：

```bash
for f in config.json generation_config.json model.safetensors.index.json \
         merges.txt vocab.json tokenizer_config.json preprocessor_config.json; do
  curl -L --retry 5 -o "$MODEL/$f" "$BASE/$f"
done
for f in config.json configuration.json preprocessor_config.json; do
  curl -L --retry 5 -o "$MODEL/speech_tokenizer/$f" "$BASE/speech_tokenizer/$f"
done
```

---

## 常见失败

| 现象 | 原因 | 处理 |
|---|---|---|
| `ConnectionError` / 卡在 0% | huggingface.co 被墙 | 用上面的 hf-mirror，或 `export HF_ENDPOINT=https://hf-mirror.com` |
| 下到一半 `IncompleteRead` | 断流 | 同一条命令重跑，会续传 |
| `snapshot_download` 报 `LocalEntryNotFoundError` | 缓存目录权限 / 路径含特殊字符 | 换到 `~/.dsh/...` 这种纯 ASCII 路径 |
| 模型「下完了」但声音是噪声 | 声码器权重缺失 | 查 `speech_tokenizer/model.safetensors` 是否有 651 MB |
| `mlx-audio` 装不上 | Python 太老 / 架构不对 | `python3 -V` 要 ≥ 3.10；`uname -m` 要 `arm64` |
| pip 超时 | 国内 PyPI 慢 | `pip install -i https://pypi.tuna.tsinghua.edu.cn/simple mlx-audio` |

装完记得回 [INSTALL.md](../INSTALL.md) 第 7.2 节，把路径填进控制台——
**脚本不会替你改插件的配置文件**，这是有意的：配置文件里有你的 Key，不该被安装脚本动。
