@echo off
setlocal
cd /d "%~dp0..\.."
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0PRODUCT_INSTALLER.ps1" -Root "%CD%" -Mode Install
pause
