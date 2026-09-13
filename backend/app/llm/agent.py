"""对接兼容 OpenAI function calling 的 LLM。

密钥只存在后端环境变量里，永远不下发到前端。
未配置密钥时 chat() 直接返回一个说明，其余监控与手动控制功能不受影响。
"""
from __future__ import annotations

import json
import logging
import re
from typing import Any

import httpx

from ..config import get_settings
from ..devices.base import DeviceService
from .tools import ToolExecutor, summarize_for_ui, tool_schemas

log = logging.getLogger(__name__)

MAX_TOOL_ROUNDS = 4

# 对最常用、参数明确的执行器命令做一层确定性识别。LLM 的 tool_choice=auto
# 偶尔会只回复“好的”而不真正调用工具；像“把风扇占空比调到 34%”这种
# 没有歧义的指令不应依赖模型是否愿意发起 function call。
_FAN_DUTY_RE = re.compile(
    r"(?:把|将)?\s*(?:风扇\s*)?(?:PWM\s*)?(?:占空比\s*)?"
    r"(?:调(?:整)?|设(?:置)?|改)(?:到|为|成)?\s*(\d{1,3})\s*[％%]",
    re.IGNORECASE,
)


def _explicit_fan_duty(text: str) -> int | None:
    """识别无歧义的风扇百分比设置指令；疑问、假设和否定句不执行。"""
    compact = text.strip()
    if any(word in compact for word in ("不要", "别把", "不用", "无需", "如果", "假如", "会怎样", "怎么样")):
        return None
    match = _FAN_DUTY_RE.search(compact)
    return int(match.group(1)) if match else None

SYSTEM_PROMPT = """你是"寝室管家"系统的助手。这是一套由三块 STC-B 单片机组成的宿舍监控系统：
NodeA 主控网关、NodeB 环境节点（温度/光照/风扇/通风窗）、NodeC 安防节点（门磁/振动/超声波/门锁）。

铁律：
1. 任何关于当前数值的回答都必须先调用工具获取，绝不凭印象编造读数。
2. 工具返回 null 表示该读数不可用（节点离线、传感器无有效回波等），要如实说"暂时拿不到"。
3. 光照是未标定的 0-4 等级，不要说成多少 lux。风扇是 PWM 输出百分比，不要说成转速。
   通风窗和门锁只有软件状态，没有位置传感器，不要说"已确认关好"。
4. 执行控制命令后，必须按工具返回的 verdict 如实转述结果。
   未收到回执就说未确认，失败就说失败，绝不能说成已经成功。
5. 遇到 needs_confirmation 的结果，告诉用户这是敏感操作，需要在界面上点确认。
6. 回答用中文，简洁直接，必要时给出数字和单位。"""


