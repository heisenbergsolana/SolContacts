#!/usr/bin/env python3
"""Render the dApp Store listing assets from the mark `generate-icons.py` already defines.

    python3 scripts/generate-store-assets.py

Screenshots are not produced here — those are captured from a real device, because a
listing built from mock-ups is the one thing a reviewer can always tell.
"""

import importlib.util
import math
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "assets" / "store"

# The mark lives in a hyphenated filename, so it is loaded by path rather than imported.
_spec = importlib.util.spec_from_file_location("generate_icons", Path(__file__).parent / "generate-icons.py")
_icons = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_icons)

INK, PURPLE, GREEN = _icons.INK, _icons.PURPLE, _icons.GREEN
TEXT_DARK, MUTED_DARK = _icons.TEXT_DARK, _icons.MUTED_DARK
mark, tile = _icons.mark, _icons.tile

WORDMARK_FONT = _icons.WORDMARK_FONT
TAGLINE_FONT = ROOT / "node_modules" / "@expo-google-fonts" / "space-grotesk" / "500Medium" / "SpaceGrotesk_500Medium.ttf"

# The listing's short description, so the banner and the store text say the same thing.
TAGLINE = "Your Solana address book"


def _glow(size: tuple[int, int], color: tuple[int, int, int], cx: float, cy: float, radius: float, peak: int):
    """One soft radial source, drawn small and scaled up — the same trick the ramp uses.

    `cx`, `cy` and `radius` are fractions of the canvas. The falloff is squared so a
    near-black OLED panel does not show a ring where the glow ends.
    """
    n = 96
    pixels = []
    for row in range(n):
        y = (row + 0.5) / n
        for col in range(n):
            x = (col + 0.5) / n
            d = math.hypot(x - cx, y - cy) / radius
            t = max(0.0, 1.0 - d)
            pixels.append(color + (round(peak * t * t),))
    layer = Image.new("RGBA", (n, n))
    layer.putdata(pixels)
    return layer.resize(size, Image.BICUBIC)


def banner() -> Image.Image:
    """1200×600. Mark left, wordmark and tagline right, over the app's own glow mesh."""
    w, h = 1200, 600
    canvas = Image.new("RGBA", (w, h), INK + (255,))
    canvas.alpha_composite(_glow((w, h), PURPLE, 0.18, 0.22, 0.62, 86))
    canvas.alpha_composite(_glow((w, h), GREEN, 0.86, 0.84, 0.52, 64))

    mark_px, gap = 300, 96
    name_font = ImageFont.truetype(str(WORDMARK_FONT), 92)
    tag_font = ImageFont.truetype(str(TAGLINE_FONT), 38)

    probe = ImageDraw.Draw(Image.new("RGBA", (1, 1)))
    n_left, n_top, n_right, n_bottom = probe.textbbox((0, 0), "SolContacts", font=name_font)
    t_left, t_top, t_right, t_bottom = probe.textbbox((0, 0), TAGLINE, font=tag_font)
    name_w, name_h = n_right - n_left, n_bottom - n_top
    tag_w = t_right - t_left

    text_w = max(name_w, tag_w)
    lockup_w = mark_px + gap + text_w
    x = (w - lockup_w) // 2

    canvas.alpha_composite(mark(mark_px), (x, (h - mark_px) // 2))

    text_x = x + mark_px + gap
    block_h = name_h + 28 + (t_bottom - t_top)
    text_y = (h - block_h) // 2
    draw = ImageDraw.Draw(canvas)
    draw.text((text_x - n_left, text_y - n_top), "SolContacts", font=name_font, fill=TEXT_DARK + (255,))
    draw.text((text_x - t_left, text_y + name_h + 28 - t_top), TAGLINE, font=tag_font, fill=MUTED_DARK + (255,))

    return canvas


def write(image: Image.Image, name: str) -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    path = OUT / name
    image.save(path)
    print(f"{path.relative_to(ROOT)}  {image.width}×{image.height}  {image.mode}")


def main() -> None:
    # Opaque: the store applies its own mask and a transparent icon reads as a hole.
    icon = tile(512, INK, None)
    icon.alpha_composite(mark(512))
    write(icon.convert("RGB"), "icon-512.png")

    write(banner().convert("RGB"), "banner-1200x600.png")


if __name__ == "__main__":
    main()
