#!/usr/bin/env bash
# Agent 安装侧只读预检脚本（v0.5.0）：
#   ./setup/agent-preflight.sh          # 输出严格合法 JSON（默认）
#   ./setup/agent-preflight.sh --human  # 输出人类可读摘要
#
# 安全红线：
#   - 严格只读，不修改任何配置、Profile 或进程；
#   - 严禁输出任何明文 API Key、口令或 URL Token。
set -uo pipefail

HUMAN=0
for arg in "$@"; do
  case "$arg" in
    --human) HUMAN=1 ;;
    -h|--help)
      echo "Usage: $0 [--human]"
      exit 0
      ;;
  esac
done

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$HERE/.." && pwd)"

if ! command -v python3 >/dev/null 2>&1; then
  if [ "$HUMAN" -eq 1 ]; then
    echo "FAIL: python3 not found"
  else
    printf '{"error":"python3 not found"}\n'
  fi
  exit 1
fi

HUMAN="$HUMAN" REPO_ROOT="$REPO_ROOT" python3 - <<'PY'
import json
import os
import platform
import re
import shutil
import socket
import subprocess
import urllib.request
from pathlib import Path

repo_root = Path(os.environ.get("REPO_ROOT", ".")).resolve()
dsh_home = Path(os.environ.get("DSH_HOME") or (Path.home() / ".dsh"))

EXTRA_PATHS = ["/opt/homebrew/bin", "/usr/local/bin", "/usr/bin", "/bin"]


def safe_is_dir(p):
    try:
        return p.is_dir()
    except OSError:
        return False


def safe_is_file(p):
    try:
        return p.is_file()
    except OSError:
        return False


def safe_exists(p):
    try:
        return p.exists()
    except OSError:
        return False


def safe_iterdir(p):
    try:
        return sorted(p.iterdir())
    except OSError:
        return []


def safe_stat_size(p):
    try:
        return p.stat().st_size if p.is_file() else 0
    except OSError:
        return 0


def find_bin(name):
    found = shutil.which(name)
    if found:
        return found
    for d in EXTRA_PATHS:
        cand = Path(d) / name
        if cand.exists() and os.access(cand, os.X_OK):
            return str(cand)
    if name == "tailscale" and platform.system() == "Darwin":
        app_ts = Path("/Applications/Tailscale.app/Contents/MacOS/Tailscale")
        if app_ts.exists() and os.access(app_ts, os.X_OK):
            return str(app_ts)
    return ""


def run_cmd(cmd, timeout=3):
    try:
        p = subprocess.run(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            timeout=timeout,
        )
        return p.returncode, (p.stdout or "").strip(), (p.stderr or "").strip()
    except Exception as exc:
        return -1, "", str(exc)


def first_line(text):
    for line in (text or "").splitlines():
        s = line.strip()
        if s:
            return s
    return ""


# 1. Platform
sys_name = platform.system()
machine = platform.machine()
is_apple_silicon = sys_name == "Darwin" and machine == "arm64"

# 2. Node & Python3
node_bin = find_bin("node")
node_ver = ""
if node_bin:
    rc, out, err = run_cmd([node_bin, "--version"], timeout=3)
    if rc == 0:
        node_ver = first_line(out or err)

py_bin = find_bin("python3")
py_ver = ""
if py_bin:
    rc, out, err = run_cmd([py_bin, "--version"], timeout=3)
    if rc == 0:
        py_ver = first_line(out or err)

# 3. DSH & profiles
dsh_bin = find_bin("dsh")
dsh_ver = ""
if dsh_bin:
    rc, out, err = run_cmd([dsh_bin, "--version"], timeout=3)
    if rc == 0:
        dsh_ver = first_line(out or err)

