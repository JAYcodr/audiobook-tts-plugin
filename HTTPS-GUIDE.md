# 公网 HTTPS 与穿透指南（v0.5.0）

**什么时候需要**：手机离开家里的 Wi-Fi 还想接着听（通勤、出差、公司或学校网络）、或者平板、第二台设备、家人同事要接入——都需要一条**带有效公网 TLS 证书的 HTTPS 地址**。最常见的动机是「自己出门也要用」，分享给别人只是同一套方案的附带用途。

本指南对比四条成熟方案，每栏都写明「要不要注册账号、去哪注册」，并列出实测踩坑红线。

---

## 一、四方案对比与 30 秒决策树

| 方案 | 需要买域名吗 | 地址是否固定 | 费用 | 并发/限制 | 适用场景 |
|---|---|---|---|---|---|
| **A · Quick Tunnel** | 不需要 | 重启后变化 | 免费 | ≤200 并发、无 SSE 流式 | **5 分钟尝鲜 / 临时测试 / 短期分享** |
| **B · Tailscale Funnel** | 不需要 | 固定（`*.ts.net`） | 免费 | 需装 Tailscale 并开 Funnel ACL | **个人自用多设备**，不想买域名或配 CF |
| **C · 命名隧道 + 免费域名** | 需要免费/自有域名 | **永久固定** | 免费 | 稳定可靠，支持 CF Access | **长期稳定服务 / 多设备或多人都要接入** |
| **D · CF Worker + KV 中转** | 不需要 | **固定 `*.workers.dev`** | 免费（10 万请求/天） | Worker 10ms CPU（流式透传够用） | **不想申请域名、但要固定 HTTPS 入口** |

### 需要注册什么、去哪注册

| 方案 | 要注册的账号 | 入口 |
|---|---|---|
| A · Quick Tunnel | **不需要账号**，`cloudflared` 直接起临时隧道 | 装工具：<https://github.com/cloudflare/cloudflared/releases>（macOS `brew install cloudflared`） |
| B · Tailscale Funnel | Tailscale 账号（还要开 MagicDNS、HTTPS 证书与 Funnel 属性） | <https://login.tailscale.com/start> |
| C · 命名隧道 | Cloudflare 账号（免费计划即可）+ 一个域名 | CF：<https://dash.cloudflare.com/sign-up>；域名：<https://dash.domain.digitalplat.org/> 或 <https://nic.eu.org/> |
| D · Worker + KV | Cloudflare 账号（免费计划即可） | <https://dash.cloudflare.com/sign-up>，再 `wrangler login` |

> Cloudflare 免费额度对个人听书够用：Workers 每天 10 万请求，KV 每天 10 万读 / 1000 写。
> 授权一律走浏览器弹窗（`wrangler login` / `cloudflared tunnel login`），**不要把账号密码交给任何人或任何 AI**。

### 决策树

1. **只想今天试一试，或者只在家里 Wi-Fi 下听？** → 局域网直连；想临时出门听一会儿，就在控制台「交付」页点 **一键启动 Quick Tunnel（方案 A）**。
2. **自己出门听是常态，但不想碰域名？** 愿意在手机和电脑上装 Tailscale → **方案 B（固定 `*.ts.net`）**；只想零成本拿个固定地址 → **方案 D（固定 `*.workers.dev`）**。
3. **有第二台设备或家人同事也要接入，而且希望地址以后不用改？** → **方案 D** 或 **方案 C**。
4. **已经有域名，或愿意免费注册一个 `.dpdns.org` / `.us.kg` / `eu.org` 托管到 Cloudflare？** → **命名隧道（方案 C，长期最稳）**。

---

## 二、方案 A：Cloudflare Quick Tunnel（零域名一键启动）

直接在控制台「交付」页点击 **「一键启动 Quick Tunnel」**（默认使用 `HTTP/2`，对国内网络比 QUIC 更稳定），插件会受控执行：

```bash
cloudflared tunnel --no-autoupdate --url http://127.0.0.1:8291 --protocol http2
```

未安装 `cloudflared` 时（**Quick Tunnel 不需要 Cloudflare 账号**，装个工具就能起）：

