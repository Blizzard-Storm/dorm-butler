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
	0x3f|0x80, 0x06|0x80, 0x5b|0x80, 0x4f|0x80, 0x66|0x80, 0x6d|0x80, 0x7d|0x80, 0x07|0x80, 0x7f|0x80, 0x6f|0x80,
	0x77};                                   /* 下标26：字母 A（a b c e f g 六段） */

/* 运行页用字母 A 表示"已布防"，不用数字 1——1 已经被计数页的页号占了，
   两页都在最左位显示 1 的话，扫一眼分不出自己在哪一页。 */
#define SEG_A   26
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

#define ARM_DELAY_S         3           /* 布防退出延时，秒 */

/* 振动去抖：ARMED 状态下，VIB_WINDOW_S 秒内累计 VIB_THRESHOLD 次振动才算异动。
   ！！这两个数【必须实测】。成员3 的实验：分别做「走过去、正常关门、敲桌子、用力晃门」
   四个动作，记录每个动作在 2 秒窗口里产生几次振动事件，
   取「正常关门」的最大次数 + 1 作为阈值。一次都不去抖的话，走个路就会报警。 */
#define VIB_WINDOW_S        2
#define VIB_THRESHOLD       3

/* 超声波有效读数范围（cm）。超出这个范围认为是无效读数，保留上一次的值 */
#define DIST_MIN            2
#define DIST_MAX            400

/* 摇杆调阈值 / 中心键按下后，把当前阈值顶到数码管上显示多久（单位 100mS） */
#define CFG_SHOW_100MS      20


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
xdata unsigned char AlarmByDoor;             /* 这次报警是门引起的：门关回去就自动解除 */

xdata unsigned char VibCount;                /* 累计有效异动次数，上报主站 */
xdata unsigned char VibInWindow;             /* 当前窗口内的振动次数 */
xdata unsigned char VibWindowTick;           /* 窗口计时，单位秒 */
xdata unsigned char DoorCount;               /* 累计开门次数 */

xdata unsigned char CfgNearCm = DEF_NEARCM;  /* 接近提示阈值，主站可下发覆盖 */
xdata unsigned char ArmCountdown;            /* 布防倒计时剩余秒 */

xdata unsigned char PollMiss;

data unsigned char Page;
data unsigned char DistDiv;
data unsigned char CfgShowTick;              /* >0 表示正在显示阈值临时页，每 100mS 减 1 */
                                             /* 放 data 段，和 Page 一样靠 C51 启动代码清 IDATA 归零 */

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
		AlarmByDoor  = 0;
		Silenced     = 0;
		VibInWindow  = 0;
		StopAlarmSound();
		SetLock(0);                          /* 撤防时开锁 */
		break;

	case SECST_ARMING:
		ArmCountdown = ARM_DELAY_S;
		AlarmLevel   = ALM_NONE;
		AlarmByDoor  = 0;
		Silenced     = 0;
		VibInWindow  = 0;
		break;

	case SECST_ARMED:
		/* ALARM -> ARMED 现在是可能的（门关回去，报警自动解除），所以这里
		   必须连声音和消音标志一起复位：不停声，手上那遍警笛会放完；
		   不清 Silenced，下一次报警会是哑的。 */
		AlarmLevel  = ALM_NONE;
		AlarmByDoor = 0;
		Silenced    = 0;
		StopAlarmSound();
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

/* 门控位驱动的报警：布防状态下门开就报警，门关回去就解除。
   用【电平】判而不是用霍尔的边沿事件，是因为边沿会漏掉两种情况：
     - 撤防时门就开着、然后直接按 K3 布防——那个「开」的边沿在布防之前就过去了；
     - 报警之后把门关上——关门只来一个「接近」事件，原来没人管它，报警就一直挂着。
   振动引起的报警不走这条路（AlarmByDoor = 0），它仍然要撤防才能解除。 */
