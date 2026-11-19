# 发给 AI 的安装指令（v0.5.0）

> **这份文件给谁看**：任何刚把 `audiobook-tts-plugin` 拿到本机、想借 AI 之手装起来的人。不需要作者在场，也不假定你和作者认识——**自己一个人用、装给第二台设备、给家人同事用，走的是同一套流程**。
>
> **怎么用**：把下面两条 `---` 之间的内容**整段复制**，发给你 DSH 里的 AI，然后按它的提问回答。跑命令、验证、出汇总都由它做；你只需要确认安装、提供 API Key、决定要不要公网地址。
>
> **为什么这样写**：提示词以「任意一位第一次安装的人」为对象。AI 不该猜你是谁，也不该把你当作者的朋友。文中的「安装者」一律指这台电脑的主人。

---

你正在帮一位**第一次安装**「听书值守」（`audiobook-tts-plugin` 0.5.0）的人，把它装到能听书为止。对方可能是从没碰过终端的新手，也可能只是想省事的老手：**先按流程走，遇到分歧再问**，不要凭印象猜配置，也不要为了「跑通」去改要害参数。

这个插件提供两件事：

1. **给手机 Legado（阅读）的在线朗读**：`/legado.json` 一键导入，旁白/对话按引号自动分音色，返回长度真实的完整 WAV，进度条与自动翻页正常；
2. **可选对外开放标准 OpenAI TTS 接口**：`GET /v1/models` 与 `POST /v1/audio/speech`，给 Readest 等阅读软件或第二台设备用（默认关闭，返回 404）。

底层引擎四选一或混用：本地 Qwen3-TTS (MLX) / OpenAI 兼容后端（Kokoro、Edge-TTS、CosyVoice）/ 小米 MiMo 云端 / Hybrid 混合。

仓库已经在这台电脑上（目录名 `audiobook-tts-plugin`，含 `mimo-tts/`、`setup/`、`deploy/`、`HTTPS-GUIDE.md`、`INSTALL.md`、`TROUBLESHOOTING.md`、`SUPPORT.md`）。找不到路径就依次看 `~/dsh-plugins`、当前工作目录、`~/Downloads`、下载目录。

## 铁律

- 不要改与本插件无关的配置、不要碰其他插件、不要 `pnpm update` 整个 profile。
- 不要编造任何 API Key / Token / 口令。缺什么就停下来说明「哪一步用、干什么用」，再问安装者。
- 绝不把真实 Key / Token / 密码打印到屏幕、写进文件或日志，也不要把它们放进准备提交 issue 的文本。
- 不要引导安装者使用自签 HTTPS 证书（Android 7+ 默认拒绝用户 CA）、ClouDNS 免费子域（不支持改 NS）、Freenom（已停服）。
- 每一步都跑验证命令；验证不过就停在当前步，把**原样输出**贴给安装者，不要「顺手再改点别的」。
- 安装者可能是第一次碰终端：命令**整段给出来让他复制**，并说明「跑完应该看到什么」；别让他自己拼路径和参数。

## 第 0 步：摸底（先跑 preflight，别凭印象）

```bash
cd <仓库绝对路径>/audiobook-tts-plugin
./setup/agent-preflight.sh
```

读返回的 JSON：

- `platform`：是否 macOS Apple Silicon arm64（决定能不能走本地引擎）
- `dsh.version` / `dsh.profiles`：包是否同时进了 `dependencies` 与 `bundles`
- `dataDir`：复用旧的 `plugin-data/mimo-tts` 还是新的 `plugin-data/audiobook-tts-plugin`，以探测结果为准
- `service`：8291 是否已在运行、或被别的进程占着
- `model` / `refs`：本地模型主权重与 `speech_tokenizer` 声码器是否完整（声码器缺失**不会报错**，只会输出噪声）
- `httpsTools`：`cloudflared` / `tailscale` / `wrangler` 装了没有
- `lanIps`：已过滤 `198.18.x.x` 一类 TUN 网段

用三五行中文汇报结论，别把整段 JSON 倒出来。

## 第 1 步：装进 DSH（若 preflight 显示没装全）

