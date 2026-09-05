#include <stdio.h>
#include <string.h>
#include <math.h>
/* prelude 必须放在系统头文件【之后】：
   mingw 的 _mingw.h 里有个局部变量就叫 code，先 #define code 会把它顶掉 */
#include "prelude.h"
#include "inc/protocol.h"

/* 从 mainB.c 原样复制过来的查表与插值 */
int NtcTable[33] = {
	  1990,   1188,    925,    782,    684,    609,    548,    496,
	   451,    410,    373,    339,    307,    276,    247,    219,
	   192,    165,    138,    112,     85,     58,     30,      2,
	   -28,    -60,    -95,   -133,   -177,   -230,   -298,   -405,
	  -799 };
int AdcToTemp10(unsigned int adc){
	unsigned char idx, frac; int lo, hi;
	if(adc > 1023) adc = 1023;
	idx  = (unsigned char)(adc >> 5);
	frac = (unsigned char)(adc & 0x001F);
	lo = NtcTable[idx]; hi = NtcTable[idx + 1];
	return lo + (int)(((long)(hi - lo) * (long)frac) / 32);
}

static unsigned int crc_ref(unsigned char *b, int n){
	unsigned int c=0xFFFF; int i,j;
	for(i=0;i<n;i++){ c^=b[i]; for(j=0;j<8;j++) c = (c&1)? (c>>1)^0xA001 : c>>1; }
	return c;
}
int main(void){
	unsigned char f[RSP_LEN]; int i,k,bad=0; unsigned int seed=12345;

	/* 1. CRC 对已知 ModBus 测试向量 */
	{ unsigned char v[6]={0x01,0x03,0x00,0x00,0x00,0x01};
	  unsigned int c=Crc16Modbus(v,6);
	  printf("1) CRC16{01 03 00 00 00 01} = 0x%04X  期望 0x0A84  %s\n", c, c==0x0A84?"OK":"FAIL");
	  if(c!=0x0A84) bad++; }

	/* 2. CRC 对随机数据 vs 独立参考实现 */
	for(k=0;k<2000;k++){
		for(i=0;i<RSP_LEN;i++){ seed=seed*1103515245u+12345u; f[i]=(unsigned char)(seed>>16); }
		if(Crc16Modbus(f,RSP_LEN)!=crc_ref(f,RSP_LEN)) bad++;
	}
	printf("2) 2000 组随机数据 CRC 与参考实现比对: %s\n", bad?"FAIL":"OK");

	/* 3. 整帧 CRC 写入/校验，以及单比特翻转必须被抓到 */
	{ int miss=0;
	  for(k=0;k<500;k++){
		for(i=0;i<RSP_LEN-2;i++){ seed=seed*1103515245u+12345u; f[i]=(unsigned char)(seed>>16); }
		FrameSetCrc(f,RSP_LEN);
		if(!FrameCrcOk(f,RSP_LEN)) bad++;
		f[k%(RSP_LEN-2)] ^= (unsigned char)(1u<<(k%8));      /* 翻一个比特 */
		if(FrameCrcOk(f,RSP_LEN)) miss++;
	  }
	  printf("3) 500 帧写入后自校验通过, 单比特错漏检 %d 次 %s\n", miss, miss?"FAIL":"OK");
	  bad+=miss; }

	/* 4. 16 位大端打包，含负数（距离 -1 表示无效，必须能正确还原） */
	{ int vals[7]={0,1,-1,235,-52,32767,-32768}; int f2=0;
	  for(k=0;k<7;k++){ unsigned char p[2]; PutI16(p,vals[k]);
	    if(GetI16(p)!=vals[k]){ printf("   PutI16/GetI16 %d 还原成 %d\n",vals[k],GetI16(p)); f2++; } }
	  printf("4) PutI16/GetI16 往返(含负数): %s\n", f2?"FAIL":"OK"); bad+=f2; }

	/* 5. 查表插值 vs 浮点公式 */
	{ double worst=0; int wa=0;
	  for(k=200;k<=760;k++){
		double Rt=13000.0*k/(1023.0-k);
		double Tc=1.0/(1.0/298.15+log(Rt/10000.0)/3950.0)-273.15;
		double e=fabs(AdcToTemp10((unsigned int)k)/10.0-Tc);
		if(e>worst){worst=e;wa=k;}
	  }
	  printf("5) ADC 200~760 查表最大误差 %.3f C (adc=%d)  %s\n",worst,wa,worst<0.3?"OK":"FAIL");
	  if(worst>=0.3) bad++; }

	/* 6. 单调性：温度必须随 ADC 单调递减，否则控制律会抖 */
	{ int nm=0; for(k=1;k<=1023;k++) if(AdcToTemp10(k)>AdcToTemp10(k-1)) nm++;
	  printf("6) 查表单调性: 非单调点 %d 个 %s\n", nm, nm?"FAIL":"OK"); bad+=nm; }

	printf("\n总计失败项: %d\n", bad);
	return bad?1:0;
}
