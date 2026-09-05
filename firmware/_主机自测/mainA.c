/**************************************************************************************************
 * 「寝室管家」节点A —— 主控 / 网关（书桌）      485 地址 0x01，总线主站
 *
 *   职责：人机界面 + 时间基准 + 485 主站轮询 + 把全网数据送电脑上位机
 *
 *   用到的模块：sys / displayer / Key / adc(Nav 摇杆) / Beep / music / DS1302 / M24C02
 *               uart1(USB 上位机) / uart2(485 主站) / IR(收) / StepMotor(窗帘) / FM_Radio
 *
 *   接口占用：
 *       Uart1  -> USB，连电脑串口调试助手
 *       Uart2  -> 485 接口，作为总线主站
 *       IR     -> 红外接收，收节点C 发来的指令
 *       SM     -> 步进电机（窗帘）。只借到一台电机时给了节点C 当锁舌，这里用 L4~L7 模拟
 *       EXT    -> 空着。借到旋转编码器时把 USE_ENCODER 改成 1
 *       PHONE  -> 插耳机，闹钟到点自动开 FM 广播（耳机线同时充当天线，不插收不到台）
 *
 *==================================================================================================
 *  ！！关于代码体积：本文件是按 Keil Eval 版 2KB 用户代码上限写的
 *
 *  学校这套 Keil 是评估版（链接输出里写着 SN: Eval Version），限制是
 *      RESTRICTED VERSION WITH 0800H BYTE CODE SIZE LIMIT
 *  也就是【自己写的代码】最多 2048 字节。BSP 那个 .LIB 是老师用正式版编好的，不算在内
 *  （所以 Program Size 里 code=13000 多也没关系，卡的只有 main.obj 那部分）。
 *
 *  第一版按 60KB Flash 的思路写，编出来 3919 字节，191%，链接直接报
 *      FATAL ERROR L250: CODE SIZE LIMIT IN RESTRICTED VERSION EXCEEDED
 *  这一版为压体积做了四处结构性改动，功能一个没少：
 *      1) 参数表格化    —— 五个配置项改成数组 + 上下限表，菜单和存取都变成循环，
 *                          替掉了原来两个五分支 switch（原 Nav 回调 377 字节）
 *      2) 数据区整块拷贝 —— 从站应答不再逐字段拆包，整块存进 SlvD[][]，用到时才取
 *                          （原 HandleRsp 269 字节）
 *      3) 显示统一缓冲   —— 五个页面共用一个 D[8] 缓冲和唯一一个 Seg7Print 调用点，
 *                          能用 8 位除法的就不用 int 除法（原 ShowPage 705 字节，全文件最大）
 *      4) 报文模板化    —— 上位机那行文本改成固定模板 + 按位填数字，
 *                          替掉一整套 PutC/PutS/PutU/PutT10（原 SendReport 432 字节）
 *
 *  改代码时请留意：往这个文件里加东西很容易再次超限。加完编译一次，看链接输出那行
 *      RESTRICTED VERSION WITH 0800H BYTE CODE SIZE LIMIT; USED: xxxxH BYTE (yy%)
 *  只要 yy 小于 100 就还有余量。超了就先关下面的可选功能开关。
 *==================================================================================================
 *
 * 负责人：成员1（组长）        日期：待填
 **************************************************************************************************/
#include "STC15F2K60S2.H"
#include "sys.H"
#include "displayer.H"
#include "Key.H"
#include "adc.H"
#include "Beep.H"
#include "music.H"
#include "DS1302.H"
#include "M24C02.H"
#include "uart1.H"
#include "uart2.H"
#include "IR.H"
#include "StepMotor.H"

#define PROTO_NO_PUTI16   1     /* 主站只解包不打包，用不到 PutI16。C51 不剔除死代码，
                                   留着就是白占额度（链接会警告 UNCALLED SEGMENT ?PR?_PUTI16?MAIN） */
#define PROTO_NO_FRAMECRC 1     /* FrameSetCrc / FrameCrcOk 在本文件各只用一次，两个函数体合计 138 字节。
                                   直接写在调用点上，省掉函数本身 */
#include "protocol.h"


/*==================================================================================================
 * 一、可选功能开关
 *
 *   下面每一项都是真功能，不是装饰。默认把两个最占地方的关掉，先保证能编出 hex；
 *   编译通过后看 USED 百分比，有余量就一个一个打开，每开一个重新编译看一次。
 *   括号里是这一项大约占多少字节（估值，以实际编译结果为准）。
 *
 *   如果能换成正式授权的 Keil，把四个全打开就行——这些开关只是为了迁就 2KB 上限。
 *================================================================================================*/
#define USE_REPORT          1           /* 上位机文本报文  实测约 360 字节（含模板和 RepN） */
#define USE_IRRX            0           /* 收节点C 的红外指令  约  90 字节 */
#define USE_SOUND           0           /* 闹钟音乐 + 报警旋律  约 130 字节。关掉退化成蜂鸣器短鸣，
                                           节点C 那边照样会响警笛，所以这是最先该关的一个 */
#define USE_CURTAIN         0           /* 光照 + 时间联动窗帘  约 120 字节 */
#define USE_FM              0           /* 闹钟到点开 FM 广播   约  60 字节，另需插耳机 */
#define USE_ENCODER         0           /* EXT 接旋转编码器     约  50 字节，借到件再开 */

/* 窗帘电机：只借到一台步进电机时给节点C 当锁舌，这里用 L4~L7 模拟。
   必须用宏开关，不能写 #if (X == enumStepMotor3)：预处理器看不见 C 的枚举常量，两边都当 0，条件恒真 */
