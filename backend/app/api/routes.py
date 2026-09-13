"""REST 接口。

约定：所有控制类接口都返回 command_id 与当前 status，前端据此展示
待处理 / 已确认 / 失败 / 超时，绝不把 HTTP 200 当作设备执行成功。
"""
from __future__ import annotations

import json
from datetime import datetime, timedelta, timezone
from typing import Literal

from fastapi import APIRouter, HTTPException, Query, Request
from pydantic import BaseModel, Field
from sqlalchemy import func, or_, select

from ..config import get_settings
from ..db import all_settings, session_scope
from ..devices.base import CommandName
from ..devices.mock import MockDeviceService
from ..devices.serial_svc import SerialDeviceService, list_serial_ports
from ..models import CommandRecord, Event, Telemetry
from ..protocol import frames as F

router = APIRouter(prefix="/api")


def _device(request: Request):
    return request.app.state.device


def _agent(request: Request):
    return request.app.state.agent


def _error(status: int, code: str, message: str) -> HTTPException:
    """统一错误格式，前端只解析这一种结构。"""
    return HTTPException(status_code=status, detail={"code": code, "message": message})


# ====================================================================== 状态


@router.get("/status")
async def get_status(request: Request):
    return _device(request).snapshot().as_dict()


@router.get("/system/info")
async def system_info(request: Request):
    s = get_settings()
    device = _device(request)
    return {
        "mode": device.mode,
        "configured_port": s.serial_port,
        "configured_baud": s.serial_baud,
        "available_ports": list_serial_ports(),
        "database": s.db_url,
        "llm": _agent(request).status(),
        "telemetry_period_s": s.telemetry_period_s,
        "capabilities": {k: v.__dict__ for k, v in device.snapshot().capabilities.items()},
    }


@router.post("/serial/pause")
async def serial_pause(request: Request):
    """烧录前调用：主动放开串口，给 STC-ISP 让路。

    只关串口本身，FastAPI 进程、WebSocket、网页全程不受影响——
    不必再像以前那样整个杀掉后端。模拟模式下这是个安全的空操作。
    """
    device = _device(request)
    if not isinstance(device, SerialDeviceService):
        return {"ok": True, "paused": False, "message": "当前是模拟模式，没有真实串口需要释放"}
    await device.pause()
    return {"ok": True, "paused": True, "message": "串口已释放，可以烧录了"}


@router.post("/serial/resume")
async def serial_resume(request: Request):
    """烧录完成后调用：重新打开串口，恢复正常读取与自动重连。"""
    device = _device(request)
    if not isinstance(device, SerialDeviceService):
        return {"ok": True, "paused": False, "message": "当前是模拟模式，无需恢复"}
    await device.resume()
    return {"ok": True, "paused": False, "message": "串口已恢复，正在重新连接"}


# ====================================================================== 历史与记录


@router.get("/history")
async def get_history(
    minutes: int = Query(10, ge=1, le=10080),
    metrics: str = Query("temp_c,fan_duty,distance_cm,lux_level"),
    limit: int = Query(2000, ge=10, le=20000),
):
    wanted = [m.strip() for m in metrics.split(",") if m.strip()]
    allowed = {"temp_c", "fan_duty", "distance_cm", "lux_level", "lux_adc",
               "alarm_level", "crc_errors"}
    bad = set(wanted) - allowed
    if bad:
        raise _error(400, "bad_metric", f"不支持的指标: {', '.join(sorted(bad))}")

    since = datetime.now(timezone.utc) - timedelta(minutes=minutes)
    metric_columns = [getattr(Telemetry, m) for m in wanted]
    columns = [Telemetry.ts] + metric_columns
    valid = (
        Telemetry.ts >= since,
        or_(*(column.is_not(None) for column in metric_columns)),
    )
    with session_scope() as s:
        total = s.scalar(select(func.count()).select_from(Telemetry).where(*valid)) or 0
        if total <= limit:
            rows = s.execute(select(*columns).where(*valid).order_by(Telemetry.ts)).all()
        else:
            # Keep coverage across the whole requested period instead of returning
            # only the oldest `limit` rows.  This also drops all-null telemetry rows,
            # which can otherwise hide valid samples that occur later in the range.
            stride = (total + limit - 1) // limit
            ranked = select(
                *columns,
                func.row_number().over(order_by=Telemetry.ts).label("sample_no"),
            ).where(*valid).subquery()
            sampled_columns = [ranked.c.ts] + [getattr(ranked.c, m) for m in wanted]
            rows = s.execute(
                select(*sampled_columns)
                .where(or_(ranked.c.sample_no % stride == 0, ranked.c.sample_no == total))
                .order_by(ranked.c.ts)
                .limit(limit)
            ).all()

    return {
        "minutes": minutes,
        "metrics": wanted,
        "total_count": total,
        "count": len(rows),
        "points": [
            {"ts": r[0].isoformat(), **{m: r[i + 1] for i, m in enumerate(wanted)}}
            for r in rows
        ],
    }


