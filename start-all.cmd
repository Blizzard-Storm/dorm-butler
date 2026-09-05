@echo off
chcp 65001 >nul
rem 一键启动：后端 + 前端开发服务器，各开一个窗口
start "寝室管家-后端" cmd /k "%~dp0start-backend.cmd"
timeout /t 3 >nul
start "寝室管家-前端" cmd /k "%~dp0start-frontend.cmd"
echo 两个服务已在新窗口启动。
echo   前端开发页  http://localhost:5173
echo   后端与接口  http://localhost:8000/docs