#define CURTAIN_MOTOR_IS_LED  1

#if (CURTAIN_MOTOR_IS_LED)
	#define CURTAIN_MOTOR   enumStepMotor3
#else
	#define CURTAIN_MOTOR   enumStepMotor1
#endif
#define CURTAIN_SPEED       20
#define CURTAIN_STEPS       64

#define FM_FREQ             1000        /* FM 频率，单位 0.1MHz。1000 = 100.0MHz，改成本地能收到的台 */
#define FM_VOLUME           8           /* 0~15 */

#define UART1_BAUD          9600        /* 电脑串口调试助手要设成同样的 9600, 8, N, 1 */

/* 轮询节奏（单位：10mS 事件的次数）
   9600 波特率下，8 字节请求约 8.3mS、16 字节应答约 16.7mS，一次问答约 40mS。
   超时给到 150mS 很宽裕；轮询间隔 50mS 是留给 485 半双工收发方向切换的余量。 */
#define POLL_TIMEOUT        15
#define POLL_GAP            5
#define OFFLINE_MISS        3

#if (USE_ENCODER)
#include "EXT.H"
#endif
#if (USE_FM)
#include "FM_Radio.H"
#endif


code unsigned long SysClock = 11059200;      /* 必须与 stc-isp 下载时选的工作频率一致 */

#ifdef _displayer_H_
code char decode_table[] = {0x3f, 0x06, 0x5b, 0x4f, 0x66, 0x6d, 0x7d, 0x07, 0x7f, 0x6f, 0x00, 0x08, 0x40, 0x01, 0x41, 0x48,
	/* 序号:  0    1    2    3    4    5    6    7    8    9   10   11   12   13   14   15  */
	/* 字型:  0    1    2    3    4    5    6    7    8    9   灭   下横 中横 上横 上中 中下 */
	0x3f|0x80, 0x06|0x80, 0x5b|0x80, 0x4f|0x80, 0x66|0x80, 0x6d|0x80, 0x7d|0x80, 0x07|0x80, 0x7f|0x80, 0x6f|0x80};
#endif


/*==================================================================================================
 * 二、参数表
 *
 *   五个配置项做成平行数组，而不是五个独立变量 + 两个五分支 switch。
 *   菜单加减、掉电存取、范围校验全都变成对下标的循环，代码量差好几倍。
 *================================================================================================*/
#define CFG_N               5
#define CFG_TEMPSET         0           /* 风扇启动温度阈值 摄氏度 */
#define CFG_ARM             1           /* 布防 0/1 */
#define CFG_ALMH            2           /* 闹钟 时 */
#define CFG_ALMM            3           /* 闹钟 分 */
#define CFG_NEARCM          4           /* 接近提示阈值 cm */

xdata unsigned char Cfg[CFG_N];

/* 五张平行表并成一张二维表：分开写的话每取一个值都要重新架一次 DPTR 去访问 code 空间，
   合并后一次算出行首地址、四个字段顺着取。
   列： 0=默认值  1=下限  2=上限  3=步进  4=改了通知哪个从站(2=本机参数不用下发) */
#define CFG_DEF   0
#define CFG_MIN   1
#define CFG_MAX   2
#define CFG_STP   3
#define CFG_WHO   4
code unsigned char CfgTab[CFG_N][5] = {
	{DEF_TEMPSET,  10,  40,  1, 0},      /* 0 风扇启动温度阈值 */
	{DEF_ARM,       0,   1,  1, 1},      /* 1 布防 */
	{DEF_ALARM_H,   0,  23,  1, 2},      /* 2 闹钟 时 */
	{DEF_ALARM_M,   0,  59,  1, 2},      /* 3 闹钟 分 */
	{DEF_NEARCM,   10, 200, 10, 1}       /* 4 接近提示阈值 cm */
};


/*==================================================================================================
 * 三、音乐
 *================================================================================================*/
#if (USE_SOUND)
/* 起床音乐：《小星星》开头一句 */
code unsigned char WakeSong[] = {
	0x21, 0x10,  0x21, 0x10,  0x25, 0x10,  0x25, 0x10,  0x26, 0x10,  0x26, 0x10,  0x25, 0x20,
	0x24, 0x10,  0x24, 0x10,  0x23, 0x10,  0x23, 0x10,  0x22, 0x10,  0x22, 0x10,  0x21, 0x20
};
/* 报警旋律：和节点C 用的是同一段，两块板响起来是一个声音 */
code unsigned char AlarmSong[] = {
	0x35, 0x08,  0x31, 0x08,  0x35, 0x08,  0x31, 0x08,
	0x35, 0x08,  0x31, 0x08,  0x35, 0x08,  0x31, 0x08
};
#endif


/*==================================================================================================
 * 四、变量
 *   Small 模式（MemoryModel = 0）下不加 xdata 的变量会挤进只有 128 字节的内部 data 区，
 *   BSP 库自己还占着一部分。所以缓冲区一律放 xdata，只有每 10mS 都要访问的小计数留在 data。
 *================================================================================================*/
xdata unsigned char ReqBuf[REQ_LEN];
xdata unsigned char RspBuf[RSP_LEN];

/* 从站应答的 12 字节数据区【原样】存下来，不逐字段拆包。
   [0] = 节点B(ENV)，[1] = 节点C(SEC)。取值时用 protocol.h 里的 D_ENV_xxx / D_SEC_xxx 当下标。 */
xdata unsigned char SlvD[2][12];

