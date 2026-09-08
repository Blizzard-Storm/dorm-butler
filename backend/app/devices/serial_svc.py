"""真实串口设备层：PC <-USB-> NodeA。

当前固件的硬事实（已核对 NodeA_主控网关/source/main.c）：

  * 上行：SendReport() 每秒发一行 43 字节定长 ASCII 报文，见 protocol/report.py
  * 下行：NodeA 固件的 USE_PC_CMD 段已实现。PC 发 10 字节二进制命令帧
          （0xAA 帧头 + CRC16），NodeA 改 Cfg[] 并经由已有的 485 轮询状态机
          下发给从站，从站确认后回一行 ASCII 回执 ACK s=... r=...

下行同时覆盖 Cfg[] 参数（FUNC_SETCFG）和执行器命令（FUNC_ACT）。执行器命令
由 NodeA 转发给从站，只有收到从站 FUNC_ACT 应答后才向 PC 返回成功回执。

只有收到 result=0 的回执才标 confirmed；从站离线、未确认、参数越界
都各有对应状态，不会被含糊成"成功"。
"""
from __future__ import annotations

import asyncio
import logging
import threading
from datetime import timedelta

import serial
from serial.tools import list_ports

from ..config import get_settings
from ..bus import TOPIC_COMMAND, TOPIC_EVENT, TOPIC_STATE, TOPIC_TELEMETRY, bus
from ..protocol import frames as F
from ..protocol.report import Report, ReportParser
from .base import Capability, Command, CommandName, CommandStatus, DeviceService, now

log = logging.getLogger(__name__)

# 超过这个时间没收到合法报文就认为 NodeA 掉线（固件标称 1 秒一行）
NODE_A_TIMEOUT_S = 5.0
RECONNECT_INTERVAL_S = 2.0

# 串口开着、却一行合法报文都收不到，超过这个时间就如实说"板子没在往 USB 发数据"。
# 最常见的原因是烧了 NodeC——它只用 Uart2 走 485，压根不碰 USB 串口。
SILENT_PORT_S = 8.0

