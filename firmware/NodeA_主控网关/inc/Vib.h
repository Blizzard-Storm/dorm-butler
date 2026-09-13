#ifndef _Vib_H_
#define _Vib_H_

extern void VibInit();
extern unsigned char GetVibAct(void) reentrant;
enum VibActName {enumVibNull,enumVibQuake};

#endif
