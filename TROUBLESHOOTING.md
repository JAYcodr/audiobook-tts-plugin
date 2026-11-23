# 问题排查

先在控制台顶部点「**打开向导与体检 → 运行体检（Doctor）**」，或在终端跑一遍体检脚本：

```bash
cd /path/to/audiobook-tts-plugin
./setup/check-env.sh
```

它会把平台、配置、端口、health、模型、参考音、Python 环境逐项标 OK / WARN / FAIL。
下面按**你看到的症状**分组，直接搜关键词也行。

---

## 0. 先知道日志在哪

| 看什么 | 在哪 |
|---|---|
| 服务实时流水 | 控制台「时间线」右下角的场记流水 |
| 本地引擎（Python）日志 | `<数据目录>/local-engine.log`（默认 `~/.dsh/plugin-data/audiobook-tts-plugin/`，旧版兼容 `mimo-tts/`） |
| 宿主加载失败 | DSH 自己的终端 / 日志里搜 `audiobook-tts` 或 `mimo-tts` |
| 当前有效配置 | 「渲染设置」右侧生效面板；或 `<数据目录>/config.json` |
| 服务健康 | `curl -s localhost:8291/health` |

出问题时**先看最后 20 行日志**，再动手改配置。改完记得点保存——
「生效面板」有脏标说明还没生效。

---

## 1. 侧栏没有「听书值守」

**症状**：重启后左栏找不到入口；或者点开是空白页。

**先查**：

```bash
grep -nE "audiobook-tts-plugin|mimo-tts" ~/.dsh/profiles/desktop/package.json
```

**原因 A：只装了依赖，没进 bundles**

`dependencies` 里有包名（npm 安装是 `^0.5.x`，本地安装是 `link:`），但 `dsh.profile.bundles` 里没有 `"audiobook-tts-plugin"`。
→ 手工在 `bundles` 数组里加 `"audiobook-tts-plugin"`，完全重启。

**原因 B：没完全重启**

macOS 上 `Cmd+Q` 不够，托盘图标要退。只刷新页面不会加载宿主半边。
→ 完全退出再打开。

**原因 C：目录被移动/改名**

只有 `link:` 安装会这样：目录一动就断。→ 移回来后 `dsh plugin add link:` 重装；npm 安装不受目录位置影响。

**原因 D：版本不匹配**

DSH < 0.2.x 可能不认 `dsh.client.platform: web`。
→ `dsh --version`，低于 0.2 就升级 DSH，别改插件源码。

**空白页**：宿主路由没挂上。`curl -s http://127.0.0.1:<GUI端口>/mimo-tts/api/state`
返回 404 = `index.js` 没加载（回到原因 A/B）；返回 JSON 但页面白 = 浏览器缓存，
硬刷新一次。

---

## 2. 服务起不来 / 端口被占

**症状**：时间线显示 STOP；`/health` 连不上；日志里有 `EADDRINUSE`。

**查**：

```bash
lsof -nP -iTCP:8291 -sTCP:LISTEN
```

**处理**：

1. 是**另一个听书服务**（比如你还开着 `node bin/audiobook-tts.mjs`）→ 关掉那个，或让插件换端口。
2. 是别的程序 → 控制台「传输 → 端口」改成 8292 / 8390，
   保存后服务会自动重启到新端口。**手机上的导入地址也要重导一次**（端口变了）。
3. 想保留 8291 但让插件不抢：把插件停掉，单独跑 `node bin/audiobook-tts.mjs`。

> 换端口不杀本地 Python 边车，这是设计如此（避免为了改个端口重新加载 2 GB 模型）。

---

## 3. 手机连不上

**症状**：Legado 导入失败，或者导入成功但一播就报错。

按这个顺序排：

1. **是不是同一个网段**。电脑 `192.168.1.5`、手机连的是访客 WiFi `192.168.2.x` → 不通。
2. **地址对不对**。控制台「交付」页复制的是**局域网**地址。如果电脑有多张网卡，
   它优先给 `192.168.` 开头的；`10.` 和 `172.` 次之。
3. **`198.18.x.x` 一律不对**。那是代理软件（Clash 之类）的 TUN 网段，手机连不上。
   控制台已经会过滤掉，但如果你手工填过，改回来。
4. **macOS 防火墙**。第一次启动会弹「是否允许接受传入网络连接」，点了拒绝就要去
   「系统设置 → 网络 → 防火墙 → 选项」里放行 DSH / node。
