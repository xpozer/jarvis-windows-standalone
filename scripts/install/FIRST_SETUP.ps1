param(
  [string]$Root = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
)

$ErrorActionPreference = "Stop"
. (Join-Path $PSScriptRoot "..\lib\Invoke-JarVISCore.ps1")
Invoke-JarvisCoreScript -CorePath (Join-Path $PSScriptRoot "FIRST_SETUP.core.ps1") -Root $Root -BoundParameters @{}
