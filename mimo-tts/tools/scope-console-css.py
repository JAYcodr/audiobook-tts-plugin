#!/usr/bin/env python3
"""
把 mimo-listen-console 的样式收进 .mtt 作用域。

控制台的材质（走纸槽、孔边、格线、红笔批注）是设计的主体，重写一遍只会丢细节，
所以这里做的是**机械搬迁**：把源页面 <style> 里的每条规则原样取出，只改三件事：

  1. 每条选择器前面加 `.mtt `，`:root` / `html` / `body` 映射成 `.mtt`，
     全局 reset `*` 收敛成 `.mtt *`；
  2. `@keyframes` 改名成 `mtt-*`，`animation` 引用一起改（避免污染宿主页面）；
  3. `100dvh` → `100%`（面板不是视口）。

用法：
    python3 tools/scope-console-css.py ../mimo-listen-console/index.html src/console.css
"""
import re
import sys


def extract_style(html: str) -> str:
    m = re.search(r'<style>(.*?)</style>', html, re.S)
    if not m:
        raise SystemExit('源文件里没有 <style>')
    return m.group(1)


def prefix_selector(sel: str) -> str:
    sel = sel.strip()
    if not sel:
        return sel
    if ',' in sel:
        return ', '.join(prefix_selector(p) for p in sel.split(','))
    if sel == ':root':
        return '.mtt'
    if sel in ('html, body', 'html,body', 'body', 'html'):
        return '.mtt'
    if sel.startswith('*'):
        return '.mtt ' + sel
    if sel.startswith('.mtt'):
        return sel
    return '.mtt ' + sel


def process_block(text: str) -> str:
    out, i, n = [], 0, len(text)
    while i < n:
        j = text.find('{', i)
        if j == -1:
            out.append(text[i:])
            break
        head = text[i:j]
        depth, k = 1, j + 1
        while k < n and depth:
            if text[k] == '{':
                depth += 1
            elif text[k] == '}':
                depth -= 1
            k += 1
        body = text[j + 1:k - 1]
        stripped = head.strip()
        at = re.match(r'@([a-zA-Z-]+)', stripped)
        if at and at.group(1) in ('media', 'supports'):
            out.append(head + '{' + process_block(body) + '}')
        elif at and at.group(1) == 'keyframes':
            name = stripped.split()[1]
            out.append('@keyframes mtt-' + name + '{' + body.strip() + '}')
        elif stripped:
            out.append(prefix_selector(stripped) + '{' + body.strip() + '}')
        i = k
    return ''.join(out)


def main() -> None:
    src_html = sys.argv[1] if len(sys.argv) > 1 else '../mimo-listen-console/index.html'
    dst = sys.argv[2] if len(sys.argv) > 2 else 'src/console.css'
    css = extract_style(open(src_html, encoding='utf-8').read())
    css = re.sub(r'/\*.*?\*/', '', css, flags=re.S)
    css = process_block(css)
    for name in ('pulse', 'blink', 'ink'):
        css = re.sub(r'animation([^;{}]*?)\b' + name + r'\b',
                     lambda m: 'animation' + m.group(1) + 'mtt-' + name, css)
    css = css.replace('100dvh', '100%')
    css = re.sub(r'\n{2,}', '\n', css)
    open(dst, 'w', encoding='utf-8').write(css)
    print(f'{dst}: {len(css)} bytes, {css.count(".mtt")} 处作用域')


if __name__ == '__main__':
    main()
