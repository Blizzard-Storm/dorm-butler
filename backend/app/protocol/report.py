"""NodeA -> PC 的串口文本报文解析。

固件侧模板见 NodeA_主控网关/source/main.c 的 RepTmpl / SendReport()：

    [00:00:00] T+000 L0 F000 D000 A0 O00 E000\r\n     共 43 字节

    偏移  1,2 时   4,5 分   7,8 秒
         12    温度符号        13-15 温度 x10（固件已钳到 999）
         18    光照等级 0-4
      21-23    风扇占空比 0-100
      26-28    距离 cm（固件把无效值 -1 钳成 0）
         31    报警等级 0/1/2
         34    节点B 在线      35 节点C 在线
      38-40    CRC 累计错误数（固件饱和在 255，这里按 3 位十进制读）

已知的固件侧限制，解析器必须如实反映、不得美化：
  * 距离 <= 1 说明超声波没有有效回波（NodeC 的 DIST_MIN = 2），记为未知
  * 从站离线时 NodeA 不清空上一次的数据，因此离线节点的读数一律作废
  * 报文在串口忙时会整行跳过，行间隔不保证严格 1 秒
"""
from __future__ import annotations

import re
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Iterator

REPORT_LEN = 43
REPORT_BODY_LEN = 41  # 不含 \r\n

_PATTERN = re.compile(
    r"^\[(?P<h>\d{2}):(?P<m>\d{2}):(?P<s>\d{2})\] "
    r"T(?P<sign>[+-])(?P<temp>\d{3}) "
    r"L(?P<lux>\d) "
    r"F(?P<fan>\d{3}) "
    r"D(?P<dist>\d{3}) "
    r"A(?P<alarm>\d) "
    r"O(?P<ob>\d)(?P<oc>\d) "
    r"E(?P<err>\d{3})$"
)

MAX_BUFFER = 4096  # 噪声保护：超过这个长度还没等到换行就丢弃重新同步

# 标定行。NodeB 单板直连模式下每秒一条，与主报文错开约 500mS：
#     CAL RT=0465 ROP=0712
# 这是【未标定的原始 ADC】，只用于标定实验与诊断，
# 前端必须标注为"原始 ADC"，不得当作照度或温度这类物理量显示。
_CAL_PATTERN = re.compile(r"^CAL RT=(?P<rt>\d{4}) ROP=(?P<rop>\d{4})$")

# 下行命令的回执行（NodeA 的 USE_PC_CMD）：
#     ACK s=012 t=01 r=00 d=000
# s 是请求编号，PC 靠它匹配在途请求；r 是结果码，见 frames.ACK_xxx。
_ACK_PATTERN = re.compile(
    r"^ACK s=(?P<seq>\d{3}) t=(?P<tgt>\d{2}) r=(?P<res>\d{2}) d=(?P<detail>\d{3})$"
)


@dataclass
class CalReading:
    """一行标定数据。"""

    received_at: datetime
    raw_rt: int       # 热敏原始 ADC 0~1023
    raw_rop: int      # 光敏原始 ADC 0~1023
    raw: str


# 本机参数回报（NodeA 每秒一条）：
#     CFG T=28 A=0 H=07 M=00 N=060
# 这是【设备上的真实参数】。PC 侧原来只显示自己记得的值，用户拿摇杆
# 在板子上改过之后网页并不知道，显示的是过期数据。有了这条就能以设备为准。
_CFG_PATTERN = re.compile(
    r"^CFG T=(?P<t>\d{2}) A=(?P<a>\d) H=(?P<h>\d{2}) M=(?P<m>\d{2}) N=(?P<n>\d{3})$"
)

