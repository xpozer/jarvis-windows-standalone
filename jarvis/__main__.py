"""CLI entrypoint for JARVIS Windows Standalone."""

from __future__ import annotations

import typer
from rich.console import Console

from jarvis import __version__

app = typer.Typer(add_completion=False, help="JARVIS Windows Standalone CLI")
console = Console()


@app.callback()
def main() -> None:
    """Startpunkt fuer lokale JARVIS Kommandos."""


@app.command("version")
def version() -> None:
    """Zeigt die aktuelle JARVIS Version."""
    console.print(f"JARVIS Windows Standalone B{__version__}")


@app.command("status")
def status() -> None:
    """Zeigt einen einfachen lokalen Status."""
    console.print("JARVIS backend package is installed and reachable.")


if __name__ == "__main__":
    app()
