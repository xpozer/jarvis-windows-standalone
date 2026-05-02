"""Render the JARVIS social-preview / OG image as PNG.

Output: docs/assets/og-image.png  (1280x640, fits GitHub Social Preview limits)

Usage:
    python scripts/build_og_image.py

Requires only Pillow. Run after edits to keep docs/assets/og-image.png in sync.
"""

from __future__ import annotations

import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

# ---------------------------------------------------------------------------
# Palette (mirrors docs/index.html and jarvis/_ui.py)
# ---------------------------------------------------------------------------
BG_TOP    = (10, 14, 20)
BG_BOTTOM = (5, 8, 13)
CYAN      = (0, 212, 255)
CYAN_DIM  = (10, 124, 148)
GREEN     = (0, 255, 136)
AMBER     = (255, 184, 0)
RED       = (255, 59, 92)
TEXT      = (230, 241, 255)
MUTED     = (138, 161, 189)
DIM       = (91, 107, 130)
LINE      = (31, 41, 55)

W, H = 1280, 640

# ---------------------------------------------------------------------------
# Fonts — fall back gracefully if Windows fonts are not present.
# ---------------------------------------------------------------------------

def _font(candidates: list[str], size: int) -> ImageFont.FreeTypeFont:
    for path in candidates:
        try:
            return ImageFont.truetype(path, size)
        except OSError:
            continue
    return ImageFont.load_default()


WINDOWS_FONTS = "C:/Windows/Fonts"
F_TITLE = _font([f"{WINDOWS_FONTS}/segoeuib.ttf", f"{WINDOWS_FONTS}/arialbd.ttf"], 132)
F_SUB   = _font([f"{WINDOWS_FONTS}/consola.ttf", f"{WINDOWS_FONTS}/cour.ttf"], 22)
F_LBL   = _font([f"{WINDOWS_FONTS}/consola.ttf", f"{WINDOWS_FONTS}/cour.ttf"], 18)
F_PILL  = _font([f"{WINDOWS_FONTS}/consolab.ttf", f"{WINDOWS_FONTS}/courbd.ttf"], 18)

# ---------------------------------------------------------------------------
# Drawing helpers
# ---------------------------------------------------------------------------

def vertical_gradient(img: Image.Image, top: tuple[int, int, int], bottom: tuple[int, int, int]) -> None:
    px = img.load()
    w, h = img.size
    for y in range(h):
        t = y / max(h - 1, 1)
        r = int(top[0] + (bottom[0] - top[0]) * t)
        g = int(top[1] + (bottom[1] - top[1]) * t)
        b = int(top[2] + (bottom[2] - top[2]) * t)
        for x in range(w):
            px[x, y] = (r, g, b)


def grid_overlay(draw: ImageDraw.ImageDraw, color: tuple[int, int, int, int], step: int = 40) -> None:
    for x in range(0, W, step):
        draw.line([(x, 0), (x, H)], fill=color, width=1)
    for y in range(0, H, step):
        draw.line([(0, y), (W, y)], fill=color, width=1)


