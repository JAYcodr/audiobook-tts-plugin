#!/usr/bin/env python
"""本地 Qwen3-TTS sidecar（独立进程，按需起停）。

职责：
  - 加载 MLX 模型与参考音（启动一次，常驻）
  - 暴露 `POST /synthesize`，返回完整 WAV（Legado 的进度依赖真实时长）
  - `GET /health` 给 Node 侧做就绪/状态/内存探针
  - 空闲自动退出（Node 侧也会杀，属于双保险；Node 挂了也不留孤儿）

刻意不做：
  - 不读插件配置、不写缓存、不做文本切分 —— 这些都留在 Node 内核里
  - 不监听 0.0.0.0，只绑 127.0.0.1；它不是给手机直连的

依赖：mlx-audio（Apple Silicon）、numpy、soundfile（mlx-audio 的依赖链）
"""

import argparse
import json
import os
import re
import resource
import signal
import sys
import threading
import time
import traceback
import wave
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from io import BytesIO

import numpy as np

try:
    import mlx.core as mx
except Exception:  # 非 Apple Silicon / 没装 mlx
    mx = None

# MLX 把释放的 GPU buffer 留在自己的 free cache 里，上限默认 = memory_limit
# （macOS 26 / M4 16G 实测 15.2GiB），进程 footprint 因此能涨到"推荐工作集"
# 11.84GB。这些是 Metal/IOKit 内存，系统按 wired 记账——压缩不了、换不出去，
# 听书半小时就能把整机推到 swap。64MB 封顶 + 每段主动归还后，footprint 稳定
# 在模型权重本身（约 2.3GB）+ 约 1.2GB 驱动堆，不再随请求数上涨。
MLX_CACHE_LIMIT_MB = int(os.environ.get("TTS_MLX_CACHE_LIMIT_MB", "64") or 0)
MLX_TRIM_THRESHOLD = 256 * 1024 * 1024

_RUSAGE_FN = None  # None=未初始化 / False=不可用 / callable=可用


