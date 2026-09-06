/**************************************************************************************************
 * 「寝室管家」节点B —— 环境节点（窗台）      485 地址 0x02
 *
 *   职责：测温测光 -> 通风降温闭环 -> 按 ModBus 帧应答主站轮询
 *
 *   用到的模块：sys / displayer / Key / adc(Rt 热敏, Rop 光敏) / Beep / uart2(485 从站)
 *               EXT(PWM 驱动直流电机风扇) / StepMotor(通风窗)
 *
 *   接口占用：
 *       Uart2  -> 485 接口（A / B / GND 接总线）
 *       EXT    -> PWM 输出，外接直流电机（风扇）
 *       SM     -> 步进电机（通风窗）。借不到实物时用 L4~L7 四个 LED 模拟，见 WINDOW_MOTOR
 *
 *   两个必须注意的地方：
 *   1. AdcInit 必须用 ADCexpEXT 而不是 ADCincEXT。
 *      ADCincEXT 会把 EXT 上的 P1.0 / P1.1 当作 ADC 通道占用，EXT 就腾不出来接 PWM 了。
 *      用 ADCexpEXT 时热敏 Rt、光敏 Rop、摇杆 Nav 照常工作，EXT 让给 PWM。
 *   2. 温度换算【没有】用 math.h 的 log()。
 *      浮点 log() 在 11.0592MHz 的 8051 上要跑好几毫秒，而 sys.H 要求单遍主循环累计小于 1mS，
 *      放在回调里会造成 PollingMisses。这里改成整数查表 + 线性插值，几十微秒就算完，
 *      在 ADC 200~760（约 0~50 摄氏度）区间内与浮点公式的实测最大偏差 0.20 摄氏度，且全程单调。
 *
 * 负责人：成员2        日期：待填
 **************************************************************************************************/
#include "STC15F2K60S2.H"
#include "sys.H"
#include "displayer.H"
#include "Key.H"
#include "adc.H"
#include "Beep.H"
#include "uart2.H"
#include "uart1.H"        /* 新增：直连 PC 上报，单板打通上下位机用 */
#include "EXT.H"
#include "StepMotor.H"
#define PROTO_NO_GETI16   1        /* 本节点只往总线上打包数据，用不到 GetI16，掐掉省代码 */
#include "protocol.h"

code unsigned long SysClock = 11059200;      /* 必须与 stc-isp 下载时选的工作频率一致 */

#ifdef _displayer_H_
code char decode_table[] = {0x3f, 0x06, 0x5b, 0x4f, 0x66, 0x6d, 0x7d, 0x07, 0x7f, 0x6f, 0x00, 0x08, 0x40, 0x01, 0x41, 0x48,
	/* 序号:  0    1    2    3    4    5    6    7    8    9   10   11   12   13   14   15  */
	/* 字型:  0    1    2    3    4    5    6    7    8    9   灭   下横 中横 上横 上中 中下 */
	0x3f|0x80, 0x06|0x80, 0x5b|0x80, 0x4f|0x80, 0x66|0x80, 0x6d|0x80, 0x7d|0x80, 0x07|0x80, 0x7f|0x80, 0x6f|0x80};
	/* 序号 16~25：带小数点的 0~9 */
#endif


/*==================================================================================================
 * 零、单板直连 PC 上报（新增）
 *
 *   背景：温度传感器在本节点，但 USB 口原本只有 NodeA 在用。只有一块板时，
 *   NodeB -> 485 -> NodeA -> USB -> PC 这条正常链路走不通（没有 NodeA）。
 *
 *   做法：本节点的 Uart1（USB）原本完全空着，这里让它直接发 NodeA 那套 43 字节文本报文。
 *   格式【完全一致】，所以 PC 上位机不用改一行代码就能解析和显示。
 *
 *       [HH:MM:SS] T+235 L2 F040 D000 A0 O10 E000\r\n
 *
 *   字段填法（诚实原则：没有的就填代表"没有"的值，不编造）：
 *       时间   -> 本节点没有 DS1302，填【上电后的运行时长】，不是墙上时间
 *       温度   -> 真实值 Temp10
 *       光照   -> 真实值 LuxLevel
 *       风扇   -> 真实值 FanDuty
 *       距离   -> 000，且 O 的第二位填 0 表示节点C 不在，PC 侧会显示"未知"
 *       报警   -> 0
 *       O10    -> 第一位 1 = 本节点(环境)在线，第二位 0 = 安防节点不在
 *       E000   -> 单板时总线上没有通信，恒为 0
 *
 *   接上 NodeA 组网之后，把 USE_PC_REPORT 改回 0 即可，两块板不会同时抢 USB。
 *================================================================================================*/
