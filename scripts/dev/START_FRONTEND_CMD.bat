@echo off
setlocal EnableExtensions
cd /d "%~dp0..\..\frontend"
set "NPM_CMD=C:\Program Files\nodejs\npm.cmd"
if not exist "%NPM_CMD%" (
  echo FEHLER: %NPM_CMD% wurde nicht gefunden.
  echo Bitte Node.js LTS installieren.
  pause
  exit /b 1
)
if not exist node_modules\react (
  echo Frontend Dependencies fehlen. Installiere mit npm.cmd...
  call "%NPM_CMD%" install
  if errorlevel 1 pause & exit /b 1
)
echo Starte Frontend auf http://127.0.0.1:5173
call "%NPM_CMD%" run dev
pause
