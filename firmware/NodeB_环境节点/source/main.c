#include "STC15F2K60S2.H"
#include "sys.H"
#include "displayer.H"
#include "Key.H"
#include "adc.H"
#include "Beep.H"
#include "uart2.H"
#include "uart1.H"
#include "EXT.H"
#include "StepMotor.H"
#define PROTO_NO_GETI16   1
#include "protocol.h"

code unsigned long SysClock = 11059200;

#ifdef _displayer_H_
code char decode_table[] = {0x3f, 0x06, 0x5b, 0x4f, 0x66, 0x6d, 0x7d, 0x07, 0x7f, 0x6f, 0x00, 0x08, 0x40, 0x01, 0x41, 0x48,

	0x3f|0x80, 0x06|0x80, 0x5b|0x80, 0x4f|0x80, 0x66|0x80, 0x6d|0x80, 0x7d|0x80, 0x07|0x80, 0x7f|0x80, 0x6f|0x80};

#endif

#define USE_PC_REPORT       1
#define PC_UART1_BAUD       9600

#define WINDOW_MOTOR        enumStepMotor1

#define WINDOW_SPEED        20
#define WINDOW_STEPS        64

#define LUX_BRIGHT_IS_HIGH  1
#define LUX_TH0             55
#define LUX_TH1             95
#define LUX_TH2             130
#define LUX_TH3             180

#define LUX_LOW_LEVEL       1

code int NtcTable[33] = {
	  1990,   1188,    925,    782,    684,    609,    548,    496,
	   451,    410,    373,    339,    307,    276,    247,    219,
	   192,    165,    138,    112,     85,     58,     30,      2,
	   -28,    -60,    -95,   -133,   -177,   -230,   -298,   -405,
	  -799
};

xdata unsigned char ReqBuf[REQ_LEN];
xdata unsigned char RspBuf[RSP_LEN];

xdata int  Temp10;
xdata unsigned int RawRt;
xdata unsigned int RawRop;
xdata unsigned char LuxLevel;
xdata unsigned char FanDuty;
xdata unsigned char WinOpen;

xdata unsigned char CfgTempSet = DEF_TEMPSET;
xdata unsigned char FanManual  = 255;
xdata unsigned char WinManual;

xdata unsigned int  RxOkCount;
xdata unsigned int  RxErrCount;
xdata unsigned char PollMiss;

data unsigned char Page;
data unsigned char AdcDiv;

#if (!BUS_USE_MODBUS)
code unsigned char MyAddr = ADDR_ENV;
#endif

int AdcToTemp10(unsigned int adc)
{
	unsigned char idx;
	unsigned char frac;
	int lo, hi;

	if(adc > 1023) adc = 1023;

	idx  = (unsigned char)(adc >> 5);
	frac = (unsigned char)(adc & 0x001F);

	lo = NtcTable[idx];
	hi = NtcTable[idx + 1];

	return lo + (int)(((int)(hi - lo) * (int)frac) / 32);
}

unsigned char AdcToLux(unsigned int adc)
{
	unsigned char lv;

	if     (adc < LUX_TH0) lv = 0;
	else if(adc < LUX_TH1) lv = 1;
	else if(adc < LUX_TH2) lv = 2;
	else if(adc < LUX_TH3) lv = 3;
	else                   lv = 4;

#if (LUX_BRIGHT_IS_HIGH == 0)
	lv = 4 - lv;
#endif
	return lv;
}

void UpdateFan()
{
	int over;
	unsigned char duty;

	if(FanManual <= 100)
	{
		duty = FanManual;
	}
	else
	{
		over = Temp10 - (int)CfgTempSet * 10;

		if(FanDuty == 0)
		{
			duty = (over >= 0) ? 30 : 0;
		}
		else
		{
			duty = (over >= -10) ? 30 : 0;
		}

		if(duty != 0 && over > 0)
		{
			int add = (over * 7) / 10;
			if(add > 70) add = 70;
			duty = (unsigned char)(30 + add);
		}
	}

	if(duty != FanDuty)
	{
		FanDuty = duty;
		SetPWM(FanDuty, 100, 0, 100);
	}
}