xdata unsigned char MissCnt[2];
xdata unsigned char CfgDirty[2];             /* 参数改过、还没成功下发给对应从站 */
xdata unsigned char CrcErr;                  /* CRC 错误计数，饱和到 255。诊断只关心"是不是 0、涨不涨" */

data unsigned char PollIdx;                  /* 当前在问哪个从站 0/1 */
data unsigned char PollState;                /* 0 发请求 / 1 等应答 / 2 间隔 */
data unsigned char PollTick;
data unsigned char RspReady;                 /* 接收回调置位，主状态机取用 */
data unsigned char OnlineMask;               /* bit0 = ENV 在线, bit1 = SEC 在线 */

code unsigned char SlaveAddr[2] = {ADDR_ENV, ADDR_SEC};

xdata struct_DS1302_RTC NowTime;
/* 上电默认时间：2026年9月1日 星期二 21:30:00（BCD 码）
   只有 DS1302 检测到掉电（第一次上电，或纽扣电池失效）时才会用它校时 */
code struct_DS1302_RTC InitTime = {0x00, 0x30, 0x21, 0x01, 0x09, 0x02, 0x26};

data unsigned char Th, Tm, Ts;               /* 当前时分秒（已转成十进制），每秒算一次共用 */
xdata unsigned char AlarmFired;              /* 本分钟闹钟已响过，防止一分钟内反复触发 */
xdata unsigned char Silenced;
xdata unsigned char SoundMode;               /* 0 无声 / 1 起床音乐 / 2 报警旋律 */

data unsigned char Page;                     /* 0 时钟 / 1 环境 / 2 安防 / 3 设置 / 4 系统 */
data unsigned char SelItem = 1;              /* 当前选中的设置项 1~5 */
data unsigned char Editing;                  /* 0 = 只是在看，1 = 上下键会改值 */
data unsigned char Blink;
data unsigned char BlinkDiv;
data unsigned char RtcDiv;
data unsigned char SaveStep;                 /* 0 = 空闲，1~7 = 正在写 EEPROM 第几个字节 */

xdata char D[8];                             /* 数码管 8 位显示缓冲 */

#if (USE_CURTAIN)
xdata unsigned char CurtainOpen = 1;
#endif

#if (USE_IRRX)
xdata unsigned char IrBuf[IR_LEN];
#endif

#if (USE_REPORT)
/*  上位机报文：固定模板 + 按位填数字。
    原来那套 PutC/PutS/PutU/PutT10 连字符串常量一起约 680 字节，这一版约 270。
    位置对照（下标从 0 数）：
        [00:00:00] T+000 L0 F000 D000 A0 O00 E000\r\n
         1  4  7      2  3    8   1     1   4  8
        1,2=时  4,5=分  7,8=秒   12=温度符号 13~15=温度(x10)
        18=光照档  21~23=风扇%  26~28=距离cm  31=报警等级
        34=节点B在线 35=节点C在线  38~40=CRC错误数                             */
#define REP_LEN  43                      /* 实际发出去的字节数，不含字符串结尾那个 NUL */
code char RepTmpl[REP_LEN + 1] = "[00:00:00] T+000 L0 F000 D000 A0 O00 E000\r\n";
xdata char Rep[REP_LEN];                 /* Rep 不需要 NUL：发送时长度是显式给 Uart1Print 的 */
#endif

#if (USE_FM)
xdata struct_FMRadio Fm;
#endif


/*==================================================================================================
 * 五、小工具
 *================================================================================================*/
unsigned char Bcd2Bin(unsigned char b)
{
	return (unsigned char)((b >> 4) * 10 + (b & 0x0F));
}

/* 把 v 拆成 n 位十进制填进 D[pos..]。只走 8 位除法——int 除法在 8051 上要调运行库，贵得多。
   只取低 n 位，所以显示计数时不用再写 % 100 */
void NumC(unsigned char pos, unsigned char v, unsigned char n)
{
	while(n--) { D[pos + n] = (char)(v % 10); v /= 10; }
}

/* 0~999 的值填进 D[pos..pos+2]。只用一次 int 除法把它降到 8 位，剩下交给 NumC */
void Num3(unsigned char pos, int v)
{
	if(v < 0)   v = 0;
	if(v > 999) v = 999;
	NumC(pos,     (unsigned char)(v / 100), 1);
	NumC(pos + 1, (unsigned char)(v % 100), 2);
}


/*==================================================================================================
 * 六、参数存取（M24C02）
 *
 *   开机读：先看幻数，再看校验和，再逐项查范围，三关都过才用存的值，否则退回出厂默认。
 *   这样第一次上电、或 EEPROM 被写乱时不会读出一堆乱参数把系统搞崩。
 *
 *   保存写：EEPROM 每写一个字节都要等它内部完成擦写（几毫秒），连着写 7 个就是几十毫秒，
 *   放在按键回调里一次写完必然打破 sys「单遍主循环小于 1mS」的约束。
 *   所以改成【一次 10mS 事件写一个字节】，7 次写完，全程不阻塞。
 *================================================================================================*/
void CfgLoad()
{
	unsigned char i, s, t[CFG_N];

	if(M24C02_Read(NVM_A_MAGIC) != NVM_MAGIC) return;    /* 没存过，用默认值 */

	s = 0;
	for(i = 0; i < CFG_N; i++)
	{
		t[i] = M24C02_Read((unsigned char)(NVM_A_TEMPSET + i));
		s = (unsigned char)(s + t[i]);
	}
	if(s != M24C02_Read(NVM_A_SUM)) return;              /* 校验和不对 */

	for(i = 0; i < CFG_N; i++)
		if(t[i] < CfgTab[i][CFG_MIN] || t[i] > CfgTab[i][CFG_MAX]) return;   /* 范围不对，双保险 */

	for(i = 0; i < CFG_N; i++) Cfg[i] = t[i];
}

