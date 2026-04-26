# JARVIS EmailAgent - Outlook COM Delete/Move
# Nimmt eine JSON-Liste von EntryIDs und loescht oder verschiebt sie

param(
    [string]$EntryIdsJson,  # JSON-Array von EntryID strings
    [string]$Action = "trash"  # "trash" = Papierkorb, "delete" = permanent
)

$ErrorActionPreference = "Stop"

try {
    try {
        $outlook = [Runtime.InteropServices.Marshal]::GetActiveObject("Outlook.Application")
    } catch {
        Write-Output '{"error":"Outlook ist nicht geoeffnet."}'
        exit 1
    }

    $ns = $outlook.GetNamespace("MAPI")

    $entryIds = $EntryIdsJson | ConvertFrom-Json
    if (-not $entryIds) {
        Write-Output '{"error":"Keine EntryIDs angegeben."}'
        exit 1
    }

    $deleted  = @()
    $failed   = @()

    foreach ($id in $entryIds) {
        try {
            $mail = $ns.GetItemFromID($id)
            $subject = ""
            try { $subject = $mail.Subject } catch {}

            if ($Action -eq "delete") {
                # Permanent loeschen (DeletePermanently)
                $mail.Delete()
                $mail.Delete()  # zweimal noetig fuer permanent
            } else {
                # In Papierkorb verschieben (einmal Delete)
                $mail.Delete()
            }

            $deleted += $subject
        } catch {
            $failed += $id
        }
    }

    [PSCustomObject]@{
        deleted = $deleted
        failed  = $failed
        count   = $deleted.Count
    } | ConvertTo-Json -Compress

} catch {
    $msg = $_.Exception.Message -replace '"', "'"
    Write-Output "{`"error`":`"$msg`"}"
    exit 1
}
