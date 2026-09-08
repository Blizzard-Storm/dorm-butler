@echo off
chcp 65001 >nul
cd /d "%~dp0backend"
if not exist "..\.venv\Scripts\python.exe" (
  echo [!] 找不到虚拟环境，请先双击项目根目录的 setup.cmd（它会用 py -3 建好 .venv 并装依赖）
  pause & exit /b 1
)
if not exist ".env" copy ".env.example" ".env" >nul
echo === 寝室管家 后端 ===
echo 本机访问：  http://127.0.0.1:8000
echo 手机访问：  http://<本机局域网IP>:8000   ^(先运行 ipconfig 查 IP^)
echo.
"..\.venv\Scripts\python.exe" -m uvicorn app.main:app --host 0.0.0.0 --port 8000
pause
