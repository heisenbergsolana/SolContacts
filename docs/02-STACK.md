# 02 — Technology Stack

Every decision here was verified against **current official documentation in September 2026**,
not from memory or from tutorials. Each entry records the decision, the reason, the source,
and what was rejected. When a decision changes, edit this file in the same commit.

> **Rule:** before adding or upgrading any dependency, re-verify against
> <https://docs.solanamobile.com/llms.txt> and the package's own docs.

---

## ADR-001 — Expo (with dev client), not bare React Native

**Decision:** React Native via **Expo SDK 57** (RN 0.86, React 19.2), using
`expo-dev-client` custom development builds.

**Why:**

- Every official Solana Mobile React Native template is Expo-based.
- Expo's Continuous Native Generation removes the need to hand-maintain the `android/` folder.
- The `solana-mobile` CLI scaffolds Expo projects.

**Critical constraint: Expo Go does not work.** The home-screen widget is a local Expo module
with Kotlin in it, and Expo Go only bundles a fixed set of modules. A **custom development
build** is mandatory — locally via `expo run:android`, or through EAS.

**Rejected:** bare React Native CLI (unnecessary native maintenance for a 5-screen app);
Expo Go (cannot load a local native module).

**Source:** <https://docs.solanamobile.com/react-native/expo>, <https://expo.dev/changelog/sdk-57>

---

## ADR-002 — `@solana/kit`, not `@solana/web3.js` v1

**Decision:** Use **`@solana/kit`** as the Solana JavaScript library.
**As built: `@solana/kit@7.1.1`**, pinned `^7.0.0` from the template. npm's latest is 8.x; a
bump is a deliberate change with its own verification pass, not a routine update.

**Why:**

- `@solana/web3.js` v2 was renamed to `@solana/kit`; it is the recommended library for new code.
- Tree-shakeable functional API — we import `isAddress` and an RPC client, not a class hierarchy.
  Meaningfully smaller bundle on mobile.
- Address validation becomes a pure function call, which is trivially unit-testable.
- All current `expo-kit-*` Solana Mobile templates are built on it.

**Rejected:** `@solana/web3.js` v1 (legacy branch, heavier, class-based);
`@solana/web3.js@rc` v3 compatibility bridge (only useful when migrating an existing v1 codebase).

**Source:** <https://solana.com/docs/frontend/web3-compat>, <https://github.com/anza-xyz/kit>

---

## ADR-003 — Scaffold from `expo-kit-minimal`

**Decision:** Start from the official template:

```bash
npx solana-mobile@latest create solcontacts --template expo-kit-minimal
```

**Why:** The polyfill entry point, dev client config, Metro config, and Kit wiring are
easy to get subtly wrong. The official minimal template gets them right and carries no
UI framework we would have to strip out.

**Rejected:** `create-expo-app` from scratch (we would re-derive the polyfill setup by trial
and error); `expo-kit-wallet` (bundles wallet-connect UI we do not need until Phase 6);
`expo-kit-uniwind` / `expo-kit-anchor` (Tailwind and Anchor are both out of scope).

**Source:** <https://docs.solanamobile.com/cli/create.md>,
<https://github.com/solana-mobile/templates/blob/main/TEMPLATES.md>

---

## ADR-004 — AsyncStorage behind a repository interface

**Decision:** `@react-native-async-storage/async-storage`, accessed **only** through a
`ContactsRepository` interface in `features/contacts/`.
**As built:** already a template dependency (`2.2.0`), and `vitest-native` ships a mock preset
for it — so it is also the cheapest option to test.

**Why:**

- Officially supported in Expo, zero native risk, works on the first try.
- An address book is a small dataset — a few hundred contacts at most. A JSON document
  read once at startup and written on mutation is entirely adequate.
- The interface means swapping the backing store later touches exactly one file.

