# 发给 AI 的安装指令（v0.5.0）

> 用法：把下面两条「---」之间的内容**整段复制**，发给你 DSH 里的 AI。
> 它会先自动摸底本机环境，再通过 3 个精准问题确定你的使用场景、TTS 引擎和公网 HTTPS 方案，全程带你装好并完成端到端验收。

---

我在安装与配置「听书值守」（`audiobook-tts-plugin` 0.5.0），它支持 **Legado 在线朗读** 和 **对外 OpenAI 兼容 TTS 接口**（`/v1/audio/speech` & `/v1/models`，兼容 Readest 等阅读软件），底层支持本地 Qwen3-TTS (MLX)、OpenAI 兼容后端（Kokoro/Edge-TTS/CosyVoice）、小米 MiMo 云端及 Hybrid 混合模式。

仓库已经放在我电脑上（目录名 `audiobook-tts-plugin`，里面有 `mimo-tts/`、`setup/`、`deploy/`、`HTTPS-GUIDE.md`、`INSTALL.md`、`TROUBLESHOOTING.md`）。如果你不知道具体路径，请先在 `~/dsh-plugins`、当前工作目录或常见下载目录里找一下。

## 铁律

- **不要**动我的模型配置、不要改其他插件、不要 `pnpm update` 整个 profile。
- **不要**自己编造任何 API Key、Token 或口令；需要我提供或授权时停下来问我。
- **绝不**打印、回显或提交任何真实 API Key / Token / 密码到日志或仓库文件。
- **严禁**引导我使用自签 HTTPS 证书（Android 7+ 默认拒绝用户 CA）、ClouDNS 免费子域（不支持改 NS）或 Freenom（已停服）。
- 每一步都要运行验证命令，验证不通过就停在当前步并把原样输出告诉我。

---

## 第 0 步：自动摸底（先跑 preflight，不要凭印象猜）

先进入仓库目录，运行只读预检脚本拿到本机完整快照：

```bash
cd <仓库绝对路径>/audiobook-tts-plugin
./setup/agent-preflight.sh
```

阅读返回的 JSON，确认：
- `platform`（是否 macOS Apple Silicon arm64）
- `dsh.version` 与 `dsh.profiles`（包是否已同时写进 `dependencies` 和 `bundles`）
- `dataDir`（是否复用旧 `plugin-data/mimo-tts` 或新 `plugin-data/audiobook-tts-plugin`，**以脚本探测结果为准**）
- `service`（8291 端口是否已在运行或被占用）
- `model` / `refs`（本地模型主权重与 `speech_tokenizer` 声码器是否完整）
- `httpsTools`（是否已安装 `cloudflared` / `tailscale` / `wrangler`）
- `lanIps`（已过滤 `198.18.x.x` TUN 网卡）

向我简要汇报摸底结论。

---

## 第 1 步：确认插件已装进 DSH 并启动（若 preflight 显示未装全）

1. 若仓库还在下载目录/临时目录，先建议挪到稳定目录（如 `~/dsh-plugins/audiobook-tts-plugin`，因为是 `link:` 绝对路径安装，以后不可随意移动）。
2. 检查 `dsh --version` ≥ 0.2.x。
3. 若 `dsh.profiles` 中没有同时存在 `dependencies["audiobook-tts-plugin"]` 和 `dsh.profile.bundles` 里的 `"audiobook-tts-plugin"`：
   - 优先调用宿主工具 `plugin_manager` → `action: "install_bundle"`，`target` 填 `<仓库绝对路径>/audiobook-tts-plugin/mimo-tts`；
   - 若兜底走 CLI：先 `dsh plugin --profile <profile名> add link:<仓库绝对路径>/audiobook-tts-plugin/mimo-tts`，再确认对应 `package.json` 的 `dsh.profile.bundles` 数组已加入 `"audiobook-tts-plugin"`。
4. 提示我**完全退出并重启 DSH**（桌面端需退掉托盘图标）。重启后验证：

```bash
curl -s http://127.0.0.1:8291/health
curl -s http://127.0.0.1:<GUI端口>/mimo-tts/api/state | head -c 300
```

确认 `/health` 返回 `"status":"ok"` 且 `"running":true`。

---

