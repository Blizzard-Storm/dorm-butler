# 寝室管家 · 上位机

STC-B 三节点智能宿舍系统的电脑后台与手机/电脑通用网页前端。

```
手机/电脑网页 ──HTTP/WebSocket──> 电脑后台 ──USB串口──> NodeA ──RS485──> NodeB / NodeC
```

电脑是网络与串口网关，NodeA 是三板系统的主控网关，手机不直接连单片机。

---

## ⚠️ 先读这一条：当前固件不支持远程控制

核对 `NodeA_主控网关/source/main.c` 的结论：

- **上行有**：`SendReport()` 每秒发一行 43 字节定长文本报文
- **下行没有**：全文件没有 `SetUart1Rxd()` 调用，也没注册 `enumEventUart1Rxd`，
  NodeA 根本不读串口

所以接真实硬件时（`DEVICE_MODE=serial`），本系统是**只读监控**：
实时数据、曲线、事件、报警全都正常，但所有控制按钮会置灰并说明原因。

要打通控制，需按 [`docs/NodeA串口协议补充设计.md`](docs/NodeA串口协议补充设计.md)
修改 NodeA 固件（估算增量约 180 字节，注意 Keil Eval 版 2KB 上限）。

**模拟模式（`DEVICE_MODE=mock`）下所有控制功能完整可用**，
且模拟层复刻了固件的真实控制律，接上硬件后前端不需要改。

---

## 快速开始

### 环境要求

- Python 3.11+
- Node.js 18+
- Windows / macOS / Linux 均可（脚本按 Windows 写）

### 一、安装

```bash
# 后端
python -m venv .venv
.venv\Scripts\python.exe -m pip install -r backend\requirements.txt
copy backend\.env.example backend\.env

# 前端
cd frontend
npm install --registry=https://registry.npmmirror.com
```

### 二、启动

**开发模式（前后端分离，改代码自动热更新）**

```bash
# 窗口 1 · 后端
.venv\Scripts\python.exe -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
（在 `backend/` 目录下执行）

```bash
# 窗口 2 · 前端
npm run dev
```
（在 `frontend/` 目录下执行，打开 http://localhost:5173）

**演示/交付模式（单端口，手机直接访问）**

```bash
npm run build
```
构建完 `frontend/dist` 后启动后端，浏览器打开 http://localhost:8000 即可。

**一键脚本（Windows）**

| 脚本 | 用途 |
|---|---|
| `start-all.cmd` | 开发模式，前后端各开一个窗口 |
| `start-backend.cmd` | 只启后端 |
| `start-frontend.cmd` | 只启前端开发服务器 |
| `build-and-serve.cmd` | 构建前端后单端口托管，演示用 |

### 三、手机访问

1. 手机和电脑连**同一个 WiFi**
2. 电脑上 `ipconfig` 查局域网 IP，例如 `192.168.1.7`
3. 手机浏览器打开 `http://192.168.1.7:8000`（演示模式）
   或 `http://192.168.1.7:5173`（开发模式）
4. 打不开先检查 Windows 防火墙是否放行了对应端口

---

## 两种设备模式

在 `backend/.env` 里切换：

### 模拟模式 `DEVICE_MODE=mock`

不需要任何硬件。模拟层不是随机数发生器，而是把三块板的控制律搬到 PC 上跑：

| 复刻的逻辑 | 对应固件 |
|---|---|
| 风扇 30% 起转、每超 1℃ 加 7%、1℃ 回差 | NodeB `UpdateFan()` |
| 通风窗 +3℃ 开、-1℃ 关 | NodeB `UpdateWindow()` |
| 布防四态机 + 10 秒退出延时 | NodeC 状态机 |
| 振动 2 秒窗口累计 3 次才报警 | NodeC `myVib_callback()` |
| 温度受风扇降温影响形成闭环 | 物理模型 |

诊断页提供故障注入：命令失败率、节点强制离线、模拟开门/振动。默认全关。

### 真实串口模式 `DEVICE_MODE=serial`

```ini
DEVICE_MODE=serial
SERIAL_PORT=COM3        # 设备管理器里看 CH340 对应哪个口
SERIAL_BAUD=9600
```

已处理：粘包、拆包、噪声重同步、缓冲上限保护、断线自动重连、
NodeA 超过 5 秒无上报判离线、从站离线时旧读数作废。

---

## 项目结构

