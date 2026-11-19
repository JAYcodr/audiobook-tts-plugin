# 更新日志

所有显著改动均记录在此文件。格式参考 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)。

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
