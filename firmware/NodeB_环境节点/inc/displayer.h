#ifndef _displayer_H_
#define _displayer_H_
extern void DisplayerInit();
extern void SetDisplayerArea(char Begin_of_scan,char Ending_of_Scan);
extern void Seg7Print(char d0,char d1,char d2,char d3,char d4,char d5,char d6,char d7);
extern void LedPrint(char led_val);
#endif
