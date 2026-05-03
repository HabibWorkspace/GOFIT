@echo off
REM ============================================================
REM Start Gym App Manually (for testing)
REM Use this to test the app before installing as service
REM ============================================================

echo.
echo ============================================================
echo  Starting Gym Management App (Manual Mode)
echo ============================================================
echo.

cd /d C:\gymapp

if not exist "venv\Scripts\activate.bat" (
    echo ERROR: Virtual environment not found
    echo Please run: python -m venv venv
    pause
    exit /b 1
)

echo Activating virtual environment...
call venv\Scripts\activate

echo.
echo Starting Flask app...
echo.
echo Press Ctrl+C to stop
echo.

python run.py

pause
