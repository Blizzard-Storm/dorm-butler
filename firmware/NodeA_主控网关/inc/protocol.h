#ifndef _PROTOCOL_H_
#define _PROTOCOL_H_

#define BUS_BAUD            9600

#define BUS_USE_MODBUS      1

#define ADDR_MASTER         0x01
#define ADDR_ENV            0x02
#define ADDR_SEC            0x03

#define FUNC_POLL           0x03
#define FUNC_SETCFG         0x10
#define FUNC_ACT            0x06

#define REQ_LEN             8
#define RSP_LEN             16

#define F_ADDR              0
#define F_FUNC              1
#define REQ_ARG0            2
#define REQ_ARG1            3
#define REQ_ARG2            4
#define REQ_ARG3            5
#define RSP_DATA            2

#define ACT_ENV_WIN_CLOSE   252
#define ACT_ENV_WIN_OPEN    253
#define ACT_ENV_WIN_AUTO    254
#define ACT_ENV_FAN_AUTO    255

#define ACT_SEC_UNLOCK      0
#define ACT_SEC_LOCK        1
#define ACT_SEC_SILENCE     2

#define NODE_TYPE_ENV       0x0B
#define NODE_TYPE_SEC       0x0C

#define D_ENV_TYPE          0           /* = NODE_TYPE_ENV */
#define D_ENV_FLAGS         1
#define D_ENV_TEMP_H        2
#define D_ENV_TEMP_L        3
#define D_ENV_LUX           4
#define D_ENV_FAN           5
#define D_ENV_RAWRT_H       6
#define D_ENV_RAWRT_L       7
#define D_ENV_RAWROP_H      8
#define D_ENV_RAWROP_L      9
#define D_ENV_MISS          10
#define D_ENV_TEMPSET       11          /* current temperature threshold, degrees Celsius */

#define ENVF_FAN_ON         0x01
#define ENVF_WIN_OPEN       0x02
#define ENVF_TEMP_HI        0x04
#define ENVF_LUX_LOW        0x08
#define ENVF_FAN_MANUAL     0x10
#define ENVF_WIN_MANUAL     0x20

#define D_SEC_TYPE          0           /* = NODE_TYPE_SEC */
#define D_SEC_FLAGS         1
#define D_SEC_DIST_H        2
#define D_SEC_DIST_L        3
#define D_SEC_ALARM         4
#define D_SEC_VIBCNT        5
#define D_SEC_DOORCNT       6
#define D_SEC_STATE         7
#define D_SEC_RSV8          8
#define D_SEC_RSV9          9
#define D_SEC_RSV10         10
#define D_SEC_MISS          11

#define SECF_ARMED          0x01
#define SECF_DOOR_OPEN      0x02
#define SECF_VIB            0x04
#define SECF_NEAR           0x08
#define SECF_LOCKED         0x10
#define SECF_SILENCED       0x20

#define SECST_DISARMED      0
#define SECST_ARMING        1
#define SECST_ARMED         2
#define SECST_ALARM         3

#define ALM_NONE            0
#define ALM_NOTICE          1
#define ALM_ALARM           2

#define IR_LEN              3
#define IR_HDR              0x5A

#define IR_CMD_TOGGLE_ARM   0x01
#define IR_CMD_ALARM        0x02
#define IR_CMD_SILENCE      0x03

#define NVM_MAGIC           0xA5
#define NVM_A_MAGIC         0
#define NVM_A_TEMPSET       1
#define NVM_A_ARM           2
#define NVM_A_ALARM_H       3
#define NVM_A_ALARM_M       4
#define NVM_A_NEARCM        5
#define NVM_A_SUM           6
#define NVM_A_COUNT         7

#define DEF_TEMPSET         28
#define DEF_ARM             0
#define DEF_ALARM_H         7
#define DEF_ALARM_M         0
#define DEF_NEARCM          60

#ifndef PROTO_NO_PUTI16
static void PutI16(unsigned char *p, int v)
{
	p[0] = (unsigned char)((unsigned int)v >> 8);
	p[1] = (unsigned char)((unsigned int)v & 0x00FF);
}
#endif

#ifndef PROTO_NO_GETI16
static int GetI16(unsigned char *p)
{
	unsigned int u = (unsigned int)(((unsigned int)p[0] << 8) | (unsigned int)p[1]);

#ifdef __C51__

	return (int)u;
#else

	if(u & 0x8000u) return (int)((long)u - 65536L);
	return (int)u;
#endif
}
#endif

static unsigned int Crc16Modbus(unsigned char *buf, unsigned char len)
{
	unsigned int crc = 0xFFFF;
	unsigned char i, j;

	for(i = 0; i < len; i++)
	{
		crc ^= (unsigned int)buf[i];
		for(j = 0; j < 8; j++)
		{
			if(crc & 0x0001)  crc = (crc >> 1) ^ 0xA001;
			else              crc =  crc >> 1;
		}
	}
	return crc;
}

#ifndef PROTO_NO_FRAMECRC

static void FrameSetCrc(unsigned char *buf, unsigned char len)
{
	unsigned int crc = Crc16Modbus(buf, (unsigned char)(len - 2));
	buf[len - 2] = (unsigned char)(crc & 0x00FF);
	buf[len - 1] = (unsigned char)(crc >> 8);
}

static unsigned char FrameCrcOk(unsigned char *buf, unsigned char len)
{
	unsigned int crc = Crc16Modbus(buf, (unsigned char)(len - 2));

	if(buf[len - 2] != (unsigned char)(crc & 0x00FF)) return 0;
	if(buf[len - 1] != (unsigned char)(crc >> 8))     return 0;
	return 1;
}
#endif  /* PROTO_NO_FRAMECRC */

#endif
