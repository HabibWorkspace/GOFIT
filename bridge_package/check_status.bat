@echo off
REM GOFIT Attendance Bridge - Status Check Script

echo ========================================
echo GOFIT Attendance Bridge Status
echo ========================================
echo.

REM Check if NSSM exists
if not exist "nssm.exe" (
    echo ERROR: NSSM not found!
    echo The service may not be installed.
    echo.
    pause
    exit /b 1
)

echo Service Status:
nssm status GymBridge
echo.

echo ----------------------------------------
echo Recent Log Entries (Last 20 lines):
echo ----------------------------------------
if exist "bridge.log" (
    powershell -Command "Get-Content bridge.log -Tail 20"
) else (
    echo Log file not found.
)
echo.

echo ----------------------------------------
echo Commands:
echo ----------------------------------------
echo To restart service: nssm restart GymBridge
echo To stop service:    nssm stop GymBridge
echo To start service:   nssm start GymBridge
echo.
pause
