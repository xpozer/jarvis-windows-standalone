param(
  [switch]$DevFrontend,
  [switch]$NoBrowser,
  [switch]$SkipUpdate,
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
    '"JARVIS_GITHUB_OWNER","JARVIS_GITHUB_REPO","JARVIS_GITHUB_TOKEN"' = '"JARVIS_GITHUB_OWNER","JARVIS_GITHUB_REPO"'
    'Setze JARVIS_GITHUB_OWNER, JARVIS_GITHUB_REPO und JARVIS_GITHUB_TOKEN als User-Env, um Auto-Update zu aktivieren.' = 'Setze mindestens JARVIS_GITHUB_OWNER und JARVIS_GITHUB_REPO als User-Env, um Auto-Update zu aktivieren. JARVIS_GITHUB_TOKEN ist nur fuer private Repos oder hoehere API Limits noetig.'
  }
