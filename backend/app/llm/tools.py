"""LLM 工具定义与执行。

设计原则（对应交接文档第四阶段）：
  1. 模型只负责选工具和填参数，绝不生成串口字节，也不执行任意代码；
  2. 参数用严格 JSON Schema 约束，服务端**再校验一次**，与固件从站的
     值域检查形成双重防线；
  3. 查询类工具直接执行；控制类工具写入 commands 表，来源标记 ai；
  4. 工具返回的执行结论必须区分"已确认""已发送未确认""失败"，
     不允许模型用自然语言把失败说成成功。
"""
from __future__ import annotations

import asyncio
from datetime import datetime, timedelta, timezone
from typing import Any

from sqlalchemy import select

from ..db import session_scope
from ..devices.base import TERMINAL_STATUSES, CommandName, CommandStatus, DeviceService
from ..models import Event, Telemetry
from ..protocol import frames as F

# 控制类工具：需要等回执，且要写命令记录
CONTROL_TOOLS = {
    CommandName.SET_FAN,
    CommandName.SET_TEMP_THRESHOLD,
    CommandName.SET_SECURITY_MODE,
    CommandName.SILENCE_ALARM,
    CommandName.SET_WINDOW,
}

# 需要用户二次确认的敏感操作。服务端在未确认时直接拒绝执行。
SENSITIVE_TOOLS = {CommandName.SET_SECURITY_MODE, CommandName.SILENCE_ALARM}

METRICS = ("temp_c", "lux_level", "distance_cm", "fan_duty", "alarm_level", "crc_errors")


def tool_schemas() -> list[dict]:
    """OpenAI function calling 格式的工具定义。"""
    return [
        {
            "type": "function",
            "function": {
                "name": "get_system_status",
                "description": "获取寝室管家系统当前的完整状态：温度、光照等级、距离、门与安防状态、"
                               "风扇 PWM、三个节点在线情况、当前参数设置。回答任何关于当前情况的问题都先调用它。",
                "parameters": {"type": "object", "properties": {}, "additionalProperties": False},
            },
        },
        {
            "type": "function",
            "function": {
                "name": "get_history",
                "description": "查询一段时间内的历史遥测数据，用于回答趋势、最高最低、变化过程一类的问题。",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "metric": {"type": "string", "enum": list(METRICS),
                                   "description": "要查询的物理量"},
                        "minutes": {"type": "integer", "minimum": 1, "maximum": 1440,
                                    "description": "往前查多少分钟，最多 24 小时"},
                    },
                    "required": ["metric", "minutes"],
                    "additionalProperties": False,
                },
            },
        },
        {
            "type": "function",
            "function": {
                "name": "get_alarm_events",
                "description": "查询报警与重要事件记录（报警、门状态变化、节点上下线、总线错误）。",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "minutes": {"type": "integer", "minimum": 1, "maximum": 10080},
                        "level": {"type": "string", "enum": ["all", "info", "warning", "alarm"]},
                    },
                    "required": ["minutes"],
                    "additionalProperties": False,
                },
            },
        },
        {
            "type": "function",
            "function": {
                "name": "set_fan",
                "description": "设置风扇运行模式。auto 交回 NodeB 本地温度闭环；manual 时必须给出占空比。",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "mode": {"type": "string", "enum": ["auto", "manual"]},
                        "duty_percent": {"type": "integer",
                                         "minimum": F.FAN_DUTY_MIN, "maximum": F.FAN_DUTY_MAX,
                                         "description": "PWM 输出百分比，仅 manual 模式有效"},
                    },
                    "required": ["mode"],
                    "additionalProperties": False,
                },
            },
        },
        {
            "type": "function",
            "function": {
                "name": "set_temperature_threshold",
                "description": f"设置风扇启动的温度阈值，允许 {F.TEMPSET_MIN}-{F.TEMPSET_MAX} 摄氏度。",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "celsius": {"type": "integer",
                                    "minimum": F.TEMPSET_MIN, "maximum": F.TEMPSET_MAX},
                    },
                    "required": ["celsius"],
                    "additionalProperties": False,
                },
            },
        },
        {
            "type": "function",
            "function": {
                "name": "set_security_mode",
                "description": "布防或撤防。这是敏感操作，必须由用户在界面上二次确认后才会真正执行。",
                "parameters": {
                    "type": "object",
                    "properties": {"mode": {"type": "string", "enum": ["arm", "disarm"]}},
                    "required": ["mode"],
                    "additionalProperties": False,
                },
            },
        },
        {
            "type": "function",
            "function": {
                "name": "silence_alarm",
                "description": "对当前报警静音。安防状态保持不变，只是不再出声。敏感操作，需要二次确认。",
                "parameters": {"type": "object", "properties": {}, "additionalProperties": False},
            },
        },
        {
            "type": "function",
            "function": {
                "name": "set_window",
                "description": "控制通风窗开合。注意：当前固件不支持该命令，调用会明确返回不支持。",
                "parameters": {
                    "type": "object",
                    "properties": {"state": {"type": "string", "enum": ["open", "close"]}},
                    "required": ["state"],
                    "additionalProperties": False,
                },
            },
        },
    ]


