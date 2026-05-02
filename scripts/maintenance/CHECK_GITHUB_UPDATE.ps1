param(
  [string]$InstallDir = "$env:LOCALAPPDATA\JARVIS_WINDOWS_STANDALONE",
  [switch]$Apply,
  [switch]$SkipIfSameVersion,
  [string]$Root = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
)

$ErrorActionPreference = "Stop"
. (Join-Path $PSScriptRoot "..\lib\Invoke-JarVISCore.ps1")

$bound = @{}
foreach($key in $PSBoundParameters.Keys){ if($key -ne "Root"){ $bound[$key] = $PSBoundParameters[$key] } }

Invoke-JarvisCoreScript `
  -CorePath (Join-Path $PSScriptRoot "CHECK_GITHUB_UPDATE.core.ps1") `
  -Root $Root `
  -BoundParameters $bound `
  -LiteralReplacements @{
    'Join-Path $InstallDir "PRODUCT_INSTALLER.ps1"' = 'Join-Path $InstallDir "scripts\install\PRODUCT_INSTALLER.ps1"'
    'Join-Path $Root "PRODUCT_INSTALLER.ps1"' = 'Join-Path $Root "scripts\install\PRODUCT_INSTALLER.ps1"'
    'Join-Path $InstallDir "JARVIS_INSTALL_CONFIG.json"' = 'Join-Path $InstallDir "scripts\install\JARVIS_INSTALL_CONFIG.json"'
    'Join-Path $Root "JARVIS_INSTALL_CONFIG.json"' = 'Join-Path $Root "scripts\install\JARVIS_INSTALL_CONFIG.json"'
  }
