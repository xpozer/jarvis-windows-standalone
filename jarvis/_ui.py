"""Shared rich console + theme for JARVIS CLI surfaces.

Single source of truth for colors, glyphs, and helpers like banner/panel/table
so `jarvis` and `jarvis-diagnose` stay visually consistent.
"""

from __future__ import annotations

from rich.console import Console
from rich.theme import Theme

# Mirror the palette used by docs/index.html (the HUD dashboard)
THEME = Theme(
    {
        "j.cyan":   "bold #00d4ff",
        "j.green":  "bold #00ff88",
        "j.amber":  "bold #ffb800",
        "j.red":    "bold #ff3b5c",
        "j.violet": "bold #b48cff",
        "j.dim":    "#5b6b82",
        "j.muted":  "#8aa1bd",
        "j.text":   "#e6f1ff",
        "j.label":  "italic #8aa1bd",
        "j.ok":     "bold #00ff88",
        "j.warn":   "bold #ffb800",
        "j.err":    "bold #ff3b5c",
        "j.hdr":    "bold #00d4ff on grey3",
    }
)

console = Console(theme=THEME, highlight=False)

GLYPH_OK = "[j.ok]✓[/]"
GLYPH_WARN = "[j.warn]⚠[/]"
GLYPH_ERR = "[j.err]✗[/]"
GLYPH_DOT = "[j.cyan]●[/]"


BANNER = r"""[j.cyan]
   ╔══════════════════════════════════════════════════════════════╗
   ║      [j.text]J A R V I S[/]   [j.muted]·[/]   [j.text]Windows Standalone[/]   [j.muted]·[/]   [j.amber]Local-First[/]      [j.cyan]║
   ╚══════════════════════════════════════════════════════════════╝
[/]"""


def print_banner() -> None:
    """Render the cyan-glow JARVIS boot banner."""
    console.print(BANNER)


def print_subline(version: str) -> None:
    """Single-line subtitle under the banner."""
    console.print(
        f"   [j.label]ver[/] [j.cyan]B{version}[/]   "
        f"[j.label]mode[/] [j.text]operator console[/]   "
        f"[j.label]telemetry[/] [j.green]off[/]   "
        f"[j.label]mic[/] [j.red]off[/]\n"
    )
