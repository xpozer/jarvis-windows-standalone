param(
  [switch]$NoBrowser,
  [string]$Root = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
)

. (Join-Path $PSScriptRoot "..\lib\Invoke-JarVISCore.ps1")

$bound = @{}
foreach($key in $PSBoundParameters.Keys){ if($key -ne "Root"){ $bound[$key] = $PSBoundParameters[$key] } }

Invoke-JarvisCoreScript -CorePath (Join-Path $PSScriptRoot "REPAIR.core.ps1") -Root $Root -BoundParameters $bound
