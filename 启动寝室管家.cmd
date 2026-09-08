@echo off
chcp 65001 >nul
cd /d "%~dp0"
start "寝室管家服务" cmd /c ""%~dp0start-backend.cmd""
timeout /t 3 /nobreak >nul
start "" http://localhost:8000
