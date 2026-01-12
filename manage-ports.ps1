# PowerShell Script for Managing Ports in AI App
# Usage: .\manage-ports.ps1 [action]

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("check", "kill-frontend", "kill-backend", "kill-all", "start-all")]
    [string]$Action = "check"
)

function Write-ColorOutput {
    param([string]$Message, [string]$Color = "White")
    Write-Host $Message -ForegroundColor $Color
}

function Check-Ports {
    Write-ColorOutput "🔍 Checking port usage..." "Cyan"

    $frontendPort = netstat -ano | findstr :3000
    $backendPort = netstat -ano | findstr :3001

    if ($frontendPort) {
        Write-ColorOutput "⚠️  Port 3000 (Frontend) is in use:" "Yellow"
        $frontendPort | ForEach-Object {
            if ($_ -match 'LISTENING\s+(\d+)') {
                $pid = $matches[1]
                $process = tasklist /FI "PID eq $pid" /FO CSV | ConvertFrom-Csv
                Write-ColorOutput "   Process: $($process.'Image Name') (PID: $pid)" "Yellow"
            }
        }
    } else {
        Write-ColorOutput "✅ Port 3000 (Frontend) is free" "Green"
    }

    if ($backendPort) {
        Write-ColorOutput "⚠️  Port 3001 (Backend) is in use:" "Yellow"
        $backendPort | ForEach-Object {
            if ($_ -match 'LISTENING\s+(\d+)') {
                $pid = $matches[1]
                $process = tasklist /FI "PID eq $pid" /FO CSV | ConvertFrom-Csv
                Write-ColorOutput "   Process: $($process.'Image Name') (PID: $pid)" "Yellow"
            }
        }
    } else {
        Write-ColorOutput "✅ Port 3001 (Backend) is free" "Green"
    }
}

function Kill-ProcessOnPort {
    param([int]$Port, [string]$ServiceName)

    Write-ColorOutput "🛑 Killing processes on port $Port ($ServiceName)..." "Red"

    $connections = netstat -ano | findstr ":$Port"
    $pids = @()

    foreach ($line in $connections) {
        if ($line -match 'LISTENING\s+(\d+)') {
            $pids += $matches[1]
        }
    }

    $pids = $pids | Select-Object -Unique

    foreach ($pid in $pids) {
        if ($pid -and $pid -ne "0") {
            $process = tasklist /FI "PID eq $pid" /FO CSV | ConvertFrom-Csv
            if ($process) {
                Write-ColorOutput "   Killing: $($process.'Image Name') (PID: $pid)" "Red"
                taskkill /PID $pid /F | Out-Null
            }
        }
    }

    Start-Sleep -Seconds 2
    Write-ColorOutput "✅ Port $Port cleared!" "Green"
}

function Start-Services {
    Write-ColorOutput "🚀 Starting all services..." "Green"

    # Kill any existing processes first
    Kill-ProcessOnPort -Port 3000 -ServiceName "Frontend"
    Kill-ProcessOnPort -Port 3001 -ServiceName "Backend"

    Write-ColorOutput "📦 Starting Frontend on port 3000..." "Cyan"
    Start-Process -FilePath "cmd.exe" -ArgumentList "/c cd frontend && npm run dev" -NoNewWindow

    Start-Sleep -Seconds 3

    Write-ColorOutput "🔧 Starting Backend on port 3001..." "Cyan"
    Start-Process -FilePath "cmd.exe" -ArgumentList "/c cd backend && npm run dev" -NoNewWindow

    Start-Sleep -Seconds 5

    Write-ColorOutput "🎉 Services started! Check the terminals for status." "Green"
    Write-ColorOutput "   Frontend: http://localhost:3000" "White"
    Write-ColorOutput "   Backend: http://localhost:3001" "White"
}

# Main execution
switch ($Action) {
    "check" {
        Check-Ports
    }
    "kill-frontend" {
        Kill-ProcessOnPort -Port 3000 -ServiceName "Frontend"
    }
    "kill-backend" {
        Kill-ProcessOnPort -Port 3001 -ServiceName "Backend"
    }
    "kill-all" {
        Kill-ProcessOnPort -Port 3000 -ServiceName "Frontend"
        Kill-ProcessOnPort -Port 3001 -ServiceName "Backend"
    }
    "start-all" {
        Start-Services
    }
}

Write-ColorOutput "`n📋 Available commands:" "Cyan"
Write-ColorOutput "   .\manage-ports.ps1 check          - Check port usage" "White"
Write-ColorOutput "   .\manage-ports.ps1 kill-frontend  - Kill frontend port (3000)" "White"
Write-ColorOutput "   .\manage-ports.ps1 kill-backend   - Kill backend port (3001)" "White"
Write-ColorOutput "   .\manage-ports.ps1 kill-all       - Kill all ports" "White"
Write-ColorOutput "   .\manage-ports.ps1 start-all      - Kill all and start fresh" "White"