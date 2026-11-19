# 初始化引导（从零到能在手机里听书）

照着顺序做。每一步后面都有**验证**，通过了再下一步——不要一口气全做完再回头找问题。

预计时间：本地引擎 20–40 分钟（主要看模型下载）；云端作为辅助路线 5–10 分钟，可随时补上。

> **定位**：本地 Qwen3-TTS 为主引擎，MiMo 云端为辅。有 Apple Silicon 就直接走本地；
> 没有的话云端一样能跑完整流程，两条路可以在 `hybrid` 模式下同时开。

---

## 0. 先确认环境

| 项 | 要求 | 怎么查 |
|---|---|---|
| DSH | ≥ 0.2.x（打包时验证版本 0.2.2-rc.3） | 应用「关于」或 `dsh --version` |
| Node | **不用自己装**，DSH 自带 | — |
| 平台 | 云端：macOS / Windows / Linux 都行 | — |
| 本地引擎 | **只有 macOS + Apple Silicon（M 系列）** | `uname -sm` → `Darwin arm64` |
| 手机 | 和电脑在同一个局域网 | — |
| 阅读 App | [Legado](https://github.com/gedoor/legado)（安卓） | — |

> 本包不含任何密钥，也不含模型权重。下面会让你自己准备。
>
> 还没有 DSH 的话，先装桌面客户端（作者会一起发给你），装完再回来从第 1 步开始。

**Windows 用户**：云端路线完全可用；本地引擎（MLX）不行。
差别只有三处：

- 路径写成 `C:\Users\你\dsh-plugins\audiobook-tts-plugin\mimo-tts`；
- `setup/*.sh` 别跑，那是给 macOS/Linux 的；
- 配置目录是 `%USERPROFILE%\.dsh\plugin-data\audiobook-tts-plugin\`（若已有旧版 `mimo-tts` 目录会自动兼容沿用）。

其余步骤（装插件、重启、填 Key、导入 Legado）一模一样。

---

## 1. 把文件放到固定的地方

挑一个**以后不会移动、不会删、不会同步到云盘再被清掉**的目录，clone 下来：

```bash
mkdir -p ~/dsh-plugins
git clone https://github.com/JAYcodr/audiobook-tts-plugin.git ~/dsh-plugins/audiobook-tts-plugin
```

装进 DSH 的是仓库里的 `mimo-tts/` 子目录（仓库根下就是它），
**整包别拆、别删**——`setup/` 要按自己的位置去找 `refs/` 和 `mimo-tts/`，拆散了脚本就找不到了。

**验证**：

```bash
ls ~/dsh-plugins/audiobook-tts-plugin/mimo-tts/package.json
ls ~/dsh-plugins/audiobook-tts-plugin/refs/
```

> 为什么强调「不能移动」：插件是按**绝对路径**以 `link:` 方式装进 DSH 的。
> 你把目录改名或挪走，DSH 下次启动就找不到它了。真要挪，挪完重装一遍。

---

## 2. 装进 DSH

### 2.1 首选：让 AI 装（最省事）

把 [AI-SETUP-PROMPT.md](AI-SETUP-PROMPT.md) 里的整段内容复制，发给 DSH 里的 AI。
它会用 `plugin_manager` 安装、重启、验证，并且只问你两件事：装哪个引擎、Key 是多少。

### 2.2 手动：用 plugin_manager

在 DSH 里说：

> 用 plugin_manager 的 install_bundle，target 填 `/Users/你/dsh-plugins/audiobook-tts-plugin/mimo-tts` 的绝对路径。

它会要求授权——同意。安装器做的事是：把 `audiobook-tts-plugin` 以 `link:` 方式写进
profile 的依赖，并把 `audiobook-tts-plugin` 加进 `dsh.profile.bundles`（包里有
`dsh.bundle.patch`，所以侧栏入口会跟着加载）。

### 2.3 兜底：命令行

如果 `plugin_manager` 报错（旧版本、或 workspace 相关报错），用 CLI：

```bash
# profile 名一般是 desktop 或 web，先确认：
ls ~/.dsh/profiles

dsh plugin --profile desktop add link:$HOME/dsh-plugins/audiobook-tts-plugin/mimo-tts
```

然后**手工**把包加进 bundles。打开 `~/.dsh/profiles/desktop/package.json`，
在 `dsh.profile.bundles` 数组里加一行：

```json
{
  "dsh": {
    "profile": {
      "bundles": [
        "@deepseek-ai/dsh-base",
        "...",
        "audiobook-tts-plugin"
      ]
    }
  }
}
```

> 只 `pnpm add` 不加 bundles，服务本体和侧栏入口都不会加载——这是最常见的漏步。

### 验证

```bash
grep -n "audiobook-tts-plugin" ~/.dsh/profiles/desktop/package.json
```

应该能看到两处：`dependencies` 里的 `"audiobook-tts-plugin": "link:/.../audiobook-tts-plugin/mimo-tts"`，
和 `bundles` 里的 `"audiobook-tts-plugin"`。

---

## 3. 完全重启 DSH

- **桌面客户端**：完全退出（macOS 上 `Cmd+Q` 不够，托盘图标也要退），再打开。
- **`dsh web`**：停掉进程重新起，然后刷新浏览器。
- 只刷新页面**不会**加载新的宿主半边。

**验证**：左栏出现「听书值守」图标；点进去能看到四个页签：
**时间线 / 渲染设置 / 工程史 / 交付**。

---

## 4. 先让服务跑起来（不花钱，不联网）

进「时间线」，看左上角的服务状态。

- 显示 **RUN** → 好，继续。
- 显示 **STOP** → 点顶部的「启动」。
- 报端口占用 → 见 [TROUBLESHOOTING.md](TROUBLESHOOTING.md) 第 2 节，换个端口。

命令行验证（端口用你自己的，默认 8291）：

```bash
curl -s http://127.0.0.1:8291/health
```

应返回类似：

```json
{"status":"ok","running":true,"host":"0.0.0.0","port":8291,
 "url":"http://127.0.0.1:8291","uptimeSec":12,"version":"0.2.0",
 "provider":"mimo","local":{...},"hybrid":{...},"cache":{...},"rpm":{...}}
```

`running: true` 是关键。`provider` 显示当前引擎（`mimo` / `local` / `hybrid`）。

`/health` 免鉴权，所以这一步能过，说明 Node 侧的服务已经起来了。

> 服务默认监听 `0.0.0.0:8291`——这是给手机上的 Legado 连的，不是只给本机。
> 第一次启动 macOS 可能弹「是否允许接受传入网络连接」，**要点允许**。

---

## 5. 接云端 MiMo（路线 A）

### 5.1 拿 Key

1. 打开 <https://platform.xiaomimimo.com/#/console/api-keys>
2. 注册 / 登录 → 创建 API Key
3. Key 以 `sk-` 开头，**只显示一次**，立刻存到密码管理器

> 注意：还有一种是「Token Plan」的 `tp-` 开头 Key，它的 baseUrl 不一样
> （`https://token-plan-cn.xiaomimimo.com/v1`）。本插件默认填的是按量付费的
> `https://api.xiaomimimo.com/v1`。两个别混用，混用会 401。

### 5.2 填进控制台

「渲染设置」页：

| 模块 | 字段 | 填什么 |
|---|---|---|
| 引擎与接入 | 渲染来源 | `云端` |
| 引擎与接入 | 上游地址 | 默认 `https://api.xiaomimimo.com/v1`，不用改 |
| 引擎与接入 | API Key | 你刚建的 `sk-...`（每行一个；显示出来是掩码，正常） |
| 方案与音色 | 旁白 | 选 `preset`（如 `冰糖`），也可切到 `design` 文字造音或 `clone` 克隆 |
| 方案与音色 | 对话 | 建议换一个音色（如 `苏打`），旁白和对话才分得出来 |

点保存。右侧「生效面板」应该显示没有待生效项。

> 你可以直接在「方案与音色」内建的「**试听当前草稿**」（不保存即可验证旁白/对话/混排）或「交付」页试听播放器进行验证；「交付」页也提供**纯离线二维码**供手机直接扫码导入。

> **OpenAI 兼容引擎（Kokoro / Edge-TTS / CosyVoice / OpenAI）**：如果你想接入社区的 `/v1/audio/speech` 服务，只需在「渲染设置 → 引擎」将渲染来源切换为 `OpenAI`，再在「03 OpenAI 兼容」模块填写接口地址（如 `http://127.0.0.1:8880/v1`）、模型名和旁白/对话音色即可（自建服务无需填 API Key）。

### 5.3 试一句

「交付」页最下方 →「curl 试一句」→ 点「复制 curl」，粘到终端里跑。
它会 POST 到 `/listening`，把结果写成 WAV：

```bash
curl -X POST 'http://192.168.1.5:8291/listening?token=xxxx' \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  --data-urlencode 'text=山道上起了雾，他把灯举高了一点。' \
  --data-urlencode 'speed=1' -o /tmp/test.wav
file /tmp/test.wav     # RIFF ... WAVE audio
open /tmp/test.wav     # macOS 直接播
```

第一次跑会真的调上游、消耗额度。**几秒内应该出声**。

- `401` → 地址里的 token 不对，回「交付」页重新复制
- `429` → 上游限流，把「合成与缓存 → 合成并发」降到 2
- `502` → 本地引擎报错，看「时间线」右下角的场记流水
- 超时 → 本机出网问题（代理 / DNS），先 `curl -I https://api.xiaomimimo.com/v1/models` 看看

**注意**：云端单段失败不会报错，**会插入 0.4 秒静音**继续往下走
（为了不让一本书因为一句失败就停）。所以 Key 错的时候你会看到
「HTTP 200 + 正常 WAV，但里面是静的」。这种就去翻场记流水里的
`[warn] 段 N 失败，插入静音: …`。

---

## 6. 接进 Legado（手机）

### 6.1 拿导入地址

「交付」页 → 复制**局域网导入地址**，长这样：

```
http://192.168.1.5:8291/legado.json?token=EXAMPLETOKEN123
```

地址里那个 `token` 是首次启动自动生成的，别改它，也别把它发到群里。

> 电脑有多张网卡时，控制台会优先给你 192.168 开头的地址；
> `198.18.x.x` 那种是代理软件的 TUN 网段，手机连不上，不会推荐给你。

### 6.2 导入

1. 手机 Legado → 一本书 → 朗读 → **在线朗读**
2. 右上角「导入」→ 粘贴上面的地址 → 确定
3. 引擎列表里出现 **听书值守 TTS**（或你在 `legado.name` 中自定义的名称）→ 选中

### 6.3 两个开关

- **流式朗读（建议开）**：朗读设置里有这个开关。开了之后每段合成完立刻播，
  不用等整段；不开也能用，但会一段一段地等。
- 「渲染设置 → 合成与缓存 → 流式返回」**这个不要开**（默认关）。
  它是服务端的流式 WAV，会让播放器把时长算错，长段落就不会自动翻页。
  和上面那个 App 侧的开关不是一回事。

### 6.4 验证

```bash
TOKEN=$(python3 -c "import json,os;p=os.path.expanduser('~/.dsh/plugin-data/audiobook-tts-plugin/config.json');p=p if os.path.exists(p) else os.path.expanduser('~/.dsh/plugin-data/mimo-tts/config.json');print(json.load(open(p))['auth']['token'])")
curl -s -o /tmp/t.wav -w '%{http_code} %{size_download} bytes\n' \
  "http://127.0.0.1:8291/listening?token=$TOKEN" \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  --data-urlencode 'text=山道上起了雾。' \
  --data-urlencode 'speed=1'
file /tmp/t.wav
```

应该 `200` + 几十 KB，`file` 认出 `RIFF ... WAVE audio`。

---

## 7. 本地引擎（路线 B，可选）

只支持 **macOS + Apple Silicon**。Intel Mac / Windows / NAS 请留在线云。

### 7.1 一键准备（推荐在控制台「向导抽屉」直接安装）

v0.4.0 起，最省事的做法是直接在控制台顶部点「**打开向导与体检**」→ 选择 `hf-mirror` 或 HuggingFace 官方源 → 点击「**一键安装本地引擎**」。界面内会实时展示进度条和日志；完成后点「**一键填入并切换本地**」，会自动填写 Python 路径、模型目录和内置旁白参考音 `builtin:narrator-14s`。

你也可以在终端手动执行等价脚本：

```bash
cd /path/to/audiobook-tts-plugin
./setup/install-local-engine.sh
```

它会做四件事：

1. 在 `~/.dsh/plugin-data/audiobook-tts-plugin/venv`（或已有兼容的 `mimo-tts/` 目录）建 Python 虚拟环境
2. 装锁定版本的 `mlx-audio` 与依赖
3. 下模型 `mlx-community/Qwen3-TTS-12Hz-0.6B-Base-8bit`（约 1.9 GB）
4. 校验权重完整性，最后打印路径（v0.4.0 起控制台支持写 `~/` 缩写，不必手动展开 `/Users/你`）

国内网络下模型走 huggingface 会很慢，脚本会自动回退到 `hf-mirror.com`。
想强制用镜像，直接：

```bash
HF_ENDPOINT=https://hf-mirror.com ./setup/install-local-engine.sh
```

**必查**（这是最容易踩的坑）：

```bash
ls -lh ~/.dsh/plugin-data/mimo-tts/models/qwen3tts-0.6b-base-8bit/speech_tokenizer/model.safetensors
```

必须是 **~682 MB** 的真文件。缺了它 `mlx-audio` **不会报错**，会用随机声码器，
输出一片噪声——这个坑在开发时踩过，所以脚本最后会专门校验它。

### 7.2 填进控制台

「渲染设置」页 → 「本地引擎」模块：

| 字段 | 填什么 |
|---|---|
| Python | `~/.dsh/plugin-data/mimo-tts/venv/bin/python`（脚本会打印完整路径） |
| Sidecar 脚本 | **留空**。留空就用插件自带的 `sidecar/server.py` |
| 模型目录 | `~/.dsh/plugin-data/mimo-tts/models/qwen3tts-0.6b-base-8bit` |
| 端口 | `8398`（默认，只绑 127.0.0.1，不对外） |
| 空闲卸载 | `300` 秒。0 = 常驻（一直占 2.3 GB） |

然后是参考音（模块里就叫这四个字段）：

| 字段 | 填什么 |
|---|---|
| 旁白参考音选择 | 直接下拉选内置「旁白女声 · 14s 完整句（推荐）」，或先在「统一参考音库」上传自己的 `.wav/.mp3/.m4a` |
| 对话参考音（可选） | 可保持留空（自动回退到旁白样本），或单独选另一条自定义音色 |

最后「引擎 → 渲染来源」选 `本地`，保存。

> 参考文本必须是音频里**逐字**说出来的内容。文本对不上，克隆出来的音色就会飘。

### 7.3 第一次合成会慢

第一次请求要拉起 Python 进程 + 加载模型 + MLX 编译，**约 12 秒**才出声。
之后每段 3–6 秒。空闲 5 分钟后进程自行退出，内存还给系统；下次再听又是 12 秒。

触发方式是回「交付」页跑一次 curl（同 5.3），或者直接在 Legado 里播一段。

**验证**：

```bash
curl -s http://127.0.0.1:8398/health
```

sidecar 没起来时这个地址是连不上的——这很正常，它是**懒加载**的，请求来了才拉。
合成过一次之后再查，应该能看到 `refs: ["narrator"]`、`load_s`、`maxrss_mb` 这些字段。

### 7.4 混合启动（hybrid）

同时有云端 Key 和本地参考音时，可以把「引擎 → 渲染来源」设成 `混合`：

- 冷启动的前 2–4 段先用云端克隆顶住（首段 3–5 秒，而不是 12 秒）
- 后台同时加载本地模型
- 本地热了就自动切回本地，之后不再用云

代价：云和本地两套模型的音色不完全一致（同参考音，CAM++ 相似度约 0.82–0.86），
**切换的那一句可能听得出差别**。作者的建议是先听一遍再决定要不要默认开。

---

## 8. 想在公网听（可选）

服务就是个普通 HTTP 后端，挂在 Cloudflare Tunnel 后面即可，不用改协议。

```yaml
# NAS 上的 ~/.cloudflared/config.yml
ingress:
  - hostname: tts.example.com
    service: http://192.168.1.54:8291   # 写 Mac 的局域网 IP，别写 127.0.0.1
  - service: http_status:404
```

```bash
cloudflared tunnel route dns <隧道名> tts.example.com
```

然后在「渲染设置 → 传输 → 对外地址」填 `https://tts.example.com`。
「交付」页会多出一个公网导入地址。

**务必加一层防护**，公网裸奔的 TTS 会被人扫：

1. URL 令牌（默认就有）；
2. Cloudflare Access 服务令牌 —— 建一个 Service Token，把 Client-Id / Client-Secret
   填进「传输 → 附加请求头」，它们会一起写进导出的引擎里：

```json
{
  "CF-Access-Client-Id": "xxxx.access",
  "CF-Access-Client-Secret": "yyyy"
}
```

> 坑：Legado 的「导入 URL」这一步**带不了自定义头**。挂了 Access 之后，
> 请在局域网里导入，或者用「交付」页的「复制 JSON」把配置直接粘进导入框。

---

## 9. 想 7×24 常驻（可选）

插件形态下，服务跟着 DSH 走——DSH 一退、Mac 一睡，手机就断了。两条路：

**A. 保持 Mac 不休眠**

```bash
caffeinate -s          # 前台挂着；或者去「节能」里关掉睡眠
```

**B. 把内核单独跑起来**（不依赖 DSH；纯 Node，NAS 也能跑——但本地引擎只支持 Mac）

```bash
node ~/dsh-plugins/audiobook-tts-plugin/mimo-tts/bin/audiobook-tts.mjs \
  --port 8291 --data ~/audiobook-tts-data
```

内核是零依赖纯 Node，`bin/audiobook-tts.mjs`（兼容别名 `bin/mimo-tts.mjs`）不 import 任何 DSH 的东西。
这种跑法下 DSH 只当控制台（插件仍然可以装，但别让它同时抢同一个端口）。

---

## 10. 文件都在哪

全新安装的数据目录默认在 `~/.dsh/plugin-data/audiobook-tts-plugin/`（如果检测到旧版 `~/.dsh/plugin-data/mimo-tts/` 目录已存在，会自动沿用旧目录）：

| 东西 | 路径 |
|---|---|
| 配置 | `<数据目录>/config.json` |
| 配置备份（上一版） | `config.json.bak` |
| 本地引擎参考音清单 | `<数据目录>/local-refs.json`（自动生成，别手改） |
| 本地引擎日志 | `<数据目录>/local-engine.log` |
| Python 虚拟环境 | `<数据目录>/venv` |
| 模型 | `<数据目录>/models/qwen3tts-0.6b-base-8bit` |
| 音频缓存 | **内存里**（默认上限 512 MB / 500 条 / TTL 2 小时），重启即清 |

`DSH_HOME` 改过的话，把上面的 `~/.dsh` 换成 `$DSH_HOME`。

**备份**：拷走 `config.json` 就够（里面有 Key 和令牌，别放云盘公开目录）。
**升级**：拿新版本的 `mimo-tts/` 覆盖旧目录，完全重启 DSH。`config.json` 不会被动。
**卸载**：从 profile 的 `package.json` 里删掉 `dependencies` 和 `bundles` 两处，
重启 DSH。数据目录可以留着，下次装回来配置还在。

---

## 11. 配置项速查

只想看默认值长什么样，看 [setup/config.example.json](setup/config.example.json)。
真正生效的是 `config.json`，而且**控制台改完立刻生效，不用重启**。

几个真正值得动的：

| 键 | 默认 | 什么时候动 |
|---|---|---|
| `server.port` | 8291 | 端口被占 |
| `synth.maxSegmentChars` | 100 | 调小 → 首音更快但请求更多（上游 100 RPM）；调大 → 省请求但首段更久。范围 10–300 |
| `synth.concurrency` | 4 | 撞 429 就降到 2 |
| `synth.stream` | false | **别开**，除非你能接受进度条失真 |
| `cache.maxEntries` | 500 | 听长书、内存紧就调小 |
| `upstream.local.idleUnloadSeconds` | 300 | 嫌反复冷启动就调大或设 0（常驻 2.3 GB） |
| `limits.rpm` | 100 | 上游限流比这个严时下调 |

环境变量（`MIMO_API_KEY` / `MIMO_TTS_PORT` / …）只在**首次启动、还没有 config.json** 时
当作种子。一旦配置文件存在，以文件为准——这是故意的，免得环境变量悄悄覆盖你在
控制台里的设置。
