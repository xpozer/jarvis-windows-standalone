# Private GitHub Updates

JARVIS can stage update ZIP files from a private GitHub Release. The token stays on the local machine and is only read from the environment.

Required environment variables:

```powershell
$env:JARVIS_GITHUB_OWNER = "your-github-owner"
$env:JARVIS_GITHUB_REPO = "your-private-repo"
$env:JARVIS_GITHUB_TOKEN = "your-fine-grained-read-token"
```

Optional variables:

```powershell
$env:JARVIS_GITHUB_RELEASE = "latest"
$env:JARVIS_GITHUB_PACKAGE_ASSET = "JARVIS_B6_5_PRODUCTION_INSTALLER_HOTFIX.zip"
```

Backend endpoints:

- `GET /update/github/config` shows whether private GitHub updates are configured, without exposing the token.
- `GET /update/github/check` checks the configured private release and selected ZIP asset.
- `POST /update/github/stage` downloads the ZIP asset into `updates/staging`, validates the JARVIS package shape, and writes `data/update_manifest.json`.
- `POST /update/plan` creates the update plan for `UPDATE_JARVIS.ps1`.

Do not store `JARVIS_GITHUB_TOKEN` in GitHub, config JSON, or frontend files.
