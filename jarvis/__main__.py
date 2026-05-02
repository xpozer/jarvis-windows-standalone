"""CLI entrypoint for JARVIS Windows Standalone."""

from __future__ import annotations

import platform
import socket
import sys
from pathlib import Path

import typer
from rich.panel import Panel
from rich.table import Table
from rich.text import Text

from jarvis import __version__
from jarvis._ui import (
    GLYPH_DOT,
    GLYPH_OK,
    GLYPH_WARN,
    console,
    print_banner,
    print_subline,
)

app = typer.Typer(
    add_completion=False,
    help="JARVIS Windows Standalone · Local-First Operator Console",
    no_args_is_help=False,
    rich_markup_mode="rich",
)


@app.callback(invoke_without_command=True)
def main(ctx: typer.Context) -> None:
    """Render the banner when no subcommand is given."""
    if ctx.invoked_subcommand is None:
        print_banner()
        print_subline(__version__)
        console.print(
            "   [j.muted]Available:[/] "
            "[j.cyan]version[/]  [j.cyan]status[/]  [j.cyan]banner[/]   "
            "[j.dim]· run with[/] [j.text]--help[/] [j.dim]for details[/]\n"
        )


@app.command("version")
def version() -> None:
    """Show the installed JARVIS version."""
    panel = Panel.fit(
        Text.from_markup(
            f"[j.cyan]J A R V I S[/]   [j.muted]·[/]   [j.text]B{__version__}[/]\n"
            f"[j.label]python[/]    [j.text]{platform.python_version()}[/]\n"
            f"[j.label]platform[/]  [j.text]{platform.system()} {platform.release()}[/]"
        ),
        border_style="j.cyan",
        padding=(1, 4),
    )
    console.print(panel)


def _port_open(host: str, port: int, timeout: float = 0.4) -> bool:
    try:
        with socket.create_connection((host, port), timeout=timeout):
            return True
    except OSError:
        return False


@app.command("status")
def status() -> None:
    """Local runtime status — package, runtime, ports, layout."""
    print_banner()
    print_subline(__version__)

    table = Table(
        show_header=True,
        header_style="j.hdr",
        border_style="j.dim",
        expand=False,
        padding=(0, 1),
    )
    table.add_column("", width=3, justify="center")
    table.add_column("Check", style="j.text", min_width=22)
    table.add_column("Detail", style="j.muted")

    # Package
    table.add_row(GLYPH_OK, "JARVIS package", f"B{__version__} · importable")

    # Python
    py_ok = sys.version_info >= (3, 11)
    table.add_row(
        GLYPH_OK if py_ok else GLYPH_WARN,
        "Python runtime",
        f"{platform.python_version()} ({sys.executable})",
    )

    # Platform
    is_windows = platform.system() == "Windows"
    table.add_row(
        GLYPH_OK if is_windows else GLYPH_WARN,
        "Operating system",
        f"{platform.system()} {platform.release()}",
    )

    # FastAPI backend reachable?
    api_up = _port_open("127.0.0.1", 8000)
    table.add_row(
        GLYPH_OK if api_up else GLYPH_WARN,
        "Backend :8000",
        "reachable" if api_up else "not running (start with [j.cyan]jarvis-api[/])",
    )

    # Repo layout markers
    cwd = Path.cwd()
    for label, rel in (
        ("Repo root", "pyproject.toml"),
        ("Frontend", "frontend"),
        ("Dashboard", "docs/index.html"),
    ):
        present = (cwd / rel).exists()
        table.add_row(
            GLYPH_OK if present else GLYPH_WARN,
            label,
            f"{rel} {'found' if present else 'not in cwd'}",
        )

    console.print(table)
    console.print()
    console.print(
        f"   {GLYPH_DOT} [j.label]hint[/] "
        "[j.muted]run[/] [j.cyan]jarvis-diagnose smoke[/] "
        "[j.muted]for the full diagnostic sweep[/]\n"
    )


@app.command("banner")
def banner() -> None:
    """Print the cyan boot banner only (useful for splash scripts)."""
    print_banner()
    print_subline(__version__)


if __name__ == "__main__":
    app()
