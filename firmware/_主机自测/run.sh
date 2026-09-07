#!/bin/bash
set -e

cp ../NodeA_主控网关/inc/protocol.h inc/ 2>/dev/null || true

# 第 1 步是纯文本比对，不需要编译器，所以放在 gcc 检查之前：
# 没装 gcc 的机器（只烧板、不跑自测的同学）照样能验出 XDATA 配置被改坏。
echo "=== 1. Keil XDATA 启动配置检查 ==="
startup=../common/STARTUP.A51
if ! grep -Eq '^[[:space:]]*XDATALEN[[:space:]]+EQU[[:space:]]+0700H' "$startup"; then
  echo "错误：STARTUP.A51 未把 XDATALEN 配成 0700H。"
  exit 1
fi
for project in ../NodeA_主控网关/NodeA.uvproj ../NodeB_环境节点/NodeB.uvproj ../NodeC_安防节点/NodeC.uvproj; do
  if ! grep -Fq '..\common\STARTUP.A51' "$project"; then
    echo "错误：$project 未引用统一的 STARTUP.A51。"
    exit 1
  fi
  if ! grep -Fq 'XRAM(0-0x6FF)' "$project"; then
    echo "错误：$project 的 XRAM 范围不再是 0000H-06FFH，请同步检查 XDATALEN。"
    exit 1
  fi
done
echo "三个 Keil 工程均在 C main() 前清零 XDATA 0000H-06FFH。"
echo

# 下面两步要真编译。没有编译器就直接失败，绝不能跳过后当成通过——
# 以前用 `gcc ... | grep -q error` 判断，gcc 不存在时报的 "command not found"
# 里没有 "error" 字样，grep 匹配不到，于是三个文件全部打印"通过"，
# 实际上一行代码都没编译。
if ! command -v gcc >/dev/null 2>&1; then
  echo "错误：找不到 gcc，语法检查与协议自测无法进行。"
  echo "装一个 MinGW-w64 或 MSYS2 的 gcc 并加入 PATH 后重试。"
  exit 1
fi

echo "=== 2. 三个 main.c 语法检查 ==="
fail=0
for f in mainA mainB mainC; do
  printf "%-10s" "$f.c"
  # 直接看 gcc 的退出码，不再靠在输出里找关键字
  if out=$(gcc -fsyntax-only -std=gnu89 -Wall -Wextra -Wdeclaration-after-statement \
           -Wno-unused-function -Wno-incompatible-pointer-types \
           -I inc -include prelude.h "$f.c" 2>&1); then
    echo "通过"
  else
    echo "有错误："
    printf '%s\n' "$out"
    fail=1
  fi
done
[ "$fail" -eq 0 ] || exit 1
echo
echo "=== 3. 协议与查表自测 ==="
gcc -std=gnu89 -O1 -I inc -I . -o test.exe test.c -lm
./test.exe
