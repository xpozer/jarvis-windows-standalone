param(
  [ValidateSet("Install","Repair","Update","Uninstall")]
  [string]$Mode = "Install",
  [string]$InstallDir = "$env:LOCALAPPDATA\JARVIS_WINDOWS_STANDALONE",
  [string]$UpdateZip = "",
  [switch]$KeepData,
  [switch]$NoShortcuts,
  [switch]$SkipDeps,
  [string]$Root = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
)

$ErrorActionPreference = "Stop"
. (Join-Path $PSScriptRoot "..\lib\Invoke-JarVISCore.ps1")

$bound = @{}
foreach($key in $PSBoundParameters.Keys){ if($key -ne "Root"){ $bound[$key] = $PSBoundParameters[$key] } }

Invoke-JarvisCoreScript `
  -CorePath (Join-Path $PSScriptRoot "PRODUCT_INSTALLER.core.ps1") `
  -Root $Root `
  -BoundParameters $bound `
  -LiteralReplacements @{
    'Join-Path $InstallDir "FIRST_SETUP.ps1"' = 'Join-Path $InstallDir "scripts\install\FIRST_SETUP.ps1"'
  }
