"""sidecar 内存口径与 MLX 缓存封顶的防回归测试。

不依赖 Apple Silicon / mlx / 模型权重：mlx 与 mlx_audio 全部用桩替换，
跑一次不到一秒。覆盖三件事：

1. rusage_info_v4 结构体尺寸 —— 写短了内核会越界写，直接把进程打崩
   （表现是 /health 返回 RemoteDisconnected，而不是某个异常）。
2. 启动时给 MLX 缓存设 64MB 上限（set_cache_limit）—— 这是防止
   footprint 涨到 10GB+、把整机推去 swap 的唯一一道闸；free cache
   被封顶后不会再涨，生成后无需也不再做任何 clear_cache。
3. /health 的内存字段口径 —— 有 footprint 就报 footprint，读不到回退
   ru_maxrss，且 maxrss_mb 不再比真实占用小一半。
"""

import importlib.util
import json
import os
import sys
import tempfile
import types
import unittest
from pathlib import Path

import numpy as np

HERE = Path(__file__).resolve().parent
SERVER_PY = HERE.parent / "sidecar" / "server.py"
SAMPLE_RATE = 24000


class FakeMx:
    """mlx.core 的替身：只记录与内存相关的调用。"""

    def __init__(self, cache_bytes=23 * 1024 * 1024):
        self.cache_bytes = cache_bytes
        self.set_limit_calls = []
        self.clear_calls = 0
        self.peak_bytes = 0

    def set_cache_limit(self, limit):
        self.set_limit_calls.append(limit)
        return 0

    def clear_cache(self):
        self.clear_calls += 1

    def get_cache_memory(self):
        return self.cache_bytes

    def get_peak_memory(self):
        return self.peak_bytes