1. 仓库如果还在下载目录或临时目录，建议先挪到固定位置（如 `~/dsh-plugins/audiobook-tts-plugin`）。插件按 `link:` 绝对路径安装，装完再挪就失效。
2. 没有 DSH 就先装：桌面端 <https://www.deepseek.com/zh/harness>；或按[官方 releases](https://github.com/deepseek-ai/deepseek-harness/releases) 用 `npx` 起 Web 版。装完回到本步。
3. `dsh --version` 要求 ≥ 0.2.x。
4. 若 profile 里没有**同时**出现 `dependencies["audiobook-tts-plugin"]` 和 `dsh.profile.bundles` 里的 `"audiobook-tts-plugin"`：
   - 优先 `plugin_manager` → `install_bundle`，`target` 填 `<仓库绝对路径>/audiobook-tts-plugin/mimo-tts`；
   - 兜底 CLI：`dsh plugin --profile <profile名> add link:<仓库绝对路径>/audiobook-tts-plugin/mimo-tts`，再手工把 `"audiobook-tts-plugin"` 加进该 profile `package.json` 的 `dsh.profile.bundles`。
5. 让安装者**完全退出并重启 DSH**（macOS 的托盘图标也要退；只刷新页面不会加载宿主半边）。
6. 验证：

```bash
curl -s http://127.0.0.1:8291/health
curl -s http://127.0.0.1:<GUI端口>/mimo-tts/api/state | head -c 300
```

`/health` 要有 `"status":"ok"`、`"running":true`。

## 第 2 步：只问三件事（问完再动手）

1. **谁会用、怎么用**——这决定要不要公网地址：
   - 只在家里同一个 Wi-Fi 下用手机听 → 局域网足够；
   - **自己**出门、通勤、在公司或学校网络下也要接着听同一本书，或者平板、第二台手机、电脑要用 → 需要一条带有效证书的公网 HTTPS 地址。**这是最常见的需求，不是「分享给别人」才需要**；
   - 还想让家人 / 同事 / 朋友用 → 同样走公网，另外要考虑令牌怎么发、要不要限速。
2. **引擎路线**（结合摸底结果给建议，别一上来就推本地）：
   - A 本地 Qwen3-TTS：仅 macOS arm64，全离线免费，模型约 1.9 GB；
   - B OpenAI 兼容后端：已有 Kokoro / Edge-TTS / CosyVoice 等服务，只要地址 + 模型名；
   - C 云端 MiMo：跨平台，几分钟可用，需要 MiMo API Key；
   - D Hybrid：本地模型 + MiMo 冷启动顶班（macOS arm64 且两种都有）。
3. **公网方案**（4 选 1，也可以先不要）：
   - 0 仅局域网；
   - A Cloudflare Quick Tunnel：零账号零域名，控制台一键起，重启换域名；
   - B Tailscale Funnel：零域名固定 `*.ts.net`，要 Tailscale 账号并开 Funnel；
   - C 命名隧道 + 域名：长期最稳，要 Cloudflare 账号 + 一个域名；
   - D Cloudflare Worker + KV：零域名固定 `*.workers.dev`，要 Cloudflare 账号，只放行听书与 OpenAI 路由。

## 第 2.5 步：需要账号时，把注册入口说清楚

需要外部账号时，**先给入口和步骤，等安装者拿到凭据再继续**；不要跳过去硬改配置，也不要索要账号密码。

**小米 MiMo**（引擎 C / D 需要）

- 注册与登录：<https://platform.xiaomimimo.com/>（Xiaomi MiMo 开放平台）
- 建 Key：登录后进 **控制台 → API Keys → 新建**，**只完整显示一次**，让安装者立刻存进密码管理器
- 两种 Key 别混：`sk-` 是按量付费（插件默认 Base URL `https://api.xiaomimimo.com/v1`）；`tp-` 是 Token Plan，Base URL 以 Token Plan 页面给的为准（常见 `https://token-plan-cn.xiaomimimo.com/v1`）。混用会 401
- 账号通常需要实名认证，可能有最低充值门槛，新用户一般有免费体验额度——**以平台页面为准**，不要替平台许愿免费
- 官方接入文档（含 Key 头、Base URL、常见问题）：<https://mimo.mi.com/docs/zh-CN/quick-start/faq/api-integration>
- 鉴权头 `api-key: <KEY>` 或 `Authorization: Bearer <KEY>` 都支持；模型名以控制台「模型列表」为准，插件默认 `mimo-v2.5-tts`

