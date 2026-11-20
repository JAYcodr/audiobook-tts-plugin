# 听书值守 · Audiobook TTS Plugin

给「阅读」(Legado) 以及支持 OpenAI TTS 接口的阅读软件（如 Readest）用的多引擎在线听书服务 + DSH 值守控制台。装进 DSH 后，侧栏会出现「听书值守」（时间线 / 渲染设置 / 工程史 / 交付四个工作面）；手机 Legado 只需粘贴导入地址或扫码即可听整本书：旁白与对话按引号自动分音色，默认返回长度真实的完整 WAV，阅读进度条与自动翻页精准同步。

> 包名：`audiobook-tts-plugin` 0.6.0（兼容旧包身份/数据目录 `mimo-tts`） · MIT License
> 已验证环境：macOS（Apple Silicon）· DSH ≥ 0.2.x · Node ≥ 20
> 仓库**不含任何密钥**，也**不含模型权重**。

---

## 三种常见用法

同一个插件，差别只在于「要不要一条公网 HTTPS 地址」：

- **只在家里听**：手机和电脑连同一个 Wi-Fi，局域网地址就够用（装完默认就是这样）。
- **自己出门也要听**：通勤、出差、在公司或学校网络下接着听同一本书——需要一条带有效证书的公网地址。**这不是「分享给别人」才需要的东西**，自己一个人用也很常见。
- **多个设备或给别人用**：平板、第二台手机、家人同事的 Legado / Readest。这时除了公网地址，还要考虑令牌怎么发、要不要限速。

三条路安装流程完全一样，公网方案四选一见 [HTTPS-GUIDE.md](HTTPS-GUIDE.md)；卡住了看 [SUPPORT.md](SUPPORT.md)。

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
├── HTTPS-GUIDE.md            ← 公网 HTTPS 四选一指南（Quick Tunnel / Tailscale / 命名隧道 / Worker+KV）
├── TROUBLESHOOTING.md        ← 按症状排查手册
├── SUPPORT.md                ← 卡住了：自查顺序、材料收集、脱敏清单与可复制的 issue 模板
├── AI-SETUP-PROMPT.md        ← 发给 DSH AI 的一键安装提示词（v0.6.0）
├── CHANGELOG.md              ← 版本变更记录
├── docs/RELEASE.md           ← 维护者发布与更新 runbook（npm publish / DSH upgrade）
├── LICENSE                   ← MIT 许可证
├── deploy/
│   └── cf-worker-relay/      ← 方案 D：Cloudflare Worker + KV 固定域名中转与同步脚本
├── mimo-tts/                 ← 插件本体（package.json: audiobook-tts-plugin）
│   ├── index.js              DSH 宿主半边（挂载 /mimo-tts 与 /audiobook-tts 路由）
│   ├── client/               控制台模块化前端源码（React + deck.css）
│   ├── client.js             构建产物（单文件，运行时零外部请求）
│   ├── bin/                  独立运行入口（audiobook-tts.mjs / mimo-tts.mjs 兼容别名）与 config.mjs 配置 CLI
│   ├── src/                  服务内核、OpenAI 服务端点、TunnelManager、切分、WAV 拼接与 providers/
│   ├── sidecar/              本地 Qwen3-TTS Python/MLX 边车与锁定依赖
│   ├── skills/               agent 说明书（audiobook-tts-config）
│   ├── test/                 单元与 HTTP 集成测试（node --test）
│   └── README.md             开发者架构、Provider 扩展与 API 文档
├── refs/                     默认旁白参考音（5s / 10s / 14s）与逐字文本
└── setup/
    ├── agent-preflight.sh       Agent 只读环境摸底探针（JSON / --human，绝不输出密钥）
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

从 npm 装已发布版本，不需要先 clone 仓库：

```bash
dsh plugin --profile desktop add audiobook-tts-plugin@^0.6.0
```

升级到新版本：

```bash
dsh plugin --profile desktop update audiobook-tts-plugin
```

然后**完全退出并重启 DSH**。

要改代码、或想用仓库里的最新提交，再 clone 后用 `link:` 方式安装：

```bash
mkdir -p ~/dsh-plugins
git clone https://github.com/JAYcodr/audiobook-tts-plugin.git ~/dsh-plugins/audiobook-tts-plugin
```

在 DSH 对话框中让 `plugin_manager` 安装 `~/dsh-plugins/audiobook-tts-plugin/mimo-tts`（或发送 [AI-SETUP-PROMPT.md](AI-SETUP-PROMPT.md) 全文给 AI 自动完成）。

发布与更新流程见 [docs/RELEASE.md](docs/RELEASE.md)。

### 2) 或者独立运行（不依赖 DSH，适合 NAS / Linux / Docker）

```bash
node mimo-tts/bin/audiobook-tts.mjs --port 8291 --data ./data
```

### 3) 配置引擎并接入 Legado

