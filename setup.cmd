@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion
cd /d "%~dp0"

echo.
echo   ============================================
echo      寝室管家 · 上位机   安装与启动
echo   ============================================
echo.

REM ---------------------------------------------------------------- 找 Python
REM Prefer the py launcher: a python on PATH may be MSYS2/Cygwin, whose venv
REM layout is .venv/bin, while every script here expects .venv\Scripts.
set "PYCMD="
py -3 --version >nul 2>&1
if !errorlevel! equ 0 set "PYCMD=py -3"
if not defined PYCMD (
    python --version >nul 2>&1
    if !errorlevel! equ 0 set "PYCMD=python"
)
if not defined PYCMD (
    echo   [X] 没有找到 Python。
    echo.
    echo       请到 https://www.python.org/downloads/ 下载 Python 3.11 或更高版本，
    echo       安装时务必勾选 [Add python.exe to PATH]，装完重新双击本文件。
    echo.
    pause & exit /b 1
)
for /f "tokens=*" %%V in ('%PYCMD% --version 2^>^&1') do echo   [1/3] 找到 %%V

REM ---------------------------------------------------------------- 虚拟环境
if exist ".venv\Scripts\python.exe" (
    echo   [2/3] 虚拟环境已存在，跳过创建
) else (
    echo   [2/3] 创建虚拟环境...
    %PYCMD% -m venv .venv
    if errorlevel 1 (
        echo   [X] 创建虚拟环境失败。
        pause & exit /b 1
    )
)

REM Must be a Windows-layout venv, otherwise every command below fails with
REM "The system cannot find the path specified".
if not exist ".venv\Scripts\python.exe" (
    echo.
    echo   [X] 虚拟环境建好了，但里面没有 .venv\Scripts\python.exe。
    echo.
    echo       说明 %PYCMD% 不是 Windows 原生 Python（常见于 MSYS2 / Cygwin / Git Bash
    echo       自带的那个），它生成的是 .venv\bin 布局，本项目的启动脚本不认。
    echo.
    echo       解决：装官方 Windows 版 Python（https://www.python.org/downloads/ ，
    echo       安装时勾选 [Add python.exe to PATH]），删掉 .venv 目录，再双击本文件。
    echo.
    pause & exit /b 1
)

echo         安装依赖，约需 1 分钟，请稍候...
".venv\Scripts\python.exe" -m pip install --upgrade pip --quiet
".venv\Scripts\python.exe" -m pip install -r "backend\requirements.txt" --quiet
if errorlevel 1 (
    echo.
    echo   [!] 依赖安装失败，先看上面 pip 打出来的报错。如果是连不上 pypi.org，
    echo       换清华镜像再试一次：
    echo.
    echo       .venv\Scripts\python.exe -m pip install -r backend\requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple
    echo.
    pause & exit /b 1
)

REM ---------------------------------------------------------------- 配置
if not exist "backend\.env" (
    copy "backend\.env.example" "backend\.env" >nul
    echo   [3/3] 已生成 backend\.env（默认模拟模式，不用接硬件）
) else (
    echo   [3/3] backend\.env 已存在，保留不动
)

echo.
echo   ============================================
echo      安装完成，正在启动
echo   ============================================
echo.
echo     本机访问：  http://localhost:8000
echo     手机访问：  先运行 ipconfig 查 IPv4 地址，再开 http://那个地址:8000
echo.
echo     关掉这个黑窗口 = 停止服务
echo     下次启动直接双击 启动寝室管家.cmd，不用再跑本文件
echo.

start "" http://localhost:8000
cd backend
"..\.venv\Scripts\python.exe" -m uvicorn app.main:app --host 0.0.0.0 --port 8000
pause
