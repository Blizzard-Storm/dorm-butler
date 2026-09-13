import asyncio
from types import SimpleNamespace

from app.llm.agent import LLMAgent, _explicit_fan_duty


def test_explicit_fan_duty_parser_is_conservative():
    assert _explicit_fan_duty("把风扇占空比调到34%") == 34
    assert _explicit_fan_duty("将风扇 PWM 设置为 60％") == 60
    assert _explicit_fan_duty("不要把风扇占空比调到34%") is None
    assert _explicit_fan_duty("如果把风扇占空比调到34%会怎样") is None
    assert _explicit_fan_duty("现在风扇占空比是多少？") is None


def test_explicit_fan_command_always_executes_tool_without_llm_call():
    calls = []

    class FakeExecutor:
        async def execute(self, name, args, confirmed=False):
            calls.append((name, args, confirmed))
            return {
                "ok": True,
                "status": "confirmed",
                "verdict": "已执行并收到设备回执",
                "command_id": "cmd34",
                "error": None,
            }

    agent = object.__new__(LLMAgent)
    agent.settings = SimpleNamespace(llm_enabled=True)
    agent.executor = FakeExecutor()

    result = asyncio.run(agent.chat([
        {"role": "user", "content": "把风扇占空比调到34%"},
    ]))

    assert calls == [("set_fan", {"mode": "manual", "duty_percent": 34}, False)]
    assert result["tool_calls"][0]["status"] == "confirmed"
    assert "34%" in result["reply"]
