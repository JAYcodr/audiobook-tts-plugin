/*
 * 自动生成文件，请勿直接编辑；源码位于 client/，运行 `npm run build:client` 重新构建。
 */
window.__ModuleLoader__.load({
  id: 'audiobook-tts-plugin',
  factory(require) {
    const module = { exports: {} }
    const exports = module.exports
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// client/index.jsx
var index_exports = {};
__export(index_exports, {
  default: () => index_default
});
module.exports = __toCommonJS(index_exports);

// client/constants.js
var PANEL_ID = "mimo-tts";
var API = "/mimo-tts/api";
var TZ_LABEL = (() => {
  const off = -(/* @__PURE__ */ new Date()).getTimezoneOffset() / 60;
  const shown = Number.isInteger(off) ? String(off) : off.toFixed(1);
  return `UTC${off >= 0 ? "+" : ""}${shown}`;
})();
var ROLE_CN = { narrator: "\u65C1\u767D", dialogue: "\u5BF9\u8BDD", mixed: "\u6DF7\u5408" };
var ROLE_GLYPH = { narrator: "\u65C1", dialogue: "\u5BF9", mixed: "\u6DF7" };
var PROVIDER_CN = {
  mimo: "\u4E91\u7AEF MiMo",
  local: "\u672C\u5730 Qwen3",
  hybrid: "\u6DF7\u5408\u542F\u52A8",
  openai: "OpenAI \u517C\u5BB9"
};
var WEEK_CN = ["\u65E5", "\u4E00", "\u4E8C", "\u4E09", "\u56DB", "\u4E94", "\u516D"];
var BODY_TEXT = "text={{java.encodeURI(speakText)}}&speed={{speakSpeed}}";
var CURL_SAMPLE = "\u745E\u8D1D\u5361\u5782\u4E0B\u773C\u76AE\uFF0C\u4EE5\u63A9\u9970\u81EA\u5DF1\u773C\u4E2D\u7684\u75B2\u60EB\u3002";
var PREVIEW_SAMPLE = {
  narrator: "\u5C71\u9053\u4E0A\u8D77\u4E86\u96FE\uFF0C\u4ED6\u628A\u706F\u4E3E\u9AD8\u4E86\u4E00\u70B9\u3002",
  dialogue: "\u201C\u4F60\u7EC8\u4E8E\u6765\u4E86\uFF0C\u6211\u7B49\u4F60\u5F88\u4E45\u4E86\u3002\u201D"
};
var HINTS = {
  timeline: "\u2190 \u2192 \u9009\u62E9\u7247\u6BB5 \xB7 1\u20134 \u5207\u6362\u5DE5\u4F5C\u9762 \xB7 \u60AC\u505C\u6D41\u6C34\u770B\u8BFB\u6570",
  settings: "\u62D6\u52A8\u65CB\u94AE\u6216\u65B9\u5411\u952E\u5FAE\u8C03 \xB7 Ctrl/\u2318+S \u4FDD\u5B58\u5E76\u751F\u6548 \xB7 \u8FD8\u539F\u4E22\u5F03\u8349\u7A3F",
  archive: "\u70B9\u65E5\u5E26\u6216\u65E5\u8868\u9009\u4E2D\u4E00\u5929 \xB7 30/7 \u5207\u6362\u8303\u56F4 \xB7 CSV \u5BFC\u51FA\u5F53\u524D\u8303\u56F4",
  delivery: "\u590D\u5236\u5BFC\u5165\u5730\u5740\u5373\u53EF\u4EA4\u4ED8 \xB7 \u4EE4\u724C\u5DF2\u62FC\u8FDB URL \xB7 \u9519\u8BEF\u7801\u5728\u53F3\u4FA7"
};
var ERR_CODES = [
  ["401", "\u4EE4\u724C\u6216\u53E3\u4EE4\u4E0D\u5BF9 \u2014 \u4ECE\u672C\u9875\u91CD\u65B0\u590D\u5236\u5BFC\u5165\u5730\u5740"],
  ["429", "\u89E6\u53D1\u6BCF\u5206\u949F\u9650\u901F \u2014 \u8C03\u5927\u300C\u6BCF\u6BB5\u5B57\u6570\u300D\u51CF\u5C11\u5206\u6BB5\u8BF7\u6C42"],
  ["502", "\u4E0A\u6E38\u6216\u672C\u5730\u5F15\u64CE\u62A5\u9519 \u2014 \u67E5\u770B\u65F6\u95F4\u7EBF\u6D41\u6C34\u6216\u5207\u6362\u5F15\u64CE\u515C\u5E95"],
  ["413", "\u6587\u672C\u8D85\u8FC7\u5355\u6B21\u4E0A\u9650 \u2014 \u8C03\u5927\u300C\u6700\u957F\u6587\u672C\u300D\u6216\u5206\u6BB5\u53D1\u9001"],
  ["503", "\u670D\u52A1\u672A\u542F\u52A8 \u2014 \u56DE\u65F6\u95F4\u7EBF\u542F\u52A8\u670D\u52A1"],
  ["500", "\u670D\u52A1\u5185\u90E8\u9519\u8BEF \u2014 \u770B\u5BBF\u4E3B\u63A7\u5236\u53F0\u65E5\u5FD7"]
];
var COPY_LABEL = {
  import: "\u5BFC\u5165\u5730\u5740",
  "public-import": "\u516C\u7F51\u5BFC\u5165\u5730\u5740",
  listen: "\u6717\u8BFB\u5730\u5740",
  body: "BODY",
  json: "legado.json",
  curl: "curl",
  token: "URL \u4EE4\u724C"
};

// client/components/Panel.jsx
var import_react8 = __toESM(require("react"), 1);

// client/api.js
async function api(path, init) {
  const res = await fetch(API + path, {
    headers: { "Content-Type": "application/json" },
    ...init
  });
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
  }
  if (!res.ok) throw new Error(json?.error || text.slice(0, 160) || `HTTP ${res.status}`);
  return json;
}
async function fetchPreviewWav({ text, role = "narrator" }) {
  const res = await fetch(`${API}/preview`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, role })
  });
  if (!res.ok) {
    const bodyText = await res.text().catch(() => "");
    let json = null;
    try {
      json = JSON.parse(bodyText);
    } catch {
    }
    throw new Error(json?.error || bodyText.slice(0, 160) || `HTTP ${res.status}`);
  }
  const blob = await res.blob();
  return {
    blob,
    source: res.headers.get("X-Mimo-Source") || "",
    durationS: res.headers.get("X-Mimo-Duration-S") || "",
    latencyMs: res.headers.get("X-Mimo-Latency-Ms") || ""
  };
}

// client/config-draft.js
var FIELDS = [
  { path: "server.host", label: "\u76D1\u542C\u5730\u5740", module: "transport" },
  { path: "server.port", label: "\u670D\u52A1\u7AEF\u53E3", module: "transport" },
  { path: "server.publicUrl", label: "\u5BF9\u5916\u5730\u5740", module: "transport" },
  { path: "upstream.provider", label: "\u6E32\u67D3\u6765\u6E90", module: "engine" },
  { path: "upstream.baseUrl", label: "\u4E0A\u6E38\u5730\u5740", module: "transport" },
  { path: "upstream.model", label: "\u4E91\u7AEF\u6A21\u578B", module: "engine" },
  { path: "upstream.keys", label: "API Key", module: "transport" },
  { path: "upstream.timeoutMs", label: "\u4E0A\u6E38\u8D85\u65F6", module: "transport" },
  { path: "upstream.maxRetry", label: "\u6700\u5927\u91CD\u8BD5", module: "transport" },
  { path: "upstream.hybrid.maxCloudBootstrap", label: "\u4E91\u9876\u73ED\u4E0A\u9650", module: "engine" },
  { path: "upstream.hybrid.cloudConcurrency", label: "\u4E91\u5E76\u53D1", module: "engine" },
  { path: "upstream.hybrid.targetRms", label: "\u76EE\u6807\u54CD\u5EA6", module: "engine" },
  { path: "upstream.hybrid.warmup", label: "\u672C\u5730\u9884\u70ED", module: "engine" },
  { path: "upstream.openai.baseUrl", label: "OpenAI \u5730\u5740", module: "openai" },
  { path: "upstream.openai.apiKey", label: "OpenAI Key", module: "openai" },
  { path: "upstream.openai.model", label: "OpenAI \u6A21\u578B", module: "openai" },
  { path: "upstream.openai.narratorVoice", label: "OpenAI \u65C1\u767D\u97F3\u8272", module: "openai" },
  { path: "upstream.openai.dialogueVoice", label: "OpenAI \u5BF9\u8BDD\u97F3\u8272", module: "openai" },
  { path: "upstream.openai.responseFormat", label: "OpenAI \u54CD\u5E94\u683C\u5F0F", module: "openai" },
  { path: "upstream.openai.speed", label: "OpenAI \u8BED\u901F", module: "openai" },
  { path: "upstream.openai.instructions", label: "OpenAI \u6307\u4EE4", module: "openai" },
  { path: "upstream.openai.timeoutMs", label: "OpenAI \u8D85\u65F6", module: "openai" },
  { path: "upstream.openai.maxRetry", label: "OpenAI \u91CD\u8BD5", module: "openai" },
  { path: "upstream.local.pythonPath", label: "Python \u8DEF\u5F84", module: "local" },
  { path: "upstream.local.serverScript", label: "Sidecar \u811A\u672C", module: "local" },
  { path: "upstream.local.modelPath", label: "\u6A21\u578B\u76EE\u5F55", module: "local" },
  { path: "upstream.local.port", label: "\u672C\u5730\u7AEF\u53E3", module: "local" },
  { path: "upstream.local.idleUnloadSeconds", label: "\u7A7A\u95F2\u5378\u8F7D", module: "local" },
  { path: "upstream.local.startupTimeoutMs", label: "\u542F\u52A8\u8D85\u65F6", module: "local" },
  { path: "upstream.local.requestTimeoutMs", label: "\u8BF7\u6C42\u8D85\u65F6", module: "local" },
  { path: "upstream.local.refs.narrator.wav", label: "\u65C1\u767D\u53C2\u8003\u97F3", module: "local" },
  { path: "upstream.local.refs.narrator.text", label: "\u65C1\u767D\u53C2\u8003\u6587\u672C", module: "local" },
  { path: "upstream.local.refs.dialogue.wav", label: "\u5BF9\u8BDD\u53C2\u8003\u97F3", module: "local" },
  { path: "upstream.local.refs.dialogue.text", label: "\u5BF9\u8BDD\u53C2\u8003\u6587\u672C", module: "local" },
  { path: "voices.narrator.voice", label: "\u65C1\u767D\u97F3\u8272", module: "voice" },
  { path: "voices.narrator.style", label: "\u65C1\u767D\u98CE\u683C", module: "voice" },
  { path: "voices.dialogue.voice", label: "\u5BF9\u8BDD\u97F3\u8272", module: "voice" },
  { path: "voices.dialogue.style", label: "\u5BF9\u8BDD\u98CE\u683C", module: "voice" },
  { path: "synth.maxSegmentChars", label: "\u6BCF\u6BB5\u5B57\u6570", module: "synth" },
  { path: "synth.maxTextChars", label: "\u6700\u957F\u6587\u672C", module: "synth" },
  { path: "synth.concurrency", label: "\u5408\u6210\u5E76\u53D1", module: "synth" },
  { path: "synth.stream", label: "\u6D41\u5F0F\u8FD4\u56DE", module: "synth" },
  { path: "cache.enabled", label: "\u542F\u7528\u7F13\u5B58", module: "synth" },
  { path: "cache.maxEntries", label: "\u7F13\u5B58\u6761\u76EE", module: "synth" },
  { path: "cache.ttlSeconds", label: "\u7F13\u5B58 TTL", module: "synth" },
  { path: "limits.rpm", label: "\u9650\u901F RPM", module: "synth" },
  { path: "auth.enabled", label: "Basic \u9274\u6743", module: "auth" },
  { path: "auth.user", label: "\u7528\u6237\u540D", module: "auth" },
  { path: "auth.pass", label: "\u53E3\u4EE4", module: "auth" },
  { path: "auth.token", label: "URL \u4EE4\u724C", module: "auth" },
  { path: "legado.name", label: "Legado \u5F15\u64CE\u540D", module: "transport" },
  { path: "legado.extraHeaders", label: "\u9644\u52A0\u8BF7\u6C42\u5934", module: "transport" },
  { path: "log.ring", label: "\u65E5\u5FD7\u73AF", module: "auth" }
];
var NUMERIC_FIELDS = /* @__PURE__ */ new Set([
  "server.port",
  "upstream.timeoutMs",
  "upstream.maxRetry",
  "upstream.hybrid.maxCloudBootstrap",
  "upstream.hybrid.cloudConcurrency",
  "upstream.hybrid.targetRms",
  "upstream.openai.speed",
  "upstream.openai.timeoutMs",
  "upstream.openai.maxRetry",
  "upstream.local.port",
  "upstream.local.idleUnloadSeconds",
  "upstream.local.startupTimeoutMs",
  "upstream.local.requestTimeoutMs",
  "synth.maxSegmentChars",
  "synth.maxTextChars",
  "synth.concurrency",
  "cache.maxEntries",
  "cache.ttlSeconds",
  "limits.rpm",
  "log.ring"
]);
var BOOL_FIELDS = /* @__PURE__ */ new Set([
  "upstream.hybrid.warmup",
  "synth.stream",
  "cache.enabled",
  "auth.enabled"
]);
var str = (v, d = "") => v == null ? d : String(v);
function fromConfig(cfg) {
  const c = cfg || {};
  const srv = c.server || {};
  const up = c.upstream || {};
  const hy = up.hybrid || {};
  const oa = up.openai || {};
  const lo = up.local || {};
  const refs = lo.refs || {};
  const nref = refs.narrator || {};
  const dref = refs.dialogue || {};
  const voices = c.voices || {};
  const nv = voices.narrator || {};
  const dv = voices.dialogue || {};
  const synth = c.synth || {};
  const cache = c.cache || {};
  const auth = c.auth || {};
  const legado = c.legado || {};
  const limits = c.limits || {};
  const log = c.log || {};
  const headers = legado.extraHeaders && typeof legado.extraHeaders === "object" && !Array.isArray(legado.extraHeaders) ? legado.extraHeaders : {};
  return {
    "server.host": str(srv.host, "0.0.0.0"),
    "server.port": str(srv.port, "8291"),
    "server.publicUrl": str(srv.publicUrl),
    "upstream.provider": str(up.provider, "mimo"),
    "upstream.baseUrl": str(up.baseUrl),
    "upstream.model": str(up.model),
    "upstream.keys": Array.isArray(up.keys) ? up.keys.join("\n") : "",
    "upstream.timeoutMs": str(up.timeoutMs, "120000"),
    "upstream.maxRetry": str(up.maxRetry, "3"),
    "upstream.hybrid.maxCloudBootstrap": str(hy.maxCloudBootstrap, "6"),
    "upstream.hybrid.cloudConcurrency": str(hy.cloudConcurrency, "2"),
    "upstream.hybrid.targetRms": str(hy.targetRms, "0.126"),
    "upstream.hybrid.warmup": Boolean(hy.warmup),
    "upstream.openai.baseUrl": str(oa.baseUrl, "https://api.openai.com/v1"),
    "upstream.openai.apiKey": str(oa.apiKey),
    "upstream.openai.model": str(oa.model, "tts-1"),
    "upstream.openai.narratorVoice": str(oa.narratorVoice, "alloy"),
    "upstream.openai.dialogueVoice": str(oa.dialogueVoice, "echo"),
    "upstream.openai.responseFormat": str(oa.responseFormat, "wav"),
    "upstream.openai.speed": str(oa.speed, "1"),
    "upstream.openai.instructions": str(oa.instructions),
    "upstream.openai.timeoutMs": str(oa.timeoutMs, "60000"),
    "upstream.openai.maxRetry": str(oa.maxRetry, "2"),
    "upstream.local.pythonPath": str(lo.pythonPath),
    "upstream.local.serverScript": str(lo.serverScript),
    "upstream.local.modelPath": str(lo.modelPath),
    "upstream.local.port": str(lo.port, "8398"),
    "upstream.local.idleUnloadSeconds": str(lo.idleUnloadSeconds, "300"),
    "upstream.local.startupTimeoutMs": str(lo.startupTimeoutMs, "180000"),
    "upstream.local.requestTimeoutMs": str(lo.requestTimeoutMs, "180000"),
    "upstream.local.refs.narrator.wav": str(nref.wav),
    "upstream.local.refs.narrator.text": str(nref.text),
    "upstream.local.refs.dialogue.wav": str(dref.wav),
    "upstream.local.refs.dialogue.text": str(dref.text),
    "voices.narrator.voice": str(nv.voice),
    "voices.narrator.style": str(nv.style),
    "voices.dialogue.voice": str(dv.voice),
    "voices.dialogue.style": str(dv.style),
    "synth.maxSegmentChars": str(synth.maxSegmentChars, "100"),
    "synth.maxTextChars": str(synth.maxTextChars, "10000"),
    "synth.concurrency": str(synth.concurrency, "4"),
    "synth.stream": Boolean(synth.stream),
    "cache.enabled": Boolean(cache.enabled),
    "cache.maxEntries": str(cache.maxEntries, "500"),
    "cache.ttlSeconds": str(cache.ttlSeconds, "7200"),
    "limits.rpm": str(limits.rpm, "100"),
    "auth.enabled": Boolean(auth.enabled),
    "auth.user": str(auth.user),
    "auth.pass": str(auth.pass),
    "auth.token": str(auth.token),
    "legado.name": str(legado.name, "\u542C\u4E66\u503C\u5B88 TTS"),
    "legado.extraHeaders": JSON.stringify(headers, null, 2),
    "log.ring": str(log.ring, "500")
  };
}
function diffFields(draft, applied) {
  const out = [];
  if (!draft || !applied) return out;
  for (const f of FIELDS) {
    if (JSON.stringify(draft[f.path]) !== JSON.stringify(applied[f.path])) {
      out.push({ path: f.path, label: f.label, module: f.module, from: applied[f.path], to: draft[f.path] });
    }
  }
  return out;
}
function setPath(obj, path, value) {
  const keys = String(path).split(".");
  let cur = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    const k = keys[i];
    if (cur[k] == null || typeof cur[k] !== "object") cur[k] = {};
    cur = cur[k];
  }
  cur[keys[keys.length - 1]] = value;
}
function buildPatch(draft, changes) {
  const patch = {};
  const problems = [];
  for (const ch of changes) {
    const path = ch.path;
    const v = draft[path];
    if (path === "upstream.keys") {
      const lines = String(v == null ? "" : v).split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
      setPath(patch, path, lines);
      continue;
    }
    if (path === "auth.pass" || path === "upstream.openai.apiKey") {
      const s = String(v == null ? "" : v);
      if (/[\u2026\u2022\u00b7]/.test(s)) continue;
      setPath(patch, path, s);
      continue;
    }
    if (path === "legado.extraHeaders") {
      let obj;
      try {
        obj = JSON.parse(String(v == null ? "" : v) || "{}");
      } catch {
        problems.push("\u9644\u52A0\u8BF7\u6C42\u5934\u4E0D\u662F\u5408\u6CD5 JSON");
        continue;
      }
      if (!obj || typeof obj !== "object" || Array.isArray(obj)) {
        problems.push("\u9644\u52A0\u8BF7\u6C42\u5934\u5FC5\u987B\u662F JSON \u5BF9\u8C61");
        continue;
      }
      setPath(patch, path, obj);
      continue;
    }
    if (BOOL_FIELDS.has(path)) {
      setPath(patch, path, Boolean(v));
      continue;
    }
    if (NUMERIC_FIELDS.has(path)) {
      const n = Number(v);
      if (String(v == null ? "" : v).trim() === "" || !Number.isFinite(n)) {
        problems.push(`${ch.label} \u5FC5\u987B\u662F\u6570\u5B57`);
        continue;
      }
      setPath(patch, path, n);
      continue;
    }
    setPath(patch, path, v == null ? "" : v);
  }
  return { patch, problems };
}
function fmtDirtyVal(v) {
  if (typeof v === "boolean") return v ? "\u5F00" : "\u5173";
  if (v == null || v === "") return "\u2014";
  const s = String(v).replace(/\s+/g, " ");
  return s.length > 34 ? `${s.slice(0, 32)}\u2026` : s;
}

// client/delivery.js
function legadoPayload(imp, cfg) {
  const headers = {
    "Content-Type": "application/x-www-form-urlencoded",
    ...cfg && cfg.legado && cfg.legado.extraHeaders || {}
  };
  const listen = String(imp?.listenUrl || "");
  const option = { method: "POST", body: BODY_TEXT, header: headers };
  return [{
    name: cfg?.legado?.name || "\u542C\u4E66\u503C\u5B88 TTS",
    url: `${listen},${JSON.stringify(option)}`,
    contentType: "audio/wav",
    concurrentRate: String(cfg?.synth?.concurrency || 4)
  }];
}
function curlText(listenUrl) {
  const url = String(listenUrl || "\u2014");
  return [
    `curl -X POST '${url}' \\`,
    "  -H 'Content-Type: application/x-www-form-urlencoded' \\",
    `  --data-urlencode 'text=${CURL_SAMPLE}' \\`,
    "  --output test.wav"
  ].join("\n");
}
function download(name, text, mime) {
  try {
    const blob = new Blob([text], { type: mime || "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
    return true;
  } catch {
    return false;
  }
}
function execCopy(text) {
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.cssText = "position:fixed;top:-1000px;left:0;opacity:0";
    document.body.appendChild(ta);
    ta.select();
    ta.setSelectionRange(0, text.length);
    const ok = document.execCommand("copy");
    ta.remove();
    return ok;
  } catch {
    return false;
  }
}
function writeClipboard(text) {
  return new Promise((resolve) => {
    let done = false;
    const fallback = () => {
      if (!done) {
        done = true;
        resolve(execCopy(text));
      }
    };
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
          if (!done) {
            done = true;
            resolve(true);
          }
        }).catch(fallback);
        return;
      }
    } catch {
    }
    fallback();
  });
}

