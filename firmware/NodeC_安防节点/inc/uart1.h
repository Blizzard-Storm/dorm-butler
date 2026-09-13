#ifndef _uart1_H_
#define _uart1_H_

extern void Uart1Init(unsigned long band);
extern void SetUart1Rxd(void *RxdPt, unsigned int Nmax, void *matchhead, unsigned int matchheadsize);
extern char Uart1Print(void *pt, unsigned int num);
extern char GetUart1TxStatus(void);
enum Uart1ActName {enumUart1TxFree=0,enumUart1TxBusy,enumUart1TxOK,enumUart1TxFailure};

#endif