void UpdateWindow()
{
	int over = Temp10 - (int)CfgTempSet * 10;

	if(WinManual) return;
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

void BuildRsp(unsigned char func)
{
	unsigned char flags = 0;

	if(FanDuty > 0)                 flags |= ENVF_FAN_ON;
	if(WinOpen)                     flags |= ENVF_WIN_OPEN;
	if(Temp10 >= (int)CfgTempSet * 10) flags |= ENVF_TEMP_HI;
	if(LuxLevel <= LUX_LOW_LEVEL)   flags |= ENVF_LUX_LOW;
	if(FanManual <= 100)            flags |= ENVF_FAN_MANUAL;
	if(WinManual)                   flags |= ENVF_WIN_MANUAL;

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
	RspBuf[RSP_DATA + D_ENV_TEMPSET] = CfgTempSet;

	FrameSetCrc(RspBuf, RSP_LEN);
}

void myUart2Rxd_callback()
{
	if(ReqBuf[F_ADDR] != ADDR_ENV) return;

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
		if(ReqBuf[REQ_ARG0] >= 10 && ReqBuf[REQ_ARG0] <= 40)
			CfgTempSet = ReqBuf[REQ_ARG0];
		BuildRsp(FUNC_SETCFG);
		Uart2Print(RspBuf, RSP_LEN);
		break;

	case FUNC_ACT:
		if(ReqBuf[REQ_ARG0] <= 100 || ReqBuf[REQ_ARG0] == ACT_ENV_FAN_AUTO)
		{
			FanManual = ReqBuf[REQ_ARG0];
			UpdateFan();
		}
		else if(ReqBuf[REQ_ARG0] == ACT_ENV_WIN_AUTO)
		{
			WinManual = 0;
			UpdateWindow();
		}
		else if(ReqBuf[REQ_ARG0] == ACT_ENV_WIN_OPEN || ReqBuf[REQ_ARG0] == ACT_ENV_WIN_CLOSE)
		{
			unsigned char open = (unsigned char)(ReqBuf[REQ_ARG0] == ACT_ENV_WIN_OPEN);
			WinManual = 1;
			if(open != WinOpen && GetStepMotorStatus(WINDOW_MOTOR) != enumStepMotorBusy)
			{
				if(SetStepMotor(WINDOW_MOTOR, WINDOW_SPEED,
				   open ? WINDOW_STEPS : -WINDOW_STEPS) == enumSetStepMotorOK) WinOpen = open;
			}
		}
		BuildRsp(FUNC_ACT);
		Uart2Print(RspBuf, RSP_LEN);
		break;

	default:
		break;
	}
}

xdata char D[8];

void NumC(unsigned char pos, unsigned char v, unsigned char n)
{
	while(n--) { D[pos + n] = (char)(v % 10); v /= 10; }
}

void NumI(unsigned char pos, unsigned int v, unsigned char n)
{
	while(n--) { D[pos + n] = (char)(v % 10); v /= 10; }
}

void Refresh()
{
	unsigned char i, led;
	int t;

	for(i = 0; i < 8; i++) D[i] = 10;

	switch(Page)
	{
	case 0:
		t = Temp10;
		if(t < 0)
		{
			D[0] = 12; t = -t;
			if(t > 999) t = 999;
			NumI(1, (unsigned int)t, 3);
			D[2] = (char)(D[2] + 16);
		}
		else
		{
			if(t > 999) t = 999;
			NumI(0, (unsigned int)t, 3);       /* 23.5 */
			D[1] = (char)(D[1] + 16);
			NumC(3, CfgTempSet, 2);
			D[4] = (char)(D[4] + 16);
		}
		NumC(5, FanDuty, 3);
		break;

	case 1:
		D[0] = 1;
		NumI(4, RawRt, 4);
		break;

	case 2:
		D[0] = 2;
		D[2] = (char)LuxLevel;
		NumI(4, RawRop, 4);
		break;

	default:
		D[0] = 3;
		NumI(2, RxOkCount,  2);
		NumI(6, RxErrCount, 2);
		break;
	}

	Seg7Print(D[0], D[1], D[2], D[3], D[4], D[5], D[6], D[7]);

	if(GetStepMotorStatus(WINDOW_MOTOR) == enumStepMotorBusy) return;

	led = 0;
	if(FanDuty > 0)                       led |= 0x01;
	if(WinOpen)                           led |= 0x02;
	if(Temp10 >= (int)CfgTempSet * 10)    led |= 0x04;
	if(LuxLevel <= LUX_LOW_LEVEL)         led |= 0x08;
	LedPrint(led);
}

#if (USE_PC_REPORT)

void SendCal();
xdata unsigned char CalDiv;
#endif

void my100mS_callback()
{
	struct_ADC adc;

	adc = GetADC();
	RawRt  = adc.Rt;
	RawRop = adc.Rop;

	if(RawRt < 1)    RawRt = 1;
	if(RawRt > 1022) RawRt = 1022;

	Temp10   = AdcToTemp10(RawRt);
	LuxLevel = AdcToLux(RawRop);

	AdcDiv++;
	if(AdcDiv >= 5)
	{
		AdcDiv = 0;
		UpdateFan();
		UpdateWindow();
	}

	Refresh();

#if (USE_PC_REPORT)

	if(++CalDiv >= 10) CalDiv = 0;
	if(CalDiv == 5)    SendCal();
#endif
}