// client/format.js
var num = (v, d = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
};
var pad2 = (n) => String(n).padStart(2, "0");
var clamp = (v, a, b) => Math.max(a, Math.min(b, v));
var fmtInt = (n) => num(n).toLocaleString("en-US");
var fmtBytes = (n) => `${fmtInt(Math.round(num(n) / 1048576))} MB`;
var mmss = (sec) => `${Math.floor(num(sec) / 60)}:${pad2(Math.floor(num(sec) % 60))}`;
var mmssPad = (sec) => `${pad2(Math.floor(num(sec) / 60))}:${pad2(Math.floor(num(sec) % 60))}`;
var mmssTenth = (sec) => `${Math.floor(num(sec) / 60)}:${pad2(Math.floor(num(sec) % 60))}.${Math.floor(num(sec) % 1 * 10)}`;
var hm = (sec) => `${Math.floor(num(sec) / 3600)}:${pad2(Math.floor(num(sec) % 3600 / 60))}`;
var hms = (sec) => {
  const s = Math.max(0, Math.floor(num(sec)));
  return `${Math.floor(s / 3600)}:${pad2(Math.floor(s % 3600 / 60))}:${pad2(s % 60)}`;
};
var latSec = (ms) => num(ms) > 0 ? `${(num(ms) / 1e3).toFixed(2)}s` : "\u2014";
var latQ = (ms, samples) => num(samples) > 0 ? (num(ms) / 1e3).toFixed(2) : "\u2014";
var clock = (ts) => {
  const d = ts ? new Date(num(ts)) : /* @__PURE__ */ new Date();
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
};
var dateStr = (ts) => {
  const d = ts ? new Date(num(ts)) : /* @__PURE__ */ new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
};
var weekdayOfTs = (ts) => `\u5468${WEEK_CN[new Date(num(ts)).getDay()]}`;
var weekdayOfDay = (day) => `\u5468${WEEK_CN[(/* @__PURE__ */ new Date(`${day}T12:00:00Z`)).getUTCDay()]}`;
var todayKeyUTC = () => (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
var ago = (ts, now) => {
  if (!ts) return "\u2014";
  const diff = Math.max(0, num(now || Date.now()) - num(ts));
  if (diff < 3e3) return "\u521A\u521A";
  if (diff < 6e4) return `${Math.round(diff / 1e3)} \u79D2\u524D`;
  if (diff < 36e5) return `${Math.round(diff / 6e4)} \u5206\u949F\u524D`;
  return `${Math.round(diff / 36e5)} \u5C0F\u65F6\u524D`;
};
var ipOf = (client) => {
  const s = String(client || "");
  const at = s.indexOf("@");
  if (at >= 0) return s.slice(at + 1) || "\u2014";
  return s || "\u2014";
};
var hashOf = (client) => {
  const s = String(client || "");
  const at = s.indexOf("@");
  return at > 0 ? s.slice(0, at) : "";
};
var deviceOf = (client) => hashOf(client) || ipOf(client);
function sourceOf(r) {
  const s = String(r?.source || "");
  if (s.includes("local")) return { label: "\u672C\u5730", key: "local" };
  if (s === "openai") return { label: "OpenAI", key: "cloud" };
  if (s.includes("cloud") || s === "mimo" || r?.format === "wav-stream") return { label: "\u4E91\u7AEF", key: "cloud" };
  return { label: s || "\u2014", key: "" };
}
function ttlText(sec) {
  const s = num(sec);
  if (s >= 3600) {
    const hours = s / 3600;
    return `${Number.isInteger(hours) ? hours : hours.toFixed(1)} \u5C0F\u65F6`;
  }
  return `${s} \u79D2`;
}
function localStateText(localInfo) {
  const state = localInfo?.state || "disabled";
  if (state === "ready" || localInfo?.warm) return "\u672C\u5730 \xB7 \u70ED";
  if (state === "starting") return "\u9884\u70ED\u4E2D";
  if (state === "stopping") return "\u5378\u8F7D\u4E2D";
  if (state === "error") return "\u672C\u5730 \xB7 \u51FA\u9519";
  if (state === "disabled") return "\u672C\u5730 \xB7 \u672A\u542F\u7528";
  return "\u672C\u5730 \xB7 \u5DF2\u5378\u8F7D";
}

// client/styles/deck.css
var deck_default = '.mtt{--panel:#e8e4d9;        \n  --panel-2:#f0ece3;      \n  --panel-3:#e2ddd1;      \n  --well:#d7d1c1;         \n  --well-2:#cfc8b6;\n  --ink:#242a26;          \n  --ink-2:#4b524c;\n  --ink-3:#5d645e;\n  --line:#c9c3b3;\n  --line-2:#aaa492;\n  --tape:#1f3b33;         \n  --tape-2:#2b5145;\n  --tape-3:#3a6a59;\n  --grease:#b13a22;       \n  --grease-soft:rgba(177,58,34,.14);\n  --cloud:#4a585e;        \n  --led:#2e7a50;\n  --led-off:#71776f;\n  --r:2px;\n  --sans:-apple-system,BlinkMacSystemFont,"PingFang SC","Hiragino Sans GB","Microsoft YaHei",system-ui,sans-serif;\n  --mono:ui-monospace,"SF Mono","SFMono-Regular",Menlo,Consolas,"Liberation Mono",monospace;}.mtt *, .mtt *::before, .mtt *::after{box-sizing:border-box}.mtt, .mtt{height:100%}.mtt{margin:0;background:var(--panel);color:var(--ink);\n  font:12.5px/1.5 var(--sans);\n  -webkit-font-smoothing:antialiased;\n  overflow:hidden;}.mtt button, .mtt input, .mtt textarea, .mtt select{font:inherit;color:inherit}.mtt button{all:unset;box-sizing:border-box}.mtt :focus-visible{outline:2px solid var(--grease);outline-offset:2px}.mtt .clip:focus-visible, .mtt .viewkey:focus-visible, .mtt .key:focus-visible, .mtt .knob:focus-visible{outline-offset:1px}.mtt ::selection{background:var(--grease-soft)}.mtt .silk{font:11px/1 var(--mono);letter-spacing:.12em;text-transform:uppercase;color:var(--ink-3)}.mtt .silk b{color:var(--ink-2);font-weight:600}.mtt .cn{font-size:11.5px;color:var(--ink-2)}.mtt .mono{font-family:var(--mono);font-variant-numeric:tabular-nums}.mtt .num{font-family:var(--mono);font-variant-numeric:tabular-nums}.mtt .muted{color:var(--ink-3)}.mtt .hide{display:none !important}.mtt .deck{height:100%;display:grid;grid-template-rows:auto minmax(0,1fr) auto;background:var(--panel);}.mtt .transport{background:var(--panel-2);border-bottom:1px solid var(--line-2);box-shadow:inset 0 -1px 0 rgba(255,255,255,.5);position:relative;z-index:5}.mtt .tp-bar{display:flex;align-items:stretch;height:58px;padding:0 14px}.mtt .tp-cell{display:flex;align-items:center;gap:10px;padding:0 14px;border-left:1px solid var(--line)}.mtt .tp-cell:first-child{border-left:0;padding-left:0}.mtt .plate{display:flex;align-items:center;gap:9px;background:var(--ink);color:var(--panel-2);padding:6px 12px 6px 9px;border-radius:var(--r);min-width:222px;box-shadow:inset 0 1px 0 rgba(255,255,255,.12),0 1px 0 rgba(0,0,0,.2)}.mtt .reel{width:32px;height:32px;flex:0 0 32px;display:block}.mtt .reel .rot{transform-origin:16px 16px}.mtt .is-running .reel .rot{animation:mtt-reel 7.5s linear infinite}.mtt .is-playing .reel .rot{animation-play-state:running}.mtt .transport.is-paused .reel .rot, .mtt .transport.is-stopped .reel .rot{animation-play-state:paused}@keyframes mtt-reel{to{transform:rotate(360deg)}}.mtt .brand-txt{min-width:0}.mtt .brand-txt b{display:block;font:600 13px/1.25 var(--sans);letter-spacing:.04em;white-space:nowrap}.mtt .brand-txt small{display:block;font:10px/1.3 var(--mono);letter-spacing:.12em;color:#a9b2a9;white-space:nowrap}.mtt .tp-keys{display:flex;gap:4px}.mtt .key{position:relative;width:58px;height:42px;display:grid;place-items:center;align-content:center;gap:1px;background:var(--panel-2);border:1px solid var(--line-2);border-radius:var(--r);box-shadow:inset 0 1px 0 #fff,0 1px 0 rgba(0,0,0,.14);cursor:pointer;user-select:none;transition:transform .08s,box-shadow .08s}.mtt .key:hover{background:#f6f3eb}.mtt .key:active{transform:translateY(1px);box-shadow:inset 0 2px 3px rgba(0,0,0,.18)}.mtt .key .zi{display:block;font-size:12px;line-height:1.1;letter-spacing:.06em}.mtt .key .ze{display:block;font:10px/1 var(--mono);letter-spacing:.1em;color:var(--ink-3);text-transform:uppercase}.mtt .key svg{width:11px;height:11px;display:block;margin:0 auto 1px}.mtt .key svg *{fill:none;stroke:currentColor;stroke-width:1.6}.mtt .key:disabled{color:#8d938c;background:var(--panel-3);box-shadow:inset 0 1px 1px rgba(0,0,0,.08);cursor:default;transform:none !important}.mtt .key[data-active="true"]{background:var(--tape);border-color:var(--tape);color:#edeadd;box-shadow:inset 0 1px 0 rgba(255,255,255,.15),inset 0 -2px 0 rgba(0,0,0,.25)}.mtt .key[data-active="true"] .ze{color:#b7c8bd}.mtt .key--pause{width:56px}.mtt .key--pause[data-active="true"]{background:var(--grease);border-color:var(--grease)}.mtt .key--pause[data-active="true"] .ze{color:#f1d5cc}.mtt .lamps{display:grid;grid-template-columns:auto auto;gap:3px 16px;align-content:center}.mtt .lamp{display:flex;align-items:center;gap:6px;font:11px/1.2 var(--mono);white-space:nowrap;color:var(--ink-2)}.mtt .lamp b{font-weight:600;color:var(--ink)}.mtt .lamp .dot{width:7px;height:7px;border-radius:50%;background:transparent;border:1px solid var(--led-off);flex:0 0 7px}.mtt .lamp.on .dot{background:var(--led);border-color:var(--led);box-shadow:0 0 0 2px rgba(46,122,80,.16)}.mtt .lamp.warn .dot{background:var(--grease);border-color:var(--grease);box-shadow:0 0 0 2px var(--grease-soft)}.mtt .lamp.idle .dot{background:var(--ink-3);border-color:var(--ink-3)}.mtt .clock{display:flex;flex-direction:column;align-items:flex-end;gap:2px;margin-left:auto}.mtt .clock b{font:600 19px/1 var(--mono);letter-spacing:.03em;font-variant-numeric:tabular-nums}.mtt .clock small{font:10px/1 var(--mono);letter-spacing:.1em;color:var(--ink-3)}.mtt .tp-pause-wrap{display:flex;align-items:center;padding-left:14px;border-left:1px solid var(--line);margin-left:14px}.mtt .tp-rail{display:flex;align-items:center;gap:12px;height:34px;padding:0 14px;background:var(--panel-3);border-top:1px solid var(--line);font-size:11px}.mtt .rail-label{font:10px/1 var(--mono);letter-spacing:.16em;text-transform:uppercase;color:var(--ink-3);white-space:nowrap}.mtt .viewkeys{display:flex;gap:3px}.mtt .viewkey{position:relative;appearance:none;display:flex;align-items:baseline;gap:7px;padding:4px 11px 5px;background:var(--panel-2);border:1px solid var(--line-2);border-radius:var(--r);cursor:pointer;box-shadow:inset 0 1px 0 #fff,0 1px 0 rgba(0,0,0,.1);white-space:nowrap;transition:background .1s}.mtt .viewkey:hover{background:#f6f3eb}.mtt .viewkey .vc{font-size:11.5px;color:var(--ink)}.mtt .viewkey .ve{font:10px/1 var(--mono);letter-spacing:.1em;color:var(--ink-3);text-transform:uppercase}.mtt .viewkey[aria-pressed="true"]{background:var(--ink);border-color:var(--ink);box-shadow:inset 0 1px 0 rgba(255,255,255,.12),inset 0 -2px 0 rgba(0,0,0,.3)}.mtt .viewkey[aria-pressed="true"] .vc{color:var(--panel-2)}.mtt .viewkey[aria-pressed="true"] .ve{color:#a7b2a8}.mtt .viewkey[aria-pressed="true"]::after{content:"";position:absolute;left:8px;right:8px;bottom:2px;height:2px;background:var(--grease)}.mtt .rail-meters{margin-left:auto;display:flex;align-items:center;gap:16px;min-width:0}.mtt .meter{display:flex;align-items:center;gap:7px;white-space:nowrap}.mtt .meter .ml{font:10px/1 var(--mono);letter-spacing:.12em;color:var(--ink-3)}.mtt .meter .mv{font:11px/1 var(--mono);font-variant-numeric:tabular-nums;color:var(--ink)}.mtt .meter-bar{position:relative;width:74px;height:7px;background:var(--well);border:1px solid var(--line-2);border-radius:1px;box-shadow:inset 0 1px 2px rgba(0,0,0,.18);overflow:hidden}.mtt .meter-bar i{position:absolute;left:0;top:0;bottom:0;background:var(--tape-3);width:3%}.mtt .meter-bar::after{content:"";position:absolute;right:-1px;top:-1px;bottom:-1px;width:1px;background:var(--grease);opacity:.55}.mtt .rail-live{display:flex;align-items:center;gap:7px;font:11px/1 var(--mono);color:var(--ink-2);white-space:nowrap}.mtt .rail-live .dot{width:7px;height:7px;border-radius:50%;background:var(--led);border:1px solid var(--led);box-shadow:0 0 0 2px rgba(46,122,80,.16)}.mtt .rail-live.stopped .dot{background:transparent;border-color:var(--ink-3);box-shadow:none}.mtt .rail-live.paused .dot{background:var(--grease);border-color:var(--grease);box-shadow:0 0 0 2px var(--grease-soft)}.mtt .rail-live i{font-style:normal;color:var(--ink);font-weight:600}.mtt .bench{min-height:0;display:grid;position:relative}.mtt .view{min-height:0;height:100%}.mtt .view[hidden]{display:none !important}.mtt .view--timeline{display:grid;grid-template-columns:174px minmax(0,1fr) 328px}.mtt .heads{padding:10px 12px 10px 14px;border-right:1px solid var(--line);display:grid;grid-template-rows:36px minmax(0,0.95fr) 10px minmax(158px,1.15fr);min-height:0;background:var(--panel-2)}.mtt .heads-top{display:flex;align-items:baseline;justify-content:space-between;gap:6px;padding-top:2px}.mtt .heads-core{min-height:0;display:grid;grid-template-rows:32px minmax(110px,1fr) 78px 32px 32px}.mtt .head{min-width:0;overflow:hidden}.mtt .head .h-title{display:flex;align-items:baseline;gap:6px;white-space:nowrap}.mtt .head .h-title .idx{font:10px/1 var(--mono);color:var(--ink-3);letter-spacing:.1em}.mtt .head .h-title b{font:600 11.5px/1 var(--sans);letter-spacing:.02em}.mtt .head .h-title small{font:10px/1 var(--mono);color:var(--ink-3);letter-spacing:.08em;text-transform:uppercase}.mtt .head--take{display:flex;align-items:flex-start;padding:1px 0 0;overflow:hidden}.mtt .head--take > div > small{display:block;font:10px/1 var(--mono);color:var(--ink-3);letter-spacing:.14em;margin:2px 0 0}.mtt .counter{font:600 19px/1 var(--mono);font-variant-numeric:tabular-nums;letter-spacing:.02em}.mtt .counter small{display:block;font:10px/1 var(--mono);color:var(--ink-3);letter-spacing:.14em;margin:2px 0 0}.mtt .head--main{border-top:1px solid var(--line);margin-top:4px;padding-top:8px;display:flex;flex-direction:column;gap:7px}.mtt .head-rows{display:flex;flex-direction:column;gap:4px}.mtt .head-row{display:flex;justify-content:space-between;gap:6px;font:11px/1.35 var(--mono);color:var(--ink-2);white-space:nowrap;min-width:0}.mtt .head-row b{color:var(--ink);font-weight:600}.mtt .head--lat{border-top:1px solid var(--line);padding-top:7px;display:flex;flex-direction:column;gap:3px;justify-content:flex-start}.mtt .head--local, .mtt .head--cloud{border-top:1px solid var(--line);display:flex;align-items:center;gap:7px;font:11px/1 var(--mono);white-space:nowrap;overflow:hidden}.mtt .head--local .idx, .mtt .head--cloud .idx{font:10px/1 var(--mono);color:var(--ink-3);letter-spacing:.1em}.mtt .head--local b, .mtt .head--cloud b{font-weight:600}.mtt .head--local .st, .mtt .head--cloud .st{color:var(--ink-3);font-size:11px;letter-spacing:.02em;overflow:hidden;text-overflow:ellipsis}.mtt .head--readers{border-top:1px solid var(--line);padding-top:8px;display:flex;flex-direction:column;gap:6px;min-height:0;overflow:hidden}.mtt .readers{display:flex;flex-direction:column;gap:5px}.mtt .reader{display:grid;grid-template-columns:8px minmax(0,1fr) auto;gap:6px;align-items:center;font:11px/1.3 var(--mono);color:var(--ink-2)}.mtt .reader .ld{width:6px;height:6px;border-radius:50%;background:var(--led);border:1px solid var(--led)}.mtt .reader.off .ld{background:transparent;border-color:var(--ink-3)}.mtt .reader b{color:var(--ink);font-weight:600;font-size:11.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.mtt .reader small{grid-column:2;color:var(--ink-3);font-size:11px;letter-spacing:.02em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.mtt .reader .idle{white-space:nowrap;font-size:11px;color:var(--ink-3)}.mtt .hybrid-cells{display:flex;gap:2px;align-items:center;margin:3px 0 0}.mtt .hybrid-cells i{display:block;width:10px;height:6px;border:1px solid var(--line-2);background:var(--panel);border-radius:1px}.mtt .hybrid-cells i.on{background:var(--tape-3);border-color:var(--tape-3)}.mtt .hybrid-cells span{font:10px/1 var(--mono);color:var(--ink-3);margin-left:4px;letter-spacing:.04em}.mtt .head-window{margin-top:6px;border-top:1px dashed var(--line);padding-top:5px}.mtt .head-window .head-row{font-size:11px}.mtt .heads-note{font:11px/1.5 var(--mono);color:var(--ink-3);letter-spacing:.01em;margin-top:auto}.mtt .timeline{min-width:0;min-height:0;padding:10px 12px;display:grid;grid-template-rows:36px minmax(0,0.95fr) 10px minmax(158px,1.15fr)}.mtt .tl-top{display:flex;align-items:baseline;justify-content:space-between;gap:10px;padding-top:2px}.mtt .tl-title{display:flex;align-items:baseline;gap:8px;min-width:0}.mtt .tl-title b{font:600 12.5px/1 var(--sans);letter-spacing:.02em;white-space:nowrap}.mtt .tl-title .eyebrow{font:10px/1 var(--mono);letter-spacing:.16em;color:var(--ink-3);text-transform:uppercase;white-space:nowrap}.mtt .tl-meta{font:11px/1 var(--mono);color:var(--ink-2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.mtt .rec-tag{display:inline-flex;align-items:center;gap:5px;font:10px/1 var(--mono);letter-spacing:.1em;color:var(--grease);border:1px solid var(--grease);background:var(--grease-soft);padding:2px 6px;border-radius:1px;white-space:nowrap}.mtt .rec-tag i{width:5px;height:5px;border-radius:50%;background:var(--grease);display:block}.mtt .rec-tag.paused{color:var(--ink-2);border-color:var(--line-2);background:transparent}.mtt .rec-tag.paused i{background:var(--ink-3)}.mtt .tl-meta b{color:var(--ink);font-weight:600}.mtt .tl-core{position:relative;min-height:0;display:grid;grid-template-rows:32px minmax(110px,1fr) 78px 32px 32px}.mtt .ruler{position:relative;border-bottom:1px solid var(--line-2);background:var(--panel-2);overflow:hidden}.mtt .ruler .tick{position:absolute;bottom:0;width:1px;background:var(--line-2)}.mtt .ruler .tick.minor{height:5px;opacity:.7}.mtt .ruler .tick.major{height:10px;background:var(--ink-2)}.mtt .ruler .tlabel{position:absolute;bottom:11px;transform:translateX(-50%);font:10px/1 var(--mono);letter-spacing:.04em;color:var(--ink-3);white-space:nowrap}.mtt .ruler .tlabel.edge-l{transform:none}.mtt .ruler .tlabel.edge-r{transform:translateX(-100%)}.mtt .ruler .cue{position:absolute;top:2px;width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-top:6px solid var(--grease);transform:translateX(-5px)}.mtt .tape{position:relative;background:var(--well);border-bottom:1px solid var(--line-2);box-shadow:inset 0 2px 4px rgba(0,0,0,.16);display:flex;overflow:hidden}.mtt .tape::after{content:"";position:absolute;left:0;right:0;top:52%;height:1px;background:rgba(236,231,214,.10);pointer-events:none}.mtt .clip{position:relative;min-width:0;flex:0 0 auto;border:0;background:var(--tape);cursor:pointer;display:flex;flex-direction:column;padding:5px 4px 5px 5px;box-shadow:inset -1px 0 0 rgba(237,234,221,.55),inset 0 1px 0 rgba(255,255,255,.10);clip-path:polygon(0 5px,5px 0,100% 0,100% 100%,0 100%);transition:background .1s}.mtt .clip:hover, .mtt .clip.is-hover{background:var(--tape-2)}.mtt .clip .role{font:600 11.5px/1 var(--sans);color:#ece7d6;letter-spacing:.02em}.mtt .clip .wbar{display:block;width:calc(100% - 2px);height:2px;margin-top:3px;background:rgba(236,231,214,.16);position:relative;overflow:hidden}.mtt .clip .wbar i{position:absolute;left:0;top:0;bottom:0;background:rgba(236,231,214,.55)}.mtt .clip .no{position:absolute;left:4px;bottom:9px;font:11px/1 var(--mono);color:rgba(236,231,214,.5);letter-spacing:.04em}.mtt .clip::after{content:"";position:absolute;top:0;right:0;width:1px;height:8px;background:rgba(236,231,214,.5)}.mtt .clip .role i{display:none}.mtt .clip .marks{display:flex;align-items:center;gap:4px;margin-top:auto}.mtt .clip .cache{position:absolute;top:4px;right:4px;width:7px;height:7px;border:1px solid #cdc6b2;border-radius:1px}.mtt .clip.hit .cache{background:#d9d2bd;border-color:#d9d2bd}.mtt .clip.miss .cache{background:transparent;border-color:var(--grease);border-radius:0}.mtt .clip.miss .cache::after{content:"";display:block;width:7px;height:1px;background:var(--grease);transform:rotate(-45deg) translate(0,-4px)}.mtt .clip .lat{height:3px;background:rgba(237,234,221,.24);margin-top:auto;position:relative;border-radius:1px;overflow:hidden}.mtt .clip .lat i{position:absolute;left:0;top:0;bottom:0;background:#d8d1bd}.mtt .clip.slow .lat i{background:var(--grease)}.mtt .clip .seg{position:absolute;top:0;bottom:0;left:50%;width:1px;background:rgba(237,234,221,.35)}.mtt .clip[aria-selected="true"]{background:var(--tape-2);box-shadow:inset 0 0 0 2px var(--grease),inset -1px 0 0 rgba(237,234,221,.65);z-index:2}.mtt .clip[aria-selected="true"] .role{color:#fff6e8}.mtt .clip:focus-visible{z-index:3}.mtt .playhead{position:absolute;top:28px;bottom:0;right:0;width:2px;background:var(--grease);z-index:4;pointer-events:none}.mtt .playhead::before{content:"";position:absolute;top:-1px;right:-4px;width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-top:8px solid var(--grease)}.mtt .playhead .ph-label{position:absolute;right:5px;top:5px;background:var(--grease);color:#f7e9e3;font:10px/1 var(--mono);letter-spacing:.08em;padding:2px 5px;white-space:nowrap}.mtt .transport.is-paused .playhead{background:transparent;border-left:2px dashed var(--grease)}.mtt .transport.is-paused .playhead::before{border-top-color:var(--grease)}.mtt .latlane{position:relative;background:var(--panel-2);border-bottom:1px solid var(--line);display:flex;align-items:flex-end;gap:0;padding:6px 0 0;overflow:hidden}.mtt .latlane .lbar{flex:0 0 auto;min-width:0;height:100%;display:flex;align-items:flex-end;background:transparent}.mtt .latlane .lbar i{display:block;width:100%;background:var(--ink-2);opacity:.55;border-top:1px solid var(--ink-2)}.mtt .latlane .lbar i{border-right:1px solid var(--panel-2)}.mtt .latlane .lbar.slow i{background:var(--grease);opacity:.8;border-top-color:var(--grease)}.mtt .latlane .p95{position:absolute;left:0;right:0;border-top:1px dashed var(--grease);opacity:.75;pointer-events:none}.mtt .latlane .p95 span{position:absolute;right:16px;top:-9px;font:11px/1 var(--mono);color:var(--grease);background:var(--panel-2);padding:0 3px;letter-spacing:.04em}.mtt .rail{position:relative;background:var(--panel-2);border-bottom:1px solid var(--line);display:flex;align-items:center;gap:0;overflow:hidden}.mtt .rail--cloud{border-bottom:0}.mtt .rail .rbar{flex:0 0 auto;min-width:0;height:9px;background:transparent}.mtt .rail .rbar i{display:block;width:100%;height:100%;background:var(--tape-3);border-radius:1px;box-shadow:inset -1px 0 0 var(--panel-2)}.mtt .rail--cloud .rbar i{background:var(--cloud)}.mtt .rail .rail-note{position:absolute;left:8px;top:50%;transform:translateY(-50%);font:11px/1 var(--mono);letter-spacing:.02em;color:var(--ink-3);background:var(--panel-2);padding:2px 6px}.mtt .takes{min-height:0;display:grid;grid-template-rows:26px minmax(0,1fr);border-top:1px solid var(--line-2)}.mtt .takes-hd{display:flex;align-items:center;justify-content:space-between;gap:8px;padding-top:5px}.mtt .takes-hd .silk{white-space:nowrap}.mtt .takes-hd .th-meta{font:11px/1 var(--mono);color:var(--ink-3);letter-spacing:.04em;white-space:nowrap}.mtt .takes-list{overflow-y:auto;overflow-x:hidden;min-height:0;padding-right:2px;scrollbar-width:thin}.mtt .take{display:grid;grid-template-columns:58px 26px 38px minmax(0,1fr) 52px 50px 44px;gap:8px;align-items:center;width:100%;text-align:left;padding:0 5px;height:24px;border-top:1px solid rgba(170,164,146,.28);cursor:pointer;font-size:12px;color:var(--ink-2)}.mtt .take:hover, .mtt .take.is-hover{background:var(--panel-2)}.mtt .take[aria-selected="true"]{background:var(--panel-3);box-shadow:inset 2px 0 0 var(--grease)}.mtt .take .tt{font:11px/1 var(--mono);color:var(--ink-3);font-variant-numeric:tabular-nums}.mtt .take .tr{font:600 11.5px/1 var(--sans);color:var(--ink);white-space:nowrap}.mtt .take .ts{font:11px/1 var(--mono);letter-spacing:.02em;white-space:nowrap}.mtt .take .ts.local{color:var(--tape-3)}.mtt .take .ts.cloud{color:var(--cloud)}.mtt .take .tx{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--ink-2)}.mtt .take .td{font:11px/1 var(--mono);color:var(--ink-3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.mtt .take .tl{font:11px/1 var(--mono);font-variant-numeric:tabular-nums;color:var(--ink-2);white-space:nowrap}.mtt .take .tl.slow{color:var(--grease)}.mtt .take .tc{font:11px/1 var(--mono);white-space:nowrap}.mtt .take .tc.hit{color:var(--tape-3)}.mtt .take .tc.miss{color:var(--grease)}.mtt .take .tc::before{content:"\u25CF";font-size:8px;margin-right:3px;vertical-align:1px}.mtt .take .tc.miss::before{content:"\u25CB"}.mtt .inspector{border-left:1px solid var(--line-2);padding:10px 14px 10px 16px;min-height:0;overflow:hidden;display:flex;flex-direction:column;gap:9px;background:var(--panel-2)}.mtt .ins-block{min-width:0}.mtt .ins-hd{display:flex;align-items:baseline;justify-content:space-between;gap:8px;padding:7px 0 5px;border-top:1px solid var(--line);margin-bottom:2px}.mtt .ins-block:first-child .ins-hd{border-top:0;padding-top:0}.mtt .ins-hd .silk{white-space:nowrap}.mtt .ins-hd .cn{white-space:nowrap;font-size:11px;color:var(--ink-3);letter-spacing:.04em}.mtt .pick-tags{display:flex;align-items:center;gap:5px;margin-bottom:6px;flex-wrap:wrap}.mtt .tag{display:inline-flex;align-items:center;gap:4px;padding:1px 7px;border:1px solid var(--line-2);border-radius:1px;font:11px/1.6 var(--mono);letter-spacing:.03em;color:var(--ink-2);white-space:nowrap}.mtt .tag.tape{background:var(--tape);border-color:var(--tape);color:#e9e4d3}.mtt .tag.grease{background:var(--grease);border-color:var(--grease);color:#f7e9e3}.mtt .tag.cloud{background:var(--cloud);border-color:var(--cloud);color:#e6e9e6}.mtt .tag.hollow{background:transparent}.mtt .pick-text{font:14px/1.6 var(--sans);color:var(--ink);margin:0 0 8px;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;min-height:22px}.mtt .pick-text .q{color:var(--ink-3);font-family:var(--mono);font-size:11px}.mtt .pick-meta{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:5px 8px;margin-bottom:6px}.mtt .kv{min-width:0}.mtt .kv .k{display:block;font:11px/1.2 var(--mono);letter-spacing:.1em;color:var(--ink-3);text-transform:uppercase;white-space:nowrap}.mtt .kv .v{display:block;font:11.5px/1.35 var(--mono);font-variant-numeric:tabular-nums;color:var(--ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.mtt .kv .v b{font-weight:600}.mtt .pick-device{display:flex;align-items:center;justify-content:space-between;gap:8px;font:11px/1.4 var(--mono);color:var(--ink-3);border-top:1px dashed var(--line);padding-top:5px}.mtt .pick-device b{color:var(--ink-2);font-weight:600}.mtt .eng{display:flex;flex-direction:column;gap:4px;font-size:11px}.mtt .eng-row{display:flex;align-items:center;gap:6px;min-width:0}.mtt .eng-row .ld{width:6px;height:6px;border-radius:50%;background:var(--led);flex:0 0 6px;border:1px solid var(--led)}.mtt .eng-row.off .ld{background:transparent;border-color:var(--ink-3)}.mtt .eng-row.warm .ld{background:var(--grease);border-color:var(--grease);box-shadow:0 0 0 2px var(--grease-soft)}.mtt .eng-row b{font:600 11px/1.3 var(--sans);white-space:nowrap}.mtt .eng-row .st{font:11px/1.3 var(--mono);color:var(--ink-3);white-space:nowrap}.mtt .eng-row .val{margin-left:auto;font:11px/1.3 var(--mono);color:var(--ink-2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.mtt .eng-sub{font:11px/1.45 var(--mono);color:var(--ink-3);letter-spacing:.01em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.mtt .eng-act{display:flex;gap:6px;margin-top:3px}.mtt .btn{display:inline-flex;align-items:center;justify-content:center;gap:5px;padding:4px 10px;background:var(--panel-2);border:1px solid var(--line-2);border-radius:var(--r);font-size:11.5px;color:var(--ink);cursor:pointer;box-shadow:inset 0 1px 0 #fff,0 1px 0 rgba(0,0,0,.1);white-space:nowrap;transition:background .1s}.mtt .btn:hover{background:#f7f4ec}.mtt .btn:active{transform:translateY(1px);box-shadow:inset 0 2px 3px rgba(0,0,0,.14)}.mtt .btn:disabled{color:#8d938c;background:var(--panel-3);box-shadow:none;cursor:default;transform:none}.mtt .btn--tape{background:var(--tape);border-color:var(--tape);color:#e9e4d3}.mtt .btn--tape:hover{background:var(--tape-2)}.mtt .btn--ghost{background:transparent;box-shadow:none}.mtt .btn--sm{padding:2px 8px;font-size:11px}.mtt .vu{display:grid;grid-template-columns:1fr auto;gap:10px;align-items:center}.mtt .vu svg{display:block;width:100%;height:auto;max-height:76px}.mtt .vu .reads{display:flex;flex-direction:column;gap:3px;text-align:right}.mtt .vu .reads b{font:600 15px/1 var(--mono);font-variant-numeric:tabular-nums}.mtt .vu .reads small{font:11px/1.2 var(--mono);color:var(--ink-3);white-space:nowrap}.mtt .cache-rows{display:grid;grid-template-columns:1fr 1fr;gap:3px 10px;margin-top:4px}.mtt .rowx{display:flex;justify-content:space-between;gap:8px;font:11px/1.5 var(--mono);color:var(--ink-3);white-space:nowrap}.mtt .rowx b{color:var(--ink-2);font-weight:600;font-variant-numeric:tabular-nums}.mtt .today-grid{display:grid;grid-template-columns:1fr 1fr;gap:4px 10px}.mtt .today-grid .kv .v{font-size:12.5px}.mtt .today-grid .kv .v small{font:11px var(--sans);color:var(--ink-3);margin-left:2px}.mtt .lat-row{display:flex;gap:10px;margin-top:3px;font:11px/1.4 var(--mono);color:var(--ink-3);white-space:nowrap}.mtt .lat-row b{color:var(--ink-2);font-weight:600}.mtt .limit-meter{display:flex;align-items:center;gap:8px;margin:2px 0 5px}.mtt .limit-meter .ml{font:10px/1 var(--mono);letter-spacing:.12em;color:var(--ink-3)}.mtt .limit-meter .mv{font:11px/1 var(--mono);color:var(--ink-2);font-variant-numeric:tabular-nums}.mtt .limit-meter .meter-bar{width:auto;flex:1}.mtt .tl-empty[hidden]{display:none}.mtt .tl-empty{position:absolute;inset:0;z-index:6;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;background:var(--panel-2);border-top:1px solid var(--line);text-align:center}.mtt .leader{width:min(420px,80%);height:34px;border:1px solid var(--line-2);background:repeating-linear-gradient(-45deg,var(--well) 0 10px,var(--panel-2) 10px 20px);box-shadow:inset 0 1px 3px rgba(0,0,0,.14);position:relative;display:flex;align-items:center;justify-content:center}.mtt .leader span{background:var(--panel-2);padding:0 8px;font:10px/1 var(--mono);letter-spacing:.18em;color:var(--ink-3)}.mtt .tl-empty h3{margin:0;font:600 15px/1.3 var(--sans);letter-spacing:.02em}.mtt .tl-empty p{margin:0;font-size:11.5px;color:var(--ink-2);max-width:420px;line-height:1.7}.mtt .empty-takes{padding:14px;font:11px/1.6 var(--mono);color:var(--ink-3);display:flex;flex-direction:column;gap:4px}.mtt .ins-stopped{display:flex;flex-direction:column;gap:8px;padding:10px 0}.mtt .ins-stopped .banner{border:1px solid var(--line-2);background:var(--well);padding:10px;display:flex;flex-direction:column;gap:6px}.mtt .ins-stopped .banner b{font:600 12.5px/1.3 var(--sans)}.mtt .ins-stopped .banner span{font:10.5px/1.5 var(--mono);color:var(--ink-3)}.mtt .view--settings{display:grid;grid-template-rows:minmax(0,1fr) 48px}.mtt .set-grid{display:grid;grid-template-columns:198px minmax(0,1fr) 300px;min-height:0}.mtt .set-left{border-right:1px solid var(--line);padding:12px 14px;display:flex;flex-direction:column;gap:12px;min-height:0;overflow:hidden;background:var(--panel-2)}.mtt .set-left h2{margin:0;font:600 13px/1.3 var(--sans);letter-spacing:.02em}.mtt .set-left .sub{font:10px/1.3 var(--mono);letter-spacing:.14em;color:var(--ink-3);text-transform:uppercase}.mtt .chain{display:flex;flex-direction:column;gap:0;margin-top:2px}.mtt .chain-node{display:flex;align-items:center;gap:7px;font:11px/1.3 var(--mono);color:var(--ink-2);padding:4px 6px;border:1px solid var(--line-2);background:var(--panel);border-radius:1px;white-space:nowrap;overflow:hidden}.mtt .chain-node .ld{width:6px;height:6px;border-radius:50%;background:var(--led);border:1px solid var(--led);flex:0 0 6px}.mtt .chain-node.off .ld{background:transparent;border-color:var(--ink-3)}.mtt .chain-node b{font-weight:600;color:var(--ink);font-family:var(--sans);font-size:11px}.mtt .chain-link{width:1px;height:12px;background:var(--line-2);margin-left:14px}.mtt .chain-note{font:11px/1.5 var(--mono);color:var(--ink-3)}.mtt .mod-index{display:flex;flex-direction:column;gap:2px;margin-top:auto;padding-top:8px;border-top:1px solid var(--line)}.mtt .mod-index button{display:flex;align-items:baseline;gap:7px;padding:3px 2px;font:11px/1.4 var(--mono);color:var(--ink-2);cursor:pointer;text-align:left}.mtt .mod-index button:hover{color:var(--ink)}.mtt .mod-index .n{color:var(--ink-3);font-size:10px}.mtt .modules{overflow-y:auto;min-height:0;padding:12px 14px;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;align-content:start;scrollbar-width:thin}.mtt .module{border:1px solid var(--line-2);background:var(--panel-2);border-radius:var(--r);padding:9px 11px 10px;min-width:0;position:relative;box-shadow:0 1px 0 rgba(255,255,255,.4) inset}.mtt .module-hd{display:flex;align-items:baseline;justify-content:space-between;gap:8px;border-bottom:1px solid var(--line);padding-bottom:5px;margin-bottom:5px}.mtt .module-hd .mh{display:flex;align-items:baseline;gap:6px;white-space:nowrap;min-width:0}.mtt .module-hd b{font:600 11.5px/1 var(--sans);letter-spacing:.03em}.mtt .module-hd .silk{font-size:10px}.mtt .module-hd .mnum{font:10px/1 var(--mono);color:var(--ink-3)}.mtt .dirty-dot{width:6px;height:6px;border-radius:50%;background:var(--grease);display:none;flex:0 0 6px;box-shadow:0 0 0 2px var(--grease-soft)}.mtt .module.is-dirty .dirty-dot{display:block}.mtt .field{display:grid;gap:2px;padding:4px 0;min-width:0}.mtt .field .fl{display:flex;align-items:baseline;justify-content:space-between;gap:6px;font-size:11px;color:var(--ink-2);white-space:nowrap}.mtt .field .fl i{font:10px/1 var(--mono);letter-spacing:.12em;color:var(--ink-3);font-style:normal;text-transform:uppercase}.mtt .input{width:100%;min-width:0;background:var(--panel);border:1px solid var(--line-2);border-radius:1px;padding:3px 6px;font:11px/1.5 var(--mono);color:var(--ink);box-shadow:inset 0 1px 2px rgba(0,0,0,.10);caret-color:var(--grease)}.mtt .input:hover{background:#f6f2e9}.mtt .input:focus-visible{outline:2px solid var(--grease);outline-offset:1px;background:#fbf8f0}.mtt textarea.input{resize:vertical;min-height:44px;line-height:1.55}.mtt .ctrl-row{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:4px 0;border-top:1px solid rgba(170,164,146,.28);min-width:0}.mtt .ctrl-row:first-of-type{border-top:0}.mtt .ctrl-row .cl{display:flex;flex-direction:column;gap:1px;min-width:0}.mtt .ctrl-row .cl b{font:11px/1.3 var(--sans);color:var(--ink-2);font-weight:500;white-space:nowrap}.mtt .ctrl-row .cl i{font:10px/1 var(--mono);font-style:normal;letter-spacing:.1em;color:var(--ink-3);text-transform:uppercase;white-space:nowrap}.mtt .knob-row{display:flex;flex-wrap:wrap;gap:4px 14px;padding:2px 0 1px}.mtt .knob-wrap{display:flex;flex-direction:column;align-items:center;gap:2px;min-width:64px}.mtt .knob-wrap .kl{font:11px/1.2 var(--sans);color:var(--ink-2);white-space:nowrap;text-align:center}.mtt .knob-holder{position:relative;width:48px;height:48px;display:grid;place-items:center}.mtt .knob{position:relative;width:38px;height:38px;border-radius:50%;background:var(--panel-2);border:1px solid var(--line-2);cursor:grab;touch-action:none;box-shadow:inset 0 2px 2px #fff,inset 0 -3px 4px rgba(0,0,0,.14),0 1px 2px rgba(0,0,0,.18);z-index:1}.mtt .knob:active{cursor:grabbing}.mtt .knob::before{content:"";position:absolute;left:50%;top:4px;width:2px;height:10px;margin-left:-1px;background:var(--ink);border-radius:1px;transform-origin:50% 15px;transform:rotate(var(--angle,0deg))}.mtt .knob::after{content:"";position:absolute;left:50%;top:50%;width:8px;height:8px;margin:-4px 0 0 -4px;border-radius:50%;background:var(--well);box-shadow:inset 0 1px 2px rgba(0,0,0,.25)}.mtt .knob-ticks{position:absolute;inset:0;width:48px;height:48px;pointer-events:none}.mtt .knob-val{font:11px/1 var(--mono);font-variant-numeric:tabular-nums;background:var(--well);border:1px solid var(--line-2);border-radius:1px;padding:1px 4px;min-width:34px;text-align:center;color:var(--ink)}.mtt .knob-wrap.is-dirty .knob-val{border-color:var(--grease);color:var(--grease)}.mtt .toggle{position:relative;width:36px;height:18px;flex:0 0 36px;background:var(--well);border:1px solid var(--line-2);border-radius:2px;cursor:pointer;box-shadow:inset 0 1px 2px rgba(0,0,0,.22)}.mtt .toggle::after{content:"";position:absolute;top:1px;left:1px;width:15px;height:14px;background:var(--panel-2);border:1px solid var(--line-2);border-radius:1px;box-shadow:0 1px 1px rgba(0,0,0,.25);transition:transform .1s}.mtt .toggle[aria-checked="true"]{background:var(--tape);border-color:var(--tape)}.mtt .toggle[aria-checked="true"]::after{transform:translateX(18px);border-color:var(--tape)}.mtt .toggle-wrap{display:flex;align-items:center;gap:6px}.mtt .toggle-wrap .tv{font:11px/1 var(--mono);color:var(--ink-3);min-width:14px}.mtt .seg{display:flex;gap:0;border:1px solid var(--line-2);border-radius:1px;overflow:hidden}.mtt .seg-key{padding:3px 9px;font:11px/1.4 var(--mono);background:var(--panel-2);cursor:pointer;color:var(--ink-2);border-left:1px solid var(--line-2);white-space:nowrap}.mtt .seg-key:first-child{border-left:0}.mtt .seg-key[aria-pressed="true"]{background:var(--ink);color:var(--panel-2)}.mtt .chips{display:flex;flex-wrap:wrap;gap:3px}.mtt .chip{padding:1px 6px;border:1px solid var(--line-2);border-radius:1px;font:11px/1.5 var(--mono);background:var(--panel);cursor:pointer;color:var(--ink-2);white-space:nowrap}.mtt .chip:hover{background:#f7f4ec}.mtt .chip[aria-pressed="true"]{background:var(--tape);border-color:var(--tape);color:#e9e4d3}.mtt .hint{font:11px/1.55 var(--mono);color:var(--ink-3);margin:4px 0 0}.mtt .apply{border-left:1px solid var(--line);padding:12px 14px;display:flex;flex-direction:column;gap:10px;min-height:0;background:var(--panel-2);overflow:hidden}.mtt .apply h2{margin:0;font:600 13px/1.3 var(--sans)}.mtt .apply .sub{font:10px/1.3 var(--mono);letter-spacing:.14em;color:var(--ink-3);text-transform:uppercase}.mtt .apply-sum{border:1px solid var(--line-2);background:var(--panel);padding:7px 9px;display:flex;flex-direction:column;gap:3px}.mtt .apply-sum .rowx{font-size:11px}.mtt .dirty-wrap{display:flex;flex-direction:column;gap:4px;min-height:0;overflow:hidden}.mtt .dirty-list{list-style:none;margin:0;padding:0;overflow-y:auto;min-height:0;scrollbar-width:thin}.mtt .dirty-list li{font:11px/1.5 var(--mono);color:var(--ink-2);padding:2px 0 2px 12px;position:relative;border-top:1px solid rgba(170,164,146,.3)}.mtt .dirty-list li::before{content:"";position:absolute;left:2px;top:8px;width:4px;height:4px;background:var(--grease);border-radius:50%}.mtt .dirty-list li b{color:var(--ink);font-weight:600}.mtt .dirty-empty{font:11px/1.6 var(--mono);color:var(--ink-3);border:1px dashed var(--line-2);padding:8px;text-align:center}.mtt .savebar{display:flex;align-items:center;gap:10px;padding:0 14px;background:var(--panel-3);border-top:2px solid var(--line-2);box-shadow:inset 0 1px 0 rgba(255,255,255,.4)}.mtt .savebar .sb-msg{display:flex;align-items:center;gap:7px;font:11px/1.3 var(--mono);color:var(--ink-2);white-space:nowrap}.mtt .savebar .sb-msg .dot{width:7px;height:7px;border-radius:50%;background:var(--led);border:1px solid var(--led)}.mtt .savebar.is-dirty .sb-msg .dot{background:var(--grease);border-color:var(--grease);box-shadow:0 0 0 2px var(--grease-soft)}.mtt .savebar.is-saving .sb-msg .dot{background:var(--ink-3);border-color:var(--ink-3)}.mtt .savebar .sb-spacer{flex:1}.mtt .savebar .sb-hint{font:11px/1.3 var(--mono);color:var(--ink-3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.mtt .view--archive{display:grid;grid-template-columns:200px minmax(0,1fr) 300px;min-height:0}.mtt .arch-left{border-right:1px solid var(--line);padding:12px 14px;display:flex;flex-direction:column;gap:12px;min-height:0;background:var(--panel-2);overflow:hidden}.mtt .arch-left h2{margin:0;font:600 13px/1.3 var(--sans)}.mtt .range-keys{display:flex;gap:4px}.mtt .range-key{flex:1;padding:7px 6px;text-align:center;border:1px solid var(--line-2);background:var(--panel-2);border-radius:var(--r);cursor:pointer;box-shadow:inset 0 1px 0 #fff,0 1px 0 rgba(0,0,0,.1)}.mtt .range-key b{display:block;font:600 12px/1.2 var(--sans)}.mtt .range-key small{display:block;font:10px/1.2 var(--mono);letter-spacing:.1em;color:var(--ink-3);margin-top:2px;text-transform:uppercase}.mtt .range-key[aria-pressed="true"]{background:var(--ink);border-color:var(--ink);color:var(--panel-2)}.mtt .range-key[aria-pressed="true"] small{color:#a7b2a8}.mtt .totals{display:flex;flex-direction:column;gap:2px;border-top:1px solid var(--line);padding-top:8px}.mtt .totals .trow{display:flex;justify-content:space-between;align-items:baseline;gap:8px;font:11px/1.6 var(--mono);color:var(--ink-3);white-space:nowrap}.mtt .totals .trow b{font:600 13px/1.4 var(--mono);color:var(--ink);font-variant-numeric:tabular-nums}.mtt .totals .trow b small{font:10px var(--mono);color:var(--ink-3);margin-left:2px;font-weight:400}.mtt .arch-left .foot{margin-top:auto;display:flex;flex-direction:column;gap:8px;border-top:1px solid var(--line);padding-top:8px}.mtt .arch-main{min-width:0;min-height:0;padding:12px 14px;display:grid;grid-template-rows:auto auto minmax(0,1fr);gap:8px}.mtt .arch-top{display:flex;align-items:baseline;justify-content:space-between;gap:10px}.mtt .arch-top .ah{display:flex;align-items:baseline;gap:8px;white-space:nowrap}.mtt .arch-top b{font:600 12.5px/1 var(--sans)}.mtt .arch-top .silk{white-space:nowrap}.mtt .arch-top .ameta{font:11px/1 var(--mono);color:var(--ink-3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.mtt .daytape-wrap{position:relative;padding-top:30px;padding-bottom:16px}.mtt .daytape{display:flex;height:78px;background:var(--well);border:1px solid var(--line-2);box-shadow:inset 0 2px 4px rgba(0,0,0,.16);overflow:hidden}.mtt .day{position:relative;flex:0 0 auto;min-width:0;border-left:1px solid rgba(237,234,221,.5);background:var(--tape);cursor:pointer;display:flex;flex-direction:column;justify-content:flex-end;padding:3px 3px 4px;transition:background .1s}.mtt .day:first-child{border-left:0}.mtt .day:hover{background:var(--tape-2)}.mtt .day[aria-selected="true"]{background:var(--tape-2);box-shadow:inset 0 0 0 2px var(--grease)}.mtt .day .dn{font:11px/1 var(--mono);color:#cfd8cd;letter-spacing:.02em;white-space:nowrap;overflow:hidden}.mtt .day.today .dn{color:#f2b6a6}.mtt .day .err{position:absolute;right:3px;top:3px;width:5px;height:5px;background:var(--grease);border-radius:50%}.mtt .day .bar{position:absolute;left:0;right:0;bottom:0;background:rgba(237,234,221,.14)}.mtt .day-axis{position:relative;height:14px}.mtt .day-axis .mlabel{position:absolute;top:0;font:11px/1 var(--mono);color:var(--ink-3);letter-spacing:.06em;transform:translateX(-50%);white-space:nowrap}.mtt .day-axis .mtick{position:absolute;top:-4px;width:1px;height:8px;background:var(--line-2)}.mtt .peak-note{position:absolute;top:2px;transform:translateX(-50%);font:11px/1.2 var(--mono);color:var(--grease);white-space:nowrap;text-align:center;letter-spacing:.02em}.mtt .peak-note::after{content:"";display:block;width:1px;height:16px;background:var(--grease);margin:2px auto 0}.mtt .today-note{position:absolute;top:2px;transform:translateX(-50%);font:11px/1.2 var(--mono);color:var(--grease);white-space:nowrap;letter-spacing:.06em}.mtt .today-note::after{content:"";display:block;width:1px;height:12px;background:var(--grease);margin:2px auto 0}.mtt .ledger-wrap{min-height:0;overflow:hidden;border-top:1px solid var(--line);display:flex;flex-direction:column}.mtt .ledger{width:100%;border-collapse:collapse;font:11px/1.3 var(--mono);table-layout:fixed}.mtt .ledger thead th{position:sticky;top:0;background:var(--panel-2);text-align:left;font:11px/1.2 var(--mono);letter-spacing:.12em;color:var(--ink-3);text-transform:uppercase;padding:5px 4px;border-bottom:1px solid var(--line-2);z-index:1}.mtt .ledger tbody tr{cursor:pointer;border-bottom:1px solid rgba(170,164,146,.24)}.mtt .ledger tbody tr:hover{background:var(--panel-2)}.mtt .ledger tbody tr[aria-selected="true"]{background:var(--panel-3);box-shadow:inset 2px 0 0 var(--grease)}.mtt .ledger td{padding:3px 4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-variant-numeric:tabular-nums;color:var(--ink-2)}.mtt .ledger td.d{color:var(--ink);font-weight:600}.mtt .ledger td.e{color:var(--grease)}.mtt .ledger .scroll{overflow-y:auto;min-height:0;scrollbar-width:thin}.mtt .arch-right{border-left:1px solid var(--line-2);padding:12px 14px;display:flex;flex-direction:column;gap:10px;background:var(--panel-2);min-height:0;overflow:hidden}.mtt .arch-right h2{margin:0;font:600 13px/1.3 var(--sans)}.mtt .day-detail{border:1px solid var(--line-2);background:var(--panel);padding:8px 10px;display:grid;grid-template-columns:1fr 1fr;gap:5px 10px}.mtt .day-detail .kv .v{font-size:12px}.mtt .day-detail .wide{grid-column:1 / -1;border-top:1px dashed var(--line);padding-top:5px}.mtt .arch-sec{border-top:1px solid var(--line);padding-top:8px;display:flex;flex-direction:column;gap:4px}.mtt .view--delivery{display:grid;grid-template-columns:200px minmax(0,1fr) 310px;min-height:0}.mtt .dlv-left{border-right:1px solid var(--line);padding:12px 14px;display:flex;flex-direction:column;gap:10px;background:var(--panel-2);min-height:0;overflow:hidden}.mtt .dlv-left h2{margin:0;font:600 13px/1.3 var(--sans)}.mtt .steps{list-style:none;margin:2px 0 0;padding:0;display:flex;flex-direction:column;gap:0}.mtt .step{display:grid;grid-template-columns:20px minmax(0,1fr);gap:7px;padding:6px 0;border-top:1px solid var(--line)}.mtt .step:first-child{border-top:0}.mtt .step .sn{font:10px/1.5 var(--mono);color:var(--ink-3);letter-spacing:.08em;padding-top:1px}.mtt .step b{display:block;font:11.5px/1.4 var(--sans);color:var(--ink);font-weight:600;margin-bottom:1px}.mtt .step span{display:block;font:10.5px/1.55 var(--mono);color:var(--ink-2)}.mtt .dlv-main{min-width:0;min-height:0;overflow-y:auto;padding:12px 16px;display:flex;flex-direction:column;gap:10px;scrollbar-width:thin}.mtt .dlv-top{display:flex;align-items:baseline;justify-content:space-between;gap:10px}.mtt .dlv-top .dh{display:flex;align-items:baseline;gap:8px}.mtt .dlv-top b{font:600 13px/1 var(--sans)}.mtt .dlv-top .silk{white-space:nowrap}.mtt .dlv-top .dmeta{font:11px/1 var(--mono);color:var(--ink-3)}.mtt .labelblock{border:1px solid var(--line-2);background:var(--panel-2);padding:9px 11px 10px;position:relative;box-shadow:inset 0 1px 0 rgba(255,255,255,.5)}.mtt .labelblock::before{content:"";position:absolute;left:0;top:0;bottom:0;width:3px;background:var(--tape)}.mtt .labelblock.grease::before{background:var(--grease)}.mtt .labelblock .lb-hd{display:flex;align-items:baseline;justify-content:space-between;gap:10px;margin-bottom:5px}.mtt .labelblock .lb-hd .silk{white-space:nowrap}.mtt .addr{display:flex;align-items:stretch;gap:8px}.mtt .addr code{flex:1;min-width:0;font:11px/1.55 var(--mono);color:var(--ink);word-break:break-all;background:var(--well);border:1px solid var(--line-2);padding:5px 7px;box-shadow:inset 0 1px 2px rgba(0,0,0,.12)}.mtt .addr .btn{align-self:center}.mtt .addr-note{font:11px/1.5 var(--mono);color:var(--ink-3);margin-top:4px}.mtt .spec{display:grid;grid-template-columns:82px minmax(0,1fr) auto;gap:0;border:1px solid var(--line-2);background:var(--panel-2)}.mtt .spec .sk{font:10px/1.5 var(--mono);letter-spacing:.1em;color:var(--ink-3);text-transform:uppercase;padding:4px 8px;border-top:1px solid var(--line);background:var(--panel-3)}.mtt .spec .sv{font:11px/1.6 var(--mono);color:var(--ink);padding:4px 8px;border-top:1px solid var(--line);word-break:break-all}.mtt .spec .sa{padding:2px 6px;border-top:1px solid var(--line);display:flex;align-items:center}.mtt .spec .sk:nth-child(-n+3), .mtt .spec .sv:nth-child(-n+3), .mtt .spec .sa:nth-child(-n+3){border-top:0}.mtt .code{font:11px/1.65 var(--mono);color:var(--ink);background:var(--well);border:1px solid var(--line-2);padding:8px 10px;white-space:pre-wrap;word-break:break-all;margin:0;box-shadow:inset 0 1px 2px rgba(0,0,0,.12);max-height:230px;overflow:auto;scrollbar-width:thin}.mtt .code.json{max-height:150px}.mtt .dlv-right{border-left:1px solid var(--line-2);padding:12px 14px;display:flex;flex-direction:column;gap:10px;background:var(--panel-2);min-height:0;overflow-y:auto;scrollbar-width:thin}.mtt .dlv-right h2{margin:0;font:600 13px/1.3 var(--sans)}.mtt .checklist{display:flex;flex-direction:column;gap:3px;border-top:1px solid var(--line);padding-top:7px}.mtt .check{display:grid;grid-template-columns:16px minmax(0,1fr) auto;gap:6px;align-items:baseline;font:11px/1.5 var(--mono);color:var(--ink-2)}.mtt .check .ck{font:10px/1.5 var(--mono);color:var(--led)}.mtt .check.warn .ck{color:var(--grease)}.mtt .check.warn .cv{color:var(--grease)}.mtt .check .cv{color:var(--ink-2);white-space:nowrap;text-align:right;overflow:hidden;text-overflow:ellipsis}.mtt .check .cn2{color:var(--ink);font-family:var(--sans);font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.mtt .errcodes{border-top:1px solid var(--line);padding-top:7px;display:flex;flex-direction:column;gap:3px}.mtt .errcode{display:grid;grid-template-columns:34px minmax(0,1fr);gap:7px;font:11px/1.5 var(--mono);color:var(--ink-2)}.mtt .errcode b{color:var(--grease);font-weight:600}.mtt .dlv-actions{display:flex;flex-wrap:wrap;gap:4px;border-top:1px solid var(--line);padding-top:8px;margin-top:auto}.mtt .statusbar{height:30px;display:flex;align-items:center;gap:14px;padding:0 14px;background:var(--panel-3);border-top:1px solid var(--line-2);font:11px/1 var(--mono);color:var(--ink-3);letter-spacing:.02em;position:relative;z-index:4}.mtt .statusbar .sb-l{display:flex;align-items:center;gap:7px;white-space:nowrap}.mtt .statusbar .dot{width:7px;height:7px;border-radius:50%;background:var(--led);border:1px solid var(--led)}.mtt .statusbar .dot.off{background:transparent;border-color:var(--ink-3)}.mtt .statusbar .dot.warn{background:var(--grease);border-color:var(--grease)}.mtt .statusbar .sb-hint{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1;color:var(--ink-2)}.mtt .statusbar .sb-hint b{color:var(--ink);font-weight:600}.mtt .statusbar .sb-r{display:flex;align-items:center;gap:10px;white-space:nowrap}.mtt .statusbar .sb-r .sep{color:var(--line-2)}.mtt .toast{position:fixed;left:50%;bottom:44px;transform:translate(-50%,8px);display:flex;align-items:center;gap:9px;background:var(--ink);color:var(--panel-2);padding:8px 14px;font:11.5px/1.3 var(--mono);letter-spacing:.02em;border-left:3px solid var(--grease);box-shadow:0 6px 18px rgba(0,0,0,.28);z-index:60;opacity:0;pointer-events:none;transition:opacity .15s,transform .15s;max-width:min(560px,84vw)}.mtt .toast.show{opacity:1;transform:translate(-50%,0)}.mtt .toast .tdot{width:6px;height:6px;background:var(--grease);border-radius:50%;flex:0 0 6px}\n@media (max-width:1180px){.mtt .view--timeline{grid-template-columns:152px minmax(0,1fr) 288px}.mtt .view--archive{grid-template-columns:184px minmax(0,1fr) 274px}.mtt .view--delivery{grid-template-columns:184px minmax(0,1fr) 282px}.mtt .view--settings .set-grid{grid-template-columns:184px minmax(0,1fr) 274px}.mtt .tp-bar{padding:0 10px}.mtt .tp-cell{padding:0 10px;gap:8px}.mtt .plate{min-width:190px}.mtt .brand-txt small{font-size:10px}.mtt .heads{padding-left:10px;padding-right:8px}.mtt .timeline{padding-left:8px;padding-right:8px}.mtt .take{grid-template-columns:58px 24px 34px minmax(0,1fr) 48px 46px 42px;gap:6px}.mtt .head-row{font-size:11px}\n}\n@media (max-width:1050px){.mtt .view--timeline{grid-template-columns:140px minmax(0,1fr) 246px}.mtt .view--archive{grid-template-columns:166px minmax(0,1fr) 240px}.mtt .view--delivery{grid-template-columns:166px minmax(0,1fr) 246px}.mtt .view--settings .set-grid{grid-template-columns:160px minmax(0,1fr) 238px}.mtt .lamps{grid-template-columns:auto auto;gap:2px 10px}.mtt .rail-meters{gap:10px}.mtt .meter-bar{width:56px}.mtt .rail-live{display:none}.mtt .viewkeys{flex:0 0 auto}.mtt .viewkey{flex:0 0 auto}.mtt .heads-top .silk:first-child{display:none}.mtt .head--main .head-row:nth-child(3), .mtt .head--main .head-row:nth-child(4){display:none}.mtt .head--lat .head-row:nth-child(3){display:none}.mtt .head--take > div > small{display:none}.mtt .head--readers .reader small{display:none}.mtt .head--local .st, .mtt .head--cloud .st{display:none}.mtt .pick-rec{display:none}.mtt .inspector{padding-bottom:14px}.mtt .hybrid-cells span{display:none}.mtt .heads-note{display:none}.mtt .counter{font-size:18px}.mtt .inspector{overflow-y:auto;scrollbar-width:thin}.mtt .take{grid-template-columns:62px 24px 32px minmax(0,1fr) 44px 46px;gap:6px;height:auto;min-height:24px;padding:2px 5px}.mtt .take .tc{display:block}.mtt .timeline{grid-template-rows:34px minmax(0,1.15fr) 10px minmax(132px,1fr)}.mtt .heads{grid-template-rows:34px minmax(0,1.15fr) 10px minmax(132px,1fr)}.mtt .tl-core{grid-template-rows:28px minmax(100px,1fr) 70px 30px 30px}.mtt .heads-core{grid-template-rows:28px minmax(100px,1fr) 70px 30px 30px}.mtt .module .knob-row{gap:3px 8px}\n}\n@container (max-width:900px){.mtt .tp-bar{height:54px}.mtt .plate{min-width:0;padding:5px 9px 5px 7px}.mtt .brand-txt b{font-size:12px}.mtt .brand-txt small{display:none}.mtt .tp-cell{gap:6px}.mtt .key{width:50px;height:38px}.mtt .key .zi{font-size:11px}.mtt .clock b{font-size:16px}.mtt .clock small{display:none}.mtt .tp-pause-wrap{margin-left:8px;padding-left:8px}.mtt .key--pause{width:50px}.mtt .rail-meters .meter:nth-child(2){display:none}.mtt .rail-meters{gap:8px}.mtt .view--timeline{grid-template-columns:132px minmax(0,1fr) 232px}.mtt .view--archive{grid-template-columns:150px minmax(0,1fr) 214px}.mtt .view--delivery{grid-template-columns:152px minmax(0,1fr) 220px}.mtt .view--settings .set-grid{grid-template-columns:minmax(0,1fr) 214px}.mtt .view--settings .set-left{display:none}.mtt .view--settings .modules{grid-template-columns:minmax(0,1fr)}.mtt .timeline{padding:8px}.mtt .heads{padding:8px 6px 8px 8px}.mtt .head .h-title small{display:none}.mtt .heads-top .silk:first-child{display:none}.mtt .head--main .h-title .idx{display:none}.mtt .heads-core{grid-template-rows:26px minmax(96px,1fr) 64px 28px 28px}.mtt .tl-core{grid-template-rows:26px minmax(96px,1fr) 64px 28px 28px}.mtt .timeline{grid-template-rows:32px minmax(0,1.12fr) 8px minmax(126px,1fr)}.mtt .heads{grid-template-rows:32px minmax(0,1.12fr) 8px minmax(126px,1fr)}.mtt .clip .no, .mtt .clip .wbar, .mtt .clip .cache{display:none}.mtt .clip{padding:4px 2px}.mtt .clip .role{font-size:11px}.mtt .take{grid-template-columns:60px 24px 30px minmax(0,1fr) 42px 44px;gap:5px;font-size:12px}.mtt .take .td{display:none}.mtt .takes-hd .th-meta{display:none}.mtt .pick-text{font-size:12px;-webkit-line-clamp:2}.mtt .pick-meta{grid-template-columns:1fr 1fr}.mtt .ins-hd .cn{display:none}.mtt .inspector{padding:8px 9px 8px 10px;gap:7px}.mtt .module .knob-wrap{min-width:56px}.mtt .tl-meta{display:none}.mtt .statusbar .sb-r .opt{display:none}.mtt .peak-note, .mtt .today-note{font-size:11px}.mtt .arch-main{padding:8px}.mtt .day .dn{font-size:11px}.mtt .daytape{height:64px}.mtt .set-left, .mtt .apply, .mtt .arch-left, .mtt .arch-right, .mtt .dlv-left, .mtt .dlv-right{padding:9px 10px}.mtt .ledger{font-size:11px}.mtt .ledger th:nth-child(6), .mtt .ledger td:nth-child(6){display:none}.mtt .ledger th:nth-child(1){width:86px!important}.mtt .ledger th:nth-child(2), .mtt .ledger th:nth-child(3){width:46px!important}.mtt .ledger th:nth-child(4){width:74px!important}.mtt .ledger th:nth-child(5){width:92px!important}.mtt .code{font-size:11px}\n}\n@container (max-width:760px){.mtt .view--timeline{grid-template-columns:96px minmax(0,1fr)}.mtt .inspector{grid-column:1 / -1;display:none}.mtt .view--timeline{grid-template-rows:minmax(0,1fr) 0}\n}\n@media (prefers-reduced-motion:reduce){.mtt *, .mtt *::before, .mtt *::after{animation-duration:.001ms !important;animation-iteration-count:1 !important;transition-duration:.001ms !important;scroll-behavior:auto !important}.mtt .reel .rot{animation:none !important}\n}\n@media print{.mtt{height:auto;overflow:visible;background:#fff}.mtt .deck{height:auto;display:block}.mtt .transport, .mtt .statusbar, .mtt .toast, .mtt .viewkeys{display:none !important}.mtt .view{display:block !important}.mtt .view[hidden]{display:block !important}.mtt .bench{display:block}.mtt .timeline, .mtt .inspector, .mtt .heads{height:auto}\n}\n\n.mtt{box-sizing:border-box;height:100%;min-height:0;padding-top:var(--dsh-frame-top-clearance,0px);background:var(--panel);position:relative;overflow:hidden}\n/* deck \u7684\u9690\u5F0F\u5217\u9ED8\u8BA4\u6309 max-content \u6491\uFF08\u6574\u9875\u65F6\u65E0\u6240\u8C13\uFF0C\u9762\u677F\u91CC\u4F1A\u88AB\u62D6\u7A84\uFF09\uFF1A\u9489\u6210 1fr\uFF0C\u5141\u8BB8\u5185\u90E8\u6536\u7F29 */\n.mtt .deck{height:100%;grid-template-columns:minmax(0,1fr)}\n.mtt .bench,.mtt .view{min-width:0}\n.mtt .arch-main{grid-template-columns:minmax(0,1fr)}\n.mtt .toast{position:fixed}\n.mtt{container-type:inline-size;background:var(--panel)}\n\n/* port adjustments\n   mock \u662F\u6574\u9875\uFF0C\u63D2\u4EF6\u662F\u9762\u677F\uFF1A\u9762\u677F\u5BBD\u5EA6\u53EF\u4EE5\u5C0F\u4E8E\u89C6\u53E3\uFF08DSH \u4FA7\u680F\u5360\u4F4D\uFF09\uFF0C\u6240\u4EE5\n   deck.css \u91CC 1180 / 1050 \u65AD\u70B9\uFF08\u4ECD\u662F\u89C6\u53E3 media query\uFF09\u9700\u8981\u6309\u300C\u9762\u677F\u5BBD\u5EA6\u300D\u8865\u4E00\u4EFD\u3002\n   \u53EA\u8865\u9762\u677F\u9002\u914D\u5FC5\u9700\u7684\u4E24\u7EC4\uFF1A\u22641050 \u7684\u5185\u90E8\u6EDA\u52A8/\u9690\u85CF\u9879\uFF0C901\u20131050 \u7684\u56DB\u57DF\u5217\u5BBD\u3002 */\n@container (max-width:1050px){\n  .mtt .inspector{overflow-y:auto;overflow-x:hidden;scrollbar-width:thin}\n  .mtt .head-window, .mtt .heads-note, .mtt .rail-live{display:none}\n  .mtt .rail-meters{gap:10px}\n  .mtt .meter-bar{width:56px}\n}\n@container (min-width:901px) and (max-width:1050px){\n  .mtt .view--timeline{grid-template-columns:140px minmax(0,1fr) 246px}\n  .mtt .view--archive{grid-template-columns:166px minmax(0,1fr) 240px}\n  .mtt .view--delivery{grid-template-columns:166px minmax(0,1fr) 246px}\n  .mtt .view--settings .set-grid{grid-template-columns:160px minmax(0,1fr) 238px}\n}\n';

// client/timeline-math.js
function buildTimeline(recent) {
  const rows = (Array.isArray(recent) ? recent : []).filter(Boolean).map((r) => ({
    at: num(r.at),
    chars: num(r.chars),
    segments: Math.max(1, num(r.segments, 1)),
    bytes: num(r.bytes),
    audioSeconds: Math.max(0, num(r.audioSeconds)),
    latencyMs: num(r.latencyMs),
    cacheHit: Boolean(r.cacheHit),
    role: ROLE_CN[r.role] ? r.role : "narrator",
    source: sourceOf(r).key,
    sourceLabel: sourceOf(r).label,
    error: Boolean(r.error),
    client: r.client || "",
    text: r.text || "",
    format: r.format || ""
  }));
  rows.sort((a, b) => a.at - b.at);
  const totalAudio = rows.reduce((a, r) => a + r.audioSeconds, 0);
  const totalChars = rows.reduce((a, r) => a + r.chars, 0);
  let weights = rows.map((r) => r.audioSeconds);
  if (rows.length && totalAudio <= 0) weights = rows.map(() => 1);
  else if (rows.length) {
    const fill = Math.max(totalAudio * 0.01, 0.05);
    weights = weights.map((w) => w > 0 ? w : fill);
  }
  const wSum = weights.reduce((a, w) => a + w, 0) || 1;
  const maxChars = Math.max(1, ...rows.map((r) => r.chars));
  const maxLatency = Math.max(0, ...rows.map((r) => r.latencyMs));
  const latScale = Math.max(1e3, Math.ceil(maxLatency / 1e3) * 1e3);
  const okLat = rows.filter((r) => !r.error && r.latencyMs > 0);
  const avgLatency = okLat.length ? okLat.reduce((a, r) => a + r.latencyMs, 0) / okLat.length : 0;
  const cacheHits = rows.filter((r) => r.cacheHit).length;
  let acc = 0;
  const list = rows.map((r, i) => {
    const wPct = weights[i] / wSum * 100;
    const startPct = acc;
    acc += wPct;
    const startSec = totalAudio > 0 ? startPct / 100 * totalAudio : 0;
    const endSec = totalAudio > 0 ? acc / 100 * totalAudio : 0;
    return {
      ...r,
      index: i,
      sig: `${r.text}|${r.chars}|${r.role}|${r.latencyMs}|${r.audioSeconds}|${r.segments}`,
      wPct,
      startPct,
      endPct: acc,
      startSec,
      endSec,
      wbar: clamp(r.chars / maxChars * 100, 8, 100),
      latPct: clamp(r.latencyMs / latScale * 100, 4, 100)
    };
  });
  return { list, totalAudio, totalChars, maxChars, maxLatency, latScale, avgLatency, cacheHits };
}
function rulerTicks(total) {
  if (!(total > 0)) return { labelStep: 0, minorStep: 0, ticks: [] };
  const steps = [1, 2, 5, 10, 15, 30, 60, 120, 300, 600, 900, 1800];
  const nice = (raw) => {
    for (const s of steps) if (s >= raw) return s;
    return 1800;
  };
  const labelStep = nice(total / 8);
  const minorStep = Math.max(1, Math.round(labelStep / 6));
  const ticks = [];
  for (let t = 0; t <= total + 1e-6; t += minorStep) {
    const isMajor = Math.abs(t / labelStep - Math.round(t / labelStep)) < 1e-6;
    ticks.push({ t, pct: t / total * 100, major: isMajor });
    if (ticks.length > 400) break;
  }
  return { labelStep, minorStep, ticks };
}
function sortedDays(days) {
  return (Array.isArray(days) ? days : []).filter(Boolean).slice().sort((a, b) => String(a.day) < String(b.day) ? -1 : String(a.day) > String(b.day) ? 1 : 0);
}

// client/components/ArchiveView.jsx
var import_react2 = __toESM(require("react"), 1);

// client/components/Primitives.jsx
var import_react = __toESM(require("react"), 1);
var KNOB_TICKS = (() => {
  const out = [];
  const cx = 24;
  const cy = 24;
  for (let i = 0; i <= 10; i++) {
    const a = (-135 + 270 * (i / 10)) * Math.PI / 180;
    out.push({
      x1: cx + 17.2 * Math.sin(a),
      y1: cy - 17.2 * Math.cos(a),
      x2: cx + 21.2 * Math.sin(a),
      y2: cy - 21.2 * Math.cos(a)
    });
  }
  return out;
})();
function KnobTicks() {
  return /* @__PURE__ */ import_react.default.createElement("svg", { className: "knob-ticks", viewBox: "0 0 48 48", "aria-hidden": "true" }, KNOB_TICKS.map((t, i) => /* @__PURE__ */ import_react.default.createElement(
    "line",
    {
      key: i,
      x1: t.x1.toFixed(2),
      y1: t.y1.toFixed(2),
      x2: t.x2.toFixed(2),
      y2: t.y2.toFixed(2),
      stroke: "#aaa492",
      strokeWidth: 1
    }
  )));
}
function Knob({ label, value, min, max, step, unit, dirty, onChange, ariaLabel }) {
  const v = clamp(num(value, min), min, max);
  const ratio = max > min ? (v - min) / (max - min) : 0;
  const angle = -135 + 270 * ratio;
  const drag = (0, import_react.useRef)(null);
  const commit = (next) => {
    const snapped = clamp(Math.round(next / step) * step, min, max);
    onChange(snapped);
  };
  const onPointerDown = (e) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    e.preventDefault();
    try {
      e.currentTarget.focus();
    } catch {
    }
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
    }
    drag.current = { y: e.clientY, value: v };
  };
  const onPointerMove = (e) => {
    if (!drag.current) return;
    const range = max - min;
    commit(drag.current.value + (drag.current.y - e.clientY) / 120 * range);
  };
  const endDrag = () => {
    drag.current = null;
  };
  const onKeyDown = (e) => {
    let next = null;
    if (e.key === "ArrowUp" || e.key === "ArrowRight") next = v + step;
    else if (e.key === "ArrowDown" || e.key === "ArrowLeft") next = v - step;
    else if (e.key === "PageUp") next = v + step * 5;
    else if (e.key === "PageDown") next = v - step * 5;
    else if (e.key === "Home") next = min;
    else if (e.key === "End") next = max;
    if (next == null) return;
    e.preventDefault();
    e.stopPropagation();
    commit(next);
  };
  return /* @__PURE__ */ import_react.default.createElement("div", { className: dirty ? "knob-wrap is-dirty" : "knob-wrap", "data-label": label }, /* @__PURE__ */ import_react.default.createElement("span", { className: "kl" }, label), /* @__PURE__ */ import_react.default.createElement("div", { className: "knob-holder" }, /* @__PURE__ */ import_react.default.createElement(KnobTicks, null), /* @__PURE__ */ import_react.default.createElement(
    "div",
    {
      className: "knob",
      tabIndex: 0,
      role: "slider",
      "aria-label": ariaLabel || `${label}\uFF08${unit || ""}\uFF09`,
      "aria-valuemin": min,
      "aria-valuemax": max,
      "aria-valuenow": v,
      title: `${label} \xB7 ${v}${unit || ""}\uFF08\u62D6\u52A8\u6216\u65B9\u5411\u952E\uFF09`,
      "data-min": min,
      "data-max": max,
      "data-step": step,
      "data-unit": unit || "",
      style: { "--angle": `${angle.toFixed(2)}deg` },
      onPointerDown,
      onPointerMove,
      onPointerUp: endDrag,
      onPointerCancel: endDrag,
      onKeyDown
    }
  )), /* @__PURE__ */ import_react.default.createElement("output", { className: "knob-val" }, String(v)));
}
function Toggle({ label, checked, onChange, disabled }) {
  return /* @__PURE__ */ import_react.default.createElement("div", { className: "toggle-wrap" }, /* @__PURE__ */ import_react.default.createElement(
    "button",
    {
      className: "toggle",
      type: "button",
      role: "switch",
      "aria-checked": Boolean(checked),
      "aria-label": label,
      disabled: Boolean(disabled),
      onClick: () => onChange(!checked)
    }
  ), /* @__PURE__ */ import_react.default.createElement("span", { className: "tv" }, checked ? "\u5F00" : "\u5173"));
}
function Chips({ options, value, onChange, ariaLabel }) {
  return /* @__PURE__ */ import_react.default.createElement("div", { className: "chips", role: "group", "aria-label": ariaLabel }, (options || []).map((opt) => /* @__PURE__ */ import_react.default.createElement(
    "button",
    {
      key: opt,
      className: "chip",
      type: "button",
      "aria-pressed": String(opt === value),
      onClick: () => onChange(opt)
    },
    opt
  )));
}
function Seg({ options, value, onChange, ariaLabel }) {
  return /* @__PURE__ */ import_react.default.createElement("div", { className: "seg", role: "group", "aria-label": ariaLabel }, (options || []).map((opt) => /* @__PURE__ */ import_react.default.createElement(
    "button",
    {
      key: opt.value,
      className: "seg-key",
      type: "button",
      "aria-pressed": String(opt.value === value),
      onClick: () => onChange(opt.value)
    },
    opt.label
  )));
}
function Field({ label, sub, children, style }) {
  return /* @__PURE__ */ import_react.default.createElement("label", { className: "field", style }, /* @__PURE__ */ import_react.default.createElement("span", { className: "fl" }, label, sub ? /* @__PURE__ */ import_react.default.createElement("i", null, sub) : null), children);
}
function Input({ value, onChange, type = "text", inputMode, placeholder, spellCheck, disabled, style, step }) {
  return /* @__PURE__ */ import_react.default.createElement(
    "input",
    {
      className: "input",
      type,
      step,
      inputMode,
      value: value == null ? "" : value,
      placeholder,
      spellCheck: spellCheck === true,
      disabled: Boolean(disabled),
      style,
      onChange: (e) => onChange(e.target.value)
    }
  );
}
function Textarea({ value, onChange, rows = 2, placeholder, spellCheck }) {
  return /* @__PURE__ */ import_react.default.createElement(
    "textarea",
    {
      className: "input",
      rows,
      value: value == null ? "" : value,
      placeholder,
      spellCheck: spellCheck === true,
      onChange: (e) => onChange(e.target.value)
    }
  );
}
function HeadRow({ k, v }) {
  return /* @__PURE__ */ import_react.default.createElement("div", { className: "head-row" }, /* @__PURE__ */ import_react.default.createElement("span", null, k), v);
}
function Rowx({ k, v }) {
  return /* @__PURE__ */ import_react.default.createElement("div", { className: "rowx" }, /* @__PURE__ */ import_react.default.createElement("span", null, k), /* @__PURE__ */ import_react.default.createElement("b", null, v));
}
var VU_GEOM = (() => {
  const cx = 100;
  const cy = 90;
  const R = 62;
  const pt = (a, r) => [cx + r * Math.sin(a * Math.PI / 180), cy - r * Math.cos(a * Math.PI / 180)];
  const a0 = -62;
  const a1 = 62;
  const [x0, y0] = pt(a0, R);
  const [x1, y1] = pt(a1, R);
  const arc = `M ${x0.toFixed(2)} ${y0.toFixed(2)} A ${R} ${R} 0 0 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`;
  const [rx, ry] = pt(a0 + 124 * 0.86, R);
  const redArc = `M ${rx.toFixed(2)} ${ry.toFixed(2)} A ${R} ${R} 0 0 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`;
  const ticks = [];
  for (let v = 0; v <= 100; v += 5) {
    const a = a0 + 124 * (v / 100);
    const [ix, iy] = pt(a, R - 6);
    const [ox, oy] = pt(a, R);
    ticks.push({ ix: ix.toFixed(2), iy: iy.toFixed(2), ox: ox.toFixed(2), oy: oy.toFixed(2), major: v % 25 === 0 });
  }
  return { cx, cy, R, arc, redArc, ticks };
})();
function VuTable({ ratio }) {
  const r = clamp(num(ratio), 0, 1);
  const angle = -62 + 124 * r;
  return /* @__PURE__ */ import_react.default.createElement("svg", { viewBox: "0 0 200 100", role: "img", "aria-label": `\u7F13\u5B58\u5360\u7528 ${Math.round(r * 100)}%` }, /* @__PURE__ */ import_react.default.createElement("rect", { x: 0.5, y: 0.5, width: 199, height: 99, fill: "#f0ece3", stroke: "#c9c3b3" }), /* @__PURE__ */ import_react.default.createElement("path", { d: VU_GEOM.arc, fill: "none", stroke: "#4b524c", strokeWidth: 1.2 }), /* @__PURE__ */ import_react.default.createElement("path", { d: VU_GEOM.redArc, fill: "none", stroke: "#b13a22", strokeWidth: 2.4 }), VU_GEOM.ticks.map((t, i) => /* @__PURE__ */ import_react.default.createElement(
    "line",
    {
      key: i,
      x1: t.ix,
      y1: t.iy,
      x2: t.ox,
      y2: t.oy,
      stroke: "#242a26",
      strokeWidth: t.major ? 1.1 : 0.7,
      opacity: t.major ? 0.85 : 0.5
    }
  )), /* @__PURE__ */ import_react.default.createElement("circle", { cx: VU_GEOM.cx, cy: VU_GEOM.cy, r: 2.4, fill: "#242a26" }), /* @__PURE__ */ import_react.default.createElement(
    "line",
    {
      x1: VU_GEOM.cx,
      y1: VU_GEOM.cy,
      x2: VU_GEOM.cx,
      y2: VU_GEOM.cy - VU_GEOM.R + 8,
      stroke: "#b13a22",
      strokeWidth: 1.6,
      strokeLinecap: "round",
      style: { transformOrigin: `${VU_GEOM.cx}px ${VU_GEOM.cy}px`, transform: `rotate(${angle.toFixed(2)}deg)` }
    }
  ));
}
function PanelGlyph({ size = 16 } = {}) {
  return /* @__PURE__ */ import_react.default.createElement(
    "svg",
    {
      width: size,
      height: size,
      viewBox: "0 0 24 24",
      fill: "none",
      focusable: "false",
      "aria-hidden": "true",
      style: { flex: "none", display: "block" }
    },
    /* @__PURE__ */ import_react.default.createElement("rect", { x: 4, y: 3.2, width: 16, height: 17.6, stroke: "currentColor", strokeWidth: 1.4 }),
    /* @__PURE__ */ import_react.default.createElement("path", { d: "M7.4 8.4h9.2M7.4 11.6h9.2M7.4 14.8h5.6", stroke: "currentColor", strokeWidth: 1.2, opacity: 0.6 }),
    /* @__PURE__ */ import_react.default.createElement("circle", { cx: 17.4, cy: 17.6, r: 2.1, stroke: "currentColor", strokeWidth: 1.3 })
  );
}

