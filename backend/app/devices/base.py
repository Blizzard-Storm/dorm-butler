"""设备服务抽象层。

页面和数据库只依赖这里定义的接口与数据结构，mock 与 serial 两种实现可以
互换，接真实硬件时前端不用改。
"""
from __future__ import annotations

import uuid
from abc import ABC, abstractmethod
from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from enum import StrEnum
from typing import Any


def now() -> datetime:
    return datetime.now(timezone.utc)


def new_id() -> str:
    return uuid.uuid4().hex[:12]


class CommandStatus(StrEnum):
    PENDING = "pending"            # 已接收，尚未下发
    SENT = "sent"                  # 已写入链路，等待回执
    CONFIRMED = "confirmed"        # 收到目标节点的执行回执
    FAILED = "failed"              # 明确失败（参数非法 / 节点拒绝 / 链路错误）
    TIMEOUT = "timeout"            # 重试用尽仍未收到回执
    UNSUPPORTED = "unsupported"    # 当前固件不具备这条下行通道


TERMINAL_STATUSES = {
    CommandStatus.CONFIRMED,
    CommandStatus.FAILED,
    CommandStatus.TIMEOUT,
    CommandStatus.UNSUPPORTED,
}


class CommandName(StrEnum):
    SET_FAN = "set_fan"
    SET_TEMP_THRESHOLD = "set_temperature_threshold"
    SET_SECURITY_MODE = "set_security_mode"
    SILENCE_ALARM = "silence_alarm"
    SET_WINDOW = "set_window"
    SET_NEAR_THRESHOLD = "set_near_threshold"


@dataclass
class Command:
    id: str = field(default_factory=new_id)
    name: str = ""
    params: dict[str, Any] = field(default_factory=dict)
    target_node: str = ""
    source: str = "user"                     # user | ai | system
    status: CommandStatus = CommandStatus.PENDING
    created_at: datetime = field(default_factory=now)
    sent_at: datetime | None = None
    settled_at: datetime | None = None
    attempts: int = 0
    error: str | None = None

    def as_dict(self) -> dict:
        d = asdict(self)
        d["status"] = str(self.status)
        for key in ("created_at", "sent_at", "settled_at"):
            d[key] = d[key].isoformat() if d[key] else None
        return d


@dataclass
class Capability:
    """一项控制能力当前是否可用，以及不可用的原因。

    页面必须按 supported 决定控件是否置灰，不允许出现点了没反应、
    但界面装作成功的情况。
    """

    supported: bool
    reason: str = ""


@dataclass
class NodeStatus:
    online: bool = False
    last_seen: datetime | None = None
    poll_miss: int | None = None

    def as_dict(self) -> dict:
        return {
            "online": self.online,
            "last_seen": self.last_seen.isoformat() if self.last_seen else None,
            "poll_miss": self.poll_miss,
        }


@dataclass
class SystemState:
    """全系统状态快照。

    所有物理量遵守一条规则：拿不到或不可信就是 None，前端显示未知，
    绝不用 0 或上一次的旧值冒充当前读数。
    """

    ts: datetime = field(default_factory=now)
    board_time: str | None = None

    # 链路
    mode: str = "mock"
    link_connected: bool = False
    link_detail: dict[str, Any] = field(default_factory=dict)

    # 节点
    node_a: NodeStatus = field(default_factory=NodeStatus)
    node_b: NodeStatus = field(default_factory=NodeStatus)
    node_c: NodeStatus = field(default_factory=NodeStatus)

    # 环境（节点B）
    temp_c: float | None = None
    temp_saturated: bool = False
    lux_level: int | None = None        # 0-4 等级，未标定，不是 lux
    lux_adc: int | None = None          # 光敏原始 ADC，仅 NodeB 直连(CAL 行)时有
    temp_adc: int | None = None         # 热敏原始 ADC，同上
    fan_duty: int | None = None         # PWM 输出百分比，不是实测转速
    fan_mode: str = "auto"              # auto | manual
    window_state: str | None = None     # 软件状态，无位置反馈
    temp_high: bool | None = None

    # 安防（节点C）
    distance_cm: int | None = None
    distance_valid: bool = False
    door_state: str | None = None       # open | closed
    security_state: str | None = None   # disarmed | arming | armed | alarm
    alarm_level: int | None = None      # 0 无 / 1 提示 / 2 报警
    lock_state: str | None = None       # 软件状态，无限位反馈
    vib_count: int | None = None
    door_count: int | None = None
    near: bool | None = None

    # 参数
    temp_threshold: int = 28
    near_threshold: int = 60

    # 诊断
    crc_errors: int = 0
    frames_ok: int = 0
    frames_bad: int = 0
    last_frame_at: datetime | None = None

    capabilities: dict[str, Capability] = field(default_factory=dict)

    def as_dict(self) -> dict:
        return {
            "ts": self.ts.isoformat(),
            "board_time": self.board_time,
            "link": {
                "mode": self.mode,
                "connected": self.link_connected,
                "last_frame_at": self.last_frame_at.isoformat() if self.last_frame_at else None,
                **self.link_detail,
            },
            "nodes": {
                "A": self.node_a.as_dict(),
                "B": self.node_b.as_dict(),
                "C": self.node_c.as_dict(),
            },
            "env": {
                "temp_c": self.temp_c,
                "temp_saturated": self.temp_saturated,
                "temp_high": self.temp_high,
                "lux_level": self.lux_level,
                "lux_adc": self.lux_adc,
                "temp_adc": self.temp_adc,
                "fan_duty": self.fan_duty,
                "fan_mode": self.fan_mode,
                "window_state": self.window_state,
            },
            "security": {
                "distance_cm": self.distance_cm,
                "distance_valid": self.distance_valid,
                "door_state": self.door_state,
                "security_state": self.security_state,
                "alarm_level": self.alarm_level,
                "lock_state": self.lock_state,
                "vib_count": self.vib_count,
                "door_count": self.door_count,
                "near": self.near,
            },
            "settings": {
                "temp_threshold": self.temp_threshold,
                "near_threshold": self.near_threshold,
                "fan_mode": self.fan_mode,
            },
            "diagnostics": {
                "crc_errors": self.crc_errors,
                "frames_ok": self.frames_ok,
                "frames_bad": self.frames_bad,
            },
            "capabilities": {k: asdict(v) for k, v in self.capabilities.items()},
        }


class DeviceService(ABC):
    """设备层统一接口。mock 与 serial 都实现它。"""

    mode: str = "base"

    def __init__(self) -> None:
        self.state = SystemState()
        self.commands: dict[str, Command] = {}

    @abstractmethod
    async def start(self) -> None:
        ...

    @abstractmethod
    async def stop(self) -> None:
        ...

    @abstractmethod
    async def submit(self, name: str, params: dict, source: str = "user") -> Command:
        """接收一条控制命令，立刻返回带 id 的 Command（通常处于 pending）。

        真实执行结果通过 TOPIC_COMMAND 事件异步推送。调用方绝不能把提交
        成功当作设备执行成功。
        """

    def snapshot(self) -> SystemState:
        return self.state

    def recent_commands(self, limit: int = 50) -> list[Command]:
        ordered = sorted(self.commands.values(), key=lambda c: c.created_at, reverse=True)
        return ordered[:limit]