class LLMAgent:
    def __init__(self, device: DeviceService) -> None:
        self.settings = get_settings()
        self.executor = ToolExecutor(device)

    @property
    def enabled(self) -> bool:
        return self.settings.llm_enabled

    def status(self) -> dict:
        return {
            "enabled": self.enabled,
            "model": self.settings.llm_model if self.enabled else None,
            "base_url": self.settings.llm_base_url if self.enabled else None,
            "reason": None if self.enabled else "未配置 LLM_API_KEY，AI 助手不可用；"
                                                "监控与手动控制不受影响",
        }

    async def chat(self, messages: list[dict], confirmed_tool: dict | None = None) -> dict:
        """跑一轮对话，可能包含多次工具调用。

        confirmed_tool: 用户在界面上确认过的敏感操作 {"tool":..., "args":...}
        """
        if not self.enabled:
            return {
                "reply": "AI 助手尚未配置。请在后端 .env 里填写 LLM_API_KEY 后重启服务。"
                         "系统的监控、图表和手动控制功能不受影响，可以正常使用。",
                "tool_calls": [],
                "enabled": False,
            }

        # 显式百分比命令走确定性工具路由，避免模型只生成自然语言承诺却没有
        # function call。设备层仍会执行范围检查、串口下发并等待 NodeB ACK。
        if not confirmed_tool:
            latest_user = next(
                (m.get("content", "") for m in reversed(messages) if m.get("role") == "user"), ""
            )
            duty = _explicit_fan_duty(latest_user)
            if duty is not None:
                args = {"mode": "manual", "duty_percent": duty}
                result = await self.executor.execute("set_fan", args)
                ui_call = summarize_for_ui("set_fan", args, result)
                if result.get("ok"):
                    reply = (f"已将风扇切换为手动模式，占空比设置为 {duty}%，"
                             "并收到 NodeB 设备回执。")
                else:
                    reason = result.get("error") or result.get("verdict") or "设备未确认"
                    reply = f"风扇占空比未能设置为 {duty}%：{reason}。"
                return {"reply": reply, "tool_calls": [ui_call], "enabled": True}

        # 用户已确认的敏感操作：直接执行，不再过模型
        pre_calls: list[dict] = []
        if confirmed_tool:
            result = await self.executor.execute(
                confirmed_tool["tool"], confirmed_tool.get("args", {}), confirmed=True
            )
            pre_calls.append(summarize_for_ui(confirmed_tool["tool"],
                                              confirmed_tool.get("args", {}), result))

        convo: list[dict] = [{"role": "system", "content": SYSTEM_PROMPT}]
        convo.extend(messages)
        if pre_calls:
            convo.append({
                "role": "system",
                "content": f"用户刚刚确认并执行了敏感操作，结果：{json.dumps(pre_calls, ensure_ascii=False)}。"
                           f"请据此回复用户。",
            })

        ui_calls: list[dict] = list(pre_calls)

        try:
            # 默认直连可避开错误的校园网代理；需要系统代理时可通过配置显式开启。
            async with httpx.AsyncClient(
                timeout=self.settings.llm_timeout_s,
                trust_env=self.settings.llm_trust_env,
            ) as client:
                for _ in range(MAX_TOOL_ROUNDS):
                    data = await self._completion(client, convo)
                    choice = data["choices"][0]
                    msg = choice["message"]
                    convo.append(msg)

                    calls = msg.get("tool_calls") or []
                    if not calls:
                        return {"reply": msg.get("content") or "(空回复)",
                                "tool_calls": ui_calls, "enabled": True}

                    for call in calls:
                        name = call["function"]["name"]
                        try:
                            args = json.loads(call["function"].get("arguments") or "{}")
                        except json.JSONDecodeError:
                            args = {}
                        result = await self.executor.execute(name, args)
                        ui_calls.append(summarize_for_ui(name, args, result))
                        convo.append({
                            "role": "tool",
                            "tool_call_id": call["id"],
                            "content": json.dumps(result, ensure_ascii=False, default=str),
                        })

            return {"reply": "工具调用轮次超过上限，请把问题拆得更具体一些。",
                    "tool_calls": ui_calls, "enabled": True}

        except httpx.HTTPStatusError as exc:
            log.warning("LLM 接口返回错误: %s", exc)
            return {"reply": f"调用大模型失败（HTTP {exc.response.status_code}）。"
                             f"系统监控与手动控制不受影响。",
                    "tool_calls": ui_calls, "enabled": True, "error": str(exc)}
        except Exception as exc:
            log.exception("LLM 调用异常")
            return {"reply": f"调用大模型时出错：{exc}。系统监控与手动控制不受影响。",
                    "tool_calls": ui_calls, "enabled": True, "error": str(exc)}

    async def _completion(self, client: httpx.AsyncClient, convo: list[dict]) -> dict[str, Any]:
        resp = await client.post(
            f"{self.settings.llm_base_url.rstrip('/')}/chat/completions",
            headers={"Authorization": f"Bearer {self.settings.llm_api_key}",
                     "Content-Type": "application/json"},
            json={
                "model": self.settings.llm_model,
                "messages": convo,
                "tools": tool_schemas(),
                "tool_choice": "auto",
                "temperature": 0.2,
            },
        )
        resp.raise_for_status()
        return resp.json()