// client/components/ArchiveView.jsx
function ArchiveView({ live, range, setRange, selectedDay, onSelectDay, onExportCsv }) {
  const totals = live?.totals || {};
  const lat = live?.latency || {};
  const asc = (0, import_react2.useMemo)(() => sortedDays(live?.days), [live]);
  const days = range === 30 ? asc.slice(-30) : asc.slice(-7);
  const sumSec = days.reduce((a, d) => a + num(d.seconds), 0);
  const sel = days.find((d) => d.day === selectedDay) || days[days.length - 1] || null;
  const todayKey = todayKeyUTC();
  const n = days.length;
  const widths = days.map((d) => sumSec > 0 ? num(d.seconds) / sumSec * 100 : 100 / Math.max(1, n));
  const lefts = [];
  let acc = 0;
  widths.forEach((w) => {
    lefts.push(acc);
    acc += w;
  });
  const midOf = (i) => lefts[i] + widths[i] / 2;
  const notes = [];
  if (n) {
    const peakIdx = days.reduce((best, d, i) => num(d.seconds) > num(days[best].seconds) ? i : best, 0);
    const todayIdx = days.findIndex((d) => d.day === todayKey);
    const peak = days[peakIdx];
    if (todayIdx >= 0 && todayIdx === peakIdx) {
      notes.push(
        /* @__PURE__ */ import_react2.default.createElement("div", { key: "peak", className: "peak-note", style: { left: `${clamp(midOf(todayIdx), 1, 99).toFixed(3)}%` } }, `\u5CF0\u503C \xB7 \u4ECA\u65E5 ${Math.round(num(peak.seconds) / 60)} \u5206 \xB7 ${fmtInt(peak.segments)} \u6BB5`)
      );
    } else {
      notes.push(
        /* @__PURE__ */ import_react2.default.createElement("div", { key: "peak", className: "peak-note", style: { left: `${clamp(midOf(peakIdx), 1, 99).toFixed(3)}%` } }, `\u5CF0\u503C ${String(peak.day).slice(5)} \xB7 ${Math.round(num(peak.seconds) / 60)} \u5206 \xB7 ${fmtInt(peak.segments)} \u6BB5`)
      );
      if (todayIdx >= 0) {
        notes.push(
          /* @__PURE__ */ import_react2.default.createElement(
            "div",
            {
              key: "today",
              className: "today-note",
              style: { left: `${clamp(midOf(todayIdx), 1, 99).toFixed(3)}%`, transform: "translateX(-100%)" }
            },
            `\u4ECA\u65E5 ${Math.round(num(days[todayIdx].seconds) / 60)} \u5206`
          )
        );
      }
    }
  }
  const axis = [];
  days.forEach((d, i) => {
    const day = String(d.day || "");
    if (i === 0 || day.endsWith("-01")) {
      axis.push(/* @__PURE__ */ import_react2.default.createElement("span", { key: `mt-${i}`, className: "mtick", style: { left: `${lefts[i].toFixed(3)}%` } }));
      axis.push(
        /* @__PURE__ */ import_react2.default.createElement(
          "span",
          {
            key: `ml-${i}`,
            className: "mlabel",
            style: { left: `${lefts[i].toFixed(3)}%`, transform: i === 0 ? "none" : void 0 }
          },
          `${parseInt(day.slice(5, 7), 10)}\u6708`
        )
      );
    }
  });
  const rangeRequests = days.reduce((a, d) => a + num(d.requests), 0);
  const rangeErrors = days.filter((d) => num(d.errors) > 0).length;
  const rangeLabel = `${range === 30 ? "30" : "7"} \u65E5`;
  const leftTotals = [
    ["\u7D2F\u8BA1\u65F6\u957F", hm(totals.seconds)],
    ["\u7D2F\u8BA1\u5B57\u6570", fmtInt(totals.chars)],
    ["\u7D2F\u8BA1\u8BF7\u6C42", fmtInt(totals.requests)],
    ["\u7D2F\u8BA1\u6BB5\u6570", fmtInt(totals.segments)],
    ["\u7D2F\u8BA1\u9519\u8BEF", String(num(totals.errors))],
    ["\u7F13\u5B58\u547D\u4E2D", fmtInt(totals.cacheHits)]
  ];
  return /* @__PURE__ */ import_react2.default.createElement("section", { className: "view view--archive", id: "view-archive", "aria-label": "\u5DE5\u7A0B\u53F2" }, /* @__PURE__ */ import_react2.default.createElement("div", { className: "arch-left" }, /* @__PURE__ */ import_react2.default.createElement("div", null, /* @__PURE__ */ import_react2.default.createElement("h2", null, "\u5DE5\u7A0B\u53F2"), /* @__PURE__ */ import_react2.default.createElement("div", { className: "sub" }, "Session Archive")), /* @__PURE__ */ import_react2.default.createElement("div", { className: "range-keys", role: "group", "aria-label": "\u6863\u6848\u8303\u56F4" }, /* @__PURE__ */ import_react2.default.createElement(
    "button",
    {
      className: "range-key",
      type: "button",
      "data-range": "30",
      "aria-pressed": String(range === 30),
      onClick: () => setRange(30)
    },
    /* @__PURE__ */ import_react2.default.createElement("b", null, "30 \u5929"),
    /* @__PURE__ */ import_react2.default.createElement("small", null, "ALL TAKES")
  ), /* @__PURE__ */ import_react2.default.createElement(
    "button",
    {
      className: "range-key",
      type: "button",
      "data-range": "7",
      "aria-pressed": String(range === 7),
      onClick: () => setRange(7)
    },
    /* @__PURE__ */ import_react2.default.createElement("b", null, "7 \u5929"),
    /* @__PURE__ */ import_react2.default.createElement("small", null, "RECENT")
  )), /* @__PURE__ */ import_react2.default.createElement("div", { className: "totals", id: "totalsList" }, leftTotals.map(([k, v]) => /* @__PURE__ */ import_react2.default.createElement("div", { key: k, className: "trow" }, /* @__PURE__ */ import_react2.default.createElement("span", null, k), /* @__PURE__ */ import_react2.default.createElement("b", null, v)))), /* @__PURE__ */ import_react2.default.createElement("div", { className: "foot" }, /* @__PURE__ */ import_react2.default.createElement("button", { className: "btn", type: "button", "data-action": "export-csv", onClick: onExportCsv }, "\u5BFC\u51FA CSV \xB7 \u65E5\u8868"), /* @__PURE__ */ import_react2.default.createElement("p", { className: "hint", style: { margin: 0 } }, "\u7D2F\u8BA1 = \u670D\u52A1\u542F\u7528\u4EE5\u6765\uFF08totals\uFF09\uFF1B\u65E5\u5E26 = \u6309 UTC \u81EA\u7136\u65E5\u7EDF\u8BA1\u7684\u5408\u6210\u97F3\u9891\u79D2\u6570\uFF08days\uFF09\u3002"))), /* @__PURE__ */ import_react2.default.createElement("div", { className: "arch-main" }, /* @__PURE__ */ import_react2.default.createElement("div", { className: "arch-top" }, /* @__PURE__ */ import_react2.default.createElement("div", { className: "ah" }, /* @__PURE__ */ import_react2.default.createElement("span", { className: "silk" }, "DAILY TAPE"), /* @__PURE__ */ import_react2.default.createElement("b", null, "\u538B\u7F29\u65E5\u5E26"), /* @__PURE__ */ import_react2.default.createElement("span", { className: "silk" }, `${n} \u65E5 / ${rangeLabel}`)), /* @__PURE__ */ import_react2.default.createElement("div", { className: "ameta" }, n ? `${String(days[0].day).slice(5)} \u2192 ${String(days[n - 1].day).slice(5)} \xB7 \u4E00\u5929\u4E00\u683C \xB7 \u5BBD\u5EA6 = \u5F53\u65E5\u5408\u6210\u97F3\u9891\u79D2\u6570` : "\u8FD8\u6CA1\u6709\u8DE8\u5929\u8BB0\u5F55 \xB7 \u4EA7\u751F\u8DE8\u5929\u6D41\u91CF\u540E\u8FD9\u91CC\u4F1A\u51FA\u73B0\u538B\u7F29\u65E5\u5E26")), /* @__PURE__ */ import_react2.default.createElement("div", { className: "daytape-wrap" }, notes, /* @__PURE__ */ import_react2.default.createElement("div", { className: "daytape", "aria-label": `${rangeLabel}\u538B\u7F29\u65E5\u5E26` }, days.map((d, i) => /* @__PURE__ */ import_react2.default.createElement(
    "button",
    {
      key: d.day,
      className: `day${d.day === todayKey ? " today" : ""}`,
      type: "button",
      "data-day": d.day,
      "aria-selected": String(Boolean(sel) && d.day === sel.day),
      style: { width: `${widths[i].toFixed(3)}%` },
      title: `${d.day} \xB7 ${fmtInt(d.requests)} \u8BF7\u6C42 \xB7 ${fmtInt(d.segments)} \u6BB5 \xB7 ${hm(d.seconds)} \xB7 ${fmtInt(d.chars)} \u5B57${num(d.errors) ? ` \xB7 \u9519\u8BEF ${num(d.errors)}` : ""}`,
      onClick: () => onSelectDay(d.day)
    },
    /* @__PURE__ */ import_react2.default.createElement("span", { className: "dn" }, range === 30 ? String(d.day).slice(8) : String(d.day).slice(5)),
    num(d.errors) ? /* @__PURE__ */ import_react2.default.createElement("span", { className: "err", "aria-hidden": "true" }) : null
  ))), /* @__PURE__ */ import_react2.default.createElement("div", { className: "day-axis" }, axis)), /* @__PURE__ */ import_react2.default.createElement("div", { className: "ledger-wrap" }, /* @__PURE__ */ import_react2.default.createElement("div", { className: "scroll" }, /* @__PURE__ */ import_react2.default.createElement("table", { className: "ledger", id: "ledger" }, /* @__PURE__ */ import_react2.default.createElement("thead", null, /* @__PURE__ */ import_react2.default.createElement("tr", null, /* @__PURE__ */ import_react2.default.createElement("th", { style: { width: 96 } }, "\u65E5\u671F"), /* @__PURE__ */ import_react2.default.createElement("th", { style: { width: 64 } }, "\u8BF7\u6C42"), /* @__PURE__ */ import_react2.default.createElement("th", { style: { width: 64 } }, "\u6BB5"), /* @__PURE__ */ import_react2.default.createElement("th", { style: { width: 96 } }, "\u5408\u6210\u65F6\u957F"), /* @__PURE__ */ import_react2.default.createElement("th", { style: { width: 110 } }, "\u5B57\u6570"), /* @__PURE__ */ import_react2.default.createElement("th", { style: { width: 90 } }, "\u5B57\u8282"), /* @__PURE__ */ import_react2.default.createElement("th", null, "\u9519\u8BEF"))), /* @__PURE__ */ import_react2.default.createElement("tbody", null, days.length ? days.slice().reverse().map((d) => /* @__PURE__ */ import_react2.default.createElement(
    "tr",
    {
      key: d.day,
      "data-day": d.day,
      tabIndex: 0,
      "aria-selected": String(Boolean(sel) && d.day === sel.day),
      onClick: () => onSelectDay(d.day),
      onKeyDown: (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelectDay(d.day);
        }
      }
    },
    /* @__PURE__ */ import_react2.default.createElement("td", { className: "d" }, String(d.day)),
    /* @__PURE__ */ import_react2.default.createElement("td", null, fmtInt(d.requests)),
    /* @__PURE__ */ import_react2.default.createElement("td", null, fmtInt(d.segments)),
    /* @__PURE__ */ import_react2.default.createElement("td", null, hm(d.seconds)),
    /* @__PURE__ */ import_react2.default.createElement("td", null, fmtInt(d.chars)),
    /* @__PURE__ */ import_react2.default.createElement("td", null, fmtBytes(d.bytes)),
    /* @__PURE__ */ import_react2.default.createElement("td", { className: num(d.errors) ? "e" : void 0 }, num(d.errors) ? String(num(d.errors)) : "\u2014")
  )) : /* @__PURE__ */ import_react2.default.createElement("tr", null, /* @__PURE__ */ import_react2.default.createElement("td", { colSpan: 7, style: { color: "var(--ink-3)", padding: "10px 4px" } }, "\u8FD8\u6CA1\u6709\u65E5\u7EDF\u8BA1\u3002\u8DE8\u5929\u540E /api/state \u7684 days[] \u4F1A\u81EA\u52A8\u5E26\u51FA\u6BCF\u5929\u4E00\u884C\u3002"))))))), /* @__PURE__ */ import_react2.default.createElement("aside", { className: "arch-right" }, /* @__PURE__ */ import_react2.default.createElement("div", { className: "ins-hd", style: { borderTop: 0, paddingTop: 0 } }, /* @__PURE__ */ import_react2.default.createElement("span", { className: "silk" }, "SESSION ", /* @__PURE__ */ import_react2.default.createElement("b", null, "\u9009\u4E2D\u65E5")), /* @__PURE__ */ import_react2.default.createElement("span", { className: "cn" }, sel ? weekdayOfDay(sel.day) : "\u2014")), /* @__PURE__ */ import_react2.default.createElement("div", { className: "day-detail", id: "dayDetail" }, sel ? /* @__PURE__ */ import_react2.default.createElement(import_react2.default.Fragment, null, /* @__PURE__ */ import_react2.default.createElement("div", { className: "kv wide" }, /* @__PURE__ */ import_react2.default.createElement("span", { className: "k" }, "\u65E5\u671F DATE"), /* @__PURE__ */ import_react2.default.createElement("span", { className: "v" }, `${sel.day} \xB7 ${weekdayOfDay(sel.day)}`)), /* @__PURE__ */ import_react2.default.createElement("div", { className: "kv" }, /* @__PURE__ */ import_react2.default.createElement("span", { className: "k" }, "\u8BF7\u6C42"), /* @__PURE__ */ import_react2.default.createElement("span", { className: "v" }, fmtInt(sel.requests))), /* @__PURE__ */ import_react2.default.createElement("div", { className: "kv" }, /* @__PURE__ */ import_react2.default.createElement("span", { className: "k" }, "\u6BB5"), /* @__PURE__ */ import_react2.default.createElement("span", { className: "v" }, fmtInt(sel.segments))), /* @__PURE__ */ import_react2.default.createElement("div", { className: "kv" }, /* @__PURE__ */ import_react2.default.createElement("span", { className: "k" }, "\u5408\u6210\u65F6\u957F"), /* @__PURE__ */ import_react2.default.createElement("span", { className: "v" }, hm(sel.seconds))), /* @__PURE__ */ import_react2.default.createElement("div", { className: "kv" }, /* @__PURE__ */ import_react2.default.createElement("span", { className: "k" }, "\u5B57\u6570"), /* @__PURE__ */ import_react2.default.createElement("span", { className: "v" }, fmtInt(sel.chars))), /* @__PURE__ */ import_react2.default.createElement("div", { className: "kv" }, /* @__PURE__ */ import_react2.default.createElement("span", { className: "k" }, "\u5B57\u8282"), /* @__PURE__ */ import_react2.default.createElement("span", { className: "v" }, fmtBytes(sel.bytes))), /* @__PURE__ */ import_react2.default.createElement("div", { className: "kv" }, /* @__PURE__ */ import_react2.default.createElement("span", { className: "k" }, "\u9519\u8BEF"), /* @__PURE__ */ import_react2.default.createElement("span", { className: "v" }, String(num(sel.errors))))) : /* @__PURE__ */ import_react2.default.createElement("div", { className: "kv wide" }, /* @__PURE__ */ import_react2.default.createElement("span", { className: "k" }, "\u65E5\u671F DATE"), /* @__PURE__ */ import_react2.default.createElement("span", { className: "v" }, "\u2014"))), /* @__PURE__ */ import_react2.default.createElement("div", { className: "arch-sec" }, /* @__PURE__ */ import_react2.default.createElement("span", { className: "silk" }, "RANGE ", /* @__PURE__ */ import_react2.default.createElement("b", null, "\u672C\u6BB5\u5408\u8BA1")), /* @__PURE__ */ import_react2.default.createElement(Rowx, { k: "\u65E5\u6570", v: String(n) }), /* @__PURE__ */ import_react2.default.createElement(Rowx, { k: "\u8BF7\u6C42", v: fmtInt(rangeRequests) }), /* @__PURE__ */ import_react2.default.createElement(Rowx, { k: "\u5408\u6210\u65F6\u957F", v: hm(sumSec) }), /* @__PURE__ */ import_react2.default.createElement(Rowx, { k: "\u9519\u8BEF\u65E5", v: `${rangeErrors} \u5929` })), /* @__PURE__ */ import_react2.default.createElement("div", { className: "arch-sec" }, /* @__PURE__ */ import_react2.default.createElement("span", { className: "silk" }, "LATENCY ", /* @__PURE__ */ import_react2.default.createElement("b", null, "\u672C\u7A97\u5206\u4F4D")), /* @__PURE__ */ import_react2.default.createElement(Rowx, { k: "p50", v: latQ(lat.p50, lat.samples) }), /* @__PURE__ */ import_react2.default.createElement(Rowx, { k: "p95", v: latQ(lat.p95, lat.samples) }), /* @__PURE__ */ import_react2.default.createElement(Rowx, { k: "max", v: latQ(lat.max, lat.samples) }), /* @__PURE__ */ import_react2.default.createElement(Rowx, { k: "\u6837\u672C", v: fmtInt(lat.samples) })), /* @__PURE__ */ import_react2.default.createElement("div", { className: "arch-sec", style: { marginTop: "auto" } }, /* @__PURE__ */ import_react2.default.createElement(Rowx, { k: "\u8BB0\u5F55\u81EA", v: asc.length ? String(asc[0].day) : "\u2014" }), /* @__PURE__ */ import_react2.default.createElement(Rowx, { k: "\u6863\u6848\u53E3\u5F84", v: "UTC \u81EA\u7136\u65E5" }))));
}

