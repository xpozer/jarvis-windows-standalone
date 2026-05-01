@echo off
setlocal EnableExtensions
cd /d "%~dp0..\.."
powershell -NoProfile -ExecutionPolicy Bypass -File "%CD%\INSTALL_JARVIS.ps1" -NoCleanBackup
pause
