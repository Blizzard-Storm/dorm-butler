# NodeA 串口协议 —— 现状与下行通道补充设计

本文分两部分：**第一部分**是当前固件已经存在、上位机已经对接的上行报文；
**第二部分**是为了让 PC 能控制设备而提出的下行帧设计，需要修改 NodeA 固件。

> 所有结论均以 `NodeA_主控网关/source/main.c` 与 `inc/protocol.h` 的实际源码为准。

---

## 一、现状（已实现，只读）

### 1.1 硬事实

| 项目 | 结论 | 源码位置 |
|---|---|---|
| 上行 | 每秒一行 43 字节定长 ASCII 文本 | `SendReport()`，`main.c:622` |
| 下行 | **不存在** | 全文件无 `SetUart1Rxd`，未注册 `enumEventUart1Rxd` |
| 串口参数 | 9600, 8, N, 1 | `UART1_BAUD`，`Uart1Init()` |
| 开关 | `USE_REPORT` 宏，默认 1 | `main.c` 第二节 |

BSP 其实提供了 `SetUart1Rxd()`（`uart1.h:53`），只是固件没有调用。
**所以打通下行是纯软件工作，不需要改硬件。**

### 1.2 上行报文格式

```
[HH:MM:SS] T±ttt Lx Ffff Dddd Ax Obc Eeee\r\n
0         1         2         3         4
0123456789012345678901234567890123456789012
```

| 偏移 | 字段 | 含义 | 备注 |
|---|---|---|---|
| 1,2 / 4,5 / 7,8 | 时/分/秒 | DS1302 板上时间 | 仅供对时参考 |
| 12 | 符号 | `+` / `-` | 温度正负 |
| 13-15 | 温度×10 | `235` = 23.5℃ | 固件钳在 999 |
| 18 | 光照等级 | 0-4 | **未标定**，不是 lux |
| 21-23 | 风扇占空比 | 0-100 | PWM 输出，非转速 |
| 26-28 | 距离 | cm | 无效值被钳成 `000` |
| 31 | 报警等级 | 0 无 / 1 提示 / 2 报警 | |
| 34 / 35 | 节点B / 节点C 在线 | `0` / `1` | |
| 38-40 | CRC 累计错误 | 0-255 饱和 | 总线健康度 |

### 1.3 上位机解析时必须遵守的三条

1. **距离 ≤ 1 视为无回波**。NodeC 的 `DIST_MIN = 2`，而固件把无效值 `-1` 钳成了 `0`。
2. **从站离线时的读数一律作废**。NodeA 不清空 `SlvD[][]`，离线后上报的是陈旧值。
3. **行间隔不保证严格 1 秒**。串口忙时 `SendReport()` 会整行跳过。

以上三条已在 `backend/app/protocol/report.py` 中实现，并有对应测试。

### 1.4 报文里拿不到的字段

485 总线上跑的 12 字节数据区中，以下内容**没有**进入串口报文，
上位机对它们一律显示"未知"：

门开关状态、布防状态机、振动/开门累计次数、通风窗开合、锁舌状态、
热敏/光敏原始 ADC、各节点 `PollMiss`。

---

## 二、下行通道补充设计（待实现）

### 2.1 设计目标

- 不破坏现有 485 主从轮询与 1mS 非阻塞约束
- 复用 `protocol.h` 里已有的 CRC16 与功能码，不引入第二套协议
- 每条命令有唯一请求编号，回执可匹配，迟到回包不会被误认
- 代码增量尽量小 —— 别忘了 **Keil Eval 版 2KB 用户代码上限**

### 2.2 帧格式

采用**定长二进制帧 + 帧头 + CRC16**，与 485 侧保持同一套校验算法。

#### PC → NodeA：命令帧（10 字节）

| 偏移 | 字段 | 说明 |
|---|---|---|
| 0 | `0xAA` | 帧头，供 `SetUart1Rxd()` 做包头匹配 |
| 1 | `seq` | 请求编号 1-255，PC 侧递增，0 保留 |
| 2 | `target` | 目标节点：`0x01` A / `0x02` B / `0x03` C |
| 3 | `func` | 功能码，复用 `protocol.h`：`0x10` SETCFG / `0x06` ACT |
| 4-7 | `arg0..3` | 参数，语义与 485 侧完全一致 |
| 8 | `crcLo` | CRC16/Modbus，低字节在前 |
| 9 | `crcHi` | |

#### NodeA → PC：回执帧（8 字节）

| 偏移 | 字段 | 说明 |
|---|---|---|
| 0 | `0xAB` | 回执帧头，与文本报文的 `[` 不冲突 |
| 1 | `seq` | 原样回填，PC 靠它匹配 |
| 2 | `target` | 原样回填 |
| 3 | `result` | 见下表 |
| 4-5 | `detail` | 失败时的补充信息，成功填 0 |
| 6-7 | `crc` | |