#define USE_PC_REPORT       1           /* 1 = 单板直连 PC；组网后改 0 */
#define PC_UART1_BAUD       9600        /* 必须与上位机 .env 里的 SERIAL_BAUD 一致 */


/*==================================================================================================
 * 一、可调参数
 *================================================================================================*/

/* 通风窗用哪台步进电机
     enumStepMotor1 —— SM 口上的真实步进电机（借到实物时用这个）
     enumStepMotor3 —— 用 L4~L7 四个 LED 模拟一台四相步进电机（借不到时的替代预案）
   选 enumStepMotor3 而不是 enumStepMotor2，是为了把 L0~L3 留给状态指示灯       */
#define WINDOW_MOTOR        enumStepMotor3

#define WINDOW_SPEED        20          /* 步进速度 步/秒 */
#define WINDOW_STEPS        64          /* 开窗 / 关窗各转多少步 */

/* 光敏电阻 GL5516 的档位阈值（原始 10bit ADC 值）
   ！！这五个数【必须实测】，下面是占位值，直接用一定不准。
   标定办法（约 2 分钟）：下载后按 Key1 翻到「标定页2」看 Rop 原始值，
     全亮(手电照) / 室内开灯 / 正常 / 用手遮住 / 完全盖住   五种情况各记一个数，
     取相邻两档的中点填进来。同时确认方向：手遮住时数值是变大还是变小？
     变小 -> LUX_BRIGHT_IS_HIGH 填 1；变大 -> 填 0。                                  */
/* ---- 以下五个数已按实测标定，不再是占位值 ----------------------------------
   标定日期 2026-09-05，方法：NodeB 直连 PC，固件每秒上报一行 CAL 行（原始 ADC），
   上位机记录 244 个采样点，覆盖「手心盖住 / 遮挡 / 正常室内 / 开灯 / 手电直照」。

   实测结论：
       手心完全盖住      ADC  29 ~  45
       手在上方遮挡      ADC  80 ~  99
       正常室内光照      ADC 100 ~ 119    <- 主峰，177/244 个样本
       较亮              ADC 130 ~ 180
       手电筒直照        ADC 180 ~ 236

   ！！关键发现：本电路的光敏分压实际只在 29~236 之间摆动，不是满量程 0~1023。
   旧的占位阈值 150/350/600/850 是按满量程假设写的，导致：
       - 正常室内光照(107) 落在 150 以下，被判成 0 档「很暗」
       - 档 2/3/4 需要 ADC > 350，本电路永远达不到，是三个死档
   实测中 98% 的样本被判为 0 档，光照分档形同虚设。

   下面的阈值取相邻两档实测区间的中点，全部落在真实动态范围内。
   换了不同批次的 GL5516 或改了分压电阻后，需要重新跑一次
   tools/标定-光敏.py 并更新这五个数。
   ------------------------------------------------------------------------- */
#define LUX_BRIGHT_IS_HIGH  1           /* 实测：盖住 29，手电 236 -> 越亮 ADC 越大 */
#define LUX_TH0             55          /* 档0/档1 分界：盖住(29~45) 与 遮挡(80~99) 之间 */
#define LUX_TH1             95          /* 档1/档2 分界：遮挡 与 正常室内(100~119) 之间 */
#define LUX_TH2             130         /* 档2/档3 分界：正常 与 较亮 之间 */
#define LUX_TH3             180         /* 档3/档4 分界：较亮 与 手电直照(180~236) 之间 */

#define LUX_LOW_LEVEL       1           /* 档位 <= 这个值就置「光线过暗」标志 */


/*==================================================================================================
 * 二、NTC 热敏电阻温度查表
 *
 *   板上分压电路：VCC - R_SERIES(固定电阻) - 采样点 - Rt(NTC) - GND
 *       Rt = R_SERIES * adc / (1023 - adc)
 *       1/T = 1/T0 + ln(Rt/R0)/B      （B 值公式，Steinhart 简化式）
 *   参数：R0 = 10K @25 摄氏度，B = 3950，R_SERIES 取 13K
 *
 *   下表是把上面两式在 adc = 0, 32, 64 ... 1023 共 33 个点上算好的【温度 x10】。
 *   运行时用 adc>>5 定位、adc&31 做线性插值，全整数运算。
 *
 *   ！！R_SERIES = 13K 是 hw5-0 第8题里按「室温 22 摄氏度实测 adc.Rt = 465」反推出来的近似值，
 *   代回本表得 23.2 摄氏度，还差 1 摄氏度左右。成员2 的标定实验就是要把这个差消掉：
 *   用温度计在【室温 / 手捂 / 温水杯】三个点各记一次 (adc, 实际温度)，
 *   如果实测普遍比显示高，说明 R_SERIES 取小了，调大几百欧再重算本表（重算脚本见报告附录）。
 *================================================================================================*/
