# audiobook-tts-plugin（插件包与开发者文档）

本目录是 `audiobook-tts-plugin` 的 DSH 插件本体与独立 Node 服务包（历史包名 `@local/mimo-tts`）。
面向终端用户的安装、Legado 导入与故障排查请阅读仓库根目录的 [README.md](../README.md)、[INSTALL.md](../INSTALL.md) 与 [TROUBLESHOOTING.md](../TROUBLESHOOTING.md)。

---

## 三种使用形态

```bash
# 1) DSH 插件形态（npm 安装，推荐）
dsh plugin --profile desktop add audiobook-tts-plugin@^0.5.2
# 升级（装完要完全退出并重启 DSH，禁用/启用插件不够）
dsh plugin --profile desktop update audiobook-tts-plugin
# 本地开发时改用 link（改完代码立即生效）
dsh plugin --profile desktop add link:/绝对路径/audiobook-tts-plugin/mimo-tts

# 2) 独立 HTTP 服务（零运行时依赖，纯 Node >= 20）
node bin/audiobook-tts.mjs --port 8291 --data ./data
# 或使用向后兼容别名：
node bin/mimo-tts.mjs --port 8291 --data ./data

# 3) 作为库嵌入
import { TtsService } from './src/service.mjs'
```

发布到 npm 与让 DSH 更新的完整流程见 [../docs/RELEASE.md](../docs/RELEASE.md)。

### 向后兼容策略（`mimo-tts` → `audiobook-tts-plugin`）

- **Cordis 组件名**：保留 `name = 'mimo-tts'` 与 `cordis.patch.yml` 的 `id: mimo-tts`；
- **宿主路由**：同时注册 `/mimo-tts/api/*` 与 `/audiobook-tts/api/*`；
- **数据目录**：`resolveDataDir()` 优先检查 `AUDIOBOOK_TTS_DATA` / `MIMO_TTS_DATA`；未指定时若旧目录 `~/.dsh/plugin-data/mimo-tts` 已存在且新目录不存在，则继续复用旧目录，避免丢配置/模型；全新安装默认落入 `~/.dsh/plugin-data/audiobook-tts-plugin`；
- **环境变量**：同时支持 `MIMO_*`、`LOCAL_*`、`OPENAI_TTS_*`、`TTS_*`。

---

## 模块架构

```
mimo-tts/
├── index.js                 DSH 宿主入口（生命周期、数据目录探测、双前缀 API 挂载）
├── client/                  模块化控制台前端（JSX + deck.css）
├── client.js                esbuild 单文件构建产物（DSH ModuleLoader 规范）
├── bin/
│   ├── audiobook-tts.mjs    主 CLI 入口
│   └── mimo-tts.mjs         向后兼容别名
├── src/
│   ├── auth.mjs             Basic / Token 鉴权、私网/反代 IP 识别、网卡探测
│   ├── cache.mjs            LRU + TTL + 字节上限音频缓存
│   ├── config.mjs           配置默认项、深合并、脱敏掩码还原与补丁校验
│   ├── control-api.mjs      共享 /api/* 路由（宿主与独立服务共用）
│   ├── http.mjs             统一请求体读取与 JSON 输出
│   ├── legado.mjs           /legado.json 生成与导入元数据
│   ├── lexicon.mjs          发音与断句替换规则引擎（all + 角色两阶段、ReDoS 防护）
│   ├── local.mjs            本地 Qwen3-TTS 进程生命周期 + 运行时声码器完整性校验
│   ├── metrics.mjs          滑动窗口 RPM 闸门与原子落盘持久化指标（metrics.json）
│   ├── mimo.mjs             MiMo 兼容重导出
│   ├── openai-server.mjs    对外 OpenAI 兼容服务端点（/v1/models & /v1/audio/speech）
│   ├── paths.mjs            ~ 家目录展开与仓库根目录解析
│   ├── refs-store.mjs       统一参考音库（内置 refs/ 纳管 + 自定义上传校验与读写）
│   ├── service.mjs          TtsService 服务内核、草稿试听与流水线编排
│   ├── setup-manager.mjs    环境探测、在线 Doctor 与白名单 UI 托管安装任务
│   ├── split.mjs            段落引号切分（成对英文/中文引号、撇号保护、跨句栈）
│   ├── tunnel-manager.mjs   Quick Tunnel 托管管理器与 cloudflared/tailscale/wrangler 探测
│   ├── wav.mjs              RIFF/WAV 解析、拼接、重采样、降混与 RMS 归一化
│   └── providers/
│       ├── base.mjs         TTSProvider 抽象基类、ProviderError、ProviderRegistry
│       ├── mimo.mjs         MiMo 云端（preset / design / clone / 流式）
│       ├── openai.mjs       OpenAI 兼容（POST /v1/audio/speech，wav / pcm）
│       ├── local.mjs        本地 MLX sidecar 适配器
│       └── hybrid.mjs       混合冷启动（SessionTracker + 缓冲门控 + RMS 对齐）
├── sidecar/                 本地 Qwen3-TTS Python/MLX 边车与锁定依赖
├── tools/
│   ├── build-client.mjs     esbuild 前端打包脚本（内嵌 uqr@0.1.3 离线二维码）
│   ├── preview-harness.mjs  本地独立 UI 预览服务器（--fixture / --live）
│   └── check-secrets.mjs    仓库敏感信息与个人痕迹扫描脚本
└── test/                    node --test 单元与集成测试
```

