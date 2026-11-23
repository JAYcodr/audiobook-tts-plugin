# 更新日志

所有显著改动均记录在此文件。格式参考 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)。

## [0.6.3] - 2026-11-23

### 修复
- **混合模式云端与本地各用一套缓存键（#20）**：两套引擎（MiMo 克隆 / 本地 Qwen3-TTS）产出的音频不同，却共用一份缓存键，先写入的一方会替另一方作答——同一句第二次播放突然换嗓子，缓存里只有一条记录、事后无从归因。现在键里带来源维度（`hybrid:…|cloud` 与 `hybrid:…|local`），两条路各查自己的键，写回按实际采用的来源记账，`hits` 分开统计。
- **预热保活窗口按最近一次合成起算（#14）**：`warmStartedAt` 原先只在首次合成/预热时写一次，等于「首次预热后固定一段不许卸载」，之后再调配置、再一直使用都不改变行为，表现为有时离开 6 分钟要重载、有时 50 分钟回来还是热的。现在每次合成成功都重新起算，实际保活时长取 `idleUnloadSeconds` 与 `warmupWindowSeconds` 中较长者。
- **默认空口令不再放行 Basic 登录（#16）**：`auth.pass` 出厂为空串，而校验对空串是「相等即通过」，内网任何设备 `curl -u admin:` 就能读写配置、关鉴权、改上游地址，开公网隧道等于知道地址即拿到管理权。现在空口令时 Basic 一律 401，无头环境用 `auth.token`，需要账密就先设 `auth.pass`。

### 文档
- `setup/install-local-engine.sh`、INSTALL §7.3 与 TROUBLESHOOTING §8.4 里的「空闲 300 秒 / 5 分钟自动卸载」全部对齐真实默认（1800 秒）；原 §8.4 让人「把 300 调到 1800」，而 1800 本来就是默认值。
- INSTALL 新增 §6.5「管理员口令（无头部署先做这一步）」，TROUBLESHOOTING §4 补一句空口令 401 的说明。

### 测试
- `test/providers.test.mjs` 补 #20 回归：同一句先云端后本地，修复前第二次命中云端缓存（产出云端音频），修复后本地引擎真被调用。
- `test/local-resident.test.mjs` 补 #14 回归：两次合成后 `warmStartedAt` 必须顺延，55 分钟仍 `ready`、65 分钟卸载。
- `test/auth-tiers.test.mjs` 补 #16 回归：空口令下 `Basic base64(admin:)` → 401，设密码后正确密码 200、错误密码 401，主令牌不受影响。

## [0.6.2] - 2026-11-23

### 修复
- **「」『』不再当对话引号（道具名被念成对话音色）**：`src/split.mjs` 的 `QUOTE_PAIRS` 只保留中文弯引号 `“”`。角括号在小说里标的是道具名、招式名、系统提示与作品名（`「青锋剑」「回气丹」「落霞谷」`），此前被当成对白：一是道具名被切成独立 `dialogue` 段交给对话音色念，二是每多切一段就多付一次固定推理开销。实测同一段 222 字文本，切段方式不变时每多一段约多 2.0 s 计算与约 1.4 s 拼接静音。需要「」当对白的旧台版排版，改 `QUOTE_PAIRS` 一处即可。
- **sidecar 的 watchdog 可能静默死掉，留下 2.3GB 孤儿进程**：`sidecar/server.py` 的 `orphan_exit` / `idle_exit` 分支原先先记日志再 `os._exit(0)`，一旦记日志抛异常（磁盘满、路径被卸载），异常会掀掉整个 watchdog 线程，进程从此不再退出。实测出现过父进程已消失、`PPID=1` 的孤儿引擎仍占着 8398 端口和 2.29 GiB `phys_footprint`，把新引擎挤到随机端口，两个引擎同时驻留 4.58 GiB。现改为记日志失败也照常退出。

### 测试
- `test/split.test.mjs` 的角括号用例由「算对话」改为「道具名不切角色」，并补三条回归：单独道具名、道具名与【】混排、对话里嵌套「」。

## [0.6.1] - 2026-11-22

