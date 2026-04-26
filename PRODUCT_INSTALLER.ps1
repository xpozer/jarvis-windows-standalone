param(
  [ValidateSet("Install","Repair","Update","Uninstall")]
  [string]$Mode = "Install",

  [string]$InstallDir = "$env:LOCALAPPDATA\JARVIS_WINDOWS_STANDALONE",
  [string]$UpdateZip = "",
  [switch]$KeepData,
  [switch]$NoShortcuts,
  [switch]$SkipDeps
)

$ErrorActionPreference = "Stop"
$SourceRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$InstallDir = [Environment]::ExpandEnvironmentVariables($InstallDir)
$LogRoot = Join-Path $SourceRoot "logs"
New-Item -ItemType Directory -Force -Path $LogRoot | Out-Null
$LogFile = Join-Path $LogRoot "product-installer.log"

function Log($Level, $Msg){
  $line = "[{0}] [{1}] {2}" -f (Get-Date -Format "yyyy-MM-dd HH:mm:ss"), $Level, $Msg
  Write-Host $line
  Add-Content -Path $LogFile -Value $line -Encoding UTF8
}

function Fail($Msg){ Log "ERROR" $Msg; throw $Msg }
function Has-Cmd($Name){ return [bool](Get-Command $Name -ErrorAction SilentlyContinue) }

function Refresh-EnvPath(){
  $machine = [Environment]::GetEnvironmentVariable("Path", "Machine")
  $user = [Environment]::GetEnvironmentVariable("Path", "User")
  $env:Path = "$machine;$user"
}

function Test-Port($Port){
  try {
    $c = New-Object Net.Sockets.TcpClient
    $iar = $c.BeginConnect("127.0.0.1", $Port, $null, $null)
    $ok = $iar.AsyncWaitHandle.WaitOne(500, $false)
    if($ok){ $c.EndConnect($iar) }
    $c.Close()
    return $ok
  } catch { return $false }
}

function Stop-JarvisProcesses(){
  Log "STEP" "Pruefe laufende JARVIS Ports"
  foreach($port in @(8000,5173)){
    if(Test-Port $port){
      Log "WARN" "Port $port ist belegt. Bitte laufende JARVIS Fenster mit STRG+C schließen, falls Update/Uninstall fehlschlägt."
    }
  }
}

function Backup-Install(){
  if(Test-Path $InstallDir){
    $parent = Split-Path -Parent $InstallDir
    $name = Split-Path -Leaf $InstallDir
    $stamp = Get-Date -Format "yyyyMMdd_HHmmss"
    $backup = Join-Path $parent "$name.backup.$stamp"
    Log "STEP" "Sichere bestehende Installation nach $backup"
    Move-Item -Path $InstallDir -Destination $backup -Force
    return $backup
  }
  return ""
}

function Copy-Package($From, $To){
  Log "STEP" "Kopiere Paket nach $To"
  New-Item -ItemType Directory -Force -Path $To | Out-Null
  $exclude = @("node_modules",".venv","__pycache__",".git",".pytest_cache","logs","backups","exports","updates")
  Get-ChildItem -Path $From -Force | ForEach-Object {
    if($exclude -contains $_.Name){ return }
    Copy-Item -Path $_.FullName -Destination (Join-Path $To $_.Name) -Recurse -Force
  }
}

function Ensure-Dependencies(){
  if($SkipDeps){ Log "INFO" "Dependency Check übersprungen"; return }
  Refresh-EnvPath
  if(-not (Has-Cmd "python") -and -not (Has-Cmd "py")){
    Log "WARN" "Python wurde nicht gefunden. Installation kann mit FIRST_SETUP fehlschlagen."
  } else { Log "OK" "Python gefunden" }

  if(-not (Has-Cmd "node") -or -not (Has-Cmd "npm")){
    Log "WARN" "Node.js/npm wurde nicht gefunden. Installation kann mit FIRST_SETUP fehlschlagen."
  } else { Log "OK" "Node/npm gefunden" }

  if(-not (Has-Cmd "ollama")){
    Log "WARN" "Ollama nicht gefunden. Chat funktioniert erst, wenn Ollama separat installiert/laeuft."
  } else { Log "OK" "Ollama gefunden" }
}

function Run-FirstSetup(){
  $setup = Join-Path $InstallDir "FIRST_SETUP.ps1"
  if(-not (Test-Path $setup)){ Fail "FIRST_SETUP.ps1 fehlt in $InstallDir" }
  Log "STEP" "Fuehre FIRST_SETUP.ps1 aus"
  & powershell -NoProfile -ExecutionPolicy Bypass -File $setup
  if($LASTEXITCODE -ne 0){ Fail "FIRST_SETUP.ps1 fehlgeschlagen" }
}

