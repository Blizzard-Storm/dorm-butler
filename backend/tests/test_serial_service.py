"""真实串口设备层测试（不需要硬件）。

直接把字节流喂给解析器、把解析结果喂给状态机，验证：
  * NodeA 报文能正确落进 SystemState
  * 从站离线时旧读数被作废
  * 报文里没有的字段保持 unknown，不被编造
  * 所有控制命令都返回 unsupported，绝不假装成功
  * NodeA 超时未上报会被 watchdog 判离线
"""
from __future__ import annotations

import asyncio
from datetime import timedelta

import pytest

from app.devices.base import CommandName, CommandStatus, now
from app.devices.serial_svc import NODE_A_TIMEOUT_S, SerialDeviceService


@pytest.fixture
def svc() -> SerialDeviceService:
    return SerialDeviceService(port="COM_TEST", baud=9600)


async def afeed(svc: SerialDeviceService, line: bytes) -> None:
    """走完整链路：字节 -> 解析器 -> 状态机。"""
    for report in svc.parser.feed(line):
        await svc._on_report(report)


def feed(svc: SerialDeviceService, line: bytes) -> None:
    """同步包装，供不在事件循环里的测试直接调用。"""
    asyncio.run(afeed(svc, line))


def test_report_populates_state(svc):
    feed(svc, b"[21:30:05] T+235 L2 F040 D120 A0 O11 E000\r\n")
    s = svc.state
    assert s.board_time == "21:30:05"
    assert s.temp_c == 23.5
    assert s.lux_level == 2
    assert s.fan_duty == 40
    assert s.distance_cm == 120
    assert s.alarm_level == 0
    assert s.node_a.online and s.node_b.online and s.node_c.online
    assert s.link_connected


def test_fields_absent_from_report_stay_unknown(svc):
    """文本报文里没有门状态/布防态/窗态/锁态，必须保持 None。"""
    feed(svc, b"[21:30:05] T+235 L2 F040 D120 A0 O11 E000\r\n")
    s = svc.state
    assert s.door_state is None
    assert s.security_state is None
    assert s.window_state is None
    assert s.lock_state is None
    assert s.lux_adc is None
    assert s.vib_count is None


def test_offline_slave_invalidates_readings(svc):
    feed(svc, b"[21:30:05] T+235 L2 F040 D120 A0 O11 E000\r\n")
    assert svc.state.temp_c == 23.5
    # 节点B 掉线，NodeA 仍会上报陈旧的 235，但不能再当成有效读数
    feed(svc, b"[21:30:06] T+235 L2 F040 D120 A0 O01 E000\r\n")
    s = svc.state
    assert s.node_b.online is False
    assert s.temp_c is None
    assert s.fan_duty is None
    assert s.distance_cm == 120        # 节点C 仍在线，距离依然有效


def test_no_echo_distance_is_unknown(svc):
    feed(svc, b"[21:30:07] T+235 L2 F040 D000 A0 O11 E000\r\n")
    assert svc.state.distance_cm is None
    assert svc.state.distance_valid is False


def test_crc_error_counter_tracked(svc):
    feed(svc, b"[21:30:08] T+235 L2 F040 D120 A0 O11 E007\r\n")
    assert svc.state.crc_errors == 7


def test_noise_and_partial_frames_recover(svc):
    """噪声 + 半行 + 好行混在一起，最终状态必须正确。"""
    svc.parser.feed(b"\x00\xffjunk")
    feed(svc, b"[21:30:09] T-125 L0 F000")          # 半行，还没换行
    feed(svc, b" D050 A2 O11 E001\r\n")             # 补齐
    assert svc.state.temp_c == -12.5
    assert svc.state.alarm_level == 2
    assert svc.parser.lines_ok >= 1


@pytest.mark.parametrize("name", [
    CommandName.SET_FAN,
    CommandName.SET_TEMP_THRESHOLD,
    CommandName.SET_SECURITY_MODE,
    CommandName.SILENCE_ALARM,
    CommandName.SET_WINDOW,
])
def test_all_commands_unsupported_in_readonly_mode(svc, name):
    """固件没有下行通道时，绝不能把命令写进串口然后假装成功。"""
    cmd = asyncio.run(svc.submit(name, {}))
    assert cmd.status == CommandStatus.UNSUPPORTED
    assert cmd.error and "SetUart1Rxd" in cmd.error
    assert svc.state.capabilities[name].supported is False


def test_watchdog_marks_node_a_offline(svc):
    async def scenario():
        await afeed(svc, b"[21:30:10] T+235 L2 F040 D120 A0 O11 E000\r\n")
        assert svc.state.node_a.online
        # 把最后收帧时间往前拨，模拟 NodeA 停止上报
        svc.state.last_frame_at = now() - timedelta(seconds=NODE_A_TIMEOUT_S + 1)
        task = asyncio.create_task(svc._watchdog_loop())
        await asyncio.sleep(1.3)
        task.cancel()
        try:
            await task
        except asyncio.CancelledError:
            pass

    asyncio.run(scenario())
    s = svc.state
    assert s.node_a.online is False
    assert s.node_b.online is False
    assert s.temp_c is None            # 掉线后不能停在旧数据上
