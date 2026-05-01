@echo off
setlocal
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%CD%\scripts\install\PRODUCT_INSTALLER.ps1" -Root "%CD%" -Mode Uninstall -KeepData
pause