# NodeA 每秒输出的详细状态与性能旁路报文：
#   STA BF=003 BP=000 CF=017 CS=2 V=012 D=003 CP=000 AP=000 L=12345 RB=0 RC=0
# BF/CF 是 B/C 节点状态位；BP/CP/AP 是三节点的 PollingMisses；
# L 是 NodeA 每秒主循环数；RB/RC 是主站当前连续无应答计数。
_STATUS_PATTERN = re.compile(
    r"^STA BF=(?P<bf>\d{3}) BP=(?P<bp>\d{3}) "
    r"CF=(?P<cf>\d{3}) CS=(?P<cs>\d) "
    r"V=(?P<v>\d{3}) D=(?P<d>\d{3}) CP=(?P<cp>\d{3}) "
    r"AP=(?P<ap>\d{3}) L=(?P<loops>\d{5}) "
    r"RB=(?P<rb>\d) RC=(?P<rc>\d)$"
)


@dataclass
class BoardCfg:
    """从设备读回来的参数，不是 PC 侧的记账。"""

    received_at: datetime
    temp_threshold: int
    armed: bool
    alarm_hour: int
    alarm_minute: int
    near_threshold: int
    raw: str


@dataclass
class StatusReading:
    """NodeA 汇总的节点状态与运行质量数据。"""

    received_at: datetime
    env_flags: int
    env_poll_miss: int
    sec_flags: int
    sec_state: int
    vib_count: int
    door_count: int
    sec_poll_miss: int
    master_poll_miss: int
    master_main_loops: int
    reply_miss_b: int
    reply_miss_c: int
    raw: str


@dataclass
class Ack:
    """一条下行命令的回执。"""

    received_at: datetime
    seq: int
    target: int
    result: int
    detail: int
    raw: str


@dataclass
class Report:
    """一行合法报文解析后的结果。字段为 None 表示该读数不可信。"""

    received_at: datetime
    board_time: str                 # 板上 DS1302 的 HH:MM:SS，仅供对时参考
    node_b_online: bool
    node_c_online: bool
    temp_c: float | None            # 节点B 离线时为 None
    temp_saturated: bool            # 固件把 |温度x10| 钳到了 999
    lux_level: int | None
    fan_duty: int | None
    distance_cm: int | None         # <=1 视为无回波
    distance_valid: bool
    alarm_level: int | None
    crc_errors: int
    raw: str

    def as_dict(self) -> dict:
        d = self.__dict__.copy()
        d["received_at"] = self.received_at.isoformat()
        return d