code int NtcTable[33] = {
	  1990,   1188,    925,    782,    684,    609,    548,    496,
	   451,    410,    373,    339,    307,    276,    247,    219,
	   192,    165,    138,    112,     85,     58,     30,      2,
	   -28,    -60,    -95,   -133,   -177,   -230,   -298,   -405,
	  -799
};


/*==================================================================================================
 * 三、变量
 *   注意：本工程是 Keil 的 Small 模式（MemoryModel = 0），不加 xdata 的变量会挤进只有 128 字节的
 *   内部 data 区，BSP 库自己还要占一部分，很容易放不下。所以缓冲区和状态量一律显式放 xdata。
 *================================================================================================*/
xdata unsigned char ReqBuf[REQ_LEN];         /* 485 接收缓冲：主站发来的请求 */
xdata unsigned char RspBuf[RSP_LEN];         /* 485 发送缓冲：给主站的应答 */

xdata int  Temp10;                           /* 当前温度 x10，如 235 = 23.5 摄氏度 */
xdata unsigned int RawRt;                    /* 热敏电阻原始 ADC */
xdata unsigned int RawRop;                   /* 光敏电阻原始 ADC */
xdata unsigned char LuxLevel;                /* 光照档位 0~4 */
xdata unsigned char FanDuty;                 /* 风扇当前占空比 0~100 */
xdata unsigned char WinOpen;                 /* 通风窗状态 0 关 / 1 开 */

xdata unsigned char CfgTempSet = DEF_TEMPSET;/* 风扇启动温度阈值，主站可下发覆盖 */
xdata unsigned char FanManual  = 255;        /* 255 = 自动；0~100 = 主站强制指定占空比 */

xdata unsigned int  RxOkCount;               /* 收到并通过 CRC 的请求帧数 */
xdata unsigned int  RxErrCount;              /* CRC 错误帧数 */
xdata unsigned char PollMiss;                /* 每秒轮询丢失数，反映 1mS 约束有没有被破坏 */

data unsigned char Page;                     /* 当前显示页 0~3 */
data unsigned char AdcDiv;                   /* 100mS 回调里的分频计数 */

#if (!BUS_USE_MODBUS)
code unsigned char MyAddr = ADDR_ENV;        /* 只有非 ModBus 模式才用得上，做包头匹配 */
#endif


/*==================================================================================================
 * 四、温度换算：查表 + 线性插值
 *================================================================================================*/
int AdcToTemp10(unsigned int adc)
{
	unsigned char idx;
	unsigned char frac;
	int lo, hi;

	if(adc > 1023) adc = 1023;

	idx  = (unsigned char)(adc >> 5);        /* 落在第几个区间，0~31 */
	frac = (unsigned char)(adc & 0x001F);    /* 区间内的位置，0~31 */

	lo = NtcTable[idx];
	hi = NtcTable[idx + 1];                  /* 表有 33 项，idx 最大 31，这里不会越界 */

	/* lo + (hi - lo) * frac / 32
	   用除法而不是 >>5：(hi - lo) 在高温段是负数，对负数做右移是实现相关行为，除法才确定。
	   全程用 int 不用 long：表里相邻两项最大差值是 802（第 0 格），802*31 = 24862 < 32767，
	   不会溢出。改掉 long 是因为 C51 的 32 位乘除要调运行库，白花几十字节。 */
	return lo + (int)(((int)(hi - lo) * (int)frac) / 32);
}


/*==================================================================================================
 * 五、光照档位
 *================================================================================================*/
unsigned char AdcToLux(unsigned int adc)
{
	unsigned char lv;

	if     (adc < LUX_TH0) lv = 0;
	else if(adc < LUX_TH1) lv = 1;
	else if(adc < LUX_TH2) lv = 2;
	else if(adc < LUX_TH3) lv = 3;
	else                   lv = 4;

#if (LUX_BRIGHT_IS_HIGH == 0)
	lv = 4 - lv;                             /* ADC 越大越暗时把档位反过来 */
#endif
	return lv;
}


