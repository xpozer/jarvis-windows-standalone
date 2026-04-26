@echo off
cd /d "%~dp0"
echo Erstelle Daten Export ZIP...
powershell -NoProfile -ExecutionPolicy Bypass -Command "try { Invoke-RestMethod -Method Get -Uri 'http://127.0.0.1:8000/export/data.zip?include_logs=true' | ConvertTo-Json -Depth 8 } catch { Write-Host $_; exit 1 }"
pause
