param(
  [switch]$DevFrontend,
  [switch]$NoBrowser,
  [switch]$SkipUpdate
)

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$Backend = Join-Path $Root "backend"
$Frontend = Join-Path $Root "frontend"
$FrontendBuildMarker = Join-Path $Frontend "dist\.jarvis-build-commit"
$script:Logs = Join-Path $Root "logs"
New-Item -ItemType Directory -Force -Path $script:Logs | Out-Null
$script:LogFile = Join-Path $script:Logs "start.log"


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
function Jv-Step { param([string]$Message) Write-JvLine "STEP" $Message "Cyan" }
function Jv-Fail { param([string]$Message) Write-JvLine "ERROR" $Message "Red"; throw $Message }

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
  try {
    $c = New-Object Net.Sockets.TcpClient
    $iar = $c.BeginConnect("127.0.0.1", $Port, $null, $null)
    $ok = $iar.AsyncWaitHandle.WaitOne(500, $false)
    if($ok){ $c.EndConnect($iar) }
    $c.Close()
    return $ok
  } catch { return $false }
}

function Wait-Port {
  param([int]$Port, [int]$Seconds)
  for($i=0; $i -lt ($Seconds * 2); $i++){
    if(Test-Port $Port){ return $true }
    Start-Sleep -Milliseconds 500
  }
  return $false
}

function Test-BackendHealth {
  param([string]$Url = "http://127.0.0.1:8000/health")
  try {
    $result = Invoke-RestMethod -Uri $Url -Method Get -TimeoutSec 3
    return @{ Ok=$true; Data=$result; Error="" }
  } catch {
    return @{ Ok=$false; Data=$null; Error=$_.Exception.Message }
  }
}

function Wait-BackendHealth {
  param([int]$Seconds = 20)
  for($i=0; $i -lt ($Seconds * 2); $i++){
    $health = Test-BackendHealth
    if($health.Ok){ return $health }
    Start-Sleep -Milliseconds 500
  }
  return Test-BackendHealth
}

function Invoke-Checked {
  param(
    [string]$Label,
    [string]$Command,
    [string[]]$Arguments,
    [string]$LogName,
    [string]$WorkingDirectory
  )
  Jv-Step $Label

  $logPath = Join-Path $script:Logs $LogName
  $argString = ConvertTo-ProcessArgumentString -Arguments $Arguments

  Add-Content -Path $logPath -Value "" -Encoding UTF8
  Add-Content -Path $logPath -Value ("[{0}] {1}" -f (Get-Date -Format "yyyy-MM-dd HH:mm:ss"), $Label) -Encoding UTF8
  Add-Content -Path $logPath -Value ("COMMAND: {0} {1}" -f $Command, $argString) -Encoding UTF8

  $psi = New-Object System.Diagnostics.ProcessStartInfo
  $psi.FileName = $Command
  $psi.Arguments = $argString
  $psi.WorkingDirectory = $WorkingDirectory
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
    Add-Content -Path $logPath -Value $stdout -Encoding UTF8
  }

  if($stderr){
    # npm und pip schreiben Hinweise teils auf STDERR. Das ist nur kritisch, wenn der ExitCode ungleich 0 ist.
    Write-Host $stderr -ForegroundColor DarkYellow
    Add-Content -Path $logPath -Value $stderr -Encoding UTF8
  }

  if($p.ExitCode -ne 0){
    Jv-Fail "$Label fehlgeschlagen. ExitCode: $($p.ExitCode). Siehe logs\$LogName"
  }

  Jv-Ok "$Label abgeschlossen"
}

function Get-LatestFrontendSourceTime {
  $candidates = @(
    (Join-Path $Frontend "package.json"),
    (Join-Path $Frontend "package-lock.json"),
    (Join-Path $Frontend "index.html"),
    (Join-Path $Frontend "src")
  )

  $latest = [datetime]::MinValue
  foreach($candidate in $candidates){
    if(-not (Test-Path $candidate)){ continue }
    $item = Get-Item $candidate
    if($item.PSIsContainer){
      $files = Get-ChildItem -Path $candidate -Recurse -File -ErrorAction SilentlyContinue
      foreach($file in $files){
        if($file.LastWriteTimeUtc -gt $latest){ $latest = $file.LastWriteTimeUtc }
      }
    } elseif($item.LastWriteTimeUtc -gt $latest) {
      $latest = $item.LastWriteTimeUtc
    }
  }
  return $latest
}