@dataclass
class ReportParser:
    """字节流 -> 报文。自带粘包、拆包与噪声重同步处理。"""

    buffer: bytearray = field(default_factory=bytearray)
    lines_ok: int = 0
    lines_bad: int = 0
    cal_ok: int = 0
    ack_ok: int = 0
    cfg_ok: int = 0
    status_ok: int = 0
    bytes_dropped: int = 0
    last_bad_line: str = ""
    last_cal: CalReading | None = None
    last_cfg: BoardCfg | None = None
    last_status: StatusReading | None = None
    # 收到的回执依次放进这里，由设备层取走匹配在途请求
    acks: list[Ack] = field(default_factory=list)

    def feed(self, chunk: bytes) -> Iterator[Report]:
        """喂入任意长度的串口数据，产出其中所有完整且合法的【主报文】。

        标定行不通过返回值产出，而是记在 last_cal 上 —— 它是诊断/标定用的
        旁路数据，不该干扰主状态流。
        """
        self.buffer.extend(chunk)

        if len(self.buffer) > MAX_BUFFER:
            # 长时间收不到换行，说明对面不是这个协议或线路在灌噪声
            self.bytes_dropped += len(self.buffer) - MAX_BUFFER // 2
            del self.buffer[: len(self.buffer) - MAX_BUFFER // 2]

        while b"\n" in self.buffer:
            idx = self.buffer.index(b"\n")
            raw_line = bytes(self.buffer[:idx])
            del self.buffer[: idx + 1]
            report = self._parse_line(raw_line)
            if report is not None:
                yield report

    def _parse_line(self, raw_line: bytes) -> Report | None:
        text = raw_line.decode("ascii", errors="replace").rstrip("\r")

        # 按行首分流：ACK 是下行回执，CAL 是标定数据，[ 开头是主报文
        ack = _ACK_PATTERN.match(text)
        if ack is not None:
            self.ack_ok += 1
            self.acks.append(Ack(
                received_at=datetime.now(timezone.utc),
                seq=int(ack.group("seq")),
                target=int(ack.group("tgt")),
                result=int(ack.group("res")),
                detail=int(ack.group("detail")),
                raw=text,
            ))
            return None

        cfg = _CFG_PATTERN.match(text)
        if cfg is not None:
            self.cfg_ok += 1
            self.last_cfg = BoardCfg(
                received_at=datetime.now(timezone.utc),
                temp_threshold=int(cfg.group("t")),
                armed=cfg.group("a") == "1",
                alarm_hour=int(cfg.group("h")),
                alarm_minute=int(cfg.group("m")),
                near_threshold=int(cfg.group("n")),
                raw=text,
            )
            return None

        status = _STATUS_PATTERN.match(text)
        if status is not None:
            values = {key: int(value) for key, value in status.groupdict().items()}
            if (values["bf"] > 255 or values["cf"] > 255 or values["cs"] > 3
                    or any(values[key] > 255 for key in ("bp", "v", "d", "cp", "ap"))):
                self.lines_bad += 1
                self.last_bad_line = text[:120]
                return None
            self.status_ok += 1
            self.last_status = StatusReading(
                received_at=datetime.now(timezone.utc),
                env_flags=values["bf"],
                env_poll_miss=values["bp"],
                sec_flags=values["cf"],
                sec_state=values["cs"],
                vib_count=values["v"],
                door_count=values["d"],
                sec_poll_miss=values["cp"],
                master_poll_miss=values["ap"],
                master_main_loops=values["loops"],
                reply_miss_b=values["rb"],
                reply_miss_c=values["rc"],
                raw=text,
            )
            return None

        cal = _CAL_PATTERN.match(text)
        if cal is not None:
            self.cal_ok += 1
            self.last_cal = CalReading(
                received_at=datetime.now(timezone.utc),
                raw_rt=int(cal.group("rt")),
                raw_rop=int(cal.group("rop")),
                raw=text,
            )
            return None

        # 噪声重同步：一行里可能混进前导垃圾字节，从最后一个 '[' 重新起算
        if len(text) != REPORT_BODY_LEN and "[" in text:
            self.bytes_dropped += text.rindex("[")
            text = text[text.rindex("["):]

        match = _PATTERN.match(text)
        if match is None:
            if text.strip():
                self.lines_bad += 1
                self.last_bad_line = text[:120]
            return None

        self.lines_ok += 1
        g = match.groupdict()

        node_b = g["ob"] == "1"
        node_c = g["oc"] == "1"

        temp_raw = int(g["temp"])
        temp_c = (temp_raw / 10.0) * (-1 if g["sign"] == "-" else 1)
        dist_raw = int(g["dist"])
        # NodeC 的 DIST_MIN 是 2，固件又把无效距离 -1 钳成了 0
        dist_valid = node_c and dist_raw >= 2

        return Report(
            received_at=datetime.now(timezone.utc),
            board_time=f"{g['h']}:{g['m']}:{g['s']}",
            node_b_online=node_b,
            node_c_online=node_c,
            # 从站离线时 NodeA 上报的是上一次的陈旧值，一律作废
            temp_c=temp_c if node_b else None,
            temp_saturated=node_b and temp_raw == 999,
            lux_level=int(g["lux"]) if node_b else None,
            fan_duty=int(g["fan"]) if node_b else None,
            distance_cm=dist_raw if dist_valid else None,
            distance_valid=dist_valid,
            alarm_level=int(g["alarm"]) if node_c else None,
            crc_errors=int(g["err"]),
            raw=text,
        )
