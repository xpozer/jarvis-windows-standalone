@echo off
setlocal
cd /d "%~dp0"
echo ===============================================
echo  JARVIS Frontend Diagnose Start
echo  URL: http://localhost:5173/?diag=1
echo  Safe: http://localhost:5173/?safe=1
echo ===============================================
where npm >nul 2>nul
if errorlevel 1 (
  echo [FEHLER] npm wurde nicht gefunden.
  pause
  exit /b 1
)
start "JARVIS Diagnose Browser" "http://localhost:5173/?diag=1"
npm run dev
pause
