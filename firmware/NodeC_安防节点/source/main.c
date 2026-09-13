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
#define PROTO_NO_GETI16   1
#include "protocol.h"

code unsigned long SysClock = 11059200;

#ifdef _displayer_H_
code char decode_table[] = {0x3f, 0x06, 0x5b, 0x4f, 0x66, 0x6d, 0x7d, 0x07, 0x7f, 0x6f, 0x00, 0x08, 0x40, 0x01, 0x41, 0x48,
	0x3f|0x80, 0x06|0x80, 0x5b|0x80, 0x4f|0x80, 0x66|0x80, 0x6d|0x80, 0x7d|0x80, 0x07|0x80, 0x7f|0x80, 0x6f|0x80,
	0x77};

#define SEG_A   26
#endif

#define LOCK_MOTOR_IS_LED   0

#if (LOCK_MOTOR_IS_LED)
	#define LOCK_MOTOR      enumStepMotor3
#else
	#define LOCK_MOTOR      enumStepMotor1
#endif

#define LOCK_SPEED          30
#define LOCK_STEPS          48

#define ARM_DELAY_S         3

#define VIB_WINDOW_S        2
#define VIB_THRESHOLD       3

#define DIST_MIN            2
#define DIST_MAX            400

#define CFG_SHOW_100MS      20

code unsigned char AlarmSong[] = {
	0x35, 0x08,  0x31, 0x08,  0x35, 0x08,  0x31, 0x08,
	0x35, 0x08,  0x31, 0x08,  0x35, 0x08,  0x31, 0x08
};

xdata unsigned char ReqBuf[REQ_LEN];
xdata unsigned char RspBuf[RSP_LEN];
xdata unsigned char IrBuf[IR_LEN];

xdata int  DistCm = -1;
xdata unsigned char SecState = SECST_DISARMED;
xdata unsigned char DoorOpen;
xdata unsigned char Locked;
xdata unsigned char AlarmLevel = ALM_NONE;
xdata unsigned char NearFlag;
xdata unsigned char Silenced;
xdata unsigned char AlarmByDoor;

xdata unsigned char VibCount;
xdata unsigned char VibInWindow;
xdata unsigned char VibWindowTick;
xdata unsigned char DoorCount;

xdata unsigned char CfgNearCm = DEF_NEARCM;
xdata unsigned char ArmCountdown;

xdata unsigned char PollMiss;

data unsigned char Page;
data unsigned char DistDiv;
data unsigned char CfgShowTick;

#if (!BUS_USE_MODBUS)
code unsigned char MyAddr = ADDR_SEC;
#endif

void SetLock(unsigned char lock)
{
	if(Locked == lock) return;
	if(GetStepMotorStatus(LOCK_MOTOR) == enumStepMotorBusy) return;

	if(SetStepMotor(LOCK_MOTOR, LOCK_SPEED, lock ? LOCK_STEPS : -LOCK_STEPS) == enumSetStepMotorOK)
		Locked = lock;
}

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
	SetMusic(200, 0xFC, AlarmSong, sizeof(AlarmSong), enumMscNull);
	SetPlayerMode(enumModePlay);
}

void StopAlarmSound()
{
	SetPlayerMode(enumModeStop);
}

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
		SetLock(0);
		break;

	case SECST_ARMING:
		ArmCountdown = ARM_DELAY_S;
		AlarmLevel   = ALM_NONE;
		AlarmByDoor  = 0;
		Silenced     = 0;
		VibInWindow  = 0;
		break;

	case SECST_ARMED:

		AlarmLevel  = ALM_NONE;
		AlarmByDoor = 0;
		Silenced    = 0;
		StopAlarmSound();
		SetLock(1);
		break;

	case SECST_ALARM:
		AlarmLevel = ALM_ALARM;
		SetLock(1);
		StartAlarmSound();
		IrSend(IR_CMD_ALARM);
		break;

	default:
		break;
	}
}

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