/*==================================================================================================
 * 六、执行器控制
 *================================================================================================*/

/* 风扇：低于阈值不转；到达阈值后从 30% 起步，每高 1 摄氏度加 7%，最高 100%。
   关风扇要比开风扇低 1 摄氏度才动作（回差），否则温度在阈值附近抖动时风扇会一直开开关关。 */
void UpdateFan()
{
	int over;
	unsigned char duty;

	if(FanManual <= 100)                     /* 主站强制指定了占空比，直接照做 */
	{
		duty = FanManual;
	}
	else
	{
		over = Temp10 - (int)CfgTempSet * 10;

		if(FanDuty == 0)
		{
			duty = (over >= 0) ? 30 : 0;                 /* 没转时：到阈值才起转 */
		}
		else
		{
			duty = (over >= -10) ? 30 : 0;               /* 转着时：低于阈值 1 摄氏度才停 */
		}

		if(duty != 0 && over > 0)
		{
			int add = (over * 7) / 10;                   /* 每高 1 摄氏度加 7% */
			if(add > 70) add = 70;
			duty = (unsigned char)(30 + add);
		}
	}

	if(duty != FanDuty)
	{
		FanDuty = duty;
		SetPWM(FanDuty, 100, 0, 100);        /* PWM1 单向驱动风扇，100Hz；PWM2 给 0 表示不反转 */
	}
}

/* 通风窗：高于阈值 +3 摄氏度开窗，低于阈值 -1 摄氏度关窗。同样带回差。
   电机正在转时不重复下命令，否则 SetStepMotor 会返回 enumSetStepMotorFail。 */
void UpdateWindow()
{
	int over = Temp10 - (int)CfgTempSet * 10;

	if(GetStepMotorStatus(WINDOW_MOTOR) == enumStepMotorBusy) return;

	if(WinOpen == 0 && over >= 30)
	{
		if(SetStepMotor(WINDOW_MOTOR, WINDOW_SPEED, WINDOW_STEPS) == enumSetStepMotorOK)
			WinOpen = 1;
	}
	else if(WinOpen == 1 && over <= -10)
	{
		if(SetStepMotor(WINDOW_MOTOR, WINDOW_SPEED, -WINDOW_STEPS) == enumSetStepMotorOK)
			WinOpen = 0;
	}
}


/*==================================================================================================
 * 七、485 从站：组应答帧
 *================================================================================================*/
void BuildRsp(unsigned char func)
{
	unsigned char flags = 0;

	if(FanDuty > 0)                 flags |= ENVF_FAN_ON;
	if(WinOpen)                     flags |= ENVF_WIN_OPEN;
	if(Temp10 >= (int)CfgTempSet * 10) flags |= ENVF_TEMP_HI;
	if(LuxLevel <= LUX_LOW_LEVEL)   flags |= ENVF_LUX_LOW;

	RspBuf[F_ADDR] = ADDR_ENV;
	RspBuf[F_FUNC] = func;

	RspBuf[RSP_DATA + D_ENV_TYPE ] = NODE_TYPE_ENV;
	RspBuf[RSP_DATA + D_ENV_FLAGS] = flags;
	PutI16(&RspBuf[RSP_DATA + D_ENV_TEMP_H], Temp10);
	RspBuf[RSP_DATA + D_ENV_LUX  ] = LuxLevel;
	RspBuf[RSP_DATA + D_ENV_FAN  ] = FanDuty;
	PutI16(&RspBuf[RSP_DATA + D_ENV_RAWRT_H ], (int)RawRt);
	PutI16(&RspBuf[RSP_DATA + D_ENV_RAWROP_H], (int)RawRop);
	RspBuf[RSP_DATA + D_ENV_MISS ] = PollMiss;
	RspBuf[RSP_DATA + D_ENV_RSV  ] = 0;

	FrameSetCrc(RspBuf, RSP_LEN);
}

/*--------------------------------------------------------------------------------------------------
 * 485 收到一帧的回调
 *   这个函数必须跑得很快（sys 要求单遍循环累计 < 1mS）。
 *   Uart2Print 是非阻塞的，调用到返回大约 1uS，所以在回调里直接发应答是安全的。
 *------------------------------------------------------------------------------------------------*/