profiles = []
profiles_dir = dsh_home / "profiles"
if safe_is_dir(profiles_dir):
    for pdir in safe_iterdir(profiles_dir):
        pkg_file = pdir / "package.json"
        if not safe_is_dir(pdir) or not safe_is_file(pkg_file):
            continue
        rec = {
            "name": pdir.name,
            "path": str(pkg_file),
            "hasDependency": False,
            "dependencySpec": "",
            "hasBundle": False,
            "installedBoth": False,
        }
        try:
            pkg = json.loads(pkg_file.read_text(encoding="utf-8"))
            deps = pkg.get("dependencies") or {}
            if "audiobook-tts-plugin" in deps:
                rec["hasDependency"] = True
                rec["dependencySpec"] = str(deps.get("audiobook-tts-plugin") or "")
            bundles = (((pkg.get("dsh") or {}).get("profile") or {}).get("bundles")) or []
            if "audiobook-tts-plugin" in bundles:
                rec["hasBundle"] = True
            rec["installedBoth"] = rec["hasDependency"] and rec["hasBundle"]
        except Exception as exc:
            rec["parseError"] = str(exc)
        profiles.append(rec)

# 4. DataDir & redacted config summary
explicit_data = os.environ.get("AUDIOBOOK_TTS_DATA") or os.environ.get("MIMO_TTS_DATA") or os.environ.get("AUDIOBOOK_DATA") or os.environ.get("MIMO_DATA") or ""
modern_dir = dsh_home / "plugin-data" / "audiobook-tts-plugin"
legacy_dir = dsh_home / "plugin-data" / "mimo-tts"
if explicit_data:
    data_dir = Path(os.path.expanduser(explicit_data))
elif not safe_exists(modern_dir) and safe_exists(legacy_dir):
    data_dir = legacy_dir
else:
    data_dir = modern_dir

cfg_file = data_dir / "config.json"
cfg = {}
config_valid = False
if safe_is_file(cfg_file):
    try:
        cfg = json.loads(cfg_file.read_text(encoding="utf-8"))
        if isinstance(cfg, dict):
            config_valid = True
    except Exception:
        cfg = {}

srv_cfg = cfg.get("server") or {}
auth_cfg = cfg.get("auth") or {}
up_cfg = cfg.get("upstream") or {}
oa_srv_cfg = cfg.get("openaiServer") or {}
tun_cfg = cfg.get("tunnel") or {}
kv_cfg = tun_cfg.get("kvSync") or {}

port = int(srv_cfg.get("port") or 8291) if str(srv_cfg.get("port") or "").isdigit() else 8291
keys_list = up_cfg.get("keys") if isinstance(up_cfg.get("keys"), list) else []

data_dir_info = {
    "path": str(data_dir),
    "modernExists": safe_exists(modern_dir),
    "legacyExists": safe_exists(legacy_dir),
    "configExists": safe_is_file(cfg_file),
    "configValid": config_valid,
    "provider": str(up_cfg.get("provider") or "mimo"),
    "port": port,
    "authEnabled": bool(auth_cfg.get("enabled", True)),
    "hasToken": bool(auth_cfg.get("token")),
    "hasMimoKeys": len([k for k in keys_list if k]) > 0,
    "mimoKeysCount": len([k for k in keys_list if k]),
    "openaiServerEnabled": bool(oa_srv_cfg.get("enabled", False)),
    "openaiServerHasCustomKey": bool(str(oa_srv_cfg.get("apiKey") or "").strip()),
    "publicUrl": str(srv_cfg.get("publicUrl") or ""),
    "publicRelayUrl": str(kv_cfg.get("publicRelayUrl") or ""),
}

# 5. Service /health + port occupation
health_ok = False
health_safe = {}
try:
    req = urllib.request.Request(f"http://127.0.0.1:{port}/health", method="GET")
    with urllib.request.urlopen(req, timeout=2) as resp:
        raw = resp.read().decode("utf-8", errors="replace")
        parsed = json.loads(raw)
        if parsed.get("status") == "ok":
            health_ok = True
            health_safe = {
                "status": parsed.get("status"),
                "running": bool(parsed.get("running")),
                "version": str(parsed.get("version") or ""),
                "provider": str(parsed.get("provider") or ""),
                "uptimeSec": int(parsed.get("uptimeSec") or 0),
            }
except Exception:
    pass

