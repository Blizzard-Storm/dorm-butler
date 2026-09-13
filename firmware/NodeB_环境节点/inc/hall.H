#ifndef _hall_H_
#define _hall_H_

extern void HallInit(void);
extern unsigned char GetHallAct(void);
enum HallActName {enumHallNull,enumHallGetClose,enumHallGetAway};

#endif
