# Ticket 1 Root Hygiene Migration Notes

Status: blocked before code movement.

## Finding

Several root PowerShell scripts are not safe to move by path alone because they derive the application root from `$PSScriptRoot` or `$MyInvocation.MyCommand.Path`.

Affected high impact files:

- `INSTALL_JARVIS.ps1`
- `FIRST_SETUP.ps1`
- `START_JARVIS.ps1`
- `REPAIR.ps1`
- `PRODUCT_INSTALLER.ps1`
- `CHECK_GITHUB_UPDATE.ps1`

## Why this blocks a blind move

A pure move into `scripts/install`, `scripts/maintenance` or `scripts/dev` changes `$PSScriptRoot` from the repository root to the script subfolder. That would break root-relative paths such as:

- `backend`
- `frontend`
- `logs`
- `FIRST_SETUP.ps1`
- `PRODUCT_INSTALLER.ps1`
- `JARVIS_INSTALL_CONFIG.json`

## Proposed maintainer decision

Please confirm which migration style should be used before moving files:

### Option A: Add explicit `-Root` / `-SourceRoot` parameters

Preferred for maintainability. Root `.bat` entrypoints pass `%~dp0` explicitly to the moved PowerShell scripts. Each moved script uses the supplied root path instead of assuming `$PSScriptRoot` is the repository root.

### Option B: Add shared script resolver

Create a small shared helper in `scripts/lib/resolve-root.ps1` and dot-source it from moved scripts. The helper walks upward until it finds repo markers such as `backend`, `frontend`, `config` and `README.md`.

### Option C: Keep operational `.ps1` files in root

This preserves behavior, but does not meet the root hygiene target because the root still contains operational PowerShell files.

## Recommendation

Use Option A for installer and start scripts, optionally combined with Option B later. This keeps Windows double-click `.bat` entrypoints simple and avoids hidden path magic.

## Duplicate notes already checked

- `REPAIR_JARVIS.bat` is only a thinner wrapper around `REPAIR.ps1`; `REPAIR.bat` has better user feedback and should be kept.
- `INSTALL_JARVIS.bat`, `START_JARVIS.bat`, `UPDATE_JARVIS.bat`, `UNINSTALL_JARVIS.bat`, `DIAGNOSE.bat` and `REPAIR.bat` are the correct visible root entrypoints.
- `.gitignore` already contains `.venv/`, `node_modules/`, `dist/`, `*.log` and local config protections for `*.local.json`, `*.secret.json` and `config/lifeos.json`.

## Manual test status

Not run in this environment. The repository cannot be cloned from the execution container because DNS resolution to `github.com` fails here, so this draft is limited to repository API inspection.