void myUart2Rxd_callback()
{
	if(ReqBuf[F_ADDR] != ADDR_ENV) return;               /* 不是发给我的，忽略 */

	if(!FrameCrcOk(ReqBuf, REQ_LEN))                     /* CRC 自己校验，BSP 不做 */
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
		if(ReqBuf[REQ_ARG0] >= 10 && ReqBuf[REQ_ARG0] <= 40)   /* 参数合法性检查，别把乱数收进来 */
			CfgTempSet = ReqBuf[REQ_ARG0];
		BuildRsp(FUNC_SETCFG);
		Uart2Print(RspBuf, RSP_LEN);
		break;

	case FUNC_ACT:
		FanManual = ReqBuf[REQ_ARG0];        /* 0~100 强制占空比，255 交回自动 */
		UpdateFan();
		BuildRsp(FUNC_ACT);
		Uart2Print(RspBuf, RSP_LEN);
		break;

	default:
		break;                               /* 不认识的功能码不应答，让主站超时 */
	}
}


/*==================================================================================================
 * 八、显示
 *
 *   ！！这里的写法是为了省代码空间，不是为了好看。
 *   最早的版本每页各写一个 Seg7Print(8个参数) 调用，编译出来 483 字节，
 *   占掉 Keil Eval 版 2KB 用户代码额度的 24%，是全文件最大的一个函数。原因有两个：
 *     1) Seg7Print 有 8 个参数，C51 传参要一条条 MOV，每个调用点固定几十字节，四页就是四份；
 *     2) 每位数字都写成 v/100%10 这种，int 的除法和取模在 8051 上都是调用运行库，一页就好几次。
 *   改成"先往 D[8] 缓冲区里填，最后统一调用一次 Seg7Print"，调用点从 4 个变 1 个；
 *   再把能用 unsigned char 的量走 8 位除法（比 int 除法便宜得多）。
 *================================================================================================*/
xdata char D[8];                             /* 数码管 8 位显示缓冲 */

/* 把 v 拆成 n 位十进制填进 D[pos..pos+n-1]。8 位版本，用于 0~255 的量 */
void NumC(unsigned char pos, unsigned char v, unsigned char n)
{
	while(n--) { D[pos + n] = (char)(v % 10); v /= 10; }
}

/* 16 位版本，只在必须的地方用（原始 ADC 最大 1023）。
   注意 n 位只取低 n 位十进制，所以显示帧计数时不用再写 % 100 */
void NumI(unsigned char pos, unsigned int v, unsigned char n)
{
	while(n--) { D[pos + n] = (char)(v % 10); v /= 10; }
}

void Refresh()
{
	unsigned char i, led;
	int t;

	for(i = 0; i < 8; i++) D[i] = 10;        /* 先全灭，每页只填自己要显示的位 */

	switch(Page)
	{
	case 0:      /* 运行页：  -23.5 _ 040    左四位温度，右三位风扇占空比 */
		t = Temp10;
		if(t < 0) { D[0] = 12; t = -t; }     /* 负号用 12 号字型（中横） */
		if(t > 999) t = 999;                 /* 最多显示 99.9 */
		NumI(1, (unsigned int)t, 3);
		D[2] = (char)(D[2] + 16);            /* +16 = 这一位带小数点 */
		NumC(5, FanDuty, 3);
		break;

	case 1:      /* 标定页1：  1 _ _ _ 0465   右四位是热敏电阻原始 ADC */
		D[0] = 1;
		NumI(4, RawRt, 4);
		break;

	case 2:      /* 标定页2：  2 _ 3 _ 0712   第3位是光照档位，右四位是光敏原始 ADC */
		D[0] = 2;
		D[2] = (char)LuxLevel;
		NumI(4, RawRop, 4);
		break;

	default:     /* 通信页：  3 _ 收到帧数(低2位) _ _ CRC错误数(低2位) */
		D[0] = 3;
		NumI(2, RxOkCount,  2);
		NumI(6, RxErrCount, 2);
		break;
	}

	Seg7Print(D[0], D[1], D[2], D[3], D[4], D[5], D[6], D[7]);   /* 全文件唯一一个调用点 */

	/* 状态灯只用 L0~L3，L4~L7 让给 LED 模拟的步进电机。
	   电机正在转时不刷 LED，否则会把电机的相位输出覆盖掉。 */
	if(GetStepMotorStatus(WINDOW_MOTOR) == enumStepMotorBusy) return;

	led = 0;
	if(FanDuty > 0)                       led |= 0x01;   /* L0 风扇在转 */
	if(WinOpen)                           led |= 0x02;   /* L1 窗开着 */
	if(Temp10 >= (int)CfgTempSet * 10)    led |= 0x04;   /* L2 高温 */
	if(LuxLevel <= LUX_LOW_LEVEL)         led |= 0x08;   /* L3 光线暗 */
	LedPrint(led);
}


