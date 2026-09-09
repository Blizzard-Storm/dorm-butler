"""模拟设备层。

目的不是画随机数，而是把三块板的真实控制律搬到 PC 上跑，这样：
  * 硬件不在手边时，页面、数据库、告警、AI 全链路都能开发和演示；
  * 接上真串口后，前端看到的字段和状态机语义完全一致。

复刻的控制律（与固件一一对应）：
  * 风扇  NodeB UpdateFan()   —— 30% 起转，每超 1℃ 加 7%，上限 100%，1℃ 回差
  * 通风窗 NodeB UpdateWindow() —— 超阈值 +3℃ 开，低于阈值 -1℃ 关
  * 布防  NodeC 状态机        —— 撤防 / 3 秒退出延时 / 已布防 / 报警
  * 振动  NodeC myVib_callback() —— 2 秒窗口内累计 3 次才报警
"""
from __future__ import annotations

import asyncio
import math
import random
from datetime import datetime, timezone

from ..bus import TOPIC_COMMAND, TOPIC_EVENT, TOPIC_STATE, TOPIC_TELEMETRY, bus
from ..protocol import frames as F
from .base import (
    Capability,
    Command,
    CommandName,
    CommandStatus,
    DeviceService,
    now,
)

# NodeC 的常量
ARM_DELAY_S = 3
VIB_WINDOW_S = 2
VIB_THRESHOLD = 3


