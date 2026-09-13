#ifndef _FM_Radio_H_
#define _FM_Radio_H_

typedef struct
  { unsigned int frequency;
    unsigned char volume;
    unsigned char GP1;
    unsigned char GP2;
    unsigned char GP3;
  } struct_FMRadio;

extern void FMRadioInit(struct_FMRadio FMRadio);
extern void SetFMRadio(struct_FMRadio FMRadio);
extern struct_FMRadio GetFMRadio(void);

#endif
