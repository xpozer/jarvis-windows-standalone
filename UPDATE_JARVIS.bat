@echo off
setlocal
cd /d "%~dp0"
set /p ZIP=Pfad zur neuen JARVIS Update ZIP: 
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\install\PRODUCT_INSTALLER.ps1" -Root "%~dp0" -Mode Update -UpdateZip "%ZIP%" -KeepData
pause
