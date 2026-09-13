#!/usr/bin/env python3
"""Render the SolContacts icon set from the one mark definition in this file.

Run by hand after the mark changes; the PNGs it writes are committed, so a normal
checkout never needs Python:

    python3 scripts/generate-icons.py

Pillow rather than an SVG toolchain because the mark is nine primitives and a linear
gradient — a rasterizer would be a second source of truth for geometry that already
lives here. Every coordinate below is in the mark's own 96-unit space, the same one
docs/11-BRANDING.md describes, and is scaled on the way out.
"""

import math
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageFont

# Design tokens. These must stay identical to constants/app-styles.ts.
INK = (11, 13, 16)
PURPLE = (153, 69, 255)
GREEN = (20, 241, 149)
TEXT_DARK = (242, 244, 247)
TEXT_LIGHT = (11, 13, 16)
MUTED_DARK = (152, 162, 179)
MUTED_LIGHT = (90, 100, 114)
WHITE = (255, 255, 255)

U = 96.0  # the mark's coordinate space
SS = 4  # supersampling factor; the mark is drawn at SS× and resampled down

# The adaptive icon's foreground layer is masked to a circle of 66% of the canvas.
# The card's rounded corners reach 36.5u from centre, the safe radius is 31.7u, so the
# whole mark is drawn at this scale inside that layer. Derived, not guessed: 31.7/36.5.
SAFE_SCALE = 0.86

# Android 12 and later mask the splash icon into a circle: the icon is 240dp across and only the
# inner 160dp is guaranteed to survive it. The lockup is fitted to that circle by its diagonal,
# which is what a wide wordmark needs — laid out to the canvas edges it loses its last letters.
SPLASH_SAFE = 160 / 240

# The app's own display face, so the splash wordmark and the store banner are the same
# lettering the headlines inside the app use. It ships in node_modules rather than on the
# system, which is fine: this script is run by hand from a working checkout.
WORDMARK_FONT = (
    Path(__file__).resolve().parent.parent
    / "node_modules"
    / "@expo-google-fonts"
    / "space-grotesk"
    / "700Bold"
    / "SpaceGrotesk_700Bold.ttf"
)

ASSETS = Path(__file__).resolve().parent.parent / "assets" / "images"


def _gradient(size: int) -> Image.Image:
    """The brand ramp, purple to green, along the mark's 135° diagonal."""
    n = 256
    x0, y0, x1, y1 = 16.0, 20.0, 80.0, 78.0
    dx, dy = x1 - x0, y1 - y0
    denom = dx * dx + dy * dy
    step = U / n
    pixels = []
    for row in range(n):
        y = (row + 0.5) * step
        for col in range(n):
            x = (col + 0.5) * step
            t = min(1.0, max(0.0, ((x - x0) * dx + (y - y0) * dy) / denom))
            pixels.append(
                (
                    round(PURPLE[0] + (GREEN[0] - PURPLE[0]) * t),
                    round(PURPLE[1] + (GREEN[1] - PURPLE[1]) * t),
                    round(PURPLE[2] + (GREEN[2] - PURPLE[2]) * t),
                )
            )
    ramp = Image.new("RGB", (n, n))
    ramp.putdata(pixels)
    return ramp.resize((size, size), Image.BILINEAR)


def _masks(size: int) -> tuple[Image.Image, Image.Image]:
    """The gradient-filled part of the mark, and the two muted address bars."""
    k = size / U

    def s(*values: float) -> list[float]:
        return [v * k for v in values]

    card = Image.new("L", (size, size), 0)
    d = ImageDraw.Draw(card)
    # A 5u stroke centred on the card path: fill the outer edge, punch the inner one.
    d.rounded_rectangle(s(15.5, 21.5, 80.5, 74.5), radius=13.5 * k, fill=255)
    d.rounded_rectangle(s(20.5, 26.5, 75.5, 69.5), radius=8.5 * k, fill=0)
    d.ellipse(s(33.5, 35.5, 48.5, 50.5), fill=255)  # head, r 7.5 at (41, 43)

    # The shoulders are a half-annulus, so they get their own layer — cutting the lower
    # half on the card layer would take the card's bottom edge with it.
    shoulders = Image.new("L", (size, size), 0)
    d = ImageDraw.Draw(shoulders)
    d.ellipse(s(26.5, 49.0, 55.5, 78.0), fill=255)  # outer, r 14.5 at (41, 63.5)
    d.ellipse(s(31.5, 54.0, 50.5, 73.0), fill=0)  # inner, r 9.5
    d.rectangle(s(0, 63.5, 96, 96), fill=0)
    d.ellipse(s(26.5, 61.0, 31.5, 66.0), fill=255)  # round caps, r 2.5
    d.ellipse(s(50.5, 61.0, 55.5, 66.0), fill=255)

    bars = Image.new("L", (size, size), 0)
    d = ImageDraw.Draw(bars)
    d.rounded_rectangle(s(58.5, 41.0, 71.5, 45.5), radius=2.25 * k, fill=255)
    d.rounded_rectangle(s(58.5, 51.0, 71.5, 55.5), radius=2.25 * k, fill=255)

    return ImageChops.lighter(card, shoulders), bars


