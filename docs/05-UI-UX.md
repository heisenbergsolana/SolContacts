# 05 — UI / UX

## Design intent

Fast and readable first, and good-looking second — but genuinely second, not never. The screen
is allowed to be atmospheric; the address on it is not allowed to be one pixel less legible for
it. _(Revised in Phase 8; before that this section asked for no gradients and almost no motion.)_

- dark-mode only — Solana Night, not a system-following theme (Seeker users live in dark mode)
- few screens, few taps, obvious buttons
- a gradient wash behind the page, gradients on cards and filled controls — never behind a
  wallet address, and never a colour the contrast test does not measure
- motion that answers a question the user just asked: where did that row go, which tab am I on.
  Nothing loops, nothing breathes, nothing animates a number
- generous touch targets (minimum 44×44 dp)
- text truncation never hides an address; addresses are shortened deliberately, not clipped

## Navigation map

```
first run (once)         four steps, skippable — not a route
  └─▶ (tabs)

(tabs)                   floating tab bar, two tabs
  ├─ index                Contacts: the list, search, group filter
  └─ groups               Groups: tiles, counts, create and rename

pushed over the tabs (the bar is not shown on these)
  ├─▶ add                 Add Contact (manual)
  │     └─▶ scan          QR Scanner  ──▶ returns address to the form
  ├─▶ scan                QR Scanner (direct entry point)
  └─▶ contact/[id]        Contact Detail
        ├─▶ contact/[id]/edit    Edit Contact
        └─▶ contact/[id]/qr      Full-screen QR
```

Back always goes one step up. Destructive actions never live behind a swipe alone.

The tab bar floats over the content rather than sitting in a column below it, so the wash runs
the whole height of the screen. Screens leave `TAB_BAR_CLEARANCE` at the bottom of their scroll
content so the last row can always be read. Each tab keeps its own primary action as a floating
button — "add a contact" and "add a group" are different things, and one button in the bar would
have to guess which was meant.

## Screens

### First run

Four steps, shown once, skippable from the first three, with a `‹ Back` on all but the first:

1. **What it is** — the contact book, with rows already in it: search, a pinned contact, a group
   tag, a balance, and the two controls that live on every row
2. **What it never does** — "Not a wallet. Ever.", in the validation colours the rest of the app
   uses for the same job
3. **How an address gets in** — the scanner frame around a code, and the validation tick the app
   shows before it will save anything
4. **What it leaves behind** — the widgets, which are the only part of the app that works without
   opening it. It ends on `Get started`, not on a jump into the scanner: nothing is mounted behind
   the introduction, so there would be nothing to go back to

Step 2 is the one that earns its place. It is the claim the store listing makes, said before the
user hands the app anything. Step 4 exists because nothing else ever tells a first-run user the
widgets are there. Progress is four dots, announced as `Step 2 of 4`.

Every illustration is built from the app's own furniture rather than from stock artwork, and every
code drawn in one is **decorative** — a fixed pattern that does not decode, because an illustration
must never put a scannable address in front of a camera.

The flow renders **in front of** the navigator rather than as a route, so the home screen never
appears behind a redirect and the back gesture cannot reach it afterwards. The seen flag is one
key in `features/onboarding`; if that key cannot be read, the introduction does not appear.

### Home

```
┌────────────────────────────────┐
│  SolContacts                   │
│  ┌──────────────────────────┐  │
│  ┌──────────────────────────┐  │
│  │ 🔍  Search contacts...   │  │
│  └──────────────────────────┘  │
│  ┌──────────────────────────┐  │
│  │ Alex          [QR] [copy]│  │
│  │ 7xK...92P                │  │
│  │ 12.42 SOL                │  │
│  └──────────────────────────┘  │
│  ┌──────────────────────────┐  │
│  │ My Cold Wallet[QR] [copy]│  │
│  │ 8Hd...72Q                │  │
│  │ 4.81 SOL                 │  │
│  └──────────────────────────┘  │
│  [       Add Contact       ]   │
└────────────────────────────────┘
```

