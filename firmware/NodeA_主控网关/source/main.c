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

#define PROTO_NO_PUTI16   1

#define PROTO_NO_FRAMECRC 1

#include "protocol.h"

#define USE_PC_CMD          1
#define USE_REPORT          1
#define USE_IRRX            1
#define USE_SOUND           1

#define USE_CURTAIN         1
#define USE_FM              0
#define USE_ENCODER         0

#define CURTAIN_MOTOR_IS_LED  1

#if (CURTAIN_MOTOR_IS_LED)
	#define CURTAIN_MOTOR   enumStepMotor3
#else
	#define CURTAIN_MOTOR   enumStepMotor1
#endif
#define CURTAIN_SPEED       20
#define CURTAIN_STEPS       64

#define FM_FREQ             1000
#define FM_VOLUME           8           /* 0~15 */

#define UART1_BAUD          9600

#define POLL_TIMEOUT        15
#define POLL_GAP            5
#define OFFLINE_MISS        3

#if (USE_ENCODER)
#include "EXT.H"
#endif
#if (USE_FM)
#include "FM_Radio.H"
#endif

code unsigned long SysClock = 11059200;

#ifdef _displayer_H_
code char decode_table[] = {0x3f, 0x06, 0x5b, 0x4f, 0x66, 0x6d, 0x7d, 0x07, 0x7f, 0x6f, 0x00, 0x08, 0x40, 0x01, 0x41, 0x48,

	0x3f|0x80, 0x06|0x80, 0x5b|0x80, 0x4f|0x80, 0x66|0x80, 0x6d|0x80, 0x7d|0x80, 0x07|0x80, 0x7f|0x80, 0x6f|0x80};
#endif

#define CFG_N               5
#define CFG_TEMPSET         0
#define CFG_ARM             1
#define CFG_ALMH            2
#define CFG_ALMM            3
#define CFG_NEARCM          4

xdata unsigned char Cfg[CFG_N];

#define CFG_DEF   0
#define CFG_MIN   1
#define CFG_MAX   2
#define CFG_STP   3
#define CFG_WHO   4
code unsigned char CfgTab[CFG_N][5] = {
	{DEF_TEMPSET,  10,  40,  1, 0},
	{DEF_ARM,       0,   1,  1, 1},
	{DEF_ALARM_H,   0,  23,  1, 2},
	{DEF_ALARM_M,   0,  59,  1, 2},
	{DEF_NEARCM,   10, 200, 10, 1}
};

#if (USE_SOUND)
/* Wake-up melody: simplified monophonic chorus motif from Red Sun. */
code unsigned char WakeSong[] = {
	0x25,0x08, 0x25,0x08, 0x25,0x08, 0x26,0x08, 0x25,0x08, 0x23,0x08, 0x22,0x08, 0x21,0x10,
	0x25,0x08, 0x25,0x08, 0x25,0x08, 0x26,0x08, 0x25,0x08, 0x23,0x08, 0x22,0x08, 0x22,0x10,
	0x26,0x08, 0x26,0x08, 0x26,0x08, 0x27,0x08, 0x26,0x08, 0x25,0x08, 0x24,0x08, 0x23,0x08,
	0x23,0x08, 0x22,0x08, 0x23,0x08, 0x25,0x08, 0x23,0x10, 0x00,0x08,
	0x24,0x08, 0x24,0x08, 0x25,0x08, 0x26,0x08, 0x25,0x08, 0x23,0x10,
	0x24,0x08, 0x24,0x08, 0x25,0x08, 0x26,0x08, 0x25,0x08, 0x24,0x08, 0x23,0x08, 0x22,0x08, 0x21,0x20
};

code unsigned char AlarmSong[] = {
	0x35, 0x08,  0x31, 0x08,  0x35, 0x08,  0x31, 0x08,
	0x35, 0x08,  0x31, 0x08,  0x35, 0x08,  0x31, 0x08
};
#endif

xdata unsigned char ReqBuf[REQ_LEN];
xdata unsigned char RspBuf[RSP_LEN];

xdata unsigned char SlvD[2][12];

xdata unsigned char MissCnt[2];
xdata unsigned char CfgDirty[2];
xdata unsigned char CrcErr;
xdata unsigned int  MainLoopsPerS;
xdata unsigned char MainPollingMisses;

data unsigned char PollIdx;
data unsigned char PollState;
data unsigned char PollTick;
data unsigned char RspReady;
data unsigned char OnlineMask;