### 扩展新 TTS Provider

继承 `src/providers/base.mjs` 中的 `TTSProvider`，实现 `synthesizeSegment(req, ctx)` 并在 `TtsService` 上调用 `service.registerProvider(provider)` 即可复用缓存、RPM 闸门、文本切分、WAV 拼接与指标采集。如果上游服务已兼容 OpenAI `/v1/audio/speech`（如 Kokoro-FastAPI、Edge-TTS-OpenAI、CosyVoice、Speaches），直接切到内置 `openai` 引擎即可使用，无需新增代码。

---

## HTTP 接口

| 方法 | 路径 | 用途 | 鉴权 |
|---|---|---|---|
| `GET` | `/health` | 存活探针、引擎状态与缓存统计 | 免鉴权 |
| `GET` | `/legado.json` | Legado 一键导入配置 | 内网裸连免令牌，公网/反代须带 `?token=` |
| `GET/POST` | `/listening` | 朗读合成入口（应用 `textRules` 并返回真实时长 WAV） | Basic / `?token=` |
| `GET` | `/v1/models` | 对外 OpenAI 兼容模型列表（默认关闭返回 404） | Bearer / `x-api-key` |
| `POST` | `/v1/audio/speech` | 对外 OpenAI 兼容合成接口（支持 `wav`/`pcm`/`mp3` 回退与角色映射） | Bearer / `x-api-key` |
| `GET/POST` | `/api/preview` | 交互试听（支持未保存 `draft` 与 `mixed` 角色，返回 WAV 与读数头） | Basic / `?token=`（宿主同源免鉴权） |
| `POST` | `/api/text/preview` | 文本发音规则与旁白/对话分段实时调试 | 同上 |
| `GET/POST` | `/api/refs` | 列出参考音库 / 上传 `.wav/.mp3/.m4a`（≤ 10 MB） | 同上 |
| `GET/PUT/DELETE` | `/api/refs/:id` | 查询 / 编辑 / 删除自定义参考音（内置样本只读保护） | 同上 |
| `GET` | `/api/refs/:id/audio` | 拉取参考音原始音频用于控制台内联试听 | 同上 |
| `GET` | `/api/env/detect` | 探测苹果芯片、Python/venv、模型声码器与建议配置补丁 | 同上 |
| `POST` | `/api/doctor` | 在线体检报告（端口 / LAN / 模型 / 参考音 / OpenAI / HTTPS / 网络） | 同上 |
| `GET/POST` | `/api/setup/*` | 白名单本地安装/模型下载任务（`status` / `run` / `cancel`） | 同上 |
| `GET` | `/api/tunnel/status` | 查询 Quick Tunnel 状态（`?detect=1` 附带穿透工具探测） | 同上 |
| `POST` | `/api/tunnel/quick` | 启停/重启受控 Quick Tunnel（`start` / `stop` / `restart`） | 同上 |
| `POST` | `/api/tunnel/sync-kv` | 手动触发方案 D Cloudflare KV 上游地址同步 | 同上 |
| `POST` | `/api/openai-server/gen-key` | 生成独立 `sk-ab-...` Bearer 密钥（不写日志） | 同上 |
| `GET/POST` | `/api/state` / `/api/live` / `/api/stats` | 控制台全量快照与统计 | 同上 |
| `DELETE` | `/api/metrics` | 重置持久化工程史统计（`metrics.json`） | 同上 |
| `GET/PUT` | `/api/config` | 读取脱敏配置 / 局部补丁热更新 | 同上 |
| `POST` | `/api/validate` | 深度合并校验局部配置补丁 | 同上 |
| `POST` | `/api/service` | `start` / `stop` / `restart` | 同上 |
| `GET/POST` | `/api/local` | 本地 sidecar 预热 / 卸载 / 状态 | 同上 |
| `DELETE` | `/api/cache` | 清空音频缓存 | 同上 |

---

## 本地开发、构建与测试

```bash
cd mimo-tts
npm ci                   # 安装开发依赖（esbuild / eslint / uqr，零运行时依赖）
npm run build:client     # 从 client/ 重新打包单文件 client.js
npm run preview:ui       # 启动独立 UI 预览 Harness（http://127.0.0.1:8711）
npm run lint             # ESLint 检查（后端 .mjs + 前端 .js/.jsx）
npm run check:secrets    # 扫描仓库敏感信息与个人痕迹
npm test                 # 运行全部单元与集成测试
npm run check            # 一键顺序执行 lint + secrets + build + test
```
