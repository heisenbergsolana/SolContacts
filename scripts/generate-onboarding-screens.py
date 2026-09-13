#!/usr/bin/env python3
"""Export the four onboarding screens as SVG artboards, for Figma and the store listing.

    python3 scripts/generate-onboarding-screens.py

SVG rather than PNG because Figma imports it as layers: every card is a rectangle, every
string is editable text, nothing is baked. The artboards are 1080x2400 — portrait, the
store's ">= 1080px, identical aspect ratio" rule, and the same 360x800 dp layout the app
uses, at 3x.

This is an export of the design, not a second implementation of it: the copy and the
decorative code pattern are read out of the components themselves, so a headline edited in
`onboarding-flow.tsx` reaches the artboards on the next run. The geometry is the part that
has to be kept in step by hand — it is the same spacing scale, at `S = 3`.
"""

import re
from pathlib import Path

from PIL import ImageFont

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "assets" / "design"

S = 3  # px per dp
W, H = 360 * S, 800 * S

# constants/app-styles.ts — the dark palette, which is the only one the app renders.
TEXT = "#F7F9FC"
MUTED = "#98A2B3"
SURFACE = "#101219"
SURFACE_ALT = "#1A1D26"
BORDER = "#272B36"
PRIMARY = "#9945FF"
ACCENT = "#14F195"
DANGER = "#FF6B6B"
WARNING = "#FDB022"
MINT, VIOLET = "#14F195", "#A78BFA"
CARD = ("#12141C", "#0C0E14")

DISPLAY = "Space Grotesk, Inter, system-ui, sans-serif"
BODY = "Inter, system-ui, -apple-system, sans-serif"
MONO = "JetBrains Mono, ui-monospace, monospace"

MEASURE_BOLD = "/usr/share/fonts/truetype/noto/NotoSans-Bold.ttf"
MEASURE_REGULAR = "/usr/share/fonts/truetype/noto/NotoSans-Regular.ttf"

# components/dark-glow-background.tsx — four blue sources on black, with an eased falloff.
GLOWS = [
    ("g1", "80%", "12%", "70%", "34%", "#15287d", 0.95),
    ("g2", "50%", "108%", "95%", "32%", "#0c1a5c", 0.80),
    ("g3", "104%", "86%", "46%", "26%", "#101f6e", 0.90),
    ("g4", "2%", "97%", "64%", "42%", "#1a34bd", 1.0),
]
FALLOFF = [(0, 1), (0.35, 0.72), (0.65, 0.28), (1, 0)]


def esc(text: str) -> str:
    return text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def rect(x, y, w, h, *, rx=0, fill="none", stroke=None, sw=S, extra=""):
    out = f'<rect x="{x:.0f}" y="{y:.0f}" width="{w:.0f}" height="{h:.0f}" rx="{rx:.0f}" fill="{fill}"'
    if stroke:
        out += f' stroke="{stroke}" stroke-width="{sw:.0f}"'
    return out + f"{extra}/>"


def label(x, y, text, *, size, fill=TEXT, family=BODY, weight=400, anchor="start", spacing=0):
    return (
        f'<text x="{x:.0f}" y="{y:.0f}" font-family="{family}" font-size="{size:.0f}" '
        f'font-weight="{weight}" fill="{fill}" text-anchor="{anchor}" '
        f'letter-spacing="{spacing:.1f}" xml:space="preserve">{esc(text)}</text>'
    )


def wrap(text: str, size: int, width: int, *, bold: bool) -> list[str]:
    """Greedy wrap, measured with Noto — near enough to the app's faces for a layout base."""
    font = ImageFont.truetype(MEASURE_BOLD if bold else MEASURE_REGULAR, size)
    lines, line = [], ""
    for word in text.split():
        candidate = f"{line} {word}".strip()
        if font.getlength(candidate) <= width or not line:
            line = candidate
        else:
            lines.append(line)
            line = word
    if line:
        lines.append(line)
    return lines


def background() -> str:
    defs = []
    for name, _cx, _cy, _rx, _ry, colour, opacity in GLOWS:
        stops = "".join(
            f'<stop offset="{offset}" stop-color="{colour}" stop-opacity="{alpha * opacity:.3f}"/>'
            for offset, alpha in FALLOFF
        )
        # Centred in its own ellipse, which the default objectBoundingBox units then stretch to the
        # ellipse's shape — the app's glows are all wider than they are tall.
        defs.append(f'<radialGradient id="{name}" cx="50%" cy="50%" r="50%">{stops}</radialGradient>')
    body = [rect(0, 0, W, H, fill="#000000")]
    for name, cx, cy, rx, ry, _, _ in GLOWS:
        body.append(
            f'<ellipse cx="{cx.rstrip("%")}%" cy="{cy.rstrip("%")}%" rx="{rx}" ry="{ry}" fill="url(#{name})"/>'
        )
    return "<defs>" + "".join(defs) + "</defs>" + "".join(body)


