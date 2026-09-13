# Design artboards

`onboarding-*.svg` — the four introduction screens as 1080×2400 artboards, one per step.

Generated, not drawn by hand:

```bash
python3 scripts/generate-onboarding-screens.py
```

The copy and the decorative code pattern are read out of
`components/onboarding/onboarding-flow.tsx` and `onboarding-art.tsx`, so a headline edited in the
app reaches the artboards on the next run. The geometry is the part kept in step by hand — it is
the same spacing scale as the app, at 3× (`S = 3`).

## Into Figma

Drag the files onto a Figma canvas, or **File → Import**. Each one lands as a frame: cards are
rectangles, strings are editable text, the codes and icons are vectors. Two fonts are referenced
by name and will substitute if they are not installed — [Space
Grotesk](https://fonts.google.com/specimen/Space+Grotesk) for headlines, Inter for body text.

## For the store listing

These are a base for `assets/store/screenshot-*.png`, not a replacement. The dApp Store wants
≥1080px, portrait, identical aspect ratio across every shot — which is what these are — but a
listing is more convincing with real screens from the device under them. See
[docs/11-BRANDING.md](../../docs/11-BRANDING.md).
