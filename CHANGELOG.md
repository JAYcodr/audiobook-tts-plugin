# 更新日志

所有显著改动均记录在此文件。格式参考 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)。

## [0.5.0] - 2026-11-19

### 新增
- **对外 OpenAI 兼容 TTS 服务端点（`/v1/audio/speech` & `/v1/models`）**：新增 `openai-server.mjs`，兼容 Readest 等标准 OpenAI TTS 客户端；默认安全关闭（`openaiServer.enabled = false` 返回 404），开启后支持 Bearer / `x-api-key` 鉴权（优先独立 `openaiServer.apiKey` 并享受同级脱敏掩码与 `sanitizeConfigPatch` 还原保护，留空复用 `auth.token`）、CORS 预检、`wav`/`pcm` 输出、`mp3` 兼容回退或严格 `400`、`speed` 语速档位与 OpenAI 透传映射、以及完整 `voiceMap`（`auto` 旁白/对话切分 / `narrator` / `dialogue` / MiMo 预置音色 / 参考音克隆 / OpenAI 自定义透传）与 Lexicon/缓存/计量流水线复用。
- **低门槛 HTTPS 隧道管理器（`TunnelManager`）**：新增 `tunnel-manager.mjs`，只读短超时探测 `cloudflared` / `tailscale` / `wrangler`；支持控制台一键启停/重启受控白名单 Quick Tunnel（`HTTP/2` / `QUIC`）、单实例互斥锁、进程组 `SIGTERM -> SIGKILL` 彻底回收（杜绝孤儿进程）、换端口自动重启，以及与 `buildImportInfo` / `Doctor` 体检的完整联动。
- **方案 D：Cloudflare Worker + KV 固定域名中转**：新增 `deploy/cf-worker-relay/`（`worker.js`、`sync-tunnel-url.mjs`、`wrangler.toml.example`、`README.md`），为无域名用户提供固定 `*.workers.dev` HTTPS 入口；严格仅放行听书与 OpenAI 路由（屏蔽 `/mimo-tts/api/*`、`/audiobook-tts/api/*`、`/api/*`）、校验 KV 地址匹配 `^https://[a-z0-9-]+\.trycloudflare\.com$` 防 SSRF、流式透传零缓冲，并支持启动隧道自动/手动与 5 分钟兜底同步。
- **控制台设置与交付页升级**：设置页分组四新增 Module 09「对外 OpenAI 兼容端点」（含随机生成 `sk-ab-...` 密钥、MP3 回退策略与可编辑音色映射表）并将鉴权调至 Module 10；交付页新增 `<HttpsAccessCard />`（四路径切换引导卡、Quick Tunnel 控制与警示条）、「OpenAI 兼容阅读软件接入单」、Quick Tunnel 临时二维码与 Preflight 校验项。
- **Agent 安装侧预检与 HTTPS 指南**：新增只读 JSON 探针 `setup/agent-preflight.sh`（严格不输出任何明文密钥）、`HTTPS-GUIDE.md`（四方案对比、DigitalPlat/eu.org 免费域名推荐与自签证书/ClouDNS/Freenom 避坑），并全面升级 `AI-SETUP-PROMPT.md` 为 v0.5.0 三问精准决策与端到端 curl 验收流程。

## [0.4.0] - 2026-11-19

### 新增
- **全 UI 托管本地安装 + 自动探测 + 在线体检（Doctor）**：新增 `SetupManager` 与「初始化引导条 / 向导抽屉」，可在控制台零命令行探测芯片/Python/模型/声码器完整性、托管执行白名单脚本（支持 `hf-mirror` 镜像选择、流式日志、进度条与取消/重试），一键回填本地配置并运行在线体检。
- **统一参考音库 + MiMo 三模式 + 音色预设方案**：新增 `RefsStore` 自动纳管内置 `refs/` 样本，支持浏览器上传 `.wav / .mp3 / .m4a`（≤ 10 MB、防路径穿越）、试听、编辑逐字文本与删除；本地 Qwen3-TTS、Hybrid 与 MiMo 克隆共用同一参考音库；控制台支持 MiMo `preset` / `design` / `clone` 三模式切换与一键应用「音色预设方案（Voice Profiles）」。
- **文本发音与断句替换规则（Text Lexicon）**：新增 `lexicon.mjs` 两阶段规则引擎（切分前 `all` 与切分后 `narrator` / `dialogue`），内置网文清洗预设与 ReDoS 嵌套量词静态防护，控制台内置「原文 → 替换后 + 分段」实时调试器（`/api/text/preview`）。
- **工程史持久化 + 草稿态交互试听 + 离线扫码交付**：`metrics.mjs` 支持防抖原子落盘 `metrics.json`（+ `.bak` 恢复与 `DELETE /api/metrics`）；`/api/preview` 支持**未保存草稿**、`mixed` 混排拼接与浏览器播放器控件；交付页引入构建期打包的 `uqr@0.1.3` 纯离线 SVG 二维码（LAN / WAN 双码与放大弹窗）。
- **设置页 4 逻辑分组 + 本地 Preview Harness**：设置页重构为 4 大分组并按活动引擎动态折叠无关模块；新增 `tools/preview-harness.mjs`（`npm run preview:ui`）支持内置 Fixture 与轻量 React Hooks 垫片本地独立预览。

