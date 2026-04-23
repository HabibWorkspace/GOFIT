@echo off
REM GOFIT Attendance Bridge - Uninstallation Script

echo ========================================
echo GOFIT Attendance Bridge Uninstaller
echo ========================================
echo.

REM Check if running as administrator
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo ERROR: This script must be run as Administrator!
    echo Right-click uninstall.bat and select "Run as administrator"
    echo.
    pause
    exit /b 1
)

echo Stopping service...
nssm stop GymBridge
if %errorLevel% neq 0 (
    echo Warning: Service may not be running.
)
echo.

echo Removing service...
nssm remove GymBridge confirm
if %errorLevel% neq 0 (
    echo ERROR: Failed to remove service!
    echo The service may not be installed.
    echo.
    pause
    exit /b 1
)

echo.
echo ========================================
echo Uninstallation Complete!
echo ========================================
echo.
echo The GymBridge service has been removed.
echo.
echo Note: Configuration files and logs have NOT been deleted.
echo You can safely delete this folder if you no longer need it.
echo.
pause
