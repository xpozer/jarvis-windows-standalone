@echo off
setlocal EnableExtensions
cd /d "%~dp0..\.."
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0SELF_CHECK.ps1" -Root "%CD%"
pause