5. **服务只监听了 127.0.0.1**。配置里 `server.host` 必须是 `0.0.0.0`（默认就是）。

**验证**（在手机上用浏览器打开）：

```
http://192.168.1.5:8291/health
```

能出 JSON = 网络通，问题在导入地址或令牌；打不开 = 网络/防火墙。

---

## 4. 导入报 401 / 403 / 404

| 码 | 原因 | 处理 |
|---|---|---|
| 401 | 地址里的 `token` 和服务器上的不一致 | 重新从「交付」页复制，别手打 |
| 403 | Basic 鉴权开着且没带凭据 | 要么用带 `?token=` 的地址，要么关掉 `auth.enabled`（不推荐） |
| 404 | 路径写错，或者服务换了端口 | 检查 `/legado.json` 和端口 |
| 200 但不是 JSON | 被反代/隧道改写了响应 | 检查 Cloudflare 规则，别对 `/legado.json` 做缓存 |

> 令牌在 `config.json` 的 `auth.token`，首次启动自动生成。
> **不要**把它发到群里——拿到令牌的人可以白嫖你的额度。
>
> 管理员口令默认是空的，而空口令时 Basic 登录一律 401（防止内网任何设备用 `admin:` 改配置）。
> 需要账密登录就先设 `auth.pass`（`config set auth.pass '<口令>'`），无头环境用 `?token=` 即可。

---

## 5. 有声音，但进度条不动 / 长段落不自动翻页

**症状**：能听，但播放器显示时长离谱（比如 13 小时），跨页时不翻页。

**原因**：`synth.stream` 被打开了。流式 WAV 的头里 `data` 长度写的是
`0x7FFFFFFF`（为了先出声），播放器按这个算时长，Legado 又用
`时长 / 字数` 推段落内进度 —— 于是永远算不到头。

**处理**：控制台「渲染设置 → 合成与缓存 → 流式返回」关掉（默认就是关的），保存。

首音会慢一点点，但这是唯一能让进度正确的做法。真正的提速靠**并发**：
同一段的多个角色段是并行合成的，3 段的段落 1.5 秒内就出结果。

> 注意区分两个「流式」：
> - App 侧「朗读设置 → 流式朗读」→ **建议开**，它只是边下边播；
> - 服务端「流式返回」→ **关**，它会让时长失真。

---

## 6. 有进度、没声音

**最容易被误判的一条**：云端某一段合成失败时，服务不会让整本书断掉——
它插 0.4 秒静音继续往下走，HTTP 仍然返回 200，WAV 也合法。
于是你看到的是「播放器在走、进度在动、就是没声音」。

**怎么确认**：看「时间线」右下角的场记流水，会有一条：

```
[warn] 段 3 失败，插入静音: 上游 401: {...}
```

**处理**：按下面第 7 节查那个错误。本地引擎相反——它失败会直接抛 502，
不会静音糊过去。

---

## 7. 云端报错

| 现象 | 原因 | 处理 |
|---|---|---|
| `401` / `403` | Key 错、过期、或者 `sk-` 与 `tp-` 混用 | 重新建 Key；`tp-` 开头的是 Token Plan，baseUrl 要改成 `https://token-plan-cn.xiaomimimo.com/v1` |
| `429` | 上游限流（默认 100 RPM） | 「合成与缓存 → 合成并发」降到 2；`limits.rpm` 调到 60 以下 |
| `上游 5xx` | 服务端抖动 | 会自动重试 3 次；持续就等一会儿 |
| 超时（120 秒） | 本机出网问题 | `curl -I https://api.xiaomimimo.com/v1/models` 看能不能通；检查代理 / DNS |
| `未配置 API Key` | `upstream.keys` 是空的 | 控制台填 Key，或复制 `config.example.json` 后改 `keys` |
| 报模型不存在 | 官方下线/改名了 | `upstream.model` 改成当前的 `mimo-v2.5-tts` |
| 额度用完了 | 免费额度耗尽 | 去控制台充值；或者切本地引擎 |

**验证 Key 本身能不能用**（不经过插件）：

```bash
curl -s -o /dev/null -w '%{http_code}\n' \
  https://api.xiaomimimo.com/v1/models \
  -H "api-key: sk-你的key"
```

`200` = Key 没问题，问题在插件配置；`401` = Key 本身不行。

---

## 8. 本地引擎

### 8.1 一出声就是噪声 / 电流声

