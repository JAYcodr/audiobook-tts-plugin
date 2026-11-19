---
name: audiobook-tts-config
description: 读写「听书值守」（audiobook-tts-plugin）配置时用。走 `audiobook-tts config` CLI，自动完成路径校验、密钥脱敏、原子落盘与热更新；不要手写 config.json。
---

# 听书值守 · 配置 CLI

改这个插件的配置，**只走 CLI**。原因：`config.json` 有 13 个顶层键、40 多条校验规则，
密钥字段还带掩码还原；手写 JSON 会踩「格式错 / 校验被拒 / 改完不生效」三个坑。

入口（任选，参数相同）：

```bash
audiobook-tts config <命令> ...          # 已 npm link / 包装入口时
node mimo-tts/bin/config.mjs <命令> ...  # 从仓库直接跑
```

数据目录默认取 DSH 插件数据目录；独立部署时显式传 `--data <目录>`。
所有命令都支持 `--json`；退出码：`0` 成功、`1` 一般错误、`2` 校验失败、`3` 已写文件但热更新失败。

## 五条常见任务

**1. 换引擎（MiMo / 本地 / 混合 / OpenAI 兼容）**

```bash
audiobook-tts config set upstream.provider hybrid --json
audiobook-tts config get upstream.provider
```

本地引擎还要有 `upstream.local.pythonPath` / `modelPath` 和参考音；缺什么先跑 `doctor`。

**2. 开对外 OpenAI 兼容端点**

```bash
audiobook-tts config set openaiServer.enabled true
audiobook-tts config set openaiServer.apiKey "sk-新密钥"
```

密钥字段可以传新值，也可以传控制台回显的掩码（CLI 会还原成原值，不会把 `sk-abc…wxyz` 写进配置）。

**3. 调切分与压缩**

```bash
audiobook-tts config set synth.maxSegmentChars 120
audiobook-tts config set synth.concurrency 6
```

改完如果服务在跑，CLI 会 `PUT /api/config` 热更新；输出「已热更新」才算生效，
输出「已写文件，需重启」时重启听书服务。

**4. 导出 / 迁移**

```bash
audiobook-tts config export ./tts-config.json          # 默认脱敏
audiobook-tts config import ./tts-config.json --dry-run # 先看差异
audiobook-tts config import ./tts-config.json
```

`export` 默认把 Key / token / 口令换成掩码；只有显式 `--include-secrets` 才写明文（会在 stderr 警告）。
导入的脱敏文件可以安全回填：掩码会按当前配置还原，不会变成新密钥。

**5. 体检**

```bash
audiobook-tts config doctor --json | python3 -m json.tool
```

检查项：配置可解析 / 校验通过 / 是否落后于默认结构 / 数据目录可写 / 端口与 `/health` /
本地引擎 venv 与声码器权重 / ffmpeg / cloudflared 等公网工具。`ok:false` 表示有 fail 项。

## 别手写 config.json

- 数组（`upstream.keys`、`voiceProfiles.items`）必须整段替换，`set upstream.keys.0 …` 会保留其余元素；
- 密钥字段的掩码不是值，手写会被拒绝或还原成旧值；
- 直接改文件不会触发 `/api/config` 热更新，运行中的服务仍用旧内存配置。
