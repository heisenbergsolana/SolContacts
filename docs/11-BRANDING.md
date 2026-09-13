# 11 — Branding & Visual Assets

## Name

**SolContacts** — one word, capital S and C.

Written as `SolContacts` everywhere: app name, store listing, README, social. Never
"Sol Contacts", "solcontacts" (except in slugs, package names, and handles), or "SOLCONTACTS"
outside of a wordmark.

- Package: `com.solcontacts.app`
- Slug / package: `solcontacts` (lowercase everywhere in code)
- GitHub repo: `heisenbergsolana/SolContacts`
- Domain (if acquired): `solcontacts.app`

## Tagline

**Your Solana contacts, finally organized.**

Short variants for constrained spaces:

| Context                      | Text                                       | Length |
| ---------------------------- | ------------------------------------------ | ------ |
| dApp Store short description | `Your Solana address book`                 | 24     |
| App subtitle                 | `Solana wallet address book`               | 26     |
| Social bio opener            | `Your Solana contacts, finally organized.` | 40     |

## Positioning statement

> SolContacts is a wallet address book for Solana — not a wallet. It stores the public
> addresses you use most, validates every one, and gets them back to you in one tap.

Always pair the product description with **"not a wallet"**. It is the single most important
trust signal this app has, and it is also a genuine differentiator.

## Icon concept

The icon has one job: read instantly at 48dp on a dark home screen.

**Concept — "the contact card that is an address":**
A rounded-square card silhouette with a single stylized contact/person mark, cut through by
the two-tone Solana gradient. No text, no wallet imagery, no coins, no dollar signs.

Design rules:

