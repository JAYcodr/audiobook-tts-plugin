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
  dialogue: "\u201C\u4F60\u7EC8\u4E8E\u6765\u4E86\uFF0C\u6211\u7B49\u4F60\u5F88\u4E45\u4E86\u3002\u201D",
  mixed: "\u591C\u6DF1\u4E86\uFF0C\u5C71\u9053\u4E0A\u8D77\u4E86\u96FE\u3002\n\u201C\u4F60\u7EC8\u4E8E\u6765\u4E86\uFF0C\u6211\u7B49\u4F60\u5F88\u4E45\u4E86\u3002\u201D\u4ED6\u4F4E\u58F0\u8BF4\u3002"
};
var HINTS = {
  timeline: "\u2190 \u2192 \u9009\u62E9\u7247\u6BB5 \xB7 1\u20134 \u5207\u6362\u5DE5\u4F5C\u9762 \xB7 \u60AC\u505C\u6D41\u6C34\u770B\u8BFB\u6570",
  settings: "\u62D6\u52A8\u65CB\u94AE\u6216\u65B9\u5411\u952E\u5FAE\u8C03 \xB7 Ctrl/\u2318+S \u4FDD\u5B58\u5E76\u751F\u6548 \xB7 \u8FD8\u539F\u4E22\u5F03\u8349\u7A3F",
  archive: "\u70B9\u65E5\u5E26\u6216\u65E5\u8868\u9009\u4E2D\u4E00\u5929 \xB7 30/7 \u5207\u6362\u8303\u56F4 \xB7 CSV \u5BFC\u51FA\u5F53\u524D\u8303\u56F4",
  delivery: "\u590D\u5236\u5BFC\u5165\u5730\u5740\u5373\u53EF\u4EA4\u4ED8 \xB7 \u4EE4\u724C\u5DF2\u62FC\u8FDB URL \xB7 \u9519\u8BEF\u7801\u5728\u53F3\u4FA7"
};
var ERR_CODES = [
  ["401", "\u4EE4\u724C\u6216\u53E3\u4EE4\u4E0D\u5BF9 \u2014 \u4ECE\u672C\u9875\u91CD\u65B0\u590D\u5236\u5BFC\u5165\u5730\u5740\u6216\u5206\u4EAB\u94FE\u63A5"],
  ["402", "\u4E91\u7AEF\u4F59\u989D\u6216\u989D\u5EA6\u7528\u5C3D \u2014 \u6362 Key \u6216\u4E00\u952E\u5207\u5230\u672C\u5730 Qwen3-TTS"],
  ["429", "\u89E6\u53D1\u6BCF\u5206\u949F\u9650\u901F \u2014 \u8C03\u5927\u300C\u6BCF\u6BB5\u5B57\u6570\u300D\u6216\u964D\u5E76\u53D1"],
  ["502", "\u4E0A\u6E38\u62A5\u9519 \u2014 \u68C0\u67E5 API Key / \u53C2\u8003\u97F3\uFF0C\u6216\u8DD1\u300C\u8FD0\u884C\u4F53\u68C0\u300D"],
  ["413", "\u6587\u672C\u8D85\u8FC7\u5355\u6B21\u4E0A\u9650 \u2014 \u8C03\u5927\u300C\u6700\u957F\u6587\u672C\u300D\u6216\u5206\u6BB5\u53D1\u9001"],
  ["503", "\u670D\u52A1\u672A\u542F\u52A8\u6216\u672C\u5730\u5F15\u64CE\u79BB\u7EBF \u2014 \u542F\u52A8\u670D\u52A1\u6216\u68C0\u67E5\u4F53\u68C0"],
  ["500", "\u670D\u52A1\u5185\u90E8\u9519\u8BEF \u2014 \u770B\u5BBF\u4E3B\u63A7\u5236\u53F0\u65E5\u5FD7"]
];
var COPY_LABEL = {
  import: "\u7BA1\u7406\u5BFC\u5165\u5730\u5740",
  "share-import": "\u53EA\u8BFB\u5206\u4EAB\u5730\u5740",
  "share-token": "\u53EA\u8BFB\u5206\u4EAB\u4EE4\u724C",
  "public-import": "\u516C\u7F51\u5BFC\u5165\u5730\u5740",
  "quick-import": "\u4E34\u65F6\u516C\u7F51\u5BFC\u5165\u5730\u5740",
  "relay-import": "\u4E2D\u8F6C\u516C\u7F51\u5BFC\u5165\u5730\u5740",
  "quick-url": "Quick Tunnel \u5730\u5740",
  listen: "\u6717\u8BFB\u5730\u5740",
  body: "BODY",
  json: "legado.json",
  curl: "curl",
  token: "URL \u4EE4\u724C",
  "openai-base": "OpenAI Base URL",
  "openai-card": "OpenAI \u63A5\u5165\u914D\u7F6E",
  "openai-curl": "OpenAI curl \u9A8C\u8BC1\u547D\u4EE4"
};

// client/components/Panel.jsx
var import_react15 = __toESM(require("react"), 1);

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
async function fetchPreviewWav({ text, role = "narrator", draft = null, applyTextRules = true }) {
  const payload = { text, role, applyTextRules };
  if (draft && typeof draft === "object") payload.draft = draft;
  const res = await fetch(`${API}/preview`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
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
var previewTextApi = (payload) => api("/text/preview", { method: "POST", body: JSON.stringify(payload) });
var uploadRefApi = (payload) => api("/refs", { method: "POST", body: JSON.stringify(payload) });
var updateRefApi = (id, payload) => api(`/refs/${encodeURIComponent(id)}`, { method: "PUT", body: JSON.stringify(payload) });
var deleteRefApi = (id) => api(`/refs/${encodeURIComponent(id)}`, { method: "DELETE" });
var refAudioUrl = (id) => `${API}/refs/${encodeURIComponent(id)}/audio`;
var refRawAudioUrl = (id) => `${API}/refs/${encodeURIComponent(id)}/audio?raw=1`;
var clipRefApi = (id, payload) => api(`/refs/${encodeURIComponent(id)}/clip`, { method: "POST", body: JSON.stringify(payload) });
var clearRefClipApi = (id) => api(`/refs/${encodeURIComponent(id)}/clip`, { method: "DELETE" });
var fetchEnvDetectApi = () => api("/env/detect");
var runDoctorApi = (checkNetwork = false) => api("/doctor", { method: "POST", body: JSON.stringify({ checkNetwork }) });
var fetchSetupStatusApi = (since = 0) => api(`/setup/status?since=${Number(since) || 0}`);
var startSetupTaskApi = (payload) => api("/setup/run", { method: "POST", body: JSON.stringify(payload) });
var cancelSetupTaskApi = () => api("/setup/cancel", { method: "POST" });
var resetMetricsApi = () => api("/metrics", { method: "DELETE" });
var fetchTunnelStatusApi = (detect = false) => api(`/tunnel/status${detect ? "?detect=1" : ""}`);
var controlQuickTunnelApi = (payload) => api("/tunnel/quick", { method: "POST", body: JSON.stringify(payload) });
var syncTunnelKvApi = (payload = {}) => api("/tunnel/sync-kv", { method: "POST", body: JSON.stringify(payload) });
var genOpenAiServerKeyApi = () => api("/openai-server/gen-key", { method: "POST" });
var createReadTokenApi = (label) => api("/auth/read-tokens", { method: "POST", body: JSON.stringify({ label }) });
var deleteReadTokenApi = (id) => api(`/auth/read-tokens/${encodeURIComponent(id)}`, { method: "DELETE" });
var rotateAdminTokenApi = () => api("/auth/rotate-token", { method: "POST" });

// client/config-draft.js
var FIELDS = [
  { path: "server.host", label: "\u76D1\u542C\u5730\u5740", module: "transport" },
  { path: "server.port", label: "\u670D\u52A1\u7AEF\u53E3", module: "transport" },
  { path: "server.publicUrl", label: "\u5BF9\u5916\u5730\u5740", module: "transport" },
  { path: "upstream.provider", label: "\u6E32\u67D3\u6765\u6E90", module: "engine" },
  { path: "upstream.baseUrl", label: "\u4E0A\u6E38\u5730\u5740", module: "engine" },
  { path: "upstream.model", label: "\u4E91\u7AEF\u6A21\u578B", module: "engine" },
  { path: "upstream.keys", label: "API Key", module: "engine" },
  { path: "upstream.timeoutMs", label: "\u4E0A\u6E38\u8D85\u65F6", module: "engine" },
  { path: "upstream.maxRetry", label: "\u6700\u5927\u91CD\u8BD5", module: "engine" },
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
  { path: "upstream.local.warmupWindowSeconds", label: "\u9884\u70ED\u4FDD\u6D3B\u7A97\u53E3", module: "local" },
  { path: "upstream.local.startupTimeoutMs", label: "\u542F\u52A8\u8D85\u65F6", module: "local" },
  { path: "upstream.local.requestTimeoutMs", label: "\u8BF7\u6C42\u8D85\u65F6", module: "local" },
  { path: "upstream.local.refs.narrator.refId", label: "\u65C1\u767D\u53C2\u8003\u97F3\u9009\u62E9", module: "local" },
  { path: "upstream.local.refs.narrator.wav", label: "\u65C1\u767D\u53C2\u8003\u97F3\u8DEF\u5F84", module: "local" },
  { path: "upstream.local.refs.narrator.text", label: "\u65C1\u767D\u53C2\u8003\u6587\u672C", module: "local" },
  { path: "upstream.local.refs.dialogue.refId", label: "\u5BF9\u8BDD\u53C2\u8003\u97F3\u9009\u62E9", module: "local" },
  { path: "upstream.local.refs.dialogue.wav", label: "\u5BF9\u8BDD\u53C2\u8003\u97F3\u8DEF\u5F84", module: "local" },
  { path: "upstream.local.refs.dialogue.text", label: "\u5BF9\u8BDD\u53C2\u8003\u6587\u672C", module: "local" },
  { path: "voices.narrator.mode", label: "\u65C1\u767D\u6A21\u5F0F", module: "voice" },
  { path: "voices.narrator.voice", label: "\u65C1\u767D\u97F3\u8272", module: "voice" },
  { path: "voices.narrator.style", label: "\u65C1\u767D\u98CE\u683C", module: "voice" },
  { path: "voices.narrator.refId", label: "\u65C1\u767D\u53C2\u8003\u97F3", module: "voice" },
  { path: "voices.dialogue.mode", label: "\u5BF9\u8BDD\u6A21\u5F0F", module: "voice" },
  { path: "voices.dialogue.voice", label: "\u5BF9\u8BDD\u97F3\u8272", module: "voice" },
  { path: "voices.dialogue.style", label: "\u5BF9\u8BDD\u98CE\u683C", module: "voice" },
  { path: "voices.dialogue.refId", label: "\u5BF9\u8BDD\u53C2\u8003\u97F3", module: "voice" },
  { path: "voiceProfiles.active", label: "\u97F3\u8272\u65B9\u6848", module: "voice" },
  { path: "voiceProfiles.items", label: "\u81EA\u5B9A\u4E49\u97F3\u8272\u65B9\u6848", module: "voice" },
  { path: "textRules.enabled", label: "\u542F\u7528\u6587\u672C\u89C4\u5219", module: "lexicon" },
  { path: "textRules.polyphoneEnabled", label: "\u5185\u7F6E\u591A\u97F3\u5B57\u7EA0\u6B63", module: "lexicon" },
  { path: "textRules.disabledPresets", label: "\u505C\u7528\u7684\u5185\u7F6E\u8BCD\u6761", module: "lexicon" },
  { path: "textRules.items", label: "\u6587\u672C\u66FF\u6362\u89C4\u5219", module: "lexicon" },
  { path: "synth.maxSegmentChars", label: "\u6BCF\u6BB5\u5B57\u6570", module: "synth" },
  { path: "synth.maxTextChars", label: "\u6700\u957F\u6587\u672C", module: "synth" },
  { path: "synth.concurrency", label: "\u5408\u6210\u5E76\u53D1", module: "synth" },
  { path: "synth.stream", label: "\u6D41\u5F0F\u8FD4\u56DE", module: "synth" },
  { path: "synth.dialogueQuoteChars", label: "\u5BF9\u767D\u5F15\u53F7", module: "synth" },
  { path: "audio.format", label: "\u8F93\u51FA\u97F3\u9891\u683C\u5F0F", module: "synth" },
  { path: "audio.bitrate", label: "\u538B\u7F29\u7801\u7387", module: "synth" },
  { path: "cache.enabled", label: "\u542F\u7528\u7F13\u5B58", module: "synth" },
  { path: "cache.maxEntries", label: "\u7F13\u5B58\u6761\u76EE", module: "synth" },
  { path: "cache.ttlSeconds", label: "\u7F13\u5B58 TTL", module: "synth" },
  { path: "cache.httpMaxAgeSeconds", label: "HTTP \u7F13\u5B58 max-age", module: "synth" },
  { path: "limits.rpm", label: "\u9650\u901F RPM", module: "synth" },
  { path: "auth.enabled", label: "Basic \u9274\u6743", module: "auth" },
  { path: "auth.user", label: "\u7528\u6237\u540D", module: "auth" },
  { path: "auth.pass", label: "\u53E3\u4EE4", module: "auth" },
  { path: "auth.token", label: "URL \u4EE4\u724C", module: "auth" },
  { path: "legado.name", label: "Legado \u5F15\u64CE\u540D", module: "transport" },
  { path: "legado.extraHeaders", label: "\u9644\u52A0\u8BF7\u6C42\u5934", module: "transport" },
  { path: "tunnel.protocol", label: "Quick Tunnel \u534F\u8BAE", module: "transport" },
  { path: "tunnel.kvSync.enabled", label: "\u81EA\u52A8\u540C\u6B65 KV", module: "transport" },
  { path: "tunnel.kvSync.mode", label: "KV \u540C\u6B65\u65B9\u5F0F", module: "transport" },
  { path: "tunnel.kvSync.kvNamespaceId", label: "KV Namespace ID", module: "transport" },
  { path: "tunnel.kvSync.accountId", label: "Cloudflare Account ID", module: "transport" },
  { path: "tunnel.kvSync.keyName", label: "KV \u952E\u540D", module: "transport" },
  { path: "tunnel.kvSync.publicRelayUrl", label: "Worker \u4E2D\u8F6C\u5730\u5740", module: "transport" },
  { path: "openaiServer.enabled", label: "\u5BF9\u5916 OpenAI \u7AEF\u70B9", module: "openaiServer" },
  { path: "openaiServer.apiKey", label: "\u5BF9\u5916 OpenAI Key", module: "openaiServer" },
  { path: "openaiServer.splitDialogue", label: "OpenAI \u5BF9\u8BDD\u5207\u5206", module: "openaiServer" },
  { path: "openaiServer.defaultModel", label: "OpenAI \u9ED8\u8BA4\u6A21\u578B", module: "openaiServer" },
  { path: "openaiServer.mp3Fallback", label: "MP3 \u683C\u5F0F\u56DE\u9000", module: "openaiServer" },
  { path: "openaiServer.voiceMap", label: "OpenAI \u97F3\u8272\u6620\u5C04", module: "openaiServer" },
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
  "upstream.local.warmupWindowSeconds",
  "upstream.local.startupTimeoutMs",
  "upstream.local.requestTimeoutMs",
  "synth.maxSegmentChars",
  "synth.maxTextChars",
  "synth.concurrency",
  "audio.bitrate",
  "cache.maxEntries",
  "cache.ttlSeconds",
  "cache.httpMaxAgeSeconds",
  "limits.rpm",
  "log.ring"
]);
var BOOL_FIELDS = /* @__PURE__ */ new Set([
  "upstream.hybrid.warmup",
  "synth.stream",
  "cache.enabled",
  "auth.enabled",
  "textRules.enabled",
  "textRules.polyphoneEnabled",
  "openaiServer.enabled",
  "openaiServer.splitDialogue",
  "tunnel.kvSync.enabled"
]);
var ARRAY_FIELDS = /* @__PURE__ */ new Set([
  "voiceProfiles.items",
  "textRules.items",
  "textRules.disabledPresets"
]);
var DEFAULT_OPENAI_VOICE_MAP = {
  alloy: "auto",
  nova: "auto",
  shimmer: "narrator",
  echo: "dialogue",
  onyx: "dialogue",
  fable: "narrator"
};
var str = (v2, d3 = "") => v2 == null ? d3 : String(v2);
var cloneArr = (arr) => Array.isArray(arr) ? JSON.parse(JSON.stringify(arr)) : [];
var clonePlainObj = (obj, fallback) => obj && typeof obj === "object" && !Array.isArray(obj) ? JSON.parse(JSON.stringify(obj)) : JSON.parse(JSON.stringify(fallback));
function fromConfig(cfg) {
  const c2 = cfg || {};
  const srv = c2.server || {};
  const up = c2.upstream || {};
  const hy = up.hybrid || {};
  const oa = up.openai || {};
  const lo = up.local || {};
  const refs = lo.refs || {};
  const nref = refs.narrator || {};
  const dref = refs.dialogue || {};
  const voices = c2.voices || {};
  const nv = voices.narrator || {};
  const dv = voices.dialogue || {};
  const vp = c2.voiceProfiles || {};
  const tr = c2.textRules || {};
  const synth = c2.synth || {};
  const audio = c2.audio || {};
  const cache = c2.cache || {};
  const auth = c2.auth || {};
  const legado = c2.legado || {};
  const limits = c2.limits || {};
  const log = c2.log || {};
  const oaSrv = c2.openaiServer || {};
  const tun = c2.tunnel || {};
  const kv = tun.kvSync || {};
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
    "upstream.local.idleUnloadSeconds": str(lo.idleUnloadSeconds, "1800"),
    "upstream.local.warmupWindowSeconds": str(lo.warmupWindowSeconds, "900"),
    "upstream.local.startupTimeoutMs": str(lo.startupTimeoutMs, "180000"),
    "upstream.local.requestTimeoutMs": str(lo.requestTimeoutMs, "180000"),
    "upstream.local.refs.narrator.refId": str(nref.refId),
    "upstream.local.refs.narrator.wav": str(nref.wav),
    "upstream.local.refs.narrator.text": str(nref.text),
    "upstream.local.refs.dialogue.refId": str(dref.refId),
    "upstream.local.refs.dialogue.wav": str(dref.wav),
    "upstream.local.refs.dialogue.text": str(dref.text),
    "voices.narrator.mode": str(nv.mode, "preset"),
    "voices.narrator.voice": str(nv.voice),
    "voices.narrator.style": str(nv.style),
    "voices.narrator.refId": str(nv.refId),
    "voices.dialogue.mode": str(dv.mode, "preset"),
    "voices.dialogue.voice": str(dv.voice),
    "voices.dialogue.style": str(dv.style),
    "voices.dialogue.refId": str(dv.refId),
    "voiceProfiles.active": str(vp.active, "builtin:story-warm"),
    "voiceProfiles.items": cloneArr(vp.items),
    "textRules.enabled": tr.enabled !== false,
    "textRules.polyphoneEnabled": tr.polyphoneEnabled !== false,
    "textRules.disabledPresets": cloneArr(tr.disabledPresets),
    "textRules.items": cloneArr(tr.items),
    "synth.maxSegmentChars": str(synth.maxSegmentChars, "100"),
    "synth.maxTextChars": str(synth.maxTextChars, "10000"),
    "synth.concurrency": str(synth.concurrency, "4"),
    "synth.stream": Boolean(synth.stream),
    "synth.dialogueQuoteChars": str(synth.dialogueQuoteChars, "standard"),
    "audio.format": str(audio.format, "wav"),
    "audio.bitrate": str(audio.bitrate, "64"),
    "cache.enabled": Boolean(cache.enabled),
    "cache.maxEntries": str(cache.maxEntries, "500"),
    "cache.ttlSeconds": str(cache.ttlSeconds, "7200"),
    "cache.httpMaxAgeSeconds": str(cache.httpMaxAgeSeconds, "3600"),
    "limits.rpm": str(limits.rpm, "100"),
    "auth.enabled": Boolean(auth.enabled),
    "auth.user": str(auth.user),
    "auth.pass": str(auth.pass),
    "auth.token": str(auth.token),
    "legado.name": str(legado.name, "\u542C\u4E66\u503C\u5B88 TTS"),
    "legado.extraHeaders": JSON.stringify(headers, null, 2),
    "tunnel.protocol": str(tun.protocol, "http2"),
    "tunnel.kvSync.enabled": Boolean(kv.enabled),
    "tunnel.kvSync.mode": str(kv.mode, "wrangler"),
    "tunnel.kvSync.kvNamespaceId": str(kv.kvNamespaceId),
    "tunnel.kvSync.accountId": str(kv.accountId),
    "tunnel.kvSync.keyName": str(kv.keyName, "tunnel_url"),
    "tunnel.kvSync.publicRelayUrl": str(kv.publicRelayUrl),
    "openaiServer.enabled": Boolean(oaSrv.enabled),
    "openaiServer.apiKey": str(oaSrv.apiKey),
    "openaiServer.splitDialogue": oaSrv.splitDialogue !== false,
    "openaiServer.defaultModel": str(oaSrv.defaultModel, "audiobook-tts"),
    "openaiServer.mp3Fallback": str(oaSrv.mp3Fallback, "wav"),
    "openaiServer.voiceMap": clonePlainObj(oaSrv.voiceMap, DEFAULT_OPENAI_VOICE_MAP),
    "log.ring": str(log.ring, "500")
  };
}
function diffFields(draft, applied) {
  const out = [];
  if (!draft || !applied) return out;
  for (const f2 of FIELDS) {
    if (JSON.stringify(draft[f2.path]) !== JSON.stringify(applied[f2.path])) {
      out.push({ path: f2.path, label: f2.label, module: f2.module, from: applied[f2.path], to: draft[f2.path] });
    }
  }
  return out;
}
function setPath(obj, path, value) {
  const keys = String(path).split(".");
  let cur = obj;
  for (let i3 = 0; i3 < keys.length - 1; i3++) {
    const k = keys[i3];
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
    const v2 = draft[path];
    if (path === "upstream.keys") {
      const lines = String(v2 == null ? "" : v2).split(/\r?\n/).map((s3) => s3.trim()).filter(Boolean);
      setPath(patch, path, lines);
      continue;
    }
    if (path === "auth.pass" || path === "upstream.openai.apiKey" || path === "openaiServer.apiKey") {
      const s3 = String(v2 == null ? "" : v2);
      if (/[\u2026\u2022\u00b7]/.test(s3)) continue;
      setPath(patch, path, s3);
      continue;
    }
    if (path === "openaiServer.voiceMap") {
      const outMap = v2 && typeof v2 === "object" && !Array.isArray(v2) ? { ...v2 } : {};
      if (ch.from && typeof ch.from === "object") {
        for (const k of Object.keys(ch.from)) {
          if (!Object.hasOwn(outMap, k)) outMap[k] = null;
        }
      }
      setPath(patch, path, outMap);
      continue;
    }
    if (path === "legado.extraHeaders") {
      let obj;
      try {
        obj = JSON.parse(String(v2 == null ? "" : v2) || "{}");
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
    if (ARRAY_FIELDS.has(path)) {
      setPath(patch, path, Array.isArray(v2) ? v2 : []);
      continue;
    }
    if (BOOL_FIELDS.has(path)) {
      setPath(patch, path, Boolean(v2));
      continue;
    }
    if (NUMERIC_FIELDS.has(path)) {
      const n3 = Number(v2);
      if (String(v2 == null ? "" : v2).trim() === "" || !Number.isFinite(n3)) {
        problems.push(`${ch.label} \u5FC5\u987B\u662F\u6570\u5B57`);
        continue;
      }
      setPath(patch, path, n3);
      continue;
    }
    setPath(patch, path, v2 == null ? "" : v2);
  }
  return { patch, problems };
}
function buildDraftSnapshot(draft) {
  if (!draft) return null;
  const { patch } = buildPatch(draft, FIELDS);
  return patch;
}
function fmtDirtyVal(v2) {
  if (typeof v2 === "boolean") return v2 ? "\u5F00" : "\u5173";
  if (Array.isArray(v2)) return `${v2.length} \u9879`;
  if (v2 && typeof v2 === "object") return `${Object.keys(v2).length} \u9879`;
  if (v2 == null || v2 === "") return "\u2014";
  const s3 = String(v2).replace(/\s+/g, " ");
  return s3.length > 34 ? `${s3.slice(0, 32)}\u2026` : s3;
}

// client/delivery.js
function legadoPayload(imp, cfg) {
  const headers = {
    "Content-Type": "application/x-www-form-urlencoded",
    ...cfg && cfg.legado && cfg.legado.extraHeaders || {}
  };
  const listen = String(imp?.listenUrl || "");
  const option = { method: "POST", body: BODY_TEXT, header: headers };
  const contentType = String(cfg?.audio?.format || "wav").trim().toLowerCase() === "mp3" ? "audio/mpeg" : "audio/wav";
  return [{
    name: cfg?.legado?.name || "\u542C\u4E66\u503C\u5B88 TTS",
    url: `${listen},${JSON.stringify(option)}`,
    contentType,
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
    const a3 = document.createElement("a");
    a3.href = url;
    a3.download = name;
    document.body.appendChild(a3);
    a3.click();
    a3.remove();
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
var num = (v2, d3 = 0) => {
  const n3 = Number(v2);
  return Number.isFinite(n3) ? n3 : d3;
};
var pad2 = (n3) => String(n3).padStart(2, "0");
var clamp = (v2, a3, b2) => Math.max(a3, Math.min(b2, v2));
var fmtInt = (n3) => num(n3).toLocaleString("en-US");
var fmtBytes = (n3) => `${fmtInt(Math.round(num(n3) / 1048576))} MB`;
var mmss = (sec) => `${Math.floor(num(sec) / 60)}:${pad2(Math.floor(num(sec) % 60))}`;
var mmssPad = (sec) => `${pad2(Math.floor(num(sec) / 60))}:${pad2(Math.floor(num(sec) % 60))}`;
var mmssTenth = (sec) => `${Math.floor(num(sec) / 60)}:${pad2(Math.floor(num(sec) % 60))}.${Math.floor(num(sec) % 1 * 10)}`;
var hm = (sec) => `${Math.floor(num(sec) / 3600)}:${pad2(Math.floor(num(sec) % 3600 / 60))}`;
var hms = (sec) => {
  const s3 = Math.max(0, Math.floor(num(sec)));
  return `${Math.floor(s3 / 3600)}:${pad2(Math.floor(s3 % 3600 / 60))}:${pad2(s3 % 60)}`;
};
var latSec = (ms) => num(ms) > 0 ? `${(num(ms) / 1e3).toFixed(2)}s` : "\u2014";
var latQ = (ms, samples) => num(samples) > 0 ? (num(ms) / 1e3).toFixed(2) : "\u2014";
var clock = (ts) => {
  const d3 = ts ? new Date(num(ts)) : /* @__PURE__ */ new Date();
  return `${pad2(d3.getHours())}:${pad2(d3.getMinutes())}:${pad2(d3.getSeconds())}`;
};
var dateStr = (ts) => {
  const d3 = ts ? new Date(num(ts)) : /* @__PURE__ */ new Date();
  return `${d3.getFullYear()}-${pad2(d3.getMonth() + 1)}-${pad2(d3.getDate())}`;
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
  const s3 = String(client || "");
  const at = s3.indexOf("@");
  if (at >= 0) return s3.slice(at + 1) || "\u2014";
  return s3 || "\u2014";
};
var hashOf = (client) => {
  const s3 = String(client || "");
  const at = s3.indexOf("@");
  return at > 0 ? s3.slice(0, at) : "";
};
var deviceOf = (client) => hashOf(client) || ipOf(client);
function sourceOf(r3) {
  const s3 = String(r3?.source || "");
  if (s3.includes("local")) return { label: "\u672C\u5730", key: "local" };
  if (s3 === "openai") return { label: "OpenAI", key: "cloud" };
  if (s3.includes("cloud") || s3 === "mimo" || r3?.format === "wav-stream") return { label: "\u4E91\u7AEF", key: "cloud" };
  return { label: s3 || "\u2014", key: "" };
}
function ttlText(sec) {
  const s3 = num(sec);
  if (s3 >= 3600) {
    const hours = s3 / 3600;
    return `${Number.isInteger(hours) ? hours : hours.toFixed(1)} \u5C0F\u65F6`;
  }
  return `${s3} \u79D2`;
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
var deck_default = '.mtt{--panel:#e8e4d9;        \n  --panel-2:#f0ece3;      \n  --panel-3:#e2ddd1;      \n  --well:#d7d1c1;         \n  --well-2:#cfc8b6;\n  --ink:#242a26;          \n  --ink-2:#4b524c;\n  --ink-3:#5d645e;\n  --line:#c9c3b3;\n  --line-2:#aaa492;\n  --tape:#1f3b33;         \n  --tape-2:#2b5145;\n  --tape-3:#3a6a59;\n  --grease:#b13a22;       \n  --grease-soft:rgba(177,58,34,.14);\n  --cloud:#4a585e;        \n  --led:#2e7a50;\n  --led-off:#71776f;\n  --r:2px;\n  --sans:-apple-system,BlinkMacSystemFont,"PingFang SC","Hiragino Sans GB","Microsoft YaHei",system-ui,sans-serif;\n  --mono:ui-monospace,"SF Mono","SFMono-Regular",Menlo,Consolas,"Liberation Mono",monospace;}.mtt *, .mtt *::before, .mtt *::after{box-sizing:border-box}.mtt, .mtt{height:100%}.mtt{margin:0;background:var(--panel);color:var(--ink);\n  font:12.5px/1.5 var(--sans);\n  -webkit-font-smoothing:antialiased;\n  overflow:hidden;}.mtt button, .mtt input, .mtt textarea, .mtt select{font:inherit;color:inherit}.mtt button{all:unset;box-sizing:border-box}.mtt :focus-visible{outline:2px solid var(--grease);outline-offset:2px}.mtt .clip:focus-visible, .mtt .viewkey:focus-visible, .mtt .key:focus-visible, .mtt .knob:focus-visible{outline-offset:1px}.mtt ::selection{background:var(--grease-soft)}.mtt .silk{font:11px/1 var(--mono);letter-spacing:.12em;text-transform:uppercase;color:var(--ink-3)}.mtt .silk b{color:var(--ink-2);font-weight:600}.mtt .cn{font-size:11.5px;color:var(--ink-2)}.mtt .mono{font-family:var(--mono);font-variant-numeric:tabular-nums}.mtt .num{font-family:var(--mono);font-variant-numeric:tabular-nums}.mtt .muted{color:var(--ink-3)}.mtt .hide{display:none !important}.mtt .deck{height:100%;display:grid;grid-template-rows:auto minmax(0,1fr) auto;background:var(--panel);}.mtt .transport{background:var(--panel-2);border-bottom:1px solid var(--line-2);box-shadow:inset 0 -1px 0 rgba(255,255,255,.5);position:relative;z-index:5}.mtt .tp-bar{display:flex;align-items:stretch;height:58px;padding:0 14px}.mtt .tp-cell{display:flex;align-items:center;gap:10px;padding:0 14px;border-left:1px solid var(--line)}.mtt .tp-cell:first-child{border-left:0;padding-left:0}.mtt .plate{display:flex;align-items:center;gap:9px;background:var(--ink);color:var(--panel-2);padding:6px 12px 6px 9px;border-radius:var(--r);min-width:222px;box-shadow:inset 0 1px 0 rgba(255,255,255,.12),0 1px 0 rgba(0,0,0,.2)}.mtt .reel{width:32px;height:32px;flex:0 0 32px;display:block}.mtt .reel .rot{transform-origin:16px 16px}.mtt .is-running .reel .rot{animation:mtt-reel 7.5s linear infinite}.mtt .is-playing .reel .rot{animation-play-state:running}.mtt .transport.is-paused .reel .rot, .mtt .transport.is-stopped .reel .rot{animation-play-state:paused}@keyframes mtt-reel{to{transform:rotate(360deg)}}.mtt .brand-txt{min-width:0}.mtt .brand-txt b{display:block;font:600 13px/1.25 var(--sans);letter-spacing:.04em;white-space:nowrap}.mtt .brand-txt small{display:block;font:10px/1.3 var(--mono);letter-spacing:.12em;color:#a9b2a9;white-space:nowrap}.mtt .tp-keys{display:flex;gap:4px}.mtt .key{position:relative;width:58px;height:42px;display:grid;place-items:center;align-content:center;gap:1px;background:var(--panel-2);border:1px solid var(--line-2);border-radius:var(--r);box-shadow:inset 0 1px 0 #fff,0 1px 0 rgba(0,0,0,.14);cursor:pointer;user-select:none;transition:transform .08s,box-shadow .08s}.mtt .key:hover{background:#f6f3eb}.mtt .key:active{transform:translateY(1px);box-shadow:inset 0 2px 3px rgba(0,0,0,.18)}.mtt .key .zi{display:block;font-size:12px;line-height:1.1;letter-spacing:.06em}.mtt .key .ze{display:block;font:10px/1 var(--mono);letter-spacing:.1em;color:var(--ink-3);text-transform:uppercase}.mtt .key svg{width:11px;height:11px;display:block;margin:0 auto 1px}.mtt .key svg *{fill:none;stroke:currentColor;stroke-width:1.6}.mtt .key:disabled{color:#8d938c;background:var(--panel-3);box-shadow:inset 0 1px 1px rgba(0,0,0,.08);cursor:default;transform:none !important}.mtt .key[data-active="true"]{background:var(--tape);border-color:var(--tape);color:#edeadd;box-shadow:inset 0 1px 0 rgba(255,255,255,.15),inset 0 -2px 0 rgba(0,0,0,.25)}.mtt .key[data-active="true"] .ze{color:#b7c8bd}.mtt .key--pause{width:56px}.mtt .key--pause[data-active="true"]{background:var(--grease);border-color:var(--grease)}.mtt .key--pause[data-active="true"] .ze{color:#f1d5cc}.mtt .lamps{display:grid;grid-template-columns:auto auto;gap:3px 16px;align-content:center}.mtt .lamp{display:flex;align-items:center;gap:6px;font:11px/1.2 var(--mono);white-space:nowrap;color:var(--ink-2)}.mtt .lamp b{font-weight:600;color:var(--ink)}.mtt .lamp .dot{width:7px;height:7px;border-radius:50%;background:transparent;border:1px solid var(--led-off);flex:0 0 7px}.mtt .lamp.on .dot{background:var(--led);border-color:var(--led);box-shadow:0 0 0 2px rgba(46,122,80,.16)}.mtt .lamp.warn .dot{background:var(--grease);border-color:var(--grease);box-shadow:0 0 0 2px var(--grease-soft)}.mtt .lamp.idle .dot{background:var(--ink-3);border-color:var(--ink-3)}.mtt .clock{display:flex;flex-direction:column;align-items:flex-end;gap:2px;margin-left:auto}.mtt .clock b{font:600 19px/1 var(--mono);letter-spacing:.03em;font-variant-numeric:tabular-nums}.mtt .clock small{font:10px/1 var(--mono);letter-spacing:.1em;color:var(--ink-3)}.mtt .tp-pause-wrap{display:flex;align-items:center;padding-left:14px;border-left:1px solid var(--line);margin-left:14px}.mtt .tp-rail{display:flex;align-items:center;gap:12px;height:34px;padding:0 14px;background:var(--panel-3);border-top:1px solid var(--line);font-size:11px}.mtt .rail-label{font:10px/1 var(--mono);letter-spacing:.16em;text-transform:uppercase;color:var(--ink-3);white-space:nowrap}.mtt .viewkeys{display:flex;gap:3px}.mtt .viewkey{position:relative;appearance:none;display:flex;align-items:baseline;gap:7px;padding:4px 11px 5px;background:var(--panel-2);border:1px solid var(--line-2);border-radius:var(--r);cursor:pointer;box-shadow:inset 0 1px 0 #fff,0 1px 0 rgba(0,0,0,.1);white-space:nowrap;transition:background .1s}.mtt .viewkey:hover{background:#f6f3eb}.mtt .viewkey .vc{font-size:11.5px;color:var(--ink)}.mtt .viewkey .ve{font:10px/1 var(--mono);letter-spacing:.1em;color:var(--ink-3);text-transform:uppercase}.mtt .viewkey[aria-pressed="true"]{background:var(--ink);border-color:var(--ink);box-shadow:inset 0 1px 0 rgba(255,255,255,.12),inset 0 -2px 0 rgba(0,0,0,.3)}.mtt .viewkey[aria-pressed="true"] .vc{color:var(--panel-2)}.mtt .viewkey[aria-pressed="true"] .ve{color:#a7b2a8}.mtt .viewkey[aria-pressed="true"]::after{content:"";position:absolute;left:8px;right:8px;bottom:2px;height:2px;background:var(--grease)}.mtt .rail-meters{margin-left:auto;display:flex;align-items:center;gap:16px;min-width:0}.mtt .meter{display:flex;align-items:center;gap:7px;white-space:nowrap}.mtt .meter .ml{font:10px/1 var(--mono);letter-spacing:.12em;color:var(--ink-3)}.mtt .meter .mv{font:11px/1 var(--mono);font-variant-numeric:tabular-nums;color:var(--ink)}.mtt .meter-bar{position:relative;width:74px;height:7px;background:var(--well);border:1px solid var(--line-2);border-radius:1px;box-shadow:inset 0 1px 2px rgba(0,0,0,.18);overflow:hidden}.mtt .meter-bar i{position:absolute;left:0;top:0;bottom:0;background:var(--tape-3);width:3%}.mtt .meter-bar::after{content:"";position:absolute;right:-1px;top:-1px;bottom:-1px;width:1px;background:var(--grease);opacity:.55}.mtt .rail-live{display:flex;align-items:center;gap:7px;font:11px/1 var(--mono);color:var(--ink-2);white-space:nowrap}.mtt .rail-live .dot{width:7px;height:7px;border-radius:50%;background:var(--led);border:1px solid var(--led);box-shadow:0 0 0 2px rgba(46,122,80,.16)}.mtt .rail-live.stopped .dot{background:transparent;border-color:var(--ink-3);box-shadow:none}.mtt .rail-live.paused .dot{background:var(--grease);border-color:var(--grease);box-shadow:0 0 0 2px var(--grease-soft)}.mtt .rail-live i{font-style:normal;color:var(--ink);font-weight:600}.mtt .bench{min-height:0;display:grid;position:relative}.mtt .view{min-height:0;height:100%}.mtt .view[hidden]{display:none !important}.mtt .view--timeline{display:grid;grid-template-columns:174px minmax(0,1fr) 328px}.mtt .heads{padding:10px 12px 10px 14px;border-right:1px solid var(--line);display:grid;grid-template-rows:36px minmax(0,0.95fr) 10px minmax(158px,1.15fr);min-height:0;background:var(--panel-2)}.mtt .heads-top{display:flex;align-items:baseline;justify-content:space-between;gap:6px;padding-top:2px}.mtt .heads-core{min-height:0;display:grid;grid-template-rows:32px minmax(110px,1fr) 78px 32px 32px}.mtt .head{min-width:0;overflow:hidden}.mtt .head .h-title{display:flex;align-items:baseline;gap:6px;white-space:nowrap}.mtt .head .h-title .idx{font:10px/1 var(--mono);color:var(--ink-3);letter-spacing:.1em}.mtt .head .h-title b{font:600 11.5px/1 var(--sans);letter-spacing:.02em}.mtt .head .h-title small{font:10px/1 var(--mono);color:var(--ink-3);letter-spacing:.08em;text-transform:uppercase}.mtt .head--take{display:flex;align-items:flex-start;padding:1px 0 0;overflow:hidden}.mtt .head--take > div > small{display:block;font:10px/1 var(--mono);color:var(--ink-3);letter-spacing:.14em;margin:2px 0 0}.mtt .counter{font:600 19px/1 var(--mono);font-variant-numeric:tabular-nums;letter-spacing:.02em}.mtt .counter small{display:block;font:10px/1 var(--mono);color:var(--ink-3);letter-spacing:.14em;margin:2px 0 0}.mtt .head--main{border-top:1px solid var(--line);margin-top:4px;padding-top:8px;display:flex;flex-direction:column;gap:7px}.mtt .head-rows{display:flex;flex-direction:column;gap:4px}.mtt .head-row{display:flex;justify-content:space-between;gap:6px;font:11px/1.35 var(--mono);color:var(--ink-2);white-space:nowrap;min-width:0}.mtt .head-row b{color:var(--ink);font-weight:600}.mtt .head--lat{border-top:1px solid var(--line);padding-top:7px;display:flex;flex-direction:column;gap:3px;justify-content:flex-start}.mtt .head--local, .mtt .head--cloud{border-top:1px solid var(--line);display:flex;align-items:center;gap:7px;font:11px/1 var(--mono);white-space:nowrap;overflow:hidden}.mtt .head--local .idx, .mtt .head--cloud .idx{font:10px/1 var(--mono);color:var(--ink-3);letter-spacing:.1em}.mtt .head--local b, .mtt .head--cloud b{font-weight:600}.mtt .head--local .st, .mtt .head--cloud .st{color:var(--ink-3);font-size:11px;letter-spacing:.02em;overflow:hidden;text-overflow:ellipsis}.mtt .head--readers{border-top:1px solid var(--line);padding-top:8px;display:flex;flex-direction:column;gap:6px;min-height:0;overflow:hidden}.mtt .readers{display:flex;flex-direction:column;gap:5px}.mtt .reader{display:grid;grid-template-columns:8px minmax(0,1fr) auto;gap:6px;align-items:center;font:11px/1.3 var(--mono);color:var(--ink-2)}.mtt .reader .ld{width:6px;height:6px;border-radius:50%;background:var(--led);border:1px solid var(--led)}.mtt .reader.off .ld{background:transparent;border-color:var(--ink-3)}.mtt .reader b{color:var(--ink);font-weight:600;font-size:11.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.mtt .reader small{grid-column:2;color:var(--ink-3);font-size:11px;letter-spacing:.02em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.mtt .reader .idle{white-space:nowrap;font-size:11px;color:var(--ink-3)}.mtt .hybrid-cells{display:flex;gap:2px;align-items:center;margin:3px 0 0}.mtt .hybrid-cells i{display:block;width:10px;height:6px;border:1px solid var(--line-2);background:var(--panel);border-radius:1px}.mtt .hybrid-cells i.on{background:var(--tape-3);border-color:var(--tape-3)}.mtt .hybrid-cells span{font:10px/1 var(--mono);color:var(--ink-3);margin-left:4px;letter-spacing:.04em}.mtt .head-window{margin-top:6px;border-top:1px dashed var(--line);padding-top:5px}.mtt .head-window .head-row{font-size:11px}.mtt .heads-note{font:11px/1.5 var(--mono);color:var(--ink-3);letter-spacing:.01em;margin-top:auto}.mtt .timeline{min-width:0;min-height:0;padding:10px 12px;display:grid;grid-template-rows:36px minmax(0,0.95fr) 10px minmax(158px,1.15fr)}.mtt .tl-top{display:flex;align-items:baseline;justify-content:space-between;gap:10px;padding-top:2px}.mtt .tl-title{display:flex;align-items:baseline;gap:8px;min-width:0}.mtt .tl-title b{font:600 12.5px/1 var(--sans);letter-spacing:.02em;white-space:nowrap}.mtt .tl-title .eyebrow{font:10px/1 var(--mono);letter-spacing:.16em;color:var(--ink-3);text-transform:uppercase;white-space:nowrap}.mtt .tl-meta{font:11px/1 var(--mono);color:var(--ink-2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.mtt .rec-tag{display:inline-flex;align-items:center;gap:5px;font:10px/1 var(--mono);letter-spacing:.1em;color:var(--grease);border:1px solid var(--grease);background:var(--grease-soft);padding:2px 6px;border-radius:1px;white-space:nowrap}.mtt .rec-tag i{width:5px;height:5px;border-radius:50%;background:var(--grease);display:block}.mtt .rec-tag.paused{color:var(--ink-2);border-color:var(--line-2);background:transparent}.mtt .rec-tag.paused i{background:var(--ink-3)}.mtt .tl-meta b{color:var(--ink);font-weight:600}.mtt .tl-core{position:relative;min-height:0;display:grid;grid-template-rows:32px minmax(110px,1fr) 78px 32px 32px}.mtt .ruler{position:relative;border-bottom:1px solid var(--line-2);background:var(--panel-2);overflow:hidden}.mtt .ruler .tick{position:absolute;bottom:0;width:1px;background:var(--line-2)}.mtt .ruler .tick.minor{height:5px;opacity:.7}.mtt .ruler .tick.major{height:10px;background:var(--ink-2)}.mtt .ruler .tlabel{position:absolute;bottom:11px;transform:translateX(-50%);font:10px/1 var(--mono);letter-spacing:.04em;color:var(--ink-3);white-space:nowrap}.mtt .ruler .tlabel.edge-l{transform:none}.mtt .ruler .tlabel.edge-r{transform:translateX(-100%)}.mtt .ruler .cue{position:absolute;top:2px;width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-top:6px solid var(--grease);transform:translateX(-5px)}.mtt .tape{position:relative;background:var(--well);border-bottom:1px solid var(--line-2);box-shadow:inset 0 2px 4px rgba(0,0,0,.16);display:flex;overflow:hidden}.mtt .tape::after{content:"";position:absolute;left:0;right:0;top:52%;height:1px;background:rgba(236,231,214,.10);pointer-events:none}.mtt .clip{position:relative;min-width:0;flex:0 0 auto;border:0;background:var(--tape);cursor:pointer;display:flex;flex-direction:column;padding:5px 4px 5px 5px;box-shadow:inset -1px 0 0 rgba(237,234,221,.55),inset 0 1px 0 rgba(255,255,255,.10);clip-path:polygon(0 5px,5px 0,100% 0,100% 100%,0 100%);transition:background .1s}.mtt .clip:hover, .mtt .clip.is-hover{background:var(--tape-2)}.mtt .clip .role{font:600 11.5px/1 var(--sans);color:#ece7d6;letter-spacing:.02em}.mtt .clip .wbar{display:block;width:calc(100% - 2px);height:2px;margin-top:3px;background:rgba(236,231,214,.16);position:relative;overflow:hidden}.mtt .clip .wbar i{position:absolute;left:0;top:0;bottom:0;background:rgba(236,231,214,.55)}.mtt .clip .no{position:absolute;left:4px;bottom:9px;font:11px/1 var(--mono);color:rgba(236,231,214,.5);letter-spacing:.04em}.mtt .clip::after{content:"";position:absolute;top:0;right:0;width:1px;height:8px;background:rgba(236,231,214,.5)}.mtt .clip .role i{display:none}.mtt .clip .marks{display:flex;align-items:center;gap:4px;margin-top:auto}.mtt .clip .cache{position:absolute;top:4px;right:4px;width:7px;height:7px;border:1px solid #cdc6b2;border-radius:1px}.mtt .clip.hit .cache{background:#d9d2bd;border-color:#d9d2bd}.mtt .clip.miss .cache{background:transparent;border-color:var(--grease);border-radius:0}.mtt .clip.miss .cache::after{content:"";display:block;width:7px;height:1px;background:var(--grease);transform:rotate(-45deg) translate(0,-4px)}.mtt .clip .lat{height:3px;background:rgba(237,234,221,.24);margin-top:auto;position:relative;border-radius:1px;overflow:hidden}.mtt .clip .lat i{position:absolute;left:0;top:0;bottom:0;background:#d8d1bd}.mtt .clip.slow .lat i{background:var(--grease)}.mtt .clip .seg{position:absolute;top:0;bottom:0;left:50%;width:1px;background:rgba(237,234,221,.35)}.mtt .clip[aria-selected="true"]{background:var(--tape-2);box-shadow:inset 0 0 0 2px var(--grease),inset -1px 0 0 rgba(237,234,221,.65);z-index:2}.mtt .clip[aria-selected="true"] .role{color:#fff6e8}.mtt .clip:focus-visible{z-index:3}.mtt .playhead{position:absolute;top:28px;bottom:0;right:0;width:2px;background:var(--grease);z-index:4;pointer-events:none}.mtt .playhead::before{content:"";position:absolute;top:-1px;right:-4px;width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-top:8px solid var(--grease)}.mtt .playhead .ph-label{position:absolute;right:5px;top:5px;background:var(--grease);color:#f7e9e3;font:10px/1 var(--mono);letter-spacing:.08em;padding:2px 5px;white-space:nowrap}.mtt .transport.is-paused .playhead{background:transparent;border-left:2px dashed var(--grease)}.mtt .transport.is-paused .playhead::before{border-top-color:var(--grease)}.mtt .latlane{position:relative;background:var(--panel-2);border-bottom:1px solid var(--line);display:flex;align-items:flex-end;gap:0;padding:6px 0 0;overflow:hidden}.mtt .latlane .lbar{flex:0 0 auto;min-width:0;height:100%;display:flex;align-items:flex-end;background:transparent}.mtt .latlane .lbar i{display:block;width:100%;background:var(--ink-2);opacity:.55;border-top:1px solid var(--ink-2)}.mtt .latlane .lbar i{border-right:1px solid var(--panel-2)}.mtt .latlane .lbar.slow i{background:var(--grease);opacity:.8;border-top-color:var(--grease)}.mtt .latlane .p95{position:absolute;left:0;right:0;border-top:1px dashed var(--grease);opacity:.75;pointer-events:none}.mtt .latlane .p95 span{position:absolute;right:16px;top:-9px;font:11px/1 var(--mono);color:var(--grease);background:var(--panel-2);padding:0 3px;letter-spacing:.04em}.mtt .rail{position:relative;background:var(--panel-2);border-bottom:1px solid var(--line);display:flex;align-items:center;gap:0;overflow:hidden}.mtt .rail--cloud{border-bottom:0}.mtt .rail .rbar{flex:0 0 auto;min-width:0;height:9px;background:transparent}.mtt .rail .rbar i{display:block;width:100%;height:100%;background:var(--tape-3);border-radius:1px;box-shadow:inset -1px 0 0 var(--panel-2)}.mtt .rail--cloud .rbar i{background:var(--cloud)}.mtt .rail .rail-note{position:absolute;left:8px;top:50%;transform:translateY(-50%);font:11px/1 var(--mono);letter-spacing:.02em;color:var(--ink-3);background:var(--panel-2);padding:2px 6px}.mtt .takes{min-height:0;display:grid;grid-template-rows:26px minmax(0,1fr);border-top:1px solid var(--line-2)}.mtt .takes-hd{display:flex;align-items:center;justify-content:space-between;gap:8px;padding-top:5px}.mtt .takes-hd .silk{white-space:nowrap}.mtt .takes-hd .th-meta{font:11px/1 var(--mono);color:var(--ink-3);letter-spacing:.04em;white-space:nowrap}.mtt .takes-list{overflow-y:auto;overflow-x:hidden;min-height:0;padding-right:2px;scrollbar-width:thin}.mtt .take{display:grid;grid-template-columns:58px 26px 38px minmax(0,1fr) 52px 50px 44px;gap:8px;align-items:center;width:100%;text-align:left;padding:0 5px;height:24px;border-top:1px solid rgba(170,164,146,.28);cursor:pointer;font-size:12px;color:var(--ink-2)}.mtt .take:hover, .mtt .take.is-hover{background:var(--panel-2)}.mtt .take[aria-selected="true"]{background:var(--panel-3);box-shadow:inset 2px 0 0 var(--grease)}.mtt .take .tt{font:11px/1 var(--mono);color:var(--ink-3);font-variant-numeric:tabular-nums}.mtt .take .tr{font:600 11.5px/1 var(--sans);color:var(--ink);white-space:nowrap}.mtt .take .ts{font:11px/1 var(--mono);letter-spacing:.02em;white-space:nowrap}.mtt .take .ts.local{color:var(--tape-3)}.mtt .take .ts.cloud{color:var(--cloud)}.mtt .take .tx{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--ink-2)}.mtt .take .td{font:11px/1 var(--mono);color:var(--ink-3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.mtt .take .tl{font:11px/1 var(--mono);font-variant-numeric:tabular-nums;color:var(--ink-2);white-space:nowrap}.mtt .take .tl.slow{color:var(--grease)}.mtt .take .tc{font:11px/1 var(--mono);white-space:nowrap}.mtt .take .tc.hit{color:var(--tape-3)}.mtt .take .tc.miss{color:var(--grease)}.mtt .take .tc::before{content:"\u25CF";font-size:8px;margin-right:3px;vertical-align:1px}.mtt .take .tc.miss::before{content:"\u25CB"}.mtt .inspector{border-left:1px solid var(--line-2);padding:10px 14px 10px 16px;min-height:0;overflow:hidden;display:flex;flex-direction:column;gap:9px;background:var(--panel-2)}.mtt .ins-block{min-width:0}.mtt .ins-hd{display:flex;align-items:baseline;justify-content:space-between;gap:8px;padding:7px 0 5px;border-top:1px solid var(--line);margin-bottom:2px}.mtt .ins-block:first-child .ins-hd{border-top:0;padding-top:0}.mtt .ins-hd .silk{white-space:nowrap}.mtt .ins-hd .cn{white-space:nowrap;font-size:11px;color:var(--ink-3);letter-spacing:.04em}.mtt .pick-tags{display:flex;align-items:center;gap:5px;margin-bottom:6px;flex-wrap:wrap}.mtt .tag{display:inline-flex;align-items:center;gap:4px;padding:1px 7px;border:1px solid var(--line-2);border-radius:1px;font:11px/1.6 var(--mono);letter-spacing:.03em;color:var(--ink-2);white-space:nowrap}.mtt .tag.tape{background:var(--tape);border-color:var(--tape);color:#e9e4d3}.mtt .tag.grease{background:var(--grease);border-color:var(--grease);color:#f7e9e3}.mtt .tag.cloud{background:var(--cloud);border-color:var(--cloud);color:#e6e9e6}.mtt .tag.hollow{background:transparent}.mtt .pick-text{font:14px/1.6 var(--sans);color:var(--ink);margin:0 0 8px;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;min-height:22px}.mtt .pick-text .q{color:var(--ink-3);font-family:var(--mono);font-size:11px}.mtt .pick-meta{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:5px 8px;margin-bottom:6px}.mtt .kv{min-width:0}.mtt .kv .k{display:block;font:11px/1.2 var(--mono);letter-spacing:.1em;color:var(--ink-3);text-transform:uppercase;white-space:nowrap}.mtt .kv .v{display:block;font:11.5px/1.35 var(--mono);font-variant-numeric:tabular-nums;color:var(--ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.mtt .kv .v b{font-weight:600}.mtt .pick-device{display:flex;align-items:center;justify-content:space-between;gap:8px;font:11px/1.4 var(--mono);color:var(--ink-3);border-top:1px dashed var(--line);padding-top:5px}.mtt .pick-device b{color:var(--ink-2);font-weight:600}.mtt .eng{display:flex;flex-direction:column;gap:4px;font-size:11px}.mtt .eng-row{display:flex;align-items:center;gap:6px;min-width:0}.mtt .eng-row .ld{width:6px;height:6px;border-radius:50%;background:var(--led);flex:0 0 6px;border:1px solid var(--led)}.mtt .eng-row.off .ld{background:transparent;border-color:var(--ink-3)}.mtt .eng-row.warm .ld{background:var(--grease);border-color:var(--grease);box-shadow:0 0 0 2px var(--grease-soft)}.mtt .eng-row b{font:600 11px/1.3 var(--sans);white-space:nowrap}.mtt .eng-row .st{font:11px/1.3 var(--mono);color:var(--ink-3);white-space:nowrap}.mtt .eng-row .val{margin-left:auto;font:11px/1.3 var(--mono);color:var(--ink-2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.mtt .eng-sub{font:11px/1.45 var(--mono);color:var(--ink-3);letter-spacing:.01em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.mtt .eng-act{display:flex;gap:6px;margin-top:3px}.mtt .btn{display:inline-flex;align-items:center;justify-content:center;gap:5px;padding:4px 10px;background:var(--panel-2);border:1px solid var(--line-2);border-radius:var(--r);font-size:11.5px;color:var(--ink);cursor:pointer;box-shadow:inset 0 1px 0 #fff,0 1px 0 rgba(0,0,0,.1);white-space:nowrap;transition:background .1s}.mtt .btn:hover{background:#f7f4ec}.mtt .btn:active{transform:translateY(1px);box-shadow:inset 0 2px 3px rgba(0,0,0,.14)}.mtt .btn:disabled{color:#8d938c;background:var(--panel-3);box-shadow:none;cursor:default;transform:none}.mtt .btn--tape{background:var(--tape);border-color:var(--tape);color:#e9e4d3}.mtt .btn--tape:hover{background:var(--tape-2)}.mtt .btn--ghost{background:transparent;box-shadow:none}.mtt .btn--sm{padding:2px 8px;font-size:11px}.mtt .vu{display:grid;grid-template-columns:1fr auto;gap:10px;align-items:center}.mtt .vu svg{display:block;width:100%;height:auto;max-height:76px}.mtt .vu .reads{display:flex;flex-direction:column;gap:3px;text-align:right}.mtt .vu .reads b{font:600 15px/1 var(--mono);font-variant-numeric:tabular-nums}.mtt .vu .reads small{font:11px/1.2 var(--mono);color:var(--ink-3);white-space:nowrap}.mtt .cache-rows{display:grid;grid-template-columns:1fr 1fr;gap:3px 10px;margin-top:4px}.mtt .rowx{display:flex;justify-content:space-between;gap:8px;font:11px/1.5 var(--mono);color:var(--ink-3);white-space:nowrap}.mtt .rowx b{color:var(--ink-2);font-weight:600;font-variant-numeric:tabular-nums}.mtt .today-grid{display:grid;grid-template-columns:1fr 1fr;gap:4px 10px}.mtt .today-grid .kv .v{font-size:12.5px}.mtt .today-grid .kv .v small{font:11px var(--sans);color:var(--ink-3);margin-left:2px}.mtt .lat-row{display:flex;gap:10px;margin-top:3px;font:11px/1.4 var(--mono);color:var(--ink-3);white-space:nowrap}.mtt .lat-row b{color:var(--ink-2);font-weight:600}.mtt .limit-meter{display:flex;align-items:center;gap:8px;margin:2px 0 5px}.mtt .limit-meter .ml{font:10px/1 var(--mono);letter-spacing:.12em;color:var(--ink-3)}.mtt .limit-meter .mv{font:11px/1 var(--mono);color:var(--ink-2);font-variant-numeric:tabular-nums}.mtt .limit-meter .meter-bar{width:auto;flex:1}.mtt .tl-empty[hidden]{display:none}.mtt .tl-empty{position:absolute;inset:0;z-index:6;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;background:var(--panel-2);border-top:1px solid var(--line);text-align:center}.mtt .leader{width:min(420px,80%);height:34px;border:1px solid var(--line-2);background:repeating-linear-gradient(-45deg,var(--well) 0 10px,var(--panel-2) 10px 20px);box-shadow:inset 0 1px 3px rgba(0,0,0,.14);position:relative;display:flex;align-items:center;justify-content:center}.mtt .leader span{background:var(--panel-2);padding:0 8px;font:10px/1 var(--mono);letter-spacing:.18em;color:var(--ink-3)}.mtt .tl-empty h3{margin:0;font:600 15px/1.3 var(--sans);letter-spacing:.02em}.mtt .tl-empty p{margin:0;font-size:11.5px;color:var(--ink-2);max-width:420px;line-height:1.7}.mtt .empty-takes{padding:14px;font:11px/1.6 var(--mono);color:var(--ink-3);display:flex;flex-direction:column;gap:4px}.mtt .ins-stopped{display:flex;flex-direction:column;gap:8px;padding:10px 0}.mtt .ins-stopped .banner{border:1px solid var(--line-2);background:var(--well);padding:10px;display:flex;flex-direction:column;gap:6px}.mtt .ins-stopped .banner b{font:600 12.5px/1.3 var(--sans)}.mtt .ins-stopped .banner span{font:10.5px/1.5 var(--mono);color:var(--ink-3)}.mtt .view--settings{display:grid;grid-template-rows:minmax(0,1fr) 48px}.mtt .set-grid{display:grid;grid-template-columns:198px minmax(0,1fr) 300px;min-height:0}.mtt .set-left{border-right:1px solid var(--line);padding:12px 14px;display:flex;flex-direction:column;gap:12px;min-height:0;overflow:hidden;background:var(--panel-2)}.mtt .set-left h2{margin:0;font:600 13px/1.3 var(--sans);letter-spacing:.02em}.mtt .set-left .sub{font:10px/1.3 var(--mono);letter-spacing:.14em;color:var(--ink-3);text-transform:uppercase}.mtt .chain{display:flex;flex-direction:column;gap:0;margin-top:2px}.mtt .chain-node{display:flex;align-items:center;gap:7px;font:11px/1.3 var(--mono);color:var(--ink-2);padding:4px 6px;border:1px solid var(--line-2);background:var(--panel);border-radius:1px;white-space:nowrap;overflow:hidden}.mtt .chain-node .ld{width:6px;height:6px;border-radius:50%;background:var(--led);border:1px solid var(--led);flex:0 0 6px}.mtt .chain-node.off .ld{background:transparent;border-color:var(--ink-3)}.mtt .chain-node b{font-weight:600;color:var(--ink);font-family:var(--sans);font-size:11px}.mtt .chain-link{width:1px;height:12px;background:var(--line-2);margin-left:14px}.mtt .chain-note{font:11px/1.5 var(--mono);color:var(--ink-3)}.mtt .mod-index{display:flex;flex-direction:column;gap:2px;margin-top:auto;padding-top:8px;border-top:1px solid var(--line)}.mtt .mod-index button{display:flex;align-items:baseline;gap:7px;padding:3px 2px;font:11px/1.4 var(--mono);color:var(--ink-2);cursor:pointer;text-align:left}.mtt .mod-index button:hover{color:var(--ink)}.mtt .mod-index .n{color:var(--ink-3);font-size:10px}.mtt .modules{overflow-y:auto;min-height:0;padding:12px 14px;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;align-content:start;scrollbar-width:thin}.mtt .module{border:1px solid var(--line-2);background:var(--panel-2);border-radius:var(--r);padding:9px 11px 10px;min-width:0;position:relative;box-shadow:0 1px 0 rgba(255,255,255,.4) inset}.mtt .module-hd{display:flex;align-items:baseline;justify-content:space-between;gap:8px;border-bottom:1px solid var(--line);padding-bottom:5px;margin-bottom:5px}.mtt .module-hd .mh{display:flex;align-items:baseline;gap:6px;white-space:nowrap;min-width:0}.mtt .module-hd b{font:600 11.5px/1 var(--sans);letter-spacing:.03em}.mtt .module-hd .silk{font-size:10px}.mtt .module-hd .mnum{font:10px/1 var(--mono);color:var(--ink-3)}.mtt .dirty-dot{width:6px;height:6px;border-radius:50%;background:var(--grease);display:none;flex:0 0 6px;box-shadow:0 0 0 2px var(--grease-soft)}.mtt .module.is-dirty .dirty-dot{display:block}.mtt .field{display:grid;gap:2px;padding:4px 0;min-width:0}.mtt .field .fl{display:flex;align-items:baseline;justify-content:space-between;gap:6px;font-size:11px;color:var(--ink-2);white-space:nowrap}.mtt .field .fl i{font:10px/1 var(--mono);letter-spacing:.12em;color:var(--ink-3);font-style:normal;text-transform:uppercase}.mtt .input{width:100%;min-width:0;background:var(--panel);border:1px solid var(--line-2);border-radius:1px;padding:3px 6px;font:11px/1.5 var(--mono);color:var(--ink);box-shadow:inset 0 1px 2px rgba(0,0,0,.10);caret-color:var(--grease)}.mtt .input:hover{background:#f6f2e9}.mtt .input:focus-visible{outline:2px solid var(--grease);outline-offset:1px;background:#fbf8f0}.mtt textarea.input{resize:vertical;min-height:44px;line-height:1.55}.mtt .ctrl-row{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:4px 0;border-top:1px solid rgba(170,164,146,.28);min-width:0}.mtt .ctrl-row:first-of-type{border-top:0}.mtt .ctrl-row .cl{display:flex;flex-direction:column;gap:1px;min-width:0}.mtt .ctrl-row .cl b{font:11px/1.3 var(--sans);color:var(--ink-2);font-weight:500;white-space:nowrap}.mtt .ctrl-row .cl i{font:10px/1 var(--mono);font-style:normal;letter-spacing:.1em;color:var(--ink-3);text-transform:uppercase;white-space:nowrap}.mtt .knob-row{display:flex;flex-wrap:wrap;gap:4px 14px;padding:2px 0 1px}.mtt .knob-wrap{display:flex;flex-direction:column;align-items:center;gap:2px;min-width:64px}.mtt .knob-wrap .kl{font:11px/1.2 var(--sans);color:var(--ink-2);white-space:nowrap;text-align:center}.mtt .knob-holder{position:relative;width:48px;height:48px;display:grid;place-items:center}.mtt .knob{position:relative;width:38px;height:38px;border-radius:50%;background:var(--panel-2);border:1px solid var(--line-2);cursor:grab;touch-action:none;box-shadow:inset 0 2px 2px #fff,inset 0 -3px 4px rgba(0,0,0,.14),0 1px 2px rgba(0,0,0,.18);z-index:1}.mtt .knob:active{cursor:grabbing}.mtt .knob::before{content:"";position:absolute;left:50%;top:4px;width:2px;height:10px;margin-left:-1px;background:var(--ink);border-radius:1px;transform-origin:50% 15px;transform:rotate(var(--angle,0deg))}.mtt .knob::after{content:"";position:absolute;left:50%;top:50%;width:8px;height:8px;margin:-4px 0 0 -4px;border-radius:50%;background:var(--well);box-shadow:inset 0 1px 2px rgba(0,0,0,.25)}.mtt .knob-ticks{position:absolute;inset:0;width:48px;height:48px;pointer-events:none}.mtt .knob-val{font:11px/1 var(--mono);font-variant-numeric:tabular-nums;background:var(--well);border:1px solid var(--line-2);border-radius:1px;padding:1px 4px;min-width:34px;text-align:center;color:var(--ink)}.mtt .knob-wrap.is-dirty .knob-val{border-color:var(--grease);color:var(--grease)}.mtt .toggle{position:relative;width:36px;height:18px;flex:0 0 36px;background:var(--well);border:1px solid var(--line-2);border-radius:2px;cursor:pointer;box-shadow:inset 0 1px 2px rgba(0,0,0,.22)}.mtt .toggle::after{content:"";position:absolute;top:1px;left:1px;width:15px;height:14px;background:var(--panel-2);border:1px solid var(--line-2);border-radius:1px;box-shadow:0 1px 1px rgba(0,0,0,.25);transition:transform .1s}.mtt .toggle[aria-checked="true"]{background:var(--tape);border-color:var(--tape)}.mtt .toggle[aria-checked="true"]::after{transform:translateX(18px);border-color:var(--tape)}.mtt .toggle-wrap{display:flex;align-items:center;gap:6px}.mtt .toggle-wrap .tv{font:11px/1 var(--mono);color:var(--ink-3);min-width:14px}.mtt .seg{display:flex;gap:0;border:1px solid var(--line-2);border-radius:1px;overflow:hidden}.mtt .seg-key{padding:3px 9px;font:11px/1.4 var(--mono);background:var(--panel-2);cursor:pointer;color:var(--ink-2);border-left:1px solid var(--line-2);white-space:nowrap}.mtt .seg-key:first-child{border-left:0}.mtt .seg-key[aria-pressed="true"]{background:var(--ink);color:var(--panel-2)}.mtt .chips{display:flex;flex-wrap:wrap;gap:3px}.mtt .chip{padding:1px 6px;border:1px solid var(--line-2);border-radius:1px;font:11px/1.5 var(--mono);background:var(--panel);cursor:pointer;color:var(--ink-2);white-space:nowrap}.mtt .chip:hover{background:#f7f4ec}.mtt .chip[aria-pressed="true"]{background:var(--tape);border-color:var(--tape);color:#e9e4d3}.mtt .hint{font:11px/1.55 var(--mono);color:var(--ink-3);margin:4px 0 0}.mtt .apply{border-left:1px solid var(--line);padding:12px 14px;display:flex;flex-direction:column;gap:10px;min-height:0;background:var(--panel-2);overflow:hidden}.mtt .apply h2{margin:0;font:600 13px/1.3 var(--sans)}.mtt .apply .sub{font:10px/1.3 var(--mono);letter-spacing:.14em;color:var(--ink-3);text-transform:uppercase}.mtt .apply-sum{border:1px solid var(--line-2);background:var(--panel);padding:7px 9px;display:flex;flex-direction:column;gap:3px}.mtt .apply-sum .rowx{font-size:11px}.mtt .dirty-wrap{display:flex;flex-direction:column;gap:4px;min-height:0;overflow:hidden}.mtt .dirty-list{list-style:none;margin:0;padding:0;overflow-y:auto;min-height:0;scrollbar-width:thin}.mtt .dirty-list li{font:11px/1.5 var(--mono);color:var(--ink-2);padding:2px 0 2px 12px;position:relative;border-top:1px solid rgba(170,164,146,.3)}.mtt .dirty-list li::before{content:"";position:absolute;left:2px;top:8px;width:4px;height:4px;background:var(--grease);border-radius:50%}.mtt .dirty-list li b{color:var(--ink);font-weight:600}.mtt .dirty-empty{font:11px/1.6 var(--mono);color:var(--ink-3);border:1px dashed var(--line-2);padding:8px;text-align:center}.mtt .savebar{display:flex;align-items:center;gap:10px;padding:0 14px;background:var(--panel-3);border-top:2px solid var(--line-2);box-shadow:inset 0 1px 0 rgba(255,255,255,.4)}.mtt .savebar .sb-msg{display:flex;align-items:center;gap:7px;font:11px/1.3 var(--mono);color:var(--ink-2);white-space:nowrap}.mtt .savebar .sb-msg .dot{width:7px;height:7px;border-radius:50%;background:var(--led);border:1px solid var(--led)}.mtt .savebar.is-dirty .sb-msg .dot{background:var(--grease);border-color:var(--grease);box-shadow:0 0 0 2px var(--grease-soft)}.mtt .savebar.is-saving .sb-msg .dot{background:var(--ink-3);border-color:var(--ink-3)}.mtt .savebar .sb-spacer{flex:1}.mtt .savebar .sb-hint{font:11px/1.3 var(--mono);color:var(--ink-3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.mtt .view--archive{display:grid;grid-template-columns:200px minmax(0,1fr) 300px;min-height:0}.mtt .arch-left{border-right:1px solid var(--line);padding:12px 14px;display:flex;flex-direction:column;gap:12px;min-height:0;background:var(--panel-2);overflow:hidden}.mtt .arch-left h2{margin:0;font:600 13px/1.3 var(--sans)}.mtt .range-keys{display:flex;gap:4px}.mtt .range-key{flex:1;padding:7px 6px;text-align:center;border:1px solid var(--line-2);background:var(--panel-2);border-radius:var(--r);cursor:pointer;box-shadow:inset 0 1px 0 #fff,0 1px 0 rgba(0,0,0,.1)}.mtt .range-key b{display:block;font:600 12px/1.2 var(--sans)}.mtt .range-key small{display:block;font:10px/1.2 var(--mono);letter-spacing:.1em;color:var(--ink-3);margin-top:2px;text-transform:uppercase}.mtt .range-key[aria-pressed="true"]{background:var(--ink);border-color:var(--ink);color:var(--panel-2)}.mtt .range-key[aria-pressed="true"] small{color:#a7b2a8}.mtt .totals{display:flex;flex-direction:column;gap:2px;border-top:1px solid var(--line);padding-top:8px}.mtt .totals .trow{display:flex;justify-content:space-between;align-items:baseline;gap:8px;font:11px/1.6 var(--mono);color:var(--ink-3);white-space:nowrap}.mtt .totals .trow b{font:600 13px/1.4 var(--mono);color:var(--ink);font-variant-numeric:tabular-nums}.mtt .totals .trow b small{font:10px var(--mono);color:var(--ink-3);margin-left:2px;font-weight:400}.mtt .arch-left .foot{margin-top:auto;display:flex;flex-direction:column;gap:8px;border-top:1px solid var(--line);padding-top:8px}.mtt .arch-main{min-width:0;min-height:0;padding:12px 14px;display:grid;grid-template-rows:auto auto minmax(0,1fr);gap:8px}.mtt .arch-top{display:flex;align-items:baseline;justify-content:space-between;gap:10px}.mtt .arch-top .ah{display:flex;align-items:baseline;gap:8px;white-space:nowrap}.mtt .arch-top b{font:600 12.5px/1 var(--sans)}.mtt .arch-top .silk{white-space:nowrap}.mtt .arch-top .ameta{font:11px/1 var(--mono);color:var(--ink-3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.mtt .daytape-wrap{position:relative;padding-top:30px;padding-bottom:16px}.mtt .daytape{display:flex;height:78px;background:var(--well);border:1px solid var(--line-2);box-shadow:inset 0 2px 4px rgba(0,0,0,.16);overflow:hidden}.mtt .day{position:relative;flex:0 0 auto;min-width:0;border-left:1px solid rgba(237,234,221,.5);background:var(--tape);cursor:pointer;display:flex;flex-direction:column;justify-content:flex-end;padding:3px 3px 4px;transition:background .1s}.mtt .day:first-child{border-left:0}.mtt .day:hover{background:var(--tape-2)}.mtt .day[aria-selected="true"]{background:var(--tape-2);box-shadow:inset 0 0 0 2px var(--grease)}.mtt .day .dn{font:11px/1 var(--mono);color:#cfd8cd;letter-spacing:.02em;white-space:nowrap;overflow:hidden}.mtt .day.today .dn{color:#f2b6a6}.mtt .day .err{position:absolute;right:3px;top:3px;width:5px;height:5px;background:var(--grease);border-radius:50%}.mtt .day .bar{position:absolute;left:0;right:0;bottom:0;background:rgba(237,234,221,.14)}.mtt .day-axis{position:relative;height:14px}.mtt .day-axis .mlabel{position:absolute;top:0;font:11px/1 var(--mono);color:var(--ink-3);letter-spacing:.06em;transform:translateX(-50%);white-space:nowrap}.mtt .day-axis .mtick{position:absolute;top:-4px;width:1px;height:8px;background:var(--line-2)}.mtt .peak-note{position:absolute;top:2px;transform:translateX(-50%);font:11px/1.2 var(--mono);color:var(--grease);white-space:nowrap;text-align:center;letter-spacing:.02em}.mtt .peak-note::after{content:"";display:block;width:1px;height:16px;background:var(--grease);margin:2px auto 0}.mtt .today-note{position:absolute;top:2px;transform:translateX(-50%);font:11px/1.2 var(--mono);color:var(--grease);white-space:nowrap;letter-spacing:.06em}.mtt .today-note::after{content:"";display:block;width:1px;height:12px;background:var(--grease);margin:2px auto 0}.mtt .ledger-wrap{min-height:0;overflow:hidden;border-top:1px solid var(--line);display:flex;flex-direction:column}.mtt .ledger{width:100%;border-collapse:collapse;font:11px/1.3 var(--mono);table-layout:fixed}.mtt .ledger thead th{position:sticky;top:0;background:var(--panel-2);text-align:left;font:11px/1.2 var(--mono);letter-spacing:.12em;color:var(--ink-3);text-transform:uppercase;padding:5px 4px;border-bottom:1px solid var(--line-2);z-index:1}.mtt .ledger tbody tr{cursor:pointer;border-bottom:1px solid rgba(170,164,146,.24)}.mtt .ledger tbody tr:hover{background:var(--panel-2)}.mtt .ledger tbody tr[aria-selected="true"]{background:var(--panel-3);box-shadow:inset 2px 0 0 var(--grease)}.mtt .ledger td{padding:3px 4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-variant-numeric:tabular-nums;color:var(--ink-2)}.mtt .ledger td.d{color:var(--ink);font-weight:600}.mtt .ledger td.e{color:var(--grease)}.mtt .ledger .scroll{overflow-y:auto;min-height:0;scrollbar-width:thin}.mtt .arch-right{border-left:1px solid var(--line-2);padding:12px 14px;display:flex;flex-direction:column;gap:10px;background:var(--panel-2);min-height:0;overflow:hidden}.mtt .arch-right h2{margin:0;font:600 13px/1.3 var(--sans)}.mtt .day-detail{border:1px solid var(--line-2);background:var(--panel);padding:8px 10px;display:grid;grid-template-columns:1fr 1fr;gap:5px 10px}.mtt .day-detail .kv .v{font-size:12px}.mtt .day-detail .wide{grid-column:1 / -1;border-top:1px dashed var(--line);padding-top:5px}.mtt .arch-sec{border-top:1px solid var(--line);padding-top:8px;display:flex;flex-direction:column;gap:4px}.mtt .view--delivery{display:grid;grid-template-columns:200px minmax(0,1fr) 310px;min-height:0}.mtt .dlv-left{border-right:1px solid var(--line);padding:12px 14px;display:flex;flex-direction:column;gap:10px;background:var(--panel-2);min-height:0;overflow:hidden}.mtt .dlv-left h2{margin:0;font:600 13px/1.3 var(--sans)}.mtt .steps{list-style:none;margin:2px 0 0;padding:0;display:flex;flex-direction:column;gap:0}.mtt .step{display:grid;grid-template-columns:20px minmax(0,1fr);gap:7px;padding:6px 0;border-top:1px solid var(--line)}.mtt .step:first-child{border-top:0}.mtt .step .sn{font:10px/1.5 var(--mono);color:var(--ink-3);letter-spacing:.08em;padding-top:1px}.mtt .step b{display:block;font:11.5px/1.4 var(--sans);color:var(--ink);font-weight:600;margin-bottom:1px}.mtt .step span{display:block;font:10.5px/1.55 var(--mono);color:var(--ink-2)}.mtt .dlv-main{min-width:0;min-height:0;overflow-y:auto;padding:12px 16px;display:flex;flex-direction:column;gap:10px;scrollbar-width:thin}.mtt .dlv-top{display:flex;align-items:baseline;justify-content:space-between;gap:10px}.mtt .dlv-top .dh{display:flex;align-items:baseline;gap:8px}.mtt .dlv-top b{font:600 13px/1 var(--sans)}.mtt .dlv-top .silk{white-space:nowrap}.mtt .dlv-top .dmeta{font:11px/1 var(--mono);color:var(--ink-3)}.mtt .labelblock{border:1px solid var(--line-2);background:var(--panel-2);padding:9px 11px 10px;position:relative;box-shadow:inset 0 1px 0 rgba(255,255,255,.5)}.mtt .labelblock::before{content:"";position:absolute;left:0;top:0;bottom:0;width:3px;background:var(--tape)}.mtt .labelblock.grease::before{background:var(--grease)}.mtt .labelblock .lb-hd{display:flex;align-items:baseline;justify-content:space-between;gap:10px;margin-bottom:5px}.mtt .labelblock .lb-hd .silk{white-space:nowrap}.mtt .addr{display:flex;align-items:stretch;gap:8px}.mtt .addr code{flex:1;min-width:0;font:11px/1.55 var(--mono);color:var(--ink);word-break:break-all;background:var(--well);border:1px solid var(--line-2);padding:5px 7px;box-shadow:inset 0 1px 2px rgba(0,0,0,.12)}.mtt .addr .btn{align-self:center}.mtt .addr-note{font:11px/1.5 var(--mono);color:var(--ink-3);margin-top:4px}.mtt .spec{display:grid;grid-template-columns:82px minmax(0,1fr) auto;gap:0;border:1px solid var(--line-2);background:var(--panel-2)}.mtt .spec .sk{font:10px/1.5 var(--mono);letter-spacing:.1em;color:var(--ink-3);text-transform:uppercase;padding:4px 8px;border-top:1px solid var(--line);background:var(--panel-3)}.mtt .spec .sv{font:11px/1.6 var(--mono);color:var(--ink);padding:4px 8px;border-top:1px solid var(--line);word-break:break-all}.mtt .spec .sa{padding:2px 6px;border-top:1px solid var(--line);display:flex;align-items:center}.mtt .spec .sk:nth-child(-n+3), .mtt .spec .sv:nth-child(-n+3), .mtt .spec .sa:nth-child(-n+3){border-top:0}.mtt .code{font:11px/1.65 var(--mono);color:var(--ink);background:var(--well);border:1px solid var(--line-2);padding:8px 10px;white-space:pre-wrap;word-break:break-all;margin:0;box-shadow:inset 0 1px 2px rgba(0,0,0,.12);max-height:230px;overflow:auto;scrollbar-width:thin}.mtt .code.json{max-height:150px}.mtt .dlv-right{border-left:1px solid var(--line-2);padding:12px 14px;display:flex;flex-direction:column;gap:10px;background:var(--panel-2);min-height:0;overflow-y:auto;scrollbar-width:thin}.mtt .dlv-right h2{margin:0;font:600 13px/1.3 var(--sans)}.mtt .checklist{display:flex;flex-direction:column;gap:3px;border-top:1px solid var(--line);padding-top:7px}.mtt .check{display:grid;grid-template-columns:16px minmax(0,1fr) auto;gap:6px;align-items:baseline;font:11px/1.5 var(--mono);color:var(--ink-2)}.mtt .check .ck{font:10px/1.5 var(--mono);color:var(--led)}.mtt .check.warn .ck{color:var(--grease)}.mtt .check.warn .cv{color:var(--grease)}.mtt .check .cv{color:var(--ink-2);white-space:nowrap;text-align:right;overflow:hidden;text-overflow:ellipsis}.mtt .check .cn2{color:var(--ink);font-family:var(--sans);font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.mtt .errcodes{border-top:1px solid var(--line);padding-top:7px;display:flex;flex-direction:column;gap:3px}.mtt .errcode{display:grid;grid-template-columns:34px minmax(0,1fr);gap:7px;font:11px/1.5 var(--mono);color:var(--ink-2)}.mtt .errcode b{color:var(--grease);font-weight:600}.mtt .dlv-actions{display:flex;flex-wrap:wrap;gap:4px;border-top:1px solid var(--line);padding-top:8px;margin-top:auto}.mtt .statusbar{height:30px;display:flex;align-items:center;gap:14px;padding:0 14px;background:var(--panel-3);border-top:1px solid var(--line-2);font:11px/1 var(--mono);color:var(--ink-3);letter-spacing:.02em;position:relative;z-index:4}.mtt .statusbar .sb-l{display:flex;align-items:center;gap:7px;white-space:nowrap}.mtt .statusbar .dot{width:7px;height:7px;border-radius:50%;background:var(--led);border:1px solid var(--led)}.mtt .statusbar .dot.off{background:transparent;border-color:var(--ink-3)}.mtt .statusbar .dot.warn{background:var(--grease);border-color:var(--grease)}.mtt .statusbar .sb-hint{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1;color:var(--ink-2)}.mtt .statusbar .sb-hint b{color:var(--ink);font-weight:600}.mtt .statusbar .sb-r{display:flex;align-items:center;gap:10px;white-space:nowrap}.mtt .statusbar .sb-r .sep{color:var(--line-2)}.mtt .toast{position:fixed;left:50%;bottom:44px;transform:translate(-50%,8px);display:flex;align-items:center;gap:9px;background:var(--ink);color:var(--panel-2);padding:8px 14px;font:11.5px/1.3 var(--mono);letter-spacing:.02em;border-left:3px solid var(--grease);box-shadow:0 6px 18px rgba(0,0,0,.28);z-index:60;opacity:0;pointer-events:none;transition:opacity .15s,transform .15s;max-width:min(560px,84vw)}.mtt .toast.show{opacity:1;transform:translate(-50%,0)}.mtt .toast .tdot{width:6px;height:6px;background:var(--grease);border-radius:50%;flex:0 0 6px}\n@media (max-width:1180px){.mtt .view--timeline{grid-template-columns:152px minmax(0,1fr) 288px}.mtt .view--archive{grid-template-columns:184px minmax(0,1fr) 274px}.mtt .view--delivery{grid-template-columns:184px minmax(0,1fr) 282px}.mtt .view--settings .set-grid{grid-template-columns:184px minmax(0,1fr) 274px}.mtt .tp-bar{padding:0 10px}.mtt .tp-cell{padding:0 10px;gap:8px}.mtt .plate{min-width:190px}.mtt .brand-txt small{font-size:10px}.mtt .heads{padding-left:10px;padding-right:8px}.mtt .timeline{padding-left:8px;padding-right:8px}.mtt .take{grid-template-columns:58px 24px 34px minmax(0,1fr) 48px 46px 42px;gap:6px}.mtt .head-row{font-size:11px}\n}\n@media (max-width:1050px){.mtt .view--timeline{grid-template-columns:140px minmax(0,1fr) 246px}.mtt .view--archive{grid-template-columns:166px minmax(0,1fr) 240px}.mtt .view--delivery{grid-template-columns:166px minmax(0,1fr) 246px}.mtt .view--settings .set-grid{grid-template-columns:160px minmax(0,1fr) 238px}.mtt .lamps{grid-template-columns:auto auto;gap:2px 10px}.mtt .rail-meters{gap:10px}.mtt .meter-bar{width:56px}.mtt .rail-live{display:none}.mtt .viewkeys{flex:0 0 auto}.mtt .viewkey{flex:0 0 auto}.mtt .heads-top .silk:first-child{display:none}.mtt .head--main .head-row:nth-child(3), .mtt .head--main .head-row:nth-child(4){display:none}.mtt .head--lat .head-row:nth-child(3){display:none}.mtt .head--take > div > small{display:none}.mtt .head--readers .reader small{display:none}.mtt .head--local .st, .mtt .head--cloud .st{display:none}.mtt .pick-rec{display:none}.mtt .inspector{padding-bottom:14px}.mtt .hybrid-cells span{display:none}.mtt .heads-note{display:none}.mtt .counter{font-size:18px}.mtt .inspector{overflow-y:auto;scrollbar-width:thin}.mtt .take{grid-template-columns:62px 24px 32px minmax(0,1fr) 44px 46px;gap:6px;height:auto;min-height:24px;padding:2px 5px}.mtt .take .tc{display:block}.mtt .timeline{grid-template-rows:34px minmax(0,1.15fr) 10px minmax(132px,1fr)}.mtt .heads{grid-template-rows:34px minmax(0,1.15fr) 10px minmax(132px,1fr)}.mtt .tl-core{grid-template-rows:28px minmax(100px,1fr) 70px 30px 30px}.mtt .heads-core{grid-template-rows:28px minmax(100px,1fr) 70px 30px 30px}.mtt .module .knob-row{gap:3px 8px}\n}\n@container (max-width:900px){.mtt .tp-bar{height:54px}.mtt .plate{min-width:0;padding:5px 9px 5px 7px}.mtt .brand-txt b{font-size:12px}.mtt .brand-txt small{display:none}.mtt .tp-cell{gap:6px}.mtt .key{width:50px;height:38px}.mtt .key .zi{font-size:11px}.mtt .clock b{font-size:16px}.mtt .clock small{display:none}.mtt .tp-pause-wrap{margin-left:8px;padding-left:8px}.mtt .key--pause{width:50px}.mtt .rail-meters .meter:nth-child(2){display:none}.mtt .rail-meters{gap:8px}.mtt .view--timeline{grid-template-columns:132px minmax(0,1fr) 232px}.mtt .view--archive{grid-template-columns:150px minmax(0,1fr) 214px}.mtt .view--delivery{grid-template-columns:152px minmax(0,1fr) 220px}.mtt .view--settings .set-grid{grid-template-columns:minmax(0,1fr) 214px}.mtt .view--settings .set-left{display:none}.mtt .view--settings .modules{grid-template-columns:minmax(0,1fr)}.mtt .timeline{padding:8px}.mtt .heads{padding:8px 6px 8px 8px}.mtt .head .h-title small{display:none}.mtt .heads-top .silk:first-child{display:none}.mtt .head--main .h-title .idx{display:none}.mtt .heads-core{grid-template-rows:26px minmax(96px,1fr) 64px 28px 28px}.mtt .tl-core{grid-template-rows:26px minmax(96px,1fr) 64px 28px 28px}.mtt .timeline{grid-template-rows:32px minmax(0,1.12fr) 8px minmax(126px,1fr)}.mtt .heads{grid-template-rows:32px minmax(0,1.12fr) 8px minmax(126px,1fr)}.mtt .clip .no, .mtt .clip .wbar, .mtt .clip .cache{display:none}.mtt .clip{padding:4px 2px}.mtt .clip .role{font-size:11px}.mtt .take{grid-template-columns:60px 24px 30px minmax(0,1fr) 42px 44px;gap:5px;font-size:12px}.mtt .take .td{display:none}.mtt .takes-hd .th-meta{display:none}.mtt .pick-text{font-size:12px;-webkit-line-clamp:2}.mtt .pick-meta{grid-template-columns:1fr 1fr}.mtt .ins-hd .cn{display:none}.mtt .inspector{padding:8px 9px 8px 10px;gap:7px}.mtt .module .knob-wrap{min-width:56px}.mtt .tl-meta{display:none}.mtt .statusbar .sb-r .opt{display:none}.mtt .peak-note, .mtt .today-note{font-size:11px}.mtt .arch-main{padding:8px}.mtt .day .dn{font-size:11px}.mtt .daytape{height:64px}.mtt .set-left, .mtt .apply, .mtt .arch-left, .mtt .arch-right, .mtt .dlv-left, .mtt .dlv-right{padding:9px 10px}.mtt .ledger{font-size:11px}.mtt .ledger th:nth-child(6), .mtt .ledger td:nth-child(6){display:none}.mtt .ledger th:nth-child(1){width:86px!important}.mtt .ledger th:nth-child(2), .mtt .ledger th:nth-child(3){width:46px!important}.mtt .ledger th:nth-child(4){width:74px!important}.mtt .ledger th:nth-child(5){width:92px!important}.mtt .code{font-size:11px}\n}\n@container (max-width:760px){.mtt .view--timeline{grid-template-columns:96px minmax(0,1fr)}.mtt .inspector{grid-column:1 / -1;display:none}.mtt .view--timeline{grid-template-rows:minmax(0,1fr) 0}\n}\n@media (prefers-reduced-motion:reduce){.mtt *, .mtt *::before, .mtt *::after{animation-duration:.001ms !important;animation-iteration-count:1 !important;transition-duration:.001ms !important;scroll-behavior:auto !important}.mtt .reel .rot{animation:none !important}\n}\n@media print{.mtt{height:auto;overflow:visible;background:#fff}.mtt .deck{height:auto;display:block}.mtt .transport, .mtt .statusbar, .mtt .toast, .mtt .viewkeys{display:none !important}.mtt .view{display:block !important}.mtt .view[hidden]{display:block !important}.mtt .bench{display:block}.mtt .timeline, .mtt .inspector, .mtt .heads{height:auto}\n}\n\n.mtt{box-sizing:border-box;height:100%;min-height:0;padding-top:var(--dsh-frame-top-clearance,0px);background:var(--panel);position:relative;overflow:hidden}\n/* deck \u7684\u9690\u5F0F\u5217\u9ED8\u8BA4\u6309 max-content \u6491\uFF08\u6574\u9875\u65F6\u65E0\u6240\u8C13\uFF0C\u9762\u677F\u91CC\u4F1A\u88AB\u62D6\u7A84\uFF09\uFF1A\u9489\u6210 1fr\uFF0C\u5141\u8BB8\u5185\u90E8\u6536\u7F29 */\n.mtt .deck{height:100%;grid-template-columns:minmax(0,1fr)}\n.mtt .bench,.mtt .view{min-width:0}\n.mtt .arch-main{grid-template-columns:minmax(0,1fr)}\n.mtt .toast{position:fixed}\n.mtt{container-type:inline-size;background:var(--panel)}\n\n/* port adjustments\n   mock \u662F\u6574\u9875\uFF0C\u63D2\u4EF6\u662F\u9762\u677F\uFF1A\u9762\u677F\u5BBD\u5EA6\u53EF\u4EE5\u5C0F\u4E8E\u89C6\u53E3\uFF08DSH \u4FA7\u680F\u5360\u4F4D\uFF09\uFF0C\u6240\u4EE5\n   deck.css \u91CC 1180 / 1050 \u65AD\u70B9\uFF08\u4ECD\u662F\u89C6\u53E3 media query\uFF09\u9700\u8981\u6309\u300C\u9762\u677F\u5BBD\u5EA6\u300D\u8865\u4E00\u4EFD\u3002\n   \u53EA\u8865\u9762\u677F\u9002\u914D\u5FC5\u9700\u7684\u4E24\u7EC4\uFF1A\u22641050 \u7684\u5185\u90E8\u6EDA\u52A8/\u9690\u85CF\u9879\uFF0C901\u20131050 \u7684\u56DB\u57DF\u5217\u5BBD\u3002 */\n@container (max-width:1050px){\n  .mtt .inspector{overflow-y:auto;overflow-x:hidden;scrollbar-width:thin}\n  .mtt .head-window, .mtt .heads-note, .mtt .rail-live{display:none}\n  .mtt .rail-meters{gap:10px}\n  .mtt .meter-bar{width:56px}\n}\n@container (min-width:901px) and (max-width:1050px){\n  .mtt .view--timeline{grid-template-columns:140px minmax(0,1fr) 246px}\n  .mtt .view--archive{grid-template-columns:166px minmax(0,1fr) 240px}\n  .mtt .view--delivery{grid-template-columns:166px minmax(0,1fr) 246px}\n  .mtt .view--settings .set-grid{grid-template-columns:160px minmax(0,1fr) 238px}\n}\n\n/* Phase 2 (v0.4.0) layout & controls */\n.mtt .deck{display:flex;flex-direction:column;height:100%}\n.mtt .tp-stack{flex:none}\n.mtt .bench{flex:1;min-height:0;display:grid}\n.mtt .statusbar{flex:none}\n\n.mtt .setup-banner{display:flex;align-items:center;gap:10px;padding:6px 14px;background:var(--well);border-bottom:1px solid var(--line-2);font:11.5px/1.4 var(--sans);color:var(--ink)}\n.mtt .setup-banner.is-warn{background:rgba(177,58,34,.11);border-bottom-color:var(--grease)}\n.mtt .setup-banner .sb-dot{width:7px;height:7px;border-radius:50%;background:var(--grease);flex:none}\n.mtt .setup-banner .sb-txt{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}\n.mtt .setup-banner .sb-acts{display:flex;gap:6px;flex:none}\n\n.mtt .mtt-modal-backdrop{position:fixed;inset:0;background:rgba(20,24,22,.56);z-index:70;display:grid;place-items:center;padding:16px}\n.mtt .mtt-drawer{width:min(820px,96vw);max-height:88vh;background:var(--panel-2);border:1px solid var(--ink);box-shadow:0 18px 42px rgba(0,0,0,.38);display:flex;flex-direction:column;border-radius:var(--r)}\n.mtt .drawer-hd{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 14px;background:var(--panel-3);border-bottom:1px solid var(--line-2)}\n.mtt .drawer-body{overflow-y:auto;padding:12px 14px;display:flex;flex-direction:column;gap:12px;scrollbar-width:thin}\n.mtt .drawer-sec{border:1px solid var(--line-2);background:var(--panel);padding:10px 12px;display:flex;flex-direction:column;gap:8px;border-radius:var(--r)}\n.mtt .ds-hd{display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap}\n.mtt .detect-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px 10px}\n.mtt .dg-item{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:4px 6px;background:var(--panel-2);border:1px solid var(--line);font:11px/1.4 var(--mono)}\n.mtt .setup-prog{height:6px;background:var(--well);border:1px solid var(--line-2);overflow:hidden}\n.mtt .setup-prog i{display:block;height:100%;background:var(--tape-3);transition:width .2s}\n.mtt .setup-log{max-height:180px;min-height:80px;font-size:11px}\n.mtt .doctor-list{display:flex;flex-direction:column;gap:4px}\n.mtt .doc-row{display:grid;grid-template-columns:18px 130px minmax(0,1fr);gap:8px;align-items:start;padding:4px 6px;border-top:1px solid rgba(170,164,146,.28);font:11px/1.45 var(--mono)}\n.mtt .doc-row.pass .doc-badge{color:var(--led);font-weight:700}\n.mtt .doc-row.warn .doc-badge{color:#a86b15;font-weight:700}\n.mtt .doc-row.fail .doc-badge{color:var(--grease);font-weight:700}\n.mtt .doc-lbl{color:var(--ink);font-family:var(--sans)}\n.mtt .doc-msg{display:flex;flex-direction:column;gap:2px;color:var(--ink-2)}\n.mtt .doc-msg small{color:var(--ink-3)}\n\n.mtt .mod-group-hd{grid-column:1 / -1;display:flex;align-items:center;justify-content:space-between;gap:8px;padding:6px 2px 3px;margin-top:4px;border-bottom:1px solid var(--line-2)}\n.mtt .mod-group-hd:first-child{margin-top:0}\n.mtt .module--wide{grid-column:1 / -1}\n.mtt .mod-group-nav{margin-top:5px}\n.mtt .mgn-title{font:600 10.5px/1.4 var(--sans);color:var(--ink-3);letter-spacing:.04em;padding:2px 0}\n.mtt .collapsed-note{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:6px 4px;font:11px/1.4 var(--mono);color:var(--ink-3)}\n.mtt .mimo-conn{margin-top:4px;padding-top:4px;border-top:1px dashed var(--line)}\n.mtt .local-ref-slot{border-top:1px dashed var(--line);padding-top:6px;margin-top:4px}\n.mtt .ref-picked-note{font-size:11px;color:var(--ink-2);padding:3px 6px;background:var(--panel);border:1px solid var(--line)}\n\n.mtt .vp-bar{display:flex;flex-direction:column;gap:6px;padding-bottom:8px;margin-bottom:8px;border-bottom:1px solid var(--line)}\n.mtt .vp-chips{display:flex;flex-wrap:wrap;gap:5px}\n.mtt .vp-chip-wrap{display:inline-flex;align-items:stretch}\n.mtt .vp-del{border-left:0;color:var(--grease);padding:1px 5px}\n.mtt .vp-del:hover{background:var(--grease-soft)}\n.mtt .vp-save{display:flex;gap:6px;align-items:center}\n.mtt .synth-cols{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;align-items:start}\n.mtt .role-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}\n.mtt .role-card{border:1px solid var(--line);background:var(--panel);padding:8px 10px;border-radius:var(--r)}\n.mtt .role-card-hd{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:6px}\n.mtt .role-card-hd b{font:600 12px/1 var(--sans)}\n.mtt .role-card-hd b i{font:10px/1 var(--mono);font-style:normal;color:var(--ink-3);margin-left:4px}\n\n.mtt .preview-box{margin-top:8px;border:1px solid var(--line-2);background:var(--panel);padding:8px 10px;display:flex;flex-direction:column;gap:6px;border-radius:var(--r)}\n.mtt .pv-hd{display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap}\n.mtt .pv-bar{display:flex;align-items:center;gap:10px;flex-wrap:wrap}\n.mtt .pv-meta{font-size:11px;color:var(--ink-2);margin-left:auto}\n.mtt .pv-audio{width:100%;height:32px}\n\n.mtt .ref-lib{display:flex;flex-direction:column;gap:8px}\n.mtt .ref-list{display:flex;flex-direction:column;gap:6px}\n.mtt .ref-row{border:1px solid var(--line-2);background:var(--panel);padding:7px 9px;display:flex;flex-direction:column;gap:5px;border-radius:var(--r)}\n.mtt .ref-row.is-missing{border-color:var(--grease)}\n.mtt .ref-top{display:flex;align-items:center;gap:6px;flex-wrap:wrap}\n.mtt .ref-meta{font-size:11px;color:var(--ink-3)}\n.mtt .ref-acts{margin-left:auto;display:flex;gap:4px}\n.mtt .ref-text{font:11px/1.5 var(--mono);color:var(--ink-2)}\n.mtt .ref-warns{display:flex;flex-wrap:wrap;gap:4px}\n.mtt .ref-edit{display:flex;flex-direction:column;gap:5px}\n.mtt .ref-audio{width:100%;height:30px}\n.mtt .ref-clipper{border:1px solid var(--line-2);background:var(--panel);padding:8px 10px;display:flex;flex-direction:column;gap:7px;margin-top:4px}\n.mtt .ref-clip-hd{display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap}\n.mtt .ref-wave-well{position:relative;background:var(--well);border:1px solid var(--line-2);padding:4px 6px;min-height:72px;box-shadow:inset 0 1px 2px rgba(0,0,0,.1)}\n.mtt .ref-wave-msg{font:11px/1.4 var(--mono);color:var(--ink-3);padding:18px 8px;text-align:center}\n.mtt .ref-clip-bar{display:flex;flex-wrap:wrap;align-items:center;gap:8px}\n.mtt .ref-sec-inp{width:58px;padding:2px 5px;font-size:11px;font-family:var(--mono)}\n.mtt .ref-upload{border:1px dashed var(--line-2);background:var(--panel);padding:8px 10px;display:flex;flex-direction:column;gap:6px}\n.mtt .ref-up-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}\n\n.mtt .lex-box{display:flex;flex-direction:column;gap:8px}\n.mtt .lex-presets{display:flex;flex-wrap:wrap;align-items:center;gap:5px}\n.mtt .lex-list{display:flex;flex-direction:column;gap:6px}\n.mtt .lex-row{border:1px solid var(--line-2);background:var(--panel);padding:6px 8px;display:flex;flex-direction:column;gap:5px}\n.mtt .lex-row.is-off{opacity:.62}\n.mtt .lex-row-top{display:flex;align-items:center;gap:5px;flex-wrap:wrap}\n.mtt .lex-row-top > input.input{flex:1;min-width:120px}\n.mtt .lex-row-pair{display:grid;grid-template-columns:minmax(0,1fr) auto minmax(0,1fr);gap:6px}\n.mtt .lex-debug{border:1px solid var(--line-2);background:var(--panel);padding:8px 10px;display:flex;flex-direction:column;gap:6px}\n.mtt .lex-result{display:flex;flex-direction:column;gap:6px;padding-top:4px;border-top:1px dashed var(--line)}\n.mtt .lex-segs{display:flex;flex-wrap:wrap;gap:5px}\n.mtt .lex-seg{display:inline-flex;align-items:center;gap:5px;background:var(--panel-2);border:1px solid var(--line);padding:2px 6px;font:11.5px/1.4 var(--sans);border-radius:var(--r)}\n\n.mtt .qr-grid{display:flex;flex-wrap:wrap;gap:10px}\n.mtt .qr-card{border:1px solid var(--line-2);background:var(--panel-2);padding:8px 10px;display:flex;flex-direction:column;align-items:center;gap:6px;min-width:168px}\n.mtt .qr-hd{width:100%;display:flex;align-items:center;justify-content:space-between;gap:6px;font:600 11.5px/1.2 var(--sans)}\n.mtt .qr-thumb{width:126px;height:126px;cursor:zoom-in;border:1px solid var(--line);background:#f6f3eb;display:block;padding:0}\n.mtt .qr-thumb svg{width:100%;height:100%;display:block}\n.mtt .qr-acts{display:flex;gap:6px}\n.mtt .mtt-qr-modal{width:min(360px,92vw);background:var(--panel-2);border:1px solid var(--ink);padding:12px;display:flex;flex-direction:column;align-items:center;gap:10px}\n.mtt .qr-zoom-svg{width:260px;height:260px;border:1px solid var(--line-2);background:#f6f3eb}\n.mtt .qr-zoom-svg svg{width:100%;height:100%;display:block}\n.mtt .qr-zoom-url{width:100%;word-break:break-all;font:11px/1.4 var(--mono);background:var(--well);border:1px solid var(--line);padding:6px 8px}\n\n@container (max-width:900px){\n  .mtt .role-grid, .mtt .detect-grid, .mtt .ref-up-grid, .mtt .lex-row-pair, .mtt .synth-cols{grid-template-columns:minmax(0,1fr)}\n  .mtt .doc-row{grid-template-columns:18px minmax(0,1fr)}\n  .mtt .doc-msg{grid-column:2}\n}\n\n/* Phase 3 (v0.5.0) HTTPS access & OpenAI server controls */\n.mtt .https-card{display:flex;flex-direction:column;gap:8px}\n.mtt .https-tabs{display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap}\n.mtt .https-pane{display:flex;flex-direction:column;gap:7px;padding-top:4px;border-top:1px dashed var(--line)}\n.mtt .https-bar{display:flex;align-items:center;gap:8px;flex-wrap:wrap}\n.mtt .https-acts{display:flex;align-items:center;gap:6px;flex-wrap:wrap}\n.mtt .https-tool-pill{margin-left:auto;font-size:11px;color:var(--ink-2)}\n.mtt .https-status-row{display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;font-size:11px;color:var(--ink-2)}\n.mtt .https-warn{font:11px/1.55 var(--mono);color:var(--ink);background:var(--grease-soft);border:1px solid var(--grease);padding:5px 8px;border-radius:var(--r)}\n.mtt .https-pitfalls{font:11px/1.55 var(--mono);color:var(--ink);background:var(--well);border-left:3px solid var(--grease);padding:6px 8px}\n.mtt .https-err{font-size:11px;color:var(--grease)}\n.mtt .voicemap-box{display:flex;flex-direction:column;gap:5px;margin-top:8px;padding-top:8px;border-top:1px dashed var(--line)}\n.mtt .voicemap-table{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px 12px}\n.mtt .voicemap-row{display:grid;grid-template-columns:54px 10px minmax(0,1fr) 88px auto;gap:4px;align-items:center;min-width:0}\n.mtt .voicemap-add{grid-column:1 / -1;display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr) auto;gap:6px;align-items:center;margin-top:3px;padding-top:6px;border-top:1px dashed var(--line)}\n.mtt .vm-key{font-size:11px;font-weight:600;color:var(--ink);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}\n.mtt .vm-quick{font-size:11px;padding:3px 4px}\n.mtt .openai-card .spec{grid-template-columns:86px minmax(0,1fr) auto}\n\n/* Gatekeeper polish: prevent grid/flex overflow & label clipping */\n.mtt .head--take{padding:0}\n.mtt .head--take .counter{font-size:18px;line-height:1}\n.mtt .head--take > div > small{margin-top:1px;line-height:1.15}\n.mtt .knob-row{align-items:flex-start}\n.mtt .knob-row > .field{min-width:120px}\n.mtt .field-two-col{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:8px}\n.mtt .field .fl{min-width:0;flex-wrap:wrap;gap:2px 6px;white-space:normal}\n.mtt .field .fl i{min-width:0;max-width:100%;overflow:hidden;text-overflow:ellipsis}\n.mtt .addr > .input{flex:1 1 0%;min-width:0;width:auto}\n.mtt .addr > .btn{flex:0 0 auto}\n.mtt .apply-sum .rowx > span{flex:0 0 auto}\n.mtt .apply-sum .rowx > b{min-width:0;overflow:hidden;text-overflow:ellipsis}\n@container (max-width:900px){\n  .mtt .field-two-col{grid-template-columns:minmax(0,1fr)}\n  .mtt .voicemap-table{grid-template-columns:minmax(0,1fr)}\n  .mtt .voicemap-row, .mtt .voicemap-add{grid-template-columns:minmax(0,1fr)}\n}\n';

// client/timeline-math.js
function buildTimeline(recent) {
  const rows = (Array.isArray(recent) ? recent : []).filter(Boolean).map((r3) => ({
    at: num(r3.at),
    chars: num(r3.chars),
    segments: Math.max(1, num(r3.segments, 1)),
    bytes: num(r3.bytes),
    audioSeconds: Math.max(0, num(r3.audioSeconds)),
    latencyMs: num(r3.latencyMs),
    cacheHit: Boolean(r3.cacheHit),
    role: ROLE_CN[r3.role] ? r3.role : "narrator",
    source: sourceOf(r3).key,
    sourceLabel: sourceOf(r3).label,
    error: Boolean(r3.error),
    client: r3.client || "",
    text: r3.text || "",
    format: r3.format || ""
  }));
  rows.sort((a3, b2) => a3.at - b2.at);
  const totalAudio = rows.reduce((a3, r3) => a3 + r3.audioSeconds, 0);
  const totalChars = rows.reduce((a3, r3) => a3 + r3.chars, 0);
  let weights = rows.map((r3) => r3.audioSeconds);
  if (rows.length && totalAudio <= 0) weights = rows.map(() => 1);
  else if (rows.length) {
    const fill = Math.max(totalAudio * 0.01, 0.05);
    weights = weights.map((w2) => w2 > 0 ? w2 : fill);
  }
  const wSum = weights.reduce((a3, w2) => a3 + w2, 0) || 1;
  const maxChars = Math.max(1, ...rows.map((r3) => r3.chars));
  const maxLatency = Math.max(0, ...rows.map((r3) => r3.latencyMs));
  const latScale = Math.max(1e3, Math.ceil(maxLatency / 1e3) * 1e3);
  const okLat = rows.filter((r3) => !r3.error && r3.latencyMs > 0);
  const avgLatency = okLat.length ? okLat.reduce((a3, r3) => a3 + r3.latencyMs, 0) / okLat.length : 0;
  const cacheHits = rows.filter((r3) => r3.cacheHit).length;
  let acc = 0;
  const list = rows.map((r3, i3) => {
    const wPct = weights[i3] / wSum * 100;
    const startPct = acc;
    acc += wPct;
    const startSec = totalAudio > 0 ? startPct / 100 * totalAudio : 0;
    const endSec = totalAudio > 0 ? acc / 100 * totalAudio : 0;
    return {
      ...r3,
      index: i3,
      sig: `${r3.text}|${r3.chars}|${r3.role}|${r3.latencyMs}|${r3.audioSeconds}|${r3.segments}`,
      wPct,
      startPct,
      endPct: acc,
      startSec,
      endSec,
      wbar: clamp(r3.chars / maxChars * 100, 8, 100),
      latPct: clamp(r3.latencyMs / latScale * 100, 4, 100)
    };
  });
  return { list, totalAudio, totalChars, maxChars, maxLatency, latScale, avgLatency, cacheHits };
}
function rulerTicks(total) {
  if (!(total > 0)) return { labelStep: 0, minorStep: 0, ticks: [] };
  const steps = [1, 2, 5, 10, 15, 30, 60, 120, 300, 600, 900, 1800];
  const nice = (raw) => {
    for (const s3 of steps) if (s3 >= raw) return s3;
    return 1800;
  };
  const labelStep = nice(total / 8);
  const minorStep = Math.max(1, Math.round(labelStep / 6));
  const ticks = [];
  for (let t3 = 0; t3 <= total + 1e-6; t3 += minorStep) {
    const isMajor = Math.abs(t3 / labelStep - Math.round(t3 / labelStep)) < 1e-6;
    ticks.push({ t: t3, pct: t3 / total * 100, major: isMajor });
    if (ticks.length > 400) break;
  }
  return { labelStep, minorStep, ticks };
}
function sortedDays(days) {
  return (Array.isArray(days) ? days : []).filter(Boolean).slice().sort((a3, b2) => String(a3.day) < String(b2.day) ? -1 : String(a3.day) > String(b2.day) ? 1 : 0);
}

// client/components/ArchiveView.jsx
var import_react2 = __toESM(require("react"), 1);

// client/components/Primitives.jsx
var import_react = __toESM(require("react"), 1);
var KNOB_TICKS = (() => {
  const out = [];
  const cx = 24;
  const cy = 24;
  for (let i3 = 0; i3 <= 10; i3++) {
    const a3 = (-135 + 270 * (i3 / 10)) * Math.PI / 180;
    out.push({
      x1: cx + 17.2 * Math.sin(a3),
      y1: cy - 17.2 * Math.cos(a3),
      x2: cx + 21.2 * Math.sin(a3),
      y2: cy - 21.2 * Math.cos(a3)
    });
  }
  return out;
})();
function KnobTicks() {
  return /* @__PURE__ */ import_react.default.createElement("svg", { className: "knob-ticks", viewBox: "0 0 48 48", "aria-hidden": "true" }, KNOB_TICKS.map((t3, i3) => /* @__PURE__ */ import_react.default.createElement(
    "line",
    {
      key: i3,
      x1: t3.x1.toFixed(2),
      y1: t3.y1.toFixed(2),
      x2: t3.x2.toFixed(2),
      y2: t3.y2.toFixed(2),
      stroke: "#aaa492",
      strokeWidth: 1
    }
  )));
}
function Knob({ label, value, min, max, step, unit, dirty, onChange, ariaLabel }) {
  const v2 = clamp(num(value, min), min, max);
  const ratio = max > min ? (v2 - min) / (max - min) : 0;
  const angle = -135 + 270 * ratio;
  const drag = (0, import_react.useRef)(null);
  const commit = (next) => {
    const snapped = clamp(Math.round(next / step) * step, min, max);
    onChange(snapped);
  };
  const onPointerDown = (e3) => {
    if (e3.pointerType === "mouse" && e3.button !== 0) return;
    e3.preventDefault();
    try {
      e3.currentTarget.focus();
    } catch {
    }
    try {
      e3.currentTarget.setPointerCapture(e3.pointerId);
    } catch {
    }
    drag.current = { y: e3.clientY, value: v2 };
  };
  const onPointerMove = (e3) => {
    if (!drag.current) return;
    const range = max - min;
    commit(drag.current.value + (drag.current.y - e3.clientY) / 120 * range);
  };
  const endDrag = () => {
    drag.current = null;
  };
  const onKeyDown = (e3) => {
    let next = null;
    if (e3.key === "ArrowUp" || e3.key === "ArrowRight") next = v2 + step;
    else if (e3.key === "ArrowDown" || e3.key === "ArrowLeft") next = v2 - step;
    else if (e3.key === "PageUp") next = v2 + step * 5;
    else if (e3.key === "PageDown") next = v2 - step * 5;
    else if (e3.key === "Home") next = min;
    else if (e3.key === "End") next = max;
    if (next == null) return;
    e3.preventDefault();
    e3.stopPropagation();
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
      "aria-valuenow": v2,
      title: `${label} \xB7 ${v2}${unit || ""}\uFF08\u62D6\u52A8\u6216\u65B9\u5411\u952E\uFF09`,
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
  )), /* @__PURE__ */ import_react.default.createElement("output", { className: "knob-val" }, String(v2)));
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
      onChange: (e3) => onChange(e3.target.value)
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
      onChange: (e3) => onChange(e3.target.value)
    }
  );
}
function HeadRow({ k, v: v2 }) {
  return /* @__PURE__ */ import_react.default.createElement("div", { className: "head-row" }, /* @__PURE__ */ import_react.default.createElement("span", null, k), v2);
}
function Rowx({ k, v: v2, title }) {
  return /* @__PURE__ */ import_react.default.createElement("div", { className: "rowx" }, /* @__PURE__ */ import_react.default.createElement("span", null, k), /* @__PURE__ */ import_react.default.createElement("b", { title: title || void 0 }, v2));
}
var VU_GEOM = (() => {
  const cx = 100;
  const cy = 90;
  const R = 62;
  const pt = (a3, r3) => [cx + r3 * Math.sin(a3 * Math.PI / 180), cy - r3 * Math.cos(a3 * Math.PI / 180)];
  const a0 = -62;
  const a1 = 62;
  const [x0, y0] = pt(a0, R);
  const [x1, y1] = pt(a1, R);
  const arc = `M ${x0.toFixed(2)} ${y0.toFixed(2)} A ${R} ${R} 0 0 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`;
  const [rx, ry] = pt(a0 + 124 * 0.86, R);
  const redArc = `M ${rx.toFixed(2)} ${ry.toFixed(2)} A ${R} ${R} 0 0 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`;
  const ticks = [];
  for (let v2 = 0; v2 <= 100; v2 += 5) {
    const a3 = a0 + 124 * (v2 / 100);
    const [ix, iy] = pt(a3, R - 6);
    const [ox, oy] = pt(a3, R);
    ticks.push({ ix: ix.toFixed(2), iy: iy.toFixed(2), ox: ox.toFixed(2), oy: oy.toFixed(2), major: v2 % 25 === 0 });
  }
  return { cx, cy, R, arc, redArc, ticks };
})();
function VuTable({ ratio }) {
  const r3 = clamp(num(ratio), 0, 1);
  const angle = -62 + 124 * r3;
  return /* @__PURE__ */ import_react.default.createElement("svg", { viewBox: "0 0 200 100", role: "img", "aria-label": `\u7F13\u5B58\u5360\u7528 ${Math.round(r3 * 100)}%` }, /* @__PURE__ */ import_react.default.createElement("rect", { x: 0.5, y: 0.5, width: 199, height: 99, fill: "#f0ece3", stroke: "#c9c3b3" }), /* @__PURE__ */ import_react.default.createElement("path", { d: VU_GEOM.arc, fill: "none", stroke: "#4b524c", strokeWidth: 1.2 }), /* @__PURE__ */ import_react.default.createElement("path", { d: VU_GEOM.redArc, fill: "none", stroke: "#b13a22", strokeWidth: 2.4 }), VU_GEOM.ticks.map((t3, i3) => /* @__PURE__ */ import_react.default.createElement(
    "line",
    {
      key: i3,
      x1: t3.ix,
      y1: t3.iy,
      x2: t3.ox,
      y2: t3.oy,
      stroke: "#242a26",
      strokeWidth: t3.major ? 1.1 : 0.7,
      opacity: t3.major ? 0.85 : 0.5
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
function ArchiveView({ live, range, setRange, selectedDay, onSelectDay, onExportCsv, onResetMetrics }) {
  const [confirmReset, setConfirmReset] = (0, import_react2.useState)(false);
  const totals = live?.totals || {};
  const lat = live?.latency || {};
  const asc = (0, import_react2.useMemo)(() => sortedDays(live?.days), [live]);
  const days = range === 30 ? asc.slice(-30) : asc.slice(-7);
  const sumSec = days.reduce((a3, d3) => a3 + num(d3.seconds), 0);
  const sel = days.find((d3) => d3.day === selectedDay) || days[days.length - 1] || null;
  const todayKey = todayKeyUTC();
  const n3 = days.length;
  const widths = days.map((d3) => sumSec > 0 ? num(d3.seconds) / sumSec * 100 : 100 / Math.max(1, n3));
  const lefts = [];
  let acc = 0;
  widths.forEach((w2) => {
    lefts.push(acc);
    acc += w2;
  });
  const midOf = (i3) => lefts[i3] + widths[i3] / 2;
  const notes = [];
  if (n3) {
    const peakIdx = days.reduce((best, d3, i3) => num(d3.seconds) > num(days[best].seconds) ? i3 : best, 0);
    const todayIdx = days.findIndex((d3) => d3.day === todayKey);
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
  days.forEach((d3, i3) => {
    const day = String(d3.day || "");
    if (i3 === 0 || day.endsWith("-01")) {
      axis.push(/* @__PURE__ */ import_react2.default.createElement("span", { key: `mt-${i3}`, className: "mtick", style: { left: `${lefts[i3].toFixed(3)}%` } }));
      axis.push(
        /* @__PURE__ */ import_react2.default.createElement(
          "span",
          {
            key: `ml-${i3}`,
            className: "mlabel",
            style: { left: `${lefts[i3].toFixed(3)}%`, transform: i3 === 0 ? "none" : void 0 }
          },
          `${parseInt(day.slice(5, 7), 10)}\u6708`
        )
      );
    }
  });
  const rangeRequests = days.reduce((a3, d3) => a3 + num(d3.requests), 0);
  const rangeErrors = days.filter((d3) => num(d3.errors) > 0).length;
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
  )), /* @__PURE__ */ import_react2.default.createElement("div", { className: "totals", id: "totalsList" }, leftTotals.map(([k, v2]) => /* @__PURE__ */ import_react2.default.createElement("div", { key: k, className: "trow" }, /* @__PURE__ */ import_react2.default.createElement("span", null, k), /* @__PURE__ */ import_react2.default.createElement("b", null, v2)))), /* @__PURE__ */ import_react2.default.createElement("div", { className: "foot" }, /* @__PURE__ */ import_react2.default.createElement("button", { className: "btn", type: "button", "data-action": "export-csv", onClick: onExportCsv }, "\u5BFC\u51FA CSV \xB7 \u65E5\u8868"), onResetMetrics ? confirmReset ? /* @__PURE__ */ import_react2.default.createElement("div", { style: { display: "flex", gap: 4 } }, /* @__PURE__ */ import_react2.default.createElement(
    "button",
    {
      className: "btn btn--sm btn--tape",
      type: "button",
      onClick: () => {
        setConfirmReset(false);
        onResetMetrics();
      }
    },
    "\u786E\u8BA4\u6E05\u7A7A\u5F52\u6863"
  ), /* @__PURE__ */ import_react2.default.createElement("button", { className: "btn btn--sm", type: "button", onClick: () => setConfirmReset(false) }, "\u53D6\u6D88")) : /* @__PURE__ */ import_react2.default.createElement("button", { className: "btn btn--sm", type: "button", onClick: () => setConfirmReset(true) }, "\u6E05\u7A7A\u5DE5\u7A0B\u53F2") : null, /* @__PURE__ */ import_react2.default.createElement("p", { className: "hint", style: { margin: 0 } }, "\u7D2F\u8BA1\u5DF2\u6301\u4E45\u5316\u81F3 metrics.json\uFF08\u4FDD\u7559 365 \u5929\uFF0C\u91CD\u542F\u4E0D\u4E22\uFF09\uFF1B\u65E5\u5E26\u6309 UTC \u81EA\u7136\u65E5\u7EDF\u8BA1\u3002"))), /* @__PURE__ */ import_react2.default.createElement("div", { className: "arch-main" }, /* @__PURE__ */ import_react2.default.createElement("div", { className: "arch-top" }, /* @__PURE__ */ import_react2.default.createElement("div", { className: "ah" }, /* @__PURE__ */ import_react2.default.createElement("span", { className: "silk" }, "DAILY TAPE"), /* @__PURE__ */ import_react2.default.createElement("b", null, "\u538B\u7F29\u65E5\u5E26"), /* @__PURE__ */ import_react2.default.createElement("span", { className: "silk" }, `${n3} \u65E5 / ${rangeLabel}`)), /* @__PURE__ */ import_react2.default.createElement("div", { className: "ameta" }, n3 ? `${String(days[0].day).slice(5)} \u2192 ${String(days[n3 - 1].day).slice(5)} \xB7 \u4E00\u5929\u4E00\u683C \xB7 \u5BBD\u5EA6 = \u5F53\u65E5\u5408\u6210\u97F3\u9891\u79D2\u6570` : "\u8FD8\u6CA1\u6709\u8DE8\u5929\u8BB0\u5F55 \xB7 \u4EA7\u751F\u8DE8\u5929\u6D41\u91CF\u540E\u8FD9\u91CC\u4F1A\u51FA\u73B0\u538B\u7F29\u65E5\u5E26")), /* @__PURE__ */ import_react2.default.createElement("div", { className: "daytape-wrap" }, notes, /* @__PURE__ */ import_react2.default.createElement("div", { className: "daytape", "aria-label": `${rangeLabel}\u538B\u7F29\u65E5\u5E26` }, days.map((d3, i3) => /* @__PURE__ */ import_react2.default.createElement(
    "button",
    {
      key: d3.day,
      className: `day${d3.day === todayKey ? " today" : ""}`,
      type: "button",
      "data-day": d3.day,
      "aria-selected": String(Boolean(sel) && d3.day === sel.day),
      style: { width: `${widths[i3].toFixed(3)}%` },
      title: `${d3.day} \xB7 ${fmtInt(d3.requests)} \u8BF7\u6C42 \xB7 ${fmtInt(d3.segments)} \u6BB5 \xB7 ${hm(d3.seconds)} \xB7 ${fmtInt(d3.chars)} \u5B57${num(d3.errors) ? ` \xB7 \u9519\u8BEF ${num(d3.errors)}` : ""}`,
      onClick: () => onSelectDay(d3.day)
    },
    /* @__PURE__ */ import_react2.default.createElement("span", { className: "dn" }, range === 30 ? String(d3.day).slice(8) : String(d3.day).slice(5)),
    num(d3.errors) ? /* @__PURE__ */ import_react2.default.createElement("span", { className: "err", "aria-hidden": "true" }) : null
  ))), /* @__PURE__ */ import_react2.default.createElement("div", { className: "day-axis" }, axis)), /* @__PURE__ */ import_react2.default.createElement("div", { className: "ledger-wrap" }, /* @__PURE__ */ import_react2.default.createElement("div", { className: "scroll" }, /* @__PURE__ */ import_react2.default.createElement("table", { className: "ledger", id: "ledger" }, /* @__PURE__ */ import_react2.default.createElement("thead", null, /* @__PURE__ */ import_react2.default.createElement("tr", null, /* @__PURE__ */ import_react2.default.createElement("th", { style: { width: 96 } }, "\u65E5\u671F"), /* @__PURE__ */ import_react2.default.createElement("th", { style: { width: 64 } }, "\u8BF7\u6C42"), /* @__PURE__ */ import_react2.default.createElement("th", { style: { width: 64 } }, "\u6BB5"), /* @__PURE__ */ import_react2.default.createElement("th", { style: { width: 96 } }, "\u5408\u6210\u65F6\u957F"), /* @__PURE__ */ import_react2.default.createElement("th", { style: { width: 110 } }, "\u5B57\u6570"), /* @__PURE__ */ import_react2.default.createElement("th", { style: { width: 90 } }, "\u5B57\u8282"), /* @__PURE__ */ import_react2.default.createElement("th", null, "\u9519\u8BEF"))), /* @__PURE__ */ import_react2.default.createElement("tbody", null, days.length ? days.slice().reverse().map((d3) => /* @__PURE__ */ import_react2.default.createElement(
    "tr",
    {
      key: d3.day,
      "data-day": d3.day,
      tabIndex: 0,
      "aria-selected": String(Boolean(sel) && d3.day === sel.day),
      onClick: () => onSelectDay(d3.day),
      onKeyDown: (e3) => {
        if (e3.key === "Enter" || e3.key === " ") {
          e3.preventDefault();
          onSelectDay(d3.day);
        }
      }
    },
    /* @__PURE__ */ import_react2.default.createElement("td", { className: "d" }, String(d3.day)),
    /* @__PURE__ */ import_react2.default.createElement("td", null, fmtInt(d3.requests)),
    /* @__PURE__ */ import_react2.default.createElement("td", null, fmtInt(d3.segments)),
    /* @__PURE__ */ import_react2.default.createElement("td", null, hm(d3.seconds)),
    /* @__PURE__ */ import_react2.default.createElement("td", null, fmtInt(d3.chars)),
    /* @__PURE__ */ import_react2.default.createElement("td", null, fmtBytes(d3.bytes)),
    /* @__PURE__ */ import_react2.default.createElement("td", { className: num(d3.errors) ? "e" : void 0 }, num(d3.errors) ? String(num(d3.errors)) : "\u2014")
  )) : /* @__PURE__ */ import_react2.default.createElement("tr", null, /* @__PURE__ */ import_react2.default.createElement("td", { colSpan: 7, style: { color: "var(--ink-3)", padding: "10px 4px" } }, "\u8FD8\u6CA1\u6709\u65E5\u7EDF\u8BA1\u3002\u8DE8\u5929\u540E /api/state \u7684 days[] \u4F1A\u81EA\u52A8\u5E26\u51FA\u6BCF\u5929\u4E00\u884C\u3002"))))))), /* @__PURE__ */ import_react2.default.createElement("aside", { className: "arch-right" }, /* @__PURE__ */ import_react2.default.createElement("div", { className: "ins-hd", style: { borderTop: 0, paddingTop: 0 } }, /* @__PURE__ */ import_react2.default.createElement("span", { className: "silk" }, "SESSION ", /* @__PURE__ */ import_react2.default.createElement("b", null, "\u9009\u4E2D\u65E5")), /* @__PURE__ */ import_react2.default.createElement("span", { className: "cn" }, sel ? weekdayOfDay(sel.day) : "\u2014")), /* @__PURE__ */ import_react2.default.createElement("div", { className: "day-detail", id: "dayDetail" }, sel ? /* @__PURE__ */ import_react2.default.createElement(import_react2.default.Fragment, null, /* @__PURE__ */ import_react2.default.createElement("div", { className: "kv wide" }, /* @__PURE__ */ import_react2.default.createElement("span", { className: "k" }, "\u65E5\u671F DATE"), /* @__PURE__ */ import_react2.default.createElement("span", { className: "v" }, `${sel.day} \xB7 ${weekdayOfDay(sel.day)}`)), /* @__PURE__ */ import_react2.default.createElement("div", { className: "kv" }, /* @__PURE__ */ import_react2.default.createElement("span", { className: "k" }, "\u8BF7\u6C42"), /* @__PURE__ */ import_react2.default.createElement("span", { className: "v" }, fmtInt(sel.requests))), /* @__PURE__ */ import_react2.default.createElement("div", { className: "kv" }, /* @__PURE__ */ import_react2.default.createElement("span", { className: "k" }, "\u6BB5"), /* @__PURE__ */ import_react2.default.createElement("span", { className: "v" }, fmtInt(sel.segments))), /* @__PURE__ */ import_react2.default.createElement("div", { className: "kv" }, /* @__PURE__ */ import_react2.default.createElement("span", { className: "k" }, "\u5408\u6210\u65F6\u957F"), /* @__PURE__ */ import_react2.default.createElement("span", { className: "v" }, hm(sel.seconds))), /* @__PURE__ */ import_react2.default.createElement("div", { className: "kv" }, /* @__PURE__ */ import_react2.default.createElement("span", { className: "k" }, "\u5B57\u6570"), /* @__PURE__ */ import_react2.default.createElement("span", { className: "v" }, fmtInt(sel.chars))), /* @__PURE__ */ import_react2.default.createElement("div", { className: "kv" }, /* @__PURE__ */ import_react2.default.createElement("span", { className: "k" }, "\u5B57\u8282"), /* @__PURE__ */ import_react2.default.createElement("span", { className: "v" }, fmtBytes(sel.bytes))), /* @__PURE__ */ import_react2.default.createElement("div", { className: "kv" }, /* @__PURE__ */ import_react2.default.createElement("span", { className: "k" }, "\u9519\u8BEF"), /* @__PURE__ */ import_react2.default.createElement("span", { className: "v" }, String(num(sel.errors))))) : /* @__PURE__ */ import_react2.default.createElement("div", { className: "kv wide" }, /* @__PURE__ */ import_react2.default.createElement("span", { className: "k" }, "\u65E5\u671F DATE"), /* @__PURE__ */ import_react2.default.createElement("span", { className: "v" }, "\u2014"))), /* @__PURE__ */ import_react2.default.createElement("div", { className: "arch-sec" }, /* @__PURE__ */ import_react2.default.createElement("span", { className: "silk" }, "RANGE ", /* @__PURE__ */ import_react2.default.createElement("b", null, "\u672C\u6BB5\u5408\u8BA1")), /* @__PURE__ */ import_react2.default.createElement(Rowx, { k: "\u65E5\u6570", v: String(n3) }), /* @__PURE__ */ import_react2.default.createElement(Rowx, { k: "\u8BF7\u6C42", v: fmtInt(rangeRequests) }), /* @__PURE__ */ import_react2.default.createElement(Rowx, { k: "\u5408\u6210\u65F6\u957F", v: hm(sumSec) }), /* @__PURE__ */ import_react2.default.createElement(Rowx, { k: "\u9519\u8BEF\u65E5", v: `${rangeErrors} \u5929` })), /* @__PURE__ */ import_react2.default.createElement("div", { className: "arch-sec" }, /* @__PURE__ */ import_react2.default.createElement("span", { className: "silk" }, "LATENCY ", /* @__PURE__ */ import_react2.default.createElement("b", null, "\u672C\u7A97\u5206\u4F4D")), /* @__PURE__ */ import_react2.default.createElement(Rowx, { k: "p50", v: latQ(lat.p50, lat.samples) }), /* @__PURE__ */ import_react2.default.createElement(Rowx, { k: "p95", v: latQ(lat.p95, lat.samples) }), /* @__PURE__ */ import_react2.default.createElement(Rowx, { k: "max", v: latQ(lat.max, lat.samples) }), /* @__PURE__ */ import_react2.default.createElement(Rowx, { k: "\u6837\u672C", v: fmtInt(lat.samples) })), /* @__PURE__ */ import_react2.default.createElement("div", { className: "arch-sec", style: { marginTop: "auto" } }, /* @__PURE__ */ import_react2.default.createElement(Rowx, { k: "\u8BB0\u5F55\u81EA", v: asc.length ? String(asc[0].day) : "\u2014" }), /* @__PURE__ */ import_react2.default.createElement(Rowx, { k: "\u6863\u6848\u53E3\u5F84", v: "UTC \u81EA\u7136\u65E5" }))));
}

// client/components/DeliveryView.jsx
var import_react6 = __toESM(require("react"), 1);

// client/components/HttpsAccessCard.jsx
var import_react3 = __toESM(require("react"), 1);
function HttpsAccessCard({
  service,
  config,
  importInfo,
  tunnel,
  onRefreshState,
  onCopy,
  showToast
}) {
  const imp = importInfo || {};
  const cfg = config || {};
  const tun = tunnel || {};
  const port = service?.port || cfg.server?.port || 8291;
  const defaultTab = imp.relayBaseUrl ? "relay" : imp.publicJsonUrl ? "named" : "quick";
  const [tab, setTab] = (0, import_react3.useState)(defaultTab);
  const [protocol, setProtocol] = (0, import_react3.useState)(tun.protocol || cfg.tunnel?.protocol || "http2");
  const [tools, setTools] = (0, import_react3.useState)(null);
  const [busy, setBusy] = (0, import_react3.useState)("");
  const copyCommand = async (cmd, label) => {
    const ok = await writeClipboard(cmd);
    showToast?.(ok ? `\u5DF2\u590D\u5236 \xB7 ${label}` : "\u590D\u5236\u88AB\u6D4F\u89C8\u5668\u62E6\u622A\uFF0C\u8BF7\u624B\u52A8\u9009\u4E2D");
  };
  const probeTools = async (silent = false) => {
    if (!silent) setBusy("detect");
    try {
      const res = await fetchTunnelStatusApi(true);
      if (res?.tools) setTools(res.tools);
      if (!silent) showToast?.("\u5DF2\u5B8C\u6210\u672C\u673A\u7A7F\u900F\u5DE5\u5177\u63A2\u6D4B");
    } catch (err) {
      if (!silent) showToast?.(`\u63A2\u6D4B\u5931\u8D25\uFF1A${String(err?.message || err)}`);
    } finally {
      if (!silent) setBusy("");
    }
  };
  (0, import_react3.useEffect)(() => {
    probeTools(true);
  }, []);
  const actQuick = async (action) => {
    if (busy) return;
    setBusy(action);
    try {
      await controlQuickTunnelApi({ action, protocol });
      await onRefreshState?.();
      showToast?.(
        action === "start" ? "Quick Tunnel \u5DF2\u542F\u52A8" : action === "stop" ? "Quick Tunnel \u5DF2\u505C\u6B62" : "Quick Tunnel \u5DF2\u91CD\u542F"
      );
    } catch (err) {
      showToast?.(String(err?.message || err));
    } finally {
      setBusy("");
    }
  };
  const runSyncKv = async () => {
    if (busy) return;
    setBusy("sync");
    try {
      const res = await syncTunnelKvApi();
      await onRefreshState?.();
      showToast?.(res?.kvSync?.message || "\u5DF2\u89E6\u53D1 Cloudflare KV \u540C\u6B65");
    } catch (err) {
      showToast?.(String(err?.message || err));
    } finally {
      setBusy("");
    }
  };
  const tState = tun.state || "idle";
  const quickUrl = tun.quickUrl || imp.quickTunnelUrl || "";
  const kvSync = tun.kvSync || {};
  const cfTool = tools?.cloudflared;
  const tsTool = tools?.tailscale;
  const wrTool = tools?.wrangler;
  let badgeText = "LAN ONLY";
  let badgeCls = "tag";
  if (tState === "running" && quickUrl) {
    badgeText = "QUICK RUN";
    badgeCls = "tag tape";
  } else if (tState === "starting") {
    badgeText = "STARTING\u2026";
    badgeCls = "tag cloud";
  } else if (tState === "error") {
    badgeText = "TUNNEL ERR";
    badgeCls = "tag grease";
  } else if (imp.publicJsonUrl) {
    badgeText = "NAMED WAN";
    badgeCls = "tag tape";
  } else if (imp.relayBaseUrl) {
    badgeText = "RELAY";
    badgeCls = "tag tape";
  }
  const tailscaleCmd = `tailscale funnel --bg ${port}`;
  const namedCmd = [
    "cloudflared tunnel login",
    "cloudflared tunnel create audiobook-tts",
    "cloudflared tunnel route dns audiobook-tts tts.example.dpdns.org"
  ].join("\n");
  const kvNsId = String(cfg.tunnel?.kvSync?.kvNamespaceId || "").trim();
  const nsFlag = kvNsId ? ` --namespace-id ${kvNsId}` : " --namespace-id <KV_NAMESPACE_ID>";
  const tokenPrefix = cfg.auth?.enabled ? "AUDIOBOOK_API_TOKEN=<URL_TOKEN> " : "";
  const relaySyncCmd = `${tokenPrefix}node deploy/cf-worker-relay/sync-tunnel-url.mjs --from-api http://127.0.0.1:${port}/api/tunnel/status --mode wrangler${nsFlag}`;
  return /* @__PURE__ */ import_react3.default.createElement("div", { className: "labelblock https-card", id: "httpsAccessCard" }, /* @__PURE__ */ import_react3.default.createElement("div", { className: "lb-hd" }, /* @__PURE__ */ import_react3.default.createElement("span", { className: "silk" }, "HTTPS ACCESS ", /* @__PURE__ */ import_react3.default.createElement("b", null, "\u516C\u7F51 HTTPS \u56DB\u9009\u4E00\u63A5\u5165\u4E0E Quick Tunnel")), /* @__PURE__ */ import_react3.default.createElement("span", { className: badgeCls }, badgeText)), /* @__PURE__ */ import_react3.default.createElement("div", { className: "https-tabs" }, /* @__PURE__ */ import_react3.default.createElement(
    Seg,
    {
      options: [
        { value: "quick", label: "A \xB7 Quick Tunnel" },
        { value: "tailscale", label: "B \xB7 Tailscale Funnel" },
        { value: "named", label: "C \xB7 \u547D\u540D\u96A7\u9053" },
        { value: "relay", label: "D \xB7 Worker + KV \u4E2D\u8F6C" }
      ],
      value: tab,
      ariaLabel: "\u516C\u7F51 HTTPS \u65B9\u6848\u9009\u62E9",
      onChange: setTab
    }
  ), /* @__PURE__ */ import_react3.default.createElement(
    "button",
    {
      className: "btn btn--sm",
      type: "button",
      disabled: Boolean(busy),
      onClick: () => probeTools(false)
    },
    busy === "detect" ? "\u63A2\u6D4B\u4E2D\u2026" : "\u5237\u65B0\u5DE5\u5177\u63A2\u6D4B"
  )), tab === "quick" ? /* @__PURE__ */ import_react3.default.createElement("div", { className: "https-pane" }, /* @__PURE__ */ import_react3.default.createElement("div", { className: "https-bar" }, /* @__PURE__ */ import_react3.default.createElement(
    Seg,
    {
      options: [
        { value: "http2", label: "HTTP/2\uFF08\u63A8\u8350\uFF09" },
        { value: "quic", label: "QUIC" }
      ],
      value: protocol === "quic" ? "quic" : "http2",
      ariaLabel: "Quick Tunnel \u534F\u8BAE",
      onChange: setProtocol
    }
  ), /* @__PURE__ */ import_react3.default.createElement("div", { className: "https-acts" }, tState === "running" || tState === "starting" ? /* @__PURE__ */ import_react3.default.createElement(import_react3.default.Fragment, null, /* @__PURE__ */ import_react3.default.createElement(
    "button",
    {
      className: "btn btn--sm",
      type: "button",
      disabled: Boolean(busy),
      onClick: () => actQuick("stop")
    },
    busy === "stop" ? "\u505C\u6B62\u4E2D\u2026" : "\u505C\u6B62\u96A7\u9053"
  ), /* @__PURE__ */ import_react3.default.createElement(
    "button",
    {
      className: "btn btn--sm btn--tape",
      type: "button",
      disabled: Boolean(busy),
      onClick: () => actQuick("restart")
    },
    busy === "restart" ? "\u91CD\u542F\u4E2D\u2026" : "\u91CD\u542F"
  )) : /* @__PURE__ */ import_react3.default.createElement(
    "button",
    {
      className: "btn btn--sm btn--tape",
      type: "button",
      disabled: Boolean(busy),
      onClick: () => actQuick("start")
    },
    busy === "start" ? "\u542F\u52A8\u4E2D\u2026" : "\u4E00\u952E\u542F\u52A8 Quick Tunnel"
  )), /* @__PURE__ */ import_react3.default.createElement("span", { className: "mono https-tool-pill" }, cfTool ? cfTool.installed ? `cloudflared ${cfTool.version || "\u5DF2\u5C31\u7EEA"}` : "\u672A\u68C0\u6D4B\u5230 cloudflared" : "\u6B63\u5728\u63A2\u6D4B cloudflared\u2026")), cfTool && !cfTool.installed ? /* @__PURE__ */ import_react3.default.createElement("div", { className: "addr https-install" }, /* @__PURE__ */ import_react3.default.createElement("code", null, "brew install cloudflared"), /* @__PURE__ */ import_react3.default.createElement(
    "button",
    {
      className: "btn btn--sm",
      type: "button",
      onClick: () => copyCommand("brew install cloudflared", "\u5B89\u88C5\u547D\u4EE4")
    },
    "\u590D\u5236 brew \u5B89\u88C5\u547D\u4EE4"
  )) : null, quickUrl ? /* @__PURE__ */ import_react3.default.createElement("div", { className: "addr" }, /* @__PURE__ */ import_react3.default.createElement("code", { id: "quickTunnelUrl" }, quickUrl), /* @__PURE__ */ import_react3.default.createElement(
    "button",
    {
      className: "btn btn--sm",
      type: "button",
      "data-copy": "quick-url",
      onClick: () => onCopy?.("quick-url")
    },
    "\u590D\u5236\u516C\u7F51"
  ), /* @__PURE__ */ import_react3.default.createElement(
    "button",
    {
      className: "btn btn--sm btn--tape",
      type: "button",
      "data-copy": "quick-import",
      onClick: () => onCopy?.("quick-import")
    },
    "\u590D\u5236 Legado \u5BFC\u5165"
  )) : null, tun.error ? /* @__PURE__ */ import_react3.default.createElement("div", { className: "https-err mono" }, `\u96A7\u9053\u5F02\u5E38\uFF1A${tun.error}`) : null, /* @__PURE__ */ import_react3.default.createElement("div", { className: "https-warn" }, /* @__PURE__ */ import_react3.default.createElement("b", null, "\u4E34\u65F6\u901A\u9053\u8B66\u793A\uFF1A"), "\u91CD\u542F\u540E\u57DF\u540D\u4F1A\u53D8\u5316 \xB7 \u4EC5\u5EFA\u8BAE\u4E2A\u4EBA\u6D4B\u8BD5\u4E0E\u4E34\u65F6\u5206\u4EAB \xB7 \u4E0A\u9650 \u2264200 \u5E76\u53D1\u8BF7\u6C42 \xB7 \u4E0D\u652F\u6301 SSE \u6D41\u5F0F\u3002\u957F\u671F\u56FA\u5B9A\u57DF\u540D\u8BF7\u6539\u7528 B/C/D \u65B9\u6848\u3002")) : null, tab === "tailscale" ? /* @__PURE__ */ import_react3.default.createElement("div", { className: "https-pane" }, /* @__PURE__ */ import_react3.default.createElement("div", { className: "https-status-row mono" }, /* @__PURE__ */ import_react3.default.createElement("span", null, tsTool?.installed ? `Tailscale \u5DF2\u5B89\u88C5 \xB7 ${tsTool.online ? `\u5728\u7EBF (${tsTool.dnsName || "\u5DF2\u767B\u5F55"})` : `\u79BB\u7EBF (${tsTool.backendState || "\u672A\u767B\u5F55"})`}` : "\u672A\u68C0\u6D4B\u5230 Tailscale CLI\uFF08\u9700\u5B89\u88C5\u5B98\u65B9 Tailscale \u5BA2\u6237\u7AEF\u5E76\u767B\u5F55\u540C\u4E00\u8D26\u53F7\uFF09"), tsTool?.funnelEnabled && tsTool?.funnelUrl ? /* @__PURE__ */ import_react3.default.createElement("span", { className: "tag tape" }, `Funnel \u5DF2\u5F00: ${tsTool.funnelUrl}`) : null), /* @__PURE__ */ import_react3.default.createElement("div", { className: "addr" }, /* @__PURE__ */ import_react3.default.createElement("code", null, tailscaleCmd), /* @__PURE__ */ import_react3.default.createElement(
    "button",
    {
      className: "btn btn--sm btn--tape",
      type: "button",
      onClick: () => copyCommand(tailscaleCmd, "Tailscale Funnel \u547D\u4EE4")
    },
    "\u590D\u5236\u547D\u4EE4"
  )), /* @__PURE__ */ import_react3.default.createElement("p", { className: "hint" }, "\u96F6\u57DF\u540D\u3001\u514D\u8D39\u81EA\u5E26 Let's Encrypt HTTPS \u8BC1\u4E66\uFF1B\u9002\u5408\u81EA\u7528\u4E0E\u5DF2\u52A0\u5165\u540C\u4E00\u4E2A Tailnet \u7684\u8BBE\u5907\uFF08\u9700\u5728 Tailscale \u7BA1\u7406\u53F0\u5F00\u542F Funnel ACL\uFF09\u3002")) : null, tab === "named" ? /* @__PURE__ */ import_react3.default.createElement("div", { className: "https-pane" }, /* @__PURE__ */ import_react3.default.createElement("p", { className: "hint", style: { marginTop: 0 } }, /* @__PURE__ */ import_react3.default.createElement("b", null, "\u514D\u8D39\u57DF\u540D\u63A8\u8350\uFF1A"), "DigitalPlat FreeDomain\uFF08", /* @__PURE__ */ import_react3.default.createElement("code", null, ".dpdns.org"), " / ", /* @__PURE__ */ import_react3.default.createElement("code", null, ".us.kg"), " / ", /* @__PURE__ */ import_react3.default.createElement("code", null, ".qzz.io"), "\uFF09\u6216 ", /* @__PURE__ */ import_react3.default.createElement("code", null, "eu.org"), "\uFF08\u652F\u6301\u5B8C\u6574 Cloudflare NS \u6258\u7BA1\uFF09\u3002\u914D\u7F6E\u5B8C\u5728\u300C\u6E32\u67D3\u8BBE\u7F6E \u2192 08 \u5BF9\u5916\u5730\u5740\u300D\u586B\u5165\u57DF\u540D\u5373\u53EF\u3002"), /* @__PURE__ */ import_react3.default.createElement("div", { className: "https-pitfalls" }, /* @__PURE__ */ import_react3.default.createElement("b", null, "\u907F\u5751\u7EA2\u7EBF\uFF1A"), "\u2717 \u4E25\u7981\u81EA\u7B7E\u8BC1\u4E66\uFF08Android 7+ \u9ED8\u8BA4\u62D2\u7EDD\u7528\u6237 CA\uFF0CLegado \u76F4\u63A5 SSL \u63E1\u624B\u5931\u8D25\uFF09 \xB7 \u2717 \u4E25\u7981 ClouDNS \u514D\u8D39\u5B50\u57DF\uFF08\u4E0D\u652F\u6301\u6539 NS\uFF09 \xB7 \u2717 \u4E25\u7981 Freenom\uFF08\u5DF2\u505C\u670D\uFF09 \xB7 \u2717 \u52FF\u5C06 ", /* @__PURE__ */ import_react3.default.createElement("code", null, "*.pages.dev"), " \u76F4\u63A5\u7ED1\u5B9A\u547D\u540D\u96A7\u9053\u3002"), /* @__PURE__ */ import_react3.default.createElement("div", { className: "addr" }, /* @__PURE__ */ import_react3.default.createElement("code", { style: { whiteSpace: "pre-wrap" } }, namedCmd), /* @__PURE__ */ import_react3.default.createElement(
    "button",
    {
      className: "btn btn--sm",
      type: "button",
      onClick: () => copyCommand(namedCmd, "\u547D\u540D\u96A7\u9053\u547D\u4EE4")
    },
    "\u590D\u5236\u547D\u4EE4"
  ))) : null, tab === "relay" ? /* @__PURE__ */ import_react3.default.createElement("div", { className: "https-pane" }, /* @__PURE__ */ import_react3.default.createElement("div", { className: "https-status-row mono" }, /* @__PURE__ */ import_react3.default.createElement("span", null, `wrangler: ${wrTool?.installed ? wrTool.version || "\u5DF2\u5B89\u88C5" : "\u672A\u5B89\u88C5"} \xB7 \u4E2D\u8F6C\u5730\u5740: ${imp.relayBaseUrl || "\u672A\u586B\u5199\uFF08\u5728\u8BBE\u7F6E 08 \u586B\u5199 publicRelayUrl\uFF09"}`), kvSync.state && kvSync.state !== "idle" ? /* @__PURE__ */ import_react3.default.createElement("span", { className: `tag${kvSync.state === "ok" ? " tape" : kvSync.state === "error" ? " grease" : ""}` }, `KV: ${kvSync.state}${kvSync.message ? ` \xB7 ${kvSync.message}` : ""}`) : null), /* @__PURE__ */ import_react3.default.createElement("div", { className: "https-bar" }, /* @__PURE__ */ import_react3.default.createElement(
    "button",
    {
      className: "btn btn--sm btn--tape",
      type: "button",
      disabled: !quickUrl || Boolean(busy),
      title: quickUrl ? "\u628A\u5F53\u524D Quick Tunnel \u5730\u5740\u7ACB\u5373\u5199\u5165 Cloudflare KV" : "\u8BF7\u5148\u542F\u52A8 Quick Tunnel",
      onClick: runSyncKv
    },
    busy === "sync" ? "\u540C\u6B65\u4E2D\u2026" : "\u7ACB\u5373\u540C\u6B65 KV"
  ), /* @__PURE__ */ import_react3.default.createElement(
    "button",
    {
      className: "btn btn--sm",
      type: "button",
      onClick: () => copyCommand(relaySyncCmd, "KV \u540C\u6B65\u811A\u672C\u547D\u4EE4")
    },
    "\u590D\u5236 5 \u5206\u949F Cron \u540C\u6B65\u547D\u4EE4"
  )), /* @__PURE__ */ import_react3.default.createElement("p", { className: "hint" }, "\u4F7F\u7528\u4ED3\u5E93\u5185 ", /* @__PURE__ */ import_react3.default.createElement("code", null, "deploy/cf-worker-relay/worker.js"), " \u66B4\u9732\u56FA\u5B9A ", /* @__PURE__ */ import_react3.default.createElement("code", null, "*.workers.dev"), " \u5730\u5740\uFF1A\u4EC5\u653E\u884C\u542C\u4E66\u4E0E OpenAI \u8DEF\u7531\u3001\u4E25\u7981\u8F6C\u53D1 ", /* @__PURE__ */ import_react3.default.createElement("code", null, "/api/*"), " \u7BA1\u7406\u63A5\u53E3\uFF0C\u5E76\u6821\u9A8C KV \u76EE\u6807\u4E3A ", /* @__PURE__ */ import_react3.default.createElement("code", null, "trycloudflare.com"), "\uFF08\u9632 SSRF\uFF09\u3002")) : null);
}

// client/components/PreviewPlayer.jsx
var import_react4 = __toESM(require("react"), 1);
function PreviewPlayer({
  draftPatch = null,
  showToast,
  defaultRole = "narrator",
  showRuleToggle = true,
  title = "\u4EA4\u4E92\u8BD5\u542C\uFF08\u652F\u6301\u672A\u4FDD\u5B58\u8349\u7A3F\uFF09"
}) {
  const [role, setRole] = (0, import_react4.useState)(defaultRole);
  const [text, setText] = (0, import_react4.useState)(PREVIEW_SAMPLE[defaultRole] || PREVIEW_SAMPLE.narrator);
  const [customEdited, setCustomEdited] = (0, import_react4.useState)(false);
  const [applyTextRules, setApplyTextRules] = (0, import_react4.useState)(true);
  const [busy, setBusy] = (0, import_react4.useState)(false);
  const [audioUrl, setAudioUrl] = (0, import_react4.useState)("");
  const [meta, setMeta] = (0, import_react4.useState)(null);
  (0, import_react4.useEffect)(() => () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
  }, [audioUrl]);
  const changeRole = (nextRole) => {
    setRole(nextRole);
    if (!customEdited) {
      setText(PREVIEW_SAMPLE[nextRole] || PREVIEW_SAMPLE.narrator);
    }
  };
  const run = async () => {
    const clean = text.trim();
    if (!clean) {
      showToast("\u8BF7\u8F93\u5165\u8BD5\u542C\u6587\u672C");
      return;
    }
    setBusy(true);
    try {
      const { blob, source, durationS, latencyMs } = await fetchPreviewWav({
        text: clean,
        role,
        draft: draftPatch || null,
        applyTextRules
      });
      const nextUrl = URL.createObjectURL(blob);
      setAudioUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return nextUrl;
      });
      setMeta({ source, durationS, latencyMs });
      showToast(`\u8BD5\u542C\u5B8C\u6210 \xB7 ${ROLE_CN[role] || role} \xB7 ${source || "tts"} \xB7 ${durationS || "?"}s`);
    } catch (err) {
      showToast(`\u8BD5\u542C\u5931\u8D25\uFF1A${String(err?.message || err)}`);
    } finally {
      setBusy(false);
    }
  };
  return /* @__PURE__ */ import_react4.default.createElement("div", { className: "preview-box" }, /* @__PURE__ */ import_react4.default.createElement("div", { className: "pv-hd" }, /* @__PURE__ */ import_react4.default.createElement("span", { className: "silk" }, title), /* @__PURE__ */ import_react4.default.createElement(
    Seg,
    {
      options: [
        { value: "narrator", label: "\u65C1\u767D" },
        { value: "dialogue", label: "\u5BF9\u8BDD" },
        { value: "mixed", label: "\u65C1\u767D+\u5BF9\u8BDD\u6DF7\u6392" }
      ],
      value: role,
      ariaLabel: "\u8BD5\u542C\u89D2\u8272",
      onChange: changeRole
    }
  )), /* @__PURE__ */ import_react4.default.createElement(
    "textarea",
    {
      className: "input",
      rows: 2,
      value: text,
      placeholder: "\u8F93\u5165\u8BD5\u542C\u6587\u672C\u2026",
      onChange: (e3) => {
        setCustomEdited(true);
        setText(e3.target.value);
      }
    }
  ), /* @__PURE__ */ import_react4.default.createElement("div", { className: "pv-bar" }, /* @__PURE__ */ import_react4.default.createElement("button", { className: "btn btn--sm btn--tape", type: "button", disabled: busy, onClick: run }, busy ? "\u5408\u6210\u4E2D\u2026" : draftPatch ? "\u8BD5\u542C\u5F53\u524D\u8349\u7A3F" : "\u5408\u6210\u5E76\u8BD5\u542C"), showRuleToggle ? /* @__PURE__ */ import_react4.default.createElement("label", { className: "mono", style: { display: "flex", alignItems: "center", gap: 4, fontSize: 11, cursor: "pointer" } }, /* @__PURE__ */ import_react4.default.createElement("input", { type: "checkbox", checked: applyTextRules, onChange: (e3) => setApplyTextRules(e3.target.checked) }), "\u5E94\u7528\u66FF\u6362\u89C4\u5219") : null, meta ? /* @__PURE__ */ import_react4.default.createElement("span", { className: "mono pv-meta" }, `${meta.source || "tts"} \xB7 ${meta.durationS || "?"}s \xB7 ${meta.latencyMs || "?"}ms`) : null), audioUrl ? /* @__PURE__ */ import_react4.default.createElement("audio", { className: "pv-audio", controls: true, autoPlay: true, src: audioUrl }) : null);
}

// client/components/QrCard.jsx
var import_react5 = __toESM(require("react"), 1);

// node_modules/uqr/dist/index.mjs
var QrCodeDataType = /* @__PURE__ */ ((QrCodeDataType2) => {
  QrCodeDataType2[QrCodeDataType2["Border"] = -1] = "Border";
  QrCodeDataType2[QrCodeDataType2["Data"] = 0] = "Data";
  QrCodeDataType2[QrCodeDataType2["Function"] = 1] = "Function";
  QrCodeDataType2[QrCodeDataType2["Position"] = 2] = "Position";
  QrCodeDataType2[QrCodeDataType2["Timing"] = 3] = "Timing";
  QrCodeDataType2[QrCodeDataType2["Alignment"] = 4] = "Alignment";
  return QrCodeDataType2;
})(QrCodeDataType || {});
var LOW = [0, 1];
var MEDIUM = [1, 0];
var QUARTILE = [2, 3];
var HIGH = [3, 2];
var EccMap = {
  L: LOW,
  M: MEDIUM,
  Q: QUARTILE,
  H: HIGH
};
var NUMERIC_REGEX = /^\d*$/;
var ALPHANUMERIC_REGEX = /^[A-Z0-9 $%*+./:-]*$/;
var ALPHANUMERIC_CHARSET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:";
var MIN_VERSION = 1;
var MAX_VERSION = 40;
var PENALTY_N1 = 3;
var PENALTY_N2 = 3;
var PENALTY_N3 = 40;
var PENALTY_N4 = 10;
var ECC_CODEWORDS_PER_BLOCK = [
  // Version: (note that index 0 is for padding, and is set to an illegal value)
  // 0,  1,  2,  3,  4,  5,  6,  7,  8,  9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40    Error correction level
  [-1, 7, 10, 15, 20, 26, 18, 20, 24, 30, 18, 20, 24, 26, 30, 22, 24, 28, 30, 28, 28, 28, 28, 30, 30, 26, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
  // Low
  [-1, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26, 30, 22, 22, 24, 24, 28, 28, 26, 26, 26, 26, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28],
  // Medium
  [-1, 13, 22, 18, 26, 18, 24, 18, 22, 20, 24, 28, 26, 24, 20, 30, 24, 28, 28, 26, 30, 28, 30, 30, 30, 30, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
  // Quartile
  [-1, 17, 28, 22, 16, 22, 28, 26, 26, 24, 28, 24, 28, 22, 24, 24, 30, 28, 28, 26, 28, 30, 24, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30]
  // High
];
var NUM_ERROR_CORRECTION_BLOCKS = [
  // Version: (note that index 0 is for padding, and is set to an illegal value)
  // 0, 1, 2, 3, 4, 5, 6, 7, 8, 9,10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40    Error correction level
  [-1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 4, 4, 4, 4, 4, 6, 6, 6, 6, 7, 8, 8, 9, 9, 10, 12, 12, 12, 13, 14, 15, 16, 17, 18, 19, 19, 20, 21, 22, 24, 25],
  // Low
  [-1, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5, 5, 8, 9, 9, 10, 10, 11, 13, 14, 16, 17, 17, 18, 20, 21, 23, 25, 26, 28, 29, 31, 33, 35, 37, 38, 40, 43, 45, 47, 49],
  // Medium
  [-1, 1, 1, 2, 2, 4, 4, 6, 6, 8, 8, 8, 10, 12, 16, 12, 17, 16, 18, 21, 20, 23, 23, 25, 27, 29, 34, 34, 35, 38, 40, 43, 45, 48, 51, 53, 56, 59, 62, 65, 68],
  // Quartile
  [-1, 1, 1, 2, 4, 4, 4, 5, 6, 8, 8, 11, 11, 16, 16, 18, 16, 19, 21, 25, 25, 25, 34, 30, 32, 35, 37, 40, 42, 45, 48, 51, 54, 57, 60, 63, 66, 70, 74, 77, 81]
  // High
];
var QrCode = class {
  /* -- Constructor (low level) and fields -- */
  // Creates a new QR Code with the given version number,
  // error correction level, data codeword bytes, and mask number.
  // This is a low-level API that most users should not use directly.
  // A mid-level API is the encodeSegments() function.
  constructor(version, ecc, dataCodewords, msk) {
    this.version = version;
    this.ecc = ecc;
    if (version < MIN_VERSION || version > MAX_VERSION)
      throw new RangeError("Version value out of range");
    if (msk < -1 || msk > 7)
      throw new RangeError("Mask value out of range");
    this.size = version * 4 + 17;
    const row = Array.from({ length: this.size }).fill(false);
    for (let i3 = 0; i3 < this.size; i3++) {
      this.modules.push(row.slice());
      this.types.push(row.map(() => 0));
    }
    this.drawFunctionPatterns();
    const allCodewords = this.addEccAndInterleave(dataCodewords);
    this.drawCodewords(allCodewords);
    if (msk === -1) {
      let minPenalty = 1e9;
      for (let i3 = 0; i3 < 8; i3++) {
        this.applyMask(i3);
        this.drawFormatBits(i3);
        const penalty = this.getPenaltyScore();
        if (penalty < minPenalty) {
          msk = i3;
          minPenalty = penalty;
        }
        this.applyMask(i3);
      }
    }
    this.mask = msk;
    this.applyMask(msk);
    this.drawFormatBits(msk);
  }
  /* -- Fields -- */
  // The width and height of this QR Code, measured in modules, between
  // 21 and 177 (inclusive). This is equal to version * 4 + 17.
  size;
  // The index of the mask pattern used in this QR Code, which is between 0 and 7 (inclusive).
  // Even if a QR Code is created with automatic masking requested (mask = -1),
  // the resulting object still has a mask value between 0 and 7.
  mask;
  // The modules of this QR Code (false = light, true = dark).
  // Immutable after constructor finishes. Accessed through getModule().
  modules = [];
  types = [];
  /* -- Accessor methods -- */
  // Returns the color of the module (pixel) at the given coordinates, which is false
  // for light or true for dark. The top left corner has the coordinates (x=0, y=0).
  // If the given coordinates are out of bounds, then false (light) is returned.
  getModule(x, y2) {
    return x >= 0 && x < this.size && y2 >= 0 && y2 < this.size && this.modules[y2][x];
  }
  /* -- Private helper methods for constructor: Drawing function modules -- */
  // Reads this object's version field, and draws and marks all function modules.
  drawFunctionPatterns() {
    for (let i3 = 0; i3 < this.size; i3++) {
      this.setFunctionModule(6, i3, i3 % 2 === 0, QrCodeDataType.Timing);
      this.setFunctionModule(i3, 6, i3 % 2 === 0, QrCodeDataType.Timing);
    }
    this.drawFinderPattern(3, 3);
    this.drawFinderPattern(this.size - 4, 3);
    this.drawFinderPattern(3, this.size - 4);
    const alignPatPos = this.getAlignmentPatternPositions();
    const numAlign = alignPatPos.length;
    for (let i3 = 0; i3 < numAlign; i3++) {
      for (let j = 0; j < numAlign; j++) {
        if (!(i3 === 0 && j === 0 || i3 === 0 && j === numAlign - 1 || i3 === numAlign - 1 && j === 0))
          this.drawAlignmentPattern(alignPatPos[i3], alignPatPos[j]);
      }
    }
    this.drawFormatBits(0);
    this.drawVersion();
  }
  // Draws two copies of the format bits (with its own error correction code)
  // based on the given mask and this object's error correction level field.
  drawFormatBits(mask) {
    const data = this.ecc[1] << 3 | mask;
    let rem = data;
    for (let i3 = 0; i3 < 10; i3++)
      rem = rem << 1 ^ (rem >>> 9) * 1335;
    const bits = (data << 10 | rem) ^ 21522;
    for (let i3 = 0; i3 <= 5; i3++)
      this.setFunctionModule(8, i3, getBit(bits, i3));
    this.setFunctionModule(8, 7, getBit(bits, 6));
    this.setFunctionModule(8, 8, getBit(bits, 7));
    this.setFunctionModule(7, 8, getBit(bits, 8));
    for (let i3 = 9; i3 < 15; i3++)
      this.setFunctionModule(14 - i3, 8, getBit(bits, i3));
    for (let i3 = 0; i3 < 8; i3++)
      this.setFunctionModule(this.size - 1 - i3, 8, getBit(bits, i3));
    for (let i3 = 8; i3 < 15; i3++)
      this.setFunctionModule(8, this.size - 15 + i3, getBit(bits, i3));
    this.setFunctionModule(8, this.size - 8, true);
  }
  // Draws two copies of the version bits (with its own error correction code),
  // based on this object's version field, iff 7 <= version <= 40.
  drawVersion() {
    if (this.version < 7)
      return;
    let rem = this.version;
    for (let i3 = 0; i3 < 12; i3++)
      rem = rem << 1 ^ (rem >>> 11) * 7973;
    const bits = this.version << 12 | rem;
    for (let i3 = 0; i3 < 18; i3++) {
      const color = getBit(bits, i3);
      const a3 = this.size - 11 + i3 % 3;
      const b2 = Math.floor(i3 / 3);
      this.setFunctionModule(a3, b2, color);
      this.setFunctionModule(b2, a3, color);
    }
  }
  // Draws a 9*9 finder pattern including the border separator,
  // with the center module at (x, y). Modules can be out of bounds.
  drawFinderPattern(x, y2) {
    for (let dy = -4; dy <= 4; dy++) {
      for (let dx = -4; dx <= 4; dx++) {
        const dist = Math.max(Math.abs(dx), Math.abs(dy));
        const xx = x + dx;
        const yy = y2 + dy;
        if (xx >= 0 && xx < this.size && yy >= 0 && yy < this.size)
          this.setFunctionModule(xx, yy, dist !== 2 && dist !== 4, QrCodeDataType.Position);
      }
    }
  }
  // Draws a 5*5 alignment pattern, with the center module
  // at (x, y). All modules must be in bounds.
  drawAlignmentPattern(x, y2) {
    for (let dy = -2; dy <= 2; dy++) {
      for (let dx = -2; dx <= 2; dx++) {
        this.setFunctionModule(
          x + dx,
          y2 + dy,
          Math.max(Math.abs(dx), Math.abs(dy)) !== 1,
          QrCodeDataType.Alignment
        );
      }
    }
  }
  // Sets the color of a module and marks it as a function module.
  // Only used by the constructor. Coordinates must be in bounds.
  setFunctionModule(x, y2, isDark, type = QrCodeDataType.Function) {
    this.modules[y2][x] = isDark;
    this.types[y2][x] = type;
  }
  /* -- Private helper methods for constructor: Codewords and masking -- */
  // Returns a new byte string representing the given data with the appropriate error correction
  // codewords appended to it, based on this object's version and error correction level.
  addEccAndInterleave(data) {
    const ver = this.version;
    const ecl = this.ecc;
    if (data.length !== getNumDataCodewords(ver, ecl))
      throw new RangeError("Invalid argument");
    const numBlocks = NUM_ERROR_CORRECTION_BLOCKS[ecl[0]][ver];
    const blockEccLen = ECC_CODEWORDS_PER_BLOCK[ecl[0]][ver];
    const rawCodewords = Math.floor(getNumRawDataModules(ver) / 8);
    const numShortBlocks = numBlocks - rawCodewords % numBlocks;
    const shortBlockLen = Math.floor(rawCodewords / numBlocks);
    const blocks = [];
    const rsDiv = reedSolomonComputeDivisor(blockEccLen);
    for (let i3 = 0, k = 0; i3 < numBlocks; i3++) {
      const dat = data.slice(k, k + shortBlockLen - blockEccLen + (i3 < numShortBlocks ? 0 : 1));
      k += dat.length;
      const ecc = reedSolomonComputeRemainder(dat, rsDiv);
      if (i3 < numShortBlocks)
        dat.push(0);
      blocks.push(dat.concat(ecc));
    }
    const result = [];
    for (let i3 = 0; i3 < blocks[0].length; i3++) {
      blocks.forEach((block, j) => {
        if (i3 !== shortBlockLen - blockEccLen || j >= numShortBlocks)
          result.push(block[i3]);
      });
    }
    return result;
  }
  // Draws the given sequence of 8-bit codewords (data and error correction) onto the entire
  // data area of this QR Code. Function modules need to be marked off before this is called.
  drawCodewords(data) {
    if (data.length !== Math.floor(getNumRawDataModules(this.version) / 8))
      throw new RangeError("Invalid argument");
    let i3 = 0;
    for (let right = this.size - 1; right >= 1; right -= 2) {
      if (right === 6)
        right = 5;
      for (let vert = 0; vert < this.size; vert++) {
        for (let j = 0; j < 2; j++) {
          const x = right - j;
          const upward = (right + 1 & 2) === 0;
          const y2 = upward ? this.size - 1 - vert : vert;
          if (!this.types[y2][x] && i3 < data.length * 8) {
            this.modules[y2][x] = getBit(data[i3 >>> 3], 7 - (i3 & 7));
            i3++;
          }
        }
      }
    }
  }
  // XORs the codeword modules in this QR Code with the given mask pattern.
  // The function modules must be marked and the codeword bits must be drawn
  // before masking. Due to the arithmetic of XOR, calling applyMask() with
  // the same mask value a second time will undo the mask. A final well-formed
  // QR Code needs exactly one (not zero, two, etc.) mask applied.
  applyMask(mask) {
    if (mask < 0 || mask > 7)
      throw new RangeError("Mask value out of range");
    for (let y2 = 0; y2 < this.size; y2++) {
      for (let x = 0; x < this.size; x++) {
        let invert;
        switch (mask) {
          case 0:
            invert = (x + y2) % 2 === 0;
            break;
          case 1:
            invert = y2 % 2 === 0;
            break;
          case 2:
            invert = x % 3 === 0;
            break;
          case 3:
            invert = (x + y2) % 3 === 0;
            break;
          case 4:
            invert = (Math.floor(x / 3) + Math.floor(y2 / 2)) % 2 === 0;
            break;
          case 5:
            invert = x * y2 % 2 + x * y2 % 3 === 0;
            break;
          case 6:
            invert = (x * y2 % 2 + x * y2 % 3) % 2 === 0;
            break;
          case 7:
            invert = ((x + y2) % 2 + x * y2 % 3) % 2 === 0;
            break;
          default:
            throw new Error("Unreachable");
        }
        if (!this.types[y2][x] && invert)
          this.modules[y2][x] = !this.modules[y2][x];
      }
    }
  }
  // Calculates and returns the penalty score based on state of this QR Code's current modules.
  // This is used by the automatic mask choice algorithm to find the mask pattern that yields the lowest score.
  getPenaltyScore() {
    let result = 0;
    for (let y2 = 0; y2 < this.size; y2++) {
      let runColor = false;
      let runX = 0;
      const runHistory = [0, 0, 0, 0, 0, 0, 0];
      for (let x = 0; x < this.size; x++) {
        if (this.modules[y2][x] === runColor) {
          runX++;
          if (runX === 5)
            result += PENALTY_N1;
          else if (runX > 5)
            result++;
        } else {
          this.finderPenaltyAddHistory(runX, runHistory);
          if (!runColor)
            result += this.finderPenaltyCountPatterns(runHistory) * PENALTY_N3;
          runColor = this.modules[y2][x];
          runX = 1;
        }
      }
      result += this.finderPenaltyTerminateAndCount(runColor, runX, runHistory) * PENALTY_N3;
    }
    for (let x = 0; x < this.size; x++) {
      let runColor = false;
      let runY = 0;
      const runHistory = [0, 0, 0, 0, 0, 0, 0];
      for (let y2 = 0; y2 < this.size; y2++) {
        if (this.modules[y2][x] === runColor) {
          runY++;
          if (runY === 5)
            result += PENALTY_N1;
          else if (runY > 5)
            result++;
        } else {
          this.finderPenaltyAddHistory(runY, runHistory);
          if (!runColor)
            result += this.finderPenaltyCountPatterns(runHistory) * PENALTY_N3;
          runColor = this.modules[y2][x];
          runY = 1;
        }
      }
      result += this.finderPenaltyTerminateAndCount(runColor, runY, runHistory) * PENALTY_N3;
    }
    for (let y2 = 0; y2 < this.size - 1; y2++) {
      for (let x = 0; x < this.size - 1; x++) {
        const color = this.modules[y2][x];
        if (color === this.modules[y2][x + 1] && color === this.modules[y2 + 1][x] && color === this.modules[y2 + 1][x + 1]) {
          result += PENALTY_N2;
        }
      }
    }
    let dark = 0;
    for (const row of this.modules)
      dark = row.reduce((sum, color) => sum + (color ? 1 : 0), dark);
    const total = this.size * this.size;
    const k = Math.ceil(Math.abs(dark * 20 - total * 10) / total) - 1;
    result += k * PENALTY_N4;
    return result;
  }
  /* -- Private helper functions -- */
  // Returns an ascending list of positions of alignment patterns for this version number.
  // Each position is in the range [0,177), and are used on both the x and y axes.
  // This could be implemented as lookup table of 40 variable-length lists of integers.
  getAlignmentPatternPositions() {
    if (this.version === 1) {
      return [];
    } else {
      const numAlign = Math.floor(this.version / 7) + 2;
      const step = this.version === 32 ? 26 : Math.ceil((this.version * 4 + 4) / (numAlign * 2 - 2)) * 2;
      const result = [6];
      for (let pos = this.size - 7; result.length < numAlign; pos -= step)
        result.splice(1, 0, pos);
      return result;
    }
  }
  // Can only be called immediately after a light run is added, and
  // returns either 0, 1, or 2. A helper function for getPenaltyScore().
  finderPenaltyCountPatterns(runHistory) {
    const n3 = runHistory[1];
    const core = n3 > 0 && runHistory[2] === n3 && runHistory[3] === n3 * 3 && runHistory[4] === n3 && runHistory[5] === n3;
    return (core && runHistory[0] >= n3 * 4 && runHistory[6] >= n3 ? 1 : 0) + (core && runHistory[6] >= n3 * 4 && runHistory[0] >= n3 ? 1 : 0);
  }
  // Must be called at the end of a line (row or column) of modules. A helper function for getPenaltyScore().
  finderPenaltyTerminateAndCount(currentRunColor, currentRunLength, runHistory) {
    if (currentRunColor) {
      this.finderPenaltyAddHistory(currentRunLength, runHistory);
      currentRunLength = 0;
    }
    currentRunLength += this.size;
    this.finderPenaltyAddHistory(currentRunLength, runHistory);
    return this.finderPenaltyCountPatterns(runHistory);
  }
  // Pushes the given value to the front and drops the last value. A helper function for getPenaltyScore().
  finderPenaltyAddHistory(currentRunLength, runHistory) {
    if (runHistory[0] === 0)
      currentRunLength += this.size;
    runHistory.pop();
    runHistory.unshift(currentRunLength);
  }
};
function appendBits(val, len, bb) {
  if (len < 0 || len > 31 || val >>> len !== 0)
    throw new RangeError("Value out of range");
  for (let i3 = len - 1; i3 >= 0; i3--)
    bb.push(val >>> i3 & 1);
}
function getBit(x, i3) {
  return (x >>> i3 & 1) !== 0;
}
var QrSegment = class {
  // Creates a new QR Code segment with the given attributes and data.
  // The character count (numChars) must agree with the mode and the bit buffer length,
  // but the constraint isn't checked. The given bit buffer is cloned and stored.
  constructor(mode, numChars, bitData) {
    this.mode = mode;
    this.numChars = numChars;
    this.bitData = bitData;
    if (numChars < 0)
      throw new RangeError("Invalid argument");
    this.bitData = bitData.slice();
  }
  /* -- Methods -- */
  // Returns a new copy of the data bits of this segment.
  getData() {
    return this.bitData.slice();
  }
};
var MODE_NUMERIC = [1, 10, 12, 14];
var MODE_ALPHANUMERIC = [2, 9, 11, 13];
var MODE_BYTE = [4, 8, 16, 16];
function numCharCountBits(mode, ver) {
  return mode[Math.floor((ver + 7) / 17) + 1];
}
function makeBytes(data) {
  const bb = [];
  for (const b2 of data)
    appendBits(b2, 8, bb);
  return new QrSegment(MODE_BYTE, data.length, bb);
}
function makeNumeric(digits) {
  if (!isNumeric(digits))
    throw new RangeError("String contains non-numeric characters");
  const bb = [];
  for (let i3 = 0; i3 < digits.length; ) {
    const n3 = Math.min(digits.length - i3, 3);
    appendBits(Number.parseInt(digits.substring(i3, i3 + n3), 10), n3 * 3 + 1, bb);
    i3 += n3;
  }
  return new QrSegment(MODE_NUMERIC, digits.length, bb);
}
function makeAlphanumeric(text) {
  if (!isAlphanumeric(text))
    throw new RangeError("String contains unencodable characters in alphanumeric mode");
  const bb = [];
  let i3;
  for (i3 = 0; i3 + 2 <= text.length; i3 += 2) {
    let temp = ALPHANUMERIC_CHARSET.indexOf(text.charAt(i3)) * 45;
    temp += ALPHANUMERIC_CHARSET.indexOf(text.charAt(i3 + 1));
    appendBits(temp, 11, bb);
  }
  if (i3 < text.length)
    appendBits(ALPHANUMERIC_CHARSET.indexOf(text.charAt(i3)), 6, bb);
  return new QrSegment(MODE_ALPHANUMERIC, text.length, bb);
}
function makeSegments(text) {
  if (text === "")
    return [];
  else if (isNumeric(text))
    return [makeNumeric(text)];
  else if (isAlphanumeric(text))
    return [makeAlphanumeric(text)];
  else
    return [makeBytes(toUtf8ByteArray(text))];
}
function isNumeric(text) {
  return NUMERIC_REGEX.test(text);
}
function isAlphanumeric(text) {
  return ALPHANUMERIC_REGEX.test(text);
}
function getTotalBits(segs, version) {
  let result = 0;
  for (const seg of segs) {
    const ccbits = numCharCountBits(seg.mode, version);
    if (seg.numChars >= 1 << ccbits)
      return Number.POSITIVE_INFINITY;
    result += 4 + ccbits + seg.bitData.length;
  }
  return result;
}
function toUtf8ByteArray(str2) {
  str2 = encodeURI(str2);
  const result = [];
  for (let i3 = 0; i3 < str2.length; i3++) {
    if (str2.charAt(i3) !== "%") {
      result.push(str2.charCodeAt(i3));
    } else {
      result.push(Number.parseInt(str2.substring(i3 + 1, i3 + 3), 16));
      i3 += 2;
    }
  }
  return result;
}
function getNumRawDataModules(ver) {
  if (ver < MIN_VERSION || ver > MAX_VERSION)
    throw new RangeError("Version number out of range");
  let result = (16 * ver + 128) * ver + 64;
  if (ver >= 2) {
    const numAlign = Math.floor(ver / 7) + 2;
    result -= (25 * numAlign - 10) * numAlign - 55;
    if (ver >= 7)
      result -= 36;
  }
  return result;
}
function getNumDataCodewords(ver, ecl) {
  return Math.floor(getNumRawDataModules(ver) / 8) - ECC_CODEWORDS_PER_BLOCK[ecl[0]][ver] * NUM_ERROR_CORRECTION_BLOCKS[ecl[0]][ver];
}
function reedSolomonComputeDivisor(degree) {
  if (degree < 1 || degree > 255)
    throw new RangeError("Degree out of range");
  const result = [];
  for (let i3 = 0; i3 < degree - 1; i3++)
    result.push(0);
  result.push(1);
  let root = 1;
  for (let i3 = 0; i3 < degree; i3++) {
    for (let j = 0; j < result.length; j++) {
      result[j] = reedSolomonMultiply(result[j], root);
      if (j + 1 < result.length)
        result[j] ^= result[j + 1];
    }
    root = reedSolomonMultiply(root, 2);
  }
  return result;
}
function reedSolomonComputeRemainder(data, divisor) {
  const result = divisor.map((_) => 0);
  for (const b2 of data) {
    const factor = b2 ^ result.shift();
    result.push(0);
    divisor.forEach((coef, i3) => result[i3] ^= reedSolomonMultiply(coef, factor));
  }
  return result;
}
function reedSolomonMultiply(x, y2) {
  if (x >>> 8 !== 0 || y2 >>> 8 !== 0)
    throw new RangeError("Byte out of range");
  let z = 0;
  for (let i3 = 7; i3 >= 0; i3--) {
    z = z << 1 ^ (z >>> 7) * 285;
    z ^= (y2 >>> i3 & 1) * x;
  }
  return z;
}
function encodeSegments(segs, ecl, minVersion = 1, maxVersion = 40, mask = -1, boostEcl = true) {
  if (!(MIN_VERSION <= minVersion && minVersion <= maxVersion && maxVersion <= MAX_VERSION) || mask < -1 || mask > 7) {
    throw new RangeError("Invalid value");
  }
  let version;
  let dataUsedBits;
  for (version = minVersion; ; version++) {
    const dataCapacityBits2 = getNumDataCodewords(version, ecl) * 8;
    const usedBits = getTotalBits(segs, version);
    if (usedBits <= dataCapacityBits2) {
      dataUsedBits = usedBits;
      break;
    }
    if (version >= maxVersion)
      throw new RangeError("Data too long");
  }
  for (const newEcl of [MEDIUM, QUARTILE, HIGH]) {
    if (boostEcl && dataUsedBits <= getNumDataCodewords(version, newEcl) * 8)
      ecl = newEcl;
  }
  const bb = [];
  for (const seg of segs) {
    appendBits(seg.mode[0], 4, bb);
    appendBits(seg.numChars, numCharCountBits(seg.mode, version), bb);
    for (const b2 of seg.getData())
      bb.push(b2);
  }
  const dataCapacityBits = getNumDataCodewords(version, ecl) * 8;
  appendBits(0, Math.min(4, dataCapacityBits - bb.length), bb);
  appendBits(0, (8 - bb.length % 8) % 8, bb);
  for (let padByte = 236; bb.length < dataCapacityBits; padByte ^= 236 ^ 17)
    appendBits(padByte, 8, bb);
  const dataCodewords = Array.from({ length: Math.ceil(bb.length / 8) }, () => 0);
  bb.forEach((b2, i3) => dataCodewords[i3 >>> 3] |= b2 << 7 - (i3 & 7));
  return new QrCode(version, ecl, dataCodewords, mask);
}
function encode(data, options) {
  const {
    ecc = "L",
    boostEcc = false,
    minVersion = 1,
    maxVersion = 40,
    maskPattern = -1,
    border = 1
  } = options || {};
  const segment = typeof data === "string" ? makeSegments(data) : Array.isArray(data) ? [makeBytes(data)] : void 0;
  if (!segment)
    throw new Error(`uqr only supports encoding string and binary data, but got: ${typeof data}`);
  const qr = encodeSegments(
    segment,
    EccMap[ecc],
    minVersion,
    maxVersion,
    maskPattern,
    boostEcc
  );
  const result = addBorder({
    version: qr.version,
    maskPattern: qr.mask,
    size: qr.size,
    data: qr.modules,
    types: qr.types
  }, border);
  if (options?.invert)
    result.data = result.data.map((row) => row.map((mod) => !mod));
  options?.onEncoded?.(result);
  return result;
}
function addBorder(input, border = 1) {
  if (!border)
    return input;
  const { size } = input;
  const newSize = size + border * 2;
  input.size = newSize;
  input.data.forEach((row) => {
    for (let i3 = 0; i3 < border; i3++) {
      row.unshift(false);
      row.push(false);
    }
  });
  for (let i3 = 0; i3 < border; i3++) {
    input.data.unshift(Array.from({ length: newSize }, (_) => false));
    input.data.push(Array.from({ length: newSize }, (_) => false));
  }
  const b2 = QrCodeDataType.Border;
  input.types.forEach((row) => {
    for (let i3 = 0; i3 < border; i3++) {
      row.unshift(b2);
      row.push(b2);
    }
  });
  for (let i3 = 0; i3 < border; i3++) {
    input.types.unshift(Array.from({ length: newSize }, (_) => b2));
    input.types.push(Array.from({ length: newSize }, (_) => b2));
  }
  return input;
}
function escapeAttr(value) {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function renderSVG(data, options = {}) {
  const result = encode(data, options);
  const {
    pixelSize = 10,
    whiteColor = "white",
    blackColor = "black"
  } = options;
  const height = result.size * pixelSize;
  const width = result.size * pixelSize;
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">`;
  const paths = [];
  for (let row = 0; row < result.size; row++) {
    for (let col = 0; col < result.size; col++) {
      const x = col * pixelSize;
      const y2 = row * pixelSize;
      if (result.data[row][col])
        paths.push(`M${x},${y2}h${pixelSize}v${pixelSize}h-${pixelSize}z`);
    }
  }
  svg += `<rect fill="${escapeAttr(whiteColor)}" width="${width}" height="${height}"/>`;
  svg += `<path fill="${escapeAttr(blackColor)}" d="${paths.join("")}"/>`;
  svg += "</svg>";
  return svg;
}

// client/components/QrCard.jsx
function QrCard({ title, badge, url, copyKind, onCopy }) {
  const [zoomOpen, setZoomOpen] = (0, import_react5.useState)(false);
  const svgMarkup = (0, import_react5.useMemo)(() => {
    if (!url || url === "\u2014") return "";
    try {
      return renderSVG(url, { whiteColor: "#f6f3eb", blackColor: "#242a26", border: 2 });
    } catch {
      return "";
    }
  }, [url]);
  (0, import_react5.useEffect)(() => {
    if (!zoomOpen) return void 0;
    const onEsc = (e3) => {
      if (e3.key === "Escape") setZoomOpen(false);
    };
    document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  }, [zoomOpen]);
  if (!svgMarkup) return null;
  return /* @__PURE__ */ import_react5.default.createElement("div", { className: "qr-card" }, /* @__PURE__ */ import_react5.default.createElement("div", { className: "qr-hd" }, /* @__PURE__ */ import_react5.default.createElement("b", null, title), badge ? /* @__PURE__ */ import_react5.default.createElement("span", { className: "tag" }, badge) : null), /* @__PURE__ */ import_react5.default.createElement(
    "button",
    {
      type: "button",
      className: "qr-thumb",
      title: "\u70B9\u51FB\u653E\u5927\u4E8C\u7EF4\u7801",
      onClick: () => setZoomOpen(true),
      dangerouslySetInnerHTML: { __html: svgMarkup }
    }
  ), /* @__PURE__ */ import_react5.default.createElement("div", { className: "qr-acts" }, /* @__PURE__ */ import_react5.default.createElement("button", { className: "btn btn--sm", type: "button", onClick: () => setZoomOpen(true) }, "\u653E\u5927"), onCopy && copyKind ? /* @__PURE__ */ import_react5.default.createElement("button", { className: "btn btn--sm", type: "button", onClick: () => onCopy(copyKind) }, "\u590D\u5236") : null), zoomOpen ? /* @__PURE__ */ import_react5.default.createElement("div", { className: "mtt-modal-backdrop", role: "dialog", "aria-modal": "true", "aria-label": title, onClick: () => setZoomOpen(false) }, /* @__PURE__ */ import_react5.default.createElement("div", { className: "mtt-qr-modal", onClick: (e3) => e3.stopPropagation() }, /* @__PURE__ */ import_react5.default.createElement("div", { className: "drawer-hd" }, /* @__PURE__ */ import_react5.default.createElement("span", { className: "silk" }, title), /* @__PURE__ */ import_react5.default.createElement("button", { className: "btn btn--sm", type: "button", onClick: () => setZoomOpen(false) }, "\u5173\u95ED")), /* @__PURE__ */ import_react5.default.createElement("div", { className: "qr-zoom-svg", dangerouslySetInnerHTML: { __html: svgMarkup } }), /* @__PURE__ */ import_react5.default.createElement("code", { className: "qr-zoom-url" }, url))) : null);
}

// client/components/DeliveryView.jsx
function DeliveryView({
  service,
  live,
  config,
  importInfo,
  tunnel,
  onRefreshState,
  onOpenSettings,
  onCopy,
  onExportConfig,
  onOpenSetup,
  onDiagAction,
  showToast
}) {
  const [shareBusy, setShareBusy] = (0, import_react6.useState)(false);
  const imp = importInfo || {};
  const cfg = config || {};
  const lastErr = live?.lastError && !live.lastError.resolved ? live.lastError : null;
  const running = Boolean(service?.running);
  const hasToken = Boolean(imp.hasToken);
  const shareUrl = imp.shareBestJsonUrl || imp.sharePublicJsonUrl || imp.shareRelayJsonUrl || imp.shareQuickJsonUrl || imp.shareJsonUrl || "";
  const shareCount = Array.isArray(cfg.auth?.readTokens) ? cfg.auth.readTokens.length : Array.isArray(imp.shareTokens) ? imp.shareTokens.length : 0;
  const copyShareUrl = async () => {
    if (shareUrl) {
      onCopy("share-import");
      return;
    }
    if (shareBusy) return;
    setShareBusy(true);
    try {
      const res = await createReadTokenApi("\u5206\u4EAB\u8BBE\u5907");
      await onRefreshState?.();
      const nextUrl = res?.import?.shareBestJsonUrl || res?.import?.shareJsonUrl || "";
      if (nextUrl) {
        const ok = await writeClipboard(nextUrl);
        showToast?.(ok ? "\u5DF2\u751F\u6210\u53EA\u8BFB\u5206\u4EAB\u4EE4\u724C\u5E76\u590D\u5236\u5730\u5740" : "\u5DF2\u751F\u6210\u53EA\u8BFB\u5206\u4EAB\u4EE4\u724C\uFF0C\u8BF7\u70B9\u51FB\u590D\u5236");
      } else {
        showToast?.("\u5DF2\u751F\u6210\u53EA\u8BFB\u5206\u4EAB\u4EE4\u724C");
      }
    } catch (err) {
      showToast?.(`\u751F\u6210\u5206\u4EAB\u5730\u5740\u5931\u8D25\uFF1A${String(err?.message || err)}`);
    } finally {
      setShareBusy(false);
    }
  };
  const lanUrls = Array.isArray(imp.lanUrls) ? imp.lanUrls : [];
  const publicJson = imp.publicJsonUrl || "";
  const relayJson = imp.relayJsonUrl || (imp.relayBaseUrl && imp.jsonUrl ? `${imp.relayBaseUrl}/legado.json${cfg.auth?.enabled && cfg.auth?.token ? `?token=${encodeURIComponent(cfg.auth.token)}` : ""}` : "");
  const wanJson = publicJson || relayJson;
  const quickJson = imp.quickJsonUrl || "";
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
  const openaiEnabled = Boolean(imp.openaiEnabled ?? cfg.openaiServer?.enabled);
  const openaiUsesCustomKey = Boolean(imp.openaiUsesCustomKey || cfg.openaiServer?.apiKey);
  const openaiBaseUrl = imp.openaiBaseUrl || `${imp.publicTunnelUrl || imp.relayBaseUrl || imp.quickTunnelUrl || `http://127.0.0.1:${service?.port || cfg.server?.port || 8291}`}/v1`;
  const openaiModel = cfg.openaiServer?.defaultModel || "audiobook-tts";
  const openaiKeyDisplay = openaiUsesCustomKey ? `${cfg.openaiServer?.apiKey || "\u5DF2\u914D\u7F6E\u72EC\u7ACB\u5BC6\u94A5"}\uFF08\u9632\u6CC4\u9732\u5DF2\u63A9\u7801\uFF0C\u8BF7\u5728\u8BBE\u7F6E 09 \u751F\u6210\u65F6\u4FDD\u5B58\uFF09` : token || "\u672A\u751F\u6210";
  const keyPlaceholder = openaiUsesCustomKey ? "<\u4F60\u7684\u72EC\u7ACB_OPENAI_KEY>" : token || "<\u4F60\u7684_URL_TOKEN>";
  const openaiCurl = [
    `curl -X POST '${openaiBaseUrl}/audio/speech' \\`,
    `  -H 'Authorization: Bearer ${keyPlaceholder}' \\`,
    "  -H 'Content-Type: application/json' \\",
    `  -d '{"model":"${openaiModel}","input":"\u5C71\u9053\u4E0A\u8D77\u4E86\u96FE\u3002","voice":"alloy","response_format":"wav"}' \\`,
    "  --output openai-test.wav"
  ].join("\n");
  const httpsRouteLabel = publicJson ? "\u56FA\u5B9A\u57DF\u540D" : imp.relayBaseUrl ? "Worker \u4E2D\u8F6C" : imp.quickTunnelUrl ? "Quick Tunnel" : "\u4EC5\u5C40\u57DF\u7F51";
  const dlvMeta = running ? `\u5C40\u57DF\u7F51\u76F4\u8FDE \xB7 ${hasToken ? "\u4EE4\u724C\u5DF2\u914D\u7F6E" : "\u4EE4\u724C\u672A\u542F\u7528"}${wanJson ? " \xB7 \u56FA\u5B9A\u516C\u7F51\u5C31\u7EEA" : imp.quickTunnelUrl ? " \xB7 Quick Tunnel \u8FD0\u884C\u4E2D" : ""}` : "\u670D\u52A1\u5DF2\u505C\u6B62 \xB7 \u5148\u542F\u52A8\u518D\u4EA4\u4ED8";
  const checks = [
    [running, "\u670D\u52A1\u8FD0\u884C", running ? "RUN" : "STOP"],
    [hasToken, "URL \u4EE4\u724C", hasToken ? "\u5DF2\u914D\u7F6E" : "\u7F3A\u5931"],
    [Boolean(cfg.auth?.enabled), "Basic \u9274\u6743", cfg.auth?.enabled ? "\u5F00\u542F" : "\u5173\u95ED"],
    [lanUrls.length > 0, "\u5C40\u57DF\u7F51\u5165\u53E3", `${lanUrls.length} \u4E2A`],
    [Boolean(publicJson || imp.relayBaseUrl || imp.quickTunnelUrl), "HTTPS \u901A\u9053", httpsRouteLabel],
    [openaiEnabled, "OpenAI \u7AEF\u70B9", openaiEnabled ? openaiUsesCustomKey ? "\u5F00\u542F \xB7 \u72EC\u7ACBKey" : "\u5F00\u542F \xB7 \u590D\u7528Token" : "\u5DF2\u5173\u95ED"],
    [extraCount > 0, "\u9644\u52A0\u8BF7\u6C42\u5934", extraCount ? `${extraCount} \u9879` : "\u672A\u8BBE\u7F6E"],
    [true, "\u7AEF\u53E3", `${service?.host || cfg.server?.host || "\u2014"}:${service?.port || cfg.server?.port || "\u2014"}`],
    [true, "\u5F15\u64CE", PROVIDER_CN[provider] || provider]
  ];
  const specRow = (sk, sv, sa) => /* @__PURE__ */ import_react6.default.createElement(import_react6.default.Fragment, { key: sk }, /* @__PURE__ */ import_react6.default.createElement("span", { className: "sk" }, sk), /* @__PURE__ */ import_react6.default.createElement("span", { className: "sv" }, sv), /* @__PURE__ */ import_react6.default.createElement("span", { className: "sa" }, sa || null));
  return /* @__PURE__ */ import_react6.default.createElement("section", { className: "view view--delivery", id: "view-delivery", "aria-label": "\u4EA4\u4ED8" }, /* @__PURE__ */ import_react6.default.createElement("div", { className: "dlv-left" }, /* @__PURE__ */ import_react6.default.createElement("div", null, /* @__PURE__ */ import_react6.default.createElement("h2", null, "\u4EA4\u4ED8"), /* @__PURE__ */ import_react6.default.createElement("div", { className: "sub" }, "Master Delivery")), /* @__PURE__ */ import_react6.default.createElement("p", { className: "chain-note", style: { margin: 0 } }, "\u4EA4\u4ED8\u7269 = \u4E00\u6761 Legado \u5728\u7EBF\u6717\u8BFB\u5F15\u64CE\u3002", /* @__PURE__ */ import_react6.default.createElement("br", null), "\u652F\u6301\u624B\u673A\u79BB\u7EBF\u626B\u7801\u6216\u590D\u5236 URL \u5BFC\u5165\u3002"), /* @__PURE__ */ import_react6.default.createElement("ol", { className: "steps" }, /* @__PURE__ */ import_react6.default.createElement("li", { className: "step" }, /* @__PURE__ */ import_react6.default.createElement("span", { className: "sn" }, "01"), /* @__PURE__ */ import_react6.default.createElement("div", null, /* @__PURE__ */ import_react6.default.createElement("b", null, "\u786E\u8BA4\u670D\u52A1\u5728\u8DD1"), /* @__PURE__ */ import_react6.default.createElement("span", null, `transport \u663E\u793A RUN\uFF0C\u7AEF\u53E3 ${service?.port || cfg.server?.port || "\u2014"} \u5728\u76D1\u542C`))), /* @__PURE__ */ import_react6.default.createElement("li", { className: "step" }, /* @__PURE__ */ import_react6.default.createElement("span", { className: "sn" }, "02"), /* @__PURE__ */ import_react6.default.createElement("div", null, /* @__PURE__ */ import_react6.default.createElement("b", null, "\u626B\u7801\u6216\u590D\u5236\u5730\u5740"), /* @__PURE__ */ import_react6.default.createElement("span", null, "\u540C Wi-Fi \u7528\u300C\u5C40\u57DF\u7F51\u626B\u7801\u300D\uFF1B\u7A7F\u900F\u516C\u7F51\u7528\u300C\u516C\u7F51\u5BFC\u5165\u7801\u300D"))), /* @__PURE__ */ import_react6.default.createElement("li", { className: "step" }, /* @__PURE__ */ import_react6.default.createElement("span", { className: "sn" }, "03"), /* @__PURE__ */ import_react6.default.createElement("div", null, /* @__PURE__ */ import_react6.default.createElement("b", null, "\u5728\u9605\u8BFB\u91CC\u5BFC\u5165"), /* @__PURE__ */ import_react6.default.createElement("span", null, "\u6717\u8BFB\u754C\u9762 \u2192 \u8BBE\u7F6E \u2192 \u5728\u7EBF\u6717\u8BFB \u2192 \u7F51\u7EDC\u5BFC\u5165 \u2192 \u7C98\u8D34\u6216\u8BC6\u522B\u6587\u672C"))), /* @__PURE__ */ import_react6.default.createElement("li", { className: "step" }, /* @__PURE__ */ import_react6.default.createElement("span", { className: "sn" }, "04"), /* @__PURE__ */ import_react6.default.createElement("div", null, /* @__PURE__ */ import_react6.default.createElement("b", null, "\u5728\u7EBF\u4EA4\u4E92\u8BD5\u542C"), /* @__PURE__ */ import_react6.default.createElement("span", null, "\u4E0B\u65B9\u53EF\u76F4\u63A5\u5408\u6210\u65C1\u767D/\u5BF9\u8BDD/\u6DF7\u6392 WAV \u9A8C\u8BC1\u97F3\u8272\u4E0E\u94FE\u8DEF")))), /* @__PURE__ */ import_react6.default.createElement("div", { className: "arch-sec", style: { marginTop: "auto" } }, /* @__PURE__ */ import_react6.default.createElement(Rowx, { k: "\u5E76\u53D1", v: `${concurrency} \u8DEF` }), /* @__PURE__ */ import_react6.default.createElement(Rowx, { k: "\u9650\u901F", v: `${rpm} \u6B21 / \u5206\u949F` }), /* @__PURE__ */ import_react6.default.createElement(Rowx, { k: "Body", v: "form-urlencoded" }))), /* @__PURE__ */ import_react6.default.createElement("div", { className: "dlv-main" }, /* @__PURE__ */ import_react6.default.createElement("div", { className: "dlv-top" }, /* @__PURE__ */ import_react6.default.createElement("div", { className: "dh" }, /* @__PURE__ */ import_react6.default.createElement("span", { className: "silk" }, "DELIVERY NOTE"), /* @__PURE__ */ import_react6.default.createElement("b", null, "\u6BCD\u5E26\u4EA4\u4ED8\u5355")), /* @__PURE__ */ import_react6.default.createElement("div", { className: "dmeta" }, dlvMeta)), /* @__PURE__ */ import_react6.default.createElement(
    HttpsAccessCard,
    {
      service,
      config,
      importInfo: imp,
      tunnel,
      onRefreshState,
      onCopy,
      showToast
    }
  ), /* @__PURE__ */ import_react6.default.createElement("div", { className: "qr-grid", "aria-label": "\u79BB\u7EBF\u5BFC\u5165\u4E8C\u7EF4\u7801" }, /* @__PURE__ */ import_react6.default.createElement(
    QrCard,
    {
      title: "\u5C40\u57DF\u7F51\u626B\u7801\u5BFC\u5165",
      badge: "LAN",
      url: imp.jsonUrl,
      copyKind: "import",
      onCopy
    }
  ), wanJson ? /* @__PURE__ */ import_react6.default.createElement(
    QrCard,
    {
      title: "\u516C\u7F51\u7A7F\u900F\u626B\u7801\u5BFC\u5165",
      badge: publicJson ? "WAN" : "RELAY",
      url: wanJson,
      copyKind: publicJson ? "public-import" : "relay-import",
      onCopy
    }
  ) : null, quickJson ? /* @__PURE__ */ import_react6.default.createElement(
    QrCard,
    {
      title: "\u4E34\u65F6 HTTPS \u626B\u7801\u5BFC\u5165",
      badge: "QUICK",
      url: quickJson,
      copyKind: "quick-import",
      onCopy
    }
  ) : null), /* @__PURE__ */ import_react6.default.createElement("div", { className: "labelblock openai-card", id: "openaiAccessCard" }, /* @__PURE__ */ import_react6.default.createElement("div", { className: "lb-hd" }, /* @__PURE__ */ import_react6.default.createElement("span", { className: "silk" }, "OPENAI COMPATIBLE ", /* @__PURE__ */ import_react6.default.createElement("b", null, "OpenAI \u517C\u5BB9\u9605\u8BFB\u8F6F\u4EF6\u63A5\u5165\u5355")), /* @__PURE__ */ import_react6.default.createElement("span", { className: `tag${openaiEnabled ? " tape" : ""}` }, openaiEnabled ? "ENABLED" : "DISABLED")), openaiEnabled ? /* @__PURE__ */ import_react6.default.createElement(import_react6.default.Fragment, null, /* @__PURE__ */ import_react6.default.createElement("div", { className: "spec" }, specRow(
    "BASE URL",
    openaiBaseUrl,
    /* @__PURE__ */ import_react6.default.createElement("button", { className: "btn btn--sm btn--ghost", type: "button", "data-copy": "openai-base", onClick: () => onCopy("openai-base") }, "\u590D\u5236")
  ), specRow(
    "API KEY",
    openaiKeyDisplay,
    !openaiUsesCustomKey && token ? /* @__PURE__ */ import_react6.default.createElement("button", { className: "btn btn--sm btn--ghost", type: "button", "data-copy": "token", onClick: () => onCopy("token") }, "\u590D\u5236") : null
  ), specRow("MODEL", `${openaiModel}\uFF08\u540C\u65F6\u517C\u5BB9 tts-1 / tts-1-hd / gpt-4o-mini-tts\uFF09`), specRow("VOICE", "alloy\uFF08\u81EA\u52A8\u65C1\u767D/\u5BF9\u8BDD\u5206\u97F3\u8272\uFF1B\u4E5F\u53EF\u586B narrator / dialogue / \u9884\u7F6E\u97F3\u8272\uFF09")), /* @__PURE__ */ import_react6.default.createElement("div", { className: "https-bar", style: { marginTop: 7 } }, /* @__PURE__ */ import_react6.default.createElement("button", { className: "btn btn--sm btn--tape", type: "button", "data-copy": "openai-card", onClick: () => onCopy("openai-card") }, "\u590D\u5236\u5B8C\u6574\u914D\u7F6E"), /* @__PURE__ */ import_react6.default.createElement("button", { className: "btn btn--sm", type: "button", "data-copy": "openai-curl", onClick: () => onCopy("openai-curl") }, "\u590D\u5236 curl /v1/audio/speech \u9A8C\u8BC1"), /* @__PURE__ */ import_react6.default.createElement("button", { className: "btn btn--sm btn--ghost", type: "button", onClick: () => onOpenSettings?.("mod-openai-server") }, "\u8C03\u6574\u97F3\u8272\u6620\u5C04")), /* @__PURE__ */ import_react6.default.createElement("pre", { className: "code", style: { marginTop: 7 } }, openaiCurl)) : /* @__PURE__ */ import_react6.default.createElement("div", { className: "collapsed-note" }, /* @__PURE__ */ import_react6.default.createElement("span", null, "\u5BF9\u5916 OpenAI \u7AEF\u70B9\uFF08", /* @__PURE__ */ import_react6.default.createElement("code", null, "/v1/audio/speech"), " & ", /* @__PURE__ */ import_react6.default.createElement("code", null, "/v1/models"), "\uFF09\u9ED8\u8BA4\u5173\u95ED\u3002\u5F00\u542F\u540E\u53EF\u63A5\u5165 Readest\u3001\u4E66\u9601\u3001\u5F00\u6E90\u9605\u8BFB AI \u63D2\u4EF6\u7B49\u5BA2\u6237\u7AEF\u3002"), /* @__PURE__ */ import_react6.default.createElement("button", { className: "btn btn--sm btn--tape", type: "button", onClick: () => onOpenSettings?.("mod-openai-server") }, "\u524D\u5F80\u6E32\u67D3\u8BBE\u7F6E\u5F00\u542F"))), /* @__PURE__ */ import_react6.default.createElement("div", { className: "labelblock" }, /* @__PURE__ */ import_react6.default.createElement("div", { className: "lb-hd" }, /* @__PURE__ */ import_react6.default.createElement("span", { className: "silk" }, "SHARE URL \xB7 READ-ONLY ", /* @__PURE__ */ import_react6.default.createElement("b", null, "\u53EA\u8BFB\u5206\u4EAB\u5730\u5740\uFF08\u63A8\u8350\u53D1\u7ED9\u670B\u53CB / \u4ECE\u8BBE\u5907\uFF09")), /* @__PURE__ */ import_react6.default.createElement("span", { className: `tag${shareUrl ? " tape" : ""}` }, shareCount ? `${shareCount} \u53F0\u8BBE\u5907` : "\u672A\u7B7E\u53D1")), /* @__PURE__ */ import_react6.default.createElement("div", { className: "addr" }, /* @__PURE__ */ import_react6.default.createElement("code", { id: "shareImportUrl" }, shareUrl || "\u5C1A\u672A\u521B\u5EFA\u53EA\u8BFB\u5206\u4EAB\u4EE4\u724C \u2014 \u70B9\u51FB\u53F3\u4FA7\u6309\u94AE\u81EA\u52A8\u7B7E\u53D1\u5E76\u590D\u5236\uFF08\u4EC5\u5141\u8BB8\u542C\u4E66\u4E0E OpenAI \u5408\u6210\uFF0C\u8BBF\u95EE /api/* \u4E00\u5F8B 403\uFF09"), /* @__PURE__ */ import_react6.default.createElement(
    "button",
    {
      className: "btn btn--sm btn--tape",
      type: "button",
      disabled: shareBusy,
      "data-copy": "share-import",
      onClick: copyShareUrl
    },
    shareBusy ? "\u751F\u6210\u4E2D\u2026" : shareUrl ? "\u590D\u5236\u5206\u4EAB\u5730\u5740" : "\u751F\u6210\u5E76\u590D\u5236\u5206\u4EAB\u5730\u5740"
  ), /* @__PURE__ */ import_react6.default.createElement("button", { className: "btn btn--sm btn--ghost", type: "button", onClick: () => onOpenSettings?.("mod-auth") }, "\u8BBE\u5907\u4EE4\u724C\u7BA1\u7406")), /* @__PURE__ */ import_react6.default.createElement("div", { className: "addr-note" }, "\u5206\u4EAB\u7ED9\u4ED6\u4EBA\u8BF7\u52A1\u5FC5\u4F7F\u7528\u53EA\u8BFB\u5730\u5740\uFF1B\u4E3B\u7BA1\u7406\u4EE4\u724C\u62E5\u6709\u4FEE\u6539\u914D\u7F6E\u4E0E\u542F\u505C\u6743\u9650\uFF0C\u5207\u52FF\u5916\u4F20\u3002\u82E5\u67D0\u8BBE\u5907\u4EE4\u724C\u6CC4\u9732\uFF0C\u53EF\u5728\u300C\u8BBE\u7F6E \u2192 10 \u9274\u6743\u4E0E\u65E5\u5FD7\u300D\u5355\u72EC\u540A\u9500\u3002")), /* @__PURE__ */ import_react6.default.createElement("div", { className: "labelblock" }, /* @__PURE__ */ import_react6.default.createElement("div", { className: "lb-hd" }, /* @__PURE__ */ import_react6.default.createElement("span", { className: "silk" }, "ADMIN IMPORT URL ", /* @__PURE__ */ import_react6.default.createElement("b", null, "\u7BA1\u7406\u5BFC\u5165\u5730\u5740\uFF08\u5B8C\u6574\u6743\u9650 \xB7 \u81EA\u7528\uFF09")), /* @__PURE__ */ import_react6.default.createElement("span", { className: "silk" }, publicJson ? "WAN" : "LAN")), /* @__PURE__ */ import_react6.default.createElement("div", { className: "addr" }, /* @__PURE__ */ import_react6.default.createElement("code", { id: "importUrl" }, jsonUrl), /* @__PURE__ */ import_react6.default.createElement("button", { className: "btn btn--sm btn--tape", type: "button", "data-copy": "import", onClick: () => onCopy("import") }, "\u590D\u5236\u5BFC\u5165\u5730\u5740")), publicJson ? /* @__PURE__ */ import_react6.default.createElement("div", { className: "addr", style: { marginTop: 6 } }, /* @__PURE__ */ import_react6.default.createElement("code", { id: "publicImportUrl" }, publicJson), /* @__PURE__ */ import_react6.default.createElement("button", { className: "btn btn--sm", type: "button", "data-copy": "public-import", onClick: () => onCopy("public-import") }, "\u590D\u5236\u516C\u7F51")) : null, /* @__PURE__ */ import_react6.default.createElement("div", { className: "addr-note", id: "importNote" }, lanUrls.length ? `\u5C40\u57DF\u7F51 ${lanUrls[0]} \xB7 \u624B\u673A\u4E0E\u7535\u8111\u9700\u5728\u540C\u4E00\u7F51\u6BB5${publicJson ? "" : imp.relayBaseUrl ? " \xB7 \u4E2D\u8F6C\u516C\u7F51\u5C31\u7EEA" : imp.quickTunnelUrl ? " \xB7 Quick Tunnel \u8FD0\u884C\u4E2D" : " \xB7 \u5BF9\u5916\u5730\u5740\u672A\u8BBE\u7F6E"}` : "\u5BBF\u4E3B\u8FD8\u6CA1\u63A2\u6D4B\u5230\u5C40\u57DF\u7F51\u5730\u5740 \xB7 \u4ECD\u53EF\u7528\u4E0B\u65B9 curl \u6216\u300C\u8BD5\u542C\u300D\u5728\u672C\u673A\u9A8C\u8BC1")), /* @__PURE__ */ import_react6.default.createElement("div", { className: "labelblock" }, /* @__PURE__ */ import_react6.default.createElement("div", { className: "lb-hd" }, /* @__PURE__ */ import_react6.default.createElement("span", { className: "silk" }, "LISTEN URL ", /* @__PURE__ */ import_react6.default.createElement("b", null, "\u6717\u8BFB\u63A5\u53E3")), /* @__PURE__ */ import_react6.default.createElement("span", { className: "silk" }, "POST \xB7 WAV")), /* @__PURE__ */ import_react6.default.createElement("div", { className: "addr" }, /* @__PURE__ */ import_react6.default.createElement("code", { id: "listenUrl" }, listenUrl), /* @__PURE__ */ import_react6.default.createElement("button", { className: "btn btn--sm", type: "button", "data-copy": "listen", onClick: () => onCopy("listen") }, "\u590D\u5236\u6717\u8BFB")), /* @__PURE__ */ import_react6.default.createElement("div", { className: "spec", style: { marginTop: 7 } }, specRow("METHOD", "POST"), specRow("CONTENT-TYPE", "application/x-www-form-urlencoded"), specRow(
    "BODY",
    BODY_TEXT,
    /* @__PURE__ */ import_react6.default.createElement("button", { className: "btn btn--sm btn--ghost", type: "button", "data-copy": "body", onClick: () => onCopy("body") }, "\u590D\u5236")
  ), specRow(
    "URL \u4EE4\u724C",
    token ? `?token=${token}` : "\u672A\u542F\u7528",
    token ? /* @__PURE__ */ import_react6.default.createElement("button", { className: "btn btn--sm btn--ghost", type: "button", "data-copy": "token", onClick: () => onCopy("token") }, "\u590D\u5236") : null
  ), specRow("\u5E76\u53D1 / \u9650\u901F", `${concurrency} \u8DEF \xB7 ${rpm} \u6B21 / \u5206\u949F`))), /* @__PURE__ */ import_react6.default.createElement("div", { className: "labelblock grease" }, /* @__PURE__ */ import_react6.default.createElement("div", { className: "lb-hd" }, /* @__PURE__ */ import_react6.default.createElement("span", { className: "silk" }, "MASTER CONTENT ", /* @__PURE__ */ import_react6.default.createElement("b", null, "\u6BCD\u5E26\u5185\u5BB9 \xB7 legado.json")), /* @__PURE__ */ import_react6.default.createElement("button", { className: "btn btn--sm", type: "button", "data-copy": "json", onClick: () => onCopy("json") }, "\u590D\u5236 JSON")), /* @__PURE__ */ import_react6.default.createElement("pre", { className: "code json", id: "jsonBlock" }, JSON.stringify(payload, null, 2))), /* @__PURE__ */ import_react6.default.createElement("div", { className: "labelblock" }, /* @__PURE__ */ import_react6.default.createElement("div", { className: "lb-hd" }, /* @__PURE__ */ import_react6.default.createElement("span", { className: "silk" }, "SMOKE TEST ", /* @__PURE__ */ import_react6.default.createElement("b", null, "\u5728\u7EBF\u8BD5\u542C\u4E0E curl \u9A8C\u6536")), /* @__PURE__ */ import_react6.default.createElement("button", { className: "btn btn--sm", type: "button", "data-copy": "curl", onClick: () => onCopy("curl") }, "\u590D\u5236 curl")), /* @__PURE__ */ import_react6.default.createElement(
    PreviewPlayer,
    {
      draftPatch: null,
      showToast,
      defaultRole: "narrator",
      showRuleToggle: true,
      title: "\u5DF2\u4FDD\u5B58\u914D\u7F6E\u76F4\u63A5\u8BD5\u542C"
    }
  ), /* @__PURE__ */ import_react6.default.createElement("pre", { className: "code", id: "curlBlock", style: { marginTop: 8 } }, curl))), /* @__PURE__ */ import_react6.default.createElement("aside", { className: "dlv-right" }, /* @__PURE__ */ import_react6.default.createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 } }, /* @__PURE__ */ import_react6.default.createElement("div", null, /* @__PURE__ */ import_react6.default.createElement("h2", null, "\u4EA4\u4ED8\u6821\u9A8C"), /* @__PURE__ */ import_react6.default.createElement("div", { className: "sub" }, "Preflight")), /* @__PURE__ */ import_react6.default.createElement("button", { className: "btn btn--sm", type: "button", onClick: onOpenSetup }, "\u8FD0\u884C\u4F53\u68C0")), /* @__PURE__ */ import_react6.default.createElement("div", { className: "checklist" }, checks.map(([ok, label, value]) => /* @__PURE__ */ import_react6.default.createElement("div", { key: label, className: `check${ok ? "" : " warn"}` }, /* @__PURE__ */ import_react6.default.createElement("span", { className: "ck" }, ok ? "\u2713" : "\u25CB"), /* @__PURE__ */ import_react6.default.createElement("span", { className: "cn2" }, label), /* @__PURE__ */ import_react6.default.createElement("span", { className: "cv", title: String(value) }, String(value))))), lastErr && /* @__PURE__ */ import_react6.default.createElement("div", { className: "errcodes", "data-testid": "last-error-diagnostic", style: { borderColor: "var(--grease)", background: "rgba(177, 58, 34, 0.06)" } }, /* @__PURE__ */ import_react6.default.createElement("span", { className: "silk", style: { marginBottom: 3, color: "var(--grease)" } }, "LAST ERROR ", /* @__PURE__ */ import_react6.default.createElement("b", null, "\u6700\u8FD1\u4E00\u6B21\u5F02\u5E38 (", lastErr.status, ")")), /* @__PURE__ */ import_react6.default.createElement("div", { style: { fontSize: 12, fontWeight: 600, marginBottom: 2 } }, lastErr.message), lastErr.hint && /* @__PURE__ */ import_react6.default.createElement("div", { style: { fontSize: 11, opacity: 0.85, marginBottom: 6 } }, lastErr.hint), /* @__PURE__ */ import_react6.default.createElement("div", { style: { display: "flex", flexWrap: "wrap", gap: 6 } }, lastErr.action === "switch-local" && /* @__PURE__ */ import_react6.default.createElement("button", { className: "btn btn--sm btn--tape", type: "button", onClick: () => onDiagAction?.("switch-local") }, "\u4E00\u952E\u5207\u5230\u672C\u5730 Qwen3"), lastErr.action === "start-service" && /* @__PURE__ */ import_react6.default.createElement("button", { className: "btn btn--sm btn--tape", type: "button", onClick: () => onDiagAction?.("start-service") }, "\u7ACB\u5373\u542F\u52A8\u670D\u52A1"), lastErr.action === "open-setup" && /* @__PURE__ */ import_react6.default.createElement("button", { className: "btn btn--sm", type: "button", onClick: onOpenSetup }, "\u6253\u5F00\u4F53\u68C0\u4FEE\u590D"), (lastErr.action === "open-settings" || lastErr.action === "switch-local") && /* @__PURE__ */ import_react6.default.createElement("button", { className: "btn btn--sm", type: "button", onClick: onOpenSettings }, "\u524D\u5F80\u6E32\u67D3\u8BBE\u7F6E"))), /* @__PURE__ */ import_react6.default.createElement("div", { className: "errcodes" }, /* @__PURE__ */ import_react6.default.createElement("span", { className: "silk", style: { marginBottom: 3 } }, "ERROR CODES ", /* @__PURE__ */ import_react6.default.createElement("b", null, "\u9519\u8BEF\u7801")), ERR_CODES.map(([code, fix]) => /* @__PURE__ */ import_react6.default.createElement("div", { key: code, className: "errcode" }, /* @__PURE__ */ import_react6.default.createElement("b", null, code), /* @__PURE__ */ import_react6.default.createElement("span", null, fix)))), /* @__PURE__ */ import_react6.default.createElement("div", { className: "dlv-actions" }, /* @__PURE__ */ import_react6.default.createElement("button", { className: "btn btn--sm", type: "button", "data-copy": "import", onClick: () => onCopy("import") }, "\u590D\u5236\u5BFC\u5165\u5730\u5740"), /* @__PURE__ */ import_react6.default.createElement("button", { className: "btn btn--sm", type: "button", "data-copy": "json", onClick: () => onCopy("json") }, "\u590D\u5236 JSON"), /* @__PURE__ */ import_react6.default.createElement("button", { className: "btn btn--sm", type: "button", "data-copy": "curl", onClick: () => onCopy("curl") }, "\u590D\u5236 curl"), /* @__PURE__ */ import_react6.default.createElement("button", { className: "btn btn--sm", type: "button", "data-action": "export-config", onClick: onExportConfig }, "\u5BFC\u51FA\u914D\u7F6E")), /* @__PURE__ */ import_react6.default.createElement("p", { className: "hint", style: { marginTop: "auto" } }, "\u624B\u673A\u76F8\u673A\u6216 Legado \u4E8C\u7EF4\u7801\u8BC6\u522B\u53EF\u76F4\u63A5\u626B\u4E0A\u65B9\u4E8C\u7EF4\u7801\uFF08\u7EAF\u79BB\u7EBF SVG \u751F\u6210\uFF0C\u4E0D\u7ECF\u7B2C\u4E09\u65B9\u670D\u52A1\u5668\uFF09\u3002")));
}

// client/components/SettingsView.jsx
var import_react10 = __toESM(require("react"), 1);

// client/components/LexiconEditor.jsx
var import_react7 = __toESM(require("react"), 1);

// src/lexicon.mjs
var MAX_TEXT_RULES = 200;
var MAX_RULE_PATTERN_LEN = 200;
var MAX_RULE_REPLACE_LEN = 500;
var VALID_SCOPES = /* @__PURE__ */ new Set(["all", "narrator", "dialogue"]);
var ALLOWED_FLAGS = /* @__PURE__ */ new Set(["g", "i", "m", "u"]);
function readQuantifier(pattern, start) {
  const ch = pattern[start];
  if (ch === "*" || ch === "+") {
    const lazy = pattern[start + 1] === "?" ? 1 : 0;
    return { consumed: 1 + lazy, isRepeating: true };
  }
  if (ch === "?") {
    const lazy = pattern[start + 1] === "?" ? 1 : 0;
    return { consumed: 1 + lazy, isRepeating: false };
  }
  if (ch === "{") {
    const m2 = /^\{(\d+)(?:,(\d*))?\}/.exec(pattern.slice(start));
    if (!m2) return null;
    const min = Number(m2[1]);
    const max = m2[2] === void 0 ? min : m2[2] === "" ? Infinity : Number(m2[2]);
    const afterBrace = start + m2[0].length;
    const lazy = pattern[afterBrace] === "?" ? 1 : 0;
    return { consumed: m2[0].length + lazy, isRepeating: max === Infinity || max > 1 };
  }
  return null;
}
function findRegexSafetyIssue(pattern) {
  let escaped = false;
  let inClass = false;
  const stack = [{ hasQuant: false }];
  for (let i3 = 0; i3 < pattern.length; i3++) {
    const ch = pattern[i3];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (ch === "\\") {
      escaped = true;
      continue;
    }
    if (inClass) {
      if (ch === "]") inClass = false;
      continue;
    }
    if (ch === "[") {
      inClass = true;
      continue;
    }
    if (ch === "(") {
      stack.push({ hasQuant: false });
      continue;
    }
    if (ch === ")") {
      const frame = stack.length > 1 ? stack.pop() : { hasQuant: false };
      const q = readQuantifier(pattern, i3 + 1);
      if (q) {
        i3 += q.consumed;
        if (q.isRepeating && frame.hasQuant) {
          return "\u68C0\u6D4B\u5230\u5D4C\u5957\u91CF\u8BCD\uFF08\u5982 (a+)+\uFF09\uFF0C\u5B58\u5728\u6B63\u5219\u56DE\u6EAF\u5361\u6B7B\u98CE\u9669";
        }
        if (q.isRepeating && stack.length > 0) stack[stack.length - 1].hasQuant = true;
      }
      if (frame.hasQuant && stack.length > 0) stack[stack.length - 1].hasQuant = true;
      continue;
    }
    if (ch === "*" || ch === "+" || ch === "{") {
      const q = readQuantifier(pattern, i3);
      if (q) {
        i3 += q.consumed - 1;
        if (q.isRepeating && stack.length > 0) stack[stack.length - 1].hasQuant = true;
      }
    }
  }
  return "";
}
function normalizeFlags(flags) {
  const raw = String(flags || "g");
  for (const ch of raw) {
    if (!ALLOWED_FLAGS.has(ch)) {
      return { flags: "", error: `\u4E0D\u652F\u6301\u7684\u6B63\u5219\u6807\u5FD7 "${ch}"\uFF08\u4EC5\u5141\u8BB8 g / i / m / u\uFF09` };
    }
  }
  const uniq = /* @__PURE__ */ new Set(["g", ...raw]);
  return { flags: [...uniq].join(""), error: "" };
}
function validateTextRules(textRules) {
  const problems = [];
  if (textRules === void 0 || textRules === null) return problems;
  if (typeof textRules !== "object" || Array.isArray(textRules)) {
    return ["textRules \u5FC5\u987B\u662F\u5BF9\u8C61"];
  }
  if (textRules.disabledPresets !== void 0 && !Array.isArray(textRules.disabledPresets)) {
    problems.push("textRules.disabledPresets \u5FC5\u987B\u662F\u6570\u7EC4");
  }
  if (textRules.items === void 0) return problems;
  if (!Array.isArray(textRules.items)) {
    return ["textRules.items \u5FC5\u987B\u662F\u6570\u7EC4"];
  }
  if (textRules.items.length > MAX_TEXT_RULES) {
    problems.push(`\u53D1\u97F3/\u65AD\u53E5\u89C4\u5219\u4E0D\u80FD\u8D85\u8FC7 ${MAX_TEXT_RULES} \u6761\uFF08\u5F53\u524D ${textRules.items.length} \u6761\uFF09`);
  }
  for (let idx = 0; idx < textRules.items.length; idx++) {
    const it = textRules.items[idx];
    const label = `\u89C4\u5219 #${idx + 1}${it?.name ? `\uFF08${String(it.name).slice(0, 20)}\uFF09` : ""}`;
    if (!it || typeof it !== "object") {
      problems.push(`${label}\uFF1A\u5FC5\u987B\u662F\u5BF9\u8C61`);
      continue;
    }
    const pattern = String(it.pattern ?? "");
    if (!pattern) {
      problems.push(`${label}\uFF1A\u5339\u914D\u6A21\u5F0F\uFF08pattern\uFF09\u4E0D\u80FD\u4E3A\u7A7A`);
      continue;
    }
    if (pattern.length > MAX_RULE_PATTERN_LEN) {
      problems.push(`${label}\uFF1A\u5339\u914D\u6A21\u5F0F\u957F\u5EA6\u8D85\u8FC7 ${MAX_RULE_PATTERN_LEN} \u5B57\u7B26\u9650\u5236`);
    }
    const replace = String(it.replace ?? "");
    if (replace.length > MAX_RULE_REPLACE_LEN) {
      problems.push(`${label}\uFF1A\u66FF\u6362\u6587\u672C\u957F\u5EA6\u8D85\u8FC7 ${MAX_RULE_REPLACE_LEN} \u5B57\u7B26\u9650\u5236`);
    }
    const scope = it.scope || "all";
    if (!VALID_SCOPES.has(scope)) {
      problems.push(`${label}\uFF1Ascope \u5FC5\u987B\u662F all / narrator / dialogue`);
    }
    if (it.regex) {
      const { flags, error: flagErr } = normalizeFlags(it.flags);
      if (flagErr) {
        problems.push(`${label}\uFF1A${flagErr}`);
        continue;
      }
      const safetyErr = findRegexSafetyIssue(pattern);
      if (safetyErr) {
        problems.push(`${label}\uFF1A${safetyErr}`);
        continue;
      }
      try {
        new RegExp(pattern, flags);
      } catch (err) {
        problems.push(`${label}\uFF1A\u6B63\u5219\u8868\u8FBE\u5F0F\u8BED\u6CD5\u9519\u8BEF\uFF08${err?.message || err}\uFF09`);
      }
    }
  }
  return problems;
}
function exportRulesJson(items = []) {
  const clean = (Array.isArray(items) ? items : []).map((it) => ({
    id: it.id || void 0,
    name: String(it.name || ""),
    pattern: String(it.pattern || ""),
    replace: String(it.replace ?? ""),
    regex: Boolean(it.regex),
    flags: it.regex ? String(it.flags || "g") : void 0,
    scope: it.scope || "all",
    enabled: it.enabled !== false
  }));
  return JSON.stringify(clean, null, 2);
}
function csvCell(v2) {
  const s3 = String(v2 ?? "");
  return /[",\r\n]/.test(s3) ? `"${s3.replaceAll('"', '""')}"` : s3;
}
function exportRulesCsv(items = []) {
  const header = "name,pattern,replace,scope,regex,flags,enabled";
  const lines = (Array.isArray(items) ? items : []).map((it) => [
    csvCell(it.name || ""),
    csvCell(it.pattern || ""),
    csvCell(it.replace ?? ""),
    csvCell(it.scope || "all"),
    csvCell(Boolean(it.regex)),
    csvCell(it.regex ? it.flags || "g" : ""),
    csvCell(it.enabled !== false)
  ].join(","));
  return [header, ...lines].join("\n");
}
function parseCsvLine(line) {
  const out = [];
  let cur = "";
  let inQuotes = false;
  for (let i3 = 0; i3 < line.length; i3++) {
    const ch = line[i3];
    if (inQuotes) {
      if (ch === '"' && line[i3 + 1] === '"') {
        cur += '"';
        i3++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        cur += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      out.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out;
}
function importRulesFromText(rawText, format = "auto") {
  const text = String(rawText ?? "").trim();
  if (!text) return { items: [], problems: ["\u5BFC\u5165\u5185\u5BB9\u4E3A\u7A7A"] };
  const mode = format === "auto" ? text.startsWith("[") || text.startsWith("{") ? "json" : "csv" : String(format).toLowerCase();
  let parsed = [];
  if (mode === "json") {
    let data;
    try {
      data = JSON.parse(text);
    } catch (err) {
      return { items: [], problems: [`JSON \u89E3\u6790\u5931\u8D25\uFF1A${err.message}`] };
    }
    const rawItems = Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : null;
    if (!rawItems) return { items: [], problems: ["JSON \u5FC5\u987B\u662F\u89C4\u5219\u6570\u7EC4\u6216\u542B items \u5B57\u6BB5\u7684\u5BF9\u8C61"] };
    parsed = rawItems.map((it, idx) => ({
      id: String(it?.id || `rule:imp-${Date.now().toString(36)}-${idx}`),
      name: String(it?.name || `\u5BFC\u5165\u89C4\u5219 ${idx + 1}`),
      pattern: String(it?.pattern ?? ""),
      replace: String(it?.replace ?? ""),
      regex: Boolean(it?.regex),
      flags: it?.regex ? String(it?.flags || "g") : "g",
      scope: String(it?.scope || "all"),
      enabled: it?.enabled !== false
    }));
  } else {
    const lines = text.split(/\r?\n/).map((l3) => l3.trim()).filter(Boolean);
    if (!lines.length) return { items: [], problems: ["CSV \u5185\u5BB9\u4E3A\u7A7A"] };
    const firstCols = parseCsvLine(lines[0]).map((c2) => c2.trim().toLowerCase());
    const hasHeader = firstCols.includes("pattern") && firstCols.includes("replace");
    const colIndex = hasHeader ? {
      name: firstCols.indexOf("name"),
      pattern: firstCols.indexOf("pattern"),
      replace: firstCols.indexOf("replace"),
      scope: firstCols.indexOf("scope"),
      regex: firstCols.indexOf("regex"),
      flags: firstCols.indexOf("flags"),
      enabled: firstCols.indexOf("enabled")
    } : { name: 0, pattern: 1, replace: 2, scope: 3, regex: 4, flags: 5, enabled: 6 };
    const startIdx = hasHeader ? 1 : 0;
    for (let i3 = startIdx; i3 < lines.length; i3++) {
      const cols = parseCsvLine(lines[i3]);
      const getCol = (idx, def = "") => idx >= 0 && idx < cols.length ? cols[idx] : def;
      const pattern = getCol(colIndex.pattern, "");
      const replace = getCol(colIndex.replace, "");
      const name = getCol(colIndex.name, "") || (pattern ? `${pattern} \u2192 ${replace}` : "");
      const scope = getCol(colIndex.scope, "all").trim() || "all";
      const regexRaw = getCol(colIndex.regex, "false").trim().toLowerCase();
      const flags = getCol(colIndex.flags, "g").trim() || "g";
      const enabledRaw = getCol(colIndex.enabled, "true").trim().toLowerCase();
      parsed.push({
        id: `rule:csv-${Date.now().toString(36)}-${i3}`,
        name,
        pattern,
        replace,
        scope,
        regex: ["1", "true", "yes"].includes(regexRaw),
        flags,
        enabled: !["0", "false", "no"].includes(enabledRaw)
      });
    }
  }
  const problems = validateTextRules({ items: parsed });
  return { items: problems.length ? [] : parsed, problems };
}

// client/components/LexiconEditor.jsx
var DEFAULT_TEST_TEXT = "====\n\u591C\u6DF1\u4E86\uFF0C\u201CLv.9 \u602A\u517D\u6765\u4E86\uFF01\u522B\u5728\u8840\u6CCA\u91CC\u57CB\u6028\uFF0C\u53BB\u5305\u624E\u521B\u4F24\uFF01\u201D\u5355\u4E8E\u4F4E\u58F0\u63D0\u9192\u3002\nPS\uFF1A\u6C42\u6708\u7968\uFF0C\u660E\u5929\u4E09\u66F4\uFF01";
function LexiconEditor({
  enabled,
  polyphoneEnabled = true,
  disabledPresets = [],
  items,
  presets,
  polyphonePresets = [],
  maxSegmentChars,
  onToggle,
  onTogglePolyphone,
  onChangeDisabledPresets,
  onChangeItems,
  showToast
}) {
  const [sampleText, setSampleText] = (0, import_react7.useState)(DEFAULT_TEST_TEXT);
  const [debugOut, setDebugOut] = (0, import_react7.useState)(null);
  const [debugErr, setDebugErr] = (0, import_react7.useState)("");
  const [busy, setBusy] = (0, import_react7.useState)(false);
  const [showPolyTable, setShowPolyTable] = (0, import_react7.useState)(false);
  const importInputRef = (0, import_react7.useRef)(null);
  const list = Array.isArray(items) ? items : [];
  const presetList = Array.isArray(presets) ? presets : [];
  const polyList = Array.isArray(polyphonePresets) ? polyphonePresets : [];
  const disabledSet = new Set(Array.isArray(disabledPresets) ? disabledPresets : []);
  const addEmpty = () => {
    onChangeItems([
      ...list,
      {
        id: `rule:${Date.now().toString(36)}`,
        name: "\u65B0\u89C4\u5219",
        pattern: "",
        replace: "",
        regex: false,
        flags: "g",
        scope: "all",
        enabled: true
      }
    ]);
  };
  const addPreset = (preset) => {
    const exists = list.some((r3) => preset.id && r3.id === preset.id || r3.pattern === preset.pattern && r3.scope === preset.scope);
    if (exists) {
      showToast(`\u5DF2\u5305\u542B\u9884\u8BBE\uFF1A${preset.name}`);
      return;
    }
    onChangeItems([...list, { ...preset }]);
    showToast(`\u5DF2\u6DFB\u52A0\uFF1A${preset.name}`);
  };
  const toggleBuiltinPoly = (id) => {
    if (!onChangeDisabledPresets) return;
    const next = new Set(disabledSet);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChangeDisabledPresets([...next]);
  };
  const updateRow = (idx, patch) => {
    onChangeItems(list.map((it, i3) => i3 === idx ? { ...it, ...patch } : it));
  };
  const removeRow = (idx) => {
    onChangeItems(list.filter((_, i3) => i3 !== idx));
  };
  const moveRow = (idx, dir) => {
    const nextIdx = idx + dir;
    if (nextIdx < 0 || nextIdx >= list.length) return;
    const next = list.slice();
    const [picked] = next.splice(idx, 1);
    next.splice(nextIdx, 0, picked);
    onChangeItems(next);
  };
  const runDebug = async () => {
    setBusy(true);
    setDebugErr("");
    try {
      const res = await previewTextApi({
        text: sampleText,
        textRules: {
          enabled: Boolean(enabled),
          polyphoneEnabled: Boolean(polyphoneEnabled),
          disabledPresets: [...disabledSet],
          items: list
        },
        maxSegmentChars: Number(maxSegmentChars) || 100
      });
      setDebugOut(res);
    } catch (err) {
      setDebugErr(String(err?.message || err));
      setDebugOut(null);
    } finally {
      setBusy(false);
    }
  };
  const handleExport = (fmt) => {
    const activeBuiltins = polyphoneEnabled ? polyList.filter((p2) => !disabledSet.has(p2.id)) : [];
    const combined = [...list, ...activeBuiltins];
    const content = fmt === "csv" ? exportRulesCsv(combined) : exportRulesJson(combined);
    const filename = fmt === "csv" ? "audiobook-lexicon-rules.csv" : "audiobook-lexicon-rules.json";
    const mime = fmt === "csv" ? "text/csv;charset=utf-8" : "application/json;charset=utf-8";
    const ok = download(filename, content, mime);
    showToast(ok ? `\u5DF2\u5BFC\u51FA ${combined.length} \u6761\u89C4\u5219\uFF08${fmt.toUpperCase()}\uFF09` : "\u6D4F\u89C8\u5668\u62E6\u622A\u4E86\u4E0B\u8F7D");
  };
  const handleImportFile = (e3) => {
    const file = e3.target.files?.[0];
    e3.target.value = "";
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const fmt = file.name.toLowerCase().endsWith(".json") ? "json" : "auto";
      const { items: imported, problems } = importRulesFromText(String(reader.result || ""), fmt);
      if (problems.length) {
        showToast(`\u5BFC\u5165\u6821\u9A8C\u5931\u8D25\uFF1A${problems[0]}`);
        return;
      }
      const merged = list.slice();
      let added = 0;
      for (const item of imported) {
        const dup = merged.some((r3) => r3.pattern === item.pattern && (r3.scope || "all") === (item.scope || "all"));
        if (!dup) {
          merged.push(item);
          added++;
        }
      }
      onChangeItems(merged);
      showToast(`\u5DF2\u5BFC\u5165 ${added} \u6761\u89C4\u5219\uFF08\u8DF3\u8FC7\u91CD\u590D ${imported.length - added} \u6761\uFF0C\u4FDD\u5B58\u540E\u751F\u6548\uFF09`);
    };
    reader.onerror = () => showToast("\u8BFB\u53D6\u89C4\u5219\u6587\u4EF6\u5931\u8D25");
    reader.readAsText(file);
  };
  const activePolyCount = polyList.filter((p2) => !disabledSet.has(p2.id)).length;
  return /* @__PURE__ */ import_react7.default.createElement("div", { className: "lex-box" }, /* @__PURE__ */ import_react7.default.createElement("div", { className: "ctrl-row" }, /* @__PURE__ */ import_react7.default.createElement("div", { className: "cl" }, /* @__PURE__ */ import_react7.default.createElement("b", null, "\u542F\u7528\u53D1\u97F3\u4E0E\u65AD\u53E5\u66FF\u6362"), /* @__PURE__ */ import_react7.default.createElement("i", null, "LEXICON & CLEANUP")), /* @__PURE__ */ import_react7.default.createElement(Toggle, { label: "\u542F\u7528\u6587\u672C\u66FF\u6362\u89C4\u5219", checked: Boolean(enabled), onChange: onToggle })), /* @__PURE__ */ import_react7.default.createElement("div", { className: "ctrl-row" }, /* @__PURE__ */ import_react7.default.createElement("div", { className: "cl" }, /* @__PURE__ */ import_react7.default.createElement("b", null, "\u5185\u7F6E\u591A\u97F3\u5B57\u8BFB\u97F3\u7EA0\u6B63\u8BCD\u8868\uFF08\u6309\u8BCD\u5339\u914D \xB7 \u9ED8\u8BA4\u542F\u7528\uFF09"), /* @__PURE__ */ import_react7.default.createElement("i", null, `POLYPHONE PRESET \xB7 ${polyphoneEnabled ? `\u542F\u7528 ${activePolyCount}/${polyList.length} \u8BCD` : "\u5DF2\u505C\u7528"}`)), /* @__PURE__ */ import_react7.default.createElement("div", { style: { display: "flex", alignItems: "center", gap: 6 } }, polyList.length > 0 ? /* @__PURE__ */ import_react7.default.createElement(
    "button",
    {
      className: "btn btn--sm",
      type: "button",
      onClick: () => setShowPolyTable((v2) => !v2)
    },
    showPolyTable ? "\u6536\u8D77\u8BCD\u8868" : `\u67E5\u770B/\u5FAE\u8C03 (${activePolyCount})`
  ) : null, onTogglePolyphone ? /* @__PURE__ */ import_react7.default.createElement(Toggle, { label: "\u5185\u7F6E\u591A\u97F3\u5B57\u8BFB\u97F3\u7EA0\u6B63", checked: Boolean(polyphoneEnabled), onChange: onTogglePolyphone }) : null)), showPolyTable && polyList.length > 0 ? /* @__PURE__ */ import_react7.default.createElement("div", { className: "lex-presets", style: { padding: "6px 8px", background: "var(--panel)", border: "1px solid var(--line)" } }, polyList.map((p2) => {
    const on = !disabledSet.has(p2.id);
    return /* @__PURE__ */ import_react7.default.createElement(
      "button",
      {
        key: p2.id,
        type: "button",
        className: "chip",
        "aria-pressed": String(on),
        title: on ? "\u70B9\u51FB\u4E34\u65F6\u505C\u7528\u8BE5\u5185\u7F6E\u8BCD\u6761" : "\u70B9\u51FB\u91CD\u65B0\u542F\u7528\u8BE5\u5185\u7F6E\u8BCD\u6761",
        onClick: () => toggleBuiltinPoly(p2.id)
      },
      on ? "\u2713 " : "\u25CB ",
      p2.pattern,
      " \u2192 ",
      p2.replace
    );
  })) : null, /* @__PURE__ */ import_react7.default.createElement("div", { className: "lex-presets" }, /* @__PURE__ */ import_react7.default.createElement("span", { className: "silk" }, "\u5E38\u7528\u6E05\u6D17\u9884\u8BBE"), presetList.map((p2) => /* @__PURE__ */ import_react7.default.createElement("button", { key: p2.id, className: "btn btn--sm", type: "button", onClick: () => addPreset(p2) }, "+ ", p2.name)), /* @__PURE__ */ import_react7.default.createElement("span", { style: { marginLeft: "auto", display: "flex", gap: 4, flexWrap: "wrap" } }, /* @__PURE__ */ import_react7.default.createElement(
    "input",
    {
      ref: importInputRef,
      type: "file",
      accept: ".json,.csv,application/json,text/csv",
      style: { display: "none" },
      onChange: handleImportFile
    }
  ), /* @__PURE__ */ import_react7.default.createElement("button", { className: "btn btn--sm", type: "button", onClick: () => importInputRef.current?.click() }, "\u5BFC\u5165 JSON/CSV"), /* @__PURE__ */ import_react7.default.createElement("button", { className: "btn btn--sm", type: "button", onClick: () => handleExport("csv") }, "\u5BFC\u51FA CSV"), /* @__PURE__ */ import_react7.default.createElement("button", { className: "btn btn--sm", type: "button", onClick: () => handleExport("json") }, "\u5BFC\u51FA JSON"), /* @__PURE__ */ import_react7.default.createElement("button", { className: "btn btn--sm btn--tape", type: "button", onClick: addEmpty }, "+ \u65B0\u589E\u89C4\u5219"))), list.length === 0 ? /* @__PURE__ */ import_react7.default.createElement("div", { className: "dirty-empty" }, "\u6682\u672A\u6DFB\u52A0\u81EA\u5B9A\u4E49\u89C4\u5219\uFF08\u5185\u7F6E\u591A\u97F3\u5B57\u8BCD\u8868\u5DF2\u5728\u751F\u6548\u4E2D\uFF0C\u4E5F\u53EF\u70B9\u51FB\u4E0A\u65B9\u6E05\u6D17\u9884\u8BBE\u6216\u300C+ \u65B0\u589E\u89C4\u5219\u300D\uFF09") : /* @__PURE__ */ import_react7.default.createElement("div", { className: "lex-list" }, list.map((r3, idx) => /* @__PURE__ */ import_react7.default.createElement("div", { key: r3.id || idx, className: `lex-row${r3.enabled === false ? " is-off" : ""}` }, /* @__PURE__ */ import_react7.default.createElement("div", { className: "lex-row-top" }, /* @__PURE__ */ import_react7.default.createElement("label", { className: "mono", style: { display: "flex", alignItems: "center", gap: 4, fontSize: 11 } }, /* @__PURE__ */ import_react7.default.createElement(
    "input",
    {
      type: "checkbox",
      checked: r3.enabled !== false,
      onChange: (e3) => updateRow(idx, { enabled: e3.target.checked })
    }
  ), "\u542F\u7528"), /* @__PURE__ */ import_react7.default.createElement(
    "input",
    {
      className: "input",
      value: r3.name || "",
      placeholder: "\u89C4\u5219\u540D\u79F0",
      onChange: (e3) => updateRow(idx, { name: e3.target.value })
    }
  ), /* @__PURE__ */ import_react7.default.createElement(
    "select",
    {
      className: "input",
      style: { width: 92, flex: "none" },
      value: r3.scope || "all",
      onChange: (e3) => updateRow(idx, { scope: e3.target.value })
    },
    /* @__PURE__ */ import_react7.default.createElement("option", { value: "all" }, "\u5168\u90E8 (\u5207\u5206\u524D)"),
    /* @__PURE__ */ import_react7.default.createElement("option", { value: "narrator" }, "\u4EC5\u65C1\u767D"),
    /* @__PURE__ */ import_react7.default.createElement("option", { value: "dialogue" }, "\u4EC5\u5BF9\u8BDD")
  ), /* @__PURE__ */ import_react7.default.createElement(
    "button",
    {
      type: "button",
      className: "btn btn--sm",
      "aria-pressed": String(Boolean(r3.regex)),
      onClick: () => updateRow(idx, { regex: !r3.regex })
    },
    r3.regex ? "\u6B63\u5219" : "\u5B57\u9762"
  ), /* @__PURE__ */ import_react7.default.createElement("button", { className: "btn btn--sm", type: "button", disabled: idx === 0, onClick: () => moveRow(idx, -1) }, "\u2191"), /* @__PURE__ */ import_react7.default.createElement("button", { className: "btn btn--sm", type: "button", disabled: idx === list.length - 1, onClick: () => moveRow(idx, 1) }, "\u2193"), /* @__PURE__ */ import_react7.default.createElement("button", { className: "btn btn--sm", type: "button", onClick: () => removeRow(idx) }, "\u5220\u9664")), /* @__PURE__ */ import_react7.default.createElement("div", { className: "lex-row-pair" }, /* @__PURE__ */ import_react7.default.createElement(
    "input",
    {
      className: "input",
      value: r3.pattern || "",
      placeholder: r3.regex ? "\u6B63\u5219\u8868\u8FBE\u5F0F\uFF08\u2264200 \u5B57\uFF0C\u7981\u6B62\u5D4C\u5957\u91CF\u8BCD\uFF09" : "\u539F\u6587\u672C\u5339\u914D\u5185\u5BB9",
      spellCheck: false,
      onChange: (e3) => updateRow(idx, { pattern: e3.target.value })
    }
  ), /* @__PURE__ */ import_react7.default.createElement("span", { className: "mono", style: { color: "var(--ink-3)", alignSelf: "center" } }, "\u2192"), /* @__PURE__ */ import_react7.default.createElement(
    "input",
    {
      className: "input",
      value: r3.replace || "",
      placeholder: "\u66FF\u6362\u4E3A\uFF08\u7559\u7A7A\u5373\u5220\u9664\uFF09",
      spellCheck: false,
      onChange: (e3) => updateRow(idx, { replace: e3.target.value })
    }
  ))))), /* @__PURE__ */ import_react7.default.createElement("div", { className: "lex-debug" }, /* @__PURE__ */ import_react7.default.createElement("div", { className: "ds-hd" }, /* @__PURE__ */ import_react7.default.createElement("span", { className: "silk" }, "LIVE DEBUGGER ", /* @__PURE__ */ import_react7.default.createElement("b", null, "\u539F\u6587 \u2192 \u66FF\u6362\u540E + \u5206\u6BB5\u9884\u89C8")), /* @__PURE__ */ import_react7.default.createElement("button", { className: "btn btn--sm btn--tape", type: "button", disabled: busy, onClick: runDebug }, busy ? "\u6D4B\u8BD5\u4E2D\u2026" : "\u5B9E\u65F6\u5207\u5206\u8C03\u8BD5")), /* @__PURE__ */ import_react7.default.createElement(
    "textarea",
    {
      className: "input",
      rows: 3,
      value: sampleText,
      onChange: (e3) => setSampleText(e3.target.value)
    }
  ), debugErr ? /* @__PURE__ */ import_react7.default.createElement("div", { className: "tag grease" }, debugErr) : null, debugOut ? /* @__PURE__ */ import_react7.default.createElement("div", { className: "lex-result" }, /* @__PURE__ */ import_react7.default.createElement("div", { className: "mono", style: { fontSize: 11, color: "var(--ink-2)" } }, "\u539F\u6587 ", debugOut.stats?.originalChars || 0, " \u5B57 \u2192 \u66FF\u6362\u540E ", debugOut.stats?.afterChars || 0, " \u5B57 \xB7 \u5171 ", debugOut.stats?.segmentCount || 0, " \u6BB5"), debugOut.afterText && debugOut.afterText !== debugOut.originalText ? /* @__PURE__ */ import_react7.default.createElement("div", { className: "mono", style: { fontSize: 11, color: "var(--tape-2)", background: "var(--panel-2)", padding: "4px 6px", border: "1px dashed var(--line)" } }, `\u66FF\u6362\u7ED3\u679C\uFF1A${debugOut.afterText}`) : null, /* @__PURE__ */ import_react7.default.createElement("div", { className: "lex-segs" }, (debugOut.segments || []).map((s3, i3) => /* @__PURE__ */ import_react7.default.createElement("div", { key: i3, className: "lex-seg" }, /* @__PURE__ */ import_react7.default.createElement("span", { className: `tag ${s3.role === "dialogue" ? "grease" : "tape"}` }, ROLE_CN[s3.role] || s3.role), /* @__PURE__ */ import_react7.default.createElement("span", null, s3.text))))) : null));
}

// client/components/RefVoiceLibrary.jsx
var import_react9 = __toESM(require("react"), 1);

// client/components/WaveformClipper.jsx
var import_react8 = __toESM(require("react"), 1);

// node_modules/wavesurfer.js/dist/wavesurfer.esm.js
function t(t3, e3, i3, n3) {
  return new (i3 || (i3 = Promise))((function(s3, r3) {
    function o3(t4) {
      try {
        l3(n3.next(t4));
      } catch (t5) {
        r3(t5);
      }
    }
    function a3(t4) {
      try {
        l3(n3.throw(t4));
      } catch (t5) {
        r3(t5);
      }
    }
    function l3(t4) {
      var e4;
      t4.done ? s3(t4.value) : (e4 = t4.value, e4 instanceof i3 ? e4 : new i3((function(t5) {
        t5(e4);
      }))).then(o3, a3);
    }
    l3((n3 = n3.apply(t3, e3 || [])).next());
  }));
}
var e = class {
  constructor() {
    this.listeners = {};
  }
  on(t3, e3, i3) {
    if (this.listeners[t3] || (this.listeners[t3] = /* @__PURE__ */ new Set()), null == i3 ? void 0 : i3.once) {
      const i4 = (...n3) => {
        this.un(t3, i4), e3(...n3);
      };
      return this.listeners[t3].add(i4), () => this.un(t3, i4);
    }
    return this.listeners[t3].add(e3), () => this.un(t3, e3);
  }
  un(t3, e3) {
    var i3;
    null === (i3 = this.listeners[t3]) || void 0 === i3 || i3.delete(e3);
  }
  once(t3, e3) {
    return this.on(t3, e3, { once: true });
  }
  unAll() {
    this.listeners = {};
  }
  emit(t3, ...e3) {
    this.listeners[t3] && this.listeners[t3].forEach(((t4) => t4(...e3)));
  }
};
var i = { decode: function(e3, i3) {
  return t(this, void 0, void 0, (function* () {
    const t3 = new AudioContext({ sampleRate: i3 });
    try {
      return yield t3.decodeAudioData(e3);
    } finally {
      "closed" !== t3.state && (yield t3.close().catch((() => {
      })));
    }
  }));
}, createBuffer: function(t3, e3) {
  if (!t3 || 0 === t3.length) throw new Error("channelData must be a non-empty array");
  if (e3 <= 0) throw new Error("duration must be greater than 0");
  if ("number" == typeof t3[0] && (t3 = [t3]), !t3[0] || 0 === t3[0].length) throw new Error("channelData must contain non-empty channel arrays");
  !(function(t4) {
    const e4 = t4[0];
    if (e4.some(((t5) => t5 > 1 || t5 < -1))) {
      const i4 = e4.length;
      let n3 = 0;
      for (let t5 = 0; t5 < i4; t5++) {
        const i5 = Math.abs(e4[t5]);
        i5 > n3 && (n3 = i5);
      }
      for (const e5 of t4) for (let t5 = 0; t5 < i4; t5++) e5[t5] /= n3;
    }
  })(t3);
  const i3 = t3.map(((t4) => t4 instanceof Float32Array ? t4 : Float32Array.from(t4)));
  return { duration: e3, length: i3[0].length, sampleRate: i3[0].length / e3, numberOfChannels: i3.length, getChannelData: (t4) => {
    const e4 = i3[t4];
    if (!e4) throw new Error(`Channel ${t4} not found`);
    return e4;
  }, copyFromChannel: AudioBuffer.prototype.copyFromChannel, copyToChannel: AudioBuffer.prototype.copyToChannel };
} };
function n(t3, e3) {
  const i3 = e3.xmlns ? document.createElementNS(e3.xmlns, t3) : document.createElement(t3);
  for (const [t4, s3] of Object.entries(e3)) if ("children" === t4 && s3) for (const [t5, e4] of Object.entries(s3)) e4 instanceof Node ? i3.appendChild(e4) : "string" == typeof e4 ? i3.appendChild(document.createTextNode(e4)) : i3.appendChild(n(t5, e4));
  else "style" === t4 ? Object.assign(i3.style, s3) : "textContent" === t4 ? i3.textContent = s3 : i3.setAttribute(t4, s3.toString());
  return i3;
}
function s(t3, e3, i3) {
  const s3 = n(t3, e3 || {});
  return null == i3 || i3.appendChild(s3), s3;
}
function r(t3) {
  return t3 instanceof HTMLElement || "object" == typeof t3 && null !== t3 && t3.nodeType === Node.ELEMENT_NODE && "object" == typeof t3.style;
}
var o = Object.freeze({ __proto__: null, createElement: s, default: s, isHTMLElement: r });
var a = { fetchBlob: function(e3, i3, n3) {
  return t(this, void 0, void 0, (function* () {
    var s3;
    const r3 = yield fetch(e3, n3);
    if (r3.status >= 400) throw new Error(`Failed to fetch ${e3}: ${r3.status} (${r3.statusText})`);
    return (function(e4, i4, n4) {
      t(this, void 0, void 0, (function* () {
        var t3;
        if (!e4.body || !e4.headers) return;
        const s4 = e4.body.getReader(), r4 = Number(e4.headers.get("Content-Length")) || 0;
        let o3 = 0;
        const a3 = () => {
          s4.cancel();
        };
        if (n4) {
          if (n4.aborted) return void s4.cancel();
          n4.addEventListener("abort", a3, { once: true });
        }
        try {
          for (; ; ) {
            const e5 = yield s4.read();
            if (e5.done) break;
            if (o3 += (null === (t3 = e5.value) || void 0 === t3 ? void 0 : t3.length) || 0, r4 > 0) {
              const t4 = Math.round(o3 / r4 * 100);
              i4(t4);
            }
          }
        } catch (t4) {
          if (t4 instanceof DOMException && "AbortError" === t4.name) return;
          console.warn("Progress tracking error:", t4);
        } finally {
          n4 && n4.removeEventListener("abort", a3);
        }
      }));
    })(r3.clone(), i3, null !== (s3 = null == n3 ? void 0 : n3.signal) && void 0 !== s3 ? s3 : void 0), r3.blob();
  }));
} };
function l(t3) {
  let e3 = t3;
  const i3 = /* @__PURE__ */ new Set();
  return { get value() {
    return e3;
  }, set(t4) {
    Object.is(e3, t4) || (e3 = t4, i3.forEach(((t5) => t5(e3))));
  }, update(t4) {
    this.set(t4(e3));
  }, subscribe: (t4) => (i3.add(t4), () => i3.delete(t4)) };
}
function h(t3, e3) {
  const i3 = l(t3());
  return e3.forEach(((e4) => e4.subscribe((() => {
    const e5 = t3();
    Object.is(i3.value, e5) || i3.set(e5);
  })))), { get value() {
    return i3.value;
  }, subscribe: (t4) => i3.subscribe(t4) };
}
function c(t3, e3) {
  let i3;
  const n3 = () => {
    i3 && (i3(), i3 = void 0), i3 = t3();
  }, s3 = e3.map(((t4) => t4.subscribe(n3)));
  return n3(), () => {
    i3 && (i3(), i3 = void 0), s3.forEach(((t4) => t4()));
  };
}
var d = class extends e {
  get isPlayingSignal() {
    return this._isPlaying;
  }
  get currentTimeSignal() {
    return this._currentTime;
  }
  get durationSignal() {
    return this._duration;
  }
  get volumeSignal() {
    return this._volume;
  }
  get mutedSignal() {
    return this._muted;
  }
  get playbackRateSignal() {
    return this._playbackRate;
  }
  get seekingSignal() {
    return this._seeking;
  }
  constructor(t3) {
    super(), this.isExternalMedia = false, this._ownBlobUrl = null, this.reactiveMediaEventCleanups = [], t3.media ? (this.media = t3.media, this.isExternalMedia = true) : this.media = document.createElement("audio"), this._isPlaying = l(false), this._currentTime = l(0), this._duration = l(0), this._volume = l(this.media.volume), this._muted = l(this.media.muted), this._playbackRate = l(this.media.playbackRate || 1), this._seeking = l(false), this.setupReactiveMediaEvents(), t3.mediaControls && (this.media.controls = true), t3.autoplay && (this.media.autoplay = true), null != t3.playbackRate && this.onMediaEvent("canplay", (() => {
      null != t3.playbackRate && (this.media.playbackRate = t3.playbackRate);
    }), { once: true });
  }
  setupReactiveMediaEvents() {
    this.reactiveMediaEventCleanups.push(this.onMediaEvent("play", (() => {
      this._isPlaying.set(true);
    }))), this.reactiveMediaEventCleanups.push(this.onMediaEvent("pause", (() => {
      this._isPlaying.set(false);
    }))), this.reactiveMediaEventCleanups.push(this.onMediaEvent("ended", (() => {
      this._isPlaying.set(false);
    }))), this.reactiveMediaEventCleanups.push(this.onMediaEvent("timeupdate", (() => {
      this._currentTime.set(this.media.currentTime);
    }))), this.reactiveMediaEventCleanups.push(this.onMediaEvent("durationchange", (() => {
      this._duration.set(this.media.duration || 0);
    }))), this.reactiveMediaEventCleanups.push(this.onMediaEvent("loadedmetadata", (() => {
      this._duration.set(this.media.duration || 0);
    }))), this.reactiveMediaEventCleanups.push(this.onMediaEvent("seeking", (() => {
      this._seeking.set(true);
    }))), this.reactiveMediaEventCleanups.push(this.onMediaEvent("seeked", (() => {
      this._seeking.set(false);
    }))), this.reactiveMediaEventCleanups.push(this.onMediaEvent("volumechange", (() => {
      this._volume.set(this.media.volume), this._muted.set(this.media.muted);
    }))), this.reactiveMediaEventCleanups.push(this.onMediaEvent("ratechange", (() => {
      this._playbackRate.set(this.media.playbackRate);
    })));
  }
  onMediaEvent(t3, e3, i3) {
    return this.media.addEventListener(t3, e3, i3), () => this.media.removeEventListener(t3, e3, i3);
  }
  getSrc() {
    return this.media.currentSrc || this.media.src || "";
  }
  revokeSrc() {
    this._ownBlobUrl && (URL.revokeObjectURL(this._ownBlobUrl), this._ownBlobUrl = null);
  }
  canPlayType(t3) {
    return "" !== this.media.canPlayType(t3);
  }
  setSrc(t3, e3) {
    const i3 = this.getSrc();
    if (t3 && i3 === t3) return;
    this.revokeSrc();
    const n3 = e3 instanceof Blob && (this.canPlayType(e3.type) || !t3) ? URL.createObjectURL(e3) : t3;
    if (n3 !== t3 && (this._ownBlobUrl = n3), i3 && this.media.removeAttribute("src"), n3 || t3) try {
      this.media.src = n3;
    } catch (e4) {
      this.media.src = t3;
    }
  }
  destroy() {
    this.reactiveMediaEventCleanups.forEach(((t3) => t3())), this.reactiveMediaEventCleanups = [], this.revokeSrc(), this.unAll(), this.isExternalMedia || (this.media.pause(), this.media.removeAttribute("src"), this.media.load(), this.media.remove());
  }
  setMediaElement(t3) {
    this.reactiveMediaEventCleanups.forEach(((t4) => t4())), this.reactiveMediaEventCleanups = [], this.media = t3, this.setupReactiveMediaEvents();
  }
  play() {
    return t(this, void 0, void 0, (function* () {
      try {
        return yield this.media.play();
      } catch (t3) {
        if (t3 instanceof DOMException && "AbortError" === t3.name) return;
        throw t3;
      }
    }));
  }
  pause() {
    this.media.pause();
  }
  isPlaying() {
    return !this.media.paused && !this.media.ended;
  }
  setTime(t3) {
    this.media.currentTime = Math.max(0, Math.min(t3, this.getDuration()));
  }
  getDuration() {
    return this.media.duration;
  }
  getCurrentTime() {
    return this.media.currentTime;
  }
  getVolume() {
    return this.media.volume;
  }
  setVolume(t3) {
    this.media.volume = t3;
  }
  getMuted() {
    return this.media.muted;
  }
  setMuted(t3) {
    this.media.muted = t3;
  }
  getPlaybackRate() {
    return this.media.playbackRate;
  }
  isSeeking() {
    return this.media.seeking;
  }
  setPlaybackRate(t3, e3) {
    null != e3 && (this.media.preservesPitch = e3), this.media.playbackRate = t3;
  }
  getMediaElement() {
    return this.media;
  }
  setSinkId(t3) {
    return this.media.setSinkId(t3);
  }
};
function u({ maxTop: t3, maxBottom: e3, halfHeight: i3, vScale: n3, barMinHeight: s3 = 0, barAlign: r3 }) {
  let o3 = Math.round(t3 * i3 * n3);
  let a3 = o3 + Math.round(e3 * i3 * n3) || 1;
  return a3 < s3 && (a3 = s3, r3 || (o3 = a3 / 2)), { topHeight: o3, totalHeight: a3 };
}
function p({ barAlign: t3, halfHeight: e3, topHeight: i3, totalHeight: n3, canvasHeight: s3 }) {
  return "top" === t3 ? 0 : "bottom" === t3 ? s3 - n3 : e3 - i3;
}
function m(t3, e3, i3) {
  const n3 = e3 - t3.left, s3 = i3 - t3.top;
  return [n3 / t3.width, s3 / t3.height];
}
function g(t3) {
  return Boolean(t3.barWidth || t3.barGap || t3.barAlign);
}
function f(t3, e3) {
  if (!g(e3)) return t3;
  const i3 = e3.barWidth || 0.5, n3 = i3 + (e3.barGap || i3 / 2);
  return 0 === n3 ? t3 : Math.floor(t3 / n3) * n3;
}
function v({ scrollLeft: t3, totalWidth: e3, numCanvases: i3 }) {
  if (0 === e3) return [0];
  const n3 = t3 / e3, s3 = Math.floor(n3 * i3);
  return [s3 - 1, s3, s3 + 1];
}
function b(t3) {
  const e3 = t3._cleanup;
  "function" == typeof e3 && e3();
}
function y(t3) {
  const e3 = l({ scrollLeft: t3.scrollLeft, scrollWidth: t3.scrollWidth, clientWidth: t3.clientWidth }), i3 = h((() => (function(t4) {
    const { scrollLeft: e4, scrollWidth: i4, clientWidth: n4 } = t4;
    if (0 === i4) return { startX: 0, endX: 1 };
    const s4 = e4 / i4, r3 = (e4 + n4) / i4;
    return { startX: Math.max(0, Math.min(1, s4)), endX: Math.max(0, Math.min(1, r3)) };
  })(e3.value)), [e3]), n3 = h((() => (function(t4) {
    return { left: t4.scrollLeft, right: t4.scrollLeft + t4.clientWidth };
  })(e3.value)), [e3]), s3 = () => {
    e3.set({ scrollLeft: t3.scrollLeft, scrollWidth: t3.scrollWidth, clientWidth: t3.clientWidth });
  };
  t3.addEventListener("scroll", s3, { passive: true });
  return { scrollData: e3, percentages: i3, bounds: n3, cleanup: () => {
    t3.removeEventListener("scroll", s3), b(e3);
  } };
}
var C = class extends e {
  constructor(t3, e3) {
    super(), this.timeouts = [], this.isScrollable = false, this.audioData = null, this.resizeObserver = null, this.lastContainerWidth = 0, this.isDragging = false, this.subscriptions = [], this.unsubscribeOnScroll = [], this.dragStream = null, this.scrollStream = null, this.containerInlinePadding = 0, this.onClickWrapper = (t4) => {
      const e4 = this.wrapper.getBoundingClientRect(), [i4, n4] = m(e4, t4.clientX, t4.clientY);
      this.emit("click", i4, n4);
    }, this.onDblClickWrapper = (t4) => {
      const e4 = this.wrapper.getBoundingClientRect(), [i4, n4] = m(e4, t4.clientX, t4.clientY);
      this.emit("dblclick", i4, n4);
    }, this.subscriptions = [], this.options = t3;
    const i3 = this.parentFromOptionsContainer(t3.container);
    this.parent = i3;
    const [n3, s3] = this.initHtml();
    i3.appendChild(n3), this.container = n3, this.scrollContainer = s3.querySelector(".scroll"), this.wrapper = s3.querySelector(".wrapper"), this.canvasWrapper = s3.querySelector(".canvases"), this.progressWrapper = s3.querySelector(".progress"), this.cursor = s3.querySelector(".cursor"), this.calculateInlinePadding(), e3 && s3.appendChild(e3), this.initEvents();
  }
  parentFromOptionsContainer(t3) {
    let e3;
    if ("string" == typeof t3 ? e3 = document.querySelector(t3) : r(t3) && (e3 = t3), !e3) throw new Error("Container not found");
    return e3;
  }
  initEvents() {
    this.wrapper.addEventListener("click", this.onClickWrapper), this.wrapper.addEventListener("dblclick", this.onDblClickWrapper), true !== this.options.dragToSeek && "object" != typeof this.options.dragToSeek || this.initDrag(), this.scrollStream = y(this.scrollContainer);
    const t3 = c((() => {
      const { startX: t4, endX: e3 } = this.scrollStream.percentages.value, { left: i3, right: n3 } = this.scrollStream.bounds.value;
      this.emit("scroll", t4, e3, i3, n3);
    }), [this.scrollStream.percentages, this.scrollStream.bounds]);
    if (this.subscriptions.push(t3), "function" == typeof ResizeObserver) {
      const t4 = this.createDelay(100);
      this.resizeObserver = new ResizeObserver((() => {
        t4().then((() => this.onContainerResize())).catch((() => {
        }));
      })), this.resizeObserver.observe(this.scrollContainer);
    }
  }
  onContainerResize() {
    const t3 = this.parent.clientWidth;
    this.calculateInlinePadding(), t3 === this.lastContainerWidth && "auto" !== this.options.height || (this.lastContainerWidth = t3, this.reRender(), this.emit("resize"));
  }
  initDrag() {
    if (this.dragStream) return;
    this.dragStream = (function(t4, e3 = {}) {
      const { threshold: i3 = 3, mouseButton: n3 = 0, touchDelay: s3 = 100 } = e3, r3 = l(null), o3 = /* @__PURE__ */ new Map(), a3 = matchMedia("(pointer: coarse)").matches;
      let h3 = () => {
      };
      const c2 = (e4) => {
        if (e4.button !== n3) return;
        if (o3.has(e4.pointerId)) return;
        if (o3.set(e4.pointerId, e4), o3.size > 1) return;
        const l3 = e4.pointerId;
        let c3 = e4.clientX, d3 = e4.clientY, u2 = false;
        const p2 = Date.now(), m2 = t4.getBoundingClientRect(), { left: g2, top: f2 } = m2, v2 = (t5) => {
          if (t5.pointerId !== l3) return;
          if (t5.defaultPrevented || o3.size > 1) return;
          if (a3 && Date.now() - p2 < s3) return;
          const e5 = t5.clientX, n4 = t5.clientY, h4 = e5 - c3, m3 = n4 - d3;
          (u2 || Math.abs(h4) > i3 || Math.abs(m3) > i3) && (t5.preventDefault(), t5.stopPropagation(), u2 || (r3.set({ type: "start", x: c3 - g2, y: d3 - f2 }), u2 = true), r3.set({ type: "move", x: e5 - g2, y: n4 - f2, deltaX: h4, deltaY: m3 }), c3 = e5, d3 = n4);
        }, b2 = (t5) => {
          if (o3.delete(t5.pointerId)) {
            if (t5.pointerId === l3 && u2) {
              const e5 = t5.clientX, i4 = t5.clientY;
              r3.set({ type: "end", x: e5 - g2, y: i4 - f2 });
            }
            0 === o3.size && h3();
          }
        }, y2 = (t5) => {
          t5.relatedTarget && t5.relatedTarget !== document.documentElement || b2(t5);
        }, C2 = (t5) => {
          u2 && (t5.stopPropagation(), t5.preventDefault());
        }, S2 = (t5) => {
          t5.defaultPrevented || o3.size > 1 || u2 && t5.preventDefault();
        };
        document.addEventListener("pointermove", v2), document.addEventListener("pointerup", b2), document.addEventListener("pointerout", y2), document.addEventListener("pointercancel", y2), document.addEventListener("touchmove", S2, { passive: false }), document.addEventListener("click", C2, { capture: true }), h3 = () => {
          document.removeEventListener("pointermove", v2), document.removeEventListener("pointerup", b2), document.removeEventListener("pointerout", y2), document.removeEventListener("pointercancel", y2), document.removeEventListener("touchmove", S2), setTimeout((() => {
            document.removeEventListener("click", C2, { capture: true });
          }), 10);
        };
      };
      return t4.addEventListener("pointerdown", c2), { signal: r3, cleanup: () => {
        h3(), t4.removeEventListener("pointerdown", c2), o3.clear(), b(r3);
      } };
    })(this.wrapper);
    const t3 = c((() => {
      const t4 = this.dragStream.signal.value;
      if (!t4) return;
      const e3 = this.wrapper.getBoundingClientRect().width, i3 = (n3 = t4.x / e3) < 0 ? 0 : n3 > 1 ? 1 : n3;
      var n3;
      "start" === t4.type ? (this.isDragging = true, this.emit("dragstart", i3)) : "move" === t4.type ? this.emit("drag", i3) : "end" === t4.type && (this.isDragging = false, this.emit("dragend", i3));
    }), [this.dragStream.signal]);
    this.subscriptions.push(t3);
  }
  calculateInlinePadding() {
    const { paddingLeft: t3, paddingRight: e3 } = getComputedStyle(this.scrollContainer), i3 = parseFloat(t3) + parseFloat(e3);
    this.containerInlinePadding = Number.isNaN(i3) ? 0 : i3;
  }
  initHtml() {
    const t3 = document.createElement("div"), e3 = t3.attachShadow({ mode: "open" }), i3 = this.options.cspNonce && "string" == typeof this.options.cspNonce ? this.options.cspNonce.replace(/"/g, "") : "";
    return e3.innerHTML = `
      <style${i3 ? ` nonce="${i3}"` : ""}>
        :host {
          user-select: none;
          min-width: 1px;
        }
        :host audio {
          display: block;
          width: 100%;
        }
        :host .scroll {
          overflow-x: auto;
          overflow-y: hidden;
          width: 100%;
          position: relative;
        }
        :host .noScrollbar {
          scrollbar-color: transparent;
          scrollbar-width: none;
        }
        :host .noScrollbar::-webkit-scrollbar {
          display: none;
          -webkit-appearance: none;
        }
        :host .wrapper {
          position: relative;
          overflow: visible;
          z-index: 2;
        }
        :host .canvases {
          min-height: ${this.getHeight(this.options.height, this.options.splitChannels)}px;
          pointer-events: none;
        }
        :host .canvases > div {
          position: relative;
        }
        :host canvas {
          display: block;
          position: absolute;
          top: 0;
          image-rendering: pixelated;
        }
        :host .progress {
          pointer-events: none;
          position: absolute;
          z-index: 2;
          top: 0;
          left: 0;
          width: 0;
          height: 100%;
          overflow: hidden;
        }
        :host .progress > div {
          position: relative;
        }
        :host .cursor {
          pointer-events: none;
          position: absolute;
          z-index: 5;
          top: 0;
          left: 0;
          height: 100%;
          border-radius: 2px;
        }
      </style>

      <div class="scroll" part="scroll">
        <div class="wrapper" part="wrapper">
          <div class="canvases" part="canvases"></div>
          <div class="progress" part="progress"></div>
          <div class="cursor" part="cursor"></div>
        </div>
      </div>
    `, [t3, e3];
  }
  setOptions(t3) {
    var e3;
    if (this.options.container !== t3.container) {
      const e4 = this.parentFromOptionsContainer(t3.container);
      e4.appendChild(this.container), this.parent = e4;
    }
    true === t3.dragToSeek || "object" == typeof this.options.dragToSeek ? this.initDrag() : (null === (e3 = this.dragStream) || void 0 === e3 || e3.cleanup(), this.dragStream = null), this.options = t3, this.reRender();
  }
  getWrapper() {
    return this.wrapper;
  }
  getWidth() {
    return this.scrollContainer.clientWidth - this.containerInlinePadding;
  }
  getScroll() {
    return this.scrollContainer.scrollLeft;
  }
  setScroll(t3) {
    this.scrollContainer.scrollLeft = t3;
  }
  setScrollPercentage(t3) {
    const { scrollWidth: e3 } = this.scrollContainer, i3 = e3 * t3;
    this.setScroll(i3);
  }
  destroy() {
    var t3;
    this.wrapper.removeEventListener("click", this.onClickWrapper), this.wrapper.removeEventListener("dblclick", this.onDblClickWrapper), this.timeouts.forEach(((t4) => t4())), this.timeouts = [], this.subscriptions.forEach(((t4) => t4())), this.container.remove(), this.resizeObserver && (this.resizeObserver.disconnect(), this.resizeObserver = null), null === (t3 = this.unsubscribeOnScroll) || void 0 === t3 || t3.forEach(((t4) => t4())), this.unsubscribeOnScroll = [], this.dragStream && (this.dragStream.cleanup(), this.dragStream = null), this.scrollStream && (this.scrollStream.cleanup(), this.scrollStream = null);
  }
  createDelay(t3 = 10) {
    let e3, i3;
    const n3 = () => {
      e3 && (clearTimeout(e3), e3 = void 0), i3 && (i3(), i3 = void 0);
    };
    return this.timeouts.push(n3), () => new Promise(((s3, r3) => {
      n3(), i3 = r3, e3 = setTimeout((() => {
        e3 = void 0, i3 = void 0, s3();
      }), t3);
    }));
  }
  getHeight(t3, e3) {
    var i3;
    const n3 = (null === (i3 = this.audioData) || void 0 === i3 ? void 0 : i3.numberOfChannels) || 1;
    return (function({ optionsHeight: t4, optionsSplitChannels: e4, parentHeight: i4, numberOfChannels: n4, defaultHeight: s3 = 128 }) {
      if (null == t4) return s3;
      const r3 = Number(t4);
      if (!isNaN(r3)) return r3;
      if ("auto" === t4) {
        const t5 = i4 || s3;
        return (null == e4 ? void 0 : e4.every(((t6) => !t6.overlay))) ? t5 / n4 : t5;
      }
      return s3;
    })({ optionsHeight: t3, optionsSplitChannels: e3, parentHeight: this.parent.clientHeight, numberOfChannels: n3, defaultHeight: 128 });
  }
  convertColorValues(t3, e3) {
    return (function(t4, e4, i3) {
      if (!Array.isArray(t4)) return t4 || "";
      if (0 === t4.length) return "#999";
      if (t4.length < 2) return t4[0] || "";
      const n3 = document.createElement("canvas"), s3 = n3.getContext("2d");
      if (!s3) return t4[0] || "";
      const r3 = i3 || n3.height * e4, o3 = s3.createLinearGradient(0, 0, 0, r3), a3 = 1 / (t4.length - 1);
      return t4.forEach(((t5, e5) => {
        o3.addColorStop(e5 * a3, t5);
      })), o3;
    })(t3, this.getPixelRatio(), null == e3 ? void 0 : e3.canvas.height);
  }
  getPixelRatio() {
    return t3 = window.devicePixelRatio, Math.max(1, t3 || 1);
    var t3;
  }
  renderBarWaveform(t3, e3, i3, n3) {
    const { width: s3, height: r3 } = i3.canvas, { halfHeight: o3, barWidth: a3, barRadius: l3, barIndexScale: h3, barSpacing: c2, barMinHeight: d3 } = (function({ width: t4, height: e4, length: i4, options: n4, pixelRatio: s4 }) {
      const r4 = e4 / 2, o4 = n4.barWidth ? n4.barWidth * s4 : 1, a4 = n4.barGap ? n4.barGap * s4 : n4.barWidth ? o4 / 2 : 0, l4 = o4 + a4 || 1;
      return { halfHeight: r4, barWidth: o4, barGap: a4, barRadius: n4.barRadius || 0, barMinHeight: n4.barMinHeight ? n4.barMinHeight * s4 : 0, barIndexScale: i4 > 0 ? t4 / l4 / i4 : 0, barSpacing: l4 };
    })({ width: s3, height: r3, length: (t3[0] || []).length, options: e3, pixelRatio: this.getPixelRatio() }), m2 = (function({ channelData: t4, barIndexScale: e4, barSpacing: i4, barWidth: n4, halfHeight: s4, vScale: r4, canvasHeight: o4, barAlign: a4, barMinHeight: l4 }) {
      const h4 = t4[0] || [], c3 = t4[1] || h4, d4 = h4.length, m3 = [];
      let g2 = 0, f2 = 0, v2 = 0;
      for (let t5 = 0; t5 <= d4; t5++) {
        const d5 = Math.round(t5 * e4);
        if (d5 > g2) {
          const { topHeight: t6, totalHeight: e5 } = u({ maxTop: f2, maxBottom: v2, halfHeight: s4, vScale: r4, barMinHeight: l4, barAlign: a4 }), h5 = p({ barAlign: a4, halfHeight: s4, topHeight: t6, totalHeight: e5, canvasHeight: o4 });
          m3.push({ x: g2 * i4, y: h5, width: n4, height: e5 }), g2 = d5, f2 = 0, v2 = 0;
        }
        const b2 = Math.abs(h4[t5] || 0), y2 = Math.abs(c3[t5] || 0);
        b2 > f2 && (f2 = b2), y2 > v2 && (v2 = y2);
      }
      return m3;
    })({ channelData: t3, barIndexScale: h3, barSpacing: c2, barWidth: a3, halfHeight: o3, vScale: n3, canvasHeight: r3, barAlign: e3.barAlign, barMinHeight: d3 });
    i3.beginPath();
    for (const t4 of m2) l3 && "roundRect" in i3 ? i3.roundRect(t4.x, t4.y, t4.width, t4.height, l3) : i3.rect(t4.x, t4.y, t4.width, t4.height);
    i3.fill(), i3.closePath();
  }
  renderLineWaveform(t3, e3, i3, n3) {
    const { width: s3, height: r3 } = i3.canvas, o3 = (function({ channelData: t4, width: e4, height: i4, vScale: n4 }) {
      const s4 = i4 / 2, r4 = t4[0] || [];
      return [r4, t4[1] || r4].map(((t5, i5) => {
        const r5 = t5.length, o4 = r5 ? e4 / r5 : 0, a3 = s4, l3 = 0 === i5 ? -1 : 1, h3 = [{ x: 0, y: a3 }];
        let c2 = 0, d3 = 0;
        for (let e5 = 0; e5 <= r5; e5++) {
          const i6 = Math.round(e5 * o4);
          if (i6 > c2) {
            const t6 = a3 + (Math.round(d3 * s4 * n4) || 1) * l3;
            h3.push({ x: c2, y: t6 }), c2 = i6, d3 = 0;
          }
          const r6 = Math.abs(t5[e5] || 0);
          r6 > d3 && (d3 = r6);
        }
        return h3.push({ x: c2, y: a3 }), h3;
      }));
    })({ channelData: t3, width: s3, height: r3, vScale: n3 });
    i3.beginPath();
    for (const t4 of o3) if (t4.length) {
      i3.moveTo(t4[0].x, t4[0].y);
      for (let e4 = 1; e4 < t4.length; e4++) {
        const n4 = t4[e4];
        i3.lineTo(n4.x, n4.y);
      }
    }
    i3.fill(), i3.closePath();
  }
  renderWaveform(t3, e3, i3) {
    if (i3.fillStyle = this.convertColorValues(e3.waveColor, i3), e3.renderFunction) return void e3.renderFunction(t3, i3);
    const n3 = (function({ channelData: t4, barHeight: e4, normalize: i4, maxPeak: n4 }) {
      var s3;
      const r3 = e4 || 1;
      if (!i4) return r3;
      const o3 = t4[0];
      if (!o3 || 0 === o3.length) return r3;
      let a3 = null != n4 ? n4 : 0;
      if (!n4) for (let t5 = 0; t5 < o3.length; t5++) {
        const e5 = null !== (s3 = o3[t5]) && void 0 !== s3 ? s3 : 0, i5 = Math.abs(e5);
        i5 > a3 && (a3 = i5);
      }
      return a3 ? r3 / a3 : r3;
    })({ channelData: t3, barHeight: e3.barHeight, normalize: e3.normalize, maxPeak: e3.maxPeak });
    g(e3) ? this.renderBarWaveform(t3, e3, i3, n3) : this.renderLineWaveform(t3, e3, i3, n3);
  }
  renderSingleCanvas(t3, e3, i3, n3, s3, r3, o3) {
    const a3 = this.getPixelRatio(), l3 = document.createElement("canvas");
    l3.width = Math.round(i3 * a3), l3.height = Math.round(n3 * a3), l3.style.width = `${i3}px`, l3.style.height = `${n3}px`, l3.style.left = `${Math.round(s3)}px`, r3.appendChild(l3);
    const h3 = l3.getContext("2d");
    if (e3.renderFunction ? (h3.fillStyle = this.convertColorValues(e3.waveColor, h3), e3.renderFunction(t3, h3)) : this.renderWaveform(t3, e3, h3), l3.width > 0 && l3.height > 0) {
      const t4 = l3.cloneNode(), i4 = t4.getContext("2d");
      i4.drawImage(l3, 0, 0), i4.globalCompositeOperation = "source-in", i4.fillStyle = this.convertColorValues(e3.progressColor, i4), i4.fillRect(0, 0, l3.width, l3.height), o3.appendChild(t4);
    }
  }
  renderMultiCanvas(t3, e3, i3, n3, s3, r3) {
    const o3 = this.getPixelRatio(), { clientWidth: a3 } = this.scrollContainer, l3 = i3 / o3, h3 = (function({ clientWidth: t4, totalWidth: e4, options: i4 }) {
      return f(Math.min(8e3, t4, e4), i4);
    })({ clientWidth: a3, totalWidth: l3, options: e3 });
    let c2 = {};
    if (0 === h3) return;
    const d3 = (i4) => {
      if (i4 < 0 || i4 >= u2) return;
      if (c2[i4]) return;
      c2[i4] = true;
      const o4 = i4 * h3;
      let a4 = Math.min(l3 - o4, h3);
      if (a4 = f(a4, e3), a4 <= 0) return;
      const d4 = (function({ channelData: t4, offset: e4, clampedWidth: i5, totalWidth: n4 }) {
        return t4.map(((t5) => {
          const s4 = Math.floor(e4 / n4 * t5.length), r4 = Math.floor((e4 + i5) / n4 * t5.length);
          return t5.slice(s4, r4);
        }));
      })({ channelData: t3, offset: o4, clampedWidth: a4, totalWidth: l3 });
      this.renderSingleCanvas(d4, e3, a4, n3, o4, s3, r3);
    }, u2 = Math.ceil(l3 / h3);
    if (!this.isScrollable) {
      for (let t4 = 0; t4 < u2; t4++) d3(t4);
      return;
    }
    if (v({ scrollLeft: this.scrollContainer.scrollLeft, totalWidth: l3, numCanvases: u2 }).forEach(((t4) => d3(t4))), u2 > 1) {
      const t4 = this.on("scroll", (() => {
        const { scrollLeft: t5 } = this.scrollContainer;
        Object.keys(c2).length > 10 && (s3.innerHTML = "", r3.innerHTML = "", c2 = {}), v({ scrollLeft: t5, totalWidth: l3, numCanvases: u2 }).forEach(((t6) => d3(t6)));
      }));
      this.unsubscribeOnScroll.push(t4);
    }
  }
  renderChannel(t3, e3, i3, n3) {
    var { overlay: s3 } = e3, r3 = (function(t4, e4) {
      var i4 = {};
      for (var n4 in t4) Object.prototype.hasOwnProperty.call(t4, n4) && e4.indexOf(n4) < 0 && (i4[n4] = t4[n4]);
      if (null != t4 && "function" == typeof Object.getOwnPropertySymbols) {
        var s4 = 0;
        for (n4 = Object.getOwnPropertySymbols(t4); s4 < n4.length; s4++) e4.indexOf(n4[s4]) < 0 && Object.prototype.propertyIsEnumerable.call(t4, n4[s4]) && (i4[n4[s4]] = t4[n4[s4]]);
      }
      return i4;
    })(e3, ["overlay"]);
    const o3 = document.createElement("div"), a3 = this.getHeight(r3.height, r3.splitChannels);
    o3.style.height = `${a3}px`, s3 && n3 > 0 && (o3.style.marginTop = `-${a3}px`), this.canvasWrapper.style.minHeight = `${a3}px`, this.canvasWrapper.appendChild(o3);
    const l3 = o3.cloneNode();
    this.progressWrapper.appendChild(l3), this.renderMultiCanvas(t3, r3, i3, a3, o3, l3);
  }
  render(e3) {
    return t(this, void 0, void 0, (function* () {
      var t3;
      this.timeouts.forEach(((t4) => t4())), this.timeouts = [], this.unsubscribeOnScroll.forEach(((t4) => t4())), this.unsubscribeOnScroll = [], this.canvasWrapper.innerHTML = "", this.progressWrapper.innerHTML = "", null != this.options.width && (this.scrollContainer.style.width = "number" == typeof this.options.width ? `${this.options.width}px` : this.options.width);
      const i3 = this.getPixelRatio(), n3 = this.scrollContainer.clientWidth - this.containerInlinePadding, { scrollWidth: s3, isScrollable: r3, useParentWidth: o3, width: a3 } = (function({ duration: t4, minPxPerSec: e4 = 0, parentWidth: i4, fillParent: n4, pixelRatio: s4 }) {
        const r4 = Math.ceil(t4 * e4), o4 = r4 > i4, a4 = Boolean(n4 && !o4);
        return { scrollWidth: r4, isScrollable: o4, useParentWidth: a4, width: (a4 ? i4 : r4) * s4 };
      })({ duration: e3.duration, minPxPerSec: this.options.minPxPerSec || 0, parentWidth: n3, fillParent: this.options.fillParent, pixelRatio: i3 });
      if (this.isScrollable = r3, this.wrapper.style.width = o3 ? "100%" : `${s3}px`, this.scrollContainer.style.overflowX = this.isScrollable ? "auto" : "hidden", this.scrollContainer.classList.toggle("noScrollbar", !!this.options.hideScrollbar), this.cursor.style.backgroundColor = `${this.options.cursorColor || this.options.progressColor}`, this.cursor.style.width = `${this.options.cursorWidth}px`, this.audioData = e3, this.emit("render"), this.options.splitChannels) for (let i4 = 0; i4 < e3.numberOfChannels; i4++) {
        const n4 = Object.assign(Object.assign({}, this.options), null === (t3 = this.options.splitChannels) || void 0 === t3 ? void 0 : t3[i4]);
        this.renderChannel([e3.getChannelData(i4)], n4, a3, i4);
      }
      else {
        const t4 = [e3.getChannelData(0)];
        e3.numberOfChannels > 1 && t4.push(e3.getChannelData(1)), this.renderChannel(t4, this.options, a3, 0);
      }
      Promise.resolve().then((() => this.emit("rendered")));
    }));
  }
  reRender() {
    if (this.unsubscribeOnScroll.forEach(((t4) => t4())), this.unsubscribeOnScroll = [], !this.audioData) return;
    const { scrollWidth: t3 } = this.scrollContainer, { right: e3 } = this.progressWrapper.getBoundingClientRect();
    if (this.render(this.audioData), !this.isScrollable && this.scrollContainer.scrollLeft) this.scrollContainer.scrollLeft = 0;
    else if (this.isScrollable && t3 !== this.scrollContainer.scrollWidth) {
      const { right: t4 } = this.progressWrapper.getBoundingClientRect(), i3 = (function(t5) {
        const e4 = 2 * t5;
        return (e4 < 0 ? Math.floor(e4) : Math.ceil(e4)) / 2;
      })(t4 - e3);
      this.scrollContainer.scrollLeft += i3;
    }
  }
  zoom(t3) {
    this.options.minPxPerSec = t3, this.reRender();
  }
  scrollIntoView(t3, e3 = false) {
    var i3;
    const { scrollLeft: n3, scrollWidth: s3, clientWidth: r3 } = this.scrollContainer, o3 = t3 * s3, a3 = n3, l3 = n3 + r3, h3 = r3 / 2;
    if (this.isDragging) {
      const t4 = 30;
      o3 + t4 > l3 ? this.scrollContainer.scrollLeft += t4 : o3 - t4 < a3 && (this.scrollContainer.scrollLeft -= t4);
    } else {
      (o3 < a3 || o3 > l3) && (this.scrollContainer.scrollLeft = o3 - (this.options.autoCenter ? h3 : 0));
      const t4 = o3 - n3 - h3;
      if (e3 && this.options.autoCenter && t4 > 0) {
        const e4 = null === (i3 = this.audioData) || void 0 === i3 ? void 0 : i3.duration;
        if (void 0 === e4 || e4 <= 0) return void (this.scrollContainer.scrollLeft += t4);
        const n4 = s3 / e4;
        this.scrollContainer.scrollLeft += n4 <= 600 ? Math.min(t4, 10) : t4;
      }
    }
  }
  renderProgress(t3, e3) {
    if (isNaN(t3)) return;
    const i3 = 100 * t3;
    this.canvasWrapper.style.clipPath = `polygon(${i3}% 0%, 100% 0%, 100% 100%, ${i3}% 100%)`, this.progressWrapper.style.width = `${i3}%`, this.cursor.style.left = `${i3}%`, this.cursor.style.transform = this.options.cursorWidth ? `translateX(-${t3 * this.options.cursorWidth}px)` : "", this.isScrollable && this.options.autoScroll && this.audioData && this.audioData.duration > 0 && this.scrollIntoView(t3, e3);
  }
  exportImage(e3, i3, n3) {
    return t(this, void 0, void 0, (function* () {
      const t3 = this.canvasWrapper.querySelectorAll("canvas");
      if (!t3.length) throw new Error("No waveform data");
      if ("dataURL" === n3) {
        const n4 = Array.from(t3).map(((t4) => t4.toDataURL(e3, i3)));
        return Promise.resolve(n4);
      }
      return Promise.all(Array.from(t3).map(((t4) => new Promise(((n4, s3) => {
        t4.toBlob(((t5) => {
          t5 ? n4(t5) : s3(new Error("Could not export image"));
        }), e3, i3);
      })))));
    }));
  }
};
var S = class extends e {
  constructor() {
    super(...arguments), this.animationFrameId = null, this.isRunning = false;
  }
  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    const t3 = () => {
      this.isRunning && (this.emit("tick"), this.animationFrameId = requestAnimationFrame(t3));
    };
    t3();
  }
  stop() {
    this.isRunning = false, null !== this.animationFrameId && (cancelAnimationFrame(this.animationFrameId), this.animationFrameId = null);
  }
  destroy() {
    this.stop(), this.unAll();
  }
};
var E = class extends e {
  constructor(t3) {
    super(), this.bufferNode = null, this.playStartTime = 0, this.playbackPosition = 0, this._muted = false, this._playbackRate = 1, this._duration = void 0, this.buffer = null, this.currentSrc = "", this.paused = true, this.crossOrigin = null, this.seeking = false, this.autoplay = false, this.addEventListener = this.on, this.removeEventListener = this.un, this._destroyed = false, (function() {
      const t4 = globalThis.navigator;
      if (null == t4 ? void 0 : t4.audioSession) try {
        t4.audioSession.type = "playback";
      } catch (t5) {
        console.warn("Setting navigator.audioSession.type failed:", t5);
      }
    })(), this.audioContext = t3 || new AudioContext(), this.gainNode = this.audioContext.createGain(), this.gainNode.connect(this.audioContext.destination);
  }
  load() {
    return t(this, void 0, void 0, (function* () {
    }));
  }
  remove() {
    this.destroy();
  }
  destroy() {
    if (!this._destroyed) {
      if (this._destroyed = true, this.currentSrc = "", this.bufferNode) {
        this.bufferNode.onended = null;
        try {
          this.bufferNode.stop();
        } catch (t3) {
        }
        this.bufferNode.disconnect(), this.bufferNode = null;
      }
      this.gainNode.disconnect(), "function" == typeof this.audioContext.close && Promise.resolve(this.audioContext.close.call(this.audioContext)).catch((() => {
      })), this.buffer = null, this.unAll();
    }
  }
  get src() {
    return this.currentSrc;
  }
  set src(t3) {
    if (this.currentSrc = t3, this._duration = void 0, !t3) return this.buffer = null, void this.emit("emptied");
    fetch(t3).then(((e3) => {
      if (e3.status >= 400) throw new Error(`Failed to fetch ${t3}: ${e3.status} (${e3.statusText})`);
      return e3.arrayBuffer();
    })).then(((e3) => this.currentSrc !== t3 ? null : this.audioContext.decodeAudioData(e3))).then(((e3) => {
      this.currentSrc === t3 && (this.buffer = e3, this.emit("loadedmetadata"), this.emit("canplay"), this.autoplay && this.play());
    })).catch(((t4) => {
      console.error("WebAudioPlayer load error:", t4);
    }));
  }
  _play() {
    if (!this.paused) return;
    this.paused = false, this.bufferNode && (this.bufferNode.onended = null, this.bufferNode.disconnect()), this.bufferNode = this.audioContext.createBufferSource(), this.buffer && (this.bufferNode.buffer = this.buffer), this.bufferNode.playbackRate.value = this._playbackRate, this.bufferNode.connect(this.gainNode);
    let t3 = this.playbackPosition;
    (t3 >= this.duration || t3 < 0) && (t3 = 0, this.playbackPosition = 0), this.bufferNode.start(this.audioContext.currentTime, t3), this.playStartTime = this.audioContext.currentTime, this.bufferNode.onended = () => {
      !this.paused && this.duration - this.currentTime < 0.01 && (this.pause(), this.emit("ended"));
    };
  }
  _pause() {
    if (this.paused = true, this.bufferNode) {
      this.bufferNode.onended = null;
      try {
        this.bufferNode.stop();
      } catch (t3) {
      }
    }
    this.playbackPosition += (this.audioContext.currentTime - this.playStartTime) * this._playbackRate;
  }
  play() {
    return t(this, void 0, void 0, (function* () {
      this.paused && (this._play(), this.emit("play"));
    }));
  }
  pause() {
    this.paused || (this._pause(), this.emit("pause"));
  }
  stopAt(t3) {
    const e3 = (t3 - this.currentTime) / this._playbackRate, i3 = this.bufferNode;
    null == i3 || i3.stop(this.audioContext.currentTime + e3), null == i3 || i3.addEventListener("ended", (() => {
      i3 === this.bufferNode && (this.bufferNode = null, this.pause(), this.playbackPosition = Math.min(t3, this.duration), this.emit("timeupdate"));
    }), { once: true });
  }
  setSinkId(e3) {
    return t(this, void 0, void 0, (function* () {
      return this.audioContext.setSinkId(e3);
    }));
  }
  get playbackRate() {
    return this._playbackRate;
  }
  set playbackRate(t3) {
    const e3 = !this.paused;
    e3 && this._pause(), this._playbackRate = t3, e3 && this._play(), this.bufferNode && (this.bufferNode.playbackRate.value = t3);
  }
  get currentTime() {
    return this.paused ? this.playbackPosition : this.playbackPosition + (this.audioContext.currentTime - this.playStartTime) * this._playbackRate;
  }
  set currentTime(t3) {
    const e3 = !this.paused;
    e3 && this._pause(), this.playbackPosition = t3, e3 && this._play(), this.emit("seeking"), this.emit("timeupdate");
  }
  get duration() {
    var t3, e3;
    return null !== (t3 = this._duration) && void 0 !== t3 ? t3 : (null === (e3 = this.buffer) || void 0 === e3 ? void 0 : e3.duration) || 0;
  }
  set duration(t3) {
    this._duration = t3;
  }
  get volume() {
    return this.gainNode.gain.value;
  }
  set volume(t3) {
    this.gainNode.gain.value = t3, this.emit("volumechange");
  }
  get muted() {
    return this._muted;
  }
  set muted(t3) {
    this._muted !== t3 && (this._muted = t3, this._muted ? this.gainNode.disconnect() : this.gainNode.connect(this.audioContext.destination));
  }
  canPlayType(t3) {
    return /^(audio|video)\//.test(t3);
  }
  getGainNode() {
    return this.gainNode;
  }
  getChannelData() {
    const t3 = [];
    if (!this.buffer) return t3;
    const e3 = this.buffer.numberOfChannels;
    for (let i3 = 0; i3 < e3; i3++) t3.push(this.buffer.getChannelData(i3));
    return t3;
  }
  removeAttribute(t3) {
    switch (t3) {
      case "src":
        this.src = "";
        break;
      case "playbackRate":
        this.playbackRate = 0;
        break;
      case "currentTime":
        this.currentTime = 0;
        break;
      case "duration":
        this.duration = 0;
        break;
      case "volume":
        this.volume = 0;
        break;
      case "muted":
        this.muted = false;
    }
  }
};
var P = { waveColor: "#999", progressColor: "#555", cursorWidth: 1, minPxPerSec: 0, fillParent: true, interact: true, dragToSeek: false, autoScroll: true, autoCenter: true, sampleRate: 8e3 };
var w = class _w extends d {
  static create(t3) {
    return new _w(t3);
  }
  getState() {
    return this.wavesurferState;
  }
  getRenderer() {
    return this.renderer;
  }
  constructor(t3) {
    const e3 = t3.media || ("WebAudio" === t3.backend ? new E() : void 0);
    super({ media: e3, mediaControls: t3.mediaControls, autoplay: t3.autoplay, playbackRate: t3.audioRate }), this.plugins = [], this.decodedData = null, this.stopAtPosition = null, this.subscriptions = [], this.mediaSubscriptions = [], this.abortController = null, this._isDestroyed = false, this._loadVersion = 0, this.options = Object.assign({}, P, t3);
    const { state: i3, actions: n3 } = (function(t4) {
      var e4, i4, n4, s4, r4, o3;
      const a3 = null !== (e4 = null == t4 ? void 0 : t4.currentTime) && void 0 !== e4 ? e4 : l(0), c2 = null !== (i4 = null == t4 ? void 0 : t4.duration) && void 0 !== i4 ? i4 : l(0), d3 = null !== (n4 = null == t4 ? void 0 : t4.isPlaying) && void 0 !== n4 ? n4 : l(false), u2 = null !== (s4 = null == t4 ? void 0 : t4.isSeeking) && void 0 !== s4 ? s4 : l(false), p2 = null !== (r4 = null == t4 ? void 0 : t4.volume) && void 0 !== r4 ? r4 : l(1), m2 = null !== (o3 = null == t4 ? void 0 : t4.playbackRate) && void 0 !== o3 ? o3 : l(1), g2 = l(null), f2 = l(null), v2 = l(""), b2 = l(0), y2 = l(0), C2 = h((() => !d3.value), [d3]), S2 = h((() => null !== g2.value), [g2]), E2 = h((() => S2.value && c2.value > 0), [S2, c2]), P2 = h((() => a3.value), [a3]), w2 = h((() => c2.value > 0 ? a3.value / c2.value : 0), [a3, c2]);
      return { state: { currentTime: a3, duration: c2, isPlaying: d3, isPaused: C2, isSeeking: u2, volume: p2, playbackRate: m2, audioBuffer: g2, peaks: f2, url: v2, zoom: b2, scrollPosition: y2, canPlay: S2, isReady: E2, progress: P2, progressPercent: w2 }, actions: { setCurrentTime: (t5) => {
        const e5 = Math.max(0, Math.min(c2.value || 1 / 0, t5));
        a3.set(e5);
      }, setDuration: (t5) => {
        c2.set(Math.max(0, t5));
      }, setPlaying: (t5) => {
        d3.set(t5);
      }, setSeeking: (t5) => {
        u2.set(t5);
      }, setVolume: (t5) => {
        const e5 = Math.max(0, Math.min(1, t5));
        p2.set(e5);
      }, setPlaybackRate: (t5) => {
        const e5 = Math.max(0.1, Math.min(16, t5));
        m2.set(e5);
      }, setAudioBuffer: (t5) => {
        g2.set(t5), t5 && c2.set(t5.duration);
      }, setPeaks: (t5) => {
        f2.set(t5);
      }, setUrl: (t5) => {
        v2.set(t5);
      }, setZoom: (t5) => {
        b2.set(Math.max(0, t5));
      }, setScrollPosition: (t5) => {
        y2.set(Math.max(0, t5));
      } } };
    })({ isPlaying: this.isPlayingSignal, currentTime: this.currentTimeSignal, duration: this.durationSignal, volume: this.volumeSignal, playbackRate: this.playbackRateSignal, isSeeking: this.seekingSignal });
    this.wavesurferState = i3, this.wavesurferActions = n3, this.timer = new S();
    const s3 = e3 ? void 0 : this.getMediaElement();
    this.renderer = new C(this.options, s3), this.initPlayerEvents(), this.initRendererEvents(), this.initTimerEvents(), this.initPlugins();
    const r3 = this.options.url || this.getSrc() || "";
    Promise.resolve().then((() => {
      this.emit("init");
      const { peaks: t4, duration: e4 } = this.options;
      (r3 || t4 && e4) && this.load(r3, t4, e4).catch((() => {
      }));
    }));
  }
  updateProgress(t3 = this.getCurrentTime()) {
    return this.renderer.renderProgress(t3 / this.getDuration(), this.isPlaying()), t3;
  }
  initTimerEvents() {
    this.subscriptions.push(this.timer.on("tick", (() => {
      if (!this.isSeeking()) {
        const t3 = this.updateProgress();
        if (this.emit("timeupdate", t3), this.emit("audioprocess", t3), null != this.stopAtPosition && this.isPlaying() && t3 >= this.stopAtPosition) {
          const t4 = this.stopAtPosition;
          this.pause(), this.setTime(t4);
        }
      }
    })));
  }
  initPlayerEvents() {
    this.isPlaying() && (this.emit("play"), this.timer.start()), this.mediaSubscriptions.push(this.onMediaEvent("timeupdate", (() => {
      const t3 = this.updateProgress();
      this.emit("timeupdate", t3);
    })), this.onMediaEvent("play", (() => {
      this.emit("play"), this.timer.start();
    })), this.onMediaEvent("pause", (() => {
      this.emit("pause"), this.timer.stop(), this.stopAtPosition = null;
    })), this.onMediaEvent("emptied", (() => {
      this.timer.stop(), this.stopAtPosition = null;
    })), this.onMediaEvent("ended", (() => {
      this.emit("timeupdate", this.getDuration()), this.emit("finish"), this.stopAtPosition = null;
    })), this.onMediaEvent("seeking", (() => {
      this.emit("seeking", this.getCurrentTime());
    })), this.onMediaEvent("error", (() => {
      var t3;
      this.emit("error", null !== (t3 = this.getMediaElement().error) && void 0 !== t3 ? t3 : new Error("Media error")), this.stopAtPosition = null;
    })));
  }
  initRendererEvents() {
    this.subscriptions.push(this.renderer.on("click", ((t3, e3) => {
      this.options.interact && (this.seekTo(t3), this.emit("interaction", t3 * this.getDuration()), this.emit("click", t3, e3));
    })), this.renderer.on("dblclick", ((t3, e3) => {
      this.emit("dblclick", t3, e3);
    })), this.renderer.on("scroll", ((t3, e3, i3, n3) => {
      const s3 = this.getDuration();
      this.emit("scroll", t3 * s3, e3 * s3, i3, n3);
    })), this.renderer.on("render", (() => {
      this.emit("redraw");
    })), this.renderer.on("rendered", (() => {
      this.emit("redrawcomplete");
    })), this.renderer.on("dragstart", ((t3) => {
      this.emit("dragstart", t3);
    })), this.renderer.on("dragend", ((t3) => {
      this.emit("dragend", t3);
    })), this.renderer.on("resize", (() => {
      this.emit("resize");
    })));
    {
      let t3;
      const e3 = this.renderer.on("drag", ((e4) => {
        var i3;
        if (!this.options.interact) return;
        this.renderer.renderProgress(e4), clearTimeout(t3);
        let n3 = 0;
        const s3 = this.options.dragToSeek;
        this.isPlaying() ? n3 = 0 : true === s3 ? n3 = 200 : s3 && "object" == typeof s3 && (n3 = null !== (i3 = s3.debounceTime) && void 0 !== i3 ? i3 : 200), t3 = setTimeout((() => {
          this.seekTo(e4);
        }), n3), this.emit("interaction", e4 * this.getDuration()), this.emit("drag", e4);
      }));
      this.subscriptions.push((() => {
        clearTimeout(t3), e3();
      }));
    }
  }
  initPlugins() {
    var t3;
    (null === (t3 = this.options.plugins) || void 0 === t3 ? void 0 : t3.length) && this.options.plugins.forEach(((t4) => {
      this.registerPlugin(t4);
    }));
  }
  unsubscribePlayerEvents() {
    this.mediaSubscriptions.forEach(((t3) => t3())), this.mediaSubscriptions = [];
  }
  setOptions(t3) {
    this.options = Object.assign({}, this.options, t3), t3.duration && !t3.peaks && (this.decodedData = i.createBuffer(this.exportPeaks(), t3.duration)), t3.peaks && t3.duration && (this.decodedData = i.createBuffer(t3.peaks, t3.duration)), this.renderer.setOptions(this.options), t3.audioRate && this.setPlaybackRate(t3.audioRate), null != t3.mediaControls && (this.getMediaElement().controls = t3.mediaControls);
  }
  registerPlugin(t3) {
    if (this.plugins.includes(t3)) return t3;
    t3._init(this), this.plugins.push(t3);
    const e3 = t3.once("destroy", (() => {
      this.plugins = this.plugins.filter(((e4) => e4 !== t3)), this.subscriptions = this.subscriptions.filter(((t4) => t4 !== e3));
    }));
    return this.subscriptions.push(e3), t3;
  }
  unregisterPlugin(t3) {
    this.plugins = this.plugins.filter(((e3) => e3 !== t3)), t3.destroy();
  }
  getWrapper() {
    return this.renderer.getWrapper();
  }
  getWidth() {
    return this.renderer.getWidth();
  }
  getScroll() {
    return this.renderer.getScroll();
  }
  setScroll(t3) {
    return this.renderer.setScroll(t3);
  }
  setScrollTime(t3) {
    const e3 = t3 / this.getDuration();
    this.renderer.setScrollPercentage(e3);
  }
  getActivePlugins() {
    return this.plugins;
  }
  loadAudio(e3, n3, s3, r3) {
    return t(this, void 0, void 0, (function* () {
      var t3;
      const o3 = ++this._loadVersion;
      if (this._isDestroyed = false, this.emit("load", e3), !this.options.media && this.isPlaying() && this.pause(), this.decodedData = null, this.stopAtPosition = null, null === (t3 = this.abortController) || void 0 === t3 || t3.abort(), this.abortController = null, !n3 && !s3) {
        const t4 = this.options.fetchParams || {};
        window.AbortController && !t4.signal && (this.abortController = new AbortController(), t4.signal = this.abortController.signal);
        const i3 = (t5) => this.emit("loading", t5);
        if (n3 = yield a.fetchBlob(e3, i3, t4), this._isDestroyed || o3 !== this._loadVersion) return;
        const s4 = this.options.blobMimeType;
        s4 && (n3 = new Blob([n3], { type: s4 }));
      }
      if (this._isDestroyed || o3 !== this._loadVersion) return;
      this.setSrc(e3, n3);
      const l3 = yield new Promise(((t4) => {
        const e4 = r3 || this.getDuration();
        e4 ? t4(e4) : this.mediaSubscriptions.push(this.onMediaEvent("loadedmetadata", (() => t4(this.getDuration())), { once: true }));
      }));
      if (!this._isDestroyed && o3 === this._loadVersion) {
        if (!e3 && !n3) {
          const t4 = this.getMediaElement();
          t4 instanceof E && (t4.duration = l3);
        }
        if (s3) this.decodedData = i.createBuffer(s3, l3 || 0);
        else if (n3) {
          const t4 = yield n3.arrayBuffer();
          if (this._isDestroyed || o3 !== this._loadVersion) return;
          this.decodedData = yield i.decode(t4, this.options.sampleRate);
        }
        this._isDestroyed || o3 !== this._loadVersion || (this.decodedData && (this.emit("decode", this.getDuration()), this.renderer.render(this.decodedData)), this.emit("ready", this.getDuration()));
      }
    }));
  }
  load(e3, i3, n3) {
    return t(this, void 0, void 0, (function* () {
      try {
        return yield this.loadAudio(e3, void 0, i3, n3);
      } catch (t3) {
        throw this.emit("error", t3), t3;
      }
    }));
  }
  loadBlob(e3, i3, n3) {
    return t(this, void 0, void 0, (function* () {
      try {
        return yield this.loadAudio("", e3, i3, n3);
      } catch (t3) {
        throw this.emit("error", t3), t3;
      }
    }));
  }
  zoom(t3) {
    if (!this.decodedData) throw new Error("No audio loaded");
    this.renderer.zoom(t3), this.emit("zoom", t3);
  }
  getDecodedData() {
    return this.decodedData;
  }
  exportPeaks({ channels: t3 = 2, maxLength: e3 = 8e3, precision: i3 = 1e4 } = {}) {
    if (!this.decodedData) throw new Error("The audio has not been decoded yet");
    const n3 = Math.min(t3, this.decodedData.numberOfChannels), s3 = [];
    for (let t4 = 0; t4 < n3; t4++) {
      const n4 = this.decodedData.getChannelData(t4), r3 = [], o3 = n4.length / e3;
      for (let t5 = 0; t5 < e3; t5++) {
        const e4 = n4.slice(Math.floor(t5 * o3), Math.ceil((t5 + 1) * o3));
        let s4 = 0;
        for (let t6 = 0; t6 < e4.length; t6++) {
          const i4 = e4[t6];
          Math.abs(i4) > Math.abs(s4) && (s4 = i4);
        }
        r3.push(Math.round(s4 * i3) / i3);
      }
      s3.push(r3);
    }
    return s3;
  }
  getDuration() {
    let t3 = super.getDuration() || 0;
    return 0 !== t3 && t3 !== 1 / 0 || !this.decodedData || (t3 = this.decodedData.duration), t3;
  }
  toggleInteraction(t3) {
    this.options.interact = t3;
  }
  setTime(t3) {
    this.stopAtPosition = null, super.setTime(t3), this.updateProgress(t3), this.emit("timeupdate", t3);
  }
  seekTo(t3) {
    const e3 = this.getDuration() * t3;
    this.setTime(e3);
  }
  play(e3, i3) {
    const n3 = Object.create(null, { play: { get: () => super.play } });
    return t(this, void 0, void 0, (function* () {
      null != e3 && this.setTime(e3);
      const t3 = yield n3.play.call(this);
      return null != i3 && (this.media instanceof E ? this.media.stopAt(i3) : this.stopAtPosition = i3), t3;
    }));
  }
  playPause() {
    return t(this, void 0, void 0, (function* () {
      return this.isPlaying() ? this.pause() : this.play();
    }));
  }
  stop() {
    this.pause(), this.setTime(0);
  }
  skip(t3) {
    this.setTime(this.getCurrentTime() + t3);
  }
  empty() {
    this.load("", [[0]], 1e-3);
  }
  setMediaElement(t3) {
    this.unsubscribePlayerEvents(), super.setMediaElement(t3), this.initPlayerEvents();
  }
  exportImage() {
    return t(this, arguments, void 0, (function* (t3 = "image/png", e3 = 1, i3 = "dataURL") {
      return this.renderer.exportImage(t3, e3, i3);
    }));
  }
  destroy() {
    var t3;
    this._isDestroyed = true, this.emit("destroy"), null === (t3 = this.abortController) || void 0 === t3 || t3.abort(), this.plugins.forEach(((t4) => t4.destroy())), this.subscriptions.forEach(((t4) => t4())), this.unsubscribePlayerEvents(), this.timer.destroy(), this.renderer.destroy(), super.destroy();
  }
};
w.BasePlugin = class extends e {
  constructor(t3) {
    super(), this.subscriptions = [], this.isDestroyed = false, this.options = t3;
  }
  onInit() {
  }
  _init(t3) {
    this.isDestroyed && (this.subscriptions = [], this.isDestroyed = false), this.wavesurfer = t3, this.onInit();
  }
  destroy() {
    this.emit("destroy"), this.subscriptions.forEach(((t3) => t3())), this.subscriptions = [], this.isDestroyed = true, this.wavesurfer = void 0;
  }
}, w.dom = o;

// node_modules/wavesurfer.js/dist/plugins/regions.esm.js
var t2 = class {
  constructor() {
    this.listeners = {};
  }
  on(t3, e3, i3) {
    if (this.listeners[t3] || (this.listeners[t3] = /* @__PURE__ */ new Set()), null == i3 ? void 0 : i3.once) {
      const i4 = (...n3) => {
        this.un(t3, i4), e3(...n3);
      };
      return this.listeners[t3].add(i4), () => this.un(t3, i4);
    }
    return this.listeners[t3].add(e3), () => this.un(t3, e3);
  }
  un(t3, e3) {
    var i3;
    null === (i3 = this.listeners[t3]) || void 0 === i3 || i3.delete(e3);
  }
  once(t3, e3) {
    return this.on(t3, e3, { once: true });
  }
  unAll() {
    this.listeners = {};
  }
  emit(t3, ...e3) {
    this.listeners[t3] && this.listeners[t3].forEach(((t4) => t4(...e3)));
  }
};
var e2 = class extends t2 {
  constructor(t3) {
    super(), this.subscriptions = [], this.isDestroyed = false, this.options = t3;
  }
  onInit() {
  }
  _init(t3) {
    this.isDestroyed && (this.subscriptions = [], this.isDestroyed = false), this.wavesurfer = t3, this.onInit();
  }
  destroy() {
    this.emit("destroy"), this.subscriptions.forEach(((t3) => t3())), this.subscriptions = [], this.isDestroyed = true, this.wavesurfer = void 0;
  }
};
function i2(t3, e3) {
  const n3 = e3.xmlns ? document.createElementNS(e3.xmlns, t3) : document.createElement(t3);
  for (const [t4, s3] of Object.entries(e3)) if ("children" === t4 && s3) for (const [t5, e4] of Object.entries(s3)) e4 instanceof Node ? n3.appendChild(e4) : "string" == typeof e4 ? n3.appendChild(document.createTextNode(e4)) : n3.appendChild(i2(t5, e4));
  else "style" === t4 ? Object.assign(n3.style, s3) : "textContent" === t4 ? n3.textContent = s3 : n3.setAttribute(t4, s3.toString());
  return n3;
}
function n2(t3, e3, n3) {
  const s3 = i2(t3, e3 || {});
  return null == n3 || n3.appendChild(s3), s3;
}
function s2(t3) {
  let e3 = t3;
  const i3 = /* @__PURE__ */ new Set();
  return { get value() {
    return e3;
  }, set(t4) {
    Object.is(e3, t4) || (e3 = t4, i3.forEach(((t5) => t5(e3))));
  }, update(t4) {
    this.set(t4(e3));
  }, subscribe: (t4) => (i3.add(t4), () => i3.delete(t4)) };
}
function r2(t3, e3) {
  let i3;
  const n3 = () => {
    i3 && (i3(), i3 = void 0), i3 = t3();
  }, s3 = e3.map(((t4) => t4.subscribe(n3)));
  return n3(), () => {
    i3 && (i3(), i3 = void 0), s3.forEach(((t4) => t4()));
  };
}
function o2(t3, e3) {
  const i3 = s2(null), n3 = (t4) => {
    i3.set(t4);
  };
  return t3.addEventListener(e3, n3), i3._cleanup = () => {
    t3.removeEventListener(e3, n3);
  }, i3;
}
function l2(t3) {
  const e3 = t3._cleanup;
  "function" == typeof e3 && e3();
}
function h2(t3, e3 = {}) {
  const { threshold: i3 = 3, mouseButton: n3 = 0, touchDelay: r3 = 100 } = e3, o3 = s2(null), h3 = /* @__PURE__ */ new Map(), a3 = matchMedia("(pointer: coarse)").matches;
  let d3 = () => {
  };
  const c2 = (e4) => {
    if (e4.button !== n3) return;
    if (h3.has(e4.pointerId)) return;
    if (h3.set(e4.pointerId, e4), h3.size > 1) return;
    const s3 = e4.pointerId;
    let l3 = e4.clientX, c3 = e4.clientY, u2 = false;
    const p2 = Date.now(), v2 = t3.getBoundingClientRect(), { left: g2, top: m2 } = v2, f2 = (t4) => {
      if (t4.pointerId !== s3) return;
      if (t4.defaultPrevented || h3.size > 1) return;
      if (a3 && Date.now() - p2 < r3) return;
      const e5 = t4.clientX, n4 = t4.clientY, d4 = e5 - l3, v3 = n4 - c3;
      (u2 || Math.abs(d4) > i3 || Math.abs(v3) > i3) && (t4.preventDefault(), t4.stopPropagation(), u2 || (o3.set({ type: "start", x: l3 - g2, y: c3 - m2 }), u2 = true), o3.set({ type: "move", x: e5 - g2, y: n4 - m2, deltaX: d4, deltaY: v3 }), l3 = e5, c3 = n4);
    }, b2 = (t4) => {
      if (h3.delete(t4.pointerId)) {
        if (t4.pointerId === s3 && u2) {
          const e5 = t4.clientX, i4 = t4.clientY;
          o3.set({ type: "end", x: e5 - g2, y: i4 - m2 });
        }
        0 === h3.size && d3();
      }
    }, E2 = (t4) => {
      t4.relatedTarget && t4.relatedTarget !== document.documentElement || b2(t4);
    }, C2 = (t4) => {
      u2 && (t4.stopPropagation(), t4.preventDefault());
    }, L = (t4) => {
      t4.defaultPrevented || h3.size > 1 || u2 && t4.preventDefault();
    };
    document.addEventListener("pointermove", f2), document.addEventListener("pointerup", b2), document.addEventListener("pointerout", E2), document.addEventListener("pointercancel", E2), document.addEventListener("touchmove", L, { passive: false }), document.addEventListener("click", C2, { capture: true }), d3 = () => {
      document.removeEventListener("pointermove", f2), document.removeEventListener("pointerup", b2), document.removeEventListener("pointerout", E2), document.removeEventListener("pointercancel", E2), document.removeEventListener("touchmove", L), setTimeout((() => {
        document.removeEventListener("click", C2, { capture: true });
      }), 10);
    };
  };
  t3.addEventListener("pointerdown", c2);
  return { signal: o3, cleanup: () => {
    d3(), t3.removeEventListener("pointerdown", c2), h3.clear(), l2(o3);
  } };
}
var a2 = class extends t2 {
  constructor(t3, e3, i3 = 0) {
    var n3, s3, r3, o3, l3, h3, a3, d3, c2, u2;
    super(), this.totalDuration = e3, this.numberOfChannels = i3, this.element = null, this.minLength = 0, this.maxLength = 1 / 0, this.contentEditable = false, this.subscriptions = [], this.updatingSide = void 0, this.isRemoved = false, this.subscriptions = [], this.id = t3.id || `region-${Math.random().toString(32).slice(2)}`, this.start = this.clampPosition(t3.start), this.end = this.clampPosition(null !== (n3 = t3.end) && void 0 !== n3 ? n3 : t3.start), this.drag = null === (s3 = t3.drag) || void 0 === s3 || s3, this.resize = null === (r3 = t3.resize) || void 0 === r3 || r3, this.resizeStart = null === (o3 = t3.resizeStart) || void 0 === o3 || o3, this.resizeEnd = null === (l3 = t3.resizeEnd) || void 0 === l3 || l3, this.color = null !== (h3 = t3.color) && void 0 !== h3 ? h3 : "rgba(0, 0, 0, 0.1)", this.minLength = null !== (a3 = t3.minLength) && void 0 !== a3 ? a3 : this.minLength, this.maxLength = null !== (d3 = t3.maxLength) && void 0 !== d3 ? d3 : this.maxLength, this.channelIdx = null !== (c2 = t3.channelIdx) && void 0 !== c2 ? c2 : -1, this.contentEditable = null !== (u2 = t3.contentEditable) && void 0 !== u2 ? u2 : this.contentEditable, this.element = this.initElement(), this.setContent(t3.content), this.setPart(), this.renderPosition(), this.initMouseEvents();
  }
  clampPosition(t3) {
    return Math.max(0, Math.min(this.totalDuration, t3));
  }
  setPart() {
    var t3;
    const e3 = this.start === this.end;
    null === (t3 = this.element) || void 0 === t3 || t3.setAttribute("part", `${e3 ? "marker" : "region"} ${this.id}`);
  }
  addResizeHandles(t3) {
    const e3 = { position: "absolute", zIndex: "2", width: "6px", height: "100%", top: "0", cursor: "ew-resize", wordBreak: "keep-all" }, i3 = n2("div", { part: "region-handle region-handle-left", style: Object.assign(Object.assign({}, e3), { left: "0", borderLeft: "2px solid rgba(0, 0, 0, 0.5)", borderRadius: "2px 0 0 2px" }) }, t3), s3 = n2("div", { part: "region-handle region-handle-right", style: Object.assign(Object.assign({}, e3), { right: "0", borderRight: "2px solid rgba(0, 0, 0, 0.5)", borderRadius: "0 2px 2px 0" }) }, t3), o3 = h2(i3, { threshold: 1 }), l3 = h2(s3, { threshold: 1 }), a3 = r2((() => {
      const t4 = o3.signal.value;
      t4 && ("move" === t4.type && void 0 !== t4.deltaX ? this.onResize(t4.deltaX, "start") : "end" === t4.type && this.onEndResizing("start"));
    }), [o3.signal]), d3 = r2((() => {
      const t4 = l3.signal.value;
      t4 && ("move" === t4.type && void 0 !== t4.deltaX ? this.onResize(t4.deltaX, "end") : "end" === t4.type && this.onEndResizing("end"));
    }), [l3.signal]);
    this.subscriptions.push((() => {
      a3(), d3(), o3.cleanup(), l3.cleanup();
    }));
  }
  removeResizeHandles(t3) {
    const e3 = t3.querySelector('[part*="region-handle-left"]'), i3 = t3.querySelector('[part*="region-handle-right"]');
    e3 && t3.removeChild(e3), i3 && t3.removeChild(i3);
  }
  initElement() {
    if (this.isRemoved) return null;
    const t3 = this.start === this.end;
    let e3 = 0, i3 = 100;
    this.channelIdx >= 0 && this.numberOfChannels > 0 && this.channelIdx < this.numberOfChannels && (i3 = 100 / this.numberOfChannels, e3 = i3 * this.channelIdx);
    const s3 = n2("div", { style: { position: "absolute", top: `${e3}%`, height: `${i3}%`, backgroundColor: t3 ? "none" : this.color, borderLeft: t3 ? "2px solid " + this.color : "none", borderRadius: "2px", boxSizing: "border-box", transition: "background-color 0.2s ease", cursor: this.drag ? "grab" : "default", pointerEvents: "all" } });
    return !t3 && this.resize && this.addResizeHandles(s3), s3;
  }
  renderPosition() {
    if (!this.element) return;
    const t3 = this.start / this.totalDuration, e3 = (this.totalDuration - this.end) / this.totalDuration;
    this.element.style.left = 100 * t3 + "%", this.element.style.right = 100 * e3 + "%";
  }
  toggleCursor(t3) {
    var e3;
    this.drag && (null === (e3 = this.element) || void 0 === e3 ? void 0 : e3.style) && (this.element.style.cursor = t3 ? "grabbing" : "grab");
  }
  initMouseEvents() {
    const { element: t3 } = this;
    if (!t3) return;
    const e3 = o2(t3, "click"), i3 = o2(t3, "mouseenter"), n3 = o2(t3, "mouseleave"), s3 = o2(t3, "dblclick"), a3 = o2(t3, "pointerdown"), d3 = o2(t3, "pointerup"), c2 = e3.subscribe(((t4) => t4 && this.emit("click", t4))), u2 = i3.subscribe(((t4) => t4 && this.emit("over", t4))), p2 = n3.subscribe(((t4) => t4 && this.emit("leave", t4))), v2 = s3.subscribe(((t4) => t4 && this.emit("dblclick", t4))), g2 = a3.subscribe(((t4) => t4 && this.toggleCursor(true))), m2 = d3.subscribe(((t4) => t4 && this.toggleCursor(false)));
    this.subscriptions.push((() => {
      c2(), u2(), p2(), v2(), g2(), m2(), l2(e3), l2(i3), l2(n3), l2(s3), l2(a3), l2(d3);
    }));
    const f2 = h2(t3), b2 = r2((() => {
      const t4 = f2.signal.value;
      t4 && ("start" === t4.type ? this.toggleCursor(true) : "move" === t4.type && void 0 !== t4.deltaX ? this.onMove(t4.deltaX) : "end" === t4.type && (this.toggleCursor(false), this.drag && this.emit("update-end")));
    }), [f2.signal]);
    this.subscriptions.push((() => {
      b2(), f2.cleanup();
    })), this.contentEditable && this.content && (this.contentClickListener = (t4) => this.onContentClick(t4), this.contentBlurListener = () => this.onContentBlur(), this.content.addEventListener("click", this.contentClickListener), this.content.addEventListener("blur", this.contentBlurListener));
  }
  _onUpdate(t3, e3, i3) {
    var n3;
    if (!(null === (n3 = this.element) || void 0 === n3 ? void 0 : n3.parentElement)) return;
    const { width: s3 } = this.element.parentElement.getBoundingClientRect(), r3 = t3 / s3 * this.totalDuration;
    let o3 = e3 && "start" !== e3 ? this.start : this.start + r3, l3 = e3 && "end" !== e3 ? this.end : this.end + r3;
    const h3 = void 0 !== i3;
    h3 && this.updatingSide && this.updatingSide !== e3 && ("start" === this.updatingSide ? o3 = i3 : l3 = i3), o3 = Math.max(0, o3), l3 = Math.min(this.totalDuration, l3);
    const a3 = l3 - o3;
    this.updatingSide = e3;
    const d3 = a3 >= this.minLength && a3 <= this.maxLength;
    o3 <= l3 && (d3 || h3) && (this.start = o3, this.end = l3, this.renderPosition(), this.emit("update", e3));
  }
  onMove(t3) {
    this.drag && this._onUpdate(t3);
  }
  onResize(t3, e3) {
    this.resize && (this.resizeStart || "start" !== e3) && (this.resizeEnd || "end" !== e3) && this._onUpdate(t3, e3);
  }
  onEndResizing(t3) {
    this.resize && (this.emit("update-end", t3), this.updatingSide = void 0);
  }
  onContentClick(t3) {
    t3.stopPropagation();
    t3.target.focus(), this.emit("click", t3);
  }
  onContentBlur() {
    this.emit("update-end");
  }
  _setTotalDuration(t3) {
    this.totalDuration = t3, this.renderPosition();
  }
  play(t3) {
    this.emit("play", t3 && this.end !== this.start ? this.end : void 0);
  }
  getContent(t3 = false) {
    var e3;
    return t3 ? this.content || void 0 : this.element instanceof HTMLElement ? (null === (e3 = this.content) || void 0 === e3 ? void 0 : e3.innerHTML) || void 0 : "";
  }
  setContent(t3) {
    var e3;
    if (this.element) if (this.content && this.contentEditable && (this.contentClickListener && this.content.removeEventListener("click", this.contentClickListener), this.contentBlurListener && this.content.removeEventListener("blur", this.contentBlurListener)), null === (e3 = this.content) || void 0 === e3 || e3.remove(), t3) {
      if ("string" == typeof t3) {
        const e4 = this.start === this.end;
        this.content = n2("div", { style: { padding: `0.2em ${e4 ? 0.2 : 0.4}em`, display: "inline-block" }, textContent: t3 });
      } else this.content = t3;
      this.contentEditable && (this.content.contentEditable = "true", this.contentClickListener = (t4) => this.onContentClick(t4), this.contentBlurListener = () => this.onContentBlur(), this.content.addEventListener("click", this.contentClickListener), this.content.addEventListener("blur", this.contentBlurListener)), this.content.setAttribute("part", "region-content"), this.element.appendChild(this.content), this.emit("content-changed");
    } else this.content = void 0;
  }
  setOptions(t3) {
    var e3, i3;
    if (this.element) {
      if (t3.color && (this.color = t3.color, this.element.style.backgroundColor = this.color), void 0 !== t3.drag && (this.drag = t3.drag, this.element.style.cursor = this.drag ? "grab" : "default"), void 0 !== t3.start || void 0 !== t3.end) {
        const n3 = this.start === this.end;
        this.start = this.clampPosition(null !== (e3 = t3.start) && void 0 !== e3 ? e3 : this.start), this.end = this.clampPosition(null !== (i3 = t3.end) && void 0 !== i3 ? i3 : n3 ? this.start : this.end), this.renderPosition(), this.setPart(), this.emit("render");
      }
      if (t3.content && this.setContent(t3.content), t3.id && (this.id = t3.id, this.setPart()), void 0 !== t3.resize && t3.resize !== this.resize) {
        const e4 = this.start === this.end;
        this.resize = t3.resize, this.resize && !e4 ? this.addResizeHandles(this.element) : this.removeResizeHandles(this.element);
      }
      void 0 !== t3.resizeStart && (this.resizeStart = t3.resizeStart), void 0 !== t3.resizeEnd && (this.resizeEnd = t3.resizeEnd);
    }
  }
  remove() {
    this.isRemoved = true, this.emit("remove"), this.subscriptions.forEach(((t3) => t3())), this.subscriptions = [], this.content && this.contentEditable && (this.contentClickListener && (this.content.removeEventListener("click", this.contentClickListener), this.contentClickListener = void 0), this.contentBlurListener && (this.content.removeEventListener("blur", this.contentBlurListener), this.contentBlurListener = void 0)), this.element && (this.element.remove(), this.element = null), this.unAll();
  }
};
var d2 = class _d extends e2 {
  constructor(t3) {
    super(t3), this.regions = [], this.regionsContainer = this.initRegionsContainer();
  }
  static create(t3) {
    return new _d(t3);
  }
  onInit() {
    if (!this.wavesurfer) throw Error("WaveSurfer is not initialized");
    this.wavesurfer.getWrapper().appendChild(this.regionsContainer), this.subscriptions.push(this.wavesurfer.on("ready", ((t4) => {
      this.regions.forEach(((e3) => e3._setTotalDuration(t4)));
    })));
    let t3 = [];
    this.subscriptions.push(this.wavesurfer.on("timeupdate", ((e3) => {
      const i3 = this.regions.filter(((t4) => t4.start <= e3 && (t4.end === t4.start ? t4.start + 0.05 : t4.end) >= e3));
      i3.forEach(((e4) => {
        t3.includes(e4) || this.emit("region-in", e4);
      })), t3.forEach(((t4) => {
        i3.includes(t4) || this.emit("region-out", t4);
      })), t3 = i3;
    })));
  }
  initRegionsContainer() {
    return n2("div", { part: "regions-container", style: { position: "absolute", top: "0", left: "0", width: "100%", height: "100%", zIndex: "5", pointerEvents: "none" } });
  }
  getRegions() {
    return this.regions;
  }
  avoidOverlapping(t3) {
    t3.content && !t3.isRemoved && setTimeout((() => {
      if (!t3.content) return;
      const e3 = t3.content;
      e3.style.marginTop = "0";
      const i3 = e3.getBoundingClientRect(), n3 = this.regions.indexOf(t3);
      if (n3 < 0) return;
      const s3 = this.regions.slice(0, n3).filter(((t4) => !t4.isRemoved)).reduce(((e4, n4) => {
        if (n4 === t3 || !n4.content) return e4;
        const s4 = n4.content.getBoundingClientRect();
        return i3.left < s4.right && s4.left < i3.right && e4.push(s4), e4;
      }), []).sort(((t4, e4) => t4.top - e4.top)).reduce(((t4, e4) => {
        const n4 = i3.top + t4, s4 = n4 + i3.height;
        return n4 < e4.bottom && e4.top < s4 ? e4.bottom - i3.top + 2 : t4;
      }), 0);
      e3.style.marginTop = `${s3}px`;
    }), 10);
  }
  avoidOverlappingAll() {
    this.regions.forEach(((t3) => this.avoidOverlapping(t3)));
  }
  adjustScroll(t3) {
    var e3, i3;
    if (!t3.element) return;
    const n3 = null === (i3 = null === (e3 = this.wavesurfer) || void 0 === e3 ? void 0 : e3.getWrapper()) || void 0 === i3 ? void 0 : i3.parentElement;
    if (!n3) return;
    const { clientWidth: s3, scrollWidth: r3 } = n3;
    if (r3 <= s3) return;
    const o3 = n3.getBoundingClientRect(), l3 = t3.element.getBoundingClientRect(), h3 = l3.left - o3.left, a3 = l3.right - o3.left;
    h3 < 0 ? n3.scrollLeft += h3 : a3 > s3 && (n3.scrollLeft += a3 - s3);
  }
  virtualAppend(t3, e3, i3) {
    const n3 = () => {
      if (!this.wavesurfer) return;
      const n4 = this.wavesurfer.getWidth(), s3 = this.wavesurfer.getScroll(), r3 = e3.clientWidth, o3 = this.wavesurfer.getDuration(), l3 = Math.round(t3.start / o3 * r3), h3 = l3 + (Math.round((t3.end - t3.start) / o3 * r3) || 1) > s3 && l3 < s3 + n4;
      h3 && !i3.parentElement ? e3.appendChild(i3) : !h3 && i3.parentElement && i3.remove();
    };
    setTimeout((() => {
      if (!this.wavesurfer || !t3.element) return;
      n3();
      const e4 = this.wavesurfer.on("scroll", n3), i4 = this.wavesurfer.on("zoom", n3), s3 = this.wavesurfer.on("resize", n3), r3 = t3.on("render", n3), o3 = [e4, i4, s3, r3];
      this.subscriptions.push(...o3), t3.once("remove", (() => {
        e4(), i4(), s3(), r3(), this.subscriptions = this.subscriptions.filter(((t4) => !o3.includes(t4)));
      }));
    }), 0);
  }
  saveRegion(t3) {
    if (!t3.element) return;
    this.virtualAppend(t3, this.regionsContainer, t3.element), this.avoidOverlapping(t3), this.regions.push(t3);
    const e3 = [t3.on("update", ((e4) => {
      e4 || this.adjustScroll(t3), this.emit("region-update", t3, e4);
    })), t3.on("update-end", ((e4) => {
      this.avoidOverlappingAll(), this.emit("region-updated", t3, e4);
    })), t3.on("play", ((e4) => {
      var i3;
      null === (i3 = this.wavesurfer) || void 0 === i3 || i3.play(t3.start, e4);
    })), t3.on("click", ((e4) => {
      this.emit("region-clicked", t3, e4);
    })), t3.on("dblclick", ((e4) => {
      this.emit("region-double-clicked", t3, e4);
    })), t3.on("content-changed", (() => {
      this.emit("region-content-changed", t3);
    })), t3.once("remove", (() => {
      e3.forEach(((t4) => t4())), this.subscriptions = this.subscriptions.filter(((t4) => !e3.includes(t4))), this.regions = this.regions.filter(((e4) => e4 !== t3)), this.emit("region-removed", t3);
    }))];
    this.subscriptions.push(...e3), this.emit("region-created", t3);
  }
  addRegion(t3) {
    var e3, i3;
    if (!this.wavesurfer) throw Error("WaveSurfer is not initialized");
    const n3 = this.wavesurfer.getDuration(), s3 = null === (i3 = null === (e3 = this.wavesurfer) || void 0 === e3 ? void 0 : e3.getDecodedData()) || void 0 === i3 ? void 0 : i3.numberOfChannels, r3 = new a2(t3, n3, s3);
    if (this.emit("region-initialized", r3), n3) this.saveRegion(r3);
    else {
      const t4 = this.wavesurfer.once("ready", ((e4) => {
        r3._setTotalDuration(e4), this.saveRegion(r3), this.subscriptions = this.subscriptions.filter(((e5) => e5 !== t4));
      }));
      this.subscriptions.push(t4);
    }
    return r3;
  }
  enableDragSelection(t3, e3 = 3) {
    var i3;
    const n3 = null === (i3 = this.wavesurfer) || void 0 === i3 ? void 0 : i3.getWrapper();
    if (!(n3 && n3 instanceof HTMLElement)) return () => {
    };
    let s3 = null, o3 = 0, l3 = 0;
    const d3 = h2(n3, { threshold: e3 }), c2 = r2((() => {
      var e4, i4;
      const n4 = d3.signal.value;
      if (n4) if ("start" === n4.type) {
        if (o3 = n4.x, !this.wavesurfer) return;
        const r3 = this.wavesurfer.getDuration(), h3 = null === (i4 = null === (e4 = this.wavesurfer) || void 0 === e4 ? void 0 : e4.getDecodedData()) || void 0 === i4 ? void 0 : i4.numberOfChannels, { width: d4 } = this.wavesurfer.getWrapper().getBoundingClientRect();
        l3 = o3 / d4 * r3;
        const c3 = n4.x / d4 * r3, u2 = (n4.x + 5) / d4 * r3;
        s3 = new a2(Object.assign(Object.assign({}, t3), { start: c3, end: u2 }), r3, h3), this.emit("region-initialized", s3), s3.element && this.regionsContainer.appendChild(s3.element);
      } else "move" === n4.type && void 0 !== n4.deltaX ? s3 && s3._onUpdate(n4.deltaX, n4.x > o3 ? "end" : "start", l3) : "end" === n4.type && s3 && (this.saveRegion(s3), s3.updatingSide = void 0, s3 = null);
    }), [d3.signal]);
    return () => {
      c2(), d3.cleanup();
    };
  }
  clearRegions() {
    this.regions.slice().forEach(((t3) => t3.remove())), this.regions = [];
  }
  destroy() {
    this.clearRegions(), super.destroy(), this.regionsContainer.remove();
  }
};

// client/components/WaveformClipper.jsx
var clamp2 = (v2, min, max) => Math.max(min, Math.min(max, v2));
function WaveformClipper({ item, onRefsChange, onClose, showToast }) {
  const waveElRef = (0, import_react8.useRef)(null);
  const wsRef = (0, import_react8.useRef)(null);
  const regionRef = (0, import_react8.useRef)(null);
  const abAudioRef = (0, import_react8.useRef)(null);
  const endBoundRef = (0, import_react8.useRef)(12);
  const mountedRef = (0, import_react8.useRef)(true);
  const initStart = Number.isFinite(Number(item?.clipStart)) ? Number(item.clipStart) : 0;
  const initEnd = Number.isFinite(Number(item?.clipEnd)) ? Number(item.clipEnd) : Math.min(Number(item?.rawDurationSec || item?.durationSec || 12) || 12, 12);
  const [totalDur, setTotalDur] = (0, import_react8.useState)(Number(item?.rawDurationSec || item?.durationSec || 0) || 0);
  const [startSec, setStartSec] = (0, import_react8.useState)(Number(initStart.toFixed(2)));
  const [endSec, setEndSec] = (0, import_react8.useState)(Number(initEnd.toFixed(2)));
  const [normalize, setNormalize] = (0, import_react8.useState)(item?.clipNormalized !== false);
  const [loading, setLoading] = (0, import_react8.useState)(true);
  const [wsError, setWsError] = (0, import_react8.useState)("");
  const [playingRegion, setPlayingRegion] = (0, import_react8.useState)(false);
  const [playingClip, setPlayingClip] = (0, import_react8.useState)(false);
  const [busy, setBusy] = (0, import_react8.useState)(false);
  (0, import_react8.useEffect)(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (abAudioRef.current) {
        try {
          abAudioRef.current.pause();
        } catch {
        }
        abAudioRef.current = null;
      }
    };
  }, []);
  (0, import_react8.useEffect)(() => {
    if (typeof document === "undefined" || !waveElRef.current) return void 0;
    setLoading(true);
    setWsError("");
    setPlayingRegion(false);
    const regions = d2.create();
    const ws = w.create({
      container: waveElRef.current,
      url: `${refRawAudioUrl(item.id)}&v=${item.rawWav ? "raw" : item.updatedAt || 0}`,
      waveColor: "#9aa39b",
      progressColor: "#1f3b33",
      cursorColor: "#b13a22",
      height: 64,
      barWidth: 2,
      barGap: 1,
      normalize: true,
      plugins: [regions]
    });
    wsRef.current = ws;
    ws.on("ready", (dur) => {
      if (!mountedRef.current) return;
      const d3 = Number(dur) || 0;
      setTotalDur(Number(d3.toFixed(2)));
      const s3 = Number.isFinite(Number(item?.clipStart)) ? clamp2(Number(item.clipStart), 0, Math.max(0, d3 - 1)) : 0;
      const defaultE = Number.isFinite(Number(item?.clipEnd)) ? Number(item.clipEnd) : Math.min(d3, Math.max(s3 + 10, 12));
      const e3 = clamp2(defaultE, Math.min(d3, s3 + 1), d3);
      setStartSec(Number(s3.toFixed(2)));
      setEndSec(Number(e3.toFixed(2)));
      endBoundRef.current = e3;
      regions.clearRegions();
      regionRef.current = regions.addRegion({
        start: s3,
        end: e3,
        color: "rgba(177, 58, 34, 0.22)",
        drag: true,
        resize: true,
        minLength: 1
      });
      setLoading(false);
    });
    regions.on("region-updated", (reg) => {
      if (!mountedRef.current) return;
      const s3 = Number(Number(reg.start || 0).toFixed(2));
      const e3 = Number(Number(reg.end || 0).toFixed(2));
      setStartSec(s3);
      setEndSec(e3);
      endBoundRef.current = e3;
    });
    ws.on("timeupdate", (t3) => {
      if (ws.isPlaying() && t3 >= endBoundRef.current) {
        ws.pause();
        if (mountedRef.current) setPlayingRegion(false);
      }
    });
    ws.on("finish", () => {
      if (mountedRef.current) setPlayingRegion(false);
    });
    ws.on("pause", () => {
      if (mountedRef.current) setPlayingRegion(false);
    });
    ws.on("error", (err) => {
      if (!mountedRef.current) return;
      setLoading(false);
      setWsError(`\u6CE2\u5F62\u89E3\u7801\u5931\u8D25\uFF1A${String(err?.message || err)}`);
    });
    return () => {
      try {
        ws.destroy();
      } catch {
      }
      wsRef.current = null;
      regionRef.current = null;
    };
  }, [item.id]);
  const updateNumericRange = (nextS, nextE) => {
    const maxD = totalDur > 0 ? totalDur : 300;
    const s3 = clamp2(Number(nextS) || 0, 0, Math.max(0, maxD - 1));
    const e3 = clamp2(Number(nextE) || s3 + 1, Math.min(maxD, s3 + 1), maxD);
    setStartSec(Number(s3.toFixed(2)));
    setEndSec(Number(e3.toFixed(2)));
    endBoundRef.current = e3;
    if (regionRef.current) {
      try {
        regionRef.current.setOptions({ start: s3, end: e3 });
      } catch {
      }
    }
  };
  const togglePlayRegion = () => {
    const ws = wsRef.current;
    if (!ws) return;
    if (abAudioRef.current) {
      try {
        abAudioRef.current.pause();
      } catch {
      }
      setPlayingClip(false);
    }
    if (playingRegion) {
      ws.pause();
      setPlayingRegion(false);
      return;
    }
    endBoundRef.current = endSec;
    ws.setTime(startSec);
    ws.play();
    setPlayingRegion(true);
  };
  const togglePlayClippedB = () => {
    if (wsRef.current?.isPlaying()) {
      wsRef.current.pause();
      setPlayingRegion(false);
    }
    if (playingClip && abAudioRef.current) {
      abAudioRef.current.pause();
      setPlayingClip(false);
      return;
    }
    if (typeof Audio === "undefined") return;
    if (abAudioRef.current) {
      try {
        abAudioRef.current.pause();
      } catch {
      }
    }
    const url = `${refAudioUrl(item.id)}?v=${item.updatedAt || Date.now()}`;
    const audio = new Audio(url);
    abAudioRef.current = audio;
    audio.onended = () => {
      if (mountedRef.current) setPlayingClip(false);
    };
    audio.onpause = () => {
      if (mountedRef.current) setPlayingClip(false);
    };
    audio.play().then(() => {
      if (mountedRef.current) setPlayingClip(true);
    }).catch((err) => {
      showToast?.(`\u64AD\u653E\u5931\u8D25\uFF1A${String(err?.message || err)}`);
    });
  };
  const handleSaveClip = async () => {
    setBusy(true);
    try {
      const res = await clipRefApi(item.id, { startSec, endSec, normalize });
      onRefsChange?.(res.refs || []);
      showToast?.(`\u5DF2\u5E94\u7528\u88C1\u526A\uFF08${res.item?.clipDuration || (endSec - startSec).toFixed(2)}s\uFF09\u5E76\u5237\u65B0\u514B\u9686\u7F13\u5B58`);
    } catch (err) {
      showToast?.(`\u88C1\u526A\u5931\u8D25\uFF1A${String(err?.message || err)}`);
    } finally {
      if (mountedRef.current) setBusy(false);
    }
  };
  const handleClearClip = async () => {
    setBusy(true);
    try {
      const res = await clearRefClipApi(item.id);
      onRefsChange?.(res.refs || []);
      showToast?.("\u5DF2\u6062\u590D\u539F\u59CB\u53C2\u8003\u97F3\u6587\u4EF6");
    } catch (err) {
      showToast?.(`\u6062\u590D\u539F\u7248\u5931\u8D25\uFF1A${String(err?.message || err)}`);
    } finally {
      if (mountedRef.current) setBusy(false);
    }
  };
  const span = Math.max(0, Number((endSec - startSec).toFixed(2)));
  const inSweetSpot = span >= 5 && span <= 15;
  return /* @__PURE__ */ import_react8.default.createElement("div", { className: "ref-clipper" }, /* @__PURE__ */ import_react8.default.createElement("div", { className: "ref-clip-hd" }, /* @__PURE__ */ import_react8.default.createElement("span", { className: "silk" }, "WAVEFORM TRIM ", /* @__PURE__ */ import_react8.default.createElement("b", null, "\u6CE2\u5F62\u88C1\u526A \xB7 A/B \u5BF9\u6BD4")), /* @__PURE__ */ import_react8.default.createElement("div", { style: { display: "flex", alignItems: "center", gap: 6 } }, /* @__PURE__ */ import_react8.default.createElement("span", { className: `tag ${inSweetSpot ? "tape" : "grease"}` }, `\u9009\u533A ${span.toFixed(1)}s${inSweetSpot ? " \xB7 \u63A8\u8350 5\u201315s" : span < 5 ? " \xB7 \u504F\u77ED (<5s)" : " \xB7 \u504F\u957F (>15s)"}`), totalDur > 0 && /* @__PURE__ */ import_react8.default.createElement("span", { className: "mono", style: { fontSize: 11 } }, `\u5168\u957F ${totalDur.toFixed(1)}s`))), /* @__PURE__ */ import_react8.default.createElement("div", { className: "ref-wave-well", ref: waveElRef, "aria-label": "\u97F3\u9891\u6CE2\u5F62\u9009\u533A" }, loading && !wsError ? /* @__PURE__ */ import_react8.default.createElement("div", { className: "ref-wave-msg" }, "\u8F7D\u5165\u539F\u59CB\u97F3\u9891\u6CE2\u5F62\u4E2D\u2026") : null, wsError ? /* @__PURE__ */ import_react8.default.createElement("div", { className: "ref-wave-msg" }, wsError) : null), /* @__PURE__ */ import_react8.default.createElement("div", { className: "ref-clip-bar" }, /* @__PURE__ */ import_react8.default.createElement("label", { className: "mono", style: { fontSize: 11, display: "inline-flex", alignItems: "center", gap: 4 } }, "\u8D77", /* @__PURE__ */ import_react8.default.createElement(
    "input",
    {
      className: "input ref-sec-inp",
      type: "number",
      min: "0",
      max: Math.max(0, endSec - 1),
      step: "0.1",
      value: startSec,
      onChange: (e3) => updateNumericRange(e3.target.value, endSec)
    }
  ), "s"), /* @__PURE__ */ import_react8.default.createElement("label", { className: "mono", style: { fontSize: 11, display: "inline-flex", alignItems: "center", gap: 4 } }, "\u6B62", /* @__PURE__ */ import_react8.default.createElement(
    "input",
    {
      className: "input ref-sec-inp",
      type: "number",
      min: startSec + 1,
      max: totalDur > 0 ? totalDur : 300,
      step: "0.1",
      value: endSec,
      onChange: (e3) => updateNumericRange(startSec, e3.target.value)
    }
  ), "s"), /* @__PURE__ */ import_react8.default.createElement("label", { style: { fontSize: 11.5, display: "inline-flex", alignItems: "center", gap: 4, cursor: "pointer" } }, /* @__PURE__ */ import_react8.default.createElement(
    "input",
    {
      type: "checkbox",
      checked: normalize,
      onChange: (e3) => setNormalize(e3.target.checked)
    }
  ), /* @__PURE__ */ import_react8.default.createElement("span", null, "RMS \u5F52\u4E00 (0.126)")), /* @__PURE__ */ import_react8.default.createElement("div", { style: { display: "flex", flexWrap: "wrap", gap: 6, marginLeft: "auto" } }, /* @__PURE__ */ import_react8.default.createElement(
    "button",
    {
      className: "btn btn--sm",
      type: "button",
      disabled: loading || Boolean(wsError),
      onClick: togglePlayRegion
    },
    playingRegion ? "\u6682\u505C\u9009\u533A (A)" : "\u8BD5\u542C\u9009\u533A (A)"
  ), item.hasClip ? /* @__PURE__ */ import_react8.default.createElement("button", { className: "btn btn--sm", type: "button", onClick: togglePlayClippedB }, playingClip ? "\u6682\u505C\u6210\u7247 (B)" : "\u5BF9\u6BD4\u6210\u7247 (B)") : null, /* @__PURE__ */ import_react8.default.createElement(
    "button",
    {
      className: "btn btn--sm btn--tape",
      type: "button",
      disabled: busy || span < 1 || span > 30,
      onClick: handleSaveClip
    },
    busy ? "\u5904\u7406\u4E2D\u2026" : "\u5E94\u7528\u88C1\u526A"
  ), item.hasClip ? /* @__PURE__ */ import_react8.default.createElement("button", { className: "btn btn--sm", type: "button", disabled: busy, onClick: handleClearClip }, "\u6062\u590D\u539F\u7248") : null, /* @__PURE__ */ import_react8.default.createElement("button", { className: "btn btn--sm btn--ghost", type: "button", onClick: onClose }, "\u6536\u8D77"))));
}

// client/components/RefVoiceLibrary.jsx
var MAX_BYTES = 10 * 1024 * 1024;
function RefVoiceLibrary({ refs, onRefsChange, onAssignRef, showToast }) {
  const [name, setName] = (0, import_react9.useState)("");
  const [text, setText] = (0, import_react9.useState)("");
  const [file, setFile] = (0, import_react9.useState)(null);
  const [uploading, setUploading] = (0, import_react9.useState)(false);
  const [playingId, setPlayingId] = (0, import_react9.useState)("");
  const [clippingId, setClippingId] = (0, import_react9.useState)("");
  const [editingId, setEditingId] = (0, import_react9.useState)("");
  const [editName, setEditName] = (0, import_react9.useState)("");
  const [editText, setEditText] = (0, import_react9.useState)("");
  const [confirmDelId, setConfirmDelId] = (0, import_react9.useState)("");
  const [busyId, setBusyId] = (0, import_react9.useState)("");
  const list = Array.isArray(refs) ? refs : [];
  const handleFilePick = (e3) => {
    const picked = e3.target.files?.[0] || null;
    setFile(picked);
    if (picked && !name.trim()) {
      setName(picked.name.replace(/\.(wav|mp3|m4a)$/i, "").slice(0, 60));
    }
  };
  const handleUpload = async (e3) => {
    e3.preventDefault();
    if (!file) {
      showToast("\u8BF7\u5148\u9009\u62E9 .wav / .mp3 / .m4a \u97F3\u9891\u6587\u4EF6");
      return;
    }
    if (file.size > MAX_BYTES) {
      showToast("\u53C2\u8003\u97F3\u4E0D\u80FD\u8D85\u8FC7 10 MB");
      return;
    }
    if (!name.trim()) {
      showToast("\u8BF7\u586B\u5199\u53C2\u8003\u97F3\u540D\u79F0");
      return;
    }
    setUploading(true);
    try {
      const dataBase64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const raw = String(reader.result || "");
          resolve(raw.includes(",") ? raw.split(",")[1] : raw);
        };
        reader.onerror = () => reject(new Error("\u8BFB\u53D6\u672C\u5730\u6587\u4EF6\u5931\u8D25"));
        reader.readAsDataURL(file);
      });
      const res = await uploadRefApi({
        name: name.trim(),
        filename: file.name,
        dataBase64,
        text: text.trim()
      });
      onRefsChange?.(res.refs || []);
      setName("");
      setText("");
      setFile(null);
      showToast(`\u5DF2\u5BFC\u5165\u53C2\u8003\u97F3 \xB7 ${res.item?.name || file.name}`);
    } catch (err) {
      showToast(`\u4E0A\u4F20\u5931\u8D25\uFF1A${String(err?.message || err)}`);
    } finally {
      setUploading(false);
    }
  };
  const beginEdit = (item) => {
    setEditingId(item.id);
    setEditName(item.name || "");
    setEditText(item.text || "");
    setConfirmDelId("");
  };
  const saveEdit = async (id) => {
    setBusyId(id);
    try {
      const res = await updateRefApi(id, { name: editName, text: editText });
      onRefsChange?.(res.refs || []);
      setEditingId("");
      showToast("\u53C2\u8003\u97F3\u4FE1\u606F\u5DF2\u66F4\u65B0");
    } catch (err) {
      showToast(`\u66F4\u65B0\u5931\u8D25\uFF1A${String(err?.message || err)}`);
    } finally {
      setBusyId("");
    }
  };
  const removeCustom = async (id) => {
    setBusyId(id);
    try {
      const res = await deleteRefApi(id);
      onRefsChange?.(res.refs || []);
      setConfirmDelId("");
      if (playingId === id) setPlayingId("");
      showToast("\u53C2\u8003\u97F3\u5DF2\u5220\u9664");
    } catch (err) {
      showToast(`\u5220\u9664\u5931\u8D25\uFF1A${String(err?.message || err)}`);
    } finally {
      setBusyId("");
    }
  };
  return /* @__PURE__ */ import_react9.default.createElement("div", { className: "ref-lib" }, /* @__PURE__ */ import_react9.default.createElement("div", { className: "ref-list" }, list.map((it) => {
    const isEditing = editingId === it.id;
    const isConfirmDel = confirmDelId === it.id;
    return /* @__PURE__ */ import_react9.default.createElement("div", { key: it.id, className: `ref-row${it.exists ? "" : " is-missing"}` }, /* @__PURE__ */ import_react9.default.createElement("div", { className: "ref-top" }, /* @__PURE__ */ import_react9.default.createElement("span", { className: `tag ${it.builtin ? "tape" : "cloud"}` }, it.builtin ? "\u5185\u7F6E" : "\u81EA\u5B9A\u4E49"), /* @__PURE__ */ import_react9.default.createElement("b", null, it.name), /* @__PURE__ */ import_react9.default.createElement("span", { className: "mono ref-meta" }, it.durationSec ? `${it.durationSec}s` : it.ext || "", it.sampleRate ? ` \xB7 ${Math.round(it.sampleRate / 1e3)}kHz` : "", it.hasClip ? ` \xB7 \u88C1 ${it.clipStart}\u2013${it.clipEnd}s` : "", !it.exists ? " \xB7 \u6587\u4EF6\u7F3A\u5931" : ""), /* @__PURE__ */ import_react9.default.createElement("div", { className: "ref-acts" }, it.exists && onAssignRef ? /* @__PURE__ */ import_react9.default.createElement(import_react9.default.Fragment, null, /* @__PURE__ */ import_react9.default.createElement(
      "button",
      {
        className: "btn btn--sm btn--tape",
        type: "button",
        title: "\u7ED1\u5B9A\u4E3A\u65C1\u767D\u53C2\u8003\u97F3\uFF08\u8349\u7A3F\uFF09",
        onClick: () => onAssignRef("narrator", it)
      },
      "\u8BBE\u4E3A\u65C1\u767D"
    ), /* @__PURE__ */ import_react9.default.createElement(
      "button",
      {
        className: "btn btn--sm",
        type: "button",
        title: "\u7ED1\u5B9A\u4E3A\u5BF9\u8BDD\u53C2\u8003\u97F3\uFF08\u8349\u7A3F\uFF09",
        onClick: () => onAssignRef("dialogue", it)
      },
      "\u8BBE\u4E3A\u5BF9\u8BDD"
    )) : null, it.exists ? /* @__PURE__ */ import_react9.default.createElement(
      "button",
      {
        className: "btn btn--sm",
        type: "button",
        onClick: () => setPlayingId(playingId === it.id ? "" : it.id)
      },
      playingId === it.id ? "\u6536\u8D77\u8BD5\u542C" : "\u64AD\u653E\u6837\u672C"
    ) : null, !it.builtin ? /* @__PURE__ */ import_react9.default.createElement(import_react9.default.Fragment, null, it.exists ? /* @__PURE__ */ import_react9.default.createElement(
      "button",
      {
        className: "btn btn--sm",
        type: "button",
        onClick: () => setClippingId(clippingId === it.id ? "" : it.id)
      },
      clippingId === it.id ? "\u6536\u8D77\u88C1\u526A" : "\u6CE2\u5F62\u88C1\u526A"
    ) : null, /* @__PURE__ */ import_react9.default.createElement("button", { className: "btn btn--sm", type: "button", onClick: () => beginEdit(it) }, "\u7F16\u8F91"), isConfirmDel ? /* @__PURE__ */ import_react9.default.createElement(import_react9.default.Fragment, null, /* @__PURE__ */ import_react9.default.createElement(
      "button",
      {
        className: "btn btn--sm btn--tape",
        type: "button",
        disabled: busyId === it.id,
        onClick: () => removeCustom(it.id)
      },
      "\u786E\u8BA4\u5220"
    ), /* @__PURE__ */ import_react9.default.createElement("button", { className: "btn btn--sm", type: "button", onClick: () => setConfirmDelId("") }, "\u53D6\u6D88")) : /* @__PURE__ */ import_react9.default.createElement("button", { className: "btn btn--sm", type: "button", onClick: () => setConfirmDelId(it.id) }, "\u5220\u9664")) : null)), isEditing ? /* @__PURE__ */ import_react9.default.createElement("div", { className: "ref-edit" }, /* @__PURE__ */ import_react9.default.createElement(
      "input",
      {
        className: "input",
        value: editName,
        placeholder: "\u540D\u79F0",
        onChange: (e3) => setEditName(e3.target.value)
      }
    ), /* @__PURE__ */ import_react9.default.createElement(
      "textarea",
      {
        className: "input",
        rows: 2,
        value: editText,
        placeholder: "\u9010\u5B57\u53C2\u8003\u6587\u672C\uFF08\u672C\u5730 Qwen3-TTS \u5FC5\u586B\uFF09",
        onChange: (e3) => setEditText(e3.target.value)
      }
    ), /* @__PURE__ */ import_react9.default.createElement("div", { style: { display: "flex", gap: 6 } }, /* @__PURE__ */ import_react9.default.createElement(
      "button",
      {
        className: "btn btn--sm btn--tape",
        type: "button",
        disabled: busyId === it.id,
        onClick: () => saveEdit(it.id)
      },
      "\u4FDD\u5B58"
    ), /* @__PURE__ */ import_react9.default.createElement("button", { className: "btn btn--sm", type: "button", onClick: () => setEditingId("") }, "\u53D6\u6D88"))) : /* @__PURE__ */ import_react9.default.createElement("div", { className: "ref-text" }, it.text ? `\u9010\u5B57\u6587\u672C\uFF1A\u300C${it.text}\u300D` : "\u672A\u586B\u9010\u5B57\u53C2\u8003\u6587\u672C\uFF08\u4EC5 MiMo \u514B\u9686\u53EF\u7528\uFF0C\u672C\u5730\u5F15\u64CE\u9700\u8865\u5145\uFF09"), Array.isArray(it.warnings) && it.warnings.length ? /* @__PURE__ */ import_react9.default.createElement("div", { className: "ref-warns" }, it.warnings.map((w2, idx) => /* @__PURE__ */ import_react9.default.createElement("span", { key: idx, className: "tag grease" }, w2))) : null, playingId === it.id ? /* @__PURE__ */ import_react9.default.createElement(
      "audio",
      {
        className: "ref-audio",
        controls: true,
        autoPlay: true,
        src: `${refAudioUrl(it.id)}?v=${it.updatedAt || it.createdAt || 0}`
      }
    ) : null, clippingId === it.id && !it.builtin && it.exists ? /* @__PURE__ */ import_react9.default.createElement(
      WaveformClipper,
      {
        item: it,
        onRefsChange,
        onClose: () => setClippingId(""),
        showToast
      }
    ) : null);
  })), /* @__PURE__ */ import_react9.default.createElement("form", { className: "ref-upload", onSubmit: handleUpload }, /* @__PURE__ */ import_react9.default.createElement("div", { className: "fl", style: { marginBottom: 4 } }, /* @__PURE__ */ import_react9.default.createElement("b", null, "\u4E0A\u4F20\u81EA\u5B9A\u4E49\u53C2\u8003\u97F3"), /* @__PURE__ */ import_react9.default.createElement("i", null, ".WAV / .MP3 / .M4A \xB7 \u2264 10MB\uFF08\u63A8\u8350 5\u201315 \u79D2\u7EAF\u51C0\u4EBA\u58F0\uFF09")), /* @__PURE__ */ import_react9.default.createElement("div", { className: "ref-up-grid" }, /* @__PURE__ */ import_react9.default.createElement("input", { className: "input", type: "file", accept: ".wav,.mp3,.m4a,audio/wav,audio/mpeg,audio/mp4", onChange: handleFilePick }), /* @__PURE__ */ import_react9.default.createElement(
    "input",
    {
      className: "input",
      value: name,
      placeholder: "\u97F3\u8272\u540D\u79F0\uFF08\u5982\uFF1A\u6CA7\u6851\u8001\u8005\uFF09",
      onChange: (e3) => setName(e3.target.value)
    }
  )), /* @__PURE__ */ import_react9.default.createElement(
    "textarea",
    {
      className: "input",
      rows: 2,
      value: text,
      placeholder: "\u97F3\u9891\u5BF9\u5E94\u7684\u9010\u5B57\u6587\u672C\uFF08\u672C\u5730\u5F15\u64CE\u5FC5\u586B\uFF1BMiMo \u514B\u9686\u53EF\u7559\u7A7A\uFF09",
      onChange: (e3) => setText(e3.target.value)
    }
  ), /* @__PURE__ */ import_react9.default.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8 } }, /* @__PURE__ */ import_react9.default.createElement("button", { className: "btn btn--sm btn--tape", type: "submit", disabled: uploading }, uploading ? "\u4E0A\u4F20\u4E2D\u2026" : "\u4E0A\u4F20\u5E76\u52A0\u5165\u97F3\u5E93"), /* @__PURE__ */ import_react9.default.createElement("span", { className: "hint", style: { margin: 0 } }, "\u4E0A\u4F20\u540E\u540C\u65F6\u53EF\u7528\u4E8E\u672C\u5730 Qwen3-TTS\u3001Hybrid \u542F\u52A8\u4E0E MiMo \u58F0\u97F3\u514B\u9686\u3002"))));
}

// client/components/SettingsView.jsx
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
var NAV_GROUPS = [
  {
    title: "\u4E00 \xB7 \u5F15\u64CE\u4E0E\u670D\u52A1",
    items: [
      ["mod-engine", "01", "\u5F15\u64CE\u4E0E\u63A5\u5165"],
      ["mod-local", "02", "\u672C\u5730 Qwen3"],
      ["mod-openai", "03", "OpenAI \u517C\u5BB9"]
    ]
  },
  {
    title: "\u4E8C \xB7 \u97F3\u8272\u4E0E\u53C2\u8003\u97F3\u5E93",
    items: [
      ["mod-voice", "04", "\u65B9\u6848 / \u97F3\u8272 / \u8BD5\u542C"],
      ["mod-refs", "05", "\u53C2\u8003\u97F3\u5E93"]
    ]
  },
  {
    title: "\u4E09 \xB7 \u6587\u672C\u4E0E\u5408\u6210",
    items: [
      ["mod-lexicon", "06", "\u53D1\u97F3 / \u65AD\u53E5\u89C4\u5219"],
      ["mod-synth", "07", "\u5207\u5206 / \u7F13\u5B58"]
    ]
  },
  {
    title: "\u56DB \xB7 \u4EA4\u4ED8\u4E0E\u5B89\u5168",
    items: [
      ["mod-transport", "08", "\u7AEF\u53E3 / Legado / \u96A7\u9053"],
      ["mod-openai-server", "09", "\u5BF9\u5916 OpenAI \u7AEF\u70B9"],
      ["mod-auth", "10", "\u9274\u6743 / \u65E5\u5FD7"]
    ]
  }
];
function RoleVoiceCard({
  roleKey,
  label,
  sub,
  provider,
  d: d3,
  onSet,
  presetVoices,
  refsList
}) {
  const modePath = `voices.${roleKey}.mode`;
  const voicePath = `voices.${roleKey}.voice`;
  const stylePath = `voices.${roleKey}.style`;
  const refPath = `voices.${roleKey}.refId`;
  const mode = d3[modePath] || "preset";
  return /* @__PURE__ */ import_react10.default.createElement("div", { className: "role-card" }, /* @__PURE__ */ import_react10.default.createElement("div", { className: "role-card-hd" }, /* @__PURE__ */ import_react10.default.createElement("b", null, label, " ", /* @__PURE__ */ import_react10.default.createElement("i", null, sub)), provider === "mimo" ? /* @__PURE__ */ import_react10.default.createElement(
    Seg,
    {
      options: [
        { value: "preset", label: "\u9884\u7F6E" },
        { value: "design", label: "\u6587\u5B57\u9020\u97F3" },
        { value: "clone", label: "\u514B\u9686" }
      ],
      value: mode,
      ariaLabel: `${label}\u6A21\u5F0F`,
      onChange: (v2) => onSet(modePath, v2)
    }
  ) : /* @__PURE__ */ import_react10.default.createElement("span", { className: "tag" }, provider === "openai" ? "OpenAI \u97F3\u8272\u5728\u4E0A\u65B9\u8BBE\u7F6E" : `MiMo ${mode}`)), mode === "preset" ? /* @__PURE__ */ import_react10.default.createElement(import_react10.default.Fragment, null, /* @__PURE__ */ import_react10.default.createElement("div", { className: "field" }, /* @__PURE__ */ import_react10.default.createElement("span", { className: "fl" }, "\u9884\u7F6E\u97F3\u8272 ", /* @__PURE__ */ import_react10.default.createElement("i", null, "PRESET")), /* @__PURE__ */ import_react10.default.createElement(Chips, { options: presetVoices, value: d3[voicePath], ariaLabel: `${label}\u97F3\u8272`, onChange: (v2) => onSet(voicePath, v2) })), /* @__PURE__ */ import_react10.default.createElement(Field, { label: "\u81EA\u7136\u8BED\u8A00\u98CE\u683C", sub: "STYLE" }, /* @__PURE__ */ import_react10.default.createElement(Input, { value: d3[stylePath], onChange: (v2) => onSet(stylePath, v2), placeholder: "\u5982\uFF1A\u6E29\u6DA6\u7AEF\u5E84\u7684\u4E2D\u6587\u5973\u58F0\uFF0C\u5410\u5B57\u6E05\u6670" }))) : null, mode === "design" ? /* @__PURE__ */ import_react10.default.createElement(Field, { label: "\u97F3\u8272\u63CF\u8FF0\uFF08mimo-v2.5-tts-voicedesign\uFF09", sub: "\u5FC5\u586B STYLE" }, /* @__PURE__ */ import_react10.default.createElement(
    Textarea,
    {
      value: d3[stylePath],
      rows: 2,
      placeholder: "\u8BE6\u7EC6\u63CF\u8FF0\u6027\u522B\u3001\u5E74\u9F84\u3001\u97F3\u8272\u4E0E\u60C5\u7EEA\uFF0C\u4F8B\u5982\uFF1A\u58F0\u97F3\u6E05\u6DA6\u6E29\u67D4\u7684\u5E74\u8F7B\u8BF4\u4E66\u5973\u58F0\uFF0C\u4ECE\u5BB9\u8212\u7F13",
      onChange: (v2) => onSet(stylePath, v2)
    }
  )) : null, mode === "clone" ? /* @__PURE__ */ import_react10.default.createElement(import_react10.default.Fragment, null, /* @__PURE__ */ import_react10.default.createElement(Field, { label: "\u4ECE\u7EDF\u4E00\u53C2\u8003\u97F3\u5E93\u9009\u62E9", sub: "REF ID" }, /* @__PURE__ */ import_react10.default.createElement("select", { className: "input", value: d3[refPath] || "", onChange: (e3) => onSet(refPath, e3.target.value) }, /* @__PURE__ */ import_react10.default.createElement("option", { value: "" }, "-- \u4F7F\u7528\u4E0B\u65B9\u624B\u52A8\u8DEF\u5F84 --"), refsList.map((r3) => /* @__PURE__ */ import_react10.default.createElement("option", { key: r3.id, value: r3.id }, `${r3.name}${r3.durationSec ? ` (${r3.durationSec}s)` : ""}${r3.builtin ? " [\u5185\u7F6E]" : ""}`)))), !d3[refPath] ? /* @__PURE__ */ import_react10.default.createElement(Field, { label: "\u6216\u586B\u5199\u97F3\u9891\u8DEF\u5F84 / URL\uFF08\u652F\u6301 ~/\uFF09", sub: "VOICE FILE" }, /* @__PURE__ */ import_react10.default.createElement(
    Input,
    {
      value: d3[voicePath],
      spellCheck: false,
      placeholder: "~/voices/sample.wav",
      onChange: (v2) => onSet(voicePath, v2)
    }
  )) : null) : null);
}
function SettingsView({
  live,
  localInfo,
  draft,
  applied,
  changes,
  presetVoices,
  builtinVoiceProfiles,
  builtinRulePresets,
  builtinPolyphonePresets,
  refs,
  importInfo,
  onRefsChange,
  onRefreshState,
  onOpenSetup,
  saving,
  savedAt,
  onSet,
  onSetBatch,
  onSave,
  onRevert,
  onExportConfig,
  showToast
}) {
  const [expandLocal, setExpandLocal] = (0, import_react10.useState)(false);
  const [expandOpenai, setExpandOpenai] = (0, import_react10.useState)(false);
  const [newProfileName, setNewProfileName] = (0, import_react10.useState)("");
  const [genKeyBusy, setGenKeyBusy] = (0, import_react10.useState)(false);
  const [newMapVoice, setNewMapVoice] = (0, import_react10.useState)("");
  const [newMapTarget, setNewMapTarget] = (0, import_react10.useState)("auto");
  const [newReadLabel, setNewReadLabel] = (0, import_react10.useState)("");
  const [tokenBusy, setTokenBusy] = (0, import_react10.useState)(false);
  const [lastCreatedRead, setLastCreatedRead] = (0, import_react10.useState)(null);
  const d3 = draft || applied || {};
  const provider = String(d3["upstream.provider"] || "mimo");
  const dirty = (path) => changes.some((c2) => c2.path === path);
  const moduleDirty = (name) => changes.some((c2) => c2.module === name);
  const set = (path) => (value) => onSet(path, value);
  const chain = settingsChainValue(live, d3);
  const refsList = Array.isArray(refs) ? refs : [];
  const draftPatch = (0, import_react10.useMemo)(() => buildDraftSnapshot(d3), [d3]);
  const allProfiles = (0, import_react10.useMemo)(() => {
    const builtins = Array.isArray(builtinVoiceProfiles) ? builtinVoiceProfiles : [];
    const custom = Array.isArray(d3["voiceProfiles.items"]) ? d3["voiceProfiles.items"] : [];
    return [...builtins, ...custom];
  }, [builtinVoiceProfiles, d3["voiceProfiles.items"]]);
  const input = (path, opts = {}) => /* @__PURE__ */ import_react10.default.createElement(Input, { value: d3[path], onChange: set(path), ...opts });
  const knob = (path, label, min, max, step, unit, ariaLabel) => /* @__PURE__ */ import_react10.default.createElement(
    Knob,
    {
      key: path,
      label,
      value: d3[path],
      min,
      max,
      step,
      unit,
      ariaLabel,
      dirty: dirty(path),
      onChange: (v2) => onSet(path, String(v2))
    }
  );
  const toggle = (path, label) => /* @__PURE__ */ import_react10.default.createElement(Toggle, { label, checked: Boolean(d3[path]), onChange: (v2) => onSet(path, v2) });
  const twoCol = (...children) => /* @__PURE__ */ import_react10.default.createElement("div", { className: "field field-two-col" }, children);
  const moduleShell = (id, no, title, silk, name, children, opts = {}) => /* @__PURE__ */ import_react10.default.createElement("div", { className: `module${opts.wide ? " module--wide" : ""}${moduleDirty(name) ? " is-dirty" : ""}`, id, "data-module": "true" }, /* @__PURE__ */ import_react10.default.createElement("div", { className: "module-hd" }, /* @__PURE__ */ import_react10.default.createElement("span", { className: "mh" }, /* @__PURE__ */ import_react10.default.createElement("span", { className: "mnum" }, no), /* @__PURE__ */ import_react10.default.createElement("b", null, title), /* @__PURE__ */ import_react10.default.createElement("span", { className: "silk" }, silk)), /* @__PURE__ */ import_react10.default.createElement("div", { style: { display: "flex", alignItems: "center", gap: 6 } }, opts.right, /* @__PURE__ */ import_react10.default.createElement("span", { className: "dirty-dot", title: "\u6709\u672A\u4FDD\u5B58\u6539\u52A8" }))), children);
  const localActive = provider === "local" || provider === "hybrid";
  const showLocalBody = localActive || expandLocal || moduleDirty("local");
  const openaiActive = provider === "openai";
  const showOpenaiBody = openaiActive || expandOpenai || moduleDirty("openai");
  const localTag = !localInfo?.enabled ? "\u968F\u6E32\u67D3\u6765\u6E90\u5207\u6362" : localStateText(localInfo);
  const applyVoiceProfile = (profileId) => {
    const prof = allProfiles.find((p2) => p2.id === profileId);
    if (!prof) return;
    const nextMap = { "voiceProfiles.active": prof.id };
    for (const role of ["narrator", "dialogue"]) {
      const v2 = prof.voices?.[role];
      if (v2) {
        nextMap[`voices.${role}.mode`] = v2.mode || "preset";
        nextMap[`voices.${role}.voice`] = v2.voice || "";
        nextMap[`voices.${role}.style`] = v2.style || "";
        nextMap[`voices.${role}.refId`] = v2.refId || "";
      }
      const lr = prof.localRefs?.[role];
      if (lr) {
        nextMap[`upstream.local.refs.${role}.refId`] = lr.refId || "";
        nextMap[`upstream.local.refs.${role}.wav`] = lr.wav || "";
        nextMap[`upstream.local.refs.${role}.text`] = lr.text || "";
      }
    }
    onSetBatch(nextMap);
    showToast(`\u5DF2\u8F7D\u5165\u97F3\u8272\u65B9\u6848\uFF1A${prof.name}\uFF08\u4FDD\u5B58\u540E\u6301\u4E45\u5316\uFF09`);
  };
  const saveCurrentProfile = () => {
    const cleanName = newProfileName.trim();
    if (!cleanName) {
      showToast("\u8BF7\u8F93\u5165\u65B0\u65B9\u6848\u540D\u79F0");
      return;
    }
    const id = `custom:${Date.now().toString(36)}`;
    const nextItem = {
      id,
      name: cleanName,
      builtin: false,
      voices: {
        narrator: {
          mode: d3["voices.narrator.mode"] || "preset",
          voice: d3["voices.narrator.voice"] || "",
          style: d3["voices.narrator.style"] || "",
          refId: d3["voices.narrator.refId"] || ""
        },
        dialogue: {
          mode: d3["voices.dialogue.mode"] || "preset",
          voice: d3["voices.dialogue.voice"] || "",
          style: d3["voices.dialogue.style"] || "",
          refId: d3["voices.dialogue.refId"] || ""
        }
      },
      localRefs: {
        narrator: {
          refId: d3["upstream.local.refs.narrator.refId"] || "",
          wav: d3["upstream.local.refs.narrator.wav"] || "",
          text: d3["upstream.local.refs.narrator.text"] || ""
        },
        dialogue: {
          refId: d3["upstream.local.refs.dialogue.refId"] || "",
          wav: d3["upstream.local.refs.dialogue.wav"] || "",
          text: d3["upstream.local.refs.dialogue.text"] || ""
        }
      }
    };
    const existing = Array.isArray(d3["voiceProfiles.items"]) ? d3["voiceProfiles.items"] : [];
    onSetBatch({
      "voiceProfiles.items": [...existing, nextItem],
      "voiceProfiles.active": id
    });
    setNewProfileName("");
    showToast(`\u5DF2\u6DFB\u52A0\u5230\u8349\u7A3F\u97F3\u8272\u65B9\u6848\uFF1A${cleanName}`);
  };
  const deleteCustomProfile = (profileId) => {
    const existing = Array.isArray(d3["voiceProfiles.items"]) ? d3["voiceProfiles.items"] : [];
    const nextItems = existing.filter((p2) => p2.id !== profileId);
    const patch = { "voiceProfiles.items": nextItems };
    if (d3["voiceProfiles.active"] === profileId) patch["voiceProfiles.active"] = "builtin:story-warm";
    onSetBatch(patch);
    showToast("\u5DF2\u4ECE\u8349\u7A3F\u79FB\u9664\u81EA\u5B9A\u4E49\u97F3\u8272\u65B9\u6848\uFF08\u4FDD\u5B58\u540E\u751F\u6548\uFF09");
  };
  const setMapEntry = (k, val) => {
    const cur = d3["openaiServer.voiceMap"] && typeof d3["openaiServer.voiceMap"] === "object" ? d3["openaiServer.voiceMap"] : {};
    onSet("openaiServer.voiceMap", { ...cur, [k]: val });
  };
  const removeMapEntry = (k) => {
    const cur = d3["openaiServer.voiceMap"] && typeof d3["openaiServer.voiceMap"] === "object" ? { ...d3["openaiServer.voiceMap"] } : {};
    delete cur[k];
    onSet("openaiServer.voiceMap", cur);
  };
  const addMapEntry = () => {
    const key = newMapVoice.trim();
    const target = newMapTarget.trim();
    if (!key || !target) {
      showToast("\u8BF7\u586B\u5199 OpenAI voice \u540D\u79F0\u548C\u6620\u5C04\u76EE\u6807");
      return;
    }
    setMapEntry(key, target);
    setNewMapVoice("");
    setNewMapTarget("auto");
    showToast(`\u5DF2\u6DFB\u52A0\u6620\u5C04 ${key} \u2192 ${target}\uFF08\u4FDD\u5B58\u540E\u751F\u6548\uFF09`);
  };
  const generateOpenAiKey = async () => {
    if (genKeyBusy) return;
    setGenKeyBusy(true);
    try {
      const res = await genOpenAiServerKeyApi();
      if (res?.apiKey) {
        onSet("openaiServer.apiKey", res.apiKey);
        await writeClipboard(res.apiKey).catch(() => {
        });
        showToast("\u5DF2\u751F\u6210\u968F\u673A\u5BC6\u94A5\u5E76\u5199\u5165\u8349\u7A3F\uFF08\u5DF2\u5C1D\u8BD5\u590D\u5236\u5230\u526A\u8D34\u677F\uFF0C\u4FDD\u5B58\u540E\u4F1A\u63A9\u7801\uFF09");
      }
    } catch (err) {
      showToast(`\u751F\u6210\u5BC6\u94A5\u5931\u8D25\uFF1A${String(err?.message || err)}`);
    } finally {
      setGenKeyBusy(false);
    }
  };
  const voiceMapObj = d3["openaiServer.voiceMap"] && typeof d3["openaiServer.voiceMap"] === "object" && !Array.isArray(d3["openaiServer.voiceMap"]) ? d3["openaiServer.voiceMap"] : DEFAULT_OPENAI_VOICE_MAP;
  const voiceMapEntries = Object.entries(voiceMapObj);
  const rawOaServerKey = String(d3["openaiServer.apiKey"] || "");
  const canCopyOaServerKey = Boolean(rawOaServerKey && !/[\u2026\u2022\u00b7]/.test(rawOaServerKey));
  const shareTokensList = Array.isArray(importInfo?.shareTokens) ? importInfo.shareTokens : [];
  const issueReadToken = async () => {
    if (tokenBusy) return;
    setTokenBusy(true);
    try {
      const label = newReadLabel.trim() || `\u5206\u4EAB\u8BBE\u5907 ${shareTokensList.length + 1}`;
      const res = await createReadTokenApi(label);
      setNewReadLabel("");
      setLastCreatedRead(res?.item || null);
      await onRefreshState?.();
      if (res?.item?.token) await writeClipboard(res.item.token).catch(() => {
      });
      showToast(`\u5DF2\u751F\u6210\u53EA\u8BFB\u4EE4\u724C\u300C${label}\u300D\uFF08\u5DF2\u5C1D\u8BD5\u590D\u5236\uFF09`);
    } catch (err) {
      showToast(`\u751F\u6210\u5931\u8D25\uFF1A${String(err?.message || err)}`);
    } finally {
      setTokenBusy(false);
    }
  };
  const revokeReadToken = async (id, label) => {
    if (tokenBusy) return;
    setTokenBusy(true);
    try {
      await deleteReadTokenApi(id);
      if (lastCreatedRead?.id === id) setLastCreatedRead(null);
      await onRefreshState?.();
      showToast(`\u5DF2\u540A\u9500\u53EA\u8BFB\u4EE4\u724C\uFF1A${label || id}`);
    } catch (err) {
      showToast(`\u540A\u9500\u5931\u8D25\uFF1A${String(err?.message || err)}`);
    } finally {
      setTokenBusy(false);
    }
  };
  const rotateAdminToken = async () => {
    if (tokenBusy) return;
    setTokenBusy(true);
    try {
      await rotateAdminTokenApi();
      await onRefreshState?.();
      showToast("\u4E3B\u7BA1\u7406\u4EE4\u724C\u5DF2\u8F6E\u6362\uFF0C\u8BF7\u5230\u4EA4\u4ED8\u9875\u91CD\u65B0\u590D\u5236\u81EA\u7528\u5BFC\u5165\u5730\u5740");
    } catch (err) {
      showToast(`\u8F6E\u6362\u5931\u8D25\uFF1A${String(err?.message || err)}`);
    } finally {
      setTokenBusy(false);
    }
  };
  const assignRefToRole = (roleKey, item) => {
    const roleCn = roleKey === "dialogue" ? "\u5BF9\u8BDD" : "\u65C1\u767D";
    if (provider === "mimo") {
      onSetBatch({
        [`voices.${roleKey}.mode`]: "clone",
        [`voices.${roleKey}.refId`]: item.id,
        [`voices.${roleKey}.voice`]: ""
      });
      showToast(`\u5DF2\u5C06\u300C${item.name}\u300D\u7ED1\u5B9A\u4E3A MiMo ${roleCn}\u514B\u9686\u97F3\u8272\uFF08\u8349\u7A3F\uFF09`);
      return;
    }
    onSetBatch({
      [`upstream.local.refs.${roleKey}.refId`]: item.id,
      [`upstream.local.refs.${roleKey}.wav`]: "",
      [`upstream.local.refs.${roleKey}.text`]: ""
    });
    showToast(`\u5DF2\u5C06\u300C${item.name}\u300D\u8BBE\u4E3A\u672C\u5730 ${roleCn}\u53C2\u8003\u97F3\uFF08\u8349\u7A3F\uFF09`);
  };
  const renderLocalRefPicker = (roleKey, label) => {
    const refPath = `upstream.local.refs.${roleKey}.refId`;
    const wavPath = `upstream.local.refs.${roleKey}.wav`;
    const textPath = `upstream.local.refs.${roleKey}.text`;
    const shortRole = roleKey === "dialogue" ? "\u5BF9\u8BDD" : "\u65C1\u767D";
    const selected = refsList.find((r3) => r3.id === d3[refPath]);
    return /* @__PURE__ */ import_react10.default.createElement("div", { className: "local-ref-slot" }, /* @__PURE__ */ import_react10.default.createElement(Field, { label: `${label}\u53C2\u8003\u97F3\u5E93\u9009\u62E9`, sub: "REF" }, /* @__PURE__ */ import_react10.default.createElement("select", { className: "input", value: d3[refPath] || "", onChange: (e3) => onSet(refPath, e3.target.value) }, /* @__PURE__ */ import_react10.default.createElement("option", { value: "" }, "-- \u624B\u52A8\u586B\u5199\u672C\u5730\u8DEF\u5F84\uFF08\u517C\u5BB9\u65E7\u914D\u7F6E\uFF09--"), refsList.map((r3) => /* @__PURE__ */ import_react10.default.createElement("option", { key: r3.id, value: r3.id }, `${r3.name}${r3.durationSec ? ` (${r3.durationSec}s)` : ""}${r3.text ? "" : " [\u7F3A\u6587\u672C]"}`)))), selected ? /* @__PURE__ */ import_react10.default.createElement("div", { className: "mono ref-picked-note" }, "\u5DF2\u5173\u8054\uFF1A", selected.text ? `\u300C${selected.text}\u300D` : "\u26A0\uFE0F \u8BE5\u6837\u672C\u672A\u586B\u5199\u9010\u5B57\u6587\u672C\uFF0C\u8BF7\u5728\u4E0B\u65B9\u53C2\u8003\u97F3\u5E93\u8865\u5145") : twoCol(
      /* @__PURE__ */ import_react10.default.createElement(Field, { label: `${shortRole}\u8DEF\u5F84`, sub: "WAV (~/)", style: { padding: 0 } }, input(wavPath, { spellCheck: false })),
      /* @__PURE__ */ import_react10.default.createElement(Field, { label: `${shortRole}\u6587\u672C`, sub: "TEXT", style: { padding: 0 } }, input(textPath))
    ));
  };
  return /* @__PURE__ */ import_react10.default.createElement("section", { className: "view view--settings", id: "view-settings", "aria-label": "\u6E32\u67D3\u8BBE\u7F6E" }, /* @__PURE__ */ import_react10.default.createElement("div", { className: "set-grid" }, /* @__PURE__ */ import_react10.default.createElement("div", { className: "set-left" }, /* @__PURE__ */ import_react10.default.createElement("div", null, /* @__PURE__ */ import_react10.default.createElement("h2", null, "\u6E32\u67D3\u8BBE\u7F6E"), /* @__PURE__ */ import_react10.default.createElement("div", { className: "sub" }, "Render Rack \xB7 4 Groups")), /* @__PURE__ */ import_react10.default.createElement("div", { className: "chain", "aria-label": "\u4FE1\u53F7\u94FE" }, /* @__PURE__ */ import_react10.default.createElement("div", { className: "chain-node" }, /* @__PURE__ */ import_react10.default.createElement("span", { className: "ld" }), /* @__PURE__ */ import_react10.default.createElement("b", null, "\u6B63\u6587 + \u66FF\u6362"), " ", /* @__PURE__ */ import_react10.default.createElement("span", { className: "muted" }, "LEXICON")), /* @__PURE__ */ import_react10.default.createElement("div", { className: "chain-link" }), /* @__PURE__ */ import_react10.default.createElement("div", { className: "chain-node" }, /* @__PURE__ */ import_react10.default.createElement("span", { className: "ld" }), /* @__PURE__ */ import_react10.default.createElement("b", null, "\u5207\u5206"), " ", /* @__PURE__ */ import_react10.default.createElement("span", { className: "muted" }, "\u65C1\u767D / \u5BF9\u8BDD")), /* @__PURE__ */ import_react10.default.createElement("div", { className: "chain-link" }), /* @__PURE__ */ import_react10.default.createElement("div", { className: "chain-node" }, /* @__PURE__ */ import_react10.default.createElement("span", { className: "ld" }), /* @__PURE__ */ import_react10.default.createElement("b", null, "\u5E76\u53D1\u961F\u5217"), " ", /* @__PURE__ */ import_react10.default.createElement("span", { className: "muted" }, `x${chain.concurrency}`)), /* @__PURE__ */ import_react10.default.createElement("div", { className: "chain-link" }), /* @__PURE__ */ import_react10.default.createElement("div", { className: "chain-node" }, /* @__PURE__ */ import_react10.default.createElement("span", { className: "ld" }), /* @__PURE__ */ import_react10.default.createElement("b", null, "\u7F13\u5B58\u5E26"), " ", /* @__PURE__ */ import_react10.default.createElement("span", { className: "muted" }, chain.cache)), /* @__PURE__ */ import_react10.default.createElement("div", { className: "chain-link" }), /* @__PURE__ */ import_react10.default.createElement("div", { className: "chain-node" }, /* @__PURE__ */ import_react10.default.createElement("span", { className: "ld" }), /* @__PURE__ */ import_react10.default.createElement("b", null, "\u5F15\u64CE"), " ", /* @__PURE__ */ import_react10.default.createElement("span", { className: "muted" }, chain.engine))), /* @__PURE__ */ import_react10.default.createElement("nav", { className: "mod-index", "aria-label": "\u6A21\u5757\u5206\u7EC4\u5B9A\u4F4D" }, NAV_GROUPS.map((g2) => /* @__PURE__ */ import_react10.default.createElement("div", { key: g2.title, className: "mod-group-nav" }, /* @__PURE__ */ import_react10.default.createElement("div", { className: "mgn-title" }, g2.title), g2.items.map(([id, no, name]) => /* @__PURE__ */ import_react10.default.createElement("button", { key: id, type: "button", "data-scroll": id, onClick: () => scrollToModule(id) }, /* @__PURE__ */ import_react10.default.createElement("span", { className: "n" }, no), name)))))), /* @__PURE__ */ import_react10.default.createElement("div", { className: "modules", id: "modules" }, /* @__PURE__ */ import_react10.default.createElement("div", { className: "mod-group-hd" }, /* @__PURE__ */ import_react10.default.createElement("span", { className: "silk" }, "GROUP 01 \xB7 ", /* @__PURE__ */ import_react10.default.createElement("b", null, "\u5F15\u64CE\u4E0E\u670D\u52A1")), /* @__PURE__ */ import_react10.default.createElement("button", { className: "btn btn--sm btn--tape", type: "button", onClick: onOpenSetup }, "\u6253\u5F00\u5411\u5BFC\u4E0E\u4F53\u68C0")), moduleShell("mod-engine", "01", "\u6E32\u67D3\u6765\u6E90\u4E0E\u4E91\u7AEF\u63A5\u5165", "ENGINE", "engine", [
    /* @__PURE__ */ import_react10.default.createElement("div", { key: "prov", className: "ctrl-row" }, /* @__PURE__ */ import_react10.default.createElement("div", { className: "cl" }, /* @__PURE__ */ import_react10.default.createElement("b", null, "\u6E32\u67D3\u6765\u6E90"), /* @__PURE__ */ import_react10.default.createElement("i", null, "PROVIDER")), /* @__PURE__ */ import_react10.default.createElement(
      Seg,
      {
        options: [
          { value: "mimo", label: "\u4E91\u7AEF" },
          { value: "local", label: "\u672C\u5730" },
          { value: "hybrid", label: "\u6DF7\u5408" },
          { value: "openai", label: "OpenAI" }
        ],
        value: provider,
        ariaLabel: "\u6E32\u67D3\u6765\u6E90",
        onChange: (v2) => onSet("upstream.provider", v2)
      }
    )),
    provider === "mimo" || provider === "hybrid" ? /* @__PURE__ */ import_react10.default.createElement("div", { key: "mimo-conn", className: "mimo-conn" }, /* @__PURE__ */ import_react10.default.createElement(Field, { label: "MiMo API Key", sub: "\u6BCF\u884C\u4E00\u4E2A \xB7 \u4FDD\u7559\u63A9\u7801\u884C\u53EF\u8FFD\u52A0" }, /* @__PURE__ */ import_react10.default.createElement(
      Textarea,
      {
        value: d3["upstream.keys"],
        rows: 2,
        spellCheck: false,
        placeholder: "sk-\u2026\uFF08\u4FDD\u7559\u5DF2\u6709\u63A9\u7801\u884C\u5373\u53EF\u8FFD\u52A0\u65B0 Key\uFF09",
        onChange: set("upstream.keys")
      }
    )), twoCol(
      /* @__PURE__ */ import_react10.default.createElement(Field, { label: "\u4E91\u7AEF\u6A21\u578B", sub: "MODEL", style: { padding: 0 } }, input("upstream.model", { spellCheck: false })),
      /* @__PURE__ */ import_react10.default.createElement(Field, { label: "\u4E0A\u6E38\u5730\u5740", sub: "BASE URL", style: { padding: 0 } }, input("upstream.baseUrl", { spellCheck: false }))
    ), twoCol(
      /* @__PURE__ */ import_react10.default.createElement(Field, { label: "\u8D85\u65F6 (ms)", sub: "TIMEOUT", style: { padding: 0 } }, input("upstream.timeoutMs", { type: "number" })),
      /* @__PURE__ */ import_react10.default.createElement(Field, { label: "\u91CD\u8BD5\u6B21\u6570", sub: "RETRY", style: { padding: 0 } }, input("upstream.maxRetry", { type: "number" }))
    )) : null,
    provider === "hybrid" ? /* @__PURE__ */ import_react10.default.createElement("div", { key: "hy-box" }, /* @__PURE__ */ import_react10.default.createElement("div", { className: "knob-row" }, knob("upstream.hybrid.maxCloudBootstrap", "\u4E91\u9876\u73ED", 0, 30, 1, "\u6BB5", "\u4E91\u9876\u73ED\u4E0A\u9650\uFF08\u6BB5\uFF09"), knob("upstream.hybrid.cloudConcurrency", "\u4E91\u5E76\u53D1", 1, 2, 1, "\u8DEF", "\u4E91\u5E76\u53D1\uFF08\u8DEF\uFF09"), /* @__PURE__ */ import_react10.default.createElement("div", { className: "knob-wrap", "data-label": "\u672C\u5730\u9884\u70ED" }, /* @__PURE__ */ import_react10.default.createElement("span", { className: "kl" }, "\u672C\u5730\u9884\u70ED"), toggle("upstream.hybrid.warmup", "\u672C\u5730\u9884\u70ED"))), /* @__PURE__ */ import_react10.default.createElement(Field, { label: "\u76EE\u6807\u54CD\u5EA6", sub: "RMS" }, input("upstream.hybrid.targetRms", { inputMode: "decimal", type: "text" }))) : null
  ], {
    wide: true
  }), moduleShell("mod-local", "02", "\u672C\u5730\u5F15\u64CE (Qwen3-TTS MLX)", localActive ? "ACTIVE" : "COLLAPSED", "local", showLocalBody ? [
    /* @__PURE__ */ import_react10.default.createElement("div", { key: "st", className: "ctrl-row" }, /* @__PURE__ */ import_react10.default.createElement("div", { className: "cl" }, /* @__PURE__ */ import_react10.default.createElement("b", null, "\u5F15\u64CE\u8FDB\u7A0B\u72B6\u6001\u4E0E\u5185\u5B58"), /* @__PURE__ */ import_react10.default.createElement("i", null, `${localTag}${localInfo?.rssMb ? ` \xB7 ${(Number(localInfo.rssMb) / 1024).toFixed(2)} GB` : " \xB7 \u5E38\u9A7B\u7EA6 1\u20132.3 GB"}`)), /* @__PURE__ */ import_react10.default.createElement("button", { className: "btn btn--sm", type: "button", onClick: onOpenSetup }, "\u81EA\u52A8\u63A2\u6D4B / \u5B89\u88C5")),
    /* @__PURE__ */ import_react10.default.createElement("div", { key: "res-mode", className: "ctrl-row" }, /* @__PURE__ */ import_react10.default.createElement("div", { className: "cl" }, /* @__PURE__ */ import_react10.default.createElement("b", null, "\u9A7B\u7559\u7B56\u7565"), /* @__PURE__ */ import_react10.default.createElement("i", null, Number(d3["upstream.local.idleUnloadSeconds"] || 0) === 0 ? "\u5E38\u9A7B\uFF08\u96F6\u51B7\u542F\u52A8\uFF0C\u5360 1\u20132.3 GB\uFF09" : `\u7701\u5185\u5B58\uFF08\u7A7A\u95F2 ${d3["upstream.local.idleUnloadSeconds"]}s \u5378\u8F7D\uFF09`)), /* @__PURE__ */ import_react10.default.createElement(
      Seg,
      {
        options: [
          { value: "resident", label: "\u4FDD\u6301\u5E38\u9A7B (0s)" },
          { value: "powersave", label: "\u7701\u5185\u5B58 (30m)" }
        ],
        value: Number(d3["upstream.local.idleUnloadSeconds"] || 0) === 0 ? "resident" : "powersave",
        ariaLabel: "\u672C\u5730\u5F15\u64CE\u9A7B\u7559\u7B56\u7565",
        onChange: (v2) => onSet("upstream.local.idleUnloadSeconds", v2 === "resident" ? "0" : "1800")
      }
    )),
    /* @__PURE__ */ import_react10.default.createElement(Field, { key: "py", label: "Python (\u652F\u6301 ~/)", sub: "VENV" }, input("upstream.local.pythonPath", { spellCheck: false, placeholder: "~/.dsh/plugin-data/audiobook-tts-plugin/venv/bin/python" })),
    /* @__PURE__ */ import_react10.default.createElement(Field, { key: "md", label: "\u6A21\u578B\u76EE\u5F55 (\u652F\u6301 ~/)", sub: "MLX MODEL" }, input("upstream.local.modelPath", { spellCheck: false, placeholder: "~/.dsh/plugin-data/audiobook-tts-plugin/models/qwen3tts-0.6b-base-8bit" })),
    /* @__PURE__ */ import_react10.default.createElement(Field, { key: "sc", label: "Sidecar \u811A\u672C\uFF08\u7559\u7A7A\u7528\u5185\u7F6E\uFF09", sub: "SERVER" }, input("upstream.local.serverScript", { spellCheck: false })),
    twoCol(
      /* @__PURE__ */ import_react10.default.createElement(Field, { key: "lp", label: "\u7AEF\u53E3", sub: "PORT", style: { padding: 0 } }, input("upstream.local.port", { type: "number" })),
      /* @__PURE__ */ import_react10.default.createElement(Field, { label: "\u542F\u52A8\u8D85\u65F6", sub: "MS", style: { padding: 0 } }, input("upstream.local.startupTimeoutMs", { type: "number" }))
    ),
    /* @__PURE__ */ import_react10.default.createElement("div", { key: "idle", className: "knob-row" }, knob("upstream.local.idleUnloadSeconds", "\u7A7A\u95F2\u5378\u8F7D", 0, 7200, 60, "s", "\u7A7A\u95F2\u5378\u8F7D\uFF08\u79D2\uFF0C0=\u5E38\u9A7B\uFF09"), knob("upstream.local.warmupWindowSeconds", "\u9884\u70ED\u7A97\u53E3", 0, 3600, 60, "s", "\u9996\u8BF7\u6C42\u9884\u70ED\u4FDD\u6D3B\u7A97\u53E3\uFF08\u79D2\uFF09"), /* @__PURE__ */ import_react10.default.createElement(Field, { label: "\u8BF7\u6C42\u8D85\u65F6", sub: "MS", style: { flex: "1", padding: 0 } }, input("upstream.local.requestTimeoutMs", { type: "number" }))),
    /* @__PURE__ */ import_react10.default.createElement("div", { key: "nr" }, renderLocalRefPicker("narrator", "\u65C1\u767D")),
    /* @__PURE__ */ import_react10.default.createElement("div", { key: "dr" }, renderLocalRefPicker("dialogue", "\u5BF9\u8BDD\uFF08\u53EF\u9009\uFF09"))
  ] : /* @__PURE__ */ import_react10.default.createElement("div", { key: "col-loc", className: "collapsed-note" }, /* @__PURE__ */ import_react10.default.createElement("span", null, "\u5F53\u524D\u6E32\u67D3\u6765\u6E90\u4E3A\u300C", provider, "\u300D\uFF0C\u672C\u5730 Qwen3-TTS \u53C2\u6570\u5DF2\u6298\u53E0\u3002"), /* @__PURE__ */ import_react10.default.createElement("button", { className: "btn btn--sm", type: "button", onClick: () => setExpandLocal(true) }, "\u5C55\u5F00\u67E5\u770B")), {
    right: !localActive && showLocalBody ? /* @__PURE__ */ import_react10.default.createElement("button", { className: "btn btn--sm btn--ghost", type: "button", onClick: () => setExpandLocal(false) }, "\u6536\u8D77") : null
  }), moduleShell("mod-openai", "03", "OpenAI \u517C\u5BB9\u5F15\u64CE", openaiActive ? "ACTIVE" : "COLLAPSED", "openai", showOpenaiBody ? [
    /* @__PURE__ */ import_react10.default.createElement(Field, { key: "oab", label: "\u63A5\u53E3\u5730\u5740", sub: "BASE URL" }, input("upstream.openai.baseUrl", { spellCheck: false, placeholder: "http://127.0.0.1:8880/v1" })),
    /* @__PURE__ */ import_react10.default.createElement(Field, { key: "oak", label: "API Key", sub: "\u53EF\u9009 \xB7 \u5DF2\u63A9\u7801" }, input("upstream.openai.apiKey", { spellCheck: false, placeholder: "\u672C\u5730 Kokoro/Edge-TTS \u53EF\u7559\u7A7A" })),
    twoCol(
      /* @__PURE__ */ import_react10.default.createElement(Field, { key: "oam", label: "\u6A21\u578B", sub: "MODEL", style: { padding: 0 } }, input("upstream.openai.model", { spellCheck: false, placeholder: "tts-1 / kokoro" })),
      /* @__PURE__ */ import_react10.default.createElement(Field, { key: "oas", label: "\u8BED\u901F", sub: "0.25\u20134.0", style: { padding: 0 } }, input("upstream.openai.speed", { type: "number", step: "0.05" }))
    ),
    twoCol(
      /* @__PURE__ */ import_react10.default.createElement(Field, { key: "oan", label: "\u65C1\u767D\u97F3\u8272", sub: "NARRATOR", style: { padding: 0 } }, input("upstream.openai.narratorVoice", { spellCheck: false })),
      /* @__PURE__ */ import_react10.default.createElement(Field, { key: "oad", label: "\u5BF9\u8BDD\u97F3\u8272", sub: "DIALOGUE", style: { padding: 0 } }, input("upstream.openai.dialogueVoice", { spellCheck: false }))
    ),
    /* @__PURE__ */ import_react10.default.createElement("div", { key: "oaf", className: "ctrl-row" }, /* @__PURE__ */ import_react10.default.createElement("div", { className: "cl" }, /* @__PURE__ */ import_react10.default.createElement("b", null, "\u8FD4\u56DE\u683C\u5F0F"), /* @__PURE__ */ import_react10.default.createElement("i", null, "FORMAT")), /* @__PURE__ */ import_react10.default.createElement(
      Seg,
      {
        options: [
          { value: "wav", label: "WAV" },
          { value: "pcm", label: "PCM (24k)" }
        ],
        value: d3["upstream.openai.responseFormat"],
        ariaLabel: "OpenAI \u54CD\u5E94\u683C\u5F0F",
        onChange: (v2) => onSet("upstream.openai.responseFormat", v2)
      }
    )),
    /* @__PURE__ */ import_react10.default.createElement(Field, { key: "oai", label: "\u98CE\u683C\u6307\u4EE4", sub: "INSTRUCTIONS \xB7 \u53EF\u9009" }, input("upstream.openai.instructions", { placeholder: "\u5982\uFF1A\u6C89\u7A33\u6E29\u67D4\u5730\u6717\u8BFB\u5C0F\u8BF4" }))
  ] : /* @__PURE__ */ import_react10.default.createElement("div", { key: "col-oa", className: "collapsed-note" }, /* @__PURE__ */ import_react10.default.createElement("span", null, "\u5F53\u524D\u672A\u542F\u7528 OpenAI / Kokoro / Edge-TTS \u517C\u5BB9\u534F\u8BAE\u3002"), /* @__PURE__ */ import_react10.default.createElement("button", { className: "btn btn--sm", type: "button", onClick: () => setExpandOpenai(true) }, "\u5C55\u5F00\u67E5\u770B")), {
    right: !openaiActive && showOpenaiBody ? /* @__PURE__ */ import_react10.default.createElement("button", { className: "btn btn--sm btn--ghost", type: "button", onClick: () => setExpandOpenai(false) }, "\u6536\u8D77") : null
  }), /* @__PURE__ */ import_react10.default.createElement("div", { className: "mod-group-hd" }, /* @__PURE__ */ import_react10.default.createElement("span", { className: "silk" }, "GROUP 02 \xB7 ", /* @__PURE__ */ import_react10.default.createElement("b", null, "\u97F3\u8272\u65B9\u6848\u3001\u7EDF\u4E00\u53C2\u8003\u97F3\u5E93\u4E0E\u8BD5\u542C"))), moduleShell("mod-voice", "04", "\u97F3\u8272\u9884\u8BBE\u65B9\u6848\u4E0E MiMo \u4E09\u6A21\u5F0F / \u8349\u7A3F\u8BD5\u542C", "VOICE & PROFILES", "voice", [
    /* @__PURE__ */ import_react10.default.createElement("div", { key: "vp", className: "vp-bar" }, /* @__PURE__ */ import_react10.default.createElement("span", { className: "silk" }, "\u4E00\u952E\u97F3\u8272\u65B9\u6848"), /* @__PURE__ */ import_react10.default.createElement("div", { className: "vp-chips" }, allProfiles.map((p2) => /* @__PURE__ */ import_react10.default.createElement("span", { key: p2.id, className: "vp-chip-wrap" }, /* @__PURE__ */ import_react10.default.createElement(
      "button",
      {
        type: "button",
        className: "chip",
        "aria-pressed": String(d3["voiceProfiles.active"] === p2.id),
        onClick: () => applyVoiceProfile(p2.id)
      },
      p2.name
    ), !p2.builtin ? /* @__PURE__ */ import_react10.default.createElement(
      "button",
      {
        type: "button",
        className: "chip vp-del",
        title: `\u5220\u9664\u81EA\u5B9A\u4E49\u65B9\u6848\uFF1A${p2.name}`,
        "aria-label": `\u5220\u9664 ${p2.name}`,
        onClick: () => deleteCustomProfile(p2.id)
      },
      "\xD7"
    ) : null))), /* @__PURE__ */ import_react10.default.createElement("div", { className: "vp-save" }, /* @__PURE__ */ import_react10.default.createElement(
      "input",
      {
        className: "input",
        value: newProfileName,
        placeholder: "\u65B0\u65B9\u6848\u540D\uFF08\u4FDD\u5B58\u5F53\u524D\u65C1\u767D+\u5BF9\u8BDD\u7EC4\u5408\uFF09",
        onChange: (e3) => setNewProfileName(e3.target.value)
      }
    ), /* @__PURE__ */ import_react10.default.createElement("button", { className: "btn btn--sm", type: "button", onClick: saveCurrentProfile }, "\u5B58\u4E3A\u65B9\u6848"))),
    /* @__PURE__ */ import_react10.default.createElement("div", { key: "roles", className: "role-grid" }, /* @__PURE__ */ import_react10.default.createElement(
      RoleVoiceCard,
      {
        roleKey: "narrator",
        label: "\u65C1\u767D",
        sub: "NARRATOR",
        provider,
        d: d3,
        onSet,
        presetVoices,
        refsList
      }
    ), /* @__PURE__ */ import_react10.default.createElement(
      RoleVoiceCard,
      {
        roleKey: "dialogue",
        label: "\u5BF9\u8BDD",
        sub: "DIALOGUE",
        provider,
        d: d3,
        onSet,
        presetVoices,
        refsList
      }
    )),
    /* @__PURE__ */ import_react10.default.createElement(
      PreviewPlayer,
      {
        key: "pv",
        draftPatch,
        showToast,
        defaultRole: "narrator",
        title: "PREVIEW DRAFT \xB7 \u672A\u4FDD\u5B58\u8349\u7A3F\u4EA4\u4E92\u8BD5\u542C"
      }
    )
  ], { wide: true }), moduleShell("mod-refs", "05", "\u7EDF\u4E00\u53C2\u8003\u97F3\u5E93", "UNIFIED REF LIBRARY", "refs", [
    /* @__PURE__ */ import_react10.default.createElement(
      RefVoiceLibrary,
      {
        key: "rl",
        refs: refsList,
        onRefsChange,
        onAssignRef: assignRefToRole,
        showToast
      }
    )
  ], { wide: true }), /* @__PURE__ */ import_react10.default.createElement("div", { className: "mod-group-hd" }, /* @__PURE__ */ import_react10.default.createElement("span", { className: "silk" }, "GROUP 03 \xB7 ", /* @__PURE__ */ import_react10.default.createElement("b", null, "\u6587\u672C\u89C4\u5219\u3001\u5207\u5206\u4E0E\u7F13\u5B58"))), moduleShell("mod-lexicon", "06", "\u6587\u672C\u53D1\u97F3\u4E0E\u65AD\u53E5\u89C4\u5219", "LEXICON", "lexicon", [
    /* @__PURE__ */ import_react10.default.createElement(
      LexiconEditor,
      {
        key: "lx",
        enabled: Boolean(d3["textRules.enabled"]),
        polyphoneEnabled: d3["textRules.polyphoneEnabled"] !== false,
        disabledPresets: d3["textRules.disabledPresets"],
        items: d3["textRules.items"],
        presets: builtinRulePresets,
        polyphonePresets: builtinPolyphonePresets,
        maxSegmentChars: d3["synth.maxSegmentChars"],
        onToggle: (val) => onSet("textRules.enabled", val),
        onTogglePolyphone: (val) => onSet("textRules.polyphoneEnabled", val),
        onChangeDisabledPresets: (ids) => onSet("textRules.disabledPresets", ids),
        onChangeItems: (items) => onSet("textRules.items", items),
        showToast
      }
    )
  ], { wide: true }), moduleShell("mod-synth", "07", "\u5408\u6210\u4E0E\u7F13\u5B58", "SYNTH \xB7 CACHE", "synth", [
    /* @__PURE__ */ import_react10.default.createElement("div", { key: "scols", className: "synth-cols" }, /* @__PURE__ */ import_react10.default.createElement("div", null, /* @__PURE__ */ import_react10.default.createElement("div", { className: "knob-row" }, knob("synth.concurrency", "\u5E76\u53D1", 1, 8, 1, "\u8DEF", "\u5408\u6210\u5E76\u53D1\uFF08\u8DEF\uFF09"), knob("synth.maxSegmentChars", "\u6BCF\u6BB5\u5B57\u6570", 10, 300, 10, "\u5B57", "\u6BCF\u6BB5\u6700\u5927\u5B57\u6570"), knob("limits.rpm", "\u9650\u901F", 10, 300, 10, "/min", "\u6BCF\u5206\u949F\u8BF7\u6C42\u4E0A\u9650")), /* @__PURE__ */ import_react10.default.createElement("div", { className: "ctrl-row" }, /* @__PURE__ */ import_react10.default.createElement("div", { className: "cl" }, /* @__PURE__ */ import_react10.default.createElement("b", null, "\u6D41\u5F0F\u8FD4\u56DE"), /* @__PURE__ */ import_react10.default.createElement("i", null, "STREAM \xB7 \u4EC5 WAV\uFF1B\u90E8\u5206 Android \u8FDB\u5EA6\u6761\u53EF\u80FD\u5931\u771F\uFF08\u5EFA\u8BAE\u9010 URL ?stream=1 \u5B9E\u6D4B\u540E\u518D\u5168\u5C40\u5F00\u542F\uFF09")), toggle("synth.stream", "\u6D41\u5F0F\u8FD4\u56DE")), /* @__PURE__ */ import_react10.default.createElement("div", { className: "ctrl-row" }, /* @__PURE__ */ import_react10.default.createElement("div", { className: "cl" }, /* @__PURE__ */ import_react10.default.createElement("b", null, "\u9ED8\u8BA4\u8F93\u51FA\u683C\u5F0F"), /* @__PURE__ */ import_react10.default.createElement("i", null, d3["audio.format"] === "opus" ? "Opus \u4EC5\u4F9B OpenAI \u5BA2\u6237\u7AEF\uFF0CLegado \u81EA\u52A8\u9000\u56DE WAV" : "MP3 / Opus \u9700\u672C\u673A ffmpeg\uFF1B\u975E WAV \u7981\u7528\u6D41\u5F0F")), /* @__PURE__ */ import_react10.default.createElement(
      Seg,
      {
        options: [
          { value: "wav", label: "WAV" },
          { value: "mp3", label: "MP3" },
          { value: "opus", label: "Opus" }
        ],
        value: d3["audio.format"] || "wav",
        ariaLabel: "\u9ED8\u8BA4\u8F93\u51FA\u683C\u5F0F",
        onChange: (v2) => onSet("audio.format", v2)
      }
    )), (d3["audio.format"] === "mp3" || d3["audio.format"] === "opus") && /* @__PURE__ */ import_react10.default.createElement("div", { className: "ctrl-row" }, /* @__PURE__ */ import_react10.default.createElement("div", { className: "cl" }, /* @__PURE__ */ import_react10.default.createElement("b", null, "\u538B\u7F29\u7801\u7387"), /* @__PURE__ */ import_react10.default.createElement("i", null, "BITRATE (kbps)")), /* @__PURE__ */ import_react10.default.createElement(
      Seg,
      {
        options: [
          { value: "32", label: "32k" },
          { value: "48", label: "48k" },
          { value: "64", label: "64k" },
          { value: "128", label: "128k" }
        ],
        value: String(d3["audio.bitrate"] || "64"),
        ariaLabel: "\u538B\u7F29\u7801\u7387",
        onChange: (v2) => onSet("audio.bitrate", v2)
      }
    ))), /* @__PURE__ */ import_react10.default.createElement("div", null, /* @__PURE__ */ import_react10.default.createElement("div", { className: "knob-row" }, knob("cache.maxEntries", "\u7F13\u5B58\u6761\u76EE", 50, 5e3, 50, "\u6761", "\u7F13\u5B58\u6761\u76EE\u4E0A\u9650"), knob("cache.ttlSeconds", "\u7F13\u5B58 TTL", 600, 86400, 600, "s", "\u7F13\u5B58 TTL\uFF08\u79D2\uFF09"), knob("synth.maxTextChars", "\u6700\u957F\u6587\u672C", 1e3, 2e4, 1e3, "\u5B57", "\u5355\u6B21\u6700\u957F\u6587\u672C")), /* @__PURE__ */ import_react10.default.createElement("div", { className: "ctrl-row" }, /* @__PURE__ */ import_react10.default.createElement("div", { className: "cl" }, /* @__PURE__ */ import_react10.default.createElement("b", null, "\u7F13\u5B58"), /* @__PURE__ */ import_react10.default.createElement("i", null, `\u4E0A\u9650 ${fmtBytes(live?.cache?.maxBytes || 0)}`)), toggle("cache.enabled", "\u542F\u7528\u7F13\u5B58")), /* @__PURE__ */ import_react10.default.createElement("div", { className: "ctrl-row" }, /* @__PURE__ */ import_react10.default.createElement("div", { className: "cl" }, /* @__PURE__ */ import_react10.default.createElement("b", null, "HTTP \u7F13\u5B58\u5934"), /* @__PURE__ */ import_react10.default.createElement("i", null, Number(d3["cache.httpMaxAgeSeconds"] ?? 3600) > 0 ? `ETag + private, max-age=${d3["cache.httpMaxAgeSeconds"]}` : "no-store\uFF08\u7981\u7528\u6D4F\u89C8\u5668/\u4EE3\u7406\u7F13\u5B58\uFF09")), /* @__PURE__ */ import_react10.default.createElement(
      Seg,
      {
        options: [
          { value: "0", label: "\u7981\u7528" },
          { value: "300", label: "5\u5206" },
          { value: "3600", label: "1\u5C0F\u65F6" },
          { value: "86400", label: "24\u5C0F\u65F6" }
        ],
        value: String(d3["cache.httpMaxAgeSeconds"] ?? "3600"),
        ariaLabel: "HTTP \u7F13\u5B58 max-age",
        onChange: (v2) => onSet("cache.httpMaxAgeSeconds", v2)
      }
    ))))
  ], { wide: true }), /* @__PURE__ */ import_react10.default.createElement("div", { className: "mod-group-hd" }, /* @__PURE__ */ import_react10.default.createElement("span", { className: "silk" }, "GROUP 04 \xB7 ", /* @__PURE__ */ import_react10.default.createElement("b", null, "\u7F51\u7EDC\u7AEF\u53E3\u3001\u5BF9\u5916 OpenAI \u7AEF\u70B9\u3001Legado \u4E0E\u5B89\u5168\u9274\u6743"))), moduleShell("mod-transport", "08", "\u4F20\u8F93\u3001Legado \u4E0E\u516C\u7F51\u96A7\u9053", "TRANSPORT \xB7 TUNNEL", "transport", [
    /* @__PURE__ */ import_react10.default.createElement("div", { key: "trcols", className: "synth-cols" }, /* @__PURE__ */ import_react10.default.createElement("div", null, twoCol(
      /* @__PURE__ */ import_react10.default.createElement(Field, { key: "sh", label: "\u76D1\u542C\u5730\u5740", sub: "HOST", style: { padding: 0 } }, input("server.host", { spellCheck: false })),
      /* @__PURE__ */ import_react10.default.createElement(Field, { key: "sp", label: "\u7AEF\u53E3", sub: "PORT", style: { padding: 0 } }, input("server.port", { type: "number" }))
    ), /* @__PURE__ */ import_react10.default.createElement(Field, { key: "pu", label: "\u5BF9\u5916\u5730\u5740", sub: "PUBLIC URL \xB7 \u547D\u540D\u96A7\u9053/\u53CD\u4EE3\u65F6\u586B" }, input("server.publicUrl", { spellCheck: false, placeholder: "https://tts.example.dpdns.org" })), /* @__PURE__ */ import_react10.default.createElement(Field, { key: "ln", label: "Legado \u5F15\u64CE\u540D", sub: "EXPORT NAME" }, input("legado.name", { spellCheck: false })), /* @__PURE__ */ import_react10.default.createElement(Field, { key: "lh", label: "\u9644\u52A0\u8BF7\u6C42\u5934", sub: "JSON \xB7 \u4F1A\u5199\u8FDB\u5BFC\u51FA\u7684\u6717\u8BFB\u5F15\u64CE" }, /* @__PURE__ */ import_react10.default.createElement(Textarea, { value: d3["legado.extraHeaders"], rows: 2, spellCheck: false, onChange: set("legado.extraHeaders") }))), /* @__PURE__ */ import_react10.default.createElement("div", null, /* @__PURE__ */ import_react10.default.createElement("div", { className: "ctrl-row" }, /* @__PURE__ */ import_react10.default.createElement("div", { className: "cl" }, /* @__PURE__ */ import_react10.default.createElement("b", null, "Quick Tunnel \u534F\u8BAE"), /* @__PURE__ */ import_react10.default.createElement("i", null, "PROTOCOL")), /* @__PURE__ */ import_react10.default.createElement(
      Seg,
      {
        options: [
          { value: "http2", label: "HTTP/2" },
          { value: "quic", label: "QUIC" },
          { value: "auto", label: "Auto" }
        ],
        value: d3["tunnel.protocol"] || "http2",
        ariaLabel: "Quick Tunnel \u534F\u8BAE",
        onChange: (v2) => onSet("tunnel.protocol", v2)
      }
    )), /* @__PURE__ */ import_react10.default.createElement(Field, { label: "\u65B9\u6848 D \u4E2D\u8F6C\u57DF\u540D", sub: "WORKER RELAY URL" }, input("tunnel.kvSync.publicRelayUrl", { spellCheck: false, placeholder: "https://audiobook-tts-relay.xxx.workers.dev" })), /* @__PURE__ */ import_react10.default.createElement("div", { className: "ctrl-row" }, /* @__PURE__ */ import_react10.default.createElement("div", { className: "cl" }, /* @__PURE__ */ import_react10.default.createElement("b", null, "\u542F\u52A8\u96A7\u9053\u65F6\u81EA\u52A8\u540C\u6B65 KV"), /* @__PURE__ */ import_react10.default.createElement("i", null, "AUTO SYNC")), toggle("tunnel.kvSync.enabled", "\u81EA\u52A8\u540C\u6B65 KV")), twoCol(
      /* @__PURE__ */ import_react10.default.createElement(Field, { label: "KV \u540C\u6B65\u6A21\u5F0F", sub: "MODE", style: { padding: 0 } }, /* @__PURE__ */ import_react10.default.createElement("select", { className: "input", value: d3["tunnel.kvSync.mode"] || "wrangler", onChange: (e3) => onSet("tunnel.kvSync.mode", e3.target.value) }, /* @__PURE__ */ import_react10.default.createElement("option", { value: "wrangler" }, "wrangler CLI"), /* @__PURE__ */ import_react10.default.createElement("option", { value: "api" }, "Cloudflare API"))),
      /* @__PURE__ */ import_react10.default.createElement(Field, { label: "KV \u952E\u540D", sub: "KEY NAME", style: { padding: 0 } }, input("tunnel.kvSync.keyName", { spellCheck: false, placeholder: "tunnel_url" }))
    ), twoCol(
      /* @__PURE__ */ import_react10.default.createElement(Field, { label: "KV Namespace ID", sub: "KV ID", style: { padding: 0 } }, input("tunnel.kvSync.kvNamespaceId", { spellCheck: false })),
      /* @__PURE__ */ import_react10.default.createElement(Field, { label: "Account ID", sub: "API \u6A21\u5F0F", style: { padding: 0 } }, input("tunnel.kvSync.accountId", { spellCheck: false }))
    )))
  ], { wide: true }), moduleShell("mod-openai-server", "09", "\u5BF9\u5916 OpenAI \u517C\u5BB9\u7AEF\u70B9 (/v1/audio/speech)", d3["openaiServer.enabled"] ? "ENABLED" : "DISABLED", "openaiServer", [
    /* @__PURE__ */ import_react10.default.createElement("div", { key: "oas-sec", className: "https-warn", style: { marginBottom: 6 } }, /* @__PURE__ */ import_react10.default.createElement("b", null, "\u5B89\u5168\u63D0\u793A\uFF1A"), "\u9ED8\u8BA4\u5173\u95ED\uFF08\u8FD4\u56DE 404\uFF09\u3002\u5F00\u542F\u540E\u5C06\u5BF9\u5916\u66B4\u9732 ", /* @__PURE__ */ import_react10.default.createElement("code", null, "/v1/models"), " \u4E0E ", /* @__PURE__ */ import_react10.default.createElement("code", null, "/v1/audio/speech"), "\uFF08\u517C\u5BB9 Readest \u7B49\u9605\u8BFB\u5BA2\u6237\u7AEF\uFF09\u3002\u516C\u7F51\u90E8\u7F72\u8BF7\u52A1\u5FC5\u751F\u6210\u72EC\u7ACB Bearer \u5BC6\u94A5\uFF0C\u5E76\u907F\u514D\u5728\u516C\u5171\u573A\u6240\u6CC4\u9732\u3002"),
    /* @__PURE__ */ import_react10.default.createElement("div", { key: "oas-cols", className: "synth-cols" }, /* @__PURE__ */ import_react10.default.createElement("div", null, /* @__PURE__ */ import_react10.default.createElement("div", { className: "ctrl-row" }, /* @__PURE__ */ import_react10.default.createElement("div", { className: "cl" }, /* @__PURE__ */ import_react10.default.createElement("b", null, "\u542F\u7528\u5BF9\u5916 OpenAI \u7AEF\u70B9"), /* @__PURE__ */ import_react10.default.createElement("i", null, "ENABLED")), toggle("openaiServer.enabled", "\u542F\u7528\u5BF9\u5916 OpenAI \u7AEF\u70B9")), /* @__PURE__ */ import_react10.default.createElement("div", { className: "ctrl-row" }, /* @__PURE__ */ import_react10.default.createElement("div", { className: "cl" }, /* @__PURE__ */ import_react10.default.createElement("b", null, "\u6309\u5F15\u53F7\u5207\u5206\u65C1\u767D/\u5BF9\u8BDD"), /* @__PURE__ */ import_react10.default.createElement("i", null, "SPLIT DIALOGUE")), toggle("openaiServer.splitDialogue", "\u6309\u5F15\u53F7\u5207\u5206\u65C1\u767D/\u5BF9\u8BDD")), /* @__PURE__ */ import_react10.default.createElement(Field, { label: "\u9ED8\u8BA4\u63A8\u8350\u6A21\u578B\u540D", sub: "MODEL" }, input("openaiServer.defaultModel", { spellCheck: false, placeholder: "audiobook-tts" }))), /* @__PURE__ */ import_react10.default.createElement("div", null, /* @__PURE__ */ import_react10.default.createElement("div", { className: "ctrl-row" }, /* @__PURE__ */ import_react10.default.createElement("div", { className: "cl" }, /* @__PURE__ */ import_react10.default.createElement("b", null, "\u65E0 ffmpeg / \u5F02\u5E38\u683C\u5F0F\u5904\u7406"), /* @__PURE__ */ import_react10.default.createElement("i", null, "FALLBACK POLICY")), /* @__PURE__ */ import_react10.default.createElement(
      Seg,
      {
        options: [
          { value: "wav", label: "WAV \u56DE\u9000" },
          { value: "strict", label: "\u4E25\u683C 400" }
        ],
        value: d3["openaiServer.mp3Fallback"] || "wav",
        ariaLabel: "\u683C\u5F0F\u56DE\u9000\u7B56\u7565",
        onChange: (v2) => onSet("openaiServer.mp3Fallback", v2)
      }
    )), /* @__PURE__ */ import_react10.default.createElement(Field, { label: "\u72EC\u7ACB Bearer \u5BC6\u94A5", sub: "\u7559\u7A7A\u590D\u7528 Token" }, /* @__PURE__ */ import_react10.default.createElement("div", { className: "addr", style: { gap: 6 } }, input("openaiServer.apiKey", { spellCheck: false, placeholder: "\u7559\u7A7A\u590D\u7528 Token\uFF0C\u6216\u70B9\u751F\u6210\u2026" }), /* @__PURE__ */ import_react10.default.createElement(
      "button",
      {
        className: "btn btn--sm btn--tape",
        type: "button",
        disabled: genKeyBusy,
        onClick: generateOpenAiKey
      },
      genKeyBusy ? "\u751F\u6210\u4E2D\u2026" : "\u751F\u6210\u968F\u673A\u5BC6\u94A5"
    ), canCopyOaServerKey ? /* @__PURE__ */ import_react10.default.createElement(
      "button",
      {
        className: "btn btn--sm",
        type: "button",
        onClick: async () => {
          const ok = await writeClipboard(rawOaServerKey);
          showToast(ok ? "\u5DF2\u590D\u5236\u72EC\u7ACB\u5BC6\u94A5" : "\u590D\u5236\u88AB\u6D4F\u89C8\u5668\u62E6\u622A");
        }
      },
      "\u590D\u5236"
    ) : null)))),
    /* @__PURE__ */ import_react10.default.createElement("div", { key: "oas-vm", className: "voicemap-box" }, /* @__PURE__ */ import_react10.default.createElement("div", { className: "ds-hd", style: { marginBottom: 2 } }, /* @__PURE__ */ import_react10.default.createElement("span", { className: "silk" }, "VOICE MAP ", /* @__PURE__ */ import_react10.default.createElement("b", null, "\u97F3\u8272\u6620\u5C04\u8868")), /* @__PURE__ */ import_react10.default.createElement(
      "button",
      {
        className: "btn btn--sm btn--ghost",
        type: "button",
        onClick: () => onSet("openaiServer.voiceMap", { ...DEFAULT_OPENAI_VOICE_MAP })
      },
      "\u6062\u590D\u9ED8\u8BA4"
    )), /* @__PURE__ */ import_react10.default.createElement("p", { className: "hint", style: { marginTop: 0, marginBottom: 4 } }, "\u652F\u6301\u586B ", /* @__PURE__ */ import_react10.default.createElement("code", null, "auto"), "\uFF08\u81EA\u52A8\u5207\u5206\uFF09\u3001", /* @__PURE__ */ import_react10.default.createElement("code", null, "narrator"), "\uFF08\u5168\u6BB5\u65C1\u767D\uFF09\u3001", /* @__PURE__ */ import_react10.default.createElement("code", null, "dialogue"), "\uFF08\u5168\u6BB5\u5BF9\u8BDD\uFF09\u3001MiMo \u9884\u7F6E\u540D\uFF08\u5982 ", /* @__PURE__ */ import_react10.default.createElement("code", null, "\u51B0\u7CD6"), "/", /* @__PURE__ */ import_react10.default.createElement("code", null, "\u8309\u8389"), "\uFF09\u3001\u53C2\u8003\u97F3 ID \u6216 OpenAI \u81EA\u5B9A\u4E49\u97F3\u8272\u3002"), /* @__PURE__ */ import_react10.default.createElement("div", { className: "voicemap-table" }, voiceMapEntries.map(([vk, vv]) => /* @__PURE__ */ import_react10.default.createElement("div", { key: vk, className: "voicemap-row" }, /* @__PURE__ */ import_react10.default.createElement("span", { className: "mono vm-key", title: vk }, vk), /* @__PURE__ */ import_react10.default.createElement("span", { className: "muted" }, "\u2192"), /* @__PURE__ */ import_react10.default.createElement(
      "input",
      {
        className: "input",
        value: vv,
        spellCheck: false,
        "aria-label": `\u97F3\u8272\u6620\u5C04 ${vk}`,
        onChange: (e3) => setMapEntry(vk, e3.target.value)
      }
    ), /* @__PURE__ */ import_react10.default.createElement(
      "select",
      {
        className: "input vm-quick",
        value: ["auto", "narrator", "dialogue", ...presetVoices].includes(vv) ? vv : "",
        "aria-label": `\u5FEB\u6377\u9009\u62E9 ${vk}`,
        onChange: (e3) => {
          if (e3.target.value) setMapEntry(vk, e3.target.value);
        }
      },
      /* @__PURE__ */ import_react10.default.createElement("option", { value: "" }, "\u5FEB\u6377\u2026"),
      /* @__PURE__ */ import_react10.default.createElement("option", { value: "auto" }, "auto \xB7 \u81EA\u52A8"),
      /* @__PURE__ */ import_react10.default.createElement("option", { value: "narrator" }, "narrator \xB7 \u65C1\u767D"),
      /* @__PURE__ */ import_react10.default.createElement("option", { value: "dialogue" }, "dialogue \xB7 \u5BF9\u8BDD"),
      presetVoices.map((pv) => /* @__PURE__ */ import_react10.default.createElement("option", { key: pv, value: pv }, pv))
    ), /* @__PURE__ */ import_react10.default.createElement(
      "button",
      {
        className: "btn btn--sm btn--ghost",
        type: "button",
        title: `\u5220\u9664\u6620\u5C04 ${vk}`,
        onClick: () => removeMapEntry(vk)
      },
      "\xD7"
    ))), /* @__PURE__ */ import_react10.default.createElement("div", { className: "voicemap-add" }, /* @__PURE__ */ import_react10.default.createElement(
      "input",
      {
        className: "input",
        value: newMapVoice,
        placeholder: "\u65B0\u589E voice \u540D\uFF08\u5982 custom\uFF09",
        spellCheck: false,
        onChange: (e3) => setNewMapVoice(e3.target.value)
      }
    ), /* @__PURE__ */ import_react10.default.createElement(
      "input",
      {
        className: "input",
        value: newMapTarget,
        placeholder: "\u76EE\u6807\uFF08auto / narrator / \u97F3\u8272\uFF09",
        spellCheck: false,
        onChange: (e3) => setNewMapTarget(e3.target.value)
      }
    ), /* @__PURE__ */ import_react10.default.createElement("button", { className: "btn btn--sm", type: "button", onClick: addMapEntry }, "\u6DFB\u52A0"))))
  ], { wide: true }), moduleShell("mod-auth", "10", "\u9274\u6743\u3001\u53EA\u8BFB\u5206\u4EAB\u4EE4\u724C\u4E0E\u65E5\u5FD7", "AUTH & TOKENS", "auth", [
    /* @__PURE__ */ import_react10.default.createElement("div", { key: "acols", className: "synth-cols" }, /* @__PURE__ */ import_react10.default.createElement("div", null, /* @__PURE__ */ import_react10.default.createElement("div", { className: "ctrl-row" }, /* @__PURE__ */ import_react10.default.createElement("div", { className: "cl" }, /* @__PURE__ */ import_react10.default.createElement("b", null, "Basic \u9274\u6743"), /* @__PURE__ */ import_react10.default.createElement("i", null, "ENABLED")), toggle("auth.enabled", "Basic \u9274\u6743")), /* @__PURE__ */ import_react10.default.createElement(Field, { label: "\u7528\u6237\u540D", sub: "USER" }, input("auth.user", { placeholder: "", spellCheck: false })), /* @__PURE__ */ import_react10.default.createElement(Field, { label: "\u53E3\u4EE4", sub: "PASS \xB7 \u5DF2\u63A9\u7801" }, input("auth.pass"))), /* @__PURE__ */ import_react10.default.createElement("div", null, /* @__PURE__ */ import_react10.default.createElement(Field, { label: "\u4E3B\u7BA1\u7406\u4EE4\u724C", sub: "ADMIN TOKEN \xB7 \u6CC4\u9732\u65F6\u8BF7\u7ACB\u5373\u8F6E\u6362" }, /* @__PURE__ */ import_react10.default.createElement("div", { className: "addr", style: { gap: 6 } }, input("auth.token", { spellCheck: false }), /* @__PURE__ */ import_react10.default.createElement(
      "button",
      {
        className: "btn btn--sm",
        type: "button",
        disabled: tokenBusy,
        title: "\u91CD\u65B0\u968F\u673A\u751F\u6210\u4E3B\u7BA1\u7406\u4EE4\u724C\uFF0C\u65E7\u7BA1\u7406\u5730\u5740\u7ACB\u5373\u5931\u6548",
        onClick: rotateAdminToken
      },
      "\u8F6E\u6362\u4E3B\u4EE4\u724C"
    ))), /* @__PURE__ */ import_react10.default.createElement(Field, { label: "\u65E5\u5FD7\u73AF", sub: "RING" }, input("log.ring", { type: "number" })), /* @__PURE__ */ import_react10.default.createElement("p", { className: "hint" }, "\u4E3B\u4EE4\u724C\u62E5\u6709\u5168\u90E8\u7BA1\u7406\u6743\uFF0C\u4EC5\u4F9B\u81EA\u5DF1\u4F7F\u7528\uFF1B\u5206\u4EAB\u7ED9\u4ED6\u4EBA\u6216\u5916\u63A5\u8BBE\u5907\u8BF7\u4F7F\u7528\u4E0B\u65B9\u53EA\u8BFB\u4EE4\u724C\u3002"))),
    /* @__PURE__ */ import_react10.default.createElement("div", { key: "rt-box", className: "voicemap-box" }, /* @__PURE__ */ import_react10.default.createElement("div", { className: "ds-hd" }, /* @__PURE__ */ import_react10.default.createElement("span", { className: "silk" }, "READ-ONLY SHARE TOKENS ", /* @__PURE__ */ import_react10.default.createElement("b", null, "\u53EA\u8BFB\u5206\u4EAB\u4EE4\u724C\uFF08\u6309\u8BBE\u5907\u7B7E\u53D1 / \u53EF\u5355\u72EC\u540A\u9500\uFF09")), /* @__PURE__ */ import_react10.default.createElement("span", { className: "cn" }, `${shareTokensList.length} \u4E2A\u6709\u6548`)), /* @__PURE__ */ import_react10.default.createElement("div", { className: "addr", style: { gap: 6 } }, /* @__PURE__ */ import_react10.default.createElement(
      "input",
      {
        className: "input",
        value: newReadLabel,
        placeholder: "\u8BBE\u5907\u6216\u670B\u53CB\u5907\u6CE8\u540D\uFF08\u5982\uFF1A\u670B\u53CB iPhone / \u5907\u7528\u5B89\u5353\uFF09",
        onChange: (e3) => setNewReadLabel(e3.target.value)
      }
    ), /* @__PURE__ */ import_react10.default.createElement("button", { className: "btn btn--sm btn--tape", type: "button", disabled: tokenBusy, onClick: issueReadToken }, tokenBusy ? "\u5904\u7406\u4E2D\u2026" : "+ \u7B7E\u53D1\u53EA\u8BFB\u4EE4\u724C")), lastCreatedRead?.token ? /* @__PURE__ */ import_react10.default.createElement("div", { className: "https-warn", style: { marginTop: 4 } }, `\u65B0\u7B7E\u53D1\u300C${lastCreatedRead.label}\u300D\u4EE4\u724C\uFF1A`, /* @__PURE__ */ import_react10.default.createElement("code", null, lastCreatedRead.token)) : null, shareTokensList.length === 0 ? /* @__PURE__ */ import_react10.default.createElement("div", { className: "dirty-empty", style: { marginTop: 4 } }, "\u6682\u65E0\u53EA\u8BFB\u4EE4\u724C \xB7 \u53EA\u8BFB\u4EE4\u724C\u53EF\u542C\u4E66\u53CA\u8C03\u7528 OpenAI \u5408\u6210\u7AEF\u70B9\uFF0C\u8BBF\u95EE /api/* \u4E00\u5F8B\u8FD4\u56DE 403") : /* @__PURE__ */ import_react10.default.createElement("div", { className: "ref-list", style: { marginTop: 6 } }, shareTokensList.map((rt) => /* @__PURE__ */ import_react10.default.createElement("div", { key: rt.id, className: "ref-row", style: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 } }, /* @__PURE__ */ import_react10.default.createElement("div", { style: { minWidth: 0 } }, /* @__PURE__ */ import_react10.default.createElement("b", null, rt.label), /* @__PURE__ */ import_react10.default.createElement("span", { className: "mono ref-meta", style: { marginLeft: 8 } }, rt.id, " \xB7 \u4EC5\u6717\u8BFB/OpenAI (403 on /api/*)")), /* @__PURE__ */ import_react10.default.createElement("div", { style: { display: "flex", gap: 6, flex: "none" } }, /* @__PURE__ */ import_react10.default.createElement(
      "button",
      {
        className: "btn btn--sm",
        type: "button",
        onClick: async () => {
          const ok = await writeClipboard(rt.bestJsonUrl || rt.jsonUrl || rt.token);
          showToast(ok ? `\u5DF2\u590D\u5236\u300C${rt.label}\u300D\u53EA\u8BFB\u5BFC\u5165\u5730\u5740` : "\u590D\u5236\u88AB\u6D4F\u89C8\u5668\u62E6\u622A");
        }
      },
      "\u590D\u5236\u5206\u4EAB\u5730\u5740"
    ), /* @__PURE__ */ import_react10.default.createElement(
      "button",
      {
        className: "btn btn--sm",
        type: "button",
        disabled: tokenBusy,
        onClick: () => revokeReadToken(rt.id, rt.label)
      },
      "\u540A\u9500"
    ))))))
  ], { wide: true })), /* @__PURE__ */ import_react10.default.createElement("aside", { className: "apply", "aria-label": "\u751F\u6548\u4E0E\u6539\u52A8" }, /* @__PURE__ */ import_react10.default.createElement("div", null, /* @__PURE__ */ import_react10.default.createElement("h2", null, "\u751F\u6548"), /* @__PURE__ */ import_react10.default.createElement("div", { className: "sub" }, "Apply \xB7 Draft")), /* @__PURE__ */ import_react10.default.createElement("div", { className: "apply-sum", id: "appliedSummary" }, /* @__PURE__ */ import_react10.default.createElement(Rowx, { k: "\u6E32\u67D3\u6765\u6E90", v: provider }), /* @__PURE__ */ import_react10.default.createElement(Rowx, { k: "\u76D1\u542C", v: `${d3["server.host"] || "\u2014"}:${d3["server.port"] || "\u2014"}` }), /* @__PURE__ */ import_react10.default.createElement(Rowx, { k: "\u6A21\u578B", v: provider === "openai" ? String(d3["upstream.openai.model"] || "\u2014") : String(d3["upstream.model"] || "\u2014") }), /* @__PURE__ */ import_react10.default.createElement(Rowx, { k: "\u89C4\u5219", v: d3["textRules.enabled"] ? `${(d3["textRules.items"] || []).length} \u6761` : "\u5DF2\u5173\u95ED" }), /* @__PURE__ */ import_react10.default.createElement(Rowx, { k: "\u6BCF\u6BB5 / \u5E76\u53D1", v: `${d3["synth.maxSegmentChars"] || "\u2014"} \u5B57 / ${d3["synth.concurrency"] || "\u2014"} \u8DEF` }), /* @__PURE__ */ import_react10.default.createElement(
    Rowx,
    {
      k: "\u8F93\u51FA\u683C\u5F0F",
      v: (d3["audio.format"] || "wav") === "wav" ? "WAV" : `${String(d3["audio.format"]).toUpperCase()} \xB7 ${d3["audio.bitrate"] || "64"}k`
    }
  ), /* @__PURE__ */ import_react10.default.createElement(Rowx, { k: "\u9650\u901F", v: `${d3["limits.rpm"] || "\u2014"} \u6B21/\u5206` }), /* @__PURE__ */ import_react10.default.createElement(Rowx, { k: "\u7F13\u5B58", v: `${d3["cache.maxEntries"] || "\u2014"} \u6761 \xB7 TTL ${ttlText(d3["cache.ttlSeconds"])}` }), /* @__PURE__ */ import_react10.default.createElement(Rowx, { k: "OpenAI \u7AEF\u70B9", v: d3["openaiServer.enabled"] ? "\u5DF2\u5F00\u542F" : "\u5DF2\u5173\u95ED" }), /* @__PURE__ */ import_react10.default.createElement(
    Rowx,
    {
      k: "\u5BF9\u5916\u5730\u5740",
      v: d3["server.publicUrl"] || d3["tunnel.kvSync.publicRelayUrl"] || "\u672A\u8BBE\u7F6E",
      title: d3["server.publicUrl"] || d3["tunnel.kvSync.publicRelayUrl"] || ""
    }
  )), /* @__PURE__ */ import_react10.default.createElement("div", { className: "rowx" }, /* @__PURE__ */ import_react10.default.createElement("span", null, "\u6700\u540E\u751F\u6548"), /* @__PURE__ */ import_react10.default.createElement("b", { id: "appliedAt" }, savedAt || "\u968F\u5FEB\u7167\u88C5\u8F7D")), /* @__PURE__ */ import_react10.default.createElement("div", { className: "dirty-wrap" }, /* @__PURE__ */ import_react10.default.createElement("div", { className: "ins-hd", style: { paddingTop: 4, marginBottom: 0 } }, /* @__PURE__ */ import_react10.default.createElement("span", { className: "silk" }, "UNSAVED ", /* @__PURE__ */ import_react10.default.createElement("b", null, "\u672A\u4FDD\u5B58\u6539\u52A8")), /* @__PURE__ */ import_react10.default.createElement("span", { className: "cn" }, `${changes.length} \u9879`)), changes.length === 0 ? /* @__PURE__ */ import_react10.default.createElement("div", { className: "dirty-empty" }, "\u65E0\u672A\u4FDD\u5B58\u6539\u52A8", /* @__PURE__ */ import_react10.default.createElement("br", null), "\u8349\u7A3F\u4E0E\u8FD0\u884C\u914D\u7F6E\u4E00\u81F4") : /* @__PURE__ */ import_react10.default.createElement("ul", { className: "dirty-list" }, changes.map((c2) => /* @__PURE__ */ import_react10.default.createElement("li", { key: c2.path }, /* @__PURE__ */ import_react10.default.createElement("b", null, c2.label), "\uFF1A", fmtDirtyVal(c2.from), " \u2192 ", fmtDirtyVal(c2.to))))), /* @__PURE__ */ import_react10.default.createElement("p", { className: "hint" }, "\u6240\u6709\u5BC6\u94A5\u53EA\u5728\u672C\u673A\u670D\u52A1\u7AEF\u4FDD\u5B58\uFF1B\u53EF\u70B9\u51FB\u5404\u5904\u300C\u8BD5\u542C\u5F53\u524D\u8349\u7A3F\u300D\u5148\u884C\u9A8C\u8BC1\u3002"))), /* @__PURE__ */ import_react10.default.createElement("div", { className: `savebar${changes.length ? " is-dirty" : ""}${saving ? " is-saving" : ""}`, id: "savebar" }, /* @__PURE__ */ import_react10.default.createElement("div", { className: "sb-msg" }, /* @__PURE__ */ import_react10.default.createElement("span", { className: "dot" }), /* @__PURE__ */ import_react10.default.createElement("span", null, saving ? "\u4FDD\u5B58\u4E2D\u2026" : changes.length ? `\u6709 ${changes.length} \u9879\u672A\u4FDD\u5B58\u7684\u4FEE\u6539` : savedAt ? `\u5DF2\u751F\u6548 \xB7 ${savedAt}` : "\u65E0\u672A\u4FDD\u5B58\u6539\u52A8")), /* @__PURE__ */ import_react10.default.createElement("span", { className: "sb-hint" }, changes.length ? "Ctrl/\u2318+S \u4FDD\u5B58\u5E76\u751F\u6548\uFF1B\u8FD8\u539F\u4E22\u5F03\u8349\u7A3F" : "\u6539\u52A8\u5148\u843D\u5728\u8349\u7A3F\uFF1B\u4FDD\u5B58\u540E\u5199\u56DE\u8FD0\u884C\u914D\u7F6E\u5E76\u5237\u65B0\u8BFB\u6570"), /* @__PURE__ */ import_react10.default.createElement("span", { className: "sb-spacer" }), /* @__PURE__ */ import_react10.default.createElement("button", { className: "btn", type: "button", "data-action": "export-config", onClick: onExportConfig }, "\u5BFC\u51FA\u914D\u7F6E"), /* @__PURE__ */ import_react10.default.createElement("button", { className: "btn", type: "button", "data-action": "revert", id: "btnRevert", disabled: saving || changes.length === 0, onClick: onRevert }, "\u8FD8\u539F"), /* @__PURE__ */ import_react10.default.createElement("button", { className: "btn btn--tape", type: "button", "data-action": "save-config", id: "btnSave", disabled: saving || changes.length === 0, onClick: onSave }, saving ? "\u4FDD\u5B58\u4E2D\u2026" : "\u4FDD\u5B58\u5E76\u751F\u6548")));
}

// client/components/SetupDrawer.jsx
var import_react11 = __toESM(require("react"), 1);
function isConfigIncomplete(provider, config, setupSummary) {
  if (provider === "mimo") return !(config?.upstream?.keys?.length > 0);
  if (provider === "openai") {
    const oa = config?.upstream?.openai || {};
    return !oa.baseUrl || !oa.model || !oa.narratorVoice;
  }
  if (provider === "local" || provider === "hybrid") {
    const loc = config?.upstream?.local || {};
    if (!loc.pythonPath || !loc.modelPath) return true;
    if (setupSummary && !setupSummary.readyForLocal) return true;
  }
  return false;
}
function SetupBanner({
  setupSummary,
  config,
  doctorReport,
  dismissed,
  onDismiss,
  onOpenDrawer
}) {
  if (dismissed || !config) return null;
  const provider = config?.upstream?.provider || "mimo";
  const taskRunning = setupSummary?.state === "running";
  const taskFailed = setupSummary?.state === "failed";
  const doctorFailed = doctorReport && doctorReport.ok === false;
  const incomplete = isConfigIncomplete(provider, config, setupSummary);
  if (!taskRunning && !taskFailed && !doctorFailed && !incomplete) return null;
  let headline = "\u5F53\u524D\u5F15\u64CE\u5C1A\u672A\u5B8C\u6210\u521D\u59CB\u5316\u914D\u7F6E";
  if (taskRunning) {
    headline = `\u672C\u5730\u5B89\u88C5\u4EFB\u52A1\u8FD0\u884C\u4E2D\uFF1A${setupSummary.progressText || setupSummary.task}`;
  } else if (taskFailed) {
    headline = "\u4E0A\u4E00\u6B21\u672C\u5730\u5B89\u88C5/\u4E0B\u8F7D\u4EFB\u52A1\u5931\u8D25\uFF0C\u53EF\u6253\u5F00\u5411\u5BFC\u67E5\u770B\u65E5\u5FD7\u5E76\u91CD\u8BD5";
  } else if (doctorFailed) {
    headline = `\u4F53\u68C0\u53D1\u73B0 ${doctorReport.summary?.fail || 1} \u9879\u5F02\u5E38\uFF0C\u5EFA\u8BAE\u6253\u5F00\u5411\u5BFC\u6392\u67E5`;
  } else if (provider === "mimo") {
    headline = "MiMo \u4E91\u7AEF\u5C1A\u672A\u586B\u5199 API Key \u2014 \u6253\u5F00\u5411\u5BFC\u4F53\u68C0\u6216\u5207\u5230\u6E32\u67D3\u8BBE\u7F6E\u586B\u5199";
  } else if (provider === "openai") {
    headline = "OpenAI \u517C\u5BB9\u5F15\u64CE\u7F3A\u5C11\u63A5\u53E3\u5730\u5740\u3001\u6A21\u578B\u6216\u97F3\u8272";
  } else if (setupSummary && !setupSummary.platformSupported) {
    headline = "\u5F53\u524D\u4E3B\u673A\u975E Apple Silicon\uFF0C\u4E0D\u652F\u6301\u672C\u5730 MLX\uFF1B\u8BF7\u5728\u8BBE\u7F6E\u5207\u5230 MiMo \u6216 OpenAI \u517C\u5BB9";
  } else {
    headline = "\u672C\u5730 Qwen3-TTS \u5C1A\u672A\u63A2\u6D4B\u5230\u5B8C\u6574 Python / \u58F0\u7801\u5668\u6A21\u578B\uFF0C\u53EF\u70B9\u5F00\u5411\u5BFC\u4E00\u952E\u5B89\u88C5";
  }
  return /* @__PURE__ */ import_react11.default.createElement("div", { className: `setup-banner${taskFailed || doctorFailed ? " is-warn" : ""}`, role: "region", "aria-label": "\u521D\u59CB\u5316\u5F15\u5BFC" }, /* @__PURE__ */ import_react11.default.createElement("span", { className: "sb-dot" }), /* @__PURE__ */ import_react11.default.createElement("span", { className: "sb-txt" }, headline), /* @__PURE__ */ import_react11.default.createElement("div", { className: "sb-acts" }, /* @__PURE__ */ import_react11.default.createElement("button", { className: "btn btn--sm btn--tape", type: "button", onClick: onOpenDrawer }, taskRunning ? "\u67E5\u770B\u5B89\u88C5\u8FDB\u5EA6" : "\u6253\u5F00\u5411\u5BFC\u4E0E\u4F53\u68C0"), /* @__PURE__ */ import_react11.default.createElement("button", { className: "btn btn--sm btn--ghost", type: "button", onClick: onDismiss }, "\u6536\u8D77")));
}
function StatusPill({ status, text }) {
  const cls = status === "pass" ? "tag tape" : status === "warn" ? "tag cloud" : "tag grease";
  return /* @__PURE__ */ import_react11.default.createElement("span", { className: cls }, text);
}
function SetupDrawer({
  open,
  onClose,
  onApplyPatch,
  onRefreshState,
  onDoctorReport,
  showToast
}) {
  const [detect, setDetect] = (0, import_react11.useState)(null);
  const [detecting, setDetecting] = (0, import_react11.useState)(false);
  const [setup, setSetup] = (0, import_react11.useState)(null);
  const [lines, setLines] = (0, import_react11.useState)([]);
  const [hfEndpoint, setHfEndpoint] = (0, import_react11.useState)("https://hf-mirror.com");
  const [doctor, setDoctor] = (0, import_react11.useState)(null);
  const [checkNetwork, setCheckNetwork] = (0, import_react11.useState)(false);
  const [docBusy, setDocBusy] = (0, import_react11.useState)(false);
  const [applying, setApplying] = (0, import_react11.useState)(false);
  const cursorRef = (0, import_react11.useRef)(0);
  const logBoxRef = (0, import_react11.useRef)(null);
  const runDetect = async () => {
    setDetecting(true);
    try {
      const res = await fetchEnvDetectApi();
      setDetect(res);
    } catch (err) {
      showToast(`\u73AF\u5883\u63A2\u6D4B\u5931\u8D25\uFF1A${String(err?.message || err)}`);
    } finally {
      setDetecting(false);
    }
  };
  const syncSetupStatus = async (reset = false) => {
    try {
      const since = reset ? 0 : cursorRef.current;
      const st = await fetchSetupStatusApi(since);
      setSetup(st);
      if (reset) {
        setLines(st.lines || []);
      } else if (Array.isArray(st.lines) && st.lines.length) {
        setLines((prev) => [...prev, ...st.lines].slice(-800));
      }
      if (st.nextCursor != null) cursorRef.current = st.nextCursor;
      if (st.detect) setDetect(st.detect);
      return st;
    } catch {
      return null;
    }
  };
  (0, import_react11.useEffect)(() => {
    if (!open) return void 0;
    runDetect();
    syncSetupStatus(true);
    const onEsc = (e3) => {
      if (e3.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  }, [open]);
  (0, import_react11.useEffect)(() => {
    if (!open || setup?.state !== "running") return void 0;
    const timer = setInterval(async () => {
      const st = await syncSetupStatus(false);
      if (st && st.state !== "running") {
        await runDetect();
        await onRefreshState?.();
      }
    }, 800);
    return () => clearInterval(timer);
  }, [open, setup?.state]);
  (0, import_react11.useEffect)(() => {
    if (logBoxRef.current) {
      logBoxRef.current.scrollTop = logBoxRef.current.scrollHeight;
    }
  }, [lines.length]);
  if (!open) return null;
  const startTask = async (task) => {
    try {
      cursorRef.current = 0;
      setLines([]);
      const st = await startSetupTaskApi({ task, hfEndpoint });
      setSetup(st);
      setLines(st.lines || []);
      cursorRef.current = st.nextCursor || 0;
      showToast(task === "install-local" ? "\u5DF2\u542F\u52A8\u5168\u91CF\u672C\u5730\u5B89\u88C5\u4EFB\u52A1" : "\u5DF2\u542F\u52A8\u6A21\u578B\u4E0B\u8F7D/\u6821\u9A8C\u4EFB\u52A1");
    } catch (err) {
      showToast(String(err?.message || err));
    }
  };
  const cancelTask = async () => {
    try {
      const st = await cancelSetupTaskApi();
      setSetup(st);
      showToast("\u5DF2\u8BF7\u6C42\u7EC8\u6B62\u5B89\u88C5\u4EFB\u52A1");
    } catch (err) {
      showToast(String(err?.message || err));
    }
  };
  const runDoc = async () => {
    setDocBusy(true);
    try {
      const res = await runDoctorApi(checkNetwork);
      setDoctor(res);
      onDoctorReport?.(res);
      showToast(res.headline || "\u4F53\u68C0\u5B8C\u6210");
    } catch (err) {
      showToast(`\u4F53\u68C0\u5931\u8D25\uFF1A${String(err?.message || err)}`);
    } finally {
      setDocBusy(false);
    }
  };
  const applyDetected = async () => {
    if (!detect?.suggestedPatch) return;
    setApplying(true);
    try {
      await onApplyPatch(detect.suggestedPatch);
      showToast("\u5DF2\u4E00\u952E\u586B\u5165\u63A2\u6D4B\u8DEF\u5F84\u4E0E\u5185\u7F6E\u65C1\u767D\u53C2\u8003\u97F3");
    } catch (err) {
      showToast(`\u56DE\u586B\u5931\u8D25\uFF1A${String(err?.message || err)}`);
    } finally {
      setApplying(false);
    }
  };
  const running = setup?.state === "running";
  const appleOk = Boolean(detect?.platform?.isAppleSilicon);
  const pct = setup?.totalSteps ? Math.min(100, Math.round((setup.step || 0) / setup.totalSteps * 100)) : 0;
  return /* @__PURE__ */ import_react11.default.createElement("div", { className: "mtt-modal-backdrop", role: "dialog", "aria-modal": "true", "aria-label": "\u521D\u59CB\u5316\u5411\u5BFC\u4E0E\u5728\u7EBF\u4F53\u68C0", onClick: onClose }, /* @__PURE__ */ import_react11.default.createElement("div", { className: "mtt-drawer", onClick: (e3) => e3.stopPropagation() }, /* @__PURE__ */ import_react11.default.createElement("div", { className: "drawer-hd" }, /* @__PURE__ */ import_react11.default.createElement("div", null, /* @__PURE__ */ import_react11.default.createElement("span", { className: "silk" }, "SETUP & DOCTOR ", /* @__PURE__ */ import_react11.default.createElement("b", null, "\u73AF\u5883\u63A2\u6D4B \xB7 \u6258\u7BA1\u5B89\u88C5 \xB7 \u5728\u7EBF\u4F53\u68C0"))), /* @__PURE__ */ import_react11.default.createElement("button", { className: "btn btn--sm", type: "button", onClick: onClose }, "\u5173\u95ED (ESC)")), /* @__PURE__ */ import_react11.default.createElement("div", { className: "drawer-body" }, /* @__PURE__ */ import_react11.default.createElement("section", { className: "drawer-sec" }, /* @__PURE__ */ import_react11.default.createElement("div", { className: "ds-hd" }, /* @__PURE__ */ import_react11.default.createElement("b", null, "1. \u73AF\u5883\u81EA\u52A8\u63A2\u6D4B"), /* @__PURE__ */ import_react11.default.createElement("div", { style: { display: "flex", gap: 6 } }, /* @__PURE__ */ import_react11.default.createElement("button", { className: "btn btn--sm", type: "button", disabled: detecting, onClick: runDetect }, detecting ? "\u63A2\u6D4B\u4E2D\u2026" : "\u91CD\u65B0\u63A2\u6D4B"), /* @__PURE__ */ import_react11.default.createElement(
    "button",
    {
      className: "btn btn--sm btn--tape",
      type: "button",
      disabled: !detect?.suggestedPatch || applying,
      onClick: applyDetected
    },
    applying ? "\u5199\u5165\u4E2D\u2026" : detect?.readyForLocal ? "\u4E00\u952E\u586B\u5165\u5E76\u5207\u6362\u672C\u5730" : "\u586B\u5165\u5DF2\u63A2\u6D4B\u8DEF\u5F84"
  ))), detect ? /* @__PURE__ */ import_react11.default.createElement("div", { className: "detect-grid" }, /* @__PURE__ */ import_react11.default.createElement("div", { className: "dg-item" }, /* @__PURE__ */ import_react11.default.createElement("span", null, "\u82AF\u7247\u67B6\u6784"), /* @__PURE__ */ import_react11.default.createElement(
    StatusPill,
    {
      status: appleOk ? "pass" : "fail",
      text: `${detect.platform?.os}/${detect.platform?.arch}${appleOk ? " \xB7 MLX \u652F\u6301" : " \xB7 \u975E Apple Silicon"}`
    }
  )), /* @__PURE__ */ import_react11.default.createElement("div", { className: "dg-item" }, /* @__PURE__ */ import_react11.default.createElement("span", null, "Python / venv"), /* @__PURE__ */ import_react11.default.createElement(
    StatusPill,
    {
      status: detect.venv?.exists && detect.venv?.mlxAudioOk ? "pass" : "warn",
      text: detect.venv?.mlxAudioOk ? `${detect.venv.version || "venv"} + mlx_audio` : detect.venv?.exists ? "\u7F3A mlx_audio" : "\u672A\u5EFA venv"
    }
  )), /* @__PURE__ */ import_react11.default.createElement("div", { className: "dg-item" }, /* @__PURE__ */ import_react11.default.createElement("span", null, "\u6A21\u578B\u4E0E\u58F0\u7801\u5668"), /* @__PURE__ */ import_react11.default.createElement(
    StatusPill,
    {
      status: detect.model?.valid ? "pass" : "fail",
      text: detect.model?.valid ? `\u4E3B ${detect.model.mainMb}MB \xB7 \u58F0\u7801\u5668 ${detect.model.vocoderMb}MB` : detect.model?.error || "\u672A\u4E0B\u8F7D"
    }
  )), /* @__PURE__ */ import_react11.default.createElement("div", { className: "dg-item" }, /* @__PURE__ */ import_react11.default.createElement("span", null, "\u5185\u7F6E\u53C2\u8003\u97F3"), /* @__PURE__ */ import_react11.default.createElement(
    StatusPill,
    {
      status: detect.refs?.builtinAvailableCount > 0 ? "pass" : "warn",
      text: `${detect.refs?.builtinAvailableCount || 0}/${detect.refs?.builtinCount || 0} \u4E2A\u53EF\u7528`
    }
  ))) : /* @__PURE__ */ import_react11.default.createElement("div", { className: "hint" }, "\u6B63\u5728\u8BFB\u53D6\u73AF\u5883\u4FE1\u606F\u2026")), /* @__PURE__ */ import_react11.default.createElement("section", { className: "drawer-sec" }, /* @__PURE__ */ import_react11.default.createElement("div", { className: "ds-hd" }, /* @__PURE__ */ import_react11.default.createElement("b", null, "2. \u5168 UI \u6258\u7BA1\u5B89\u88C5\u672C\u5730 Qwen3-TTS\uFF08macOS Apple Silicon\uFF09"), /* @__PURE__ */ import_react11.default.createElement("div", { className: "seg", role: "group", "aria-label": "\u6A21\u578B\u4E0B\u8F7D\u6E90" }, [
    ["https://hf-mirror.com", "\u56FD\u5185\u955C\u50CF hf-mirror"],
    ["https://huggingface.co", "HuggingFace \u5B98\u65B9"]
  ].map(([val, label]) => /* @__PURE__ */ import_react11.default.createElement(
    "button",
    {
      key: val,
      type: "button",
      className: "seg-key",
      "aria-pressed": String(hfEndpoint === val),
      disabled: running,
      onClick: () => setHfEndpoint(val)
    },
    label
  )))), /* @__PURE__ */ import_react11.default.createElement("div", { style: { display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" } }, /* @__PURE__ */ import_react11.default.createElement(
    "button",
    {
      className: "btn btn--sm btn--tape",
      type: "button",
      disabled: running || !appleOk,
      title: appleOk ? "\u5B89\u88C5 venv\u3001\u4F9D\u8D56\u5E76\u4E0B\u8F7D 1.9GB MLX \u6A21\u578B" : "\u4EC5\u652F\u6301 macOS Apple Silicon",
      onClick: () => startTask("install-local")
    },
    running && setup?.task === "install-local" ? "\u5B89\u88C5\u8FD0\u884C\u4E2D\u2026" : "\u4E00\u952E\u5B89\u88C5\u672C\u5730\u5F15\u64CE"
  ), /* @__PURE__ */ import_react11.default.createElement(
    "button",
    {
      className: "btn btn--sm",
      type: "button",
      disabled: running || !appleOk,
      onClick: () => startTask("download-model")
    },
    running && setup?.task === "download-model" ? "\u4E0B\u8F7D\u4E2D\u2026" : "\u4EC5\u4E0B\u8F7D / \u4FEE\u590D\u6A21\u578B\u4E0E\u58F0\u7801\u5668"
  ), running ? /* @__PURE__ */ import_react11.default.createElement("button", { className: "btn btn--sm", type: "button", onClick: cancelTask }, "\u53D6\u6D88\u4EFB\u52A1") : null, /* @__PURE__ */ import_react11.default.createElement("span", { className: "mono", style: { marginLeft: "auto", fontSize: 11, color: "var(--ink-2)" } }, setup?.state && setup.state !== "idle" ? `[${setup.state}] ${setup.step || 0}/${setup.totalSteps || 0} \xB7 ${setup.progressText || ""}` : "\u7A7A\u95F2 \xB7 \u767D\u540D\u5355\u811A\u672C\u53D7\u63A7\u6267\u884C")), setup && setup.state !== "idle" ? /* @__PURE__ */ import_react11.default.createElement("div", { className: "setup-prog", "aria-label": "\u5B89\u88C5\u8FDB\u5EA6" }, /* @__PURE__ */ import_react11.default.createElement("i", { style: { width: `${pct}%` } })) : null, /* @__PURE__ */ import_react11.default.createElement("pre", { className: "code setup-log", id: "setupLogs", ref: logBoxRef }, lines.length ? lines.map((l3) => l3.line).join("\n") : "\u70B9\u51FB\u4E0A\u65B9\u6309\u94AE\u5373\u53EF\u5728\u63A7\u5236\u53F0\u5185\u67E5\u770B\u5B9E\u65F6\u5B89\u88C5/\u4E0B\u8F7D\u65E5\u5FD7\u3002")), /* @__PURE__ */ import_react11.default.createElement("section", { className: "drawer-sec" }, /* @__PURE__ */ import_react11.default.createElement("div", { className: "ds-hd" }, /* @__PURE__ */ import_react11.default.createElement("b", null, "3. \u5728\u7EBF\u4F53\u68C0\uFF08Doctor\uFF09"), /* @__PURE__ */ import_react11.default.createElement("div", { style: { display: "flex", gap: 8, alignItems: "center" } }, /* @__PURE__ */ import_react11.default.createElement("label", { className: "mono", style: { display: "flex", alignItems: "center", gap: 4, fontSize: 11, cursor: "pointer" } }, /* @__PURE__ */ import_react11.default.createElement("input", { type: "checkbox", checked: checkNetwork, onChange: (e3) => setCheckNetwork(e3.target.checked) }), "\u540C\u65F6\u63A2\u6D4B\u4E0A\u6E38\u8FDE\u901A\u6027 (5s)"), /* @__PURE__ */ import_react11.default.createElement("button", { className: "btn btn--sm btn--tape", type: "button", disabled: docBusy, onClick: runDoc }, docBusy ? "\u4F53\u68C0\u4E2D\u2026" : "\u8FD0\u884C\u4F53\u68C0"))), doctor ? /* @__PURE__ */ import_react11.default.createElement("div", { className: "doctor-list" }, /* @__PURE__ */ import_react11.default.createElement("div", { className: "mono", style: { fontSize: 11, marginBottom: 4 } }, "\u7ED3\u679C\uFF1A", /* @__PURE__ */ import_react11.default.createElement("b", null, doctor.headline), "\uFF08\u901A\u8FC7 ", doctor.summary?.pass || 0, " \xB7 \u63D0\u793A ", doctor.summary?.warn || 0, " \xB7 \u5F02\u5E38 ", doctor.summary?.fail || 0, "\uFF09"), (doctor.checks || []).map((c2) => /* @__PURE__ */ import_react11.default.createElement("div", { key: c2.id, className: `doc-row ${c2.status}` }, /* @__PURE__ */ import_react11.default.createElement("span", { className: "doc-badge" }, c2.status === "pass" ? "\u2713" : c2.status === "warn" ? "!" : "\u2715"), /* @__PURE__ */ import_react11.default.createElement("b", { className: "doc-lbl" }, c2.label), /* @__PURE__ */ import_react11.default.createElement("div", { className: "doc-msg" }, /* @__PURE__ */ import_react11.default.createElement("span", null, c2.message), c2.hint ? /* @__PURE__ */ import_react11.default.createElement("small", null, c2.hint) : null)))) : /* @__PURE__ */ import_react11.default.createElement("div", { className: "hint" }, "\u68C0\u67E5\u7AEF\u53E3\u76D1\u542C\u3001\u5C40\u57DF\u7F51\u5730\u5740\u3001\u58F0\u7801\u5668\u6743\u91CD\uFF08600MB+\uFF09\u3001\u53C2\u8003\u97F3\u6587\u672C\u4E0E API \u8FDE\u901A\u6027\u3002")))));
}

// client/components/StatusBar.jsx
var import_react12 = __toESM(require("react"), 1);
function StatusBar({ running, paused, error, lastSync, pausedAt, version, port, provider, hint }) {
  const dotCls = error ? "dot warn" : !running ? "dot off" : paused ? "dot warn" : "dot";
  const liveText = error ? "ERROR \xB7 \u8BFB\u4E0D\u5230\u5BBF\u4E3B\u63A5\u53E3" : !running ? "STOPPED \xB7 \u65E0\u5B9E\u65F6\u6570\u636E" : paused ? `PAUSED \xB7 \u6570\u636E\u51BB\u7ED3 ${clock(pausedAt || lastSync)}` : "LIVE \xB7 /api/state";
  return /* @__PURE__ */ import_react12.default.createElement("footer", { className: "statusbar", "aria-label": "\u8D70\u5E26\u72B6\u6001" }, /* @__PURE__ */ import_react12.default.createElement("span", { className: "sb-l" }, /* @__PURE__ */ import_react12.default.createElement("span", { className: dotCls }), /* @__PURE__ */ import_react12.default.createElement("span", null, liveText)), /* @__PURE__ */ import_react12.default.createElement("span", { className: "sb-hint", title: error || hint }, error ? `\u8BFB\u4E0D\u5230\u5BBF\u4E3B\u63A5\u53E3\uFF1A${error}` : hint), /* @__PURE__ */ import_react12.default.createElement("span", { className: "sb-r" }, /* @__PURE__ */ import_react12.default.createElement("span", null, `\u5FEB\u7167 ${lastSync ? clock(lastSync) : "\u2014"}`), /* @__PURE__ */ import_react12.default.createElement("span", { className: "sep" }, "|"), /* @__PURE__ */ import_react12.default.createElement("span", null, `v${version || "0.3.0"}`), /* @__PURE__ */ import_react12.default.createElement("span", { className: "sep" }, "|"), /* @__PURE__ */ import_react12.default.createElement("span", null, `M-${port || "\u2014"}`), /* @__PURE__ */ import_react12.default.createElement("span", { className: "sep" }, "|"), /* @__PURE__ */ import_react12.default.createElement("span", { className: "opt" }, `${PROVIDER_CN[provider] || provider || "\u2014"} \xB7 \u540C\u6E90\u8F6E\u8BE2 4s`)));
}

// client/components/TimelineView.jsx
var import_react13 = __toESM(require("react"), 1);
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
      /* @__PURE__ */ import_react13.default.createElement(HeadRow, { key: "w", k: "\u672C\u7A97", v: /* @__PURE__ */ import_react13.default.createElement("b", null, "\u2014") }),
      /* @__PURE__ */ import_react13.default.createElement(HeadRow, { key: "a", k: "\u97F3\u9891\u603B\u957F", v: /* @__PURE__ */ import_react13.default.createElement("b", null, "\u2014") }),
      /* @__PURE__ */ import_react13.default.createElement(HeadRow, { key: "t", k: "\u4ECA\u65E5", v: /* @__PURE__ */ import_react13.default.createElement("b", null, "\u2014") }),
      /* @__PURE__ */ import_react13.default.createElement(HeadRow, { key: "c", k: "\u7F13\u5B58", v: /* @__PURE__ */ import_react13.default.createElement("b", null, "\u2014") })
    ];
    latRows = [
      /* @__PURE__ */ import_react13.default.createElement(HeadRow, { key: "avg", k: "\u5747\u503C", v: /* @__PURE__ */ import_react13.default.createElement("b", null, "\u2014") }),
      /* @__PURE__ */ import_react13.default.createElement(HeadRow, { key: "p95", k: "p95", v: /* @__PURE__ */ import_react13.default.createElement("b", null, "\u2014") }),
      /* @__PURE__ */ import_react13.default.createElement(HeadRow, { key: "max", k: "\u6700\u6162", v: /* @__PURE__ */ import_react13.default.createElement("b", null, "\u2014") })
    ];
  } else {
    mainRows = compact ? [
      /* @__PURE__ */ import_react13.default.createElement(HeadRow, { key: "sc", k: "\u6BB5/\u5B57", v: /* @__PURE__ */ import_react13.default.createElement("b", null, `${items.length} / ${fmtInt(totalChars)}`) }),
      /* @__PURE__ */ import_react13.default.createElement(HeadRow, { key: "au", k: "\u97F3\u9891", v: /* @__PURE__ */ import_react13.default.createElement("b", null, mmssPad(totalAudio)) })
    ] : [
      /* @__PURE__ */ import_react13.default.createElement(HeadRow, { key: "sc", k: "\u672C\u7A97 \u6BB5 / \u5B57", v: /* @__PURE__ */ import_react13.default.createElement("b", null, `${items.length} / ${fmtInt(totalChars)}`) }),
      /* @__PURE__ */ import_react13.default.createElement(HeadRow, { key: "au", k: "\u97F3\u9891\u603B\u957F", v: /* @__PURE__ */ import_react13.default.createElement("b", null, mmssPad(totalAudio)) }),
      /* @__PURE__ */ import_react13.default.createElement(HeadRow, { key: "td", k: "\u4ECA\u65E5", v: /* @__PURE__ */ import_react13.default.createElement("b", null, `${fmtInt(today.segments)} \u6BB5 \xB7 ${hm(today.seconds)}`) }),
      /* @__PURE__ */ import_react13.default.createElement(HeadRow, { key: "ch", k: "\u7F13\u5B58\u547D\u4E2D", v: /* @__PURE__ */ import_react13.default.createElement("b", null, `${cacheHits} / ${items.length}`) })
    ];
    latRows = compact ? [
      /* @__PURE__ */ import_react13.default.createElement(HeadRow, { key: "avg", k: "\u5747\u503C", v: /* @__PURE__ */ import_react13.default.createElement("b", null, latSec(avgLatency)) }),
      /* @__PURE__ */ import_react13.default.createElement(HeadRow, { key: "p95", k: "p95", v: /* @__PURE__ */ import_react13.default.createElement("b", null, latSec(lat.p95)) })
    ] : [
      /* @__PURE__ */ import_react13.default.createElement(HeadRow, { key: "avg", k: "\u5747\u503C", v: /* @__PURE__ */ import_react13.default.createElement("b", null, latSec(avgLatency)) }),
      /* @__PURE__ */ import_react13.default.createElement(HeadRow, { key: "p95", k: "p95", v: /* @__PURE__ */ import_react13.default.createElement("b", null, latSec(lat.p95)) }),
      /* @__PURE__ */ import_react13.default.createElement(HeadRow, { key: "max", k: "\u6700\u6162", v: /* @__PURE__ */ import_react13.default.createElement("b", null, latSec(maxLatency)) })
    ];
  }
  let windowRows;
  if (!running || !items.length) {
    windowRows = [
      /* @__PURE__ */ import_react13.default.createElement("div", { key: "hd", className: "silk", style: { display: "block", marginBottom: 2 } }, "WINDOW ", /* @__PURE__ */ import_react13.default.createElement("b", null, "\u672C\u7A97")),
      /* @__PURE__ */ import_react13.default.createElement(HeadRow, { key: "s", k: "\u8D77", v: /* @__PURE__ */ import_react13.default.createElement("b", null, "\u2014") }),
      /* @__PURE__ */ import_react13.default.createElement(HeadRow, { key: "e", k: "\u6B62", v: /* @__PURE__ */ import_react13.default.createElement("b", null, "\u2014") }),
      /* @__PURE__ */ import_react13.default.createElement(HeadRow, { key: "d", k: "\u8DE8\u5EA6", v: /* @__PURE__ */ import_react13.default.createElement("b", null, "\u2014") })
    ];
  } else {
    const first = items[0];
    const last = items[items.length - 1];
    windowRows = [
      /* @__PURE__ */ import_react13.default.createElement("div", { key: "hd", className: "silk", style: { display: "block", marginBottom: 2 } }, "WINDOW ", /* @__PURE__ */ import_react13.default.createElement("b", null, "\u672C\u7A97")),
      /* @__PURE__ */ import_react13.default.createElement(HeadRow, { key: "s", k: "\u8D77", v: /* @__PURE__ */ import_react13.default.createElement("b", null, clock(first.at)) }),
      /* @__PURE__ */ import_react13.default.createElement(HeadRow, { key: "e", k: "\u6B62", v: /* @__PURE__ */ import_react13.default.createElement("b", null, clock(last.at)) }),
      /* @__PURE__ */ import_react13.default.createElement(HeadRow, { key: "d", k: "\u8DE8\u5EA6", v: /* @__PURE__ */ import_react13.default.createElement("b", null, `${Math.round((last.at - first.at) / 1e3)} \u79D2${compact ? "" : ` \xB7 \u672B ${items.length} \u6BB5`}`) }),
      compact ? null : /* @__PURE__ */ import_react13.default.createElement(HeadRow, { key: "c", k: "CUE \u9009\u4E2D", v: /* @__PURE__ */ import_react13.default.createElement("b", null, selectedItem ? mmssTenth(selectedItem.startSec) : "\u2014") })
    ].filter(Boolean);
  }
  let note;
  if (!running) note = "\u8D70\u5E26\u505C\u6B62 \xB7 \u65E0\u4FE1\u53F7";
  else if (hybrid.enabled) {
    const reason = hybrid.lastSwitchReasonText || hybrid.lastSwitchReason || (localWarm ? "\u672C\u5730\u5DF2\u5C31\u7EEA\uFF0C\u4E91\u7AEF\u9876\u73ED\u7ED3\u675F" : "\u79BB\u7EBF\uFF0C\u672C\u5730\u5C1A\u672A\u5C31\u7EEA");
    note = `\u6DF7\u5408\u9876\u73ED ${num(hybrid.bootstrapCount)}/${num(hybrid.maxCloudBootstrap)} \xB7 ${reason}`;
  } else if (provider === "local") note = "\u7EAF\u672C\u5730\u6E32\u67D3 \xB7 \u4E91\u7AEF\u5F85\u547D";
  else if (provider === "openai") note = `OpenAI \u517C\u5BB9 \xB7 ${openai.model || "tts-1"}`;
  else note = "\u7EAF\u4E91\u7AEF\u6E32\u67D3 \xB7 \u672C\u5730\u672A\u53C2\u4E0E";
  let readerNodes;
  if (!running) {
    readerNodes = /* @__PURE__ */ import_react13.default.createElement("div", { className: "reader off" }, /* @__PURE__ */ import_react13.default.createElement("span", { className: "ld" }), /* @__PURE__ */ import_react13.default.createElement("b", null, "\u65E0\u8BBE\u5907"), /* @__PURE__ */ import_react13.default.createElement("span", { className: "idle" }, "\u2014"), /* @__PURE__ */ import_react13.default.createElement("small", null, "\u670D\u52A1\u672A\u8FD0\u884C"));
  } else if (!active.length) {
    readerNodes = /* @__PURE__ */ import_react13.default.createElement("div", { className: "reader off" }, /* @__PURE__ */ import_react13.default.createElement("span", { className: "ld" }), /* @__PURE__ */ import_react13.default.createElement("b", null, "\u65E0\u8BBE\u5907"), /* @__PURE__ */ import_react13.default.createElement("span", { className: "idle" }, "\u2014"), /* @__PURE__ */ import_react13.default.createElement("small", null, "\u8FD8\u6CA1\u6709\u6D3B\u8DC3\u8BFB\u8005"));
  } else {
    readerNodes = active.slice(0, 3).map((r3, i3) => {
      const idle = num(r3.idleMs) > 12e4;
      return /* @__PURE__ */ import_react13.default.createElement("div", { key: `${r3.client || i3}-${i3}`, className: i3 === 0 ? "reader" : "reader off" }, /* @__PURE__ */ import_react13.default.createElement("span", { className: "ld" }), /* @__PURE__ */ import_react13.default.createElement("b", null, ipOf(r3.client)), /* @__PURE__ */ import_react13.default.createElement("span", { className: "idle" }, ago(r3.at)), /* @__PURE__ */ import_react13.default.createElement("small", null, `${hashOf(r3.client) || "\u8BBE\u5907"} \xB7 ${idle ? `\u6700\u540E\u6D3B\u52A8 ${clock(r3.at)}` : "\u6D3B\u8DC3"}`));
    });
  }
  const maxBootstrap = num(hybrid.maxCloudBootstrap);
  const bootstrap = num(hybrid.bootstrapCount);
  const cellBoxes = maxBootstrap > 0 && maxBootstrap <= 8 ? Array.from({ length: maxBootstrap }, (_, i3) => /* @__PURE__ */ import_react13.default.createElement("i", { key: i3, className: i3 < bootstrap ? "on" : void 0 })) : [];
  const cloudHeadTitle = provider === "openai" ? "OPENAI" : "CLOUD";
  const cloudHeadState = !running ? "\u5DF2\u505C\u6B62" : provider === "openai" ? openai.ready ? `${openai.model || "tts-1"} \xB7 \u5C31\u7EEA` : "OpenAI \xB7 \u672A\u914D\u7F6E" : hybrid.cloudReady ? "\u4E91\u7AEF \xB7 \u5907\u7528" : "\u4E91\u7AEF \xB7 \u4E0D\u53EF\u7528";
  return /* @__PURE__ */ import_react13.default.createElement("div", { className: "heads", "aria-label": "\u8F68\u9053\u5934" }, /* @__PURE__ */ import_react13.default.createElement("div", { className: "heads-top" }, /* @__PURE__ */ import_react13.default.createElement("span", { className: "silk" }, "TRACKS ", /* @__PURE__ */ import_react13.default.createElement("b", null, "\u901A\u9053")), /* @__PURE__ */ import_react13.default.createElement("span", { className: "silk" }, running ? `${items.length} \u6BB5` : "\u505C\u673A")), /* @__PURE__ */ import_react13.default.createElement("div", { className: "heads-core" }, /* @__PURE__ */ import_react13.default.createElement("div", { className: "head head--take" }, /* @__PURE__ */ import_react13.default.createElement("div", null, /* @__PURE__ */ import_react13.default.createElement("span", { className: "counter" }, running ? mmssPad(totalAudio) : "--:--"), /* @__PURE__ */ import_react13.default.createElement("small", null, "TAPE"))), /* @__PURE__ */ import_react13.default.createElement("div", { className: "head head--main" }, /* @__PURE__ */ import_react13.default.createElement("div", { className: "h-title" }, /* @__PURE__ */ import_react13.default.createElement("span", { className: "idx" }, "01"), /* @__PURE__ */ import_react13.default.createElement("b", null, "PROGRAM"), /* @__PURE__ */ import_react13.default.createElement("small", null, "\u4E3B\u5E26")), /* @__PURE__ */ import_react13.default.createElement("div", { className: "head-rows" }, mainRows)), /* @__PURE__ */ import_react13.default.createElement("div", { className: "head head--lat" }, /* @__PURE__ */ import_react13.default.createElement("div", { className: "h-title" }, /* @__PURE__ */ import_react13.default.createElement("span", { className: "idx" }, "LAT"), /* @__PURE__ */ import_react13.default.createElement("b", null, "\u6E32\u67D3\u8017\u65F6")), /* @__PURE__ */ import_react13.default.createElement("div", { className: "head-rows" }, latRows)), /* @__PURE__ */ import_react13.default.createElement("div", { className: "head head--local" }, /* @__PURE__ */ import_react13.default.createElement("span", { className: "idx" }, "02"), /* @__PURE__ */ import_react13.default.createElement("b", null, "LOCAL"), /* @__PURE__ */ import_react13.default.createElement("span", { className: "st" }, running ? localStateText(localInfo) : "\u5DF2\u505C\u6B62")), /* @__PURE__ */ import_react13.default.createElement("div", { className: "head head--cloud" }, /* @__PURE__ */ import_react13.default.createElement("span", { className: "idx" }, "03"), /* @__PURE__ */ import_react13.default.createElement("b", null, cloudHeadTitle), /* @__PURE__ */ import_react13.default.createElement("span", { className: "st" }, cloudHeadState))), /* @__PURE__ */ import_react13.default.createElement("div", { className: "heads-gap", "aria-hidden": "true" }), /* @__PURE__ */ import_react13.default.createElement("div", { className: "head head--readers" }, /* @__PURE__ */ import_react13.default.createElement("div", { className: "silk", style: { marginBottom: 1 } }, "READERS ", /* @__PURE__ */ import_react13.default.createElement("b", null, "\u8BFB\u8005")), /* @__PURE__ */ import_react13.default.createElement("div", { className: "readers" }, readerNodes), /* @__PURE__ */ import_react13.default.createElement("div", { className: "hybrid-cells", "aria-label": "\u6DF7\u5408\u9876\u73ED\u914D\u989D" }, cellBoxes, /* @__PURE__ */ import_react13.default.createElement("span", null, `\u9876\u73ED ${bootstrap}/${maxBootstrap}`)), /* @__PURE__ */ import_react13.default.createElement("div", { className: "head-window" }, windowRows), /* @__PURE__ */ import_react13.default.createElement("div", { className: "heads-note" }, note)));
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
  const ticks = (0, import_react13.useMemo)(() => rulerTicks(totalAudio), [totalAudio]);
  const p95 = num(lat.p95);
  const p95Pct = p95 > 0 ? clamp(p95 / latScale * 100, 0, 100) : 0;
  const cloudCount = items.filter((x) => x.source === "cloud").length;
  const empty = !running || items.length === 0;
  const first = items[0];
  const last = items[items.length - 1];
  const meta = running && items.length ? `${clock(first.at)} \u2192 ${clock(last.at)} \xB7 ${fmtInt(totalChars)} \u5B57 \xB7 \u6E32\u67D3 ${(avgLatency * items.length / 1e3).toFixed(1)}s \xB7 \u547D\u4E2D ${cacheHits}/${items.length}` : "\u2014";
  const recTagCls = paused ? "rec-tag paused" : "rec-tag";
  const recTagText = !running ? "STOP" : paused ? "PAUSED" : `REC ${mmssPad(totalAudio)}`;
  return /* @__PURE__ */ import_react13.default.createElement("div", { className: "timeline" }, /* @__PURE__ */ import_react13.default.createElement("div", { className: "tl-top" }, /* @__PURE__ */ import_react13.default.createElement("div", { className: "tl-title" }, /* @__PURE__ */ import_react13.default.createElement("span", { className: "eyebrow" }, "TIMELINE"), /* @__PURE__ */ import_react13.default.createElement("b", null, `\u672C\u7A97 \xB7 \u672B ${items.length} \u6BB5`), /* @__PURE__ */ import_react13.default.createElement("span", { className: recTagCls }, /* @__PURE__ */ import_react13.default.createElement("i", null), recTagText)), /* @__PURE__ */ import_react13.default.createElement("div", { className: "tl-meta" }, meta)), /* @__PURE__ */ import_react13.default.createElement("div", { className: "tl-core" }, /* @__PURE__ */ import_react13.default.createElement("div", { className: "ruler", "aria-hidden": "true" }, ticks.ticks.map((t3, i3) => /* @__PURE__ */ import_react13.default.createElement(
    "span",
    {
      key: `tk${i3}`,
      className: `tick ${t3.major ? "major" : "minor"}`,
      style: { left: `${t3.pct.toFixed(3)}%` }
    }
  )), ticks.ticks.filter((t3) => t3.major && t3.t < totalAudio - 1).map((t3, i3) => /* @__PURE__ */ import_react13.default.createElement(
    "span",
    {
      key: `tl${i3}`,
      className: `tlabel${t3.t === 0 ? " edge-l" : ""}`,
      style: { left: `${t3.pct.toFixed(3)}%` }
    },
    mmss(t3.t)
  )), selItem ? /* @__PURE__ */ import_react13.default.createElement("span", { className: "cue", style: { left: `${clamp(selItem.startPct, 0, 100).toFixed(3)}%` } }) : null), /* @__PURE__ */ import_react13.default.createElement("div", { className: "tape", "aria-label": "\u8282\u76EE\u5E26\uFF08\u6309\u97F3\u9891\u65F6\u957F\u526A\u63A5\u7684\u5408\u6210\u7247\u6BB5\uFF09" }, items.map((item) => {
    const slow = !item.error && p95 > 0 && item.latencyMs > p95;
    const cls = ["clip", item.cacheHit ? "hit" : "miss"];
    if (slow) cls.push("slow");
    if (hoverAt != null && hoverAt === item.at) cls.push("is-hover");
    if (item.error) cls.push("error");
    const label = clipLabel(item);
    return /* @__PURE__ */ import_react13.default.createElement(
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
      /* @__PURE__ */ import_react13.default.createElement("span", { className: "role" }, ROLE_GLYPH[item.role] || "\u65C1"),
      /* @__PURE__ */ import_react13.default.createElement("span", { className: "wbar", "aria-hidden": "true" }, /* @__PURE__ */ import_react13.default.createElement("i", { style: { width: `${item.wbar.toFixed(1)}%` } })),
      /* @__PURE__ */ import_react13.default.createElement("span", { className: "no", "aria-hidden": "true" }, pad2(item.index + 1)),
      /* @__PURE__ */ import_react13.default.createElement("span", { className: "cache", "aria-hidden": "true" }),
      /* @__PURE__ */ import_react13.default.createElement("span", { className: "lat", "aria-hidden": "true" }, /* @__PURE__ */ import_react13.default.createElement("i", { style: { width: `${item.latPct.toFixed(1)}%` } })),
      item.segments > 1 ? /* @__PURE__ */ import_react13.default.createElement("span", { className: "seg", "aria-hidden": "true" }) : null
    );
  })), /* @__PURE__ */ import_react13.default.createElement("div", { className: "latlane", "aria-label": "\u6BCF\u6BB5\u6E32\u67D3\u8017\u65F6" }, items.map((item) => /* @__PURE__ */ import_react13.default.createElement(
    "span",
    {
      key: `lat-${item.at}-${item.index}`,
      className: `lbar${!item.error && p95 > 0 && item.latencyMs > p95 ? " slow" : ""}`,
      style: { flexBasis: `${item.wPct.toFixed(3)}%` },
      title: item.error ? "\u5931\u8D25" : latSec(item.latencyMs)
    },
    /* @__PURE__ */ import_react13.default.createElement("i", { style: { height: `${item.latPct.toFixed(1)}%` } })
  )), p95 > 0 ? /* @__PURE__ */ import_react13.default.createElement("span", { className: "p95", style: { bottom: `${p95Pct.toFixed(2)}%` } }, /* @__PURE__ */ import_react13.default.createElement("span", null, `p95 ${(p95 / 1e3).toFixed(2)}s`)) : null), /* @__PURE__ */ import_react13.default.createElement("div", { className: "rail rail--local", "aria-label": "\u672C\u5730\u6765\u6E90\u6CF3\u9053" }, items.map((item) => /* @__PURE__ */ import_react13.default.createElement("span", { key: `rl-${item.at}-${item.index}`, className: "rbar", style: { flexBasis: `${item.wPct.toFixed(3)}%` } }, item.source === "local" ? /* @__PURE__ */ import_react13.default.createElement("i", null) : null))), /* @__PURE__ */ import_react13.default.createElement("div", { className: "rail rail--cloud", "aria-label": "\u4E91\u7AEF\u6765\u6E90\u6CF3\u9053" }, items.map((item) => /* @__PURE__ */ import_react13.default.createElement("span", { key: `rc-${item.at}-${item.index}`, className: "rbar", style: { flexBasis: `${item.wPct.toFixed(3)}%` } }, item.source === "cloud" ? /* @__PURE__ */ import_react13.default.createElement("i", null) : null)), running && !cloudCount ? /* @__PURE__ */ import_react13.default.createElement("span", { className: "rail-note" }, hybrid.enabled ? `\u672C\u7A97\u65E0\u4E91\u7AEF\u6BB5 \xB7 \u542F\u52A8\u65F6\u9876\u73ED ${num(hybrid.bootstrapCount)}/${num(hybrid.maxCloudBootstrap)} \u6BB5\uFF0C\u672C\u5730\u5C31\u7EEA\u540E\u5207\u56DE` : "\u672C\u7A97\u65E0\u4E91\u7AEF/\u8FDC\u7A0B\u6BB5") : null), running && items.length ? /* @__PURE__ */ import_react13.default.createElement("div", { className: "playhead", "aria-hidden": "true" }) : null, empty ? /* @__PURE__ */ import_react13.default.createElement("div", { className: "tl-empty" }, /* @__PURE__ */ import_react13.default.createElement("div", { className: "leader" }, /* @__PURE__ */ import_react13.default.createElement("span", null, running ? "LEADER \xB7 \u7A7A\u5E26" : "LEADER \xB7 \u65E0\u4FE1\u53F7")), /* @__PURE__ */ import_react13.default.createElement("h3", null, running ? "\u8D70\u5E26\u7A7A\u5E26 \u2014\u2014 \u8FD8\u6CA1\u6709\u7247\u6BB5" : "\u8D70\u5E26\u505C\u6B62 \u2014\u2014 \u670D\u52A1\u672A\u8FD0\u884C"), /* @__PURE__ */ import_react13.default.createElement("p", null, running ? "\u7A97\u53E3\u91CC\u8FD8\u6CA1\u6709\u4EFB\u4F55\u6717\u8BFB\u7247\u6BB5\u3002\u8BA9\u624B\u673A\u4E0A\u7684\u9605\u8BFB App \u6717\u8BFB\u4E00\u6BB5\uFF0C\u7B2C\u4E00\u679A clip \u4F1A\u843D\u5728\u5E26\u5C3E\u3002" : "\u505C\u673A\u540E\u5B9E\u65F6\u7247\u6BB5\u4E0E\u6E32\u67D3\u8BFB\u6570\u5168\u90E8\u51BB\u7ED3\u4E3A\u7A7A\u6001\u3002\u5386\u53F2\u5DE5\u7A0B\u4ECD\u5728\u300C\u5DE5\u7A0B\u53F2\u300D\u91CC\uFF0C\u53C2\u6570\u4ECD\u5728\u300C\u6E32\u67D3\u8BBE\u7F6E\u300D\u91CC\u3002"), running ? null : /* @__PURE__ */ import_react13.default.createElement("button", { className: "btn btn--tape", type: "button", onClick: () => onAct("start") }, "\u542F\u52A8\u670D\u52A1")) : null), /* @__PURE__ */ import_react13.default.createElement("div", { className: "tl-gap", "aria-hidden": "true" }), /* @__PURE__ */ import_react13.default.createElement("div", { className: "takes" }, /* @__PURE__ */ import_react13.default.createElement("div", { className: "takes-hd" }, /* @__PURE__ */ import_react13.default.createElement("span", { className: "silk" }, "TAKES ", /* @__PURE__ */ import_react13.default.createElement("b", null, "\u573A\u8BB0 \xB7 \u6700\u8FD1\u6D41\u6C34")), /* @__PURE__ */ import_react13.default.createElement("span", { className: "th-meta" }, running ? `\u6700\u8FD1 ${items.length} \u6761 \xB7 \u4E0E\u65F6\u95F4\u7EBF\u540C\u6E90` : "\u505C\u673A \xB7 \u65E0\u5B9E\u65F6\u6D41\u6C34")), /* @__PURE__ */ import_react13.default.createElement("div", { className: "takes-list", role: "list", "aria-label": "\u6700\u8FD1\u5408\u6210\u6D41\u6C34" }, running ? items.length ? items.slice().reverse().map((item) => {
    const slow = !item.error && p95 > 0 && item.latencyMs > p95;
    const cls = hoverAt != null && hoverAt === item.at ? "take is-hover" : "take";
    return /* @__PURE__ */ import_react13.default.createElement(
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
        onKeyDown: (e3) => {
          if (e3.key === "Enter" || e3.key === " ") {
            e3.preventDefault();
            onSelect(item);
          }
        },
        onMouseEnter: () => onHover(item),
        onMouseLeave: () => onHover(null),
        onFocus: () => onHover(item),
        onBlur: () => onHover(null)
      },
      /* @__PURE__ */ import_react13.default.createElement("span", { className: "tt" }, clock(item.at)),
      /* @__PURE__ */ import_react13.default.createElement("span", { className: "tr" }, ROLE_GLYPH[item.role] || "\u65C1"),
      /* @__PURE__ */ import_react13.default.createElement("span", { className: `ts ${item.source || ""}`.trim() }, item.sourceLabel === "\u2014" ? "\u672A\u77E5" : item.sourceLabel),
      /* @__PURE__ */ import_react13.default.createElement("span", { className: "tx" }, item.text || "\uFF08\u6CA1\u6709\u6587\u672C\uFF09"),
      /* @__PURE__ */ import_react13.default.createElement("span", { className: "td", title: `${hashOf(item.client) || "\u8BBE\u5907"} \xB7 ${ipOf(item.client)}` }, hashOf(item.client) || ipOf(item.client)),
      /* @__PURE__ */ import_react13.default.createElement("span", { className: `tl${slow ? " slow" : ""}` }, item.error ? "\u5931\u8D25" : latSec(item.latencyMs)),
      /* @__PURE__ */ import_react13.default.createElement("span", { className: `tc ${item.error ? "miss" : item.cacheHit ? "hit" : "miss"}` }, item.error ? "\u5931\u8D25" : item.cacheHit ? "\u547D\u4E2D" : "\u672A\u547D\u4E2D")
    );
  }) : /* @__PURE__ */ import_react13.default.createElement("div", { className: "empty-takes" }, /* @__PURE__ */ import_react13.default.createElement("b", null, "\u8D70\u5E26\u7A7A\u5E26\uFF0C\u8FD8\u6CA1\u6709\u7247\u6BB5"), /* @__PURE__ */ import_react13.default.createElement("span", null, "\u8BA9\u624B\u673A\u4E0A\u7684\u9605\u8BFB App \u6717\u8BFB\u4E00\u6BB5\uFF0C\u7B2C\u4E00\u679A clip \u4F1A\u843D\u5728\u5E26\u5C3E\u3002")) : /* @__PURE__ */ import_react13.default.createElement("div", { className: "empty-takes" }, /* @__PURE__ */ import_react13.default.createElement("b", null, "\u8D70\u5E26\u505C\u6B62\uFF0C\u65E0\u5B9E\u65F6\u6D41\u6C34"), /* @__PURE__ */ import_react13.default.createElement("span", null, `\u6700\u540E\u5FEB\u7167 ${clock(last?.at || Date.now())} \xB7 \u542F\u52A8\u670D\u52A1\u540E\uFF0C\u65B0\u7247\u6BB5\u4F1A\u91CD\u65B0\u51FA\u73B0\u5728\u5E26\u5C3E\u3002`)))));
}
function Inspector({ running, live, service, localInfo, config, item, items, onAct, onActLocal, onToggleResident, busy, lastSync }) {
  const cache = live?.cache || {};
  const today = live?.today || {};
  const lat = live?.latency || {};
  const provider = service?.provider || config?.upstream?.provider || "mimo";
  const rpm = live?.rpm || {};
  const rpmByProvider = live?.rpmByProvider || null;
  const rpmUnlimited = Boolean(rpm.unlimited) || provider === "local" && rpm.limit == null;
  const rpmLimit = rpmUnlimited ? null : Math.max(1, num(rpm.limit, 100));
  const rpmText = rpmUnlimited ? `${num(rpm.used)}/\u221E` : `${num(rpm.used)}/${rpmLimit}`;
  const hybrid = service?.hybrid || {};
  const openai = service?.openai || {};
  const localState = localInfo?.state || "disabled";
  const localWarm = Boolean(localInfo?.warm) || localState === "ready";
  const localEnabled = Boolean(localInfo?.enabled) || provider === "local" || provider === "hybrid";
  const cloudReady = Boolean(hybrid.cloudReady);
  const p95 = num(lat.p95);
  const cacheRatio = num(cache.maxEntries) > 0 ? clamp(num(cache.entries) / num(cache.maxEntries), 0, 1) : 0;
  const rpmRatio = rpmUnlimited ? 0 : clamp(num(rpm.used) / rpmLimit, 0, 1);
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
    return /* @__PURE__ */ import_react13.default.createElement("aside", { className: "inspector", "aria-label": "\u62FE\u53D6\u5934 \xB7 \u9009\u4E2D\u7247\u6BB5\u4E0E\u5F15\u64CE\u8BFB\u6570" }, /* @__PURE__ */ import_react13.default.createElement("div", { className: "ins-offline" }, /* @__PURE__ */ import_react13.default.createElement("div", { className: "ins-hd" }, /* @__PURE__ */ import_react13.default.createElement("span", { className: "silk" }, "PICKUP ", /* @__PURE__ */ import_react13.default.createElement("b", null, "\u62FE\u53D6\u5934")), /* @__PURE__ */ import_react13.default.createElement("span", { className: "cn" }, "\u505C\u673A")), /* @__PURE__ */ import_react13.default.createElement("div", { className: "ins-stopped" }, /* @__PURE__ */ import_react13.default.createElement("div", { className: "banner" }, /* @__PURE__ */ import_react13.default.createElement("b", null, "\u670D\u52A1\u5DF2\u505C\u6B62\uFF0C\u5B9E\u65F6\u6570\u636E\u4E3A\u7A7A"), /* @__PURE__ */ import_react13.default.createElement("span", null, `\u6700\u540E\u5FEB\u7167 ${clock(lastSync)}`, /* @__PURE__ */ import_react13.default.createElement("br", null), "\u505C\u6B62\u540E /api/state \u4E0D\u518D\u4EA7\u751F\u65B0\u7247\u6BB5\uFF1B\u542F\u52A8\u540E\u6062\u590D\u8D70\u5E26\u3002")), /* @__PURE__ */ import_react13.default.createElement("button", { className: "btn btn--tape", type: "button", onClick: () => onAct("start") }, "\u542F\u52A8\u670D\u52A1")), /* @__PURE__ */ import_react13.default.createElement("div", { className: "ins-block", style: { marginTop: 8 } }, /* @__PURE__ */ import_react13.default.createElement("div", { className: "ins-hd" }, /* @__PURE__ */ import_react13.default.createElement("span", { className: "silk" }, "LAST SNAPSHOT ", /* @__PURE__ */ import_react13.default.createElement("b", null, "\u505C\u673A\u524D\u8BFB\u6570"))), /* @__PURE__ */ import_react13.default.createElement("div", { className: "cache-rows" }, rows.map(([k, v2]) => /* @__PURE__ */ import_react13.default.createElement(Rowx, { key: k, k, v: v2 }))))));
  }
  const srcKey = item ? item.source : "";
  const tags = [];
  if (item) {
    tags.push(
      /* @__PURE__ */ import_react13.default.createElement("span", { key: "src", className: `tag ${srcKey === "local" ? "tape" : srcKey === "cloud" ? "cloud" : "hollow"}` }, item.sourceLabel === "\u2014" ? "\u6765\u6E90\u672A\u77E5" : item.sourceLabel)
    );
    tags.push(/* @__PURE__ */ import_react13.default.createElement("span", { key: "role", className: "tag hollow" }, ROLE_CN[item.role] || item.role));
    tags.push(
      /* @__PURE__ */ import_react13.default.createElement("span", { key: "cache", className: `tag ${item.error ? "grease" : item.cacheHit ? "hollow" : "grease"}` }, item.error ? "\u6E32\u67D3\u5931\u8D25" : item.cacheHit ? "\u547D\u4E2D" : "\u672A\u547D\u4E2D")
    );
    if (item.index === items.length - 1) tags.push(/* @__PURE__ */ import_react13.default.createElement("span", { key: "tail", className: "tag grease pick-rec" }, "\u5E26\u5C3E \xB7 REC"));
    if (!item.error && p95 > 0 && item.latencyMs > p95) tags.push(/* @__PURE__ */ import_react13.default.createElement("span", { key: "slow", className: "tag grease" }, "\u6162\u6E32\u67D3"));
  }
  const localRowCls = ["eng-row"];
  if (localState === "starting") localRowCls.push("warm");
  else if (!localWarm) localRowCls.push("off");
  const engLocalSub = !localEnabled ? "\u5F53\u524D\u6E32\u67D3\u6765\u6E90\u4E0D\u4F7F\u7528\u672C\u5730\u5F15\u64CE" : localState === "stopped" ? `\u5185\u5B58\u5DF2\u91CA\u653E \xB7 \u7A7A\u95F2\u5378\u8F7D ${num(localInfo?.idleUnloadSeconds)}s` : localState === "starting" ? `\u52A0\u8F7D\u4E2D\u2026 \u9996\u6B21\u7EA6 ${localInfo?.loadS ? `${localInfo.loadS}s` : "\u6570\u79D2"}` : localState === "error" ? localInfo?.lastError || "\u672C\u5730\u5F15\u64CE\u51FA\u9519" : `pid ${localInfo?.pid || "\u2014"} \xB7 :${localInfo?.port || "\u2014"} \xB7 \u52A0\u8F7D ${localInfo?.loadS ?? "\u2014"}s \xB7 \u6700\u8FD1 ${localInfo?.lastUsed ? clock(localInfo.lastUsed) : "\u2014"}`;
  const localBtnText = !localEnabled ? "\u672C\u5730\u672A\u542F\u7528" : localState === "starting" ? "\u52A0\u8F7D\u4E2D\u2026" : localState === "stopping" ? "\u5378\u8F7D\u4E2D\u2026" : localWarm ? "\u5378\u4E0B\u672C\u5730\u6A21\u578B" : "\u52A0\u8F7D\u672C\u5730\u6A21\u578B";
  const localBtnDisabled = !localEnabled || localState === "starting" || localState === "stopping" || Boolean(busy);
  const localIdleSec = num(localInfo?.idleUnloadSeconds ?? config?.upstream?.local?.idleUnloadSeconds, 1800);
  const localResident = localIdleSec === 0;
  const localHoldRemain = num(localInfo?.warmHoldRemainingSec);
  const localHint = !localEnabled ? "\u5F53\u524D\u6E32\u67D3\u6765\u6E90\u4E0D\u4F7F\u7528\u672C\u5730\u5F15\u64CE" : localResident ? "\u5E38\u9A7B\u5185\u5B58\uFF08\u4E0D\u81EA\u52A8\u5378\u8F7D \xB7 \u7EA6 1\u20132.3 GB\uFF09" : localWarm ? localHoldRemain > 0 ? `\u9884\u70ED\u4FDD\u6D3B\u4E2D\uFF08\u4F59 ${localHoldRemain}s\uFF09\xB7 \u7A7A\u95F2 ${localIdleSec}s \u5378\u8F7D` : `\u7A7A\u95F2 ${localIdleSec}s \u81EA\u52A8\u5378\u8F7D` : `\u4E91\u7AEF\u9876\u73ED\uFF08\u6700\u591A ${num(hybrid.maxCloudBootstrap)} \u6BB5\uFF09`;
  const hybridNote = hybrid.enabled ? localWarm ? `\u9876\u73ED ${num(hybrid.bootstrapCount)}/${num(hybrid.maxCloudBootstrap)} \u6BB5 \xB7 ${hybrid.lastSwitchReasonText || hybrid.lastSwitchReason || "\u672C\u5730\u5DF2\u5C31\u7EEA"}` : `\u4E91\u7AEF\u9876\u73ED\uFF08\u6700\u591A ${num(hybrid.maxCloudBootstrap)} \u6BB5\uFF09` : provider === "local" ? "\u7EAF\u672C\u5730\u6E32\u67D3 \xB7 \u4E91\u7AEF\u5F85\u547D" : provider === "openai" ? `OpenAI \u517C\u5BB9 \xB7 ${cfg.upstream?.openai?.baseUrl || ""}` : "\u7EAF\u4E91\u7AEF\u6E32\u67D3 \xB7 \u672C\u5730\u672A\u53C2\u4E0E";
  return /* @__PURE__ */ import_react13.default.createElement("aside", { className: "inspector", "aria-label": "\u62FE\u53D6\u5934 \xB7 \u9009\u4E2D\u7247\u6BB5\u4E0E\u5F15\u64CE\u8BFB\u6570" }, /* @__PURE__ */ import_react13.default.createElement("div", { className: "ins-online" }, /* @__PURE__ */ import_react13.default.createElement("div", { className: "ins-block" }, /* @__PURE__ */ import_react13.default.createElement("div", { className: "ins-hd" }, /* @__PURE__ */ import_react13.default.createElement("span", { className: "silk" }, "PICKUP ", /* @__PURE__ */ import_react13.default.createElement("b", null, "\u62FE\u53D6\u5934")), /* @__PURE__ */ import_react13.default.createElement("span", { className: "cn" }, item ? `${mmssTenth(item.startSec)} \u2013 ${mmssTenth(item.endSec)}` : "\u7B49\u5F85\u7247\u6BB5")), /* @__PURE__ */ import_react13.default.createElement("div", { className: "pick-tags" }, tags), /* @__PURE__ */ import_react13.default.createElement("p", { className: "pick-text" }, item ? item.text || "\uFF08\u8FD9\u6BB5\u6CA1\u6709\u6587\u672C\uFF09" : "\u8FD8\u6CA1\u6709\u7247\u6BB5\u3002\u8BA9\u9605\u8BFB App \u6717\u8BFB\u4E00\u6BB5\uFF0C\u8FD9\u91CC\u4F1A\u663E\u793A\u6B63\u5728\u5408\u6210\u7684\u53E5\u5B50\u3002"), item?.error && (item.errorMessage || item.errorHint) && /* @__PURE__ */ import_react13.default.createElement("div", { style: { fontSize: 11, color: "var(--grease)", marginBottom: 6, lineHeight: 1.45 } }, /* @__PURE__ */ import_react13.default.createElement("b", null, item.errorMessage || "\u8BF7\u6C42\u5931\u8D25"), item.errorHint ? ` \xB7 ${item.errorHint}` : ""), /* @__PURE__ */ import_react13.default.createElement("div", { className: "pick-meta" }, /* @__PURE__ */ import_react13.default.createElement("div", { className: "kv" }, /* @__PURE__ */ import_react13.default.createElement("span", { className: "k" }, "\u5EF6\u8FDF LATENCY"), /* @__PURE__ */ import_react13.default.createElement("span", { className: "v" }, item ? item.error ? "\u5931\u8D25" : latSec(item.latencyMs) : "\u2014")), /* @__PURE__ */ import_react13.default.createElement("div", { className: "kv" }, /* @__PURE__ */ import_react13.default.createElement("span", { className: "k" }, "\u5B57\u6570 CHARS"), /* @__PURE__ */ import_react13.default.createElement("span", { className: "v" }, item ? `${item.chars} \u5B57` : "\u2014")), /* @__PURE__ */ import_react13.default.createElement("div", { className: "kv" }, /* @__PURE__ */ import_react13.default.createElement("span", { className: "k" }, "\u97F3\u9891 AUDIO"), /* @__PURE__ */ import_react13.default.createElement("span", { className: "v" }, item && item.audioSeconds > 0 ? `${item.audioSeconds.toFixed(1)} s` : "\u2014")), /* @__PURE__ */ import_react13.default.createElement("div", { className: "kv" }, /* @__PURE__ */ import_react13.default.createElement("span", { className: "k" }, "\u6BB5 SEG"), /* @__PURE__ */ import_react13.default.createElement("span", { className: "v" }, item ? `${item.segments} \u6BB5` : "\u2014")), /* @__PURE__ */ import_react13.default.createElement("div", { className: "kv" }, /* @__PURE__ */ import_react13.default.createElement("span", { className: "k" }, "\u5230\u8FBE AT"), /* @__PURE__ */ import_react13.default.createElement("span", { className: "v" }, item ? clock(item.at) : "\u2014")), /* @__PURE__ */ import_react13.default.createElement("div", { className: "kv" }, /* @__PURE__ */ import_react13.default.createElement("span", { className: "k" }, "\u89D2\u8272 ROLE"), /* @__PURE__ */ import_react13.default.createElement("span", { className: "v" }, item ? ROLE_CN[item.role] || item.role : "\u2014"))), /* @__PURE__ */ import_react13.default.createElement("div", { className: "pick-device" }, /* @__PURE__ */ import_react13.default.createElement("span", null, "\u8BBE\u5907"), /* @__PURE__ */ import_react13.default.createElement("b", null, item ? `${deviceOf(item.client)} \xB7 ${ipOf(item.client)}` : "\u2014"))), /* @__PURE__ */ import_react13.default.createElement("div", { className: "ins-block" }, /* @__PURE__ */ import_react13.default.createElement("div", { className: "ins-hd" }, /* @__PURE__ */ import_react13.default.createElement("span", { className: "silk" }, "ENGINE ", /* @__PURE__ */ import_react13.default.createElement("b", null, "\u5F15\u64CE")), /* @__PURE__ */ import_react13.default.createElement("span", { className: "cn" }, PROVIDER_CN[provider] || provider)), /* @__PURE__ */ import_react13.default.createElement("div", { className: "eng" }, /* @__PURE__ */ import_react13.default.createElement("div", { className: localRowCls.join(" ") }, /* @__PURE__ */ import_react13.default.createElement("span", { className: "ld" }), /* @__PURE__ */ import_react13.default.createElement("b", null, "\u672C\u5730 Qwen3-TTS"), /* @__PURE__ */ import_react13.default.createElement("span", { className: "st" }, !localEnabled ? "\u672A\u542F\u7528" : localWarm ? "\u70ED" : localState === "starting" ? "\u52A0\u8F7D\u4E2D" : localState === "error" ? "\u51FA\u9519" : "\u5DF2\u5378\u8F7D"), /* @__PURE__ */ import_react13.default.createElement("span", { className: "val" }, localWarm && num(localInfo?.rssMb) > 0 ? `${(num(localInfo.rssMb) / 1024).toFixed(1)} GB` : "\u2014")), /* @__PURE__ */ import_react13.default.createElement("div", { className: "eng-sub" }, engLocalSub), /* @__PURE__ */ import_react13.default.createElement("div", { className: "eng-act" }, /* @__PURE__ */ import_react13.default.createElement(
    "button",
    {
      className: "btn btn--sm",
      type: "button",
      disabled: localBtnDisabled,
      onClick: () => onActLocal(localWarm ? "unload" : "load")
    },
    localBtnText
  ), localEnabled && onToggleResident ? /* @__PURE__ */ import_react13.default.createElement(
    "button",
    {
      className: `btn btn--sm${localResident ? " btn--tape" : ""}`,
      type: "button",
      disabled: Boolean(busy),
      title: localResident ? "\u5F53\u524D\u5E38\u9A7B\u5185\u5B58\uFF08\u7EA6 1\u20132.3 GB\uFF09\uFF0C\u70B9\u51FB\u5207\u56DE\u7701\u5185\u5B58\uFF08\u7A7A\u95F2 30 \u5206\u949F\u5378\u8F7D\uFF09" : "\u5F53\u524D\u7701\u5185\u5B58\u6A21\u5F0F\uFF0C\u70B9\u51FB\u5207\u4E3A\u4FDD\u6301\u5E38\u9A7B",
      onClick: onToggleResident
    },
    localResident ? "\u4FDD\u6301\u5E38\u9A7B" : "\u7701\u5185\u5B58"
  ) : null, /* @__PURE__ */ import_react13.default.createElement("span", { className: "eng-sub" }, localHint)), /* @__PURE__ */ import_react13.default.createElement("div", { className: `eng-row${(provider === "openai" ? openai.ready : cloudReady) ? "" : " off"}` }, /* @__PURE__ */ import_react13.default.createElement("span", { className: "ld" }), /* @__PURE__ */ import_react13.default.createElement("b", null, provider === "openai" ? "OpenAI \u517C\u5BB9" : "MiMo \u4E91\u7AEF"), /* @__PURE__ */ import_react13.default.createElement("span", { className: "st" }, provider === "openai" ? openai.ready ? "\u5DF2\u914D\u7F6E" : "\u672A\u914D\u7F6E" : cloudReady ? "\u5C31\u7EEA \xB7 \u5907\u7528" : "\u4E0D\u53EF\u7528"), /* @__PURE__ */ import_react13.default.createElement("span", { className: "val", title: provider === "openai" ? openai.model || "" : cfg.upstream?.model || "" }, provider === "openai" ? openai.model || "\u672A\u914D\u7F6E\u6A21\u578B" : cfg.upstream?.model || "\u672A\u914D\u7F6E\u6A21\u578B")), /* @__PURE__ */ import_react13.default.createElement("div", { className: "eng-sub" }, hybridNote))), /* @__PURE__ */ import_react13.default.createElement("div", { className: "ins-block" }, /* @__PURE__ */ import_react13.default.createElement("div", { className: "ins-hd" }, /* @__PURE__ */ import_react13.default.createElement("span", { className: "silk" }, "CACHE ", /* @__PURE__ */ import_react13.default.createElement("b", null, "\u7F13\u5B58\u5E26")), /* @__PURE__ */ import_react13.default.createElement("span", { className: "cn" }, `\u547D\u4E2D ${((num(cache.hitRate) || 0) * 100).toFixed(1)}%`)), /* @__PURE__ */ import_react13.default.createElement("div", { className: "vu" }, /* @__PURE__ */ import_react13.default.createElement(VuTable, { ratio: cacheRatio }), /* @__PURE__ */ import_react13.default.createElement("div", { className: "reads" }, /* @__PURE__ */ import_react13.default.createElement("b", null, `${Math.round(cacheRatio * 100)}%`), /* @__PURE__ */ import_react13.default.createElement("small", null, `${fmtInt(cache.entries)} / ${fmtInt(cache.maxEntries)} \u6761`), /* @__PURE__ */ import_react13.default.createElement("small", null, `${fmtBytes(cache.bytes)} / ${fmtBytes(cache.maxBytes)}`))), /* @__PURE__ */ import_react13.default.createElement("div", { className: "cache-rows" }, /* @__PURE__ */ import_react13.default.createElement(Rowx, { k: "\u547D\u4E2D", v: fmtInt(cache.hits) }), /* @__PURE__ */ import_react13.default.createElement(Rowx, { k: "\u672A\u547D\u4E2D", v: fmtInt(cache.misses) }), /* @__PURE__ */ import_react13.default.createElement(Rowx, { k: "TTL", v: ttlText(ttl) }), /* @__PURE__ */ import_react13.default.createElement(Rowx, { k: "\u590D\u7528\u7387", v: `${((num(cache.hitRate) || 0) * 100).toFixed(1)}%` }))), /* @__PURE__ */ import_react13.default.createElement("div", { className: "ins-block" }, /* @__PURE__ */ import_react13.default.createElement("div", { className: "ins-hd" }, /* @__PURE__ */ import_react13.default.createElement("span", { className: "silk" }, "TODAY ", /* @__PURE__ */ import_react13.default.createElement("b", null, "\u4ECA\u65E5\u5DE5\u7A0B")), /* @__PURE__ */ import_react13.default.createElement("span", { className: "cn" }, `${fmtInt(today.segments)} \u6BB5 \xB7 ${hm(today.seconds)}`)), /* @__PURE__ */ import_react13.default.createElement("div", { className: "today-grid" }, /* @__PURE__ */ import_react13.default.createElement("div", { className: "kv" }, /* @__PURE__ */ import_react13.default.createElement("span", { className: "k" }, "\u5408\u6210\u65F6\u957F"), /* @__PURE__ */ import_react13.default.createElement("span", { className: "v" }, hm(today.seconds))), /* @__PURE__ */ import_react13.default.createElement("div", { className: "kv" }, /* @__PURE__ */ import_react13.default.createElement("span", { className: "k" }, "\u5E73\u5747\u5EF6\u8FDF"), /* @__PURE__ */ import_react13.default.createElement("span", { className: "v" }, latSec(live?.avgLatencyMs))), /* @__PURE__ */ import_react13.default.createElement("div", { className: "kv" }, /* @__PURE__ */ import_react13.default.createElement("span", { className: "k" }, "\u5B57\u7B26"), /* @__PURE__ */ import_react13.default.createElement("span", { className: "v" }, fmtInt(today.chars))), /* @__PURE__ */ import_react13.default.createElement("div", { className: "kv" }, /* @__PURE__ */ import_react13.default.createElement("span", { className: "k" }, "\u9519\u8BEF"), /* @__PURE__ */ import_react13.default.createElement("span", { className: "v" }, String(num(today.errors))))), /* @__PURE__ */ import_react13.default.createElement("div", { className: "lat-row", title: `\u6700\u8FD1 ${num(lat.samples)} \u6BB5\u5EF6\u8FDF\u5206\u4F4D` }, /* @__PURE__ */ import_react13.default.createElement("span", null, "p50 ", /* @__PURE__ */ import_react13.default.createElement("b", null, latQ(lat.p50, lat.samples))), /* @__PURE__ */ import_react13.default.createElement("span", null, "p95 ", /* @__PURE__ */ import_react13.default.createElement("b", null, latQ(lat.p95, lat.samples))), /* @__PURE__ */ import_react13.default.createElement("span", null, "max ", /* @__PURE__ */ import_react13.default.createElement("b", null, latQ(lat.max, lat.samples))), /* @__PURE__ */ import_react13.default.createElement("span", null, rpmUnlimited ? "local/m" : "rpm", " ", /* @__PURE__ */ import_react13.default.createElement("b", null, rpmText)))), /* @__PURE__ */ import_react13.default.createElement("div", { className: "ins-block" }, /* @__PURE__ */ import_react13.default.createElement("div", { className: "ins-hd" }, /* @__PURE__ */ import_react13.default.createElement("span", { className: "silk" }, "LIMITS ", /* @__PURE__ */ import_react13.default.createElement("b", null, "\u5BB9\u91CF")), /* @__PURE__ */ import_react13.default.createElement("span", { className: "cn" }, `\u5E76\u53D1 ${num(cfg.synth?.concurrency)} \xB7 \u961F\u5217 ${num(rpm.waiting)}`)), /* @__PURE__ */ import_react13.default.createElement("div", { className: "limit-meter" }, /* @__PURE__ */ import_react13.default.createElement("span", { className: "ml" }, rpmUnlimited ? "LOCAL" : "RPM"), /* @__PURE__ */ import_react13.default.createElement("span", { className: "meter-bar" }, /* @__PURE__ */ import_react13.default.createElement("i", { style: { width: `${rpmUnlimited ? 0 : Math.max(1.5, rpmRatio * 100)}%` } })), /* @__PURE__ */ import_react13.default.createElement("span", { className: "mv" }, rpmUnlimited ? `${num(rpm.used)} / \u221E` : `${num(rpm.used)} / ${rpmLimit}`)), /* @__PURE__ */ import_react13.default.createElement("div", { className: "cache-rows" }, /* @__PURE__ */ import_react13.default.createElement(Rowx, { k: "\u5E76\u53D1", v: `${num(cfg.synth?.concurrency)} \u8DEF` }), /* @__PURE__ */ import_react13.default.createElement(Rowx, { k: "\u961F\u5217", v: String(num(rpm.waiting)) }), rpmByProvider ? /* @__PURE__ */ import_react13.default.createElement(import_react13.default.Fragment, null, /* @__PURE__ */ import_react13.default.createElement(Rowx, { k: "\u4E91\u7AEF RPM", v: `${num(rpmByProvider.mimo?.used)} / ${num(rpmByProvider.mimo?.limit, 100)}` }), /* @__PURE__ */ import_react13.default.createElement(Rowx, { k: "\u672C\u5730 60s", v: `${num(rpmByProvider.local?.used)} / \u221E` })) : null, /* @__PURE__ */ import_react13.default.createElement(Rowx, { k: "\u7F13\u5B58 TTL", v: ttlText(ttl) }), /* @__PURE__ */ import_react13.default.createElement(Rowx, { k: "\u672C\u5730\u7B56\u7565", v: localResident ? "\u5E38\u9A7B (0s)" : `\u7701\u5185\u5B58 (${localIdleSec}s)` })))));
}

// client/components/Transport.jsx
var import_react14 = __toESM(require("react"), 1);
function Lamp({ on, label, value, warn }) {
  return /* @__PURE__ */ import_react14.default.createElement("div", { className: `lamp${on ? " on" : warn ? " warn" : " idle"}` }, /* @__PURE__ */ import_react14.default.createElement("span", { className: "dot" }), /* @__PURE__ */ import_react14.default.createElement("span", null, label), /* @__PURE__ */ import_react14.default.createElement("b", null, value));
}
var START_ICON = /* @__PURE__ */ import_react14.default.createElement("svg", { viewBox: "0 0 12 12", "aria-hidden": "true" }, /* @__PURE__ */ import_react14.default.createElement("path", { d: "M3.2 2.2v7.6L10 6z", fill: "currentColor", stroke: "none" }));
var STOP_ICON = /* @__PURE__ */ import_react14.default.createElement("svg", { viewBox: "0 0 12 12", "aria-hidden": "true" }, /* @__PURE__ */ import_react14.default.createElement("rect", { x: 3, y: 3, width: 6, height: 6, fill: "currentColor", stroke: "none" }));
var RESTART_ICON = /* @__PURE__ */ import_react14.default.createElement("svg", { viewBox: "0 0 12 12", "aria-hidden": "true" }, /* @__PURE__ */ import_react14.default.createElement("path", { d: "M9.5 6a3.5 3.5 0 1 1-1.1-2.5" }), /* @__PURE__ */ import_react14.default.createElement("path", { d: "M9.6 1.9v2.4H7.2" }));
var PAUSE_ICON = /* @__PURE__ */ import_react14.default.createElement("svg", { viewBox: "0 0 12 12", "aria-hidden": "true" }, /* @__PURE__ */ import_react14.default.createElement("rect", { x: 3, y: 2.5, width: 2, height: 7, fill: "currentColor", stroke: "none" }), /* @__PURE__ */ import_react14.default.createElement("rect", { x: 7, y: 2.5, width: 2, height: 7, fill: "currentColor", stroke: "none" }));
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
  const rpmUnlimited = Boolean(rpm.unlimited) || provider === "local" && rpm.limit == null;
  const rpmLimit = rpmUnlimited ? null : Math.max(1, num(rpm.limit, 100));
  const rpmText = rpmUnlimited ? `${num(rpm.used)} / \u221E` : `${num(rpm.used)} / ${rpmLimit}`;
  const isHybrid = provider === "hybrid";
  const usesLocal = provider === "local" || isHybrid;
  const localState = localInfo?.state || "disabled";
  const localWarm = Boolean(localInfo?.warm) || localState === "ready";
  const localStarting = localState === "starting";
  const localText = !usesLocal ? "OFF" : localWarm ? "READY" : localStarting ? "LOAD" : localState === "error" ? "ERR" : localState === "disabled" ? "OFF" : "STOP";
  const cloudReady = provider === "openai" ? Boolean(openai.ready) : Boolean(hybrid.cloudReady);
  const cloudLabel = provider === "openai" ? "OAI" : "\u4E91\u7AEF";
  const cloudVal = provider === "openai" ? running && openai.ready ? "ON" : "OFF" : provider === "mimo" ? running && cloudReady ? "ON" : "OFF" : running && isHybrid && cloudReady ? "STBY" : "OFF";
  const busyName = busy || "";
  const transCls = ["transport"];
  if (running) transCls.push("is-running", "is-playing");
  if (paused) transCls.push("is-paused");
  if (!running) transCls.push("is-stopped");
  const renderKey = (action, icon, zh, en, title, disabled) => /* @__PURE__ */ import_react14.default.createElement(
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
    /* @__PURE__ */ import_react14.default.createElement("span", { className: "zi" }, zh),
    /* @__PURE__ */ import_react14.default.createElement("span", { className: "ze" }, en)
  );
  const startZh = busyName === "start" || busyName === "restart" ? "\u542F\u52A8\u4E2D" : "\u542F\u52A8";
  const stopZh = busyName === "stop" ? "\u505C\u6B62\u4E2D" : "\u505C\u6B62";
  const restartZh = busyName === "restart" ? "\u91CD\u542F\u4E2D" : "\u91CD\u542F";
  const ratio = rpmUnlimited ? 0 : clamp(num(rpm.used) / rpmLimit, 0, 1);
  const liveCls = error ? "rail-live paused" : running ? paused ? "rail-live paused" : "rail-live" : "rail-live stopped";
  const liveWord = error ? "ERR" : running ? paused ? "PAUSED" : "LIVE" : "STOP";
  return /* @__PURE__ */ import_react14.default.createElement("header", { className: transCls.join(" "), id: "transport", "aria-label": "\u8D70\u5E26\u53F0" }, /* @__PURE__ */ import_react14.default.createElement("div", { className: "tp-bar" }, /* @__PURE__ */ import_react14.default.createElement("div", { className: "tp-cell", style: { paddingLeft: 0 } }, /* @__PURE__ */ import_react14.default.createElement("div", { className: "plate" }, /* @__PURE__ */ import_react14.default.createElement("svg", { className: "reel", viewBox: "0 0 32 32", "aria-hidden": "true" }, /* @__PURE__ */ import_react14.default.createElement("circle", { cx: 16, cy: 16, r: 13.4, fill: "none", stroke: "#5c6b62", strokeWidth: 1 }), /* @__PURE__ */ import_react14.default.createElement("g", { className: "rot" }, /* @__PURE__ */ import_react14.default.createElement("circle", { cx: 16, cy: 16, r: 8.4, fill: "none", stroke: "#cdd5cb", strokeWidth: 1.3 }), /* @__PURE__ */ import_react14.default.createElement("path", { d: "M16 7.6v16.8M8.9 11.8l14.2 8.4M8.9 20.2l14.2-8.4", stroke: "#cdd5cb", strokeWidth: 1, opacity: 0.4 }), /* @__PURE__ */ import_react14.default.createElement("circle", { cx: 16, cy: 16, r: 2.7, fill: "#b13a22" }), /* @__PURE__ */ import_react14.default.createElement("circle", { cx: 16, cy: 6.9, r: 1.2, fill: "#cdd5cb" }))), /* @__PURE__ */ import_react14.default.createElement("div", { className: "brand-txt" }, /* @__PURE__ */ import_react14.default.createElement("b", null, "\u542C\u4E66\u503C\u5B88"), /* @__PURE__ */ import_react14.default.createElement("small", null, `LISTENING DECK \xB7 M-${service?.port || "\u2014"}`)))), /* @__PURE__ */ import_react14.default.createElement("div", { className: "tp-cell tp-keys", role: "group", "aria-label": "\u670D\u52A1\u542F\u505C" }, renderKey("start", START_ICON, startZh, "START", "\u542F\u52A8\u670D\u52A1", running || Boolean(busy)), renderKey("stop", STOP_ICON, stopZh, "STOP", "\u505C\u6B62\u670D\u52A1", !running || Boolean(busy)), renderKey("restart", RESTART_ICON, restartZh, "RESTART", "\u91CD\u542F\u670D\u52A1", Boolean(busy))), /* @__PURE__ */ import_react14.default.createElement("div", { className: "tp-cell" }, /* @__PURE__ */ import_react14.default.createElement("div", { className: "lamps", "aria-label": "\u673A\u5668\u72B6\u6001" }, /* @__PURE__ */ import_react14.default.createElement(Lamp, { on: running, label: "RUN", value: running ? hms(service?.uptimeSec) : "\u2014" }), /* @__PURE__ */ import_react14.default.createElement(Lamp, { on: usesLocal && localWarm, label: "\u672C\u5730", value: localText, warn: usesLocal && (localStarting || localState === "error") }), /* @__PURE__ */ import_react14.default.createElement(Lamp, { on: running && cloudReady, label: cloudLabel, value: cloudVal }), /* @__PURE__ */ import_react14.default.createElement(
    Lamp,
    {
      on: running && isHybrid,
      label: "\u6DF7\u5408",
      value: isHybrid ? `${num(hybrid.bootstrapCount)}/${num(hybrid.maxCloudBootstrap)}` : "OFF"
    }
  ))), /* @__PURE__ */ import_react14.default.createElement("div", { className: "tp-cell" }, /* @__PURE__ */ import_react14.default.createElement("div", { className: "clock" }, /* @__PURE__ */ import_react14.default.createElement("b", null, clock(now)), /* @__PURE__ */ import_react14.default.createElement("small", null, `${dateStr(now)} ${weekdayOfTs(now)} \xB7 ${TZ_LABEL}`))), /* @__PURE__ */ import_react14.default.createElement("div", { className: "tp-pause-wrap" }, /* @__PURE__ */ import_react14.default.createElement(
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
    /* @__PURE__ */ import_react14.default.createElement("span", { className: "zi" }, paused ? "\u7EE7\u7EED" : "\u6682\u505C"),
    /* @__PURE__ */ import_react14.default.createElement("span", { className: "ze" }, "PAUSE")
  ))), /* @__PURE__ */ import_react14.default.createElement("div", { className: "tp-rail" }, /* @__PURE__ */ import_react14.default.createElement("span", { className: "rail-label" }, "\u5DE5\u4F5C\u9762 VIEW"), /* @__PURE__ */ import_react14.default.createElement("div", { className: "viewkeys", role: "group", "aria-label": "\u5DE5\u4F5C\u9762\u5207\u6362\uFF08\u5FEB\u6377\u952E 1\u20134\uFF09" }, VIEW_KEYS.map((v2) => /* @__PURE__ */ import_react14.default.createElement(
    "button",
    {
      key: v2.id,
      className: "viewkey",
      type: "button",
      "data-view": v2.id,
      "aria-pressed": String(view === v2.id),
      onClick: () => setView(v2.id)
    },
    /* @__PURE__ */ import_react14.default.createElement("span", { className: "vc" }, v2.cn),
    /* @__PURE__ */ import_react14.default.createElement("span", { className: "ve" }, v2.en)
  ))), /* @__PURE__ */ import_react14.default.createElement("div", { className: "rail-meters" }, /* @__PURE__ */ import_react14.default.createElement("div", { className: "meter", title: rpmUnlimited ? "\u672C\u5730\u5F15\u64CE\u4E0D\u53D7\u4E91\u7AEF RPM \u9650\u5236 \u2014 \u8FD1 60 \u79D2\u672C\u5730\u6BB5\u6570" : "\u6BCF\u5206\u949F\u8BF7\u6C42\u6570 \u2014 \u6ED1\u52A8 60 \u79D2\u7A97\u53E3" }, /* @__PURE__ */ import_react14.default.createElement("span", { className: "ml" }, rpmUnlimited ? "LOCAL/m" : "RPM"), /* @__PURE__ */ import_react14.default.createElement("span", { className: "meter-bar" }, /* @__PURE__ */ import_react14.default.createElement("i", { style: { width: `${rpmUnlimited ? 0 : Math.max(1.5, ratio * 100)}%` } })), /* @__PURE__ */ import_react14.default.createElement("span", { className: "mv" }, rpmText)), /* @__PURE__ */ import_react14.default.createElement("div", { className: "meter" }, /* @__PURE__ */ import_react14.default.createElement("span", { className: "ml" }, "\u961F\u5217"), /* @__PURE__ */ import_react14.default.createElement("span", { className: "mv" }, String(num(rpm.waiting)))), /* @__PURE__ */ import_react14.default.createElement("div", { className: "meter" }, /* @__PURE__ */ import_react14.default.createElement("span", { className: "ml" }, "\u672C\u7A97"), /* @__PURE__ */ import_react14.default.createElement("span", { className: "mv" }, `${items.length} \u6BB5 \xB7 ${mmssPad(totalAudio)}`))), /* @__PURE__ */ import_react14.default.createElement("div", { className: liveCls }, /* @__PURE__ */ import_react14.default.createElement("span", { className: "dot" }), /* @__PURE__ */ import_react14.default.createElement("i", null, liveWord), /* @__PURE__ */ import_react14.default.createElement("span", null, clock(now)))));
}

// client/components/Panel.jsx
function Panel() {
  const [state, setState] = (0, import_react15.useState)(null);
  const [error, setError] = (0, import_react15.useState)("");
  const [view, setView] = (0, import_react15.useState)("timeline");
  const [paused, setPaused] = (0, import_react15.useState)(false);
  const [frozen, setFrozen] = (0, import_react15.useState)(null);
  const [toast, setToast] = (0, import_react15.useState)("");
  const [busy, setBusy] = (0, import_react15.useState)("");
  const [saving, setSaving] = (0, import_react15.useState)(false);
  const [draft, setDraft] = (0, import_react15.useState)(null);
  const [savedAt, setSavedAt] = (0, import_react15.useState)("");
  const [selAt, setSelAt] = (0, import_react15.useState)(null);
  const [selSig, setSelSig] = (0, import_react15.useState)("");
  const [panelW, setPanelW] = (0, import_react15.useState)(0);
  const [range, setRange] = (0, import_react15.useState)(30);
  const [selectedDay, setSelectedDay] = (0, import_react15.useState)("");
  const [hoverAt, setHoverAt] = (0, import_react15.useState)(null);
  const [now, setNow] = (0, import_react15.useState)(() => Date.now());
  const [lastSync, setLastSync] = (0, import_react15.useState)(0);
  const [setupOpen, setSetupOpen] = (0, import_react15.useState)(false);
  const [bannerDismissed, setBannerDismissed] = (0, import_react15.useState)(false);
  const [doctorReport, setDoctorReport] = (0, import_react15.useState)(null);
  const toastTimer = (0, import_react15.useRef)(null);
  const syncedRef = (0, import_react15.useRef)("");
  const rootObs = (0, import_react15.useRef)(null);
  const roRaf = (0, import_react15.useRef)(0);
  const lastPanelW = (0, import_react15.useRef)(0);
  const showToast = (0, import_react15.useCallback)((text) => {
    setToast(text);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 2400);
  }, []);
  (0, import_react15.useEffect)(() => () => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
  }, []);
  const refresh = (0, import_react15.useCallback)(async () => {
    try {
      const next = await api("/state");
      setState(next);
      setError("");
      setLastSync(Date.now());
    } catch (err) {
      setError(String(err?.message || err));
    }
  }, []);
  (0, import_react15.useEffect)(() => {
    refresh();
    const timer = setInterval(() => {
      if (!document.hidden) refresh();
    }, 4e3);
    return () => clearInterval(timer);
  }, [refresh]);
  (0, import_react15.useEffect)(() => {
    const timer = setInterval(() => setNow(Date.now()), 1e3);
    return () => clearInterval(timer);
  }, []);
  (0, import_react15.useEffect)(() => () => {
    if (roRaf.current) cancelAnimationFrame(roRaf.current);
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
  const tm = (0, import_react15.useMemo)(() => buildTimeline(live?.recent), [live]);
  const items = tm.list;
  const lastSelRef = (0, import_react15.useRef)(-1);
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
  const appliedFlat = (0, import_react15.useMemo)(() => fromConfig(state?.config), [state?.config]);
  const changes = (0, import_react15.useMemo)(() => draft ? diffFields(draft, appliedFlat) : [], [draft, appliedFlat]);
  (0, import_react15.useEffect)(() => {
    if (!state?.config) return;
    const key = JSON.stringify(appliedFlat);
    if (changes.length) return;
    if (syncedRef.current === key) return;
    syncedRef.current = key;
    setDraft(appliedFlat);
  }, [appliedFlat, changes.length, state?.config]);
  const onSet = (0, import_react15.useCallback)((path, value) => {
    setDraft((d3) => d3 ? { ...d3, [path]: value } : d3);
  }, []);
  const onSetBatch = (0, import_react15.useCallback)((entries) => {
    setDraft((d3) => d3 ? { ...d3, ...entries } : d3);
  }, []);
  const onRefsChange = (0, import_react15.useCallback)((nextRefs) => {
    setState((prev) => prev ? { ...prev, refs: nextRefs } : prev);
  }, []);
  const applySetupPatch = (0, import_react15.useCallback)(async (patch) => {
    const next = await api("/config", { method: "PUT", body: JSON.stringify(patch) });
    setState(next);
    const nextFlat = fromConfig(next?.config);
    setDraft(nextFlat);
    syncedRef.current = JSON.stringify(nextFlat);
    setSavedAt(clock(Date.now()));
  }, []);
  const resetMetrics = (0, import_react15.useCallback)(async () => {
    try {
      await resetMetricsApi();
      await refresh();
      showToast("\u5DF2\u6E05\u7A7A\u5DE5\u7A0B\u53F2\u7EDF\u8BA1\u6570\u636E");
    } catch (err) {
      showToast(`\u6E05\u7A7A\u5931\u8D25\uFF1A${String(err?.message || err)}`);
    }
  }, [refresh, showToast]);
  const act = (0, import_react15.useCallback)(async (action) => {
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
  const actLocal = (0, import_react15.useCallback)(async (action) => {
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
  const toggleLocalResident = (0, import_react15.useCallback)(async () => {
    if (busy) return;
    const curIdle = Number(state?.config?.upstream?.local?.idleUnloadSeconds ?? 1800);
    const nextIdle = curIdle === 0 ? 1800 : 0;
    setBusy("local:resident");
    try {
      const next = await api("/config", {
        method: "PUT",
        body: JSON.stringify({ upstream: { local: { idleUnloadSeconds: nextIdle } } })
      });
      setState(next);
      if (!changes.length) {
        const nextFlat = fromConfig(next?.config);
        setDraft(nextFlat);
        syncedRef.current = JSON.stringify(nextFlat);
      }
      showToast(nextIdle === 0 ? "\u5DF2\u5207\u6362\u4E3A\u5E38\u9A7B\u6A21\u5F0F\uFF08\u4E0D\u518D\u7A7A\u95F2\u5378\u8F7D\uFF0C\u7EA6\u5360 1\u20132.3 GB\uFF09" : "\u5DF2\u5207\u6362\u4E3A\u7701\u5185\u5B58\u6A21\u5F0F\uFF08\u7A7A\u95F2 30 \u5206\u949F\u540E\u81EA\u52A8\u5378\u8F7D\uFF09");
    } catch (err) {
      showToast(String(err?.message || err));
    } finally {
      setBusy("");
    }
  }, [busy, changes.length, showToast, state?.config]);
  const togglePause = (0, import_react15.useCallback)(() => {
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
  const onSelect = (0, import_react15.useCallback)((item) => {
    if (!item) return;
    setSelAt(item.at);
    setSelSig(item.sig);
  }, []);
  const onHover = (0, import_react15.useCallback)((item) => {
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
    const lines = [header].concat(days.map((d3) => [
      d3.day,
      Number(d3.requests) || 0,
      Number(d3.segments) || 0,
      Number(d3.chars) || 0,
      Number(d3.seconds) || 0,
      Number(d3.bytes) || 0,
      Number(d3.errors) || 0
    ].join(",")));
    const ok = download(`audiobook-tts-days-${range}.csv`, lines.join("\n"), "text/csv;charset=utf-8");
    showToast(ok ? `\u5DF2\u5BFC\u51FA CSV \xB7 ${days.length} \u65E5` : "\u6D4F\u89C8\u5668\u62E6\u622A\u4E86\u4E0B\u8F7D");
  };
  const onCopy = async (kind) => {
    const imp = state?.import || {};
    const cfg = state?.config || {};
    const tokenQuery = cfg.auth?.enabled && cfg.auth?.token ? `?token=${encodeURIComponent(cfg.auth.token)}` : "";
    const openaiBase = imp.openaiBaseUrl || `http://127.0.0.1:${service?.port || cfg.server?.port || 8291}/v1`;
    const openaiModel = cfg.openaiServer?.defaultModel || "audiobook-tts";
    const openaiUsesCustomKey = Boolean(imp.openaiUsesCustomKey || cfg.openaiServer?.apiKey);
    const keyHint = openaiUsesCustomKey ? "<\u72EC\u7ACB Bearer Key\uFF08\u89C1\u8BBE\u7F6E 09\uFF09>" : cfg.auth?.token || "";
    let text = "";
    if (kind === "import") text = imp.jsonUrl || "";
    else if (kind === "share-import") text = imp.shareBestJsonUrl || imp.sharePublicJsonUrl || imp.shareRelayJsonUrl || imp.shareQuickJsonUrl || imp.shareJsonUrl || "";
    else if (kind === "share-token") text = imp.shareToken || "";
    else if (kind === "public-import") text = imp.publicJsonUrl || "";
    else if (kind === "quick-import") text = imp.quickJsonUrl || "";
    else if (kind === "relay-import") text = imp.relayJsonUrl || (imp.relayBaseUrl ? `${imp.relayBaseUrl}/legado.json${tokenQuery}` : "");
    else if (kind === "quick-url") text = imp.quickTunnelUrl || state?.tunnel?.quickUrl || "";
    else if (kind === "listen") text = imp.listenUrl || "";
    else if (kind === "body") text = BODY_TEXT;
    else if (kind === "json") text = JSON.stringify(legadoPayload(imp, cfg), null, 2);
    else if (kind === "curl") text = curlText(imp.listenUrl);
    else if (kind === "token") text = cfg.auth?.token || "";
    else if (kind === "openai-base") text = openaiBase;
    else if (kind === "openai-card") {
      text = [
        `Base URL: ${openaiBase}`,
        `API Key: ${keyHint}`,
        `Model: ${openaiModel}`,
        "Voice: alloy\uFF08\u81EA\u52A8\u65C1\u767D/\u5BF9\u8BDD\u5206\u97F3\u8272\uFF09"
      ].join("\n");
    } else if (kind === "openai-curl") {
      text = [
        `curl -X POST '${openaiBase}/audio/speech' \\`,
        `  -H 'Authorization: Bearer ${keyHint}' \\`,
        "  -H 'Content-Type: application/json' \\",
        `  -d '{"model":"${openaiModel}","input":"\u5C71\u9053\u4E0A\u8D77\u4E86\u96FE\u3002","voice":"alloy","response_format":"wav"}' \\`,
        "  --output openai-test.wav"
      ].join("\n");
    }
    if (!text) {
      showToast("\u6CA1\u6709\u53EF\u590D\u5236\u7684\u5185\u5BB9");
      return;
    }
    const ok = await writeClipboard(text);
    showToast(ok ? `\u5DF2\u590D\u5236 \xB7 ${COPY_LABEL[kind] || kind}` : "\u590D\u5236\u88AB\u6D4F\u89C8\u5668\u62E6\u622A\uFF0C\u8BF7\u624B\u52A8\u9009\u4E2D");
  };
  const onOpenSettings = (0, import_react15.useCallback)((moduleId = "") => {
    setView("settings");
    if (moduleId) {
      setTimeout(() => {
        const el = document.getElementById(moduleId);
        el?.scrollIntoView?.({ block: "start" });
      }, 60);
    }
  }, []);
  (0, import_react15.useEffect)(() => {
    const onKey = (e3) => {
      const tag = String(e3.target?.tagName || "").toLowerCase();
      const typing = tag === "input" || tag === "textarea" || tag === "select";
      if ((e3.ctrlKey || e3.metaKey) && (e3.key === "s" || e3.key === "S") && view === "settings") {
        e3.preventDefault();
        save();
        return;
      }
      if (typing) return;
      if (["1", "2", "3", "4"].includes(e3.key)) {
        e3.preventDefault();
        setView(["timeline", "settings", "archive", "delivery"][Number(e3.key) - 1]);
        return;
      }
      if (view === "timeline" && (e3.key === "ArrowLeft" || e3.key === "ArrowRight")) {
        if (!running || !items.length) return;
        e3.preventDefault();
        const dir = e3.key === "ArrowRight" ? 1 : -1;
        const nextIdx = clamp(selIndex + dir, 0, items.length - 1);
        setSelAt(items[nextIdx].at);
        setSelSig(items[nextIdx].sig);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  });
  const rootRef = (0, import_react15.useCallback)((node) => {
    if (roRaf.current) {
      cancelAnimationFrame(roRaf.current);
      roRaf.current = 0;
    }
    if (rootObs.current) {
      rootObs.current.disconnect();
      rootObs.current = null;
    }
    if (node && typeof ResizeObserver !== "undefined") {
      const ro = new ResizeObserver((entries) => {
        const w2 = Math.round(entries[0]?.contentRect?.width || 0);
        if (!w2 || w2 === lastPanelW.current) return;
        if (roRaf.current) cancelAnimationFrame(roRaf.current);
        roRaf.current = requestAnimationFrame(() => {
          roRaf.current = 0;
          lastPanelW.current = w2;
          setPanelW(w2);
        });
      });
      ro.observe(node);
      rootObs.current = ro;
    }
  }, []);
  if (!state) {
    return /* @__PURE__ */ import_react15.default.createElement("div", { className: "mtt", ref: rootRef }, /* @__PURE__ */ import_react15.default.createElement("style", { dangerouslySetInnerHTML: { __html: deck_default } }), /* @__PURE__ */ import_react15.default.createElement("div", { className: "deck", style: { gridTemplateRows: "1fr" } }, /* @__PURE__ */ import_react15.default.createElement(
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
      /* @__PURE__ */ import_react15.default.createElement("b", { style: { fontSize: 14, color: "var(--ink)", letterSpacing: ".04em" } }, error ? "\u8BFB\u4E0D\u5230\u5BBF\u4E3B\u63A5\u53E3" : "\u6B63\u5728\u8FDE\u63A5\u5BBF\u4E3B\u2026"),
      /* @__PURE__ */ import_react15.default.createElement("span", null, error || "GET /mimo-tts/api/state"),
      error ? /* @__PURE__ */ import_react15.default.createElement("button", { className: "btn", type: "button", onClick: refresh }, "\u91CD\u8BD5") : null
    )), /* @__PURE__ */ import_react15.default.createElement("div", { className: `toast${toast ? " show" : ""}`, role: "status", "aria-live": "polite" }, /* @__PURE__ */ import_react15.default.createElement("span", { className: "tdot" }), /* @__PURE__ */ import_react15.default.createElement("span", null, toast)));
  }
  const hint = error ? `\u8BFB\u4E0D\u5230\u5BBF\u4E3B\u63A5\u53E3\uFF1A${error}` : hoverItem ? `\u7B2C ${hoverItem.index + 1} \u6BB5 \xB7 ${ROLE_CN[hoverItem.role]} \xB7 ${hoverItem.sourceLabel} \xB7 ${hoverItem.error ? "\u5931\u8D25" : latSec(hoverItem.latencyMs)} \xB7 ${hoverItem.chars} \u5B57 \xB7 ${clock(hoverItem.at)} \xB7 ${deviceOf(hoverItem.client)}` : HINTS[view] || "";
  let viewNode;
  if (view === "timeline") {
    viewNode = /* @__PURE__ */ import_react15.default.createElement("section", { className: "view view--timeline", id: "view-timeline", "aria-label": "\u65F6\u95F4\u7EBF\u5DE5\u4F5C\u53F0" }, /* @__PURE__ */ import_react15.default.createElement(
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
    ), /* @__PURE__ */ import_react15.default.createElement(
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
    ), /* @__PURE__ */ import_react15.default.createElement(
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
        onToggleResident: toggleLocalResident,
        busy,
        lastSync
      }
    ));
  } else if (view === "settings") {
    viewNode = /* @__PURE__ */ import_react15.default.createElement(
      SettingsView,
      {
        live,
        localInfo,
        draft,
        applied: appliedFlat,
        changes,
        presetVoices,
        builtinVoiceProfiles: state?.builtinVoiceProfiles,
        builtinRulePresets: state?.builtinRulePresets,
        builtinPolyphonePresets: state?.builtinPolyphonePresets,
        refs: state?.refs,
        importInfo: state?.import || {},
        onRefsChange,
        onRefreshState: refresh,
        onOpenSetup: () => setSetupOpen(true),
        saving,
        savedAt,
        onSet,
        onSetBatch,
        onSave: save,
        onRevert: revert,
        onExportConfig: exportConfig,
        showToast
      }
    );
  } else if (view === "archive") {
    viewNode = /* @__PURE__ */ import_react15.default.createElement(
      ArchiveView,
      {
        live,
        range,
        setRange,
        selectedDay,
        onSelectDay: (day) => setSelectedDay(day),
        onExportCsv: exportCsv,
        onResetMetrics: resetMetrics
      }
    );
  } else {
    viewNode = /* @__PURE__ */ import_react15.default.createElement(
      DeliveryView,
      {
        service,
        live,
        config,
        importInfo: state.import || {},
        tunnel: state.tunnel || {},
        onRefreshState: refresh,
        onOpenSettings,
        onCopy,
        onExportConfig: exportConfig,
        onOpenSetup: () => setSetupOpen(true),
        onDiagAction: async (action) => {
          if (action === "start-service") {
            await act("start");
            return;
          }
          if (action === "switch-local") {
            await applySetupPatch({ upstream: { provider: "local" } });
            showToast("\u5DF2\u5207\u6362\u6E32\u67D3\u6765\u6E90\u4E3A\uFF1A\u672C\u5730 Qwen3-TTS");
          }
        },
        showToast
      }
    );
  }
  return /* @__PURE__ */ import_react15.default.createElement("div", { className: "mtt", ref: rootRef }, /* @__PURE__ */ import_react15.default.createElement("style", { dangerouslySetInnerHTML: { __html: deck_default } }), /* @__PURE__ */ import_react15.default.createElement("div", { className: "deck" }, /* @__PURE__ */ import_react15.default.createElement("div", { className: "tp-stack" }, /* @__PURE__ */ import_react15.default.createElement(
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
  ), /* @__PURE__ */ import_react15.default.createElement(
    SetupBanner,
    {
      setupSummary: state?.setupSummary,
      config,
      doctorReport,
      dismissed: bannerDismissed,
      onDismiss: () => setBannerDismissed(true),
      onOpenDrawer: () => setSetupOpen(true)
    }
  )), /* @__PURE__ */ import_react15.default.createElement("main", { className: "bench" }, viewNode), /* @__PURE__ */ import_react15.default.createElement(
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
  )), /* @__PURE__ */ import_react15.default.createElement(
    SetupDrawer,
    {
      open: setupOpen,
      onClose: () => setSetupOpen(false),
      onApplyPatch: applySetupPatch,
      onRefreshState: refresh,
      onDoctorReport: (rep) => {
        setDoctorReport(rep);
        if (rep && rep.ok === false) setBannerDismissed(false);
      },
      showToast
    }
  ), /* @__PURE__ */ import_react15.default.createElement("div", { className: `toast${toast ? " show" : ""}`, role: "status", "aria-live": "polite" }, /* @__PURE__ */ import_react15.default.createElement("span", { className: "tdot" }), /* @__PURE__ */ import_react15.default.createElement("span", null, toast)));
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
