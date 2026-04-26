@echo off
cd /d "%~dp0"
echo Erstelle JARVIS Backup...
powershell -NoProfile -ExecutionPolicy Bypass -Command "try { Invoke-RestMethod -Method Post -Uri http://127.0.0.1:8000/backup/create -ContentType 'application/json' -Body '{\"label\":\"manual_bat\"}' | ConvertTo-Json -Depth 5 } catch { Write-Host $_; exit 1 }"
pause
