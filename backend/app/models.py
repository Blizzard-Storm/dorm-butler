"""SQLite 数据模型。四张表对应交接文档第二阶段的要求。"""
from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, Float, Index, Integer, String, Text
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Base(DeclarativeBase):
    pass


class Telemetry(Base):
    """一条时间点上的全系统读数。字段为 NULL 表示当时不可信或拿不到。"""

    __tablename__ = "telemetry"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    ts: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, index=True)

    temp_c: Mapped[float | None] = mapped_column(Float)
    lux_level: Mapped[int | None] = mapped_column(Integer)
    # 未标定的原始 ADC，0~1023。标定实验要的就是这两列。
    # 只有 NodeB 直连模式（固件发 CAL 行）才有；经 NodeA 汇总时报文里没有，为 NULL。
    lux_adc: Mapped[int | None] = mapped_column(Integer)      # 光敏 Rop 原始值
    temp_adc: Mapped[int | None] = mapped_column(Integer)     # 热敏 Rt 原始值
    distance_cm: Mapped[int | None] = mapped_column(Integer)
    distance_valid: Mapped[bool] = mapped_column(Boolean, default=False)
    door_state: Mapped[str | None] = mapped_column(String(16))
    security_state: Mapped[str | None] = mapped_column(String(16))
    alarm_level: Mapped[int | None] = mapped_column(Integer)
    fan_duty: Mapped[int | None] = mapped_column(Integer)
    window_state: Mapped[str | None] = mapped_column(String(16))
    lock_state: Mapped[str | None] = mapped_column(String(16))

    node_a_online: Mapped[bool] = mapped_column(Boolean, default=False)
    node_b_online: Mapped[bool] = mapped_column(Boolean, default=False)
    node_c_online: Mapped[bool] = mapped_column(Boolean, default=False)
    crc_errors: Mapped[int] = mapped_column(Integer, default=0)


Index("ix_telemetry_ts_desc", Telemetry.ts.desc())


class Event(Base):
    """报警、节点上下线、门状态变化、传感器异常等离散事件。"""

    __tablename__ = "events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    ts: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, index=True)
    kind: Mapped[str] = mapped_column(String(24), index=True)    # security/door/node/bus/...
    level: Mapped[str] = mapped_column(String(12), index=True)   # info/warning/alarm
    node: Mapped[str] = mapped_column(String(4), default="-")
    message: Mapped[str] = mapped_column(Text)


class CommandRecord(Base):
    """每一条控制命令的完整生命周期，包括 AI 发出的。"""

    __tablename__ = "commands"

    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    name: Mapped[str] = mapped_column(String(48), index=True)
    params_json: Mapped[str] = mapped_column(Text, default="{}")
    target_node: Mapped[str] = mapped_column(String(4), default="-")
    source: Mapped[str] = mapped_column(String(12), default="user", index=True)  # user/ai/system
    status: Mapped[str] = mapped_column(String(16), default="pending", index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, index=True)
    sent_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    settled_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    attempts: Mapped[int] = mapped_column(Integer, default=0)
    error: Mapped[str | None] = mapped_column(Text)


class Setting(Base):
    """可持久化的用户参数，刷新和重启后仍然保留。"""

    __tablename__ = "settings"

    key: Mapped[str] = mapped_column(String(48), primary_key=True)
    value: Mapped[str] = mapped_column(Text)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow,
                                                 onupdate=utcnow)
