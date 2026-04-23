@echo off
REM GOFIT Attendance Bridge - Installation Script
REM This script installs the bridge as a Windows service using NSSM

echo ========================================
echo GOFIT Attendance Bridge Installer
echo ========================================
echo.

REM Check if running as administrator
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo ERROR: This script must be run as Administrator!
    echo Right-click install.bat and select "Run as administrator"
    echo.
    pause
    exit /b 1
)

echo [1/6] Checking Python installation...
python --version >nul 2>&1
if %errorLevel% neq 0 (
    echo ERROR: Python is not installed or not in PATH!
    echo Please install Python 3.7 or higher from python.org
    echo.
    pause
    exit /b 1
)
python --version
echo.

echo [2/6] Installing required Python packages...
python -m pip install --upgrade pip
python -m pip install requests
if %errorLevel% neq 0 (
    echo ERROR: Failed to install Python packages!
    echo.
    pause
    exit /b 1
)
echo Python packages installed successfully.
echo.

echo [3/6] Checking NSSM (service manager)...
if not exist "nssm.exe" (
    echo NSSM not found. Downloading...
    echo Please download NSSM from: https://nssm.cc/download
    echo Extract nssm.exe to this folder and run install.bat again.
    echo.
    pause
    exit /b 1
)
echo NSSM found.
echo.

echo [4/6] Checking configuration...
if not exist "config.txt" (
    echo ERROR: config.txt not found!
    echo Please create config.txt with your settings.
    echo.
    pause
    exit /b 1
)
echo Configuration file found.
echo.

echo [5/6] Installing Windows service...
REM Get current directory
set CURRENT_DIR=%~dp0
set PYTHON_PATH=%CURRENT_DIR%bridge.py

REM Remove existing service if present
nssm stop GymBridge >nul 2>&1
nssm remove GymBridge confirm >nul 2>&1

REM Install new service
nssm install GymBridge python "%PYTHON_PATH%"
if %errorLevel% neq 0 (
    echo ERROR: Failed to install service!
    echo.
    pause
    exit /b 1
)

REM Configure service
nssm set GymBridge AppDirectory "%CURRENT_DIR%"
nssm set GymBridge DisplayName "GOFIT Attendance Bridge"
nssm set GymBridge Description "Syncs attendance data from turnstile controller to cloud backend"
nssm set GymBridge Start SERVICE_AUTO_START
nssm set GymBridge AppStdout "%CURRENT_DIR%bridge.log"
nssm set GymBridge AppStderr "%CURRENT_DIR%bridge.log"
nssm set GymBridge AppRotateFiles 1
nssm set GymBridge AppRotateBytes 10485760

REM Set restart policy
nssm set GymBridge AppExit Default Restart
nssm set GymBridge AppRestartDelay 5000

echo Service installed successfully.
echo.

echo [6/6] Starting service...
nssm start GymBridge
if %errorLevel% neq 0 (
    echo ERROR: Failed to start service!
    echo Check bridge.log for details.
    echo.
    pause
    exit /b 1
)

echo.
echo ========================================
echo Installation Complete!
echo ========================================
echo.
echo Service Name: GymBridge
echo Status: Running
echo Log File: bridge.log
echo.
echo The bridge is now running in the background.
echo It will automatically start when Windows boots.
echo.
echo Use check_status.bat to view service status.
echo Use uninstall.bat to remove the service.
echo.
pause