**The header is a budget, not a shelf.** Everything above the first contact is spent before the
app has shown what it is for. The wallet card and the price/network strip both used to sit here
and put the first contact about 500 px down an 844 px screen — one visible row in an address book.
Neither survived the read-only cut (ADR-017), and the search field now starts the page.

- Search filters on **name and address**, case-insensitive. Filtering is synchronous: the book is
  a local array of at most a few hundred contacts, so debouncing would add latency and a moving
  target without saving measurable work. Revisit if a profiler shows otherwise.
- The **+** beside the title opens Add Contact. It sat above the tab bar until it was moved into
  the header: floating, it overlapped the bar and covered the last row of the list.
- Balances load lazily per visible row and never block the list.

### Contact Detail

```
┌────────────────────────────────┐
│  ‹ Back              Edit  ⋮   │
│                                │
│  Alex                          │
│  Personal                      │
│                                │
│  7xK4pF...q83n92P              │
│                                │
│  Balance                       │
│  12.42 SOL                     │
│                                │
│      ┌──────────────┐          │
│      │   QR CODE    │          │
│      └──────────────┘          │
│                                │
│  [ COPY ADDRESS ]  [ SHARE ]   │
│  [ VIEW ON SOLANA EXPLORER ]   │
│                                │
│  Note                          │
│  Trading wallet, not cold      │
└────────────────────────────────┘
```

Tapping the QR opens the full-screen QR screen. Tapping the address copies it.

### Add / Edit Contact

```
┌────────────────────────────────┐
│  ‹ Cancel      Add Contact     │
│                                │
│  Name                          │
│  ┌──────────────────────────┐  │
│  │ Alex                     │  │
│  └──────────────────────────┘  │
│                                │
│  Wallet Address        [ SCAN ]│
│  ┌──────────────────────────┐  │
│  │ 7xK4pF...q83n92P         │  │
│  └──────────────────────────┘  │
│  ✓ Valid Solana address        │
│                                │
│  Category (optional)           │
│  ┌──────────────────────────┐  │
│  └──────────────────────────┘  │
│                                │
│  Note (optional)               │
│  ┌──────────────────────────┐  │
│  └──────────────────────────┘  │
│                                │
│        [     SAVE     ]        │
└────────────────────────────────┘
```

Validation states under the address field:

| State                 | Text                                | Color   |
| --------------------- | ----------------------------------- | ------- |
| empty                 | _(nothing)_                         | —       |
| typing, not yet valid | `Keep typing...`                    | muted   |
| invalid               | `✕ Invalid Solana address`          | danger  |
| valid                 | `✓ Valid Solana address`            | success |
| valid + duplicate     | `✓ Valid — already saved as "Alex"` | warning |

**Save is disabled** unless name is non-empty and the address is valid. The disabled state
must be visibly disabled, not just inert.

### QR Scanner

```
┌────────────────────────────────┐
│  ‹ Cancel                      │
│                                │
│     ┌──────────────────┐       │
│     │                  │       │
│     │   [ camera ]     │       │
│     │                  │       │
│     └──────────────────┘       │
│                                │
│  Point at a Solana wallet QR   │
│                                │
└────────────────────────────────┘
```

States to handle explicitly:

- permission not yet requested → explain **why** before asking
- permission denied → explain, offer "Open Settings", offer manual entry instead
- QR scanned, valid address → haptic + return to the form with the field filled
- QR scanned, not a Solana address → toast `Not a Solana address`, keep scanning

### Full-screen QR

Large QR, full address in monospace beneath it, `COPY` and `SHARE` buttons.
Screen brightness is raised while visible (Phase 5) so it scans reliably.

### Group

Where a group tile opens. The members the tile was counting, each as a contact row with its
balance, under the group name, its tone dot, the member count and the group's total.

