$ErrorActionPreference = 'Stop'
$project = Split-Path -Parent $PSScriptRoot
$backend = Join-Path $project 'backend'
$python = Join-Path $project '.venv\Scripts\python.exe'
$frontendIndex = Join-Path $project 'frontend\dist\index.html'
$healthUrl = 'http://127.0.0.1:8000/api/health'
$homeUrl = 'http://localhost:8000'

if (-not (Test-Path -LiteralPath $python)) {
    throw "Python virtual environment not found. Run setup.cmd first: $python"
}
if (-not (Test-Path -LiteralPath $frontendIndex)) {
    throw 'frontend/dist/index.html was not found. Run build-and-serve.cmd first.'
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
        throw "Port 8000 is already used by PID $($listener.OwningProcess)."
    }

    $launchArgs = @{
        FilePath = $python
        ArgumentList = @('-m', 'uvicorn', 'app.main:app', '--host', '0.0.0.0', '--port', '8000')
        WorkingDirectory = $backend
        WindowStyle = 'Hidden'
    }
    Start-Process @launchArgs

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
    throw 'Backend startup timed out. Check COM4, backend/.env, and Python dependencies.'
}

try {
    Invoke-RestMethod -Method Post -Uri 'http://127.0.0.1:8000/api/serial/resume' -TimeoutSec 3 | Out-Null
} catch {
    Write-Warning 'The web service is running, but COM4 could not be resumed. Close STC-ISP or a serial assistant, then refresh.'
}

Start-Process $homeUrl
Write-Host "Dorm Butler started: $homeUrl"