```bash
brew install cloudflared        # macOS
# 其他平台：https://github.com/cloudflare/cloudflared/releases
```

### 已知限制与恢复

1. **重启会变域名**：每次重启隧道或重启电脑，`https://xxx.trycloudflare.com` 都会重新生成，需要重新复制导入地址或二维码。
2. **仅建议个人测试与临时分享**：Cloudflare 对 Quick Tunnel 有 **200 并发请求上限**，不支持 SSE 长连接流式响应（我们的 `/listening` 和 `/v1/audio/speech` 默认返回完整 WAV，完全兼容）。
3. **断线恢复**：若手机报 `502` / `530`，在控制台点「重启」隧道即可；如遇 UDP 丢包导致隧道反复断连，保持协议为 **HTTP/2（推荐）**。

---

## 三、方案 B：Tailscale Funnel（零域名自用固定 HTTPS）

先注册：<https://login.tailscale.com/start>（个人免费档够用），手机和电脑登进同一个 tailnet。Funnel 的开工条件有三条，缺一条都会报错：

- 客户端 ≥ **v1.38.3**；
- tailnet 开了 **MagicDNS** 与 **HTTPS 证书**（管理后台 → DNS）；
- ACL 里有 `funnel` 节点属性：管理后台 → **Access controls** → 展开 **Funnel** → 点 **Add Funnel to policy**（等价于加 `"nodeAttrs": [{"target": ["autogroup:member"], "attr": ["funnel"]}]`）。官方说明：<https://tailscale.com/kb/1223/funnel>

然后一条命令把本机 `8291` 暴露为公网 HTTPS（自动签发证书）：

```bash
tailscale funnel --bg 8291
tailscale funnel status
```

1. 拿到输出里的 `https://<你的节点名>.<tailnet>.ts.net`，填入控制台「渲染设置 → 08 对外地址（`server.publicUrl`）」，保存后「交付」页会自动生成对应的公网二维码与 OpenAI Base URL。
2. 关闭：`tailscale funnel off`。

> 注意：Tailscale Funnel 适合自用和少数信任的人，不要将 `publicUrl` 公开张贴。

---

## 四、方案 C：Cloudflare Named Tunnel（固定域名最稳方案）

### 推荐免费域名（可完整托管 Cloudflare NS）

- **DigitalPlat FreeDomain**：提供 `.dpdns.org`、`.us.kg`、`.qzz.io` 免费二级域名，支持完整修改 NS 记录交给 Cloudflare 托管。
- **eu.org**：老牌免费域名，同样支持完整 Cloudflare NS 托管（审核周期可能较长）。
- 已有任意一元/常规顶级域名（`.top` / `.xyz` / `.com`）直接托管到 Cloudflare DNS 亦可。

### 配置步骤

先有账号和域名：Cloudflare 注册 <https://dash.cloudflare.com/sign-up>（免费计划即可），再把上面的免费域名用**自定义 NS** 托管进 Cloudflare（DigitalPlat 后台可改 NS；eu.org 审核通过后同样改 NS，可能要等几分钟到几小时生效）。

```bash
# 1. 登录 Cloudflare 授权（浏览器弹窗确认，不需要把密码交给命令行）
cloudflared tunnel login

# 2. 创建命名隧道并绑定域名
cloudflared tunnel create audiobook-tts
cloudflared tunnel route dns audiobook-tts tts.example.dpdns.org
```

编写 `~/.cloudflared/config.yml`：

```yaml
tunnel: audiobook-tts
credentials-file: ~/.cloudflared/<TUNNEL_UUID>.json
protocol: http2
ingress:
  - hostname: tts.example.dpdns.org
    service: http://127.0.0.1:8291
  - service: http_status:404
```

运行：`cloudflared tunnel run audiobook-tts`。然后在听书控制台「渲染设置 → 08 对外地址」填入 `https://tts.example.dpdns.org` 并保存。

### 避坑红线（务必避开）

