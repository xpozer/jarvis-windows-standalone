<#
.SYNOPSIS
Checks whether the local checkout is ready for a JARVIS Windows installation.

.DESCRIPTION
This script performs non destructive preflight checks for the Windows installer.
It does not install packages and does not modify the system. It is intended to catch common end user problems before running INSTALL_JARVIS.ps1.

.EXAMPLE
powershell -ExecutionPolicy Bypass -File scripts\maintenance\check-installer-readiness.ps1
#>

$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

$Root = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$Failures = New-Object System.Collections.Generic.List[string]
$Warnings = New-Object System.Collections.Generic.List[string]

function Write-Result {
    param(
        [string]$Label,
        [string]$Status,
        [string]$Message = ""
    )
    $color = "Gray"
    if ($Status -eq "OK") { $color = "Green" }
    elseif ($Status -eq "WARN") { $color = "Yellow" }
    elseif ($Status -eq "FAIL") { $color = "Red" }
    Write-Host ("[{0}] {1}" -f $Status, $Label) -ForegroundColor $color
    if ($Message) { Write-Host "      $Message" -ForegroundColor DarkGray }
}

function Add-Fail {
    param([string]$Label, [string]$Message)
    $Failures.Add("$Label - $Message") | Out-Null
    Write-Result $Label "FAIL" $Message
}

function Add-Warn {
    param([string]$Label, [string]$Message)
    $Warnings.Add("$Label - $Message") | Out-Null
    Write-Result $Label "WARN" $Message
}

function Add-Ok {
    param([string]$Label, [string]$Message = "")
    Write-Result $Label "OK" $Message
}

function Invoke-Capture {
    param(
        [string]$Command,
        [string[]]$Arguments = @(),
        [int]$TimeoutSeconds = 10
    )
    $psi = New-Object System.Diagnostics.ProcessStartInfo
    $psi.FileName = $Command
    $psi.Arguments = ($Arguments -join " ")
    $psi.RedirectStandardOutput = $true
    $psi.RedirectStandardError = $true
    $psi.UseShellExecute = $false
    $psi.CreateNoWindow = $true
    try {
        $p = [System.Diagnostics.Process]::Start($psi)
        if (-not $p.WaitForExit($TimeoutSeconds * 1000)) {
            try { $p.Kill() } catch {}
            return @{ Ok=$false; Output=""; Error="Timeout"; ExitCode=-1 }
        }
        return @{ Ok=($p.ExitCode -eq 0); Output=$p.StandardOutput.ReadToEnd().Trim(); Error=$p.StandardError.ReadToEnd().Trim(); ExitCode=$p.ExitCode }
    } catch {
        return @{ Ok=$false; Output=""; Error=$_.Exception.Message; ExitCode=-2 }
    }
}

function Test-Port {
    param([int]$Port)
    $client = $null
    try {
        $client = New-Object Net.Sockets.TcpClient
        $iar = $client.BeginConnect("127.0.0.1", $Port, $null, $null)
        $ok = $iar.AsyncWaitHandle.WaitOne(500, $false)
        if ($ok) { $client.EndConnect($iar) }
        return $ok
    } catch {
        return $false
    } finally {
        if ($client) { $client.Close() }
    }
}

function Parse-PythonVersion {
    param([string]$Text)
    if ($Text -match "Python\s+(\d+)\.(\d+)\.(\d+)") { return [version]"$($Matches[1]).$($Matches[2]).$($Matches[3])" }
    if ($Text -match "Python\s+(\d+)\.(\d+)") { return [version]"$($Matches[1]).$($Matches[2]).0" }
    return $null
}

function Test-Python {
    $candidates = @(
        @{ Command="py"; Args=@("-3") },
        @{ Command="python"; Args=@() },
        @{ Command="python3"; Args=@() }
    )
    foreach ($candidate in $candidates) {
        $cmd = Get-Command $candidate.Command -ErrorAction SilentlyContinue
        if (-not $cmd) { continue }
        if ($cmd.Source -match "WindowsApps") { continue }
        $result = Invoke-Capture $candidate.Command ($candidate.Args + @("--version"))
        $text = (($result.Output, $result.Error) -join " ").Trim()
        $version = Parse-PythonVersion $text
        if ($version -and $version.Major -eq 3 -and $version -ge [version]"3.10.0") {
            $real = Invoke-Capture $candidate.Command ($candidate.Args + @("-c", "import sys; print(sys.executable)"))
            if ($real.Output -notmatch "WindowsApps") {
                Add-Ok "Python 3.10+" "$text using $($real.Output)"
                return
            }
        }
    }
    Add-Fail "Python 3.10+" "No valid Python 3.10+ found. Store dummy paths are ignored."
}

