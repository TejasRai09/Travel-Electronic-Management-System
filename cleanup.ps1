# Cleanup script for project restructuring
Write-Host "Cleaning up project structure..." -ForegroundColor Yellow

if (Test-Path "server") {
    Write-Host "Removing server folder..." -ForegroundColor Cyan
    Get-ChildItem -Path "server" -Recurse | Remove-Item -Force -Recurse -ErrorAction SilentlyContinue
    Remove-Item "server" -Force -Recurse -ErrorAction SilentlyContinue
    if (!(Test-Path "server")) {
        Write-Host "[OK] server folder removed" -ForegroundColor Green
    }
}

if (Test-Path "node_modules") {
    Write-Host "Removing node_modules folder..." -ForegroundColor Cyan
    Get-ChildItem -Path "node_modules" -Recurse -Force | Remove-Item -Force -Recurse -ErrorAction SilentlyContinue
    Remove-Item "node_modules" -Force -Recurse -ErrorAction SilentlyContinue
    if (!(Test-Path "node_modules")) {
        Write-Host "[OK] node_modules folder removed" -ForegroundColor Green
    }
}

if (Test-Path "backend\e-nfa-approval-system") {
    Write-Host "Removing backend\e-nfa-approval-system folder..." -ForegroundColor Cyan
    Remove-Item "backend\e-nfa-approval-system" -Force -Recurse -ErrorAction SilentlyContinue
    if (!(Test-Path "backend\e-nfa-approval-system")) {
        Write-Host "[OK] backend\e-nfa-approval-system folder removed" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "Cleanup complete!" -ForegroundColor Green
Write-Host "Project structure is now clean with only frontend/ and backend/ folders!" -ForegroundColor Green
Write-Host ""

# Show final structure
Write-Host "Current structure:" -ForegroundColor Yellow
Get-ChildItem -Directory | Format-Table Name
