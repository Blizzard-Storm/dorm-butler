/**************************************************************************************************
 * 「寝室管家」节点C —— 安防节点（门口）      485 地址 0x03
 *
 *   职责：门磁 / 异动 / 有人靠近检测 -> 本地分级声光报警 -> 经 485 上报主站
 *
 *   用到的模块：sys / displayer / Key / adc(Nav) / Beep / music / hall / Vib
 *               IR(发码) / uart2(485 从站) / EXT(超声波测距) / StepMotor(电子锁舌)
 *
 *   接口占用：
 *       Uart2  -> 485 接口（A / B / GND 接总线）
 *       EXT    -> 超声波测距模块
 *       SM     -> 步进电机（电子锁舌）
 *       IR     -> 红外发射，向节点A 发报警 / 布防切换指令（485 之外的第二条无线链路）
 *
 *   布防状态机：
 *
 *        撤防 DISARMED  --按K3/主站下发--> 布防倒计时 ARMING --倒计时到--> 已布防 ARMED
 *            ^                                    |                            |
 *            |                                    |                     门开 或 连续振动
 *            +--------- 按K3 / 主站下发 ----------+----------------------------+
 *                                                                              v
 *                                                                        报警 ALARM
 *
 *   倒计时（退出延时）是必须的：不然刚按下布防、人还没出门就自己报警了。
 *
 * 负责人：成员3        日期：待填
 **************************************************************************************************/
#include "STC15F2K60S2.H"
#include "sys.H"
#include "displayer.H"
#include "Key.H"
#include "adc.H"
#include "Beep.H"
#include "music.H"
#include "hall.H"
#include "Vib.H"
#include "IR.H"
#include "uart2.H"
#include "EXT.H"
#include "StepMotor.H"
#define PROTO_NO_GETI16   1        /* 本节点只往总线上打包数据，用不到 GetI16，掐掉省代码 */
#include "protocol.h"

code unsigned long SysClock = 11059200;      /* 必须与 stc-isp 下载时选的工作频率一致 */

#ifdef _displayer_H_
code char decode_table[] = {0x3f, 0x06, 0x5b, 0x4f, 0x66, 0x6d, 0x7d, 0x07, 0x7f, 0x6f, 0x00, 0x08, 0x40, 0x01, 0x41, 0x48,
	0x3f|0x80, 0x06|0x80, 0x5b|0x80, 0x4f|0x80, 0x66|0x80, 0x6d|0x80, 0x7d|0x80, 0x07|0x80, 0x7f|0x80, 0x6f|0x80};
#endif


/*==================================================================================================
 * 一、可调参数
 *================================================================================================*/

/* 锁舌用哪台步进电机
     LOCK_MOTOR_IS_LED = 0 —— SM 口上的真实步进电机（从附件箱借到的那一台给这里，演示效果最好）
     LOCK_MOTOR_IS_LED = 1 —— 用 L4~L7 四个 LED 模拟一台四相电机（借不到时的替代预案）

   这里必须用一个【宏】来开关，不能直接写 #if (LOCK_MOTOR == enumStepMotor3)。
   因为 enumStepMotor1/3 是 C 的枚举常量，预处理器看不见它们，两边都会被当成 0，
   条件恒为真——这类错误编译不报错，只是行为不对，很难查。 */
#define LOCK_MOTOR_IS_LED   0

#if (LOCK_MOTOR_IS_LED)
	#define LOCK_MOTOR      enumStepMotor3
#else
	#define LOCK_MOTOR      enumStepMotor1
#endif

#define LOCK_SPEED          30
#define LOCK_STEPS          48          /* 上锁 / 开锁各转多少步 */

#define ARM_DELAY_S         10          /* 布防退出延时，秒 */

/* 振动去抖：ARMED 状态下，VIB_WINDOW_S 秒内累计 VIB_THRESHOLD 次振动才算异动。
   ！！这两个数【必须实测】。成员3 的实验：分别做「走过去、正常关门、敲桌子、用力晃门」
   四个动作，记录每个动作在 2 秒窗口里产生几次振动事件，
   取「正常关门」的最大次数 + 1 作为阈值。一次都不去抖的话，走个路就会报警。 */
