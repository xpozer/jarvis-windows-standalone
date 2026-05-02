from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


def test_github_update_launcher_exists_and_never_embeds_token():
    script = ROOT / "scripts" / "maintenance" / "CHECK_GITHUB_UPDATE.ps1"
    core_script = ROOT / "scripts" / "maintenance" / "CHECK_GITHUB_UPDATE.core.ps1"
    wrapper = ROOT / "scripts" / "maintenance" / "CHECK_GITHUB_UPDATE.bat"

    assert script.exists()
    assert core_script.exists()
    assert wrapper.exists()

    text = core_script.read_text(encoding="utf-8")
    wrapper_text = script.read_text(encoding="utf-8")
    assert "JARVIS_GITHUB_TOKEN" in text
    assert "github_pat_" not in text
    assert "Invoke-RestMethod" in text
    assert "Invoke-WebRequest" in text
    assert "PRODUCT_INSTALLER.ps1" in text
    assert "-Mode Update" in text
    assert "-KeepData" in text
    assert "scripts\\install\\PRODUCT_INSTALLER.ps1" in wrapper_text


def test_system_center_exposes_private_github_update_actions():
    text = (ROOT / "frontend" / "src" / "components" / "SystemCenterPage.tsx").read_text(
        encoding="utf-8"
    )

    assert "/update/github/check" in text
    assert "/update/github/stage" in text
    assert "GITHUB PRUEFEN" in text
    assert "GITHUB UPDATE STAGEN" in text
