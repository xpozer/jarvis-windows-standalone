@echo off
setlocal EnableExtensions
cd /d "%~dp0"
echo ==============================
echo JARVIS DIAGNOSE
echo ==============================
echo Root: %CD%
echo.
echo Python venv:
if exist backend\.venv\Scripts\python.exe (echo OK) else (echo FEHLT)
echo Frontend dist:
if exist frontend\dist\index.html (echo OK) else (echo FEHLT)
echo.
echo Node:
where node 2>nul
node -v 2>nul
echo.
echo npm.cmd:
where npm.cmd 2>nul
"C:\Program Files\nodejs\npm.cmd" -v 2>nul
echo.
echo Ports:
netstat -ano ^| findstr ":8000"
netstat -ano ^| findstr ":5173"
echo.
echo Backend Health:
powershell -NoProfile -Command "try { Invoke-WebRequest http://127.0.0.1:8000/health -UseBasicParsing | Select-Object -ExpandProperty Content } catch { $_.Exception.Message }"
echo.
echo Letzte Start Logs:
if exist logs\start.log powershell -NoProfile -Command "Get-Content logs\start.log -Tail 40"
echo.
pause
