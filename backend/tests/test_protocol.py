"""协议层测试：CRC、帧编解码、报文解析、粘包与噪声重同步。"""
from __future__ import annotations

import pytest

from app.protocol import frames as F
from app.protocol.crc import crc16_modbus, frame_crc_ok, frame_set_crc
from app.protocol.report import ReportParser


# ------------------------------------------------------------------ CRC


def test_crc16_known_modbus_vectors():
    # 业界通用的 ModBus CRC16 校验向量
    assert crc16_modbus(b"\x01\x03\x00\x00\x00\x01") == 0x0A84
    assert crc16_modbus(b"123456789") == 0x4B37
    assert crc16_modbus(b"") == 0xFFFF


def test_crc_low_byte_first_matches_firmware():
    """固件 FrameSetCrc() 是低字节在前，这里必须一致。"""
    buf = bytearray(b"\x02\x03\x00\x00\x00\x00\x00\x00")
    frame_set_crc(buf)
    crc = crc16_modbus(bytes(buf[:-2]))
    assert buf[-2] == crc & 0xFF
    assert buf[-1] == crc >> 8
    assert frame_crc_ok(bytes(buf))


def test_crc_detects_single_bit_flip():
    """单比特翻转必须被抓住 —— 这是 CRC 存在的意义。"""
    frame = bytearray(F.build_request(F.ADDR_ENV, F.FUNC_POLL))
    assert frame_crc_ok(bytes(frame))
    for bit in range(8 * (len(frame) - 2)):
        corrupted = bytearray(frame)
        corrupted[bit // 8] ^= 1 << (bit % 8)
        assert not frame_crc_ok(bytes(corrupted)), f"第 {bit} 位翻转未被检出"


# ------------------------------------------------------------------ 16 位整数


@pytest.mark.parametrize("value", [0, 1, -1, 235, -235, 32767, -32768, 400])
def test_put_get_i16_roundtrip(value):
    buf = bytearray(2)
    F.put_i16(buf, 0, value)
    assert F.get_i16(bytes(buf)) == value


def test_get_i16_ffff_is_minus_one():
    """固件用 0xFFFF 表示距离无效，必须还原成 -1 而不是 65535。"""
    assert F.get_i16(b"\xff\xff") == -1


# ------------------------------------------------------------------ 帧


def test_build_request_shape():
    frame = F.build_request(F.ADDR_SEC, F.FUNC_SETCFG, (1, 60, 0, 0))
    assert len(frame) == F.REQ_LEN
    assert frame[F.F_ADDR] == F.ADDR_SEC
    assert frame[F.F_FUNC] == F.FUNC_SETCFG
    assert frame[F.REQ_ARG1] == 60
    assert frame_crc_ok(frame)


def _make_env_response(temp10: int, lux: int, fan: int, threshold: int = 28) -> bytes:
    buf = bytearray(F.RSP_LEN)
    buf[F.F_ADDR] = F.ADDR_ENV
    buf[F.F_FUNC] = F.FUNC_POLL
    buf[F.RSP_DATA + F.D_ENV_TYPE] = F.NODE_TYPE_ENV
    buf[F.RSP_DATA + F.D_ENV_FLAGS] = F.ENVF_FAN_ON | F.ENVF_WIN_OPEN
    F.put_i16(buf, F.RSP_DATA + F.D_ENV_TEMP_H, temp10)
    buf[F.RSP_DATA + F.D_ENV_LUX] = lux
    buf[F.RSP_DATA + F.D_ENV_FAN] = fan
    buf[F.RSP_DATA + F.D_ENV_TEMPSET] = threshold
    return bytes(frame_set_crc(buf))


def test_parse_env_response():
    frame = _make_env_response(-125, 3, 65, 31)
    parsed = F.parse_response(frame)
    assert parsed is not None
    env = F.decode_env(parsed["data"])
    assert env["temp_c"] == -12.5
    assert env["lux_level"] == 3
    assert env["fan_duty"] == 65
    assert env["temp_threshold"] == 31
    assert env["fan_on"] and env["window_open"]


def test_parse_response_rejects_bad_crc_and_wrong_type():
    frame = bytearray(_make_env_response(200, 2, 0))
    frame[5] ^= 0xFF
    assert F.parse_response(bytes(frame)) is None

    frame2 = bytearray(_make_env_response(200, 2, 0))
    frame2[F.RSP_DATA + F.D_ENV_TYPE] = 0x99      # 节点类型不对
    frame_set_crc(frame2)
    assert F.parse_response(bytes(frame2)) is None


def test_decode_sec_invalid_distance():
    buf = bytearray(F.RSP_LEN)
    buf[F.F_ADDR] = F.ADDR_SEC
    buf[F.RSP_DATA + F.D_SEC_TYPE] = F.NODE_TYPE_SEC
    F.put_i16(buf, F.RSP_DATA + F.D_SEC_DIST_H, -1)
    buf[F.RSP_DATA + F.D_SEC_STATE] = F.SECST_ARMED
    frame_set_crc(buf)
    sec = F.decode_sec(F.parse_response(bytes(buf))["data"])
    assert sec["distance_cm"] is None
    assert sec["distance_valid"] is False
    assert sec["sec_state"] == "armed"


# ------------------------------------------------------------------ 串口文本报文


GOOD = b"[21:30:05] T+235 L2 F040 D120 A0 O11 E000\r\n"
STATUS = b"STA BF=007 BP=000 CF=027 CS=2 V=012 D=003 CP=001 AP=000 L=12345 RB=0 RC=1\r\n"


def test_report_length_matches_firmware():
    assert len(GOOD) == 43


def test_parse_good_report():
    reports = list(ReportParser().feed(GOOD))
    assert len(reports) == 1
    r = reports[0]
    assert r.board_time == "21:30:05"
    assert r.temp_c == 23.5
    assert r.lux_level == 2
    assert r.fan_duty == 40
    assert r.distance_cm == 120
    assert r.distance_valid
    assert r.alarm_level == 0
    assert r.node_b_online and r.node_c_online
    assert r.crc_errors == 0


def test_parse_status_line_without_counting_it_as_bad_report():
    parser = ReportParser()
    assert list(parser.feed(STATUS)) == []
    assert parser.lines_bad == 0
    assert parser.status_ok == 1
    st = parser.last_status
    assert st is not None
    assert st.env_flags == 7
    assert st.env_poll_miss == 0
    assert st.sec_flags == 27
    assert st.sec_state == F.SECST_ARMED
    assert st.vib_count == 12 and st.door_count == 3
    assert st.sec_poll_miss == 1
    assert st.master_poll_miss == 0
    assert st.master_main_loops == 12345
    assert (st.reply_miss_b, st.reply_miss_c) == (0, 1)


def test_negative_temperature():
    r = next(iter(ReportParser().feed(b"[00:00:01] T-125 L0 F000 D050 A1 O11 E003\r\n")))
    assert r.temp_c == -12.5
    assert r.alarm_level == 1
    assert r.crc_errors == 3


def test_offline_node_readings_are_discarded():
    """节点离线时 NodeA 上报的是陈旧值，解析器必须作废，不能当成实时读数。"""
    r = next(iter(ReportParser().feed(b"[10:00:00] T+235 L2 F040 D120 A0 O00 E000\r\n")))
    assert r.node_b_online is False and r.node_c_online is False
    assert r.temp_c is None
    assert r.lux_level is None
    assert r.fan_duty is None
    assert r.distance_cm is None
    assert r.alarm_level is None
    assert r.crc_errors == 0        # CRC 计数由 NodeA 自己维护，仍然有效


def test_distance_zero_means_no_echo():
    """固件把无效距离 -1 钳成 000，且 DIST_MIN=2，所以 000/001 都是无回波。"""
    for raw in (b"D000", b"D001"):
        line = b"[10:00:00] T+235 L2 F040 " + raw + b" A0 O11 E000\r\n"
        r = next(iter(ReportParser().feed(line)))
        assert r.distance_cm is None
        assert r.distance_valid is False


def test_temperature_saturation_flag():
    r = next(iter(ReportParser().feed(b"[10:00:00] T+999 L2 F040 D120 A0 O11 E000\r\n")))
    assert r.temp_saturated is True


def test_split_across_chunks():
    """拆包：一行报文被分成任意几段送达，仍要正确还原。"""
    parser = ReportParser()
    out = []
    for i in range(0, len(GOOD), 7):
        out.extend(parser.feed(GOOD[i:i + 7]))
    assert len(out) == 1
    assert out[0].temp_c == 23.5


def test_multiple_reports_in_one_chunk():
    """粘包：一次读到三行。"""
    parser = ReportParser()
    reports = list(parser.feed(GOOD * 3))
    assert len(reports) == 3
    assert parser.lines_ok == 3


def test_noise_prefix_resync():
    """线路噪声塞进前导垃圾字节后，仍要能重新同步到帧头。"""
    parser = ReportParser()
    reports = list(parser.feed(b"\x00\xff\x7fGARBAGE" + GOOD))
    assert len(reports) == 1
    assert parser.bytes_dropped > 0


def test_malformed_line_counted_not_crashing():
    parser = ReportParser()
    assert list(parser.feed(b"hello world\r\n")) == []
    assert parser.lines_bad == 1
    # 坏行不影响后续好行
    assert len(list(parser.feed(GOOD))) == 1
    assert parser.lines_ok == 1


def test_buffer_does_not_grow_unbounded():
    """一直收不到换行时必须丢弃旧数据，不能无限吃内存。"""
    parser = ReportParser()
    for _ in range(20):
        list(parser.feed(b"x" * 1000))
    assert len(parser.buffer) <= 4096
    assert parser.bytes_dropped > 0