Write-Host ""
Write-Host "JARVIS installer readiness check" -ForegroundColor Cyan
Write-Host "Root: $Root" -ForegroundColor DarkGray
Write-Host ""

if ($PSVersionTable.PSVersion.Major -ge 5) { Add-Ok "PowerShell" $PSVersionTable.PSVersion.ToString() } else { Add-Fail "PowerShell" "PowerShell 5 or newer is required." }

foreach ($file in @("INSTALL_JARVIS.ps1", "INSTALL_JARVIS.bat", "FIRST_SETUP.ps1", "START_JARVIS.ps1", "START_JARVIS.bat")) {
    $path = Join-Path $Root $file
    if (Test-Path $path) { Add-Ok "Required file $file" } else { Add-Fail "Required file $file" "Missing from repository root." }
}

foreach ($dir in @("backend", "frontend", "config")) {
    $path = Join-Path $Root $dir
    if (Test-Path $path) { Add-Ok "Required directory $dir" } else { Add-Fail "Required directory $dir" "Missing directory." }
}

Test-Python

$node = Get-Command "node" -ErrorAction SilentlyContinue
if ($node) {
    $version = Invoke-Capture "node" @("--version")
    Add-Ok "Node.js" $version.Output
} else {
    Add-Fail "Node.js" "node command not found. Install Node.js LTS."
}

$npm = Get-Command "npm.cmd" -ErrorAction SilentlyContinue
if (-not $npm) { $npm = Get-Command "npm" -ErrorAction SilentlyContinue }
if ($npm) {
    $version = Invoke-Capture $npm.Source @("--version")
    Add-Ok "npm" $version.Output
} else {
    Add-Fail "npm" "npm command not found. Install Node.js LTS."
}

$winget = Get-Command "winget" -ErrorAction SilentlyContinue
if ($winget) { Add-Ok "winget" $winget.Source } else { Add-Warn "winget" "Missing. Automatic dependency installation may not work." }

$ollama = Get-Command "ollama" -ErrorAction SilentlyContinue
if ($ollama) {
    Add-Ok "Ollama CLI" $ollama.Source
    if (Test-Port 11434) { Add-Ok "Ollama port 11434" "reachable" } else { Add-Warn "Ollama port 11434" "not reachable. Installer can continue, model pull may be skipped." }
} else {
    Add-Warn "Ollama CLI" "Missing. Installer can continue with -SkipModel or install Ollama first."
}

if (Test-Port 8000) { Add-Warn "Port 8000" "Already in use. START_JARVIS may attach to existing backend or conflict." } else { Add-Ok "Port 8000" "free" }
if (Test-Port 5173) { Add-Warn "Port 5173" "Already in use. Dev frontend may conflict." } else { Add-Ok "Port 5173" "free" }

$lifeosExample = Join-Path $Root "config\lifeos.example.json"
if (Test-Path $lifeosExample) { Add-Ok "LifeOS example config" } else { Add-Fail "LifeOS example config" "config/lifeos.example.json missing." }

$lifeosPrivate = Join-Path $Root "config\lifeos.json"
if (Test-Path $lifeosPrivate) { Add-Ok "LifeOS private config" "present and should stay local" } else { Add-Warn "LifeOS private config" "Missing. FIRST_SETUP.ps1 should create it from the example file." }

Write-Host ""
if ($Failures.Count -gt 0) {
    Write-Host "Readiness check failed" -ForegroundColor Red
    $Failures | ForEach-Object { Write-Host " - $_" -ForegroundColor Red }
    exit 1
}

if ($Warnings.Count -gt 0) {
    Write-Host "Readiness check completed with warnings" -ForegroundColor Yellow
    $Warnings | ForEach-Object { Write-Host " - $_" -ForegroundColor Yellow }
    exit 0
}

Write-Host "Readiness check passed" -ForegroundColor Green
exit 0