// client/components/DeliveryView.jsx
var import_react3 = __toESM(require("react"), 1);
function DeliveryView({ service, config, importInfo, onCopy, onExportConfig, onPreview, previewBusy }) {
  const imp = importInfo || {};
  const cfg = config || {};
  const running = Boolean(service?.running);
  const hasToken = Boolean(imp.hasToken);
  const lanUrls = Array.isArray(imp.lanUrls) ? imp.lanUrls : [];
  const publicJson = imp.publicJsonUrl || "";
  const jsonUrl = imp.jsonUrl || "\u2014";
  const listenUrl = imp.listenUrl || "\u2014";
  const token = cfg.auth?.token || "";
  const extraHeaders = cfg.legado?.extraHeaders && typeof cfg.legado.extraHeaders === "object" ? cfg.legado.extraHeaders : {};
  const extraCount = Object.keys(extraHeaders).length;
  const payload = legadoPayload(imp, cfg);
  const curl = curlText(listenUrl);
  const concurrency = num(cfg.synth?.concurrency);
  const rpm = num(cfg.limits?.rpm);
  const provider = service?.provider || cfg.upstream?.provider || "mimo";
  const dlvMeta = running ? `\u5C40\u57DF\u7F51\u76F4\u8FDE \xB7 ${hasToken ? "\u4EE4\u724C\u5DF2\u914D\u7F6E" : "\u4EE4\u724C\u672A\u542F\u7528"}${publicJson ? " \xB7 \u5BF9\u5916\u5730\u5740\u5DF2\u8BBE\u7F6E" : ""}` : "\u670D\u52A1\u5DF2\u505C\u6B62 \xB7 \u5148\u542F\u52A8\u518D\u4EA4\u4ED8";
  const checks = [
    [running, "\u670D\u52A1\u8FD0\u884C", running ? "RUN" : "STOP"],
    [hasToken, "URL \u4EE4\u724C", hasToken ? "\u5DF2\u914D\u7F6E" : "\u7F3A\u5931"],
    [Boolean(cfg.auth?.enabled), "Basic \u9274\u6743", cfg.auth?.enabled ? "\u5F00\u542F" : "\u5173\u95ED"],
    [lanUrls.length > 0, "\u5C40\u57DF\u7F51\u5165\u53E3", `${lanUrls.length} \u4E2A`],
    [Boolean(publicJson), "\u5BF9\u5916\u5730\u5740", publicJson || "\u672A\u8BBE\u7F6E"],
    [extraCount > 0, "\u9644\u52A0\u8BF7\u6C42\u5934", extraCount ? `${extraCount} \u9879` : "\u672A\u8BBE\u7F6E"],
    [true, "\u7AEF\u53E3", `${service?.host || cfg.server?.host || "\u2014"}:${service?.port || cfg.server?.port || "\u2014"}`],
    [true, "\u5F15\u64CE", PROVIDER_CN[provider] || provider]
  ];
  const specRow = (sk, sv, sa) => /* @__PURE__ */ import_react3.default.createElement(import_react3.default.Fragment, { key: sk }, /* @__PURE__ */ import_react3.default.createElement("span", { className: "sk" }, sk), /* @__PURE__ */ import_react3.default.createElement("span", { className: "sv" }, sv), /* @__PURE__ */ import_react3.default.createElement("span", { className: "sa" }, sa || null));
  return /* @__PURE__ */ import_react3.default.createElement("section", { className: "view view--delivery", id: "view-delivery", "aria-label": "\u4EA4\u4ED8" }, /* @__PURE__ */ import_react3.default.createElement("div", { className: "dlv-left" }, /* @__PURE__ */ import_react3.default.createElement("div", null, /* @__PURE__ */ import_react3.default.createElement("h2", null, "\u4EA4\u4ED8"), /* @__PURE__ */ import_react3.default.createElement("div", { className: "sub" }, "Master Delivery")), /* @__PURE__ */ import_react3.default.createElement("p", { className: "chain-note", style: { margin: 0 } }, "\u4EA4\u4ED8\u7269 = \u4E00\u6761 Legado \u5728\u7EBF\u6717\u8BFB\u5F15\u64CE\u3002", /* @__PURE__ */ import_react3.default.createElement("br", null), "\u672C\u673A\u4ECD\u662F\u552F\u4E00\u6E32\u67D3\u6E90\u3002"), /* @__PURE__ */ import_react3.default.createElement("ol", { className: "steps" }, /* @__PURE__ */ import_react3.default.createElement("li", { className: "step" }, /* @__PURE__ */ import_react3.default.createElement("span", { className: "sn" }, "01"), /* @__PURE__ */ import_react3.default.createElement("div", null, /* @__PURE__ */ import_react3.default.createElement("b", null, "\u786E\u8BA4\u670D\u52A1\u5728\u8DD1"), /* @__PURE__ */ import_react3.default.createElement("span", null, `transport \u663E\u793A RUN\uFF0C\u7AEF\u53E3 ${service?.port || cfg.server?.port || "\u2014"} \u5728\u76D1\u542C`))), /* @__PURE__ */ import_react3.default.createElement("li", { className: "step" }, /* @__PURE__ */ import_react3.default.createElement("span", { className: "sn" }, "02"), /* @__PURE__ */ import_react3.default.createElement("div", null, /* @__PURE__ */ import_react3.default.createElement("b", null, "\u590D\u5236\u5BFC\u5165\u5730\u5740"), /* @__PURE__ */ import_react3.default.createElement("span", null, "\u6216\u76F4\u63A5\u590D\u5236 JSON \u6587\u672C\uFF08\u6302 Cloudflare Access \u65F6\u7528\u5B83\uFF09"))), /* @__PURE__ */ import_react3.default.createElement("li", { className: "step" }, /* @__PURE__ */ import_react3.default.createElement("span", { className: "sn" }, "03"), /* @__PURE__ */ import_react3.default.createElement("div", null, /* @__PURE__ */ import_react3.default.createElement("b", null, "\u5728\u9605\u8BFB\u91CC\u5BFC\u5165"), /* @__PURE__ */ import_react3.default.createElement("span", null, "\u6717\u8BFB\u754C\u9762 \u2192 \u8BBE\u7F6E \u2192 \u5728\u7EBF\u6717\u8BFB \u2192 \u7F51\u7EDC\u5BFC\u5165 \u2192 \u7C98\u8D34"))), /* @__PURE__ */ import_react3.default.createElement("li", { className: "step" }, /* @__PURE__ */ import_react3.default.createElement("span", { className: "sn" }, "04"), /* @__PURE__ */ import_react3.default.createElement("div", null, /* @__PURE__ */ import_react3.default.createElement("b", null, "\u8BD5\u4E00\u53E5\u8BDD"), /* @__PURE__ */ import_react3.default.createElement("span", null, "\u70B9\u300C\u8BD5\u542C\u4E00\u58F0\u300D\u6216\u7528 curl \u6253 /listening\uFF0C\u62FF\u5230\u771F\u5B9E\u65F6\u957F WAV \u5373\u901A")))), /* @__PURE__ */ import_react3.default.createElement("div", { className: "arch-sec", style: { marginTop: "auto" } }, /* @__PURE__ */ import_react3.default.createElement(Rowx, { k: "\u5E76\u53D1", v: `${concurrency} \u8DEF` }), /* @__PURE__ */ import_react3.default.createElement(Rowx, { k: "\u9650\u901F", v: `${rpm} \u6B21 / \u5206\u949F` }), /* @__PURE__ */ import_react3.default.createElement(Rowx, { k: "Body", v: "form-urlencoded" }))), /* @__PURE__ */ import_react3.default.createElement("div", { className: "dlv-main" }, /* @__PURE__ */ import_react3.default.createElement("div", { className: "dlv-top" }, /* @__PURE__ */ import_react3.default.createElement("div", { className: "dh" }, /* @__PURE__ */ import_react3.default.createElement("span", { className: "silk" }, "DELIVERY NOTE"), /* @__PURE__ */ import_react3.default.createElement("b", null, "\u6BCD\u5E26\u4EA4\u4ED8\u5355")), /* @__PURE__ */ import_react3.default.createElement("div", { className: "dmeta" }, dlvMeta)), /* @__PURE__ */ import_react3.default.createElement("div", { className: "labelblock" }, /* @__PURE__ */ import_react3.default.createElement("div", { className: "lb-hd" }, /* @__PURE__ */ import_react3.default.createElement("span", { className: "silk" }, "IMPORT URL ", /* @__PURE__ */ import_react3.default.createElement("b", null, "\u4E00\u952E\u5BFC\u5165\u5730\u5740")), /* @__PURE__ */ import_react3.default.createElement("span", { className: "silk" }, publicJson ? "WAN" : "LAN")), /* @__PURE__ */ import_react3.default.createElement("div", { className: "addr" }, /* @__PURE__ */ import_react3.default.createElement("code", { id: "importUrl" }, jsonUrl), /* @__PURE__ */ import_react3.default.createElement("button", { className: "btn btn--sm btn--tape", type: "button", "data-copy": "import", onClick: () => onCopy("import") }, "\u590D\u5236\u5BFC\u5165\u5730\u5740")), publicJson ? /* @__PURE__ */ import_react3.default.createElement("div", { className: "addr", style: { marginTop: 6 } }, /* @__PURE__ */ import_react3.default.createElement("code", { id: "publicImportUrl" }, publicJson), /* @__PURE__ */ import_react3.default.createElement("button", { className: "btn btn--sm", type: "button", "data-copy": "public-import", onClick: () => onCopy("public-import") }, "\u590D\u5236\u516C\u7F51")) : null, /* @__PURE__ */ import_react3.default.createElement("div", { className: "addr-note", id: "importNote" }, lanUrls.length ? `\u5C40\u57DF\u7F51 ${lanUrls[0]} \xB7 \u624B\u673A\u4E0E\u7535\u8111\u9700\u5728\u540C\u4E00\u7F51\u6BB5${publicJson ? "" : " \xB7 \u5BF9\u5916\u5730\u5740\u672A\u8BBE\u7F6E"}` : "\u5BBF\u4E3B\u8FD8\u6CA1\u63A2\u6D4B\u5230\u5C40\u57DF\u7F51\u5730\u5740 \xB7 \u4ECD\u53EF\u7528\u4E0B\u65B9 curl \u6216\u300C\u8BD5\u542C\u300D\u5728\u672C\u673A\u9A8C\u8BC1")), /* @__PURE__ */ import_react3.default.createElement("div", { className: "labelblock" }, /* @__PURE__ */ import_react3.default.createElement("div", { className: "lb-hd" }, /* @__PURE__ */ import_react3.default.createElement("span", { className: "silk" }, "LISTEN URL ", /* @__PURE__ */ import_react3.default.createElement("b", null, "\u6717\u8BFB\u63A5\u53E3")), /* @__PURE__ */ import_react3.default.createElement("span", { className: "silk" }, "POST \xB7 WAV")), /* @__PURE__ */ import_react3.default.createElement("div", { className: "addr" }, /* @__PURE__ */ import_react3.default.createElement("code", { id: "listenUrl" }, listenUrl), /* @__PURE__ */ import_react3.default.createElement("button", { className: "btn btn--sm", type: "button", "data-copy": "listen", onClick: () => onCopy("listen") }, "\u590D\u5236\u6717\u8BFB")), /* @__PURE__ */ import_react3.default.createElement("div", { className: "spec", style: { marginTop: 7 } }, specRow("METHOD", "POST"), specRow("CONTENT-TYPE", "application/x-www-form-urlencoded"), specRow(
    "BODY",
    BODY_TEXT,
    /* @__PURE__ */ import_react3.default.createElement("button", { className: "btn btn--sm btn--ghost", type: "button", "data-copy": "body", onClick: () => onCopy("body") }, "\u590D\u5236")
  ), specRow(
    "URL \u4EE4\u724C",
    token ? `?token=${token}` : "\u672A\u542F\u7528",
    token ? /* @__PURE__ */ import_react3.default.createElement("button", { className: "btn btn--sm btn--ghost", type: "button", "data-copy": "token", onClick: () => onCopy("token") }, "\u590D\u5236") : null
  ), specRow("\u5E76\u53D1 / \u9650\u901F", `${concurrency} \u8DEF \xB7 ${rpm} \u6B21 / \u5206\u949F`))), /* @__PURE__ */ import_react3.default.createElement("div", { className: "labelblock grease" }, /* @__PURE__ */ import_react3.default.createElement("div", { className: "lb-hd" }, /* @__PURE__ */ import_react3.default.createElement("span", { className: "silk" }, "MASTER CONTENT ", /* @__PURE__ */ import_react3.default.createElement("b", null, "\u6BCD\u5E26\u5185\u5BB9 \xB7 legado.json")), /* @__PURE__ */ import_react3.default.createElement("button", { className: "btn btn--sm", type: "button", "data-copy": "json", onClick: () => onCopy("json") }, "\u590D\u5236 JSON")), /* @__PURE__ */ import_react3.default.createElement("pre", { className: "code json", id: "jsonBlock" }, JSON.stringify(payload, null, 2))), /* @__PURE__ */ import_react3.default.createElement("div", { className: "labelblock" }, /* @__PURE__ */ import_react3.default.createElement("div", { className: "lb-hd" }, /* @__PURE__ */ import_react3.default.createElement("span", { className: "silk" }, "SMOKE TEST ", /* @__PURE__ */ import_react3.default.createElement("b", null, "\u8BD5\u542C\u4E0E curl \u8BD5\u4E00\u53E5")), /* @__PURE__ */ import_react3.default.createElement("div", { style: { display: "flex", gap: 6 } }, /* @__PURE__ */ import_react3.default.createElement(
    "button",
    {
      className: "btn btn--sm btn--tape",
      type: "button",
      "data-action": "preview-narrator",
      disabled: Boolean(previewBusy),
      onClick: () => onPreview("narrator")
    },
    previewBusy === "narrator" ? "\u5408\u6210\u4E2D\u2026" : "\u8BD5\u542C\u65C1\u767D"
  ), /* @__PURE__ */ import_react3.default.createElement(
    "button",
    {
      className: "btn btn--sm",
      type: "button",
      "data-action": "preview-dialogue",
      disabled: Boolean(previewBusy),
      onClick: () => onPreview("dialogue")
    },
    previewBusy === "dialogue" ? "\u5408\u6210\u4E2D\u2026" : "\u8BD5\u542C\u5BF9\u8BDD"
  ), /* @__PURE__ */ import_react3.default.createElement("button", { className: "btn btn--sm", type: "button", "data-copy": "curl", onClick: () => onCopy("curl") }, "\u590D\u5236 curl"))), /* @__PURE__ */ import_react3.default.createElement("pre", { className: "code", id: "curlBlock" }, curl))), /* @__PURE__ */ import_react3.default.createElement("aside", { className: "dlv-right" }, /* @__PURE__ */ import_react3.default.createElement("div", null, /* @__PURE__ */ import_react3.default.createElement("h2", null, "\u4EA4\u4ED8\u6821\u9A8C"), /* @__PURE__ */ import_react3.default.createElement("div", { className: "sub" }, "Preflight")), /* @__PURE__ */ import_react3.default.createElement("div", { className: "checklist" }, checks.map(([ok, label, value]) => /* @__PURE__ */ import_react3.default.createElement("div", { key: label, className: `check${ok ? "" : " warn"}` }, /* @__PURE__ */ import_react3.default.createElement("span", { className: "ck" }, ok ? "\u2713" : "\u25CB"), /* @__PURE__ */ import_react3.default.createElement("span", { className: "cn2" }, label), /* @__PURE__ */ import_react3.default.createElement("span", { className: "cv", title: String(value) }, String(value))))), /* @__PURE__ */ import_react3.default.createElement("div", { className: "errcodes" }, /* @__PURE__ */ import_react3.default.createElement("span", { className: "silk", style: { marginBottom: 3 } }, "ERROR CODES ", /* @__PURE__ */ import_react3.default.createElement("b", null, "\u9519\u8BEF\u7801")), ERR_CODES.map(([code, fix]) => /* @__PURE__ */ import_react3.default.createElement("div", { key: code, className: "errcode" }, /* @__PURE__ */ import_react3.default.createElement("b", null, code), /* @__PURE__ */ import_react3.default.createElement("span", null, fix)))), /* @__PURE__ */ import_react3.default.createElement("div", { className: "dlv-actions" }, /* @__PURE__ */ import_react3.default.createElement("button", { className: "btn btn--sm", type: "button", "data-copy": "import", onClick: () => onCopy("import") }, "\u590D\u5236\u5BFC\u5165\u5730\u5740"), /* @__PURE__ */ import_react3.default.createElement("button", { className: "btn btn--sm", type: "button", "data-copy": "json", onClick: () => onCopy("json") }, "\u590D\u5236 JSON"), /* @__PURE__ */ import_react3.default.createElement("button", { className: "btn btn--sm", type: "button", "data-copy": "curl", onClick: () => onCopy("curl") }, "\u590D\u5236 curl"), /* @__PURE__ */ import_react3.default.createElement("button", { className: "btn btn--sm", type: "button", "data-action": "export-config", onClick: onExportConfig }, "\u5BFC\u51FA\u914D\u7F6E")), /* @__PURE__ */ import_react3.default.createElement("p", { className: "hint", style: { marginTop: "auto" } }, "\u6302 Cloudflare Access \u65F6\u628A\u670D\u52A1\u4EE4\u724C\u586B\u8FDB\u300C\u6E32\u67D3\u8BBE\u7F6E \xB7 \u4F20\u8F93 \xB7 \u9644\u52A0\u8BF7\u6C42\u5934\u300D\uFF0CLegado \u624D\u4E0D\u4F1A\u62FF\u5230\u767B\u5F55\u9875\u3002")));
}

