"""Smoke tests for the rich-styled JARVIS CLIs."""

from __future__ import annotations

from typer.testing import CliRunner

from jarvis import __version__
from jarvis.__main__ import app as main_app
from jarvis.diagcenter.cli import app as diag_app

runner = CliRunner()


# ----- jarvis ----------------------------------------------------------------


def test_jarvis_no_args_renders_banner() -> None:
    result = runner.invoke(main_app, [])
    assert result.exit_code == 0
    assert "JARVIS" in result.output or "J A R V I S" in result.output


def test_jarvis_version_command() -> None:
    result = runner.invoke(main_app, ["version"])
    assert result.exit_code == 0
    assert __version__ in result.output


def test_jarvis_status_runs() -> None:
    result = runner.invoke(main_app, ["status"])
    assert result.exit_code == 0
    assert "Python runtime" in result.output
    assert "Backend :8000" in result.output


def test_jarvis_banner_command() -> None:
    result = runner.invoke(main_app, ["banner"])
    assert result.exit_code == 0
    assert "Local-First" in result.output


# ----- jarvis-diagnose -------------------------------------------------------


def test_diagnose_smoke_quiet_exits_zero_or_warn() -> None:
    """Smoke check should not crash; warnings are allowed but no Python errors."""
    result = runner.invoke(diag_app, ["smoke", "--quiet"])
    # In any sane local checkout we expect 0 (warnings still exit 0,
    # only outright failures exit 1).
    assert result.exit_code in (0, 1)
    assert result.exception is None or isinstance(result.exception, SystemExit)


def test_diagnose_smoke_full_renders_summary() -> None:
    result = runner.invoke(diag_app, ["smoke"])
    assert result.exit_code in (0, 1)
    assert "Python runtime" in result.output
    assert "Voice" in result.output
