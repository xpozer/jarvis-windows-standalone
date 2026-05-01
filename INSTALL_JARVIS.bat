@echo off
setlocal
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%CD%\scripts\install\INSTALL_JARVIS.ps1" -SourceRoot "%CD%"
if errorlevel 1 (
  echo.
  echo Installation fehlgeschlagen. Details siehe logs\installer.log und INSTALL_FAILED.log auf dem Desktop.
  pause
  exit /b 1
)
echo.
echo Installation abgeschlossen.
pause
