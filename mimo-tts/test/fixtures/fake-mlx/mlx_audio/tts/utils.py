"""load_model 桩：返回一个只有 sample_rate 的假模型。

真 server.py 只在 /synthesize 里调用 model.generate；生命周期测试不合成，
所以这里不实现生成，调用即报错，避免测试误以为桩能出声。
"""


class _StubModel:
    sample_rate = 24000

    def generate(self, **_kwargs):
        raise RuntimeError("fake mlx_audio: 生命周期测试不应触发生成")


def load_model(_path):
    return _StubModel()
