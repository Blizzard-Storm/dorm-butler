"""WebSocket 实时推送。

连接建立后先发一份全量状态快照，之后把总线上的 state / telemetry /
event / command 消息原样转发。前端断线时自己负责重连并重新拉取状态。
"""
from __future__ import annotations

import asyncio
import logging

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from ..bus import TOPIC_STATE, bus

log = logging.getLogger(__name__)
router = APIRouter()


class ConnectionManager:
    def __init__(self) -> None:
        self.active: set[WebSocket] = set()
        self._lock = asyncio.Lock()

    async def connect(self, ws: WebSocket) -> None:
        await ws.accept()
        async with self._lock:
            self.active.add(ws)
        log.info("WebSocket 已连接，当前 %d 个客户端", len(self.active))

    async def disconnect(self, ws: WebSocket) -> None:
        async with self._lock:
            self.active.discard(ws)
        log.info("WebSocket 断开，剩余 %d 个客户端", len(self.active))

    async def broadcast(self, topic: str, payload: dict) -> None:
        if not self.active:
            return
        message = {"topic": topic, "payload": payload}
        dead: list[WebSocket] = []
        for ws in list(self.active):
            try:
                await ws.send_json(message)
            except Exception:
                dead.append(ws)
        for ws in dead:
            await self.disconnect(ws)


manager = ConnectionManager()


def wire_bus() -> None:
    """把总线接到广播上。应用启动时调用一次。"""

    async def handler(topic: str, payload: dict) -> None:
        await manager.broadcast(topic, payload)

    bus.subscribe(handler)


@router.websocket("/ws")
async def websocket_endpoint(ws: WebSocket) -> None:
    await manager.connect(ws)
    try:
        # 首帧：全量快照，保证刷新后立刻有内容可显示
        await ws.send_json({
            "topic": TOPIC_STATE,
            "payload": ws.app.state.device.snapshot().as_dict(),
        })
        while True:
            # 前端可发 {"type":"ping"} 保活；不处理其它入站消息
            msg = await ws.receive_json()
            if isinstance(msg, dict) and msg.get("type") == "ping":
                await ws.send_json({"topic": "pong", "payload": {}})
    except WebSocketDisconnect:
        await manager.disconnect(ws)
    except Exception:
        log.debug("WebSocket 异常关闭", exc_info=True)
        await manager.disconnect(ws)
