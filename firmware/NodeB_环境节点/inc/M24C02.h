#ifndef _M24C02_H_
#define _M24C02_H_

extern unsigned char M24C02_Read(unsigned char NVM_addr);
extern void M24C02_Write(unsigned char NVM_addr, unsigned char NVM_data);

#endif
