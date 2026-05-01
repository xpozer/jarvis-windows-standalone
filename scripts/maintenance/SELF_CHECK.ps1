param(
  [string]$Root = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
)

$ErrorActionPreference = "Stop"
. (Join-Path $PSScriptRoot "..\lib\Invoke-JarVISCore.ps1")
Invoke-JarvisCoreScript -CorePath (Join-Path $PSScriptRoot "SELF_CHECK.core.ps1") -Root $Root -BoundParameters @{} -LiteralReplacements @{
  'Join-Path $Root "FIRST_SETUP.bat"' = 'Join-Path $Root "scripts\install\FIRST_SETUP.bat"'
}
