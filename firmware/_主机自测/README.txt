把 protocol.h 里的 CRC、打包、以及节点B 的温度查表放到电脑上跑一遍，
不用板子就能确认这几段纯算法是对的。改过 protocol.h 或 NtcTable 之后建议重跑。

需要 gcc（MSYS2 / MinGW / WSL 都行）。在本目录下：

    bash run.sh

它做两件事：
  1) 用 gcc 把三个 main.c 过一遍语法（8051 的 code/xdata/data 关键字由 prelude.h 定义掉，
     STC15F2K60S2.H 换成空壳，因为里面全是 gcc 解析不了的 sfr 声明）
  2) 编译运行 test.c，检查 6 项：
     - CRC16 对已知 ModBus 测试向量
     - CRC16 对 2000 组随机数据 vs 独立参考实现
     - 整帧 CRC 写入/校验，单比特翻转必须被抓到
     - PutI16/GetI16 往返，含负数（距离 -1、负温度都会走这条路）
     - 温度查表 vs 浮点公式的最大误差
     - 温度查表的单调性

注意：inc 目录下是 BSP 头文件转成 UTF-8 的副本，只给 gcc 看，不参与 Keil 编译。
真正编译用的是各节点工程自己的 inc。改了 protocol.h 要记得同步过来：
    cp ../NodeA_主控网关/inc/protocol.h inc/
