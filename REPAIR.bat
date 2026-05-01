@echo off
setlocal
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\install\REPAIR.ps1" -Root "%~dp0"
if errorlevel 1 (
  echo.
  echo Repair fehlgeschlagen. Details siehe logs\repair.log
  pause
  exit /b 1
)
echo.
echo Repair abgeschlossen.
pause
