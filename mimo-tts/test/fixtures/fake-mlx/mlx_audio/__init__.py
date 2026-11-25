"""测试桩：替代 Apple Silicon 上的 mlx_audio，让真 server.py 能在普通 Linux CI 上跑。

只实现 server.py 用到的两个入口（load_model / load_audio），不返回真实音频。
"""
