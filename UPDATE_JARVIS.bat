@echo off
cd /d "%~dp0"
set /p ZIP=Pfad zur neuen JARVIS Update ZIP: 
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0PRODUCT_INSTALLER.ps1" -Mode Update -UpdateZip "%ZIP%" -KeepData
pause
