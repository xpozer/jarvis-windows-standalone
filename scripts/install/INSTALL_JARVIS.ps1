param(
  [string]$InstallDir = "$env:LOCALAPPDATA\JARVIS_WINDOWS_STANDALONE",
  [string]$SourceRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path,
  [switch]$SkipModel,
  [switch]$NoShortcuts,
  [switch]$NoCleanBackup
)

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
  }
