# 烧录前：暂停后端串口，给 STC-ISP 让路。
#
# 为什么不是批处理（.cmd）里直接写逻辑：cmd.exe 的 if/else 代码块解析
# 在大段中文文本混着括号、goto 标签时会把行"吃掉"合并，出现过难以复现的
# 诡异行为。PowerShell 处理 UTF-8 和控制流稳得多，所以把逻辑放这里，
# .cmd 只做双击入口。

$ErrorActionPreference = 'Stop'
$url = 'http://127.0.0.1:8000/api/serial/pause'

Write-Host ""
Write-Host "  ============================================"
Write-Host "     释放串口，准备烧录单片机"
Write-Host "  ============================================"
Write-Host ""
Write-Host "  正在暂停后端串口（后端和网页会继续运行，不受影响）..."

try {
    $resp = Invoke-RestMethod -Method Post -Uri $url -TimeoutSec 5
    Write-Host "  已暂停，网页仍可正常打开。烧完后运行「烧录后-恢复串口.cmd」即可，不用重启后端。"
} catch {
    Write-Host "  没能连上后端接口（后端可能没在跑，或监听的不是 8000 端口）。"
    Write-Host "  退而求其次：直接停掉整个后端进程，让串口空出来。"
    $procs = Get-CimInstance Win32_Process -Filter "Name='python.exe'" |
        Where-Object { $_.CommandLine -like '*uvicorn*' }
    if ($procs) {
        $procs | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
        Write-Host "  已停止 $($procs.Count) 个后端进程，烧完后需要重新运行 start-backend.cmd。"
    } else {
        Write-Host "  后端本来就没在跑，串口本来就是空的。"
    }
    Start-Sleep -Seconds 2
}

Write-Host ""
Write-Host "  串口应该已经空出来了，可以用 STC-ISP 烧录了。"
Write-Host ""
Write-Host "  烧录步骤："
Write-Host "    1. STC-ISP 里点「打开程序文件」，确认选的是你要烧的那个 hex"
Write-Host "    2. 频率选 11.0592MHz"
Write-Host "    3. 点「下载/编程」，然后拔掉 USB 再插上（冷启动握手）"
Write-Host ""
Write-Host "  烧完之后，运行「烧录后-恢复串口.cmd」。"
Write-Host ""