function Ensure-FrontendBuildFresh {
  if($DevFrontend){ return }
  if(-not (Test-Path $DistIndex)){ return }

  $currentCommit = ""
  try {
    $currentCommit = (& git -C $Root rev-parse HEAD 2>$null).Trim()
  } catch {}

  $builtCommit = ""
  if(Test-Path $FrontendBuildMarker){
    try { $builtCommit = (Get-Content $FrontendBuildMarker -Raw -ErrorAction Stop).Trim() } catch {}
  }

  if($currentCommit -and $builtCommit -ne $currentCommit){
    Jv-Warn "Frontend Build passt nicht zum aktuellen Git Stand. Baue Frontend neu."
    $npm = Get-NpmCmd
    Invoke-Checked "Frontend neu bauen" $npm @("run", "build") "frontend-build.log" $Frontend
    Set-Content -Path $FrontendBuildMarker -Value $currentCommit -Encoding UTF8
    return
  }

  $latestSource = Get-LatestFrontendSourceTime
  if($latestSource -eq [datetime]::MinValue){ return }

  $distTime = (Get-Item $DistIndex).LastWriteTimeUtc
  if($latestSource -le $distTime.AddSeconds(2)){ return }

  Jv-Warn "Frontend Quellen sind neuer als der Production Build. Baue Frontend neu."
  $npm = Get-NpmCmd
  Invoke-Checked "Frontend neu bauen" $npm @("run", "build") "frontend-build.log" $Frontend
  if($currentCommit){ Set-Content -Path $FrontendBuildMarker -Value $currentCommit -Encoding UTF8 }
}


function Invoke-AutoUpdate {
  param([string]$RepoRoot)

  if($SkipUpdate){
    Jv-Info "Auto-Update uebersprungen (-SkipUpdate)."
    return $false
  }
  $envSkip = [Environment]::GetEnvironmentVariable("JARVIS_SKIP_UPDATE", "Process")
  if([string]::IsNullOrWhiteSpace($envSkip)){ $envSkip = [Environment]::GetEnvironmentVariable("JARVIS_SKIP_UPDATE", "User") }
  if($envSkip -and $envSkip -ne "0"){
    Jv-Info "Auto-Update uebersprungen (JARVIS_SKIP_UPDATE=$envSkip)."
    return $false
  }

  $checker = Join-Path $RepoRoot "scripts\maintenance\CHECK_GITHUB_UPDATE.ps1"
  if(-not (Test-Path $checker)){
    Jv-Warn "Update-Checker nicht gefunden: $checker"
    return $false
  }

  $required = "JARVIS_GITHUB_OWNER","JARVIS_GITHUB_REPO","JARVIS_GITHUB_TOKEN"
  foreach($name in $required){
    $v = [Environment]::GetEnvironmentVariable($name, "Process")
    if([string]::IsNullOrWhiteSpace($v)){ $v = [Environment]::GetEnvironmentVariable($name, "User") }
    if([string]::IsNullOrWhiteSpace($v)){
      Jv-Warn "Auto-Update uebersprungen ($name nicht gesetzt). Setze JARVIS_GITHUB_OWNER, JARVIS_GITHUB_REPO und JARVIS_GITHUB_TOKEN als User-Env, um Auto-Update zu aktivieren."
      return $false
    }
  }

  $manifestPath = Join-Path $RepoRoot "data\update_manifest.json"
  $beforeStaged = ""
  if(Test-Path $manifestPath){
    try { $beforeStaged = (Get-Content -Raw -Path $manifestPath | ConvertFrom-Json).release } catch {}
  }

  Jv-Step "Pruefe auf neue JARVIS Version"
  try {
    & powershell -NoProfile -ExecutionPolicy Bypass -File $checker -Apply -SkipIfSameVersion -Root $RepoRoot
    if($LASTEXITCODE -ne 0){
      Jv-Warn "Update-Check ExitCode $LASTEXITCODE. Starte trotzdem mit aktueller Version."
      return $false
    }
  } catch {
    Jv-Warn "Update-Check fehlgeschlagen: $($_.Exception.Message). Starte trotzdem mit aktueller Version."
    return $false
  }

  $afterStaged = ""
  if(Test-Path $manifestPath){
    try { $afterStaged = (Get-Content -Raw -Path $manifestPath | ConvertFrom-Json).release } catch {}
  }

  if($afterStaged -and $afterStaged -ne $beforeStaged){
    Jv-Ok "Update auf $afterStaged installiert. Bitte START_JARVIS.bat erneut starten."
    return $true
  }

  Jv-Info "Keine neue Version oder Update-Check uebersprungen."
  return $false
}

