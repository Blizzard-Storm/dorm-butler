"""真实串口设备层：PC <-USB-> NodeA。

当前固件的硬事实（已核对 NodeA_主控网关/source/main.c）：

  * 上行：SendReport() 每秒发一行 43 字节定长 ASCII 报文，见 protocol/report.py
  * 下行：**不存在**。整个 main.c 里没有 SetUart1Rxd()，也没有注册
          enumEventUart1Rxd 回调，NodeA 根本不读串口。

所以本类是只读的。任何控制命令都会立刻返回 UNSUPPORTED 并说明原因，
而不是写进串口然后假装成功 —— 把"成功写入串口"当作"设备已执行"正是
交接文档明令禁止的行为。

要打通下行，需要按 docs/NodeA串口协议补充设计.md 修改固件；那份文档里
的帧格式、请求编号与回执规则，本文件的 _handle_binary_frame() 已经预留
好了对接位置。
"""
from __future__ import annotations

import asyncio
import logging
import threading
from datetime import timedelta

import serial
from serial.tools import list_ports

from ..bus import TOPIC_COMMAND, TOPIC_EVENT, TOPIC_STATE, TOPIC_TELEMETRY, bus
from ..protocol import frames as F
from ..protocol.report import Report, ReportParser
from .base import Capability, Command, CommandName, CommandStatus, DeviceService, now

log = logging.getLogger(__name__)

# 超过这个时间没收到合法报文就认为 NodeA 掉线（固件标称 1 秒一行）
NODE_A_TIMEOUT_S = 5.0
RECONNECT_INTERVAL_S = 2.0

NO_DOWNLINK_REASON = (
    "当前 NodeA 固件没有串口下行通道（main.c 中无 SetUart1Rxd 调用），"
    "PC 只能只读监控。需按 docs/NodeA串口协议补充设计.md 升级固件后才能远程控制。"
)


def list_serial_ports() -> list[dict]:
    return [
        {"device": p.device, "description": p.description, "hwid": p.hwid}
        for p in list_ports.comports()
    ]


