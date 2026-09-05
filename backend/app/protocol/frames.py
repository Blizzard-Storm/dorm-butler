"""RS485 帧定义 —— 严格镜像固件 inc/protocol.h。

改动这里之前请先看 protocol.h：那份文件是三块板共用的唯一真相源，
本模块只是它在 Python 侧的翻译，任何不一致都以 protocol.h 为准。
"""
from __future__ import annotations

from .crc import frame_crc_ok, frame_set_crc

# ---- 总线参数 ----
BUS_BAUD = 9600

# ---- 节点地址 ----
ADDR_MASTER = 0x01
ADDR_ENV = 0x02
ADDR_SEC = 0x03

# ---- 功能码 ----
FUNC_POLL = 0x03
FUNC_SETCFG = 0x10
FUNC_ACT = 0x06

# ---- 帧长与字段偏移 ----
REQ_LEN = 8
RSP_LEN = 16
F_ADDR = 0
F_FUNC = 1
REQ_ARG0, REQ_ARG1, REQ_ARG2, REQ_ARG3 = 2, 3, 4, 5
RSP_DATA = 2

# ---- 节点类型标识（应答数据区第 0 字节）----
NODE_TYPE_ENV = 0x0B
NODE_TYPE_SEC = 0x0C

# ---- 节点B 环境 数据区偏移 ----
D_ENV_TYPE, D_ENV_FLAGS = 0, 1
D_ENV_TEMP_H, D_ENV_TEMP_L = 2, 3
D_ENV_LUX, D_ENV_FAN = 4, 5
D_ENV_RAWRT_H, D_ENV_RAWRT_L = 6, 7
D_ENV_RAWROP_H, D_ENV_RAWROP_L = 8, 9
D_ENV_MISS, D_ENV_RSV = 10, 11

ENVF_FAN_ON = 0x01
ENVF_WIN_OPEN = 0x02
ENVF_TEMP_HI = 0x04
ENVF_LUX_LOW = 0x08

# ---- 节点C 安防 数据区偏移 ----
D_SEC_TYPE, D_SEC_FLAGS = 0, 1
D_SEC_DIST_H, D_SEC_DIST_L = 2, 3
D_SEC_ALARM, D_SEC_VIBCNT = 4, 5
D_SEC_DOORCNT, D_SEC_STATE = 6, 7
D_SEC_MISS = 11

SECF_ARMED = 0x01
SECF_DOOR_OPEN = 0x02
SECF_VIB = 0x04
SECF_NEAR = 0x08
SECF_LOCKED = 0x10

SECST_DISARMED, SECST_ARMING, SECST_ARMED, SECST_ALARM = 0, 1, 2, 3
SECST_NAMES = {0: "disarmed", 1: "arming", 2: "armed", 3: "alarm"}

ALM_NONE, ALM_NOTICE, ALM_ALARM = 0, 1, 2

# ---- 固件出厂默认值（protocol.h 第七节）----
DEF_TEMPSET = 28
DEF_ARM = 0
DEF_NEARCM = 60

# ---- 从站参数合法区间（与 NodeB/NodeC 的 SETCFG 校验保持一致）----
TEMPSET_MIN, TEMPSET_MAX = 10, 40
NEARCM_MIN, NEARCM_MAX = 10, 200
FAN_DUTY_MIN, FAN_DUTY_MAX = 0, 100
FAN_AUTO = 255           # FUNC_ACT arg0 = 255 表示交回自动

# ---- 距离有效区间（NodeC main.c 的 DIST_MIN / DIST_MAX）----
DIST_MIN, DIST_MAX = 2, 400


def put_i16(buf: bytearray, pos: int, value: int) -> None:
    """高字节在前写入有符号 16 位，对应固件 PutI16()。"""
    u = value & 0xFFFF
    buf[pos] = (u >> 8) & 0xFF
    buf[pos + 1] = u & 0xFF


def get_i16(data: bytes, pos: int = 0) -> int:
    """高字节在前读出有符号 16 位，对应固件 GetI16()。0xFFFF 还原为 -1。"""
    u = (data[pos] << 8) | data[pos + 1]
    return u - 0x10000 if u & 0x8000 else u


def build_request(addr: int, func: int, args: tuple[int, int, int, int] = (0, 0, 0, 0)) -> bytes:
    """组一帧 8 字节主站请求（含 CRC）。"""
    buf = bytearray(REQ_LEN)
    buf[F_ADDR] = addr
    buf[F_FUNC] = func
    for i, a in enumerate(args):
        buf[REQ_ARG0 + i] = a & 0xFF
    return bytes(frame_set_crc(buf))


def parse_response(frame: bytes) -> dict | None:
    """解析一帧 16 字节从站应答。CRC 或节点类型不符返回 None。"""
    if len(frame) != RSP_LEN or not frame_crc_ok(frame):
        return None
    addr, func = frame[F_ADDR], frame[F_FUNC]
    data = frame[RSP_DATA:RSP_DATA + 12]
    expect = {ADDR_ENV: NODE_TYPE_ENV, ADDR_SEC: NODE_TYPE_SEC}.get(addr)
    if expect is None or data[0] != expect:
        return None
    return {"addr": addr, "func": func, "data": data}


def decode_env(data: bytes) -> dict:
    """把节点B 的 12 字节数据区拆成字段。"""
    flags = data[D_ENV_FLAGS]
    return {
        "temp_c": get_i16(data, D_ENV_TEMP_H) / 10.0,
        "lux_level": data[D_ENV_LUX],
        "fan_duty": data[D_ENV_FAN],
        "raw_rt": (data[D_ENV_RAWRT_H] << 8) | data[D_ENV_RAWRT_L],
        "raw_rop": (data[D_ENV_RAWROP_H] << 8) | data[D_ENV_RAWROP_L],
        "poll_miss": data[D_ENV_MISS],
        "fan_on": bool(flags & ENVF_FAN_ON),
        "window_open": bool(flags & ENVF_WIN_OPEN),
        "temp_high": bool(flags & ENVF_TEMP_HI),
        "lux_low": bool(flags & ENVF_LUX_LOW),
    }


def decode_sec(data: bytes) -> dict:
    """把节点C 的 12 字节数据区拆成字段。距离超出量程视为无效。"""
    flags = data[D_SEC_FLAGS]
    dist = get_i16(data, D_SEC_DIST_H)
    valid = DIST_MIN <= dist <= DIST_MAX
    return {
        "distance_cm": dist if valid else None,
        "distance_valid": valid,
        "alarm_level": data[D_SEC_ALARM],
        "vib_count": data[D_SEC_VIBCNT],
        "door_count": data[D_SEC_DOORCNT],
        "sec_state": SECST_NAMES.get(data[D_SEC_STATE], "unknown"),
        "poll_miss": data[D_SEC_MISS],
        "armed": bool(flags & SECF_ARMED),
        "door_open": bool(flags & SECF_DOOR_OPEN),
        "vibrating": bool(flags & SECF_VIB),
        "near": bool(flags & SECF_NEAR),
        "locked": bool(flags & SECF_LOCKED),
    }