Two actions: the header's **+** adds a contact already filed into this group, and **Edit group**
opens the rename/recolour/delete form one tap further in. That form used to _be_ this screen, which
meant a tile reading "5 contacts" opened on none of them.

Empty state names the group — "Add a contact to Friends" — and keeps both actions, because a group
can outlive its members and a screen with no way forward is a dead end.

Deleting a group dismisses to the Groups tab rather than stepping back one screen, which would land
on "That group is gone" about the thing the user just chose to delete.

### About

Reached from the ⓘ button beside the title on the Contacts tab, which stays visible when the book
is empty — a first run is exactly when someone wants to read what an app will do with their
addresses before typing one in.

Carries the app version, two cards restating what the app cannot do and why a saved address is not
a verified one, and outbound links to the privacy policy, the terms of use, the source and the
publisher. Every URL comes from `constants/app-config.ts`.

Named About rather than Settings because nothing on it is a setting. The palette is fixed and the
cluster is a build-time switch; adding a control so the name would fit is the wrong way round.

### Empty state

```
        No contacts yet

  Save your first Solana wallet
  address and stop pasting it
  from your notes.

      [   ADD CONTACT   ]
```

### Search — no results

```
  Nothing matches "xyz"

  [ Clear search ]
```

### Delete confirmation

```
┌────────────────────────────────┐
│  Delete Alex?                  │
│                                │
│  This only removes the saved   │
│  contact. It does not affect   │
│  the wallet or any funds.      │
│                                │
│      [ CANCEL ]  [ DELETE ]    │
└────────────────────────────────┘
```

That second sentence is a **required** trust element. Users must never fear that deleting a
contact touches money. `DELETE` is the danger color; `CANCEL` is the default action.

## Design tokens

Defined once in `constants/app-styles.ts` (the template’s file — extend it, do not add a parallel `theme.ts`).

### Color

**Solana Night.** A genuinely black ground rather than a tinted grey, so the two brand colours
are the only thing on screen with any chroma in it. The app does not follow the system light/dark
setting — `useAppTheme()` always resolves to the dark palette below. The light column stays in the
table (and in `constants/app-styles.ts`) as the source values behind the contrast tests, but no
screen in the app renders it.

| Token           | Dark      | Light     | Use                              |
| --------------- | --------- | --------- | -------------------------------- |
| `bg`            | `#07080B` | `#FCFCFD` | screen background under the wash |
| `surface`       | `#101219` | `#F4F5F7` | inputs, chips                    |
| `surfaceAlt`    | `#1A1D26` | `#E9EBEF` | pressed / elevated               |
| `border`        | `#272B36` | `#DDE0E6` | hairlines                        |
| `borderStrong`  | `#333845` | `#C8CCD4` | the two surfaces that float      |
| `text`          | `#F7F9FC` | `#0B0D12` | primary text                     |
| `textMuted`     | `#98A2B3` | `#55606F` | secondary text, addresses        |
| `textOnFill`    | `#000000` | `#000000` | ink on a filled control          |
| `primary`       | `#9945FF` | `#9945FF` | Solana purple                    |
| `accent`        | `#14F195` | `#067045` | Solana green — success, valid    |
| `danger`        | `#FF6B6B` | `#C4271B` | destructive text, invalid        |
| `dangerSurface` | `#F2555A` | `#F2555A` | destructive button fill          |
| `warning`       | `#FDB022` | `#8A4B00` | duplicate warnings, the pin star |

**The ink is black, and that is the whole system.** Every fill in this palette is bright and every
label on one is dark. It is not a style choice — it is what makes the primary gradient possible.
Under _white_ text a fill has to stay dark at both ends to clear 4.5:1 while still clearing 3:1
against the screen, and the band left between those two constraints is narrow enough that any
gradient inside it comes out as two shades of one violet. Black ink inverts the problem: the
brighter the fill, the better the label reads. So the fill can be as loud as the brand is.

It also collapses a token. `dangerSurface` is one value in both themes, because a fill bright
enough to read black text is also dark enough to separate from a white page.