- One idea only. At 48dp, anything more is mud.
- Solana gradient (purple → green) as the identifying element, so it reads as Solana-native
  without using the Solana logo (do not use Solana's logo — it is not ours to use).
- High contrast against both light and dark backgrounds.
- Solid background, no transparency in the 512×512 store icon.
- Safe area: keep all meaningful content inside the central 66% for the Android adaptive icon,
  which may be masked to a circle, squircle, or rounded square.

**Chosen (2026-09-06).** The card, over three alternatives that were drawn and compared at 48 dp:
an `S·C` monogram, an address-book spine, and a location pin. The card says "address book" before
it says "crypto"; the monogram says nothing until the name is already known; the spine collapses
into a hamburger menu at small sizes; the pin suggests places rather than wallets.

The two grey bars beside the person are texture, not information. They are the first thing to drop
if the mark is ever redrawn smaller than 24 dp — the card outline and the person are the mark.

### Producing the icon set

The geometry is defined once, as nine primitives and one gradient, in
[`scripts/generate-icons.py`](../scripts/generate-icons.py). There is no `.svg` master to drift
from it.

```bash
python3 scripts/generate-icons.py
```

Pillow only, no other dependency, and the PNGs it writes are committed — a normal checkout never
runs it. Two decisions live in that script:

- **The adaptive foreground is drawn at 86% of the canvas.** The card's rounded corners reach 36.5
  units from the centre of the 96-unit grid, and the safe circle's radius is 31.7. At full size a
  circular launcher mask clips the corners.
- **The splash wordmark is set in Space Grotesk Bold**, not the app's Roboto. It is an image asset,
  not UI text, so it follows the marketing-face rule below rather than the UI one — and it is the
  same face the app's two headline tokens carry, so the name is lettered identically on the splash,
  in the app and on the store banner. One constant to swap if that ever changes.
  It is read from `node_modules`, which is fine: the script is run by hand from a working checkout
  and the PNGs it writes are committed.

### Regenerating the PNGs is not enough

`expo run:android` **skips prebuild when `android/` already exists**, so new icons, a new splash
and changed colours in `app.json` never reach `android/app/src/main/res` — the build keeps whatever
the last prebuild wrote, and the launcher shows the old icon with no error anywhere.

After any change to the icon set, the splash, or a colour in `app.json`:

```bash
npm run android:build   # expo prebuild -p android — rewrites res/, colors.xml, the adaptive XML
npm run android
```

`android/` is generated and gitignored, so `--clean` is safe if a stale file survives; it also
clears orphans such as an `ic_launcher_background.webp` left behind when the adaptive background
image was dropped.

## Color palette

The same tokens the app uses (see [05-UI-UX.md](05-UI-UX.md)), so the brand and product match.

| Role             | Hex       | Note                       |
| ---------------- | --------- | -------------------------- |
| Solana Purple    | `#9945FF` | primary brand              |
| Solana Green     | `#14F195` | accent, success            |
| Ink (dark bg)    | `#0B0D10` | near-black; brand backdrop |
| Surface          | `#15181D` | cards                      |
| Paper (light bg) | `#FFFFFF` |                            |
| Text on dark     | `#F2F4F7` |                            |
| Muted            | `#98A2B3` |                            |
| Danger           | `#FF5C5C` |                            |

Gradient: `linear-gradient(135deg, #9945FF 0%, #14F195 100%)`.

## Typography

- **UI:** system font (Roboto on Android). Free, fast, familiar, zero bundle cost.
- **Addresses:** system monospace, always.
- **Marketing / store graphics:** Space Grotesk. It is already a dependency
  (`@expo-google-fonts/space-grotesk`, SIL Open Font License), already the app's headline face, and
  so needs no separate licence check.

## Required asset inventory

### App-embedded

All under `assets/images/`, all written by the generator above.

| File                          | Size  | Notes                                                |
| ----------------------------- | ----- | ---------------------------------------------------- |
| `icon.png`                    | 1024² | master, full bleed on `#0B0D10`, opaque              |
| `android-icon-foreground.png` | 1024² | mark only, on transparency, at 86% (see above)       |
| `android-icon-monochrome.png` | 1024² | white mark on transparency, for themed icons         |
| `favicon.png`                 | 128²  | rounded tile, web only                               |
| `splash-icon.png`             | 1024² | mark over wordmark, dark ink — the light-mode splash |
| `splash-icon-dark.png`        | 1024² | mark over wordmark, light ink — the dark-mode splash |

There is no adaptive **background** image: `android.adaptiveIcon.backgroundColor` is `#0B0D10` and
a flat PNG would only be a second place to change it.

`expo-splash-screen` centres one image over one background colour and offers no layout, so the
mark and the wordmark are baked into that image together, at `imageWidth: 260`. The tagline that
appears in the splash mock-up cannot be part of it.

**Android 12 and later mask that image into a circle.** The icon is 240dp across and only the inner
160dp is guaranteed to survive, which is why the splash is a square canvas with the lockup fitted
to a centred circle of 160/240 of it — measured by its **diagonal**, because the corners of a wide
wordmark are what the mask cuts first. Laid out to the canvas edges, as it was until Phase 9, the
wordmark lost its last two letters on every launch.

### Design artboards

`assets/design/onboarding-*.svg` are the four introduction screens as 1080×2400 artboards, written
by `scripts/generate-onboarding-screens.py`. They import into Figma as layers — cards as
rectangles, copy as editable text — and are the base the store screenshots are built on rather than
a replacement for them: a listing is more convincing with real screens from the device. The script
reads its copy out of the onboarding components, so the artboards cannot quietly drift from the app.

### dApp Store listing

The first two are written by [`scripts/generate-store-assets.py`](../scripts/generate-store-assets.py),
which loads the mark from the icon generator rather than redefining it:

```bash
python3 scripts/generate-store-assets.py
```

Screenshots are deliberately not generated — they are captured from a real device, because a
listing built from mock-ups is the one thing a reviewer can always tell.

| File                               | Size                                                | Requirement  |
| ---------------------------------- | --------------------------------------------------- | ------------ |
| `assets/store/icon-512.png`        | **512×512**                                         | ✅ generated |
| `assets/store/banner-1200x600.png` | **1200×600**                                        | ✅ generated |
| `assets/store/screenshot-*.png`    | **≥1080px**, identical aspect ratio and orientation | 4–6 of them  |
| `assets/store/preview.mp4`         | ≥720p, 1920×1080 recommended                        | optional     |

### Social / web

| File                                       | Size     | Use                        |
| ------------------------------------------ | -------- | -------------------------- |
| `assets/social/avatar-400.png`             | 400×400  | X / Discord avatar         |
| `assets/social/x-header-1500x500.png`      | 1500×500 | X header                   |
| `assets/social/og-1200x630.png`            | 1200×630 | link preview card          |
| `assets/social/github-social-1280x640.png` | 1280×640 | GitHub repo social preview |

## Screenshot direction

Five screenshots that tell a story in order — a scroller should understand the app from the
first two alone:

1. **Home with 4–5 realistic contacts** — the core value, immediately visible
2. **Contact detail with QR and balance** — depth
3. **Add contact showing `✓ Valid Solana address`** — the trust feature
4. **QR scanner in use** — the speed feature
5. **Empty state or full-screen QR** — polish

Rules:

- Real-looking data. Names like `Alex`, `My Cold Wallet`, `Trading`, `Business`. Never
  `Test 1`, `asdf`, or `Lorem ipsum`.
- Real addresses (public ones — that is what they are for), never obviously fake strings.
- Dark mode. It is the app's default and it looks better in a store grid.
- Identical device frame and aspect ratio across all five.
- Optionally a short caption bar at the top of each image — keep the type large enough to read
  at thumbnail size.
- Capture at device resolution; never upscale.

Capture command:

```bash
adb exec-out screencap -p > screenshot-1-home.png
```

## Voice & tone

- **Plain.** "Save your first Solana wallet address." Not "Onboard your first on-chain identity."
- **Calm.** No hype, no rockets, no "revolutionary".
- **Honest about scope.** It is an address book. Saying so is a feature.
- **Reassuring around money.** Every destructive or money-adjacent message says what will
  _not_ happen: "This does not affect the wallet or any funds."
- No emoji in the product UI. Sparing emoji in social is fine.

## Things to avoid

- Using Solana's official logo or wordmark as if it were ours
- Implying any affiliation with or endorsement by Solana Mobile
- Any wording suggesting the app custodies funds, holds keys, or "secures your wallet"
- Price, APY, or yield imagery — this is not a finance app
- Stock crypto imagery: gold coins, bull/bear art, candlestick charts
