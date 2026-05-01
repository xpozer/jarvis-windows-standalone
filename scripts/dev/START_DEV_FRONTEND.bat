@echo off
setlocal EnableExtensions
cd /d "%~dp0..\.."
powershell -NoProfile -ExecutionPolicy Bypass -File "%CD%\START_JARVIS.ps1" -DevFrontend
pause
