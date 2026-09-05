"""FastAPI 应用入口。

启动：
    uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
"""
from __future__ import annotations

import logging
import mimetypes
from contextlib import asynccontextmanager
from pathlib import Path

# Windows 上 Python 的 mimetypes 会读注册表，.js 常被登记成 text/plain，
# 浏览器按 HTML 规范拒绝加载这种 MIME 的模块脚本，页面会白屏。这里强制纠正。
mimetypes.add_type("application/javascript", ".js")
mimetypes.add_type("application/javascript", ".mjs")
mimetypes.add_type("text/css", ".css")
mimetypes.add_type("image/svg+xml", ".svg")

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

from .api.routes import router as api_router
from .api.ws import router as ws_router, wire_bus
from .config import BASE_DIR, get_settings
from .db import get_setting, init_db, purge_old_telemetry, recorder
from .devices.base import DeviceService
from .devices.mock import MockDeviceService
from .devices.serial_svc import SerialDeviceService
from .llm.agent import LLMAgent

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-7s %(name)s: %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger("dorm")

FRONTEND_DIST = BASE_DIR.parent / "frontend" / "dist"


def build_device() -> DeviceService:
    s = get_settings()
    if s.device_mode == "serial":
        log.info("设备层：真实串口 %s @ %d（只读，固件暂无下行通道）", s.serial_port, s.serial_baud)
        return SerialDeviceService(s.serial_port, s.serial_baud)
    log.info("设备层：模拟模式")
    return MockDeviceService()


def restore_settings(device: DeviceService) -> None:
    """把上次保存的参数恢复到设备状态，满足"刷新后仍然保持"。"""
    for key, attr in (("temp_threshold", "temp_threshold"), ("near_threshold", "near_threshold")):
        raw = get_setting(key)
        if raw is None:
            continue
        try:
            setattr(device.state, attr, int(raw))
        except ValueError:
            log.warning("忽略非法的持久化参数 %s=%r", key, raw)


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    removed = purge_old_telemetry()
    if removed:
        log.info("清理过期遥测 %d 条", removed)

    device = build_device()
    restore_settings(device)
    agent = LLMAgent(device)

    app.state.device = device
    app.state.agent = agent

    recorder.start()
    wire_bus()
    await device.start()
    log.info("后台已启动，模式=%s，LLM=%s", device.mode,
             "已配置" if agent.enabled else "未配置")
    try:
        yield
    finally:
        await device.stop()
        recorder.stop()
        log.info("后台已停止")


settings = get_settings()
app = FastAPI(title="寝室管家 上位机", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)
app.include_router(ws_router)


@app.get("/api/health")
async def health():
    return {"ok": True, "mode": app.state.device.mode,
            "link": app.state.device.snapshot().link_connected}


# 生产模式：直接托管前端构建产物，手机访问 http://<PC 局域网 IP>:8000 即可
if FRONTEND_DIST.is_dir():
    app.mount("/assets", StaticFiles(directory=FRONTEND_DIST / "assets"), name="assets")

    @app.get("/{full_path:path}")
    async def spa(full_path: str):
        if full_path.startswith(("api", "ws")):
            return JSONResponse({"detail": {"code": "not_found", "message": "接口不存在"}},
                                status_code=404)
        index = FRONTEND_DIST / "index.html"
        if index.is_file():
            return FileResponse(index)
        return JSONResponse({"detail": {"code": "no_frontend",
                                        "message": "前端尚未构建，请先 npm run build"}},
                            status_code=404)
else:
    @app.get("/")
    async def root():
        return {
            "service": "寝室管家 上位机",
            "hint": "开发期请单独启动前端 (npm run dev)；"
                    "或先 npm run build 生成 frontend/dist 后由本服务托管",
            "api_docs": "/docs",
        }
