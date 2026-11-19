#!/usr/bin/env node
/**
 * 配置 CLI 独立入口：`node bin/config.mjs config get upstream.provider --json`。
 *
 * 允许省略开头的 `config`（`node bin/config.mjs get ...`），也允许 `audiobook-tts config ...`。
 * 全部实现与 DSH 工具共用 src/config-cli.mjs。
 */
import { runConfigCli } from '../src/config-cli.mjs'

const argv = process.argv.slice(2)
const args = argv[0] === 'config' ? argv.slice(1) : argv
process.exitCode = await runConfigCli(args)
