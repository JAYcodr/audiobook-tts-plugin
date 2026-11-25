"""load_audio 桩：返回 0.1s 静音，形状与真实现一致（float32 一维）。"""
import numpy as np


def load_audio(_path, sample_rate=24000):
    return np.zeros(max(1, int(sample_rate * 0.1)), dtype=np.float32)
