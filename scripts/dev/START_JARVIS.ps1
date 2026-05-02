param(
  [switch]$DevFrontend,
  [switch]$NoBrowser,
  [string]$Root = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
)

$ErrorActionPreference = "Stop"
. (Join-Path $PSScriptRoot "..\lib\Invoke-JarVISCore.ps1")

$bound = @{}
foreach($key in $PSBoundParameters.Keys){ if($key -ne "Root"){ $bound[$key] = $PSBoundParameters[$key] } }

Invoke-JarvisCoreScript `
  -CorePath (Join-Path $PSScriptRoot "START_JARVIS.core.ps1") `
  -Root $Root `
  -BoundParameters $bound `
  -LiteralReplacements @{
    'Join-Path $Root "FIRST_SETUP.ps1"' = 'Join-Path $Root "scripts\install\FIRST_SETUP.ps1"'
  }
