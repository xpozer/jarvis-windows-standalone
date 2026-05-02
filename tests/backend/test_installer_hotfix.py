from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


def test_install_jarvis_uses_processstartinfo_for_winget_logging():
    script = (ROOT / "scripts" / "install" / "INSTALL_JARVIS.core.ps1").read_text(encoding="utf-8")

    assert "function Invoke-NativeLogged" in script
    assert "& winget @args 2>&1 | Tee-Object" not in script
    assert (
        'Invoke-NativeLogged "Installiere $Name ueber winget" "winget" $args $script:LogFile'
        in script
    )
