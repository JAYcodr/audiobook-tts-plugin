#!/usr/bin/env node
/**
 * 使用 esbuild 将 client/ 下的模块化 React 组件与样式打包为单文件 client.js，
 * 外层包裹 DSH window.__ModuleLoader__.load({ id, factory })，保证运行时零外部请求。
 */
import { writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { build } from 'esbuild'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const ENTRY = resolve(ROOT, 'client/index.jsx')
const OUT = resolve(ROOT, 'client.js')
const BUNDLE_ID = 'audiobook-tts-plugin'

const result = await build({
  entryPoints: [ENTRY],
  bundle: true,
  write: false,
  format: 'cjs',
  platform: 'browser',
  target: ['es2022'],
  jsx: 'transform',
  jsxFactory: 'React.createElement',
  jsxFragment: 'React.Fragment',
  external: ['react'],
  loader: { '.css': 'text' },
  legalComments: 'none',
})

const bundledCode = result.outputFiles[0].text
const wrapped = [
  '/*',
  ' * 自动生成文件，请勿直接编辑；源码位于 client/，运行 `npm run build:client` 重新构建。',
  ' */',
  'window.__ModuleLoader__.load({',
  `  id: '${BUNDLE_ID}',`,
  '  factory(require) {',
  '    const module = { exports: {} }',
  '    const exports = module.exports',
  bundledCode,
  '    return module.exports.default || module.exports',
  '  },',
  '})',
  '',
].join('\n')

writeFileSync(OUT, wrapped, 'utf8')
console.log(`client.js built: ${Buffer.byteLength(wrapped, 'utf8')} bytes`)