def _memory_footprint():
    """当前 phys_footprint 与生命周期峰值（字节）。

    活动监视器「内存」那一列读的就是 phys_footprint，它包含 IOKit/Metal 的
    GPU 内存；resource.getrusage().ru_maxrss 不含这部分 —— 实测同一个进程
    footprint 3.5GB 时 ru_maxrss 只有 2.3GB，旧引擎 2.3GB 时报的是 1.0GB。
    读不到返回 (None, None)，绝不让 /health 挂掉。
    """
    global _RUSAGE_FN
    if _RUSAGE_FN is False:
        return None, None
    if _RUSAGE_FN is None:
        try:
            import ctypes

            class _RusageInfoV4(ctypes.Structure):
                _fields_ = [
                    ("ri_uuid", ctypes.c_uint8 * 16),
                    ("ri_user_time", ctypes.c_uint64),
                    ("ri_system_time", ctypes.c_uint64),
                    ("ri_pkg_idle_wkups", ctypes.c_uint64),
                    ("ri_interrupt_wkups", ctypes.c_uint64),
                    ("ri_pageins", ctypes.c_uint64),
                    ("ri_wired_size", ctypes.c_uint64),
                    ("ri_resident_size", ctypes.c_uint64),
                    ("ri_phys_footprint", ctypes.c_uint64),
                    ("ri_proc_start_abstime", ctypes.c_uint64),
                    ("ri_proc_exit_abstime", ctypes.c_uint64),
                    ("ri_child_user_time", ctypes.c_uint64),
                    ("ri_child_system_time", ctypes.c_uint64),
                    ("ri_child_pkg_idle_wkups", ctypes.c_uint64),
                    ("ri_child_interrupt_wkups", ctypes.c_uint64),
                    ("ri_child_pageins", ctypes.c_uint64),
                    ("ri_child_elapsed_abstime", ctypes.c_uint64),
                    ("ri_diskio_bytesread", ctypes.c_uint64),
                    ("ri_diskio_byteswritten", ctypes.c_uint64),
                    ("ri_cpu_time_qos_default", ctypes.c_uint64),
                    ("ri_cpu_time_qos_maintenance", ctypes.c_uint64),
                    ("ri_cpu_time_qos_background", ctypes.c_uint64),
                    ("ri_cpu_time_qos_utility", ctypes.c_uint64),
                    ("ri_cpu_time_qos_legacy", ctypes.c_uint64),
                    ("ri_cpu_time_qos_user_initiated", ctypes.c_uint64),
                    ("ri_cpu_time_qos_user_interactive", ctypes.c_uint64),
                    ("ri_billed_system_time", ctypes.c_uint64),
                    ("ri_serviced_system_time", ctypes.c_uint64),
                    ("ri_logical_writes", ctypes.c_uint64),
                    ("ri_lifetime_max_phys_footprint", ctypes.c_uint64),
                    ("ri_instructions", ctypes.c_uint64),
                    ("ri_cycles", ctypes.c_uint64),
                    ("ri_billed_energy", ctypes.c_uint64),
                    ("ri_serviced_energy", ctypes.c_uint64),
                    ("ri_interval_max_phys_footprint", ctypes.c_uint64),
                    ("ri_runnable_time", ctypes.c_uint64),
                    ("_reserved", ctypes.c_uint64 * 8),
                ]

            _libproc = ctypes.CDLL("/usr/lib/libproc.dylib")
            _libproc.proc_pid_rusage.argtypes = [ctypes.c_int, ctypes.c_int, ctypes.c_void_p]
            _libproc.proc_pid_rusage.restype = ctypes.c_int

            def _read(pid):
                info = _RusageInfoV4()
                if _libproc.proc_pid_rusage(int(pid), 4, ctypes.byref(info)) != 0:
                    return None, None
                return int(info.ri_phys_footprint), int(info.ri_lifetime_max_phys_footprint)

            _RUSAGE_FN = _read
        except Exception:
            _RUSAGE_FN = False
            return None, None
    try:
        return _RUSAGE_FN(os.getpid())
    except Exception:
        _RUSAGE_FN = False
        return None, None


def _mb(value):
    return round(value / 1024 / 1024, 1) if isinstance(value, int) else None

PUNCT = re.compile(r"[\s，。！？、；：\"“”‘’…—（）()《》【】,.!?;:]")
MIN_VOCODER_BYTES = 600_000_000
MIN_MODEL_BYTES = 500_000_000


def validate_model_dir(model_path):
    """防止缺失 speech_tokenizer/model.safetensors 时 mlx-audio 静默使用随机权重输出噪声。"""
    if not os.path.isdir(model_path):
        return
    cfg = os.path.join(model_path, "config.json")
    if not os.path.isfile(cfg):
        raise FileNotFoundError(f"模型目录缺少 config.json：{cfg}")
    tok = os.path.join(model_path, "speech_tokenizer", "model.safetensors")
    if not os.path.isfile(tok):
        raise FileNotFoundError(f"缺少声码器权重（缺失会导致输出噪声）：{tok}")
    tok_size = os.path.getsize(tok)
    if tok_size < MIN_VOCODER_BYTES:
        raise ValueError(
            f"声码器权重不完整：{tok}（{tok_size // (1024 * 1024)} MB，需 >= {MIN_VOCODER_BYTES // 1_000_000} MB）"
        )
    main_weight = os.path.join(model_path, "model.safetensors")
    index_file = os.path.join(model_path, "model.safetensors.index.json")
    if os.path.isfile(main_weight):
        main_size = os.path.getsize(main_weight)
        if main_size < MIN_MODEL_BYTES:
            raise ValueError(
                f"主权重不完整：{main_weight}（{main_size // (1024 * 1024)} MB，需 >= {MIN_MODEL_BYTES // 1_000_000} MB）"
            )
    elif os.path.isfile(index_file):
        with open(index_file, encoding="utf-8") as f:
            weight_map = json.load(f).get("weight_map") or {}
        shards = sorted(set(weight_map.values()))
        if not shards:
            raise ValueError(f"模型分片索引为空：{index_file}")
        for shard in shards:
            sp = os.path.join(model_path, shard)
            if not os.path.isfile(sp) or os.path.getsize(sp) <= 0:
                raise FileNotFoundError(f"缺少模型权重分片：{sp}")
    else:
        raise FileNotFoundError(f"模型目录缺少主权重：{main_weight}")


