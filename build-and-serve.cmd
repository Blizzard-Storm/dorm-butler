@echo off
chcp 65001 >nul
rem 演示/交付用：构建前端后由后端单端口托管，手机直接访问 8000 即可
cd /d "%~dp0frontend"
call npm run build || (echo 前端构建失败 & pause & exit /b 1)
cd /d "%~dp0"
call start-backend.cmd
