"""AI function-calling 工具注册与参数校验测试。"""
from __future__ import annotations

import asyncio

import pytest

from app.devices.base import Command, CommandName, CommandStatus
from app.llm.tools import CONTROL_TOOLS, ToolExecutor, tool_schemas
from app.protocol import frames as F


def _schema(name: str) -> dict:
    return next(item["function"] for item in tool_schemas()
                if item["function"]["name"] == name)


def test_near_threshold_is_exposed_to_llm() -> None:
    schema = _schema("set_near_threshold")
    cm = schema["parameters"]["properties"]["cm"]

    assert schema["parameters"]["required"] == ["cm"]
    assert cm["minimum"] == F.NEARCM_MIN
    assert cm["maximum"] == F.NEARCM_MAX
    assert CommandName.SET_NEAR_THRESHOLD in CONTROL_TOOLS


def test_near_threshold_server_side_validation() -> None:
    executor = ToolExecutor(None)  # type: ignore[arg-type]

    assert executor._validate("set_near_threshold", {"cm": 80}) == {"cm": 80}
    with pytest.raises(ValueError, match="cm 必须在"):
        executor._validate("set_near_threshold", {"cm": F.NEARCM_MIN - 1})
    with pytest.raises(ValueError, match="cm 必须在"):
        executor._validate("set_near_threshold", {"cm": F.NEARCM_MAX + 1})


class _ConfirmedDevice:
    def __init__(self) -> None:
        self.commands: dict[str, Command] = {}

    async def submit(self, name: str, params: dict, source: str = "user") -> Command:
        cmd = Command(name=name, params=params, source=source,
                      status=CommandStatus.CONFIRMED)
        self.commands[cmd.id] = cmd
        return cmd


def test_near_threshold_dispatches_as_control_command() -> None:
    device = _ConfirmedDevice()
    result = asyncio.run(
        ToolExecutor(device).execute("set_near_threshold", {"cm": 80})  # type: ignore[arg-type]
    )

    assert result["ok"] is True
    assert result["status"] == "confirmed"
    cmd = next(iter(device.commands.values()))
    assert cmd.name == CommandName.SET_NEAR_THRESHOLD
    assert cmd.params == {"cm": 80}
    assert cmd.source == "ai"
