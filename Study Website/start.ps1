$ErrorActionPreference = 'Stop'

function Test-Command { param([string]$Name) return $null -ne (Get-Command $Name -ErrorAction SilentlyContinue) }

function Get-NpmExe {
  if (Test-Command 'npm') { return 'npm' }
  $candidates = @(
    (Join-Path $env:ProgramFiles 'nodejs/npm.cmd'),
    (Join-Path $env:LocalAppData 'Programs/nodejs/npm.cmd'),
    (Join-Path $env:AppData 'npm/npm.cmd')
  )
  foreach ($p in $candidates) { if (Test-Path $p) { return $p } }
  return $null
}

function Wait-ForHttp { param([string]$Url, [int]$TimeoutSec = 300)
  $sw = [System.Diagnostics.Stopwatch]::StartNew()
  $attempt = 0
  Write-Host "Waiting for $Url to become available (timeout: $TimeoutSec seconds)..."
  
  while ($sw.Elapsed.TotalSeconds -lt $TimeoutSec) {
    $attempt++
    try {
      $resp = Invoke-WebRequest -UseBasicParsing -Uri $Url -TimeoutSec 5
      if ($resp.StatusCode -ge 200 -and $resp.StatusCode -lt 500) { 
        Write-Host "[OK] $Url is now available after $($sw.Elapsed.TotalSeconds.ToString('F1')) seconds"
        return $true 
      }
    } catch {
      if ($attempt % 10 -eq 0) {
        Write-Host "Attempt $attempt - Still waiting for $Url... ($($sw.Elapsed.TotalSeconds.ToString('F1'))s elapsed)"
      }
    }
    Start-Sleep -Seconds 3
  }
  Write-Host "[ERROR] $Url did not become available within $TimeoutSec seconds"
  return $false
}

$root = $PSScriptRoot
$serverDir = Join-Path $root 'server'
$webDir = Join-Path $root 'web'
$venvDir = Join-Path $serverDir '.venv'
$pythonExe = Join-Path $venvDir 'Scripts\python.exe'

# Check for existing servers and clean up
Write-Host "Checking for existing servers..."
$backendPort = netstat -ano | findstr ":8000" | findstr "LISTENING"
$frontendPort = netstat -ano | findstr ":5173" | findstr "LISTENING"

if ($backendPort) {
  Write-Warning "Port 8000 is already in use. You may need to stop the existing server."
  Write-Host "Run: Get-Job | Stop-Job (to stop PowerShell background jobs)"
  Write-Host "Or check Task Manager for Python/uvicorn processes"
}

if ($frontendPort) {
  Write-Warning "Port 5173 is already in use. You may need to stop the existing server."
  Write-Host "Run: Get-Job | Stop-Job (to stop PowerShell background jobs)"
  Write-Host "Or check Task Manager for Node.js processes"
}

# Stop any existing PowerShell background jobs
$existingJobs = Get-Job
if ($existingJobs) {
  Write-Host "Stopping existing PowerShell background jobs..."
  $existingJobs | Stop-Job
  $existingJobs | Remove-Job
}

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
Write-Host "Installing Python packages (this may take a few minutes)..."
$installResult = & $pythonExe -m pip install -r (Join-Path $serverDir 'requirements.txt') --no-cache-dir
if ($LASTEXITCODE -ne 0) {
  Write-Warning "Some packages failed to install, but continuing..."
  Write-Host "Install output: $installResult"
} else {
  Write-Host "[OK] Backend dependencies installed successfully"
}

# Optional: spaCy model
# & $pythonExe -m spacy download en_core_web_sm

# Start backend (FastAPI) in background job
Write-Host "Starting backend on http://127.0.0.1:8000 ..."
Start-Job -Name backend -ScriptBlock {
  Set-Location $using:root
  Write-Host "Backend job started, running from: $using:root"
  & $using:pythonExe -m uvicorn server.main:app --host 127.0.0.1 --port 8000 --reload
} | Out-Null