/* 每调用一次写一个字节。步骤 1 写幻数，2~6 写五个参数，7 写校验和 */
void CfgSaveStep()
{
	unsigned char i, s;

	i = SaveStep;
	if(i == 1)
	{
		M24C02_Write(NVM_A_MAGIC, NVM_MAGIC);
	}
	else if(i <= CFG_N + 1)
	{
		M24C02_Write((unsigned char)(NVM_A_TEMPSET + i - 2), Cfg[i - 2]);
	}
	else
	{
		s = 0;
		for(i = 0; i < CFG_N; i++) s = (unsigned char)(s + Cfg[i]);
		M24C02_Write(NVM_A_SUM, s);
	}

	SaveStep++;
	if(SaveStep > CFG_N + 2)
	{
		SaveStep = 0;
		SetBeep(4000, 15);                   /* 写完"嘀"一长声，表示已保存 */
	}
}


/*==================================================================================================
 * 七、声音
 *================================================================================================*/
#if (USE_SOUND)
void StartSound(unsigned char mode)
{
	if(Silenced || SoundMode == mode) return;

	SoundMode = mode;
	if(mode == 1) SetMusic(100, 0xFC, WakeSong,  sizeof(WakeSong),  enumMscNull);
	else          SetMusic(200, 0xFC, AlarmSong, sizeof(AlarmSong), enumMscNull);
	SetPlayerMode(enumModePlay);
}

void StopSound()
{
	SoundMode = 0;
	SetPlayerMode(enumModeStop);
}
#else
	#define StartSound(m)   SetBeep(3000, 20)    /* 关掉音乐时退化成蜂鸣器短鸣 */
	#define StopSound()
#endif


/*==================================================================================================
 * 八、485 主站
 *================================================================================================*/

/* 组一帧请求并发出去。参数改过的从站优先下发配置，其余时候就是普通轮询 */
void SendReq(unsigned char idx)
{
	unsigned char addr = SlaveAddr[idx];
	unsigned int  crc;

	ReqBuf[F_ADDR]   = addr;
	ReqBuf[REQ_ARG0] = 0;
	ReqBuf[REQ_ARG1] = 0;
	ReqBuf[REQ_ARG2] = 0;
	ReqBuf[REQ_ARG3] = 0;

	if(CfgDirty[idx])
	{
		ReqBuf[F_FUNC] = FUNC_SETCFG;
		if(idx == 0)
		{
			ReqBuf[REQ_ARG0] = Cfg[CFG_TEMPSET];
		}
		else
		{
			ReqBuf[REQ_ARG0] = Cfg[CFG_ARM];
			ReqBuf[REQ_ARG1] = Cfg[CFG_NEARCM];
		}
	}
	else
	{
		ReqBuf[F_FUNC] = FUNC_POLL;
	}

	crc = Crc16Modbus(ReqBuf, REQ_LEN - 2);          /* 等价于 FrameSetCrc()，内联省一个函数 */
	ReqBuf[REQ_LEN - 2] = (unsigned char)(crc & 0x00FF);     /* ModBus 惯例：低字节在前 */
	ReqBuf[REQ_LEN - 1] = (unsigned char)(crc >> 8);
	Uart2Print(ReqBuf, REQ_LEN);
}

/* 解析一帧应答。CRC 已经在接收回调里验过了。
   这里不逐字段拆包，整块 12 字节存进 SlvD[idx][]，谁要用谁按下标取。 */
void HandleRsp()
{
	unsigned char idx, i;

	if     (RspBuf[F_ADDR] == ADDR_ENV) idx = 0;
	else if(RspBuf[F_ADDR] == ADDR_SEC) idx = 1;
	else return;                                     /* 地址不认识 */

	if(idx != PollIdx) return;                       /* 上一轮迟到的应答 */

	/* 数据区第 0 字节是节点类型，对不上说明对方程序不是我们想的那个 */
	if(RspBuf[RSP_DATA] != (idx ? NODE_TYPE_SEC : NODE_TYPE_ENV)) return;

	for(i = 0; i < 12; i++) SlvD[idx][i] = RspBuf[RSP_DATA + i];

	MissCnt[idx] = 0;
	OnlineMask  |= (unsigned char)(1 << idx);
	if(RspBuf[F_FUNC] == FUNC_SETCFG) CfgDirty[idx] = 0;   /* 从站确认收到配置了 */

	if(idx == 1)
	{
		if(SlvD[1][D_SEC_ALARM] >= ALM_ALARM) StartSound(2);

		/* 把布防状态同步回来（节点C 可能是被自己的 K3 键切换的，主控要跟上）。
		   两个坑：
		   1) 不能用 SECF_ARMED 判断——退出延时 ARMING 阶段这一位还是 0，
		      主控会在 10 秒倒计时里误显示"未布防"。要看状态机本身，只有 DISARMED 才算撤防。
		   2) CfgDirty[1] 没清零说明主控刚改过布防、命令还没送到，
		      这时不能拿从站的旧状态把用户刚设的值盖掉。 */
		if(!CfgDirty[1])
			Cfg[CFG_ARM] = (unsigned char)((SlvD[1][D_SEC_STATE] == SECST_DISARMED) ? 0 : 1);
	}
}

