#ifndef	_sys_h_
#define _sys_h_

typedef struct
  { unsigned long MainLoops;
		unsigned char PollingMisses;
	} struct_SysPerF;

extern void MySTC_Init();
extern void MySTC_OS();
extern void SetEventCallBack(char event, void *(user_callback));
extern struct_SysPerF GetSysPerformance(void);

enum event{enumEventSys1mS,
	         enumEventSys10mS,
           enumEventSys100mS,
           enumEventSys1S,
           enumEventKey,
           enumEventHall,
           enumEventVib,
           enumEventNav,
           enumEventXADC,
           enumEventUart1Rxd,
	         enumEventUart2Rxd,
	         enumEventIrRxd
          };

#endif
