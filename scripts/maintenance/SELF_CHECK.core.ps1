$ErrorActionPreference = "Continue"
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$Logs = Join-Path $Root "logs"
New-Item -ItemType Directory -Force -Path $Logs | Out-Null
$Log = Join-Path $Logs "self-check.log"
function Write-Check($Name, $Ok, $Detail=""){ $state = if($Ok){"OK"} else {"FEHLER"}; $line = "[{0}] {1}: {2}" -f $state,$Name,$Detail; Write-Host $line; Add-Content -Path $Log -Value $line -Encoding UTF8 }
Set-Content -Path $Log -Value "JARVIS SELF CHECK $(Get-Date -Format s)" -Encoding UTF8
Write-Check "Root" (Test-Path $Root) $Root
Write-Check "START_JARVIS.bat" (Test-Path (Join-Path $Root "START_JARVIS.bat")) "Startdatei"
Write-Check "FIRST_SETUP.bat" (Test-Path (Join-Path $Root "FIRST_SETUP.bat")) "Setupdatei"
Write-Check "Python venv" (Test-Path (Join-Path $Root "backend\.venv\Scripts\python.exe")) "backend\.venv"
Write-Check "Frontend dist" (Test-Path (Join-Path $Root "frontend\dist\index.html")) "frontend\dist\index.html"
$npm = "C:\Program Files\nodejs\npm.cmd"
Write-Check "npm.cmd" (Test-Path $npm) $npm
$node = "C:\Program Files\nodejs\node.exe"
Write-Check "node.exe" (Test-Path $node) $node
try { $r = Invoke-RestMethod -Uri "http://127.0.0.1:8000/health" -TimeoutSec 2; Write-Check "Backend /health" $true ($r.status) } catch { Write-Check "Backend /health" $false $_.Exception.Message }
try { $r = Invoke-RestMethod -Uri "http://127.0.0.1:8000/self-check" -TimeoutSec 2; Write-Check "Backend /self-check" $true ("ok=" + $r.ok) } catch { Write-Check "Backend /self-check" $false $_.Exception.Message }
try { $r = Invoke-RestMethod -Uri "http://127.0.0.1:11434/api/tags" -TimeoutSec 2; Write-Check "Ollama" $true "Port 11434 erreichbar" } catch { Write-Check "Ollama" $false $_.Exception.Message }
Write-Host ""
Write-Host "Log gespeichert: $Log"
