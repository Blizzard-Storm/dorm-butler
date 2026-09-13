#ifndef _key_H_
#define _key_H_

extern void KeyInit();
extern unsigned char GetKeyAct(char Key) ;

enum KeyName     {enumKey1,enumKey2,enumKey3};
enum KeyActName  {enumKeyNull,enumKeyPress,enumKeyRelease,enumKeyFail};

#endif
