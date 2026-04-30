"""DiagCenter CLI fuer einfache lokale Smoke Checks."""

from __future__ import annotations

from pathlib import Path

import typer
from rich.console import Console

app = typer.Typer(add_completion=False, help="JARVIS DiagCenter")
console = Console()


@app.command("smoke")
def smoke() -> None:
    """Prueft die wichtigsten lokalen Projektpfade."""
    repo_root = Path.cwd()
    checks = {
        "README.md": repo_root / "README.md",
        "frontend": repo_root / "frontend",
        "docs/index.html": repo_root / "docs" / "index.html",
        "pyproject.toml": repo_root / "pyproject.toml",
    }

    failed = False
    for label, path in checks.items():
        exists = path.exists()
        console.print(f"{label}: {'OK' if exists else 'MISSING'}")
        failed = failed or not exists

    if failed:
        raise typer.Exit(code=1)


def main() -> None:
    """Startet das DiagCenter CLI."""
    app()


if __name__ == "__main__":
    main()
