@echo off
setlocal
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0CHECK_GITHUB_UPDATE.ps1" %*
if errorlevel 1 (
  echo.
  echo GitHub Update Check fehlgeschlagen.
  pause
  exit /b 1
)
echo.
echo GitHub Update Check abgeschlossen.
pause
