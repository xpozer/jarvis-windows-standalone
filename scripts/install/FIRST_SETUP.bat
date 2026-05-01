@echo off
setlocal
cd /d "%~dp0..\.."
powershell -NoProfile -ExecutionPolicy Bypass -File "%CD%\FIRST_SETUP.ps1"
if errorlevel 1 pause