port_listening = False
port_holder = ""
lsof_bin = find_bin("lsof")
if lsof_bin:
    rc, out, _ = run_cmd([lsof_bin, "-nP", f"-iTCP:{port}", "-sTCP:LISTEN"], timeout=3)
    lines = [ln for ln in out.splitlines() if ln.strip()]
    if rc == 0 and len(lines) >= 2:
        parts = lines[1].split()
        if len(parts) >= 2:
            port_listening = True
            port_holder = f"{parts[0]} pid={parts[1]}"

# 6. Local model & vocoder
local_cfg = up_cfg.get("local") or {}
raw_model = str(local_cfg.get("modelPath") or "").strip()
model_path = Path(os.path.expanduser(raw_model)) if raw_model else (data_dir / "models" / "qwen3tts-0.6b-base-8bit")
main_file = model_path / "model.safetensors"
vocoder_file = model_path / "speech_tokenizer" / "model.safetensors"
main_size = safe_stat_size(main_file)
vocoder_size = safe_stat_size(vocoder_file)
main_mb = round(main_size / (1024 * 1024)) if main_size else 0
vocoder_mb = round(vocoder_size / (1024 * 1024)) if vocoder_size else 0
model_cfg_exists = safe_is_file(model_path / "config.json")
model_valid = bool(
    model_cfg_exists
    and main_size >= 400 * 1024 * 1024
    and vocoder_size >= 600 * 1024 * 1024
)

# 7. Refs
refs_dir = repo_root / "refs"
ref_files = sorted([f.name for f in refs_dir.glob("*.wav")]) if safe_is_dir(refs_dir) else []

# 8. HTTPS tools
cf_bin = find_bin("cloudflared")
cf_info = {"installed": False, "path": "", "version": ""}
if cf_bin:
    rc, out, err = run_cmd([cf_bin, "--version"], timeout=3)
    ver = first_line(out or err)
    cf_info = {"installed": rc == 0 or bool(ver), "path": cf_bin, "version": ver}

ts_bin = find_bin("tailscale")
ts_info = {
    "installed": False,
    "path": "",
    "online": False,
    "loggedIn": False,
    "backendState": "",
    "dnsName": "",
    "funnelEnabled": False,
    "funnelUrl": "",
}
if ts_bin:
    ts_info["installed"] = True
    ts_info["path"] = ts_bin
    rc, out, _ = run_cmd([ts_bin, "status", "--json"], timeout=3)
    try:
        st = json.loads(out or "{}")
        backend_state = str(st.get("BackendState") or "")
        self_node = st.get("Self") or {}
        dns_name = str(self_node.get("DNSName") or "").rstrip(".")
        online = backend_state == "Running" and self_node.get("Online") is not False
        ts_info["backendState"] = backend_state
        ts_info["dnsName"] = dns_name
        ts_info["online"] = online
        ts_info["loggedIn"] = backend_state == "Running" or bool(dns_name)
        if dns_name:
            ts_info["funnelUrl"] = f"https://{dns_name}"
    except Exception:
        pass
    if ts_info["online"] or rc == 0:
        frc, fout, ferr = run_cmd([ts_bin, "funnel", "status"], timeout=3)
        ftxt = fout or ferr
        ts_info["funnelEnabled"] = bool(frc == 0 and re.search(r"https://|funnel on", ftxt, re.I))

wr_bin = find_bin("wrangler")
wr_info = {"installed": False, "path": "", "version": ""}
if wr_bin:
    rc, out, err = run_cmd([wr_bin, "--version"], timeout=3)
    ver = first_line(out or err)
    wr_info = {"installed": rc == 0 or bool(ver), "path": wr_bin, "version": ver}

