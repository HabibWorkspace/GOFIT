@echo off
REM ============================================================
REM Check Status of All Gym Management Services
REM ============================================================

echo.
echo ============================================================
echo  Gym Management System - Service Status
echo ============================================================
echo.

REM Check GymApp
echo [1] GymApp Service:
sc query GymApp | findstr "STATE" 2>nul
if %errorLevel% neq 0 (
    echo    Status: NOT INSTALLED
) else (
    sc query GymApp | findstr "RUNNING" >nul
    if %errorLevel% equ 0 (
        echo    ✓ RUNNING
    ) else (
        echo    ✗ STOPPED or ERROR
    )
)

echo.

REM Check GymBridge
echo [2] GymBridge Service:
sc query GymBridge | findstr "STATE" 2>nul
if %errorLevel% neq 0 (
    echo    Status: NOT INSTALLED
) else (
    sc query GymBridge | findstr "RUNNING" >nul
    if %errorLevel% equ 0 (
        echo    ✓ RUNNING
    ) else (
        echo    ✗ STOPPED or ERROR
    )
)

echo.

REM Check Cloudflared
echo [3] Cloudflared Service:
sc query Cloudflared | findstr "STATE" 2>nul
if %errorLevel% neq 0 (
    echo    Status: NOT INSTALLED
) else (
    sc query Cloudflared | findstr "RUNNING" >nul
    if %errorLevel% equ 0 (
        echo    ✓ RUNNING
    ) else (
        echo    ✗ STOPPED or ERROR
    )
)

echo.
echo ============================================================
echo  Quick Health Checks
echo ============================================================
echo.

REM Check if Flask is responding
echo [4] Flask App Health:
curl -s http://localhost:5000/api/health >nul 2>&1
if %errorLevel% equ 0 (
    echo    ✓ Responding
) else (
    echo    ✗ Not responding
)

echo.

REM Check if controller is reachable
echo [5] Gate Controller (192.168.1.150):
ping -n 1 -w 1000 192.168.1.150 >nul 2>&1
if %errorLevel% equ 0 (
    echo    ✓ Reachable
) else (
    echo    ✗ Not reachable
)

echo.
echo ============================================================
echo  Log Files
echo ============================================================
echo.
echo App Log:     C:\gymapp\logs\app.log
echo Error Log:   C:\gymapp\logs\error.log
echo Bridge Log:  C:\gymapp\logs\bridge.log
echo Tunnel Log:  C:\cloudflared\tunnel.log
echo.
echo To view logs: type C:\gymapp\logs\app.log
echo.
echo ============================================================
echo.
pause
