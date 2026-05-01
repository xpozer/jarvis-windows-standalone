@echo off
setlocal EnableExtensions
cd /d "%~dp0..\.."
powershell -NoProfile -ExecutionPolicy Bypass -File "%CD%\SELF_CHECK.ps1"
pause
