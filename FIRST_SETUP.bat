@echo off
setlocal
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0FIRST_SETUP.ps1"
if errorlevel 1 pause
