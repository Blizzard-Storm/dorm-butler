#ifndef _music_H_
#define _music_H_

extern void MusicPlayerInit();
extern char PlayTone(unsigned char tone, unsigned char beatsPM ,unsigned char scale, unsigned char beats);

extern void SetMusic(unsigned char beatsPM, unsigned char tone, unsigned char *pt, unsigned int datasize, unsigned char display);

extern void SetPlayerMode(unsigned char play_ctrl);

extern char GetPlayerMode(void);

enum PlayerMode   {enumModeInvalid=0,
                   enumModePlay,
                   enumModePause,
                   enumModeStop};
enum MusicKeyword {enumMscNull=0xF0,
                   enumMscDrvSeg7,
                   enumMscDrvLed,
                   enumMscDrvSeg7andLed,
                   enumMscSetBeatsPM,
                   enumMscSetTone,
                   enumMscRepeatBegin,
                   enumMscRepeatEnd};

#endif
