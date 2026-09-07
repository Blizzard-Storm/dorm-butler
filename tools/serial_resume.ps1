# 烧录后：恢复后端串口连接。

$ErrorActionPreference = 'Stop'
$url = 'http://127.0.0.1:8000/api/serial/resume'

Write-Host ""
Write-Host "  ============================================"
Write-Host "     烧录完成，恢复串口"
Write-Host "  ============================================"
Write-Host ""
Write-Host "  正在恢复后端串口连接..."

try {
    Invoke-RestMethod -Method Post -Uri $url -TimeoutSec 5 | Out-Null
    Write-Host "  已恢复，后端会自动重新连接板子，网页不用刷新。"
} catch {
    Write-Host "  没能连上后端接口。如果你是用「烧录前-释放串口.cmd」的降级方案"
    Write-Host "  整个停掉了后端，这里需要你手动运行 start-backend.cmd 重新启动。"
}

Write-Host ""