## 第 2 步：3 问精准决策（问清楚再配置，绝不擅自做主）

结合第 0 步摸底结果，只问我这 **3 个问题**，等我回复后再按对应分支执行：

1. **使用场景与客户端**：
   - 仅自己手机 **Legado（阅读）** 听书，还是也要给 **Readest / 朋友 / 其他 OpenAI TTS 兼容客户端** 用？（若选后者，需要显式开启对外 `/v1/audio/speech` 端点并生成独立 Bearer 密钥。）
2. **TTS 引擎路线**（可结合我的机器平台推荐）：
   - A. **本地 Qwen3-TTS（macOS arm64，全离线免费，需 ~1.9 GB 模型）**
   - B. **OpenAI 兼容后端**（如本地 Kokoro / Edge-TTS / CosyVoice，告诉我地址与模型）
   - C. **云端 MiMo**（跨平台 5 分钟可用，请告诉我你的 `sk-` 或 `tp-` API Key；`tp-` 需配合 `https://token-plan-cn.xiaomimimo.com/v1`）
   - D. **Hybrid 混合启动**（本地模型 + MiMo 云端克隆冷启动顶班）
3. **公网 HTTPS 访问方案**（4 选 1，或仅局域网）：
   - 0. **仅局域网**（同 Wi-Fi 即可，不暴露公网）
   - A. **Cloudflare Quick Tunnel**（零域名一键启动，注意重启会变域名、限测试/个人分享、≤200 并发）
   - B. **Tailscale Funnel**（零域名自用固定 `https://*.ts.net`，需本机 Tailscale 在线且开启 Funnel ACL）
   - C. **命名隧道 + 免费/自有域名**（最稳固定方案；无域名推荐 DigitalPlat `.dpdns.org`/`.us.kg` 或 `eu.org`；严禁自签证书/ClouDNS/Freenom）
   - D. **Cloudflare Worker + KV 固定中转**（零域名也能获得固定 `*.workers.dev` 地址，仅放行听书与 OpenAI 白名单路由）

---

## 第 3 步：按分支自动化配置

### 3.1 配置 TTS 引擎

- **云端 MiMo**：
  ```bash
  curl -s -X PUT http://127.0.0.1:<GUI端口>/mimo-tts/api/config \
    -H 'Content-Type: application/json' \
    -d '{"upstream":{"provider":"mimo","keys":["<用户提供的KEY>"]}}'
  ```
  （若为 `tp-` 开头 Key，一并设 `"baseUrl":"https://token-plan-cn.xiaomimimo.com/v1"`。）
- **本地 Qwen3-TTS / Hybrid**（仅 macOS arm64）：
  若模型或 venv 未就绪，询问我使用国内镜像 `https://hf-mirror.com` 还是官方源，执行 `./setup/install-local-engine.sh`（实时汇报进度），完成后确认 `<数据目录>/models/qwen3tts-0.6b-base-8bit/speech_tokenizer/model.safetensors` 大于 600 MB，然后把 `pythonPath`、`modelPath` 与 `refs.narrator: {"refId":"builtin:narrator-14s"}` 写入配置（或引导我直接在控制台「向导抽屉」点一键填入）。
- **OpenAI 兼容后端**：写入 `upstream.provider = "openai"` 及用户指定的 `baseUrl` / `model` / 音色。

### 3.2 若开启对外 OpenAI 端点（客户端选了 Readest / 分享朋友）

1. 先调用端点生成高强度随机密钥（**不要把密钥打印到公共日志**）：
   ```bash
   curl -s -X POST http://127.0.0.1:<GUI端口>/mimo-tts/api/openai-server/gen-key
   ```
2. 显式开启 `openaiServer.enabled` 并保存该密钥：
   ```bash
   curl -s -X PUT http://127.0.0.1:<GUI端口>/mimo-tts/api/config \
     -H 'Content-Type: application/json' \
     -d '{"openaiServer":{"enabled":true,"apiKey":"<刚生成的sk-ab-...密钥>"}}'
   ```
   （如用户要求给测试临时共用 URL 令牌，可将 `apiKey` 留空。）

### 3.3 配置所选公网 HTTPS 分支（详见 `HTTPS-GUIDE.md`）

