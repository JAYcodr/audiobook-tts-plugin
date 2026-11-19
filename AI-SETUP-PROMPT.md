# 发给 AI 的安装指令

> 用法：把下面两条「---」之间的内容**整段复制**，发给你 DSH 里的 AI。
> 压缩包已经解压在本地了，告诉它路径（或者让它自己找）。
> 它会问你两件事：走云端还是本地、MiMo Key 是多少。

---

我在装一个本地插件「听书值守」（`@local/mimo-tts` 0.2.0），它把 MiMo TTS 包成一个给
Legado（阅读 App）用的在线朗读服务。压缩包已经解压到我电脑上了，目录名是
`mimo-tts`（里面同时有 `INSTALL.md` / `TROUBLESHOOTING.md` / `mimo-tts/`）。
你找不到就先在我常用的下载目录和 `~/dsh-plugins` 下搜一下。

请按顺序做，**每完成一步告诉我结果**（成功/失败 + 关键输出），不要跳步，不要顺手动别的插件。

## 铁律

- 不要改我的模型配置、不要动别的插件、不要 `pnpm update` 整个 profile。
- 不要自己编 Key。没有 Key 就停下来问我。
- 安装/写文件需要授权时，直接弹给我确认，别自己绕过。
- 每一步都有验证命令，验证不过就停在那一步，把报错原样贴给我。

## 第 1 步：把插件放到固定目录

插件是按**绝对路径**以 `link:` 方式装进 DSH 的，所以目录不能放在会被清理的地方
（别放下载目录、别放 iCloud 同步目录）。

```bash
mkdir -p ~/dsh-plugins
# 把整个 mimo-tts 挪进来（整包别拆），然后确认：
ls ~/dsh-plugins/mimo-tts/mimo-tts/package.json
```

**验证**：`package.json` 里有 `"name": "@local/mimo-tts"`。

## 第 2 步：确认 DSH 版本

```bash
dsh --version
```

需要 0.2.x 或更高。低于这个版本就停下告诉我。

## 第 3 步：装进 profile

优先用宿主工具：

> `plugin_manager` → `action: "install_bundle"`，`target` 填 `~/dsh-plugins/mimo-tts/mimo-tts` 的**绝对路径**。

它会做两件事：把 `@local/mimo-tts` 写进 profile 依赖（`link:` 形式），并加进
`dsh.profile.bundles`。如果它报错、或者装完 `bundles` 里没有这一项，用兜底方案：

```bash
ls ~/.dsh/profiles            # 确认 profile 名，通常是 desktop 或 web
dsh plugin --profile desktop add link:$HOME/dsh-plugins/mimo-tts/mimo-tts
```

然后手工编辑 `~/.dsh/profiles/desktop/package.json`，在 `dsh.profile.bundles` 数组里
加一行 `"@local/mimo-tts"`（放在已有条目后面即可，JSON 别写坏）。

**验证**：

```bash
grep -n "mimo-tts" ~/.dsh/profiles/desktop/package.json
```

必须能看到**两处**：`dependencies` 里的 `link:`，和 `bundles` 里的包名。
只有一处 = 没装全，服务不会启动。

## 第 4 步：重启 DSH，确认服务起来

装完必须**完全重启**（桌面端连托盘一起退；`dsh web` 重启进程）。重启后：

```bash
curl -s http://127.0.0.1:8291/health
```

期望：`"status":"ok"` 且 `"running":true`。

- 连不上 → 端口可能不是 8291（看 `~/.dsh/plugin-data/mimo-tts/config.json` 的
  `server.port`），或者插件没加载成功（看 DSH 日志里有没有 `[mimo-tts]`）。
- 端口被别的程序占着 → 让我改端口，别自己乱杀进程。

再验证一次宿主路由（地址用宿主 Web GUI 的，一般在你系统提示里）：

```bash
curl -s http://127.0.0.1:<GUI端口>/mimo-tts/api/state | head -c 300
```

能返回 JSON（含 `service` / `config` / `import`）就说明宿主半边也挂上了。

## 第 5 步：问我两个问题，然后配置

**先问，别猜：**

1. 「你要云端 MiMo（5 分钟，需要 `sk-` 开头的 Key）还是本地 Qwen3-TTS（macOS M 系列，
   要下 1.9 GB 模型）？两个都要也行，可以开混合。」
2. 如果选云端：「MiMo 的 API Key 是多少？没有的话去
   https://platform.xiaomimimo.com/#/console/api-keys 建一个（`sk-` 开头，只显示一次）。」

