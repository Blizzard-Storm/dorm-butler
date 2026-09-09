# 寝室管家

基于 RS485 现场总线的三节点宿舍测控系统。**单片机固件与 PC 上位机在同一个仓库里。**

```
手机/电脑网页 ──HTTP/WebSocket──> PC 后台 ──USB串口──> NodeA ──RS485──> NodeB / NodeC
     监督层                        网关            主站            从站
```

电脑是网络与串口网关，NodeA 是三板系统的主控网关，手机不直接连单片机。

| 目录 | 是什么 | 工具链 |
|---|---|---|
| `firmware/` | 三块 STC-B 板的固件 | Keil C51 + STC-ISP |
| `backend/` | PC 网关、数据库、LLM Agent | Python 3.11 + FastAPI |
| `frontend/` | 手机/电脑通用网页 | Vue 3 + TypeScript |

固件和上位机放在一个仓库，是因为 `firmware/*/inc/protocol.h` 与
`backend/app/protocol/frames.py` 是同一份协议的两种表达，必须同步修改；
一次功能改动往往同时跨固件、后端、数据库、前端四层，分仓库会把它拆成两次提交。

---

## 三块板各干什么

| 节点 | 485 地址 | 职责 | 主要外设 |
|---|---|---|---|
| **NodeA** 主控网关 | `0x01` 主站 | 人机界面、DS1302 时钟、M24C02 参数存储、485 轮询、PC 网关 | 数码管、摇杆、DS1302、M24C02、Uart1(USB)、Uart2(485) |
| **NodeB** 环境节点 | `0x02` 从站 | NTC 测温、光敏分档、风扇 PWM 闭环、通风窗 | 热敏 Rt、光敏 Rop、EXT(PWM)、StepMotor |
| **NodeC** 安防节点 | `0x03` 从站 | 门磁、振动、超声波测距、布防状态机、电子锁舌 | Hall、Vib、EXT(超声波)、StepMotor、IR |

三块板通过 RS485 半双工总线相连（A / B / GND 三线），主站轮询、从站应答，
自定义 ModBus 风格定长帧 + CRC16。协议定义在 `firmware/*/inc/protocol.h`，
**三份文件内容完全一致**，任何一方改了都要同步另外两份。

## PC 与板子之间能做什么

**上行（板子 -> PC）：全通。** NodeA 每秒发一行 43 字节定长文本报文，
汇总三个节点的数据；另有 `STA` 旁路报文上报门磁、布防、锁舌、
通风窗、计数器以及三节点运行性能。旁路状态超过 3 秒未刷新会置为“未知”。

**下行（PC -> 板子）：参数和执行器均已接通。** NodeA 收 10 字节二进制命令帧
（`0xAA` 帧头 + CRC16），通过 485 轮询状态机向从站下发 `FUNC_SETCFG` 或
`FUNC_ACT`；只有收到目标从站应答后，NodeA 才向 PC 返回 ASCII 成功回执。

可控制温度阈值、布防/撤防、接近阈值、闹钟和板上时间，也可控制风扇手动/自动、
通风窗开/关/自动以及当前报警静音。通风窗和锁舌没有限位传感器，页面显示的是
从板保存的软件状态，不表述为物理位置已确认。

**模拟模式（`DEVICE_MODE=mock`）**复刻了固件的主要控制律与异常路径，
可不接硬件验证页面、数据库、告警和 AI 链路。能力表仍以固件事实为准，
例如通风窗没有下发命令时不会在模拟层假装支持。

---

# 第一部分 · 拿到并跑起来

## 我是第一次拿到这个项目