class SerialDeviceService(DeviceService):
    mode = "serial"

    def __init__(self, port: str, baud: int = 9600) -> None:
        super().__init__()
        self.port = port
        self.baud = baud
        self.parser = ReportParser()

        self._serial: serial.Serial | None = None
        self._reader: threading.Thread | None = None
        self._stop = threading.Event()
        self._loop: asyncio.AbstractEventLoop | None = None
        self._watchdog: asyncio.Task | None = None
        self._last_report: Report | None = None

        s = self.state
        s.mode = self.mode
        s.temp_threshold = F.DEF_TEMPSET
        s.near_threshold = F.DEF_NEARCM
        # 只读模式：全部控制能力标记为不可用，前端据此置灰
        s.capabilities = {
            name: Capability(False, NO_DOWNLINK_REASON)
            for name in (
                CommandName.SET_FAN,
                CommandName.SET_TEMP_THRESHOLD,
                CommandName.SET_SECURITY_MODE,
                CommandName.SILENCE_ALARM,
                CommandName.SET_NEAR_THRESHOLD,
                CommandName.SET_WINDOW,
            )
        }

    # ------------------------------------------------------------------ 生命周期

    async def start(self) -> None:
        self._loop = asyncio.get_running_loop()
        self._stop.clear()
        self._reader = threading.Thread(target=self._reader_thread, daemon=True,
                                        name="serial-reader")
        self._reader.start()
        self._watchdog = asyncio.create_task(self._watchdog_loop(), name="serial-watchdog")

    async def stop(self) -> None:
        self._stop.set()
        if self._watchdog:
            self._watchdog.cancel()
            try:
                await self._watchdog
            except asyncio.CancelledError:
                pass
        if self._reader:
            self._reader.join(timeout=2.0)
        if self._serial and self._serial.is_open:
            self._serial.close()
        self.state.link_connected = False

    # ------------------------------------------------------------------ 串口读取线程

    def _reader_thread(self) -> None:
        """阻塞读串口。断开后自动重连，绝不让异常终止线程。"""
        while not self._stop.is_set():
            if self._serial is None or not self._serial.is_open:
                if not self._try_open():
                    self._stop.wait(RECONNECT_INTERVAL_S)
                    continue
            try:
                chunk = self._serial.read(self._serial.in_waiting or 1)
                if chunk:
                    for report in self.parser.feed(chunk):
                        self._post(self._on_report, report)
            except (serial.SerialException, OSError) as exc:
                log.warning("串口读取失败，准备重连: %s", exc)
                self._close_port()
                self._post(self._on_disconnect, str(exc))
                self._stop.wait(RECONNECT_INTERVAL_S)

    def _try_open(self) -> bool:
        try:
            self._serial = serial.Serial(self.port, self.baud, timeout=0.2)
            log.info("串口已打开 %s @ %d", self.port, self.baud)
            self._post(self._on_connect)
            return True
        except (serial.SerialException, OSError) as exc:
            self._serial = None
            self._post(self._on_open_failed, str(exc))
            return False

    def _close_port(self) -> None:
        try:
            if self._serial and self._serial.is_open:
                self._serial.close()
        except Exception:
            pass
        self._serial = None

    def _post(self, fn, *args) -> None:
        """把读线程里的结果安全地扔回事件循环。"""
        if self._loop and not self._loop.is_closed():
            self._loop.call_soon_threadsafe(lambda: asyncio.create_task(fn(*args)))

    # ------------------------------------------------------------------ 事件处理

    async def _on_connect(self) -> None:
        self.state.link_connected = True
        self.state.link_detail = {"port": self.port, "baud": self.baud, "readonly": True}
        await bus.publish(TOPIC_EVENT, _event("link", "info", f"串口 {self.port} 已连接"))
        await self._push_state()

    async def _on_open_failed(self, err: str) -> None:
        if self.state.link_connected:
            await bus.publish(TOPIC_EVENT, _event("link", "warning", f"串口打开失败：{err}"))
        self.state.link_connected = False
        self.state.link_detail = {"port": self.port, "baud": self.baud,
                                  "readonly": True, "error": err}
        await self._push_state()

    async def _on_disconnect(self, err: str) -> None:
        self.state.link_connected = False
        self.state.node_a.online = False
        self.state.node_b.online = False
        self.state.node_c.online = False
        await bus.publish(TOPIC_EVENT, _event("link", "warning", f"串口断开：{err}，正在重连"))
        await self._push_state()

    async def _on_report(self, r: Report) -> None:
        s = self.state
        prev_b, prev_c = s.node_b.online, s.node_c.online
        prev_alarm = s.alarm_level
        prev_crc = s.crc_errors

        s.ts = r.received_at
        s.last_frame_at = r.received_at
        s.board_time = r.board_time
        s.link_connected = True
        s.frames_ok = self.parser.lines_ok
        s.frames_bad = self.parser.lines_bad

        s.node_a.online = True
        s.node_a.last_seen = r.received_at
        s.node_b.online = r.node_b_online
        s.node_c.online = r.node_c_online
        if r.node_b_online:
            s.node_b.last_seen = r.received_at
        if r.node_c_online:
            s.node_c.last_seen = r.received_at

        s.temp_c = r.temp_c
        s.temp_saturated = r.temp_saturated
        s.temp_high = (r.temp_c >= s.temp_threshold) if r.temp_c is not None else None
        s.lux_level = r.lux_level
        s.fan_duty = r.fan_duty
        s.distance_cm = r.distance_cm
        s.distance_valid = r.distance_valid
        s.alarm_level = r.alarm_level
        s.near = (r.distance_cm <= s.near_threshold) if r.distance_cm is not None else None
        s.crc_errors = r.crc_errors

        # 标定行（CAL）带来的原始 ADC。只有 NodeB 直连模式才有；
        # 经 NodeA 汇总时报文里没有这两个值，保持 None。
        cal = self.parser.last_cal
        if cal is not None and r.node_b_online:
            s.lux_adc = cal.raw_rop
            s.temp_adc = cal.raw_rt
        else:
            s.lux_adc = None
            s.temp_adc = None

        # 文本报文里没有这些字段，必须保持未知，不能编
        s.door_state = None
        s.security_state = None
        s.lock_state = None
        s.window_state = None
        s.vib_count = None
        s.door_count = None

        self._last_report = r

        if prev_b != r.node_b_online:
            await bus.publish(TOPIC_EVENT, _event(
                "node", "info" if r.node_b_online else "warning",
                f"节点B {'上线' if r.node_b_online else '离线'}", node="B"))
        if prev_c != r.node_c_online:
            await bus.publish(TOPIC_EVENT, _event(
                "node", "info" if r.node_c_online else "warning",
                f"节点C {'上线' if r.node_c_online else '离线'}", node="C"))
        if r.alarm_level is not None and prev_alarm != r.alarm_level:
            if r.alarm_level >= F.ALM_ALARM:
                await bus.publish(TOPIC_EVENT, _event("security", "alarm", "安防报警触发", node="C"))
            elif r.alarm_level == F.ALM_NOTICE:
                await bus.publish(TOPIC_EVENT, _event("security", "warning", "安防提示", node="C"))
            elif prev_alarm:
                await bus.publish(TOPIC_EVENT, _event("security", "info", "报警解除", node="C"))
        if r.crc_errors > prev_crc:
            await bus.publish(TOPIC_EVENT, _event(
                "bus", "warning",
                f"485 总线 CRC 错误累计增加到 {r.crc_errors}"))

        await self._push_state()
        await bus.publish(TOPIC_TELEMETRY, self._telemetry())

    async def _watchdog_loop(self) -> None:
        """NodeA 超时未上报就把它标成离线，页面不能停在旧数据上。"""
        while True:
            await asyncio.sleep(1.0)
            s = self.state
            stale = (
                s.last_frame_at is None
                or (now() - s.last_frame_at) > timedelta(seconds=NODE_A_TIMEOUT_S)
            )
            if stale and s.node_a.online:
                s.node_a.online = False
                s.node_b.online = False
                s.node_c.online = False
                s.temp_c = s.lux_level = s.fan_duty = None
                s.distance_cm = s.alarm_level = None
                s.distance_valid = False
                await bus.publish(TOPIC_EVENT, _event(
                    "node", "warning", f"NodeA 超过 {NODE_A_TIMEOUT_S:.0f} 秒无上报，判为离线", node="A"))
                await self._push_state()

    async def _push_state(self) -> None:
        self.state.link_detail = {
            "port": self.port,
            "baud": self.baud,
            "readonly": True,
            "readonly_reason": NO_DOWNLINK_REASON,
            "frames_ok": self.parser.lines_ok,
            "frames_bad": self.parser.lines_bad,
            "cal_lines": self.parser.cal_ok,
            "bytes_dropped": self.parser.bytes_dropped,
            "last_bad_line": self.parser.last_bad_line,
        }
        await bus.publish(TOPIC_STATE, self.state.as_dict())

    def _telemetry(self) -> dict:
        s = self.state
        return {
            "ts": s.ts.isoformat(),
            "temp_c": s.temp_c,
            "lux_level": s.lux_level,
            "lux_adc": s.lux_adc,
            "temp_adc": s.temp_adc,
            "distance_cm": s.distance_cm,
            "distance_valid": s.distance_valid,
            "door_state": None,
            "security_state": None,
            "alarm_level": s.alarm_level,
            "fan_duty": s.fan_duty,
            "window_state": None,
            "lock_state": None,
            "node_a_online": s.node_a.online,
            "node_b_online": s.node_b.online,
            "node_c_online": s.node_c.online,
            "crc_errors": s.crc_errors,
        }

    # ------------------------------------------------------------------ 命令：当前一律不支持

    async def submit(self, name: str, params: dict, source: str = "user") -> Command:
        cmd = Command(name=name, params=params, source=source, target_node="-")
        cmd.status = CommandStatus.UNSUPPORTED
        cmd.error = NO_DOWNLINK_REASON
        cmd.settled_at = now()
        self.commands[cmd.id] = cmd
        await bus.publish(TOPIC_COMMAND, cmd.as_dict())
        return cmd


def _event(kind: str, level: str, message: str, node: str = "-") -> dict:
    return {
        "ts": now().isoformat(),
        "kind": kind,
        "level": level,
        "message": message,
        "node": node,
    }
