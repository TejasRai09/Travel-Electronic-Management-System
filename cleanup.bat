@echo off
echo Cleaning up project structure...

if exist "server" (
    echo Removing server folder...
    rmdir /s /q "server"
)

if exist "node_modules" (
    echo Removing node_modules folder...
    rmdir /s /q "node_modules"
)

if exist "backend\e-nfa-approval-system" (
    echo Removing backend\e-nfa-approval-system folder...
    rmdir /s /q "backend\e-nfa-approval-system"
)

echo Done!
echo.
echo Project structure is now clean with only frontend/ and backend/ folders!
pause