void ToggleArm()
{
	if(SecState == SECST_DISARMED) EnterState(SECST_ARMING);
	else                           EnterState(SECST_DISARMED);
}

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

	if(!FrameCrcOk(ReqBuf, REQ_LEN)) return;

	switch(ReqBuf[F_FUNC])
	{
	case FUNC_POLL:
		BuildRsp(FUNC_POLL);
		Uart2Print(RspBuf, RSP_LEN);
		break;

	case FUNC_SETCFG:

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

xdata char D[8];

void NumC(unsigned char pos, unsigned char v, unsigned char n)
{
	while(n--) { D[pos + n] = (char)(v % 10); v /= 10; }
}

void Refresh()
{
	unsigned char i, led;
	int d;

	for(i = 0; i < 8; i++) D[i] = 10;

	if(CfgShowTick)
	{
		NumC(5, CfgNearCm, 3);
	}
	else switch(Page)
	{
	case 0:
		if(SecState == SECST_ARMING)
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
			NumC(5, (unsigned char)(d / 100), 1);
			NumC(6, (unsigned char)(d % 100), 2);
		}
		break;

	default:
		D[0] = 1;
		NumC(2, VibCount,  2);
		NumC(6, DoorCount, 2);
		break;
	}

	Seg7Print(D[0], D[1], D[2], D[3], D[4], D[5], D[6], D[7]);

#if (LOCK_MOTOR_IS_LED)
	if(GetStepMotorStatus(LOCK_MOTOR) == enumStepMotorBusy) return;
#endif

	led = 0;
	if(SecState != SECST_DISARMED) led |= 0x01;
	if(DoorOpen)                   led |= 0x02;
	if(VibInWindow)                led |= 0x04;
	if(NearFlag)                   led |= 0x08;
	if(SecState == SECST_ALARM)    led |= 0x30;
	LedPrint(led);
}

void myHall_callback()
{
	unsigned char act = GetHallAct();

	if(act == enumHallGetAway)
	{
		DoorOpen = 1;
		DoorCount++;

		if(SecState == SECST_DISARMED)
		{
			SetBeep(3000, 8);
		}
	}
	else if(act == enumHallGetClose)
	{
		DoorOpen = 0;
	}
}

void myVib_callback()
{
	if(GetVibAct() != enumVibQuake) return;

	if(VibInWindow < 255) VibInWindow++;

	if(SecState == SECST_ARMED && VibInWindow >= VIB_THRESHOLD)
	{
		VibCount++;
		AlarmByDoor = 0;
		EnterState(SECST_ALARM);
	}
}

void my100mS_callback()
{
	int d;

	DistDiv++;
	if(DistDiv >= 2)
	{
		DistDiv = 0;

		d = GetUltraSonic();
		if(d >= DIST_MIN && d <= DIST_MAX)
		{
			DistCm   = d;
			NearFlag = (d <= (int)CfgNearCm) ? 1 : 0;
		}
	}

	UpdateDoorAlarm();

	if(SecState == SECST_ARMED)
		AlarmLevel = NearFlag ? ALM_NOTICE : ALM_NONE;

	if(CfgShowTick) CfgShowTick--;

	Refresh();
}

void my1S_callback()
{
	struct_SysPerF perf;

	if(SecState == SECST_ARMING)
	{
		SetBeep(2500, 10);
		if(ArmCountdown > 0) ArmCountdown--;
		if(ArmCountdown == 0) EnterState(SECST_ARMED);
	}

	VibWindowTick++;
	if(VibWindowTick >= VIB_WINDOW_S)
	{
		VibWindowTick = 0;
		VibInWindow   = 0;
	}

	if(SecState == SECST_ALARM && !Silenced && GetPlayerMode() != enumModePlay)
		StartAlarmSound();

	if(SecState == SECST_ARMED && NearFlag)
		SetBeep(3500, 5);

	perf = GetSysPerformance();
	PollMiss = perf.PollingMisses;
}

void myKey_callback()
{
	if(GetKeyAct(enumKey1) == enumKeyPress)
	{
		Page = (Page + 1) % 2;
		SetBeep(3000, 3);
	}

	if(GetKeyAct(enumKey2) == enumKeyPress)
	{
		if(SecState == SECST_ALARM)
		{
			Silenced = !Silenced;
			if(Silenced)
			{
				StopAlarmSound();
				IrSend(IR_CMD_SILENCE);
			}
			else
			{
				StartAlarmSound();
			}
		}
	}
}

void myNav_callback()
{
	if(GetAdcNavAct(enumAdcNavKey3) == enumKeyPress)
	{
		ToggleArm();
		IrSend(IR_CMD_TOGGLE_ARM);
		SetBeep(2000, 10);
	}

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

	if(GetAdcNavAct(enumAdcNavKeyCenter) == enumKeyPress)
	{
		CfgShowTick = CFG_SHOW_100MS;
		Page = 0;
	}
}

void main()
{
	DisplayerInit();
	SetDisplayerArea(0, 7);
	KeyInit();
	BeepInit();
	MusicPlayerInit();
	HallInit();
	VibInit();
	StepMotorInit();
	IrInit(NEC_R05d);

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