code unsigned char SlaveAddr[2] = {ADDR_ENV, ADDR_SEC};

#if (USE_PC_CMD)

#define CMD_LEN             10
#define ACK_LEN             27
#define CMD_HDR             0xAA

#define FUNC_PC_SETTIME     0x11

#define ACK_OK              0x00
#define ACK_BADARG          0x01
#define ACK_OFFLINE         0x02
#define ACK_NOREPLY         0x03
#define ACK_BADFUNC         0x04

#define ACK_WAIT_TICKS      150

code unsigned char PcHdr[1] = {CMD_HDR};

code char AckTmpl[ACK_LEN + 1] = "ACK s=000 t=00 r=00 d=000\r\n";

#define CFG_LEN  30
code char CfgTmpl[CFG_LEN + 1] = "CFG T=00 A=0 H=00 M=00 N=000\r\n";
xdata char CfgBuf[CFG_LEN];
xdata unsigned char CfgDiv;

xdata unsigned char AckPending;

xdata unsigned char CmdBuf[CMD_LEN];
xdata char AckBuf[ACK_LEN];
xdata unsigned char PcSeq;
xdata unsigned char PcTgt;
xdata unsigned char PcSlave;
xdata unsigned char PcWait;
xdata unsigned char ActPending;
xdata unsigned char ActValue;
#endif

xdata struct_DS1302_RTC NowTime;

code struct_DS1302_RTC InitTime = {0x00, 0x30, 0x21, 0x01, 0x09, 0x02, 0x26};

data unsigned char Th, Tm, Ts;
xdata unsigned char AlarmFired;
xdata unsigned char Silenced;
xdata unsigned char SoundMode;

data unsigned char Page;
data unsigned char SelItem = 1;
data unsigned char Editing;
data unsigned char Blink;
data unsigned char BlinkDiv;
data unsigned char RtcDiv;
data unsigned char SaveStep;

xdata char D[8];

#if (USE_CURTAIN)
xdata unsigned char CurtainOpen = 1;
#endif

#if (USE_IRRX)
xdata unsigned char IrBuf[IR_LEN];
#endif

#if (USE_REPORT)

#define REP_LEN  43
code char RepTmpl[REP_LEN + 1] = "[00:00:00] T+000 L0 F000 D000 A0 O00 E000\r\n";
xdata char Rep[REP_LEN];

#define STA_LEN  75
code char StaTmpl[STA_LEN + 1] =
    "STA BF=000 BP=000 CF=000 CS=0 V=000 D=000 CP=000 AP=000 L=00000 RB=0 RC=0\r\n";
xdata char Sta[STA_LEN];
xdata unsigned char StatusDiv;
#endif

#if (USE_FM)
xdata struct_FMRadio Fm;
#endif

unsigned char Bcd2Bin(unsigned char b)
{
	return (unsigned char)((b >> 4) * 10 + (b & 0x0F));
}

void NumC(unsigned char pos, unsigned char v, unsigned char n)
{
	while(n--) { D[pos + n] = (char)(v % 10); v /= 10; }
}

void Num3(unsigned char pos, int v)
{
	if(v < 0)   v = 0;
	if(v > 999) v = 999;
	NumC(pos,     (unsigned char)(v / 100), 1);
	NumC(pos + 1, (unsigned char)(v % 100), 2);
}

void CfgLoad()
{
	unsigned char i, s, t[CFG_N];

	if(M24C02_Read(NVM_A_MAGIC) != NVM_MAGIC) return;

	s = 0;
	for(i = 0; i < CFG_N; i++)
	{
		t[i] = M24C02_Read((unsigned char)(NVM_A_TEMPSET + i));
		s = (unsigned char)(s + t[i]);
	}
	if(s != M24C02_Read(NVM_A_SUM)) return;

	for(i = 0; i < CFG_N; i++)
		if(t[i] < CfgTab[i][CFG_MIN] || t[i] > CfgTab[i][CFG_MAX]) return;

	for(i = 0; i < CFG_N; i++) Cfg[i] = t[i];
}

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
		SetBeep(4000, 15);
	}
}

#if (USE_SOUND)
void StartSound(unsigned char mode)
{
	if(Silenced || SoundMode == mode) return;

	SoundMode = mode;
	if(mode == 1) SetMusic(120, 0xFC, WakeSong,  sizeof(WakeSong),  enumMscNull);
	else          SetMusic(200, 0xFC, AlarmSong, sizeof(AlarmSong), enumMscNull);
	SetPlayerMode(enumModePlay);
}

