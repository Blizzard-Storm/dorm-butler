#!/bin/bash
set -e
cp ../NodeA_主控网关/inc/protocol.h inc/ 2>/dev/null || true
echo "=== 1. 三个 main.c 语法检查 ==="
for f in mainA mainB mainC; do
  printf "%-10s" "$f.c"
  if gcc -fsyntax-only -std=gnu89 -Wall -Wextra -Wdeclaration-after-statement          -Wno-unused-function -Wno-incompatible-pointer-types          -I inc -include prelude.h $f.c 2>&1 | grep -q "error"; then
    echo "有错误："
    gcc -fsyntax-only -std=gnu89 -I inc -include prelude.h $f.c
  else
    echo "通过"
  fi
done
echo
echo "=== 2. 协议与查表自测 ==="
gcc -std=gnu89 -O1 -I inc -I . -o test.exe test.c -lm
./test.exe