#define VIB_WINDOW_S        2
#define VIB_THRESHOLD       3

/* 超声波有效读数范围（cm）。超出这个范围认为是无效读数，保留上一次的值 */
#define DIST_MIN            2
#define DIST_MAX            400


/*==================================================================================================
 * 二、报警旋律
 *   高8度 5 和高8度 1 交替，做成"滴呜滴呜"的警笛。
 *   编码格式：音高(1字节) + 音长(1字节) 成对出现
 *       音高：高4位 1=低8度 2=中8度 3=高8度，低3位 1~7 简谱音；0x00 = 休止符
 *       音长：单位 1/16 拍，0x10 = 1拍，0x08 = 半拍
 *================================================================================================*/
code unsigned char AlarmSong[] = {
	0x35, 0x08,  0x31, 0x08,  0x35, 0x08,  0x31, 0x08,
	0x35, 0x08,  0x31, 0x08,  0x35, 0x08,  0x31, 0x08
};


/*==================================================================================================
 * 三、变量（Small 模式下缓冲区和状态量一律显式放 xdata，理由同节点B）
 *================================================================================================*/
xdata unsigned char ReqBuf[REQ_LEN];
xdata unsigned char RspBuf[RSP_LEN];
xdata unsigned char IrBuf[IR_LEN];

xdata int  DistCm = -1;                      /* 超声波距离，-1 表示还没有有效读数 */
xdata unsigned char SecState = SECST_DISARMED;
xdata unsigned char DoorOpen;                /* 0 关 / 1 开 */
xdata unsigned char Locked;                  /* 锁舌 0 开 / 1 上锁 */
xdata unsigned char AlarmLevel = ALM_NONE;
xdata unsigned char NearFlag;                /* 有人靠近 */
xdata unsigned char Silenced;                /* 已被消音，报警状态保持但不再出声 */

xdata unsigned char VibCount;                /* 累计有效异动次数，上报主站 */
xdata unsigned char VibInWindow;             /* 当前窗口内的振动次数 */
xdata unsigned char VibWindowTick;           /* 窗口计时，单位秒 */
xdata unsigned char DoorCount;               /* 累计开门次数 */

xdata unsigned char CfgNearCm = DEF_NEARCM;  /* 接近提示阈值，主站可下发覆盖 */
xdata unsigned char ArmCountdown;            /* 布防倒计时剩余秒 */

xdata unsigned int  RxOkCount;
xdata unsigned int  RxErrCount;
xdata unsigned char PollMiss;

data unsigned char Page;
data unsigned char DistDiv;

#if (!BUS_USE_MODBUS)
code unsigned char MyAddr = ADDR_SEC;        /* 只有非 ModBus 模式才用得上，做包头匹配 */
#endif


/*==================================================================================================
 * 四、执行器
 *================================================================================================*/
void SetLock(unsigned char lock)
{
	if(Locked == lock) return;
	if(GetStepMotorStatus(LOCK_MOTOR) == enumStepMotorBusy) return;   /* 正在转就等下一轮 */

	if(SetStepMotor(LOCK_MOTOR, LOCK_SPEED, lock ? LOCK_STEPS : -LOCK_STEPS) == enumSetStepMotorOK)
		Locked = lock;
}

/* 向节点A 发一条红外指令。红外是单工的，正在收发时会失败，失败就算了，485 那条路还在。 */
void IrSend(unsigned char cmd)
{
	if(GetIrStatus() != enumIrFree) return;

	IrBuf[0] = IR_HDR;
	IrBuf[1] = cmd;
	IrBuf[2] = (unsigned char)(IR_HDR ^ cmd ^ 0xFF);
	IrPrint(IrBuf, IR_LEN);
}

void StartAlarmSound()
{
	if(Silenced) return;
	SetMusic(200, 0xFC, AlarmSong, sizeof(AlarmSong), enumMscNull);   /* enumMscNull：不占用数码管和LED */
	SetPlayerMode(enumModePlay);
}

void StopAlarmSound()
{
	SetPlayerMode(enumModeStop);
}