void StopSound()
{
	SoundMode = 0;
	SetPlayerMode(enumModeStop);
}
#else
	#define StartSound(m)   SetBeep(3000, 20)
	#define StopSound()
#endif

void SendReq(unsigned char idx)
{
	unsigned char addr = SlaveAddr[idx];
	unsigned int  crc;

	ReqBuf[F_ADDR]   = addr;
	ReqBuf[REQ_ARG0] = 0;
	ReqBuf[REQ_ARG1] = 0;
	ReqBuf[REQ_ARG2] = 0;
	ReqBuf[REQ_ARG3] = 0;

	if(ActPending && idx == PcSlave)
	{
		ReqBuf[F_FUNC] = FUNC_ACT;
		ReqBuf[REQ_ARG0] = ActValue;
	}
	else if(CfgDirty[idx])
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

	crc = Crc16Modbus(ReqBuf, REQ_LEN - 2);
	ReqBuf[REQ_LEN - 2] = (unsigned char)(crc & 0x00FF);
	ReqBuf[REQ_LEN - 1] = (unsigned char)(crc >> 8);
	Uart2Print(ReqBuf, REQ_LEN);
}

#if (USE_PC_CMD)

void AckN(unsigned char pos, unsigned char v, unsigned char n)
{
	while(n--) { AckBuf[pos + n] = (char)('0' + v % 10); v /= 10; }
}

void SendAck(unsigned char result, unsigned char detail)
{
	AckN(6,  PcSeq,  3);
	AckN(12, PcTgt,  2);
	AckN(17, result, 2);
	AckN(22, detail, 3);
	AckPending = 1;
	PcSeq  = 0;
	PcWait = 0;
	ActPending = 0;
}

void SendCfg()
{
	if(GetUart1TxStatus() != enumUart1TxFree) return;

	CfgBuf[6]  = (char)('0' + Cfg[CFG_TEMPSET] / 10);
	CfgBuf[7]  = (char)('0' + Cfg[CFG_TEMPSET] % 10);
	CfgBuf[11] = (char)('0' + (Cfg[CFG_ARM] ? 1 : 0));
	CfgBuf[15] = (char)('0' + Cfg[CFG_ALMH] / 10);
	CfgBuf[16] = (char)('0' + Cfg[CFG_ALMH] % 10);
	CfgBuf[20] = (char)('0' + Cfg[CFG_ALMM] / 10);
	CfgBuf[21] = (char)('0' + Cfg[CFG_ALMM] % 10);
	CfgBuf[25] = (char)('0' + Cfg[CFG_NEARCM] / 100);
	CfgBuf[26] = (char)('0' + (Cfg[CFG_NEARCM] / 10) % 10);
	CfgBuf[27] = (char)('0' + Cfg[CFG_NEARCM] % 10);

	Uart1Print(CfgBuf, CFG_LEN);
}

