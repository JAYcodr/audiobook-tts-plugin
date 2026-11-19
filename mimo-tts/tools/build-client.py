#!/usr/bin/env python3
"""
把 src/deck.css（从 docs/redesign/d2-timeline.html 机械搬迁的 .mtt 作用域样式）
注入 client.template.js，生成最终交给 DSH 的 client.js。

为什么有这一步：插件浏览器半边是**单文件**（ModuleLoader 只加载一个模块），
而样式有 50KB+，直接手贴在源码里没法维护。模板里留一个 /*__CSS__*/ 占位，
构建时替换掉即可 —— 产物仍是单文件，运行时零依赖、零外部请求。

面板不是整页：mock 的 body/html 假设已经由 deck.css 收进 .mtt 作用域，
这里只补「撑满面板 + 让出窗口 chrome」的适配（ADAPT），
插在 deck.css 末尾的 /*__panel_adapt__*/ 标记处。
"""
import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent

# 面板不是视口：撑满 + 让出窗口 chrome + toast 固定在视口
ADAPT = """
.mtt{box-sizing:border-box;height:100%;min-height:0;padding-top:var(--dsh-frame-top-clearance,0px);background:var(--panel);position:relative;overflow:hidden}
/* deck 的隐式列默认按 max-content 撑（整页时无所谓，面板里会被拖窄）：钉成 1fr，允许内部收缩 */
.mtt .deck{height:100%;grid-template-columns:minmax(0,1fr)}
.mtt .bench,.mtt .view{min-width:0}
.mtt .arch-main{grid-template-columns:minmax(0,1fr)}
.mtt .toast{position:fixed}
"""


def main() -> None:
    tpl = (ROOT / 'client.template.js').read_text(encoding='utf-8')
    css = (ROOT / 'src' / 'deck.css').read_text(encoding='utf-8')

    # deck.css 末尾留给构建的适配占位；没有就追加（保持向后兼容）
    if '/*__panel_adapt__*/' in css:
        css = css.replace('/*__panel_adapt__*/', ADAPT)
    else:
        css += ADAPT

    if '`' in css or '${' in css:
        raise SystemExit('CSS 里出现了反引号或 ${，会截断模板字符串，先转义')
    if '/*__CSS__*/' not in tpl:
        raise SystemExit('模板里找不到 /*__CSS__*/ 占位符')

    out = tpl.replace('/*__CSS__*/', css)
    (ROOT / 'client.js').write_text(out, encoding='utf-8')
    print(f'client.js: {len(out)} bytes ({len(css)} 字节样式，deck.css {len((ROOT / "src" / "deck.css").read_text(encoding="utf-8"))} 字节)')


if __name__ == '__main__':
    sys.exit(main())