/*==================================================================================================
 * 九、事件回调
 *================================================================================================*/

/* 100mS：采集 + 控制 + 显示 */
#if (USE_PC_REPORT)
/* SendCal() 定义在下面的 USE_PC_REPORT 段里，这里先前置声明。
   CalDiv 用来把标定行错开到主报文之后 500mS 发，避免两次 Uart1Print 撞车。 */
void SendCal();
xdata unsigned char CalDiv;
#endif

void my100mS_callback()
{
	struct_ADC adc;

	adc = GetADC();
	RawRt  = adc.Rt;
	RawRop = adc.Rop;

	if(RawRt < 1)    RawRt = 1;              /* 防止查表两端出现除零那种极端值 */
	if(RawRt > 1022) RawRt = 1022;

	Temp10   = AdcToTemp10(RawRt);
	LuxLevel = AdcToLux(RawRop);

	AdcDiv++;
	if(AdcDiv >= 5)                          /* 执行器每 500mS 更新一次就够了，别让电机抖 */
	{
		AdcDiv = 0;
		UpdateFan();
		UpdateWindow();
	}

	Refresh();

#if (USE_PC_REPORT)
	/* 每 10 个 100mS 走一轮，在第 5 个（即整秒后约 500mS）发标定行。
	   主报文由 1S 回调发，两者错开半秒，串口不会忙。 */
	if(++CalDiv >= 10) CalDiv = 0;
	if(CalDiv == 5)    SendCal();
#endif
}

#if (USE_PC_REPORT)
/*==================================================================================================
 * 直连 PC 的报文
 *   模板事先放进 Rep[]，每秒只改变化的那几位，不重新拼字符串（省代码也省时间）。
 *   位置对照（下标从 0 数）：
 *       [00:00:00] T+000 L0 F000 D000 A0 O00 E000\r\n
 *        1,2=时 4,5=分 7,8=秒  12=符号 13~15=温度x10  18=光照档  21~23=风扇%
 *        34=本节点在线  35=安防节点在线
 *================================================================================================*/
#define REP_LEN  43
code char RepTmpl[REP_LEN + 1] = "[00:00:00] T+000 L0 F000 D000 A0 O00 E000\r\n";
xdata char Rep[REP_LEN];

/* 标定行：原始 ADC 直出，供 PC 端做热敏 / 光敏标定实验。
   43 字节主报文里没有位置放原始 ADC，所以另起一行。
   首字节 C 与主报文的方括号不冲突，PC 侧按首字节分流即可。

       CAL RT=0465 ROP=0712        共 22 字节（含结尾两字节）

   RT  = 热敏电阻原始 ADC 0~1023
   ROP = 光敏电阻原始 ADC 0~1023
   两者都是【未标定的裸读数】，PC 侧不得当作物理量直接显示。 */
#define CAL_LEN  22
code char CalTmpl[CAL_LEN + 1] = "CAL RT=0000 ROP=0000\r\n";
xdata char Cal[CAL_LEN];
xdata unsigned char UpH, UpM, UpS;           /* 上电后运行时长，代替墙上时间 */

/* 把 v 的低 n 位十进制以 ASCII 填进 Rep[pos..] */
void RepN(unsigned char pos, unsigned char v, unsigned char n)
{
	while(n--) { Rep[pos + n] = (char)('0' + v % 10); v /= 10; }
}

void SendReport()
{
	int v;

	if(GetUart1TxStatus() != enumUart1TxFree) return;   /* 上一行还没发完就跳过这次 */

	RepN(1, UpH, 2);  RepN(4, UpM, 2);  RepN(7, UpS, 2);

	v = Temp10;                                          /* 温度 x10，可能为负 */
	Rep[12] = (char)((v < 0) ? '-' : '+');
	if(v < 0)   v = -v;
	if(v > 999) v = 999;                                 /* 与 NodeA 一致，钳到 99.9 度 */
	RepN(13, (unsigned char)(v / 100), 1);
	RepN(14, (unsigned char)(v % 100), 2);

	RepN(18, LuxLevel, 1);
	RepN(21, FanDuty,  3);

	/* 距离/报警/CRC 错误保持模板里的 000/0/000：单板没有这些数据，不编造。
	   O 的两位在 main() 里已经设成 "10"，此处不用每秒重写。 */

	Uart1Print(Rep, REP_LEN);
}

