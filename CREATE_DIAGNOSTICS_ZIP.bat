@echo off
cd /d "%~dp0"
echo Erstelle JARVIS Diagnose ZIP...
powershell -NoProfile -ExecutionPolicy Bypass -Command "try { Invoke-RestMethod -Method Get -Uri http://127.0.0.1:8000/diagnostics/package | ConvertTo-Json -Depth 5 } catch { Write-Host $_; exit 1 }"
pause