**九成是声码器权重缺失。** `mlx-audio` 找不到 `speech_tokenizer/model.safetensors`
时**不报错**，直接用随机权重。当前插件已在 Node 与 Python 侧启动前强制拦截不完整模型目录。

```bash
ls -lh ~/.dsh/plugin-data/audiobook-tts-plugin/models/qwen3tts-0.6b-base-8bit/speech_tokenizer/model.safetensors
```

不是 651 MB 左右 → 删掉模型目录重下：

```bash
rm -rf ~/.dsh/plugin-data/audiobook-tts-plugin/models/qwen3tts-0.6b-base-8bit
./setup/download-model.sh
```

### 8.2 报「本地引擎未在 180s 内就绪」

看 `local-engine.log` 最后几行。常见三种：

| 日志里出现 | 原因 | 处理 |
|---|---|---|
| `ModuleNotFoundError: mlx_audio` | Python 路径填错（填了系统 Python） | 填 `~/.dsh/plugin-data/audiobook-tts-plugin/venv/bin/python` 或在向导里重装依赖 |
| `No such file` / `模型目录不存在` | 路径写错，或模型没下完 | 用「环境自动探测 → 一键填入」，或核对模型目录 |
| `Killed` / 内存不足 | 16 GB 以下机器同时干别的 | 关掉别的重活；`idleUnloadSeconds` 调小 |
| `refs 里必须有 narrator` | 参考音没填全 | 选择内置 `builtin:narrator-14s` 或填写 wav + 逐字 text |

### 8.3 报「Python 不存在」「旁白参考音不存在」

代码里这几个报错很直白，照着改：

```
Python 不存在：<路径>
模型目录不存在：<路径>
旁白参考音不存在：<路径>
本地引擎缺少旁白参考音（wav + text）
```

v0.4.0 起，`pythonPath`、`modelPath` 与参考音路径均支持 `~/` 家目录缩写；也可在「向导抽屉」点「重新探测 → 一键填入」。

### 8.4 每段都要等十几秒

模型被空闲卸载了。默认 `idleUnloadSeconds: 1800`（30 分钟），另有
`warmupWindowSeconds: 900`（15 分钟）的预热保活窗口，从**最近一次合成**起算，
两者取较长的那个——所以默认是「停用满 30 分钟才卸载」。

听书时如果一段间隔超过 30 分钟（比如出门一趟），回来第一段就要重新加载。

- 嫌烦：把 `idleUnloadSeconds` 调到 `3600`（1 小时）；
- 机器内存够：设 `0` = 永驻，代价是 2.3 GB 常驻。

### 8.5 只有 macOS 能用

`mlx-audio` 依赖 MLX，只有 Apple Silicon。Intel Mac / Windows / Linux NAS
都会在 `pip install` 那一步失败或跑不起来。

→ 这些平台用云端。或者把服务放 Mac 上，NAS 上只放 Legado。

---

## 9. 音色不对 / 不像参考音

| 现象 | 原因 |
|---|---|
| 音色飘、像换了个人 | 参考文本和音频**不是逐字一致** |
| 念出奇怪的字 | 同上，参考文本多字/少字 |
| 整段像另一个人 | 参考音太短（< 5 s）或含两段话中间夹长停顿 |
| 语气很平 | 本地引擎**没有风格指令通道**，`style` 字段会被忽略；云端才有 |
| 开头几句像另一个人 | 混合模式在切引擎（云 → 本地），切换那一句音色会变 |

**参考音的硬要求**：5–15 秒、一句完整的话、逐字文本、无背景音乐、无重混响。

---

## 10. 听着听着断了

**症状**：播一段停一段，或者整本书播到一半没声了。

1. **Mac 睡了** → `caffeinate -s` 或关掉节能睡眠。
2. **DSH 退了** → 插件形态下服务跟着 DSH 走；要常驻就 `node bin/mimo-tts.mjs` 单独跑。
3. **上游 429** → 并发调低。
4. **内存压力**：本地引擎 2.3 GB + DSH + 浏览器，16 GB 机器别同时开太多。

---

## 11. 公网 / Cloudflare / 对外 OpenAI 端点