| 坑点 | 原因 | 结论 |
|---|---|---|
| **自签 HTTPS 证书** | **Android 7+（Nougat 及以上）系统默认拒绝应用信任用户安装的 CA 证书**，Legado 与多数阅读客户端会直接报 `SSLHandshakeException` | **严禁使用自签证书** |
| **ClouDNS 免费子域名** | ClouDNS 免费子域不支持修改 NS 记录，Cloudflare 无法接管 DNS 与隧道路由 | **不要用 ClouDNS 做命名隧道** |
| **Freenom 免费域名** | `.tk` / `.ml` / `.ga` / `.cf` / `.gq` 已停止注册并下线 | **不要再折腾 Freenom** |
| **直接绑定 `*.pages.dev`** | Cloudflare Pages 域名不能直接作为 Named Tunnel 的 Public Hostname | **请用独立域或方案 D `workers.dev`** |

---

## 五、方案 D：Cloudflare Worker + KV 固定域名中转

如果你既没有域名、也不想装 Tailscale，希望拥有一条固定 `https://<name>.<subdomain>.workers.dev` 地址：

先注册 Cloudflare：<https://dash.cloudflare.com/sign-up>（免费计划就够），再 `npm i -g wrangler`（或全程用 `npx wrangler`），`wrangler login` 走浏览器授权，能用 `wrangler whoami` 看到账号就行。仓库已内置开箱即用的中转工程：`deploy/cf-worker-relay/`。

- **工作原理**：固定入口落在 Cloudflare Workers（`*.workers.dev`），Worker 从 Workers KV 读取当前 `https://xxx.trycloudflare.com` 并流式透传请求。
- **安全边界**：
  - `worker.js` 只放行 `GET /health`、`GET /legado.json`、`GET|POST /listening`、`GET|OPTIONS /v1/models`、`POST|OPTIONS /v1/audio/speech`；
  - 任何 `/mimo-tts/api/*`、`/audiobook-tts/api/*`、`/api/*` 控制管理接口一律返回 `404`；
  - 读取 KV 值时强制校验 `^https://[a-z0-9-]+\.trycloudflare\.com$`，彻底防 SSRF。
- **自动同步与 5 分钟兜底**：
  - 在「渲染设置 → 08」开启 `tunnel.kvSync.enabled` 并填好 `kvNamespaceId` 与 `publicRelayUrl` 后，控制台每次一键启动 Quick Tunnel 会自动同步 KV；
  - 可用系统 `crontab` 或 DSH 定时任务每 5 分钟执行一次兜底脚本：

```bash
*/5 * * * * AUDIOBOOK_API_TOKEN=<URL_TOKEN> node /绝对路径/audiobook-tts-plugin/deploy/cf-worker-relay/sync-tunnel-url.mjs \
  --from-api http://127.0.0.1:8291/api/tunnel/status \
  --mode wrangler --namespace-id <KV_NAMESPACE_ID> >/tmp/ab-kv-sync.log 2>&1
```
（若走 DSH 宿主管线，也可直接填 `http://127.0.0.1:<GUI端口>/mimo-tts/api/tunnel/status`，无需 Token。）

详细 5 步部署与卸载回收命令见 [deploy/cf-worker-relay/README.md](deploy/cf-worker-relay/README.md)。

---

## 六、常见排障

1. **Worker 返回 `503 tunnel_unavailable`**：Quick Tunnel 还没启动，或 KV 尚未同步最新 URL；回控制台「交付」页启动 Quick Tunnel 后点「立即同步 KV」。
2. **Worker 返回 `503 upstream_tunnel_error (502/530)`**：本机 `cloudflared` 断线或后端端口变了；重启 Quick Tunnel 即可。
3. **OpenAI 端点返回 `404 endpoint_disabled`**：这是安全默认行为——前往「渲染设置 → 09 对外 OpenAI 兼容端点」打开开关并生成独立 Bearer Key。
4. **Legado / Readest 报 `401`**：检查地址中的 `?token=` 或 OpenAI 客户端里填写的 `API Key`（配置了独立 `openaiServer.apiKey` 后，`auth.token` 不再用于 `/v1/*`）。
5. **以上都不是**：按 [SUPPORT.md](SUPPORT.md) 收材料——`setup/check-env.sh` 结论、`/health`、隧道或 Worker 的几行日志，token 与 Key 换成 `***`，再提到 <https://github.com/JAYcodr/audiobook-tts-plugin/issues>。