拿到 Key 之后，用宿主路由写入（**不要**把 Key 打日志、不要写进任何会提交的文件）：

```bash
curl -s -X PUT http://127.0.0.1:<GUI端口>/mimo-tts/api/config \
  -H 'Content-Type: application/json' \
  -d '{"upstream":{"provider":"mimo","keys":["sk-你的key"]}}'
```

然后让服务重载：

```bash
curl -s -X POST http://127.0.0.1:<GUI端口>/mimo-tts/api/service \
  -H 'Content-Type: application/json' -d '{"action":"restart"}' >/dev/null
```

**验证**（试听一句，会真的调上游、会产生费用/额度，先告诉我再跑）：

```bash
curl -s -X POST http://127.0.0.1:<GUI端口>/mimo-tts/api/preview \
  -H 'Content-Type: application/json' \
  -d '{"text":"山道上起了雾。","role":"narrator"}' -o /tmp/preview.wav -w '%{http_code} %{size_download}\n'
file /tmp/preview.wav     # 应该是 RIFF ... WAVE audio
```

`200` + 几十 KB = 云端通了。`401/403` = Key 不对（注意 `sk-` 和 `tp-` 两种 Key 的
baseUrl 不一样，`tp-` 要改成 `https://token-plan-cn.xiaomimimo.com/v1`）。

## 第 6 步（只有在我要本地引擎时）：装模型

```bash
cd ~/dsh-plugins/mimo-tts    # 或者包解压在哪就去哪
HF_ENDPOINT=https://hf-mirror.com ./setup/install-local-engine.sh
```

这一步要 20–40 分钟，跑的时候告诉我进度，别静默等。跑完它会打印三条路径
（Python / 模型目录 / 参考音），把这三条原样贴给我。

**必查**（这条最容易漏）：

```bash
ls -lh ~/.dsh/plugin-data/mimo-tts/models/qwen3tts-0.6b-base-8bit/speech_tokenizer/model.safetensors
```

必须是 600 MB 以上。缺了它不会报错，合成出来全是噪声。

然后把路径写进配置（参考音文本从包里的 `refs/README.md` 抄，**一个字都不能改**）：

```bash
curl -s -X PUT http://127.0.0.1:<GUI端口>/mimo-tts/api/config \
  -H 'Content-Type: application/json' -d '{
  "upstream":{"provider":"local","local":{
    "pythonPath":"/Users/你/.dsh/plugin-data/mimo-tts/venv/bin/python",
    "modelPath":"/Users/你/.dsh/plugin-data/mimo-tts/models/qwen3tts-0.6b-base-8bit",
    "refs":{
      "narrator":{"wav":"/绝对路径/refs/narrator-14s.wav","text":"我能隐隐约约感觉到，你和我一样，都有想要守护的东西……是那种，一步都不能退让，用尽一切办法都要守护的东西。"}
    }}}}'
```

第一次试听会等 **10–15 秒**（拉进程 + 加载模型 + MLX 编译），这是正常的。
第二次开始 3–6 秒。

## 第 7 步：给我接入地址

```bash
curl -s http://127.0.0.1:<GUI端口>/mimo-tts/api/state \
  | python3 -c 'import json,sys;d=json.load(sys.stdin);print(d["import"])'
```

把 `jsonUrl` 原样给我——我拿去手机上的 Legado 导入。里面带 `token`，别发群里。

## 第 8 步：汇报

最后给我一张表：

| 项 | 结果 |
|---|---|
| 插件装没装进 profile（两处都写了吗） | |
| 服务在跑吗（health / 端口） | |
| 引擎：云端 / 本地 / 混合 | |
| 试听通了吗（HTTP 码 + 文件大小） | |
| 本地模型：下没下、声码器权重多大 | |
| 给我接入：局域网地址 / 公网地址 | |
| 需要我补什么配置 | |

如果中途卡住，把 `INSTALL.md` 和 `TROUBLESHOOTING.md` 里对应那一节读一遍再动手——
这两个文件是跟着这个包一起发的，不要凭印象修。

---

## 附：我这边可能的追问

- **「侧栏没有听书值守」**：多半是 `bundles` 没加，或者没完全重启。
- **「能出声但不动进度」**：`synth.stream` 被打开了，改回 `false`。
- **「声音是噪声」**：本地引擎声码器权重缺失，见第 6 步。
- **「手机连不上」**：电脑和手机不在同一网段，或者地址是 `198.18.x.x`（代理 TUN 网段）。