/* 收到一帧的回调。只验 CRC 和置标志，解析放到主状态机里做，回调要尽量短 */
void myUart2Rxd_callback()
{
	unsigned int crc = Crc16Modbus(RspBuf, RSP_LEN - 2);     /* 等价于 FrameCrcOk()，内联省一个函数 */

	if(RspBuf[RSP_LEN - 2] == (unsigned char)(crc & 0x00FF) &&
	   RspBuf[RSP_LEN - 1] == (unsigned char)(crc >> 8))
		RspReady = 1;
	else if(CrcErr < 255)
		CrcErr++;
}

/* 轮询状态机，挂在 10mS 事件上。
   全程非阻塞：发完就走，靠 PollTick 计时，不在这里等应答。
   485 是半双工的，发送时收不到数据，所以必须"发一个、等一个、再问下一个"。 */
void my10mS_callback()
{
	switch(PollState)
	{
	case 0:                                          /* 发请求 */
		if(GetUart2TxStatus() == enumUart2TxFree)
		{
			SendReq(PollIdx);
			PollTick  = 0;
			PollState = 1;
		}
		break;

	case 1:                                          /* 等应答 */
		if(RspReady)
		{
			RspReady = 0;
			HandleRsp();
			PollTick  = 0;
			PollState = 2;
		}
		else if(++PollTick >= POLL_TIMEOUT)
		{
			if(MissCnt[PollIdx] < OFFLINE_MISS) MissCnt[PollIdx]++;
			if(MissCnt[PollIdx] >= OFFLINE_MISS)
				OnlineMask &= (unsigned char)~(1 << PollIdx);
			PollTick  = 0;
			PollState = 2;
		}
		break;

	default:                                         /* 间隔，给总线留出方向切换时间 */
		if(++PollTick >= POLL_GAP)
		{
			PollIdx   = (unsigned char)(PollIdx ^ 1);
			PollState = 0;
		}
		break;
	}

	if(SaveStep) CfgSaveStep();                      /* 参数保存：一次 10mS 写一个字节 */
}


/*==================================================================================================
 * 九、显示
 *   五个页面共用一个 D[8] 缓冲，最后统一调用一次 Seg7Print。
 *   Seg7Print 有 8 个参数，C51 每个调用点都要一条条 MOV 传参，固定开销几十字节；
 *   原来每页各写一个调用点，光这个函数就 705 字节，占掉 2KB 额度的 34%。
 *================================================================================================*/
void Refresh()
{
	unsigned char i, led;
	int v;

	for(i = 0; i < 8; i++) D[i] = 10;        /* 先全灭，每页只填自己要显示的位 */

	switch(Page)
	{
	case 0:      /* 时钟：  HH-MM-SS  （DS1302 出来就是 BCD，除 16 取 16 余就是两位十进制） */
		D[0] = (char)(NowTime.hour   / 16); D[1] = (char)(NowTime.hour   % 16); D[2] = 12;
		D[3] = (char)(NowTime.minute / 16); D[4] = (char)(NowTime.minute % 16); D[5] = 12;
		D[6] = (char)(NowTime.second / 16); D[7] = (char)(NowTime.second % 16);
		break;

	case 1:      /* 环境：  -23.5 _ 040   温度来自节点B，右三位是风扇占空比 */
		if(!(OnlineMask & 0x01)) { for(i = 0; i < 8; i++) D[i] = 12; break; }   /* 离线显示全横杠 */
		v = GetI16(&SlvD[0][D_ENV_TEMP_H]);
		if(v < 0) { D[0] = 12; v = -v; }     /* 负号用 12 号字型（中横） */
		Num3(1, v);
		D[2] = (char)(D[2] + 16);            /* +16 = 这一位带小数点 */
		NumC(5, SlvD[0][D_ENV_FAN], 3);
		break;

	case 2:      /* 安防：  布防 _ 门 _ 报警 距离(3位)   数据来自节点C */
		if(!(OnlineMask & 0x02)) { for(i = 0; i < 8; i++) D[i] = 12; break; }
		D[0] = (char)((SlvD[1][D_SEC_FLAGS] & SECF_ARMED)     ? 1 : 0);
		D[2] = (char)((SlvD[1][D_SEC_FLAGS] & SECF_DOOR_OPEN) ? 1 : 0);
		D[4] = (char)SlvD[1][D_SEC_ALARM];
		Num3(5, GetI16(&SlvD[1][D_SEC_DIST_H]));
		break;

	case 3:      /* 设置：  项号 _ _ _ _ 值(3位)。编辑态下项号闪烁，一眼看出在不在改值 */
		D[0] = (char)((Editing && Blink) ? 10 : SelItem);
		NumC(5, Cfg[SelItem - 1], 3);
		break;

	default:     /* 系统：  B在线 C在线 _ B丢帧(2位) _ C丢帧(2位) */
		D[0] = (char)((OnlineMask & 0x01) ? 1 : 0);
		D[1] = (char)((OnlineMask & 0x02) ? 1 : 0);
		NumC(3, SlvD[0][D_ENV_MISS], 2);
		NumC(6, SlvD[1][D_SEC_MISS], 2);
		break;
	}

	Seg7Print(D[0], D[1], D[2], D[3], D[4], D[5], D[6], D[7]);   /* 全文件唯一一个调用点 */

	/* 状态灯只用 L0~L3，L4~L7 留给 LED 模拟的窗帘电机 */
	if(GetStepMotorStatus(CURTAIN_MOTOR) == enumStepMotorBusy) return;

	led = 0;
	if(OnlineMask & 0x01)                 led |= 0x01;   /* L0 节点B 在线 */
	if(OnlineMask & 0x02)                 led |= 0x02;   /* L1 节点C 在线 */
	if(Cfg[CFG_ARM])                      led |= 0x04;   /* L2 已布防 */
	if(SlvD[1][D_SEC_ALARM] >= ALM_ALARM) led |= 0x08;   /* L3 报警中 */
	LedPrint(led);
}