```
backend/
  app/
    config.py            # 环境变量配置
    main.py              # FastAPI 入口、静态托管、生命周期
    bus.py               # 进程内事件总线
    models.py  db.py     # SQLite 四张表 + 落库记录器
    protocol/
      crc.py             # CRC16/Modbus，镜像固件 Crc16Modbus()
      frames.py          # 485 帧定义，镜像 protocol.h
      report.py          # NodeA 文本报文解析 + 重同步
    devices/
      base.py            # DeviceService 抽象、SystemState、Command
      mock.py            # 模拟设备层
      serial_svc.py      # 真实串口层（只读）
    llm/
      tools.py agent.py  # 工具定义与 function calling
    api/
      routes.py ws.py    # REST + WebSocket
  tests/                 # 40 个测试
frontend/
  src/
    types.ts api.ts store.ts
    views/               # 总览/控制/分析/事件/AI/诊断
docs/
  NodeA串口协议补充设计.md
  LLM工具定义说明.md
  验收记录.md
```

---

## 数据库

SQLite，默认 `backend/data/dorm.db`，**首次启动自动建表**，无需手动初始化。

| 表 | 内容 |
|---|---|
| `telemetry` | 遥测时序，1 秒一条（可调），默认保留 14 天，启动时自动清理过期数据 |
| `events` | 报警、门状态变化、节点上下线、总线错误 |
| `commands` | 每条命令的完整生命周期，含 AI 发出的（`source='ai'`） |
| `settings` | 温度阈值、接近阈值等，重启后自动恢复 |

---

## 一条贯穿全系统的规则：不知道就说不知道

任务书要求正确描述物理量，本项目把它做成了硬约束：

| 场景 | 处理 |
|---|---|
| 节点离线 | 该节点所有读数置 `null`，页面显示"未知"，不留旧值 |
| 超声波无回波 | 距离显示"未知"，不显示 0cm，不保留上次的"有人靠近" |
| 光敏未标定 | 一律叫"光照等级 0-4"，从不写 lux |
| 无转速传感器 | 一律叫"风扇 PWM 输出"，从不写转速 |
| 无位置反馈 | 通风窗/门锁标"软件状态"，不说机械位置已确认 |
| 命令已发出 | 只有收到回执才算 `confirmed`，写入串口成功 ≠ 设备执行成功 |
| 固件不支持 | 按钮置灰 + 说明原因，返回 `unsupported`，不假装成功 |
| 曲线数据缺口 | 如实断开，不插值连成假直线 |

---

## AI 助手

在 `backend/.env` 填 `LLM_API_KEY` 后可用（任何兼容 OpenAI function calling 的服务）。
**不配也不影响其它功能**，AI 页会显示"未配置"。

详见 [`docs/LLM工具定义说明.md`](docs/LLM工具定义说明.md)。要点：

- 模型只选工具填参数，不生成串口字节
- 参数经 JSON Schema + 服务端 + 固件从站三重校验
- 布防/撤防、报警静音属敏感操作，**服务端强制要求用户在界面二次确认**
- AI 发出的命令与手动命令进同一张表，可审计
- 回答必须如实转述执行结果，不允许把未确认说成成功

---

## 测试

```bash
.venv\Scripts\python.exe -m pytest -q
```
（在 `backend/` 目录下执行）

40 个测试，覆盖 CRC16 已知向量与单比特翻转检出、16 位整数往返、
485 帧编解码、文本报文解析（粘包/拆包/噪声重同步/离线作废/无效距离）、
命令生命周期与回执匹配、值域拒绝、关键 REST 接口、WebSocket 推送、
以及"LLM 不可用时其它功能照常"。

前端类型检查：

```bash
npm run build      # 内含 vue-tsc 检查
```

---

## 后续：打包成 Android APK

网页版稳定后可用 Capacitor 封装：

```bash
cd frontend
npm install @capacitor/core @capacitor/cli @capacitor/android
npx cap init 寝室管家 com.dorm.butler --web-dir=dist
npm run build && npx cap add android && npx cap sync
npx cap open android          # 用 Android Studio 构建 APK
```

注意：APK 里要把后端地址写成 PC 的**局域网 IP** 而不是 `localhost`，
并在 `AndroidManifest.xml` 允许明文 HTTP（局域网内没有 HTTPS）。

---

## 常见问题

| 现象 | 原因与处理 |
|---|---|
| 页面白屏，控制台报 MIME `text/plain` | Windows 注册表把 `.js` 登记成 text/plain。`main.py` 已用 `mimetypes.add_type` 修正；若仍白屏，浏览器强制刷新清缓存 |
| 手机打不开 | 防火墙没放行 8000/5173，或没连同一 WiFi |
| 真实模式没数据 | 串口号不对；或 NodeA 的 `USE_REPORT` 被关掉了；诊断页看"解析失败行"和"最近一条无法解析的行" |
| CRC 错误持续增长 | 485 总线问题。先把三块板的 `BUS_BAUD` 一起降到 1200 重新下载，再查 A/B 是否接反 |
| 控制按钮全是灰的 | 正常，真实串口模式下固件无下行通道，见文首说明 |