/*==================================================================================================
 * 五、布防状态机
 *================================================================================================*/
void EnterState(unsigned char st)
{
	if(SecState == st) return;
	SecState = st;

	switch(st)
	{
	case SECST_DISARMED:
		AlarmLevel   = ALM_NONE;
		Silenced     = 0;
		VibInWindow  = 0;
		StopAlarmSound();
		SetLock(0);                          /* 撤防时开锁 */
		break;

	case SECST_ARMING:
		ArmCountdown = ARM_DELAY_S;
		AlarmLevel   = ALM_NONE;
		Silenced     = 0;
		VibInWindow  = 0;
		break;

	case SECST_ARMED:
		AlarmLevel = ALM_NONE;
		SetLock(1);                          /* 布防完成时上锁 */
		break;

	case SECST_ALARM:
		AlarmLevel = ALM_ALARM;
		SetLock(1);
		StartAlarmSound();
		IrSend(IR_CMD_ALARM);                /* 红外把报警也捎给节点A，485 万一断了还有这条路 */
		break;

	default:
		break;
	}
}

/* 切换布防 / 撤防。按键、主站下发都走这里 */
void ToggleArm()
{
	if(SecState == SECST_DISARMED) EnterState(SECST_ARMING);
	else                           EnterState(SECST_DISARMED);
}


/*==================================================================================================
 * 六、485 从站
 *================================================================================================*/
void BuildRsp(unsigned char func)
{
	unsigned char flags = 0;

	if(SecState == SECST_ARMED || SecState == SECST_ALARM) flags |= SECF_ARMED;
	if(DoorOpen)   flags |= SECF_DOOR_OPEN;
	if(VibInWindow) flags |= SECF_VIB;
	if(NearFlag)   flags |= SECF_NEAR;
	if(Locked)     flags |= SECF_LOCKED;

	RspBuf[F_ADDR] = ADDR_SEC;
	RspBuf[F_FUNC] = func;

	RspBuf[RSP_DATA + D_SEC_TYPE   ] = NODE_TYPE_SEC;
	RspBuf[RSP_DATA + D_SEC_FLAGS  ] = flags;
	PutI16(&RspBuf[RSP_DATA + D_SEC_DIST_H], DistCm);
	RspBuf[RSP_DATA + D_SEC_ALARM  ] = AlarmLevel;
	RspBuf[RSP_DATA + D_SEC_VIBCNT ] = VibCount;
	RspBuf[RSP_DATA + D_SEC_DOORCNT] = DoorCount;
	RspBuf[RSP_DATA + D_SEC_STATE  ] = SecState;
	RspBuf[RSP_DATA + D_SEC_RSV8   ] = 0;
	RspBuf[RSP_DATA + D_SEC_RSV9   ] = 0;
	RspBuf[RSP_DATA + D_SEC_RSV10  ] = 0;
	RspBuf[RSP_DATA + D_SEC_MISS   ] = PollMiss;

	FrameSetCrc(RspBuf, RSP_LEN);
}

void myUart2Rxd_callback()
{
	if(ReqBuf[F_ADDR] != ADDR_SEC) return;

	if(!FrameCrcOk(ReqBuf, REQ_LEN))
	{
		RxErrCount++;
		return;
	}
	RxOkCount++;

	switch(ReqBuf[F_FUNC])
	{
	case FUNC_POLL:
		BuildRsp(FUNC_POLL);
		Uart2Print(RspBuf, RSP_LEN);
		break;

	case FUNC_SETCFG:
		/* arg0 = 期望的布防状态。只在与当前状态不一致时才切换，避免每次轮询都重新触发倒计时 */
		if(ReqBuf[REQ_ARG0] == 0 && SecState != SECST_DISARMED)
			EnterState(SECST_DISARMED);
		else if(ReqBuf[REQ_ARG0] == 1 && SecState == SECST_DISARMED)
			EnterState(SECST_ARMING);

		if(ReqBuf[REQ_ARG1] >= 10 && ReqBuf[REQ_ARG1] <= 200)
			CfgNearCm = ReqBuf[REQ_ARG1];

		BuildRsp(FUNC_SETCFG);
		Uart2Print(RspBuf, RSP_LEN);
		break;

	case FUNC_ACT:
		SetLock(ReqBuf[REQ_ARG0] ? 1 : 0);   /* 主站直接控制锁舌，联调 / 演示用 */
		BuildRsp(FUNC_ACT);
		Uart2Print(RspBuf, RSP_LEN);
		break;

	default:
		break;
	}
}