@router.get("/events")
async def get_events(
    minutes: int = Query(1440, ge=1, le=43200),
    level: Literal["all", "info", "warning", "alarm"] = "all",
    kind: str = "all",
    node: str = "all",
    limit: int = Query(200, ge=1, le=1000),
):
    since = datetime.now(timezone.utc) - timedelta(minutes=minutes)
    stmt = select(Event).where(Event.ts >= since)
    if level != "all":
        stmt = stmt.where(Event.level == level)
    if kind != "all":
        stmt = stmt.where(Event.kind == kind)
    if node != "all":
        stmt = stmt.where(Event.node == node)
    with session_scope() as s:
        rows = s.scalars(stmt.order_by(Event.ts.desc()).limit(limit)).all()
        return {
            "count": len(rows),
            "events": [
                {"id": r.id, "ts": r.ts.isoformat(), "level": r.level, "kind": r.kind,
                 "node": r.node, "message": r.message}
                for r in rows
            ],
        }


@router.get("/commands")
async def get_commands(limit: int = Query(100, ge=1, le=500), source: str = "all"):
    stmt = select(CommandRecord)
    if source != "all":
        stmt = stmt.where(CommandRecord.source == source)
    with session_scope() as s:
        rows = s.scalars(stmt.order_by(CommandRecord.created_at.desc()).limit(limit)).all()
        return {
            "count": len(rows),
            "commands": [
                {
                    "id": r.id, "name": r.name, "params": json.loads(r.params_json or "{}"),
                    "target_node": r.target_node, "source": r.source, "status": r.status,
                    "created_at": r.created_at.isoformat(),
                    "sent_at": r.sent_at.isoformat() if r.sent_at else None,
                    "settled_at": r.settled_at.isoformat() if r.settled_at else None,
                    "attempts": r.attempts, "error": r.error,
                }
                for r in rows
            ],
        }


@router.get("/commands/{command_id}")
async def get_command(command_id: str, request: Request):
    cmd = _device(request).commands.get(command_id)
    if cmd:
        return cmd.as_dict()
    with session_scope() as s:
        row = s.get(CommandRecord, command_id)
        if not row:
            raise _error(404, "not_found", f"命令 {command_id} 不存在")
        return {"id": row.id, "name": row.name, "status": row.status,
                "error": row.error, "attempts": row.attempts}


# ====================================================================== 控制


class FanBody(BaseModel):
    mode: Literal["auto", "manual"]
    duty_percent: int | None = Field(None, ge=F.FAN_DUTY_MIN, le=F.FAN_DUTY_MAX)


class ThresholdBody(BaseModel):
    celsius: int = Field(..., ge=F.TEMPSET_MIN, le=F.TEMPSET_MAX)


class NearBody(BaseModel):
    cm: int = Field(..., ge=F.NEARCM_MIN, le=F.NEARCM_MAX)


class AlarmBody(BaseModel):
    hour: int = Field(..., ge=0, le=23)
    minute: int = Field(..., ge=0, le=59)


class SecurityBody(BaseModel):
    mode: Literal["arm", "disarm"]


class WindowBody(BaseModel):
    state: Literal["open", "close", "auto"]


async def _submit(request: Request, name: str, params: dict):
    cmd = await _device(request).submit(name, params, source="user")
    return {"command_id": cmd.id, "status": str(cmd.status), "error": cmd.error,
            "target_node": cmd.target_node}


