#ifndef _StepMotor_H_
#define _StepMotor_H_

extern void StepMotorInit();
extern char SetStepMotor(char StepMotor,unsigned char speed ,int steps );

extern int EmStop(char StepMotor);

extern unsigned char GetStepMotorStatus(char StepMotor);

enum StepMotorName    {enumStepMotor1=0,enumStepMotor2,enumStepMotor3};
enum StepMotorActName {enumStepMotorFree,enumStepMotorBusy,enumSetStepMotorOK,enumSetStepMotorFail};

#endif
