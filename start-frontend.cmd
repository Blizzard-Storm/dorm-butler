@echo off
chcp 65001 >nul
cd /d "%~dp0frontend"
if not exist "node_modules" (
  echo 首次运行，正在安装依赖...
  call npm install --registry=https://registry.npmmirror.com
)
echo === 寝室管家 前端开发服务器 ===
echo 打开 http://localhost:5173  ^(接口自动代理到 8000^)
call npm run dev
pause
