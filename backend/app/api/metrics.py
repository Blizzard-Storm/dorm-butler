"""Prometheus 抓取端点。

为什么加这个：
    SQLite 存着遥测已经够用了（1Hz × 7 个量 × 14 天约 120 万行，毫无压力），
    换 TSDB 不是为了扛数据量。真正的收益是把这套系统接进标准监控栈：
      * Grafana 现成的仪表盘和告警规则，不用自己写图表
      * PromQL 一行就能算出 485 总线的错误率、小时均温这类派生指标
      * rate() 天然处理计数器回绕与重启

设计取舍：
    不替换 SQLite，两者职责不同。Prometheus 存的是可降采样、可过期的数值
    时序；命令记录和事件是审计数据，一条都不能丢，那必须留在关系库里。

    这个端点是【可选的】—— 不部署 Prometheus 也完全不影响任何现有功能，
    它只是把内存里的状态换个格式吐出来，没有额外的采集开销。

    不引 prometheus_client 依赖：暴露格式很简单，自己拼几十行文本比多背一个
    库更划算，也不用担心它和 FastAPI 的指标注册表打架。

拿不到的读数一律【不输出这个指标】，而不是输出 0 ——
在 Prometheus 里"没有数据点"和"值是 0"是两回事，后者会污染平均值和告警。
"""
from __future__ import annotations

from fastapi import APIRouter, Request, Response

router = APIRouter()

# 指标名遵循 Prometheus 命名约定：<命名空间>_<对象>_<单位>，计数器以 _total 结尾
PREFIX = "dorm"


def _line(name: str, value, labels: str = "") -> str:
    return f"{PREFIX}_{name}{labels} {value}\n"


def _block(name: str, help_text: str, kind: str) -> str:
    return f"# HELP {PREFIX}_{name} {help_text}\n# TYPE {PREFIX}_{name} {kind}\n"


@router.get("/metrics")
async def metrics(request: Request) -> Response:
    s = request.app.state.device.snapshot()
    out: list[str] = []

    # ---- 环境（节点B）----
    out.append(_block("temperature_celsius", "NTC 实测温度，节点B 离线时不输出", "gauge"))
    if s.temp_c is not None:
        out.append(_line("temperature_celsius", s.temp_c))

    out.append(_block("light_level", "光照等级 0-4，未标定为 lux，仅为分档", "gauge"))
    if s.lux_level is not None:
        out.append(_line("light_level", s.lux_level))

    out.append(_block("light_adc_raw", "光敏原始 ADC 0-1023，未标定", "gauge"))
    if s.lux_adc is not None:
        out.append(_line("light_adc_raw", s.lux_adc))

    out.append(_block("thermistor_adc_raw", "热敏原始 ADC 0-1023，未标定", "gauge"))
    if s.temp_adc is not None:
        out.append(_line("thermistor_adc_raw", s.temp_adc))

    out.append(_block("fan_duty_percent", "风扇 PWM 输出占空比，不是实测转速", "gauge"))
    if s.fan_duty is not None:
        out.append(_line("fan_duty_percent", s.fan_duty))

    # ---- 安防（节点C）----
    out.append(_block("distance_cm", "超声波测距，无有效回波时不输出", "gauge"))
    if s.distance_cm is not None:
        out.append(_line("distance_cm", s.distance_cm))

    out.append(_block("alarm_level", "报警等级 0 无 / 1 提示 / 2 报警", "gauge"))
    if s.alarm_level is not None:
        out.append(_line("alarm_level", s.alarm_level))

    # ---- 参数 ----
    out.append(_block("temp_threshold_celsius", "风扇启动温度阈值", "gauge"))
    out.append(_line("temp_threshold_celsius", s.temp_threshold))

    # ---- 链路与节点 ----
    out.append(_block("node_up", "节点在线状态，1 在线 0 离线", "gauge"))
    for tag, node in (("A", s.node_a), ("B", s.node_b), ("C", s.node_c)):
        out.append(_line("node_up", 1 if node.online else 0, f'{{node="{tag}"}}'))

    out.append(_block("link_up", "PC 与 NodeA 的串口链路", "gauge"))
    out.append(_line("link_up", 1 if s.link_connected else 0))

    out.append(_block("node_polling_misses", "各节点上一秒的调度遗漏数", "gauge"))
    for tag, node in (("A", s.node_a), ("B", s.node_b), ("C", s.node_c)):
        if node.poll_miss is not None:
            out.append(_line("node_polling_misses", node.poll_miss, f'{{node="{tag}"}}'))

    out.append(_block("node_a_main_loops_per_second", "NodeA 每秒主循环数", "gauge"))
    if s.main_loops is not None:
        out.append(_line("node_a_main_loops_per_second", s.main_loops))

    out.append(_block("bus_consecutive_reply_misses", "NodeA 对从站的当前连续无应答数", "gauge"))
    for tag, value in (("B", s.master_reply_miss_b), ("C", s.master_reply_miss_c)):
        if value is not None:
            out.append(_line("bus_consecutive_reply_misses", value, f'{{node="{tag}"}}'))

    # ---- 计数器：这几个是这套系统最值得监控的可靠性指标 ----
    out.append(_block("bus_crc_errors_total", "485 总线累计 CRC 错误，由 NodeA 统计", "counter"))
    out.append(_line("bus_crc_errors_total", s.crc_errors))

    out.append(_block("serial_frames_total", "串口报文解析结果计数", "counter"))
    out.append(_line("serial_frames_total", s.frames_ok, '{result="ok"}'))
    out.append(_line("serial_frames_total", s.frames_bad, '{result="bad"}'))

    # ---- 命令执行情况：按终态分桶，能直接算出成功率 ----
    device = request.app.state.device
    tally: dict[str, int] = {}
    for cmd in device.commands.values():
        key = str(cmd.status)
        tally[key] = tally.get(key, 0) + 1
    out.append(_block("commands_total", "本次运行以来的命令数，按最终状态分组", "counter"))
    for status in ("pending", "sent", "confirmed", "failed", "timeout", "unsupported"):
        out.append(_line("commands_total", tally.get(status, 0), f'{{status="{status}"}}'))

    return Response("".join(out), media_type="text/plain; version=0.0.4; charset=utf-8")