### 修复
- **本地引擎内存封顶（MLX free cache）**：`sidecar/server.py` 启动时把 `mx.set_cache_limit` 从默认的 `memory_limit`（M4 16G 实测 15.2GiB）压到 64MB，并在每段生成后缓存超过 256MB 就 `mx.clear_cache()`。同一批 8 段实测：稳态 footprint 由 9.5GB（且持续上涨）降到 3.2–3.7GB 横住，生命周期峰值由 12.1GB 降到 6.0–6.5GB。这部分是 Metal/IOKit 内存，系统按 wired 记账——压缩不了也换不出去，是整机被推去 swap 的主因。可用环境变量 `TTS_MLX_CACHE_LIMIT_MB` 放宽。
- **`/health` 改报真实内存口径**：改用 `libproc` 的 `proc_pid_rusage(RUSAGE_INFO_V4)` 读 `ri_phys_footprint` 与 `ri_lifetime_max_phys_footprint`（活动监视器「内存」那一列同口径）。`maxrss_mb` 原先取 `ru_maxrss`，不含 Metal/IOKit，实测同一进程 footprint 3.5GB 时只报 2.3GB、旧引擎 2.3GB 时报 1.0GB；现新增 `footprint_mb`、`footprint_peak_mb`、`rusage_maxrss_mb`、`mlx_cache_mb`、`mlx_peak_mb`，控制台内存数字与活动监视器对齐。读不到时回退 `ru_maxrss`，不影响启动。

### 测试
- **sidecar 内存防回归**：新增 `mimo-tts/test/test_sidecar_memory.py`（9 例，桩掉 mlx / mlx_audio，0.03s，不需要 Apple Silicon 与模型权重）覆盖 `rusage_info_v4` 结构体尺寸（写短了内核越界写会直接把引擎打崩）、缓存上限设置与归还时机、`/health` 字段与回退口径；新增 `test/local-memory.test.mjs` 防止内存数字退回裸读 `maxrss`。CI 的 `python-shell-ci` 增加 numpy 安装与 unittest 步骤。

## [0.6.0] - 2026-11-20

### 新增
- **按引擎拆分限速闸门（#10）**：`local` 本地引擎改用无阻塞 `NoopGate`，`mimo` 与 `openai` 各自持有独立 `RpmGate`；`hybrid` 按段来源精准路由云/本闸门，`/health`、`/api/state`、`/api/live` 新增分引擎 `rpmByProvider` 与时间线分灯显示。
- **本地引擎默认 30 分钟驻留 + 15 分钟预热保活（#4）**：`idleUnloadSeconds` 默认由 `300s` 调整为 `1800s`，配合 `warmupWindowSeconds: 900` 保护期与 `POST /policy` 策略免重载热更；设置 02 与顶栏支持「常驻 / 省内存」一键切换。
- **内置多音字读音纠正词表与导入导出（#5）**：新增默认启用的 14 条纯多字有声书易误读词条预设（`BUILTIN_POLYPHONE_PRESETS`，可单条禁用或整体开关），并支持 JSON / CSV 规则导入导出。
- **只读分享令牌分级权限（#8）**：新增 `auth.readTokens`（按设备创建/吊销）与主令牌轮换 `POST /api/auth/rotate-token`；只读令牌仅放行听书与 OpenAI 路由、访问 `/api/*` 返回 `403`，`/legado.json` 与交付页自动做只读令牌隔离绝不泄露主令牌。
- **Hybrid 真 SSE 流式冷启动降级（#13）**：Hybrid 冷启动开启 `stream=true` 时采用方案 A 优先以 MiMo `preset` 走真 SSE 抢 <1s 首包、同时触发本地预热并在本地热后切回克隆音色；支持请求断连中止 `AbortController` 与流式首段异常 0.4s 静音兜底。
- **MP3 / Opus 有损压缩转码（#2）**：新增 `audio.format`（`wav`/`mp3`/`opus`）与 `audio.bitrate`（`32/48/64/128` kbps），基于本机 `ffmpeg` 管道零临时文件转码；`/listening` 兼容 `wav`/`mp3` 并于非 `wav` 时自动跳过流式，无 `ffmpeg` 自动回退 WAV 并附带回退响应头。
- **HTTP 缓存响应头（#3）**：新增 `cache.httpMaxAgeSeconds`（默认 `3600`s），`/listening` 与 `/v1/audio/speech`（非流式、非回退响应）支持 `Cache-Control: private, max-age=...`、`ETag`、条件请求 `If-None-Match -> 304 Not Modified`、`X-Cache: HIT|MISS` 及 OpenAI CORS `Expose-Headers`。
- **人话错误诊断与混推状态翻译（#6）**：新增 `hints.mjs` 将 `401/402/413/429/503/504` 映射为人话提示，通过纯 ASCII `encodeURIComponent` 写入 `X-Audiobook-Hint`（杜绝 Node 中文头崩溃）；MiMo 遇 `401/402/403/413` 或全段失败不再误返纯静音；翻译 Hybrid 英文状态码并在「交付」页展示最近异常与一键切换本地/启动按钮。
- **Legado 流式真机验收协议（#9）**：新增 `mimo-tts/docs/streaming-legado-compat.md` 说明 `0x7fffffff` 流式头边界、本机 TTFB 对照命令与 Android Legado 真机 4 项验证清单（默认值维持 `false` 待实机复测）。
- **参考音交互式波形裁剪（#11）**：引入 `wavesurfer.js@7.12.12`（打包进 `client.js`，运行时仍零外部请求），支持在 5–15s 黄金区间拖拽选区、原音 vs 成片 A/B 对比试听、可选 RMS 归一及 `POST/DELETE /api/refs/:id/clip` 非破坏性裁剪与恢复。

