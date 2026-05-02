param(
  [string]$InstallDir = "$env:LOCALAPPDATA\JARVIS_WINDOWS_STANDALONE",
  [string]$SourceRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path,
  [switch]$SkipModel,
  [switch]$NoShortcuts,
  [switch]$NoCleanBackup
)

$ErrorActionPreference = "Stop"
$Root = (Resolve-Path $SourceRoot).Path
. (Join-Path $PSScriptRoot "..\lib\Invoke-JarVISCore.ps1")

$bound = @{}
foreach($key in $PSBoundParameters.Keys){ $bound[$key] = $PSBoundParameters[$key] }
$bound["SourceRoot"] = $Root

Invoke-JarvisCoreScript `
  -CorePath (Join-Path $PSScriptRoot "INSTALL_JARVIS.core.ps1") `
  -Root $Root `
  -BoundParameters $bound `
  -LiteralReplacements @{
    'Join-Path $InstallDir "FIRST_SETUP.ps1"' = 'Join-Path $InstallDir "scripts\install\FIRST_SETUP.ps1"'
    '& powershell -NoProfile -ExecutionPolicy Bypass -File $setup' = '& powershell -NoProfile -ExecutionPolicy Bypass -File $setup -Root $InstallDir'
    'Start-Process -FilePath "cmd.exe" -ArgumentList "/k cd /d `"$backend`" && `"$venv`" main.py" -WindowStyle Minimized' = 'Start-Process -FilePath "cmd.exe" -ArgumentList "/c cd /d `"$backend`" && `"$venv`" -m uvicorn main:app --host 127.0.0.1 --port 8000" -WindowStyle Minimized'
  }
