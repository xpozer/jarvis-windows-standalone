# JARVIS Awareness - Context Capture
# Gibt JSON aus: aktive App, Fenstertitel, optional Screenshot-Pfad
# Wird zyklisch vom Backend aufgerufen

param(
    [switch]$WithScreenshot,
    [string]$ScreenshotDir = "$env:TEMP\jarvis_captures"
)

$ErrorActionPreference = "Stop"

try {
    Add-Type @"
    using System;
    using System.Runtime.InteropServices;
    using System.Text;
    public class WinAPI {
        [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
        [DllImport("user32.dll")] public static extern int GetWindowText(IntPtr hWnd, StringBuilder text, int count);
        [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint processId);
    }
"@

    $hwnd = [WinAPI]::GetForegroundWindow()
    $sb = New-Object System.Text.StringBuilder 512
    [void][WinAPI]::GetWindowText($hwnd, $sb, 512)
    $title = $sb.ToString()

    $pid = 0
    [void][WinAPI]::GetWindowThreadProcessId($hwnd, [ref]$pid)
    $proc = Get-Process -Id $pid -ErrorAction SilentlyContinue
    $appName = if ($proc) { $proc.ProcessName } else { "unknown" }
    $appPath = if ($proc -and $proc.Path) { $proc.Path } else { "" }

    # App-Kategorie bestimmen
    $category = "other"
    switch -Regex ($appName.ToLower()) {
        "saplogon|sapgui|saplgpad"  { $category = "sap" }
        "outlook|olk"               { $category = "email" }
        "excel|xlmain"              { $category = "spreadsheet" }
        "word|winword"              { $category = "document" }
        "chrome|firefox|edge|brave" { $category = "browser" }
        "code|devenv|rider"         { $category = "ide" }
        "explorer"                  { $category = "filesystem" }
        "acrobat|foxitreader|sumatrapdf" { $category = "pdf" }
        "teams|slack"               { $category = "chat" }
        "powershell|cmd|terminal|windowsterminal" { $category = "terminal" }
    }

    # Titel analysieren fuer Kontext-Hinweise
    $hints = @()
    if ($title -match "VDE|DIN|DGUV|TRBS") { $hints += "norm_reference" }
    if ($title -match "IW\d{2}|VA\d{2}|ME\d{2}|MM\d{2}|CO\d{2}") { $hints += "sap_transaction" }
    if ($title -match "\.pdf") { $hints += "pdf_open" }
    if ($title -match "Pruef|pruef|Inspect|Messung") { $hints += "inspection" }

    $screenshotPath = ""
    if ($WithScreenshot) {
        if (-not (Test-Path $ScreenshotDir)) { New-Item -ItemType Directory -Path $ScreenshotDir -Force | Out-Null }
        $screenshotPath = "$ScreenshotDir\capture_$(Get-Date -Format 'yyyyMMdd_HHmmss').png"
        Add-Type -AssemblyName System.Windows.Forms
        $bounds = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds
        $bmp = New-Object System.Drawing.Bitmap($bounds.Width, $bounds.Height)
        $gfx = [System.Drawing.Graphics]::FromImage($bmp)
        $gfx.CopyFromScreen($bounds.Location, [System.Drawing.Point]::Empty, $bounds.Size)
        $bmp.Save($screenshotPath)
        $gfx.Dispose(); $bmp.Dispose()
    }

    [PSCustomObject]@{
        timestamp     = (Get-Date -Format "yyyy-MM-dd HH:mm:ss")
        app           = $appName
        appPath       = $appPath
        windowTitle   = $title
        category      = $category
        hints         = $hints
        screenshotPath = $screenshotPath
    } | ConvertTo-Json -Compress

} catch {
    $msg = $_.Exception.Message -replace '"', "'"
    Write-Output "{`"error`":`"$msg`"}"
}
