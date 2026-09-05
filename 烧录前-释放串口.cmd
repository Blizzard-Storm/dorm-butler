@echo off
chcp 65001 >nul
echo.
echo   ============================================
echo      释放串口，准备烧录单片机
echo   ============================================
echo.
echo   正在停止后端服务...

powershell -NoProfile -Command ^
  "$n=0; Get-CimInstance Win32_Process -Filter \"Name='python.exe'\" | Where-Object { $_.CommandLine -like '*uvicorn*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue; $n++ }; if ($n -gt 0) { Write-Host \"   已停止 $n 个后端进程\" } else { Write-Host '   后端本来就没在跑' }"

timeout /t 2 /nobreak >nul

echo.
echo   串口已释放，现在可以用 STC-ISP 烧录了。
echo.
echo   烧录步骤：
echo     1. STC-ISP 里点「打开程序文件」，确认选的是你要烧的那个 hex
echo     2. 频率选 11.0592MHz
echo     3. 点「下载/编程」，然后拔掉 USB 再插上（冷启动握手）
echo.
echo   烧完之后，双击 start-backend.cmd 重新启动后端。
echo.
pause
