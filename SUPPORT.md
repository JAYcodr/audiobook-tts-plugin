# 遇到问题：自查、报障与提 issue

这是个人维护的项目。**欢迎提 issue，但别把它当客服工单**——没有响应时间承诺；能自己先排掉的问题，通常排得更快。

| 你遇到的是 | 先看 |
|---|---|
| 装不上、配置填不对、重启后没生效 | [INSTALL.md](INSTALL.md)（每一步都带验证命令） |
| 想要公网地址、隧道 / 域名 / Worker 怎么选 | [HTTPS-GUIDE.md](HTTPS-GUIDE.md) |
| 有具体症状：401、没声音、进度条不动、一出声是噪声、Worker 503 | [TROUBLESHOOTING.md](TROUBLESHOOTING.md) |
| 上面都查过了还是不对 | **本文件**：怎么收集材料、怎么脱敏、怎么写一条别人能复现的 issue |

---

## 1. 提交前，三步自查（30 秒）

1. 控制台顶部「打开向导与体检 → 运行体检（Doctor）」；终端里等价的是 `./setup/check-env.sh`
2. 在 [TROUBLESHOOTING.md](TROUBLESHOOTING.md) 里搜症状关键词（`401` / `噪声` / `进度条` / `Worker` / `502` …）
3. 看「渲染设置」右侧生效面板有没有脏标——**改了没保存，等于没改**

---

## 2. 收集材料（都在本机跑，先别发出去）

```bash
cd /path/to/audiobook-tts-plugin
./setup/check-env.sh
./setup/agent-preflight.sh                 # 只读环境快照，JSON
curl -s http://127.0.0.1:8291/health
tail -50 ~/.dsh/plugin-data/audiobook-tts-plugin/local-engine.log 2>/dev/null
```

服务端流水在控制台「时间线」右下角的**场记流水**里，报错那几行直接复制。

- 公网相关：再贴隧道启动日志（Quick Tunnel / `cloudflared tunnel run`）或 `wrangler tail` 的几行
- 插件加载相关：DSH 终端里搜 `audiobook-tts` / `mimo-tts`

体检脚本与快照脚本本身**不会输出密钥**，可以直接贴结论段。

---

## 3. 发出去之前先脱敏

| 必须换成 `***` | 出现在哪 |
|---|---|
| URL 令牌 `auth.token` | 导入地址的 `?token=` 后面 |
| `openaiServer.apiKey`（`sk-ab-…`） | OpenAI 客户端里填的 API Key |
| 上游 Key（`sk-…` / `tp-…`） | `config.json` 的 `upstream.keys` |
| `CF_API_TOKEN` / `CF_ACCOUNT_ID` | 定时任务、环境变量 |
| Cloudflare / Tailscale / MiMo 的账号邮箱 | 控制台截图、`wrangler whoami` 输出 |
| 自己的公网域名 | 不想被扫就统一写成 `<域名>` |

**不要**把整份 `config.json` 直接贴出来——里面有 Key 和令牌，贴之前至少用编辑器替换一遍。

---

## 4. 可复制的 issue 正文

整段复制，把方括号填掉，就是一份合格的报告：

````markdown
### 环境
- 系统 / 芯片：[macOS 15.2 / Apple M2]
- DSH 版本：[0.2.2-rc.3]
- 插件版本：[0.5.0]
- 引擎路线：[本地 Qwen3-TTS / OpenAI 兼容 / MiMo 云端 / Hybrid]
- 公网方案：[无 / Quick Tunnel / Tailscale Funnel / 命名隧道 / Worker+KV]

### 现象
[一句话说清：哪一步、点了什么、期望什么、实际什么]

### 报错原文
```text
[原样贴 3–20 行，别改写]
```

### 复现步骤
1. [第一步]
2. [第二步]
3. [每次都这样 / 偶发]

### 已排除
- [ ] 跑过 Doctor / `./setup/check-env.sh`
- [ ] 按 TROUBLESHOOTING.md 的哪一节试过：[第 N 节]
- [ ] 完全退出并重启过 DSH
- [ ] 换过端口 / 换过浏览器或手机重试

### 体检与健康（已脱敏）
```text
[check-env.sh 的结论段 + /health 返回]
```

### 补充
[截图或录屏；特殊网络环境（代理、TUN、公司防火墙）；其他插件冲突]
````

---

## 5. 让 AI 帮你写这份报告

如果你正用 DSH 里的 AI 装这个插件，直接把下面这句发过去：

> 按仓库里的 SUPPORT.md 生成一份 issue 报告：跑 `setup/check-env.sh` 与 `setup/agent-preflight.sh`，贴 `/health` 和日志尾部，把所有 token、API Key、账号邮箱换成 `***`，输出成一段可以直接复制的 Markdown。

它应当**先脱敏再输出**；如果发现要往文本里写真实密钥，应该停下来问你，而不是照做。

---

## 6. 提交入口

<https://github.com/JAYcodr/audiobook-tts-plugin/issues>

- 开新 issue 前先搜一下关键词，同一问题已经有人报过的话，在下面补一条「我这边也是 + 环境差异」比新开一条更有用。
- 能附最小复现步骤的 issue 最受欢迎；只写「用不了」的信息量不够，很难排。
- 功能建议也欢迎，但**先说清使用场景**（自己出门听？给第二台设备？给家人用？）比直接给方案更有用。

---

## 7. 这些情况其实不用提 issue

- Quick Tunnel 重启后地址变了 → 重新扫码导入；想固定地址就升级到方案 B/C/D
- 上游 401 / 429 / 5xx → 先按 [TROUBLESHOOTING.md 第 7 节](TROUBLESHOOTING.md) 验 Key 与限流
- 一出声是噪声 → 九成是声码器权重没下全，见 [TROUBLESHOOTING.md 第 8.1 节](TROUBLESHOOTING.md)
- 进度条不动、长段落不翻页 → 服务端「流式返回」被打开了，见 [TROUBLESHOOTING.md 第 5 节](TROUBLESHOOTING.md)