class FakeModel:
    sample_rate = SAMPLE_RATE

    def generate(self, **kwargs):
        audio = np.zeros(SAMPLE_RATE // 10, dtype=np.float32)
        return iter([types.SimpleNamespace(audio=audio)])


def install_stubs(fake_mx):
    mlx = types.ModuleType("mlx")
    core = types.ModuleType("mlx.core")
    for name in ("set_cache_limit", "clear_cache", "get_cache_memory", "get_peak_memory"):
        setattr(core, name, getattr(fake_mx, name))
    mlx.core = core
    sys.modules["mlx"] = mlx
    sys.modules["mlx.core"] = core

    mlx_audio = types.ModuleType("mlx_audio")
    tts = types.ModuleType("mlx_audio.tts")
    tts_utils = types.ModuleType("mlx_audio.tts.utils")
    utils = types.ModuleType("mlx_audio.utils")
    tts_utils.load_model = lambda path: FakeModel()
    utils.load_audio = lambda path, sample_rate=None: np.zeros(2400, dtype=np.float32)
    tts.utils = tts_utils
    mlx_audio.tts = tts
    mlx_audio.utils = utils
    for name, mod in (("mlx_audio", mlx_audio), ("mlx_audio.tts", tts),
                      ("mlx_audio.tts.utils", tts_utils), ("mlx_audio.utils", utils)):
        sys.modules[name] = mod


def load_sidecar(fake_mx):
    """按路径导入 server.py（它是脚本，没有包路径）。"""
    install_stubs(fake_mx)
    spec = importlib.util.spec_from_file_location("tts_sidecar_under_test", SERVER_PY)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


class SidecarMemoryTest(unittest.TestCase):
    def setUp(self):
        self.fake_mx = FakeMx()
        self.mod = load_sidecar(self.fake_mx)
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        ref_wav = Path(self.tmp.name) / "ref.wav"
        ref_wav.write_bytes(b"RIFF")
        refs = Path(self.tmp.name) / "refs.json"
        refs.write_text(json.dumps({"narrator": {"wav": str(ref_wav), "text": "参考音"}},
                                   ensure_ascii=False), encoding="utf-8")
        self.args = types.SimpleNamespace(
            model=str(Path(self.tmp.name) / "model"),
            refs=str(refs),
            log=str(Path(self.tmp.name) / "engine.jsonl"),
            instance_id="test-instance",
            idle_timeout=60,
            max_text=400,
            temperature=0.6,
            top_p=0.9,
            port=0,
            parent_pid=0,
        )
        self.engine = self.mod.Engine(self.args)

    def test_rusage_struct_covers_kernel_size(self):
        """结构体必须 >= 内核写入的 296 字节，否则 proc_pid_rusage 越界写。"""
        self.assertGreaterEqual(self.mod._RUSAGE_INFO_V4_SIZE, self.mod._RUSAGE_INFO_V4_BYTES)
        self.assertGreaterEqual(self.mod._RUSAGE_INFO_V4_SIZE, 296)

    def test_footprint_never_raises(self):
        footprint, peak = self.mod._memory_footprint()
        for value in (footprint, peak):
            self.assertTrue(value is None or (isinstance(value, int) and value > 0))

    def test_cache_limit_is_capped_at_startup(self):
        self.assertEqual(self.fake_mx.set_limit_calls, [64 * 1024 * 1024])

    def test_cache_limit_honours_env_override(self):
        old = os.environ.get("TTS_MLX_CACHE_LIMIT_MB")
        os.environ["TTS_MLX_CACHE_LIMIT_MB"] = "256"
        try:
            fake = FakeMx()
            mod = load_sidecar(fake)
            self.assertEqual(mod.MLX_CACHE_LIMIT_MB, 256)
            mod.Engine(self.args)
            self.assertEqual(fake.set_limit_calls, [256 * 1024 * 1024])
        finally:
            if old is None:
                os.environ.pop("TTS_MLX_CACHE_LIMIT_MB", None)
            else:
                os.environ["TTS_MLX_CACHE_LIMIT_MB"] = old

    def test_synthesis_relies_only_on_cache_cap(self):
        """生成走真实路径：唯一的内存控制是启动时的 64MB 封顶，不再有
        「超阈值清缓存」这条永不触发的分支。用现实可达的缓存值（< 64MB
        封顶），断言 set_cache_limit 生效、/health 如实上报 mlx_cache_mb，
        且全程不调用 clear_cache。"""
        self.assertFalse(hasattr(self.mod, "MLX_TRIM_THRESHOLD"))
        self.fake_mx.cache_bytes = 40 * 1024 * 1024  # < 64MB 封顶，现实可达
        wav, audio_s, _gen_ms, _queue_ms = self.engine.synth("测试一句话。", "narrator")
        self.assertTrue(wav.startswith(b"RIFF"))
        self.assertGreater(audio_s, 0)
        # 封顶是唯一机制：启动设过一次上限，生成后没有 clear_cache 兜底
        self.assertEqual(self.fake_mx.set_limit_calls, [64 * 1024 * 1024])
        self.assertEqual(self.fake_mx.clear_calls, 0)
        status = self.engine.status()
        self.assertIn("mlx_cache_mb", status)
        self.assertIsInstance(status["mlx_cache_mb"], (int, float))
        self.assertEqual(status["mlx_cache_mb"], 40.0)

    def test_small_cache_is_not_cleared(self):
        self.fake_mx.cache_bytes = 10 * 1024 * 1024
        self.engine.synth("测试一句话。", "narrator")
        self.assertEqual(self.fake_mx.clear_calls, 0)

    def test_status_reports_footprint_fields(self):
        status = self.engine.status()
        for key in ("maxrss_mb", "footprint_mb", "footprint_peak_mb",
                    "rusage_maxrss_mb", "mlx_cache_mb", "mlx_peak_mb"):
            self.assertIn(key, status)
        if status["footprint_mb"] is not None:
            self.assertEqual(status["maxrss_mb"], status["footprint_mb"])
        self.assertEqual(status["mlx_cache_mb"], 23.0)

    def test_status_falls_back_to_rusage(self):
        self.mod._memory_footprint = lambda: (None, None)
        status = self.engine.status()
        self.assertIsNone(status["footprint_mb"])
        self.assertIsInstance(status["maxrss_mb"], float)

    def test_mb_helper(self):
        self.assertEqual(self.mod._mb(1024 * 1024 * 3 // 2), 1.5)
        self.assertIsNone(self.mod._mb(None))


if __name__ == "__main__":
    unittest.main()
