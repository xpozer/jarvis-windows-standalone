@echo off
setlocal
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\dev\START_JARVIS.ps1" -Root "%~dp0"
if errorlevel 1 pause
