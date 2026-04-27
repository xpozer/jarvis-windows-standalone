param(
  [string]$InstallDir = "$env:LOCALAPPDATA\JARVIS_WINDOWS_STANDALONE",
  [string]$SourceRoot = $PSScriptRoot,
  [switch]$SkipModel,
  [switch]$NoShortcuts,
  [switch]$NoCleanBackup
)


$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

function Write-JvLine {
  param(
    [string]$Level,
    [string]$Message,
    [ConsoleColor]$Color = "Gray"
  )
  $line = "[{0}] [{1}] {2}" -f (Get-Date -Format "HH:mm:ss"), $Level, $Message
  Write-Host $line -ForegroundColor $Color
  if($script:LogFile){
    Add-Content -Path $script:LogFile -Value $line -Encoding UTF8
  }
}

function Jv-Ok { param([string]$Message) Write-JvLine "OK" $Message "Green" }
function Jv-Warn { param([string]$Message) Write-JvLine "WARN" $Message "Yellow" }
function Jv-Info { param([string]$Message) Write-JvLine "INFO" $Message "Gray" }
function Jv-Fail { param([string]$Message) Write-JvLine "ERROR" $Message "Red"; throw $Message }
function Jv-Step {
  param([string]$Message)
  if(-not $script:StartedAt){ $script:StartedAt = Get-Date }
  if($null -eq $script:Step){ $script:Step = 0 }
  if($null -eq $script:TotalSteps){ $script:TotalSteps = 0 }
  $script:Step++
  if($script:Step -gt $script:TotalSteps){ $script:TotalSteps = $script:Step }
  $elapsed = (Get-Date) - $script:StartedAt
  Write-Host ""
  Write-Host ("=" * 68) -ForegroundColor DarkCyan
  Write-Host ("[{0}/{1}] {2}  +{3}" -f $script:Step,$script:TotalSteps,$Message,$elapsed.ToString("mm\:ss")) -ForegroundColor Cyan
  Write-Host ("=" * 68) -ForegroundColor DarkCyan
  if($script:LogFile){
    Add-Content -Path $script:LogFile -Value ("[{0}] [STEP {1}/{2}] {3}" -f (Get-Date -Format "HH:mm:ss"),$script:Step,$script:TotalSteps,$Message) -Encoding UTF8
  }
}