if(Invoke-AutoUpdate -RepoRoot $Root){
  exit 0
}

Jv-Step "JARVIS Start beginnt"
Jv-Info "Root: $Root"

$VenvPython = Join-Path $Backend ".venv\Scripts\python.exe"
$DistIndex = Join-Path $Frontend "dist\index.html"

if(-not (Test-Path $VenvPython) -or (-not $DevFrontend -and -not (Test-Path $DistIndex))){
  Jv-Warn "Setup fehlt oder Frontend Build fehlt. Starte FIRST_SETUP.ps1"
  & powershell -NoProfile -ExecutionPolicy Bypass -File (Join-Path $Root "FIRST_SETUP.ps1")
  if($LASTEXITCODE -ne 0){ Jv-Fail "FIRST_SETUP.ps1 fehlgeschlagen. ExitCode: $LASTEXITCODE" }
}

if(-not (Test-Path $VenvPython)){ Jv-Fail "Python venv fehlt nach Setup" }

Ensure-FrontendBuildFresh

if(Test-Cmd "ollama"){
  if(-not (Test-Port 11434)){
    Jv-Step "Starte Ollama"
    Start-Process -FilePath "ollama" -ArgumentList "serve" -WindowStyle Minimized
    Wait-Port 11434 8 | Out-Null
  }
  if(Test-Port 11434){ Jv-Ok "Ollama Port 11434 erreichbar" } else { Jv-Warn "Ollama Port 11434 nicht erreichbar" }
} else {
  Jv-Warn "Ollama CLI nicht gefunden. Backend startet trotzdem."
}

if(-not (Test-Port 8000)){
  Jv-Step "Starte Backend auf Port 8000"
  Start-Process -FilePath "cmd.exe" -ArgumentList "/k cd /d `"$Backend`" && `"$VenvPython`" -m uvicorn main:app --host 127.0.0.1 --port 8000" -WindowStyle Normal
  if(-not (Wait-Port 8000 20)){ Jv-Fail "Backend Port 8000 wurde nicht erreichbar" }
}
Jv-Ok "Backend Port erreichbar: http://127.0.0.1:8000"

$health = Wait-BackendHealth -Seconds 20
if(-not $health.Ok){
  Jv-Fail "Backend /health antwortet nicht sauber: $($health.Error)"
}
$healthStatus = "ok"
try {
  if($health.Data.status){ $healthStatus = [string]$health.Data.status }
  elseif($health.Data.ok){ $healthStatus = "ok" }
} catch {}
Jv-Ok "Backend Health OK: $healthStatus"

if($DevFrontend){
  $npm = Get-NpmCmd
  if(-not (Test-Port 5173)){
    Jv-Step "Starte Frontend DEV auf Port 5173"
    Start-Process -FilePath "cmd.exe" -ArgumentList "/k cd /d `"$Frontend`" && `"$npm`" run dev" -WindowStyle Normal
    if(-not (Wait-Port 5173 20)){ Jv-Fail "Frontend Port 5173 wurde nicht erreichbar" }
  }
  $url = "http://127.0.0.1:5173"
} else {
  $url = "http://127.0.0.1:8000"
}

Jv-Ok "JARVIS bereit: $url"
if(-not $NoBrowser){ Start-Process $url }
