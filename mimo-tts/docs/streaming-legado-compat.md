# Legado 真机流式兼容性（`synth.stream` / Issue #9）

> 当前默认策略：**`synth.stream` 默认保持 `false`**（整段合成并写入真实 WAV 字节长度）。  
> 如需为个人设备开启低延迟流式，可按本协议完成实机验证，或仅对特定书源 URL 追加 `?stream=1` 灰度试用。

---

## 1. 协议原理与已知差异

| 维度 | `synth.stream = false`（默认） | `synth.stream = true` |
|---|---|---|
| RIFF / data 块大小 | 真实音频总字节长度 | `0x7fffffff`（未知长度流式头） |
| 传输方式 | 一次性发送完整 WAV / MP3 | HTTP Chunked 分片直出首段 SSE PCM16，后续段并发追加 |
| TTFB（首包耗时） | 取决于整批段完成耗时 | `< 1s`（第 0 段首片即返回，仅 `preset` / `hybrid` 冷启动生效） |
| Android ExoPlayer / MediaPlayer | 时长、进度条、切章完全准确 | 部分 Android ROM / ExoPlayer 版本在遇到 `0x7fffffff` 时可能出现总时长显示异常、无法拖拽或尾音截断 |
| 有损压缩兼容（#2） | 支持 `wav` / `mp3` | **自动跳过流式**并回退整段转码（MP3/Opus 需完整封包） |

---

## 2. 本机 TTFB 压测对照命令

在启动本地服务后（默认端口 `8291`），用下面两组命令对照首包时间（`time_starttransfer`）：

```bash
# 关闭鉴权或替换 <TOKEN> 为你的令牌（仅限本机或局域网自测）
TOKEN="<YOUR_TOKEN>"
TEXT="山道上起了雾，他把灯举高了一点，风声里传来远处的钟鸣。"

# A. 整段合成对照（stream=0）
curl -s -o /dev/null -w "stream=0 code=%{http_code} ttfb=%{time_starttransfer}s total=%{time_total}s size=%{size_download}\n" \
  -X POST "http://127.0.0.1:8291/listening?token=${TOKEN}&stream=0" \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  --data-urlencode "text=${TEXT}"

# B. 真流式首包对照（stream=1，需 MiMo 预置音色或 Hybrid 冷启动）
curl -s -o /dev/null -w "stream=1 code=%{http_code} ttfb=%{time_starttransfer}s total=%{time_total}s size=%{size_download}\n" \
  -X POST "http://127.0.0.1:8291/listening?token=${TOKEN}&stream=1" \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  --data-urlencode "text=${TEXT}"
```

也可直接核对响应头前 44 字节的 WAV 长度标志：

```bash
curl -s -X POST "http://127.0.0.1:8291/listening?token=${TOKEN}&stream=1" \
  --data-urlencode "text=首包头验证。" | head -c 44 | od -tx1 -An
# 第 5~8 字节与第 41~44 字节为 ff ff ff 7f（小端 0x7fffffff）即表示流式头生效
```

---

## 3. Android Legado 真机验收清单

> ⚠️ 说明：本仓库自动化测试无法模拟真实 Android 设备 MediaPlayer / ExoPlayer 音频解码栈。升级默认值为 `true` 前，需由真机完成下表全部 4 项验证（可在 `/listening?stream=1` URL 上独立测试而不影响其他书源）。

| 检查项 | 操作步骤 | 预期结果 | 实测结论（待填） |
|---|---|---|---|
| **1. 能否出声** | 在 Legado 朗读引擎 URL 末尾临时加上 `&stream=1`（确保 `audio.format=wav`），连播 3 个短句 + 2 个长段（>120 字） | 首包 1 秒内开始发声，无静音/爆音/吞字 | ⬜ 待真机测试 |
| **2. 进度条与总时长** | 观察 Legado 朗读浮窗进度、自动下一段跳转及手工切章 | 不因 `0x7fffffff` 提前判定播放完成或卡死在段尾 | ⬜ 待真机测试 |
| **3. 后台与锁屏切段** | 息屏后连续听书 10 分钟（跨越至少 2 次自动锁屏/网络切换） | 后台 `ExoPlayer` 不因 chunked 流中断或报错停播 | ⬜ 待真机测试 |
| **4. 弱网 / 切本地恢复** | 在 4G/弱网或 `hybrid` 从云切本地的边界处连播多段 | 首段偶发失败写入 0.4s 静音后，后续段仍正常续播 | ⬜ 待真机测试 |

---

## 4. 安全灰度建议

- **推荐日常配置**：保持全局 `synth.stream = false`，搭配默认并发 `4` + 段落切分 `maxSegmentChars: 100`，整段首音通常也在 `0.8–1.5s` 内，且对所有 Android/iOS 阅读客户端 100% 稳定。
- **单书源试用流式**：无需修改全局开关，直接在某一条 Legado 朗读引擎地址里把 `/listening?token=...` 改为 `/listening?token=...&stream=1` 即可。
- **遇兼容问题一键退回**：如果某版本 Legado 出现吞尾或卡顿，去掉 `&stream=1` 或传 `&stream=0` 即可立即恢复标准定长 WAV。
