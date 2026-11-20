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
            "maxrss_mb": round(resource.getrusage(resource.RUSAGE_SELF).ru_maxrss / 1024 / 1024, 1),
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