# Give the backend a moment to start
Start-Sleep -Seconds 5

# Check if backend job is still running
$backendJob = Get-Job -Name backend
if ($backendJob.State -eq 'Running') {
  Write-Host "Backend job is running, checking if server is ready..."
} else {
  Write-Warning "Backend job failed to start. State: $($backendJob.State)"
  Write-Host "Backend job output:"
  Receive-Job -Name backend
  Write-Host ""
  Write-Host "You can try starting the backend manually:"
  Write-Host "  cd '$root'"
  Write-Host "  server\.venv\Scripts\python.exe -m uvicorn server.main:app --host 127.0.0.1 --port 8000 --reload"
  Write-Host ""
}

# Check if backend is ready (optional, but helpful)
Write-Host "Checking if backend is ready..."
if (Wait-ForHttp -Url 'http://127.0.0.1:8000/docs' -TimeoutSec 60) {
  Write-Host "[OK] Backend is ready"
} else {
  Write-Warning "Backend may not be ready yet, but continuing with frontend startup..."
  Write-Host "You can check backend status at http://127.0.0.1:8000/docs"
}

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
  Write-Host "This may take a few minutes on first run..."
  $installResult = npm install
  if ($LASTEXITCODE -ne 0) {
    Write-Warning "npm install failed with exit code: $LASTEXITCODE"
    Write-Host "Install output: $installResult"
    Write-Host "Trying to continue anyway - you may need to run 'npm install' manually in the web directory"
  } else {
    Write-Host "[OK] Frontend dependencies installed successfully"
  }
} else {
  Write-Host "[OK] Frontend dependencies already installed"
}

Write-Host "Starting frontend on http://127.0.0.1:5173 ..."
$frontendJob = Start-Job -Name frontend -ScriptBlock {
  param($webDir)
  Set-Location $webDir
  Write-Host "Frontend job started, running from: $webDir"
  Write-Host "Current directory: $(Get-Location)"
  Write-Host "Contents: $(Get-ChildItem)"
  npm run dev
} -ArgumentList $webDir

# Give the frontend job a moment to start
Start-Sleep -Seconds 5

# Check if the frontend job is still running
if ($frontendJob.State -eq 'Running') {
  Write-Host "Frontend job is running, waiting for server to become available..."
} else {
  Write-Warning "Frontend job failed to start. State: $($frontendJob.State)"
  Write-Host "Frontend job output:"
  Receive-Job -Name frontend
  Write-Host ""
  Write-Host "You can try starting the frontend manually:"
  Write-Host "  cd '$webDir'"
  Write-Host "  npm run dev"
  Write-Host ""
  Write-Host "Continuing anyway to check if backend is working..."
}

# Wait for frontend to become ready, then open browser
if (Wait-ForHttp -Url 'http://127.0.0.1:5173' -TimeoutSec 300) {
  Write-Host "Opening browser to http://127.0.0.1:5173"
  Start-Process 'http://127.0.0.1:5173'
} else {
  Write-Warning 'Frontend did not become ready in time. Checking job status...'
  $jobState = Get-Job -Name frontend
  Write-Host "Frontend job state: $($jobState.State)"
  if ($jobState.State -eq 'Failed') {
    Write-Host "Frontend job failed. Error output:"
    Receive-Job -Name frontend
  }
  Write-Host ""
  Write-Host "Manual startup instructions:"
  Write-Host "  Backend: http://127.0.0.1:8000/docs"
  Write-Host "  Frontend: cd '$webDir' && npm run dev"
  Write-Host "  Then open: http://127.0.0.1:5173"
  Write-Host ""
  Write-Host "You can try opening http://127.0.0.1:5173 manually or check the job output above."
}

Write-Host "Both servers are running in this PowerShell session as background jobs."
Write-Host "To stop: press Ctrl+C or run: Get-Job | Stop-Job"

# Keep the window attached to the frontend job (until you stop it)
Wait-Job -Name frontend