function Test-IsAdmin {
  $identity = [Security.Principal.WindowsIdentity]::GetCurrent()
  $principal = New-Object Security.Principal.WindowsPrincipal($identity)
  return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

function Test-Cmd {
  param([string]$Name)
  return [bool](Get-Command $Name -ErrorAction SilentlyContinue)
}

function Refresh-EnvPath {
  # Registry-PATH direkt neu lesen, damit winget-Installationen ohne Shell-Neustart gefunden werden.
  $items = New-Object System.Collections.Generic.List[string]
  try {
    $machine = (Get-ItemProperty -Path "Registry::HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\Control\Session Manager\Environment" -Name Path -ErrorAction SilentlyContinue).Path
    if($machine){ $items.Add($machine) }
  } catch {}
  try {
    $user = (Get-ItemProperty -Path "Registry::HKEY_CURRENT_USER\Environment" -Name Path -ErrorAction SilentlyContinue).Path
    if($user){ $items.Add($user) }
  } catch {}
  foreach($p in @(
    "$env:ProgramFiles\nodejs",
    "$env:APPDATA\npm",
    "$env:LOCALAPPDATA\Programs\nodejs",
    "$env:LOCALAPPDATA\Programs\Python\Python313",
    "$env:LOCALAPPDATA\Programs\Python\Python313\Scripts",
    "$env:LOCALAPPDATA\Programs\Python\Python312",
    "$env:LOCALAPPDATA\Programs\Python\Python312\Scripts",
    "$env:LOCALAPPDATA\Programs\Python\Python311",
    "$env:LOCALAPPDATA\Programs\Python\Python311\Scripts",
    "$env:LOCALAPPDATA\Programs\Python\Python310",
    "$env:LOCALAPPDATA\Programs\Python\Python310\Scripts"
  )){
    if($p -and (Test-Path $p)){ $items.Add($p) }
  }
  $env:Path = ($items | Where-Object { $_ } | Select-Object -Unique) -join ";"
}

function ConvertTo-ProcessArgumentString {
  param([string[]]$Arguments = @())

  $quoted = @()
  foreach($a in @($Arguments)){
    if($null -eq $a){ continue }
    $s = [string]$a
    if($s.Length -eq 0){
      $quoted += '""'
      continue
    }
    if($s -match '[\s"]'){
      $s = $s.Replace('\', '\\').Replace('"', '\"')
      $quoted += '"' + $s + '"'
    } else {
      $quoted += $s
    }
  }
  return ($quoted -join " ")
}

function Invoke-Capture {
  param(
    [string]$Command,
    [string[]]$Arguments = @(),
    [int]$TimeoutSeconds = 15
  )
  $psi = New-Object System.Diagnostics.ProcessStartInfo
  $psi.FileName = $Command
  # Windows PowerShell 5 nutzt teils kein ArgumentList. Arguments ist kompatibler.
  $psi.Arguments = ConvertTo-ProcessArgumentString -Arguments $Arguments
  $psi.RedirectStandardOutput = $true
  $psi.RedirectStandardError = $true
  $psi.UseShellExecute = $false
  $psi.CreateNoWindow = $true
  try {
    $p = [System.Diagnostics.Process]::Start($psi)
    if(-not $p.WaitForExit($TimeoutSeconds * 1000)){
      try { $p.Kill() } catch {}
      return @{ Ok=$false; ExitCode=-1; Output=""; Error="Timeout nach $TimeoutSeconds Sekunden" }
    }
    return @{
      Ok = ($p.ExitCode -eq 0)
      ExitCode = $p.ExitCode
      Output = $p.StandardOutput.ReadToEnd().Trim()
      Error = $p.StandardError.ReadToEnd().Trim()
    }
  } catch {
    return @{ Ok=$false; ExitCode=-2; Output=""; Error=$_.Exception.Message }
  }
}
function Parse-PythonVersion {
  param([string]$Text)
  if($Text -match "Python\s+(\d+)\.(\d+)\.(\d+)"){ return [version]"$($Matches[1]).$($Matches[2]).$($Matches[3])" }
  if($Text -match "Python\s+(\d+)\.(\d+)"){ return [version]"$($Matches[1]).$($Matches[2]).0" }
  return $null
}

function Test-PythonCandidate {
  param([string]$Command, [string[]]$Args = @())
  if($Command -match "WindowsApps"){ return $null }
  $r = Invoke-Capture -Command $Command -Arguments ($Args + @("--version")) -TimeoutSeconds 10
  $text = (($r.Output, $r.Error) -join " ").Trim()
  $ver = Parse-PythonVersion $text
  if(-not $ver){ return $null }
  if($ver.Major -ne 3 -or $ver -lt [version]"3.10.0"){
    return @{ Valid=$false; Command=$Command; Args=$Args; Version=$ver; Message="Python Version zu alt: $ver. Benötigt wird Python 3.10 oder neuer." }
  }
  $real = Invoke-Capture -Command $Command -Arguments ($Args + @("-c","import sys; print(sys.executable)")) -TimeoutSeconds 10
  if(-not $real.Ok){ return $null }
  if($real.Output -match "WindowsApps"){ return $null }
  return @{ Valid=$true; Command=$Command; Args=$Args; Version=$ver; Message="Python $ver gefunden" }
}

function Get-PythonLauncher {
  Refresh-EnvPath
  $candidates = New-Object System.Collections.Generic.List[object]
  if(Test-Cmd "py"){ $candidates.Add(@{ Command="py"; Args=@("-3") }) }
  if(Test-Cmd "python"){ $candidates.Add(@{ Command="python"; Args=@() }) }
  if(Test-Cmd "python3"){ $candidates.Add(@{ Command="python3"; Args=@() }) }
  foreach($k in @(
    "$env:LOCALAPPDATA\Programs\Python\Python313\python.exe",
    "$env:LOCALAPPDATA\Programs\Python\Python312\python.exe",
    "$env:LOCALAPPDATA\Programs\Python\Python311\python.exe",
    "$env:LOCALAPPDATA\Programs\Python\Python310\python.exe",
    "$env:ProgramFiles\Python313\python.exe",
    "$env:ProgramFiles\Python312\python.exe",
    "$env:ProgramFiles\Python311\python.exe",
    "$env:ProgramFiles\Python310\python.exe"
  )){
    if($k -and (Test-Path $k)){ $candidates.Add(@{ Command=$k; Args=@() }) }
  }

  $tooOld = @()
  foreach($c in $candidates){
    $t = Test-PythonCandidate -Command $c.Command -Args $c.Args
    if($null -eq $t){ continue }
    if($t.Valid){ Jv-Ok $t.Message; return @($t.Command) + $t.Args }
    $tooOld += $t.Message
  }
  if($tooOld.Count -gt 0){ Jv-Fail (($tooOld -join "`n") + "`nBitte Python 3.10 oder neuer installieren.") }
  Jv-Fail "Python 3.10 oder neuer wurde nicht gefunden."
}

function Get-NpmCmd {
  Refresh-EnvPath
  $cmd = Get-Command "npm.cmd" -ErrorAction SilentlyContinue
  if($cmd -and $cmd.Source -and ($cmd.Source -notmatch "node_modules")){ return [string]$cmd.Source }
  $cmd2 = Get-Command "npm" -ErrorAction SilentlyContinue
  if($cmd2 -and $cmd2.Source -and ($cmd2.Source -notmatch "node_modules")){ return [string]$cmd2.Source }

  foreach($k in @(
    "$env:APPDATA\npm\npm.cmd",
    "$env:LOCALAPPDATA\Programs\nodejs\npm.cmd",
    "$env:ProgramFiles\nodejs\npm.cmd",
    "${env:ProgramFiles(x86)}\nodejs\npm.cmd"
  )){
    if($k -and (Test-Path $k)){ return $k }
  }

  foreach($reg in @("Registry::HKEY_LOCAL_MACHINE\SOFTWARE\Node.js", "Registry::HKEY_LOCAL_MACHINE\SOFTWARE\WOW6432Node\Node.js")){
    try {
      $installPath = (Get-ItemProperty -Path $reg -ErrorAction SilentlyContinue)."InstallPath"
      if($installPath){
        $candidate = Join-Path $installPath "npm.cmd"
        if(Test-Path $candidate){ return $candidate }
      }
    } catch {}
  }
  Jv-Fail "npm.cmd wurde nicht gefunden. Bitte Node.js LTS installieren."
}

function Test-Port {
  param([int]$Port)
  $c = $null
  try {
    $c = New-Object Net.Sockets.TcpClient
    $iar = $c.BeginConnect("127.0.0.1", $Port, $null, $null)
    $ok = $iar.AsyncWaitHandle.WaitOne(500, $false)
    if($ok){ $c.EndConnect($iar) }
    return $ok
  } catch {
    return $false
  } finally {
    if($c){ $c.Close() }
  }
}

function Wait-Port {
  param([int]$Port, [int]$Seconds)
  for($i=0; $i -lt ($Seconds * 2); $i++){
    if(Test-Port $Port){ return $true }
    Start-Sleep -Milliseconds 500
  }
  return $false
}

function Invoke-Checked {
  param(
    [string]$Label,
    [string]$Command,
    [string[]]$Arguments,
    [string]$LogName = "",
    [string]$WorkingDirectory = "",
    [string]$LogPath = ""
  )
  Jv-Step $Label

  if(-not $LogPath){ $LogPath = Join-Path $script:Logs $LogName }
  $argString = ConvertTo-ProcessArgumentString -Arguments $Arguments

  Add-Content -Path $LogPath -Value "" -Encoding UTF8
  Add-Content -Path $LogPath -Value ("[{0}] {1}" -f (Get-Date -Format "yyyy-MM-dd HH:mm:ss"), $Label) -Encoding UTF8
  Add-Content -Path $LogPath -Value ("COMMAND: {0} {1}" -f $Command, $argString) -Encoding UTF8

  $psi = New-Object System.Diagnostics.ProcessStartInfo
  $psi.FileName = $Command
  $psi.Arguments = $argString
  if($WorkingDirectory){ $psi.WorkingDirectory = $WorkingDirectory }
  $psi.RedirectStandardOutput = $true
  $psi.RedirectStandardError = $true
  $psi.UseShellExecute = $false
  $psi.CreateNoWindow = $true

  $p = [System.Diagnostics.Process]::Start($psi)
  $stdout = $p.StandardOutput.ReadToEnd()
  $stderr = $p.StandardError.ReadToEnd()
  $p.WaitForExit()

  if($stdout){
    Write-Host $stdout
    Add-Content -Path $LogPath -Value $stdout -Encoding UTF8
  }

  if($stderr){
    # npm und pip schreiben Hinweise teils auf STDERR. Das ist nur kritisch, wenn der ExitCode ungleich 0 ist.
    Write-Host $stderr -ForegroundColor DarkYellow
    Add-Content -Path $LogPath -Value $stderr -Encoding UTF8
  }

  if($p.ExitCode -ne 0){
    Jv-Fail "$Label fehlgeschlagen. ExitCode: $($p.ExitCode). Siehe $LogPath"
  }

  Jv-Ok "$Label abgeschlossen"
}

function Write-DesktopFailureLog {
  param([string]$Message)
  try {
    $desktop = [Environment]::GetFolderPath("Desktop")
    $failure = Join-Path $desktop "INSTALL_FAILED.log"
    $content = @(
      "JARVIS Installation fehlgeschlagen",
      "Zeitpunkt: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')",
      "InstallDir: $InstallDir",
      "SourceRoot: $SourceRoot",
      "",
      "Fehler:",
      $Message,
      "",
      "Installer Log:",
      $script:LogFile
    )
    Set-Content -Path $failure -Value $content -Encoding UTF8
  } catch {}
}

trap {
  $msg = $_.Exception.Message
  Jv-Warn "Installation abgebrochen: $msg"
  Write-DesktopFailureLog $msg

  if(-not $script:InstallSucceeded){
    if($script:CopiedToTarget -and (Test-Path $InstallDir)){
      try {
        Jv-Warn "Entferne halb installierten Zielordner: $InstallDir"
        Remove-Item -Path $InstallDir -Recurse -Force -ErrorAction Stop
      } catch {
        Jv-Warn "Cleanup fehlgeschlagen: $($_.Exception.Message)"
      }
    }
    if($script:BackupPath -and (Test-Path $script:BackupPath) -and -not (Test-Path $InstallDir)){
      try {
        Jv-Warn "Stelle vorherige Installation wieder her: $script:BackupPath"
        Move-Item -Path $script:BackupPath -Destination $InstallDir -Force
      } catch {
        Jv-Warn "Backup Restore fehlgeschlagen: $($_.Exception.Message)"
      }
    }
  }
  exit 1
}

function Install-WingetPackage {
  param([string]$Name, [string]$Id, [string]$CheckCmd)
  Refresh-EnvPath
  if($CheckCmd -eq "python"){
    try { Get-PythonLauncher | Out-Null; Jv-Ok "$Name vorhanden"; return } catch { Jv-Warn "$Name fehlt oder ist zu alt" }
  } elseif($CheckCmd -eq "node"){
    try { Get-NpmCmd | Out-Null; if(Test-Cmd "node"){ Jv-Ok "$Name vorhanden"; return } } catch {}
  } elseif(Test-Cmd $CheckCmd) {
    Jv-Ok "$Name vorhanden"; return
  }

  if(-not (Test-Cmd "winget")){ Jv-Fail "winget wurde nicht gefunden. Bitte Windows App Installer installieren." }

  $args = @("install","-e","--id",$Id,"--accept-package-agreements","--accept-source-agreements")
  if(-not (Test-IsAdmin)){
    # User-Scope vermeidet UAC und passt zur Installation unter LOCALAPPDATA.
    $args += @("--scope","user")
  }
  Jv-Warn "$Name fehlt. Installation über winget: $Id"
  Invoke-Checked "Installiere $Name ueber winget" "winget" $args -LogPath $script:LogFile
  Refresh-EnvPath
}

function Backup-ExistingInstall {
  if(-not (Test-Path $InstallDir)){ return }
  if($NoCleanBackup){
    Jv-Warn "Entferne vorhandene Installation wegen -NoCleanBackup"
    Remove-Item -Path $InstallDir -Recurse -Force
    return
  }
  $parent = Split-Path -Parent $InstallDir
  $leaf = Split-Path -Leaf $InstallDir
  $backup = Join-Path $parent ("$leaf.backup." + (Get-Date -Format "yyyyMMdd_HHmmss"))
  Jv-Info "Sichere vorhandene Installation nach $backup"
  Move-Item -Path $InstallDir -Destination $backup -Force
  $script:BackupPath = $backup
}

function Copy-PackageToInstallDir {
  New-Item -ItemType Directory -Force -Path $InstallDir | Out-Null
  $exclude = @("node_modules",".venv","__pycache__",".git",".pytest_cache","logs","backups","exports","updates")
  Get-ChildItem -Path $SourceRoot -Force | ForEach-Object {
    if($exclude -contains $_.Name){ return }
    Copy-Item -Path $_.FullName -Destination (Join-Path $InstallDir $_.Name) -Recurse -Force
  }
  $script:CopiedToTarget = $true
}

function Invoke-OllamaPullWithTimeout {
  param([string]$Model="qwen3:8b", [int]$TimeoutMinutes=10)
  if($SkipModel){ Jv-Warn "Modell Download übersprungen"; return }
  if(-not (Test-Cmd "ollama")){ Jv-Warn "Ollama CLI nicht gefunden. Modell Download übersprungen."; return }
  if(-not (Test-Port 11434)){ Jv-Warn "Ollama Port 11434 nicht erreichbar. Modell Download übersprungen."; return }
  $list = Invoke-Capture -Command "ollama" -Arguments @("list") -TimeoutSeconds 20
  if($list.Output -match [regex]::Escape($Model)){ Jv-Ok "Modell vorhanden: $Model"; return }
  Jv-Warn "Lade Modell $Model mit Timeout $TimeoutMinutes Minuten"
  $job = Start-Job -ScriptBlock { param($m) & ollama pull $m; return $LASTEXITCODE } -ArgumentList $Model
  $done = Wait-Job $job -Timeout ($TimeoutMinutes * 60)
  if(-not $done){
    Stop-Job $job -Force | Out-Null
    Remove-Job $job -Force | Out-Null
    Jv-Warn "Ollama Pull Timeout. Installation läuft weiter."
    return
  }
  $result = Receive-Job $job
  Remove-Job $job -Force | Out-Null
  if($result -ne 0){ Jv-Warn "Ollama Pull ExitCode $result. Installation läuft weiter."; return }
  Jv-Ok "Modell geladen: $Model"
}

function Create-Shortcuts {
  if($NoShortcuts){ Jv-Warn "Shortcuts übersprungen"; return }
  $startBat = Join-Path $InstallDir "START_JARVIS.bat"
  if(-not (Test-Path $startBat)){ Jv-Warn "START_JARVIS.bat fehlt"; return }
  $desktop = [Environment]::GetFolderPath("Desktop")
  $lnk = Join-Path $desktop "JARVIS starten.lnk"
  $shell = New-Object -ComObject WScript.Shell
  $shortcut = $shell.CreateShortcut($lnk)
  $shortcut.TargetPath = $startBat
  $shortcut.WorkingDirectory = $InstallDir
  $shortcut.IconLocation = "$env:SystemRoot\System32\SHELL32.dll,13"
  $shortcut.Save()
  Jv-Ok "Desktop Shortcut erstellt"
}

function Test-Installation {
  $backend = Join-Path $InstallDir "backend"
  $venv = Join-Path $backend ".venv\Scripts\python.exe"
  $index = Join-Path $InstallDir "frontend\dist\index.html"

  if(-not (Test-Path $venv)){ Jv-Fail "Selbstprüfung fehlgeschlagen: venv Python fehlt" }
  $py = Invoke-Capture -Command $venv -Arguments @("--version") -TimeoutSeconds 10
  if(-not $py.Ok){ Jv-Fail "Selbstprüfung fehlgeschlagen: venv Python antwortet nicht" }
  Jv-Ok "venv Python antwortet: $($py.Output)"

  if(-not (Test-Path $index)){ Jv-Fail "Selbstprüfung fehlgeschlagen: frontend\dist\index.html fehlt" }
  Jv-Ok "Frontend index.html vorhanden"

  if(-not (Test-Port 8000)){
    Jv-Info "Starte Backend für Selbstprüfung"
    Start-Process -FilePath "cmd.exe" -ArgumentList "/k cd /d `"$backend`" && `"$venv`" main.py" -WindowStyle Minimized
    if(-not (Wait-Port 8000 20)){ Jv-Fail "Backend Port 8000 wurde nicht erreichbar" }
  }
  Jv-Ok "Backend erreichbar auf Port 8000"
}

Write-Host ""
Write-Host "JARVIS Windows Standalone Installer" -ForegroundColor Cyan
Write-Host "Ziel: $InstallDir" -ForegroundColor DarkGray
Write-Host "Quelle: $SourceRoot" -ForegroundColor DarkGray

Jv-Step "Prüfe PowerShell und Rechte"
if($PSVersionTable.PSVersion.Major -lt 5){ Jv-Fail "PowerShell 5 oder neuer wird benötigt." }
if(Test-IsAdmin){ Jv-Ok "Installer läuft als Administrator" } else { Jv-Warn "Installer läuft ohne Administratorrechte. winget nutzt User-Scope." }

Jv-Step "Prüfe Laufzeitabhängigkeiten"
Install-WingetPackage -Name "Python 3.10+" -Id "Python.Python.3.12" -CheckCmd "python"
Install-WingetPackage -Name "Node.js LTS" -Id "OpenJS.NodeJS.LTS" -CheckCmd "node"
if(-not $SkipModel){ Install-WingetPackage -Name "Ollama" -Id "Ollama.Ollama" -CheckCmd "ollama" } else { Jv-Warn "Ollama Installation wegen -SkipModel nicht erzwungen" }

Jv-Step "Ermittle Python und npm"
$pyLauncher = @(Get-PythonLauncher)
$npm = Get-NpmCmd
Jv-Ok "Python Launcher: $($pyLauncher -join ' ')"
Jv-Ok "npm: $npm"

Jv-Step "Sichere vorhandene Installation"
Backup-ExistingInstall

Jv-Step "Kopiere Paketdateien"
Copy-PackageToInstallDir
Jv-Ok "Paket nach $InstallDir kopiert"

Jv-Step "Baue lokale Umgebung"
$setup = Join-Path $InstallDir "FIRST_SETUP.ps1"
if(-not (Test-Path $setup)){ Jv-Fail "FIRST_SETUP.ps1 fehlt im Installationsordner" }
& powershell -NoProfile -ExecutionPolicy Bypass -File $setup
if($LASTEXITCODE -ne 0){ Jv-Fail "FIRST_SETUP.ps1 fehlgeschlagen. ExitCode: $LASTEXITCODE" }

Jv-Step "Prüfe Ollama optional"
if(Test-Cmd "ollama"){
  if(-not (Test-Port 11434)){
    Jv-Info "Starte Ollama Server"
    Start-Process -FilePath "ollama" -ArgumentList "serve" -WindowStyle Minimized
    Wait-Port 11434 8 | Out-Null
  }
  if(Test-Port 11434){ Invoke-OllamaPullWithTimeout -Model "qwen3:8b" -TimeoutMinutes 10 } else { Jv-Warn "Ollama nicht erreichbar" }
} else {
  Jv-Warn "Ollama nicht gefunden"
}

Jv-Step "Erstelle Shortcuts"
Create-Shortcuts

Jv-Step "Speichere Installationsstatus"
$dataDir = Join-Path $InstallDir "data"
New-Item -ItemType Directory -Force -Path $dataDir | Out-Null
@{
  app="JARVIS Windows Standalone"
  installed_at=(Get-Date).ToString("s")
  install_dir=$InstallDir
  source_root=$SourceRoot
  python_launcher=($pyLauncher -join " ")
  npm=$npm
  admin=[bool](Test-IsAdmin)
} | ConvertTo-Json -Depth 8 | Set-Content -Path (Join-Path $dataDir "install_state.json") -Encoding UTF8
Jv-Ok "Installationsstatus gespeichert"

Jv-Step "Selbstprüfung"
Test-Installation

Jv-Step "Abschluss"
$script:InstallSucceeded = $true
Write-Host ""
Write-Host "Installation erfolgreich" -ForegroundColor Green
Write-Host "Start: $InstallDir\START_JARVIS.bat" -ForegroundColor Cyan
Write-Host "Log:   $script:LogFile" -ForegroundColor DarkGray
Write-Host ""
