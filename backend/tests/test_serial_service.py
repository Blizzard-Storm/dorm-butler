"""真实串口设备层测试（不需要硬件）。

直接把字节流喂给解析器、把解析结果喂给状态机，验证：
  * NodeA 报文能正确落进 SystemState
  * 从站离线时旧读数被作废
  * 报文里没有的字段保持 unknown，不被编造
  * 有下发通路的命令能正确组帧，没有的如实标 unsupported
  * 回执按 seq 匹配，迟到的回执被丢弃
  * 从站离线的回执不会被当成执行成功
  * NodeA 超时未上报会被 watchdog 判离线
"""
from __future__ import annotations

import asyncio
from datetime import timedelta

import pytest

from app.devices.base import Command, CommandName, CommandStatus, now
from app.devices.serial_svc import NODE_A_TIMEOUT_S, SerialDeviceService, _plan_command
from app.protocol import frames as F
from app.protocol.crc import crc16_modbus


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


def test_status_line_populates_real_device_states_and_health(svc):
    feed(svc, b"STA BF=007 BP=002 CF=027 CS=2 V=012 D=003 CP=001 AP=000 L=12345 RB=0 RC=1\r\n")
    feed(svc, b"[21:30:05] T+235 L2 F040 D120 A0 O11 E000\r\n")
    s = svc.state
    assert s.window_state == "open"
    assert s.temp_high is True
    assert s.door_state == "open"
    assert s.security_state == "armed"
    assert s.lock_state == "locked"
    assert s.near is True
    assert (s.vib_count, s.door_count) == (12, 3)
    assert (s.node_a.poll_miss, s.node_b.poll_miss, s.node_c.poll_miss) == (0, 2, 1)
    assert s.main_loops == 12345
    assert (s.master_reply_miss_b, s.master_reply_miss_c) == (0, 1)
    telemetry = svc._telemetry()
    assert telemetry["door_state"] == "open"
    assert telemetry["security_state"] == "armed"
    assert telemetry["window_state"] == "open"
    assert telemetry["lock_state"] == "locked"


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
    CommandName.SET_FAN,          # 需要转发 FUNC_ACT，固件下行只做了 SETCFG
    CommandName.SILENCE_ALARM,    # NodeC 的本地动作，没有对应配置参数
    CommandName.SET_WINDOW,       # 固件根本没有通风窗下发命令
])
def test_commands_without_firmware_path_are_unsupported(svc, name):
    """固件没有这条下发通路时，如实标 unsupported，绝不写进串口然后假装成功。"""
    cmd = asyncio.run(svc.submit(name, {}))
    assert cmd.status == CommandStatus.UNSUPPORTED
    assert cmd.error                       # 必须说明为什么不支持
    assert svc.state.capabilities[name].supported is False


@pytest.mark.parametrize("name,params,cfg_index,value", [
    (CommandName.SET_TEMP_THRESHOLD, {"celsius": 26}, F.CFG_TEMPSET, 26),
    (CommandName.SET_SECURITY_MODE, {"mode": "arm"}, F.CFG_ARM, 1),
    (CommandName.SET_SECURITY_MODE, {"mode": "disarm"}, F.CFG_ARM, 0),
    (CommandName.SET_NEAR_THRESHOLD, {"cm": 80}, F.CFG_NEARCM, 80),
])
def test_supported_commands_build_correct_frame(svc, name, params, cfg_index, value):
    """有下发通路的命令要能正确翻译成 Cfg 下标与值。"""
    node, plan = _plan_command(name, params)
    assert plan == [(F.FUNC_SETCFG, cfg_index, value, 0)]
    assert node in ("B", "C")


def test_alarm_is_a_two_step_local_command():
    """闹钟要分时、分两帧下发，且目标是 NodeA 本机（不经 485，不怕从站离线）。"""
    node, plan = _plan_command(CommandName.SET_ALARM, {"hour": 7, "minute": 30})
    assert node == "A"
    assert plan == [(F.FUNC_SETCFG, F.CFG_ALMH, 7, 0),
                    (F.FUNC_SETCFG, F.CFG_ALMM, 30, 0)]


