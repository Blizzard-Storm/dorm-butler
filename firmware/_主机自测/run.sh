#!/bin/bash
set -e

# 没有编译器就直接失败。以前这里用 `gcc ... | grep -q error` 判断，
# gcc 不存在时 "command not found" 里没有 "error" 字样，grep 匹配不到，
# 于是三个文件全部打印"通过"——检查实际上一行代码都没编译。
if ! command -v gcc >/dev/null 2>&1; then
  echo "错误：找不到 gcc，无法进行自测。"
  echo "装一个 MinGW-w64 或 MSYS2 的 gcc 并加入 PATH 后重试。"
  exit 1
fi

cp ../NodeA_主控网关/inc/protocol.h inc/ 2>/dev/null || true
echo "=== 1. 三个 main.c 语法检查 ==="
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
echo "=== 2. 协议与查表自测 ==="
gcc -std=gnu89 -O1 -I inc -I . -o test.exe test.c -lm
./test.exe
