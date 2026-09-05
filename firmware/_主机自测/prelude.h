/* 把 Keil C51 的存储类关键字定义掉，让 gcc 能解析 */
#define code
#define xdata
#define data
#define idata
#define pdata
#define bdata
#define reentrant
#define interrupt
#define using