# 9. LAN IPs (exclude loopback & 198.18.0.0/15 TUN interfaces)
def collect_lan_ips():
    ips = set()
    for tool_cmd in (["ifconfig"], ["ip", "-4", "addr"]):
        if not find_bin(tool_cmd[0]):
            continue
        rc, out, _ = run_cmd(tool_cmd, timeout=3)
        if rc == 0 and out:
            for m in re.findall(r"\binet\s+(\d+\.\d+\.\d+\.\d+)", out):
                if m.startswith("127.") or re.match(r"^198\.1[89]\.", m):
                    continue
                ips.add(m)
            break
    if not ips:
        try:
            for info in socket.getaddrinfo(socket.gethostname(), None, socket.AF_INET):
                ip = info[4][0]
                if not ip.startswith("127.") and not re.match(r"^198\.1[89]\.", ip):
                    ips.add(ip)
        except Exception:
            pass

    def score(ip):
        if ip.startswith("192.168."):
            return (3, ip)
        if ip.startswith("10."):
            return (2, ip)
        m = re.match(r"^172\.(\d+)\.", ip)
        if m and 16 <= int(m.group(1)) <= 31:
            return (1, ip)
        return (0, ip)

    return [ip for ip in sorted(ips, key=lambda x: (-score(x)[0], x))]


payload = {
    "repoRoot": str(repo_root),
    "platform": {
        "os": sys_name,
        "arch": machine,
        "isAppleSilicon": is_apple_silicon,
    },
    "node": {
        "found": bool(node_bin),
        "path": node_bin,
        "version": node_ver,
    },
    "python3": {
        "found": bool(py_bin),
        "path": py_bin,
        "version": py_ver,
    },
    "dsh": {
        "found": bool(dsh_bin),
        "path": dsh_bin,
        "version": dsh_ver,
        "home": str(dsh_home),
        "profiles": profiles,
    },
    "dataDir": data_dir_info,
    "service": {
        "port": port,
        "healthOk": health_ok,
        "health": health_safe,
        "portListening": port_listening,
        "portHolder": port_holder,
    },
    "model": {
        "path": str(model_path),
        "exists": safe_is_dir(model_path),
        "configExists": model_cfg_exists,
        "mainMb": main_mb,
        "vocoderMb": vocoder_mb,
        "valid": model_valid,
    },
    "refs": {
        "dir": str(refs_dir),
        "builtinCount": len(ref_files),
        "files": ref_files,
    },
    "httpsTools": {
        "cloudflared": cf_info,
        "tailscale": ts_info,
        "wrangler": wr_info,
    },
    "lanIps": collect_lan_ips(),
}

if os.environ.get("HUMAN") != "1":
    print(json.dumps(payload, ensure_ascii=False, indent=2))
else:
    p = payload["platform"]
    print(f"== 平台 == {p['os']}/{p['arch']} (Apple Silicon={p['isAppleSilicon']})")
    print(f"  node={payload['node']['version'] or 'missing'}  python3={payload['python3']['version'] or 'missing'}")
    print()
    print(f"== DSH == {payload['dsh']['version'] or 'not found'} ({payload['dsh']['home']})")
    for prof in payload["dsh"]["profiles"]:
        print(f"  - profile={prof['name']} dep={prof['hasDependency']} bundle={prof['hasBundle']} ok={prof['installedBoth']}")
    if not payload["dsh"]["profiles"]:
        print("  - (no profiles found)")
    print()
    dd = payload["dataDir"]
    print(f"== 数据目录 == {dd['path']}")
    print(f"  config={dd['configExists']} provider={dd['provider']} port={dd['port']} openaiServer={dd['openaiServerEnabled']}")
    print()
    sv = payload["service"]
    print(f"== 服务 == port={sv['port']} healthOk={sv['healthOk']} listening={sv['portListening']} {sv['portHolder']}")
    md = payload["model"]
    print(f"== 模型 == valid={md['valid']} main={md['mainMb']}MB vocoder={md['vocoderMb']}MB")
    print(f"== 参考音 == {payload['refs']['builtinCount']} 个: {', '.join(payload['refs']['files'])}")
    ht = payload["httpsTools"]
    print("== HTTPS 工具 ==")
    print(f"  cloudflared: {ht['cloudflared']['installed']} ({ht['cloudflared']['version']})")
    print(f"  tailscale:   {ht['tailscale']['installed']} online={ht['tailscale']['online']} dns={ht['tailscale']['dnsName']} funnel={ht['tailscale']['funnelEnabled']}")
    print(f"  wrangler:    {ht['wrangler']['installed']} ({ht['wrangler']['version']})")
    print(f"== LAN IPs == {', '.join(payload['lanIps']) or '(none)'}")
PY
