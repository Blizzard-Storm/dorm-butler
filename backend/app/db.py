"""数据库会话、初始化，以及把总线事件落盘的记录器。"""
from __future__ import annotations

import json
import logging
from contextlib import contextmanager
from datetime import datetime, timedelta, timezone
from typing import Iterator

from sqlalchemy import create_engine, delete, select
from sqlalchemy.orm import Session, sessionmaker

from .bus import TOPIC_COMMAND, TOPIC_EVENT, TOPIC_TELEMETRY, bus
from .config import get_settings
from .devices.base import CommandName, CommandStatus
from .models import Base, CommandRecord, Event, Setting, Telemetry

# 哪些命令确认成功后需要把参数持久化下来
_SETTING_OF_COMMAND = {
    str(CommandName.SET_TEMP_THRESHOLD): "temp_threshold",
    str(CommandName.SET_NEAR_THRESHOLD): "near_threshold",
}

log = logging.getLogger(__name__)

_settings = get_settings()
engine = create_engine(
    _settings.db_url,
    echo=False,
    future=True,
    connect_args={"check_same_thread": False} if _settings.db_url.startswith("sqlite") else {},
)
SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False, future=True)


def init_db() -> None:
    Base.metadata.create_all(engine)
    log.info("数据库就绪: %s", _settings.db_url)


@contextmanager
def session_scope() -> Iterator[Session]:
    s = SessionLocal()
    try:
        yield s
        s.commit()
    except Exception:
        s.rollback()
        raise
    finally:
        s.close()


def _parse_ts(value: str | None) -> datetime:
    if not value:
        return datetime.now(timezone.utc)
    try:
        return datetime.fromisoformat(value)
    except ValueError:
        return datetime.now(timezone.utc)


# ---------------------------------------------------------------- 设置项读写


def get_setting(key: str, default: str | None = None) -> str | None:
    with session_scope() as s:
        row = s.get(Setting, key)
        return row.value if row else default


def set_setting(key: str, value: str) -> None:
    with session_scope() as s:
        row = s.get(Setting, key)
        if row:
            row.value = value
            row.updated_at = datetime.now(timezone.utc)
        else:
            s.add(Setting(key=key, value=value))


def all_settings() -> dict[str, str]:
    with session_scope() as s:
        return {r.key: r.value for r in s.scalars(select(Setting))}


# ---------------------------------------------------------------- 记录器


class Recorder:
    """订阅总线，把遥测 / 事件 / 命令写进 SQLite。

    遥测按 telemetry_period_s 节流，避免 1Hz 长跑把库撑爆。
    """

    def __init__(self) -> None:
        self._last_telemetry_at: datetime | None = None
        self._unsub = None

    def start(self) -> None:
        self._unsub = bus.subscribe(self._on_event)

    def stop(self) -> None:
        if self._unsub:
            self._unsub()
            self._unsub = None

    def _on_event(self, topic: str, payload: dict) -> None:
        try:
            if topic == TOPIC_TELEMETRY:
                self._save_telemetry(payload)
            elif topic == TOPIC_EVENT:
                self._save_event(payload)
            elif topic == TOPIC_COMMAND:
                self._save_command(payload)
        except Exception:
            log.exception("落库失败 topic=%s", topic)

    def _save_telemetry(self, p: dict) -> None:
        ts = _parse_ts(p.get("ts"))
        # 留 10% 容差再判丢弃。数据源本身就按 period 发送时（NodeA/NodeB 每秒一行），
        # 板上晶振偏快一点点就会让实际间隔变成 0.99s，严格比较会把每隔一条全丢掉，
        # 实测采样率因此掉到 0.5Hz。节流的目的是挡突发，不是挡正常速率。
        period = _settings.telemetry_period_s * 0.9
        if self._last_telemetry_at and (ts - self._last_telemetry_at).total_seconds() < period:
            return
        self._last_telemetry_at = ts
        with session_scope() as s:
            s.add(Telemetry(
                ts=ts,
                temp_c=p.get("temp_c"),
                lux_level=p.get("lux_level"),
                lux_adc=p.get("lux_adc"),
                temp_adc=p.get("temp_adc"),
                distance_cm=p.get("distance_cm"),
                distance_valid=bool(p.get("distance_valid")),
                door_state=p.get("door_state"),
                security_state=p.get("security_state"),
                alarm_level=p.get("alarm_level"),
                fan_duty=p.get("fan_duty"),
                window_state=p.get("window_state"),
                lock_state=p.get("lock_state"),
                node_a_online=bool(p.get("node_a_online")),
                node_b_online=bool(p.get("node_b_online")),
                node_c_online=bool(p.get("node_c_online")),
                crc_errors=int(p.get("crc_errors") or 0),
            ))

    def _save_event(self, p: dict) -> None:
        with session_scope() as s:
            s.add(Event(
                ts=_parse_ts(p.get("ts")),
                kind=p.get("kind", "-"),
                level=p.get("level", "info"),
                node=p.get("node", "-"),
                message=p.get("message", ""),
            ))

    def _save_command(self, p: dict) -> None:
        with session_scope() as s:
            row = s.get(CommandRecord, p["id"])
            if row is None:
                row = CommandRecord(id=p["id"], created_at=_parse_ts(p.get("created_at")))
                s.add(row)
            row.name = p.get("name", "")
            row.params_json = json.dumps(p.get("params", {}), ensure_ascii=False)
            row.target_node = p.get("target_node", "-")
            row.source = p.get("source", "user")
            row.status = p.get("status", "pending")
            row.sent_at = _parse_ts(p["sent_at"]) if p.get("sent_at") else None
            row.settled_at = _parse_ts(p["settled_at"]) if p.get("settled_at") else None
            row.attempts = int(p.get("attempts") or 0)
            row.error = p.get("error")

        # 只有设备确认执行了，这个参数才配被记成"当前值"。
        # 失败、超时、离线待下发的命令一律不存盘 —— 否则页面上的"当前阈值"
        # 会变成"上一次请求的值"，那是在骗人。
        # REST 和 AI 两条下发路径都经过这里，行为一致。
        if p.get("status") == str(CommandStatus.CONFIRMED):
            key = _SETTING_OF_COMMAND.get(p.get("name", ""))
            if key:
                params = p.get("params") or {}
                for v in params.values():
                    if isinstance(v, int):
                        set_setting(key, str(v))
                        break


def purge_old_telemetry() -> int:
    """删除超过保留期的遥测，事件和命令记录保留不动。"""
    cutoff = datetime.now(timezone.utc) - timedelta(days=_settings.telemetry_keep_days)
    with session_scope() as s:
        result = s.execute(delete(Telemetry).where(Telemetry.ts < cutoff))
        return result.rowcount or 0


recorder = Recorder()