def card(x, y, w, h, *, rx=20 * S):
    """The app's card: a near-flat two-stop gradient with a hairline."""
    return (
        rect(x, y, w, h, rx=rx, fill="url(#card)")
        + rect(x, y, w, h, rx=rx, stroke=BORDER)
    )


# ── the decorative code, read out of the component that draws it in the app ──────────────
def glyph_rows() -> list[str]:
    source = (ROOT / "components" / "onboarding" / "onboarding-art.tsx").read_text()
    rows = re.findall(r"'([#.]{21})'", source)
    assert len(rows) == 21, f"expected a 21-row glyph, found {len(rows)}"
    return rows


ROWS = glyph_rows()


def qr(x, y, size, *, pad_ratio=0.09):
    """The white tile and the pattern on it, sized like `QrGlyph`."""
    pad = round(size * pad_ratio)
    cell = (size - pad * 2) / len(ROWS)
    out = [rect(x, y, size, size, rx=8 * S, fill="#FFFFFF")]
    for row_index, row in enumerate(ROWS):
        for col, filled in enumerate(row):
            if filled == "#":
                out.append(
                    rect(x + pad + col * cell, y + pad + row_index * cell, cell + 0.6, cell + 0.6, fill="#101418")
                )
    return "".join(out)


def icon(path: str, x, y, size, *, fill="none", stroke=None, sw=2.2, cap="round"):
    """One 24-unit icon path, scaled and placed."""
    k = size / 24
    attrs = f'fill="{fill}"'
    if stroke:
        attrs += f' stroke="{stroke}" stroke-width="{sw}" stroke-linecap="{cap}" stroke-linejoin="{cap}"'
    return f'<g transform="translate({x:.0f},{y:.0f}) scale({k:.4f})"><path d="{path}" {attrs}/></g>'


TICK = "M4 12.5l5 5L20 6.5"
CROSS = "M6 6l12 12M18 6L6 18"
STAR = "M12 3l2.6 5.8 6.4.7-4.8 4.3 1.3 6.2L12 16.9 6.5 20l1.3-6.2L3 9.5l6.4-.7z"
COPY = (
    "M9,7h9a2,2 0 0 1 2,2v9a2,2 0 0 1 -2,2h-9a2,2 0 0 1 -2,-2v-9a2,2 0 0 1 2,-2zM9,9v9h9v-9z"
    "M5,15h-1a2,2 0 0 1 -2,-2v-9a2,2 0 0 1 2,-2h9a2,2 0 0 1 2,2v1h-2v-1h-9v9h1z"
)
SEARCH = "M11 4a7 7 0 1 1 0 14 7 7 0 0 1 0-14ZM20 20l-4-4"


# ── the four illustrations ───────────────────────────────────────────────────────────────
def art_contacts(x, y, w):
    """The contact book: search, a pinned row with its code, a second row with its copy button."""
    out = []
    search_h = 46 * S
    out.append(rect(x, y, w, search_h, rx=16 * S, fill=SURFACE, stroke=BORDER))
    out.append(icon(SEARCH, x + 14 * S, y + 14 * S, 18 * S, stroke=MUTED, sw=2))
    out.append(label(x + 40 * S, y + 29 * S, "Search name or address…", size=16 * S, fill=MUTED))

    row_h = 92 * S
    top = y + search_h + 8 * S

    def row(ry, name, address, balance, tag, tone, pinned, trailing):
        block = [card(x, ry, w, row_h)]
        cursor = x + 16 * S
        block.append(label(cursor, ry + 32 * S, name, size=20 * S, family=DISPLAY, weight=600, spacing=-0.2 * S))
        cursor += ImageFont.truetype(MEASURE_BOLD, 20 * S).getlength(name) + 10 * S
        if pinned:
            block.append(icon(STAR, cursor, ry + 14 * S, 18 * S, fill=WARNING))
            cursor += 26 * S
        tag_w = ImageFont.truetype(MEASURE_BOLD, 12 * S).getlength(tag) + 18 * S
        block.append(rect(cursor, ry + 13 * S, tag_w, 22 * S, rx=11 * S, fill=tone + "26"))
        block.append(label(cursor + tag_w / 2, ry + 28 * S, tag, size=12 * S, fill=tone, weight=600, anchor="middle"))
        block.append(label(x + 16 * S, ry + 56 * S, address, size=15 * S, fill=MUTED, family=MONO))
        block.append(label(x + 16 * S, ry + 76 * S, balance, size=12 * S))
        if trailing == "qr":
            block.append(qr(x + w - 68 * S, ry + 20 * S, 52 * S))
        else:
            block.append(rect(x + w - 56 * S, ry + 26 * S, 40 * S, 40 * S, rx=12 * S, fill=SURFACE_ALT, stroke=BORDER))
            block.append(icon(COPY, x + w - 45 * S, ry + 37 * S, 18 * S, fill=TEXT))
        return block

    out += row(top, "Ada", "7xKX…gAsU", "12.42 SOL", "Friends", MINT, True, "qr")
    out += row(top + row_h + 8 * S, "My cold wallet", "8Hd2…t72Q", "4.81 SOL", "Mine", VIOLET, False, "copy")
    return "".join(out), search_h + 8 * S + row_h * 2 + 8 * S