`result` 取值：

| 值 | 含义 | PC 侧映射 |
|---|---|---|
| 0x00 | 已下发并收到从站确认 | `confirmed` |
| 0x01 | 参数越界，未下发 | `failed` |
| 0x02 | 目标从站离线 | `failed` |
| 0x03 | 从站未在超时内应答 | `timeout` |
| 0x04 | 功能码不支持 | `failed` |
| 0x05 | 已收下，正在下发（可选的中间态） | `sent` |

### 2.3 固件改动点

```c
/* 1. 增加缓冲与开关 */
#define USE_UART1_RX  1              /* 估算 +180 字节，注意 2KB 上限 */
#if (USE_UART1_RX)
xdata unsigned char CmdBuf[10];
xdata unsigned char AckBuf[8];
xdata unsigned char PcSeq;           /* 待回执的请求编号，0 = 空闲 */
xdata unsigned char PcTarget;
#endif

/* 2. main() 里注册接收（放在 Uart1Init 之后） */
SetUart1Rxd(CmdBuf, 10, "\xAA", 1);          /* 包头匹配 0xAA */
SetEventCallBack(enumEventUart1Rxd, myUart1Rxd_callback);

/* 3. 回调：只校验和落队列，不在这里做任何等待 */
void myUart1Rxd_callback()
{
    if(!FrameCrcOk(CmdBuf, 10)) return;      /* 坏帧直接丢，让 PC 超时重试 */
    PcSeq    = CmdBuf[1];
    PcTarget = CmdBuf[2];
    /* 把参数搬进对应从站的 CfgDirty 通路，复用现有的 SendReq() */
    ...
}

/* 4. 在 HandleRsp() 里，从站确认后补发回执 */
if(PcSeq && RspBuf[F_ADDR] == PcTarget && RspBuf[F_FUNC] == FUNC_SETCFG)
{
    AckBuf[0] = 0xAB;  AckBuf[1] = PcSeq;  AckBuf[2] = PcTarget;
    AckBuf[3] = 0x00;                       /* 成功 */
    FrameSetCrc(AckBuf, 8);
    Uart1Print(AckBuf, 8);
    PcSeq = 0;
}
```

**关键约束**：`myUart1Rxd_callback()` 里绝不能等 485 应答。
命令只是改写 `Cfg[]` 与 `CfgDirty[]`，真正下发交给已有的 `my10mS_callback()`
轮询状态机，回执在 `HandleRsp()` 里补发。这样才不破坏 `sys.h` 的 1mS 约束。

### 2.4 代码体积预算

| 改动 | 估算字节 |
|---|---|
| 接收缓冲 + 回调 + CRC 校验 | ~120 |
| 回执组帧与发送 | ~60 |
| 合计 | **~180** |

如果编译后 `USED` 百分比超过 100，按 `main.c` 文件末尾给出的顺序关闭可选功能：
`USE_CURTAIN` → `USE_FM` → `USE_ENCODER` → `USE_SOUND`。

### 2.5 PC 侧超时与重试策略（后端已按此实现）

| 参数 | 值 | 依据 |
|---|---|---|
| 单次超时 | 3.0 s | NodeA 轮询一圈约 180mS，留足余量 |
| 重试次数 | 2 | 共 3 次尝试 |
| 重试间隔 | 立即（下一个 tick） | 半双工总线不需额外等待 |
| seq 回绕 | 1-255 循环，跳过 0 | 0 表示空闲 |
| 迟到回包 | seq 不匹配当前在途请求即丢弃 | 防止上一次的回包被当成这一次的 |

**铁律**：只有收到 `result == 0x00` 且 `seq`、`target` 都匹配，才把命令标记为
`confirmed`。写进串口成功**不等于**设备执行成功。

### 2.6 上行混流问题

文本报文以 `[`（0x5B）开头，回执帧以 `0xAB` 开头，两者不冲突。
PC 侧解析器按首字节分流即可：`0x5B` 走文本解析，`0xAB` 走二进制回执解析。
`backend/app/devices/serial_svc.py` 已预留 `_handle_binary_frame()` 的接入位置。

---

## 三、上板验证清单

固件改好后按顺序验证：

1. PC 发一条 `set_temperature_threshold=30`，NodeA 数码管设置页项 1 应变成 30
2. 回执在 500mS 内到达，PC 端命令状态变 `confirmed`
3. 拔掉节点B 的 485 线再发，应收到 `result=0x02`（从站离线），而不是超时
4. 故意发一条 CRC 错误的帧，NodeA 应静默丢弃，PC 侧 3 秒后超时并重试
5. 连续发 300 条命令，成功率应为 100%，且三块板的 `PollingMisses` 保持 0
