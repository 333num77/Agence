@echo off
rem Genesis - one-click start: server + browser
cd /d "%~dp0"
echo Starting Genesis server...
start "Genesis Server" cmd /c "python run.py"
timeout /t 4 >nul
start "" "http://127.0.0.1:8787"
echo.
echo Agar browser mein "Server band hai" banner dikhe to 5 second rukein aur page refresh karein.
pause