def test_sync_time_uses_its_own_function_code():
    """对时走 FUNC_PC_SETTIME，时分秒装在一帧里，且目标是 NodeA 本机。"""
    node, plan = _plan_command(CommandName.SYNC_TIME,
                               {"hour": 11, "minute": 53, "second": 7})
    assert node == "A"
    assert plan == [(F.FUNC_PC_SETTIME, 11, 53, 7)]


def test_settime_frame_carries_hms():
    frame = F.build_pc_command(seq=9, target=F.ADDR_MASTER, arg0=11, arg1=53,
                               func=F.FUNC_PC_SETTIME, arg2=7)
    assert frame[3] == F.FUNC_PC_SETTIME
    assert (frame[4], frame[5], frame[6]) == (11, 53, 7)
    crc = crc16_modbus(frame[:-2])
    assert frame[-2] == crc & 0xFF and frame[-1] == crc >> 8


def test_command_frame_shape_and_crc():
    frame = F.build_pc_command(seq=7, target=F.ADDR_MASTER,
                               arg0=F.CFG_TEMPSET, arg1=26)
    assert len(frame) == F.CMD_LEN
    assert frame[0] == F.CMD_HDR
    assert frame[1] == 7 and frame[3] == F.FUNC_SETCFG
    assert frame[4] == F.CFG_TEMPSET and frame[5] == 26
    crc = crc16_modbus(frame[:-2])
    assert frame[-2] == crc & 0xFF and frame[-1] == crc >> 8


def test_seq_wraps_and_never_uses_zero(svc):
    """固件用 seq=0 表示空闲，PC 必须跳过 0。"""
    seen = {svc._next_seq() for _ in range(600)}
    assert 0 not in seen
    assert seen == set(range(1, 256))


def test_ack_line_is_parsed_and_not_mistaken_for_report(svc):
    reports = list(svc.parser.feed(b"ACK s=012 t=01 r=00 d=000\r\n"))
    assert reports == []                    # 回执不是主报文
    assert svc.parser.lines_bad == 0        # 也不是坏行
    assert len(svc.parser.acks) == 1
    a = svc.parser.acks[0]
    assert (a.seq, a.target, a.result, a.detail) == (12, 1, 0, 0)


def test_ack_confirms_only_matching_seq(svc):
    """迟到的回执不能被当成当前请求的结果。"""
    async def scenario():
        ev = asyncio.Event()
        svc._inflight[5] = {"event": ev, "ack": None}
        # 一条 seq 对不上的回执：必须被丢弃，不能唤醒在途请求
        list(svc.parser.feed(b"ACK s=099 t=01 r=00 d=000\r\n"))
        await svc._on_ack(svc.parser.acks.pop(0))
        assert not ev.is_set()
        # seq 对得上的才算数
        list(svc.parser.feed(b"ACK s=005 t=01 r=00 d=000\r\n"))
        await svc._on_ack(svc.parser.acks.pop(0))
        assert ev.is_set()
        assert svc._inflight[5]["ack"].result == F.ACK_OK

    asyncio.run(scenario())


def test_offline_ack_is_not_reported_as_success(svc):
    """从站离线时 NodeA 会收下参数并回 ACK_OFFLINE，但那不是执行成功。"""
    async def scenario():
        cmd = Command(name=CommandName.SET_TEMP_THRESHOLD, params={"celsius": 26})
        svc.commands[cmd.id] = cmd
        await svc._settle(cmd, CommandStatus.FAILED, F.ACK_TEXT[F.ACK_OFFLINE])
        return cmd

    cmd = asyncio.run(scenario())
    assert cmd.status is not CommandStatus.CONFIRMED
    assert "离线" in cmd.error


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