**Rejected:** `react-native-mmkv` (faster and synchronous, but adds Nitro native modules —
unjustified risk for a first Solana Mobile project); `expo-sqlite` (real indexed queries,
but migrations and boilerplate are overengineering at this size).

**Revisit if:** contact counts exceed ~1,000, or list rendering measurably stalls.

---

## ADR-005 — expo-router for navigation

**Decision:** File-based routing with **expo-router**.

**Why:** Default in Expo SDK 57 and in the Solana Mobile templates; the documented polyfill
entry point (`index.js` → `expo-router/entry`) assumes it. Deep links (useful later for
`solana:` URIs and dApp Store listing links) come for free.

**Rejected:** React Navigation configured by hand (more wiring, no benefit here).

---

## ADR-006 — Plain StyleSheet + a central theme, no CSS framework

**Decision:** React Native `StyleSheet` with design tokens in `constants/app-styles.ts`
(the template's file — extend it, do not add a parallel `theme.ts`).

**Why:** Five screens. A styling framework would add a dependency, a build step, and a
learning curve to save very little. Tokens in one file give consistency without machinery.

**Rejected:** Uniwind / NativeWind / Tailwind (unnecessary), styled-components (runtime cost).

---

## ADR-007 — `expo-camera` for QR scanning

**Decision:** `expo-camera`'s `CameraView` with `onBarcodeScanned` and
`barcodeScannerSettings={{ barcodeTypes: ["qr"] }}`.

**Why:** `expo-barcode-scanner` is **deprecated**; scanning is now built into `expo-camera`
with no extra package.

**Rejected:** `react-native-vision-camera` (more powerful, more setup — not needed to read
one QR code).

**Source:** <https://docs.expo.dev/versions/latest/sdk/camera/>

---

## ADR-008 — `react-native-qrcode-svg` for QR generation

**Decision:** `react-native-qrcode-svg` with its `react-native-svg` peer dependency.

**Why:** The standard, maintained choice; renders as SVG so it stays crisp at any size and
can be shared or screenshotted cleanly.

---

## ADR-009 — Mobile Wallet Adapter via `@wallet-ui/react-native-kit` _(superseded by ADR-017)_

**Decision:** Use **`@wallet-ui/react-native-kit`** (the Kit-based wrapper) rather than the raw
protocol packages.

**As built: this is already wired up from Phase 1**, not deferred to Phase 6. The template
ships `@wallet-ui/react-native-kit@4.3.0`, the `react-native-quick-crypto` polyfill, and
`MobileWalletProvider` in `components/app-providers.tsx`. Phase 6 is therefore about _using_
the wallet (connect, sign), not about installing it.

Polyfill setup (already in place — must run before any Solana import):

```js
// polyfill.js
import { install } from 'react-native-quick-crypto'
install()

// index.js
import './polyfill'
import 'expo-router/entry'
```

with `"main": "./index.js"` in `package.json`.

**Why:** Current docs recommend this wrapper for new apps; it exposes `MobileWalletProvider`
and `useMobileWallet` instead of hand-rolled session management.

**Rejected:** `@solana-mobile/mobile-wallet-adapter-protocol-web3js` directly (peer-depends on
web3.js v1, which contradicts ADR-002).

**Source:** <https://docs.solanamobile.com/get-started/react-native/installation.md>

---

## ADR-010 — Android only for v1.0

**Decision:** Ship Android. No iOS target.

**Why:** The Solana dApp Store distributes Android APKs; MWA on iOS is a different, more
limited flow. Adding iOS doubles the testing surface for zero launch value.

---

## Supporting choices

| Concern      | Choice                                                           | Note                                             |
| ------------ | ---------------------------------------------------------------- | ------------------------------------------------ |
| Language     | TypeScript, `strict: true`                                       | No `any`                                         |
| Lint         | ESLint + `eslint-config-expo`                                    |                                                  |
| Format       | Prettier                                                         | 2-space, single quotes, trailing commas          |
| Tests        | `vitest` + `vitest-native` + `@testing-library/react-native` v14 | **Not jest.** See ADR-011                        |
| Clipboard    | `@react-native-clipboard/clipboard`                              | Template dependency; not `expo-clipboard`        |
| Server state | `@tanstack/react-query`                                          | Template dependency; used for balance fetching   |
| Share        | React Native's built-in `Share` API                              | Native sheet, no custom UI                       |
| Linking      | `expo-linking` / `Linking`                                       | Explorer deep links                              |
| Haptics      | `expo-haptics`                                                   | Phase 5 polish only                              |
| Brightness   | `expo-brightness` `~57.0.1`                                      | QR screen only. See ADR-013                      |
| Home widget  | Local Expo module + `com.google.zxing:core` `3.5.3`              | Android only, native. See ADR-015                |
| Gradients    | `expo-linear-gradient` `~57.0.1`                                 | Surfaces and fills only. See ADR-016             |
| Display face | `@expo-google-fonts/space-grotesk` `0.4.1`                       | Two weights, imported by sub-path. Headings only |

## Verified environment (this machine, 2026-09-04)

| Tool              | Version         | Status                                               |
| ----------------- | --------------- | ---------------------------------------------------- |
| Node.js           | 24.7.0          | OK                                                   |
| npm               | 11.14.1         | OK                                                   |
| JDK               | OpenJDK 17.0.20 | OK                                                   |
| Android SDK       | `~/Android/Sdk` | Present (build-tools, platform-tools, ndk, emulator) |
| git               | 2.43.0          | OK                                                   |
| GitHub CLI (`gh`) | not installed   | Optional — see `13-GIT-WORKFLOW.md`                  |

Re-verify anytime with `npx solana-mobile@latest doctor`.

---

## ADR-011 — vitest, not jest _(added Phase 1)_

**Decision:** Test with **`vitest` + `vitest-native`**, as the template ships.

**Why:** `vitest-native` resolves the _real_ `react-native@0.86` against `platform: 'android'`
and mocks the native modules through presets, rather than transforming everything through a
Babel/jest pipeline. It is what the official template is configured and tested against, and it
starts in well under a second.

**Rejected:** `jest-expo` (planned in Phase 0 from prior convention — the template's actual
choice supersedes it; migrating would mean rewriting `vitest.config.mts`, the native-module
presets, and `test/test-utils.tsx` for no gain).

**Consequence:** use `vi.fn()` / `vi.mock()`; there is no `jest` global. RNTL v14's `render`
is async — always `await` it.

---

## ADR-012 — Adopt the template's flat layout, not a `src/` tree _(added Phase 1)_

**Decision:** Keep the template's root-level `app/ components/ constants/ features/ utils/
test/` layout with the `@/*` alias.

**Why:** `tsconfig.json` defines `@/*` against the project root, `vitest.config.mts` mirrors
that alias and sets coverage `include` globs per folder, and every Solana Mobile example is
written this way. Moving everything under `src/` means editing all of that to look less like
the ecosystem it belongs to.

**Rejected:** the `src/` layered tree planned in Phase 0. Its _principles_ survive intact in
`docs/03-ARCHITECTURE.md` — only the folder names changed.

---

## ADR-013 — `expo-brightness`, without its config plugin _(added Phase 5)_

**Decision:** Add `expo-brightness@~57.0.1` to raise the screen while the QR code is on it, and
**do not** register its config plugin in `app.json`.

**Why:** a QR code shown from a dark theme on a dimmed screen is one the other phone's camera
has to work for, and [docs/05-UI-UX.md](05-UI-UX.md) has promised the boost since Phase 0. No
amount of our own code substitutes for a native display call.

The plugin is left out on purpose: all it does is add `android.permission.WRITE_SETTINGS`, which
`setBrightnessAsync` — the activity-scoped call this app uses — does not need. Only the
system-wide setter does, and changing a device-wide setting to show a QR code is not something
this app should be able to do. The permission list stays as short as
[docs/07-SECURITY-PRIVACY.md](07-SECURITY-PRIVACY.md) claims.

**Cost:** a native module, so the dev client has to be rebuilt.

---

## ADR-014 — `@solana-program/system` pinned to `0.13.0` _(added Phase 6, superseded by ADR-017)_

**Decision:** Add `@solana-program/system` for the SOL transfer instruction, pinned exactly to
`0.13.0`.

**Why:** Phase 6 sends SOL, which needs a System Program transfer instruction. Hand-encoding one
is four bytes of discriminator and a u64 — and getting either wrong sends money somewhere
unintended, which is not a place to save a dependency. This is the canonical generated client,
pure TypeScript, no native code.

**Why pinned, and why not `latest`:** the current release, `0.14.1`, peers on `@solana/kit@^8`.
This project is on kit `7.1.1`, and `0.13.0` is the last release that peers on `^7.0.0`. An
unpinned range would silently pull a version that does not match the kit in the tree. Revisit
when the app moves to kit 8.

---

## As built — verified after `npm install` (Phase 1)

| Package                                   | Version |
| ----------------------------------------- | ------- |
| expo                                      | 57.0.20 |
| react-native                              | 0.86.2  |
| react                                     | 19.2.3  |
| typescript                                | 6.0.3   |
| @solana/kit                               | 7.1.1   |
| @react-native-async-storage/async-storage | 2.2.0   |
| @tanstack/react-query                     | 5.x     |
| vitest                                    | 4.1.11  |

**Formatting** (Prettier, enforced): no semicolons, single quotes, print width 120, trailing
commas. **File naming:** kebab-case throughout.

### Known advisories

`npm audit` reports **15 moderate** issues, all transitive through Expo's own build tooling
(`@expo/cli`, `@expo/config*`, `expo-router`, `xcode`) via `query-string` →
`decode-uri-component`, plus `uuid` under `react-native-quick-crypto`.

These are build-time tooling paths, not attack surface in the shipped bundle, and
`npm audit fix --force` would downgrade Expo itself. **Decision: accept and re-check each
Expo upgrade.** Revisit before the Phase 7 release build.

---

## ADR-015 — The home-screen widget is a local Expo module, and encodes its own QR _(added Phase 6)_

**Decision:** ship the widget as a local Expo module in `modules/contact-widget/`
(`expo.autolinking.nativeModulesDir` → `./modules`), and add `com.google.zxing:core:3.5.3` to
**that module only** — not to the app.

**Why a local module rather than a config plugin:** `/android` is generated and gitignored, so
native code cannot simply live there. The two ways to survive a prebuild are a config plugin that
writes files, or a module the autolinker picks up. A plugin would mean maintaining Kotlin and XML
as strings inside a TypeScript file, with no compiler and no syntax highlighting; a local module is
ordinary native source in ordinary native locations.

**Why zxing rather than reusing `react-native-qrcode-svg`:** a home-screen widget is `RemoteViews`.
It has no React Native runtime, and the launcher asks it to redraw after a reboot, on resize, and
with the app force-stopped. A code drawn by JavaScript could not answer any of those. zxing is a
pure-Java encoder, ~500 KB, and lives in the widget module's classpath rather than the app's.

**Why three receivers:** a launcher's picker lists widget _providers_, and a provider declares one
size. Offering 2x2, 2x1 and 4x1 up front therefore means three receivers over the same code —
`ContactWidgetProvider` and two subclasses that differ only in the `appwidget-provider` metadata
they carry. Which of the three layouts is drawn stays a function of the size the widget ends up at,
so resizing still works: under two grid rows the widget is a strip — name, address, copy button,
and the code as well once it is three cells wide — and above that it is the square, or the full
panel at four cells across. Sizes are read from the **portrait** pair of the options bundle
(`OPTION_APPWIDGET_MIN_WIDTH` with `OPTION_APPWIDGET_MAX_HEIGHT`); measuring against the landscape
height is what used to leave a third of the widget empty.

**Why the widget repaints the app's background:** it is the same product, and a flat grey card on
a wallpaper looked like a different one. `drawable/widget_surface.xml` is the glow mesh from
`components/dark-glow-background.tsx` rebuilt as a layer-list — three radial sources instead of
four, three stops each instead of four, because a shape's gradient allows no more. Change the mesh
in one place and the other has to follow.

**Why no configuration activity:** Android's own answer to "which contact is this widget for" is
`android:configure`, an activity the launcher starts the moment the widget is dropped. That
activity would have to be the React Native one, started in a mode where it returns `RESULT_OK` with
the widget id and finishes — a second entry point into the app with its own lifecycle, for one
choice. Instead an unbound widget says so and taps through to `solcontacts://widget/<appWidgetId>`,
where the app lists the book and binds the choice through `bindWidget`. One entry point, and the
same screen serves a widget whose contact was later deleted.

**What the widget is allowed to know:** id, name and address, pushed to the module's own
`SharedPreferences` whenever the book changes. Never a note, never a category. Public addresses
only, as everywhere else — see [07-SECURITY-PRIVACY.md](07-SECURITY-PRIVACY.md).

---

## ADR-016 — `expo-linear-gradient` for surfaces, `react-native-svg` for the glows _(added Phase 8)_

**Decision:** add `expo-linear-gradient@~57.0.1` and draw every two-stop fill with it — cards, rows,
buttons, the tab bar. The screen's corner glows are radial, which that library cannot draw, so they
come from `react-native-svg`'s `RadialGradient`, which is already a dependency.

**Why a dependency at all:** the alternatives are worse. A stack of translucent `View`s approximates
a gradient in visible bands; an image asset is fixed at one size and one theme, and this app has
two. `expo-linear-gradient` is Expo's own, versioned with the SDK, ~0 JS and a thin native view.

**Why not `react-native-svg` for everything:** an `Svg` per card means a view that has to be sized
before it can paint, and a row whose background arrives a frame after its text. `LinearGradient`
takes a style like any other view. The glows are the exception because there is exactly one `Svg`
in the app — the mesh behind the whole navigator — and nothing sizes to it.

**The constraint that shapes the palette:** a gradient that carries a label must clear 4.5:1 at
_both_ ends, and a filled control must clear 3:1 against the screen — pulling in opposite
directions, which leaves a narrow band for anything under white text.
`constants/app-styles.test.ts` holds both ends of the primary gradient inside it, which is why the
bold gradients in the design are the ones with no text on them.

---

## ADR-017 — Ship read-only: no Mobile Wallet Adapter _(added Phase 9, supersedes ADR-009 and ADR-014)_

**Decision:** remove the wallet connection, the Send SOL flow, and with them
`@wallet-ui/react-native-kit` and `@solana-program/system`. The app reads balances over RPC and
does nothing else on the network.

**Why:** the connection paid for itself in exactly one place — saving your own address as a
contact — and cost a wallet round trip, a session to cache, a failure surface to word, and a
native dependency to keep in step with the SDK. Sending was the feature that justified all of it,
and an address book is not where people send from.

**What replaces the RPC client it provided:** `features/rpc/solana-rpc.ts`, a plain
`createSolanaRpc` over the endpoint in `constants/app-config.ts`. It is never handed a signer,
which makes "this app cannot sign" a property of the code rather than a promise in a document.

**Cost:** saving the user's own address now means scanning or pasting it like any other. Sign-in
with Solana and `.skr` name resolution both move out of reach without a new decision here.

**Kept:** the `react-native-quick-crypto` polyfill in `polyfill.js`. It runs before any Solana
import and kit's own paths still expect it; removing it is a separate change with its own device
pass.