void myUart1Rxd_callback()
{
	unsigned int  crc;
	unsigned char i, v, who;

	crc = Crc16Modbus(CmdBuf, CMD_LEN - 2);
	if(CmdBuf[CMD_LEN - 2] != (unsigned char)(crc & 0x00FF)) return;
	if(CmdBuf[CMD_LEN - 1] != (unsigned char)(crc >> 8))     return;

	if(CmdBuf[1] == 0) return;

	PcSeq = CmdBuf[1];
	PcTgt = CmdBuf[2];

	if(CmdBuf[3] == FUNC_PC_SETTIME)
	{
		struct_DS1302_RTC t;

		if(CmdBuf[4] > 23) { SendAck(ACK_BADARG, CmdBuf[4]); return; }
		if(CmdBuf[5] > 59) { SendAck(ACK_BADARG, CmdBuf[5]); return; }
		if(CmdBuf[6] > 59) { SendAck(ACK_BADARG, CmdBuf[6]); return; }

		t        = RTC_Read();
		t.hour   = (unsigned char)(((CmdBuf[4] / 10) << 4) | (CmdBuf[4] % 10));
		t.minute = (unsigned char)(((CmdBuf[5] / 10) << 4) | (CmdBuf[5] % 10));
		t.second = (unsigned char)(((CmdBuf[6] / 10) << 4) | (CmdBuf[6] % 10));
		RTC_Write(t);
		NowTime = t;
		AlarmFired = 0;
		SetBeep(3000, 8);
		SendAck(ACK_OK, 0);
		return;
	}

	if(CmdBuf[3] == FUNC_ACT)
	{
		who = CmdBuf[4];
		v   = CmdBuf[5];
		if(who >= 2) { SendAck(ACK_BADARG, who); return; }
		if(who == 0)
		{
			if(v > 100 && v < ACT_ENV_WIN_CLOSE) { SendAck(ACK_BADARG, v); return; }
		}
		else if(v > ACT_SEC_SILENCE) { SendAck(ACK_BADARG, v); return; }

		if(!(OnlineMask & (unsigned char)(1 << who)))
		{
			SendAck(ACK_OFFLINE, 0);
			return;
		}

		PcSlave    = who;
		ActValue   = v;
		ActPending = 1;
		PcWait     = ACK_WAIT_TICKS;
		return;
	}

	if(CmdBuf[3] != FUNC_SETCFG) { SendAck(ACK_BADFUNC, CmdBuf[3]); return; }

	i = CmdBuf[4];
	v = CmdBuf[5];

	if(i >= CFG_N)                                       { SendAck(ACK_BADARG, i); return; }
	if(v < CfgTab[i][CFG_MIN] || v > CfgTab[i][CFG_MAX])  { SendAck(ACK_BADARG, v); return; }

	Cfg[i] = v;
	SetBeep(3000, 5);

	who = CfgTab[i][CFG_WHO];
	if(who >= 2) { SendAck(ACK_OK, 0); return; }

	CfgDirty[who] = 1;

	if(!(OnlineMask & (unsigned char)(1 << who)))
	{

		SendAck(ACK_OFFLINE, 0);
		return;
	}

	PcSlave = who;
	PcWait  = ACK_WAIT_TICKS;
}
#endif

void HandleRsp()
{
	unsigned char idx, i;

	if     (RspBuf[F_ADDR] == ADDR_ENV) idx = 0;
	else if(RspBuf[F_ADDR] == ADDR_SEC) idx = 1;
	else return;

	if(idx != PollIdx) return;

	if(RspBuf[RSP_DATA] != (idx ? NODE_TYPE_SEC : NODE_TYPE_ENV)) return;

	for(i = 0; i < 12; i++) SlvD[idx][i] = RspBuf[RSP_DATA + i];

	MissCnt[idx] = 0;
	OnlineMask  |= (unsigned char)(1 << idx);
	if(RspBuf[F_FUNC] == FUNC_SETCFG) CfgDirty[idx] = 0;

	/* Accept NodeB local changes only when no newer master value is pending. */
	if(idx == 0 && !CfgDirty[0])
	{
		i = SlvD[0][D_ENV_TEMPSET];
		if(i >= CfgTab[CFG_TEMPSET][CFG_MIN] && i <= CfgTab[CFG_TEMPSET][CFG_MAX])
			Cfg[CFG_TEMPSET] = i;
	}

#if (USE_PC_CMD)

	if(PcWait && idx == PcSlave &&
	   (RspBuf[F_FUNC] == FUNC_SETCFG || RspBuf[F_FUNC] == FUNC_ACT)) SendAck(ACK_OK, 0);
#endif

	if(idx == 1)
	{
		if(SlvD[1][D_SEC_ALARM] >= ALM_ALARM) StartSound(2);

		if(!CfgDirty[1])
			Cfg[CFG_ARM] = (unsigned char)((SlvD[1][D_SEC_STATE] == SECST_DISARMED) ? 0 : 1);
	}
}

void myUart2Rxd_callback()
{
	unsigned int crc = Crc16Modbus(RspBuf, RSP_LEN - 2);

	if(RspBuf[RSP_LEN - 2] == (unsigned char)(crc & 0x00FF) &&
	   RspBuf[RSP_LEN - 1] == (unsigned char)(crc >> 8))
		RspReady = 1;
	else if(CrcErr < 255)
		CrcErr++;
}