# 暂停（烧录）期间的自愈参数。
# 判据是【端口枚举】的消失与重现，而不是反复去试着打开端口：
# STC-ISP 烧录时独占 COM 口，我们要是去试开就会跟它抢，把烧录弄失败。
# 而 STC 的冷启动握手本来就要求拔掉 USB 再插上，这一拔一插会让 CH340
# 从设备列表里消失再出现——这是个不用碰端口就能观测到的可靠信号。
PAUSE_POLL_S = 1.0             # 多久看一眼端口枚举
PAUSE_REPLUG_SETTLE_S = 2.0    # 端口重新出现后先等一会，让 STC-ISP 先拿；它不要我们再拿
PAUSE_MAX_S = 900.0            # 兜底：无论如何不会永远停在暂停态


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

        # 下行：seq 分配、在途请求、写串口互斥
        self._seq = 0
        self._inflight: dict[int, dict] = {}
        self._write_lock = threading.Lock()
        self._command_lock = asyncio.Lock()

        # 手动暂停（例如烧录前）与串口异常断开是两回事：前者是操作者主动要求，
        # 页面不该把它当成故障去告警。只有 pause()/resume() 会改这个标志。
        self.paused = False
        self._pause_task: asyncio.Task | None = None
        self.pause_phase: str | None = None   # waiting_isp | burning | None

        # 连的到底是哪块板。报文本身没有身份字段，只能靠"这个固件会往 USB
        # 发什么"来认，所以这里记录判据，前端要能看到我们是"确认"还是"推测"。
        self.board_role: str | None = None        # "A" / "B" / "C" / None
        self.role_confidence = "unknown"          # unknown | probable | confirmed
        self.role_reason = ""
        self._counters_at_open: dict[str, int] = {}
        self._opened_at = None

        s = self.state
        s.mode = self.mode
        s.temp_threshold = F.DEF_TEMPSET
        s.near_threshold = F.DEF_NEARCM
        s.capabilities = {
            CommandName.SET_TEMP_THRESHOLD: Capability(True),
            CommandName.SET_SECURITY_MODE: Capability(True),
            CommandName.SET_NEAR_THRESHOLD: Capability(True),
            CommandName.SET_ALARM: Capability(True),
            CommandName.SYNC_TIME: Capability(True),
            CommandName.SET_FAN: Capability(True),
            CommandName.SILENCE_ALARM: Capability(True),
            CommandName.SET_WINDOW: Capability(True),
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

    async def pause(self, reason: str = "烧录") -> None:
        """主动放开串口，给 STC-ISP 之类需要独占端口的工具让路。

        Windows 上一个 COM 口同一时间只能被一个进程打开，这是操作系统的限制，
        不是 bug——之前的做法是整个杀掉后端进程，代价是前端也跟着掉线，
        烧完还要手动重启后端。这里只关掉串口本身，FastAPI 进程、WebSocket、
        前端页面全程不受影响，烧完调 resume() 就能自动接回来。
        """
        await self.stop()
        self.paused = True
        self.pause_phase = "waiting_isp"
        self._reset_role()
        self._invalidate_all_nodes()
        if self._pause_task is None or self._pause_task.done():
            self._pause_task = asyncio.create_task(self._pause_watch(), name="serial-pause-watch")
        await bus.publish(TOPIC_EVENT, _event(
            "link", "info", f"串口已暂停（{reason}），网页仍可正常使用；"
                            f"烧完拔插 USB 会自动恢复，也可以手动点恢复"))
        await self._push_state()

    async def resume(self) -> None:
        """从 pause() 恢复，重新打开串口并继续常规的读取与自动重连。"""
        if self._pause_task and not self._pause_task.done():
            self._pause_task.cancel()
        self._pause_task = None
        self.pause_phase = None
        self.paused = False
        self._reset_role()
        await self.start()
        await bus.publish(TOPIC_EVENT, _event("link", "info", "串口已恢复，正在重新连接"))
        await self._push_state()

    async def _pause_watch(self) -> None:
        """暂停期间盯着端口枚举，等板子烧完重新上电就自己接回来。

        全程不打开串口，因此不会跟 STC-ISP 抢端口。真正触发恢复的是
        "端口先从系统里消失、之后又出现"——也就是 STC 冷启动必须做的那次拔插。
        没等到也不会一直挂着：超过 PAUSE_MAX_S 就兜底恢复。
        """
        started = now()
        saw_gone = False
        try:
            while True:
                await asyncio.sleep(PAUSE_POLL_S)
                present = any(p["device"] == self.port for p in list_serial_ports())

                if not present:
                    if not saw_gone:
                        saw_gone = True
                        self.pause_phase = "burning"
                        await bus.publish(TOPIC_EVENT, _event(
                            "link", "info", f"{self.port} 已从系统移除（拔掉 USB），等待板子重新上电"))
                        await self._push_state()
                elif saw_gone:
                    # 板子插回来了。先让 STC-ISP 有机会拿住端口把最后一步做完，
                    # 我们晚一步再去开；开不了也没关系，读线程本来就会自动重试。
                    await asyncio.sleep(PAUSE_REPLUG_SETTLE_S)
                    await bus.publish(TOPIC_EVENT, _event(
                        "link", "info", f"检测到 {self.port} 重新上电，串口自动恢复"))
                    self._pause_task = None
                    await self.resume()
                    return

                if (now() - started).total_seconds() > PAUSE_MAX_S:
                    await bus.publish(TOPIC_EVENT, _event(
                        "link", "warning",
                        f"暂停已超过 {PAUSE_MAX_S / 60:.0f} 分钟，自动恢复串口以免一直停在暂停态"))
                    self._pause_task = None
                    await self.resume()
                    return
        except asyncio.CancelledError:
            pass

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
                    # 回执不走 feed 的返回值，单独取走交给在途请求匹配
                    while self.parser.acks:
                        self._post(self._on_ack, self.parser.acks.pop(0))
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
        self.state.link_detail = {"port": self.port, "baud": self.baud}
        # 端口刚打开时还不知道对面是哪块板，重新开始取证。
        self._reset_role()
        self._opened_at = now()
        await bus.publish(TOPIC_EVENT, _event("link", "info", f"串口 {self.port} 已连接"))
        await self._push_state()

    async def _on_open_failed(self, err: str) -> None:
        if self.state.link_connected:
            await bus.publish(TOPIC_EVENT, _event("link", "warning", f"串口打开失败：{err}"))
        self.state.link_connected = False
        self.state.link_detail = {"port": self.port, "baud": self.baud, "error": err}
        await self._push_state()

    async def _on_disconnect(self, err: str) -> None:
        self.state.link_connected = False
        self._reset_role()
        self._invalidate_all_nodes()
        await bus.publish(TOPIC_EVENT, _event("link", "warning", f"串口断开：{err}，正在重连"))
        await self._push_state()

    # ------------------------------------------------------------------ 板子身份识别

    def _reset_role(self) -> None:
        """换了板子/断了线，之前的取证一律作废，重新开始认。"""
        self.board_role = None
        self.role_confidence = "unknown"
        self.role_reason = ""
        self._opened_at = None
        p = self.parser
        self._counters_at_open = {
            "lines_ok": p.lines_ok, "cal_ok": p.cal_ok,
            "cfg_ok": p.cfg_ok, "status_ok": p.status_ok,
        }

    def _since_open(self, name: str) -> int:
        return getattr(self.parser, name) - self._counters_at_open.get(name, 0)

    def _update_role(self) -> bool:
        """靠"这个固件往 USB 发什么"来认板子，而不是假定它一定是 NodeA。

        返回判定是否发生了变化，调用方据此决定要不要播事件。

        三个固件的串口特征互不相同，已逐一核对过固件源码：
          NodeA 主控网关  报文 + CFG + STA（+ 下发时的 ACK）
          NodeB 环境节点  报文 + CAL，从不发 STA/CFG
          NodeC 安防节点  只用 Uart2 走 485，USB 上一个字节都不发
        所以 CAL 是 NodeB 的指纹，STA/CFG 是 NodeA 的指纹，而"端口打开着却
        长时间一行都收不到"基本就是 NodeC（也可能板子没跑起来或波特率不对，
        这两种可能必须一起说出来，不能咬定是 C）。
        """
        prev = (self.board_role, self.role_confidence)

        if self._since_open("cal_ok") > 0:
            self.board_role, self.role_confidence = "B", "confirmed"
            self.role_reason = "收到 CAL 标定行，只有 NodeB 固件会发"
        elif self._since_open("status_ok") > 0 or self._since_open("cfg_ok") > 0:
            self.board_role, self.role_confidence = "A", "confirmed"
            self.role_reason = "收到 STA/CFG 行，只有 NodeA 固件会发"
        elif self._since_open("lines_ok") > 0:
            # 只有主报文。NodeA 和 NodeB 都会发，还不能下结论，
            # 但 NodeA 每秒都有 STA，再等一两秒基本就能确认了。
            self.board_role, self.role_confidence = "A", "probable"
            self.role_reason = "收到主报文但还没等到 STA/CFG，暂按 NodeA 处理"
        elif (
            self.state.link_connected
            and self._opened_at is not None
            and (now() - self._opened_at).total_seconds() > SILENT_PORT_S
        ):
            self.board_role, self.role_confidence = "C", "probable"
            self.role_reason = (
                f"串口开着但 {SILENT_PORT_S:.0f} 秒内没收到任何数据。"
                "NodeC 固件只走 485 不发 USB，最可能是它；"
                "也可能是板子没运行或波特率不对")

        return prev != (self.board_role, self.role_confidence)

    def _invalidate_all_nodes(self) -> None:
        """作废链路断开后所有不再可信的实时状态。"""
        s = self.state
        s.node_a.online = s.node_b.online = s.node_c.online = False
        s.board_time = None
        s.temp_c = s.lux_level = s.lux_adc = s.temp_adc = s.fan_duty = None
        s.temp_saturated = False
        s.distance_cm = s.alarm_level = None
        s.distance_valid = False
        s.door_state = s.security_state = s.lock_state = None
        s.window_state = s.window_mode = s.fan_mode = None
        s.vib_count = s.door_count = None
        s.silenced = None
        s.near = s.temp_high = None
        s.main_loops = None
        s.master_reply_miss_b = s.master_reply_miss_c = None
        s.node_a.poll_miss = s.node_b.poll_miss = s.node_c.poll_miss = None

    async def _on_report(self, r: Report) -> None:
        s = self.state
        prev_b, prev_c = s.node_b.online, s.node_c.online
        prev_alarm = s.alarm_level
        prev_crc = s.crc_errors
        prev_door = s.door_state
        prev_security = s.security_state
        prev_window = s.window_state
        prev_lock = s.lock_state

        s.ts = r.received_at
        s.last_frame_at = r.received_at
        s.board_time = r.board_time
        s.link_connected = True
        s.frames_ok = self.parser.lines_ok
        s.frames_bad = self.parser.lines_bad

        self._update_role()

        if self.board_role == "B":
            # 直连的是 NodeB 自己，不是网关。它报的 O 位是它对总线的看法，
            # 而此刻根本没有 NodeA 在轮询，所以只能确认"B 自己活着"。
            s.node_a.online = False
            s.node_a.last_seen = None
            s.node_b.online = True
            s.node_b.last_seen = r.received_at
            s.node_c.online = False
        else:
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
        # 设备回报的真实参数优先于 PC 侧的记账 ——
        # 用户拿摇杆在板子上改过，网页也要跟着变。
        bc = self.parser.last_cfg
        if bc is not None:
            s.temp_threshold = bc.temp_threshold
            s.near_threshold = bc.near_threshold
            s.alarm_hour, s.alarm_minute = bc.alarm_hour, bc.alarm_minute

        cal = self.parser.last_cal
        if cal is not None and r.node_b_online:
            s.lux_adc = cal.raw_rop
            s.temp_adc = cal.raw_rt
        else:
            s.lux_adc = None
            s.temp_adc = None

        # STA 旁路报文与主报文分开发送。只接受 3 秒内的新状态，
        # 否则置未知，避免把断线前的值当成当前状态。
        st = self.parser.last_status
        status_fresh = st is not None and abs((r.received_at - st.received_at).total_seconds()) <= 3.0
        if status_fresh:
            s.main_loops = st.master_main_loops
            s.node_a.poll_miss = st.master_poll_miss
            s.master_reply_miss_b = st.reply_miss_b
            s.master_reply_miss_c = st.reply_miss_c

            if r.node_b_online:
                s.node_b.poll_miss = st.env_poll_miss
                s.window_state = "open" if st.env_flags & F.ENVF_WIN_OPEN else "closed"
                s.fan_mode = "manual" if st.env_flags & F.ENVF_FAN_MANUAL else "auto"
                s.window_mode = "manual" if st.env_flags & F.ENVF_WIN_MANUAL else "auto"
                s.temp_high = bool(st.env_flags & F.ENVF_TEMP_HI)
            else:
                s.node_b.poll_miss = None
                s.window_state = None
                s.window_mode = None
                s.fan_mode = None

            if r.node_c_online:
                s.node_c.poll_miss = st.sec_poll_miss
                s.door_state = "open" if st.sec_flags & F.SECF_DOOR_OPEN else "closed"
                s.security_state = F.SECST_NAMES.get(st.sec_state)
                s.lock_state = "locked" if st.sec_flags & F.SECF_LOCKED else "unlocked"
                s.vib_count = st.vib_count
                s.door_count = st.door_count
                s.near = bool(st.sec_flags & F.SECF_NEAR)
                s.silenced = bool(st.sec_flags & F.SECF_SILENCED)
            else:
                s.node_c.poll_miss = None
                s.door_state = s.security_state = s.lock_state = None
                s.vib_count = s.door_count = None
                s.near = None
                s.silenced = None
        else:
            s.main_loops = None
            s.master_reply_miss_b = s.master_reply_miss_c = None
            s.node_a.poll_miss = s.node_b.poll_miss = s.node_c.poll_miss = None
            s.door_state = s.security_state = s.lock_state = None
            s.window_state = None
            s.window_mode = None
            s.fan_mode = None
            s.vib_count = s.door_count = None
            s.silenced = None

        self._last_report = r

        if prev_b != r.node_b_online:
            await bus.publish(TOPIC_EVENT, _event(
                "node", "info" if r.node_b_online else "warning",
                f"节点B {'上线' if r.node_b_online else '离线'}", node="B"))
        if prev_c != r.node_c_online:
            await bus.publish(TOPIC_EVENT, _event(
                "node", "info" if r.node_c_online else "warning",
                f"节点C {'上线' if r.node_c_online else '离线'}", node="C"))
        if (status_fresh and s.door_state is not None
                and prev_door is not None and prev_door != s.door_state):
            await bus.publish(TOPIC_EVENT, _event(
                "security", "warning" if s.door_state == "open" else "info",
                "门磁检测到开门" if s.door_state == "open" else "门磁检测到关门", node="C"))
        if (status_fresh and s.security_state is not None
                and prev_security is not None and prev_security != s.security_state):
            await bus.publish(TOPIC_EVENT, _event(
                "security", "warning" if s.security_state == "alarm" else "info",
                f"安防状态变为 {s.security_state}", node="C"))
        if (status_fresh and s.window_state is not None
                and prev_window is not None and prev_window != s.window_state):
            await bus.publish(TOPIC_EVENT, _event(
                "window", "info", f"通风窗软件状态变为 {s.window_state}", node="B"))
        if (status_fresh and s.lock_state is not None
                and prev_lock is not None and prev_lock != s.lock_state):
            await bus.publish(TOPIC_EVENT, _event(
                "lock", "info", f"锁舌软件状态变为 {s.lock_state}", node="C"))
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

            # 端口开着却一直没数据，也是一种要如实说出来的状态（多半是 NodeC）
            if self._update_role():
                await bus.publish(TOPIC_EVENT, _event(
                    "link", "info" if self.role_confidence == "confirmed" else "warning",
                    f"识别到板子固件：{_role_label(self.board_role)}（{self.role_reason}）"))
                await self._push_state()

            stale = (
                s.last_frame_at is None
                or (now() - s.last_frame_at) > timedelta(seconds=NODE_A_TIMEOUT_S)
            )
            if stale and s.node_a.online:
                self._invalidate_all_nodes()
                await bus.publish(TOPIC_EVENT, _event(
                    "node", "warning", f"NodeA 超过 {NODE_A_TIMEOUT_S:.0f} 秒无上报，判为离线", node="A"))
                await self._push_state()

    async def _push_state(self) -> None:
        self.state.link_detail = {
            "port": self.port,
            "baud": self.baud,
            "readonly": False,
            "paused": self.paused,
            "pause_phase": self.pause_phase,
            "board_role": self.board_role,
            "board_role_confidence": self.role_confidence,
            "board_role_reason": self.role_reason,
            "inflight": len(self._inflight),
            "acks": self.parser.ack_ok,
            "frames_ok": self.parser.lines_ok,
            "frames_bad": self.parser.lines_bad,
            "cal_lines": self.parser.cal_ok,
            "cfg_lines": self.parser.cfg_ok,
            "status_lines": self.parser.status_ok,
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
            "door_state": s.door_state,
            "security_state": s.security_state,
            "alarm_level": s.alarm_level,
            "fan_duty": s.fan_duty,
            "window_state": s.window_state,
            "window_mode": s.window_mode,
            "lock_state": s.lock_state,
            "silenced": s.silenced,
            "node_a_online": s.node_a.online,
            "node_b_online": s.node_b.online,
            "node_c_online": s.node_c.online,
            "crc_errors": s.crc_errors,
        }

    # ------------------------------------------------------------------ 下行命令

    async def _on_ack(self, ack) -> None:
        """收到一条回执，匹配在途请求。

        seq 对不上的一律丢弃 —— 那是上一次请求迟到的回执，
        绝不能拿它当作这一次的结果。
        """
        entry = self._inflight.get(ack.seq)
        if entry is None:
            log.debug("丢弃无主回执 seq=%d（迟到或已超时）", ack.seq)
            return
        entry["ack"] = ack
        entry["event"].set()

    def _next_seq(self) -> int:
        """1~255 循环，跳过 0（固件用 0 表示空闲）。"""
        self._seq = self._seq % 255 + 1
        return self._seq

    def _write(self, data: bytes) -> bool:
        ser = self._serial
        if ser is None or not ser.is_open:
            return False
        try:
            with self._write_lock:
                ser.write(data)
            return True
        except (serial.SerialException, OSError) as exc:
            log.warning("串口写入失败: %s", exc)
            return False

    async def submit(self, name: str, params: dict, source: str = "user") -> Command:
        target_node, plan = _plan_command(name, params)
        cmd = Command(name=name, params=params, source=source, target_node=target_node)
        self.commands[cmd.id] = cmd

        if plan is None:
            cap = self.state.capabilities.get(name)
            cmd.status = CommandStatus.UNSUPPORTED
            cmd.error = cap.reason if cap else "固件不支持该命令"
            cmd.settled_at = now()
            await bus.publish(TOPIC_COMMAND, cmd.as_dict())
            return cmd

        await bus.publish(TOPIC_COMMAND, cmd.as_dict())
        asyncio.create_task(self._deliver(cmd, plan))
        return cmd

    async def _deliver(self, cmd: Command, steps: list[tuple]) -> None:
        """下发一条命令，等回执，超时重试。

        一条上层命令可能对应多个参数（闹钟要分别下发时和分），
        全部确认才算成功；任何一步失败，整条命令就是失败。

        铁律：只有收到 result=0 的回执才算 confirmed。
        写进串口成功不等于设备执行了。
        """
        async with self._command_lock:
            for step in steps:
                ok = await self._deliver_one(cmd, step)
                if not ok:
                    return
            await self._settle(cmd, CommandStatus.CONFIRMED, None)

    async def _deliver_one(self, cmd: Command, step: tuple) -> bool:
        """下发一帧。step = (功能码, arg0, arg1, arg2)。

        成功返回 True；失败时已经 settle 过，返回 False。
        """
        func, a0, a1, a2 = step
        settings = get_settings()
        attempts = settings.command_retries + 1

        for _ in range(attempts):
            seq = self._next_seq()
            entry = {"event": asyncio.Event(), "ack": None}
            self._inflight[seq] = entry
            try:
                frame = F.build_pc_command(seq, F.ADDR_MASTER, a0, a1, func=func, arg2=a2)
                if not self._write(frame):
                    cmd.attempts += 1
                    await self._settle(cmd, CommandStatus.FAILED, "串口未连接，命令未发出")
                    return False

                cmd.attempts += 1
                cmd.status = CommandStatus.SENT
                cmd.sent_at = now()
                await bus.publish(TOPIC_COMMAND, cmd.as_dict())

                try:
                    await asyncio.wait_for(entry["event"].wait(), settings.command_timeout_s)
                except asyncio.TimeoutError:
                    continue                      # 这一次没回，换个 seq 重发
            finally:
                self._inflight.pop(seq, None)

            ack = entry["ack"]
            if ack.result == F.ACK_OK:
                return True                   # 这一步成了，交给调用方决定还有没有下一步
            if ack.result == F.ACK_OFFLINE:
                # 参数已被 NodeA 收下并标记待下发，但从站没确认过，
                # 不能算执行成功。前端会显示失败原因，用户知道该去看节点在线状态。
                await self._settle(cmd, CommandStatus.FAILED,
                                   F.ACK_TEXT[F.ACK_OFFLINE])
            elif ack.result == F.ACK_NOREPLY:
                await self._settle(cmd, CommandStatus.TIMEOUT, F.ACK_TEXT[F.ACK_NOREPLY])
            else:
                detail = f"（detail={ack.detail}）" if ack.detail else ""
                await self._settle(cmd, CommandStatus.FAILED,
                                   F.ACK_TEXT.get(ack.result, f"未知结果码 {ack.result}") + detail)
            return False

        await self._settle(cmd, CommandStatus.TIMEOUT,
                           f"重试 {attempts} 次仍未收到回执")
        return False

    def _apply_to_state(self, cmd: Command) -> None:
        """命令确认后把参数同步进本地状态。

        只在 confirmed 时调用 —— 失败或未确认的值不能进状态，
        否则页面上的"当前值"就变成了"上一次请求的值"。
        """
        p = cmd.params
        s = self.state
        if cmd.name == CommandName.SET_TEMP_THRESHOLD:
            s.temp_threshold = int(p["celsius"])
        elif cmd.name == CommandName.SET_NEAR_THRESHOLD:
            s.near_threshold = int(p["cm"])
        elif cmd.name == CommandName.SET_ALARM:
            s.alarm_hour, s.alarm_minute = int(p["hour"]), int(p["minute"])
        elif cmd.name == CommandName.SET_FAN:
            s.fan_mode = str(p["mode"])
        elif cmd.name == CommandName.SET_WINDOW:
            s.window_mode = "auto" if p["state"] == "auto" else "manual"
        elif cmd.name == CommandName.SILENCE_ALARM:
            s.silenced = True

    async def _settle(self, cmd: Command, status: CommandStatus, error: str | None) -> None:
        cmd.status = status
        cmd.error = error
        cmd.settled_at = now()
        if status is CommandStatus.CONFIRMED:
            self._apply_to_state(cmd)
            await self._push_state()
        await bus.publish(TOPIC_COMMAND, cmd.as_dict())
        if status is not CommandStatus.CONFIRMED:
            await bus.publish(TOPIC_EVENT, _event(
                "command", "warning", f"命令 {cmd.name} 未成功：{error}"))


def _plan_command(name: str, params: dict) -> tuple[str, list[tuple] | None]:
    """把上层命令翻译成 (目标节点, [PC 命令帧参数, ...])。

    返回 None 表示当前固件没有这条下发通路 —— 那就如实标 unsupported，
    绝不假装成功。
    """
    def cfg(index: int, value: int) -> tuple:
        return (F.FUNC_SETCFG, index, value, 0)

    def act(slave: int, value: int) -> tuple:
        return (F.FUNC_ACT, slave, value, 0)

    if name == CommandName.SET_FAN:
        value = F.ACT_ENV_FAN_AUTO if params.get("mode") == "auto" else int(params["duty_percent"])
        return "B", [act(0, value)]
    if name == CommandName.SET_WINDOW:
        values = {"close": F.ACT_ENV_WIN_CLOSE, "open": F.ACT_ENV_WIN_OPEN,
                  "auto": F.ACT_ENV_WIN_AUTO}
        return "B", [act(0, values[str(params["state"])])]
    if name == CommandName.SILENCE_ALARM:
        return "C", [act(1, F.ACT_SEC_SILENCE)]

    if name == CommandName.SET_TEMP_THRESHOLD:
        return "B", [cfg(F.CFG_TEMPSET, int(params["celsius"]))]
    if name == CommandName.SET_SECURITY_MODE:
        return "C", [cfg(F.CFG_ARM, 1 if params.get("mode") == "arm" else 0)]
    if name == CommandName.SET_NEAR_THRESHOLD:
        return "C", [cfg(F.CFG_NEARCM, int(params["cm"]))]
    if name == CommandName.SYNC_TIME:
        # 对时只改时分秒，日期不动 —— 本工程没有任何逻辑用到年月日
        return "A", [(F.FUNC_PC_SETTIME, int(params["hour"]),
                      int(params["minute"]), int(params["second"]))]
    if name == CommandName.SET_ALARM:
        # 闹钟是 NodeA 本机参数（CfgTab 里 WHO=2），不经过 485，
        # 所以不受从站在不在线影响，会真正返回"已确认"。时和分要分两帧下发。
        return "A", [cfg(F.CFG_ALMH, int(params["hour"])),
                     cfg(F.CFG_ALMM, int(params["minute"]))]
    return "-", None


ROLE_LABELS = {
    "A": "NodeA 主控网关",
    "B": "NodeB 环境节点",
    "C": "NodeC 安防节点",
}


def _role_label(role: str | None) -> str:
    return ROLE_LABELS.get(role or "", "未知")


def _event(kind: str, level: str, message: str, node: str = "-") -> dict:
    return {
        "ts": now().isoformat(),
        "kind": kind,
        "level": level,
        "message": message,
        "node": node,
    }