### Gradients

Five, and no more. Every one is a two-stop `Gradient` tuple on the palette, so a token drops
straight into `expo-linear-gradient`.

| Token         | Use                                                 |
| ------------- | --------------------------------------------------- |
| `glowPrimary` | one violet radial corner glow, over the global wash |
| `primary`     | filled controls: buttons, the active tab, the **+** |
| `card`        | every card and row                                  |
| `cardPressed` | the same card, held down                            |
| `bar`         | the floating tab bar                                |

`primary` in dark is Solana's own pair at full strength — `#9945FF → #14F195`. Light needs a
deeper green at the far end (`#0B8F5A`), because mint on white does not separate from the page;
the near stop is untouched.

The base wash behind every screen is not a token: it is the navy-to-near-black radial glow drawn
once, globally, by `components/dark-glow-background.tsx` (`#1a2235` at centre fading to `#111114`
at the edges), sitting behind the whole navigator in `app/_layout.tsx`. `glowPrimary` is one violet
radial SVG rectangle layered on top of it per screen, in `components/ui/screen-background.tsx` —
affordable at one per screen and not at one per row. There is no green glow in the background on
purpose: the green in `primary` stays on small, brand-labelled fills, never on the ambient wash.

### Group tones

`mint`, `cyan`, `violet`, `pink`, `amber`, `blue`, `lime`, `rose` — eight, because past that
they stop being tellable apart at chip size. The names live in `types/contact.ts` because they
are **stored**; the hexes live in the palette and may change freely.

A tone is held to the _text_ threshold, not the graphic one, on every background a chip can land
on. And selection is never signalled by tone alone: a selected chip gains a tick and a coloured
edge, a selected swatch gains a ring.

**Contrast is enforced, not promised.** `constants/app-styles.test.ts` asserts 4.5:1 for every
text colour on every surface it can land on — both ends of every surface gradient, all sixteen
group tones — and 3:1 for button fills and the progress bar, in both themes. Changing a colour
that fails the bar fails the build.

### Spacing

4-point scale: `xs 4`, `sm 8`, `md 12`, `lg 16`, `xl 24`, `xxl 32`.
Screen horizontal padding is `lg`. Card padding is `lg`. Gap between cards is `md`.

### Typography

| Token     | Size / weight                          | Use                              |
| --------- | -------------------------------------- | -------------------------------- |
| `display` | 28 / 700 Space Grotesk                 | screen titles                    |
| `title`   | 20 / 600 Space Grotesk                 | contact name                     |
| `body`    | 16 / 400                               | general                          |
| `label`   | 13 / 500 uppercase, letter-spacing 0.5 | field labels                     |
| `mono`    | 15 / 400 monospace                     | addresses — **always monospace** |
| `caption` | 12 / 400                               | helper text                      |

Only the two headline tokens carry the display face. Body text, labels and addresses stay on the
system font: a screen typeset entirely in a display face reads as a poster, and this one has
wallet addresses on it. `features/display/use-app-fonts.ts` loads the two weights and lets the
app paint even when loading fails — a heading in the system face beats a screen held forever
behind a font file.

### Radii & elevation

`radius.sm 8`, `radius.md 12`, `radius.lg 16`, `radius.xl 20`, `radius.xxl 24`, `radius.full 999`.
`xl` is cards, rows and group tiles; `xxl` is the two things that float.
No drop shadows in dark mode — use `surface` contrast and `border` instead.

## Address display rules

- **Shortened form:** first 4 + `…` + last 4 characters (`7xK4…92Pq`) in lists.
- **Full form:** always monospace, always selectable, shown on Detail and QR screens.
- Never truncate an address with CSS ellipsis — always use the explicit shortener in
  `utils/ellipsify.ts`, so the rule is consistent everywhere.

## Feedback & motion