void my10mS_callback()
{
	switch(PollState)
	{
	case 0:
		if(GetUart2TxStatus() == enumUart2TxFree)
		{
			SendReq(PollIdx);
			PollTick  = 0;
			PollState = 1;
		}
		break;

	case 1:
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

	default:
		if(++PollTick >= POLL_GAP)
		{
			PollIdx   = (unsigned char)(PollIdx ^ 1);
			PollState = 0;
		}
		break;
	}

#if (USE_PC_CMD)

	if(AckPending && GetUart1TxStatus() == enumUart1TxFree)
	{
		Uart1Print(AckBuf, ACK_LEN);
		AckPending = 0;
	}

	if(PcWait)
	{
		PcWait--;
		if(PcWait == 0) SendAck(ACK_NOREPLY, 0);
	}
#endif

	if(SaveStep) CfgSaveStep();
}

void Refresh()
{
	unsigned char i, led;
	int v;

	for(i = 0; i < 8; i++) D[i] = 10;

	switch(Page)
	{
	case 0:
		D[0] = (char)(NowTime.hour   / 16); D[1] = (char)(NowTime.hour   % 16); D[2] = 12;
		D[3] = (char)(NowTime.minute / 16); D[4] = (char)(NowTime.minute % 16); D[5] = 12;
		D[6] = (char)(NowTime.second / 16); D[7] = (char)(NowTime.second % 16);
		break;

	case 1:
		if(!(OnlineMask & 0x01)) { for(i = 0; i < 8; i++) D[i] = 12; break; }
		v = GetI16(&SlvD[0][D_ENV_TEMP_H]);
		if(v < 0) { D[0] = 12; v = -v; }
		Num3(1, v);
		D[2] = (char)(D[2] + 16);
		NumC(5, SlvD[0][D_ENV_FAN], 3);
		break;

	case 2:
		if(!(OnlineMask & 0x02)) { for(i = 0; i < 8; i++) D[i] = 12; break; }
		D[0] = (char)((SlvD[1][D_SEC_FLAGS] & SECF_ARMED)     ? 1 : 0);
		D[2] = (char)((SlvD[1][D_SEC_FLAGS] & SECF_DOOR_OPEN) ? 1 : 0);
		D[4] = (char)SlvD[1][D_SEC_ALARM];
		Num3(5, GetI16(&SlvD[1][D_SEC_DIST_H]));
		break;

	case 3:
		D[0] = (char)((Editing && Blink) ? 10 : SelItem);
		NumC(5, Cfg[SelItem - 1], 3);
		break;

	default:
		D[0] = (char)((OnlineMask & 0x01) ? 1 : 0);
		D[1] = (char)((OnlineMask & 0x02) ? 1 : 0);
		NumC(3, SlvD[0][D_ENV_MISS], 2);
		NumC(6, SlvD[1][D_SEC_MISS], 2);
		break;
	}

	Seg7Print(D[0], D[1], D[2], D[3], D[4], D[5], D[6], D[7]);

	if(GetStepMotorStatus(CURTAIN_MOTOR) == enumStepMotorBusy) return;

	led = 0;
	if(OnlineMask & 0x01)                 led |= 0x01;
	if(OnlineMask & 0x02)                 led |= 0x02;
	if(Cfg[CFG_ARM])                      led |= 0x04;
	if(SlvD[1][D_SEC_ALARM] >= ALM_ALARM) led |= 0x08;
	LedPrint(led);
}

#if (USE_CURTAIN)
void UpdateCurtain()
{
	if(!(OnlineMask & 0x01)) return;
	if(GetStepMotorStatus(CURTAIN_MOTOR) == enumStepMotorBusy) return;

	if(CurtainOpen && SlvD[0][D_ENV_LUX] <= 1 && Th >= 22)
	{
		if(SetStepMotor(CURTAIN_MOTOR, CURTAIN_SPEED, -CURTAIN_STEPS) == enumSetStepMotorOK)
			CurtainOpen = 0;
	}

	else if(!CurtainOpen && SlvD[0][D_ENV_LUX] >= 3 && Th >= 6 && Th < 22)
	{
		if(SetStepMotor(CURTAIN_MOTOR, CURTAIN_SPEED, CURTAIN_STEPS) == enumSetStepMotorOK)
			CurtainOpen = 1;
	}
}
#endif

#if (USE_REPORT)

void RepN(unsigned char pos, unsigned char v, unsigned char n)
{
	while(n--) { Rep[pos + n] = (char)('0' + v % 10); v /= 10; }
}

void StaC(unsigned char pos, unsigned char v, unsigned char n)
{
	while(n--) { Sta[pos + n] = (char)('0' + v % 10); v /= 10; }
}