| 现象 | 原因 | 处理 |
|---|---|---|
| 公网地址 502 / 530 | 隧道断连，或命名隧道 ingress 写了不可达地址 | Quick Tunnel 点「重启」；命名隧道确认 `http://127.0.0.1:8291` 或 Mac 局域网 IP |
| 手机报 SSL 握手失败 | 使用了自签 HTTPS 证书（Android 7+ 拒绝用户 CA） | **严禁自签证书**，改用 [HTTPS-GUIDE.md](HTTPS-GUIDE.md) 任一官方证书方案 |
| Quick Tunnel 重启后手机连不上 | Quick Tunnel 每次重启都会分配新域名 | 在「交付」页重新扫码导入，或升级到方案 B/C/D 固定入口 |
| Worker 中转返回 `503 tunnel_unavailable` | KV 中的 `tunnel_url` 缺失、过期或非 `trycloudflare.com` | 启动 Quick Tunnel 后在「交付」页点「立即同步 KV」 |
| `/v1/audio/speech` 返回 `404 endpoint_disabled` | 对外 OpenAI 端点默认关闭 | 到「渲染设置 → 09 对外 OpenAI 兼容端点」打开开关并保存 |
| `/v1/audio/speech` 返回 `401 invalid_api_key` | 客户端填写的 Bearer Key 不匹配 | 检查独立 `openaiServer.apiKey`（配置后不再接受 `auth.token`） |
| `/v1/audio/speech` 请求 `mp3` 返回 `400` | 开启了 `mp3Fallback: 'strict'` | 改为 `wav` 兼容回退，或让客户端请求 `wav`/`pcm` |
| 打开是 Access 登录页 | Cloudflare Access 拦了 | 在「传输 → 附加请求头」填 Service Token；导入这一步在局域网里做 |
| 导入能用、播放 403 | 附加头没写进引擎 | 重新从「交付」页取地址 |
| 域名能开但很慢 | 隧道绕了远路或使用了 UDP/QUIC 被运营商限制 | 切回 `HTTP/2（推荐）` 协议，或换用局域网 / 命名隧道 |

### 令牌分级与泄露后处理

插件支持两级 URL 令牌：
- **主管理令牌（`auth.token`）**：完整权限（含 `/api/*` 修改配置、启停服务）。仅限自己使用，**不要分享给他人**。
- **只读分享令牌（`auth.readTokens`）**：按设备命名签发，仅允许调用 `/listening`、`/legado.json`、`/v1/audio/speech`、`/v1/models` 与 `/health`；访问任何 `/api/*` 管理路由一律返回 **`403 Forbidden`**。

如果某台分享设备的令牌不慎泄露：
1. 打开控制台「**渲染设置 → 10 鉴权与日志**」，在「只读分享令牌」列表里点对应设备的「**吊销**」，旧地址立即返回 `401`（不影响其他设备）。
2. 如果是主令牌 `auth.token` 或截图带入了主导入地址：在同一面板点「**轮换主令牌**」（或跑 `audiobook-tts config set auth.token "<新随机串>"`），旧管理地址即刻失效，然后到「交付」页重新扫码导入自己的手机。
3. 如果启用了独立 `openaiServer.apiKey`，也在「**渲染设置 → 09**」点击「生成随机密钥」并保存即可作废旧 Key。

---

## 12. 还是不行：按 SUPPORT.md 报障

先收集，再发。完整流程（脱敏清单 + 可复制的 issue 正文 + 让 AI 代写）写在 [SUPPORT.md](SUPPORT.md)，这里只列最小集：

```bash
./setup/check-env.sh                                                  # 体检结论
curl -s localhost:8291/health                                         # 服务状态
curl -s http://127.0.0.1:<GUI端口>/mimo-tts/api/state | head -c 2000  # Key 已掩码，可直接贴
tail -50 ~/.dsh/plugin-data/audiobook-tts-plugin/local-engine.log 2>/dev/null
```

贴之前把 `auth.token`、`openaiServer.apiKey`、`sk-` / `tp-` Key、`CF_API_TOKEN` 和账号邮箱换成 `***`。
提交入口：<https://github.com/JAYcodr/audiobook-tts-plugin/issues>（个人项目，欢迎报，不承诺响应时间）。

然后对照 `INSTALL.md` 对应那一节交互确认。这个包的文档是按真实踩坑写的，
不要凭印象改配置——尤其是 `stream` 和 `speech_tokenizer` 这两处，改了会以更奇怪的方式坏掉。
关于 Android Legado 与流式 WAV（`0x7fffffff` 头）的真机测试清单与 `?stream=1` 灰度方法，参见 [mimo-tts/docs/streaming-legado-compat.md](mimo-tts/docs/streaming-legado-compat.md)。
