$ErrorActionPreference = 'Stop'

function Test-Command { param([string]$Name) return $null -ne (Get-Command $Name -ErrorAction SilentlyContinue) }

function Get-NpmExe {
  if (Test-Command 'npm') { return 'npm' }
  $candidates = @(
    Join-Path $env:ProgramFiles 'nodejs/npm.cmd'),
    (Join-Path $env:LocalAppData 'Programs/nodejs/npm.cmd'),
    (Join-Path $env:AppData 'npm/npm.cmd')
  foreach ($p in $candidates) { if (Test-Path $p) { return $p } }
  return $null
}

function Wait-ForHttp { param([string]$Url, [int]$TimeoutSec = 120)
  $sw = [System.Diagnostics.Stopwatch]::StartNew()
  while ($sw.Elapsed.TotalSeconds -lt $TimeoutSec) {
    try {
      $resp = Invoke-WebRequest -UseBasicParsing -Uri $Url -TimeoutSec 3
      if ($resp.StatusCode -ge 200 -and $resp.StatusCode -lt 500) { return $true }
    } catch {}
    Start-Sleep -Seconds 2
  }
  return $false
}

$root = $PSScriptRoot
$serverDir = Join-Path $root 'server'
$webDir = Join-Path $root 'web'
$venvDir = Join-Path $serverDir '.venv'
$pythonExe = Join-Path $venvDir 'Scripts\python.exe'

# Ensure Python available to create venv
if (-not (Test-Command 'python')) {
  if (Test-Command 'winget') {
    Write-Host 'Python not found. Installing Python 3.11 via winget (may prompt for elevation)...'
    winget install -e --id Python.Python.3.11 --accept-source-agreements --accept-package-agreements | Out-Null
  } else {
    Write-Warning 'Python is not available and winget is missing. Please install Python 3.11+ from https://www.python.org/downloads/ and re-run.'
    Start-Process 'https://www.python.org/downloads/'
    exit 1
  }
}

# Ensure venv
if (!(Test-Path $pythonExe)) {
  Write-Host "Creating Python venv..."
  python -m venv $venvDir
}

# Install backend deps
Write-Host "Installing backend dependencies..."
& $pythonExe -m pip install --upgrade pip
& $pythonExe -m pip install -r (Join-Path $serverDir 'requirements.txt')

# Optional: spaCy model
# & $pythonExe -m spacy download en_core_web_sm

# Start backend (FastAPI) in background job
Write-Host "Starting backend on http://127.0.0.1:8000 ..."
Start-Job -Name backend -ScriptBlock {
  Set-Location $using:root
  & $using:pythonExe -m uvicorn server.main:app --host 127.0.0.1 --port 8000 --reload
} | Out-Null

# Ensure Node/npm
$npmExe = Get-NpmExe
if (-not $npmExe) {
  if (Test-Command 'winget') {
    Write-Host 'Node.js (npm) not found. Installing Node.js LTS via winget (may prompt for elevation)...'
    winget install -e --id OpenJS.NodeJS.LTS --accept-source-agreements --accept-package-agreements | Out-Null
    $npmExe = Get-NpmExe
  } else {
    Write-Warning 'npm is not available and winget is missing. Please install Node.js LTS from https://nodejs.org and re-run.'
    Start-Process 'https://nodejs.org'
    exit 1
  }
}

# Frontend
Set-Location $webDir
if (!(Test-Path (Join-Path $webDir 'node_modules'))) {
  Write-Host "Installing frontend dependencies..."
  & $npmExe install
}

Write-Host "Starting frontend on http://127.0.0.1:5173 ..."
Start-Job -Name frontend -ScriptBlock {
  Set-Location $using:webDir
  & $using:npmExe run dev
} | Out-Null

# Wait for frontend to become ready, then open browser
if (Wait-ForHttp -Url 'http://127.0.0.1:5173' -TimeoutSec 120) {
  Start-Process 'http://127.0.0.1:5173'
} else {
  Write-Warning 'Frontend did not become ready in time. You can open http://127.0.0.1:5173 manually.'
}

Write-Host "Both servers are running in this PowerShell session as background jobs."
Write-Host "To stop: press Ctrl+C or run: Get-Job | Stop-Job"

# Keep the window attached to the frontend job (until you stop it)
Wait-Job -Name frontend