#if (USE_PC_REPORT)

#define REP_LEN  43
code char RepTmpl[REP_LEN + 1] = "[00:00:00] T+000 L0 F000 D000 A0 O00 E000\r\n";
xdata char Rep[REP_LEN];

#define CAL_LEN  22
code char CalTmpl[CAL_LEN + 1] = "CAL RT=0000 ROP=0000\r\n";
xdata char Cal[CAL_LEN];
xdata unsigned char UpH, UpM, UpS;

void RepN(unsigned char pos, unsigned char v, unsigned char n)
{
	while(n--) { Rep[pos + n] = (char)('0' + v % 10); v /= 10; }
}

void SendReport()
{
	int v;

	if(GetUart1TxStatus() != enumUart1TxFree) return;

	RepN(1, UpH, 2);  RepN(4, UpM, 2);  RepN(7, UpS, 2);

	v = Temp10;
	Rep[12] = (char)((v < 0) ? '-' : '+');
	if(v < 0)   v = -v;
	if(v > 999) v = 999;
	RepN(13, (unsigned char)(v / 100), 1);
	RepN(14, (unsigned char)(v % 100), 2);

	RepN(18, LuxLevel, 1);
	RepN(21, FanDuty,  3);

	Uart1Print(Rep, REP_LEN);
}

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

void my1S_callback()
{
	struct_SysPerF perf;

	perf = GetSysPerformance();
	PollMiss = perf.PollingMisses;

#if (USE_PC_REPORT)

	if(++UpS >= 60) { UpS = 0; if(++UpM >= 60) { UpM = 0; if(++UpH >= 24) UpH = 0; } }
	SendReport();
#endif

	if(PollMiss != 0) SetBeep(4000, 3);
}

void myKey_callback()
{
	if(GetKeyAct(enumKey1) == enumKeyPress)
	{
		Page = (Page + 1) & 0x03;
		SetBeep(3000, 3);
	}

	if(GetKeyAct(enumKey2) == enumKeyPress)
	{
		FanManual = (FanManual == 255) ? 100 : 255;
		UpdateFan();
		SetBeep(2000, 5);
	}
}

void myNav_callback()
{
	if(GetAdcNavAct(enumAdcNavKeyRight) == enumKeyPress)
	{
		WinManual = 1;
		if(WinOpen == 0 && GetStepMotorStatus(WINDOW_MOTOR) != enumStepMotorBusy)
		{
			if(SetStepMotor(WINDOW_MOTOR, WINDOW_SPEED, WINDOW_STEPS) == enumSetStepMotorOK)
				WinOpen = 1;
		}
		SetBeep(3000, 3);
	}
	if(GetAdcNavAct(enumAdcNavKeyLeft) == enumKeyPress)
	{
		WinManual = 1;
		if(WinOpen == 1 && GetStepMotorStatus(WINDOW_MOTOR) != enumStepMotorBusy)
		{
			if(SetStepMotor(WINDOW_MOTOR, WINDOW_SPEED, -WINDOW_STEPS) == enumSetStepMotorOK)
				WinOpen = 0;
		}
		SetBeep(2000, 3);
	}
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
		Page = 0;
		WinManual = 0;
		SetBeep(4000, 3);
	}
}

void main()
{
	DisplayerInit();
	SetDisplayerArea(0, 7);
	KeyInit();
	BeepInit();
	StepMotorInit();

	AdcInit(ADCexpEXT);
	EXTInit(enumEXTPWM);
	SetPWM(0, 100, 0, 100);

#if (BUS_USE_MODBUS)
	Uart2Init(BUS_BAUD, Uart2Usedfor485ModBus);
	SetUart2Rxd(ReqBuf, REQ_LEN, 0, 0);
#else
	Uart2Init(BUS_BAUD, Uart2Usedfor485);
	SetUart2Rxd(ReqBuf, REQ_LEN, (void *)&MyAddr, 1);
#endif

#if (USE_PC_REPORT)
	{
		unsigned char i;
		for(i = 0; i < REP_LEN; i++) Rep[i] = RepTmpl[i];
		Rep[34] = '1';
		Rep[35] = '0';
		for(i = 0; i < CAL_LEN; i++) Cal[i] = CalTmpl[i];
	}

	UpH = 0;  UpM = 0;  UpS = 0;  CalDiv = 0;

	FanDuty    = 0;
	WinOpen    = 0;
	WinManual  = 0;
	PollMiss   = 0;
	RxOkCount  = 0;
	RxErrCount = 0;
	Temp10     = 0;
	LuxLevel   = 0;
	RawRt      = 0;
	RawRop     = 0;
	Uart1Init(PC_UART1_BAUD);
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