### 修复与清理
- 移除 Phase 1 遗留的冗余样式文件 `mimo-tts/src/deck.css`（唯一规范样式位于 `client/styles/deck.css`）。
- 修复走带台在非 `hybrid` 模式下「混合」状态灯常亮误导的 bug；支持配置中的 `~` 家目录路径自动展开。

## [0.3.0] - 2026-11-19

### 新增
- 抽象标准 `TTSProvider` 接口与 `ProviderRegistry`，支持插件化接入第三方 TTS 引擎。
- 内置 **OpenAI 兼容 TTS Provider**（`POST /v1/audio/speech`），可直接对接 OpenAI TTS、Kokoro-FastAPI、Edge-TTS-OpenAI、CosyVoice、OpenedAI-Speech 等社区方案（支持 `wav` / `pcm`、可选 Bearer 鉴权、旁白/对话双音色与语速控制）。
- 控制台「渲染设置」与「交付」页新增「试听旁白 / 试听对话」按钮，以及 OpenAI 兼容引擎配置面板。
- 新增 `bin/audiobook-tts.mjs` CLI 入口（保留 `bin/mimo-tts.mjs` 兼容别名）与 `/audiobook-tts/api/*` 路由别名。
- 新增 `.editorconfig`、`LICENSE`、`CHANGELOG.md`、ESLint 静态检查、敏感信息扫描脚本 `tools/check-secrets.mjs` 与 GitHub Actions CI 工作流。

### 修复
- 修复独立模式下 `POST /api/preview` 因引用未定义变量 `source` 导致的 `ReferenceError` 崩溃。
- 修复 `split.mjs` 将所有英文直引号 `"` / `'` 单向替换为开引号的缺陷，改为按段落配对归一化并保护英文缩写/所有格撇号，且同段落跨句对话不断开角色。
- 修复 `index.js` 与 `service.mjs` 的掩码密钥覆盖隐患：保留旧掩码 Key 并追加新 Key 时安全还原已存真值，拒绝无效掩码占位符；补丁合并过滤原型链污染键。
- 修复 `/api/validate` 浅合并 `{ ...store.config, ...patch }` 导致嵌套局部补丁校验失真的问题。
- 清除默认配置及示例文件中的个人用户名与私网示例痕迹，默认用户名改为 `admin`。
- 在 `LocalEngine` 与 `sidecar/server.py` 启动前增加 `speech_tokenizer/model.safetensors`（>= 600 MB）及主权重完整性校验，避免声码器缺失静默输出噪声。

### 重构与清理
- 统一包名为 `audiobook-tts-plugin`（向后兼容 `/mimo-tts` 路由、`plugin-data/mimo-tts` 数据目录、`cordis` id `mimo-tts` 与 `MIMO_*` 环境变量）。
- 将后端 `service.mjs` 拆分为 `auth.mjs`、`http.mjs`、`legado.mjs`、`control-api.mjs` 与 `providers/{base,mimo,openai,local,hybrid}.mjs`，消除宿主与独立服务两套控制台 API 的重复代码。
- 将前端 2,413 行 `client.template.js` 拆分为 `client/` 下的模块化 JSX 组件与工具模块，使用 `esbuild` 打包为单文件 `client.js`。
- 锁定 `sidecar/requirements.txt` 依赖版本（`mlx-audio==0.6.4`、Python 版本适配的 `numpy`、`huggingface-hub==2.4.0`）。
- 合并安装脚本至 `setup/install-local-engine.sh`，删除重复的 `sidecar/install.sh` 及历史废弃文件（`console.css`、`readability.css`、`scope-console-css.py`、`build-client.py`、`client.template.js`）。
- 精简统一根 `README.md` 与 `mimo-tts/README.md`，消除内容重复与口径漂移。

## [0.2.0] - 2026-11-18

### 新增
- 本地 Qwen3-TTS（MLX sidecar）与冷启动云/本地混合启动（`hybrid`）模式。
- D2 多轨剪辑台控制台（时间线 / 渲染设置 / 工程史 / 交付）。
- 参考音频样本库与一键安装/模型下载/环境体检脚本。

## [0.1.0] - 2026-11-01

### 新增
- 初版 MiMo 云端 TTS 代理服务与 Legado 在线朗读集成。
