#ifndef _EXT_H_
#define _EXT_H_

extern void EXTInit(char EXTfunction);
enum EXTname {enumEXTWeight
             ,enumEXTPWM
             ,enumEXTDecode
	           ,enumEXTUltraSonic

             };
extern int GetWeight(void);
extern int GetDecode(void);
extern int GetUltraSonic(void);
extern void SetPWM(unsigned char PWM1, unsigned char freq1, unsigned char PWM2, unsigned char freq2);

#endif