def soft_glow(img: Image.Image, center: tuple[int, int], radius: int, color: tuple[int, int, int]) -> None:
    glow = Image.new("RGBA", img.size, (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    cx, cy = center
    steps = 24
    for i in range(steps, 0, -1):
        a = int(60 * (i / steps) ** 2)
        r = int(radius * (i / steps))
        gd.ellipse((cx - r, cy - r, cx + r, cy + r), fill=(*color, a))
    img.alpha_composite(glow)


def corner_brackets(draw: ImageDraw.ImageDraw, color: tuple[int, int, int], pad: int = 28, size: int = 32, w: int = 2) -> None:
    # top-left
    draw.line([(pad, pad), (pad + size, pad)], fill=color, width=w)
    draw.line([(pad, pad), (pad, pad + size)], fill=color, width=w)
    # top-right
    draw.line([(W - pad, pad), (W - pad - size, pad)], fill=color, width=w)
    draw.line([(W - pad, pad), (W - pad, pad + size)], fill=color, width=w)
    # bottom-left
    draw.line([(pad, H - pad), (pad + size, H - pad)], fill=color, width=w)
    draw.line([(pad, H - pad), (pad, H - pad - size)], fill=color, width=w)
    # bottom-right
    draw.line([(W - pad, H - pad), (W - pad - size, H - pad)], fill=color, width=w)
    draw.line([(W - pad, H - pad), (W - pad, H - pad - size)], fill=color, width=w)


def hex_monogram(img: Image.Image, cx: int, cy: int, r: int) -> None:
    # Outline hexagon + inner J + dot
    overlay = Image.new("RGBA", img.size, (0, 0, 0, 0))
    od = ImageDraw.Draw(overlay)
    pts = []
    import math
    for i in range(6):
        # pointy-top hexagon
        ang = math.radians(60 * i - 90)
        pts.append((cx + r * math.cos(ang), cy + r * math.sin(ang)))
    od.polygon(pts, fill=(*BG_TOP, 255), outline=(*CYAN, 255), width=3)

    # J shape
    j_w = int(r * 0.9)
    top_y = cy - int(r * 0.45)
    bot_y = cy + int(r * 0.32)
    left_x = cx - int(j_w * 0.32)
    right_x = cx + int(j_w * 0.18)

    od.line([(right_x, top_y), (right_x, bot_y - 8)], fill=(*CYAN, 255), width=4)
    # arc for the hook of the J
    arc_box = (left_x, bot_y - int(r * 0.5), right_x + int(r * 0.18), bot_y + int(r * 0.05))
    od.arc(arc_box, start=0, end=180, fill=(*CYAN, 255), width=4)
    # dot
    od.ellipse((cx - 3, cy - 3, cx + 3, cy + 3), fill=(*CYAN, 255))

    img.alpha_composite(overlay)


def pill(draw: ImageDraw.ImageDraw, x: int, y: int, label: str, dot_color: tuple[int, int, int], outline=CYAN_DIM, text_color=TEXT) -> int:
    pad_x, pad_y = 16, 9
    bbox = draw.textbbox((0, 0), label, font=F_PILL)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    w = pad_x * 2 + 18 + tw
    h = pad_y * 2 + th
    draw.rounded_rectangle((x, y, x + w, y + h), radius=h // 2, outline=outline, width=2)
    # dot
    dot_r = 5
    draw.ellipse((x + 14, y + h // 2 - dot_r, x + 14 + dot_r * 2, y + h // 2 + dot_r), fill=dot_color)
    # label
    draw.text((x + 14 + dot_r * 2 + 8, y + pad_y - 2), label, fill=text_color, font=F_PILL)
    return w


def sparkline(draw: ImageDraw.ImageDraw, ox: int, oy: int, w: int, h: int, points: list[float]) -> None:
    n = len(points)
    if n < 2:
        return
    step = w / (n - 1)
    pts = [(ox + i * step, oy + h - p * h) for i, p in enumerate(points)]
    # line
    for i in range(len(pts) - 1):
        draw.line([pts[i], pts[i + 1]], fill=CYAN, width=2)
    # nodes
    for px, py in pts[::2]:
        draw.ellipse((px - 2, py - 2, px + 2, py + 2), fill=CYAN)


# ---------------------------------------------------------------------------
# Compose
# ---------------------------------------------------------------------------

def main() -> None:
    img = Image.new("RGBA", (W, H), BG_TOP)
    vertical_gradient(img, BG_TOP, BG_BOTTOM)

    draw = ImageDraw.Draw(img)
    grid_overlay(draw, color=(0, 212, 255, 14), step=40)

    # ambient glow behind monogram
    soft_glow(img, center=(220, 320), radius=320, color=CYAN)

    # corner brackets
    draw_overlay = ImageDraw.Draw(img)
    corner_brackets(draw_overlay, color=CYAN, pad=28, size=36, w=2)

    # Top accent line
    draw_overlay.line([(0, 4), (W, 4)], fill=CYAN_DIM, width=2)
    draw_overlay.line([(0, H - 5), (W, H - 5)], fill=CYAN_DIM, width=2)

    # Monogram
    hex_monogram(img, cx=220, cy=320, r=98)

    # Wordmark
    draw = ImageDraw.Draw(img)
    title = "JARVIS"
    draw.text((360, 220), title, fill=TEXT, font=F_TITLE)
    # cyan accent: redraw the 'A' to color it
    a_x = 360
    # measure J width
    j_w = draw.textlength("J", font=F_TITLE)
    a_x = 360 + int(j_w)
    draw.text((a_x, 220), "A", fill=CYAN, font=F_TITLE)

    draw.text((364, 372), "WINDOWS  ·  STANDALONE  ·  OPERATOR  CONSOLE",
              fill=MUTED, font=F_SUB)

    # Pills row
    px = 360
    py = 422
    px += pill(draw, px, py, "LOCAL  ·  FIRST", dot_color=GREEN) + 12
    px += pill(draw, px, py, "ZERO  ·  TELEMETRY", dot_color=GREEN) + 12
    px += pill(draw, px, py, "RISK  ·  AUDITED", dot_color=AMBER) + 12
    pill(draw, px, py, "MIC  ·  OFF", dot_color=RED, outline=(120, 30, 50))

    # Right-side telemetry mock — anchored to top-right corner
    rx = 940
    ry = 110
    rows = [
        ("VER",     "B6.6.30",   CYAN),
        ("RT",      "Py 3.12 · Node LTS", TEXT),
        ("API",     ":8000  ·  OK", GREEN),
        ("AGENTS",  "7 / 7 active", TEXT),
        ("RISK",    "2 gated",   AMBER),
        ("KB",      "1,247 chunks", TEXT),
    ]
    for i, (lbl, val, col) in enumerate(rows):
        draw.text((rx, ry + i * 28), lbl,  fill=DIM, font=F_LBL)
        draw.text((rx + 80, ry + i * 28), val,  fill=col, font=F_LBL)

    # mini sparkline below telemetry, well above the pills row
    spark_y = ry + len(rows) * 28 + 18
    pts = [0.45, 0.62, 0.40, 0.70, 0.30, 0.66, 0.52, 0.74, 0.38, 0.60, 0.45, 0.70]
    sparkline(draw, ox=rx, oy=spark_y, w=260, h=44, points=pts)
    draw.text((rx, spark_y + 54), "RUNTIME  ·  LIVE", fill=DIM, font=F_LBL)

    # Save
    out = Path(__file__).resolve().parent.parent / "docs" / "assets" / "og-image.png"
    out.parent.mkdir(parents=True, exist_ok=True)
    img.convert("RGB").save(out, "PNG", optimize=True)
    print(f"Wrote {out}  ({out.stat().st_size // 1024} KB, {W}x{H})")


if __name__ == "__main__":
    sys.exit(main() or 0)