void StaU(unsigned char pos, unsigned int v, unsigned char n)
{
	while(n--) { Sta[pos + n] = (char)('0' + v % 10); v /= 10; }
}

void SendReport()
{
	int v;

	if(GetUart1TxStatus() != enumUart1TxFree) return;

	RepN(1, Th, 2);  RepN(4, Tm, 2);  RepN(7, Ts, 2);

	v = GetI16(&SlvD[0][D_ENV_TEMP_H]);
	Rep[12] = (char)((v < 0) ? '-' : '+');
	if(v < 0) v = -v;
	if(v > 999) v = 999;
	RepN(13, (unsigned char)(v / 100), 1);
	RepN(14, (unsigned char)(v % 100), 2);

	RepN(18, SlvD[0][D_ENV_LUX], 1);
	RepN(21, SlvD[0][D_ENV_FAN], 3);

	v = GetI16(&SlvD[1][D_SEC_DIST_H]);
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

void SendStatus()
{
	if(GetUart1TxStatus() != enumUart1TxFree) return;

	StaC(7,  SlvD[0][D_ENV_FLAGS],   3);
	StaC(14, SlvD[0][D_ENV_MISS],    3);
	StaC(21, SlvD[1][D_SEC_FLAGS],   3);
	StaC(28, SlvD[1][D_SEC_STATE],   1);
	StaC(32, SlvD[1][D_SEC_VIBCNT],  3);
	StaC(38, SlvD[1][D_SEC_DOORCNT], 3);
	StaC(45, SlvD[1][D_SEC_MISS],    3);
	StaC(52, MainPollingMisses,       3);
	StaU(58, MainLoopsPerS,           5);
	StaC(67, MissCnt[0],              1);
	StaC(72, MissCnt[1],              1);

	Uart1Print(Sta, STA_LEN);
}
#endif

void my100mS_callback()
{

	if(++RtcDiv >= 2) { RtcDiv = 0; NowTime = RTC_Read(); }

	if(++BlinkDiv >= 3) { BlinkDiv = 0; Blink = (unsigned char)(!Blink); }

#if (USE_PC_CMD)

	if(++CfgDiv >= 10) CfgDiv = 0;
	if(CfgDiv == 3) SendCfg();
#endif

#if (USE_REPORT)

	if(++StatusDiv >= 10) StatusDiv = 0;
	if(StatusDiv == 6) SendStatus();
#endif

	Refresh();
}

void my1S_callback()
{
	struct_SysPerF perf;

	perf = GetSysPerformance();
	MainLoopsPerS = (perf.MainLoops > 65535UL) ? 65535U : (unsigned int)perf.MainLoops;
	MainPollingMisses = perf.PollingMisses;

	Th = Bcd2Bin(NowTime.hour);
	Tm = Bcd2Bin(NowTime.minute);
	Ts = Bcd2Bin(NowTime.second);

	if(Th == Cfg[CFG_ALMH] && Tm == Cfg[CFG_ALMM] && Ts < 2)
	{
		if(!AlarmFired)
		{
			AlarmFired = 1;
			Silenced   = 0;
			StartSound(1);
#if (USE_FM)
			Fm.volume = FM_VOLUME;
			SetFMRadio(Fm);
#endif
		}
	}
	else if(Tm != Cfg[CFG_ALMM])
	{
		AlarmFired = 0;
	}

#if (USE_SOUND)

	if(SoundMode && !Silenced && GetPlayerMode() != enumModePlay)
	{
		unsigned char m = SoundMode;
		SoundMode = 0;
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

#if (USE_IRRX)
void myIrRxd_callback()
{
	if(GetIrRxNum() < IR_LEN) return;
	if(IrBuf[0] != IR_HDR)    return;
	if(IrBuf[2] != (unsigned char)(IR_HDR ^ IrBuf[1] ^ 0xFF)) return;

	switch(IrBuf[1])
	{
	case IR_CMD_TOGGLE_ARM:
		Cfg[CFG_ARM] = (unsigned char)(!Cfg[CFG_ARM]);
		CfgDirty[1]  = 1;
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

void myKey_callback()
{
	if(GetKeyAct(enumKey1) == enumKeyPress)
	{
		if(SaveStep == 0)
		{
			SaveStep = 1;
			SetBeep(3000, 5);
		}
	}

	if(GetKeyAct(enumKey2) == enumKeyPress)
	{
		Cfg[CFG_ARM] = (unsigned char)(!Cfg[CFG_ARM]);
		CfgDirty[1]  = 1;
		SetBeep(2000, 10);
	}
}

void myNav_callback()
{
	unsigned char i, up;

	if(GetAdcNavAct(enumAdcNavKey3) == enumKeyPress)
	{
		Silenced = 1;
		StopSound();
		SetBeep(1500, 5);
		return;
	}

	if(GetAdcNavAct(enumAdcNavKeyCenter) == enumKeyPress)
	{
		if(Page == 3) Editing = (unsigned char)(!Editing);
		else        { Page = 3; Editing = 0; }
		SetBeep(3000, 5);
		return;
	}

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

	if(!Editing) return;

	up = 0;
	if(GetAdcNavAct(enumAdcNavKeyUp)   == enumKeyPress) up = 1;
	else if(GetAdcNavAct(enumAdcNavKeyDown) != enumKeyPress) return;

	i = (unsigned char)(SelItem - 1);
	if(up) { if(Cfg[i] + CfgTab[i][CFG_STP] <= CfgTab[i][CFG_MAX])
	             Cfg[i] = (unsigned char)(Cfg[i] + CfgTab[i][CFG_STP]); }
	else   { if(Cfg[i] >= (unsigned char)(CfgTab[i][CFG_MIN] + CfgTab[i][CFG_STP]))
	             Cfg[i] = (unsigned char)(Cfg[i] - CfgTab[i][CFG_STP]); }

	if(CfgTab[i][CFG_WHO] < 2) CfgDirty[CfgTab[i][CFG_WHO]] = 1;
	SetBeep(up ? 3500 : 2500, 3);
}

void main()
{
	unsigned char i;

	DisplayerInit();
	SetDisplayerArea(0, 7);
	KeyInit();
	BeepInit();
#if (USE_SOUND)
	MusicPlayerInit();
#endif
	StepMotorInit();

	AdcInit(ADCexpEXT);
#if (USE_ENCODER)
	EXTInit(enumEXTDecode);
#endif

	DS1302Init(InitTime);
	NowTime = RTC_Read();

	for(i = 0; i < 12; i++) { SlvD[0][i] = 0; SlvD[1][i] = 0; }
	MissCnt[0] = 0;  MissCnt[1] = 0;
	CrcErr     = 0;
	MainLoopsPerS = 0;
	MainPollingMisses = 0;
	AlarmFired = 0;
	Silenced   = 0;
	SoundMode  = 0;

	for(i = 0; i < CFG_N; i++) Cfg[i] = CfgTab[i][CFG_DEF];
	CfgLoad();

	CfgDirty[0] = 1;
	CfgDirty[1] = 1;

	SlvD[1][D_SEC_DIST_H] = 0xFF;
	SlvD[1][D_SEC_DIST_L] = 0xFF;

#if (USE_REPORT)
	for(i = 0; i < REP_LEN; i++) Rep[i] = RepTmpl[i];
	for(i = 0; i < STA_LEN; i++) Sta[i] = StaTmpl[i];
	StatusDiv = 0;
#endif

#if (USE_FM)
	Fm.frequency = FM_FREQ;
	Fm.volume    = 0;
	Fm.GP1 = 1;  Fm.GP2 = 1;  Fm.GP3 = 1;
	FMRadioInit(Fm);
#endif

	Uart1Init(UART1_BAUD);

#if (USE_PC_CMD)

	PcSeq = 0;  PcWait = 0;  PcTgt = 0;  PcSlave = 0;
	ActPending = 0;  ActValue = 0;
	AckPending = 0;  CfgDiv = 0;
	{
		unsigned char k;
		for(k = 0; k < ACK_LEN; k++) AckBuf[k] = AckTmpl[k];
		for(k = 0; k < CFG_LEN; k++) CfgBuf[k] = CfgTmpl[k];
	}
	SetUart1Rxd(CmdBuf, CMD_LEN, PcHdr, 1);
#endif

#if (BUS_USE_MODBUS)
	Uart2Init(BUS_BAUD, Uart2Usedfor485ModBus);
#else
	Uart2Init(BUS_BAUD, Uart2Usedfor485);
#endif

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
#if (USE_PC_CMD)
	SetEventCallBack(enumEventUart1Rxd, myUart1Rxd_callback);
#endif

	MySTC_Init();
	while(1)
	{
		MySTC_OS();
	}
}
