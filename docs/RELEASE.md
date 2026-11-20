# 发布与更新流程（维护者）

这份文档写给维护者：把 `mimo-tts/` 发到 npm，并让装了插件的 DSH 更新到新版本。
普通用户只需要看 [INSTALL.md](../INSTALL.md) 的「从 npm 安装」。

---

## 0. 前置条件

- npm 账号已登录（`npm whoami --registry=https://registry.npmjs.org/` 有输出）
- 账号已开启 **2FA**（`auth-and-writes`）。npm 现在强制要求开启 2FA 才能发布
- 本机 npm 默认 registry 可能是 npmmirror 镜像：**发布、安装都要显式带官方源**

```bash
npm config get registry          # 如果输出 https://registry.npmmirror.com，就是镜像
npm whoami --registry=https://registry.npmjs.org/
```

## 1. 改版本号

三处必须同步：

1. `mimo-tts/package.json` → `"version"`
2. `mimo-tts/src/service.mjs` → `export const VERSION`
3. `CHANGELOG.md` 增加对应条目（日期 + 新增 / 修复 / 变更）

> 版本号一旦发布就不能复用；staged 队列里也不允许同版本重复提交。

## 2. 发布前检查

```bash
npm --prefix mimo-tts run check
```

必须全绿：ESLint 0 错、secret scan 0、`client.js` 重新构建、测试全过。
另外建议确认打包内容没有把密钥、数据目录、`node_modules` 带进去：

```bash
cd mimo-tts
npm pack --dry-run
```

> `bin` 路径不要写 `./` 前缀。npm 11.12.1 在发布时会把它判为 invalid 并**静默删掉**
> `bin` 映射（0.5.1 踩过这个坑），正确写法是 `"bin/audiobook-tts.mjs"`。

## 3. 提交并推送

```bash
git add -A
git commit -m "[文档] 发布 0.5.2"   # 提交信息按仓库惯例
git push origin main
```

## 4. 发布到 npm（必须在真实 TTY 里跑）

```bash
cd mimo-tts
npm publish --registry=https://registry.npmjs.org/
```

- 命令会打印一个 `https://www.npmjs.com/auth/cli/...` 授权链接，按回车打开浏览器，用维护者账号确认
- 新包 / 新版本会走 **staged publishing**：注册表先出现 `0.0.0-stage` 占位版本，真正的版本稍后自动放行
- **放行延迟实测可达 9 分钟**（2026-11-20 发 0.6.0：`exit 0` 后查询该版本一直是 404，
  约 9 分钟后才出现）。这期间 `npm view` / `/latest` / tarball URL 全部 404，**不要误判为发布失败**，
  更不要换版本号重发——会撞 409
- 若网页提示待批准：登录 npmjs.com → **Staged Packages** → 找到版本 → Approve（要 2FA）
- 终止信号：`+ audiobook-tts-plugin@0.5.2`

## 5. 验证

```bash
npm view audiobook-tts-plugin versions dist-tags --prefer-online --registry=https://registry.npmjs.org/
npm view audiobook-tts-plugin@0.5.2 bin --registry=https://registry.npmjs.org/
```

- `versions` 里要有新版本，`dist-tags.latest` 指向它
- `bin` 里要有 `audiobook-tts` 和 `mimo-tts`，路径不带 `./`

## 6. 更新 DSH 里的插件

> ⚠️ **跨 minor 版本（0.5 → 0.6）时 `update` 不生效。**
>
> profile 的 `package.json` 里记的是 `"audiobook-tts-plugin": "^0.5.2"`，而 `^0.5.2` 等价于
> `>=0.5.2 <0.6.0`——`0.6.0` 不在范围内，pnpm 判定「已满足」直接跳过，输出 `Done` 但版本没变。
> 这是 0.x 的语义化规则，不是 pnpm 的 bug。
>
> 跨 minor 必须显式指定：
>
> ```bash
> dsh plugin --profile desktop add audiobook-tts-plugin@^0.6.0 --registry=https://registry.npmjs.org/
> ```
>
> 同一 minor 内的补丁版本（0.6.0 → 0.6.1）用 `update` 就行。

```bash
dsh plugin --profile desktop update audiobook-tts-plugin --registry=https://registry.npmjs.org/
```

> 加了 `--registry` 是因为 pnpm 也读 `~/.npmrc` 的镜像配置；镜像同步新版本可能滞后。
> profile 名按实际环境替换（`desktop` / `web` / `tui`）。

然后**完全退出并重启 DSH**。

> 只禁用/启用插件不够：宿主进程会缓存已加载的 ESM 模块，重载后 `health.version`
> 可能还是旧版本；必须重启应用（macOS 上托盘图标也要退）。

验证：

```bash
curl -s http://127.0.0.1:8292/health
```

`version` 应变成新版本；`audiobook_tts_config doctor` 应返回 `ok: true`。

## 7. 回滚

- **只回滚某台机器**：`dsh plugin --profile desktop add audiobook-tts-plugin@0.5.1`，再重载
- **npm 上撤销**：发布 72 小时内可在 npmjs.com 包页面 unpublish 该版本；超过 72 小时只能发新补丁版本
- 不要把 `latest` 标签手动指回旧版本当作回滚——DSH 的 `^0.5.x` 范围会继续装到新版本

## 常见问题

| 现象 | 原因 | 处理 |
|---|---|---|
| `403 ... Two-factor authentication ... required` | 账号没开 2FA | 开 2FA（auth-and-writes）后重发 |
| `404` / 安装时报 `ETARGET` | 版本还在 staged 队列 | 等 1–2 分钟，或去 Staged Packages 批准 |
| `409 Cannot publish over previously staged version` | 同版本已在 staged 队列 | 换版本号重发 |
| `npm view` 只看到 `0.0.0-stage` | 新包占位版本，正常 | 等自动放行；用 `--prefer-online` 复查 |
| 安装到了空壳（没有代码） | 在 staged 放行前就安装了占位版本 | 等 `latest` 指向真实版本后重装 |
| `bin` 命令不见了 | `bin` 路径带了 `./` 被 npm 删掉 | 去掉 `./` 后发新补丁版本 |
| `update` 输出 `Done`，但版本没变 | 跨 minor，`^0.5.x` 不含 `0.6.0` | 用 `add audiobook-tts-plugin@^0.6.0` 显式装 |
| 刚发完就 `npm view` 查不到新版本 | 后处理延迟（实测可达 9 分钟） | 等；别换版本号重发，会 409 |

## 首次发布备忘（已完成）

- 包名 `audiobook-tts-plugin` 于 2026-11-20 首次发布 0.5.1，npm 自动创建了 `0.0.0-stage` 占位版本，属正常现象
- 维护者：`jaycodr`；首次发布会触发 npm 的 staged 流程并自动放行
