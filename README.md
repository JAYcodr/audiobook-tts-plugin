# 听书值守 · Audiobook TTS Plugin

给「阅读」(Legado) 用的多引擎在线听书服务 + DSH 值守控制台。装进 DSH 后，侧栏会出现「听书值守」（时间线 / 渲染设置 / 工程史 / 交付四个工作面）；手机 Legado 只需粘贴一个导入地址即可听整本书：旁白与对话按引号自动分音色，默认返回长度真实的完整 WAV，阅读进度条与自动翻页精准同步。

> 包名：`audiobook-tts-plugin` 0.4.0（兼容旧包身份/数据目录 `mimo-tts`） · MIT License
> 原作者验证环境：macOS（Apple Silicon）· DSH ≥ 0.2.x · Node ≥ 20
> 仓库**不含任何密钥**，也**不含模型权重**。

---

## 选择你的 TTS 引擎

插件通过标准 `TTSProvider` 接口统一调度四类模式，可在控制台「渲染设置」随时热切换：

| 引擎模式 | 适用场景 | 依赖与成本 | 特点 |
|---|---|---|---|
| **本地 Qwen3-TTS** (`local`) | macOS Apple Silicon 主力离线方案 | 下载 1.9 GB MLX 模型；免费、全离线 | 参考音克隆；空闲自动卸载（释放 ~2.3 GB 内存） |
| **OpenAI 兼容** (`openai`) | 对接社区本地/云端方案（Kokoro-FastAPI / Edge-TTS-OpenAI / CosyVoice / OpenAI） | 只需 `/v1/audio/speech` 接口；本地对接免 Key | 跨平台（macOS / Linux / Windows / Docker），旁白/对话可独立配音色 |
| **云端 MiMo** (`mimo`) | 零本地依赖快速上手（macOS / Linux / Windows） | 小米 MiMo API Key（`sk-` / `tp-`） | 9 个内置音色；支持多 Key 轮转冷却与低延迟流式 |
| **混合启动** (`hybrid`) | 想要首段秒出声 + 后续切本地 | 本地模型 + MiMo Key | 冷启动前几段云端克隆顶班，后台预热本地，缓冲充足后自动切本地 |

---

## 仓库结构

```
audiobook-tts-plugin/
├── README.md                 ← 你正在看的概览
├── INSTALL.md                ← 从零安装与配置指南（DSH 插件 / 独立服务 / Legado / Tunnel）
├── TROUBLESHOOTING.md        ← 按症状排查手册
├── AI-SETUP-PROMPT.md        ← 发给 DSH AI 的一键安装提示词
├── CHANGELOG.md              ← 版本变更记录
├── LICENSE                   ← MIT 许可证
├── mimo-tts/                 ← 插件本体（package.json: audiobook-tts-plugin）
│   ├── index.js              DSH 宿主半边（挂载 /mimo-tts 与 /audiobook-tts 路由）
│   ├── client/               控制台模块化前端源码（React + deck.css）
│   ├── client.js             构建产物（单文件，运行时零外部请求）
│   ├── bin/                  独立运行入口（audiobook-tts.mjs / mimo-tts.mjs 兼容别名）
│   ├── src/                  服务内核、切分、WAV 拼接、缓存、鉴权与 providers/
│   ├── sidecar/              本地 Qwen3-TTS Python/MLX 边车与锁定依赖
│   ├── test/                 单元与 HTTP 集成测试（node --test）
│   └── README.md             开发者架构、Provider 扩展与 API 文档
├── refs/                     默认旁白参考音（5s / 10s / 14s）与逐字文本
└── setup/
    ├── install-local-engine.sh  本地引擎唯一安装入口（venv + 锁定依赖 + 下载 + 校验）
    ├── download-model.sh        单独下载模型（含 hf-mirror 回退与权重完整性校验）
    ├── check-env.sh             只读环境体检脚本
    ├── README-model.md          模型手动下载与排错
    └── config.example.json      标准配置模板
```

> 请保持仓库目录完整，不要单独拆出 `mimo-tts/`（`setup/` 脚本会联动 `refs/` 与 `mimo-tts/sidecar/requirements.txt`）。

---

## 快速开始

### 1) 安装进 DSH（推荐）

```bash
mkdir -p ~/dsh-plugins
git clone https://github.com/JAYcodr/audiobook-tts-plugin.git ~/dsh-plugins/audiobook-tts-plugin
```

在 DSH 对话框中让 `plugin_manager` 安装 `~/dsh-plugins/audiobook-tts-plugin/mimo-tts`（或发送 [AI-SETUP-PROMPT.md](AI-SETUP-PROMPT.md) 全文给 AI 自动完成），然后**完全退出并重启 DSH**。

### 2) 或者独立运行（不依赖 DSH，适合 NAS / Linux / Docker）

```bash
node mimo-tts/bin/audiobook-tts.mjs --port 8291 --data ./data
```

### 3) 配置引擎并接入 Legado

1. 在左侧栏打开「听书值守」→ 顶部异常引导条可一键打开「**向导与体检**」，或在「渲染设置」按 4 大分组配置：
   - **OpenAI 兼容（如本地 Kokoro / Edge-TTS）**：渲染来源选 `OpenAI`，填 `http://127.0.0.1:8880/v1`、模型和旁白/对话音色；
   - **云端 MiMo**：渲染来源选 `云端`，直接在引擎区填 `sk-...` API Key，旁白/对话支持 `preset` 预置 / `design` 文字造音 / `clone` 声音克隆及一键音色方案；
   - **本地 Qwen3-TTS（macOS arm64）**：可直接在「向导抽屉」点击「一键安装本地引擎（支持 hf-mirror）」，装完点「一键填入并切换本地」，或手动运行 `./setup/install-local-engine.sh`。
2. 支持随时在「**文本发音与断句规则**」调试正则清洗，并点「**试听当前草稿**」在不保存时先验证音色与断句效果。
3. 打开「交付」页用手机直接扫**纯离线 SVG 二维码（LAN / WAN）**，或复制一键导入地址 → 手机 Legado → 朗读界面 → 在线朗读 → 网络导入即可。

详细安装、Cloudflare Tunnel 公网接入与多场景排错请阅读 [INSTALL.md](INSTALL.md) 与 [TROUBLESHOOTING.md](TROUBLESHOOTING.md)。

---

## 验收清单

- [ ] 侧栏有「听书值守」，打开显示时间线 / 渲染设置 / 工程史 / 交付四工作面
- [ ] 走带台状态为 `RUN`，`curl -s http://127.0.0.1:8291/health` 返回 `"status":"ok"`
- [ ] 控制台点「试听旁白」或「交付」页 curl 能正常返回真实时长的 WAV
- [ ] Legado 导入成功，引擎列表出现「听书值守 TTS」
- [ ] 播放时进度条正常推进，长段落能自动翻页
