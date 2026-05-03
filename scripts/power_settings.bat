@echo off
REM ============================================================
REM Configure Windows Power Settings for 24/7 Server Operation
REM Run this as ADMINISTRATOR
REM ============================================================

echo.
echo ============================================================
echo  Configuring Power Settings for 24/7 Operation
echo ============================================================
echo.

REM Check if running as admin
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo ERROR: This script must be run as Administrator!
    echo Right-click and select "Run as administrator"
    pause
    exit /b 1
)

echo Configuring power plan...
echo.

REM Set power plan to High Performance
powercfg /setactive 8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c

REM Disable sleep
powercfg /change standby-timeout-ac 0
powercfg /change standby-timeout-dc 0

REM Disable hibernation
powercfg /change hibernate-timeout-ac 0
powercfg /change hibernate-timeout-dc 0

REM Never turn off display (when plugged in)
powercfg /change monitor-timeout-ac 0

REM Never turn off hard disk
powercfg /change disk-timeout-ac 0
powercfg /change disk-timeout-dc 0

REM Disable USB selective suspend
powercfg /setacvalueindex SCHEME_CURRENT 2a737441-1930-4402-8d77-b2bebba308a3 48e6b7a6-50f5-4782-a5d4-53bb8f07e226 0
powercfg /setdcvalueindex SCHEME_CURRENT 2a737441-1930-4402-8d77-b2bebba308a3 48e6b7a6-50f5-4782-a5d4-53bb8f07e226 0

REM Apply settings
powercfg /setactive SCHEME_CURRENT

echo.
echo ============================================================
echo  Power Settings Configured
echo ============================================================
echo.
echo ✓ Power plan: High Performance
echo ✓ Sleep: Disabled
echo ✓ Hibernation: Disabled
echo ✓ Display timeout: Never (when plugged in)
echo ✓ Hard disk timeout: Never
echo ✓ USB selective suspend: Disabled
echo.
echo Your PC is now configured for 24/7 operation.
echo.
echo IMPORTANT:
echo - Keep PC plugged into power at all times
echo - Ensure good ventilation/cooling
echo - Consider UPS (battery backup) for power outages
echo.
pause