// client/components/SettingsView.jsx
var import_react4 = __toESM(require("react"), 1);
function settingsChainValue(live, draft) {
  const cache = live?.cache || {};
  return {
    cache: `${fmtInt(cache.entries)} / ${fmtInt(cache.maxEntries)}`,
    engine: String(draft?.["upstream.provider"] || "mimo"),
    concurrency: String(draft?.["synth.concurrency"] || "4")
  };
}
function scrollToModule(id) {
  const el = document.getElementById(id);
  if (!el) return;
  const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  el.scrollIntoView({ block: "start", behavior: reduced ? "auto" : "smooth" });
}
var MOD_NAV = [
  ["mod-engine", "01", "\u5F15\u64CE"],
  ["mod-local", "02", "\u672C\u5730\u5F15\u64CE"],
  ["mod-openai", "03", "OpenAI \u517C\u5BB9"],
  ["mod-voice", "04", "\u97F3\u8272"],
  ["mod-synth", "05", "\u5408\u6210\u4E0E\u7F13\u5B58"],
  ["mod-transport", "06", "\u4F20\u8F93"],
  ["mod-auth", "07", "\u9274\u6743"]
];
function SettingsView({
  live,
  localInfo,
  draft,
  applied,
  changes,
  presetVoices,
  saving,
  savedAt,
  onSet,
  onSave,
  onRevert,
  onExportConfig,
  onPreview,
  previewBusy
}) {
  const d = draft || applied || {};
  const dirty = (path) => changes.some((c) => c.path === path);
  const moduleDirty = (name) => changes.some((c) => c.module === name);
  const set = (path) => (value) => onSet(path, value);
  const chain = settingsChainValue(live, d);
  const input = (path, opts = {}) => /* @__PURE__ */ import_react4.default.createElement(Input, { value: d[path], onChange: set(path), ...opts });
  const knob = (path, label, min, max, step, unit, ariaLabel) => /* @__PURE__ */ import_react4.default.createElement(
    Knob,
    {
      key: path,
      label,
      value: d[path],
      min,
      max,
      step,
      unit,
      ariaLabel,
      dirty: dirty(path),
      onChange: (v) => onSet(path, String(v))
    }
  );
  const toggle = (path, label) => /* @__PURE__ */ import_react4.default.createElement(Toggle, { label, checked: Boolean(d[path]), onChange: (v) => onSet(path, v) });
  const twoCol = (...children) => /* @__PURE__ */ import_react4.default.createElement("div", { className: "field", style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 } }, children);
  const moduleShell = (id, no, title, silk, name, children) => /* @__PURE__ */ import_react4.default.createElement("div", { className: `module${moduleDirty(name) ? " is-dirty" : ""}`, id, "data-module": "true" }, /* @__PURE__ */ import_react4.default.createElement("div", { className: "module-hd" }, /* @__PURE__ */ import_react4.default.createElement("span", { className: "mh" }, /* @__PURE__ */ import_react4.default.createElement("span", { className: "mnum" }, no), /* @__PURE__ */ import_react4.default.createElement("b", null, title), /* @__PURE__ */ import_react4.default.createElement("span", { className: "silk" }, silk)), /* @__PURE__ */ import_react4.default.createElement("span", { className: "dirty-dot", title: "\u6709\u672A\u4FDD\u5B58\u6539\u52A8" })), children);
  const localTag = !localInfo?.enabled ? "\u968F\u6E32\u67D3\u6765\u6E90\u5207\u6362" : localStateText(localInfo);
  return /* @__PURE__ */ import_react4.default.createElement("section", { className: "view view--settings", id: "view-settings", "aria-label": "\u6E32\u67D3\u8BBE\u7F6E" }, /* @__PURE__ */ import_react4.default.createElement("div", { className: "set-grid" }, /* @__PURE__ */ import_react4.default.createElement("div", { className: "set-left" }, /* @__PURE__ */ import_react4.default.createElement("div", null, /* @__PURE__ */ import_react4.default.createElement("h2", null, "\u6E32\u67D3\u8BBE\u7F6E"), /* @__PURE__ */ import_react4.default.createElement("div", { className: "sub" }, "Render Rack")), /* @__PURE__ */ import_react4.default.createElement("div", { className: "chain", "aria-label": "\u4FE1\u53F7\u94FE" }, /* @__PURE__ */ import_react4.default.createElement("div", { className: "chain-node" }, /* @__PURE__ */ import_react4.default.createElement("span", { className: "ld" }), /* @__PURE__ */ import_react4.default.createElement("b", null, "\u7AE0\u8282\u6B63\u6587"), " ", /* @__PURE__ */ import_react4.default.createElement("span", { className: "muted" }, "TEXT")), /* @__PURE__ */ import_react4.default.createElement("div", { className: "chain-link" }), /* @__PURE__ */ import_react4.default.createElement("div", { className: "chain-node" }, /* @__PURE__ */ import_react4.default.createElement("span", { className: "ld" }), /* @__PURE__ */ import_react4.default.createElement("b", null, "\u5207\u5206"), " ", /* @__PURE__ */ import_react4.default.createElement("span", { className: "muted" }, "\u65C1\u767D / \u5BF9\u8BDD")), /* @__PURE__ */ import_react4.default.createElement("div", { className: "chain-link" }), /* @__PURE__ */ import_react4.default.createElement("div", { className: "chain-node" }, /* @__PURE__ */ import_react4.default.createElement("span", { className: "ld" }), /* @__PURE__ */ import_react4.default.createElement("b", null, "\u5408\u6210\u961F\u5217"), " ", /* @__PURE__ */ import_react4.default.createElement("span", { className: "muted" }, `CONCURRENCY ${chain.concurrency}`)), /* @__PURE__ */ import_react4.default.createElement("div", { className: "chain-link" }), /* @__PURE__ */ import_react4.default.createElement("div", { className: "chain-node" }, /* @__PURE__ */ import_react4.default.createElement("span", { className: "ld" }), /* @__PURE__ */ import_react4.default.createElement("b", null, "\u7F13\u5B58\u5E26"), " ", /* @__PURE__ */ import_react4.default.createElement("span", { className: "muted" }, chain.cache)), /* @__PURE__ */ import_react4.default.createElement("div", { className: "chain-link" }), /* @__PURE__ */ import_react4.default.createElement("div", { className: "chain-node" }, /* @__PURE__ */ import_react4.default.createElement("span", { className: "ld" }), /* @__PURE__ */ import_react4.default.createElement("b", null, "\u5F15\u64CE"), " ", /* @__PURE__ */ import_react4.default.createElement("span", { className: "muted" }, chain.engine)), /* @__PURE__ */ import_react4.default.createElement("div", { className: "chain-link" }), /* @__PURE__ */ import_react4.default.createElement("div", { className: "chain-node" }, /* @__PURE__ */ import_react4.default.createElement("span", { className: "ld" }), /* @__PURE__ */ import_react4.default.createElement("b", null, "WAV"), " ", /* @__PURE__ */ import_react4.default.createElement("span", { className: "muted" }, "\u6574\u6BB5 \xB7 \u771F\u5B9E\u65F6\u957F"))), /* @__PURE__ */ import_react4.default.createElement("p", { className: "chain-note" }, "\u6539\u52A8\u5148\u843D\u8349\u7A3F\uFF0C\u70B9\u300C\u4FDD\u5B58\u5E76\u751F\u6548\u300D\u624D\u5199\u5165\u8FD0\u884C\u914D\u7F6E\u3002\u5BC6\u94A5\u53EA\u5728\u672C\u673A\uFF0C\u9875\u9762\u62FF\u5230\u7684\u6C38\u8FDC\u662F\u63A9\u7801\u3002"), /* @__PURE__ */ import_react4.default.createElement("nav", { className: "mod-index", "aria-label": "\u6A21\u5757\u5B9A\u4F4D" }, MOD_NAV.map(([id, no, name]) => /* @__PURE__ */ import_react4.default.createElement("button", { key: id, type: "button", "data-scroll": id, onClick: () => scrollToModule(id) }, /* @__PURE__ */ import_react4.default.createElement("span", { className: "n" }, no), name)))), /* @__PURE__ */ import_react4.default.createElement("div", { className: "modules", id: "modules" }, moduleShell("mod-engine", "01", "\u5F15\u64CE", "ENGINE", "engine", [
    /* @__PURE__ */ import_react4.default.createElement("div", { key: "prov", className: "ctrl-row" }, /* @__PURE__ */ import_react4.default.createElement("div", { className: "cl" }, /* @__PURE__ */ import_react4.default.createElement("b", null, "\u6E32\u67D3\u6765\u6E90"), /* @__PURE__ */ import_react4.default.createElement("i", null, "PROVIDER")), /* @__PURE__ */ import_react4.default.createElement(
      Seg,
      {
        options: [
          { value: "mimo", label: "\u4E91\u7AEF" },
          { value: "local", label: "\u672C\u5730" },
          { value: "hybrid", label: "\u6DF7\u5408" },
          { value: "openai", label: "OpenAI" }
        ],
        value: d["upstream.provider"],
        ariaLabel: "\u6E32\u67D3\u6765\u6E90",
        onChange: (v) => onSet("upstream.provider", v)
      }
    )),
    /* @__PURE__ */ import_react4.default.createElement("div", { key: "knobs", className: "knob-row" }, knob("upstream.hybrid.maxCloudBootstrap", "\u4E91\u9876\u73ED", 0, 30, 1, "\u6BB5", "\u4E91\u9876\u73ED\u4E0A\u9650\uFF08\u6BB5\uFF09"), knob("upstream.hybrid.cloudConcurrency", "\u4E91\u5E76\u53D1", 1, 2, 1, "\u8DEF", "\u4E91\u5E76\u53D1\uFF08\u8DEF\uFF0CMiMo \u514B\u9686\u6700\u591A 2 \u8DEF\uFF09"), /* @__PURE__ */ import_react4.default.createElement("div", { className: "knob-wrap", "data-label": "\u672C\u5730\u9884\u70ED" }, /* @__PURE__ */ import_react4.default.createElement("span", { className: "kl" }, "\u672C\u5730\u9884\u70ED"), toggle("upstream.hybrid.warmup", "\u672C\u5730\u9884\u70ED"))),
    /* @__PURE__ */ import_react4.default.createElement(Field, { key: "rms", label: "\u76EE\u6807\u54CD\u5EA6", sub: "RMS" }, input("upstream.hybrid.targetRms", { inputMode: "decimal", type: "text" })),
    /* @__PURE__ */ import_react4.default.createElement(Field, { key: "model", label: "MiMo \u4E91\u7AEF\u6A21\u578B", sub: "MODEL" }, input("upstream.model", { spellCheck: false }))
  ]), moduleShell("mod-local", "02", "\u672C\u5730\u5F15\u64CE", "LOCAL QWEN3-TTS", "local", [
    /* @__PURE__ */ import_react4.default.createElement("div", { key: "st", className: "ctrl-row" }, /* @__PURE__ */ import_react4.default.createElement("div", { className: "cl" }, /* @__PURE__ */ import_react4.default.createElement("b", null, "\u672C\u5730\u5F15\u64CE"), /* @__PURE__ */ import_react4.default.createElement("i", null, "ENABLED")), /* @__PURE__ */ import_react4.default.createElement("span", { className: "tag" }, localTag)),
    /* @__PURE__ */ import_react4.default.createElement(Field, { key: "py", label: "Python", sub: "VENV" }, input("upstream.local.pythonPath", { spellCheck: false })),
    /* @__PURE__ */ import_react4.default.createElement(Field, { key: "sc", label: "Sidecar \u811A\u672C", sub: "SERVER" }, input("upstream.local.serverScript", { spellCheck: false })),
    /* @__PURE__ */ import_react4.default.createElement(Field, { key: "md", label: "\u6A21\u578B\u76EE\u5F55", sub: "MLX MODEL" }, input("upstream.local.modelPath", { spellCheck: false })),
    twoCol(
      /* @__PURE__ */ import_react4.default.createElement(Field, { key: "lp", label: "\u7AEF\u53E3", sub: "PORT", style: { padding: 0 } }, input("upstream.local.port", { type: "number" })),
      /* @__PURE__ */ import_react4.default.createElement(Field, { key: "lt", label: "\u542F\u52A8\u8D85\u65F6", sub: "MS", style: { padding: 0 } }, input("upstream.local.startupTimeoutMs", { type: "number" }))
    ),
    /* @__PURE__ */ import_react4.default.createElement("div", { key: "idle", className: "knob-row" }, knob("upstream.local.idleUnloadSeconds", "\u7A7A\u95F2\u5378\u8F7D", 0, 3600, 30, "s", "\u7A7A\u95F2\u5378\u8F7D\uFF08\u79D2\uFF0C0=\u5E38\u9A7B\uFF09"), /* @__PURE__ */ import_react4.default.createElement(Field, { label: "\u8BF7\u6C42\u8D85\u65F6", sub: "MS", style: { flex: "1", padding: 0 } }, input("upstream.local.requestTimeoutMs", { type: "number" }))),
    twoCol(
      /* @__PURE__ */ import_react4.default.createElement(Field, { key: "nw", label: "\u65C1\u767D\u53C2\u8003\u97F3", sub: "WAV", style: { padding: 0 } }, input("upstream.local.refs.narrator.wav", { spellCheck: false })),
      /* @__PURE__ */ import_react4.default.createElement(Field, { key: "dw", label: "\u5BF9\u8BDD\u53C2\u8003\u97F3", sub: "WAV", style: { padding: 0 } }, input("upstream.local.refs.dialogue.wav", { spellCheck: false }))
    ),
    twoCol(
      /* @__PURE__ */ import_react4.default.createElement(Field, { key: "nt", label: "\u65C1\u767D\u53C2\u8003\u6587\u672C", sub: "REF TEXT", style: { padding: 0 } }, input("upstream.local.refs.narrator.text")),
      /* @__PURE__ */ import_react4.default.createElement(Field, { key: "dt", label: "\u5BF9\u8BDD\u53C2\u8003\u6587\u672C", sub: "REF TEXT", style: { padding: 0 } }, input("upstream.local.refs.dialogue.text"))
    )
  ]), moduleShell("mod-openai", "03", "OpenAI \u517C\u5BB9", "OPENAI / KOKORO / EDGE-TTS", "openai", [
    /* @__PURE__ */ import_react4.default.createElement(Field, { key: "oab", label: "\u63A5\u53E3\u5730\u5740", sub: "BASE URL" }, input("upstream.openai.baseUrl", { spellCheck: false, placeholder: "http://127.0.0.1:8880/v1" })),
    /* @__PURE__ */ import_react4.default.createElement(Field, { key: "oak", label: "API Key", sub: "\u53EF\u9009 \xB7 \u5DF2\u63A9\u7801" }, input("upstream.openai.apiKey", { spellCheck: false, placeholder: "\u672C\u5730 Kokoro/Edge-TTS \u53EF\u7559\u7A7A" })),
    twoCol(
      /* @__PURE__ */ import_react4.default.createElement(Field, { key: "oam", label: "\u6A21\u578B", sub: "MODEL", style: { padding: 0 } }, input("upstream.openai.model", { spellCheck: false, placeholder: "tts-1 / kokoro" })),
      /* @__PURE__ */ import_react4.default.createElement(Field, { key: "oas", label: "\u8BED\u901F", sub: "0.25\u20134.0", style: { padding: 0 } }, input("upstream.openai.speed", { type: "number", step: "0.05" }))
    ),
    twoCol(
      /* @__PURE__ */ import_react4.default.createElement(Field, { key: "oan", label: "\u65C1\u767D\u97F3\u8272", sub: "NARRATOR", style: { padding: 0 } }, input("upstream.openai.narratorVoice", { spellCheck: false })),
      /* @__PURE__ */ import_react4.default.createElement(Field, { key: "oad", label: "\u5BF9\u8BDD\u97F3\u8272", sub: "DIALOGUE", style: { padding: 0 } }, input("upstream.openai.dialogueVoice", { spellCheck: false }))
    ),
    /* @__PURE__ */ import_react4.default.createElement("div", { key: "oaf", className: "ctrl-row" }, /* @__PURE__ */ import_react4.default.createElement("div", { className: "cl" }, /* @__PURE__ */ import_react4.default.createElement("b", null, "\u8FD4\u56DE\u683C\u5F0F"), /* @__PURE__ */ import_react4.default.createElement("i", null, "FORMAT")), /* @__PURE__ */ import_react4.default.createElement(
      Seg,
      {
        options: [
          { value: "wav", label: "WAV" },
          { value: "pcm", label: "PCM (24k)" }
        ],
        value: d["upstream.openai.responseFormat"],
        ariaLabel: "OpenAI \u54CD\u5E94\u683C\u5F0F",
        onChange: (v) => onSet("upstream.openai.responseFormat", v)
      }
    )),
    /* @__PURE__ */ import_react4.default.createElement(Field, { key: "oai", label: "\u98CE\u683C\u6307\u4EE4", sub: "INSTRUCTIONS \xB7 \u53EF\u9009" }, input("upstream.openai.instructions", { placeholder: "\u5982\uFF1A\u6C89\u7A33\u6E29\u67D4\u5730\u6717\u8BFB\u5C0F\u8BF4" }))
  ]), moduleShell("mod-voice", "04", "\u97F3\u8272", "VOICE PRESET", "voice", [
    /* @__PURE__ */ import_react4.default.createElement("div", { key: "nv", className: "field" }, /* @__PURE__ */ import_react4.default.createElement("span", { className: "fl" }, "\u65C1\u767D ", /* @__PURE__ */ import_react4.default.createElement("i", null, "NARRATOR \xB7 \u6A21\u5F0F preset")), /* @__PURE__ */ import_react4.default.createElement(Chips, { options: presetVoices, value: d["voices.narrator.voice"], ariaLabel: "\u65C1\u767D\u97F3\u8272", onChange: (v) => onSet("voices.narrator.voice", v) })),
    /* @__PURE__ */ import_react4.default.createElement(Field, { key: "ns", label: "\u65C1\u767D\u98CE\u683C", sub: "STYLE" }, input("voices.narrator.style")),
    /* @__PURE__ */ import_react4.default.createElement("div", { key: "dv", className: "field" }, /* @__PURE__ */ import_react4.default.createElement("span", { className: "fl" }, "\u5BF9\u8BDD ", /* @__PURE__ */ import_react4.default.createElement("i", null, "DIALOGUE \xB7 \u6A21\u5F0F preset")), /* @__PURE__ */ import_react4.default.createElement(Chips, { options: presetVoices, value: d["voices.dialogue.voice"], ariaLabel: "\u5BF9\u8BDD\u97F3\u8272", onChange: (v) => onSet("voices.dialogue.voice", v) })),
    /* @__PURE__ */ import_react4.default.createElement(Field, { key: "ds", label: "\u5BF9\u8BDD\u98CE\u683C", sub: "STYLE" }, input("voices.dialogue.style")),
    /* @__PURE__ */ import_react4.default.createElement("div", { key: "pv", style: { display: "flex", gap: 6, marginTop: 6 } }, /* @__PURE__ */ import_react4.default.createElement("button", { className: "btn btn--sm btn--tape", type: "button", disabled: Boolean(previewBusy), onClick: () => onPreview("narrator") }, previewBusy === "narrator" ? "\u5408\u6210\u4E2D\u2026" : "\u8BD5\u542C\u65C1\u767D"), /* @__PURE__ */ import_react4.default.createElement("button", { className: "btn btn--sm", type: "button", disabled: Boolean(previewBusy), onClick: () => onPreview("dialogue") }, previewBusy === "dialogue" ? "\u5408\u6210\u4E2D\u2026" : "\u8BD5\u542C\u5BF9\u8BDD")),
    /* @__PURE__ */ import_react4.default.createElement("p", { key: "vh", className: "hint" }, "\u6DF7\u5408\u542F\u52A8\u7684\u4E91\u7AEF\u9636\u6BB5\u4F7F\u7528\u53C2\u8003\u97F3\u514B\u9686\uFF1B\u8FD9\u91CC\u7684 MiMo \u9884\u7F6E\u97F3\u8272\u53EA\u5728\u7EAF\u4E91\u7AEF\u6A21\u5F0F\u751F\u6548\u3002")
  ]), moduleShell("mod-synth", "05", "\u5408\u6210\u4E0E\u7F13\u5B58", "SYNTH \xB7 CACHE", "synth", [
    /* @__PURE__ */ import_react4.default.createElement("div", { key: "k1", className: "knob-row" }, knob("synth.concurrency", "\u5E76\u53D1", 1, 8, 1, "\u8DEF", "\u5408\u6210\u5E76\u53D1\uFF08\u8DEF\uFF09"), knob("synth.maxSegmentChars", "\u6BCF\u6BB5\u5B57\u6570", 10, 300, 10, "\u5B57", "\u6BCF\u6BB5\u6700\u5927\u5B57\u6570"), knob("limits.rpm", "\u9650\u901F", 10, 300, 10, "/min", "\u6BCF\u5206\u949F\u8BF7\u6C42\u4E0A\u9650")),
    /* @__PURE__ */ import_react4.default.createElement("div", { key: "st", className: "ctrl-row" }, /* @__PURE__ */ import_react4.default.createElement("div", { className: "cl" }, /* @__PURE__ */ import_react4.default.createElement("b", null, "\u6D41\u5F0F\u8FD4\u56DE"), /* @__PURE__ */ import_react4.default.createElement("i", null, "STREAM")), toggle("synth.stream", "\u6D41\u5F0F\u8FD4\u56DE")),
    /* @__PURE__ */ import_react4.default.createElement("div", { key: "ce", className: "ctrl-row" }, /* @__PURE__ */ import_react4.default.createElement("div", { className: "cl" }, /* @__PURE__ */ import_react4.default.createElement("b", null, "\u7F13\u5B58"), /* @__PURE__ */ import_react4.default.createElement("i", null, "CACHE")), toggle("cache.enabled", "\u542F\u7528\u7F13\u5B58")),
    /* @__PURE__ */ import_react4.default.createElement("div", { key: "k2", className: "knob-row" }, knob("cache.maxEntries", "\u7F13\u5B58\u6761\u76EE", 50, 5e3, 50, "\u6761", "\u7F13\u5B58\u6761\u76EE\u4E0A\u9650"), knob("cache.ttlSeconds", "\u7F13\u5B58 TTL", 600, 86400, 600, "s", "\u7F13\u5B58 TTL\uFF08\u79D2\uFF09"), knob("synth.maxTextChars", "\u6700\u957F\u6587\u672C", 1e3, 2e4, 1e3, "\u5B57", "\u5355\u6B21\u6700\u957F\u6587\u672C")),
    /* @__PURE__ */ import_react4.default.createElement("div", { key: "cb", className: "rowx", style: { marginTop: 4 } }, /* @__PURE__ */ import_react4.default.createElement("span", null, "\u7F13\u5B58\u4E0A\u9650"), /* @__PURE__ */ import_react4.default.createElement("b", null, fmtBytes(live?.cache?.maxBytes || 0)))
  ]), moduleShell("mod-transport", "06", "\u4F20\u8F93", "TRANSPORT", "transport", [
    twoCol(
      /* @__PURE__ */ import_react4.default.createElement(Field, { key: "sh", label: "\u76D1\u542C\u5730\u5740", sub: "HOST", style: { padding: 0 } }, input("server.host", { spellCheck: false })),
      /* @__PURE__ */ import_react4.default.createElement(Field, { key: "sp", label: "\u7AEF\u53E3", sub: "PORT", style: { padding: 0 } }, input("server.port", { type: "number" }))
    ),
    /* @__PURE__ */ import_react4.default.createElement(Field, { key: "pu", label: "\u5BF9\u5916\u5730\u5740", sub: "PUBLIC URL \xB7 \u96A7\u9053/\u53CD\u4EE3\u65F6\u586B" }, input("server.publicUrl", { spellCheck: false, placeholder: "https://tts.example.com" })),
    /* @__PURE__ */ import_react4.default.createElement(Field, { key: "ub", label: "MiMo \u5730\u5740", sub: "BASE URL" }, input("upstream.baseUrl", { spellCheck: false })),
    /* @__PURE__ */ import_react4.default.createElement(Field, { key: "uk", label: "MiMo API Key", sub: "\u6BCF\u884C\u4E00\u4E2A \xB7 \u4FDD\u7559\u63A9\u7801\u884C\u53EF\u8FFD\u52A0\u65B0 Key" }, /* @__PURE__ */ import_react4.default.createElement(
      Textarea,
      {
        value: d["upstream.keys"],
        rows: 2,
        spellCheck: false,
        placeholder: "sk-\u2026\uFF08\u4FDD\u7559\u5DF2\u6709\u63A9\u7801\u884C\u5373\u53EF\u8FFD\u52A0\u65B0 Key\uFF09",
        onChange: set("upstream.keys")
      }
    )),
    twoCol(
      /* @__PURE__ */ import_react4.default.createElement(Field, { key: "ut", label: "\u8D85\u65F6", sub: "MS", style: { padding: 0 } }, input("upstream.timeoutMs", { type: "number" })),
      /* @__PURE__ */ import_react4.default.createElement(Field, { key: "ur", label: "\u91CD\u8BD5", sub: "MAX RETRY", style: { padding: 0 } }, input("upstream.maxRetry", { type: "number" }))
    ),
    /* @__PURE__ */ import_react4.default.createElement(Field, { key: "ln", label: "Legado \u5F15\u64CE\u540D", sub: "EXPORT NAME" }, input("legado.name", { spellCheck: false })),
    /* @__PURE__ */ import_react4.default.createElement(Field, { key: "lh", label: "\u9644\u52A0\u8BF7\u6C42\u5934", sub: "JSON \xB7 \u4F1A\u5199\u8FDB\u5BFC\u51FA\u7684\u6717\u8BFB\u5F15\u64CE" }, /* @__PURE__ */ import_react4.default.createElement(Textarea, { value: d["legado.extraHeaders"], rows: 2, spellCheck: false, onChange: set("legado.extraHeaders") }))
  ]), moduleShell("mod-auth", "07", "\u9274\u6743", "AUTH", "auth", [
    /* @__PURE__ */ import_react4.default.createElement("div", { key: "ae", className: "ctrl-row" }, /* @__PURE__ */ import_react4.default.createElement("div", { className: "cl" }, /* @__PURE__ */ import_react4.default.createElement("b", null, "Basic \u9274\u6743"), /* @__PURE__ */ import_react4.default.createElement("i", null, "ENABLED")), toggle("auth.enabled", "Basic \u9274\u6743")),
    /* @__PURE__ */ import_react4.default.createElement(Field, { key: "au", label: "\u7528\u6237\u540D", sub: "USER" }, input("auth.user", { placeholder: "", spellCheck: false })),
    /* @__PURE__ */ import_react4.default.createElement(Field, { key: "ap", label: "\u53E3\u4EE4", sub: "PASS \xB7 \u5DF2\u63A9\u7801" }, input("auth.pass")),
    /* @__PURE__ */ import_react4.default.createElement(Field, { key: "at", label: "URL \u4EE4\u724C", sub: "TOKEN \xB7 \u62FC\u8FDB\u5BFC\u5165\u5730\u5740" }, input("auth.token", { spellCheck: false })),
    /* @__PURE__ */ import_react4.default.createElement(Field, { key: "lr", label: "\u65E5\u5FD7\u73AF", sub: "RING" }, input("log.ring", { type: "number" })),
    /* @__PURE__ */ import_react4.default.createElement("p", { key: "ah", className: "hint" }, "\u4EE4\u724C\u540C\u65F6\u62FC\u8FDB /legado.json \u4E0E /listening \u7684 URL\uFF1B\u6539\u5B8C\u4FDD\u5B58\u540E\u8BF7\u91CD\u65B0\u590D\u5236\u5BFC\u5165\u5730\u5740\u3002")
  ])), /* @__PURE__ */ import_react4.default.createElement("aside", { className: "apply", "aria-label": "\u751F\u6548\u4E0E\u6539\u52A8" }, /* @__PURE__ */ import_react4.default.createElement("div", null, /* @__PURE__ */ import_react4.default.createElement("h2", null, "\u751F\u6548"), /* @__PURE__ */ import_react4.default.createElement("div", { className: "sub" }, "Apply \xB7 Draft")), /* @__PURE__ */ import_react4.default.createElement("div", { className: "apply-sum", id: "appliedSummary" }, /* @__PURE__ */ import_react4.default.createElement(Rowx, { k: "\u6E32\u67D3\u6765\u6E90", v: String(d["upstream.provider"] || "mimo") }), /* @__PURE__ */ import_react4.default.createElement(Rowx, { k: "\u76D1\u542C", v: `${d["server.host"] || "\u2014"}:${d["server.port"] || "\u2014"}` }), /* @__PURE__ */ import_react4.default.createElement(Rowx, { k: "\u4E91\u7AEF\u6A21\u578B", v: d["upstream.provider"] === "openai" ? String(d["upstream.openai.model"] || "\u2014") : String(d["upstream.model"] || "\u2014") }), /* @__PURE__ */ import_react4.default.createElement(Rowx, { k: "\u672C\u5730\u7AEF\u53E3", v: String(d["upstream.local.port"] || "\u2014") }), /* @__PURE__ */ import_react4.default.createElement(Rowx, { k: "\u6BCF\u6BB5 / \u5E76\u53D1", v: `${d["synth.maxSegmentChars"] || "\u2014"} \u5B57 / ${d["synth.concurrency"] || "\u2014"} \u8DEF` }), /* @__PURE__ */ import_react4.default.createElement(Rowx, { k: "\u9650\u901F", v: `${d["limits.rpm"] || "\u2014"} \u6B21/\u5206` }), /* @__PURE__ */ import_react4.default.createElement(Rowx, { k: "\u7F13\u5B58", v: `${d["cache.maxEntries"] || "\u2014"} \u6761 \xB7 TTL ${ttlText(d["cache.ttlSeconds"])}` }), /* @__PURE__ */ import_react4.default.createElement(Rowx, { k: "\u5BF9\u5916\u5730\u5740", v: d["server.publicUrl"] || "\u672A\u8BBE\u7F6E" })), /* @__PURE__ */ import_react4.default.createElement("div", { className: "rowx" }, /* @__PURE__ */ import_react4.default.createElement("span", null, "\u6700\u540E\u751F\u6548"), /* @__PURE__ */ import_react4.default.createElement("b", { id: "appliedAt" }, savedAt || "\u968F\u5FEB\u7167\u88C5\u8F7D")), /* @__PURE__ */ import_react4.default.createElement("div", { className: "dirty-wrap" }, /* @__PURE__ */ import_react4.default.createElement("div", { className: "ins-hd", style: { paddingTop: 4, marginBottom: 0 } }, /* @__PURE__ */ import_react4.default.createElement("span", { className: "silk" }, "UNSAVED ", /* @__PURE__ */ import_react4.default.createElement("b", null, "\u672A\u4FDD\u5B58\u6539\u52A8")), /* @__PURE__ */ import_react4.default.createElement("span", { className: "cn" }, `${changes.length} \u9879`)), changes.length === 0 ? /* @__PURE__ */ import_react4.default.createElement("div", { className: "dirty-empty" }, "\u65E0\u672A\u4FDD\u5B58\u6539\u52A8", /* @__PURE__ */ import_react4.default.createElement("br", null), "\u8349\u7A3F\u4E0E\u8FD0\u884C\u914D\u7F6E\u4E00\u81F4") : /* @__PURE__ */ import_react4.default.createElement("ul", { className: "dirty-list" }, changes.map((c) => /* @__PURE__ */ import_react4.default.createElement("li", { key: c.path }, /* @__PURE__ */ import_react4.default.createElement("b", null, c.label), "\uFF1A", fmtDirtyVal(c.from), " \u2192 ", fmtDirtyVal(c.to))))), /* @__PURE__ */ import_react4.default.createElement("p", { className: "hint" }, "\u4FDD\u5B58\u540E\u5199\u5165 PUT /api/config\uFF0C\u810F\u6807 \u2192 \u4FDD\u5B58\u4E2D \u2192 \u5DF2\u751F\u6548\u65F6\u95F4\u6233\u3002"))), /* @__PURE__ */ import_react4.default.createElement("div", { className: `savebar${changes.length ? " is-dirty" : ""}${saving ? " is-saving" : ""}`, id: "savebar" }, /* @__PURE__ */ import_react4.default.createElement("div", { className: "sb-msg" }, /* @__PURE__ */ import_react4.default.createElement("span", { className: "dot" }), /* @__PURE__ */ import_react4.default.createElement("span", null, saving ? "\u4FDD\u5B58\u4E2D\u2026" : changes.length ? `\u6709 ${changes.length} \u9879\u672A\u4FDD\u5B58\u7684\u4FEE\u6539` : savedAt ? `\u5DF2\u751F\u6548 \xB7 ${savedAt}` : "\u65E0\u672A\u4FDD\u5B58\u6539\u52A8")), /* @__PURE__ */ import_react4.default.createElement("span", { className: "sb-hint" }, changes.length ? "Ctrl/\u2318+S \u4FDD\u5B58\u5E76\u751F\u6548\uFF1B\u8FD8\u539F\u4E22\u5F03\u8349\u7A3F" : "\u6539\u52A8\u5148\u843D\u5728\u8349\u7A3F\uFF1B\u4FDD\u5B58\u540E\u5199\u56DE\u8FD0\u884C\u914D\u7F6E\u5E76\u5237\u65B0\u8BFB\u6570"), /* @__PURE__ */ import_react4.default.createElement("span", { className: "sb-spacer" }), /* @__PURE__ */ import_react4.default.createElement("button", { className: "btn", type: "button", "data-action": "export-config", onClick: onExportConfig }, "\u5BFC\u51FA\u914D\u7F6E"), /* @__PURE__ */ import_react4.default.createElement("button", { className: "btn", type: "button", "data-action": "revert", id: "btnRevert", disabled: saving || changes.length === 0, onClick: onRevert }, "\u8FD8\u539F"), /* @__PURE__ */ import_react4.default.createElement("button", { className: "btn btn--tape", type: "button", "data-action": "save-config", id: "btnSave", disabled: saving || changes.length === 0, onClick: onSave }, saving ? "\u4FDD\u5B58\u4E2D\u2026" : "\u4FDD\u5B58\u5E76\u751F\u6548")));
}

