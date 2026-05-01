<#
.SYNOPSIS
Creates a private local LifeOS configuration from the safe example file.

.DESCRIPTION
This script copies config/lifeos.example.json to config/lifeos.json.
The private config/lifeos.json file is ignored by Git and must stay local.
The script will not overwrite an existing config/lifeos.json unless -Force is used.

.EXAMPLE
powershell -ExecutionPolicy Bypass -File scripts\maintenance\setup-lifeos-config.ps1

.EXAMPLE
powershell -ExecutionPolicy Bypass -File scripts\maintenance\setup-lifeos-config.ps1 -Force
#>

param(
    [switch]$Force
)

$ErrorActionPreference = "Stop"

$RepoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$ConfigDir = Join-Path $RepoRoot "config"
$ExampleFile = Join-Path $ConfigDir "lifeos.example.json"
$PrivateFile = Join-Path $ConfigDir "lifeos.json"

Write-Host "JARVIS LifeOS private config setup" -ForegroundColor Cyan
Write-Host "Repository: $RepoRoot"

if (-not (Test-Path $ExampleFile)) {
    Write-Error "Missing example file: $ExampleFile"
    exit 1
}

if (-not (Test-Path $ConfigDir)) {
    New-Item -ItemType Directory -Path $ConfigDir | Out-Null
}

if ((Test-Path $PrivateFile) -and (-not $Force)) {
    Write-Host "Private LifeOS config already exists:" -ForegroundColor Yellow
    Write-Host "  $PrivateFile"
    Write-Host "No file was overwritten. Use -Force if you really want to recreate it."
    exit 0
}

Copy-Item -Path $ExampleFile -Destination $PrivateFile -Force:$Force

Write-Host "Created private LifeOS config:" -ForegroundColor Green
Write-Host "  $PrivateFile"
Write-Host ""
Write-Host "Next step: edit config\lifeos.json with your own local values."
Write-Host "This file is ignored by Git and should not be committed."
