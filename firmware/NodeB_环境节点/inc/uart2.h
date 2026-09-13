#ifndef _uart2_H_
#define _uart2_H_

extern void Uart2Init(unsigned long band,unsigned char Uart2mode);
enum Uart2PortName  {Uart2UsedforEXT,Uart2Usedfor485,Uart2Usedfor485ModBus};

extern void SetUart2Rxd(void *RxdPt, unsigned int Nmax, void *matchhead, unsigned int matchheadsize);
extern char Uart2Print(void *pt, unsigned int num);
extern char GetUart2TxStatus(void);
enum Uart2ActName {enumUart2TxFree=0,enumUart2TxBusy,enumUart2TxOK,enumUart2TxFailure};

#endif