- **分支 A（Quick Tunnel）**：
  若未装 `cloudflared`，先提示执行 `brew install cloudflared`。然后通过接口一键启动：
  ```bash
  curl -s -X POST http://127.0.0.1:<GUI端口>/mimo-tts/api/tunnel/quick \
    -H 'Content-Type: application/json' -d '{"action":"start","protocol":"http2"}'
  ```
- **分支 B（Tailscale Funnel）**：
  确认 `preflight` 中 `tailscale.online == true`，执行 `tailscale funnel --bg <端口>` 获取 `https://<node>.ts.net`，并写入 `server.publicUrl`。
- **分支 C（命名隧道）**：
  协助配置 `cloudflared tunnel` 指向 `http://127.0.0.1:<端口>` 与 DigitalPlat/自有域名，写入 `server.publicUrl`（提示可在 `legado.extraHeaders` 配 Cloudflare Access 令牌）。
- **分支 D（CF Worker + KV 固定中转）**：
  参考 `deploy/cf-worker-relay/README.md`，协助完成 `wrangler kv namespace create TUNNEL_KV`、`wrangler deploy`、写入 `tunnel.kvSync` 配置（`enabled: true`, `kvNamespaceId`, `publicRelayUrl`），启动 Quick Tunnel 并执行一次 `POST /mimo-tts/api/tunnel/sync-kv`，并设置 **5 分钟定时兜底同步**（`crontab` 或 DSH 定时任务执行 `deploy/cf-worker-relay/sync-tunnel-url.mjs --from-api ...`）。

---

## 第 4 步：端到端 curl 验收

验证全部核心端点（**不要在命令记录或长期日志中保留明文 Key**）：

```bash
# 1. 健康探针
curl -s http://127.0.0.1:<端口>/health

# 2. Legado 导入配置（内网验证）
curl -s http://127.0.0.1:<端口>/legado.json | head -c 300

# 3. 若已开启对外 OpenAI 端点：验证 /v1/models 与 /v1/audio/speech
curl -s http://127.0.0.1:<端口>/v1/models -H "Authorization: Bearer <OPENAI_API_KEY>"
curl -s -X POST http://127.0.0.1:<端口>/v1/audio/speech \
  -H "Authorization: Bearer <OPENAI_API_KEY>" \
  -H "Content-Type: application/json" \
  -d '{"model":"audiobook-tts","input":"山道上起了雾。","voice":"alloy","response_format":"wav"}' \
  -o /tmp/ab-openai-test.wav -w '%{http_code} %{size_download}\n'
file /tmp/ab-openai-test.wav   # 期望: RIFF ... WAVE audio
```

若配置了公网 HTTPS（方案 A/B/C/D），再对公网地址执行 `/health`（以及 `/v1/models`，或仅查 `/health` 与 `/legado.json?token=`）确认外网链路畅通，并清理 `/tmp/ab-openai-test.wav`。

---

## 第 5 步：输出交付汇总表

全部验证通过后，给我一张清晰汇总表和**可直接转发给朋友/填入阅读软件的配置卡片**：

| 项 | 结果 |
|---|---|
| DSH Profile 安装（dependencies + bundles 双写） | |
| 服务运行态（port / health / provider） | |
| 本地模型与声码器（如适用，≥600 MB） | |
| 对外 OpenAI 端点（开启状态 / 独立 Key 是否已生成） | |
| HTTPS 方案与当前可访问地址（LAN / 公网） | |
| 端到端 curl 验收（/health、/legado.json、/v1/audio/speech） | |
| 需要注意的限制（如 Quick Tunnel 重启变域名、不公开分享带 token 链接） | |

### OpenAI 兼容客户端配置卡片（如已开启）
- **Base URL**：`<最佳 HTTPS 地址>/v1`
- **API Key**：`<刚生成的密钥（私下单独交付，勿贴入群聊）>`
- **Model**：`audiobook-tts`（或 `tts-1`）
- **Voice**：`alloy`（自动按引号分旁白/对话）
- **Legado 一键导入地址**：`<公网或局域网地址>/legado.json?token=<TOKEN>`

如果中途卡在任何一步，先阅读随包提供的 `HTTPS-GUIDE.md`、`INSTALL.md` 与 `TROUBLESHOOTING.md`，不要凭印象改配置。