/*==================================================================================================
 * 七、显示
 *
 *   写法说明同节点B：先往 D[8] 缓冲里填，最后统一调用一次 Seg7Print。
 *   Seg7Print 有 8 个参数，C51 每个调用点都要一条条 MOV 传参，固定开销几十字节；
 *   每位数字写成 d/100%10 又要调 int 除法运行库。原来四个调用点编出 361 字节，
 *   在 Keil Eval 版 2KB 的用户代码额度里占了 18%，是本文件最大的函数。
 *================================================================================================*/
xdata char D[8];                             /* 数码管 8 位显示缓冲 */

/* 把 v 拆成 n 位十进制填进 D[pos..]。只取低 n 位，所以显示计数时不用再写 % 100 */
void NumC(unsigned char pos, unsigned char v, unsigned char n)
{
	while(n--) { D[pos + n] = (char)(v % 10); v /= 10; }
}

void Refresh()
{
	unsigned char i, led;
	int d;

	for(i = 0; i < 8; i++) D[i] = 10;        /* 先全灭，每页只填自己要显示的位 */

	switch(Page)
	{
	case 0:      /* 运行页：布防 _ 门 _ 报警 距离(3位)    如 "1 0 0 045" */
		if(SecState == SECST_ARMING)         /* 倒计时中，右两位改显剩余秒数 */
		{
			NumC(6, ArmCountdown, 2);
		}
		else
		{
			d = DistCm;
			if(d < 0)   d = 0;
			if(d > 999) d = 999;
			D[0] = (char)((SecState == SECST_ARMED || SecState == SECST_ALARM) ? 1 : 0);
			D[2] = (char)DoorOpen;
			D[4] = (char)AlarmLevel;
			NumC(5, (unsigned char)(d / 100), 1);      /* 百位：d<=999，先除再降成 8 位 */
			NumC(6, (unsigned char)(d % 100), 2);
		}
		break;

	case 1:      /* 计数页：1 _ 振动次数(2位) _ _ 开门次数(2位) */
		D[0] = 1;
		NumC(2, VibCount,  2);
		NumC(6, DoorCount, 2);
		break;

	default:     /* 通信页：2 _ 收到帧数(低2位) _ _ CRC错误数(低2位) */
		D[0] = 2;
		NumC(2, (unsigned char)RxOkCount,  2);
		NumC(6, (unsigned char)RxErrCount, 2);
		break;
	}

	Seg7Print(D[0], D[1], D[2], D[3], D[4], D[5], D[6], D[7]);   /* 全文件唯一一个调用点 */

#if (LOCK_MOTOR_IS_LED)
	if(GetStepMotorStatus(LOCK_MOTOR) == enumStepMotorBusy) return;   /* LED 模拟电机时别覆盖相位 */
#endif

	led = 0;
	if(SecState != SECST_DISARMED) led |= 0x01;   /* L0 布防中（含倒计时） */
	if(DoorOpen)                   led |= 0x02;   /* L1 门开 */
	if(VibInWindow)                led |= 0x04;   /* L2 检测到振动 */
	if(NearFlag)                   led |= 0x08;   /* L3 有人靠近 */
	if(SecState == SECST_ALARM)    led |= 0x30;   /* 报警时 L4 L5 一起亮 */
	LedPrint(led);
}


/*==================================================================================================
 * 八、事件回调
 *================================================================================================*/

/* 霍尔：磁铁贴在门框上，传感器在门上。
   磁场离开 = 门被打开；磁场接近 = 门关上了 */
