"""光敏电阻 GL5516 分档阈值标定。

用途：固件 NodeB 里的 LUX_TH0~TH3 目前是占位值（150/350/600/850），
从没实测过，导致光照等级几乎恒为 0 档。本脚本采集五种光照条件下的
真实 ADC 分布，算出应该填的阈值和方向。

前提：NodeB 已烧录带 CAL 行的固件，后端正在运行（数据从数据库读，
      不直接抢串口，所以标定期间网页照常可用）。

用法：
    .venv\\Scripts\\python.exe tools\\标定-光敏.py
"""
from __future__ import annotations

import sqlite3
import statistics
import sys
import time
from pathlib import Path

DB = Path(__file__).resolve().parent.parent / "backend" / "data" / "dorm.db"
SAMPLE_SECONDS = 12          # 每种光照条件采集多久
SETTLE_SECONDS = 3           # 改变光照后先等几秒让读数稳定

# 五个档位对应的现场条件，从最亮到最暗
CONDITIONS = [
    ("4 档 · 最亮", "用手电筒／手机闪光灯直接照射光敏电阻"),
    ("3 档 · 较亮", "房间开灯，光敏电阻朝向灯"),
    ("2 档 · 正常", "房间正常光照，不做任何遮挡"),
    ("1 档 · 偏暗", "用手在光敏电阻上方约 5cm 处遮挡"),
    ("0 档 · 最暗", "用手心完全盖住光敏电阻"),
]


def read_window(conn: sqlite3.Connection, seconds: int) -> list[int]:
    """采集一段时间内的 lux_adc 读数。"""
    t_end = time.time() + seconds
    seen: dict[str, int] = {}
    while time.time() < t_end:
        rows = conn.execute(
            "select ts, lux_adc from telemetry "
            "where lux_adc is not null order by ts desc limit 30"
        ).fetchall()
        for ts, v in rows:
            seen[ts] = v
        left = int(t_end - time.time())
        print(f"\r    采集中… 还剩 {left:2d} 秒，已收到 {len(seen)} 个采样点", end="", flush=True)
        time.sleep(0.5)
    print()
    return list(seen.values())


def main() -> None:
    if not DB.is_file():
        print(f"找不到数据库 {DB}\n请先启动后端并确认 DEVICE_MODE=serial")
        sys.exit(1)

    conn = sqlite3.connect(f"file:{DB}?mode=ro", uri=True)

    # 先确认有 CAL 数据进来
    probe = conn.execute(
        "select count(*) from telemetry where lux_adc is not null "
        "and ts > datetime('now','-30 seconds')"
    ).fetchone()[0]
    if probe == 0:
        print("最近 30 秒没有收到带原始 ADC 的数据。请检查：")
        print("  1. 后端在跑吗（http://localhost:8000 能打开吗）")
        print("  2. backend/.env 里 DEVICE_MODE 是不是 serial")
        print("  3. NodeB 烧的是不是带 CAL 行的固件")
        sys.exit(1)

    print("=" * 62)
    print("  光敏电阻分档标定")
    print("=" * 62)
    print(f"  每种条件采集 {SAMPLE_SECONDS} 秒，共 5 种，约 1.5 分钟")
    print("  过程中保持光照条件稳定，不要来回动")
    print()

    results: list[tuple[str, list[int]]] = []
    for name, howto in CONDITIONS:
        print("-" * 62)
        print(f"  【{name}】")
        print(f"   请：{howto}")
        input("   准备好后按回车开始采集…")
        print(f"    等待读数稳定 {SETTLE_SECONDS} 秒…")
        time.sleep(SETTLE_SECONDS)
        vals = read_window(conn, SAMPLE_SECONDS)
        if not vals:
            print("    !! 这一档没采到数据，跳过")
            continue
        results.append((name, vals))
        print(f"    最小 {min(vals)}  中位 {int(statistics.median(vals))}  最大 {max(vals)}"
              f"   （{len(vals)} 个点）")
        print()

    if len(results) < 2:
        print("采集到的档位太少，无法计算阈值。")
        sys.exit(1)

    # ---------------- 结果 ----------------
    print("=" * 62)
    print("  采集结果")
    print("=" * 62)
    print(f"  {'条件':<14}{'最小':>7}{'中位':>7}{'最大':>7}{'极差':>7}{'点数':>7}")
    for name, vals in results:
        med = int(statistics.median(vals))
        print(f"  {name:<14}{min(vals):>7}{med:>7}{max(vals):>7}"
              f"{max(vals) - min(vals):>7}{len(vals):>7}")

    medians = [int(statistics.median(v)) for _, v in results]

    # 方向判定：CONDITIONS 是从最亮到最暗排的
    bright_is_high = medians[0] > medians[-1]
    print()
    print("-" * 62)
    print(f"  方向判定：最亮时 ADC={medians[0]}，最暗时 ADC={medians[-1]}")
    if bright_is_high:
        print("  -> 越亮 ADC 越大，LUX_BRIGHT_IS_HIGH 应填 1")
    else:
        print("  -> 越亮 ADC 越小，LUX_BRIGHT_IS_HIGH 应填 0")

    # 单调性检查
    ordered = medians if bright_is_high else medians[::-1]
    monotonic = all(ordered[i] > ordered[i + 1] for i in range(len(ordered) - 1))
    if not monotonic:
        print("  !! 警告：五档中位数不单调，说明某两档的光照条件区分度不够，")
        print("     建议把区分不开的那两档重做一次，否则阈值会失效。")

    # 阈值 = 相邻两档中位数的中点。固件里阈值是按 ADC 升序比较的，
    # 所以要按 ADC 从小到大排出四个分界。
    by_adc = sorted(medians)
    ths = [(by_adc[i] + by_adc[i + 1]) // 2 for i in range(4)] if len(by_adc) == 5 else None

    print()
    print("=" * 62)
    if ths:
        print("  把下面几行填进 NodeB_环境节点/source/main.c")
        print("=" * 62)
        print()
        print(f"#define LUX_BRIGHT_IS_HIGH  {1 if bright_is_high else 0}")
        for i, t in enumerate(ths):
            print(f"#define LUX_TH{i}             {t}"
                  f"{'':<12}/* 实测标定 */")
    else:
        print("  只有 5 档全部采到才能自动算出四个阈值。")
        print("  当前采到的中位数（按 ADC 升序）：", by_adc)
    print()
    print("  改完重新编译烧录，光照等级就会随环境真实变化。")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n已中断。")
