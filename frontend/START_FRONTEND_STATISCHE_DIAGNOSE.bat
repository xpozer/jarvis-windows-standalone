@echo off
title JARVIS Frontend Statische Diagnose
cd /d "%~dp0"
echo.
echo Starte Vite Frontend mit statischer Diagnose...
echo URL: http://localhost:5173/diagnose.html
echo.
where npm.cmd >nul 2>nul
if errorlevel 1 (
  echo [FEHLER] npm.cmd nicht gefunden. Node.js LTS installieren.
  pause
  exit /b 1
)
start "JARVIS Diagnose Browser" http://localhost:5173/diagnose.html
npm run dev
echo.
echo Frontend wurde beendet.
pause