void myHall_callback()
{
	unsigned char act = GetHallAct();

	if(act == enumHallGetAway)               /* 门开 */
	{
		DoorOpen = 1;
		DoorCount++;

		if(SecState == SECST_ARMED)          /* 布防状态下开门 = 入侵 */
		{
			EnterState(SECST_ALARM);
		}
		else if(SecState == SECST_DISARMED)
		{
			SetBeep(3000, 8);                /* 撤防状态只"嘀"一声表示知道你回来了 */
		}
	}
	else if(act == enumHallGetClose)         /* 门关 */
	{
		DoorOpen = 0;
	}
}

/* 振动：不是一有振动就报警，先累计到窗口里 */
void myVib_callback()
{
	if(GetVibAct() != enumVibQuake) return;

	if(VibInWindow < 255) VibInWindow++;

	if(SecState == SECST_ARMED && VibInWindow >= VIB_THRESHOLD)
	{
		VibCount++;
		EnterState(SECST_ALARM);
	}
}

/* 100mS：超声波读数 + 显示 */
void my100mS_callback()
{
	int d;

	DistDiv++;
	if(DistDiv >= 2)                         /* 超声波模块每秒只做 5 次测量，200mS 取一次刚好 */
	{
		DistDiv = 0;

		/* GetUltraSonic() 直接返回最近一次的测量结果，是【非阻塞】的——
		   它不会在这里等回波，所以不会破坏 sys 的 1mS 约束。
		   读到范围外的值说明这次回波没收到，丢掉、保留上次的值即可。 */
		d = GetUltraSonic();
		if(d >= DIST_MIN && d <= DIST_MAX)
		{
			DistCm   = d;
			NearFlag = (d <= (int)CfgNearCm) ? 1 : 0;
		}
	}

	Refresh();
}

/* 1S：倒计时、振动窗口滑动、报警旋律续播、系统性能 */
void my1S_callback()
{
	struct_SysPerF perf;

	/* 布防倒计时 */
	if(SecState == SECST_ARMING)
	{
		SetBeep(2500, 10);                   /* 每秒"嘀"一声提示还在倒计时 */
		if(ArmCountdown > 0) ArmCountdown--;
		if(ArmCountdown == 0) EnterState(SECST_ARMED);
	}

	/* 振动窗口：每 VIB_WINDOW_S 秒清一次计数，实现"窗口内累计"的去抖 */
	VibWindowTick++;
	if(VibWindowTick >= VIB_WINDOW_S)
	{
		VibWindowTick = 0;
		VibInWindow   = 0;
	}

	/* 报警旋律放完一遍就再放一遍，直到撤防或消音 */
	if(SecState == SECST_ALARM && !Silenced && GetPlayerMode() != enumModePlay)
		StartAlarmSound();

	/* 已布防且有人长时间贴在门口，给一级提示（不报警，只是提醒） */
	if(SecState == SECST_ARMED && NearFlag && AlarmLevel == ALM_NONE)
		SetBeep(3500, 5);

	perf = GetSysPerformance();
	PollMiss = perf.PollingMisses;
}

/* 按键 */
void myKey_callback()
{
	if(GetKeyAct(enumKey1) == enumKeyPress)          /* Key1 翻页 */
	{
		Page = (Page + 1) % 3;
		SetBeep(3000, 3);
	}

	if(GetKeyAct(enumKey2) == enumKeyPress)          /* Key2 消音：报警状态保持，但不再出声 */
	{
		if(SecState == SECST_ALARM)
		{
			Silenced = 1;
			StopAlarmSound();
			IrSend(IR_CMD_SILENCE);
		}
	}
}

/* 摇杆。注意 Key3 与摇杆共用 P1.7，初始化 ADC 之后 Key3 只能从这里读，
   用 GetKeyAct(enumKey3) 是读不到的——这是 adc.h 里明确写了的坑。 */
void myNav_callback()
{
	if(GetAdcNavAct(enumAdcNavKey3) == enumKeyPress)     /* K3 切换布防 / 撤防 */
	{
		ToggleArm();
		IrSend(IR_CMD_TOGGLE_ARM);
		SetBeep(2000, 10);
	}

	if(GetAdcNavAct(enumAdcNavKeyUp) == enumKeyPress)
	{
		if(CfgNearCm < 200) CfgNearCm += 10;
		SetBeep(3500, 3);
	}
	if(GetAdcNavAct(enumAdcNavKeyDown) == enumKeyPress)
	{
		if(CfgNearCm > 10) CfgNearCm -= 10;
		SetBeep(2500, 3);
	}
	if(GetAdcNavAct(enumAdcNavKeyCenter) == enumKeyPress)
	{
		Page = 0;
	}
}