**Cloudflare**（方案 A 不需要账号；C、D 需要）

- 注册：<https://dash.cloudflare.com/sign-up>，**免费计划就够**（Workers 每天 10 万请求；KV 每天 10 万读 / 1000 写）
- 授权一律走浏览器弹窗：`wrangler login` 或 `cloudflared tunnel login`；**不要把账号密码交给 AI**
- Account ID 在控制台首页右侧栏，或 `wrangler whoami`

**Tailscale**（方案 B 需要）

- 注册：<https://login.tailscale.com/start>，手机和电脑登进同一个 tailnet
- 还要开 **MagicDNS** 与 **HTTPS 证书**，并在 Access Controls 里加 Funnel 属性（页面有「Add Funnel to policy」按钮）。Funnel 对所有套餐开放，但客户端要 ≥ v1.38.3；说明见 <https://tailscale.com/kb/1223/funnel>

**域名**（方案 C 需要，可选）

- DigitalPlat FreeDomain：<https://dash.domain.digitalplat.org/>，可注册 `.dpdns.org` / `.us.kg` / `.qzz.io` / `.xx.kg` / `.qd.je`，注册后用自定义 NS 交给 Cloudflare 托管
- eu.org：<https://nic.eu.org/>，免费但人工审核，可能要等几天到几周
- 已有任何域名，直接托管到 Cloudflare 也行

## 第 3 步：按分支配置

### 3.1 引擎

- **云端 MiMo**：

  ```bash
  curl -s -X PUT http://127.0.0.1:<GUI端口>/mimo-tts/api/config \
    -H 'Content-Type: application/json' \
    -d '{"upstream":{"provider":"mimo","keys":["<KEY>"]}}'
  ```

  `tp-` 开头的 Key 再加 `"baseUrl":"https://token-plan-cn.xiaomimimo.com/v1"`。

- **本地 Qwen3-TTS / Hybrid**（仅 macOS arm64）：模型或 venv 未就绪时，先问用国内镜像 `https://hf-mirror.com` 还是官方源，再执行 `./setup/install-local-engine.sh`（实时汇报进度）；完成后确认 `<数据目录>/models/qwen3tts-0.6b-base-8bit/speech_tokenizer/model.safetensors` 大于 600 MB，再把 `pythonPath`、`modelPath` 与 `refs.narrator: {"refId":"builtin:narrator-14s"}` 写进配置。也可以引导安装者直接在控制台「向导抽屉」点「一键填入并切换本地」。
- **OpenAI 兼容后端**：`upstream.provider = "openai"`，加上安装者给的 `baseUrl` / `model` / 音色。

### 3.2 对外 OpenAI 端点（安装者自己要用第二台设备，或要给别人用时）

1. 先生成密钥（不要打印到公共日志）：

   ```bash
   curl -s -X POST http://127.0.0.1:<GUI端口>/mimo-tts/api/openai-server/gen-key
   ```

2. 开启并保存：

   ```bash
   curl -s -X PUT http://127.0.0.1:<GUI端口>/mimo-tts/api/config \
     -H 'Content-Type: application/json' \
     -d '{"openaiServer":{"enabled":true,"apiKey":"<刚生成的密钥>"}}'
   ```

   只有临时测试、且安装者明确同意共用一个令牌时，才把 `apiKey` 留空复用 `auth.token`。

### 3.3 公网 HTTPS（详见 `HTTPS-GUIDE.md`）

- **A Quick Tunnel**：未装 `cloudflared` 先引导安装（macOS `brew install cloudflared`；其他平台见 <https://github.com/cloudflare/cloudflared/releases>），再一键启动：

  ```bash
  curl -s -X POST http://127.0.0.1:<GUI端口>/mimo-tts/api/tunnel/quick \
    -H 'Content-Type: application/json' -d '{"action":"start","protocol":"http2"}'
  ```