/*==================================================================================================
 * 十、跨节点联动：窗帘
 *   节点B 报上来的光照档位 + 本机 DS1302 的时间，共同决定窗帘开合。
 *   这是三块板真正"联"起来的地方：传感器在B，时间在A，执行器也在A。
 *================================================================================================*/
#if (USE_CURTAIN)
void UpdateCurtain()
{
	if(!(OnlineMask & 0x01)) return;                 /* 节点B 不在线就别乱动 */
	if(GetStepMotorStatus(CURTAIN_MOTOR) == enumStepMotorBusy) return;

	/* 天黑了（光照 <= 1档）且过了 22 点 -> 关窗帘 */
	if(CurtainOpen && SlvD[0][D_ENV_LUX] <= 1 && Th >= 22)
	{
		if(SetStepMotor(CURTAIN_MOTOR, CURTAIN_SPEED, -CURTAIN_STEPS) == enumSetStepMotorOK)
			CurtainOpen = 0;
	}
	/* 天亮了（光照 >= 3档）且在 6 点到 22 点之间 -> 开窗帘 */
	else if(!CurtainOpen && SlvD[0][D_ENV_LUX] >= 3 && Th >= 6 && Th < 22)
	{
		if(SetStepMotor(CURTAIN_MOTOR, CURTAIN_SPEED, CURTAIN_STEPS) == enumSetStepMotorOK)
			CurtainOpen = 1;
	}
}
#endif


/*==================================================================================================
 * 十一、上位机报文
 *   一行纯文本，电脑上用串口调试助手（9600, 8, N, 1）直接就能看懂，不用自己写解析程序。
 *   模板事先放在 Rep[] 里，每秒只把变化的那些位改成新数字，不重新拼字符串。
 *================================================================================================*/
#if (USE_REPORT)
/* 把 v 的低 n 位十进制以 ASCII 填进 Rep[pos..] */
void RepN(unsigned char pos, unsigned char v, unsigned char n)
{
	while(n--) { Rep[pos + n] = (char)('0' + v % 10); v /= 10; }
}

void SendReport()
{
	int v;

	if(GetUart1TxStatus() != enumUart1TxFree) return;    /* 上一行还没发完就跳过这次 */

	RepN(1, Th, 2);  RepN(4, Tm, 2);  RepN(7, Ts, 2);

	v = GetI16(&SlvD[0][D_ENV_TEMP_H]);                  /* 温度 x10，可能是负的 */
	Rep[12] = (char)((v < 0) ? '-' : '+');
	if(v < 0) v = -v;
	if(v > 999) v = 999;
	RepN(13, (unsigned char)(v / 100), 1);
	RepN(14, (unsigned char)(v % 100), 2);

	RepN(18, SlvD[0][D_ENV_LUX], 1);
	RepN(21, SlvD[0][D_ENV_FAN], 3);

	v = GetI16(&SlvD[1][D_SEC_DIST_H]);                  /* 距离，-1 表示还没有有效读数 */
	if(v < 0)   v = 0;
	if(v > 999) v = 999;
	RepN(26, (unsigned char)(v / 100), 1);
	RepN(27, (unsigned char)(v % 100), 2);

	RepN(31, SlvD[1][D_SEC_ALARM], 1);
	Rep[34] = (char)('0' + ((OnlineMask & 0x01) ? 1 : 0));
	Rep[35] = (char)('0' + ((OnlineMask & 0x02) ? 1 : 0));
	RepN(38, CrcErr, 3);

	Uart1Print(Rep, REP_LEN);
}
#endif


/*==================================================================================================
 * 十二、事件回调
 *================================================================================================*/

/* 100mS：读时钟、刷显示 */
void my100mS_callback()
{
	/* DS1302 是位操作时序读的，一次读走几百微秒。本节点回调本来就比另两块板重
	   （还要跑 485 轮询和上位机报文），所以降到 200mS 读一次——
	   秒位显示 1 秒才变一次，200mS 完全够用，白省一半的 DS1302 占用时间。 */
	if(++RtcDiv >= 2) { RtcDiv = 0; NowTime = RTC_Read(); }

	if(++BlinkDiv >= 3) { BlinkDiv = 0; Blink = (unsigned char)(!Blink); }   /* 约 1.7Hz 闪烁 */

	Refresh();
}

/* 1S：闹钟、窗帘、上位机报文、声音续播 */
void my1S_callback()
{
	Th = Bcd2Bin(NowTime.hour);
	Tm = Bcd2Bin(NowTime.minute);
	Ts = Bcd2Bin(NowTime.second);

	/* 闹钟：到点触发一次，本分钟内不再重复 */
	if(Th == Cfg[CFG_ALMH] && Tm == Cfg[CFG_ALMM] && Ts < 2)
	{
		if(!AlarmFired)
		{
			AlarmFired = 1;
			Silenced   = 0;
			StartSound(1);
#if (USE_FM)
			Fm.volume = FM_VOLUME;                   /* 到点把广播音量打开 */
			SetFMRadio(Fm);
#endif
		}
	}
	else if(Tm != Cfg[CFG_ALMM])
	{
		AlarmFired = 0;
	}

#if (USE_SOUND)
	/* 一遍放完接着放，直到消音：报警要一直响，起床音乐也一样 */
	if(SoundMode && !Silenced && GetPlayerMode() != enumModePlay)
	{
		unsigned char m = SoundMode;
		SoundMode = 0;                               /* 先清零，StartSound 才会重新设置 */
		StartSound(m);
	}
#endif

#if (USE_CURTAIN)
	UpdateCurtain();
#endif
#if (USE_REPORT)
	SendReport();
#endif
}