/* 发一行原始 ADC。下标对照（务必按这张表改，第一版就是这里数错了一位）：

       C  A  L     R  T  =  0  0  0  0     R  O  P  =  0  0  0  0  CR LF
       0  1  2  3  4  5  6  7  8  9 10 11 12 13 14 15 16 17 18 19 20 21
                            \________/                 \________/
                              RT 7~10                    ROP 16~19

   下标 20/21 是行结尾的两个字节，写数字进去会把换行冲掉，
   PC 侧就会看到 ROP 多一位、整行没有结尾。 */
void SendCal()
{
	unsigned int v;

	if(GetUart1TxStatus() != enumUart1TxFree) return;

	v = RawRt;
	Cal[10] = (char)('0' + v % 10);  v /= 10;
	Cal[9]  = (char)('0' + v % 10);  v /= 10;
	Cal[8]  = (char)('0' + v % 10);  v /= 10;
	Cal[7]  = (char)('0' + v % 10);

	v = RawRop;
	Cal[19] = (char)('0' + v % 10);  v /= 10;
	Cal[18] = (char)('0' + v % 10);  v /= 10;
	Cal[17] = (char)('0' + v % 10);  v /= 10;
	Cal[16] = (char)('0' + v % 10);

	Uart1Print(Cal, CAL_LEN);
}
#endif


/* 1S：取一次系统性能。PollingMisses 不为 0 就说明有回调跑太久了，要查 */
void my1S_callback()
{
	struct_SysPerF perf;

	perf = GetSysPerformance();
	PollMiss = perf.PollingMisses;

#if (USE_PC_REPORT)
	/* 运行时长 +1 秒，然后往 USB 发一行报文 */
	if(++UpS >= 60) { UpS = 0; if(++UpM >= 60) { UpM = 0; if(++UpH >= 24) UpH = 0; } }
	SendReport();
#endif

	if(PollMiss != 0) SetBeep(4000, 3);      /* 掉帧时"嘀"一声提醒，联调时很有用；正式演示可注释掉 */
}

/* 按键 */
void myKey_callback()
{
	if(GetKeyAct(enumKey1) == enumKeyPress)          /* Key1 翻页 */
	{
		Page = (Page + 1) & 0x03;
		SetBeep(3000, 3);
	}

	if(GetKeyAct(enumKey2) == enumKeyPress)          /* Key2 风扇满速 / 交回自动，单板自测用 */
	{
		FanManual = (FanManual == 255) ? 100 : 255;
		UpdateFan();
		SetBeep(2000, 5);
	}
}

/* 摇杆：上下调温度阈值。单板阶段(L1)自测用，联网后主站下发的值会覆盖它 */
void myNav_callback()
{
	if(GetAdcNavAct(enumAdcNavKeyUp) == enumKeyPress)
	{
		if(CfgTempSet < 40) CfgTempSet++;
		SetBeep(3500, 3);
	}
	if(GetAdcNavAct(enumAdcNavKeyDown) == enumKeyPress)
	{
		if(CfgTempSet > 10) CfgTempSet--;
		SetBeep(2500, 3);
	}
	if(GetAdcNavAct(enumAdcNavKeyCenter) == enumKeyPress)
	{
		Page = 0;                            /* 摇杆中键回到运行页 */
	}
}


/*==================================================================================================
 * 十、主函数
 *================================================================================================*/