class ToolExecutor:
    def __init__(self, device: DeviceService) -> None:
        self.device = device

    async def execute(self, name: str, args: dict, confirmed: bool = False) -> dict:
        """执行一个工具调用，返回结构化结果（同时也是回给模型的内容）。"""
        try:
            if name == "get_system_status":
                return self._status()
            if name == "get_history":
                return self._history(args)
            if name == "get_alarm_events":
                return self._events(args)
            if name in {"set_fan", "set_temperature_threshold", "set_security_mode",
                        "silence_alarm", "set_window"}:
                return await self._control(name, args, confirmed)
            return {"ok": False, "error": f"未知工具：{name}"}
        except (KeyError, ValueError, TypeError) as exc:
            return {"ok": False, "error": f"参数错误：{exc}"}

    # ------------------------------------------------------------- 查询类

    def _status(self) -> dict:
        s = self.device.snapshot().as_dict()
        # 给模型一份带解释的精简视图，避免它对 None 乱猜
        env, sec = s["env"], s["security"]
        return {
            "ok": True,
            "mode": s["link"]["mode"],
            "link_connected": s["link"]["connected"],
            "nodes_online": {k: v["online"] for k, v in s["nodes"].items()},
            "temperature_c": env["temp_c"],
            "temperature_note": "节点B 离线或无效时为 null，不要编造数值",
            "light_level_0_4": env["lux_level"],
            "light_note": "这是未标定的光照等级 0-4，不是 lux",
            "fan_pwm_percent": env["fan_duty"],
            "fan_note": "这是 PWM 输出百分比，不是实测转速",
            "fan_mode": env["fan_mode"],
            "window_state": env["window_state"],
            "window_note": "软件状态，无位置反馈传感器",
            "distance_cm": sec["distance_cm"],
            "distance_valid": sec["distance_valid"],
            "door_state": sec["door_state"],
            "security_state": sec["security_state"],
            "alarm_level": sec["alarm_level"],
            "alarm_note": "0 无报警 / 1 提示 / 2 报警",
            "settings": s["settings"],
            "diagnostics": s["diagnostics"],
            "unsupported_controls": {
                k: v["reason"] for k, v in s["capabilities"].items() if not v["supported"]
            },
        }

    def _history(self, args: dict) -> dict:
        metric = args["metric"]
        if metric not in METRICS:
            return {"ok": False, "error": f"不支持的指标：{metric}"}
        minutes = max(1, min(1440, int(args["minutes"])))
        since = datetime.now(timezone.utc) - timedelta(minutes=minutes)
        column = getattr(Telemetry, metric)
        with session_scope() as s:
            rows = s.execute(
                select(Telemetry.ts, column)
                .where(Telemetry.ts >= since, column.is_not(None))
                .order_by(Telemetry.ts)
            ).all()
        values = [r[1] for r in rows]
        if not values:
            return {"ok": True, "metric": metric, "minutes": minutes, "count": 0,
                    "note": "该时间段内没有有效数据，请如实说明，不要编造"}
        # 只回统计量和少量采样点，别把几千行原始数据塞给模型
        step = max(1, len(rows) // 12)
        return {
            "ok": True,
            "metric": metric,
            "minutes": minutes,
            "count": len(values),
            "min": min(values),
            "max": max(values),
            "avg": round(sum(values) / len(values), 2),
            "latest": values[-1],
            "samples": [{"ts": r[0].isoformat(), "value": r[1]} for r in rows[::step]][:12],
        }

    def _events(self, args: dict) -> dict:
        minutes = max(1, min(10080, int(args["minutes"])))
        level = args.get("level", "all")
        since = datetime.now(timezone.utc) - timedelta(minutes=minutes)
        stmt = select(Event).where(Event.ts >= since)
        if level != "all":
            stmt = stmt.where(Event.level == level)
        with session_scope() as s:
            rows = s.scalars(stmt.order_by(Event.ts.desc()).limit(30)).all()
            items = [{"ts": r.ts.isoformat(), "level": r.level, "kind": r.kind,
                      "node": r.node, "message": r.message} for r in rows]
        return {"ok": True, "minutes": minutes, "count": len(items), "events": items}

    # ------------------------------------------------------------- 控制类

    async def _control(self, name: str, args: dict, confirmed: bool) -> dict:
        if name in SENSITIVE_TOOLS and not confirmed:
            return {
                "ok": False,
                "needs_confirmation": True,
                "tool": name,
                "args": args,
                "message": "这是敏感操作，已生成待确认请求。请告诉用户需要在界面上点击确认后才会执行。",
            }

        params = self._validate(name, args)
        cmd = await self.device.submit(name, params, source="ai")
        settled = await self._await_settled(cmd.id)

        status = settled.status
        if status == CommandStatus.CONFIRMED:
            verdict = "已执行并收到设备回执"
        elif status == CommandStatus.UNSUPPORTED:
            verdict = "当前固件不支持这条命令，未执行"
        elif status == CommandStatus.FAILED:
            verdict = "执行失败"
        elif status == CommandStatus.TIMEOUT:
            verdict = "已下发但未收到回执，不能认为已生效"
        else:
            verdict = "已发送，尚未确认"

        return {
            "ok": status == CommandStatus.CONFIRMED,
            "command_id": cmd.id,
            "status": str(status),
            "verdict": verdict,
            "error": settled.error,
            "instruction_to_model": "必须如实转述 verdict，不得把未确认或失败说成成功。",
        }

    def _validate(self, name: str, args: dict) -> dict:
        """服务端二次校验。与固件从站的检查区间保持一致。"""
        if name == "set_fan":
            mode = args.get("mode")
            if mode not in ("auto", "manual"):
                raise ValueError(f"mode 必须是 auto 或 manual，收到 {mode!r}")
            if mode == "manual":
                duty = int(args.get("duty_percent", -1))
                if not F.FAN_DUTY_MIN <= duty <= F.FAN_DUTY_MAX:
                    raise ValueError(f"duty_percent 必须在 {F.FAN_DUTY_MIN}-{F.FAN_DUTY_MAX}")
                return {"mode": "manual", "duty_percent": duty}
            return {"mode": "auto"}

        if name == "set_temperature_threshold":
            v = int(args["celsius"])
            if not F.TEMPSET_MIN <= v <= F.TEMPSET_MAX:
                raise ValueError(f"celsius 必须在 {F.TEMPSET_MIN}-{F.TEMPSET_MAX}")
            return {"celsius": v}

        if name == "set_security_mode":
            mode = args.get("mode")
            if mode not in ("arm", "disarm"):
                raise ValueError(f"mode 必须是 arm 或 disarm，收到 {mode!r}")
            return {"mode": mode}

        if name == "silence_alarm":
            return {}

        if name == "set_window":
            state = args.get("state")
            if state not in ("open", "close"):
                raise ValueError(f"state 必须是 open 或 close，收到 {state!r}")
            return {"state": state}

        raise ValueError(f"未知控制命令：{name}")

    async def _await_settled(self, command_id: str, timeout: float = 6.0):
        cmd = self.device.commands[command_id]
        deadline = asyncio.get_running_loop().time() + timeout
        while cmd.status not in TERMINAL_STATUSES:
            if asyncio.get_running_loop().time() > deadline:
                break
            await asyncio.sleep(0.1)
        return cmd


def summarize_for_ui(name: str, args: dict, result: dict) -> dict[str, Any]:
    """给前端对话气泡里的小卡片用。"""
    return {
        "tool": name,
        "args": args,
        "ok": bool(result.get("ok")),
        "status": result.get("status"),
        "verdict": result.get("verdict") or result.get("error") or "查询完成",
        "command_id": result.get("command_id"),
        "needs_confirmation": bool(result.get("needs_confirmation")),
    }
