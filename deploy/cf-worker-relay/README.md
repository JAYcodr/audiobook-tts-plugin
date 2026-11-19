# 方案 D：Cloudflare Worker + KV 固定域名中转

无需购买任何域名、无需修改 NS、也无需配置自签证书，即可获得一条**固定 `https://<name>.<subdomain>.workers.dev` 地址**，后端自动转接到本机 Quick Tunnel（`https://xxx.trycloudflare.com`）。

## 安全边界

1. **严格路由白名单**：`worker.js` 仅放行 `GET /health`、`GET /legado.json`、`GET|POST /listening`、`GET|OPTIONS /v1/models`、`POST|OPTIONS /v1/audio/speech`；任何 `/mimo-tts/api/*`、`/audiobook-tts/api/*`、`/api/*` 控制台管理接口或未知路径一律返回 `404`。
2. **防 SSRF 校验**：从 KV 读取的 `tunnel_url` 必须严格匹配 `^https://[a-z0-9-]+\.trycloudflare\.com$`，非法值或缺失一律拒绝并返回 `503`。
3. **流式零缓冲**：直接透传请求体与响应音频流，不占 Worker 内存与额外 CPU。

---

## 5 步部署

### 1. 安装并登录 Wrangler

```bash
npm install -g wrangler
wrangler login
```

### 2. 创建 KV 命名空间并复制配置文件

```bash
cd deploy/cf-worker-relay
cp wrangler.toml.example wrangler.toml
npx wrangler kv namespace create TUNNEL_KV
```

将输出的 `id` 填入 `wrangler.toml` 的 `[[kv_namespaces]]` 段落。

### 3. 部署 Worker

```bash
npx wrangler deploy
```

部署成功后记下返回的固定地址（例如 `https://audiobook-tts-relay.<你的子域>.workers.dev`）。

### 4. 在听书控制台或 `config.json` 配置中转

在控制台「渲染设置 → 传输」或 `config.json` 中填写：

```json
{
  "tunnel": {
    "protocol": "http2",
    "kvSync": {
      "enabled": true,
      "mode": "wrangler",
      "kvNamespaceId": "你的_KV_NAMESPACE_ID",
      "keyName": "tunnel_url",
      "publicRelayUrl": "https://audiobook-tts-relay.<你的子域>.workers.dev"
    }
  }
}
```

此后每次在控制台点击「一键启动 Quick Tunnel」，插件会自动调用 `sync-tunnel-url.mjs` 将最新 `trycloudflare.com` 地址写入 KV；也可随时在控制台点击「立即同步 KV」。

### 5. 5 分钟定时兜底同步（Cron / DSH 自动化）

如希望即使本机或隧道意外重连也能自动兜底刷新 KV，可配置 5 分钟定时任务：

```bash
# crontab -e（直连 8291 端口走 /api/tunnel/status；若走 DSH GUI 端口则用 /mimo-tts/api/tunnel/status）
*/5 * * * * AUDIOBOOK_API_TOKEN=<URL_TOKEN> node /绝对路径/audiobook-tts-plugin/deploy/cf-worker-relay/sync-tunnel-url.mjs --from-api http://127.0.0.1:8291/api/tunnel/status --mode wrangler --namespace-id <KV_NAMESPACE_ID> >/tmp/ab-kv-sync.log 2>&1
```

若使用 `--mode api`（无需安装 `wrangler`，适合定时任务或容器），只需提前设置环境变量 `CF_API_TOKEN`、`CF_ACCOUNT_ID` 与 `CF_KV_NAMESPACE_ID`。

---

## 免费额度与限制说明

- **Workers 免费版额度**：每天 **100,000 次请求**（个人听书远够用）；每次请求 **10ms CPU 时间限制**（因为本中转只做路由校验与流式透传，等待后端合成的 I/O 时间不计入 CPU 时间）。
- **Workers KV 免费版额度**：每天 100,000 次读、1,000 次写（同步脚本内置状态文件去重，地址未变时跳过写入）。
- **国内连通性**：`*.workers.dev` 在部分运营商网络可能较慢或偶发抖动，如遇波动可按 [HTTPS-GUIDE.md](../../HTTPS-GUIDE.md) 绑定自定义免费域名（如 `.dpdns.org`）作为 Worker Custom Domain 或直接改用命名隧道。

---

## 销毁与回收

```bash
cd deploy/cf-worker-relay
npx wrangler delete
npx wrangler kv namespace delete --namespace-id <KV_NAMESPACE_ID>
```
