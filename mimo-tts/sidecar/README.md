# 本地 Qwen3-TTS sidecar

`sidecar/server.py` 是可选的本地推理边车，只在 macOS Apple Silicon（MLX）上运行，由 Node 主服务按需拉起、空闲自动卸载，也可被其他组件单独调用。

## 职责与边界

- 加载 `Qwen3-TTS-12Hz-0.6B-Base-8bit`（MLX，Apache-2.0）与参考音频
- `POST /synthesize` `{text, role}` → 返回完整 24 kHz PCM16 WAV
- `GET /health` → 状态 / PID / RSS 内存 / 已处理请求数
- 空闲 `--idle-timeout` 秒自动退出；父进程消失也会自动退出（防孤儿进程）
- 只监听 `127.0.0.1`

## 安装（统一入口）

不要直接手装散包，请从仓库根目录运行唯一规范安装脚本（自动使用 `sidecar/requirements.txt` 锁定版本，含国内镜像回退与权重校验）：

```bash
./setup/install-local-engine.sh
```

仅安装 Python 依赖时：

```bash
python3 -m venv venv
./venv/bin/pip install -r sidecar/requirements.txt
```

## 运行时完整性校验

`speech_tokenizer/model.safetensors`（约 682 MB）和 `model.safetensors` 是硬要求。如果声码器权重缺失或被截断，`mlx-audio` 不会报错，而是静默使用随机权重输出纯噪声。目前 **Node 侧（`LocalEngine`）和 Python 侧（`sidecar/server.py`）均已在启动前强制校验权重文件大小**，缺损会直接拒绝启动并给出修复提示。

## 手动调试

```bash
"$DATA/venv/bin/python" sidecar/server.py \
  --model "$DATA/models/qwen3tts-0.6b-base-8bit" \
  --refs /tmp/refs.json --port 8398 --idle-timeout 60

curl -s localhost:8398/health
curl -s -X POST localhost:8398/synthesize \
  -H 'Content-Type: application/json' \
  -d '{"text":"山道上起了雾。","role":"narrator"}' -o /tmp/x.wav
```

实测性能报告见 [../bench/REPORT.md](../bench/REPORT.md)。