void UpdateDoorAlarm()
{
	if(SecState == SECST_ARMED && DoorOpen)
	{
		AlarmByDoor = 1;
		EnterState(SECST_ALARM);
	}
	else if(SecState == SECST_ALARM && AlarmByDoor && !DoorOpen)
	{
		EnterState(SECST_ARMED);
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
	if(Silenced)   flags |= SECF_SILENCED;

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

	/* CRC 不过就整帧丢掉，让主站按超时处理。原来这里还累加收发计数给通信页看，
	   通信页删掉之后计数就没有出口了——链路健康度看上位机，那边有在线状态、
	   PollingMisses 和 CRC 错误，比数码管上两位十进制清楚得多。 */
	if(!FrameCrcOk(ReqBuf, REQ_LEN)) return;

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
		if(ReqBuf[REQ_ARG0] == ACT_SEC_SILENCE)
		{
			Silenced = 1;
			StopAlarmSound();
		}
		else if(ReqBuf[REQ_ARG0] <= ACT_SEC_LOCK)
		{
			SetLock(ReqBuf[REQ_ARG0]);
		}
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

	/* 阈值临时页：摇杆上下调完阈值、或中心键按下时，先把当前阈值顶在最前面显示 2 秒。
	   做成"看一眼就走"的临时页而不是 Key1 的第 3 页：它自己会超时退回原来那页，
	   不占翻页顺序，用户也不用再按一次退出。右三位与运行页的距离对齐在同样的位置上，
	   方便直接比对"当前距离 / 触发阈值"；左边五位全灭，本身就跟运行页区分开了
	   （运行页位0/位2/位4 一定有数字）。 */
	if(CfgShowTick)
	{
		NumC(5, CfgNearCm, 3);
	}
	else switch(Page)
	{
	case 0:      /* 运行页：布防 _ 门 _ 报警 距离(3位)    如 "A 0 0 045" */
		if(SecState == SECST_ARMING)         /* 倒计时中，右两位改显剩余秒数 */
		{
			NumC(6, ArmCountdown, 2);
		}
		else
		{
			d = DistCm;
			if(d < 0)   d = 0;
			if(d > 999) d = 999;
			D[0] = (char)((SecState == SECST_ARMED || SecState == SECST_ALARM) ? SEG_A : 0);
			D[2] = (char)DoorOpen;
			D[4] = (char)AlarmLevel;
			NumC(5, (unsigned char)(d / 100), 1);      /* 百位：d<=999，先除再降成 8 位 */
			NumC(6, (unsigned char)(d % 100), 2);
		}
		break;

	default:     /* 计数页：1 _ 振动次数(2位) _ _ 开门次数(2位) */
		D[0] = 1;
		NumC(2, VibCount,  2);
		NumC(6, DoorCount, 2);
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

		/* 布防状态下的报警不在这里触发：交给 UpdateDoorAlarm() 按门控位的电平判，
		   否则「撤防时门就开着、然后直接布防」这种情况永远等不到这个边沿 */
		if(SecState == SECST_DISARMED)
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
		AlarmByDoor = 0;                     /* 振动报警不跟着门关自动解除，要撤防 */
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

	UpdateDoorAlarm();                       /* 门控位驱动的报警：先判它，再算提示等级 */

	/* 一级提示（报警等级 1）：已布防 + 有人贴在门口。
	   等级只在 ARMED 里跟着 NearFlag 走——ALARM 是二级，不能被它降回一级；
	   DISARMED / ARMING 的等级由 EnterState 清零，这里不插手。 */
	if(SecState == SECST_ARMED)
		AlarmLevel = NearFlag ? ALM_NOTICE : ALM_NONE;

	if(CfgShowTick) CfgShowTick--;           /* 阈值临时页倒计时，到点自己退回原来那页 */

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

	/* 一级提示的声音：每秒“嘀”一声，直到人走开。等级本身在 100mS 回调里维护，
	   这里不能再写 AlarmLevel == ALM_NONE——等级一升到 1，这声提示就再也不会响了 */
	if(SecState == SECST_ARMED && NearFlag)
		SetBeep(3500, 5);

	perf = GetSysPerformance();
	PollMiss = perf.PollingMisses;
}

/* 按键 */
void myKey_callback()
{
	if(GetKeyAct(enumKey1) == enumKeyPress)          /* Key1 翻页 */
	{
		Page = (Page + 1) % 2;
		SetBeep(3000, 3);
	}

	/* Key2 静音开关：报警状态、L0/L4/L5 全部保持不变，只切声音。
	   做成开关而不是单向消音，是因为误按之后没有别的办法把警笛叫回来——
	   原来只能先撤防再重新布防、再把报警条件触发一遍。 */
	if(GetKeyAct(enumKey2) == enumKeyPress)
	{
		if(SecState == SECST_ALARM)
		{
			Silenced = !Silenced;
			if(Silenced)
			{
				StopAlarmSound();
				IrSend(IR_CMD_SILENCE);      /* 只有静音要额外告诉节点A；恢复出声由 485 轮询里的 SECF_SILENCED 位反映 */
			}
			else
			{
				StartAlarmSound();           /* 必须在清掉 Silenced 之后调用，否则它开头那句判断会直接 return */
			}
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

	/* 上下调阈值：调完立刻把新值显示出来，否则用户根本不知道自己调到了多少 */
	if(GetAdcNavAct(enumAdcNavKeyUp) == enumKeyPress)
	{
		if(CfgNearCm < 200) CfgNearCm += 10;
		CfgShowTick = CFG_SHOW_100MS;
		SetBeep(3500, 3);
	}
	if(GetAdcNavAct(enumAdcNavKeyDown) == enumKeyPress)
	{
		if(CfgNearCm > 10) CfgNearCm -= 10;
		CfgShowTick = CFG_SHOW_100MS;
		SetBeep(2500, 3);
	}
	/* 中心键：先亮 2 秒当前阈值，再回到运行页——正好可以拿它和运行页右三位的实测距离对一对 */
	if(GetAdcNavAct(enumAdcNavKeyCenter) == enumKeyPress)
	{
		CfgShowTick = CFG_SHOW_100MS;
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

	/* xdata 不会被启动代码清零（Keil 的 XDATALEN 默认为 0），显式清掉。
	   DoorOpen / Locked / VibInWindow 是随机值时，布防状态机上电第一拍
	   就可能误判成"门开着"或"已累计多次振动"，直接触发误报警。 */
	DoorOpen      = 0;
	Locked        = 0;
	NearFlag      = 0;
	Silenced      = 0;
	AlarmByDoor   = 0;
	VibCount      = 0;
	VibInWindow   = 0;
	VibWindowTick = 0;
	DoorCount     = 0;
	ArmCountdown  = 0;
	PollMiss      = 0;

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
 *   4. 按 K3 布防：进入 3 秒倒计时，每秒"嘀"一声，数码管显示剩余秒数；
 *      倒计时结束 L0 常亮、运行页最左位从 0 变成 A、锁舌动作。
 *      K3 就是 K1 K2 旁边那个物理按钮，不是摇杆中心键。只是因为本节点开了 ADC，
 *      K3 与摇杆共用 P1.7，代码里得用 GetAdcNavAct(enumAdcNavKey3) 去读它——
 *      读法变了，键没变。摇杆中心键是 enumAdcNavKeyCenter，干的是另一件事（见第 6 条）。
 *   5. 布防状态下拿开磁铁（模拟开门）：立刻进入报警，警笛循环，L4 L5 亮。
 *      按 Key2 消音，警笛停但 L0 仍亮（状态没变，只是不出声了）；再按一次 Key2 警笛回来。
 *      把磁铁贴回去（关门）：报警自己解除，退回已布防，最左位仍是 A、L4 L5 灭。
 *      另外两种也要试：撤防时就让磁铁离开（门开着）再按 K3 布防，倒计时一结束应立刻报警；
 *      敲桌子敲到振动报警，这一种贴回磁铁不解除——振动报警只能按 K3 撤防。
 *      再按 K3 撤防，锁舌复位。
 *   6. 摇杆上/下调接近阈值（±10cm），摇杆中心键看当前阈值：数码管临时显示
 *      「_ _ _ _ _ 阈值3位」2 秒，然后自己退回原来那页（中心键退回运行页）。
 *      拿它和运行页右三位的实测距离对一对，就知道手要放多近才会点亮 L3。
 *   7. 布防完成后把手伸到阈值以内：L3 亮，运行页第 5 位（报警等级）从 0 变 1，
 *      每秒一声短提示音；手拿开后等级自己回 0。这是一级提示，不进报警状态——
 *      L4 L5 不亮、警笛不响，它只是“我看见你了”。
 *
 * L2 接总线
 *   6. 与节点A 对接后，在节点A 的设置页切换布防，本节点应同步进入倒计时，
 *      上位机总览页 NodeC 显示在线。485 链路是否健康看上位机那边的
 *      在线状态 / PollingMisses / CRC 错误，数码管上不再有通信页。
 *
 * 常见问题
 *   - 距离一直是 000：超声波没接对，或 EXTInit 没生效。先单独跑 hw5-0 的 09 号工程验证模块本身好用。
 *   - 走一下路就报警：VIB_THRESHOLD 太小，或 VIB_WINDOW_S 太长。去抖实验就是干这个的。
 *   - 关门也算开门：霍尔的「接近 / 离开」判反了，把 myHall_callback 里两个分支对调。
 *   - 报警时警笛断断续续：正常。music 播完一遍后由 1S 回调重新起播，中间有不到 1 秒的间隙。
 *     想连续可以把 AlarmSong 加长，或用 music 编码里的 enumMscRepeatBegin / enumMscRepeatEnd。
 **************************************************************************************************/
