@echo off
setlocal EnableExtensions EnableDelayedExpansion
title JARVIS Frontend
cd /d "%~dp0"

echo.
echo JARVIS Frontend wird gestartet
echo.
echo Voraussetzung: Backend laeuft auf http://localhost:8000
echo.

REM Wichtig: nicht das kaputte lokale node_modules\.bin\npm.cmd verwenden.
set "LOCAL_BIN=%CD%\node_modules\.bin"
set "PATH=%PATH:%LOCAL_BIN%;=%"
set "PATH=%PATH:;%LOCAL_BIN%=;%"

set "NPM_CMD="
for /f "delims=" %%I in ('where npm.cmd 2^>nul') do (
    echo %%I | findstr /i /c:"\node_modules\" >nul
    if errorlevel 1 if not defined NPM_CMD set "NPM_CMD=%%I"
)
if not defined NPM_CMD (
    for /f "delims=" %%I in ('where npm 2^>nul') do (
        echo %%I | findstr /i /c:"\node_modules\" >nul
        if errorlevel 1 if not defined NPM_CMD set "NPM_CMD=%%I"
    )
)
if not defined NPM_CMD (
    echo FEHLER: Globales npm wurde nicht gefunden oder nur ein kaputtes lokales npm liegt im Frontend Ordner.
    echo Bitte REPAIR_FRONTEND_NPM.bat ausfuehren oder Node.js LTS neu installieren.
    pause
    exit /b 1
)

echo Nutze npm: %NPM_CMD%

if not exist package.json (
    echo FEHLER: package.json fehlt in %CD%
    pause
    exit /b 1
)

if not exist node_modules\react (
    echo node_modules fehlen oder sind unvollstaendig, installiere Abhaengigkeiten...
    "%NPM_CMD%" install
    if errorlevel 1 (
        echo FEHLER bei npm install
        pause
        exit /b 1
    )
)

echo.
echo Starte Vite Dev Server auf http://localhost:5173
echo Beenden mit Strg+C
echo.
"%NPM_CMD%" run dev
pause
