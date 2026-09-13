#ifndef _adc_H_
#define _adc_H_

#define ADCincEXT 0x9B
#define ADCexpEXT 0x98

typedef struct
  { unsigned int EXT_P10;
    unsigned int EXT_P11;
    unsigned int Rt;
    unsigned int Rop;
    unsigned int Nav;
  } struct_ADC;

extern void AdcInit(char ADCsel);

extern struct_ADC GetADC();
extern unsigned char GetAdcNavAct(char Nav_button);

enum KN_name  {enumAdcNavKey3=0,
               enumAdcNavKeyRight,
               enumAdcNavKeyDown,
               enumAdcNavKeyCenter,
               enumAdcNavKeyLeft,
               enumAdcNavKeyUp};
#endif