/* 红外接收：节点C 发来的指令 */
#if (USE_IRRX)
void myIrRxd_callback()
{
	if(GetIrRxNum() < IR_LEN) return;
	if(IrBuf[0] != IR_HDR)    return;
	if(IrBuf[2] != (unsigned char)(IR_HDR ^ IrBuf[1] ^ 0xFF)) return;   /* 校验字节不对 */

	switch(IrBuf[1])
	{
	case IR_CMD_TOGGLE_ARM:
		Cfg[CFG_ARM] = (unsigned char)(!Cfg[CFG_ARM]);
		CfgDirty[1]  = 1;                            /* 下一轮轮询时下发给节点C */
		SetBeep(3000, 10);
		break;

	case IR_CMD_ALARM:
		SlvD[1][D_SEC_ALARM] = ALM_ALARM;
		StartSound(2);
		break;

	case IR_CMD_SILENCE:
		Silenced = 1;
		StopSound();
		break;

	default:
		break;
	}
}
#endif

/* 按键 */
void myKey_callback()
{
	if(GetKeyAct(enumKey1) == enumKeyPress)          /* Key1 保存参数到 M24C02 */
	{
		if(SaveStep == 0)
		{
			SaveStep = 1;                            /* 交给 10mS 回调分步写，这里立刻返回 */
			SetBeep(3000, 5);
		}
	}

	if(GetKeyAct(enumKey2) == enumKeyPress)          /* Key2 切换布防，下一轮轮询下发给节点C */
	{
		Cfg[CFG_ARM] = (unsigned char)(!Cfg[CFG_ARM]);
		CfgDirty[1]  = 1;
		SetBeep(2000, 10);
	}
}

/* 摇杆。注意 K3 与摇杆共用 P1.7，初始化 ADC 之后 K3 只能从 GetAdcNavAct 读，
   用 GetKeyAct(enumKey3) 读不到——adc.h 里明确写了这一点 */
void myNav_callback()
{
	unsigned char i, up;

	if(GetAdcNavAct(enumAdcNavKey3) == enumKeyPress)         /* K3 消音 */
	{
		Silenced = 1;
		StopSound();
		SetBeep(1500, 5);
		return;
	}

	if(GetAdcNavAct(enumAdcNavKeyCenter) == enumKeyPress)    /* 中心键：进设置页 / 进出编辑 */
	{
		if(Page == 3) Editing = (unsigned char)(!Editing);
		else        { Page = 3; Editing = 0; }
		SetBeep(3000, 5);
		return;
	}

	/* 编辑态下左右换项，非编辑态下左右换页 */
	if(GetAdcNavAct(enumAdcNavKeyRight) == enumKeyPress)
	{
		if(Editing) { SelItem++; if(SelItem > CFG_N) SelItem = 1; }
		else        { Page++;    if(Page > 4)        Page = 0;    }
	}
	if(GetAdcNavAct(enumAdcNavKeyLeft) == enumKeyPress)
	{
		if(Editing) { SelItem--; if(SelItem < 1) SelItem = CFG_N; }
		else        { if(Page == 0) Page = 4; else Page--;        }
	}

	if(!Editing) return;                                     /* 不在编辑态，上下键不改数 */

	up = 0;
	if(GetAdcNavAct(enumAdcNavKeyUp)   == enumKeyPress) up = 1;
	else if(GetAdcNavAct(enumAdcNavKeyDown) != enumKeyPress) return;

	/* 加减、限幅、以及"要不要通知从站"全查表，不写五分支 switch */
	i = (unsigned char)(SelItem - 1);
	if(up) { if(Cfg[i] + CfgTab[i][CFG_STP] <= CfgTab[i][CFG_MAX])
	             Cfg[i] = (unsigned char)(Cfg[i] + CfgTab[i][CFG_STP]); }
	else   { if(Cfg[i] >= (unsigned char)(CfgTab[i][CFG_MIN] + CfgTab[i][CFG_STP]))
	             Cfg[i] = (unsigned char)(Cfg[i] - CfgTab[i][CFG_STP]); }

	if(CfgTab[i][CFG_WHO] < 2) CfgDirty[CfgTab[i][CFG_WHO]] = 1;
	SetBeep(up ? 3500 : 2500, 3);
}


/*==================================================================================================
 * 十三、主函数
 *================================================================================================*/