def art_trust(x, y, w):
    """What it does, and the list that matters more: what it never does."""
    out = []
    cursor = y
    for heading, tone, claims in (
        (
            "WHAT IT DOES",
            ACCENT,
            ["Stores public addresses, on this device", "Reads balances from the network", "Works with no account and no server"],
        ),
        ("WHAT IT NEVER DOES", DANGER, ["Ask for a seed phrase", "Hold or store a private key", "Sign, send or move funds"]),
    ):
        height = 150 * S
        out.append(card(x, cursor, w, height))
        out.append(label(x + 20 * S, cursor + 32 * S, heading, size=13 * S, fill=MUTED, weight=500, spacing=0.5 * S))
        for index, claim in enumerate(claims):
            row_y = cursor + 54 * S + index * 30 * S
            out.append(icon(TICK if tone == ACCENT else CROSS, x + 20 * S, row_y, 20 * S, stroke=tone))
            out.append(label(x + 52 * S, row_y + 15 * S, claim, size=16 * S))
        cursor += height + 12 * S
    return "".join(out), cursor - y - 12 * S


def art_scan(x, y, w):
    """The scanner's own marks around a code, and the check the app runs on what comes out."""
    frame = 180 * S
    fx = x + (w - frame) / 2
    k = frame / 200
    corners = [
        ("M8 56V20a12 12 0 0 1 12-12h36", PRIMARY),
        ("M144 8h36a12 12 0 0 1 12 12v36", PRIMARY),
        ("M192 144v36a12 12 0 0 1-12 12h-36", ACCENT),
        ("M56 192H20a12 12 0 0 1-12-12v-36", ACCENT),
    ]
    out = [
        f'<g transform="translate({fx:.0f},{y:.0f}) scale({k:.4f})">'
        + "".join(
            f'<path d="{path}" fill="none" stroke="{colour}" stroke-width="5" stroke-linecap="round"/>'
            for path, colour in corners
        )
        + "</g>"
    ]
    code = 116 * S
    out.append(qr(x + (w - code) / 2, y + (frame - code) / 2, code))

    card_y = y + frame + 12 * S
    card_h = 86 * S
    out.append(card(x, card_y, w, card_h))
    out.append(
        label(
            x + 16 * S,
            card_y + 32 * S,
            "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
            size=13 * S,
            family=MONO,
        )
    )
    out.append(icon(TICK, x + 16 * S, card_y + 48 * S, 16 * S, stroke=ACCENT, sw=2.6))
    out.append(label(x + 40 * S, card_y + 61 * S, "Valid Solana address", size=13 * S, fill=ACCENT))
    return "".join(out), frame + 12 * S + card_h


def art_widgets(x, y, w):
    """Three widgets as they sit on a home screen, on the surface they actually carry."""
    out = ['<defs><linearGradient id="widget" x1="0" y1="1" x2="1" y2="0.1">'
           '<stop offset="0" stop-color="#16276F"/><stop offset="1" stop-color="#05070D"/>'
           "</linearGradient></defs>"]

    def frame(fx, fy, fw, fh):
        return rect(fx, fy, fw, fh, rx=24 * S, fill="url(#widget)") + rect(
            fx, fy, fw, fh, rx=24 * S, stroke="#2A3350"
        )

    def copy_button(bx, by, size=32 * S):
        return rect(bx, by, size, size, rx=12 * S, fill="#0B0E14", stroke="#2A3350") + icon(
            COPY, bx + size / 2 - 7.5 * S, by + size / 2 - 7.5 * S, 15 * S, fill="#F2F4F7"
        )

    square = 150 * S
    out.append(frame(x, y, square, square))
    out.append(label(x + 12 * S, y + 24 * S, "Ada", size=12 * S, weight=700))
    out.append(label(x + 12 * S, y + 40 * S, "7xKX…gAsU", size=12 * S, fill=MUTED, family=MONO))
    out.append(qr(x + 12 * S, y + square - 80 * S, 68 * S))
    out.append(copy_button(x + square - 44 * S, y + square - 44 * S))

    right_x = x + square + 12 * S
    right_w = w - square - 12 * S
    strip_h = 69 * S
    out.append(frame(right_x, y, right_w, strip_h))
    out.append(qr(right_x + 10 * S, y + 10 * S, 48 * S))
    out.append(label(right_x + 66 * S, y + 30 * S, "Exchange", size=12 * S, weight=700))
    out.append(label(right_x + 66 * S, y + 46 * S, "8Hd2…t72Q", size=12 * S, fill=MUTED, family=MONO))
    out.append(copy_button(right_x + right_w - 42 * S, y + 18 * S))

    second_y = y + strip_h + 12 * S
    second_h = square - strip_h - 12 * S
    out.append(frame(right_x, second_y, right_w, second_h))
    out.append(label(right_x + 12 * S, second_y + second_h / 2 - 4 * S, "Mum", size=12 * S, weight=700))
    out.append(label(right_x + 12 * S, second_y + second_h / 2 + 14 * S, "4pQm…7yTs", size=12 * S, fill=MUTED, family=MONO))
    out.append(copy_button(right_x + right_w - 42 * S, second_y + second_h / 2 - 16 * S))
    return "".join(out), square