// client/components/StatusBar.jsx
var import_react5 = __toESM(require("react"), 1);
function StatusBar({ running, paused, error, lastSync, pausedAt, version, port, provider, hint }) {
  const dotCls = error ? "dot warn" : !running ? "dot off" : paused ? "dot warn" : "dot";
  const liveText = error ? "ERROR \xB7 \u8BFB\u4E0D\u5230\u5BBF\u4E3B\u63A5\u53E3" : !running ? "STOPPED \xB7 \u65E0\u5B9E\u65F6\u6570\u636E" : paused ? `PAUSED \xB7 \u6570\u636E\u51BB\u7ED3 ${clock(pausedAt || lastSync)}` : "LIVE \xB7 /api/state";
  return /* @__PURE__ */ import_react5.default.createElement("footer", { className: "statusbar", "aria-label": "\u8D70\u5E26\u72B6\u6001" }, /* @__PURE__ */ import_react5.default.createElement("span", { className: "sb-l" }, /* @__PURE__ */ import_react5.default.createElement("span", { className: dotCls }), /* @__PURE__ */ import_react5.default.createElement("span", null, liveText)), /* @__PURE__ */ import_react5.default.createElement("span", { className: "sb-hint", title: error || hint }, error ? `\u8BFB\u4E0D\u5230\u5BBF\u4E3B\u63A5\u53E3\uFF1A${error}` : hint), /* @__PURE__ */ import_react5.default.createElement("span", { className: "sb-r" }, /* @__PURE__ */ import_react5.default.createElement("span", null, `\u5FEB\u7167 ${lastSync ? clock(lastSync) : "\u2014"}`), /* @__PURE__ */ import_react5.default.createElement("span", { className: "sep" }, "|"), /* @__PURE__ */ import_react5.default.createElement("span", null, `v${version || "0.3.0"}`), /* @__PURE__ */ import_react5.default.createElement("span", { className: "sep" }, "|"), /* @__PURE__ */ import_react5.default.createElement("span", null, `M-${port || "\u2014"}`), /* @__PURE__ */ import_react5.default.createElement("span", { className: "sep" }, "|"), /* @__PURE__ */ import_react5.default.createElement("span", { className: "opt" }, `${PROVIDER_CN[provider] || provider || "\u2014"} \xB7 \u540C\u6E90\u8F6E\u8BE2 4s`)));
}

