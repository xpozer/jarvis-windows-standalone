@echo off
setlocal EnableExtensions
cd /d "%~dp0..\.."
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0INSTALL_JARVIS.ps1" -SourceRoot "%CD%" -NoCleanBackup
pause
