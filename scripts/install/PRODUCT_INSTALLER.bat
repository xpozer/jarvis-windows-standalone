@echo off
setlocal
cd /d "%~dp0..\.."
powershell -NoProfile -ExecutionPolicy Bypass -File "%CD%\PRODUCT_INSTALLER.ps1" -Mode Install
pause
