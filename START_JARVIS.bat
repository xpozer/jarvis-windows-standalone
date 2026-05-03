@echo off
setlocal
cd /d "%~dp0"
set "JARVIS_EXTRA_ARGS="
:parse_args
if "%~1"=="" goto run
if /I "%~1"=="--skip-update" (
  set "JARVIS_EXTRA_ARGS=%JARVIS_EXTRA_ARGS% -SkipUpdate"
  shift
  goto parse_args
)
if /I "%~1"=="-SkipUpdate" (
  set "JARVIS_EXTRA_ARGS=%JARVIS_EXTRA_ARGS% -SkipUpdate"
  shift
  goto parse_args
)
shift
goto parse_args
:run
powershell -NoProfile -ExecutionPolicy Bypass -File "%CD%\scripts\dev\START_JARVIS.ps1" -Root "%CD%"%JARVIS_EXTRA_ARGS%
if errorlevel 1 pause