1. 在左侧栏打开「听书值守」→ 顶部异常引导条可一键打开「**向导与体检**」，或在「渲染设置」按 4 大分组配置：
   - **OpenAI 兼容（如本地 Kokoro / Edge-TTS）**：渲染来源选 `OpenAI`，填 `http://127.0.0.1:8880/v1`、模型和旁白/对话音色；
   - **云端 MiMo**：渲染来源选 `云端`，直接在引擎区填 `sk-...` API Key（Key 去 <https://platform.xiaomimimo.com/> 控制台 → API Keys 创建，步骤见 [INSTALL.md](INSTALL.md) 第 5.1 节），旁白/对话支持 `preset` 预置 / `design` 文字造音 / `clone` 声音克隆及一键音色方案；
   - **本地 Qwen3-TTS（macOS arm64）**：可直接在「向导抽屉」点击「一键安装本地引擎（支持 hf-mirror）」，装完点「一键填入并切换本地」，或手动运行 `./setup/install-local-engine.sh`。默认空闲 `1800s`（30 分钟）卸载并配合 15 分钟预热保活窗口。
2. 内置**多音字读音纠正词表**（默认开启）与自定义规则调试器，支持参考音**交互式波形裁剪（5–15s）与 RMS 归一**，并可直接在设置页开启 **MP3 / Opus 有损压缩输出**（需本机 `ffmpeg`）与 **HTTP `ETag` / `304` 缓存协商**。
3. 打开「交付」页可直接一键启停 **Quick Tunnel**（或按 [HTTPS-GUIDE.md](HTTPS-GUIDE.md) 选用 Tailscale Funnel / 命名隧道 / CF Worker+KV 中转），用手机直接扫**纯离线 SVG 二维码（LAN / WAN / Quick）**或生成设备独立的**只读分享令牌**安全交付亲友设备；兼容 Readest 等客户端可启用 Module 09 `/v1/audio/speech`。各方案细节见 [HTTPS-GUIDE.md](HTTPS-GUIDE.md) 与 [mimo-tts/docs/streaming-legado-compat.md](mimo-tts/docs/streaming-legado-compat.md)。

详细安装、四路公网 HTTPS 方案与多场景排错请阅读 [INSTALL.md](INSTALL.md)、[HTTPS-GUIDE.md](HTTPS-GUIDE.md) 与 [TROUBLESHOOTING.md](TROUBLESHOOTING.md)。

---

## 命令行改配置（agent 友好）

`config.json` 有 40 多条校验规则、密钥字段还带掩码还原，而且改完文件不会自动生效。需要改配置时（尤其是让 AI 代劳），走 CLI，不要手写 JSON：

```bash
# 已装进 PATH（如全局安装）或 npm link 时
audiobook-tts config get upstream.provider --json
audiobook-tts config set upstream.provider hybrid
audiobook-tts config list --group upstream
audiobook-tts config validate
audiobook-tts config export ./tts-config.json          # 默认脱敏
audiobook-tts config import ./tts-config.json --dry-run # 先看差异
audiobook-tts config doctor --json

# 从仓库直接跑（不依赖 PATH）
node mimo-tts/bin/config.mjs config doctor --json
```

- 读 / 改 / 校验 / 热更新 / 导出 / 迁移都在一个入口；`set` 校验失败退出码 `2` 且不落盘。
- 服务在跑时 `set` / `import` 会自动 `PUT /api/config` 热更新；输出「已热更新」才算生效。
- 导出默认把 Key / token / 口令换成掩码，只有 `--include-secrets` 才写明文（stderr 警告）。
- 独立部署时加 `--data <数据目录>`；不传时找 DSH 插件数据目录（旧目录 `mimo-tts` 存在时优先）。
- 退出码：`0` 成功、`1` 一般错误、`2` 校验失败、`3` 已写文件但热更新失败。
- 装进 DSH 后还会注册 `audiobook_tts_config` 工具，模型可直接调用同一个实现；说明书在 `mimo-tts/skills/audiobook-tts-config/SKILL.md`。

---

## 出问题了怎么办

1. **先自查**：[TROUBLESHOOTING.md](TROUBLESHOOTING.md) 按症状分组；[INSTALL.md](INSTALL.md) 每一步都带验证命令，哪一步不过就停在哪一步。
2. **有 AI 在帮你装**：同一步重试一次还不过，就让它按 [SUPPORT.md](SUPPORT.md) 生成一份**脱敏**的 issue 正文（token、Key、账号邮箱一律换成 `***`）。
3. **欢迎提交 issue**：<https://github.com/JAYcodr/audiobook-tts-plugin/issues>。这是个人项目，报上来会看，但不承诺响应时间——别把它当客服工单。

---

## 验收清单

- [ ] 侧栏有「听书值守」，打开显示时间线 / 渲染设置 / 工程史 / 交付四工作面
- [ ] 走带台状态为 `RUN`，`curl -s http://127.0.0.1:8291/health` 返回 `"status":"ok"`
- [ ] 控制台点「试听旁白」或「交付」页 curl 能正常返回真实时长的 WAV
- [ ] Legado 导入成功，引擎列表出现「听书值守 TTS」
- [ ] 播放时进度条正常推进，长段落能自动翻页
