"""进程内事件总线：设备层产出 -> WebSocket 广播 / 落库。

设备层不直接认识 WebSocket，也不直接认识数据库，只往这里 publish。
"""
from __future__ import annotations

import asyncio
import logging
from collections import deque
from typing import Any, Awaitable, Callable

log = logging.getLogger(__name__)

Handler = Callable[[str, dict], Awaitable[None] | None]

# 主题常量
TOPIC_STATE = "state"          # 全量状态快照
TOPIC_TELEMETRY = "telemetry"  # 一条遥测
TOPIC_EVENT = "event"          # 报警 / 上下线 / 传感器异常
TOPIC_COMMAND = "command"      # 命令生命周期变化
TOPIC_LINK = "link"            # 串口 / 模拟链路状态


class EventBus:
    def __init__(self, history: int = 50) -> None:
        self._handlers: list[Handler] = []
        self._recent: deque[tuple[str, dict]] = deque(maxlen=history)

    def subscribe(self, handler: Handler) -> Callable[[], None]:
        self._handlers.append(handler)

        def unsubscribe() -> None:
            if handler in self._handlers:
                self._handlers.remove(handler)

        return unsubscribe

    async def publish(self, topic: str, payload: dict[str, Any]) -> None:
        self._recent.append((topic, payload))
        for handler in list(self._handlers):
            try:
                result = handler(topic, payload)
                if asyncio.iscoroutine(result):
                    await result
            except Exception:
                # 单个订阅者出错不能拖垮设备层
                log.exception("事件处理器异常 topic=%s", topic)

    @property
    def recent(self) -> list[tuple[str, dict]]:
        return list(self._recent)


bus = EventBus()
