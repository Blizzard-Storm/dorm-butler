@echo off
chcp 65001 >nul
cd /d "%~dp0"
if not exist ".venv\Scripts\python.exe" (
  echo [ERROR] Python environment is missing. Run setup.cmd first.
  pause
  exit /b 1
)
echo Make sure 启动寝室管家.cmd is running in serial mode before continuing.
echo.
".venv\Scripts\python.exe" "tools\hardware_acceptance.py"
echo.
pause
