@echo off
setlocal
cd /d "%~dp0..\.."
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0CHECK_GITHUB_UPDATE.ps1" -Root "%CD%" %*
if errorlevel 1 (
  echo.
  echo GitHub Update Check fehlgeschlagen.
  pause
  exit /b 1
)
echo.
echo GitHub Update Check abgeschlossen.
pause
