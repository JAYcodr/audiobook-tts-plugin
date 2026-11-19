/**
 * MiMo TTS 听书 · 浏览器半边 —— D2 多轨·剪辑台控制台
 *
 * 视觉与交互的 source of truth：docs/redesign/d2-timeline.html（多轨剪辑台）。
 * 这里把它移植进插件面板：DOM 结构与 class 名尽量 1:1，命令式的 renderAll 换成
 * React state；数据全部来自宿主半边的真实接口，不掺 mock 场景数据：
 *
 *   GET  /mimo-tts/api/state                    每 4s 轮询（document.hidden 时跳过）
 *   POST /mimo-tts/api/service {action}         启停 / 重启
 *   POST /mimo-tts/api/local   {action}         本地模型加载 / 卸载
 *   PUT  /mimo-tts/api/config  {嵌套 patch}     保存草稿（422 时 toast 服务端问题清单）
 *
 * 插件外壳保留：window.__ModuleLoader__.load({ id, factory })、PanelGlyph、
 * slots 的 main / sidebar.panellist 注册（label 仍为「听书值守」）。
 * 样式是构建期注入的单文件 CSS（src/deck.css → /*__CSS__*​/），运行时零外部请求。
 */
window.__ModuleLoader__.load({
  id: '@local/mimo-tts',
  factory(require) {
    const React = require('react')
    const h = React.createElement
    const { useState, useEffect, useRef, useMemo, useCallback } = React

    const PANEL_ID = 'mimo-tts'
    const API = '/mimo-tts/api'
    const CSS = `.mtt{--panel:#e8e4d9;        
  --panel-2:#f0ece3;      
  --panel-3:#e2ddd1;      
  --well:#d7d1c1;         
  --well-2:#cfc8b6;
  --ink:#242a26;          
  --ink-2:#4b524c;
  --ink-3:#5d645e;
  --line:#c9c3b3;
  --line-2:#aaa492;
  --tape:#1f3b33;         
  --tape-2:#2b5145;
  --tape-3:#3a6a59;
  --grease:#b13a22;       
  --grease-soft:rgba(177,58,34,.14);
  --cloud:#4a585e;        
  --led:#2e7a50;
  --led-off:#71776f;
  --r:2px;
  --sans:-apple-system,BlinkMacSystemFont,"PingFang SC","Hiragino Sans GB","Microsoft YaHei",system-ui,sans-serif;
  --mono:ui-monospace,"SF Mono","SFMono-Regular",Menlo,Consolas,"Liberation Mono",monospace;}.mtt *, .mtt *::before, .mtt *::after{box-sizing:border-box}.mtt, .mtt{height:100%}.mtt{margin:0;background:var(--panel);color:var(--ink);
  font:12.5px/1.5 var(--sans);
  -webkit-font-smoothing:antialiased;
  overflow:hidden;}.mtt button, .mtt input, .mtt textarea, .mtt select{font:inherit;color:inherit}.mtt button{all:unset;box-sizing:border-box}.mtt :focus-visible{outline:2px solid var(--grease);outline-offset:2px}.mtt .clip:focus-visible, .mtt .viewkey:focus-visible, .mtt .key:focus-visible, .mtt .knob:focus-visible{outline-offset:1px}.mtt ::selection{background:var(--grease-soft)}.mtt .silk{font:11px/1 var(--mono);letter-spacing:.12em;text-transform:uppercase;color:var(--ink-3)}.mtt .silk b{color:var(--ink-2);font-weight:600}.mtt .cn{font-size:11.5px;color:var(--ink-2)}.mtt .mono{font-family:var(--mono);font-variant-numeric:tabular-nums}.mtt .num{font-family:var(--mono);font-variant-numeric:tabular-nums}.mtt .muted{color:var(--ink-3)}.mtt .hide{display:none !important}.mtt .deck{height:100%;display:grid;grid-template-rows:auto minmax(0,1fr) auto;background:var(--panel);}.mtt .transport{background:var(--panel-2);border-bottom:1px solid var(--line-2);box-shadow:inset 0 -1px 0 rgba(255,255,255,.5);position:relative;z-index:5}.mtt .tp-bar{display:flex;align-items:stretch;height:58px;padding:0 14px}.mtt .tp-cell{display:flex;align-items:center;gap:10px;padding:0 14px;border-left:1px solid var(--line)}.mtt .tp-cell:first-child{border-left:0;padding-left:0}.mtt .plate{display:flex;align-items:center;gap:9px;background:var(--ink);color:var(--panel-2);padding:6px 12px 6px 9px;border-radius:var(--r);min-width:222px;box-shadow:inset 0 1px 0 rgba(255,255,255,.12),0 1px 0 rgba(0,0,0,.2)}.mtt .reel{width:32px;height:32px;flex:0 0 32px;display:block}.mtt .reel .rot{transform-origin:16px 16px}.mtt .is-running .reel .rot{animation:mtt-reel 7.5s linear infinite}.mtt .is-playing .reel .rot{animation-play-state:running}.mtt .transport.is-paused .reel .rot, .mtt .transport.is-stopped .reel .rot{animation-play-state:paused}@keyframes mtt-reel{to{transform:rotate(360deg)}}.mtt .brand-txt{min-width:0}.mtt .brand-txt b{display:block;font:600 13px/1.25 var(--sans);letter-spacing:.04em;white-space:nowrap}.mtt .brand-txt small{display:block;font:10px/1.3 var(--mono);letter-spacing:.12em;color:#a9b2a9;white-space:nowrap}.mtt .tp-keys{display:flex;gap:4px}.mtt .key{position:relative;width:58px;height:42px;display:grid;place-items:center;align-content:center;gap:1px;background:var(--panel-2);border:1px solid var(--line-2);border-radius:var(--r);box-shadow:inset 0 1px 0 #fff,0 1px 0 rgba(0,0,0,.14);cursor:pointer;user-select:none;transition:transform .08s,box-shadow .08s}.mtt .key:hover{background:#f6f3eb}.mtt .key:active{transform:translateY(1px);box-shadow:inset 0 2px 3px rgba(0,0,0,.18)}.mtt .key .zi{display:block;font-size:12px;line-height:1.1;letter-spacing:.06em}.mtt .key .ze{display:block;font:10px/1 var(--mono);letter-spacing:.1em;color:var(--ink-3);text-transform:uppercase}.mtt .key svg{width:11px;height:11px;display:block;margin:0 auto 1px}.mtt .key svg *{fill:none;stroke:currentColor;stroke-width:1.6}.mtt .key:disabled{color:#8d938c;background:var(--panel-3);box-shadow:inset 0 1px 1px rgba(0,0,0,.08);cursor:default;transform:none !important}.mtt .key[data-active="true"]{background:var(--tape);border-color:var(--tape);color:#edeadd;box-shadow:inset 0 1px 0 rgba(255,255,255,.15),inset 0 -2px 0 rgba(0,0,0,.25)}.mtt .key[data-active="true"] .ze{color:#b7c8bd}.mtt .key--pause{width:56px}.mtt .key--pause[data-active="true"]{background:var(--grease);border-color:var(--grease)}.mtt .key--pause[data-active="true"] .ze{color:#f1d5cc}.mtt .lamps{display:grid;grid-template-columns:auto auto;gap:3px 16px;align-content:center}.mtt .lamp{display:flex;align-items:center;gap:6px;font:11px/1.2 var(--mono);white-space:nowrap;color:var(--ink-2)}.mtt .lamp b{font-weight:600;color:var(--ink)}.mtt .lamp .dot{width:7px;height:7px;border-radius:50%;background:transparent;border:1px solid var(--led-off);flex:0 0 7px}.mtt .lamp.on .dot{background:var(--led);border-color:var(--led);box-shadow:0 0 0 2px rgba(46,122,80,.16)}.mtt .lamp.warn .dot{background:var(--grease);border-color:var(--grease);box-shadow:0 0 0 2px var(--grease-soft)}.mtt .lamp.idle .dot{background:var(--ink-3);border-color:var(--ink-3)}.mtt .clock{display:flex;flex-direction:column;align-items:flex-end;gap:2px;margin-left:auto}.mtt .clock b{font:600 19px/1 var(--mono);letter-spacing:.03em;font-variant-numeric:tabular-nums}.mtt .clock small{font:10px/1 var(--mono);letter-spacing:.1em;color:var(--ink-3)}.mtt .tp-pause-wrap{display:flex;align-items:center;padding-left:14px;border-left:1px solid var(--line);margin-left:14px}.mtt .tp-rail{display:flex;align-items:center;gap:12px;height:34px;padding:0 14px;background:var(--panel-3);border-top:1px solid var(--line);font-size:11px}.mtt .rail-label{font:10px/1 var(--mono);letter-spacing:.16em;text-transform:uppercase;color:var(--ink-3);white-space:nowrap}.mtt .viewkeys{display:flex;gap:3px}.mtt .viewkey{position:relative;appearance:none;display:flex;align-items:baseline;gap:7px;padding:4px 11px 5px;background:var(--panel-2);border:1px solid var(--line-2);border-radius:var(--r);cursor:pointer;box-shadow:inset 0 1px 0 #fff,0 1px 0 rgba(0,0,0,.1);white-space:nowrap;transition:background .1s}.mtt .viewkey:hover{background:#f6f3eb}.mtt .viewkey .vc{font-size:11.5px;color:var(--ink)}.mtt .viewkey .ve{font:10px/1 var(--mono);letter-spacing:.1em;color:var(--ink-3);text-transform:uppercase}.mtt .viewkey[aria-pressed="true"]{background:var(--ink);border-color:var(--ink);box-shadow:inset 0 1px 0 rgba(255,255,255,.12),inset 0 -2px 0 rgba(0,0,0,.3)}.mtt .viewkey[aria-pressed="true"] .vc{color:var(--panel-2)}.mtt .viewkey[aria-pressed="true"] .ve{color:#a7b2a8}.mtt .viewkey[aria-pressed="true"]::after{content:"";position:absolute;left:8px;right:8px;bottom:2px;height:2px;background:var(--grease)}.mtt .rail-meters{margin-left:auto;display:flex;align-items:center;gap:16px;min-width:0}.mtt .meter{display:flex;align-items:center;gap:7px;white-space:nowrap}.mtt .meter .ml{font:10px/1 var(--mono);letter-spacing:.12em;color:var(--ink-3)}.mtt .meter .mv{font:11px/1 var(--mono);font-variant-numeric:tabular-nums;color:var(--ink)}.mtt .meter-bar{position:relative;width:74px;height:7px;background:var(--well);border:1px solid var(--line-2);border-radius:1px;box-shadow:inset 0 1px 2px rgba(0,0,0,.18);overflow:hidden}.mtt .meter-bar i{position:absolute;left:0;top:0;bottom:0;background:var(--tape-3);width:3%}.mtt .meter-bar::after{content:"";position:absolute;right:-1px;top:-1px;bottom:-1px;width:1px;background:var(--grease);opacity:.55}.mtt .rail-live{display:flex;align-items:center;gap:7px;font:11px/1 var(--mono);color:var(--ink-2);white-space:nowrap}.mtt .rail-live .dot{width:7px;height:7px;border-radius:50%;background:var(--led);border:1px solid var(--led);box-shadow:0 0 0 2px rgba(46,122,80,.16)}.mtt .rail-live.stopped .dot{background:transparent;border-color:var(--ink-3);box-shadow:none}.mtt .rail-live.paused .dot{background:var(--grease);border-color:var(--grease);box-shadow:0 0 0 2px var(--grease-soft)}.mtt .rail-live i{font-style:normal;color:var(--ink);font-weight:600}.mtt .bench{min-height:0;display:grid;position:relative}.mtt .view{min-height:0;height:100%}.mtt .view[hidden]{display:none !important}.mtt .view--timeline{display:grid;grid-template-columns:174px minmax(0,1fr) 328px}.mtt .heads{padding:10px 12px 10px 14px;border-right:1px solid var(--line);display:grid;grid-template-rows:36px minmax(0,0.95fr) 10px minmax(158px,1.15fr);min-height:0;background:var(--panel-2)}.mtt .heads-top{display:flex;align-items:baseline;justify-content:space-between;gap:6px;padding-top:2px}.mtt .heads-core{min-height:0;display:grid;grid-template-rows:32px minmax(110px,1fr) 78px 32px 32px}.mtt .head{min-width:0;overflow:hidden}.mtt .head .h-title{display:flex;align-items:baseline;gap:6px;white-space:nowrap}.mtt .head .h-title .idx{font:10px/1 var(--mono);color:var(--ink-3);letter-spacing:.1em}.mtt .head .h-title b{font:600 11.5px/1 var(--sans);letter-spacing:.02em}.mtt .head .h-title small{font:10px/1 var(--mono);color:var(--ink-3);letter-spacing:.08em;text-transform:uppercase}.mtt .head--take{display:flex;align-items:flex-start;padding:1px 0 0;overflow:hidden}.mtt .head--take > div > small{display:block;font:10px/1 var(--mono);color:var(--ink-3);letter-spacing:.14em;margin:2px 0 0}.mtt .counter{font:600 19px/1 var(--mono);font-variant-numeric:tabular-nums;letter-spacing:.02em}.mtt .counter small{display:block;font:10px/1 var(--mono);color:var(--ink-3);letter-spacing:.14em;margin:2px 0 0}.mtt .head--main{border-top:1px solid var(--line);margin-top:4px;padding-top:8px;display:flex;flex-direction:column;gap:7px}.mtt .head-rows{display:flex;flex-direction:column;gap:4px}.mtt .head-row{display:flex;justify-content:space-between;gap:6px;font:11px/1.35 var(--mono);color:var(--ink-2);white-space:nowrap;min-width:0}.mtt .head-row b{color:var(--ink);font-weight:600}.mtt .head--lat{border-top:1px solid var(--line);padding-top:7px;display:flex;flex-direction:column;gap:3px;justify-content:flex-start}.mtt .head--local, .mtt .head--cloud{border-top:1px solid var(--line);display:flex;align-items:center;gap:7px;font:11px/1 var(--mono);white-space:nowrap;overflow:hidden}.mtt .head--local .idx, .mtt .head--cloud .idx{font:10px/1 var(--mono);color:var(--ink-3);letter-spacing:.1em}.mtt .head--local b, .mtt .head--cloud b{font-weight:600}.mtt .head--local .st, .mtt .head--cloud .st{color:var(--ink-3);font-size:11px;letter-spacing:.02em;overflow:hidden;text-overflow:ellipsis}.mtt .head--readers{border-top:1px solid var(--line);padding-top:8px;display:flex;flex-direction:column;gap:6px;min-height:0;overflow:hidden}.mtt .readers{display:flex;flex-direction:column;gap:5px}.mtt .reader{display:grid;grid-template-columns:8px minmax(0,1fr) auto;gap:6px;align-items:center;font:11px/1.3 var(--mono);color:var(--ink-2)}.mtt .reader .ld{width:6px;height:6px;border-radius:50%;background:var(--led);border:1px solid var(--led)}.mtt .reader.off .ld{background:transparent;border-color:var(--ink-3)}.mtt .reader b{color:var(--ink);font-weight:600;font-size:11.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.mtt .reader small{grid-column:2;color:var(--ink-3);font-size:11px;letter-spacing:.02em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.mtt .reader .idle{white-space:nowrap;font-size:11px;color:var(--ink-3)}.mtt .hybrid-cells{display:flex;gap:2px;align-items:center;margin:3px 0 0}.mtt .hybrid-cells i{display:block;width:10px;height:6px;border:1px solid var(--line-2);background:var(--panel);border-radius:1px}.mtt .hybrid-cells i.on{background:var(--tape-3);border-color:var(--tape-3)}.mtt .hybrid-cells span{font:10px/1 var(--mono);color:var(--ink-3);margin-left:4px;letter-spacing:.04em}.mtt .head-window{margin-top:6px;border-top:1px dashed var(--line);padding-top:5px}.mtt .head-window .head-row{font-size:11px}.mtt .heads-note{font:11px/1.5 var(--mono);color:var(--ink-3);letter-spacing:.01em;margin-top:auto}.mtt .timeline{min-width:0;min-height:0;padding:10px 12px;display:grid;grid-template-rows:36px minmax(0,0.95fr) 10px minmax(158px,1.15fr)}.mtt .tl-top{display:flex;align-items:baseline;justify-content:space-between;gap:10px;padding-top:2px}.mtt .tl-title{display:flex;align-items:baseline;gap:8px;min-width:0}.mtt .tl-title b{font:600 12.5px/1 var(--sans);letter-spacing:.02em;white-space:nowrap}.mtt .tl-title .eyebrow{font:10px/1 var(--mono);letter-spacing:.16em;color:var(--ink-3);text-transform:uppercase;white-space:nowrap}.mtt .tl-meta{font:11px/1 var(--mono);color:var(--ink-2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.mtt .rec-tag{display:inline-flex;align-items:center;gap:5px;font:10px/1 var(--mono);letter-spacing:.1em;color:var(--grease);border:1px solid var(--grease);background:var(--grease-soft);padding:2px 6px;border-radius:1px;white-space:nowrap}.mtt .rec-tag i{width:5px;height:5px;border-radius:50%;background:var(--grease);display:block}.mtt .rec-tag.paused{color:var(--ink-2);border-color:var(--line-2);background:transparent}.mtt .rec-tag.paused i{background:var(--ink-3)}.mtt .tl-meta b{color:var(--ink);font-weight:600}.mtt .tl-core{position:relative;min-height:0;display:grid;grid-template-rows:32px minmax(110px,1fr) 78px 32px 32px}.mtt .ruler{position:relative;border-bottom:1px solid var(--line-2);background:var(--panel-2);overflow:hidden}.mtt .ruler .tick{position:absolute;bottom:0;width:1px;background:var(--line-2)}.mtt .ruler .tick.minor{height:5px;opacity:.7}.mtt .ruler .tick.major{height:10px;background:var(--ink-2)}.mtt .ruler .tlabel{position:absolute;bottom:11px;transform:translateX(-50%);font:10px/1 var(--mono);letter-spacing:.04em;color:var(--ink-3);white-space:nowrap}.mtt .ruler .tlabel.edge-l{transform:none}.mtt .ruler .tlabel.edge-r{transform:translateX(-100%)}.mtt .ruler .cue{position:absolute;top:2px;width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-top:6px solid var(--grease);transform:translateX(-5px)}.mtt .tape{position:relative;background:var(--well);border-bottom:1px solid var(--line-2);box-shadow:inset 0 2px 4px rgba(0,0,0,.16);display:flex;overflow:hidden}.mtt .tape::after{content:"";position:absolute;left:0;right:0;top:52%;height:1px;background:rgba(236,231,214,.10);pointer-events:none}.mtt .clip{position:relative;min-width:0;flex:0 0 auto;border:0;background:var(--tape);cursor:pointer;display:flex;flex-direction:column;padding:5px 4px 5px 5px;box-shadow:inset -1px 0 0 rgba(237,234,221,.55),inset 0 1px 0 rgba(255,255,255,.10);clip-path:polygon(0 5px,5px 0,100% 0,100% 100%,0 100%);transition:background .1s}.mtt .clip:hover, .mtt .clip.is-hover{background:var(--tape-2)}.mtt .clip .role{font:600 11.5px/1 var(--sans);color:#ece7d6;letter-spacing:.02em}.mtt .clip .wbar{display:block;width:calc(100% - 2px);height:2px;margin-top:3px;background:rgba(236,231,214,.16);position:relative;overflow:hidden}.mtt .clip .wbar i{position:absolute;left:0;top:0;bottom:0;background:rgba(236,231,214,.55)}.mtt .clip .no{position:absolute;left:4px;bottom:9px;font:11px/1 var(--mono);color:rgba(236,231,214,.5);letter-spacing:.04em}.mtt .clip::after{content:"";position:absolute;top:0;right:0;width:1px;height:8px;background:rgba(236,231,214,.5)}.mtt .clip .role i{display:none}.mtt .clip .marks{display:flex;align-items:center;gap:4px;margin-top:auto}.mtt .clip .cache{position:absolute;top:4px;right:4px;width:7px;height:7px;border:1px solid #cdc6b2;border-radius:1px}.mtt .clip.hit .cache{background:#d9d2bd;border-color:#d9d2bd}.mtt .clip.miss .cache{background:transparent;border-color:var(--grease);border-radius:0}.mtt .clip.miss .cache::after{content:"";display:block;width:7px;height:1px;background:var(--grease);transform:rotate(-45deg) translate(0,-4px)}.mtt .clip .lat{height:3px;background:rgba(237,234,221,.24);margin-top:auto;position:relative;border-radius:1px;overflow:hidden}.mtt .clip .lat i{position:absolute;left:0;top:0;bottom:0;background:#d8d1bd}.mtt .clip.slow .lat i{background:var(--grease)}.mtt .clip .seg{position:absolute;top:0;bottom:0;left:50%;width:1px;background:rgba(237,234,221,.35)}.mtt .clip[aria-selected="true"]{background:var(--tape-2);box-shadow:inset 0 0 0 2px var(--grease),inset -1px 0 0 rgba(237,234,221,.65);z-index:2}.mtt .clip[aria-selected="true"] .role{color:#fff6e8}.mtt .clip:focus-visible{z-index:3}.mtt .playhead{position:absolute;top:28px;bottom:0;right:0;width:2px;background:var(--grease);z-index:4;pointer-events:none}.mtt .playhead::before{content:"";position:absolute;top:-1px;right:-4px;width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-top:8px solid var(--grease)}.mtt .playhead .ph-label{position:absolute;right:5px;top:5px;background:var(--grease);color:#f7e9e3;font:10px/1 var(--mono);letter-spacing:.08em;padding:2px 5px;white-space:nowrap}.mtt .transport.is-paused .playhead{background:transparent;border-left:2px dashed var(--grease)}.mtt .transport.is-paused .playhead::before{border-top-color:var(--grease)}.mtt .latlane{position:relative;background:var(--panel-2);border-bottom:1px solid var(--line);display:flex;align-items:flex-end;gap:0;padding:6px 0 0;overflow:hidden}.mtt .latlane .lbar{flex:0 0 auto;min-width:0;height:100%;display:flex;align-items:flex-end;background:transparent}.mtt .latlane .lbar i{display:block;width:100%;background:var(--ink-2);opacity:.55;border-top:1px solid var(--ink-2)}.mtt .latlane .lbar i{border-right:1px solid var(--panel-2)}.mtt .latlane .lbar.slow i{background:var(--grease);opacity:.8;border-top-color:var(--grease)}.mtt .latlane .p95{position:absolute;left:0;right:0;border-top:1px dashed var(--grease);opacity:.75;pointer-events:none}.mtt .latlane .p95 span{position:absolute;right:16px;top:-9px;font:11px/1 var(--mono);color:var(--grease);background:var(--panel-2);padding:0 3px;letter-spacing:.04em}.mtt .rail{position:relative;background:var(--panel-2);border-bottom:1px solid var(--line);display:flex;align-items:center;gap:0;overflow:hidden}.mtt .rail--cloud{border-bottom:0}.mtt .rail .rbar{flex:0 0 auto;min-width:0;height:9px;background:transparent}.mtt .rail .rbar i{display:block;width:100%;height:100%;background:var(--tape-3);border-radius:1px;box-shadow:inset -1px 0 0 var(--panel-2)}.mtt .rail--cloud .rbar i{background:var(--cloud)}.mtt .rail .rail-note{position:absolute;left:8px;top:50%;transform:translateY(-50%);font:11px/1 var(--mono);letter-spacing:.02em;color:var(--ink-3);background:var(--panel-2);padding:2px 6px}.mtt .takes{min-height:0;display:grid;grid-template-rows:26px minmax(0,1fr);border-top:1px solid var(--line-2)}.mtt .takes-hd{display:flex;align-items:center;justify-content:space-between;gap:8px;padding-top:5px}.mtt .takes-hd .silk{white-space:nowrap}.mtt .takes-hd .th-meta{font:11px/1 var(--mono);color:var(--ink-3);letter-spacing:.04em;white-space:nowrap}.mtt .takes-list{overflow-y:auto;overflow-x:hidden;min-height:0;padding-right:2px;scrollbar-width:thin}.mtt .take{display:grid;grid-template-columns:58px 26px 38px minmax(0,1fr) 52px 50px 44px;gap:8px;align-items:center;width:100%;text-align:left;padding:0 5px;height:24px;border-top:1px solid rgba(170,164,146,.28);cursor:pointer;font-size:12px;color:var(--ink-2)}.mtt .take:hover, .mtt .take.is-hover{background:var(--panel-2)}.mtt .take[aria-selected="true"]{background:var(--panel-3);box-shadow:inset 2px 0 0 var(--grease)}.mtt .take .tt{font:11px/1 var(--mono);color:var(--ink-3);font-variant-numeric:tabular-nums}.mtt .take .tr{font:600 11.5px/1 var(--sans);color:var(--ink);white-space:nowrap}.mtt .take .ts{font:11px/1 var(--mono);letter-spacing:.02em;white-space:nowrap}.mtt .take .ts.local{color:var(--tape-3)}.mtt .take .ts.cloud{color:var(--cloud)}.mtt .take .tx{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--ink-2)}.mtt .take .td{font:11px/1 var(--mono);color:var(--ink-3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.mtt .take .tl{font:11px/1 var(--mono);font-variant-numeric:tabular-nums;color:var(--ink-2);white-space:nowrap}.mtt .take .tl.slow{color:var(--grease)}.mtt .take .tc{font:11px/1 var(--mono);white-space:nowrap}.mtt .take .tc.hit{color:var(--tape-3)}.mtt .take .tc.miss{color:var(--grease)}.mtt .take .tc::before{content:"●";font-size:8px;margin-right:3px;vertical-align:1px}.mtt .take .tc.miss::before{content:"○"}.mtt .inspector{border-left:1px solid var(--line-2);padding:10px 14px 10px 16px;min-height:0;overflow:hidden;display:flex;flex-direction:column;gap:9px;background:var(--panel-2)}.mtt .ins-block{min-width:0}.mtt .ins-hd{display:flex;align-items:baseline;justify-content:space-between;gap:8px;padding:7px 0 5px;border-top:1px solid var(--line);margin-bottom:2px}.mtt .ins-block:first-child .ins-hd{border-top:0;padding-top:0}.mtt .ins-hd .silk{white-space:nowrap}.mtt .ins-hd .cn{white-space:nowrap;font-size:11px;color:var(--ink-3);letter-spacing:.04em}.mtt .pick-tags{display:flex;align-items:center;gap:5px;margin-bottom:6px;flex-wrap:wrap}.mtt .tag{display:inline-flex;align-items:center;gap:4px;padding:1px 7px;border:1px solid var(--line-2);border-radius:1px;font:11px/1.6 var(--mono);letter-spacing:.03em;color:var(--ink-2);white-space:nowrap}.mtt .tag.tape{background:var(--tape);border-color:var(--tape);color:#e9e4d3}.mtt .tag.grease{background:var(--grease);border-color:var(--grease);color:#f7e9e3}.mtt .tag.cloud{background:var(--cloud);border-color:var(--cloud);color:#e6e9e6}.mtt .tag.hollow{background:transparent}.mtt .pick-text{font:14px/1.6 var(--sans);color:var(--ink);margin:0 0 8px;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;min-height:22px}.mtt .pick-text .q{color:var(--ink-3);font-family:var(--mono);font-size:11px}.mtt .pick-meta{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:5px 8px;margin-bottom:6px}.mtt .kv{min-width:0}.mtt .kv .k{display:block;font:11px/1.2 var(--mono);letter-spacing:.1em;color:var(--ink-3);text-transform:uppercase;white-space:nowrap}.mtt .kv .v{display:block;font:11.5px/1.35 var(--mono);font-variant-numeric:tabular-nums;color:var(--ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.mtt .kv .v b{font-weight:600}.mtt .pick-device{display:flex;align-items:center;justify-content:space-between;gap:8px;font:11px/1.4 var(--mono);color:var(--ink-3);border-top:1px dashed var(--line);padding-top:5px}.mtt .pick-device b{color:var(--ink-2);font-weight:600}.mtt .eng{display:flex;flex-direction:column;gap:4px;font-size:11px}.mtt .eng-row{display:flex;align-items:center;gap:6px;min-width:0}.mtt .eng-row .ld{width:6px;height:6px;border-radius:50%;background:var(--led);flex:0 0 6px;border:1px solid var(--led)}.mtt .eng-row.off .ld{background:transparent;border-color:var(--ink-3)}.mtt .eng-row.warm .ld{background:var(--grease);border-color:var(--grease);box-shadow:0 0 0 2px var(--grease-soft)}.mtt .eng-row b{font:600 11px/1.3 var(--sans);white-space:nowrap}.mtt .eng-row .st{font:11px/1.3 var(--mono);color:var(--ink-3);white-space:nowrap}.mtt .eng-row .val{margin-left:auto;font:11px/1.3 var(--mono);color:var(--ink-2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.mtt .eng-sub{font:11px/1.45 var(--mono);color:var(--ink-3);letter-spacing:.01em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.mtt .eng-act{display:flex;gap:6px;margin-top:3px}.mtt .btn{display:inline-flex;align-items:center;justify-content:center;gap:5px;padding:4px 10px;background:var(--panel-2);border:1px solid var(--line-2);border-radius:var(--r);font-size:11.5px;color:var(--ink);cursor:pointer;box-shadow:inset 0 1px 0 #fff,0 1px 0 rgba(0,0,0,.1);white-space:nowrap;transition:background .1s}.mtt .btn:hover{background:#f7f4ec}.mtt .btn:active{transform:translateY(1px);box-shadow:inset 0 2px 3px rgba(0,0,0,.14)}.mtt .btn:disabled{color:#8d938c;background:var(--panel-3);box-shadow:none;cursor:default;transform:none}.mtt .btn--tape{background:var(--tape);border-color:var(--tape);color:#e9e4d3}.mtt .btn--tape:hover{background:var(--tape-2)}.mtt .btn--ghost{background:transparent;box-shadow:none}.mtt .btn--sm{padding:2px 8px;font-size:11px}.mtt .vu{display:grid;grid-template-columns:1fr auto;gap:10px;align-items:center}.mtt .vu svg{display:block;width:100%;height:auto;max-height:76px}.mtt .vu .reads{display:flex;flex-direction:column;gap:3px;text-align:right}.mtt .vu .reads b{font:600 15px/1 var(--mono);font-variant-numeric:tabular-nums}.mtt .vu .reads small{font:11px/1.2 var(--mono);color:var(--ink-3);white-space:nowrap}.mtt .cache-rows{display:grid;grid-template-columns:1fr 1fr;gap:3px 10px;margin-top:4px}.mtt .rowx{display:flex;justify-content:space-between;gap:8px;font:11px/1.5 var(--mono);color:var(--ink-3);white-space:nowrap}.mtt .rowx b{color:var(--ink-2);font-weight:600;font-variant-numeric:tabular-nums}.mtt .today-grid{display:grid;grid-template-columns:1fr 1fr;gap:4px 10px}.mtt .today-grid .kv .v{font-size:12.5px}.mtt .today-grid .kv .v small{font:11px var(--sans);color:var(--ink-3);margin-left:2px}.mtt .lat-row{display:flex;gap:10px;margin-top:3px;font:11px/1.4 var(--mono);color:var(--ink-3);white-space:nowrap}.mtt .lat-row b{color:var(--ink-2);font-weight:600}.mtt .limit-meter{display:flex;align-items:center;gap:8px;margin:2px 0 5px}.mtt .limit-meter .ml{font:10px/1 var(--mono);letter-spacing:.12em;color:var(--ink-3)}.mtt .limit-meter .mv{font:11px/1 var(--mono);color:var(--ink-2);font-variant-numeric:tabular-nums}.mtt .limit-meter .meter-bar{width:auto;flex:1}.mtt .tl-empty[hidden]{display:none}.mtt .tl-empty{position:absolute;inset:0;z-index:6;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;background:var(--panel-2);border-top:1px solid var(--line);text-align:center}.mtt .leader{width:min(420px,80%);height:34px;border:1px solid var(--line-2);background:repeating-linear-gradient(-45deg,var(--well) 0 10px,var(--panel-2) 10px 20px);box-shadow:inset 0 1px 3px rgba(0,0,0,.14);position:relative;display:flex;align-items:center;justify-content:center}.mtt .leader span{background:var(--panel-2);padding:0 8px;font:10px/1 var(--mono);letter-spacing:.18em;color:var(--ink-3)}.mtt .tl-empty h3{margin:0;font:600 15px/1.3 var(--sans);letter-spacing:.02em}.mtt .tl-empty p{margin:0;font-size:11.5px;color:var(--ink-2);max-width:420px;line-height:1.7}.mtt .empty-takes{padding:14px;font:11px/1.6 var(--mono);color:var(--ink-3);display:flex;flex-direction:column;gap:4px}.mtt .ins-stopped{display:flex;flex-direction:column;gap:8px;padding:10px 0}.mtt .ins-stopped .banner{border:1px solid var(--line-2);background:var(--well);padding:10px;display:flex;flex-direction:column;gap:6px}.mtt .ins-stopped .banner b{font:600 12.5px/1.3 var(--sans)}.mtt .ins-stopped .banner span{font:10.5px/1.5 var(--mono);color:var(--ink-3)}.mtt .view--settings{display:grid;grid-template-rows:minmax(0,1fr) 48px}.mtt .set-grid{display:grid;grid-template-columns:198px minmax(0,1fr) 300px;min-height:0}.mtt .set-left{border-right:1px solid var(--line);padding:12px 14px;display:flex;flex-direction:column;gap:12px;min-height:0;overflow:hidden;background:var(--panel-2)}.mtt .set-left h2{margin:0;font:600 13px/1.3 var(--sans);letter-spacing:.02em}.mtt .set-left .sub{font:10px/1.3 var(--mono);letter-spacing:.14em;color:var(--ink-3);text-transform:uppercase}.mtt .chain{display:flex;flex-direction:column;gap:0;margin-top:2px}.mtt .chain-node{display:flex;align-items:center;gap:7px;font:11px/1.3 var(--mono);color:var(--ink-2);padding:4px 6px;border:1px solid var(--line-2);background:var(--panel);border-radius:1px;white-space:nowrap;overflow:hidden}.mtt .chain-node .ld{width:6px;height:6px;border-radius:50%;background:var(--led);border:1px solid var(--led);flex:0 0 6px}.mtt .chain-node.off .ld{background:transparent;border-color:var(--ink-3)}.mtt .chain-node b{font-weight:600;color:var(--ink);font-family:var(--sans);font-size:11px}.mtt .chain-link{width:1px;height:12px;background:var(--line-2);margin-left:14px}.mtt .chain-note{font:11px/1.5 var(--mono);color:var(--ink-3)}.mtt .mod-index{display:flex;flex-direction:column;gap:2px;margin-top:auto;padding-top:8px;border-top:1px solid var(--line)}.mtt .mod-index button{display:flex;align-items:baseline;gap:7px;padding:3px 2px;font:11px/1.4 var(--mono);color:var(--ink-2);cursor:pointer;text-align:left}.mtt .mod-index button:hover{color:var(--ink)}.mtt .mod-index .n{color:var(--ink-3);font-size:10px}.mtt .modules{overflow-y:auto;min-height:0;padding:12px 14px;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;align-content:start;scrollbar-width:thin}.mtt .module{border:1px solid var(--line-2);background:var(--panel-2);border-radius:var(--r);padding:9px 11px 10px;min-width:0;position:relative;box-shadow:0 1px 0 rgba(255,255,255,.4) inset}.mtt .module-hd{display:flex;align-items:baseline;justify-content:space-between;gap:8px;border-bottom:1px solid var(--line);padding-bottom:5px;margin-bottom:5px}.mtt .module-hd .mh{display:flex;align-items:baseline;gap:6px;white-space:nowrap;min-width:0}.mtt .module-hd b{font:600 11.5px/1 var(--sans);letter-spacing:.03em}.mtt .module-hd .silk{font-size:10px}.mtt .module-hd .mnum{font:10px/1 var(--mono);color:var(--ink-3)}.mtt .dirty-dot{width:6px;height:6px;border-radius:50%;background:var(--grease);display:none;flex:0 0 6px;box-shadow:0 0 0 2px var(--grease-soft)}.mtt .module.is-dirty .dirty-dot{display:block}.mtt .field{display:grid;gap:2px;padding:4px 0;min-width:0}.mtt .field .fl{display:flex;align-items:baseline;justify-content:space-between;gap:6px;font-size:11px;color:var(--ink-2);white-space:nowrap}.mtt .field .fl i{font:10px/1 var(--mono);letter-spacing:.12em;color:var(--ink-3);font-style:normal;text-transform:uppercase}.mtt .input{width:100%;min-width:0;background:var(--panel);border:1px solid var(--line-2);border-radius:1px;padding:3px 6px;font:11px/1.5 var(--mono);color:var(--ink);box-shadow:inset 0 1px 2px rgba(0,0,0,.10);caret-color:var(--grease)}.mtt .input:hover{background:#f6f2e9}.mtt .input:focus-visible{outline:2px solid var(--grease);outline-offset:1px;background:#fbf8f0}.mtt textarea.input{resize:vertical;min-height:44px;line-height:1.55}.mtt .ctrl-row{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:4px 0;border-top:1px solid rgba(170,164,146,.28);min-width:0}.mtt .ctrl-row:first-of-type{border-top:0}.mtt .ctrl-row .cl{display:flex;flex-direction:column;gap:1px;min-width:0}.mtt .ctrl-row .cl b{font:11px/1.3 var(--sans);color:var(--ink-2);font-weight:500;white-space:nowrap}.mtt .ctrl-row .cl i{font:10px/1 var(--mono);font-style:normal;letter-spacing:.1em;color:var(--ink-3);text-transform:uppercase;white-space:nowrap}.mtt .knob-row{display:flex;flex-wrap:wrap;gap:4px 14px;padding:2px 0 1px}.mtt .knob-wrap{display:flex;flex-direction:column;align-items:center;gap:2px;min-width:64px}.mtt .knob-wrap .kl{font:11px/1.2 var(--sans);color:var(--ink-2);white-space:nowrap;text-align:center}.mtt .knob-holder{position:relative;width:48px;height:48px;display:grid;place-items:center}.mtt .knob{position:relative;width:38px;height:38px;border-radius:50%;background:var(--panel-2);border:1px solid var(--line-2);cursor:grab;touch-action:none;box-shadow:inset 0 2px 2px #fff,inset 0 -3px 4px rgba(0,0,0,.14),0 1px 2px rgba(0,0,0,.18);z-index:1}.mtt .knob:active{cursor:grabbing}.mtt .knob::before{content:"";position:absolute;left:50%;top:4px;width:2px;height:10px;margin-left:-1px;background:var(--ink);border-radius:1px;transform-origin:50% 15px;transform:rotate(var(--angle,0deg))}.mtt .knob::after{content:"";position:absolute;left:50%;top:50%;width:8px;height:8px;margin:-4px 0 0 -4px;border-radius:50%;background:var(--well);box-shadow:inset 0 1px 2px rgba(0,0,0,.25)}.mtt .knob-ticks{position:absolute;inset:0;width:48px;height:48px;pointer-events:none}.mtt .knob-val{font:11px/1 var(--mono);font-variant-numeric:tabular-nums;background:var(--well);border:1px solid var(--line-2);border-radius:1px;padding:1px 4px;min-width:34px;text-align:center;color:var(--ink)}.mtt .knob-wrap.is-dirty .knob-val{border-color:var(--grease);color:var(--grease)}.mtt .toggle{position:relative;width:36px;height:18px;flex:0 0 36px;background:var(--well);border:1px solid var(--line-2);border-radius:2px;cursor:pointer;box-shadow:inset 0 1px 2px rgba(0,0,0,.22)}.mtt .toggle::after{content:"";position:absolute;top:1px;left:1px;width:15px;height:14px;background:var(--panel-2);border:1px solid var(--line-2);border-radius:1px;box-shadow:0 1px 1px rgba(0,0,0,.25);transition:transform .1s}.mtt .toggle[aria-checked="true"]{background:var(--tape);border-color:var(--tape)}.mtt .toggle[aria-checked="true"]::after{transform:translateX(18px);border-color:var(--tape)}.mtt .toggle-wrap{display:flex;align-items:center;gap:6px}.mtt .toggle-wrap .tv{font:11px/1 var(--mono);color:var(--ink-3);min-width:14px}.mtt .seg{display:flex;gap:0;border:1px solid var(--line-2);border-radius:1px;overflow:hidden}.mtt .seg-key{padding:3px 9px;font:11px/1.4 var(--mono);background:var(--panel-2);cursor:pointer;color:var(--ink-2);border-left:1px solid var(--line-2);white-space:nowrap}.mtt .seg-key:first-child{border-left:0}.mtt .seg-key[aria-pressed="true"]{background:var(--ink);color:var(--panel-2)}.mtt .chips{display:flex;flex-wrap:wrap;gap:3px}.mtt .chip{padding:1px 6px;border:1px solid var(--line-2);border-radius:1px;font:11px/1.5 var(--mono);background:var(--panel);cursor:pointer;color:var(--ink-2);white-space:nowrap}.mtt .chip:hover{background:#f7f4ec}.mtt .chip[aria-pressed="true"]{background:var(--tape);border-color:var(--tape);color:#e9e4d3}.mtt .hint{font:11px/1.55 var(--mono);color:var(--ink-3);margin:4px 0 0}.mtt .apply{border-left:1px solid var(--line);padding:12px 14px;display:flex;flex-direction:column;gap:10px;min-height:0;background:var(--panel-2);overflow:hidden}.mtt .apply h2{margin:0;font:600 13px/1.3 var(--sans)}.mtt .apply .sub{font:10px/1.3 var(--mono);letter-spacing:.14em;color:var(--ink-3);text-transform:uppercase}.mtt .apply-sum{border:1px solid var(--line-2);background:var(--panel);padding:7px 9px;display:flex;flex-direction:column;gap:3px}.mtt .apply-sum .rowx{font-size:11px}.mtt .dirty-wrap{display:flex;flex-direction:column;gap:4px;min-height:0;overflow:hidden}.mtt .dirty-list{list-style:none;margin:0;padding:0;overflow-y:auto;min-height:0;scrollbar-width:thin}.mtt .dirty-list li{font:11px/1.5 var(--mono);color:var(--ink-2);padding:2px 0 2px 12px;position:relative;border-top:1px solid rgba(170,164,146,.3)}.mtt .dirty-list li::before{content:"";position:absolute;left:2px;top:8px;width:4px;height:4px;background:var(--grease);border-radius:50%}.mtt .dirty-list li b{color:var(--ink);font-weight:600}.mtt .dirty-empty{font:11px/1.6 var(--mono);color:var(--ink-3);border:1px dashed var(--line-2);padding:8px;text-align:center}.mtt .savebar{display:flex;align-items:center;gap:10px;padding:0 14px;background:var(--panel-3);border-top:2px solid var(--line-2);box-shadow:inset 0 1px 0 rgba(255,255,255,.4)}.mtt .savebar .sb-msg{display:flex;align-items:center;gap:7px;font:11px/1.3 var(--mono);color:var(--ink-2);white-space:nowrap}.mtt .savebar .sb-msg .dot{width:7px;height:7px;border-radius:50%;background:var(--led);border:1px solid var(--led)}.mtt .savebar.is-dirty .sb-msg .dot{background:var(--grease);border-color:var(--grease);box-shadow:0 0 0 2px var(--grease-soft)}.mtt .savebar.is-saving .sb-msg .dot{background:var(--ink-3);border-color:var(--ink-3)}.mtt .savebar .sb-spacer{flex:1}.mtt .savebar .sb-hint{font:11px/1.3 var(--mono);color:var(--ink-3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.mtt .view--archive{display:grid;grid-template-columns:200px minmax(0,1fr) 300px;min-height:0}.mtt .arch-left{border-right:1px solid var(--line);padding:12px 14px;display:flex;flex-direction:column;gap:12px;min-height:0;background:var(--panel-2);overflow:hidden}.mtt .arch-left h2{margin:0;font:600 13px/1.3 var(--sans)}.mtt .range-keys{display:flex;gap:4px}.mtt .range-key{flex:1;padding:7px 6px;text-align:center;border:1px solid var(--line-2);background:var(--panel-2);border-radius:var(--r);cursor:pointer;box-shadow:inset 0 1px 0 #fff,0 1px 0 rgba(0,0,0,.1)}.mtt .range-key b{display:block;font:600 12px/1.2 var(--sans)}.mtt .range-key small{display:block;font:10px/1.2 var(--mono);letter-spacing:.1em;color:var(--ink-3);margin-top:2px;text-transform:uppercase}.mtt .range-key[aria-pressed="true"]{background:var(--ink);border-color:var(--ink);color:var(--panel-2)}.mtt .range-key[aria-pressed="true"] small{color:#a7b2a8}.mtt .totals{display:flex;flex-direction:column;gap:2px;border-top:1px solid var(--line);padding-top:8px}.mtt .totals .trow{display:flex;justify-content:space-between;align-items:baseline;gap:8px;font:11px/1.6 var(--mono);color:var(--ink-3);white-space:nowrap}.mtt .totals .trow b{font:600 13px/1.4 var(--mono);color:var(--ink);font-variant-numeric:tabular-nums}.mtt .totals .trow b small{font:10px var(--mono);color:var(--ink-3);margin-left:2px;font-weight:400}.mtt .arch-left .foot{margin-top:auto;display:flex;flex-direction:column;gap:8px;border-top:1px solid var(--line);padding-top:8px}.mtt .arch-main{min-width:0;min-height:0;padding:12px 14px;display:grid;grid-template-rows:auto auto minmax(0,1fr);gap:8px}.mtt .arch-top{display:flex;align-items:baseline;justify-content:space-between;gap:10px}.mtt .arch-top .ah{display:flex;align-items:baseline;gap:8px;white-space:nowrap}.mtt .arch-top b{font:600 12.5px/1 var(--sans)}.mtt .arch-top .silk{white-space:nowrap}.mtt .arch-top .ameta{font:11px/1 var(--mono);color:var(--ink-3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.mtt .daytape-wrap{position:relative;padding-top:30px;padding-bottom:16px}.mtt .daytape{display:flex;height:78px;background:var(--well);border:1px solid var(--line-2);box-shadow:inset 0 2px 4px rgba(0,0,0,.16);overflow:hidden}.mtt .day{position:relative;flex:0 0 auto;min-width:0;border-left:1px solid rgba(237,234,221,.5);background:var(--tape);cursor:pointer;display:flex;flex-direction:column;justify-content:flex-end;padding:3px 3px 4px;transition:background .1s}.mtt .day:first-child{border-left:0}.mtt .day:hover{background:var(--tape-2)}.mtt .day[aria-selected="true"]{background:var(--tape-2);box-shadow:inset 0 0 0 2px var(--grease)}.mtt .day .dn{font:11px/1 var(--mono);color:#cfd8cd;letter-spacing:.02em;white-space:nowrap;overflow:hidden}.mtt .day.today .dn{color:#f2b6a6}.mtt .day .err{position:absolute;right:3px;top:3px;width:5px;height:5px;background:var(--grease);border-radius:50%}.mtt .day .bar{position:absolute;left:0;right:0;bottom:0;background:rgba(237,234,221,.14)}.mtt .day-axis{position:relative;height:14px}.mtt .day-axis .mlabel{position:absolute;top:0;font:11px/1 var(--mono);color:var(--ink-3);letter-spacing:.06em;transform:translateX(-50%);white-space:nowrap}.mtt .day-axis .mtick{position:absolute;top:-4px;width:1px;height:8px;background:var(--line-2)}.mtt .peak-note{position:absolute;top:2px;transform:translateX(-50%);font:11px/1.2 var(--mono);color:var(--grease);white-space:nowrap;text-align:center;letter-spacing:.02em}.mtt .peak-note::after{content:"";display:block;width:1px;height:16px;background:var(--grease);margin:2px auto 0}.mtt .today-note{position:absolute;top:2px;transform:translateX(-50%);font:11px/1.2 var(--mono);color:var(--grease);white-space:nowrap;letter-spacing:.06em}.mtt .today-note::after{content:"";display:block;width:1px;height:12px;background:var(--grease);margin:2px auto 0}.mtt .ledger-wrap{min-height:0;overflow:hidden;border-top:1px solid var(--line);display:flex;flex-direction:column}.mtt .ledger{width:100%;border-collapse:collapse;font:11px/1.3 var(--mono);table-layout:fixed}.mtt .ledger thead th{position:sticky;top:0;background:var(--panel-2);text-align:left;font:11px/1.2 var(--mono);letter-spacing:.12em;color:var(--ink-3);text-transform:uppercase;padding:5px 4px;border-bottom:1px solid var(--line-2);z-index:1}.mtt .ledger tbody tr{cursor:pointer;border-bottom:1px solid rgba(170,164,146,.24)}.mtt .ledger tbody tr:hover{background:var(--panel-2)}.mtt .ledger tbody tr[aria-selected="true"]{background:var(--panel-3);box-shadow:inset 2px 0 0 var(--grease)}.mtt .ledger td{padding:3px 4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-variant-numeric:tabular-nums;color:var(--ink-2)}.mtt .ledger td.d{color:var(--ink);font-weight:600}.mtt .ledger td.e{color:var(--grease)}.mtt .ledger .scroll{overflow-y:auto;min-height:0;scrollbar-width:thin}.mtt .arch-right{border-left:1px solid var(--line-2);padding:12px 14px;display:flex;flex-direction:column;gap:10px;background:var(--panel-2);min-height:0;overflow:hidden}.mtt .arch-right h2{margin:0;font:600 13px/1.3 var(--sans)}.mtt .day-detail{border:1px solid var(--line-2);background:var(--panel);padding:8px 10px;display:grid;grid-template-columns:1fr 1fr;gap:5px 10px}.mtt .day-detail .kv .v{font-size:12px}.mtt .day-detail .wide{grid-column:1 / -1;border-top:1px dashed var(--line);padding-top:5px}.mtt .arch-sec{border-top:1px solid var(--line);padding-top:8px;display:flex;flex-direction:column;gap:4px}.mtt .view--delivery{display:grid;grid-template-columns:200px minmax(0,1fr) 310px;min-height:0}.mtt .dlv-left{border-right:1px solid var(--line);padding:12px 14px;display:flex;flex-direction:column;gap:10px;background:var(--panel-2);min-height:0;overflow:hidden}.mtt .dlv-left h2{margin:0;font:600 13px/1.3 var(--sans)}.mtt .steps{list-style:none;margin:2px 0 0;padding:0;display:flex;flex-direction:column;gap:0}.mtt .step{display:grid;grid-template-columns:20px minmax(0,1fr);gap:7px;padding:6px 0;border-top:1px solid var(--line)}.mtt .step:first-child{border-top:0}.mtt .step .sn{font:10px/1.5 var(--mono);color:var(--ink-3);letter-spacing:.08em;padding-top:1px}.mtt .step b{display:block;font:11.5px/1.4 var(--sans);color:var(--ink);font-weight:600;margin-bottom:1px}.mtt .step span{display:block;font:10.5px/1.55 var(--mono);color:var(--ink-2)}.mtt .dlv-main{min-width:0;min-height:0;overflow-y:auto;padding:12px 16px;display:flex;flex-direction:column;gap:10px;scrollbar-width:thin}.mtt .dlv-top{display:flex;align-items:baseline;justify-content:space-between;gap:10px}.mtt .dlv-top .dh{display:flex;align-items:baseline;gap:8px}.mtt .dlv-top b{font:600 13px/1 var(--sans)}.mtt .dlv-top .silk{white-space:nowrap}.mtt .dlv-top .dmeta{font:11px/1 var(--mono);color:var(--ink-3)}.mtt .labelblock{border:1px solid var(--line-2);background:var(--panel-2);padding:9px 11px 10px;position:relative;box-shadow:inset 0 1px 0 rgba(255,255,255,.5)}.mtt .labelblock::before{content:"";position:absolute;left:0;top:0;bottom:0;width:3px;background:var(--tape)}.mtt .labelblock.grease::before{background:var(--grease)}.mtt .labelblock .lb-hd{display:flex;align-items:baseline;justify-content:space-between;gap:10px;margin-bottom:5px}.mtt .labelblock .lb-hd .silk{white-space:nowrap}.mtt .addr{display:flex;align-items:stretch;gap:8px}.mtt .addr code{flex:1;min-width:0;font:11px/1.55 var(--mono);color:var(--ink);word-break:break-all;background:var(--well);border:1px solid var(--line-2);padding:5px 7px;box-shadow:inset 0 1px 2px rgba(0,0,0,.12)}.mtt .addr .btn{align-self:center}.mtt .addr-note{font:11px/1.5 var(--mono);color:var(--ink-3);margin-top:4px}.mtt .spec{display:grid;grid-template-columns:82px minmax(0,1fr) auto;gap:0;border:1px solid var(--line-2);background:var(--panel-2)}.mtt .spec .sk{font:10px/1.5 var(--mono);letter-spacing:.1em;color:var(--ink-3);text-transform:uppercase;padding:4px 8px;border-top:1px solid var(--line);background:var(--panel-3)}.mtt .spec .sv{font:11px/1.6 var(--mono);color:var(--ink);padding:4px 8px;border-top:1px solid var(--line);word-break:break-all}.mtt .spec .sa{padding:2px 6px;border-top:1px solid var(--line);display:flex;align-items:center}.mtt .spec .sk:nth-child(-n+3), .mtt .spec .sv:nth-child(-n+3), .mtt .spec .sa:nth-child(-n+3){border-top:0}.mtt .code{font:11px/1.65 var(--mono);color:var(--ink);background:var(--well);border:1px solid var(--line-2);padding:8px 10px;white-space:pre-wrap;word-break:break-all;margin:0;box-shadow:inset 0 1px 2px rgba(0,0,0,.12);max-height:230px;overflow:auto;scrollbar-width:thin}.mtt .code.json{max-height:150px}.mtt .dlv-right{border-left:1px solid var(--line-2);padding:12px 14px;display:flex;flex-direction:column;gap:10px;background:var(--panel-2);min-height:0;overflow-y:auto;scrollbar-width:thin}.mtt .dlv-right h2{margin:0;font:600 13px/1.3 var(--sans)}.mtt .checklist{display:flex;flex-direction:column;gap:3px;border-top:1px solid var(--line);padding-top:7px}.mtt .check{display:grid;grid-template-columns:16px minmax(0,1fr) auto;gap:6px;align-items:baseline;font:11px/1.5 var(--mono);color:var(--ink-2)}.mtt .check .ck{font:10px/1.5 var(--mono);color:var(--led)}.mtt .check.warn .ck{color:var(--grease)}.mtt .check.warn .cv{color:var(--grease)}.mtt .check .cv{color:var(--ink-2);white-space:nowrap;text-align:right;overflow:hidden;text-overflow:ellipsis}.mtt .check .cn2{color:var(--ink);font-family:var(--sans);font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.mtt .errcodes{border-top:1px solid var(--line);padding-top:7px;display:flex;flex-direction:column;gap:3px}.mtt .errcode{display:grid;grid-template-columns:34px minmax(0,1fr);gap:7px;font:11px/1.5 var(--mono);color:var(--ink-2)}.mtt .errcode b{color:var(--grease);font-weight:600}.mtt .dlv-actions{display:flex;flex-wrap:wrap;gap:4px;border-top:1px solid var(--line);padding-top:8px;margin-top:auto}.mtt .statusbar{height:30px;display:flex;align-items:center;gap:14px;padding:0 14px;background:var(--panel-3);border-top:1px solid var(--line-2);font:11px/1 var(--mono);color:var(--ink-3);letter-spacing:.02em;position:relative;z-index:4}.mtt .statusbar .sb-l{display:flex;align-items:center;gap:7px;white-space:nowrap}.mtt .statusbar .dot{width:7px;height:7px;border-radius:50%;background:var(--led);border:1px solid var(--led)}.mtt .statusbar .dot.off{background:transparent;border-color:var(--ink-3)}.mtt .statusbar .dot.warn{background:var(--grease);border-color:var(--grease)}.mtt .statusbar .sb-hint{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1;color:var(--ink-2)}.mtt .statusbar .sb-hint b{color:var(--ink);font-weight:600}.mtt .statusbar .sb-r{display:flex;align-items:center;gap:10px;white-space:nowrap}.mtt .statusbar .sb-r .sep{color:var(--line-2)}.mtt .toast{position:fixed;left:50%;bottom:44px;transform:translate(-50%,8px);display:flex;align-items:center;gap:9px;background:var(--ink);color:var(--panel-2);padding:8px 14px;font:11.5px/1.3 var(--mono);letter-spacing:.02em;border-left:3px solid var(--grease);box-shadow:0 6px 18px rgba(0,0,0,.28);z-index:60;opacity:0;pointer-events:none;transition:opacity .15s,transform .15s;max-width:min(560px,84vw)}.mtt .toast.show{opacity:1;transform:translate(-50%,0)}.mtt .toast .tdot{width:6px;height:6px;background:var(--grease);border-radius:50%;flex:0 0 6px}
@media (max-width:1180px){.mtt .view--timeline{grid-template-columns:152px minmax(0,1fr) 288px}.mtt .view--archive{grid-template-columns:184px minmax(0,1fr) 274px}.mtt .view--delivery{grid-template-columns:184px minmax(0,1fr) 282px}.mtt .view--settings .set-grid{grid-template-columns:184px minmax(0,1fr) 274px}.mtt .tp-bar{padding:0 10px}.mtt .tp-cell{padding:0 10px;gap:8px}.mtt .plate{min-width:190px}.mtt .brand-txt small{font-size:10px}.mtt .heads{padding-left:10px;padding-right:8px}.mtt .timeline{padding-left:8px;padding-right:8px}.mtt .take{grid-template-columns:58px 24px 34px minmax(0,1fr) 48px 46px 42px;gap:6px}.mtt .head-row{font-size:11px}
}
@media (max-width:1050px){.mtt .view--timeline{grid-template-columns:140px minmax(0,1fr) 246px}.mtt .view--archive{grid-template-columns:166px minmax(0,1fr) 240px}.mtt .view--delivery{grid-template-columns:166px minmax(0,1fr) 246px}.mtt .view--settings .set-grid{grid-template-columns:160px minmax(0,1fr) 238px}.mtt .lamps{grid-template-columns:auto auto;gap:2px 10px}.mtt .rail-meters{gap:10px}.mtt .meter-bar{width:56px}.mtt .rail-live{display:none}.mtt .viewkeys{flex:0 0 auto}.mtt .viewkey{flex:0 0 auto}.mtt .heads-top .silk:first-child{display:none}.mtt .head--main .head-row:nth-child(3), .mtt .head--main .head-row:nth-child(4){display:none}.mtt .head--lat .head-row:nth-child(3){display:none}.mtt .head--take > div > small{display:none}.mtt .head--readers .reader small{display:none}.mtt .head--local .st, .mtt .head--cloud .st{display:none}.mtt .pick-rec{display:none}.mtt .inspector{padding-bottom:14px}.mtt .hybrid-cells span{display:none}.mtt .heads-note{display:none}.mtt .counter{font-size:18px}.mtt .inspector{overflow-y:auto;scrollbar-width:thin}.mtt .take{grid-template-columns:62px 24px 32px minmax(0,1fr) 44px 46px;gap:6px;height:auto;min-height:24px;padding:2px 5px}.mtt .take .tc{display:block}.mtt .timeline{grid-template-rows:34px minmax(0,1.15fr) 10px minmax(132px,1fr)}.mtt .heads{grid-template-rows:34px minmax(0,1.15fr) 10px minmax(132px,1fr)}.mtt .tl-core{grid-template-rows:28px minmax(100px,1fr) 70px 30px 30px}.mtt .heads-core{grid-template-rows:28px minmax(100px,1fr) 70px 30px 30px}.mtt .module .knob-row{gap:3px 8px}
}
@container (max-width:900px){.mtt .tp-bar{height:54px}.mtt .plate{min-width:0;padding:5px 9px 5px 7px}.mtt .brand-txt b{font-size:12px}.mtt .brand-txt small{display:none}.mtt .tp-cell{gap:6px}.mtt .key{width:50px;height:38px}.mtt .key .zi{font-size:11px}.mtt .clock b{font-size:16px}.mtt .clock small{display:none}.mtt .tp-pause-wrap{margin-left:8px;padding-left:8px}.mtt .key--pause{width:50px}.mtt .rail-meters .meter:nth-child(2){display:none}.mtt .rail-meters{gap:8px}.mtt .view--timeline{grid-template-columns:132px minmax(0,1fr) 232px}.mtt .view--archive{grid-template-columns:150px minmax(0,1fr) 214px}.mtt .view--delivery{grid-template-columns:152px minmax(0,1fr) 220px}.mtt .view--settings .set-grid{grid-template-columns:minmax(0,1fr) 214px}.mtt .view--settings .set-left{display:none}.mtt .view--settings .modules{grid-template-columns:minmax(0,1fr)}.mtt .timeline{padding:8px}.mtt .heads{padding:8px 6px 8px 8px}.mtt .head .h-title small{display:none}.mtt .heads-top .silk:first-child{display:none}.mtt .head--main .h-title .idx{display:none}.mtt .heads-core{grid-template-rows:26px minmax(96px,1fr) 64px 28px 28px}.mtt .tl-core{grid-template-rows:26px minmax(96px,1fr) 64px 28px 28px}.mtt .timeline{grid-template-rows:32px minmax(0,1.12fr) 8px minmax(126px,1fr)}.mtt .heads{grid-template-rows:32px minmax(0,1.12fr) 8px minmax(126px,1fr)}.mtt .clip .no, .mtt .clip .wbar, .mtt .clip .cache{display:none}.mtt .clip{padding:4px 2px}.mtt .clip .role{font-size:11px}.mtt .take{grid-template-columns:60px 24px 30px minmax(0,1fr) 42px 44px;gap:5px;font-size:12px}.mtt .take .td{display:none}.mtt .takes-hd .th-meta{display:none}.mtt .pick-text{font-size:12px;-webkit-line-clamp:2}.mtt .pick-meta{grid-template-columns:1fr 1fr}.mtt .ins-hd .cn{display:none}.mtt .inspector{padding:8px 9px 8px 10px;gap:7px}.mtt .module .knob-wrap{min-width:56px}.mtt .tl-meta{display:none}.mtt .statusbar .sb-r .opt{display:none}.mtt .peak-note, .mtt .today-note{font-size:11px}.mtt .arch-main{padding:8px}.mtt .day .dn{font-size:11px}.mtt .daytape{height:64px}.mtt .set-left, .mtt .apply, .mtt .arch-left, .mtt .arch-right, .mtt .dlv-left, .mtt .dlv-right{padding:9px 10px}.mtt .ledger{font-size:11px}.mtt .ledger th:nth-child(6), .mtt .ledger td:nth-child(6){display:none}.mtt .ledger th:nth-child(1){width:86px!important}.mtt .ledger th:nth-child(2), .mtt .ledger th:nth-child(3){width:46px!important}.mtt .ledger th:nth-child(4){width:74px!important}.mtt .ledger th:nth-child(5){width:92px!important}.mtt .code{font-size:11px}
}
@container (max-width:760px){.mtt .view--timeline{grid-template-columns:96px minmax(0,1fr)}.mtt .inspector{grid-column:1 / -1;display:none}.mtt .view--timeline{grid-template-rows:minmax(0,1fr) 0}
}
@media (prefers-reduced-motion:reduce){.mtt *, .mtt *::before, .mtt *::after{animation-duration:.001ms !important;animation-iteration-count:1 !important;transition-duration:.001ms !important;scroll-behavior:auto !important}.mtt .reel .rot{animation:none !important}
}
@media print{.mtt{height:auto;overflow:visible;background:#fff}.mtt .deck{height:auto;display:block}.mtt .transport, .mtt .statusbar, .mtt .toast, .mtt .viewkeys{display:none !important}.mtt .view{display:block !important}.mtt .view[hidden]{display:block !important}.mtt .bench{display:block}.mtt .timeline, .mtt .inspector, .mtt .heads{height:auto}
}


.mtt{box-sizing:border-box;height:100%;min-height:0;padding-top:var(--dsh-frame-top-clearance,0px);background:var(--panel);position:relative;overflow:hidden}
/* deck 的隐式列默认按 max-content 撑（整页时无所谓，面板里会被拖窄）：钉成 1fr，允许内部收缩 */
.mtt .deck{height:100%;grid-template-columns:minmax(0,1fr)}
.mtt .bench,.mtt .view{min-width:0}
.mtt .arch-main{grid-template-columns:minmax(0,1fr)}
.mtt .toast{position:fixed}

.mtt{container-type:inline-size;background:var(--panel)}

/* port adjustments
   mock 是整页，插件是面板：面板宽度可以小于视口（DSH 侧栏占位），所以
   deck.css 里 1180 / 1050 断点（仍是视口 media query）需要按「面板宽度」补一份。
   只补面板适配必需的两组：≤1050 的内部滚动/隐藏项，901–1050 的四域列宽。 */
@container (max-width:1050px){
  .mtt .inspector{overflow-y:auto;overflow-x:hidden;scrollbar-width:thin}
  .mtt .head-window, .mtt .heads-note, .mtt .rail-live{display:none}
  .mtt .rail-meters{gap:10px}
  .mtt .meter-bar{width:56px}
}
@container (min-width:901px) and (max-width:1050px){
  .mtt .view--timeline{grid-template-columns:140px minmax(0,1fr) 246px}
  .mtt .view--archive{grid-template-columns:166px minmax(0,1fr) 240px}
  .mtt .view--delivery{grid-template-columns:166px minmax(0,1fr) 246px}
  .mtt .view--settings .set-grid{grid-template-columns:160px minmax(0,1fr) 238px}
}
`

    //#region 常量

    /** 时区标签按运行机器的真实偏移算，不硬编码 UTC+8。 */
    const TZ_LABEL = (() => {
      const off = -new Date().getTimezoneOffset() / 60
      const shown = Number.isInteger(off) ? String(off) : off.toFixed(1)
      return `UTC${off >= 0 ? '+' : ''}${shown}`
    })()

    const ROLE_CN = { narrator: '旁白', dialogue: '对话', mixed: '混合' }
    const ROLE_GLYPH = { narrator: '旁', dialogue: '对', mixed: '混' }
    const SOURCE_CN = { local: '本地', cloud: '云端' }
    const WEEK_CN = ['日', '一', '二', '三', '四', '五', '六']
    const BODY_TEXT = 'text={{java.encodeURI(speakText)}}&speed={{speakSpeed}}'
    const CURL_SAMPLE = '瑞贝卡垂下眼皮，以掩饰自己眼中的疲惫。'

    const HINTS = {
      timeline: '← → 选择片段 · 1–4 切换工作面 · 悬停流水看读数',
      settings: '拖动旋钮或方向键微调 · Ctrl/⌘+S 保存并生效 · 还原丢弃草稿',
      archive: '点日带或日表选中一天 · 30/7 切换范围 · CSV 导出当前范围',
      delivery: '复制导入地址即可交付 · 令牌已拼进 URL · 错误码在右侧',
    }

    /** 工具函数：宿主接口只保证字段存在性，不保证数值类型，一律容错。 */
    const num = (v, d = 0) => {
      const n = Number(v)
      return Number.isFinite(n) ? n : d
    }
    const pad2 = (n) => String(n).padStart(2, '0')
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v))
    const fmtInt = (n) => num(n).toLocaleString('en-US')
    /** 字节 → "512 MB"（剪辑台的读数一律到 MB，别出现小数尾巴） */
    const fmtBytes = (n) => `${fmtInt(Math.round(num(n) / 1048576))} MB`
    /** 秒 → "3:03"（分:秒，时间线刻度） */
    const mmss = (sec) => `${Math.floor(num(sec) / 60)}:${pad2(Math.floor(num(sec) % 60))}`
    /** 秒 → "03:03"（带盘计数） */
    const mmssPad = (sec) => `${pad2(Math.floor(num(sec) / 60))}:${pad2(Math.floor(num(sec) % 60))}`
    /** 秒 → "2:45.4"（拾取头区间） */
    const mmssTenth = (sec) => `${Math.floor(num(sec) / 60)}:${pad2(Math.floor(num(sec) % 60))}.${Math.floor((num(sec) % 1) * 10)}`
    /** 秒 → "223:21"（累计时长，时:分） */
    const hm = (sec) => `${Math.floor(num(sec) / 3600)}:${pad2(Math.floor((num(sec) % 3600) / 60))}`
    /** 秒 → "1:27:00"（运行时长，时:分:秒） */
    const hms = (sec) => {
      const s = Math.max(0, Math.floor(num(sec)))
      return `${Math.floor(s / 3600)}:${pad2(Math.floor((s % 3600) / 60))}:${pad2(s % 60)}`
    }
    const latSec = (ms) => (num(ms) > 0 ? `${(num(ms) / 1000).toFixed(2)}s` : '—')
    /** 分位数：没有样本时显示 —（0.00 会被误读成真的零延迟） */
    const latQ = (ms, samples) => (num(samples) > 0 ? (num(ms) / 1000).toFixed(2) : '—')
    const clock = (ts) => {
      const d = ts ? new Date(num(ts)) : new Date()
      return `${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`
    }
    const dateStr = (ts) => {
      const d = ts ? new Date(num(ts)) : new Date()
      return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
    }
    const weekdayOfTs = (ts) => `周${WEEK_CN[new Date(num(ts)).getDay()]}`
    /** days[].day 是宿主按 UTC 自然日切的键，星期几也用 UTC 算，别让时区把它挪一天。 */
    const weekdayOfDay = (day) => `周${WEEK_CN[new Date(`${day}T12:00:00Z`).getUTCDay()]}`
    const dayTag = (day) => String(day || '').slice(5).replace('-', '·')
    const todayKeyUTC = () => new Date().toISOString().slice(0, 10)
    const ago = (ts, now) => {
      if (!ts) return '—'
      const diff = Math.max(0, num(now || Date.now()) - num(ts))
      if (diff < 3000) return '刚刚'
      if (diff < 60000) return `${Math.round(diff / 1000)} 秒前`
      if (diff < 3600000) return `${Math.round(diff / 60000)} 分钟前`
      return `${Math.round(diff / 3600000)} 小时前`
    }

    /** client 形如 `a1b2c3d4@192.168.31.61`：设备只能从这两个真实片段取，不能编场景名。 */
    const ipOf = (client) => {
      const s = String(client || '')
      const at = s.indexOf('@')
      if (at >= 0) return s.slice(at + 1) || '—'
      return s || '—'
    }
    const hashOf = (client) => {
      const s = String(client || '')
      const at = s.indexOf('@')
      return at > 0 ? s.slice(0, at) : ''
    }
    const deviceOf = (client) => hashOf(client) || ipOf(client)

    /** /listening 记录的 source：local / hybrid-local 是本地，cloud / hybrid-cloud / mimo 是云端。 */
    function sourceOf(r) {
      const s = String(r?.source || '')
      if (s.includes('local')) return { label: '本地', key: 'local' }
      if (s.includes('cloud') || s === 'mimo' || r?.format === 'wav-stream') return { label: '云端', key: 'cloud' }
      return { label: '—', key: '' }
    }

    //#endregion

    //#region 配置草稿：读取 → 拍平（保留全部可编辑字段） → 脏标 → 嵌套 patch

    /**
     * 表单用「扁平 data-path → 字符串」保存草稿，保存时再还原成嵌套 patch。
     * 好处：脏标只是逐 path 比较、轮询不覆盖用户未保存输入的判断也只比一份快照。
     */
    const FIELDS = [
      { path: 'server.host', label: '监听地址', module: 'transport' },
      { path: 'server.port', label: '服务端口', module: 'transport' },
      { path: 'server.publicUrl', label: '对外地址', module: 'transport' },
      { path: 'upstream.provider', label: '渲染来源', module: 'engine' },
      { path: 'upstream.baseUrl', label: '上游地址', module: 'transport' },
      { path: 'upstream.model', label: '云端模型', module: 'engine' },
      { path: 'upstream.keys', label: 'API Key', module: 'transport' },
      { path: 'upstream.timeoutMs', label: '上游超时', module: 'transport' },
      { path: 'upstream.maxRetry', label: '最大重试', module: 'transport' },
      { path: 'upstream.hybrid.maxCloudBootstrap', label: '云顶班上限', module: 'engine' },
      { path: 'upstream.hybrid.cloudConcurrency', label: '云并发', module: 'engine' },
      { path: 'upstream.hybrid.targetRms', label: '目标响度', module: 'engine' },
      { path: 'upstream.hybrid.warmup', label: '本地预热', module: 'engine' },
      { path: 'upstream.local.pythonPath', label: 'Python 路径', module: 'local' },
      { path: 'upstream.local.serverScript', label: 'Sidecar 脚本', module: 'local' },
      { path: 'upstream.local.modelPath', label: '模型目录', module: 'local' },
      { path: 'upstream.local.port', label: '本地端口', module: 'local' },
      { path: 'upstream.local.idleUnloadSeconds', label: '空闲卸载', module: 'local' },
      { path: 'upstream.local.startupTimeoutMs', label: '启动超时', module: 'local' },
      { path: 'upstream.local.requestTimeoutMs', label: '请求超时', module: 'local' },
      { path: 'upstream.local.refs.narrator.wav', label: '旁白参考音', module: 'local' },
      { path: 'upstream.local.refs.narrator.text', label: '旁白参考文本', module: 'local' },
      { path: 'upstream.local.refs.dialogue.wav', label: '对话参考音', module: 'local' },
      { path: 'upstream.local.refs.dialogue.text', label: '对话参考文本', module: 'local' },
      { path: 'voices.narrator.voice', label: '旁白音色', module: 'voice' },
      { path: 'voices.narrator.style', label: '旁白风格', module: 'voice' },
      { path: 'voices.dialogue.voice', label: '对话音色', module: 'voice' },
      { path: 'voices.dialogue.style', label: '对话风格', module: 'voice' },
      { path: 'synth.maxSegmentChars', label: '每段字数', module: 'synth' },
      { path: 'synth.maxTextChars', label: '最长文本', module: 'synth' },
      { path: 'synth.concurrency', label: '合成并发', module: 'synth' },
      { path: 'synth.stream', label: '流式返回', module: 'synth' },
      { path: 'cache.enabled', label: '启用缓存', module: 'synth' },
      { path: 'cache.maxEntries', label: '缓存条目', module: 'synth' },
      { path: 'cache.ttlSeconds', label: '缓存 TTL', module: 'synth' },
      { path: 'limits.rpm', label: '限速 RPM', module: 'synth' },
      { path: 'auth.enabled', label: 'Basic 鉴权', module: 'auth' },
      { path: 'auth.user', label: '用户名', module: 'auth' },
      { path: 'auth.pass', label: '口令', module: 'auth' },
      { path: 'auth.token', label: 'URL 令牌', module: 'auth' },
      { path: 'legado.extraHeaders', label: '附加请求头', module: 'transport' },
      { path: 'log.ring', label: '日志环', module: 'auth' },
    ]

    const NUMERIC_FIELDS = new Set([
      'server.port', 'upstream.timeoutMs', 'upstream.maxRetry',
      'upstream.hybrid.maxCloudBootstrap', 'upstream.hybrid.cloudConcurrency', 'upstream.hybrid.targetRms',
      'upstream.local.port', 'upstream.local.idleUnloadSeconds',
      'upstream.local.startupTimeoutMs', 'upstream.local.requestTimeoutMs',
      'synth.maxSegmentChars', 'synth.maxTextChars', 'synth.concurrency',
      'cache.maxEntries', 'cache.ttlSeconds', 'limits.rpm', 'log.ring',
    ])
    const BOOL_FIELDS = new Set([
      'upstream.hybrid.warmup', 'synth.stream', 'cache.enabled', 'auth.enabled',
    ])

    const str = (v, d = '') => (v == null ? d : String(v))

    /** 服务端（redact 后）配置 → 扁平草稿。密钥是掩码、口令是圆点，都是「只读占位」。 */
    function fromConfig(cfg) {
      const c = cfg || {}
      const srv = c.server || {}
      const up = c.upstream || {}
      const hy = up.hybrid || {}
      const lo = up.local || {}
      const refs = lo.refs || {}
      const nref = refs.narrator || {}
      const dref = refs.dialogue || {}
      const voices = c.voices || {}
      const nv = voices.narrator || {}
      const dv = voices.dialogue || {}
      const synth = c.synth || {}
      const cache = c.cache || {}
      const auth = c.auth || {}
      const legado = c.legado || {}
      const limits = c.limits || {}
      const log = c.log || {}
      const headers = legado.extraHeaders && typeof legado.extraHeaders === 'object' && !Array.isArray(legado.extraHeaders)
        ? legado.extraHeaders
        : {}
      return {
        'server.host': str(srv.host, '0.0.0.0'),
        'server.port': str(srv.port, '8291'),
        'server.publicUrl': str(srv.publicUrl),
        'upstream.provider': str(up.provider, 'mimo'),
        'upstream.baseUrl': str(up.baseUrl),
        'upstream.model': str(up.model),
        'upstream.keys': Array.isArray(up.keys) ? up.keys.join('\n') : '',
        'upstream.timeoutMs': str(up.timeoutMs, '120000'),
        'upstream.maxRetry': str(up.maxRetry, '3'),
        'upstream.hybrid.maxCloudBootstrap': str(hy.maxCloudBootstrap, '6'),
        'upstream.hybrid.cloudConcurrency': str(hy.cloudConcurrency, '2'),
        'upstream.hybrid.targetRms': str(hy.targetRms, '0.126'),
        'upstream.hybrid.warmup': Boolean(hy.warmup),
        'upstream.local.pythonPath': str(lo.pythonPath),
        'upstream.local.serverScript': str(lo.serverScript),
        'upstream.local.modelPath': str(lo.modelPath),
        'upstream.local.port': str(lo.port, '8398'),
        'upstream.local.idleUnloadSeconds': str(lo.idleUnloadSeconds, '300'),
        'upstream.local.startupTimeoutMs': str(lo.startupTimeoutMs, '180000'),
        'upstream.local.requestTimeoutMs': str(lo.requestTimeoutMs, '180000'),
        'upstream.local.refs.narrator.wav': str(nref.wav),
        'upstream.local.refs.narrator.text': str(nref.text),
        'upstream.local.refs.dialogue.wav': str(dref.wav),
        'upstream.local.refs.dialogue.text': str(dref.text),
        'voices.narrator.voice': str(nv.voice),
        'voices.narrator.style': str(nv.style),
        'voices.dialogue.voice': str(dv.voice),
        'voices.dialogue.style': str(dv.style),
        'synth.maxSegmentChars': str(synth.maxSegmentChars, '100'),
        'synth.maxTextChars': str(synth.maxTextChars, '10000'),
        'synth.concurrency': str(synth.concurrency, '4'),
        'synth.stream': Boolean(synth.stream),
        'cache.enabled': Boolean(cache.enabled),
        'cache.maxEntries': str(cache.maxEntries, '500'),
        'cache.ttlSeconds': str(cache.ttlSeconds, '7200'),
        'limits.rpm': str(limits.rpm, '100'),
        'auth.enabled': Boolean(auth.enabled),
        'auth.user': str(auth.user),
        'auth.pass': str(auth.pass),
        'auth.token': str(auth.token),
        'legado.extraHeaders': JSON.stringify(headers, null, 2),
        'log.ring': str(log.ring, '500'),
      }
    }

    /** 逐字段比较草稿与已生效快照；返回顺序按 FIELDS（也就是表单自上而下）。 */
    function diffFields(draft, applied) {
      const out = []
      if (!draft || !applied) return out
      for (const f of FIELDS) {
        if (JSON.stringify(draft[f.path]) !== JSON.stringify(applied[f.path])) {
          out.push({ path: f.path, label: f.label, module: f.module, from: applied[f.path], to: draft[f.path] })
        }
      }
      return out
    }

    const getPath = (obj, path) => String(path).split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj)
    function setPath(obj, path, value) {
      const keys = String(path).split('.')
      let cur = obj
      for (let i = 0; i < keys.length - 1; i++) {
        const k = keys[i]
        if (cur[k] == null || typeof cur[k] !== 'object') cur[k] = {}
        cur = cur[k]
      }
      cur[keys[keys.length - 1]] = value
    }

    /**
     * 只把改动过的 path 合成嵌套 patch。三条保护：
     *  - 密钥掩码（含 … / •）不回写，避免把占位符存成真 key；
     *  - 口令含圆点（掩码）不回写；
     *  - 附加请求头必须是 JSON 对象，否则整个保存中止（不静默丢改动）。
     */
    function buildPatch(draft, changes) {
      const patch = {}
      const problems = []
      for (const ch of changes) {
        const path = ch.path
        const v = draft[path]
        if (path === 'upstream.keys') {
          const lines = String(v == null ? '' : v).split(/\r?\n/).map((s) => s.trim()).filter(Boolean)
          const real = lines.filter((k) => !k.includes('…') && !k.includes('•') && !k.includes('·'))
          // 整行都是掩码 / 清空：视为「沿用已保存的密钥」，不提交
          if (!real.length) continue
          setPath(patch, path, real)
          continue
        }
        if (path === 'auth.pass') {
          const s = String(v == null ? '' : v)
          if (s.includes('•') || s.includes('·')) continue
          setPath(patch, path, s)
          continue
        }
        if (path === 'legado.extraHeaders') {
          let obj
          try {
            obj = JSON.parse(String(v == null ? '' : v) || '{}')
          } catch {
            problems.push('附加请求头不是合法 JSON')
            continue
          }
          if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
            problems.push('附加请求头必须是 JSON 对象')
            continue
          }
          setPath(patch, path, obj)
          continue
        }
        if (BOOL_FIELDS.has(path)) {
          setPath(patch, path, Boolean(v))
          continue
        }
        if (NUMERIC_FIELDS.has(path)) {
          const n = Number(v)
          if (String(v == null ? '' : v).trim() === '' || !Number.isFinite(n)) {
            problems.push(`${ch.label} 必须是数字`)
            continue
          }
          setPath(patch, path, n)
          continue
        }
        setPath(patch, path, v == null ? '' : v)
      }
      return { patch, problems }
    }

    function fmtDirtyVal(v) {
      if (typeof v === 'boolean') return v ? '开' : '关'
      if (v == null || v === '') return '—'
      const s = String(v).replace(/\s+/g, ' ')
      return s.length > 34 ? `${s.slice(0, 32)}…` : s
    }

    //#endregion

    //#region 交付物 / 下载 / 剪贴板

    /** 与 src/service.mjs handleLegadoJson 的 payload 同构；页面只读，不请求 /legado.json。 */
    function legadoPayload(imp, cfg) {
      const headers = {
        'Content-Type': 'application/x-www-form-urlencoded',
        ...((cfg && cfg.legado && cfg.legado.extraHeaders) || {}),
      }
      const listen = String(imp?.listenUrl || '')
      const option = { method: 'POST', body: BODY_TEXT, header: headers }
      return [{
        name: 'MiMo TTS 听书',
        url: `${listen},${JSON.stringify(option)}`,
        contentType: 'audio/wav',
        concurrentRate: '4',
      }]
    }

    function curlText(listenUrl) {
      const url = String(listenUrl || '—')
      return [
        `curl -X POST '${url}' \\`,
        "  -H 'Content-Type: application/x-www-form-urlencoded' \\",
        `  --data-urlencode 'text=${CURL_SAMPLE}' \\`,
        '  --output test.wav',
      ].join('\n')
    }

    function download(name, text, mime) {
      try {
        const blob = new Blob([text], { type: mime || 'text/plain;charset=utf-8' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = name
        document.body.appendChild(a)
        a.click()
        a.remove()
        setTimeout(() => URL.revokeObjectURL(url), 1500)
        return true
      } catch {
        return false
      }
    }

    /** 剪贴板：优先 async API，失败退回 execCommand（DSH 面板可能是非安全上下文）。 */
    function execCopy(text) {
      try {
        const ta = document.createElement('textarea')
        ta.value = text
        ta.setAttribute('readonly', '')
        ta.style.cssText = 'position:fixed;top:-1000px;left:0;opacity:0'
        document.body.appendChild(ta)
        ta.select()
        ta.setSelectionRange(0, text.length)
        const ok = document.execCommand('copy')
        ta.remove()
        return ok
      } catch {
        return false
      }
    }
    function writeClipboard(text) {
      return new Promise((resolve) => {
        let done = false
        const fallback = () => { if (!done) { done = true; resolve(execCopy(text)) } }
        try {
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(() => { if (!done) { done = true; resolve(true) } }).catch(fallback)
            return
          }
        } catch { /* 走兜底 */ }
        fallback()
      })
    }

    //#endregion

    //#region 时间线几何（由 live.recent 计算，不发明数据）

    /**
     * 把 recent[]（接口按时间升序）变成一条首尾相接的节目带：
     * 宽度 ∝ audioSeconds，段内缝 = segments，刻条 = latencyMs，命中 = cacheHit。
     * 空数据 / 全是 0 秒时不产出 NaN：宽度退回等分，读数仍是真实值。
     */
    function buildTimeline(recent) {
      const rows = (Array.isArray(recent) ? recent : []).filter(Boolean).map((r) => ({
        at: num(r.at),
        chars: num(r.chars),
        segments: Math.max(1, num(r.segments, 1)),
        bytes: num(r.bytes),
        audioSeconds: Math.max(0, num(r.audioSeconds)),
        latencyMs: num(r.latencyMs),
        cacheHit: Boolean(r.cacheHit),
        role: ROLE_CN[r.role] ? r.role : 'narrator',
        source: sourceOf(r).key,
        sourceLabel: sourceOf(r).label,
        error: Boolean(r.error),
        client: r.client || '',
        text: r.text || '',
        format: r.format || '',
      }))
      rows.sort((a, b) => a.at - b.at)

      const totalAudio = rows.reduce((a, r) => a + r.audioSeconds, 0)
      const totalChars = rows.reduce((a, r) => a + r.chars, 0)
      let weights = rows.map((r) => r.audioSeconds)
      // 误差行没有 audioSeconds：给一个最小可见宽度，而不是让它消失
      if (rows.length && totalAudio <= 0) weights = rows.map(() => 1)
      else if (rows.length) {
        const fill = Math.max(totalAudio * 0.01, 0.05)
        weights = weights.map((w) => (w > 0 ? w : fill))
      }
      const wSum = weights.reduce((a, w) => a + w, 0) || 1

      const maxChars = Math.max(1, ...rows.map((r) => r.chars))
      const maxLatency = Math.max(0, ...rows.map((r) => r.latencyMs))
      const latScale = Math.max(1000, Math.ceil(maxLatency / 1000) * 1000)
      const okLat = rows.filter((r) => !r.error && r.latencyMs > 0)
      const avgLatency = okLat.length ? okLat.reduce((a, r) => a + r.latencyMs, 0) / okLat.length : 0
      const cacheHits = rows.filter((r) => r.cacheHit).length

      let acc = 0
      const list = rows.map((r, i) => {
        const wPct = (weights[i] / wSum) * 100
        const startPct = acc
        acc += wPct
        const startSec = totalAudio > 0 ? (startPct / 100) * totalAudio : 0
        const endSec = totalAudio > 0 ? (acc / 100) * totalAudio : 0
        return {
          ...r,
          index: i,
          // 选中身份：at 是主键（真实接口里不变）；sig 兜住「同一毫秒 / 模拟时钟推移」的场合
          sig: `${r.text}|${r.chars}|${r.role}|${r.latencyMs}|${r.audioSeconds}|${r.segments}`,
          wPct,
          startPct,
          endPct: acc,
          startSec,
          endSec,
          wbar: clamp((r.chars / maxChars) * 100, 8, 100),
          latPct: clamp((r.latencyMs / latScale) * 100, 4, 100),
        }
      })

      return { list, totalAudio, totalChars, maxChars, maxLatency, latScale, avgLatency, cacheHits }
    }

    /**
     * 刻度：约 6–9 个标签（30 秒级窗口 = 每 30s 一个，跟 mock 一致），
     * 小刻度是标签步长的 1/6，保证刻度线密度稳定、标签不糊成一片。
     */
    function rulerTicks(total) {
      if (!(total > 0)) return { labelStep: 0, minorStep: 0, ticks: [] }
      const steps = [1, 2, 5, 10, 15, 30, 60, 120, 300, 600, 900, 1800]
      const nice = (raw) => {
        for (const s of steps) if (s >= raw) return s
        return 1800
      }
      const labelStep = nice(total / 8)
      const minorStep = Math.max(1, Math.round(labelStep / 6))
      const ticks = []
      for (let t = 0; t <= total + 1e-6; t += minorStep) {
        const isMajor = Math.abs(t / labelStep - Math.round(t / labelStep)) < 1e-6
        ticks.push({ t, pct: (t / total) * 100, major: isMajor })
        if (ticks.length > 400) break
      }
      return { labelStep, minorStep, ticks }
    }

    //#endregion

    //#region 通用件（旋钮 / 拨杆 / 芯片 / 分段 / 输入 / VU 表）

    const KNOB_TICKS = (() => {
      const out = []
      const cx = 24
      const cy = 24
      for (let i = 0; i <= 10; i++) {
        const a = ((-135 + 270 * (i / 10)) * Math.PI) / 180
        out.push({
          x1: cx + 17.2 * Math.sin(a),
          y1: cy - 17.2 * Math.cos(a),
          x2: cx + 21.2 * Math.sin(a),
          y2: cy - 21.2 * Math.cos(a),
        })
      }
      return out
    })()

    function KnobTicks() {
      return h('svg', { className: 'knob-ticks', viewBox: '0 0 48 48', 'aria-hidden': 'true' },
        KNOB_TICKS.map((t, i) => h('line', {
          key: i,
          x1: t.x1.toFixed(2), y1: t.y1.toFixed(2), x2: t.x2.toFixed(2), y2: t.y2.toFixed(2),
          stroke: '#aaa492', strokeWidth: 1,
        })))
    }

    function Knob({ label, value, min, max, step, unit, dirty, onChange, ariaLabel }) {
      const v = clamp(num(value, min), min, max)
      const ratio = max > min ? (v - min) / (max - min) : 0
      const angle = -135 + 270 * ratio
      const drag = useRef(null)

      const commit = (next) => {
        const snapped = clamp(Math.round(next / step) * step, min, max)
        onChange(snapped)
      }
      const onPointerDown = (e) => {
        if (e.pointerType === 'mouse' && e.button !== 0) return
        e.preventDefault()
        try { e.currentTarget.focus() } catch { /* noop */ }
        try { e.currentTarget.setPointerCapture(e.pointerId) } catch { /* noop */ }
        drag.current = { y: e.clientY, value: v }
      }
      const onPointerMove = (e) => {
        if (!drag.current) return
        const range = max - min
        commit(drag.current.value + ((drag.current.y - e.clientY) / 120) * range)
      }
      const endDrag = () => { drag.current = null }
      const onKeyDown = (e) => {
        let next = null
        if (e.key === 'ArrowUp' || e.key === 'ArrowRight') next = v + step
        else if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') next = v - step
        else if (e.key === 'PageUp') next = v + step * 5
        else if (e.key === 'PageDown') next = v - step * 5
        else if (e.key === 'Home') next = min
        else if (e.key === 'End') next = max
        if (next == null) return
        e.preventDefault()
        e.stopPropagation()
        commit(next)
      }

      return h('div', { className: dirty ? 'knob-wrap is-dirty' : 'knob-wrap', 'data-label': label },
        h('span', { className: 'kl' }, label),
        h('div', { className: 'knob-holder' },
          h(KnobTicks),
          h('div', {
            className: 'knob',
            tabIndex: 0,
            role: 'slider',
            'aria-label': ariaLabel || `${label}（${unit || ''}）`,
            'aria-valuemin': min,
            'aria-valuemax': max,
            'aria-valuenow': v,
            title: `${label} · ${v}${unit || ''}（拖动或方向键）`,
            'data-min': min,
            'data-max': max,
            'data-step': step,
            'data-unit': unit || '',
            style: { '--angle': `${angle.toFixed(2)}deg` },
            onPointerDown,
            onPointerMove,
            onPointerUp: endDrag,
            onPointerCancel: endDrag,
            onKeyDown,
          })),
        h('output', { className: 'knob-val' }, String(v)))
    }

    function Toggle({ label, checked, onChange, disabled }) {
      return h('div', { className: 'toggle-wrap' },
        h('button', {
          className: 'toggle',
          type: 'button',
          role: 'switch',
          'aria-checked': Boolean(checked),
          'aria-label': label,
          disabled: Boolean(disabled),
          onClick: () => onChange(!checked),
        }),
        h('span', { className: 'tv' }, checked ? '开' : '关'))
    }

    function Chips({ options, value, onChange, ariaLabel }) {
      return h('div', { className: 'chips', role: 'group', 'aria-label': ariaLabel },
        (options || []).map((opt) => h('button', {
          key: opt,
          className: 'chip',
          type: 'button',
          'aria-pressed': String(opt === value),
          onClick: () => onChange(opt),
        }, opt)))
    }

    function Seg({ options, value, onChange, ariaLabel }) {
      return h('div', { className: 'seg', role: 'group', 'aria-label': ariaLabel },
        (options || []).map((opt) => h('button', {
          key: opt.value,
          className: 'seg-key',
          type: 'button',
          'aria-pressed': String(opt.value === value),
          onClick: () => onChange(opt.value),
        }, opt.label)))
    }

    function Field({ label, sub, children, style }) {
      return h('label', { className: 'field', style },
        h('span', { className: 'fl' }, label, sub ? h('i', null, sub) : null),
        children)
    }

    function Input(props) {
      const { value, onChange, type = 'text', inputMode, placeholder, spellCheck, disabled, style } = props
      return h('input', {
        className: 'input',
        type,
        inputMode,
        value: value == null ? '' : value,
        placeholder,
        spellCheck: spellCheck === true,
        disabled: Boolean(disabled),
        style,
        onChange: (e) => onChange(e.target.value),
      })
    }

    function Textarea({ value, onChange, rows = 2, placeholder, spellCheck }) {
      return h('textarea', {
        className: 'input',
        rows,
        value: value == null ? '' : value,
        placeholder,
        spellCheck: spellCheck === true,
        onChange: (e) => onChange(e.target.value),
      })
    }

    function HeadRow({ k, v }) {
      return h('div', { className: 'head-row' }, h('span', null, k), v)
    }
    function Rowx({ k, v }) {
      return h('div', { className: 'rowx' }, h('span', null, k), h('b', null, v))
    }

    /** VU 表：量真实缓存占用，不是假电平。 */
    const VU_GEOM = (() => {
      const cx = 100, cy = 90, R = 62
      const pt = (a, r) => [cx + r * Math.sin((a * Math.PI) / 180), cy - r * Math.cos((a * Math.PI) / 180)]
      const a0 = -62, a1 = 62
      const [x0, y0] = pt(a0, R)
      const [x1, y1] = pt(a1, R)
      const arc = `M ${x0.toFixed(2)} ${y0.toFixed(2)} A ${R} ${R} 0 0 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`
      const [rx, ry] = pt(a0 + 124 * 0.86, R)
      const redArc = `M ${rx.toFixed(2)} ${ry.toFixed(2)} A ${R} ${R} 0 0 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`
      const ticks = []
      for (let v = 0; v <= 100; v += 5) {
        const a = a0 + 124 * (v / 100)
        const [ix, iy] = pt(a, R - 6)
        const [ox, oy] = pt(a, R)
        ticks.push({ ix: ix.toFixed(2), iy: iy.toFixed(2), ox: ox.toFixed(2), oy: oy.toFixed(2), major: v % 25 === 0 })
      }
      return { cx, cy, R, arc, redArc, ticks, a0 }
    })()

    function VuTable({ ratio }) {
      const r = clamp(num(ratio), 0, 1)
      const angle = -62 + 124 * r
      return h('svg', { viewBox: '0 0 200 100', role: 'img', 'aria-label': `缓存占用 ${Math.round(r * 100)}%` },
        h('rect', { x: 0.5, y: 0.5, width: 199, height: 99, fill: '#f0ece3', stroke: '#c9c3b3' }),
        h('path', { d: VU_GEOM.arc, fill: 'none', stroke: '#4b524c', strokeWidth: 1.2 }),
        h('path', { d: VU_GEOM.redArc, fill: 'none', stroke: '#b13a22', strokeWidth: 2.4 }),
        VU_GEOM.ticks.map((t, i) => h('line', {
          key: i, x1: t.ix, y1: t.iy, x2: t.ox, y2: t.oy,
          stroke: '#242a26', strokeWidth: t.major ? 1.1 : 0.7, opacity: t.major ? 0.85 : 0.5,
        })),
        h('circle', { cx: VU_GEOM.cx, cy: VU_GEOM.cy, r: 2.4, fill: '#242a26' }),
        h('line', {
          x1: VU_GEOM.cx, y1: VU_GEOM.cy, x2: VU_GEOM.cx, y2: VU_GEOM.cy - VU_GEOM.R + 8,
          stroke: '#b13a22', strokeWidth: 1.6, strokeLinecap: 'round',
          style: { transformOrigin: `${VU_GEOM.cx}px ${VU_GEOM.cy}px`, transform: `rotate(${angle.toFixed(2)}deg)` },
        }))
    }

    //#endregion

    //#region Transport（顶部走带台）

    function Lamp({ on, label, value, warn }) {
      return h('div', { className: `lamp${on ? ' on' : warn ? ' warn' : ' idle'}` },
        h('span', { className: 'dot' }),
        h('span', null, label),
        h('b', null, value))
    }

    function Transport(props) {
      const { service, localInfo, live, items, totalAudio, view, setView, paused, onPause, busy, act, now, error } = props
      const running = Boolean(service?.running)
      const hybrid = service?.hybrid || {}
      const rpm = live?.rpm || {}
      const localState = localInfo?.state || 'disabled'
      const localWarm = Boolean(localInfo?.warm) || localState === 'ready'
      const localStarting = localState === 'starting'
      const localText = localWarm ? 'READY' : localStarting ? 'LOAD' : localState === 'error' ? 'ERR' : localState === 'disabled' ? 'OFF' : 'STOP'
      const cloudReady = Boolean(hybrid.cloudReady)
      const busyName = busy || ''
      const transCls = ['transport']
      if (running) transCls.push('is-running', 'is-playing')
      if (paused) transCls.push('is-paused')
      if (!running) transCls.push('is-stopped')

      const key = (action, icon, zh, en, title, disabled) => h('button', {
        className: 'key',
        type: 'button',
        'data-action': action,
        title,
        disabled: Boolean(disabled),
        onClick: () => act(action),
      }, icon, h('span', { className: 'zi' }, zh), h('span', { className: 'ze' }, en))

      const startZh = busyName === 'start' || busyName === 'restart' ? '启动中' : '启动'
      const stopZh = busyName === 'stop' ? '停止中' : '停止'
      const restartZh = busyName === 'restart' ? '重启中' : '重启'

      const startIcon = h('svg', { viewBox: '0 0 12 12', 'aria-hidden': 'true' },
        h('path', { d: 'M3.2 2.2v7.6L10 6z', fill: 'currentColor', stroke: 'none' }))
      const stopIcon = h('svg', { viewBox: '0 0 12 12', 'aria-hidden': 'true' },
        h('rect', { x: 3, y: 3, width: 6, height: 6, fill: 'currentColor', stroke: 'none' }))
      const restartIcon = h('svg', { viewBox: '0 0 12 12', 'aria-hidden': 'true' },
        h('path', { d: 'M9.5 6a3.5 3.5 0 1 1-1.1-2.5' }),
        h('path', { d: 'M9.6 1.9v2.4H7.2' }))
      const pauseIcon = h('svg', { viewBox: '0 0 12 12', 'aria-hidden': 'true' },
        h('rect', { x: 3, y: 2.5, width: 2, height: 7, fill: 'currentColor', stroke: 'none' }),
        h('rect', { x: 7, y: 2.5, width: 2, height: 7, fill: 'currentColor', stroke: 'none' }))

      const ratio = clamp(num(rpm.used) / Math.max(1, num(rpm.limit, 100)), 0, 1)
      const liveCls = error ? 'rail-live paused' : running ? (paused ? 'rail-live paused' : 'rail-live') : 'rail-live stopped'
      const liveWord = error ? 'ERR' : running ? (paused ? 'PAUSED' : 'LIVE') : 'STOP'
      const viewKeys = [
        { id: 'timeline', cn: '时间线', en: 'TIMELINE' },
        { id: 'settings', cn: '渲染设置', en: 'RENDER' },
        { id: 'archive', cn: '工程史', en: 'ARCHIVE' },
        { id: 'delivery', cn: '交付', en: 'DELIVER' },
      ]

      return h('header', { className: transCls.join(' '), id: 'transport', 'aria-label': '走带台' },
        h('div', { className: 'tp-bar' },
          h('div', { className: 'tp-cell', style: { paddingLeft: 0 } },
            h('div', { className: 'plate' },
              h('svg', { className: 'reel', viewBox: '0 0 32 32', 'aria-hidden': 'true' },
                h('circle', { cx: 16, cy: 16, r: 13.4, fill: 'none', stroke: '#5c6b62', strokeWidth: 1 }),
                h('g', { className: 'rot' },
                  h('circle', { cx: 16, cy: 16, r: 8.4, fill: 'none', stroke: '#cdd5cb', strokeWidth: 1.3 }),
                  h('path', { d: 'M16 7.6v16.8M8.9 11.8l14.2 8.4M8.9 20.2l14.2-8.4', stroke: '#cdd5cb', strokeWidth: 1, opacity: 0.4 }),
                  h('circle', { cx: 16, cy: 16, r: 2.7, fill: '#b13a22' }),
                  h('circle', { cx: 16, cy: 6.9, r: 1.2, fill: '#cdd5cb' }))),
              h('div', { className: 'brand-txt' },
                h('b', null, '听书值守'),
                h('small', null, `LISTENING DECK · M-${service?.port || '—'}`)))),

          h('div', { className: 'tp-cell tp-keys', role: 'group', 'aria-label': '服务启停' },
            key('start', startIcon, startZh, 'START', '启动服务', running || Boolean(busy)),
            key('stop', stopIcon, stopZh, 'STOP', '停止服务', !running || Boolean(busy)),
            key('restart', restartIcon, restartZh, 'RESTART', '重启服务', Boolean(busy))),

          h('div', { className: 'tp-cell' },
            h('div', { className: 'lamps', 'aria-label': '机器状态' },
              h(Lamp, { on: running, label: 'RUN', value: running ? hms(service?.uptimeSec) : '—' }),
              h(Lamp, { on: localWarm, label: '本地', value: localText, warn: localStarting || localState === 'error' }),
              h(Lamp, { on: running && cloudReady, label: '云端', value: running && cloudReady ? 'STBY' : 'OFF' }),
              h(Lamp, { on: running, label: '混合', value: `${num(hybrid.bootstrapCount)}/${num(hybrid.maxCloudBootstrap)}` }))),

          h('div', { className: 'tp-cell' },
            h('div', { className: 'clock' },
              h('b', null, clock(now)),
              h('small', null, `${dateStr(now)} ${weekdayOfTs(now)} · ${TZ_LABEL}`))),

          h('div', { className: 'tp-pause-wrap' },
            h('button', {
              className: 'key key--pause',
              type: 'button',
              'data-action': 'pause',
              title: paused ? '继续实时刷新' : '暂停实时刷新（客户端冻结当前快照）',
              'data-active': String(paused),
              disabled: !running,
              onClick: onPause,
            }, pauseIcon, h('span', { className: 'zi' }, paused ? '继续' : '暂停'), h('span', { className: 'ze' }, 'PAUSE')))),

        h('div', { className: 'tp-rail' },
          h('span', { className: 'rail-label' }, '工作面 VIEW'),
          h('div', { className: 'viewkeys', role: 'group', 'aria-label': '工作面切换（快捷键 1–4）' },
            viewKeys.map((v) => h('button', {
              key: v.id,
              className: 'viewkey',
              type: 'button',
              'data-view': v.id,
              'aria-pressed': String(view === v.id),
              onClick: () => setView(v.id),
            }, h('span', { className: 'vc' }, v.cn), h('span', { className: 've' }, v.en)))),
          h('div', { className: 'rail-meters' },
            h('div', { className: 'meter', title: '每分钟请求数 — 滑动 60 秒窗口' },
              h('span', { className: 'ml' }, 'RPM'),
              h('span', { className: 'meter-bar' }, h('i', { style: { width: `${Math.max(1.5, ratio * 100)}%` } })),
              h('span', { className: 'mv' }, `${num(rpm.used)} / ${num(rpm.limit, 100)}`)),
            h('div', { className: 'meter' },
              h('span', { className: 'ml' }, '队列'), h('span', { className: 'mv' }, String(num(rpm.waiting)))),
            h('div', { className: 'meter' },
              h('span', { className: 'ml' }, '本窗'),
              h('span', { className: 'mv' }, `${items.length} 段 · ${mmssPad(totalAudio)}`))),
          h('div', { className: liveCls },
            h('span', { className: 'dot' }),
            h('i', null, liveWord),
            h('span', null, clock(now)))))
    }

    //#endregion

    //#region 轨道头

    function localStateText(localInfo) {
      const state = localInfo?.state || 'disabled'
      if (state === 'ready' || localInfo?.warm) return '本地 · 热'
      if (state === 'starting') return '预热中'
      if (state === 'stopping') return '卸载中'
      if (state === 'error') return '本地 · 出错'
      if (state === 'disabled') return '本地 · 未启用'
      return '本地 · 已卸载'
    }

    function TrackHeads(props) {
      const { running, live, service, localInfo, items, totalAudio, totalChars, cacheHits, avgLatency, maxLatency, selectedItem, compact } = props
      const today = live?.today || {}
      const lat = live?.latency || {}
      const hybrid = service?.hybrid || {}
      const active = Array.isArray(live?.active) ? live.active : []
      const provider = service?.provider || 'mimo'
      const localWarm = Boolean(localInfo?.warm) || localInfo?.state === 'ready'

      let mainRows
      let latRows
      if (!running) {
        mainRows = [HeadRow({ k: '本窗', v: h('b', null, '—') }), HeadRow({ k: '音频总长', v: h('b', null, '—') }), HeadRow({ k: '今日', v: h('b', null, '—') }), HeadRow({ k: '缓存', v: h('b', null, '—') })]
        latRows = [HeadRow({ k: '均值', v: h('b', null, '—') }), HeadRow({ k: 'p95', v: h('b', null, '—') }), HeadRow({ k: '最慢', v: h('b', null, '—') })]
      } else {
        // 窄面板用短标签（mock 的 matchMedia 紧凑版同款）：面板 < 1050 时标签缩到能放下
        mainRows = compact
          ? [
            HeadRow({ k: '段/字', v: h('b', null, `${items.length} / ${fmtInt(totalChars)}`) }),
            HeadRow({ k: '音频', v: h('b', null, mmssPad(totalAudio)) }),
          ]
          : [
            HeadRow({ k: '本窗 段 / 字', v: h('b', null, `${items.length} / ${fmtInt(totalChars)}`) }),
            HeadRow({ k: '音频总长', v: h('b', null, mmssPad(totalAudio)) }),
            HeadRow({ k: '今日', v: h('b', null, `${fmtInt(today.segments)} 段 · ${hm(today.seconds)}`) }),
            HeadRow({ k: '缓存命中', v: h('b', null, `${cacheHits} / ${items.length}`) }),
          ]
        latRows = compact
          ? [
            HeadRow({ k: '均值', v: h('b', null, latSec(avgLatency)) }),
            HeadRow({ k: 'p95', v: h('b', null, latSec(lat.p95)) }),
          ]
          : [
            HeadRow({ k: '均值', v: h('b', null, latSec(avgLatency)) }),
            HeadRow({ k: 'p95', v: h('b', null, latSec(lat.p95)) }),
            HeadRow({ k: '最慢', v: h('b', null, latSec(maxLatency)) }),
          ]
      }

      let windowRows
      if (!running || !items.length) {
        windowRows = [
          h('div', { className: 'silk', style: { display: 'block', marginBottom: 2 } }, 'WINDOW ', h('b', null, '本窗')),
          HeadRow({ k: '起', v: h('b', null, '—') }),
          HeadRow({ k: '止', v: h('b', null, '—') }),
          HeadRow({ k: '跨度', v: h('b', null, '—') }),
        ]
      } else {
        const first = items[0]
        const last = items[items.length - 1]
        windowRows = [
          h('div', { className: 'silk', style: { display: 'block', marginBottom: 2 } }, 'WINDOW ', h('b', null, '本窗')),
          HeadRow({ k: '起', v: h('b', null, clock(first.at)) }),
          HeadRow({ k: '止', v: h('b', null, clock(last.at)) }),
          HeadRow({ k: '跨度', v: h('b', null, `${Math.round((last.at - first.at) / 1000)} 秒${compact ? '' : ` · 末 ${items.length} 段`}`) }),
          compact ? null : HeadRow({ k: 'CUE 选中', v: h('b', null, selectedItem ? mmssTenth(selectedItem.startSec) : '—') }),
        ].filter(Boolean)
      }

      let note
      if (!running) note = '走带停止 · 无信号'
      else if (hybrid.enabled) {
        const reason = hybrid.lastSwitchReason || (localWarm ? '本地已就绪，云端顶班结束' : '离线，本地尚未就绪')
        note = `混合顶班 ${num(hybrid.bootstrapCount)}/${num(hybrid.maxCloudBootstrap)} · ${reason}`
      } else if (provider === 'local') note = '纯本地渲染 · 云端待命'
      else note = '纯云端渲染 · 本地未参与'

      let readerNodes
      if (!running) {
        readerNodes = h('div', { className: 'reader off' },
          h('span', { className: 'ld' }), h('b', null, '无设备'), h('span', { className: 'idle' }, '—'),
          h('small', null, '服务未运行'))
      } else if (!active.length) {
        readerNodes = h('div', { className: 'reader off' },
          h('span', { className: 'ld' }), h('b', null, '无设备'), h('span', { className: 'idle' }, '—'),
          h('small', null, '还没有活跃读者'))
      } else {
        readerNodes = active.slice(0, 3).map((r, i) => {
          const idle = num(r.idleMs) > 120000
          return h('div', { key: `${r.client || i}-${i}`, className: i === 0 ? 'reader' : 'reader off' },
            h('span', { className: 'ld' }),
            h('b', null, ipOf(r.client)),
            h('span', { className: 'idle' }, ago(r.at)),
            h('small', null, `${hashOf(r.client) || '设备'} · ${idle ? `最后活动 ${clock(r.at)}` : '活跃'}`))
        })
      }

      const maxBootstrap = num(hybrid.maxCloudBootstrap)
      const bootstrap = num(hybrid.bootstrapCount)
      const cellBoxes = maxBootstrap > 0 && maxBootstrap <= 8
        ? Array.from({ length: maxBootstrap }, (_, i) => h('i', { key: i, className: i < bootstrap ? 'on' : undefined }))
        : []
      const hybridCells = h('div', { className: 'hybrid-cells', 'aria-label': '混合顶班配额' },
        ...cellBoxes,
        h('span', null, `顶班 ${bootstrap}/${maxBootstrap}`))

      return h('div', { className: 'heads', 'aria-label': '轨道头' },
        h('div', { className: 'heads-top' },
          h('span', { className: 'silk' }, 'TRACKS ', h('b', null, '通道')),
          h('span', { className: 'silk' }, running ? `${items.length} 段` : '停机')),
        h('div', { className: 'heads-core' },
          h('div', { className: 'head head--take' },
            h('div', null,
              h('span', { className: 'counter' }, running ? mmssPad(totalAudio) : '--:--'),
              h('small', null, 'TAPE'))),
          h('div', { className: 'head head--main' },
            h('div', { className: 'h-title' }, h('span', { className: 'idx' }, '01'), h('b', null, 'PROGRAM'), h('small', null, '主带')),
            h('div', { className: 'head-rows' }, ...mainRows)),
          h('div', { className: 'head head--lat' },
            h('div', { className: 'h-title' }, h('span', { className: 'idx' }, 'LAT'), h('b', null, '渲染耗时')),
            h('div', { className: 'head-rows' }, ...latRows)),
          h('div', { className: 'head head--local' },
            h('span', { className: 'idx' }, '02'), h('b', null, 'LOCAL'),
            h('span', { className: 'st' }, running ? localStateText(localInfo) : '已停止')),
          h('div', { className: 'head head--cloud' },
            h('span', { className: 'idx' }, '03'), h('b', null, 'CLOUD'),
            h('span', { className: 'st' }, running ? (hybrid.cloudReady ? '云端 · 备用' : '云端 · 不可用') : '已停止'))),
        h('div', { className: 'heads-gap', 'aria-hidden': 'true' }),
        h('div', { className: 'head head--readers' },
          h('div', { className: 'silk', style: { marginBottom: 1 } }, 'READERS ', h('b', null, '读者')),
          h('div', { className: 'readers' }, readerNodes),
          hybridCells,
          h('div', { className: 'head-window' }, ...windowRows),
          h('div', { className: 'heads-note' }, note)))
    }

    //#endregion

    //#region 时间线（节目带）

    function clipLabel(item) {
      const src = item.sourceLabel === '—' ? '来源未知' : item.sourceLabel
      return [
        `第 ${item.index + 1} 段`,
        ROLE_CN[item.role] || item.role,
        src,
        item.error ? '渲染失败' : item.cacheHit ? '缓存命中' : '未命中',
        `延迟 ${latSec(item.latencyMs)}`,
        `${item.chars} 字`,
        item.audioSeconds > 0 ? `音频 ${item.audioSeconds.toFixed(1)}s` : '音频 —',
        clock(item.at),
        hashOf(item.client) ? `设备 ${hashOf(item.client)}` : '',
      ].filter(Boolean).join(' · ')
    }

    function TapeArea(props) {
      const { running, paused, items, totalAudio, totalChars, cacheHits, avgLatency, live, service, selectedIndex, selItem, onSelect, onHover, hoverAt, onAct } = props
      const lat = live?.latency || {}
      const hybrid = service?.hybrid || {}
      const ticks = useMemo(() => rulerTicks(totalAudio), [totalAudio])
      const p95 = num(lat.p95)
      const latScale = props.latScale || 1000
      const p95Pct = p95 > 0 ? clamp((p95 / latScale) * 100, 0, 100) : 0
      const cloudCount = items.filter((x) => x.source === 'cloud').length
      const empty = !running || items.length === 0
      const first = items[0]
      const last = items[items.length - 1]

      const clips = items.map((item) => {
        const slow = !item.error && p95 > 0 && item.latencyMs > p95
        const cls = ['clip', item.cacheHit ? 'hit' : 'miss']
        if (slow) cls.push('slow')
        if (hoverAt != null && hoverAt === item.at) cls.push('is-hover')
        if (item.error) cls.push('error')
        const label = clipLabel(item)
        return h('button', {
          key: `${item.at}-${item.index}`,
          className: cls.join(' '),
          type: 'button',
          role: 'listitem',
          'aria-selected': String(item.index === selectedIndex),
          'aria-label': label,
          title: label,
          'data-clip': item.index,
          style: { flexBasis: `${item.wPct.toFixed(3)}%` },
          onClick: () => onSelect(item),
          onMouseEnter: () => onHover(item),
          onMouseLeave: () => onHover(null),
          onFocus: () => onHover(item),
          onBlur: () => onHover(null),
        },
        h('span', { className: 'role' }, ROLE_GLYPH[item.role] || '旁'),
        h('span', { className: 'wbar', 'aria-hidden': 'true' }, h('i', { style: { width: `${item.wbar.toFixed(1)}%` } })),
        h('span', { className: 'no', 'aria-hidden': 'true' }, pad2(item.index + 1)),
        h('span', { className: 'cache', 'aria-hidden': 'true' }),
        h('span', { className: 'lat', 'aria-hidden': 'true' }, h('i', { style: { width: `${item.latPct.toFixed(1)}%` } })),
        item.segments > 1 ? h('span', { className: 'seg', 'aria-hidden': 'true' }) : null)
      })

      const latBars = items.map((item) => h('span', {
        key: `lat-${item.at}-${item.index}`,
        className: `lbar${!item.error && p95 > 0 && item.latencyMs > p95 ? ' slow' : ''}`,
        style: { flexBasis: `${item.wPct.toFixed(3)}%` },
        title: `${item.error ? '失败' : latSec(item.latencyMs)}`,
      }, h('i', { style: { height: `${item.latPct.toFixed(1)}%` } })))

      const localRail = items.map((item) => h('span', {
        key: `rl-${item.at}-${item.index}`,
        className: 'rbar',
        style: { flexBasis: `${item.wPct.toFixed(3)}%` },
      }, item.source === 'local' ? h('i') : null))
      const cloudRail = items.map((item) => h('span', {
        key: `rc-${item.at}-${item.index}`,
        className: 'rbar',
        style: { flexBasis: `${item.wPct.toFixed(3)}%` },
      }, item.source === 'cloud' ? h('i') : null))
      let railNote = null
      if (running && !cloudCount) {
        railNote = h('span', { className: 'rail-note' },
          hybrid.enabled
            ? `本窗无云端段 · 启动时顶班 ${num(hybrid.bootstrapCount)}/${num(hybrid.maxCloudBootstrap)} 段，本地就绪后切回`
            : '本窗无云端段')
      }

      const emptyNode = empty
        ? h('div', { className: 'tl-empty' },
          h('div', { className: 'leader' }, h('span', null, running ? 'LEADER · 空带' : 'LEADER · 无信号')),
          h('h3', null, running ? '走带空带 —— 还没有片段' : '走带停止 —— 服务未运行'),
          h('p', null, running
            ? '窗口里还没有任何朗读片段。让手机上的阅读 App 朗读一段，第一枚 clip 会落在带尾。'
            : '停机后实时片段与渲染读数全部冻结为空态。历史工程仍在「工程史」里，参数仍在「渲染设置」里。'),
          running ? null : h('button', { className: 'btn btn--tape', type: 'button', onClick: () => onAct('start') }, '启动服务'))
        : null

      const takeRows = items.slice().reverse().map((item) => {
        const slow = !item.error && p95 > 0 && item.latencyMs > p95
        const cls = ['take']
        if (hoverAt != null && hoverAt === item.at) cls.push('is-hover')
        return h('div', {
          key: `take-${item.at}-${item.index}`,
          className: cls.join(' '),
          role: 'listitem',
          tabIndex: 0,
          'data-clip': item.index,
          'aria-selected': String(item.index === selectedIndex),
          title: clipLabel(item),
          onClick: () => onSelect(item),
          onKeyDown: (e) => {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(item) }
          },
          onMouseEnter: () => onHover(item),
          onMouseLeave: () => onHover(null),
          onFocus: () => onHover(item),
          onBlur: () => onHover(null),
        },
        h('span', { className: 'tt' }, clock(item.at)),
        h('span', { className: 'tr' }, ROLE_GLYPH[item.role] || '旁'),
        h('span', { className: `ts ${item.source || ''}`.trim() }, item.sourceLabel === '—' ? '未知' : item.sourceLabel),
        h('span', { className: 'tx' }, item.text || '（没有文本）'),
        h('span', { className: 'td', title: `${hashOf(item.client) || '设备'} · ${ipOf(item.client)}` },
          hashOf(item.client) || ipOf(item.client)),
        h('span', { className: `tl${slow ? ' slow' : ''}` }, item.error ? '失败' : latSec(item.latencyMs)),
        h('span', { className: `tc ${item.error ? 'miss' : item.cacheHit ? 'hit' : 'miss'}` },
          item.error ? '失败' : item.cacheHit ? '命中' : '未命中'))
      })

      const meta = running && items.length
        ? `${clock(first.at)} → ${clock(last.at)} · ${fmtInt(totalChars)} 字 · 渲染 ${((avgLatency * items.length) / 1000).toFixed(1)}s · 命中 ${cacheHits}/${items.length}`
        : '—'
      const recTagCls = ['rec-tag']
      if (paused) recTagCls.push('paused')
      const recTagText = !running ? 'STOP' : paused ? 'PAUSED' : `REC ${mmssPad(totalAudio)}`

      return h('div', { className: 'timeline' },
        h('div', { className: 'tl-top' },
          h('div', { className: 'tl-title' },
            h('span', { className: 'eyebrow' }, 'TIMELINE'),
            h('b', null, `本窗 · 末 ${items.length} 段`),
            h('span', { className: recTagCls.join(' ') }, h('i'), recTagText)),
          h('div', { className: 'tl-meta' }, meta)),
        h('div', { className: 'tl-core' },
          h('div', { className: 'ruler', 'aria-hidden': 'true' },
            ticks.ticks.map((t, i) => h('span', {
              key: `tk${i}`,
              className: `tick ${t.major ? 'major' : 'minor'}`,
              style: { left: `${t.pct.toFixed(3)}%` },
            })),
            ticks.ticks.filter((t) => t.major && t.t < totalAudio - 1).map((t, i) => h('span', {
              key: `tl${i}`,
              className: `tlabel${t.t === 0 ? ' edge-l' : ''}`,
              style: { left: `${t.pct.toFixed(3)}%` },
            }, mmss(t.t))),
            selItem ? h('span', { className: 'cue', style: { left: `${clamp(selItem.startPct, 0, 100).toFixed(3)}%` } }) : null),
          h('div', { className: 'tape', 'aria-label': '节目带（按音频时长剪接的合成片段）' }, ...clips),
          h('div', { className: 'latlane', 'aria-label': '每段渲染耗时' },
            ...latBars,
            p95 > 0 ? h('span', { className: 'p95', style: { bottom: `${p95Pct.toFixed(2)}%` } },
              h('span', null, `p95 ${(p95 / 1000).toFixed(2)}s`)) : null),
          h('div', { className: 'rail rail--local', 'aria-label': '本地来源泳道' }, ...localRail),
          h('div', { className: 'rail rail--cloud', 'aria-label': '云端来源泳道' }, ...cloudRail, railNote),
          running && items.length ? h('div', { className: 'playhead', 'aria-hidden': 'true' }) : null,
          emptyNode),
        h('div', { className: 'tl-gap', 'aria-hidden': 'true' }),
        h('div', { className: 'takes' },
          h('div', { className: 'takes-hd' },
            h('span', { className: 'silk' }, 'TAKES ', h('b', null, '场记 · 最近流水')),
            h('span', { className: 'th-meta' }, running ? `最近 ${items.length} 条 · 与时间线同源` : '停机 · 无实时流水')),
          h('div', { className: 'takes-list', role: 'list', 'aria-label': '最近合成流水' },
            running
              ? (items.length ? takeRows
                : h('div', { className: 'empty-takes' },
                  h('b', null, '走带空带，还没有片段'),
                  h('span', null, '让手机上的阅读 App 朗读一段，第一枚 clip 会落在带尾。')))
              : h('div', { className: 'empty-takes' },
                h('b', null, '走带停止，无实时流水'),
                h('span', null, `最后快照 ${clock(last?.at || Date.now())} · 启动服务后，新片段会重新出现在带尾。`)))))
    }

    //#endregion

    //#region Inspector（拾取头 / 引擎 / 缓存 / 今日 / 容量）

    function ttlText(sec) {
      const s = num(sec)
      if (s >= 3600) {
        const hours = s / 3600
        return `${Number.isInteger(hours) ? hours : hours.toFixed(1)} 小时`
      }
      return `${s} 秒`
    }

    function Inspector(props) {
      const { running, live, service, localInfo, config, item, items, onAct, onActLocal, busy, lastSync } = props
      const cache = live?.cache || {}
      const today = live?.today || {}
      const lat = live?.latency || {}
      const rpm = live?.rpm || {}
      const hybrid = service?.hybrid || {}
      const provider = service?.provider || config?.upstream?.provider || 'mimo'
      const localState = localInfo?.state || 'disabled'
      const localWarm = Boolean(localInfo?.warm) || localState === 'ready'
      const localEnabled = Boolean(localInfo?.enabled) || provider === 'local' || provider === 'hybrid'
      const cloudReady = Boolean(hybrid.cloudReady)
      const p95 = num(lat.p95)
      const cacheRatio = num(cache.maxEntries) > 0 ? clamp(num(cache.entries) / num(cache.maxEntries), 0, 1) : 0
      const rpmRatio = clamp(num(rpm.used) / Math.max(1, num(rpm.limit, 100)), 0, 1)
      const cfg = config || {}
      const ttl = cfg.cache?.ttlSeconds

      if (!running) {
        const rows = [
          ['今日段数', `${fmtInt(today.segments)} 段`],
          ['今日时长', hm(today.seconds)],
          ['平均延迟', latSec(live?.avgLatencyMs)],
          ['缓存命中', `${((num(cache.hitRate) || 0) * 100).toFixed(1)}%`],
          ['累计请求', fmtInt(live?.totals?.requests)],
          ['累计时长', hm(live?.totals?.seconds)],
        ]
        return h('aside', { className: 'inspector', 'aria-label': '拾取头 · 选中片段与引擎读数' },
          h('div', { className: 'ins-offline' },
            h('div', { className: 'ins-hd' }, h('span', { className: 'silk' }, 'PICKUP ', h('b', null, '拾取头')), h('span', { className: 'cn' }, '停机')),
            h('div', { className: 'ins-stopped' },
              h('div', { className: 'banner' },
                h('b', null, '服务已停止，实时数据为空'),
                h('span', null, `最后快照 ${clock(lastSync)}`, h('br'), '停止后 /api/state 不再产生新片段；启动后恢复走带。')),
              h('button', { className: 'btn btn--tape', type: 'button', onClick: () => onAct('start') }, '启动服务')),
            h('div', { className: 'ins-block', style: { marginTop: 8 } },
              h('div', { className: 'ins-hd' }, h('span', { className: 'silk' }, 'LAST SNAPSHOT ', h('b', null, '停机前读数'))),
              h('div', { className: 'cache-rows' },
                rows.map(([k, v]) => h(Rowx, { key: k, k, v: h('b', null, v) }))))))
      }

      const srcKey = item ? item.source : ''
      const tags = []
      if (item) {
        tags.push(h('span', { key: 'src', className: `tag ${srcKey === 'local' ? 'tape' : srcKey === 'cloud' ? 'cloud' : 'hollow'}` },
          item.sourceLabel === '—' ? '来源未知' : item.sourceLabel))
        tags.push(h('span', { key: 'role', className: 'tag hollow' }, ROLE_CN[item.role] || item.role))
        tags.push(h('span', { key: 'cache', className: `tag ${item.error ? 'grease' : item.cacheHit ? 'hollow' : 'grease'}` },
          item.error ? '渲染失败' : item.cacheHit ? '命中' : '未命中'))
        if (item.index === items.length - 1) tags.push(h('span', { key: 'tail', className: 'tag grease pick-rec' }, '带尾 · REC'))
        if (!item.error && p95 > 0 && item.latencyMs > p95) tags.push(h('span', { key: 'slow', className: 'tag grease' }, '慢渲染'))
      }

      const pickup = h('div', { className: 'ins-block' },
        h('div', { className: 'ins-hd' },
          h('span', { className: 'silk' }, 'PICKUP ', h('b', null, '拾取头')),
          h('span', { className: 'cn' }, item ? `${mmssTenth(item.startSec)} – ${mmssTenth(item.endSec)}` : '等待片段')),
        h('div', { className: 'pick-tags' }, ...tags),
        h('p', { className: 'pick-text' }, item ? (item.text || '（这段没有文本）') : '还没有片段。让阅读 App 朗读一段，这里会显示正在合成的句子。'),
        h('div', { className: 'pick-meta' },
          h('div', { className: 'kv' }, h('span', { className: 'k' }, '延迟 LATENCY'), h('span', { className: 'v' }, item ? (item.error ? '失败' : latSec(item.latencyMs)) : '—')),
          h('div', { className: 'kv' }, h('span', { className: 'k' }, '字数 CHARS'), h('span', { className: 'v' }, item ? `${item.chars} 字` : '—')),
          h('div', { className: 'kv' }, h('span', { className: 'k' }, '音频 AUDIO'), h('span', { className: 'v' }, item && item.audioSeconds > 0 ? `${item.audioSeconds.toFixed(1)} s` : '—')),
          h('div', { className: 'kv' }, h('span', { className: 'k' }, '段 SEG'), h('span', { className: 'v' }, item ? `${item.segments} 段` : '—')),
          h('div', { className: 'kv' }, h('span', { className: 'k' }, '到达 AT'), h('span', { className: 'v' }, item ? clock(item.at) : '—')),
          h('div', { className: 'kv' }, h('span', { className: 'k' }, '角色 ROLE'), h('span', { className: 'v' }, item ? (ROLE_CN[item.role] || item.role) : '—'))),
        h('div', { className: 'pick-device' },
          h('span', null, '设备'),
          h('b', null, item ? `${deviceOf(item.client)} · ${ipOf(item.client)}` : '—')))

      const localRowCls = ['eng-row']
      if (localState === 'starting') localRowCls.push('warm')
      else if (!localWarm) localRowCls.push('off')
      const engLocalSub = !localEnabled
        ? '当前渲染来源不使用本地引擎'
        : localState === 'stopped'
          ? `内存已释放 · 空闲卸载 ${num(localInfo?.idleUnloadSeconds)}s`
          : localState === 'starting'
            ? `加载中… 首次约 ${localInfo?.loadS ? `${localInfo.loadS}s` : '数秒'}`
            : localState === 'error'
            ? (localInfo?.lastError || '本地引擎出错')
            : `pid ${localInfo?.pid || '—'} · :${localInfo?.port || '—'} · 加载 ${localInfo?.loadS ?? '—'}s · 最近 ${localInfo?.lastUsed ? clock(localInfo.lastUsed) : '—'}`
      const localBtnText = !localEnabled ? '本地未启用'
        : localState === 'starting' ? '加载中…'
          : localState === 'stopping' ? '卸载中…'
            : localWarm ? '卸下本地模型' : '加载本地模型'
      const localBtnDisabled = !localEnabled || localState === 'starting' || localState === 'stopping' || Boolean(busy)
      const localHint = !localEnabled ? '当前渲染来源不使用本地引擎'
        : localWarm ? `空闲 ${num(localInfo?.idleUnloadSeconds)}s 自动卸载`
          : `云端顶班（最多 ${num(hybrid.maxCloudBootstrap)} 段）`
      const hybridNote = hybrid.enabled
        ? (localWarm
          ? `顶班 ${num(hybrid.bootstrapCount)}/${num(hybrid.maxCloudBootstrap)} 段 · ${hybrid.lastSwitchReason || '本地已就绪'}`
          : `云端顶班（最多 ${num(hybrid.maxCloudBootstrap)} 段）`)
        : provider === 'local' ? '纯本地渲染 · 云端待命' : '纯云端渲染 · 本地未参与'

      const engine = h('div', { className: 'ins-block' },
        h('div', { className: 'ins-hd' },
          h('span', { className: 'silk' }, 'ENGINE ', h('b', null, '引擎')),
          h('span', { className: 'cn' }, provider)),
        h('div', { className: 'eng' },
          h('div', { className: localRowCls.join(' ') },
            h('span', { className: 'ld' }),
            h('b', null, '本地 Qwen3-TTS'),
            h('span', { className: 'st' }, !localEnabled ? '未启用' : localWarm ? '热' : localState === 'starting' ? '加载中' : localState === 'error' ? '出错' : '已卸载'),
            h('span', { className: 'val' }, localWarm && num(localInfo?.rssMb) > 0 ? `${(num(localInfo.rssMb) / 1024).toFixed(1)} GB` : '—')),
          h('div', { className: 'eng-sub' }, engLocalSub),
          h('div', { className: 'eng-act' },
            h('button', {
              className: 'btn btn--sm',
              type: 'button',
              disabled: localBtnDisabled,
              onClick: () => onActLocal(localWarm ? 'unload' : 'load'),
            }, localBtnText),
            h('span', { className: 'eng-sub' }, localHint)),
          h('div', { className: `eng-row${cloudReady ? '' : ' off'}` },
            h('span', { className: 'ld' }),
            h('b', null, 'MiMo 云端'),
            h('span', { className: 'st' }, cloudReady ? '就绪 · 备用' : '不可用'),
            h('span', { className: 'val', title: cfg.upstream?.model || '' }, cfg.upstream?.model || '未配置模型')),
          h('div', { className: 'eng-sub' }, hybridNote)))

      const cacheBlock = h('div', { className: 'ins-block' },
        h('div', { className: 'ins-hd' },
          h('span', { className: 'silk' }, 'CACHE ', h('b', null, '缓存带')),
          h('span', { className: 'cn' }, `命中 ${((num(cache.hitRate) || 0) * 100).toFixed(1)}%`)),
        h('div', { className: 'vu' },
          h(VuTable, { ratio: cacheRatio }),
          h('div', { className: 'reads' },
            h('b', null, `${Math.round(cacheRatio * 100)}%`),
            h('small', null, `${fmtInt(cache.entries)} / ${fmtInt(cache.maxEntries)} 条`),
            h('small', null, `${fmtBytes(cache.bytes)} / ${fmtBytes(cache.maxBytes)}`))),
        h('div', { className: 'cache-rows' },
          Rowx({ k: '命中', v: h('b', null, fmtInt(cache.hits)) }),
          Rowx({ k: '未命中', v: h('b', null, fmtInt(cache.misses)) }),
          Rowx({ k: 'TTL', v: h('b', null, ttlText(ttl)) }),
          Rowx({ k: '复用率', v: h('b', null, `${((num(cache.hitRate) || 0) * 100).toFixed(1)}%`) })))

      const todayBlock = h('div', { className: 'ins-block' },
        h('div', { className: 'ins-hd' },
          h('span', { className: 'silk' }, 'TODAY ', h('b', null, '今日工程')),
          h('span', { className: 'cn' }, `${fmtInt(today.segments)} 段 · ${hm(today.seconds)}`)),
        h('div', { className: 'today-grid' },
          h('div', { className: 'kv' }, h('span', { className: 'k' }, '合成时长'), h('span', { className: 'v' }, hm(today.seconds))),
          h('div', { className: 'kv' }, h('span', { className: 'k' }, '平均延迟'), h('span', { className: 'v' }, latSec(live?.avgLatencyMs))),
          h('div', { className: 'kv' }, h('span', { className: 'k' }, '字符'), h('span', { className: 'v' }, fmtInt(today.chars))),
          h('div', { className: 'kv' }, h('span', { className: 'k' }, '错误'), h('span', { className: 'v' }, String(num(today.errors))))),
        h('div', { className: 'lat-row', title: `最近 ${num(lat.samples)} 段延迟分位` },
          h('span', null, 'p50 ', h('b', null, latQ(lat.p50, lat.samples))),
          h('span', null, 'p95 ', h('b', null, latQ(lat.p95, lat.samples))),
          h('span', null, 'max ', h('b', null, latQ(lat.max, lat.samples))),
          h('span', null, 'rpm ', h('b', null, `${num(rpm.used)}/${num(rpm.limit, 100)}`))))

      const limits = h('div', { className: 'ins-block' },
        h('div', { className: 'ins-hd' },
          h('span', { className: 'silk' }, 'LIMITS ', h('b', null, '容量')),
          h('span', { className: 'cn' }, `并发 ${num(cfg.synth?.concurrency)} · 队列 ${num(rpm.waiting)}`)),
        h('div', { className: 'limit-meter' },
          h('span', { className: 'ml' }, 'RPM'),
          h('span', { className: 'meter-bar' }, h('i', { style: { width: `${Math.max(1.5, rpmRatio * 100)}%` } })),
          h('span', { className: 'mv' }, `${num(rpm.used)} / ${num(rpm.limit, 100)}`)),
        h('div', { className: 'cache-rows' },
          Rowx({ k: '并发', v: h('b', null, `${num(cfg.synth?.concurrency)} 路`) }),
          Rowx({ k: '队列', v: h('b', null, String(num(rpm.waiting))) }),
          Rowx({ k: '缓存 TTL', v: h('b', null, ttlText(ttl)) }),
          Rowx({ k: '本地空闲卸载', v: h('b', null, `${num(cfg.upstream?.local?.idleUnloadSeconds)} s`) })))

      return h('aside', { className: 'inspector', 'aria-label': '拾取头 · 选中片段与引擎读数' },
        h('div', { className: 'ins-online' }, pickup, engine, cacheBlock, todayBlock, limits))
    }

    //#endregion

    //#region 渲染设置（带机架）

    function settingsChainValue(live, draft) {
      const cache = live?.cache || {}
      return {
        cache: `${fmtInt(cache.entries)} / ${fmtInt(cache.maxEntries)}`,
        engine: String(draft?.['upstream.provider'] || 'mimo'),
        concurrency: String(draft?.['synth.concurrency'] || '4'),
      }
    }

    function scrollToModule(id) {
      const el = document.getElementById(id)
      if (!el) return
      const reduced = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches
      el.scrollIntoView({ block: 'start', behavior: reduced ? 'auto' : 'smooth' })
    }

    function SettingsView(props) {
      const { live, service, localInfo, draft, applied, changes, presetVoices, saving, savedAt, onSet, onSave, onRevert, onExportConfig, onActLocal, busy } = props
      const d = draft || applied || {}
      const dirty = (path) => changes.some((c) => c.path === path)
      const moduleDirty = (name) => changes.some((c) => c.module === name)
      const set = (path) => (value) => onSet(path, value)
      const chain = settingsChainValue(live, d)

      const input = (path, opts = {}) => h(Input, {
        value: d[path],
        onChange: set(path),
        ...opts,
      })
      const knob = (path, label, min, max, step, unit, ariaLabel) => h(Knob, {
        key: path,
        label,
        value: d[path],
        min,
        max,
        step,
        unit,
        ariaLabel,
        dirty: dirty(path),
        onChange: (v) => onSet(path, String(v)),
      })
      const toggle = (path, label) => h(Toggle, {
        label,
        checked: Boolean(d[path]),
        onChange: (v) => onSet(path, v),
      })
      const field = (label, sub, child, style) => h(Field, { label, sub, style }, child)
      const twoCol = (...children) => h('div', { className: 'field', style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 } }, ...children)

      const moduleShell = (id, no, title, silk, name, children) => h('div', {
        className: `module${moduleDirty(name) ? ' is-dirty' : ''}`,
        id,
        'data-module': true,
      },
      h('div', { className: 'module-hd' },
        h('span', { className: 'mh' },
          h('span', { className: 'mnum' }, no),
          h('b', null, title),
          h('span', { className: 'silk' }, silk)),
        h('span', { className: 'dirty-dot', title: '有未保存改动' })),
      ...children)

      const providerSeg = h(Seg, {
        options: [
          { value: 'mimo', label: '云端' },
          { value: 'local', label: '本地' },
          { value: 'hybrid', label: '混合' },
        ],
        value: d['upstream.provider'],
        ariaLabel: '渲染来源',
        onChange: (v) => onSet('upstream.provider', v),
      })

      const localState = localInfo?.state || 'disabled'
      const localTag = !localInfo?.enabled ? '随渲染来源切换' : localStateText(localInfo)

      const modules = [
        moduleShell('mod-engine', '01', '引擎', 'ENGINE', 'engine', [
          h('div', { className: 'ctrl-row' },
            h('div', { className: 'cl' }, h('b', null, '渲染来源'), h('i', null, 'PROVIDER')),
            providerSeg),
          h('div', { className: 'knob-row' },
            knob('upstream.hybrid.maxCloudBootstrap', '云顶班', 0, 30, 1, '段', '云顶班上限（段）'),
            knob('upstream.hybrid.cloudConcurrency', '云并发', 1, 2, 1, '路', '云并发（路，MiMo 克隆最多 2 路）'),
            h('div', { className: 'knob-wrap', 'data-label': '本地预热' },
              h('span', { className: 'kl' }, '本地预热'),
              toggle('upstream.hybrid.warmup', '本地预热'))),
          field('目标响度', 'RMS', input('upstream.hybrid.targetRms', { inputMode: 'decimal', type: 'text' })),
          field('云端模型', 'MODEL', input('upstream.model', { spellCheck: false })),
        ]),

        moduleShell('mod-local', '02', '本地引擎', 'LOCAL QWEN3-TTS', 'local', [
          h('div', { className: 'ctrl-row' },
            h('div', { className: 'cl' }, h('b', null, '本地引擎'), h('i', null, 'ENABLED')),
            h('span', { className: 'tag' }, localTag)),
          field('Python', 'VENV', input('upstream.local.pythonPath', { spellCheck: false })),
          field('Sidecar 脚本', 'SERVER', input('upstream.local.serverScript', { spellCheck: false })),
          field('模型目录', 'MLX MODEL', input('upstream.local.modelPath', { spellCheck: false })),
          twoCol(
            h(Field, { label: '端口', sub: 'PORT', style: { padding: 0 } }, input('upstream.local.port', { type: 'number' })),
            h(Field, { label: '启动超时', sub: 'MS', style: { padding: 0 } }, input('upstream.local.startupTimeoutMs', { type: 'number' }))),
          h('div', { className: 'knob-row' },
            knob('upstream.local.idleUnloadSeconds', '空闲卸载', 0, 3600, 30, 's', '空闲卸载（秒，0=常驻）'),
            h(Field, { label: '请求超时', sub: 'MS', style: { flex: '1', padding: 0 } }, input('upstream.local.requestTimeoutMs', { type: 'number' }))),
          twoCol(
            h(Field, { label: '旁白参考音', sub: 'WAV', style: { padding: 0 } }, input('upstream.local.refs.narrator.wav', { spellCheck: false })),
            h(Field, { label: '对话参考音', sub: 'WAV', style: { padding: 0 } }, input('upstream.local.refs.dialogue.wav', { spellCheck: false }))),
          twoCol(
            h(Field, { label: '旁白参考文本', sub: 'REF TEXT', style: { padding: 0 } }, input('upstream.local.refs.narrator.text')),
            h(Field, { label: '对话参考文本', sub: 'REF TEXT', style: { padding: 0 } }, input('upstream.local.refs.dialogue.text'))),
        ]),

        moduleShell('mod-voice', '03', '音色', 'VOICE PRESET', 'voice', [
          h('div', { className: 'field' },
            h('span', { className: 'fl' }, '旁白 ', h('i', null, 'NARRATOR · 模式 preset')),
            h(Chips, {
              options: presetVoices,
              value: d['voices.narrator.voice'],
              ariaLabel: '旁白音色',
              onChange: (v) => onSet('voices.narrator.voice', v),
            })),
          field('旁白风格', 'STYLE', input('voices.narrator.style')),
          h('div', { className: 'field' },
            h('span', { className: 'fl' }, '对话 ', h('i', null, 'DIALOGUE · 模式 preset')),
            h(Chips, {
              options: presetVoices,
              value: d['voices.dialogue.voice'],
              ariaLabel: '对话音色',
              onChange: (v) => onSet('voices.dialogue.voice', v),
            })),
          field('对话风格', 'STYLE', input('voices.dialogue.style')),
          h('p', { className: 'hint' }, '混合启动的云端阶段使用参考音克隆；这里的 MiMo 预置音色只在纯云端模式生效。'),
        ]),

        moduleShell('mod-synth', '04', '合成与缓存', 'SYNTH · CACHE', 'synth', [
          h('div', { className: 'knob-row' },
            knob('synth.concurrency', '并发', 1, 8, 1, '路', '合成并发（路）'),
            knob('synth.maxSegmentChars', '每段字数', 10, 300, 10, '字', '每段最大字数'),
            knob('limits.rpm', '限速', 10, 300, 10, '/min', '每分钟请求上限')),
          h('div', { className: 'ctrl-row' },
            h('div', { className: 'cl' }, h('b', null, '流式返回'), h('i', null, 'STREAM')),
            toggle('synth.stream', '流式返回')),
          h('div', { className: 'ctrl-row' },
            h('div', { className: 'cl' }, h('b', null, '缓存'), h('i', null, 'CACHE')),
            toggle('cache.enabled', '启用缓存')),
          h('div', { className: 'knob-row' },
            knob('cache.maxEntries', '缓存条目', 50, 5000, 50, '条', '缓存条目上限'),
            knob('cache.ttlSeconds', '缓存 TTL', 600, 86400, 600, 's', '缓存 TTL（秒）'),
            knob('synth.maxTextChars', '最长文本', 1000, 20000, 1000, '字', '单次最长文本')),
          h('div', { className: 'rowx', style: { marginTop: 4 } },
            h('span', null, '缓存上限'),
            h('b', null, fmtBytes(live?.cache?.maxBytes || 0))),
        ]),

        moduleShell('mod-transport', '05', '传输', 'TRANSPORT', 'transport', [
          twoCol(
            h(Field, { label: '监听地址', sub: 'HOST', style: { padding: 0 } }, input('server.host', { spellCheck: false })),
            h(Field, { label: '端口', sub: 'PORT', style: { padding: 0 } }, input('server.port', { type: 'number' }))),
          field('对外地址', 'PUBLIC URL · 隧道/反代时填', input('server.publicUrl', { spellCheck: false, placeholder: 'https://tts.example.com' })),
          field('上游地址', 'BASE URL', input('upstream.baseUrl', { spellCheck: false })),
          field('API Key', '每行一个 · 已掩码', h(Textarea, {
            value: d['upstream.keys'],
            rows: 2,
            spellCheck: false,
            placeholder: 'sk-…（留空则沿用已保存的密钥）',
            onChange: set('upstream.keys'),
          })),
          twoCol(
            h(Field, { label: '超时', sub: 'MS', style: { padding: 0 } }, input('upstream.timeoutMs', { type: 'number' })),
            h(Field, { label: '重试', sub: 'MAX RETRY', style: { padding: 0 } }, input('upstream.maxRetry', { type: 'number' }))),
          field('附加请求头', 'JSON · 会写进导出的朗读引擎', h(Textarea, {
            value: d['legado.extraHeaders'],
            rows: 2,
            spellCheck: false,
            onChange: set('legado.extraHeaders'),
          })),
        ]),

        moduleShell('mod-auth', '06', '鉴权', 'AUTH', 'auth', [
          h('div', { className: 'ctrl-row' },
            h('div', { className: 'cl' }, h('b', null, 'Basic 鉴权'), h('i', null, 'ENABLED')),
            toggle('auth.enabled', 'Basic 鉴权')),
          field('用户名', 'USER', h(Input, {
            value: d['auth.user'], onChange: set('auth.user'), placeholder: '', spellCheck: false,
          })),
          field('口令', 'PASS · 已掩码', h(Input, { value: d['auth.pass'], onChange: set('auth.pass') })),
          field('URL 令牌', 'TOKEN · 拼进导入地址', h(Input, { value: d['auth.token'], onChange: set('auth.token'), spellCheck: false })),
          field('日志环', 'RING', h(Input, { value: d['log.ring'], onChange: set('log.ring'), type: 'number' })),
          h('p', { className: 'hint' }, '令牌同时拼进 /legado.json 与 /listening 的 URL；改完保存后请重新复制导入地址。'),
        ]),
      ]

      const appliedRows = [
        Rowx({ k: '渲染来源', v: h('b', null, String(d['upstream.provider'] || 'mimo')) }),
        Rowx({ k: '监听', v: h('b', null, `${d['server.host'] || '—'}:${d['server.port'] || '—'}`) }),
        Rowx({ k: '云端模型', v: h('b', null, String(d['upstream.model'] || '—')) }),
        Rowx({ k: '本地端口', v: h('b', null, String(d['upstream.local.port'] || '—')) }),
        Rowx({ k: '每段 / 并发', v: h('b', null, `${d['synth.maxSegmentChars'] || '—'} 字 / ${d['synth.concurrency'] || '—'} 路`) }),
        Rowx({ k: '限速', v: h('b', null, `${d['limits.rpm'] || '—'} 次/分`) }),
        Rowx({ k: '缓存', v: h('b', null, `${d['cache.maxEntries'] || '—'} 条 · TTL ${ttlText(d['cache.ttlSeconds'])}`) }),
        Rowx({ k: '对外地址', v: h('b', null, d['server.publicUrl'] || '未设置') }),
      ]

      const applyPanel = h('aside', { className: 'apply', 'aria-label': '生效与改动' },
        h('div', null, h('h2', null, '生效'), h('div', { className: 'sub' }, 'Apply · Draft')),
        h('div', { className: 'apply-sum', id: 'appliedSummary' }, ...appliedRows),
        h('div', { className: 'rowx' }, h('span', null, '最后生效'), h('b', { id: 'appliedAt' }, savedAt || '随快照装载')),
        h('div', { className: 'dirty-wrap' },
          h('div', { className: 'ins-hd', style: { paddingTop: 4, marginBottom: 0 } },
            h('span', { className: 'silk' }, 'UNSAVED ', h('b', null, '未保存改动')),
            h('span', { className: 'cn' }, `${changes.length} 项`)),
          changes.length === 0
            ? h('div', { className: 'dirty-empty' }, '无未保存改动', h('br'), '草稿与运行配置一致')
            : h('ul', { className: 'dirty-list' },
              changes.map((c) => h('li', { key: c.path },
                h('b', null, c.label), '：', fmtDirtyVal(c.from), ' → ', fmtDirtyVal(c.to))))),
        h('p', { className: 'hint' }, '保存后写入 PUT /api/config，脏标 → 保存中 → 已生效时间戳。'))

      const setLeft = h('div', { className: 'set-left' },
        h('div', null, h('h2', null, '渲染设置'), h('div', { className: 'sub' }, 'Render Rack')),
        h('div', { className: 'chain', 'aria-label': '信号链' },
          h('div', { className: 'chain-node' }, h('span', { className: 'ld' }), h('b', null, '章节正文'), ' ', h('span', { className: 'muted' }, 'TEXT')),
          h('div', { className: 'chain-link' }),
          h('div', { className: 'chain-node' }, h('span', { className: 'ld' }), h('b', null, '切分'), ' ', h('span', { className: 'muted' }, '旁白 / 对话')),
          h('div', { className: 'chain-link' }),
          h('div', { className: 'chain-node' }, h('span', { className: 'ld' }), h('b', null, '合成队列'), ' ', h('span', { className: 'muted' }, `CONCURRENCY ${chain.concurrency}`)),
          h('div', { className: 'chain-link' }),
          h('div', { className: 'chain-node' }, h('span', { className: 'ld' }), h('b', null, '缓存带'), ' ', h('span', { className: 'muted' }, chain.cache)),
          h('div', { className: 'chain-link' }),
          h('div', { className: 'chain-node' }, h('span', { className: 'ld' }), h('b', null, '引擎'), ' ', h('span', { className: 'muted' }, chain.engine)),
          h('div', { className: 'chain-link' }),
          h('div', { className: 'chain-node' }, h('span', { className: 'ld' }), h('b', null, 'WAV'), ' ', h('span', { className: 'muted' }, '整段 · 真实时长'))),
        h('p', { className: 'chain-note' }, '改动先落草稿，点「保存并生效」才写入运行配置。密钥只在本机，页面拿到的永远是掩码。'),
        h('nav', { className: 'mod-index', 'aria-label': '模块定位' },
          [
            ['mod-engine', '01', '引擎'],
            ['mod-local', '02', '本地引擎'],
            ['mod-voice', '03', '音色'],
            ['mod-synth', '04', '合成与缓存'],
            ['mod-transport', '05', '传输'],
            ['mod-auth', '06', '鉴权'],
          ].map(([id, no, name]) => h('button', { key: id, type: 'button', 'data-scroll': id, onClick: () => scrollToModule(id) },
            h('span', { className: 'n' }, no), name))))

      const savebar = h('div', {
        className: `savebar${changes.length ? ' is-dirty' : ''}${saving ? ' is-saving' : ''}`,
        id: 'savebar',
      },
      h('div', { className: 'sb-msg' },
        h('span', { className: 'dot' }),
        h('span', null,
          saving ? '保存中…'
            : changes.length ? `有 ${changes.length} 项未保存的修改`
              : savedAt ? `已生效 · ${savedAt}` : '无未保存改动')),
      h('span', { className: 'sb-hint' }, changes.length ? 'Ctrl/⌘+S 保存并生效；还原丢弃草稿' : '改动先落在草稿；保存后写回运行配置并刷新读数'),
      h('span', { className: 'sb-spacer' }),
      h('button', { className: 'btn', type: 'button', 'data-action': 'export-config', onClick: onExportConfig }, '导出配置'),
      h('button', {
        className: 'btn', type: 'button', 'data-action': 'revert', id: 'btnRevert',
        disabled: saving || changes.length === 0, onClick: onRevert,
      }, '还原'),
      h('button', {
        className: 'btn btn--tape', type: 'button', 'data-action': 'save-config', id: 'btnSave',
        disabled: saving || changes.length === 0, onClick: onSave,
      }, saving ? '保存中…' : '保存并生效'))

      return h('section', { className: 'view view--settings', id: 'view-settings', 'aria-label': '渲染设置' },
        h('div', { className: 'set-grid' },
          setLeft,
          h('div', { className: 'modules', id: 'modules' }, ...modules),
          applyPanel),
        savebar)
    }

    //#endregion

    //#region 工程史（压缩日带）

    function sortedDays(days) {
      return (Array.isArray(days) ? days : []).filter(Boolean)
        .slice()
        .sort((a, b) => (String(a.day) < String(b.day) ? -1 : String(a.day) > String(b.day) ? 1 : 0))
    }

    function ArchiveView(props) {
      const { live, range, setRange, selectedDay, onSelectDay, onExportCsv } = props
      const totals = live?.totals || {}
      const lat = live?.latency || {}
      const asc = useMemo(() => sortedDays(live?.days), [live])
      const days = range === 30 ? asc.slice(-30) : asc.slice(-7)
      const sumSec = days.reduce((a, d) => a + num(d.seconds), 0)
      const sel = days.find((d) => d.day === selectedDay) || days[days.length - 1] || null
      const todayKey = todayKeyUTC()
      const n = days.length

      const widths = days.map((d) => (sumSec > 0 ? (num(d.seconds) / sumSec) * 100 : 100 / Math.max(1, n)))
      const lefts = []
      let acc = 0
      widths.forEach((w) => { lefts.push(acc); acc += w })
      const midOf = (i) => lefts[i] + widths[i] / 2

      const notes = []
      if (n) {
        const peakIdx = days.reduce((best, d, i) => (num(d.seconds) > num(days[best].seconds) ? i : best), 0)
        const todayIdx = days.findIndex((d) => d.day === todayKey)
        const peak = days[peakIdx]
        if (todayIdx >= 0 && todayIdx === peakIdx) {
          notes.push(h('div', {
            key: 'peak',
            className: 'peak-note',
            style: { left: `${clamp(midOf(todayIdx), 1, 99).toFixed(3)}%` },
          }, `峰值 · 今日 ${Math.round(num(peak.seconds) / 60)} 分 · ${fmtInt(peak.segments)} 段`))
        } else {
          notes.push(h('div', {
            key: 'peak',
            className: 'peak-note',
            style: { left: `${clamp(midOf(peakIdx), 1, 99).toFixed(3)}%` },
          }, `峰值 ${String(peak.day).slice(5)} · ${Math.round(num(peak.seconds) / 60)} 分 · ${fmtInt(peak.segments)} 段`))
          if (todayIdx >= 0) {
            notes.push(h('div', {
              key: 'today',
              className: 'today-note',
              style: { left: `${clamp(midOf(todayIdx), 1, 99).toFixed(3)}%`, transform: 'translateX(-100%)' },
            }, `今日 ${Math.round(num(days[todayIdx].seconds) / 60)} 分`))
          }
        }
      }

      const axis = []
      days.forEach((d, i) => {
        const day = String(d.day || '')
        if (i === 0 || day.endsWith('-01')) {
          axis.push(h('span', {
            key: `mt-${i}`,
            className: 'mtick',
            style: { left: `${lefts[i].toFixed(3)}%` },
          }))
          axis.push(h('span', {
            key: `ml-${i}`,
            className: 'mlabel',
            style: { left: `${lefts[i].toFixed(3)}%`, transform: i === 0 ? 'none' : undefined },
          }, `${parseInt(day.slice(5, 7), 10)}月`))
        }
      })

      const rangeRequests = days.reduce((a, d) => a + num(d.requests), 0)
      const rangeErrors = days.filter((d) => num(d.errors) > 0).length
      const rangeLabel = `${range === 30 ? '30' : '7'} 日`

      const leftTotals = [
        ['累计时长', hm(totals.seconds)],
        ['累计字数', fmtInt(totals.chars)],
        ['累计请求', fmtInt(totals.requests)],
        ['累计段数', fmtInt(totals.segments)],
        ['累计错误', String(num(totals.errors))],
        ['缓存命中', fmtInt(totals.cacheHits)],
      ]

      const ledgerRows = days.slice().reverse().map((d) => h('tr', {
        key: d.day,
        'data-day': d.day,
        tabIndex: 0,
        'aria-selected': String(Boolean(sel) && d.day === sel.day),
        onClick: () => onSelectDay(d.day),
        onKeyDown: (e) => {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelectDay(d.day) }
        },
      },
      h('td', { className: 'd' }, String(d.day)),
      h('td', null, fmtInt(d.requests)),
      h('td', null, fmtInt(d.segments)),
      h('td', null, hm(d.seconds)),
      h('td', null, fmtInt(d.chars)),
      h('td', null, fmtBytes(d.bytes)),
      h('td', { className: num(d.errors) ? 'e' : undefined }, num(d.errors) ? String(num(d.errors)) : '—')))

      return h('section', { className: 'view view--archive', id: 'view-archive', 'aria-label': '工程史' },
        h('div', { className: 'arch-left' },
          h('div', null, h('h2', null, '工程史'), h('div', { className: 'sub' }, 'Session Archive')),
          h('div', { className: 'range-keys', role: 'group', 'aria-label': '档案范围' },
            h('button', { className: 'range-key', type: 'button', 'data-range': '30', 'aria-pressed': String(range === 30), onClick: () => setRange(30) },
              h('b', null, '30 天'), h('small', null, 'ALL TAKES')),
            h('button', { className: 'range-key', type: 'button', 'data-range': '7', 'aria-pressed': String(range === 7), onClick: () => setRange(7) },
              h('b', null, '7 天'), h('small', null, 'RECENT'))),
          h('div', { className: 'totals', id: 'totalsList' },
            leftTotals.map(([k, v]) => h('div', { key: k, className: 'trow' }, h('span', null, k), h('b', null, v)))),
          h('div', { className: 'foot' },
            h('button', { className: 'btn', type: 'button', 'data-action': 'export-csv', onClick: onExportCsv }, '导出 CSV · 日表'),
            h('p', { className: 'hint', style: { margin: 0 } }, '累计 = 服务启用以来（totals）；日带 = 按 UTC 自然日统计的合成音频秒数（days）。'))),

        h('div', { className: 'arch-main' },
          h('div', { className: 'arch-top' },
            h('div', { className: 'ah' },
              h('span', { className: 'silk' }, 'DAILY TAPE'),
              h('b', null, '压缩日带'),
              h('span', { className: 'silk' }, `${n} 日 / ${rangeLabel}`)),
            h('div', { className: 'ameta' },
              n
                ? `${String(days[0].day).slice(5)} → ${String(days[n - 1].day).slice(5)} · 一天一格 · 宽度 = 当日合成音频秒数`
                : '还没有跨天记录 · 产生跨天流量后这里会出现压缩日带')),
          h('div', { className: 'daytape-wrap' },
            ...notes,
            h('div', { className: 'daytape', 'aria-label': `${rangeLabel}压缩日带` },
              days.map((d, i) => h('button', {
                key: d.day,
                className: `day${d.day === todayKey ? ' today' : ''}`,
                type: 'button',
                'data-day': d.day,
                'aria-selected': String(Boolean(sel) && d.day === sel.day),
                style: { width: `${widths[i].toFixed(3)}%` },
                title: `${d.day} · ${fmtInt(d.requests)} 请求 · ${fmtInt(d.segments)} 段 · ${hm(d.seconds)} · ${fmtInt(d.chars)} 字${num(d.errors) ? ` · 错误 ${num(d.errors)}` : ''}`,
                onClick: () => onSelectDay(d.day),
              },
              h('span', { className: 'dn' }, range === 30 ? String(d.day).slice(8) : String(d.day).slice(5)),
              num(d.errors) ? h('span', { className: 'err', 'aria-hidden': 'true' }) : null))),
            h('div', { className: 'day-axis' }, ...axis)),
          h('div', { className: 'ledger-wrap' },
            h('div', { className: 'scroll' },
              h('table', { className: 'ledger', id: 'ledger' },
                h('thead', null, h('tr', null,
                  h('th', { style: { width: 96 } }, '日期'),
                  h('th', { style: { width: 64 } }, '请求'),
                  h('th', { style: { width: 64 } }, '段'),
                  h('th', { style: { width: 96 } }, '合成时长'),
                  h('th', { style: { width: 110 } }, '字数'),
                  h('th', { style: { width: 90 } }, '字节'),
                  h('th', null, '错误'))),
                h('tbody', null,
                  ledgerRows.length
                    ? ledgerRows
                    : h('tr', null, h('td', { colSpan: 7, style: { color: 'var(--ink-3)', padding: '10px 4px' } },
                      '还没有日统计。跨天后 /api/state 的 days[] 会自动带出每天一行。'))))))),

        h('aside', { className: 'arch-right' },
          h('div', { className: 'ins-hd', style: { borderTop: 0, paddingTop: 0 } },
            h('span', { className: 'silk' }, 'SESSION ', h('b', null, '选中日')),
            h('span', { className: 'cn' }, sel ? weekdayOfDay(sel.day) : '—')),
          h('div', { className: 'day-detail', id: 'dayDetail' },
            sel
              ? [
                h('div', { key: 'day', className: 'kv wide' },
                  h('span', { className: 'k' }, '日期 DATE'),
                  h('span', { className: 'v' }, `${sel.day} · ${weekdayOfDay(sel.day)}`)),
                h('div', { key: 'req', className: 'kv' }, h('span', { className: 'k' }, '请求'), h('span', { className: 'v' }, fmtInt(sel.requests))),
                h('div', { key: 'seg', className: 'kv' }, h('span', { className: 'k' }, '段'), h('span', { className: 'v' }, fmtInt(sel.segments))),
                h('div', { key: 'sec', className: 'kv' }, h('span', { className: 'k' }, '合成时长'), h('span', { className: 'v' }, hm(sel.seconds))),
                h('div', { key: 'chars', className: 'kv' }, h('span', { className: 'k' }, '字数'), h('span', { className: 'v' }, fmtInt(sel.chars))),
                h('div', { key: 'bytes', className: 'kv' }, h('span', { className: 'k' }, '字节'), h('span', { className: 'v' }, fmtBytes(sel.bytes))),
                h('div', { key: 'err', className: 'kv' }, h('span', { className: 'k' }, '错误'), h('span', { className: 'v' }, String(num(sel.errors)))),
              ]
              : h('div', { className: 'kv wide' },
                h('span', { className: 'k' }, '日期 DATE'),
                h('span', { className: 'v' }, '—'))),
          h('div', { className: 'arch-sec' },
            h('span', { className: 'silk' }, 'RANGE ', h('b', null, '本段合计')),
            Rowx({ k: '日数', v: h('b', null, String(n)) }),
            Rowx({ k: '请求', v: h('b', null, fmtInt(rangeRequests)) }),
            Rowx({ k: '合成时长', v: h('b', null, hm(sumSec)) }),
            Rowx({ k: '错误日', v: h('b', null, `${rangeErrors} 天`) })),
          h('div', { className: 'arch-sec' },
            h('span', { className: 'silk' }, 'LATENCY ', h('b', null, '本窗分位')),
            Rowx({ k: 'p50', v: h('b', null, latQ(lat.p50, lat.samples)) }),
            Rowx({ k: 'p95', v: h('b', null, latQ(lat.p95, lat.samples)) }),
            Rowx({ k: 'max', v: h('b', null, latQ(lat.max, lat.samples)) }),
            Rowx({ k: '样本', v: h('b', null, fmtInt(lat.samples)) })),
          h('div', { className: 'arch-sec', style: { marginTop: 'auto' } },
            Rowx({ k: '记录自', v: h('b', null, asc.length ? String(asc[0].day) : '—') }),
            Rowx({ k: '档案口径', v: h('b', null, 'UTC 自然日') })))
      )
    }

    //#endregion

    //#region 交付（母带标签）

    const ERR_CODES = [
      ['401', '令牌或口令不对 — 从本页重新复制导入地址'],
      ['429', '触发每分钟限速 — 调大「每段字数」减少分段请求'],
      ['502', '上游或本地引擎报错 — 查看时间线流水或切混合/云端兜底'],
      ['413', '文本超过单次上限 — 调大「最长文本」或分段发送'],
      ['503', '服务未启动 — 回时间线启动服务'],
      ['500', '服务内部错误 — 看宿主控制台日志'],
    ]

    function DeliveryView(props) {
      const { live, service, config, onCopy, onExportConfig } = props
      const imp = props.importInfo || {}
      const cfg = config || {}
      const running = Boolean(service?.running)
      const hasToken = Boolean(imp.hasToken)
      const lanUrls = Array.isArray(imp.lanUrls) ? imp.lanUrls : []
      const publicJson = imp.publicJsonUrl || ''
      const jsonUrl = imp.jsonUrl || '—'
      const listenUrl = imp.listenUrl || '—'
      const token = cfg.auth?.token || ''
      const extraHeaders = cfg.legado?.extraHeaders && typeof cfg.legado.extraHeaders === 'object' ? cfg.legado.extraHeaders : {}
      const extraCount = Object.keys(extraHeaders).length
      const payload = legadoPayload(imp, cfg)
      const curl = curlText(listenUrl)
      const concurrency = num(cfg.synth?.concurrency)
      const rpm = num(cfg.limits?.rpm)
      const provider = service?.provider || cfg.upstream?.provider || 'mimo'
      const dlvMeta = running
        ? `局域网直连 · ${hasToken ? '令牌已配置' : '令牌未启用'}${publicJson ? ' · 对外地址已设置' : ''}`
        : '服务已停止 · 先启动再交付'

      const checks = [
        [running, '服务运行', running ? 'RUN' : 'STOP'],
        [hasToken, 'URL 令牌', hasToken ? '已配置' : '缺失'],
        [Boolean(cfg.auth?.enabled), 'Basic 鉴权', cfg.auth?.enabled ? '开启' : '关闭'],
        [lanUrls.length > 0, '局域网入口', `${lanUrls.length} 个`],
        [Boolean(publicJson), '对外地址', publicJson || '未设置'],
        [extraCount > 0, '附加请求头', extraCount ? `${extraCount} 项` : '未设置'],
        [true, '端口', `${service?.host || cfg.server?.host || '—'}:${service?.port || cfg.server?.port || '—'}`],
        [true, '引擎', provider],
      ]

      const specRow = (sk, sv, sa) => [
        h('span', { key: `k-${sk}-${sv}`, className: 'sk' }, sk),
        h('span', { key: `v-${sk}-${sv}`, className: 'sv' }, sv),
        h('span', { key: `a-${sk}-${sv}`, className: 'sa' }, sa || null),
      ]

      return h('section', { className: 'view view--delivery', id: 'view-delivery', 'aria-label': '交付' },
        h('div', { className: 'dlv-left' },
          h('div', null, h('h2', null, '交付'), h('div', { className: 'sub' }, 'Master Delivery')),
          h('p', { className: 'chain-note', style: { margin: 0 } },
            '交付物 = 一条 Legado 在线朗读引擎。', h('br'), '本机仍是唯一渲染源。'),
          h('ol', { className: 'steps' },
            h('li', { className: 'step' },
              h('span', { className: 'sn' }, '01'),
              h('div', null, h('b', null, '确认服务在跑'),
                h('span', null, `transport 显示 RUN，端口 ${service?.port || cfg.server?.port || '—'} 在监听`))),
            h('li', { className: 'step' },
              h('span', { className: 'sn' }, '02'),
              h('div', null, h('b', null, '复制导入地址'),
                h('span', null, '或直接复制 JSON 文本（挂 Cloudflare Access 时用它）'))),
            h('li', { className: 'step' },
              h('span', { className: 'sn' }, '03'),
              h('div', null, h('b', null, '在阅读里导入'),
                h('span', null, '朗读界面 → 设置 → 在线朗读 → 网络导入 → 粘贴'))),
            h('li', { className: 'step' },
              h('span', { className: 'sn' }, '04'),
              h('div', null, h('b', null, '试一句话'),
                h('span', null, '用 curl 打 /listening，拿到真实时长 WAV 即通')))),
          h('div', { className: 'arch-sec', style: { marginTop: 'auto' } },
            Rowx({ k: '并发', v: h('b', null, `${concurrency} 路`) }),
            Rowx({ k: '限速', v: h('b', null, `${rpm} 次 / 分钟`) }),
            Rowx({ k: 'Body', v: h('b', null, 'form-urlencoded') }))),

        h('div', { className: 'dlv-main' },
          h('div', { className: 'dlv-top' },
            h('div', { className: 'dh' }, h('span', { className: 'silk' }, 'DELIVERY NOTE'), h('b', null, '母带交付单')),
            h('div', { className: 'dmeta' }, dlvMeta)),

          h('div', { className: 'labelblock' },
            h('div', { className: 'lb-hd' },
              h('span', { className: 'silk' }, 'IMPORT URL ', h('b', null, '一键导入地址')),
              h('span', { className: 'silk' }, publicJson ? 'WAN' : 'LAN')),
            h('div', { className: 'addr' },
              h('code', { id: 'importUrl' }, jsonUrl),
              h('button', { className: 'btn btn--sm btn--tape', type: 'button', 'data-copy': 'import', onClick: () => onCopy('import') }, '复制导入地址')),
            publicJson
              ? h('div', { className: 'addr', style: { marginTop: 6 } },
                h('code', { id: 'publicImportUrl' }, publicJson),
                h('button', { className: 'btn btn--sm', type: 'button', 'data-copy': 'public-import', onClick: () => onCopy('public-import') }, '复制公网'))
              : null,
            h('div', { className: 'addr-note', id: 'importNote' },
              lanUrls.length
                ? `局域网 ${lanUrls[0]} · 手机与电脑需在同一网段${publicJson ? '' : ' · 对外地址未设置'}`
                : '宿主还没探测到局域网地址 · 仍可用下方 curl 在本机验证')),

          h('div', { className: 'labelblock' },
            h('div', { className: 'lb-hd' },
              h('span', { className: 'silk' }, 'LISTEN URL ', h('b', null, '朗读接口')),
              h('span', { className: 'silk' }, 'POST · WAV')),
            h('div', { className: 'addr' },
              h('code', { id: 'listenUrl' }, listenUrl),
              h('button', { className: 'btn btn--sm', type: 'button', 'data-copy': 'listen', onClick: () => onCopy('listen') }, '复制朗读')),
            h('div', { className: 'spec', style: { marginTop: 7 } },
              specRow('METHOD', 'POST'),
              specRow('CONTENT-TYPE', 'application/x-www-form-urlencoded'),
              specRow('BODY', BODY_TEXT, h('button', { className: 'btn btn--sm btn--ghost', type: 'button', 'data-copy': 'body', onClick: () => onCopy('body') }, '复制')),
              specRow('URL 令牌', token ? `?token=${token}` : '未启用',
                token ? h('button', { className: 'btn btn--sm btn--ghost', type: 'button', 'data-copy': 'token', onClick: () => onCopy('token') }, '复制') : null),
              specRow('并发 / 限速', `${concurrency} 路 · ${rpm} 次 / 分钟`))),

          h('div', { className: 'labelblock grease' },
            h('div', { className: 'lb-hd' },
              h('span', { className: 'silk' }, 'MASTER CONTENT ', h('b', null, '母带内容 · legado.json')),
              h('button', { className: 'btn btn--sm', type: 'button', 'data-copy': 'json', onClick: () => onCopy('json') }, '复制 JSON')),
            h('pre', { className: 'code json', id: 'jsonBlock' }, JSON.stringify(payload, null, 2))),

          h('div', { className: 'labelblock' },
            h('div', { className: 'lb-hd' },
              h('span', { className: 'silk' }, 'SMOKE TEST ', h('b', null, 'curl 试一句')),
              h('button', { className: 'btn btn--sm', type: 'button', 'data-copy': 'curl', onClick: () => onCopy('curl') }, '复制 curl')),
            h('pre', { className: 'code', id: 'curlBlock' }, curl))),

        h('aside', { className: 'dlv-right' },
          h('div', null, h('h2', null, '交付校验'), h('div', { className: 'sub' }, 'Preflight')),
          h('div', { className: 'checklist' },
            checks.map(([ok, label, value]) => h('div', { key: label, className: `check${ok ? '' : ' warn'}` },
              h('span', { className: 'ck' }, ok ? '✓' : '○'),
              h('span', { className: 'cn2' }, label),
              h('span', { className: 'cv', title: String(value) }, String(value))))),
          h('div', { className: 'errcodes' },
            h('span', { className: 'silk', style: { marginBottom: 3 } }, 'ERROR CODES ', h('b', null, '错误码')),
            ERR_CODES.map(([code, fix]) => h('div', { key: code, className: 'errcode' },
              h('b', null, code), h('span', null, fix)))),
          h('div', { className: 'dlv-actions' },
            h('button', { className: 'btn btn--sm', type: 'button', 'data-copy': 'import', onClick: () => onCopy('import') }, '复制导入地址'),
            h('button', { className: 'btn btn--sm', type: 'button', 'data-copy': 'json', onClick: () => onCopy('json') }, '复制 JSON'),
            h('button', { className: 'btn btn--sm', type: 'button', 'data-copy': 'curl', onClick: () => onCopy('curl') }, '复制 curl'),
            h('button', { className: 'btn btn--sm', type: 'button', 'data-action': 'export-config', onClick: onExportConfig }, '导出配置')),
          h('p', { className: 'hint', style: { marginTop: 'auto' } },
            '挂 Cloudflare Access 时把服务令牌填进「渲染设置 · 传输 · 附加请求头」，Legado 才不会拿到登录页。')))
    }

    //#endregion

    //#region 状态条 / toast

    const PROVIDER_CN = { mimo: '云端', local: '本地', hybrid: '混合' }

    function StatusBar({ view, running, paused, error, lastSync, pausedAt, version, port, provider, hint }) {
      const dotCls = error ? 'dot warn' : !running ? 'dot off' : paused ? 'dot warn' : 'dot'
      const liveText = error
        ? 'ERROR · 读不到宿主接口'
        : !running
          ? 'STOPPED · 无实时数据'
          : paused
            ? `PAUSED · 数据冻结 ${clock(pausedAt || lastSync)}`
            : 'LIVE · /api/state'
      return h('footer', { className: 'statusbar', 'aria-label': '走带状态' },
        h('span', { className: 'sb-l' },
          h('span', dotCls.split(' ')[1] ? `dot ${dotCls.split(' ')[1]}` : 'dot'),
          h('span', null, liveText)),
        h('span', { className: 'sb-hint', title: error || hint }, error ? `读不到宿主接口：${error}` : hint),
        h('span', { className: 'sb-r' },
          h('span', null, `快照 ${lastSync ? clock(lastSync) : '—'}`),
          h('span', { className: 'sep' }, '|'),
          h('span', null, `v${version || '0.1.0'}`),
          h('span', { className: 'sep' }, '|'),
          h('span', null, `M-${port || '—'}`),
          h('span', { className: 'sep' }, '|'),
          h('span', { className: 'opt' }, `${PROVIDER_CN[provider] || provider || '—'} · 同源轮询 4s`)))
    }

    //#endregion

    //#region 侧栏图标

    function PanelGlyph({ size = 16 } = {}) {
      return h('svg', {
        width: size, height: size, viewBox: '0 0 24 24', fill: 'none',
        focusable: 'false', 'aria-hidden': 'true', style: { flex: 'none', display: 'block' },
      },
      h('rect', { x: 4, y: 3.2, width: 16, height: 17.6, stroke: 'currentColor', strokeWidth: 1.4 }),
      h('path', { d: 'M7.4 8.4h9.2M7.4 11.6h9.2M7.4 14.8h5.6', stroke: 'currentColor', strokeWidth: 1.2, opacity: 0.6 }),
      h('circle', { cx: 17.4, cy: 17.6, r: 2.1, stroke: 'currentColor', strokeWidth: 1.3 }))
    }

    //#endregion

    //#region 面板（顶层状态机）

    async function api(path, init) {
      const res = await fetch(API + path, {
        headers: { 'Content-Type': 'application/json' },
        ...init,
      })
      const text = await res.text()
      let json = null
      try { json = JSON.parse(text) } catch { /* 可能是音频 */ }
      if (!res.ok) throw new Error(json?.error || text.slice(0, 160) || `HTTP ${res.status}`)
      return json
    }

    const COPY_LABEL = {
      import: '导入地址',
      'public-import': '公网导入地址',
      listen: '朗读地址',
      body: 'BODY',
      json: 'legado.json',
      curl: 'curl',
      token: 'URL 令牌',
    }

    function Panel() {
      const [state, setState] = useState(null)
      const [error, setError] = useState('')
      const [view, setView] = useState('timeline')
      const [paused, setPaused] = useState(false)
      const [frozen, setFrozen] = useState(null)
      const [toast, setToast] = useState('')
      const [busy, setBusy] = useState('')
      const [saving, setSaving] = useState(false)
      const [draft, setDraft] = useState(null)
      const [savedAt, setSavedAt] = useState('')
      const [selAt, setSelAt] = useState(null)
      const [selSig, setSelSig] = useState('')
      const [panelW, setPanelW] = useState(0)
      const [range, setRange] = useState(30)
      const [selectedDay, setSelectedDay] = useState('')
      const [hoverAt, setHoverAt] = useState(null)
      const [now, setNow] = useState(() => Date.now())
      const [lastSync, setLastSync] = useState(0)
      const toastTimer = useRef(null)
      const syncedRef = useRef('')
      const rootObs = useRef(null)

      const showToast = useCallback((text) => {
        setToast(text)
        if (toastTimer.current) clearTimeout(toastTimer.current)
        toastTimer.current = setTimeout(() => setToast(''), 2000)
      }, [])

      useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current) }, [])

      const refresh = useCallback(async () => {
        try {
          const next = await api('/state')
          setState(next)
          setError('')
          setLastSync(Date.now())
        } catch (err) {
          setError(String(err?.message || err))
        }
      }, [])

      useEffect(() => {
        refresh()
        const timer = setInterval(() => { if (!document.hidden) refresh() }, 4000)
        return () => clearInterval(timer)
      }, [refresh])

      useEffect(() => {
        const timer = setInterval(() => setNow(Date.now()), 1000)
        return () => clearInterval(timer)
      }, [])

      useEffect(() => () => { if (rootObs.current) rootObs.current.disconnect() }, [])

      const service = state?.service || {}
      const running = Boolean(service.running)
      const provider = service.provider || state?.config?.upstream?.provider || 'mimo'
      const localInfo = state?.local || state?.live?.local || {}
      const config = state?.config || {}
      const presetVoices = Array.isArray(state?.presetVoices) ? state.presetVoices : []
      const live = paused && frozen ? frozen.live : state?.live
      const clockNow = paused && frozen ? frozen.at : now
      const pausedAt = paused && frozen ? frozen.at : 0

      const tm = useMemo(() => buildTimeline(live?.recent), [live])
      const items = tm.list
      const lastSelRef = useRef(-1)
      const selIndex = (() => {
        if (!items.length) return -1
        if (selAt == null) return items.length - 1
        const byAt = items.findIndex((x) => x.at === selAt)
        if (byAt >= 0) return byAt
        if (selSig) {
          const bySig = items.findIndex((x) => x.sig === selSig)
          if (bySig >= 0) return bySig
        }
        return clamp(lastSelRef.current, 0, items.length - 1)
      })()
      const selItem = selIndex >= 0 ? items[selIndex] : null
      lastSelRef.current = selIndex
      const compact = panelW > 0 ? panelW < 1050 : false
      const hoverItem = hoverAt != null ? items.find((x) => x.at === hoverAt) : null

      const appliedFlat = useMemo(() => fromConfig(state?.config), [state?.config])
      const changes = useMemo(() => (draft ? diffFields(draft, appliedFlat) : []), [draft, appliedFlat])

      // 轮询不覆盖用户未保存的草稿；没有改动且服务端值确实变了才同步（沿用旧 syncedRef 思路）。
      useEffect(() => {
        if (!state?.config) return
        const key = JSON.stringify(appliedFlat)
        if (changes.length) return
        if (syncedRef.current === key) return
        syncedRef.current = key
        setDraft(appliedFlat)
      }, [appliedFlat, changes.length, state?.config])

      const onSet = useCallback((path, value) => {
        setDraft((d) => (d ? { ...d, [path]: value } : d))
      }, [])

      const act = useCallback(async (action) => {
        if (busy) return
        setBusy(action)
        try {
          const next = await api('/service', { method: 'POST', body: JSON.stringify({ action }) })
          setState(next)
          setError('')
          setLastSync(Date.now())
          if (action === 'stop') { setPaused(false); setFrozen(null) }
          showToast(action === 'start' ? '服务已启动 · 走带开始' : action === 'stop' ? '服务已停止 · 实时数据为空态' : '服务已重启 · 走带恢复')
        } catch (err) {
          showToast(String(err?.message || err))
        } finally {
          setBusy('')
        }
      }, [busy, showToast])

      const actLocal = useCallback(async (action) => {
        if (busy) return
        setBusy(`local:${action}`)
        try {
          await api('/local', { method: 'POST', body: JSON.stringify({ action }) })
          await refresh()
          showToast(action === 'unload' ? '本地模型已卸载 · 下段由云端顶班' : '本地模型已加载')
        } catch (err) {
          showToast(String(err?.message || err))
        } finally {
          setBusy('')
        }
      }, [busy, refresh, showToast])

      const togglePause = useCallback(() => {
        if (!running) {
          showToast('服务未运行，没有可暂停的实时数据')
          return
        }
        if (paused) {
          setPaused(false)
          setFrozen(null)
          showToast('已恢复实时刷新')
        } else {
          setFrozen({ live: state?.live, at: Date.now() })
          setPaused(true)
          showToast(`已暂停实时刷新 · 数据冻结 ${clock(Date.now())}`)
        }
      }, [running, paused, state?.live, showToast])

      const onSelect = useCallback((item) => {
        if (!item) return
        setSelAt(item.at)
        setSelSig(item.sig)
      }, [])
      const onHover = useCallback((item) => {
        setHoverAt(item ? item.at : null)
      }, [])

      const save = async () => {
        if (saving) return
        const list = changes
        if (!list.length) { showToast('没有需要保存的改动'); return }
        const { patch, problems } = buildPatch(draft || {}, list)
        if (problems.length) { showToast(problems[0]); return }
        if (!Object.keys(patch).length) {
          showToast('没有需要提交的改动（密钥掩码不写回）')
          return
        }
        setSaving(true)
        try {
          const next = await api('/config', { method: 'PUT', body: JSON.stringify(patch) })
          setState(next)
          setError('')
          setLastSync(Date.now())
          const nextFlat = fromConfig(next?.config)
          setDraft(nextFlat)
          syncedRef.current = JSON.stringify(nextFlat)
          const at = clock(Date.now())
          setSavedAt(at)
          showToast(`已保存并生效 · ${at}`)
        } catch (err) {
          showToast(String(err?.message || err))
        } finally {
          setSaving(false)
        }
      }

      const revert = () => {
        if (saving) return
        setDraft(appliedFlat)
        syncedRef.current = JSON.stringify(appliedFlat)
        showToast('已还原为当前生效值')
      }

      const exportConfig = () => {
        const ok = download('mimo-tts-config.json', JSON.stringify(state?.config || {}, null, 2), 'application/json')
        showToast(ok ? '已导出配置 · mimo-tts-config.json' : '浏览器拦截了下载')
      }

      const exportCsv = () => {
        const asc = sortedDays(live?.days)
        const days = range === 30 ? asc.slice(-30) : asc.slice(-7)
        const header = 'day,requests,segments,chars,seconds,bytes,errors'
        const lines = [header].concat(days.map((d) => [d.day, num(d.requests), num(d.segments), num(d.chars), num(d.seconds), num(d.bytes), num(d.errors)].join(',')))
        const ok = download(`mimo-tts-days-${range}.csv`, lines.join('\n'), 'text/csv;charset=utf-8')
        showToast(ok ? `已导出 CSV · ${days.length} 日` : '浏览器拦截了下载')
      }

      const onCopy = async (kind) => {
        const imp = state?.import || {}
        const cfg = state?.config || {}
        let text = ''
        if (kind === 'import') text = imp.jsonUrl || ''
        else if (kind === 'public-import') text = imp.publicJsonUrl || ''
        else if (kind === 'listen') text = imp.listenUrl || ''
        else if (kind === 'body') text = BODY_TEXT
        else if (kind === 'json') text = JSON.stringify(legadoPayload(imp, cfg), null, 2)
        else if (kind === 'curl') text = curlText(imp.listenUrl)
        else if (kind === 'token') text = cfg.auth?.token || ''
        if (!text) { showToast('没有可复制的内容'); return }
        const ok = await writeClipboard(text)
        showToast(ok ? `已复制 · ${COPY_LABEL[kind] || kind}` : '复制被浏览器拦截，请手动选中')
      }

      // 键盘：1–4 切工作面、← → 选片段、Ctrl/⌘+S 保存（输入框内不抢键）
      useEffect(() => {
        const onKey = (e) => {
          const tag = String(e.target?.tagName || '').toLowerCase()
          const typing = tag === 'input' || tag === 'textarea' || tag === 'select'
          if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S') && view === 'settings') {
            e.preventDefault()
            save()
            return
          }
          if (typing) return
          if (['1', '2', '3', '4'].includes(e.key)) {
            e.preventDefault()
            setView(['timeline', 'settings', 'archive', 'delivery'][Number(e.key) - 1])
            return
          }
          if (view === 'timeline' && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
            if (!running || !items.length) return
            e.preventDefault()
            const dir = e.key === 'ArrowRight' ? 1 : -1
            const nextIdx = clamp(selIndex + dir, 0, items.length - 1)
            setSelAt(items[nextIdx].at)
            setSelSig(items[nextIdx].sig)
          }
        }
        document.addEventListener('keydown', onKey)
        return () => document.removeEventListener('keydown', onKey)
      })

      const rootRef = useCallback((node) => {
        if (rootObs.current) { rootObs.current.disconnect(); rootObs.current = null }
        if (node && typeof ResizeObserver !== 'undefined') {
          const ro = new ResizeObserver((entries) => {
            const w = entries[0]?.contentRect?.width || 0
            if (w) setPanelW(w)
          })
          ro.observe(node)
          rootObs.current = ro
        }
      }, [])

      if (!state) {
        return h('div', { className: 'mtt', ref: rootRef },
          h('style', { dangerouslySetInnerHTML: { __html: CSS } }),
          h('div', { className: 'deck', style: { gridTemplateRows: '1fr' } },
            h('div', {
              style: {
                height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', gap: 10, fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--ink-2)',
                background: 'var(--panel)',
              },
            },
            h('b', { style: { fontSize: 14, color: 'var(--ink)', letterSpacing: '.04em' } },
              error ? '读不到宿主接口' : '正在连接宿主…'),
            h('span', null, error || 'GET /mimo-tts/api/state'),
            error ? h('button', { className: 'btn', type: 'button', onClick: refresh }, '重试') : null)),
          h('div', { className: `toast${toast ? ' show' : ''}`, role: 'status', 'aria-live': 'polite' },
            h('span', { className: 'tdot' }), h('span', null, toast)))
      }

      const hint = error
        ? `读不到宿主接口：${error}`
        : hoverItem
          ? `第 ${hoverItem.index + 1} 段 · ${ROLE_CN[hoverItem.role]} · ${hoverItem.sourceLabel} · ${hoverItem.error ? '失败' : latSec(hoverItem.latencyMs)} · ${hoverItem.chars} 字 · ${clock(hoverItem.at)} · ${deviceOf(hoverItem.client)}`
          : HINTS[view] || ''

      let viewNode
      if (view === 'timeline') {
        viewNode = h('section', { className: 'view view--timeline', id: 'view-timeline', 'aria-label': '时间线工作台' },
          h(TrackHeads, {
            running, live, service, localInfo, items,
            totalAudio: tm.totalAudio, totalChars: tm.totalChars, cacheHits: tm.cacheHits,
            avgLatency: tm.avgLatency, maxLatency: tm.maxLatency, selectedItem: selItem, compact,
          }),
          h(TapeArea, {
            running, paused, items, live, service,
            totalAudio: tm.totalAudio, totalChars: tm.totalChars, cacheHits: tm.cacheHits,
            avgLatency: tm.avgLatency, latScale: tm.latScale,
            selectedIndex: selIndex, selItem, onSelect, onHover, hoverAt, onAct: act,
          }),
          h(Inspector, {
            running, live, service, localInfo, config, item: selItem, items,
            onAct: act, onActLocal: actLocal, busy, lastSync,
          }))
      } else if (view === 'settings') {
        viewNode = h(SettingsView, {
          live, service, localInfo, draft, applied: appliedFlat, changes, presetVoices,
          saving, savedAt, onSet, onSave: save, onRevert: revert,
          onExportConfig: exportConfig, onActLocal: actLocal, busy,
        })
      } else if (view === 'archive') {
        viewNode = h(ArchiveView, {
          live, range, setRange, selectedDay,
          onSelectDay: (day) => setSelectedDay(day),
          onExportCsv: exportCsv,
        })
      } else {
        viewNode = h(DeliveryView, {
          live, service, config, importInfo: state.import || {},
          onCopy, onExportConfig: exportConfig,
        })
      }

      return h('div', { className: 'mtt', ref: rootRef },
        h('style', { dangerouslySetInnerHTML: { __html: CSS } }),
        h('div', { className: 'deck' },
          h(Transport, {
            service, localInfo, live, items, totalAudio: tm.totalAudio, view, setView,
            paused, onPause: togglePause, busy, act, now: clockNow, error,
          }),
          h('main', { className: 'bench' }, viewNode),
          h(StatusBar, {
            view, running, paused, error, lastSync, pausedAt,
            version: service.version, port: service.port, provider, hint,
          })),
        h('div', { className: `toast${toast ? ' show' : ''}`, role: 'status', 'aria-live': 'polite' },
          h('span', { className: 'tdot' }),
          h('span', null, toast)))
    }

    //#endregion

    return {
      inject: ['slots'],
      apply(ctx) {
        ctx.slots.inject('main', () =>
          ctx.slots.register({ name: 'main', key: PANEL_ID }, Panel))

        ctx.slots.inject('sidebar.panellist', () =>
          ctx.slots.register(
            { name: 'sidebar.panellist', id: PANEL_ID, order: 40, label: () => '听书值守' },
            PanelGlyph,
          ))
      },
    }
  },
})
