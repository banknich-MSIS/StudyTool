# Server Manual Control Guide

## Why Administrator Privileges Are Required

The stop.ps1 script needs Administrator privileges to:

- Query network connections by port (Get-NetTCPConnection)
- Force terminate processes that are listening on ports 8000 and 5173
- Ensure clean shutdown without orphaned processes

Without admin privileges, Windows restricts access to process management for security reasons.

---

## Quick Reference

### Start Servers

```powershell
cd "X:\StudyTool Local App Project\StudyTool\Study Website"
.\start.ps1
```

### Stop Servers (Requires Admin)

```powershell
# Right-click PowerShell → "Run as administrator"
cd "X:\StudyTool Local App Project\StudyTool\Study Website"
.\stop.ps1
```

---

## Manual Stop (Administrator PowerShell Required)

### Method 1: Kill All Python and Node Processes (Quick)

```powershell
Get-Process python,node -ErrorAction SilentlyContinue | Where-Object {$_.Id -ne 0} | Stop-Process -Force
```

### Method 2: Kill Specific Ports (Precise)

```powershell
# Stop backend (port 8000)
$conn = Get-NetTCPConnection -LocalPort 8000 -State Listen -ErrorAction SilentlyContinue
if ($conn) {
    $proc = Get-Process -Id $conn.OwningProcess -ErrorAction SilentlyContinue
    if ($proc -and $proc.Id -ne 0) {
        Stop-Process -Id $proc.Id -Force
        Write-Host "Stopped $($proc.Name) on port 8000"
    }
}

# Stop frontend (port 5173)
$conn = Get-NetTCPConnection -LocalPort 5173 -State Listen -ErrorAction SilentlyContinue
if ($conn) {
    $proc = Get-Process -Id $conn.OwningProcess -ErrorAction SilentlyContinue
    if ($proc -and $proc.Id -ne 0) {
        Stop-Process -Id $proc.Id -Force
        Write-Host "Stopped $($proc.Name) on port 5173"
    }
}
```

### Method 3: Kill by Process Name (Alternative)

```powershell
# Stop uvicorn (backend)
Get-CimInstance Win32_Process | Where-Object {
    $_.Name -eq "python.exe" -and $_.CommandLine -like "*uvicorn*"
} | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }

# Stop vite (frontend)
Get-CimInstance Win32_Process | Where-Object {
    $_.Name -eq "node.exe" -and $_.CommandLine -like "*vite*"
} | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }
```

---

## Manual Stop (Non-Admin Alternatives)

### Method 1: Close the PowerShell Window Running start.ps1

Simply close the PowerShell window where you ran start.ps1. This will terminate the background jobs.

### Method 2: Stop Background Jobs (Same PowerShell Session)

In the same PowerShell window where you ran start.ps1:

```powershell
Get-Job | Stop-Job
Get-Job | Remove-Job
```

### Method 3: Task Manager

1. Press `Ctrl+Shift+Esc` to open Task Manager
2. Go to Details tab
3. Find and end these processes:
   - `python.exe` (look for one with uvicorn in description)
   - `node.exe` (look for one using significant CPU/memory)

---

## Manual Start

### Prerequisites Check

```powershell
# Check if ports are free
Get-NetTCPConnection -LocalPort 8000,5173 -State Listen -ErrorAction SilentlyContinue

# If ports are in use, see Manual Stop section above
```

### Start Backend

```powershell
cd "X:\StudyTool Local App Project\StudyTool\Study Website"
$pythonExe = ".\server\.venv\Scripts\python.exe"
& $pythonExe -m uvicorn server.main:app --host 127.0.0.1 --port 8000 --reload
```

### Start Frontend (New PowerShell Window)

```powershell
cd "X:\StudyTool Local App Project\StudyTool\Study Website\web"
npm run dev
```

---

## Troubleshooting

### Backend Won't Start

**Symptom:** Times out waiting for http://127.0.0.1:8000/docs

**Possible causes:**

1. **Port 8000 still in use** → Use Manual Stop methods above
2. **Python dependencies issue** → Run: `.\server\.venv\Scripts\python.exe -m pip install -r .\server\requirements.txt`
3. **Database schema error** → Delete `exam.db` and restart (will recreate)
4. **Import/syntax error** → Check backend job output: `Receive-Job -Name backend`

**Debug backend job:**

```powershell
# After running start.ps1, check backend output
Receive-Job -Name backend

# Check backend job state
Get-Job -Name backend
```

### Frontend Won't Start

**Symptom:** Times out waiting for http://127.0.0.1:5173

**Possible causes:**

1. **Port 5173 still in use** → Use Manual Stop methods above
2. **Node modules missing** → Run: `cd web; npm install`
3. **Vite config error** → Check frontend job output: `Receive-Job -Name frontend`

### "Access Denied" Errors

**Solution:** You need to run PowerShell as Administrator

- Right-click PowerShell
- Select "Run as administrator"
- Navigate to the project directory
- Run the command again

### Can't Find stop.ps1/start.ps1

**Solution:** Make sure you're in the correct directory

```powershell
cd "X:\StudyTool Local App Project\StudyTool\Study Website"
ls *.ps1  # Should show start.ps1 and stop.ps1
```

---

## Complete Restart Procedure (Recommended)

### As Administrator:

```powershell
# 1. Open PowerShell as Administrator
# 2. Navigate to project
cd "X:\StudyTool Local App Project\StudyTool\Study Website"

# 3. Stop any existing servers
.\stop.ps1

# 4. Wait a moment
Start-Sleep -Seconds 2

# 5. Start fresh
.\start.ps1
```

### Non-Admin (Less Reliable):

```powershell
# 1. Open regular PowerShell
cd "X:\StudyTool Local App Project\StudyTool\Study Website"

# 2. Clean up background jobs
Get-Job | Stop-Job; Get-Job | Remove-Job

# 3. Start (may fail if ports are in use)
.\start.ps1
```

---

## Port Reference

- **Backend (FastAPI/Uvicorn):** Port 8000

  - API Docs: http://127.0.0.1:8000/docs
  - Health Check: http://127.0.0.1:8000/api/debug/routes

- **Frontend (Vite/React):** Port 5173
  - App URL: http://127.0.0.1:5173
  - HMR Websocket: ws://127.0.0.1:5173

---

## Emergency: Kill Everything

**As Administrator:**

```powershell
# Nuclear option - kills ALL Python and Node processes on your system
Get-Process python,node -ErrorAction SilentlyContinue | Stop-Process -Force
```

**Note:** This will terminate ALL Python and Node programs, not just the Study Tool servers. Use only if other methods fail.
