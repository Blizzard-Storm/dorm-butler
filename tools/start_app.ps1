$ErrorActionPreference = 'Stop'
$project = Split-Path -Parent $PSScriptRoot
$backend = Join-Path $project 'backend'
$python = Join-Path $project '.venv\Scripts\python.exe'
$frontendIndex = Join-Path $project 'frontend\dist\index.html'
$healthUrl = 'http://127.0.0.1:8000/api/health'
$homeUrl = 'http://localhost:8000'

if (-not (Test-Path -LiteralPath $python)) {
    throw "找不到虚拟环境，请先双击 setup.cmd：$python"
}
if (-not (Test-Path -LiteralPath $frontendIndex)) {
    throw '找不到 frontend/dist/index.html，请先运行 build-and-serve.cmd 构建前端。'
}

$healthy = $false
try {
    $health = Invoke-RestMethod -Uri $healthUrl -TimeoutSec 2
    $healthy = [bool]$health.ok
} catch {
    $healthy = $false
}

if (-not $healthy) {
    $listener = Get-NetTCPConnection -LocalPort 8000 -State Listen -ErrorAction SilentlyContinue |
        Select-Object -First 1
    if ($listener) {
        throw "端口 8000 已被其他程序占用（PID $($listener.OwningProcess)），寝室管家无法启动。"
    }

    Start-Process -FilePath $python `
        -ArgumentList @('-m', 'uvicorn', 'app.main:app', '--host', '0.0.0.0', '--port', '8000') `
        -WorkingDirectory $backend -WindowStyle Hidden

    for ($attempt = 1; $attempt -le 12; $attempt++) {
        Start-Sleep -Milliseconds 500
        try {
            $health = Invoke-RestMethod -Uri $healthUrl -TimeoutSec 2
            if ($health.ok) {
                $healthy = $true
                break
            }
        } catch {
            $healthy = $false
        }
    }
}

if (-not $healthy) {
    throw '后端启动超时，请检查 COM4、backend/.env 和 Python 依赖。'
}

try {
    Invoke-RestMethod -Method Post -Uri 'http://127.0.0.1:8000/api/serial/resume' -TimeoutSec 3 | Out-Null
} catch {
    Write-Warning '服务已启动，但 COM4 暂未恢复；请关闭 STC-ISP 或串口助手后刷新网页。'
}

Start-Process $homeUrl
Write-Host "寝室管家已启动：$homeUrl"
