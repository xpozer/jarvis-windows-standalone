@echo off
setlocal
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%CD%\scripts\dev\START_JARVIS.ps1" -Root "%CD%"
if errorlevel 1 pause