# ── the copy, read out of the flow so the artboards cannot drift from the app ─────────────
def steps() -> list[dict[str, str]]:
    source = (ROOT / "components" / "onboarding" / "onboarding-flow.tsx").read_text()
    found = re.findall(r"headline: '([^']+)',\s*\n\s*body: '([^']+)',\s*\n\s*cta: '([^']+)'", source)
    assert len(found) == 4, f"expected four steps, found {len(found)}"
    return [{"headline": h, "body": b, "cta": c} for h, b, c in found]


ARTS = [art_contacts, art_trust, art_scan, art_widgets]


def screen(index: int, step: dict[str, str]) -> str:
    pad = 16 * S
    inner = W - pad * 2
    last = index == len(ARTS) - 1
    out = [background()]
    out.append(f'<defs><linearGradient id="card" x1="0" y1="0" x2="0.6" y2="1">'
               f'<stop offset="0" stop-color="{CARD[0]}"/><stop offset="1" stop-color="{CARD[1]}"/>'
               f"</linearGradient>"
               f'<linearGradient id="cta" x1="0" y1="0" x2="1" y2="1">'
               f'<stop offset="0" stop-color="{PRIMARY}"/><stop offset="1" stop-color="{ACCENT}"/>'
               "</linearGradient></defs>")

    # Top row: the two ways out of a step, each in the slot it keeps whether drawn or not.
    if index > 0:
        out.append(label(pad, 60 * S, "‹ Back", size=16 * S, fill=MUTED))
    if not last:
        out.append(label(W - pad, 60 * S, "Skip", size=16 * S, fill=MUTED, anchor="end"))

    # Bottom up: the button, the dots, then the copy — so the art gets whatever is left.
    cta_h = 48 * S
    cta_y = H - pad - cta_h
    out.append(rect(pad, cta_y, inner, cta_h, rx=16 * S, fill="url(#cta)"))
    out.append(
        label(W / 2, cta_y + 31 * S, step["cta"], size=16 * S, fill="#000000", weight=700, anchor="middle")
    )

    dots_y = cta_y - 22 * S
    dot_x = W / 2 - (len(ARTS) * 6 * S + (len(ARTS) - 1) * 4 * S + 14 * S) / 2
    for position in range(len(ARTS)):
        width = 20 * S if position == index else 6 * S
        out.append(rect(dot_x, dots_y, width, 6 * S, rx=3 * S, fill=PRIMARY if position == index else BORDER))
        dot_x += width + 4 * S

    body_lines = wrap(step["body"], 16 * S, inner, bold=False)
    head_lines = wrap(step["headline"], 28 * S, inner, bold=True)
    body_top = dots_y - 26 * S - len(body_lines) * 24 * S
    for line_index, line in enumerate(body_lines):
        out.append(label(pad, body_top + line_index * 24 * S, line, size=16 * S, fill=MUTED))

    head_top = body_top - 24 * S - len(head_lines) * 34 * S
    for line_index, line in enumerate(head_lines):
        out.append(
            label(pad, head_top + line_index * 34 * S, line, size=28 * S, family=DISPLAY, weight=700, spacing=-0.6 * S)
        )

    # The art is centred in what the copy left, which is how the flow lays it out too.
    art_svg, art_h = ARTS[index](pad, 0, inner)
    top = 110 * S
    offset = top + max(0, (head_top - 40 * S - top - art_h) / 2)
    out.append(f'<g transform="translate(0,{offset:.0f})">{art_svg}</g>')

    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">'
        + "".join(out)
        + "</svg>"
    )


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    for index, step in enumerate(steps()):
        path = OUT / f"onboarding-{index + 1}.svg"
        path.write_text(screen(index, step))
        print(f"{path.relative_to(ROOT)}  {W}×{H}  {step['headline']}")


if __name__ == "__main__":
    main()
