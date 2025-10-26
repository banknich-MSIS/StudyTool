# stop.ps1 - Stop all Study Tool servers
# This script REQUIRES Administrator privileges to reliably stop processes by port

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Study Tool - Server Shutdown" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if running as administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "[ERROR] This script requires Administrator privileges" -ForegroundColor Red
    Write-Host "" -ForegroundColor Red
    Write-Host "To run this script properly:" -ForegroundColor Yellow
    Write-Host "  1. Right-click PowerShell" -ForegroundColor Gray
    Write-Host "  2. Select 'Run as administrator'" -ForegroundColor Gray
    Write-Host "  3. Navigate to: $PSScriptRoot" -ForegroundColor Gray
    Write-Host "  4. Run: .\stop.ps1" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Alternative (Non-Admin):" -ForegroundColor Yellow
    Write-Host "  - Close the PowerShell window running start.ps1" -ForegroundColor Gray
    Write-Host "  - Or run: Get-Job | Stop-Job; Get-Job | Remove-Job" -ForegroundColor Gray
    Write-Host ""
    exit 1
}

# Stop PowerShell background jobs first
Write-Host "Stopping PowerShell background jobs..." -ForegroundColor Yellow
$jobs = Get-Job
if ($jobs) {
    try {
        $jobs | Stop-Job
        $jobs | Remove-Job
        Write-Host "[OK] Stopped and removed all background jobs" -ForegroundColor Green
    } catch {
        Write-Host "[WARNING] Some jobs could not be removed: $_" -ForegroundColor Yellow
    }
} else {
    Write-Host "[INFO] No background jobs found" -ForegroundColor Gray
}
Write-Host ""

# Function to force stop process by port
function Stop-ProcessByPort {
    param(
        [int]$Port,
        [string]$ServerName
    )
    
    Write-Host "Checking port $Port ($ServerName)..." -ForegroundColor Yellow
    
    try {
        # Find connection on the port
        $connections = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
        
        if (-not $connections) {
            Write-Host "[INFO] No process listening on port $Port" -ForegroundColor Gray
            return $true
        }
        
        # Handle multiple connections (shouldn't happen but be safe)
        $stoppedCount = 0
        $orphanedDetected = $false
        foreach ($conn in $connections) {
            $processId = $conn.OwningProcess
            
            # Check for orphaned socket (null or 0 process ID but not system process 4)
            if ($null -eq $processId -or $processId -eq 0) {
                if ($processId -ne 4) {
                    $orphanedDetected = $true
                    Write-Host "[WARNING] Detected orphaned socket on port $Port (no associated process)" -ForegroundColor Yellow
                    Write-Host "  This typically happens when a process crashes and leaves the port in a zombie state." -ForegroundColor Gray
                    continue
                }
            }
            
            # Skip system processes
            if ($processId -eq 4) {
                Write-Host "[WARNING] Port $Port owned by system process (PID: $processId), skipping" -ForegroundColor Yellow
                continue
            }
            
            # Get process info
            $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
            if (-not $process) {
                $orphanedDetected = $true
                Write-Host "[WARNING] Process PID $processId not found - orphaned socket detected" -ForegroundColor Yellow
                continue
            }
            
            $processName = $process.Name
            Write-Host "  Found: $processName (PID: $processId)" -ForegroundColor Gray
            
            # Force stop the process
            try {
                Stop-Process -Id $processId -Force -ErrorAction Stop
                Write-Host "  [OK] Stopped $ServerName - $processName (PID: $processId)" -ForegroundColor Green
                $stoppedCount++
            } catch {
                # Fallback to taskkill
                Write-Host "  [INFO] Trying taskkill..." -ForegroundColor Gray
                try {
                    $result = taskkill /F /PID $processId 2>&1
                    if ($LASTEXITCODE -eq 0) {
                        Write-Host "  [OK] Stopped $ServerName using taskkill (PID: $processId)" -ForegroundColor Green
                        $stoppedCount++
                    } else {
                        Write-Host "  [ERROR] Failed to stop PID $processId : $result" -ForegroundColor Red
                    }
                } catch {
                    Write-Host "  [ERROR] Could not stop process: $_" -ForegroundColor Red
                }
            }
        }
        
        # If orphaned sockets detected, recommend remediation
        if ($orphanedDetected) {
            Write-Host "" -ForegroundColor Yellow
            Write-Host "[WARNING] Orphaned sockets detected on port $Port!" -ForegroundColor Red
            Write-Host "  If port $Port remains unavailable after this script, try the following:" -ForegroundColor Yellow
            Write-Host "  1. Restart your computer" -ForegroundColor Gray
            Write-Host "  2. Or run as Administrator: netsh winsock reset && netsh int ip reset" -ForegroundColor Gray
            Write-Host "  3. Then reboot your computer" -ForegroundColor Gray
            Write-Host "" -ForegroundColor Yellow
        }
        
        return $stoppedCount -gt 0
    } catch {
        Write-Host "[ERROR] Error checking port $Port : $_" -ForegroundColor Red
        return $false
    }
}

# Stop backend server (port 8000)
$backendStopped = Stop-ProcessByPort -Port 8000 -ServerName "Backend"
Write-Host ""

# Stop frontend server (port 5173)
$frontendStopped = Stop-ProcessByPort -Port 5173 -ServerName "Frontend"
Write-Host ""

# Give processes time to fully terminate
Write-Host "Waiting for ports to be released..." -ForegroundColor Yellow
Start-Sleep -Seconds 2

# Verify ports are free
Write-Host "Verifying ports are free..." -ForegroundColor Yellow
$backend8000 = Get-NetTCPConnection -LocalPort 8000 -State Listen -ErrorAction SilentlyContinue
$frontend5173 = Get-NetTCPConnection -LocalPort 5173 -State Listen -ErrorAction SilentlyContinue

if (-not $backend8000 -and -not $frontend5173) {
    Write-Host "[OK] All servers stopped successfully!" -ForegroundColor Green
    Write-Host "[OK] Ports 8000 and 5173 are now free" -ForegroundColor Green
} else {
    Write-Host "[WARNING] Some ports may still be in use" -ForegroundColor Yellow
    
    if ($backend8000) {
        $proc = Get-Process -Id $backend8000.OwningProcess -ErrorAction SilentlyContinue
        if ($proc) {
            Write-Host "  - Port 8000: $($proc.Name) (PID: $($proc.Id))" -ForegroundColor Yellow
            Write-Host "    Manual fix: Stop-Process -Id $($proc.Id) -Force" -ForegroundColor Gray
        } else {
            Write-Host "  - Port 8000 still in use (unknown process)" -ForegroundColor Yellow
        }
    }
    
    if ($frontend5173) {
        $proc = Get-Process -Id $frontend5173.OwningProcess -ErrorAction SilentlyContinue
        if ($proc) {
            Write-Host "  - Port 5173: $($proc.Name) (PID: $($proc.Id))" -ForegroundColor Yellow
            Write-Host "    Manual fix: Stop-Process -Id $($proc.Id) -Force" -ForegroundColor Gray
        } else {
            Write-Host "  - Port 5173 still in use (unknown process)" -ForegroundColor Yellow
        }
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Shutdown complete!" -ForegroundColor Cyan
Write-Host "You can now run .\start.ps1 to restart" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
