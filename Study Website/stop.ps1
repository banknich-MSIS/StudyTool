# stop.ps1 - Stop all Study Tool servers
# This script cleanly shuts down both backend (port 8000) and frontend (port 5173) servers

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Study Tool - Server Shutdown" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if running as administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "[WARNING] Not running as Administrator" -ForegroundColor Yellow
    Write-Host "Will attempt shutdown with limited privileges..." -ForegroundColor Yellow
    Write-Host ""
}

# Stop PowerShell background jobs
Write-Host "Stopping background jobs..." -ForegroundColor Yellow
$jobs = Get-Job
if ($jobs) {
    try {
        $jobs | Stop-Job
        $jobs | Remove-Job
        Write-Host "[OK] Stopped and removed all background jobs" -ForegroundColor Green
    } catch {
        Write-Host "[WARNING] Some jobs could not be removed" -ForegroundColor Yellow
    }
} else {
    Write-Host "[INFO] No background jobs found" -ForegroundColor Gray
}
Write-Host ""

# Function to stop process by port
function Stop-ProcessByPort {
    param(
        [int]$Port,
        [string]$ServerName
    )
    
    Write-Host "Checking $ServerName (port $Port)..." -ForegroundColor Yellow
    $conn = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
    
    if ($conn) {
        $process = Get-Process -Id $conn.OwningProcess -ErrorAction SilentlyContinue
        if ($process) {
            $processName = $process.Name
            $processPid = $process.Id
            
            # Try method 1: Stop-Process (requires admin)
            try {
                Stop-Process -Id $processPid -Force -ErrorAction Stop
                Write-Host "[OK] Stopped $ServerName ($processName, PID: $processPid)" -ForegroundColor Green
                return $true
            } catch {
                # Method 1 failed, try method 2: taskkill
                Write-Host "[INFO] Trying alternative method (taskkill)..." -ForegroundColor Gray
                try {
                    $output = taskkill /F /PID $processPid 2>&1
                    if ($LASTEXITCODE -eq 0) {
                        Write-Host "[OK] Stopped $ServerName ($processName, PID: $processPid)" -ForegroundColor Green
                        return $true
                    } else {
                        throw "taskkill failed"
                    }
                } catch {
                    Write-Host "[ERROR] Access denied - Cannot stop $ServerName" -ForegroundColor Red
                    Write-Host "         Process: $processName (PID: $processPid)" -ForegroundColor Red
                    return $false
                }
            }
        }
    } else {
        Write-Host "[INFO] No process found on port $Port" -ForegroundColor Gray
        return $true
    }
}

# Stop backend server (port 8000)
$backendStopped = Stop-ProcessByPort -Port 8000 -ServerName "backend server"
Write-Host ""

# Stop frontend server (port 5173)
$frontendStopped = Stop-ProcessByPort -Port 5173 -ServerName "frontend server"
Write-Host ""

# Wait a moment for ports to be released
Start-Sleep -Milliseconds 500

# Verify ports are free
Write-Host "Verifying ports are free..." -ForegroundColor Yellow
$backend8000 = Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue
$frontend5173 = Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue

if (-not $backend8000 -and -not $frontend5173) {
    Write-Host "[OK] All servers stopped successfully!" -ForegroundColor Green
    Write-Host "[OK] Ports 8000 and 5173 are now free" -ForegroundColor Green
} else {
    Write-Host "[WARNING] Some ports may still be in use" -ForegroundColor Yellow
    if ($backend8000) { 
        Write-Host "  - Port 8000 still in use" -ForegroundColor Yellow 
    }
    if ($frontend5173) { 
        Write-Host "  - Port 5173 still in use" -ForegroundColor Yellow 
    }
    Write-Host ""
    Write-Host "Manual Shutdown Options:" -ForegroundColor Cyan
    Write-Host "1. Run PowerShell as Administrator:" -ForegroundColor Gray
    Write-Host "   - Right-click PowerShell" -ForegroundColor Gray
    Write-Host "   - Select 'Run as administrator'" -ForegroundColor Gray
    Write-Host "   - Run: .\stop.ps1" -ForegroundColor Gray
    Write-Host ""
    Write-Host "2. Close the PowerShell window running start.ps1" -ForegroundColor Gray
    Write-Host ""
    Write-Host "3. Use Task Manager (Ctrl+Shift+Esc):" -ForegroundColor Gray
    Write-Host "   - Find and end python.exe tasks" -ForegroundColor Gray
    Write-Host "   - Find and end node.exe tasks" -ForegroundColor Gray
    Write-Host ""
    Write-Host "4. Force kill by port (as Admin):" -ForegroundColor Gray
    Write-Host "   Get-NetTCPConnection -LocalPort 8000 | % { Stop-Process -Id `$_.OwningProcess -Force }" -ForegroundColor DarkGray
    Write-Host "   Get-NetTCPConnection -LocalPort 5173 | % { Stop-Process -Id `$_.OwningProcess -Force }" -ForegroundColor DarkGray
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Shutdown complete!" -ForegroundColor Cyan
Write-Host "You can now run .\start.ps1 to restart" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