- **B Tailscale Funnel**：确认 preflight 里 `tailscale.online == true`，执行 `tailscale funnel --bg <端口>` 拿到 `https://<node>.ts.net`，写进 `server.publicUrl`。
- **C 命名隧道**：`cloudflared tunnel login` → `create` → `route dns`，ingress 指向 `http://127.0.0.1:<端口>`，域名写进 `server.publicUrl`（必要时教安装者在 `legado.extraHeaders` 配 Cloudflare Access 服务令牌）。
- **D Worker + KV**：按 `deploy/cf-worker-relay/README.md` 五步走——`wrangler login`、`wrangler kv namespace create TUNNEL_KV`、`wrangler deploy`，把 `kvNamespaceId` 与 `publicRelayUrl` 写进 `tunnel.kvSync`；启动 Quick Tunnel 后同步一次 `POST /mimo-tts/api/tunnel/sync-kv`，再配 **5 分钟兜底同步**（crontab 或 DSH 定时任务跑 `deploy/cf-worker-relay/sync-tunnel-url.mjs --from-api http://127.0.0.1:<端口>/api/tunnel/status`，直连端口要带 `AUDIOBOOK_API_TOKEN`；走 GUI 端口则用 `/mimo-tts/api/tunnel/status`，不需要 Token）。

## 第 4 步：端到端验收

```bash
# 1. 健康探针
curl -s http://127.0.0.1:<端口>/health

# 2. Legado 导入配置（内网验证）
curl -s http://127.0.0.1:<端口>/legado.json | head -c 300

# 3. 若已开启对外 OpenAI 端点
curl -s http://127.0.0.1:<端口>/v1/models -H "Authorization: Bearer <OPENAI_API_KEY>"
curl -s -X POST http://127.0.0.1:<端口>/v1/audio/speech \
  -H "Authorization: Bearer <OPENAI_API_KEY>" \
  -H "Content-Type: application/json" \
  -d '{"model":"audiobook-tts","input":"山道上起了雾。","voice":"alloy","response_format":"wav"}' \
  -o /tmp/ab-openai-test.wav -w '%{http_code} %{size_download}\n'
file /tmp/ab-openai-test.wav    # 期望: RIFF ... WAVE audio
```

配了公网（A/B/C/D）再对公网地址各打一次 `/health`、`/legado.json?token=`、`/v1/models`，确认外网链路通；最后删掉 `/tmp/ab-openai-test.wav`。整段命令里不要留明文 Key。

## 第 5 步：交付汇总

全部通过后，给安装者一张表，外加一份可直接填进客户端（或转给第二台设备）的配置卡片：

| 项 | 结果 |
|---|---|
| DSH profile 安装（dependencies + bundles 双写） | |
| 服务运行态（端口 / health / provider） | |
| 本地模型与声码器（如适用，>600 MB） | |
| 对外 OpenAI 端点（开 / 关，独立 Key 是否已生成） | |
| HTTPS 方案与当前可访问地址（LAN / 公网） | |
| 端到端验收（/health、/legado.json、/v1/audio/speech） | |
| 已知限制（Quick Tunnel 重启变域名、带 token 的地址别公开） | |
| 出问题查哪里（TROUBLESHOOTING.md → SUPPORT.md → Issues） | |

**OpenAI 兼容客户端配置卡片**（若已开启）

- Base URL：`<最佳 HTTPS 地址>/v1`
- API Key：`<刚生成的密钥，私下单独交付>`
- Model：`audiobook-tts`（或 `tts-1`）
- Voice：`alloy`（自动按引号分旁白 / 对话）
- Legado 一键导入：`<公网或局域网地址>/legado.json?token=<TOKEN>`

## 第 6 步：卡住了怎么收尾（很重要，别硬猜）

同一步**重试一次**仍不过就停下：

1. 不要为了「过验证」去改 `synth.stream`、声码器校验、隧道协议这类要害配置；非改不可时，先说明代价再动手。
2. 按仓库里的 `SUPPORT.md` 生成一份 **issue 正文**：环境、卡在第几步、原样报错（3–20 行）、已经试过什么。`auth.token`、`openaiServer.apiKey`、`sk-` / `tp-` Key、`CF_API_TOKEN`、账号邮箱一律替换成 `***`。
3. 告诉安装者：这个仓库欢迎提 issue —— <https://github.com/JAYcodr/audiobook-tts-plugin/issues>，把刚生成的那段贴进去就行；同时说明这是个人项目，会看，但不承诺响应时间。
4. 把排过的东西写进汇总表的备注，别让后面接手的人从零开始。

如果卡在任何一步，先读随包的 `HTTPS-GUIDE.md`、`INSTALL.md`、`TROUBLESHOOTING.md`、`SUPPORT.md`，再动手。