void main()
{
	DisplayerInit();
	SetDisplayerArea(0, 7);
	KeyInit();
	BeepInit();
	StepMotorInit();

	/* 顺序要紧：先 AdcInit(ADCexpEXT) 把 EXT 让出来，再 EXTInit 把 EXT 配成 PWM。
	   第一次上电请确认这个顺序下两者都正常（温度有读数 且 风扇能转）。
	   万一互相干扰，退路是：去掉 EXTInit，风扇改用 LED 亮度 + 蜂鸣器频率表示占空比。 */
	AdcInit(ADCexpEXT);
	EXTInit(enumEXTPWM);
	SetPWM(0, 100, 0, 100);                  /* 上电先确保风扇不转 */

#if (BUS_USE_MODBUS)
	Uart2Init(BUS_BAUD, Uart2Usedfor485ModBus);
	SetUart2Rxd(ReqBuf, REQ_LEN, 0, 0);      /* ModBus 模式按字节间隔断帧，不需要包头匹配 */
#else
	Uart2Init(BUS_BAUD, Uart2Usedfor485);
	SetUart2Rxd(ReqBuf, REQ_LEN, (void *)&MyAddr, 1);   /* 按固定 8 字节 + 首字节匹配本机地址断帧 */
#endif

#if (USE_PC_REPORT)
	{
		unsigned char i;
		for(i = 0; i < REP_LEN; i++) Rep[i] = RepTmpl[i];
		Rep[34] = '1';                       /* 本节点(环境)在线 */
		Rep[35] = '0';                       /* 安防节点不在，PC 侧距离/报警会显示未知 */
		for(i = 0; i < CAL_LEN; i++) Cal[i] = CalTmpl[i];
	}
	/* !! 必须显式清零。Keil C51 的 STARTUP.A51 里 XDATALEN 默认为 0，
	   启动代码【不清 xdata 区】，未给初值的 xdata 变量上电是随机值。
	   第一版漏了这一句，结果报文时间戳变成 [55:00:04] 这种垃圾小时数。 */
	UpH = 0;  UpM = 0;  UpS = 0;  CalDiv = 0;

	/* 同上：xdata 不会被启动代码清零，这几个不清会有实际后果 ——
	   FanDuty 是随机值时 UpdateFan() 会走错分支、上电瞬间误驱动 PWM；
	   WinOpen 随机会让通风窗的第一次动作方向反掉；
	   RxOkCount / RxErrCount 随机会让通信页显示出根本不存在的总线错误。 */
	FanDuty    = 0;
	WinOpen    = 0;
	PollMiss   = 0;
	RxOkCount  = 0;
	RxErrCount = 0;
	Temp10     = 0;
	LuxLevel   = 0;
	RawRt      = 0;
	RawRop     = 0;
	Uart1Init(PC_UART1_BAUD);                /* USB 口，直连电脑上位机 */
#endif

	SetEventCallBack(enumEventSys100mS, my100mS_callback);
	SetEventCallBack(enumEventSys1S,    my1S_callback);
	SetEventCallBack(enumEventKey,      myKey_callback);
	SetEventCallBack(enumEventNav,      myNav_callback);
	SetEventCallBack(enumEventUart2Rxd, myUart2Rxd_callback);

	MySTC_Init();
	while(1)
	{
		MySTC_OS();
	}
}


/**************************************************************************************************
 * 验证步骤（建议按顺序做，每一步过了再做下一步）
 *
 * L1 单板（不接总线，不接电机）
 *   1. 下载后数码管应显示「  23.5   000」这样的温度和占空比。用手捏住热敏电阻 Rt，
 *      温度读数应在几秒内上升；松手后缓慢回落。
 *   2. 按 Key1 翻到标定页1，记下室温下的 Rt 原始 ADC 值，对照温度计填标定表。
 *   3. 按 Key1 翻到标定页2，用手遮住光敏电阻 Rop，记录数值变化方向，
 *      据此确定 LUX_BRIGHT_IS_HIGH 和四个阈值，改完重新下载。
 *   4. 摇杆上下调温度阈值，把阈值调到当前室温以下，L0 灯应亮起（风扇启动条件成立）。
 *   5. 按 Key2 强制满速，观察 PWM 输出。
 *
 * L2 接执行器
 *   6. EXT 接直流电机，重复第 4、5 步，电机应随占空比变化改变转速。
 *   7. WINDOW_MOTOR 保持 enumStepMotor3 时，把阈值调低到触发开窗条件，
 *      L4~L7 应依次点亮走一圈（LED 模拟四相步进电机）。借到实物后改成 enumStepMotor1 重测。
 *
 * L3 接总线
 *   8. 与节点A 用 485 对接（A-A、B-B、GND-GND），主站轮询后通信页的收到帧数应持续增长、
 *      CRC 错误数保持 0。若错误数在涨，先降波特率到 1200，再检查接线和 BUS_USE_MODBUS 是否三板一致。
 *
 * 常见问题
 *   - 温度显示 199.0 或 -79.9：ADC 读到了 0 或 1023，说明热敏电阻虚焊或分压电路断了。
 *   - PollingMisses 不为 0（每秒"嘀"一声）：有回调跑太久。先注释掉 ShowPage 里的分支逐个排查。
 *   - 风扇一直开开关关：回差不够，把 UpdateFan 里的 -10（即 1 摄氏度）改大一些。
 **************************************************************************************************/
