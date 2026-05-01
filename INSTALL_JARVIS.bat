@echo off
setlocal
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\install\INSTALL_JARVIS.ps1" -SourceRoot "%~dp0"
if errorlevel 1 (
  echo.
  echo Installation fehlgeschlagen. Details siehe logs\installer.log und INSTALL_FAILED.log auf dem Desktop.
  pause
  exit /b 1
)
echo.
echo Installation abgeschlossen.
pause
