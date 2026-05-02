"""DiagCenter CLI · local smoke checks with a HUD-style report."""

from __future__ import annotations

import platform
import shutil
import socket
import time
from collections.abc import Callable
from dataclasses import dataclass
from pathlib import Path

import typer
from rich.panel import Panel
from rich.progress import (
    BarColumn,
    Progress,
    SpinnerColumn,
    TextColumn,
    TimeElapsedColumn,
)
from rich.table import Table
from rich.text import Text

from jarvis import __version__
from jarvis._ui import (
    GLYPH_ERR,
    GLYPH_OK,
    GLYPH_WARN,
    console,
    print_banner,
    print_subline,
)

app = typer.Typer(
    add_completion=False,
    help="JARVIS DiagCenter · local diagnostics",
    rich_markup_mode="rich",
)


@app.callback()
def _root() -> None:
    """Local diagnostics for JARVIS Windows Standalone."""
    # Presence of this callback forces Typer to treat commands as subcommands,
    # so `jarvis-diagnose smoke` keeps working even with a single command.


@dataclass
class CheckResult:
    name: str
    status: str  # "ok" | "warn" | "fail"
    detail: str


def _port_open(host: str, port: int, timeout: float = 0.4) -> bool:
    try:
        with socket.create_connection((host, port), timeout=timeout):
            return True
    except OSError:
        return False


# ---------------------------------------------------------------------------
# Individual checks. Each returns a CheckResult.
# ---------------------------------------------------------------------------


def _check_python() -> CheckResult:
    return CheckResult(
        "Python runtime",
        "ok",
        f"{platform.python_version()}",
    )


def _check_platform() -> CheckResult:
    if platform.system() == "Windows":
        return CheckResult("Platform", "ok", f"Windows {platform.release()}")
    return CheckResult(
        "Platform",
        "warn",
        f"{platform.system()} {platform.release()} (target is Windows)",
    )


def _check_node() -> CheckResult:
    node = shutil.which("node")
    if node is None:
        return CheckResult("Node runtime", "warn", "node not on PATH (frontend build skipped)")
    return CheckResult("Node runtime", "ok", node)


def _check_powershell() -> CheckResult:
    ps = shutil.which("pwsh") or shutil.which("powershell")
    if ps is None:
        return CheckResult("PowerShell", "warn", "no shell on PATH")
    return CheckResult("PowerShell", "ok", ps)


def _check_backend() -> CheckResult:
    if _port_open("127.0.0.1", 8000):
        return CheckResult("Backend :8000", "ok", "FastAPI reachable")
    return CheckResult(
        "Backend :8000",
        "warn",
        "not running (start with `jarvis-api`)",
    )


def _check_paths() -> CheckResult:
    cwd = Path.cwd()
    required = [
        "pyproject.toml",
        "README.md",
        "docs/index.html",
        "frontend",
    ]
    missing = [p for p in required if not (cwd / p).exists()]
    if not missing:
        return CheckResult("Repo layout", "ok", "all expected paths present")
    if "pyproject.toml" in missing:
        return CheckResult("Repo layout", "fail", "not inside the repo root")
    return CheckResult(
        "Repo layout",
        "warn",
        "missing: " + ", ".join(missing),
    )


def _check_voice_default() -> CheckResult:
    return CheckResult(
        "Voice / mic policy",
        "ok",
        "mic OFF by design · push-to-talk only",
    )


CHECKS: list[tuple[str, Callable[[], CheckResult]]] = [
    ("Python runtime", _check_python),
    ("Platform", _check_platform),
    ("Node runtime", _check_node),
    ("PowerShell", _check_powershell),
    ("Backend :8000", _check_backend),
    ("Repo layout", _check_paths),
    ("Voice policy", _check_voice_default),
]


# ---------------------------------------------------------------------------
# Rendering
# ---------------------------------------------------------------------------


def _glyph(status: str) -> str:
    return {"ok": GLYPH_OK, "warn": GLYPH_WARN, "fail": GLYPH_ERR}.get(status, GLYPH_WARN)


def _render_summary(results: list[CheckResult]) -> None:
    table = Table(
        show_header=True,
        header_style="j.hdr",
        border_style="j.dim",
        padding=(0, 1),
    )
    table.add_column("", width=3, justify="center")
    table.add_column("Check", style="j.text", min_width=22)
    table.add_column("Detail", style="j.muted")

    for r in results:
        table.add_row(_glyph(r.status), r.name, r.detail)

    console.print(table)

    ok = sum(1 for r in results if r.status == "ok")
    warn = sum(1 for r in results if r.status == "warn")
    fail = sum(1 for r in results if r.status == "fail")

    if fail:
        verdict_style = "j.err"
        verdict = f"{fail} FAILED · {warn} warn · {ok} ok"
    elif warn:
        verdict_style = "j.warn"
        verdict = f"OPERATIONAL with {warn} warning(s) · {ok} ok"
    else:
        verdict_style = "j.ok"
        verdict = f"ALL SYSTEMS GREEN · {ok} ok"

    console.print()
    console.print(
        Panel.fit(
            Text.from_markup(f"[{verdict_style}]{verdict}[/]"),
            border_style=verdict_style,
            padding=(0, 4),
        )
    )
    console.print()


@app.command("smoke")
def smoke(
    quiet: bool = typer.Option(False, "--quiet", "-q", help="Skip banner and progress UI."),
) -> None:
    """Run the local smoke check sweep with progress and a HUD report."""
    if not quiet:
        print_banner()
        print_subline(__version__)
        console.print("   [j.label]running diagnostic sweep ...[/]\n")

    results: list[CheckResult] = []

    if quiet:
        for _, fn in CHECKS:
            results.append(fn())
    else:
        with Progress(
            SpinnerColumn(style="j.cyan"),
            TextColumn("[j.text]{task.description}", justify="left"),
            BarColumn(complete_style="j.cyan", finished_style="j.green"),
            TextColumn("[j.muted]{task.completed}/{task.total}"),
            TimeElapsedColumn(),
            console=console,
            transient=True,
        ) as progress:
            task = progress.add_task("Probing subsystems", total=len(CHECKS))
            for label, fn in CHECKS:
                progress.update(task, description=f"› {label}")
                # Tiny pause so the user can actually see the spinner.
                time.sleep(0.12)
                results.append(fn())
                progress.advance(task)

    if not quiet:
        _render_summary(results)

    if any(r.status == "fail" for r in results):
        raise typer.Exit(code=1)


def main() -> None:
    """Start the DiagCenter CLI."""
    app()


if __name__ == "__main__":
    main()
