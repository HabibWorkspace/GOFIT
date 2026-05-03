@echo off
REM ============================================================
REM Restart All Gym Management Services
REM Run this as ADMINISTRATOR
REM ============================================================

echo.
echo ============================================================
echo  Restarting All Services
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

echo [1/3] Restarting GymApp...
net stop GymApp >nul 2>&1
timeout /t 2 /nobreak >nul
net start GymApp
if %errorLevel% equ 0 (
    echo ✓ GymApp restarted
) else (
    echo ✗ GymApp failed to start
)

echo.
echo [2/3] Restarting GymBridge...
net stop GymBridge >nul 2>&1
timeout /t 2 /nobreak >nul
net start GymBridge
if %errorLevel% equ 0 (
    echo ✓ GymBridge restarted
) else (
    echo ✗ GymBridge failed to start
)

echo.
echo [3/3] Restarting Cloudflared...
net stop Cloudflared >nul 2>&1
timeout /t 2 /nobreak >nul
net start Cloudflared
if %errorLevel% equ 0 (
    echo ✓ Cloudflared restarted
) else (
    echo ✗ Cloudflared failed to start
)

echo.
echo ============================================================
echo  Restart Complete
echo ============================================================
echo.
echo Wait 10 seconds for services to fully start...
timeout /t 10 /nobreak >nul

echo.
echo Checking status...
call "%~dp0check_all.bat"