class MockDeviceService(DeviceService):
    mode = "mock"

    def __init__(self) -> None:
        super().__init__()
        self._task: asyncio.Task | None = None
        self._tick = 0

        # 物理模拟量
        self._ambient = 26.0        # 环境基准温度
        self._temp = 26.0
        self._lux_phase = 0.0
        self._distance = 180
        self._person_near_until = 0

        # 执行器
        self._fan_duty = 0
        self._fan_manual: int | None = None
        self._window_open = False
        self._window_manual = False

        # 安防
        self._sec_state = F.SECST_DISARMED
        self._arm_countdown = 0
        self._alarm_level = F.ALM_NONE
        self._alarm_by_door = False
        self._silenced = False
        self._door_open = False
        self._locked = False
        self._vib_in_window = 0
        self._vib_window_tick = 0
        self._vib_count = 0
        self._door_count = 0

        # 故障注入（诊断页可开关，默认关闭，保证演示可复现）
        self.fault_command_fail_rate = 0.0
        self.fault_node_b_offline = False
        self.fault_node_c_offline = False

        s = self.state
        s.mode = self.mode
        s.temp_threshold = F.DEF_TEMPSET
        s.near_threshold = F.DEF_NEARCM
        s.capabilities = {
            CommandName.SET_FAN: Capability(True),
            CommandName.SET_TEMP_THRESHOLD: Capability(True),
            CommandName.SET_SECURITY_MODE: Capability(True),
            CommandName.SILENCE_ALARM: Capability(True),
            CommandName.SET_NEAR_THRESHOLD: Capability(True),
            CommandName.SET_ALARM: Capability(True),
            CommandName.SYNC_TIME: Capability(True),
            CommandName.SET_WINDOW: Capability(True),
        }

    # ------------------------------------------------------------------ 生命周期

    async def start(self) -> None:
        self.state.link_connected = True
        self.state.link_detail = {"simulated": True}
        self.state.node_a.online = True
        self._task = asyncio.create_task(self._loop(), name="mock-device")

    async def stop(self) -> None:
        if self._task:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
            self._task = None
        self.state.link_connected = False

    # ------------------------------------------------------------------ 主循环

    async def _loop(self) -> None:
        while True:
            try:
                self._tick += 1
                self._step_physics()
                self._step_fan()
                self._step_window()
                self._step_security()
                self._publish_state()
                await bus.publish(TOPIC_TELEMETRY, self._telemetry())
            except asyncio.CancelledError:
                raise
            except Exception:
                import logging

                logging.getLogger(__name__).exception("模拟循环异常")
            await asyncio.sleep(1.0)

    def _step_physics(self) -> None:
        # 温度：环境基准 + 缓慢正弦 + 噪声 - 风扇降温效果，形成真实闭环
        drift = 1.6 * math.sin(self._tick / 220.0)
        noise = random.uniform(-0.06, 0.06)
        cooling = self._fan_duty / 100.0 * 2.4
        target = self._ambient + drift - cooling + (0.7 if self._window_open else 0.0) * -1
        self._temp += (target - self._temp) * 0.18 + noise
        self._temp = max(-10.0, min(60.0, self._temp))

        # 光照：一个缓慢的昼夜周期
        self._lux_phase += 0.006

        # 距离：平时空旷，偶尔有人靠近
        if self._tick >= self._person_near_until and random.random() < 0.03:
            self._person_near_until = self._tick + random.randint(4, 10)
        if self._tick < self._person_near_until:
            self._distance = max(15, self._distance - random.randint(15, 40))
        else:
            self._distance = min(320, self._distance + random.randint(10, 30))

    def _lux_level(self) -> int:
        v = (math.sin(self._lux_phase) + 1) / 2  # 0..1
        return max(0, min(4, int(v * 5)))

    def _step_fan(self) -> None:
        """复刻 NodeB UpdateFan()。"""
        if self._fan_manual is not None and self._fan_manual <= 100:
            duty = self._fan_manual
        else:
            over = self._temp - self.state.temp_threshold
            if self._fan_duty == 0:
                duty = 30 if over >= 0 else 0            # 未转：到阈值才起转
            else:
                duty = 30 if over >= -1.0 else 0         # 已转：低 1℃ 才停（回差）
            if duty and over > 0:
                duty = min(100, 30 + min(70, int(over * 7)))
        self._fan_duty = duty

    def _step_window(self) -> None:
        """复刻 NodeB UpdateWindow()。"""
        if self._window_manual:
            return
        over = self._temp - self.state.temp_threshold
        if not self._window_open and over >= 3.0:
            self._window_open = True
            self._emit_event("window", "info", "温度超阈值 3℃，通风窗打开")
        elif self._window_open and over <= -1.0:
            self._window_open = False
            self._emit_event("window", "info", "温度回落，通风窗关闭")

    def _step_security(self) -> None:
        """复刻 NodeC 的布防状态机与振动窗口。"""
        self._vib_window_tick += 1
        if self._vib_window_tick >= VIB_WINDOW_S:
            self._vib_window_tick = 0
            self._vib_in_window = 0

        if self._sec_state == F.SECST_ARMING:
            self._arm_countdown = max(0, self._arm_countdown - 1)
            if self._arm_countdown == 0:
                self._enter_state(F.SECST_ARMED)

        self._step_door_alarm()

        # 复刻 NodeC my100mS_callback：已布防 + 有人贴在门口 -> 一级提示（等级 1）。
        # 等级只在 ARMED 里跟着“有人靠近”走，ALARM 是二级，不能被它降回一级；
        # 事件文案与 serial_svc 处理真实硬件时保持一致，两条链路演示效果相同。
        if self._sec_state == F.SECST_ARMED:
            near = (F.DIST_MIN <= self._distance <= F.DIST_MAX
                    and self._distance <= self.state.near_threshold)
            level = F.ALM_NOTICE if near else F.ALM_NONE
            if level != self._alarm_level:
                self._alarm_level = level
                if level == F.ALM_NOTICE:
                    self._emit_event("security", "warning", "安防提示")
                else:
                    self._emit_event("security", "info", "报警解除")

    def _step_door_alarm(self) -> None:
        """复刻 NodeC UpdateDoorAlarm()：布防下报警跟着门控位的电平走。

        门开就报警、门关就解除，用电平而不是开关门这个动作本身来判——
        「撤防时门就开着、然后直接布防」也要能报出来。振动引起的报警
        不走这条路（_alarm_by_door=False），仍然要撤防才解除。
        """
        if self._sec_state == F.SECST_ARMED and self._door_open:
            self._alarm_by_door = True
            self._enter_state(F.SECST_ALARM)
        elif (self._sec_state == F.SECST_ALARM and self._alarm_by_door
              and not self._door_open):
            self._enter_state(F.SECST_ARMED)

    # ------------------------------------------------------------------ 状态机

    def _enter_state(self, st: int) -> None:
        if self._sec_state == st:
            return
        prev = self._sec_state
        self._sec_state = st
        name = F.SECST_NAMES[st]
        if st == F.SECST_DISARMED:
            self._alarm_level = F.ALM_NONE
            self._alarm_by_door = False
            self._silenced = False
            self._vib_in_window = 0
            self._locked = False
            self._emit_event("security", "info", "已撤防，门锁打开")
        elif st == F.SECST_ARMING:
            self._arm_countdown = ARM_DELAY_S
            self._alarm_level = F.ALM_NONE
            self._alarm_by_door = False
            self._silenced = False
            self._emit_event("security", "info", f"布防退出延时开始，{ARM_DELAY_S} 秒")
        elif st == F.SECST_ARMED:
            self._alarm_level = F.ALM_NONE
            self._alarm_by_door = False
            self._silenced = False
            self._locked = True
            self._emit_event("security", "info",
                             "门已关闭，报警解除" if prev == F.SECST_ALARM
                             else "已布防，门锁上锁")
        elif st == F.SECST_ALARM:
            self._alarm_level = F.ALM_ALARM
            self._locked = True
            self._emit_event("security", "alarm", "安防报警触发")
        self.state.security_state = name

    # ------------------------------------------------------------------ 外部注入（供演示与测试用）

    def inject_door(self, opened: bool) -> None:
        self._door_open = opened
        if opened:
            self._door_count += 1
            self._emit_event("door", "warning" if self._sec_state == F.SECST_ARMED else "info",
                             "门被打开" if self._sec_state != F.SECST_ARMED else "布防状态下门被打开")
        else:
            self._emit_event("door", "info", "门已关闭")
        self._step_door_alarm()          # 不等下一拍，点一下就看到结果
        self._publish_state()

    def inject_vibration(self) -> None:
        self._vib_in_window += 1
        self._emit_event("vibration", "info", f"检测到振动（窗口内第 {self._vib_in_window} 次）")
        if self._sec_state == F.SECST_ARMED and self._vib_in_window >= VIB_THRESHOLD:
            self._vib_count += 1
            self._alarm_by_door = False   # 振动报警不跟着门关自动解除，要撤防
            self._enter_state(F.SECST_ALARM)
        self._publish_state()

    def set_node_offline(self, node: str, offline: bool) -> None:
        if node.upper() == "B":
            self.fault_node_b_offline = offline
        elif node.upper() == "C":
            self.fault_node_c_offline = offline
        self._emit_event("node", "warning" if offline else "info",
                         f"节点{node.upper()} {'离线' if offline else '恢复在线'}（模拟注入）")
        self._publish_state()

    # ------------------------------------------------------------------ 命令

    async def submit(self, name: str, params: dict, source: str = "user") -> Command:
        cap = self.state.capabilities.get(name)
        cmd = Command(name=name, params=params, source=source,
                      target_node=_target_of(name))
        self.commands[cmd.id] = cmd

        if cap is not None and not cap.supported:
            cmd.status = CommandStatus.UNSUPPORTED
            cmd.error = cap.reason
            cmd.settled_at = now()
            await bus.publish(TOPIC_COMMAND, cmd.as_dict())
            return cmd

        await bus.publish(TOPIC_COMMAND, cmd.as_dict())
        asyncio.create_task(self._execute(cmd))
        return cmd

    async def _execute(self, cmd: Command) -> None:
        """模拟真实下发：先 sent，等一个往返延迟，再 confirmed/failed。"""
        await asyncio.sleep(random.uniform(0.15, 0.35))
        cmd.status = CommandStatus.SENT
        cmd.sent_at = now()
        cmd.attempts += 1
        await bus.publish(TOPIC_COMMAND, cmd.as_dict())

        # 模拟 485 一圈轮询的往返时间
        await asyncio.sleep(random.uniform(0.2, 0.5))

        if random.random() < self.fault_command_fail_rate:
            cmd.status = CommandStatus.TIMEOUT
            cmd.error = "等待从站回执超时（模拟故障注入）"
            cmd.settled_at = now()
            await bus.publish(TOPIC_COMMAND, cmd.as_dict())
            self._emit_event("command", "warning", f"命令 {cmd.name} 超时")
            return

        try:
            self._apply(cmd)
        except ValueError as exc:
            cmd.status = CommandStatus.FAILED
            cmd.error = str(exc)
            cmd.settled_at = now()
            await bus.publish(TOPIC_COMMAND, cmd.as_dict())
            return

        cmd.status = CommandStatus.CONFIRMED
        cmd.settled_at = now()
        await bus.publish(TOPIC_COMMAND, cmd.as_dict())
        self._publish_state()

    def _apply(self, cmd: Command) -> None:
        """真正改状态。值域校验与固件从站侧保持一致。"""
        p = cmd.params
        if cmd.name == CommandName.SET_FAN:
            mode = p.get("mode", "auto")
            if mode == "auto":
                self._fan_manual = None
            else:
                duty = int(p.get("duty_percent", 0))
                if not F.FAN_DUTY_MIN <= duty <= F.FAN_DUTY_MAX:
                    raise ValueError(f"风扇占空比越界：{duty}，允许 0-100")
                self._fan_manual = duty
            self.state.fan_mode = mode
            self._step_fan()

        elif cmd.name == CommandName.SET_TEMP_THRESHOLD:
            v = int(p["celsius"])
            if not F.TEMPSET_MIN <= v <= F.TEMPSET_MAX:
                raise ValueError(f"温度阈值越界：{v}，允许 {F.TEMPSET_MIN}-{F.TEMPSET_MAX}")
            self.state.temp_threshold = v

        elif cmd.name == CommandName.SET_NEAR_THRESHOLD:
            v = int(p["cm"])
            if not F.NEARCM_MIN <= v <= F.NEARCM_MAX:
                raise ValueError(f"接近阈值越界：{v}，允许 {F.NEARCM_MIN}-{F.NEARCM_MAX}")
            self.state.near_threshold = v

        elif cmd.name == CommandName.SET_SECURITY_MODE:
            mode = p.get("mode")
            if mode == "arm":
                if self._sec_state == F.SECST_DISARMED:
                    self._enter_state(F.SECST_ARMING)
            elif mode == "disarm":
                self._enter_state(F.SECST_DISARMED)
            else:
                raise ValueError(f"未知布防模式：{mode}")

        elif cmd.name == CommandName.SET_ALARM:
            h, m = int(p["hour"]), int(p["minute"])
            if not 0 <= h <= 23:
                raise ValueError(f"闹钟小时越界：{h}，允许 0-23")
            if not 0 <= m <= 59:
                raise ValueError(f"闹钟分钟越界：{m}，允许 0-59")
            self.state.alarm_hour, self.state.alarm_minute = h, m

        elif cmd.name == CommandName.SYNC_TIME:
            # 模拟层没有 DS1302，板上时间本来就取的是 PC 时间，对时是个空操作。
            # 但仍然走完整条命令链路，这样前端和 AI 的行为与真机一致。
            pass

        elif cmd.name == CommandName.SILENCE_ALARM:
            self._silenced = True
            self._emit_event("security", "info", "报警已静音（安防状态保持）")

        elif cmd.name == CommandName.SET_WINDOW:
            state = p.get("state")
            if state == "auto":
                self._window_manual = False
                self._step_window()
            elif state in {"open", "close"}:
                self._window_manual = True
                self._window_open = state == "open"
            else:
                raise ValueError(f"未知通风窗模式：{state}")

        else:
            raise ValueError(f"未实现的命令：{cmd.name}")

    # ------------------------------------------------------------------ 状态输出

    def _publish_state(self) -> None:
        s = self.state
        b_online = not self.fault_node_b_offline
        c_online = not self.fault_node_c_offline
        ts = now()

        s.ts = ts
        s.last_frame_at = ts
        s.board_time = datetime.now().strftime("%H:%M:%S")
        s.node_a.online = True
        s.node_a.last_seen = ts
        s.node_b.online = b_online
        s.node_c.online = c_online
        if b_online:
            s.node_b.last_seen = ts
        if c_online:
            s.node_c.last_seen = ts
        s.frames_ok += 1

        # 离线节点的读数一律作废，与真实串口层的处理保持一致
        s.temp_c = round(self._temp, 1) if b_online else None
        s.temp_high = (self._temp >= s.temp_threshold) if b_online else None
        s.lux_level = self._lux_level() if b_online else None
        s.lux_adc = None
        s.fan_duty = self._fan_duty if b_online else None
        s.window_state = ("open" if self._window_open else "closed") if b_online else None
        s.window_mode = ("manual" if self._window_manual else "auto") if b_online else None

        dist_valid = c_online and F.DIST_MIN <= self._distance <= F.DIST_MAX
        s.distance_cm = self._distance if dist_valid else None
        s.distance_valid = dist_valid
        s.door_state = ("open" if self._door_open else "closed") if c_online else None
        s.security_state = F.SECST_NAMES[self._sec_state] if c_online else None
        s.alarm_level = self._alarm_level if c_online else None
        s.lock_state = ("locked" if self._locked else "unlocked") if c_online else None
        s.vib_count = self._vib_count if c_online else None
        s.door_count = self._door_count if c_online else None
        s.near = (dist_valid and self._distance <= s.near_threshold) if c_online else None
        s.silenced = self._silenced if c_online else None

        s.link_detail = {
            "simulated": True,
            "arm_countdown": self._arm_countdown if self._sec_state == F.SECST_ARMING else 0,
            "silenced": self._silenced,
            "fault_injection": {
                "command_fail_rate": self.fault_command_fail_rate,
                "node_b_offline": self.fault_node_b_offline,
                "node_c_offline": self.fault_node_c_offline,
            },
        }

        asyncio.create_task(bus.publish(TOPIC_STATE, s.as_dict()))

    def _telemetry(self) -> dict:
        s = self.state
        return {
            "ts": s.ts.isoformat(),
            "temp_c": s.temp_c,
            "lux_level": s.lux_level,
            "lux_adc": s.lux_adc,
            "distance_cm": s.distance_cm,
            "distance_valid": s.distance_valid,
            "door_state": s.door_state,
            "security_state": s.security_state,
            "alarm_level": s.alarm_level,
            "fan_duty": s.fan_duty,
            "window_state": s.window_state,
            "lock_state": s.lock_state,
            "node_a_online": s.node_a.online,
            "node_b_online": s.node_b.online,
            "node_c_online": s.node_c.online,
            "crc_errors": s.crc_errors,
        }

    def _emit_event(self, kind: str, level: str, message: str) -> None:
        asyncio.create_task(
            bus.publish(
                TOPIC_EVENT,
                {
                    "ts": datetime.now(timezone.utc).isoformat(),
                    "kind": kind,
                    "level": level,
                    "message": message,
                    "node": {"security": "C", "door": "C", "vibration": "C",
                             "window": "B", "node": "-", "command": "-"}.get(kind, "-"),
                },
            )
        )


def _target_of(name: str) -> str:
    return {
        CommandName.SET_FAN: "B",
        CommandName.SET_TEMP_THRESHOLD: "B",
        CommandName.SET_WINDOW: "B",
        CommandName.SET_SECURITY_MODE: "C",
        CommandName.SILENCE_ALARM: "C",
        CommandName.SET_NEAR_THRESHOLD: "C",
        CommandName.SET_ALARM: "A",
        CommandName.SYNC_TIME: "A",
    }.get(name, "-")