void main()
{
	unsigned char i;

	DisplayerInit();
	SetDisplayerArea(0, 7);
	KeyInit();
	BeepInit();                              /* 必须在 MusicPlayerInit 之前 */
#if (USE_SOUND)
	MusicPlayerInit();
#endif
	StepMotorInit();

	AdcInit(ADCexpEXT);                      /* 摇杆 Nav 正常工作，同时把 EXT 的 P1.0/P1.1 让出来 */
#if (USE_ENCODER)
	EXTInit(enumEXTDecode);
#endif

	DS1302Init(InitTime);                    /* 只有 DS1302 检测到掉电时才会用 InitTime 校时 */
	NowTime = RTC_Read();

	for(i = 0; i < CFG_N; i++) Cfg[i] = CfgTab[i][CFG_DEF];
	CfgLoad();                               /* 读参数。放在 MySTC_Init 之前，此时调度器还没跑，
	                                            连着读 7 个字节不受 1mS 约束限制 */
	CfgDirty[0] = 1;                         /* 开机把参数各下发一次，让从站与主控一致 */
	CfgDirty[1] = 1;

	SlvD[1][D_SEC_DIST_H] = 0xFF;            /* 距离初值 -1，表示还没有有效读数 */
	SlvD[1][D_SEC_DIST_L] = 0xFF;

#if (USE_REPORT)
	for(i = 0; i < REP_LEN; i++) Rep[i] = RepTmpl[i];
#endif

#if (USE_FM)
	Fm.frequency = FM_FREQ;
	Fm.volume    = 0;                        /* 上电静音，闹钟到点才开声 */
	Fm.GP1 = 1;  Fm.GP2 = 1;  Fm.GP3 = 1;
	FMRadioInit(Fm);
#endif

	Uart1Init(UART1_BAUD);                   /* USB 口，接电脑串口调试助手 */

#if (BUS_USE_MODBUS)
	Uart2Init(BUS_BAUD, Uart2Usedfor485ModBus);
#else
	Uart2Init(BUS_BAUD, Uart2Usedfor485);
#endif
	/* 主站要收两个不同地址的应答，所以不做包头匹配；收到后先验 CRC，再在 HandleRsp 里认地址 */
	SetUart2Rxd(RspBuf, RSP_LEN, 0, 0);

#if (USE_IRRX)
	IrInit(NEC_R05d);
	SetIrRxd(IrBuf, IR_LEN);
#endif

	SetEventCallBack(enumEventSys10mS,  my10mS_callback);
	SetEventCallBack(enumEventSys100mS, my100mS_callback);
	SetEventCallBack(enumEventSys1S,    my1S_callback);
	SetEventCallBack(enumEventKey,      myKey_callback);
	SetEventCallBack(enumEventNav,      myNav_callback);
#if (USE_IRRX)
	SetEventCallBack(enumEventIrRxd,    myIrRxd_callback);
#endif
	SetEventCallBack(enumEventUart2Rxd, myUart2Rxd_callback);

	MySTC_Init();
	while(1)
	{
		MySTC_OS();
	}
}


/**************************************************************************************************
 * 编译不过怎么办
 *
 *   看链接输出这一行：
 *       RESTRICTED VERSION WITH 0800H BYTE CODE SIZE LIMIT; USED: xxxxH BYTE (yy%)
 *   yy < 100 就正常。超了会报 FATAL ERROR L250，不生成 hex。
 *   按下面顺序关，每关一个重新编译看一次百分比：
 *       USE_CURTAIN 0  (省约 120)  -> 失去三板联动演示，最后再开
 *       USE_FM      0  (省约  60)
 *       USE_ENCODER 0  (省约  50)
 *       USE_SOUND   0  (省约 130)  -> 退化成蜂鸣器短鸣，节点C 那边照样会响警笛
 *       USE_REPORT  0  (省约 270)  -> 最后的手段，会丢掉 uart1 上位机这个模块
 *
 * 验证步骤
 *
 * L1 单板（不接总线）
 *   1. 下载后数码管显示时钟「21-30-0x」并走字。摇杆左右翻页，环境页和安防页应显示全横杠
 *      （节点B、C 还没接，判为离线，这是对的）。
 *   2. 摇杆中心键进设置页，再按一次进入编辑（项号闪烁），左右换项、上下改值。
 *      五项依次是：1 温度阈值 / 2 布防 / 3 闹钟时 / 4 闹钟分 / 5 接近阈值。
 *   3. 按 Key1 保存，约 70mS 后"嘀"一长声。断电重新上电，参数应还在。
 *      再拔掉板上纽扣电池断电重启，DS1302 会掉电重置为 21:30:00，M24C02 里的参数则不受影响——
 *      这一步正好把两种非易失存储的区别演示清楚。
 *   4. 电脑连 USB，串口调试助手设 9600, 8, N, 1，应每秒收到一行：
 *          [21:30:05] T+000 L0 F000 D000 A0 O00 E000
 *      两个从站都没接，所以 O 后面是 00、数据都是 0。
 *
 * L2 接总线
 *   5. 三块板 485 的 A-A、B-B、GND-GND 接好，先只接节点B。系统页第 1 位应变成 1，
 *      环境页出现真实温度，报文里 O 变成 10。再接上节点C，变成 11。
 *   6. 在设置页把「项2 布防」改成 1，节点C 应在几百毫秒内进入布防倒计时——
 *      这条走通就说明主站下发配置的通路是好的。
 *   7. 报文里的 E 应长期保持 000。持续增长说明总线有问题：
 *      先把 protocol.h 里的 BUS_BAUD 降到 1200，三块板一起重新编译下载再试；
 *      还不行就把 BUS_USE_MODBUS 改成 0，换成按固定长度断帧。
 *
 * 常见问题
 *   - 数码管全灭：SysClock 与 stc-isp 下载时选的频率不一致，最常见的原因。
 *   - 时间不走：DS1302 的 32768Hz 晶体虚焊，或纽扣电池座没焊好。
 *   - 从站一直离线：先确认三块板的 BUS_BAUD 和 BUS_USE_MODBUS 完全一致（改了要三块都重新下载），
 *     再查 485 的 A / B 是不是接反了。
 *   - 报文乱码：串口助手的波特率没设成 9600。
 **************************************************************************************************/
