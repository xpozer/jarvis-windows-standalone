@echo off
setlocal
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\install\PRODUCT_INSTALLER.ps1" -Root "%~dp0" -Mode Uninstall -KeepData
pause