@router.post("/control/fan")
async def control_fan(body: FanBody, request: Request):
    if body.mode == "manual" and body.duty_percent is None:
        raise _error(400, "missing_duty", "手动模式必须给出 duty_percent")
    params = {"mode": body.mode}
    if body.mode == "manual":
        params["duty_percent"] = body.duty_percent
    return await _submit(request, CommandName.SET_FAN, params)


@router.post("/control/temperature-threshold")
async def control_threshold(body: ThresholdBody, request: Request):
    # 不在这里存盘。参数只有在设备确认执行后才算数，
    # 持久化统一由 db.Recorder 在命令进入 confirmed 时做（AI 下发的命令同理）。
    return await _submit(request, CommandName.SET_TEMP_THRESHOLD, {"celsius": body.celsius})


@router.post("/control/near-threshold")
async def control_near(body: NearBody, request: Request):
    return await _submit(request, CommandName.SET_NEAR_THRESHOLD, {"cm": body.cm})


@router.post("/control/alarm")
async def control_alarm(body: AlarmBody, request: Request):
    """闹钟是 NodeA 本机参数，不经过 485，从站不在线也能真正生效。"""
    return await _submit(request, CommandName.SET_ALARM,
                         {"hour": body.hour, "minute": body.minute})


@router.post("/control/sync-time")
async def control_sync_time(request: Request):
    """把 PC 的当前时间下发给 NodeA 的 DS1302。

    DS1302 靠纽扣电池独立走时，长期不校会与现实偏开，而闹钟和报文
    时间戳都依赖它。只同步时分秒，日期不动。
    """
    now = datetime.now()
    return await _submit(request, CommandName.SYNC_TIME,
                         {"hour": now.hour, "minute": now.minute, "second": now.second})


@router.post("/control/security")
async def control_security(body: SecurityBody, request: Request):
    return await _submit(request, CommandName.SET_SECURITY_MODE, {"mode": body.mode})


@router.post("/control/silence")
async def control_silence(request: Request):
    return await _submit(request, CommandName.SILENCE_ALARM, {})


@router.post("/control/window")
async def control_window(body: WindowBody, request: Request):
    return await _submit(request, CommandName.SET_WINDOW, {"state": body.state})


# ====================================================================== 设置


@router.get("/settings")
async def read_settings(request: Request):
    stored = all_settings()
    state = _device(request).snapshot()
    return {
        "stored": stored,
        "effective": {
            "temp_threshold": state.temp_threshold,
            "near_threshold": state.near_threshold,
            "fan_mode": state.fan_mode,
        },
    }


# ====================================================================== 模拟注入（仅 mock 模式）


class DoorBody(BaseModel):
    opened: bool


class OfflineBody(BaseModel):
    node: Literal["B", "C"]
    offline: bool


class FaultRateBody(BaseModel):
    command_fail_rate: float = Field(..., ge=0.0, le=1.0)


def _mock(request: Request) -> MockDeviceService:
    device = _device(request)
    if not isinstance(device, MockDeviceService):
        raise _error(409, "not_mock", "当前是真实串口模式，模拟注入不可用")
    return device


@router.post("/mock/door")
async def mock_door(body: DoorBody, request: Request):
    _mock(request).inject_door(body.opened)
    return {"ok": True}


@router.post("/mock/vibration")
async def mock_vibration(request: Request):
    _mock(request).inject_vibration()
    return {"ok": True}


@router.post("/mock/node-offline")
async def mock_offline(body: OfflineBody, request: Request):
    _mock(request).set_node_offline(body.node, body.offline)
    return {"ok": True}


@router.post("/mock/fault-rate")
async def mock_fault_rate(body: FaultRateBody, request: Request):
    _mock(request).fault_command_fail_rate = body.command_fail_rate
    return {"ok": True, "command_fail_rate": body.command_fail_rate}


# ====================================================================== AI


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class ChatBody(BaseModel):
    messages: list[ChatMessage]
    confirmed_tool: dict | None = None


@router.get("/ai/status")
async def ai_status(request: Request):
    return _agent(request).status()


@router.post("/ai/chat")
async def ai_chat(body: ChatBody, request: Request):
    msgs = [m.model_dump() for m in body.messages][-20:]
    return await _agent(request).chat(msgs, confirmed_tool=body.confirmed_tool)
