param(
  [string]$TagName = "local-test",
  [string]$ReleaseDir = "release",
  [switch]$SkipFrontendBuild
)

$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

$Root = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$ReleasePath = Join-Path $Root $ReleaseDir
$SafeTag = ($TagName -replace '[^A-Za-z0-9._-]', '-').Trim("-")
if(-not $SafeTag){ $SafeTag = "local-test" }
$ZipName = "jarvis-windows-standalone-$SafeTag.zip"
$ZipPath = Join-Path $ReleasePath $ZipName
$HashPath = "$ZipPath.sha256.txt"
$ManifestPath = Join-Path $ReleasePath "release-manifest-$SafeTag.json"
$StagePath = Join-Path $Root ("artifacts\release-staging-" + $SafeTag)

$ExcludedSegments = @(
  ".git",
  ".github",
  ".venv",
  "venv",
  "env",
  "node_modules",
  "__pycache__",
  ".pytest_cache",
  ".ruff_cache"
)

$ExcludedRootSegments = @(
  "logs",
  "audit",
  "data",
  "runtime",
  "cache",
  "local_data",
  "knowledge_index",
  "release",
  "artifacts",
  "backups",
  "exports",
  "updates"
)

$ExcludedFiles = @(
  ".env",
  "config/lifeos.json"
)

function ConvertTo-RelativePath {
  param([string]$Path)
  $full = (Resolve-Path $Path).Path
  $rootText = $Root.Path.TrimEnd("\")
  if($full.StartsWith($rootText, [StringComparison]::OrdinalIgnoreCase)){
    return $full.Substring($rootText.Length).TrimStart("\").Replace("\", "/")
  }
  return (Split-Path -Leaf $full)
}

function Test-ReleasePathAllowed {
  param([string]$RelativePath)
  $clean = $RelativePath.Replace("\", "/").Trim("/")
  if(-not $clean){ return $false }
  if($ExcludedFiles -contains $clean){ return $false }
  if($clean -like ".env.*" -and $clean -ne ".env.example"){ return $false }
  $segments = @($clean.Split("/"))
  if($segments.Count -gt 0 -and ($ExcludedRootSegments -contains $segments[0])){ return $false }
  foreach($segment in $segments){
    if($ExcludedSegments -contains $segment){ return $false }
  }
  return $true
}

function Copy-ReleaseFile {
  param([string]$RelativePath)
  $relative = $RelativePath.Replace("\", "/").Trim("/")
  if(-not (Test-ReleasePathAllowed $relative)){ return $false }
  $source = Join-Path $Root ($relative.Replace("/", "\"))
  if(-not (Test-Path $source -PathType Leaf)){ return $false }
  $target = Join-Path $StagePath ($relative.Replace("/", "\"))
  New-Item -ItemType Directory -Force -Path (Split-Path -Parent $target) | Out-Null
  Copy-Item -LiteralPath $source -Destination $target -Force
  return $true
}

function Get-TrackedFiles {
  try {
    $inside = (& git -C $Root rev-parse --is-inside-work-tree 2>$null).Trim()
    if($inside -ne "true"){ return @() }
    return @(& git -C $Root ls-files)
  } catch {
    return @()
  }
}

function Get-FallbackFiles {
  return Get-ChildItem -Path $Root -Recurse -File -Force |
    ForEach-Object { ConvertTo-RelativePath $_.FullName }
}

function Invoke-FrontendBuild {
  $frontend = Join-Path $Root "frontend"
  $package = Join-Path $frontend "package.json"
  if($SkipFrontendBuild -or -not (Test-Path $package)){ return }
  Push-Location $frontend
  try {
    if(Test-Path "package-lock.json"){ npm ci } else { npm install }
    npm run build
  } finally {
    Pop-Location
  }
}

Write-Host "JARVIS Release ZIP Build" -ForegroundColor Cyan
Write-Host "Root: $Root" -ForegroundColor DarkGray
Write-Host "Tag:  $SafeTag" -ForegroundColor DarkGray

Invoke-FrontendBuild

if(Test-Path $StagePath){ Remove-Item -LiteralPath $StagePath -Recurse -Force }
if(Test-Path $ZipPath){ Remove-Item -LiteralPath $ZipPath -Force }
if(Test-Path $HashPath){ Remove-Item -LiteralPath $HashPath -Force }
New-Item -ItemType Directory -Force -Path $StagePath, $ReleasePath | Out-Null

$files = Get-TrackedFiles
if($files.Count -eq 0){ $files = Get-FallbackFiles }

$copied = 0
foreach($file in $files){
  if(Copy-ReleaseFile $file){ $copied++ }
}

$dist = Join-Path $Root "frontend\dist"
if(Test-Path $dist){
  Get-ChildItem -Path $dist -Recurse -File -Force | ForEach-Object {
    $relative = ConvertTo-RelativePath $_.FullName
    if(Copy-ReleaseFile $relative){ $script:copied++ }
  }
} else {
  Write-Warning "frontend/dist fehlt. Das Release enthaelt keinen Production Build."
}

if($copied -le 0){ throw "Keine Dateien fuer das Release gefunden." }

Compress-Archive -Path (Join-Path $StagePath "*") -DestinationPath $ZipPath -Force
$hash = Get-FileHash -Algorithm SHA256 $ZipPath
$hash | Format-List | Out-File $HashPath -Encoding utf8

$manifest = [ordered]@{
  app = "JARVIS Windows Standalone"
  tag = $SafeTag
  created_at = (Get-Date).ToString("s")
  zip = $ZipName
  sha256 = $hash.Hash
  files = $copied
  excludes = @{
    any_segment = $ExcludedSegments
    root_segment = $ExcludedRootSegments
  }
}
$manifest | ConvertTo-Json -Depth 6 | Set-Content -Path $ManifestPath -Encoding utf8

Remove-Item -LiteralPath $StagePath -Recurse -Force

Write-Host "Release ZIP erstellt: $ZipPath" -ForegroundColor Green
Write-Host "SHA256: $($hash.Hash)" -ForegroundColor Green