def char_count(text):
    return len(PUNCT.sub("", text))


def log_json(path, obj, lock):
    if not path:
        return
    line = json.dumps(obj, ensure_ascii=False)
    with lock:
        with open(path, "a", encoding="utf-8") as f:
            f.write(line + "\n")


def to_pcm16(audio):
    audio = np.asarray(audio).reshape(-1)
    peak = float(np.max(np.abs(audio))) if audio.size else 0.0
    if 0.02 <= peak <= 1.5:
        audio = audio / peak * 0.89
    return np.clip(audio * 32767.0, -32768, 32767).astype("<i2").tobytes()


def wav_bytes(pcm, sample_rate):
    buf = BytesIO()
    with wave.open(buf, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(sample_rate)
        w.writeframes(pcm)
    return buf.getvalue()


class Engine:
    def __init__(self, args):
        from mlx_audio.tts.utils import load_model
        from mlx_audio.utils import load_audio

        self.args = args
        self.lock = threading.Lock()
        self.active_lock = threading.Lock()
        self.log_lock = threading.Lock()
        self.active = 0
        self.requests = 0
        self.last_request = time.time()
        self.started = time.time()
        self.max_text = args.max_text

        validate_model_dir(args.model)
        if mx is not None:
            prev_limit = mx.set_cache_limit(max(0, MLX_CACHE_LIMIT_MB) * 1024 * 1024)
            self.log({"event": "mlx_limits", "cache_limit_mb": max(0, MLX_CACHE_LIMIT_MB),
                      "prev_cache_limit_bytes": prev_limit})
        t0 = time.time()
        self.model = load_model(args.model)
        self.load_s = time.time() - t0
        self.sample_rate = int(self.model.sample_rate)
        self.log({"event": "loaded", "load_s": round(self.load_s, 3),
                  "sample_rate": self.sample_rate, "model": args.model})
        print(f"[sidecar] model loaded in {self.load_s:.2f}s sr={self.sample_rate}", flush=True)

        with open(args.refs, encoding="utf-8") as f:
            refs = json.load(f)
        self.refs = {}
        for role, ref in refs.items():
            wav_path = ref.get("wav") or ""
            text = (ref.get("text") or "").strip()
            if not wav_path or not text:
                raise ValueError(f"参考音 {role} 缺少 wav 或 text")
            if not os.path.exists(wav_path):
                raise FileNotFoundError(f"参考音不存在：{wav_path}")
            self.refs[role] = (load_audio(wav_path, sample_rate=self.sample_rate), text)
            self.log({"event": "ref", "role": role, "wav": wav_path, "chars": len(text)})
        if "narrator" not in self.refs:
            raise ValueError("refs 里必须有 narrator")

    def log(self, obj):
        obj = {"t": round(time.time(), 3), **obj}
        log_json(self.args.log, obj, self.log_lock)

    def status(self):
        with self.active_lock:
            active = self.active
        footprint, footprint_peak = _memory_footprint()
        try:
            mlx_cache = mx.get_cache_memory() if mx is not None else None
            mlx_peak = mx.get_peak_memory() if mx is not None else None
        except Exception:
            mlx_cache = mlx_peak = None
        return {
            "status": "ok",
            "instanceId": self.args.instance_id,
            "pid": os.getpid(),
            "state": "busy" if active else "ready",
            "model": self.args.model,
            "sample_rate": self.sample_rate,
            "load_s": round(self.load_s, 3),
            "uptime_s": round(time.time() - self.started, 1),
            "requests": self.requests,
            "active": active,
            "last_request": round(self.last_request, 3),
            "idle_timeout": self.args.idle_timeout,
            "refs": sorted(self.refs.keys()),
            # maxrss_mb 是历史字段名，现在报的是活动监视器口径的 footprint
            # （ru_maxrss 不含 Metal/IOKit，会少报一半）；原值放 rusage_maxrss_mb。
            "maxrss_mb": _mb(footprint) if footprint is not None else round(
                resource.getrusage(resource.RUSAGE_SELF).ru_maxrss / 1024 / 1024, 1),
            "rusage_maxrss_mb": round(resource.getrusage(resource.RUSAGE_SELF).ru_maxrss / 1024 / 1024, 1),
            "footprint_mb": _mb(footprint),
            "footprint_peak_mb": _mb(footprint_peak),
            "mlx_cache_mb": _mb(mlx_cache),
            "mlx_peak_mb": _mb(mlx_peak),
        }

    def synth(self, text, role):
        if not text:
            raise ValueError("text 不能为空")
        if len(text) > self.max_text:
            raise ValueError(f"文本超过 {self.max_text} 字")
        ref = self.refs.get(role) or self.refs["narrator"]
        cap = int(char_count(text) * 4.2) + 40
        arrived = time.time()
        with self.active_lock:
            self.active += 1
        try:
            with self.lock:
                queue_ms = (time.time() - arrived) * 1000
                t0 = time.time()
                chunks = []
                for r in self.model.generate(
                    text=text,
                    ref_audio=ref[0],
                    ref_text=ref[1],
                    lang_code="auto",
                    max_tokens=cap,
                    temperature=self.args.temperature,
                    top_p=self.args.top_p,
                ):
                    a = np.array(r.audio).reshape(-1)
                    if a.size:
                        chunks.append(a)
                gen_ms = (time.time() - t0) * 1000
                if mx is not None and mx.get_cache_memory() > MLX_TRIM_THRESHOLD:
                    mx.clear_cache()
        finally:
            with self.active_lock:
                self.active -= 1
            self.last_request = time.time()

        audio = np.concatenate(chunks) if chunks else np.zeros(1, dtype=np.float32)
        pcm = to_pcm16(audio)
        wav = wav_bytes(pcm, self.sample_rate)
        audio_s = len(pcm) / 2 / self.sample_rate
        with self.active_lock:
            self.requests += 1
        self.log({"event": "req", "role": role, "chars": len(text), "audio_s": round(audio_s, 3),
                  "gen_ms": round(gen_ms, 1), "queue_ms": round(queue_ms, 1),
                  "rtf": round(gen_ms / 1000 / max(audio_s, 1e-6), 3),
                  "text": text[:60]})
        return wav, audio_s, gen_ms, queue_ms


class Handler(BaseHTTPRequestHandler):
    protocol_version = "HTTP/1.1"
    server_version = "mimo-tts-local/1"

    def log_message(self, fmt, *args):
        pass

    @property
    def engine(self):
        return self.server.engine

    def _json(self, code, obj):
        body = json.dumps(obj, ensure_ascii=False).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        if self.path.startswith("/health"):
            return self._json(200, self.engine.status())
        self._json(404, {"error": "not found"})

    def do_POST(self):
        try:
            n = int(self.headers.get("Content-Length", "0"))
            if n > 200_000:
                return self._json(413, {"error": "请求体过大"})
            body = json.loads(self.rfile.read(n) or b"{}")

            if self.path.startswith("/shutdown"):
                self._json(200, {"ok": True})
                threading.Timer(0.2, os._exit, [0]).start()
                return

            if self.path.startswith("/policy"):
                with self.engine.active_lock:
                    if "idle_timeout" in body:
                        self.engine.args.idle_timeout = max(0, int(body["idle_timeout"]))
                return self._json(200, {"ok": True, "idle_timeout": self.engine.args.idle_timeout})

            if not self.path.startswith("/synthesize"):
                return self._json(404, {"error": "not found"})

            text = str(body.get("text") or "").strip()
            role = "dialogue" if body.get("role") == "dialogue" else "narrator"
            wav, audio_s, gen_ms, queue_ms = self.engine.synth(text, role)
            self.send_response(200)
            self.send_header("Content-Type", "audio/wav")
            self.send_header("Content-Length", str(len(wav)))
            self.send_header("Cache-Control", "no-store")
            self.send_header("X-Audio-Seconds", f"{audio_s:.3f}")
            self.send_header("X-Gen-Ms", f"{gen_ms:.0f}")
            self.send_header("X-Queue-Ms", f"{queue_ms:.0f}")
            self.end_headers()
            self.wfile.write(wav)
        except (BrokenPipeError, ConnectionResetError):
            pass
        except ValueError as e:
            self._json(400, {"error": str(e)})
        except Exception as e:
            traceback.print_exc()
            try:
                self._json(500, {"error": f"{type(e).__name__}: {e}"})
            except Exception:
                pass


def idle_watchdog(engine, timeout, parent_pid):
    while True:
        time.sleep(5)
        # 父进程（Node）被强杀时，sidecar 会被 init 收养；这时必须自己退出，
        # 否则 2.3GB 的模型会一直占着。idle=0（常驻）也要守这一条。
        if parent_pid and os.getppid() != parent_pid:
            engine.log({"event": "orphan_exit", "parent_pid": parent_pid, "ppid": os.getppid()})
            print("[sidecar] parent gone, exit", flush=True)
            os._exit(0)
        with engine.active_lock:
            active = engine.active
            current_timeout = engine.args.idle_timeout
        if current_timeout <= 0:
            continue
        if active == 0 and time.time() - engine.last_request > current_timeout:
            engine.log({"event": "idle_exit", "idle_s": round(time.time() - engine.last_request, 1)})
            print("[sidecar] idle timeout, exit", flush=True)
            os._exit(0)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--model", required=True)
    ap.add_argument("--refs", required=True, help="JSON：{role:{wav,text}}")
    ap.add_argument("--host", default="127.0.0.1")
    ap.add_argument("--port", type=int, default=8398)
    ap.add_argument("--idle-timeout", type=int, default=330, help="秒；0=永不因空闲退出（父进程消失仍会退）")
    ap.add_argument("--parent-pid", type=int, default=0, help="Node 父进程 pid；用于避免孤儿进程")
    ap.add_argument("--instance-id", default="")
    ap.add_argument("--log", default="")
    ap.add_argument("--max-text", type=int, default=400)
    ap.add_argument("--temperature", type=float, default=0.6)
    ap.add_argument("--top-p", type=float, default=0.9)
    args = ap.parse_args()

    def bye(*_):
        os._exit(0)

    signal.signal(signal.SIGTERM, bye)
    signal.signal(signal.SIGINT, bye)

    try:
        engine = Engine(args)
    except Exception as e:
        print(f"[sidecar] startup failed: {type(e).__name__}: {e}", file=sys.stderr, flush=True)
        traceback.print_exc()
        sys.exit(1)

    httpd = ThreadingHTTPServer((args.host, args.port), Handler)
    httpd.daemon_threads = True
    httpd.engine = engine
    engine.log({"event": "ready", "port": args.port, "pid": os.getpid()})
    print(json.dumps({"event": "ready", "port": args.port, "pid": os.getpid()}), flush=True)
    threading.Thread(target=idle_watchdog, args=(engine, args.idle_timeout, args.parent_pid), daemon=True).start()
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass


if __name__ == "__main__":
    main()
