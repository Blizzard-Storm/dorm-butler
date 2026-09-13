#ifndef _beep_H_
#define _beep_H_

extern void BeepInit();

extern char SetBeep(unsigned int Beep_freq, unsigned int Beep_time);

extern unsigned char GetBeepStatus(void);

enum BeepActName {enumBeepFree=0,enumBeepBusy,enumSetBeepOK,enumSetBeepFail};

#endif
