# JARVIS EmailAgent - Outlook COM Scanner
# Gibt JSON aus: Absender, Betreff, Preview, EntryID
# EntryID wird später fuer delete/move gebraucht

param(
    [int]$MaxMails   = 50,   # Wie viele Mails aus Inbox scannen
    [string]$Folder  = "Inbox"
)

$ErrorActionPreference = "Stop"

try {
    # Outlook COM Objekt holen (muss offen sein)
    try {
        $outlook = [Runtime.InteropServices.Marshal]::GetActiveObject("Outlook.Application")
    } catch {
        Write-Output '{"error":"Outlook ist nicht geoeffnet. Bitte Outlook starten."}'
        exit 1
    }

    $ns      = $outlook.GetNamespace("MAPI")
    $inbox   = $ns.GetDefaultFolder(6)  # 6 = olFolderInbox

    $mails = @()
    $items = $inbox.Items
    $items.Sort("[ReceivedTime]", $true)  # neueste zuerst

    $count = 0
    foreach ($item in $items) {
        if ($count -ge $MaxMails) { break }
        if ($item.Class -ne 43) { continue }  # 43 = olMail

        # Preview: erste 200 Zeichen des Body
        $body = ""
        try {
            $raw = $item.Body
            if ($raw) {
                $body = $raw.Substring(0, [Math]::Min(200, $raw.Length)).Trim()
                $body = $body -replace "`r`n", " " -replace "`n", " " -replace '"', "'"
            }
        } catch {}

        $sender = ""
        try { $sender = $item.SenderEmailAddress } catch {}
        if (-not $sender) { try { $sender = $item.SenderName } catch {} }

        $subject = ""
        try { $subject = $item.Subject } catch {}
        if (-not $subject) { $subject = "(kein Betreff)" }

        $received = ""
        try { $received = $item.ReceivedTime.ToString("yyyy-MM-dd HH:mm") } catch {}

        $entryId = ""
        try { $entryId = $item.EntryID } catch {}

        $mails += [PSCustomObject]@{
            entryId  = $entryId
            sender   = $sender
            subject  = $subject
            received = $received
            preview  = $body
        }
        $count++
    }

    $result = [PSCustomObject]@{
        total  = $count
        folder = $inbox.Name
        mails  = $mails
    }

    $result | ConvertTo-Json -Depth 5 -Compress

} catch {
    $msg = $_.Exception.Message -replace '"', "'"
    Write-Output "{`"error`":`"$msg`"}"
    exit 1
}
