#ifndef _DS1302_H_
#define _DS1302_H_

typedef struct
  { unsigned char second;
    unsigned char minute;
    unsigned char hour;
    unsigned char day;
    unsigned char month;
    unsigned char week;
    unsigned char year;
  } struct_DS1302_RTC;

extern void DS1302Init(struct_DS1302_RTC time);
extern struct_DS1302_RTC RTC_Read(void);
extern void RTC_Write(struct_DS1302_RTC time);
extern unsigned char NVM_Read(unsigned char NVM_addr);
extern unsigned char NVM_Write(unsigned char NVM_addr, unsigned char NVM_data);

enum DS1302name {enumDS1302_OK,enumDS1302_error};

#endif