def mark(size: int, *, mono: bool = False, bar: tuple[int, int, int] = MUTED_DARK) -> Image.Image:
    """The mark alone, on transparency, at `size` px."""
    big = size * SS
    body, bars = _masks(big)

    out = Image.new("RGBA", (big, big), (0, 0, 0, 0))
    if mono:
        out.paste(Image.new("RGBA", (big, big), WHITE + (255,)), (0, 0), ImageChops.lighter(body, bars))
    else:
        out.paste(_gradient(big).convert("RGBA"), (0, 0), body)
        out.paste(Image.new("RGBA", (big, big), bar + (255,)), (0, 0), bars)
    return out.resize((size, size), Image.LANCZOS)


def scaled_onto(art: Image.Image, canvas: int, scale: float) -> Image.Image:
    """Centre `art` on a transparent square, shrunk to `scale` of it."""
    inner = round(canvas * scale)
    out = Image.new("RGBA", (canvas, canvas), (0, 0, 0, 0))
    out.alpha_composite(art.resize((inner, inner), Image.LANCZOS), ((canvas - inner) // 2,) * 2)
    return out


def tile(size: int, fill: tuple[int, int, int], radius: float | None) -> Image.Image:
    """The icon's background plate. `radius` is in mark units; None means full bleed."""
    if radius is None:
        return Image.new("RGBA", (size, size), fill + (255,))
    big = size * SS
    plate = Image.new("RGBA", (big, big), (0, 0, 0, 0))
    ImageDraw.Draw(plate).rounded_rectangle([0, 0, big - 1, big - 1], radius=radius * big / U, fill=fill + (255,))
    return plate.resize((size, size), Image.LANCZOS)


def splash(dark: bool) -> Image.Image:
    """Mark over wordmark, square, inside the circle Android 12 masks the splash icon to."""
    canvas = 1024
    mark_px, gap, font_px = 440, 48, 120
    ink = TEXT_DARK if dark else TEXT_LIGHT
    font = ImageFont.truetype(str(WORDMARK_FONT), font_px)

    probe = ImageDraw.Draw(Image.new("RGBA", (1, 1)))
    left, top, right, bottom = probe.textbbox((0, 0), "SolContacts", font=font)
    text_w, text_h = right - left, bottom - top

    # The lockup at its nominal size, cropped to exactly what it draws — padding here would be
    # measured as content by the fit below and shrink the artwork for nothing.
    width, height = max(mark_px, text_w), mark_px + gap + text_h
    lockup = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    lockup.alpha_composite(mark(mark_px, bar=MUTED_DARK if dark else MUTED_LIGHT), ((width - mark_px) // 2, 0))
    ImageDraw.Draw(lockup).text(
        ((width - text_w) // 2 - left, mark_px + gap - top),
        "SolContacts",
        font=font,
        fill=ink + (255,),
    )

    # By the diagonal, not the width: the corners of the wordmark are what the circle cuts first.
    scale = canvas * SPLASH_SAFE / math.hypot(width, height)
    fitted = lockup.resize((round(width * scale), round(height * scale)), Image.LANCZOS)

    out = Image.new("RGBA", (canvas, canvas), (0, 0, 0, 0))
    out.alpha_composite(fitted, ((canvas - fitted.width) // 2, (canvas - fitted.height) // 2))
    return out


def write(image: Image.Image, name: str) -> None:
    path = ASSETS / name
    image.save(path)
    print(f"{path.relative_to(ASSETS.parent.parent)}  {image.width}×{image.height}")


def main() -> None:
    # Full bleed and opaque: Android and the store apply their own mask to this one.
    master = tile(1024, INK, None)
    master.alpha_composite(mark(1024))
    write(master.convert("RGB"), "icon.png")

    write(scaled_onto(mark(1024), 1024, SAFE_SCALE), "android-icon-foreground.png")
    write(scaled_onto(mark(1024, mono=True), 1024, SAFE_SCALE), "android-icon-monochrome.png")

    favicon = tile(128, INK, 22.0)
    favicon.alpha_composite(mark(128))
    write(favicon, "favicon.png")

    write(splash(dark=False), "splash-icon.png")
    write(splash(dark=True), "splash-icon-dark.png")


if __name__ == "__main__":
    main()