### 重构
- **子进程生命周期切换至 `execa` v9（#12）**：在 `dependencies` 引入固定版本 `execa@9.6.1`，抽取 `src/proc.mjs` 重构 `setup-manager.mjs` 与 `tunnel-manager.mjs`，使用 `cancelSignal`、POSIX 进程组级联清理与 `.iterable()` 流式行读取，杜绝后台子孙进程残留。

## [0.5.2] - 2026-11-20

### 修复
- **npm 包缺少 `bin` 命令**：npm 11.12.1 在发布时会把带 `./` 前缀的 `bin` 路径判为 invalid 并静默移除（0.5.1 的 `audiobook-tts` / `mimo-tts` 命令因此没随包安装）。改为 `bin/audiobook-tts.mjs` / `bin/mimo-tts.mjs` 后恢复正常。

### 文档
- 新增 `docs/RELEASE.md`：发布与更新 runbook（版本号三处同步、2FA 发布、staged publishing、DSH 更新、回滚与常见问题）。
- README / INSTALL / AI-SETUP-PROMPT 改为优先从 npm 安装与升级；`link:` 保留为本地开发方式。

## [0.5.1] - 2026-11-20

### 新增
- **配置 CLI（`audiobook-tts config` / `node mimo-tts/bin/config.mjs`）**：提供 `get` / `set` / `list` / `validate` / `export` / `import` / `doctor` 七个命令，支持点路径、数组索引、`--type` 强制值类型与 `--json`；`set` 构造点路径补丁后走 `Store.update`，复用 `validatePatch` / `sanitizeConfigPatch` 的全部校验与掩码还原，校验失败退出码 `2` 且不落盘。
- **热更新联动**：`set` / `import` 成功后探测 `/health` 并 `PUT /api/config`（token 只出现在内部请求 URL，不进任何输出）；200 提示「已热更新」、422 打印服务端 problems、服务未运行时降级为「下次启动生效」；退出码 `3` 表示文件已写但热更新失败。
- **导出 / 迁移与离线体检**：`export` 默认 `redact()` 脱敏（token 整段遮罩），`--include-secrets` 才写明文并在 stderr 警告；`import` 先做掩码还原与校验、支持 `--dry-run` 差异预览；`doctor --json` 检查配置可解析 / 校验通过 / 默认结构缺失 / 数据目录可写 / 端口与 `/health` / 本地引擎 venv 与声码器权重 / ffmpeg 与 cloudflared 等公网工具。
- **DSH Host 工具与 skill**：`index.js` 注册 `audiobook_tts_config`（与 CLI 共用 `runConfigAction`；宿主没有 `@deepseek-ai/dsh-tools` 时用本地等价定义兜底，不影响插件激活），并附 `mimo-tts/skills/audiobook-tts-config/SKILL.md` 说明书。
- **测试**：新增 `test/config-cli.test.mjs`，覆盖路径读取、合法 / 非法落盘、掩码还原、导出脱敏、导入往返与 `--dry-run`、热更新 200 / 422 / 未运行 / `--no-reload`、`doctor --json` 严格 JSON 与工具注册。

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
