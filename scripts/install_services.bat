@echo off
REM ============================================================
REM Install Windows Services for Gym Management System
REM Run this as ADMINISTRATOR
REM ============================================================

echo.
echo ============================================================
echo  Installing Gym Management Services
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

REM Set paths
set NSSM=C:\nssm\nssm.exe
set GYMAPP=C:\gymapp
set CLOUDFLARED=C:\cloudflared\cloudflared.exe

REM Check if NSSM exists
if not exist "%NSSM%" (
    echo ERROR: NSSM not found at %NSSM%
    echo Please download NSSM from https://nssm.cc/download
    pause
    exit /b 1
)

REM Check if gym app exists
if not exist "%GYMAPP%\run.py" (
    echo ERROR: Gym app not found at %GYMAPP%
    echo Please copy your backend folder to C:\gymapp first
    pause
    exit /b 1
)

REM Check if cloudflared exists
if not exist "%CLOUDFLARED%" (
    echo ERROR: Cloudflared not found at %CLOUDFLARED%
    echo Please download cloudflared from GitHub releases
    pause
    exit /b 1
)

echo.
echo [1/3] Installing GymApp Service...
echo ============================================================

REM Remove existing service if it exists
"%NSSM%" stop GymApp >nul 2>&1
"%NSSM%" remove GymApp confirm >nul 2>&1

REM Install GymApp service
"%NSSM%" install GymApp "%GYMAPP%\venv\Scripts\python.exe" "%GYMAPP%\run.py"
"%NSSM%" set GymApp AppDirectory "%GYMAPP%"
"%NSSM%" set GymApp DisplayName "Gym Management App"
"%NSSM%" set GymApp Description "Flask backend for gym management system"
"%NSSM%" set GymApp Start SERVICE_AUTO_START
"%NSSM%" set GymApp AppStdout "%GYMAPP%\logs\app.log"
"%NSSM%" set GymApp AppStderr "%GYMAPP%\logs\error.log"
"%NSSM%" set GymApp AppRotateFiles 1
"%NSSM%" set GymApp AppRotateBytes 10485760

REM Set environment variables
"%NSSM%" set GymApp AppEnvironmentExtra FLASK_ENV=production

echo ✓ GymApp service installed

echo.
echo [2/3] Installing GymBridge Service...
echo ============================================================

REM Remove existing service if it exists
"%NSSM%" stop GymBridge >nul 2>&1
"%NSSM%" remove GymBridge confirm >nul 2>&1

REM Install GymBridge service
"%NSSM%" install GymBridge "%GYMAPP%\venv\Scripts\python.exe" "%GYMAPP%\bridge.py"
"%NSSM%" set GymBridge AppDirectory "%GYMAPP%"
"%NSSM%" set GymBridge DisplayName "Gym Controller Bridge"
"%NSSM%" set GymBridge Description "Bridge between Flask app and gate controller"
"%NSSM%" set GymBridge Start SERVICE_AUTO_START
"%NSSM%" set GymBridge AppStdout "%GYMAPP%\logs\bridge.log"
"%NSSM%" set GymBridge AppStderr "%GYMAPP%\logs\bridge_error.log"
"%NSSM%" set GymBridge AppRotateFiles 1
"%NSSM%" set GymBridge AppRotateBytes 10485760

echo ✓ GymBridge service installed

echo.
echo [3/3] Installing Cloudflared Tunnel Service...
echo ============================================================

REM Remove existing service if it exists
"%NSSM%" stop Cloudflared >nul 2>&1
"%NSSM%" remove Cloudflared confirm >nul 2>&1

REM Install Cloudflared service
"%NSSM%" install Cloudflared "%CLOUDFLARED%" "tunnel" "--config" "C:\cloudflared\config.yml" "run" "gym-tunnel"
"%NSSM%" set Cloudflared AppDirectory "C:\cloudflared"
"%NSSM%" set Cloudflared DisplayName "Cloudflare Tunnel"
"%NSSM%" set Cloudflared Description "Cloudflare tunnel for public access"
"%NSSM%" set Cloudflared Start SERVICE_AUTO_START
"%NSSM%" set Cloudflared AppStdout "C:\cloudflared\tunnel.log"
"%NSSM%" set Cloudflared AppStderr "C:\cloudflared\tunnel_error.log"
"%NSSM%" set Cloudflared AppRotateFiles 1
"%NSSM%" set Cloudflared AppRotateBytes 10485760

echo ✓ Cloudflared service installed

echo.
echo ============================================================
echo  Starting Services...
echo ============================================================
echo.

REM Start services
echo Starting GymApp...
"%NSSM%" start GymApp
timeout /t 3 /nobreak >nul

echo Starting GymBridge...
"%NSSM%" start GymBridge
timeout /t 2 /nobreak >nul

echo Starting Cloudflared...
"%NSSM%" start Cloudflared
timeout /t 2 /nobreak >nul

echo.
echo ============================================================
echo  Installation Complete!
echo ============================================================
echo.
echo All services installed and started.
echo.
echo Check status: C:\gymapp\scripts\check_all.bat
echo View logs: type C:\gymapp\logs\app.log
echo.
echo Services will auto-start on Windows boot.
echo.
pause