// client/components/TimelineView.jsx
var import_react6 = __toESM(require("react"), 1);
function clipLabel(item) {
  const src = item.sourceLabel === "\u2014" ? "\u6765\u6E90\u672A\u77E5" : item.sourceLabel;
  return [
    `\u7B2C ${item.index + 1} \u6BB5`,
    ROLE_CN[item.role] || item.role,
    src,
    item.error ? "\u6E32\u67D3\u5931\u8D25" : item.cacheHit ? "\u7F13\u5B58\u547D\u4E2D" : "\u672A\u547D\u4E2D",
    `\u5EF6\u8FDF ${latSec(item.latencyMs)}`,
    `${item.chars} \u5B57`,
    item.audioSeconds > 0 ? `\u97F3\u9891 ${item.audioSeconds.toFixed(1)}s` : "\u97F3\u9891 \u2014",
    clock(item.at),
    hashOf(item.client) ? `\u8BBE\u5907 ${hashOf(item.client)}` : ""
  ].filter(Boolean).join(" \xB7 ");
}
function TrackHeads({
  running,
  live,
  service,
  localInfo,
  items,
  totalAudio,
  totalChars,
  cacheHits,
  avgLatency,
  maxLatency,
  selectedItem,
  compact
}) {
  const today = live?.today || {};
  const lat = live?.latency || {};
  const hybrid = service?.hybrid || {};
  const openai = service?.openai || {};
  const active = Array.isArray(live?.active) ? live.active : [];
  const provider = service?.provider || "mimo";
  const localWarm = Boolean(localInfo?.warm) || localInfo?.state === "ready";
  let mainRows;
  let latRows;
  if (!running) {
    mainRows = [
      /* @__PURE__ */ import_react6.default.createElement(HeadRow, { key: "w", k: "\u672C\u7A97", v: /* @__PURE__ */ import_react6.default.createElement("b", null, "\u2014") }),
      /* @__PURE__ */ import_react6.default.createElement(HeadRow, { key: "a", k: "\u97F3\u9891\u603B\u957F", v: /* @__PURE__ */ import_react6.default.createElement("b", null, "\u2014") }),
      /* @__PURE__ */ import_react6.default.createElement(HeadRow, { key: "t", k: "\u4ECA\u65E5", v: /* @__PURE__ */ import_react6.default.createElement("b", null, "\u2014") }),
      /* @__PURE__ */ import_react6.default.createElement(HeadRow, { key: "c", k: "\u7F13\u5B58", v: /* @__PURE__ */ import_react6.default.createElement("b", null, "\u2014") })
    ];
    latRows = [
      /* @__PURE__ */ import_react6.default.createElement(HeadRow, { key: "avg", k: "\u5747\u503C", v: /* @__PURE__ */ import_react6.default.createElement("b", null, "\u2014") }),
      /* @__PURE__ */ import_react6.default.createElement(HeadRow, { key: "p95", k: "p95", v: /* @__PURE__ */ import_react6.default.createElement("b", null, "\u2014") }),
      /* @__PURE__ */ import_react6.default.createElement(HeadRow, { key: "max", k: "\u6700\u6162", v: /* @__PURE__ */ import_react6.default.createElement("b", null, "\u2014") })
    ];
  } else {
    mainRows = compact ? [
      /* @__PURE__ */ import_react6.default.createElement(HeadRow, { key: "sc", k: "\u6BB5/\u5B57", v: /* @__PURE__ */ import_react6.default.createElement("b", null, `${items.length} / ${fmtInt(totalChars)}`) }),
      /* @__PURE__ */ import_react6.default.createElement(HeadRow, { key: "au", k: "\u97F3\u9891", v: /* @__PURE__ */ import_react6.default.createElement("b", null, mmssPad(totalAudio)) })
    ] : [
      /* @__PURE__ */ import_react6.default.createElement(HeadRow, { key: "sc", k: "\u672C\u7A97 \u6BB5 / \u5B57", v: /* @__PURE__ */ import_react6.default.createElement("b", null, `${items.length} / ${fmtInt(totalChars)}`) }),
      /* @__PURE__ */ import_react6.default.createElement(HeadRow, { key: "au", k: "\u97F3\u9891\u603B\u957F", v: /* @__PURE__ */ import_react6.default.createElement("b", null, mmssPad(totalAudio)) }),
      /* @__PURE__ */ import_react6.default.createElement(HeadRow, { key: "td", k: "\u4ECA\u65E5", v: /* @__PURE__ */ import_react6.default.createElement("b", null, `${fmtInt(today.segments)} \u6BB5 \xB7 ${hm(today.seconds)}`) }),
      /* @__PURE__ */ import_react6.default.createElement(HeadRow, { key: "ch", k: "\u7F13\u5B58\u547D\u4E2D", v: /* @__PURE__ */ import_react6.default.createElement("b", null, `${cacheHits} / ${items.length}`) })
    ];
    latRows = compact ? [
      /* @__PURE__ */ import_react6.default.createElement(HeadRow, { key: "avg", k: "\u5747\u503C", v: /* @__PURE__ */ import_react6.default.createElement("b", null, latSec(avgLatency)) }),
      /* @__PURE__ */ import_react6.default.createElement(HeadRow, { key: "p95", k: "p95", v: /* @__PURE__ */ import_react6.default.createElement("b", null, latSec(lat.p95)) })
    ] : [
      /* @__PURE__ */ import_react6.default.createElement(HeadRow, { key: "avg", k: "\u5747\u503C", v: /* @__PURE__ */ import_react6.default.createElement("b", null, latSec(avgLatency)) }),
      /* @__PURE__ */ import_react6.default.createElement(HeadRow, { key: "p95", k: "p95", v: /* @__PURE__ */ import_react6.default.createElement("b", null, latSec(lat.p95)) }),
      /* @__PURE__ */ import_react6.default.createElement(HeadRow, { key: "max", k: "\u6700\u6162", v: /* @__PURE__ */ import_react6.default.createElement("b", null, latSec(maxLatency)) })
    ];
  }
  let windowRows;
  if (!running || !items.length) {
    windowRows = [
      /* @__PURE__ */ import_react6.default.createElement("div", { key: "hd", className: "silk", style: { display: "block", marginBottom: 2 } }, "WINDOW ", /* @__PURE__ */ import_react6.default.createElement("b", null, "\u672C\u7A97")),
      /* @__PURE__ */ import_react6.default.createElement(HeadRow, { key: "s", k: "\u8D77", v: /* @__PURE__ */ import_react6.default.createElement("b", null, "\u2014") }),
      /* @__PURE__ */ import_react6.default.createElement(HeadRow, { key: "e", k: "\u6B62", v: /* @__PURE__ */ import_react6.default.createElement("b", null, "\u2014") }),
      /* @__PURE__ */ import_react6.default.createElement(HeadRow, { key: "d", k: "\u8DE8\u5EA6", v: /* @__PURE__ */ import_react6.default.createElement("b", null, "\u2014") })
    ];
  } else {
    const first = items[0];
    const last = items[items.length - 1];
    windowRows = [
      /* @__PURE__ */ import_react6.default.createElement("div", { key: "hd", className: "silk", style: { display: "block", marginBottom: 2 } }, "WINDOW ", /* @__PURE__ */ import_react6.default.createElement("b", null, "\u672C\u7A97")),
      /* @__PURE__ */ import_react6.default.createElement(HeadRow, { key: "s", k: "\u8D77", v: /* @__PURE__ */ import_react6.default.createElement("b", null, clock(first.at)) }),
      /* @__PURE__ */ import_react6.default.createElement(HeadRow, { key: "e", k: "\u6B62", v: /* @__PURE__ */ import_react6.default.createElement("b", null, clock(last.at)) }),
      /* @__PURE__ */ import_react6.default.createElement(HeadRow, { key: "d", k: "\u8DE8\u5EA6", v: /* @__PURE__ */ import_react6.default.createElement("b", null, `${Math.round((last.at - first.at) / 1e3)} \u79D2${compact ? "" : ` \xB7 \u672B ${items.length} \u6BB5`}`) }),
      compact ? null : /* @__PURE__ */ import_react6.default.createElement(HeadRow, { key: "c", k: "CUE \u9009\u4E2D", v: /* @__PURE__ */ import_react6.default.createElement("b", null, selectedItem ? mmssTenth(selectedItem.startSec) : "\u2014") })
    ].filter(Boolean);
  }
  let note;
  if (!running) note = "\u8D70\u5E26\u505C\u6B62 \xB7 \u65E0\u4FE1\u53F7";
  else if (hybrid.enabled) {
    const reason = hybrid.lastSwitchReason || (localWarm ? "\u672C\u5730\u5DF2\u5C31\u7EEA\uFF0C\u4E91\u7AEF\u9876\u73ED\u7ED3\u675F" : "\u79BB\u7EBF\uFF0C\u672C\u5730\u5C1A\u672A\u5C31\u7EEA");
    note = `\u6DF7\u5408\u9876\u73ED ${num(hybrid.bootstrapCount)}/${num(hybrid.maxCloudBootstrap)} \xB7 ${reason}`;
  } else if (provider === "local") note = "\u7EAF\u672C\u5730\u6E32\u67D3 \xB7 \u4E91\u7AEF\u5F85\u547D";
  else if (provider === "openai") note = `OpenAI \u517C\u5BB9 \xB7 ${openai.model || "tts-1"}`;
  else note = "\u7EAF\u4E91\u7AEF\u6E32\u67D3 \xB7 \u672C\u5730\u672A\u53C2\u4E0E";
  let readerNodes;
  if (!running) {
    readerNodes = /* @__PURE__ */ import_react6.default.createElement("div", { className: "reader off" }, /* @__PURE__ */ import_react6.default.createElement("span", { className: "ld" }), /* @__PURE__ */ import_react6.default.createElement("b", null, "\u65E0\u8BBE\u5907"), /* @__PURE__ */ import_react6.default.createElement("span", { className: "idle" }, "\u2014"), /* @__PURE__ */ import_react6.default.createElement("small", null, "\u670D\u52A1\u672A\u8FD0\u884C"));
  } else if (!active.length) {
    readerNodes = /* @__PURE__ */ import_react6.default.createElement("div", { className: "reader off" }, /* @__PURE__ */ import_react6.default.createElement("span", { className: "ld" }), /* @__PURE__ */ import_react6.default.createElement("b", null, "\u65E0\u8BBE\u5907"), /* @__PURE__ */ import_react6.default.createElement("span", { className: "idle" }, "\u2014"), /* @__PURE__ */ import_react6.default.createElement("small", null, "\u8FD8\u6CA1\u6709\u6D3B\u8DC3\u8BFB\u8005"));
  } else {
    readerNodes = active.slice(0, 3).map((r, i) => {
      const idle = num(r.idleMs) > 12e4;
      return /* @__PURE__ */ import_react6.default.createElement("div", { key: `${r.client || i}-${i}`, className: i === 0 ? "reader" : "reader off" }, /* @__PURE__ */ import_react6.default.createElement("span", { className: "ld" }), /* @__PURE__ */ import_react6.default.createElement("b", null, ipOf(r.client)), /* @__PURE__ */ import_react6.default.createElement("span", { className: "idle" }, ago(r.at)), /* @__PURE__ */ import_react6.default.createElement("small", null, `${hashOf(r.client) || "\u8BBE\u5907"} \xB7 ${idle ? `\u6700\u540E\u6D3B\u52A8 ${clock(r.at)}` : "\u6D3B\u8DC3"}`));
    });
  }
  const maxBootstrap = num(hybrid.maxCloudBootstrap);
  const bootstrap = num(hybrid.bootstrapCount);
  const cellBoxes = maxBootstrap > 0 && maxBootstrap <= 8 ? Array.from({ length: maxBootstrap }, (_, i) => /* @__PURE__ */ import_react6.default.createElement("i", { key: i, className: i < bootstrap ? "on" : void 0 })) : [];
  const cloudHeadTitle = provider === "openai" ? "OPENAI" : "CLOUD";
  const cloudHeadState = !running ? "\u5DF2\u505C\u6B62" : provider === "openai" ? openai.ready ? `${openai.model || "tts-1"} \xB7 \u5C31\u7EEA` : "OpenAI \xB7 \u672A\u914D\u7F6E" : hybrid.cloudReady ? "\u4E91\u7AEF \xB7 \u5907\u7528" : "\u4E91\u7AEF \xB7 \u4E0D\u53EF\u7528";
  return /* @__PURE__ */ import_react6.default.createElement("div", { className: "heads", "aria-label": "\u8F68\u9053\u5934" }, /* @__PURE__ */ import_react6.default.createElement("div", { className: "heads-top" }, /* @__PURE__ */ import_react6.default.createElement("span", { className: "silk" }, "TRACKS ", /* @__PURE__ */ import_react6.default.createElement("b", null, "\u901A\u9053")), /* @__PURE__ */ import_react6.default.createElement("span", { className: "silk" }, running ? `${items.length} \u6BB5` : "\u505C\u673A")), /* @__PURE__ */ import_react6.default.createElement("div", { className: "heads-core" }, /* @__PURE__ */ import_react6.default.createElement("div", { className: "head head--take" }, /* @__PURE__ */ import_react6.default.createElement("div", null, /* @__PURE__ */ import_react6.default.createElement("span", { className: "counter" }, running ? mmssPad(totalAudio) : "--:--"), /* @__PURE__ */ import_react6.default.createElement("small", null, "TAPE"))), /* @__PURE__ */ import_react6.default.createElement("div", { className: "head head--main" }, /* @__PURE__ */ import_react6.default.createElement("div", { className: "h-title" }, /* @__PURE__ */ import_react6.default.createElement("span", { className: "idx" }, "01"), /* @__PURE__ */ import_react6.default.createElement("b", null, "PROGRAM"), /* @__PURE__ */ import_react6.default.createElement("small", null, "\u4E3B\u5E26")), /* @__PURE__ */ import_react6.default.createElement("div", { className: "head-rows" }, mainRows)), /* @__PURE__ */ import_react6.default.createElement("div", { className: "head head--lat" }, /* @__PURE__ */ import_react6.default.createElement("div", { className: "h-title" }, /* @__PURE__ */ import_react6.default.createElement("span", { className: "idx" }, "LAT"), /* @__PURE__ */ import_react6.default.createElement("b", null, "\u6E32\u67D3\u8017\u65F6")), /* @__PURE__ */ import_react6.default.createElement("div", { className: "head-rows" }, latRows)), /* @__PURE__ */ import_react6.default.createElement("div", { className: "head head--local" }, /* @__PURE__ */ import_react6.default.createElement("span", { className: "idx" }, "02"), /* @__PURE__ */ import_react6.default.createElement("b", null, "LOCAL"), /* @__PURE__ */ import_react6.default.createElement("span", { className: "st" }, running ? localStateText(localInfo) : "\u5DF2\u505C\u6B62")), /* @__PURE__ */ import_react6.default.createElement("div", { className: "head head--cloud" }, /* @__PURE__ */ import_react6.default.createElement("span", { className: "idx" }, "03"), /* @__PURE__ */ import_react6.default.createElement("b", null, cloudHeadTitle), /* @__PURE__ */ import_react6.default.createElement("span", { className: "st" }, cloudHeadState))), /* @__PURE__ */ import_react6.default.createElement("div", { className: "heads-gap", "aria-hidden": "true" }), /* @__PURE__ */ import_react6.default.createElement("div", { className: "head head--readers" }, /* @__PURE__ */ import_react6.default.createElement("div", { className: "silk", style: { marginBottom: 1 } }, "READERS ", /* @__PURE__ */ import_react6.default.createElement("b", null, "\u8BFB\u8005")), /* @__PURE__ */ import_react6.default.createElement("div", { className: "readers" }, readerNodes), /* @__PURE__ */ import_react6.default.createElement("div", { className: "hybrid-cells", "aria-label": "\u6DF7\u5408\u9876\u73ED\u914D\u989D" }, cellBoxes, /* @__PURE__ */ import_react6.default.createElement("span", null, `\u9876\u73ED ${bootstrap}/${maxBootstrap}`)), /* @__PURE__ */ import_react6.default.createElement("div", { className: "head-window" }, windowRows), /* @__PURE__ */ import_react6.default.createElement("div", { className: "heads-note" }, note)));
}
function TapeArea({
  running,
  paused,
  items,
  totalAudio,
  totalChars,
  cacheHits,
  avgLatency,
  live,
  service,
  selectedIndex,
  selItem,
  onSelect,
  onHover,
  hoverAt,
  onAct,
  latScale = 1e3
}) {
  const lat = live?.latency || {};
  const hybrid = service?.hybrid || {};
  const ticks = (0, import_react6.useMemo)(() => rulerTicks(totalAudio), [totalAudio]);
  const p95 = num(lat.p95);
  const p95Pct = p95 > 0 ? clamp(p95 / latScale * 100, 0, 100) : 0;
  const cloudCount = items.filter((x) => x.source === "cloud").length;
  const empty = !running || items.length === 0;
  const first = items[0];
  const last = items[items.length - 1];
  const meta = running && items.length ? `${clock(first.at)} \u2192 ${clock(last.at)} \xB7 ${fmtInt(totalChars)} \u5B57 \xB7 \u6E32\u67D3 ${(avgLatency * items.length / 1e3).toFixed(1)}s \xB7 \u547D\u4E2D ${cacheHits}/${items.length}` : "\u2014";
  const recTagCls = paused ? "rec-tag paused" : "rec-tag";
  const recTagText = !running ? "STOP" : paused ? "PAUSED" : `REC ${mmssPad(totalAudio)}`;
  return /* @__PURE__ */ import_react6.default.createElement("div", { className: "timeline" }, /* @__PURE__ */ import_react6.default.createElement("div", { className: "tl-top" }, /* @__PURE__ */ import_react6.default.createElement("div", { className: "tl-title" }, /* @__PURE__ */ import_react6.default.createElement("span", { className: "eyebrow" }, "TIMELINE"), /* @__PURE__ */ import_react6.default.createElement("b", null, `\u672C\u7A97 \xB7 \u672B ${items.length} \u6BB5`), /* @__PURE__ */ import_react6.default.createElement("span", { className: recTagCls }, /* @__PURE__ */ import_react6.default.createElement("i", null), recTagText)), /* @__PURE__ */ import_react6.default.createElement("div", { className: "tl-meta" }, meta)), /* @__PURE__ */ import_react6.default.createElement("div", { className: "tl-core" }, /* @__PURE__ */ import_react6.default.createElement("div", { className: "ruler", "aria-hidden": "true" }, ticks.ticks.map((t, i) => /* @__PURE__ */ import_react6.default.createElement(
    "span",
    {
      key: `tk${i}`,
      className: `tick ${t.major ? "major" : "minor"}`,
      style: { left: `${t.pct.toFixed(3)}%` }
    }
  )), ticks.ticks.filter((t) => t.major && t.t < totalAudio - 1).map((t, i) => /* @__PURE__ */ import_react6.default.createElement(
    "span",
    {
      key: `tl${i}`,
      className: `tlabel${t.t === 0 ? " edge-l" : ""}`,
      style: { left: `${t.pct.toFixed(3)}%` }
    },
    mmss(t.t)
  )), selItem ? /* @__PURE__ */ import_react6.default.createElement("span", { className: "cue", style: { left: `${clamp(selItem.startPct, 0, 100).toFixed(3)}%` } }) : null), /* @__PURE__ */ import_react6.default.createElement("div", { className: "tape", "aria-label": "\u8282\u76EE\u5E26\uFF08\u6309\u97F3\u9891\u65F6\u957F\u526A\u63A5\u7684\u5408\u6210\u7247\u6BB5\uFF09" }, items.map((item) => {
    const slow = !item.error && p95 > 0 && item.latencyMs > p95;
    const cls = ["clip", item.cacheHit ? "hit" : "miss"];
    if (slow) cls.push("slow");
    if (hoverAt != null && hoverAt === item.at) cls.push("is-hover");
    if (item.error) cls.push("error");
    const label = clipLabel(item);
    return /* @__PURE__ */ import_react6.default.createElement(
      "button",
      {
        key: `${item.at}-${item.index}`,
        className: cls.join(" "),
        type: "button",
        role: "listitem",
        "aria-selected": String(item.index === selectedIndex),
        "aria-label": label,
        title: label,
        "data-clip": item.index,
        style: { flexBasis: `${item.wPct.toFixed(3)}%` },
        onClick: () => onSelect(item),
        onMouseEnter: () => onHover(item),
        onMouseLeave: () => onHover(null),
        onFocus: () => onHover(item),
        onBlur: () => onHover(null)
      },
      /* @__PURE__ */ import_react6.default.createElement("span", { className: "role" }, ROLE_GLYPH[item.role] || "\u65C1"),
      /* @__PURE__ */ import_react6.default.createElement("span", { className: "wbar", "aria-hidden": "true" }, /* @__PURE__ */ import_react6.default.createElement("i", { style: { width: `${item.wbar.toFixed(1)}%` } })),
      /* @__PURE__ */ import_react6.default.createElement("span", { className: "no", "aria-hidden": "true" }, pad2(item.index + 1)),
      /* @__PURE__ */ import_react6.default.createElement("span", { className: "cache", "aria-hidden": "true" }),
      /* @__PURE__ */ import_react6.default.createElement("span", { className: "lat", "aria-hidden": "true" }, /* @__PURE__ */ import_react6.default.createElement("i", { style: { width: `${item.latPct.toFixed(1)}%` } })),
      item.segments > 1 ? /* @__PURE__ */ import_react6.default.createElement("span", { className: "seg", "aria-hidden": "true" }) : null
    );
  })), /* @__PURE__ */ import_react6.default.createElement("div", { className: "latlane", "aria-label": "\u6BCF\u6BB5\u6E32\u67D3\u8017\u65F6" }, items.map((item) => /* @__PURE__ */ import_react6.default.createElement(
    "span",
    {
      key: `lat-${item.at}-${item.index}`,
      className: `lbar${!item.error && p95 > 0 && item.latencyMs > p95 ? " slow" : ""}`,
      style: { flexBasis: `${item.wPct.toFixed(3)}%` },
      title: item.error ? "\u5931\u8D25" : latSec(item.latencyMs)
    },
    /* @__PURE__ */ import_react6.default.createElement("i", { style: { height: `${item.latPct.toFixed(1)}%` } })
  )), p95 > 0 ? /* @__PURE__ */ import_react6.default.createElement("span", { className: "p95", style: { bottom: `${p95Pct.toFixed(2)}%` } }, /* @__PURE__ */ import_react6.default.createElement("span", null, `p95 ${(p95 / 1e3).toFixed(2)}s`)) : null), /* @__PURE__ */ import_react6.default.createElement("div", { className: "rail rail--local", "aria-label": "\u672C\u5730\u6765\u6E90\u6CF3\u9053" }, items.map((item) => /* @__PURE__ */ import_react6.default.createElement("span", { key: `rl-${item.at}-${item.index}`, className: "rbar", style: { flexBasis: `${item.wPct.toFixed(3)}%` } }, item.source === "local" ? /* @__PURE__ */ import_react6.default.createElement("i", null) : null))), /* @__PURE__ */ import_react6.default.createElement("div", { className: "rail rail--cloud", "aria-label": "\u4E91\u7AEF\u6765\u6E90\u6CF3\u9053" }, items.map((item) => /* @__PURE__ */ import_react6.default.createElement("span", { key: `rc-${item.at}-${item.index}`, className: "rbar", style: { flexBasis: `${item.wPct.toFixed(3)}%` } }, item.source === "cloud" ? /* @__PURE__ */ import_react6.default.createElement("i", null) : null)), running && !cloudCount ? /* @__PURE__ */ import_react6.default.createElement("span", { className: "rail-note" }, hybrid.enabled ? `\u672C\u7A97\u65E0\u4E91\u7AEF\u6BB5 \xB7 \u542F\u52A8\u65F6\u9876\u73ED ${num(hybrid.bootstrapCount)}/${num(hybrid.maxCloudBootstrap)} \u6BB5\uFF0C\u672C\u5730\u5C31\u7EEA\u540E\u5207\u56DE` : "\u672C\u7A97\u65E0\u4E91\u7AEF/\u8FDC\u7A0B\u6BB5") : null), running && items.length ? /* @__PURE__ */ import_react6.default.createElement("div", { className: "playhead", "aria-hidden": "true" }) : null, empty ? /* @__PURE__ */ import_react6.default.createElement("div", { className: "tl-empty" }, /* @__PURE__ */ import_react6.default.createElement("div", { className: "leader" }, /* @__PURE__ */ import_react6.default.createElement("span", null, running ? "LEADER \xB7 \u7A7A\u5E26" : "LEADER \xB7 \u65E0\u4FE1\u53F7")), /* @__PURE__ */ import_react6.default.createElement("h3", null, running ? "\u8D70\u5E26\u7A7A\u5E26 \u2014\u2014 \u8FD8\u6CA1\u6709\u7247\u6BB5" : "\u8D70\u5E26\u505C\u6B62 \u2014\u2014 \u670D\u52A1\u672A\u8FD0\u884C"), /* @__PURE__ */ import_react6.default.createElement("p", null, running ? "\u7A97\u53E3\u91CC\u8FD8\u6CA1\u6709\u4EFB\u4F55\u6717\u8BFB\u7247\u6BB5\u3002\u8BA9\u624B\u673A\u4E0A\u7684\u9605\u8BFB App \u6717\u8BFB\u4E00\u6BB5\uFF0C\u7B2C\u4E00\u679A clip \u4F1A\u843D\u5728\u5E26\u5C3E\u3002" : "\u505C\u673A\u540E\u5B9E\u65F6\u7247\u6BB5\u4E0E\u6E32\u67D3\u8BFB\u6570\u5168\u90E8\u51BB\u7ED3\u4E3A\u7A7A\u6001\u3002\u5386\u53F2\u5DE5\u7A0B\u4ECD\u5728\u300C\u5DE5\u7A0B\u53F2\u300D\u91CC\uFF0C\u53C2\u6570\u4ECD\u5728\u300C\u6E32\u67D3\u8BBE\u7F6E\u300D\u91CC\u3002"), running ? null : /* @__PURE__ */ import_react6.default.createElement("button", { className: "btn btn--tape", type: "button", onClick: () => onAct("start") }, "\u542F\u52A8\u670D\u52A1")) : null), /* @__PURE__ */ import_react6.default.createElement("div", { className: "tl-gap", "aria-hidden": "true" }), /* @__PURE__ */ import_react6.default.createElement("div", { className: "takes" }, /* @__PURE__ */ import_react6.default.createElement("div", { className: "takes-hd" }, /* @__PURE__ */ import_react6.default.createElement("span", { className: "silk" }, "TAKES ", /* @__PURE__ */ import_react6.default.createElement("b", null, "\u573A\u8BB0 \xB7 \u6700\u8FD1\u6D41\u6C34")), /* @__PURE__ */ import_react6.default.createElement("span", { className: "th-meta" }, running ? `\u6700\u8FD1 ${items.length} \u6761 \xB7 \u4E0E\u65F6\u95F4\u7EBF\u540C\u6E90` : "\u505C\u673A \xB7 \u65E0\u5B9E\u65F6\u6D41\u6C34")), /* @__PURE__ */ import_react6.default.createElement("div", { className: "takes-list", role: "list", "aria-label": "\u6700\u8FD1\u5408\u6210\u6D41\u6C34" }, running ? items.length ? items.slice().reverse().map((item) => {
    const slow = !item.error && p95 > 0 && item.latencyMs > p95;
    const cls = hoverAt != null && hoverAt === item.at ? "take is-hover" : "take";
    return /* @__PURE__ */ import_react6.default.createElement(
      "div",
      {
        key: `take-${item.at}-${item.index}`,
        className: cls,
        role: "listitem",
        tabIndex: 0,
        "data-clip": item.index,
        "aria-selected": String(item.index === selectedIndex),
        title: clipLabel(item),
        onClick: () => onSelect(item),
        onKeyDown: (e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onSelect(item);
          }
        },
        onMouseEnter: () => onHover(item),
        onMouseLeave: () => onHover(null),
        onFocus: () => onHover(item),
        onBlur: () => onHover(null)
      },
      /* @__PURE__ */ import_react6.default.createElement("span", { className: "tt" }, clock(item.at)),
      /* @__PURE__ */ import_react6.default.createElement("span", { className: "tr" }, ROLE_GLYPH[item.role] || "\u65C1"),
      /* @__PURE__ */ import_react6.default.createElement("span", { className: `ts ${item.source || ""}`.trim() }, item.sourceLabel === "\u2014" ? "\u672A\u77E5" : item.sourceLabel),
      /* @__PURE__ */ import_react6.default.createElement("span", { className: "tx" }, item.text || "\uFF08\u6CA1\u6709\u6587\u672C\uFF09"),
      /* @__PURE__ */ import_react6.default.createElement("span", { className: "td", title: `${hashOf(item.client) || "\u8BBE\u5907"} \xB7 ${ipOf(item.client)}` }, hashOf(item.client) || ipOf(item.client)),
      /* @__PURE__ */ import_react6.default.createElement("span", { className: `tl${slow ? " slow" : ""}` }, item.error ? "\u5931\u8D25" : latSec(item.latencyMs)),
      /* @__PURE__ */ import_react6.default.createElement("span", { className: `tc ${item.error ? "miss" : item.cacheHit ? "hit" : "miss"}` }, item.error ? "\u5931\u8D25" : item.cacheHit ? "\u547D\u4E2D" : "\u672A\u547D\u4E2D")
    );
  }) : /* @__PURE__ */ import_react6.default.createElement("div", { className: "empty-takes" }, /* @__PURE__ */ import_react6.default.createElement("b", null, "\u8D70\u5E26\u7A7A\u5E26\uFF0C\u8FD8\u6CA1\u6709\u7247\u6BB5"), /* @__PURE__ */ import_react6.default.createElement("span", null, "\u8BA9\u624B\u673A\u4E0A\u7684\u9605\u8BFB App \u6717\u8BFB\u4E00\u6BB5\uFF0C\u7B2C\u4E00\u679A clip \u4F1A\u843D\u5728\u5E26\u5C3E\u3002")) : /* @__PURE__ */ import_react6.default.createElement("div", { className: "empty-takes" }, /* @__PURE__ */ import_react6.default.createElement("b", null, "\u8D70\u5E26\u505C\u6B62\uFF0C\u65E0\u5B9E\u65F6\u6D41\u6C34"), /* @__PURE__ */ import_react6.default.createElement("span", null, `\u6700\u540E\u5FEB\u7167 ${clock(last?.at || Date.now())} \xB7 \u542F\u52A8\u670D\u52A1\u540E\uFF0C\u65B0\u7247\u6BB5\u4F1A\u91CD\u65B0\u51FA\u73B0\u5728\u5E26\u5C3E\u3002`)))));
}
function Inspector({ running, live, service, localInfo, config, item, items, onAct, onActLocal, busy, lastSync }) {
  const cache = live?.cache || {};
  const today = live?.today || {};
  const lat = live?.latency || {};
  const rpm = live?.rpm || {};
  const hybrid = service?.hybrid || {};
  const openai = service?.openai || {};
  const provider = service?.provider || config?.upstream?.provider || "mimo";
  const localState = localInfo?.state || "disabled";
  const localWarm = Boolean(localInfo?.warm) || localState === "ready";
  const localEnabled = Boolean(localInfo?.enabled) || provider === "local" || provider === "hybrid";
  const cloudReady = Boolean(hybrid.cloudReady);
  const p95 = num(lat.p95);
  const cacheRatio = num(cache.maxEntries) > 0 ? clamp(num(cache.entries) / num(cache.maxEntries), 0, 1) : 0;
  const rpmRatio = clamp(num(rpm.used) / Math.max(1, num(rpm.limit, 100)), 0, 1);
  const cfg = config || {};
  const ttl = cfg.cache?.ttlSeconds;
  if (!running) {
    const rows = [
      ["\u4ECA\u65E5\u6BB5\u6570", `${fmtInt(today.segments)} \u6BB5`],
      ["\u4ECA\u65E5\u65F6\u957F", hm(today.seconds)],
      ["\u5E73\u5747\u5EF6\u8FDF", latSec(live?.avgLatencyMs)],
      ["\u7F13\u5B58\u547D\u4E2D", `${((num(cache.hitRate) || 0) * 100).toFixed(1)}%`],
      ["\u7D2F\u8BA1\u8BF7\u6C42", fmtInt(live?.totals?.requests)],
      ["\u7D2F\u8BA1\u65F6\u957F", hm(live?.totals?.seconds)]
    ];
    return /* @__PURE__ */ import_react6.default.createElement("aside", { className: "inspector", "aria-label": "\u62FE\u53D6\u5934 \xB7 \u9009\u4E2D\u7247\u6BB5\u4E0E\u5F15\u64CE\u8BFB\u6570" }, /* @__PURE__ */ import_react6.default.createElement("div", { className: "ins-offline" }, /* @__PURE__ */ import_react6.default.createElement("div", { className: "ins-hd" }, /* @__PURE__ */ import_react6.default.createElement("span", { className: "silk" }, "PICKUP ", /* @__PURE__ */ import_react6.default.createElement("b", null, "\u62FE\u53D6\u5934")), /* @__PURE__ */ import_react6.default.createElement("span", { className: "cn" }, "\u505C\u673A")), /* @__PURE__ */ import_react6.default.createElement("div", { className: "ins-stopped" }, /* @__PURE__ */ import_react6.default.createElement("div", { className: "banner" }, /* @__PURE__ */ import_react6.default.createElement("b", null, "\u670D\u52A1\u5DF2\u505C\u6B62\uFF0C\u5B9E\u65F6\u6570\u636E\u4E3A\u7A7A"), /* @__PURE__ */ import_react6.default.createElement("span", null, `\u6700\u540E\u5FEB\u7167 ${clock(lastSync)}`, /* @__PURE__ */ import_react6.default.createElement("br", null), "\u505C\u6B62\u540E /api/state \u4E0D\u518D\u4EA7\u751F\u65B0\u7247\u6BB5\uFF1B\u542F\u52A8\u540E\u6062\u590D\u8D70\u5E26\u3002")), /* @__PURE__ */ import_react6.default.createElement("button", { className: "btn btn--tape", type: "button", onClick: () => onAct("start") }, "\u542F\u52A8\u670D\u52A1")), /* @__PURE__ */ import_react6.default.createElement("div", { className: "ins-block", style: { marginTop: 8 } }, /* @__PURE__ */ import_react6.default.createElement("div", { className: "ins-hd" }, /* @__PURE__ */ import_react6.default.createElement("span", { className: "silk" }, "LAST SNAPSHOT ", /* @__PURE__ */ import_react6.default.createElement("b", null, "\u505C\u673A\u524D\u8BFB\u6570"))), /* @__PURE__ */ import_react6.default.createElement("div", { className: "cache-rows" }, rows.map(([k, v]) => /* @__PURE__ */ import_react6.default.createElement(Rowx, { key: k, k, v }))))));
  }
  const srcKey = item ? item.source : "";
  const tags = [];
  if (item) {
    tags.push(
      /* @__PURE__ */ import_react6.default.createElement("span", { key: "src", className: `tag ${srcKey === "local" ? "tape" : srcKey === "cloud" ? "cloud" : "hollow"}` }, item.sourceLabel === "\u2014" ? "\u6765\u6E90\u672A\u77E5" : item.sourceLabel)
    );
    tags.push(/* @__PURE__ */ import_react6.default.createElement("span", { key: "role", className: "tag hollow" }, ROLE_CN[item.role] || item.role));
    tags.push(
      /* @__PURE__ */ import_react6.default.createElement("span", { key: "cache", className: `tag ${item.error ? "grease" : item.cacheHit ? "hollow" : "grease"}` }, item.error ? "\u6E32\u67D3\u5931\u8D25" : item.cacheHit ? "\u547D\u4E2D" : "\u672A\u547D\u4E2D")
    );
    if (item.index === items.length - 1) tags.push(/* @__PURE__ */ import_react6.default.createElement("span", { key: "tail", className: "tag grease pick-rec" }, "\u5E26\u5C3E \xB7 REC"));
    if (!item.error && p95 > 0 && item.latencyMs > p95) tags.push(/* @__PURE__ */ import_react6.default.createElement("span", { key: "slow", className: "tag grease" }, "\u6162\u6E32\u67D3"));
  }
  const localRowCls = ["eng-row"];
  if (localState === "starting") localRowCls.push("warm");
  else if (!localWarm) localRowCls.push("off");
  const engLocalSub = !localEnabled ? "\u5F53\u524D\u6E32\u67D3\u6765\u6E90\u4E0D\u4F7F\u7528\u672C\u5730\u5F15\u64CE" : localState === "stopped" ? `\u5185\u5B58\u5DF2\u91CA\u653E \xB7 \u7A7A\u95F2\u5378\u8F7D ${num(localInfo?.idleUnloadSeconds)}s` : localState === "starting" ? `\u52A0\u8F7D\u4E2D\u2026 \u9996\u6B21\u7EA6 ${localInfo?.loadS ? `${localInfo.loadS}s` : "\u6570\u79D2"}` : localState === "error" ? localInfo?.lastError || "\u672C\u5730\u5F15\u64CE\u51FA\u9519" : `pid ${localInfo?.pid || "\u2014"} \xB7 :${localInfo?.port || "\u2014"} \xB7 \u52A0\u8F7D ${localInfo?.loadS ?? "\u2014"}s \xB7 \u6700\u8FD1 ${localInfo?.lastUsed ? clock(localInfo.lastUsed) : "\u2014"}`;
  const localBtnText = !localEnabled ? "\u672C\u5730\u672A\u542F\u7528" : localState === "starting" ? "\u52A0\u8F7D\u4E2D\u2026" : localState === "stopping" ? "\u5378\u8F7D\u4E2D\u2026" : localWarm ? "\u5378\u4E0B\u672C\u5730\u6A21\u578B" : "\u52A0\u8F7D\u672C\u5730\u6A21\u578B";
  const localBtnDisabled = !localEnabled || localState === "starting" || localState === "stopping" || Boolean(busy);
  const localHint = !localEnabled ? "\u5F53\u524D\u6E32\u67D3\u6765\u6E90\u4E0D\u4F7F\u7528\u672C\u5730\u5F15\u64CE" : localWarm ? `\u7A7A\u95F2 ${num(localInfo?.idleUnloadSeconds)}s \u81EA\u52A8\u5378\u8F7D` : `\u4E91\u7AEF\u9876\u73ED\uFF08\u6700\u591A ${num(hybrid.maxCloudBootstrap)} \u6BB5\uFF09`;
  const hybridNote = hybrid.enabled ? localWarm ? `\u9876\u73ED ${num(hybrid.bootstrapCount)}/${num(hybrid.maxCloudBootstrap)} \u6BB5 \xB7 ${hybrid.lastSwitchReason || "\u672C\u5730\u5DF2\u5C31\u7EEA"}` : `\u4E91\u7AEF\u9876\u73ED\uFF08\u6700\u591A ${num(hybrid.maxCloudBootstrap)} \u6BB5\uFF09` : provider === "local" ? "\u7EAF\u672C\u5730\u6E32\u67D3 \xB7 \u4E91\u7AEF\u5F85\u547D" : provider === "openai" ? `OpenAI \u517C\u5BB9 \xB7 ${cfg.upstream?.openai?.baseUrl || ""}` : "\u7EAF\u4E91\u7AEF\u6E32\u67D3 \xB7 \u672C\u5730\u672A\u53C2\u4E0E";
  return /* @__PURE__ */ import_react6.default.createElement("aside", { className: "inspector", "aria-label": "\u62FE\u53D6\u5934 \xB7 \u9009\u4E2D\u7247\u6BB5\u4E0E\u5F15\u64CE\u8BFB\u6570" }, /* @__PURE__ */ import_react6.default.createElement("div", { className: "ins-online" }, /* @__PURE__ */ import_react6.default.createElement("div", { className: "ins-block" }, /* @__PURE__ */ import_react6.default.createElement("div", { className: "ins-hd" }, /* @__PURE__ */ import_react6.default.createElement("span", { className: "silk" }, "PICKUP ", /* @__PURE__ */ import_react6.default.createElement("b", null, "\u62FE\u53D6\u5934")), /* @__PURE__ */ import_react6.default.createElement("span", { className: "cn" }, item ? `${mmssTenth(item.startSec)} \u2013 ${mmssTenth(item.endSec)}` : "\u7B49\u5F85\u7247\u6BB5")), /* @__PURE__ */ import_react6.default.createElement("div", { className: "pick-tags" }, tags), /* @__PURE__ */ import_react6.default.createElement("p", { className: "pick-text" }, item ? item.text || "\uFF08\u8FD9\u6BB5\u6CA1\u6709\u6587\u672C\uFF09" : "\u8FD8\u6CA1\u6709\u7247\u6BB5\u3002\u8BA9\u9605\u8BFB App \u6717\u8BFB\u4E00\u6BB5\uFF0C\u8FD9\u91CC\u4F1A\u663E\u793A\u6B63\u5728\u5408\u6210\u7684\u53E5\u5B50\u3002"), /* @__PURE__ */ import_react6.default.createElement("div", { className: "pick-meta" }, /* @__PURE__ */ import_react6.default.createElement("div", { className: "kv" }, /* @__PURE__ */ import_react6.default.createElement("span", { className: "k" }, "\u5EF6\u8FDF LATENCY"), /* @__PURE__ */ import_react6.default.createElement("span", { className: "v" }, item ? item.error ? "\u5931\u8D25" : latSec(item.latencyMs) : "\u2014")), /* @__PURE__ */ import_react6.default.createElement("div", { className: "kv" }, /* @__PURE__ */ import_react6.default.createElement("span", { className: "k" }, "\u5B57\u6570 CHARS"), /* @__PURE__ */ import_react6.default.createElement("span", { className: "v" }, item ? `${item.chars} \u5B57` : "\u2014")), /* @__PURE__ */ import_react6.default.createElement("div", { className: "kv" }, /* @__PURE__ */ import_react6.default.createElement("span", { className: "k" }, "\u97F3\u9891 AUDIO"), /* @__PURE__ */ import_react6.default.createElement("span", { className: "v" }, item && item.audioSeconds > 0 ? `${item.audioSeconds.toFixed(1)} s` : "\u2014")), /* @__PURE__ */ import_react6.default.createElement("div", { className: "kv" }, /* @__PURE__ */ import_react6.default.createElement("span", { className: "k" }, "\u6BB5 SEG"), /* @__PURE__ */ import_react6.default.createElement("span", { className: "v" }, item ? `${item.segments} \u6BB5` : "\u2014")), /* @__PURE__ */ import_react6.default.createElement("div", { className: "kv" }, /* @__PURE__ */ import_react6.default.createElement("span", { className: "k" }, "\u5230\u8FBE AT"), /* @__PURE__ */ import_react6.default.createElement("span", { className: "v" }, item ? clock(item.at) : "\u2014")), /* @__PURE__ */ import_react6.default.createElement("div", { className: "kv" }, /* @__PURE__ */ import_react6.default.createElement("span", { className: "k" }, "\u89D2\u8272 ROLE"), /* @__PURE__ */ import_react6.default.createElement("span", { className: "v" }, item ? ROLE_CN[item.role] || item.role : "\u2014"))), /* @__PURE__ */ import_react6.default.createElement("div", { className: "pick-device" }, /* @__PURE__ */ import_react6.default.createElement("span", null, "\u8BBE\u5907"), /* @__PURE__ */ import_react6.default.createElement("b", null, item ? `${deviceOf(item.client)} \xB7 ${ipOf(item.client)}` : "\u2014"))), /* @__PURE__ */ import_react6.default.createElement("div", { className: "ins-block" }, /* @__PURE__ */ import_react6.default.createElement("div", { className: "ins-hd" }, /* @__PURE__ */ import_react6.default.createElement("span", { className: "silk" }, "ENGINE ", /* @__PURE__ */ import_react6.default.createElement("b", null, "\u5F15\u64CE")), /* @__PURE__ */ import_react6.default.createElement("span", { className: "cn" }, PROVIDER_CN[provider] || provider)), /* @__PURE__ */ import_react6.default.createElement("div", { className: "eng" }, /* @__PURE__ */ import_react6.default.createElement("div", { className: localRowCls.join(" ") }, /* @__PURE__ */ import_react6.default.createElement("span", { className: "ld" }), /* @__PURE__ */ import_react6.default.createElement("b", null, "\u672C\u5730 Qwen3-TTS"), /* @__PURE__ */ import_react6.default.createElement("span", { className: "st" }, !localEnabled ? "\u672A\u542F\u7528" : localWarm ? "\u70ED" : localState === "starting" ? "\u52A0\u8F7D\u4E2D" : localState === "error" ? "\u51FA\u9519" : "\u5DF2\u5378\u8F7D"), /* @__PURE__ */ import_react6.default.createElement("span", { className: "val" }, localWarm && num(localInfo?.rssMb) > 0 ? `${(num(localInfo.rssMb) / 1024).toFixed(1)} GB` : "\u2014")), /* @__PURE__ */ import_react6.default.createElement("div", { className: "eng-sub" }, engLocalSub), /* @__PURE__ */ import_react6.default.createElement("div", { className: "eng-act" }, /* @__PURE__ */ import_react6.default.createElement(
    "button",
    {
      className: "btn btn--sm",
      type: "button",
      disabled: localBtnDisabled,
      onClick: () => onActLocal(localWarm ? "unload" : "load")
    },
    localBtnText
  ), /* @__PURE__ */ import_react6.default.createElement("span", { className: "eng-sub" }, localHint)), /* @__PURE__ */ import_react6.default.createElement("div", { className: `eng-row${(provider === "openai" ? openai.ready : cloudReady) ? "" : " off"}` }, /* @__PURE__ */ import_react6.default.createElement("span", { className: "ld" }), /* @__PURE__ */ import_react6.default.createElement("b", null, provider === "openai" ? "OpenAI \u517C\u5BB9" : "MiMo \u4E91\u7AEF"), /* @__PURE__ */ import_react6.default.createElement("span", { className: "st" }, provider === "openai" ? openai.ready ? "\u5DF2\u914D\u7F6E" : "\u672A\u914D\u7F6E" : cloudReady ? "\u5C31\u7EEA \xB7 \u5907\u7528" : "\u4E0D\u53EF\u7528"), /* @__PURE__ */ import_react6.default.createElement("span", { className: "val", title: provider === "openai" ? openai.model || "" : cfg.upstream?.model || "" }, provider === "openai" ? openai.model || "\u672A\u914D\u7F6E\u6A21\u578B" : cfg.upstream?.model || "\u672A\u914D\u7F6E\u6A21\u578B")), /* @__PURE__ */ import_react6.default.createElement("div", { className: "eng-sub" }, hybridNote))), /* @__PURE__ */ import_react6.default.createElement("div", { className: "ins-block" }, /* @__PURE__ */ import_react6.default.createElement("div", { className: "ins-hd" }, /* @__PURE__ */ import_react6.default.createElement("span", { className: "silk" }, "CACHE ", /* @__PURE__ */ import_react6.default.createElement("b", null, "\u7F13\u5B58\u5E26")), /* @__PURE__ */ import_react6.default.createElement("span", { className: "cn" }, `\u547D\u4E2D ${((num(cache.hitRate) || 0) * 100).toFixed(1)}%`)), /* @__PURE__ */ import_react6.default.createElement("div", { className: "vu" }, /* @__PURE__ */ import_react6.default.createElement(VuTable, { ratio: cacheRatio }), /* @__PURE__ */ import_react6.default.createElement("div", { className: "reads" }, /* @__PURE__ */ import_react6.default.createElement("b", null, `${Math.round(cacheRatio * 100)}%`), /* @__PURE__ */ import_react6.default.createElement("small", null, `${fmtInt(cache.entries)} / ${fmtInt(cache.maxEntries)} \u6761`), /* @__PURE__ */ import_react6.default.createElement("small", null, `${fmtBytes(cache.bytes)} / ${fmtBytes(cache.maxBytes)}`))), /* @__PURE__ */ import_react6.default.createElement("div", { className: "cache-rows" }, /* @__PURE__ */ import_react6.default.createElement(Rowx, { k: "\u547D\u4E2D", v: fmtInt(cache.hits) }), /* @__PURE__ */ import_react6.default.createElement(Rowx, { k: "\u672A\u547D\u4E2D", v: fmtInt(cache.misses) }), /* @__PURE__ */ import_react6.default.createElement(Rowx, { k: "TTL", v: ttlText(ttl) }), /* @__PURE__ */ import_react6.default.createElement(Rowx, { k: "\u590D\u7528\u7387", v: `${((num(cache.hitRate) || 0) * 100).toFixed(1)}%` }))), /* @__PURE__ */ import_react6.default.createElement("div", { className: "ins-block" }, /* @__PURE__ */ import_react6.default.createElement("div", { className: "ins-hd" }, /* @__PURE__ */ import_react6.default.createElement("span", { className: "silk" }, "TODAY ", /* @__PURE__ */ import_react6.default.createElement("b", null, "\u4ECA\u65E5\u5DE5\u7A0B")), /* @__PURE__ */ import_react6.default.createElement("span", { className: "cn" }, `${fmtInt(today.segments)} \u6BB5 \xB7 ${hm(today.seconds)}`)), /* @__PURE__ */ import_react6.default.createElement("div", { className: "today-grid" }, /* @__PURE__ */ import_react6.default.createElement("div", { className: "kv" }, /* @__PURE__ */ import_react6.default.createElement("span", { className: "k" }, "\u5408\u6210\u65F6\u957F"), /* @__PURE__ */ import_react6.default.createElement("span", { className: "v" }, hm(today.seconds))), /* @__PURE__ */ import_react6.default.createElement("div", { className: "kv" }, /* @__PURE__ */ import_react6.default.createElement("span", { className: "k" }, "\u5E73\u5747\u5EF6\u8FDF"), /* @__PURE__ */ import_react6.default.createElement("span", { className: "v" }, latSec(live?.avgLatencyMs))), /* @__PURE__ */ import_react6.default.createElement("div", { className: "kv" }, /* @__PURE__ */ import_react6.default.createElement("span", { className: "k" }, "\u5B57\u7B26"), /* @__PURE__ */ import_react6.default.createElement("span", { className: "v" }, fmtInt(today.chars))), /* @__PURE__ */ import_react6.default.createElement("div", { className: "kv" }, /* @__PURE__ */ import_react6.default.createElement("span", { className: "k" }, "\u9519\u8BEF"), /* @__PURE__ */ import_react6.default.createElement("span", { className: "v" }, String(num(today.errors))))), /* @__PURE__ */ import_react6.default.createElement("div", { className: "lat-row", title: `\u6700\u8FD1 ${num(lat.samples)} \u6BB5\u5EF6\u8FDF\u5206\u4F4D` }, /* @__PURE__ */ import_react6.default.createElement("span", null, "p50 ", /* @__PURE__ */ import_react6.default.createElement("b", null, latQ(lat.p50, lat.samples))), /* @__PURE__ */ import_react6.default.createElement("span", null, "p95 ", /* @__PURE__ */ import_react6.default.createElement("b", null, latQ(lat.p95, lat.samples))), /* @__PURE__ */ import_react6.default.createElement("span", null, "max ", /* @__PURE__ */ import_react6.default.createElement("b", null, latQ(lat.max, lat.samples))), /* @__PURE__ */ import_react6.default.createElement("span", null, "rpm ", /* @__PURE__ */ import_react6.default.createElement("b", null, `${num(rpm.used)}/${num(rpm.limit, 100)}`)))), /* @__PURE__ */ import_react6.default.createElement("div", { className: "ins-block" }, /* @__PURE__ */ import_react6.default.createElement("div", { className: "ins-hd" }, /* @__PURE__ */ import_react6.default.createElement("span", { className: "silk" }, "LIMITS ", /* @__PURE__ */ import_react6.default.createElement("b", null, "\u5BB9\u91CF")), /* @__PURE__ */ import_react6.default.createElement("span", { className: "cn" }, `\u5E76\u53D1 ${num(cfg.synth?.concurrency)} \xB7 \u961F\u5217 ${num(rpm.waiting)}`)), /* @__PURE__ */ import_react6.default.createElement("div", { className: "limit-meter" }, /* @__PURE__ */ import_react6.default.createElement("span", { className: "ml" }, "RPM"), /* @__PURE__ */ import_react6.default.createElement("span", { className: "meter-bar" }, /* @__PURE__ */ import_react6.default.createElement("i", { style: { width: `${Math.max(1.5, rpmRatio * 100)}%` } })), /* @__PURE__ */ import_react6.default.createElement("span", { className: "mv" }, `${num(rpm.used)} / ${num(rpm.limit, 100)}`)), /* @__PURE__ */ import_react6.default.createElement("div", { className: "cache-rows" }, /* @__PURE__ */ import_react6.default.createElement(Rowx, { k: "\u5E76\u53D1", v: `${num(cfg.synth?.concurrency)} \u8DEF` }), /* @__PURE__ */ import_react6.default.createElement(Rowx, { k: "\u961F\u5217", v: String(num(rpm.waiting)) }), /* @__PURE__ */ import_react6.default.createElement(Rowx, { k: "\u7F13\u5B58 TTL", v: ttlText(ttl) }), /* @__PURE__ */ import_react6.default.createElement(Rowx, { k: "\u672C\u5730\u7A7A\u95F2\u5378\u8F7D", v: `${num(cfg.upstream?.local?.idleUnloadSeconds)} s` })))));
}