| Event               | Feedback                                                  |
| ------------------- | --------------------------------------------------------- |
| Copy address        | Toast `Copied!` (1.5s) + light haptic                     |
| Save contact        | Navigate back + toast `Saved`                             |
| Delete contact      | Navigate back + toast `Contact deleted`                   |
| Valid address typed | `✓` fades in, no layout shift                             |
| Balance loading     | Inline shimmer in the balance slot only                   |
| Balance failed      | `Balance unavailable · Retry` — never a full-screen error |
| Slow save           | Spinner inside the button, label says what is happening   |

Motion answers a question the user just asked, and nothing else.

| Moment            | What happens                                                                   |
| ----------------- | ------------------------------------------------------------------------------ |
| Tab switch        | the pill slides on a spring (damping 18, stiffness 220); the label fades in    |
| Tab scenes        | **none** — see below                                                           |
| Rows appearing    | **none** — see below                                                           |
| Pin / unpin       | the row slides to its new place under `LinearTransition`                       |
| Screen transition | the navigator's own                                                            |
| Balances          | **never** — a number that counts up is a number nobody can read while it moves |

Two of those used to be animations and are now deliberately nothing. Both were removed for the
same reason, found during the Phase 7 device pass: **an animation that sets a starting opacity and
then fails to run leaves the content invisible, and it fails silently.**

- **Tab scenes.** `animation: 'shift'` (and `'fade'`) interpolate the scene's opacity from a value
  that starts at 1 — meaning transparent — for every unfocused tab. Tabs are lazy, so the Groups
  scene first mounted on the same commit that started the native-driver animation meant to reveal
  it, and when that animation started before the scene was attached natively, the tab laid out
  perfectly at `opacity: 0`. `'none'` is the only preset that applies no scene style at all.
- **List rows.** Reanimated's `entering` has the same shape of failure: a `FadeInDown` that never
  runs leaves the row at its starting values. `ListEntrance` keeps only `LinearTransition`, which
  animates _from_ a laid-out state and so cannot hide anything.

The tab bar's pill and the navigator's own screen transition already answer "which tab am I on"
and "where did I come from". Nothing else needed to.

The background is one static glow mesh behind the whole navigator
(`components/dark-glow-background.tsx`). Nothing loops and nothing breathes: a screen sits open
while someone reads an address off it, and an animation running the whole time costs battery
for it.

Every one of these is inert under "remove animations", the layout transitions included — those
are the ones that would otherwise still be moving after everything else had stopped.

### Skeleton or spinner

Two indicators, and the choice between them is not taste:

- **Skeleton** (`components/ui/skeleton.tsx`) wherever the shape of the result is already known
  — a balance, a list row. It occupies exactly the space the value will, so nothing jumps when
  the value arrives.
- **Spinner** (`components/ui/spinner.tsx`) for a wait with no layout to hold: a save in flight.
  It lives inside the button that started the wait, beside a label that says what is happening —
  the button never trades its words for a spinner.
- **`components/ui/loading-state.tsx`** is that spinner centred with a label, and it is what a
  screen shows when it knows _nothing_ yet: the root hold before the display face is in scope, a
  screen opened by a deep link before storage has answered. Those screens used to render blank, or
  — worse — say "That contact no longer exists" about a contact that was merely still being read.

A full-screen spinner over **partial** data is still an anti-pattern: whatever is known gets a
skeleton in its own slot, and the spinner is for the case where nothing is.

Both stop dead when "remove animations" is on: the skeleton holds at 35% opacity and the
spinner holds its arc, rather than looping at something someone has just asked to stop.

## Accessibility

- Every icon-only control has an `accessibilityLabel`.
- Addresses get an `accessibilityLabel` that reads the **full** address, not the shortened one.
- Contrast: body text ≥ 4.5:1 against its background in both themes.
- Respect `prefers-reduced-motion` — skip toasts' slide animation.
- Support Dynamic Type up to 200% without clipping; test at the largest font setting.
- The QR scanner must always offer a manual-entry alternative for users who cannot use a camera.
