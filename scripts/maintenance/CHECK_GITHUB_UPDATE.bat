@echo off
setlocal
cd /d "%~dp0..\.."
powershell -NoProfile -ExecutionPolicy Bypass -File "%CD%\CHECK_GITHUB_UPDATE.ps1" %*
if errorlevel 1 (
  echo.
  echo GitHub Update Check fehlgeschlagen.
  pause
  exit /b 1
)
echo.
echo GitHub Update Check abgeschlossen.
pause