// client/components/Transport.jsx
var import_react7 = __toESM(require("react"), 1);
function Lamp({ on, label, value, warn }) {
  return /* @__PURE__ */ import_react7.default.createElement("div", { className: `lamp${on ? " on" : warn ? " warn" : " idle"}` }, /* @__PURE__ */ import_react7.default.createElement("span", { className: "dot" }), /* @__PURE__ */ import_react7.default.createElement("span", null, label), /* @__PURE__ */ import_react7.default.createElement("b", null, value));
}
var START_ICON = /* @__PURE__ */ import_react7.default.createElement("svg", { viewBox: "0 0 12 12", "aria-hidden": "true" }, /* @__PURE__ */ import_react7.default.createElement("path", { d: "M3.2 2.2v7.6L10 6z", fill: "currentColor", stroke: "none" }));
var STOP_ICON = /* @__PURE__ */ import_react7.default.createElement("svg", { viewBox: "0 0 12 12", "aria-hidden": "true" }, /* @__PURE__ */ import_react7.default.createElement("rect", { x: 3, y: 3, width: 6, height: 6, fill: "currentColor", stroke: "none" }));
var RESTART_ICON = /* @__PURE__ */ import_react7.default.createElement("svg", { viewBox: "0 0 12 12", "aria-hidden": "true" }, /* @__PURE__ */ import_react7.default.createElement("path", { d: "M9.5 6a3.5 3.5 0 1 1-1.1-2.5" }), /* @__PURE__ */ import_react7.default.createElement("path", { d: "M9.6 1.9v2.4H7.2" }));
var PAUSE_ICON = /* @__PURE__ */ import_react7.default.createElement("svg", { viewBox: "0 0 12 12", "aria-hidden": "true" }, /* @__PURE__ */ import_react7.default.createElement("rect", { x: 3, y: 2.5, width: 2, height: 7, fill: "currentColor", stroke: "none" }), /* @__PURE__ */ import_react7.default.createElement("rect", { x: 7, y: 2.5, width: 2, height: 7, fill: "currentColor", stroke: "none" }));
var VIEW_KEYS = [
  { id: "timeline", cn: "\u65F6\u95F4\u7EBF", en: "TIMELINE" },
  { id: "settings", cn: "\u6E32\u67D3\u8BBE\u7F6E", en: "RENDER" },
  { id: "archive", cn: "\u5DE5\u7A0B\u53F2", en: "ARCHIVE" },
  { id: "delivery", cn: "\u4EA4\u4ED8", en: "DELIVER" }
];
function Transport({ service, localInfo, live, items, totalAudio, view, setView, paused, onPause, busy, act, now, error }) {
  const running = Boolean(service?.running);
  const hybrid = service?.hybrid || {};
  const openai = service?.openai || {};
  const provider = service?.provider || "mimo";
  const rpm = live?.rpm || {};
  const localState = localInfo?.state || "disabled";
  const localWarm = Boolean(localInfo?.warm) || localState === "ready";
  const localStarting = localState === "starting";
  const localText = localWarm ? "READY" : localStarting ? "LOAD" : localState === "error" ? "ERR" : localState === "disabled" ? "OFF" : "STOP";
  const cloudReady = provider === "openai" ? Boolean(openai.ready) : Boolean(hybrid.cloudReady);
  const cloudLabel = provider === "openai" ? "OAI" : "\u4E91\u7AEF";
  const cloudVal = provider === "openai" ? running && openai.ready ? "ON" : "OFF" : running && cloudReady ? "STBY" : "OFF";
  const busyName = busy || "";
  const transCls = ["transport"];
  if (running) transCls.push("is-running", "is-playing");
  if (paused) transCls.push("is-paused");
  if (!running) transCls.push("is-stopped");
  const renderKey = (action, icon, zh, en, title, disabled) => /* @__PURE__ */ import_react7.default.createElement(
    "button",
    {
      className: "key",
      type: "button",
      "data-action": action,
      title,
      disabled: Boolean(disabled),
      onClick: () => act(action)
    },
    icon,
    /* @__PURE__ */ import_react7.default.createElement("span", { className: "zi" }, zh),
    /* @__PURE__ */ import_react7.default.createElement("span", { className: "ze" }, en)
  );
  const startZh = busyName === "start" || busyName === "restart" ? "\u542F\u52A8\u4E2D" : "\u542F\u52A8";
  const stopZh = busyName === "stop" ? "\u505C\u6B62\u4E2D" : "\u505C\u6B62";
  const restartZh = busyName === "restart" ? "\u91CD\u542F\u4E2D" : "\u91CD\u542F";
  const ratio = clamp(num(rpm.used) / Math.max(1, num(rpm.limit, 100)), 0, 1);
  const liveCls = error ? "rail-live paused" : running ? paused ? "rail-live paused" : "rail-live" : "rail-live stopped";
  const liveWord = error ? "ERR" : running ? paused ? "PAUSED" : "LIVE" : "STOP";
  return /* @__PURE__ */ import_react7.default.createElement("header", { className: transCls.join(" "), id: "transport", "aria-label": "\u8D70\u5E26\u53F0" }, /* @__PURE__ */ import_react7.default.createElement("div", { className: "tp-bar" }, /* @__PURE__ */ import_react7.default.createElement("div", { className: "tp-cell", style: { paddingLeft: 0 } }, /* @__PURE__ */ import_react7.default.createElement("div", { className: "plate" }, /* @__PURE__ */ import_react7.default.createElement("svg", { className: "reel", viewBox: "0 0 32 32", "aria-hidden": "true" }, /* @__PURE__ */ import_react7.default.createElement("circle", { cx: 16, cy: 16, r: 13.4, fill: "none", stroke: "#5c6b62", strokeWidth: 1 }), /* @__PURE__ */ import_react7.default.createElement("g", { className: "rot" }, /* @__PURE__ */ import_react7.default.createElement("circle", { cx: 16, cy: 16, r: 8.4, fill: "none", stroke: "#cdd5cb", strokeWidth: 1.3 }), /* @__PURE__ */ import_react7.default.createElement("path", { d: "M16 7.6v16.8M8.9 11.8l14.2 8.4M8.9 20.2l14.2-8.4", stroke: "#cdd5cb", strokeWidth: 1, opacity: 0.4 }), /* @__PURE__ */ import_react7.default.createElement("circle", { cx: 16, cy: 16, r: 2.7, fill: "#b13a22" }), /* @__PURE__ */ import_react7.default.createElement("circle", { cx: 16, cy: 6.9, r: 1.2, fill: "#cdd5cb" }))), /* @__PURE__ */ import_react7.default.createElement("div", { className: "brand-txt" }, /* @__PURE__ */ import_react7.default.createElement("b", null, "\u542C\u4E66\u503C\u5B88"), /* @__PURE__ */ import_react7.default.createElement("small", null, `LISTENING DECK \xB7 M-${service?.port || "\u2014"}`)))), /* @__PURE__ */ import_react7.default.createElement("div", { className: "tp-cell tp-keys", role: "group", "aria-label": "\u670D\u52A1\u542F\u505C" }, renderKey("start", START_ICON, startZh, "START", "\u542F\u52A8\u670D\u52A1", running || Boolean(busy)), renderKey("stop", STOP_ICON, stopZh, "STOP", "\u505C\u6B62\u670D\u52A1", !running || Boolean(busy)), renderKey("restart", RESTART_ICON, restartZh, "RESTART", "\u91CD\u542F\u670D\u52A1", Boolean(busy))), /* @__PURE__ */ import_react7.default.createElement("div", { className: "tp-cell" }, /* @__PURE__ */ import_react7.default.createElement("div", { className: "lamps", "aria-label": "\u673A\u5668\u72B6\u6001" }, /* @__PURE__ */ import_react7.default.createElement(Lamp, { on: running, label: "RUN", value: running ? hms(service?.uptimeSec) : "\u2014" }), /* @__PURE__ */ import_react7.default.createElement(Lamp, { on: localWarm, label: "\u672C\u5730", value: localText, warn: localStarting || localState === "error" }), /* @__PURE__ */ import_react7.default.createElement(Lamp, { on: running && cloudReady, label: cloudLabel, value: cloudVal }), /* @__PURE__ */ import_react7.default.createElement(Lamp, { on: running, label: "\u6DF7\u5408", value: `${num(hybrid.bootstrapCount)}/${num(hybrid.maxCloudBootstrap)}` }))), /* @__PURE__ */ import_react7.default.createElement("div", { className: "tp-cell" }, /* @__PURE__ */ import_react7.default.createElement("div", { className: "clock" }, /* @__PURE__ */ import_react7.default.createElement("b", null, clock(now)), /* @__PURE__ */ import_react7.default.createElement("small", null, `${dateStr(now)} ${weekdayOfTs(now)} \xB7 ${TZ_LABEL}`))), /* @__PURE__ */ import_react7.default.createElement("div", { className: "tp-pause-wrap" }, /* @__PURE__ */ import_react7.default.createElement(
    "button",
    {
      className: "key key--pause",
      type: "button",
      "data-action": "pause",
      title: paused ? "\u7EE7\u7EED\u5B9E\u65F6\u5237\u65B0" : "\u6682\u505C\u5B9E\u65F6\u5237\u65B0\uFF08\u5BA2\u6237\u7AEF\u51BB\u7ED3\u5F53\u524D\u5FEB\u7167\uFF09",
      "data-active": String(paused),
      disabled: !running,
      onClick: onPause
    },
    PAUSE_ICON,
    /* @__PURE__ */ import_react7.default.createElement("span", { className: "zi" }, paused ? "\u7EE7\u7EED" : "\u6682\u505C"),
    /* @__PURE__ */ import_react7.default.createElement("span", { className: "ze" }, "PAUSE")
  ))), /* @__PURE__ */ import_react7.default.createElement("div", { className: "tp-rail" }, /* @__PURE__ */ import_react7.default.createElement("span", { className: "rail-label" }, "\u5DE5\u4F5C\u9762 VIEW"), /* @__PURE__ */ import_react7.default.createElement("div", { className: "viewkeys", role: "group", "aria-label": "\u5DE5\u4F5C\u9762\u5207\u6362\uFF08\u5FEB\u6377\u952E 1\u20134\uFF09" }, VIEW_KEYS.map((v) => /* @__PURE__ */ import_react7.default.createElement(
    "button",
    {
      key: v.id,
      className: "viewkey",
      type: "button",
      "data-view": v.id,
      "aria-pressed": String(view === v.id),
      onClick: () => setView(v.id)
    },
    /* @__PURE__ */ import_react7.default.createElement("span", { className: "vc" }, v.cn),
    /* @__PURE__ */ import_react7.default.createElement("span", { className: "ve" }, v.en)
  ))), /* @__PURE__ */ import_react7.default.createElement("div", { className: "rail-meters" }, /* @__PURE__ */ import_react7.default.createElement("div", { className: "meter", title: "\u6BCF\u5206\u949F\u8BF7\u6C42\u6570 \u2014 \u6ED1\u52A8 60 \u79D2\u7A97\u53E3" }, /* @__PURE__ */ import_react7.default.createElement("span", { className: "ml" }, "RPM"), /* @__PURE__ */ import_react7.default.createElement("span", { className: "meter-bar" }, /* @__PURE__ */ import_react7.default.createElement("i", { style: { width: `${Math.max(1.5, ratio * 100)}%` } })), /* @__PURE__ */ import_react7.default.createElement("span", { className: "mv" }, `${num(rpm.used)} / ${num(rpm.limit, 100)}`)), /* @__PURE__ */ import_react7.default.createElement("div", { className: "meter" }, /* @__PURE__ */ import_react7.default.createElement("span", { className: "ml" }, "\u961F\u5217"), /* @__PURE__ */ import_react7.default.createElement("span", { className: "mv" }, String(num(rpm.waiting)))), /* @__PURE__ */ import_react7.default.createElement("div", { className: "meter" }, /* @__PURE__ */ import_react7.default.createElement("span", { className: "ml" }, "\u672C\u7A97"), /* @__PURE__ */ import_react7.default.createElement("span", { className: "mv" }, `${items.length} \u6BB5 \xB7 ${mmssPad(totalAudio)}`))), /* @__PURE__ */ import_react7.default.createElement("div", { className: liveCls }, /* @__PURE__ */ import_react7.default.createElement("span", { className: "dot" }), /* @__PURE__ */ import_react7.default.createElement("i", null, liveWord), /* @__PURE__ */ import_react7.default.createElement("span", null, clock(now)))));
}

// client/components/Panel.jsx
function Panel() {
  const [state, setState] = (0, import_react8.useState)(null);
  const [error, setError] = (0, import_react8.useState)("");
  const [view, setView] = (0, import_react8.useState)("timeline");
  const [paused, setPaused] = (0, import_react8.useState)(false);
  const [frozen, setFrozen] = (0, import_react8.useState)(null);
  const [toast, setToast] = (0, import_react8.useState)("");
  const [busy, setBusy] = (0, import_react8.useState)("");
  const [previewBusy, setPreviewBusy] = (0, import_react8.useState)("");
  const [saving, setSaving] = (0, import_react8.useState)(false);
  const [draft, setDraft] = (0, import_react8.useState)(null);
  const [savedAt, setSavedAt] = (0, import_react8.useState)("");
  const [selAt, setSelAt] = (0, import_react8.useState)(null);
  const [selSig, setSelSig] = (0, import_react8.useState)("");
  const [panelW, setPanelW] = (0, import_react8.useState)(0);
  const [range, setRange] = (0, import_react8.useState)(30);
  const [selectedDay, setSelectedDay] = (0, import_react8.useState)("");
  const [hoverAt, setHoverAt] = (0, import_react8.useState)(null);
  const [now, setNow] = (0, import_react8.useState)(() => Date.now());
  const [lastSync, setLastSync] = (0, import_react8.useState)(0);
  const toastTimer = (0, import_react8.useRef)(null);
  const syncedRef = (0, import_react8.useRef)("");
  const rootObs = (0, import_react8.useRef)(null);
  const audioRef = (0, import_react8.useRef)(null);
  const showToast = (0, import_react8.useCallback)((text) => {
    setToast(text);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 2400);
  }, []);
  (0, import_react8.useEffect)(() => () => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    if (audioRef.current) {
      try {
        audioRef.current.pause();
      } catch {
      }
    }
  }, []);
  const refresh = (0, import_react8.useCallback)(async () => {
    try {
      const next = await api("/state");
      setState(next);
      setError("");
      setLastSync(Date.now());
    } catch (err) {
      setError(String(err?.message || err));
    }
  }, []);
  (0, import_react8.useEffect)(() => {
    refresh();
    const timer = setInterval(() => {
      if (!document.hidden) refresh();
    }, 4e3);
    return () => clearInterval(timer);
  }, [refresh]);
  (0, import_react8.useEffect)(() => {
    const timer = setInterval(() => setNow(Date.now()), 1e3);
    return () => clearInterval(timer);
  }, []);
  (0, import_react8.useEffect)(() => () => {
    if (rootObs.current) rootObs.current.disconnect();
  }, []);
  const service = state?.service || {};
  const running = Boolean(service.running);
  const provider = service.provider || state?.config?.upstream?.provider || "mimo";
  const localInfo = state?.local || state?.live?.local || {};
  const config = state?.config || {};
  const presetVoices = Array.isArray(state?.presetVoices) ? state.presetVoices : [];
  const live = paused && frozen ? frozen.live : state?.live;
  const clockNow = paused && frozen ? frozen.at : now;
  const pausedAt = paused && frozen ? frozen.at : 0;
  const tm = (0, import_react8.useMemo)(() => buildTimeline(live?.recent), [live]);
  const items = tm.list;
  const lastSelRef = (0, import_react8.useRef)(-1);
  const selIndex = (() => {
    if (!items.length) return -1;
    if (selAt == null) return items.length - 1;
    const byAt = items.findIndex((x) => x.at === selAt);
    if (byAt >= 0) return byAt;
    if (selSig) {
      const bySig = items.findIndex((x) => x.sig === selSig);
      if (bySig >= 0) return bySig;
    }
    return clamp(lastSelRef.current, 0, items.length - 1);
  })();
  const selItem = selIndex >= 0 ? items[selIndex] : null;
  lastSelRef.current = selIndex;
  const compact = panelW > 0 ? panelW < 1050 : false;
  const hoverItem = hoverAt != null ? items.find((x) => x.at === hoverAt) : null;
  const appliedFlat = (0, import_react8.useMemo)(() => fromConfig(state?.config), [state?.config]);
  const changes = (0, import_react8.useMemo)(() => draft ? diffFields(draft, appliedFlat) : [], [draft, appliedFlat]);
  (0, import_react8.useEffect)(() => {
    if (!state?.config) return;
    const key = JSON.stringify(appliedFlat);
    if (changes.length) return;
    if (syncedRef.current === key) return;
    syncedRef.current = key;
    setDraft(appliedFlat);
  }, [appliedFlat, changes.length, state?.config]);
  const onSet = (0, import_react8.useCallback)((path, value) => {
    setDraft((d) => d ? { ...d, [path]: value } : d);
  }, []);
  const act = (0, import_react8.useCallback)(async (action) => {
    if (busy) return;
    setBusy(action);
    try {
      const next = await api("/service", { method: "POST", body: JSON.stringify({ action }) });
      setState(next);
      setError("");
      setLastSync(Date.now());
      if (action === "stop") {
        setPaused(false);
        setFrozen(null);
      }
      showToast(action === "start" ? "\u670D\u52A1\u5DF2\u542F\u52A8 \xB7 \u8D70\u5E26\u5F00\u59CB" : action === "stop" ? "\u670D\u52A1\u5DF2\u505C\u6B62 \xB7 \u5B9E\u65F6\u6570\u636E\u4E3A\u7A7A\u6001" : "\u670D\u52A1\u5DF2\u91CD\u542F \xB7 \u8D70\u5E26\u6062\u590D");
    } catch (err) {
      showToast(String(err?.message || err));
    } finally {
      setBusy("");
    }
  }, [busy, showToast]);
  const actLocal = (0, import_react8.useCallback)(async (action) => {
    if (busy) return;
    setBusy(`local:${action}`);
    try {
      await api("/local", { method: "POST", body: JSON.stringify({ action }) });
      await refresh();
      showToast(action === "unload" ? "\u672C\u5730\u6A21\u578B\u5DF2\u5378\u8F7D \xB7 \u4E0B\u6BB5\u7531\u4E91\u7AEF\u9876\u73ED" : "\u672C\u5730\u6A21\u578B\u5DF2\u52A0\u8F7D");
    } catch (err) {
      showToast(String(err?.message || err));
    } finally {
      setBusy("");
    }
  }, [busy, refresh, showToast]);
  const onPreview = (0, import_react8.useCallback)(async (role = "narrator") => {
    if (previewBusy) return;
    setPreviewBusy(role);
    try {
      const text = PREVIEW_SAMPLE[role] || PREVIEW_SAMPLE.narrator;
      const { blob, source, durationS } = await fetchPreviewWav({ text, role });
      const url = URL.createObjectURL(blob);
      if (audioRef.current) {
        try {
          audioRef.current.pause();
        } catch {
        }
      }
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => URL.revokeObjectURL(url);
      audio.onerror = () => URL.revokeObjectURL(url);
      await audio.play().catch(() => {
      });
      showToast(`\u8BD5\u542C\u5B8C\u6210 \xB7 ${ROLE_CN[role] || role} \xB7 ${source || provider} \xB7 ${durationS || "?"}s`);
    } catch (err) {
      showToast(`\u8BD5\u542C\u5931\u8D25\uFF1A${String(err?.message || err)}`);
    } finally {
      setPreviewBusy("");
    }
  }, [previewBusy, provider, showToast]);
  const togglePause = (0, import_react8.useCallback)(() => {
    if (!running) {
      showToast("\u670D\u52A1\u672A\u8FD0\u884C\uFF0C\u6CA1\u6709\u53EF\u6682\u505C\u7684\u5B9E\u65F6\u6570\u636E");
      return;
    }
    if (paused) {
      setPaused(false);
      setFrozen(null);
      showToast("\u5DF2\u6062\u590D\u5B9E\u65F6\u5237\u65B0");
    } else {
      setFrozen({ live: state?.live, at: Date.now() });
      setPaused(true);
      showToast(`\u5DF2\u6682\u505C\u5B9E\u65F6\u5237\u65B0 \xB7 \u6570\u636E\u51BB\u7ED3 ${clock(Date.now())}`);
    }
  }, [running, paused, state?.live, showToast]);
  const onSelect = (0, import_react8.useCallback)((item) => {
    if (!item) return;
    setSelAt(item.at);
    setSelSig(item.sig);
  }, []);
  const onHover = (0, import_react8.useCallback)((item) => {
    setHoverAt(item ? item.at : null);
  }, []);
  const save = async () => {
    if (saving) return;
    const list = changes;
    if (!list.length) {
      showToast("\u6CA1\u6709\u9700\u8981\u4FDD\u5B58\u7684\u6539\u52A8");
      return;
    }
    const { patch, problems } = buildPatch(draft || {}, list);
    if (problems.length) {
      showToast(problems[0]);
      return;
    }
    if (!Object.keys(patch).length) {
      showToast("\u6CA1\u6709\u9700\u8981\u63D0\u4EA4\u7684\u6539\u52A8\uFF08\u5BC6\u94A5\u63A9\u7801\u4E0D\u5199\u56DE\uFF09");
      return;
    }
    setSaving(true);
    try {
      const next = await api("/config", { method: "PUT", body: JSON.stringify(patch) });
      setState(next);
      setError("");
      setLastSync(Date.now());
      const nextFlat = fromConfig(next?.config);
      setDraft(nextFlat);
      syncedRef.current = JSON.stringify(nextFlat);
      const at = clock(Date.now());
      setSavedAt(at);
      showToast(`\u5DF2\u4FDD\u5B58\u5E76\u751F\u6548 \xB7 ${at}`);
    } catch (err) {
      showToast(String(err?.message || err));
    } finally {
      setSaving(false);
    }
  };
  const revert = () => {
    if (saving) return;
    setDraft(appliedFlat);
    syncedRef.current = JSON.stringify(appliedFlat);
    showToast("\u5DF2\u8FD8\u539F\u4E3A\u5F53\u524D\u751F\u6548\u503C");
  };
  const exportConfig = () => {
    const ok = download("audiobook-tts-config.json", JSON.stringify(state?.config || {}, null, 2), "application/json");
    showToast(ok ? "\u5DF2\u5BFC\u51FA\u914D\u7F6E \xB7 audiobook-tts-config.json" : "\u6D4F\u89C8\u5668\u62E6\u622A\u4E86\u4E0B\u8F7D");
  };
  const exportCsv = () => {
    const asc = sortedDays(live?.days);
    const days = range === 30 ? asc.slice(-30) : asc.slice(-7);
    const header = "day,requests,segments,chars,seconds,bytes,errors";
    const lines = [header].concat(days.map((d) => [
      d.day,
      Number(d.requests) || 0,
      Number(d.segments) || 0,
      Number(d.chars) || 0,
      Number(d.seconds) || 0,
      Number(d.bytes) || 0,
      Number(d.errors) || 0
    ].join(",")));
    const ok = download(`audiobook-tts-days-${range}.csv`, lines.join("\n"), "text/csv;charset=utf-8");
    showToast(ok ? `\u5DF2\u5BFC\u51FA CSV \xB7 ${days.length} \u65E5` : "\u6D4F\u89C8\u5668\u62E6\u622A\u4E86\u4E0B\u8F7D");
  };
  const onCopy = async (kind) => {
    const imp = state?.import || {};
    const cfg = state?.config || {};
    let text = "";
    if (kind === "import") text = imp.jsonUrl || "";
    else if (kind === "public-import") text = imp.publicJsonUrl || "";
    else if (kind === "listen") text = imp.listenUrl || "";
    else if (kind === "body") text = BODY_TEXT;
    else if (kind === "json") text = JSON.stringify(legadoPayload(imp, cfg), null, 2);
    else if (kind === "curl") text = curlText(imp.listenUrl);
    else if (kind === "token") text = cfg.auth?.token || "";
    if (!text) {
      showToast("\u6CA1\u6709\u53EF\u590D\u5236\u7684\u5185\u5BB9");
      return;
    }
    const ok = await writeClipboard(text);
    showToast(ok ? `\u5DF2\u590D\u5236 \xB7 ${COPY_LABEL[kind] || kind}` : "\u590D\u5236\u88AB\u6D4F\u89C8\u5668\u62E6\u622A\uFF0C\u8BF7\u624B\u52A8\u9009\u4E2D");
  };
  (0, import_react8.useEffect)(() => {
    const onKey = (e) => {
      const tag = String(e.target?.tagName || "").toLowerCase();
      const typing = tag === "input" || tag === "textarea" || tag === "select";
      if ((e.ctrlKey || e.metaKey) && (e.key === "s" || e.key === "S") && view === "settings") {
        e.preventDefault();
        save();
        return;
      }
      if (typing) return;
      if (["1", "2", "3", "4"].includes(e.key)) {
        e.preventDefault();
        setView(["timeline", "settings", "archive", "delivery"][Number(e.key) - 1]);
        return;
      }
      if (view === "timeline" && (e.key === "ArrowLeft" || e.key === "ArrowRight")) {
        if (!running || !items.length) return;
        e.preventDefault();
        const dir = e.key === "ArrowRight" ? 1 : -1;
        const nextIdx = clamp(selIndex + dir, 0, items.length - 1);
        setSelAt(items[nextIdx].at);
        setSelSig(items[nextIdx].sig);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  });
  const rootRef = (0, import_react8.useCallback)((node) => {
    if (rootObs.current) {
      rootObs.current.disconnect();
      rootObs.current = null;
    }
    if (node && typeof ResizeObserver !== "undefined") {
      const ro = new ResizeObserver((entries) => {
        const w = entries[0]?.contentRect?.width || 0;
        if (w) setPanelW(w);
      });
      ro.observe(node);
      rootObs.current = ro;
    }
  }, []);
  if (!state) {
    return /* @__PURE__ */ import_react8.default.createElement("div", { className: "mtt", ref: rootRef }, /* @__PURE__ */ import_react8.default.createElement("style", { dangerouslySetInnerHTML: { __html: deck_default } }), /* @__PURE__ */ import_react8.default.createElement("div", { className: "deck", style: { gridTemplateRows: "1fr" } }, /* @__PURE__ */ import_react8.default.createElement(
      "div",
      {
        style: {
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
          fontFamily: "var(--mono)",
          fontSize: 12,
          color: "var(--ink-2)",
          background: "var(--panel)"
        }
      },
      /* @__PURE__ */ import_react8.default.createElement("b", { style: { fontSize: 14, color: "var(--ink)", letterSpacing: ".04em" } }, error ? "\u8BFB\u4E0D\u5230\u5BBF\u4E3B\u63A5\u53E3" : "\u6B63\u5728\u8FDE\u63A5\u5BBF\u4E3B\u2026"),
      /* @__PURE__ */ import_react8.default.createElement("span", null, error || "GET /mimo-tts/api/state"),
      error ? /* @__PURE__ */ import_react8.default.createElement("button", { className: "btn", type: "button", onClick: refresh }, "\u91CD\u8BD5") : null
    )), /* @__PURE__ */ import_react8.default.createElement("div", { className: `toast${toast ? " show" : ""}`, role: "status", "aria-live": "polite" }, /* @__PURE__ */ import_react8.default.createElement("span", { className: "tdot" }), /* @__PURE__ */ import_react8.default.createElement("span", null, toast)));
  }
  const hint = error ? `\u8BFB\u4E0D\u5230\u5BBF\u4E3B\u63A5\u53E3\uFF1A${error}` : hoverItem ? `\u7B2C ${hoverItem.index + 1} \u6BB5 \xB7 ${ROLE_CN[hoverItem.role]} \xB7 ${hoverItem.sourceLabel} \xB7 ${hoverItem.error ? "\u5931\u8D25" : latSec(hoverItem.latencyMs)} \xB7 ${hoverItem.chars} \u5B57 \xB7 ${clock(hoverItem.at)} \xB7 ${deviceOf(hoverItem.client)}` : HINTS[view] || "";
  let viewNode;
  if (view === "timeline") {
    viewNode = /* @__PURE__ */ import_react8.default.createElement("section", { className: "view view--timeline", id: "view-timeline", "aria-label": "\u65F6\u95F4\u7EBF\u5DE5\u4F5C\u53F0" }, /* @__PURE__ */ import_react8.default.createElement(
      TrackHeads,
      {
        running,
        live,
        service,
        localInfo,
        items,
        totalAudio: tm.totalAudio,
        totalChars: tm.totalChars,
        cacheHits: tm.cacheHits,
        avgLatency: tm.avgLatency,
        maxLatency: tm.maxLatency,
        selectedItem: selItem,
        compact
      }
    ), /* @__PURE__ */ import_react8.default.createElement(
      TapeArea,
      {
        running,
        paused,
        items,
        live,
        service,
        totalAudio: tm.totalAudio,
        totalChars: tm.totalChars,
        cacheHits: tm.cacheHits,
        avgLatency: tm.avgLatency,
        latScale: tm.latScale,
        selectedIndex: selIndex,
        selItem,
        onSelect,
        onHover,
        hoverAt,
        onAct: act
      }
    ), /* @__PURE__ */ import_react8.default.createElement(
      Inspector,
      {
        running,
        live,
        service,
        localInfo,
        config,
        item: selItem,
        items,
        onAct: act,
        onActLocal: actLocal,
        busy,
        lastSync
      }
    ));
  } else if (view === "settings") {
    viewNode = /* @__PURE__ */ import_react8.default.createElement(
      SettingsView,
      {
        live,
        localInfo,
        draft,
        applied: appliedFlat,
        changes,
        presetVoices,
        saving,
        savedAt,
        onSet,
        onSave: save,
        onRevert: revert,
        onExportConfig: exportConfig,
        onPreview,
        previewBusy
      }
    );
  } else if (view === "archive") {
    viewNode = /* @__PURE__ */ import_react8.default.createElement(
      ArchiveView,
      {
        live,
        range,
        setRange,
        selectedDay,
        onSelectDay: (day) => setSelectedDay(day),
        onExportCsv: exportCsv
      }
    );
  } else {
    viewNode = /* @__PURE__ */ import_react8.default.createElement(
      DeliveryView,
      {
        service,
        config,
        importInfo: state.import || {},
        onCopy,
        onExportConfig: exportConfig,
        onPreview,
        previewBusy
      }
    );
  }
  return /* @__PURE__ */ import_react8.default.createElement("div", { className: "mtt", ref: rootRef }, /* @__PURE__ */ import_react8.default.createElement("style", { dangerouslySetInnerHTML: { __html: deck_default } }), /* @__PURE__ */ import_react8.default.createElement("div", { className: "deck" }, /* @__PURE__ */ import_react8.default.createElement(
    Transport,
    {
      service,
      localInfo,
      live,
      items,
      totalAudio: tm.totalAudio,
      view,
      setView,
      paused,
      onPause: togglePause,
      busy,
      act,
      now: clockNow,
      error
    }
  ), /* @__PURE__ */ import_react8.default.createElement("main", { className: "bench" }, viewNode), /* @__PURE__ */ import_react8.default.createElement(
    StatusBar,
    {
      running,
      paused,
      error,
      lastSync,
      pausedAt,
      version: service.version,
      port: service.port,
      provider,
      hint
    }
  )), /* @__PURE__ */ import_react8.default.createElement("div", { className: `toast${toast ? " show" : ""}`, role: "status", "aria-live": "polite" }, /* @__PURE__ */ import_react8.default.createElement("span", { className: "tdot" }), /* @__PURE__ */ import_react8.default.createElement("span", null, toast)));
}

// client/index.jsx
var index_default = {
  inject: ["slots"],
  apply(ctx) {
    ctx.slots.inject("main", () => ctx.slots.register({ name: "main", key: PANEL_ID }, Panel));
    ctx.slots.inject("sidebar.panellist", () => ctx.slots.register(
      { name: "sidebar.panellist", id: PANEL_ID, order: 40, label: () => "\u542C\u4E66\u503C\u5B88" },
      PanelGlyph
    ));
  }
};

    return module.exports.default || module.exports
  },
})
