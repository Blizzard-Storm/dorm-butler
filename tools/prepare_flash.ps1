$ErrorActionPreference = 'Stop'
$project = Split-Path -Parent $PSScriptRoot

Write-Host ''
Write-Host '正在释放 COM4，准备烧录...'

$targetIds = @()
$targetIds += Get-CimInstance Win32_Process | Where-Object {
    $_.Name -eq 'python.exe' -and
    $_.CommandLine -match [regex]::Escape($project) -and
    $_.CommandLine -match 'uvicorn\s+app\.main:app'
} | ForEach-Object { $_.ProcessId }

$targetIds += Get-NetTCPConnection -LocalPort 8000 -State Listen -ErrorAction SilentlyContinue |
    ForEach-Object { $_.OwningProcess }

$targetIds = $targetIds | Where-Object { $_ } | Select-Object -Unique
foreach ($id in $targetIds) {
    $proc = Get-CimInstance Win32_Process -Filter "ProcessId=$id" -ErrorAction SilentlyContinue
    if ($proc -and $proc.Name -eq 'python.exe' -and $proc.CommandLine -match 'uvicorn\s+app\.main:app') {
        Stop-Process -Id $id -Force -ErrorAction SilentlyContinue
        Write-Host "已停止后端进程 PID $id"
    }
}

Start-Sleep -Milliseconds 800
if (Get-NetTCPConnection -LocalPort 8000 -State Listen -ErrorAction SilentlyContinue) {
    Write-Warning '8000 端口仍被占用；请关闭其他运行中的宿舍管家后端后再下板。'
} else {
    Write-Host '后端已完全停止，COM4 已释放，可使用 STC-ISP 下板。'
}
