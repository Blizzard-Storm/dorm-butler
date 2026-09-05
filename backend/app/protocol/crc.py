"""CRC16/Modbus —— 与固件 protocol.h 中 Crc16Modbus() 逐位对应。

多项式 0xA001（0x8005 反转），初值 0xFFFF，低字节在前。
"""


def crc16_modbus(data: bytes) -> int:
    crc = 0xFFFF
    for byte in data:
        crc ^= byte
        for _ in range(8):
            if crc & 0x0001:
                crc = (crc >> 1) ^ 0xA001
            else:
                crc >>= 1
    return crc & 0xFFFF


def frame_set_crc(buf: bytearray) -> bytearray:
    """在整帧末两字节写入 CRC（低字节在前），对应固件 FrameSetCrc()。"""
    crc = crc16_modbus(bytes(buf[:-2]))
    buf[-2] = crc & 0x00FF
    buf[-1] = (crc >> 8) & 0x00FF
    return buf


def frame_crc_ok(buf: bytes) -> bool:
    """校验整帧 CRC，对应固件 FrameCrcOk()。"""
    if len(buf) < 3:
        return False
    crc = crc16_modbus(buf[:-2])
    return buf[-2] == (crc & 0x00FF) and buf[-1] == ((crc >> 8) & 0x00FF)