/*==================================================================================================
 * 九、主函数
 *================================================================================================*/
void main()
{
	DisplayerInit();
	SetDisplayerArea(0, 7);
	KeyInit();
	BeepInit();                              /* 必须在 MusicPlayerInit 之前：音乐是靠蜂鸣器发声的 */
	MusicPlayerInit();
	HallInit();
	VibInit();
	StepMotorInit();
	IrInit(NEC_R05d);

	/* 同节点B：先 AdcInit(ADCexpEXT) 把 EXT 让出来（摇杆 Nav 照常可用），再把 EXT 配成超声波 */
	AdcInit(ADCexpEXT);
	EXTInit(enumEXTUltraSonic);

#if (BUS_USE_MODBUS)
	Uart2Init(BUS_BAUD, Uart2Usedfor485ModBus);
	SetUart2Rxd(ReqBuf, REQ_LEN, 0, 0);
#else
	Uart2Init(BUS_BAUD, Uart2Usedfor485);
	SetUart2Rxd(ReqBuf, REQ_LEN, (void *)&MyAddr, 1);
#endif

	SetEventCallBack(enumEventSys100mS, my100mS_callback);
	SetEventCallBack(enumEventSys1S,    my1S_callback);
	SetEventCallBack(enumEventKey,      myKey_callback);
	SetEventCallBack(enumEventNav,      myNav_callback);
	SetEventCallBack(enumEventHall,     myHall_callback);
	SetEventCallBack(enumEventVib,      myVib_callback);
	SetEventCallBack(enumEventUart2Rxd, myUart2Rxd_callback);

	MySTC_Init();
	while(1)
	{
		MySTC_OS();
	}
}


/**************************************************************************************************
 * 验证步骤
 *
 * L1 单板（不接总线）
 *   1. 下载后运行页应显示「0 _ 0 _ 000」。EXT 接上超声波模块后，右三位应显示手掌到探头的距离，
 *      手来回移动数值跟着变。
 *   2. 拿磁铁靠近再拿开霍尔传感器：第3位在 0 和 1 之间切换，L1 灯跟着亮灭，
 *      撤防状态下拿开磁铁会"嘀"一声。按 Key1 翻到计数页看开门次数在累加。
 *   3. 敲桌子：L2 灯短暂点亮。做去抖实验，把 VIB_THRESHOLD 定下来。
 *   4. 按 K3（摇杆中间那个键，不是 Key3！）布防：进入 10 秒倒计时，每秒"嘀"一声，
 *      数码管显示剩余秒数；倒计时结束 L0 常亮、锁舌动作。
 *   5. 布防状态下拿开磁铁（模拟开门）：立刻进入报警，警笛循环，L4 L5 亮。
 *      按 Key2 消音，警笛停但 L0 仍亮（状态没变，只是不出声了）。再按 K3 撤防，锁舌复位。
 *
 * L2 接总线
 *   6. 与节点A 对接后，通信页收到帧数持续增长、CRC 错误保持 0。
 *      在节点A 的设置页切换布防，本节点应同步进入倒计时。
 *
 * 常见问题
 *   - 距离一直是 000：超声波没接对，或 EXTInit 没生效。先单独跑 hw5-0 的 09 号工程验证模块本身好用。
 *   - 走一下路就报警：VIB_THRESHOLD 太小，或 VIB_WINDOW_S 太长。去抖实验就是干这个的。
 *   - 关门也算开门：霍尔的「接近 / 离开」判反了，把 myHall_callback 里两个分支对调。
 *   - 报警时警笛断断续续：正常。music 播完一遍后由 1S 回调重新起播，中间有不到 1 秒的间隙。
 *     想连续可以把 AlarmSong 加长，或用 music 编码里的 enumMscRepeatBegin / enumMscRepeatEnd。
 **************************************************************************************************/