**前提一**：装好 [Python 3.11+](https://www.python.org/downloads/)（安装时勾选
**Add python.exe to PATH**）和 [Git](https://git-scm.com/downloads)。
**不需要装 Node.js** —— 前端已经构建好一起放在仓库里了。

**前提二**：这是私有仓库，你得先被加成协作者。找仓库所有者
（GitHub 账号 `Blizzard-Storm`）在 Settings → Collaborators 里加你，
你的邮箱会收到邀请，**点了接受**才能 clone。

### 一条命令搞定

按 `Win + R`，输入 `cmd` 回车，把下面这一整行粘贴进去按回车：

```bat
git clone https://github.com/Blizzard-Storm/dorm-butler.git "%USERPROFILE%\Desktop\寝室管家上位机" && cd /d "%USERPROFILE%\Desktop\寝室管家上位机" && setup.cmd
```

它会自动完成：下载到桌面 → 建虚拟环境 → 装依赖 → 生成配置 → 启动服务 → 打开浏览器。
全程约 2 分钟，中间不需要你操作。

### 装好之后

- **本机打开**：<http://localhost:8000>
- **手机打开**：先在电脑上跑 `ipconfig` 查到 IPv4 地址（形如 `192.168.1.7`），
  手机连同一个 WiFi，浏览器开 `http://192.168.1.7:8000`
- **下次启动**：不用再跑 `setup.cmd`，直接双击文件夹里的 **`start-backend.cmd`**
- **停止服务**：关掉那个黑色命令行窗口

---

## 我已经有这个项目了，想更新到最新版

在项目文件夹里打开命令行，执行：

```bash
git pull
```

### 拉完之后要不要重装依赖

看这次更新动了什么：

| 情况 | 需要做的 |
|---|---|
| 只改了前端或后端代码 | 什么都不用做，重启一下服务即可 |
| `backend/requirements.txt` 变了 | `.venv\Scripts\python.exe -m pip install -r backend\requirements.txt` |
| `backend/.env.example` 加了新配置项 | 对照着把新增的项补进你自己的 `backend/.env` |
| 不确定 | 重跑一次 `setup.cmd`，它会跳过已有的虚拟环境，只补装依赖 |

### `git pull` 报错怎么办

**报 `Your local changes would be overwritten`** —— 你本地改过文件，和远端冲突了。
先决定这些改动要不要留：

```bash
git stash          # 把本地改动暂存起来
git pull           # 拉最新
git stash pop      # 把改动放回来（可能需要手动解决冲突）
```

如果本地改动不要了，直接丢弃：

```bash
git checkout -- .  # 丢弃所有本地改动，谨慎
git pull
```

**报 `divergent branches`** —— 你本地有提交、远端也有提交。
用变基把你的提交挪到最新的后面：

```bash
git pull --rebase
```

---

# 第二部分 · 团队协作规范

## 核心规则：不要直接往 main 提交

`main` 分支是"随时可以演示的版本"。答辩前一天如果有人把 `main` 推挂了，
整个组都没得演。所以：

> **任何修改都先开分支，验证通过后再合回 main。**

## 改代码的完整流程

### 1. 开始之前，先同步

```bash
git checkout main
git pull
```

### 2. 开一个分支

```bash
git checkout -b feat/温度曲线优化
```

分支命名建议，前缀让人一眼看出这是什么改动：

| 前缀 | 用途 | 例子 |
|---|---|---|
| `feat/` | 新功能 | `feat/历史数据导出` |
| `fix/` | 修 bug | `fix/断线重连失败` |
| `docs/` | 只改文档 | `docs/补充标定说明` |
| `refactor/` | 重构，功能不变 | `refactor/拆分Overview组件` |

中文英文都行，能看懂就好，但别用 `test`、`mybranch`、`新分支` 这种没信息量的名字。

### 3. 改代码，随时提交

```bash
git add -A
git commit -m "总览页温度曲线支持切换时间范围"
```

提交信息写**做了什么**，不要写 "update"、"修改"、"提交一下"。
一次提交只做一件事，别把五个不相关的改动挤进一个 commit。

### 4. 改完前端源码，必须重新构建

⚠️ **这条最容易忘。忘了的话，别人 pull 下来看到的还是旧界面。**

```bash
cd frontend
npm run build
```

因为 `frontend/dist/`（构建产物）是**故意提交进仓库**的 ——
这样队友和老师不装 Node.js 也能直接跑。代价就是改了源码必须重新构建并一起提交。

只改后端的话不用管这条。

### 5. 推送前跑测试

```bash
cd backend
..\.venv\Scripts\python.exe -m pytest -q
```

**68 个测试必须全过。** 挂了就先修，别推上去。

### 6. 推送分支

```bash
git push -u origin feat/温度曲线优化
```

第一次推某个分支要加 `-u`，之后这个分支再推直接 `git push` 就行。

### 7. 合回 main

**推荐做法：在 GitHub 网页上开 Pull Request**

推完之后 GitHub 仓库页面会出现一个黄条 "Compare & pull request"，点它 →
填一下改了什么 → Create pull request。这样：

- 队友能看到你改了哪些行，可以评论
- 有记录，出问题能回溯
- 不会不小心把 main 搞坏

组长 review 完点 "Merge pull request" 即可。

**如果就你一个人在改、也确定没问题**，也可以直接本地合：

```bash
git checkout main
git pull
git merge feat/温度曲线优化
git push
```

### 8. 收尾

分支合并后就可以删了，别让仓库堆一堆废分支：

```bash
git branch -d feat/温度曲线优化                # 删本地
git push origin --delete feat/温度曲线优化     # 删远端
```

---

## 常用命令速查

```bash
git status                    # 我现在改了哪些文件（最常用）
git branch                    # 我在哪个分支
git branch -a                 # 所有分支，含远端
git checkout main             # 切回 main
git checkout -b 新分支名       # 开并切到新分支
git log --oneline -10         # 最近 10 条提交
git diff                      # 看我改了什么（还没 add 的）
git diff --cached             # 看我 add 了什么（还没 commit 的）
```

## 两个人改了同一个文件怎么办

合并时 Git 会在文件里插入冲突标记：

```
<<<<<<< HEAD
你的版本
=======
别人的版本
>>>>>>> feat/他的分支
```

手动编辑这个文件，**把标记行删掉**，留下你想要的内容（可能是两边各留一部分），
然后：

```bash
git add 那个文件
git commit
```

**冲突高发区提前打个招呼**：`frontend/dist/` 里的文件是构建生成的，
两个人同时改前端几乎必冲突。遇到 dist 冲突不用手动解，直接重新构建覆盖即可：

```bash
git checkout --ours frontend/dist       # 先随便留一边
cd frontend && npm run build            # 重新构建，以源码为准
git add frontend/dist
```

## 千万不要做的事

| 不要 | 为什么 |
|---|---|
| `git push --force` 到 main | 会抹掉别人的提交，且难以恢复 |
| 提交 `backend/.env` | 里面有 API 密钥，`.gitignore` 已挡，别手动 `git add -f` |
| 提交 `.venv/`、`node_modules/` | 几百 MB，且各人平台不同 |
| 提交 `backend/data/*.db` | 各人的运行数据，没有共享价值，必冲突 |
| 直接在 main 上改一大堆再推 | 出问题没法回退，也没人 review |

---

## 分工建议

三个人几乎不会互相冲突的切法：

| 人 | 主要目录 |
|---|---|
| 上位机 / 前端 | `frontend/`、`backend/app/api/` |
| 协议 / 设备层 | `backend/app/protocol/`、`backend/app/devices/` |
| 固件 | `firmware/` |

**需要打招呼的接口有两处**：

1. `firmware/*/inc/protocol.h` 有三份，**内容必须完全一致**。改一份就要改三份，
   否则联调时表现为"数据偶尔不对"，能查一整天。核对办法：

   ```bash
   md5sum firmware/*/inc/protocol.h     # 三行 md5 必须相同
   ```

2. `backend/app/protocol/frames.py` 是 `protocol.h` 的 Python 镜像。
   改了 `protocol.h` 必须同步改它并跑一遍 `pytest`，否则解析会**静默出错**
   —— 不报错，数据悄悄不对。

---

# 第三部分 · 开发参考

## 开发模式（改代码自动热更新）

日常开发用这个，比每次 `npm run build` 快得多：

```bash
# 窗口 1 · 后端（在 backend/ 目录下）
..\.venv\Scripts\python.exe -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

```bash
# 窗口 2 · 前端（在 frontend/ 目录下，需要 Node.js）
npm install --registry=https://registry.npmmirror.com   # 第一次才要
npm run dev
```

打开 <http://localhost:5173>，改源码自动刷新。

**注意**：开发模式下别人看不到你的改动，最终还是要 `npm run build` 并提交 `dist`。

### 一键脚本（Windows）

| 脚本 | 用途 |
|---|---|
| `setup.cmd` | 首次安装：建环境、装依赖、启动 |
| `start-backend.cmd` | 只启后端（日常用这个） |
| `start-frontend.cmd` | 只启前端开发服务器 |
| `start-all.cmd` | 开发模式，前后端各开一个窗口 |
| `build-and-serve.cmd` | 构建前端后单端口托管，演示用 |

---

## 固件：怎么改、怎么编译、怎么烧

### 需要装什么

- **Keil uVision (C51)** —— 编译固件。本机装在 `D:\KEIL`
- **STC-ISP** —— 烧录工具，STC 官网免费下载

只跑上位机的话这两个都不用装 —— `output/*.hex` 已经在仓库里了。

### 编译

双击 `firmware/NodeA_主控网关/NodeA.uvproj` 打开 Keil，按 **F7**。

也可以命令行编译，改完不用开 IDE：

```bash
"D:\KEIL\UV4\UV4.exe" -j0 -b NodeA.uvproj -o build.log
```

看 `build.log` 里的 `Program Size` 和 `0 Error(s)`。

### 烧录（三步，顺序不能错）

⚠️ **串口是独占资源，后端和 STC-ISP 不能同时用。**

```
1. 双击 烧录前-释放串口.cmd     停掉后端，放开 COM 口
2. STC-ISP 烧录                 见下
3. 双击 start-backend.cmd       把后端起回来
```

跳过第 1 步的话，STC-ISP 会报「设备打开失败」—— 那不是驱动问题，是后端占着串口。

STC-ISP 里的设置：

| 项 | 值 |
|---|---|
| 单片机型号 | `STC15F2K60S2` |
| 输入用户程序运行时的 IRC 频率 | **11.0592 MHz** |
| 程序文件 | `firmware/<节点>/output/*.hex` |

然后 **先点「下载/编程」，再给板子上电**（已通电就先拔 USB 再插）。
STC 是冷启动握手，顺序反了会一直卡在「正在检测目标单片机」。

⚠️ 频率选错的典型现象是**数码管全灭**，看起来像板子坏了。

### 当前的功能开关

`main.c` 顶部一堆 `USE_xxx` 宏，当初是为了挤进 Keil 评估版的 2KB 用户代码上限
才关掉的。**现在用的是正式版 Keil，这个限制不存在了**，可以按需打开：

| 开关 | 节点 | 状态 | 打开后 |
|---|---|---|---|
| `USE_PC_CMD` | A | ✅ 开 | PC 下行控制通道 |
| `USE_REPORT` | A | ✅ 开 | 每秒上报 PC |
| `USE_CURTAIN` | A | ✅ 开 | NodeB 光照 + NodeA 时间联动本机窗帘电机 |
| `USE_IRRX` | A | ✅ 开 | 接收 NodeC 发出的布防、报警与静音红外指令 |
| `USE_SOUND` | A | ❌ 关 | 闹钟音乐 + 报警旋律 |
| `USE_FM` / `USE_ENCODER` | A | ❌ 关 | FM 广播 / 旋转编码器，需借外设 |
| `USE_PC_REPORT` | B | ✅ 开 | 单板直连 PC。**组网后要改回 0** |

### 改固件时的三个坑

**1. `.c` 文件是 GBK 编码，绝不要批量转 UTF-8。**
转了之后 Keil 读中文注释会出问题，轻则乱码重则编译报错。
仓库里的 `.gitattributes` 已经把固件源码标为二进制，Git 不会动它们的换行。
代价是 GitHub 网页上看这些文件是乱码 —— 这是有意的取舍，clone 下来一切正常。

**2. `xdata` 必须在 C 代码运行前统一清零。**
Keil 自带的 `STARTUP.A51` 里 `XDATALEN` 默认为 0，原先不会清 xdata 区
（`data` 区由 `IDATALEN` 负责）。没给初值的 `xdata` 变量上电可能是随机值。

实测踩到过：报文时间戳出现 `[55:00:04]`（不存在的小时数）、
上报出现光照 5 档 / 报警 5 级（合法范围只有 0~4 和 0~2）。
现在三套 Keil 工程均引用 `firmware/common/STARTUP.A51`，并把 `XDATALEN`
设置为 `0700H`，与工程声明的 XRAM `0000H-06FFH` 完全一致。启动汇编会在
进入任何 `main()` 前清零全部 1792 字节，因此以后新增未初始化的 `xdata`
变量也能得到确定的零初值。`main()` 里已有的显式赋值保留为业务默认值和防御性初始化。

**3. 回调必须非阻塞。**
`sys.h` 要求单遍主循环累计小于 1mS，而一次 485 往返要 40mS。
所有耗时操作都要拆成状态机 + 定时事件推进，不能在回调里等结果。

### 不用硬件也能验证协议

`firmware/_主机自测/` 里有一套 gcc 环境：`prelude.h` 把 8051 的
`code`/`xdata`/`data` 关键字和 sfr 定义打成空壳，让 gcc 能编过三个 `main.c` 查语法；
`test.c` 跑 CRC16 已知向量、2000 组随机数据对比、单比特翻转检出、
16 位整数往返、温度查表与浮点公式的偏差。

```bash
cd firmware/_主机自测 && bash run.sh
```

⚠️ 这个目录里的 `inc/protocol.h` 是**独立的一份拷贝**，改了主协议记得同步过来，
否则自测跑的是旧协议、结论不可信。

---

## 两种设备模式

在 `backend/.env` 里切换：

### 模拟模式 `DEVICE_MODE=mock`

不需要任何硬件。模拟层不是随机数发生器，而是把三块板的控制律搬到 PC 上跑：

| 复刻的逻辑 | 对应固件 |
|---|---|
| 风扇 30% 起转、每超 1℃ 加 7%、1℃ 回差 | NodeB `UpdateFan()` |
| 通风窗 +3℃ 开、-1℃ 关 | NodeB `UpdateWindow()` |
| 布防四态机 + 3 秒退出延时 | NodeC 状态机 |
| 布防下门开即报警、门关即解除 | NodeC `UpdateDoorAlarm()` |
| 振动 2 秒窗口累计 3 次才报警（须撤防才解除） | NodeC `myVib_callback()` |
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

接上三块真实板后，可双击根目录的 `真实硬件异常验收.cmd`。工具会引导完成
NodeB/NodeC 断线、NodeA USB 断线、RS485 A/B 对调及恢复测试，自动检查未知值、
命令回执和自动重连，并把证据保存到 `artifacts/`。具体见
[`docs/真实硬件异常验收.md`](docs/真实硬件异常验收.md)。

---

## 项目结构

```
firmware/                        单片机固件（Keil C51，GBK 编码）
  NodeA_主控网关/
    NodeA.uvproj                 Keil 工程，双击打开
    source/main.c                主控 + 485 主站 + PC 网关
    source/STCBSP_V3.6.LIB       课程提供的 BSP 库（老师用正式版编的）
    inc/*.h                      BSP 头文件 + protocol.h
    output/NodeA_Master.hex      编译产物，故意提交（不装 Keil 也能烧）
  NodeB_环境节点/                 同上结构
  NodeC_安防节点/                 同上结构
  _主机自测/                      不用硬件，在 PC 上用 gcc 验证协议算法

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
      serial_svc.py      # 真实串口层（状态上报 + 带回执的参数下发）
    llm/
      tools.py agent.py  # 工具定义与 function calling
    api/
      routes.py ws.py    # REST + WebSocket
  tests/                 # 68 个测试
frontend/
  src/
    types.ts api.ts store.ts
    components/          # StatCard、TemperatureTrend
    views/               # 总览/控制/分析/事件/AI/诊断
  dist/                  # 构建产物，故意提交进仓库
docs/
  NodeA串口协议补充设计.md
  LLM工具定义说明.md
  验收记录.md
  交给其他AI审核的提示词.md
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

数据库文件不进仓库，每个人有自己的本地数据。

---

## 一条贯穿全系统的规则：不知道就说不知道

任务书要求正确描述物理量，本项目把它做成了硬约束。
**改代码时请守住这条，这是本项目最重要的红线**：

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

⚠️ `LLM_API_KEY` 只存在你本地的 `backend/.env` 里，
该文件已被 `.gitignore` 排除，**永远不要提交它**。

---

## 测试

```bash
..\.venv\Scripts\python.exe -m pytest -q
```
（在 `backend/` 目录下执行）

**68 个测试**，覆盖 CRC16 已知向量与单比特翻转检出、16 位整数往返、
485 帧编解码、文本报文解析（粘包/拆包/噪声重同步/离线作废/无效距离）、
详细状态与性能报文、命令生命周期与回执匹配、值域拒绝、
关键 REST 接口、WebSocket 推送、
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
| `git 不是内部或外部命令` | 没装 Git，去 <https://git-scm.com/downloads> 装完重开 cmd |
| `python 不是内部或外部命令` | 装 Python 时没勾 Add to PATH，重装并勾上 |
| clone 时提示 404 或没权限 | 私有仓库，你还没被加成协作者，或没接受邮件邀请 |
| 依赖装到一半失败 | 网络问题。换清华镜像：<br>`.venv\Scripts\python.exe -m pip install -r backend\requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple` |
| 浏览器打不开页面 | 黑窗口关掉了？重新双击 `start-backend.cmd` |
| 页面白屏，控制台报 MIME `text/plain` | Windows 注册表把 `.js` 登记成 text/plain。`main.py` 已用 `mimetypes.add_type` 修正；若仍白屏，`Ctrl + F5` 强制刷新 |
| pull 完界面没变 | 对方改了源码但忘了 `npm run build` 提交 dist，让他补一次 |
| 手机打不开 | 防火墙没放行 8000/5173，或没连同一 WiFi |
| 真实模式没数据 | 串口号不对；或 NodeA 的 `USE_REPORT` 被关掉了；诊断页看"解析失败行"和"最近一条无法解析的行" |
| CRC 错误持续增长 | 485 总线问题。先把三块板的 `BUS_BAUD` 一起降到 1200 重新下载，再查 A/B 是否接反 |
| 部分控制按钮是灰的 | 当前真实固件只支持参数下发；风扇手动调速、消音、通风窗没有对应下行通路，页面会说明原因 |