function Create-Shortcuts(){
  if($NoShortcuts){ return }
  $start = Join-Path $InstallDir "START_JARVIS.bat"
  if(-not (Test-Path $start)){ return }
  $desktop = [Environment]::GetFolderPath("Desktop")
  $shortcutPath = Join-Path $desktop "JARVIS starten.lnk"
  Log "STEP" "Erstelle Desktop Shortcut"
  $shell = New-Object -ComObject WScript.Shell
  $shortcut = $shell.CreateShortcut($shortcutPath)
  $shortcut.TargetPath = $start
  $shortcut.WorkingDirectory = $InstallDir
  $shortcut.IconLocation = "$env:SystemRoot\System32\SHELL32.dll,13"
  $shortcut.Save()
}

function Write-InstallState($State){
  $data = Join-Path $InstallDir "data"
  New-Item -ItemType Directory -Force -Path $data | Out-Null
  $stateFile = Join-Path $data "install_state.json"
  $State | ConvertTo-Json -Depth 8 | Set-Content -Path $stateFile -Encoding UTF8
}

function Install-Jarvis(){
  Ensure-Dependencies
  if(Test-Path $InstallDir){
    Backup-Install | Out-Null
  }
  Copy-Package $SourceRoot $InstallDir
  Run-FirstSetup
  Create-Shortcuts
  Write-InstallState @{ mode="install"; installDir=$InstallDir; installedAt=(Get-Date).ToString("s"); source=$SourceRoot }
  Log "OK" "Installation abgeschlossen: $InstallDir"
}

function Repair-Jarvis(){
  if(-not (Test-Path $InstallDir)){ Fail "Installation nicht gefunden: $InstallDir" }
  Ensure-Dependencies
  Run-FirstSetup
  Create-Shortcuts
  Write-InstallState @{ mode="repair"; installDir=$InstallDir; repairedAt=(Get-Date).ToString("s") }
  Log "OK" "Repair abgeschlossen"
}

function Update-Jarvis(){
  if(-not $UpdateZip){ Fail "UpdateZip fehlt. Beispiel: -Mode Update -UpdateZip C:\Temp\JARVIS_NEU.zip" }
  if(-not (Test-Path $UpdateZip)){ Fail "UpdateZip nicht gefunden: $UpdateZip" }
  Stop-JarvisProcesses
  $tmp = Join-Path $env:TEMP ("jarvis_update_" + (Get-Date -Format "yyyyMMdd_HHmmss"))
  New-Item -ItemType Directory -Force -Path $tmp | Out-Null
  Log "STEP" "Entpacke Update ZIP nach $tmp"
  Expand-Archive -Path $UpdateZip -DestinationPath $tmp -Force
  $candidate = Get-ChildItem -Path $tmp -Directory | Select-Object -First 1
  if($null -eq $candidate){ $candidate = Get-Item $tmp }
  if(-not (Test-Path (Join-Path $candidate.FullName "backend\main.py"))){ Fail "Update ZIP hat keine gueltige JARVIS Struktur" }

  $dataBackup = ""
  if(Test-Path (Join-Path $InstallDir "data")){
    $dataBackup = Join-Path $env:TEMP ("jarvis_data_backup_" + (Get-Date -Format "yyyyMMdd_HHmmss"))
    Copy-Item -Path (Join-Path $InstallDir "data") -Destination $dataBackup -Recurse -Force
    Log "OK" "Daten temporaer gesichert: $dataBackup"
  }

  Backup-Install | Out-Null
  Copy-Package $candidate.FullName $InstallDir

  if($KeepData -and $dataBackup -and (Test-Path $dataBackup)){
    Log "STEP" "Stelle Daten wieder her"
    Copy-Item -Path $dataBackup -Destination (Join-Path $InstallDir "data") -Recurse -Force
  }

  Run-FirstSetup
  Create-Shortcuts
  Write-InstallState @{ mode="update"; installDir=$InstallDir; updatedAt=(Get-Date).ToString("s"); updateZip=$UpdateZip; keepData=[bool]$KeepData }
  Log "OK" "Update abgeschlossen"
}

function Uninstall-Jarvis(){
  if(-not (Test-Path $InstallDir)){ Log "OK" "Installation existiert nicht"; return }
  Stop-JarvisProcesses
  if($KeepData){
    $backup = Backup-Install
    Log "OK" "Installation als Backup verschoben: $backup"
  } else {
    Log "STEP" "Entferne Installation: $InstallDir"
    Remove-Item -Path $InstallDir -Recurse -Force
  }
  Log "OK" "Uninstall abgeschlossen"
}

Log "STEP" "JARVIS Product Installer startet. Mode=$Mode"
switch($Mode){
  "Install" { Install-Jarvis }
  "Repair" { Repair-Jarvis }
  "Update" { Update-Jarvis }
  "Uninstall" { Uninstall-Jarvis }
}
