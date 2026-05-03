param(
  [string]$InstallDir = "$env:LOCALAPPDATA\JARVIS_WINDOWS_STANDALONE",
  [switch]$Apply,
  [switch]$SkipIfSameVersion
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$InstallDir = [Environment]::ExpandEnvironmentVariables($InstallDir)
if(-not (Test-Path $InstallDir)){ $InstallDir = $Root }

$Logs = Join-Path $InstallDir "logs"
$Data = Join-Path $InstallDir "data"
$Staging = Join-Path $InstallDir "updates\staging"
New-Item -ItemType Directory -Force -Path $Logs,$Data,$Staging | Out-Null
$LogFile = Join-Path $Logs "github-update.log"

function Log($Level, $Message){
  $line = "[{0}] [{1}] {2}" -f (Get-Date -Format "yyyy-MM-dd HH:mm:ss"), $Level, $Message
  Write-Host $line
  Add-Content -Path $LogFile -Value $line -Encoding UTF8
}

function Fail($Message){ Log "ERROR" $Message; throw $Message }

function Get-EnvValue($Name){
  $value = [Environment]::GetEnvironmentVariable($Name, "Process")
  if([string]::IsNullOrWhiteSpace($value)){
    $value = [Environment]::GetEnvironmentVariable($Name, "User")
  }
  if([string]::IsNullOrWhiteSpace($value)){ return "" }
  return $value.Trim()
}

function Require-Env($Name){
  $value = Get-EnvValue $Name
  if([string]::IsNullOrWhiteSpace($value)){
    Fail "$Name fehlt. Bitte als Umgebungsvariable setzen."
  }
  return $value
}

function New-GitHubHeaders([string]$Token, [string]$Accept){
  $headers = @{
    "Accept" = $Accept
    "X-GitHub-Api-Version" = "2022-11-28"
    "User-Agent" = "JARVIS-Windows-Standalone-Updater"
  }
  if(-not [string]::IsNullOrWhiteSpace($Token)){
    $headers["Authorization"] = "Bearer $Token"
  }
  return $headers
}

function Get-LocalVersion {
  $config = Join-Path $InstallDir "JARVIS_INSTALL_CONFIG.json"
  if(-not (Test-Path $config)){ $config = Join-Path $Root "JARVIS_INSTALL_CONFIG.json" }
  if(Test-Path $config){
    try { return ((Get-Content -Raw -Path $config | ConvertFrom-Json).version) } catch {}
  }
  return ""
}

function Test-JarvisZip($ZipPath){
  Add-Type -AssemblyName System.IO.Compression.FileSystem
  $zip = [IO.Compression.ZipFile]::OpenRead($ZipPath)
  try {
    $names = @($zip.Entries | ForEach-Object { $_.FullName })
  } finally {
    $zip.Dispose()
  }
  $hasBackend = [bool]($names | Where-Object { $_ -eq "backend/main.py" -or $_ -like "*/backend/main.py" } | Select-Object -First 1)
  $hasInstaller = [bool]($names | Where-Object { $_ -eq "INSTALL_JARVIS.ps1" -or $_ -like "*/INSTALL_JARVIS.ps1" } | Select-Object -First 1)
  return ($hasBackend -and $hasInstaller)
}

$owner = Require-Env "JARVIS_GITHUB_OWNER"
$repo = Require-Env "JARVIS_GITHUB_REPO"
$token = Get-EnvValue "JARVIS_GITHUB_TOKEN"
$release = Get-EnvValue "JARVIS_GITHUB_RELEASE"
if([string]::IsNullOrWhiteSpace($release)){ $release = "latest" }
$assetName = Get-EnvValue "JARVIS_GITHUB_PACKAGE_ASSET"

$releaseUrl = if($release -eq "latest"){
  "https://api.github.com/repos/$owner/$repo/releases/latest"
} else {
  "https://api.github.com/repos/$owner/$repo/releases/tags/$release"
}

$headers = New-GitHubHeaders -Token $token -Accept "application/vnd.github+json"
$authMode = if([string]::IsNullOrWhiteSpace($token)){ "public" } else { "token" }

Log "STEP" "Pruefe GitHub Release: $owner/$repo ($release, auth: $authMode)"
$remote = Invoke-RestMethod -Uri $releaseUrl -Headers $headers -TimeoutSec 30
$remoteVersion = [string]$remote.tag_name
$localVersion = [string](Get-LocalVersion)
Log "INFO" "Lokal: $localVersion | GitHub: $remoteVersion"

if($SkipIfSameVersion -and $localVersion -and $remoteVersion -and $localVersion -eq $remoteVersion){
  Log "OK" "Keine neue Version gefunden."
  return
}

$assets = @($remote.assets)
if($assetName){
  $asset = $assets | Where-Object { $_.name -eq $assetName } | Select-Object -First 1
  if($null -eq $asset){ Fail "Release Asset nicht gefunden: $assetName" }
} else {
  $asset = $assets | Where-Object { ([string]$_.name).ToLowerInvariant().EndsWith(".zip") } | Select-Object -First 1
  if($null -eq $asset){ Fail "Kein ZIP Asset im Release gefunden." }
}

$safeName = ([string]$asset.name) -replace '[^a-zA-Z0-9._-]', '_'
$target = Join-Path $Staging ((Get-Date -Format "yyyyMMdd_HHmmss") + "_" + $safeName)
Log "STEP" "Lade Update ZIP: $($asset.name)"

$downloadHeaders = New-GitHubHeaders -Token $token -Accept "application/octet-stream"
$downloadUri = if([string]::IsNullOrWhiteSpace($token) -and $asset.browser_download_url){
  [string]$asset.browser_download_url
} else {
  [string]$asset.url
}

Invoke-WebRequest -Uri $downloadUri -Headers $downloadHeaders -OutFile $target -TimeoutSec 120

if(-not (Test-JarvisZip $target)){ Fail "Geladenes ZIP hat keine gueltige JARVIS Struktur: $target" }

$manifest = @{
  staged_at = (Get-Date).ToString("s")
  source = "github_release"
  auth = $authMode
  release = $remoteVersion
  filename = $asset.name
  path = $target
  size_kb = [math]::Round((Get-Item $target).Length / 1KB, 1)
  status = "staged"
}
$manifestPath = Join-Path $Data "update_manifest.json"
$manifest | ConvertTo-Json -Depth 8 | Set-Content -Path $manifestPath -Encoding UTF8
Log "OK" "Update gestaged: $target"

if($Apply){
  $installer = Join-Path $InstallDir "PRODUCT_INSTALLER.ps1"
  if(-not (Test-Path $installer)){ $installer = Join-Path $Root "PRODUCT_INSTALLER.ps1" }
  if(-not (Test-Path $installer)){ Fail "PRODUCT_INSTALLER.ps1 nicht gefunden." }
  Log "STEP" "Starte Produkt-Installer im Update-Modus"
  & powershell -NoProfile -ExecutionPolicy Bypass -File $installer -Mode Update -InstallDir $InstallDir -UpdateZip $target -KeepData
  if($LASTEXITCODE -ne 0){ Fail "Update Installation fehlgeschlagen. ExitCode: $LASTEXITCODE" }
  Log "OK" "Update Installation abgeschlossen"
} else {
  Log "INFO" "Zum Anwenden erneut mit -Apply starten."
}
