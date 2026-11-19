# 听书值守 · 双端 TTS 插件

给「阅读」(Legado) 用的在线听书服务。**本地 Qwen3-TTS 是主引擎，MiMo 云端是辅助/兜底**，两端共用同一套控制台和交付流程。装进 DSH 之后，侧栏会出现一个「听书值守」控制台：
时间线、渲染设置、工程史、交付四个页签，就是一台剪辑台。手机上的 Legado 导入一个地址，
就能把整本书读出来——旁白和对话自动分音色，每段返回长度正确的 WAV，所以进度条和自动翻页不会错位。

> 版本：`@local/mimo-tts` 0.2.0 · 打包日期 2026-11-18
> 原作者环境：macOS（Mac mini M4）· DSH 0.2.2-rc.3
> 这个包**不含任何密钥**，也**不含模型权重**。原因见下。

---

## 先决定：你要哪种引擎

| | 本地 Qwen3-TTS（主） | 云端 MiMo（辅） |
|---|---|---|
| 要什么 | macOS Apple Silicon + 下载 1.9 GB 模型 | 一个小米 MiMo API Key（`sk-` 开头） |
| 装多久 | 20–40 分钟（看网速） | **5 分钟** |
| 花钱 | 免费，只吃电 | 目前官方限时免费，之后按量计费（很便宜） |
| 首段延迟 | 冷启动 ~12 秒，之后 3–6 秒/段 | 1.2–7 秒 |
| 内存 | 常驻 2.27 GB（空闲自动卸载） | 几乎不占 |
| 平台 | **只有 macOS Apple Silicon** | macOS / Windows / Linux 都行 |
| 音色 | 用参考音克隆，无风格指令 | 9 个内置音色；用参考音克隆（混合模式） |

**建议：本地为主。** 有 Apple Silicon 的机器直接装本地引擎，免费、离线、隐私握在自己手里。
云端适合 Windows/Linux 机器，或者想先十分钟听个响的场合。两条路可以同时开（`hybrid` 混合启动），
本地挂了云端自动接，反过来也行。

---

## 仓里有什么

```
.
├── README.md                 ← 你正在看的这页
├── INSTALL.md                ← 完整初始化引导（照着做就行）
├── TROUBLESHOOTING.md        ← 常见问题：症状 → 原因 → 处理
├── AI-SETUP-PROMPT.md        ← 整段发给 DSH 里的 AI，让它替你装
├── mimo-tts/                 ← 插件本体（DSH 插件，也自带独立服务入口）
│   ├── index.js              宿主半边
│   ├── client.js             控制台（浏览器半边）
│   ├── src/                  内核：切分 / WAV / 上游 / 缓存 / 限流
│   ├── sidecar/              本地 Qwen3-TTS 的 Python 边车
│   ├── docs/                 四张控制台截图
│   └── bench/REPORT.md       本地引擎实测报告（RTF、延迟、内存）
├── refs/                     ← 参考音频（给本地引擎 / 云端克隆用）
│   ├── narrator-14s.wav      14.2 s · 44100 Hz · 单声道 16 bit
│   ├── narrator-10s.wav      10.0 s
│   ├── narrator-5s.wav        5.0 s
│   └── README.md             逐字文本 + 怎么用
└── setup/
    ├── download-model.sh     只下模型（支持 hf-mirror 镜像）
    ├── install-local-engine.sh  建 venv + 装 mlx-audio + 下模型 + 自检
    ├── check-env.sh          体检：端口 / 模型 / 参考音 / health
    ├── README-model.md       模型下载失败时的手动办法
    └── config.example.json   配置文件长什么样（不用手抄）
```

仓库根就是包体，clone 下来直接用。`mimo-tts/` 是干净的源码，可以直接装进 DSH，也可以脱离 DSH 用
`node mimo-tts/bin/mimo-tts.mjs` 单独跑在 NAS 上。

---

## 备选：五分钟云端快路径

> 主路径是本地引擎（见 [INSTALL.md](INSTALL.md)）。这一节只求解「先听个响」或者没有 Apple Silicon 的机器。

1. 去 <https://platform.xiaomimimo.com/#/console/api-keys> 注册，建一个 API Key（`sk-` 开头，只显示一次，存好）。
2. 把仓库 clone 到固定目录（以后不挪、不删）：`git clone https://github.com/JAYcodr/audiobook-tts-plugin.git ~/dsh-plugins/audiobook-tts-plugin`。
   装进 DSH 的是仓库里的 `mimo-tts/` 子目录；整包别拆（`setup/` 要靠它找 `refs/`）。
3. 在 DSH 里说一句：「用 plugin_manager 的 install_bundle 安装
   `~/dsh-plugins/audiobook-tts-plugin/mimo-tts`」。
4. **完全退出** DSH 再打开（macOS 要连托盘一起退）。
5. 左栏点「听书值守」→「渲染设置」→ 引擎「渲染来源」选**云端** →
   「传输」里填 API Key → 保存。
6. 「交付」页复制导入地址 → 手机 Legado：朗读 → 在线朗读 → 右上角导入 → 粘贴。
7. 阅读里选「MiMo TTS 听书」，开听。

细节、报错、验证方式在 [INSTALL.md](INSTALL.md)。

---

## 为什么包里没有密钥和模型

- **密钥**：这个东西能直接花你的钱、读你的额度。打包里只留占位符，谁的 Key 谁自己建。
  作者不会把 Key 写进任何要发出去的包里。
- **模型**：`Qwen3-TTS-12Hz-0.6B-Base-8bit` 是 1.9 GB，塞进包里会变成一个 2 GB 的压缩包，
  微信/邮件都传不动。`setup/install-local-engine.sh` 会帮你下，并且自带国内镜像回退。

---

## 装完的验收清单

- [ ] 侧栏有「听书值守」，点开不是空白
- [ ] 时间线上「服务」是 RUN（不是 STOP）
- [ ] `curl -s localhost:8291/health` 返回 JSON
- [ ] 「交付」页能拿到导入地址，地址里带 `?token=`
- [ ] Legado 导入成功，引擎列表出现「MiMo TTS 听书」
- [ ] 播放一段，进度条会走、长段落能自动翻页
- [ ] 断网测试：服务还在（只是合成会失败），说明是本地服务不是云中转

七条全过，这包就算装完了。任何一条不对，去 [TROUBLESHOOTING.md](TROUBLESHOOTING.md) 按症状查。
