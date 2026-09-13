#ifndef _IR_H_
#define _IR_H_

extern void IrInit(unsigned char Protocol);
enum IrProtocalName {NEC_R05d=43};

extern char IrTxdSet(unsigned char *pt,unsigned char num);
extern char IrPrint(void *pt, unsigned char num);
extern void SetIrRxd(void *RxdPt,unsigned char RxdNmax);
extern unsigned char GetIrRxNum(void);
extern char GetIrStatus(void);

enum IrActName {enumIrFree=0
               ,enumIrBusy
               ,enumIrTxOK
               ,enumIrTxFailure};
#endif
