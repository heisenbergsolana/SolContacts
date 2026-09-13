# 09 — Roadmap

Guiding principle: **small → useful → stable → polished → Seeker-ready.**

Each phase ends with `npm run lint && npm run typecheck && npm test` green, a commit, and a
git tag. Nothing moves to the next phase while the current one has known breakage.

Mark items `[x]` as they land. This file is the single source of truth for project status.

---

## Phase 0 — Foundation ✅

- [x] Verify current Solana Mobile / Expo / dApp Store documentation
- [x] Choose and record the technology stack with sources
- [x] Write the project documentation set (`docs/01`–`docs/13`)
- [x] Write `README.md`, `LICENSE`, `.gitignore`
- [x] `git init` + first commit

**DoD:** the plan is written down and reviewable before a single dependency is installed.

---

## Phase 1 — Project setup ✅

- [x] Scaffold into a temp directory:
      `npx solana-mobile@latest create solcontacts --template expo-kit-minimal`
- [x] `npm run reset-project` — strip the demo, keep the SDK wiring
- [x] Merge the scaffold into this repository, preserving `docs/` and `.git/`
- [x] Preserve `utils/ellipsify.ts`, `test/test-utils.tsx` and `e2e/` from the reset
- [x] `npm install` — 1068 packages, 15 moderate advisories reviewed and accepted (ADR in `02-STACK.md`)
- [x] `app.json`: name `SolContacts`, package `com.solcontacts.app`, `userInterfaceStyle: automatic`
- [x] `constants/app-config.ts`: identity `SolContacts`
- [x] `package.json`: `typecheck` script added, metadata set, version `0.0.1`
- [x] Merge `.gitignore` (template's + our keystore/env rules)
- [x] Keep the template's Apache-2.0 licence as `LICENSE-TEMPLATE-APACHE-2.0` alongside our MIT
- [x] TypeScript `strict: true` (already on in the template)
- [x] `npm run typecheck`, `npm run lint:check`, `npm test` all green (6 tests)
- [x] Update the Phase 0 docs to match what the template actually ships (vitest not jest,
      flat layout not `src/`, kit 7.1.1, MWA already wired) — ADR-011, ADR-012
- [x] Launch on the physical Seeker (Android 16 / API 36, arm64-v8a) via `npm run android`
- [x] Align dependencies with `npx expo install --fix` (react-native 0.86.3, reanimated 4.5.1 pinned)
- [x] Route stubs: Home, Add, Scan, Contact detail, Edit, QR — plus `Screen` and `Button` primitives
- [x] Extend `constants/app-styles.ts` with the tokens from [05-UI-UX.md](05-UI-UX.md) and a `useAppTheme()` hook

**DoD:** an empty but correctly structured app launches on the Seeker; lint, typecheck and
test all pass. → tag `v0.0.1`

## Phase 2 — Contact MVP ✅

_No network calls in this phase at all. The app must be fully useful offline._

- [x] `types/contact.ts` — `Contact`, `ContactId`, `ContactsDocument`
- [x] `types/result.ts` — `Result<T, E>`
- [x] `utils/id.ts` — UUID v4 generation
- [x] `features/contacts/contacts-repository.ts` — the interface
- [x] `features/contacts/contacts-storage.ts` — the implementation, with a write queue
- [x] `features/contacts/contacts-migrations.ts` — `schemaVersion` handling
- [x] `features/contacts/contacts-service.ts` — normalization, validation, duplicate detection
- [x] `features/contacts/use-contacts.tsx` — load once, expose CRUD
- [x] Home: contact list + search + empty state
- [x] Add Contact screen (manual entry) with live address validation
- [x] Contact Detail screen
- [x] Edit Contact screen
- [x] Delete with the confirmation dialog from [05-UI-UX.md](05-UI-UX.md)
- [x] Tests: repository CRUD, corrupt data handling, service normalization, search, migrations, form validation (94 total)

**DoD met.** Verified on physical Seeker hardware: create → list → force-stop and relaunch →
contact still there → detail → delete behind the confirmation → empty state. A failed write is
surfaced rather than swallowed, and covered by a test. → tag `v0.2.0`

---

## Phase 3 — Solana functionality ✅

- [x] `constants/app-config.ts` — mainnet in both dev and prod _(read-only in v1, and devnet would report 0 SOL for every real address; revisit in Phase 6)_
- [x] `utils/solana-address.ts` — `isValidSolanaAddress` _(pulled forward into Phase 2: it is a pure offline function, and the service layer's job is to guard writes)_
- [ ] Wire validation into the Add/Edit form: live feedback, save blocked on invalid _(service-side validation already done in Phase 2)_
- [x] Duplicate-address warning in the form
- [x] Balance reads via `useMobileWallet().client.rpc` with timeout and cancellation
- [x] `utils/lamports-to-sol.ts` — `formatSol` with **bigint** math (the template shipped the float bug)
- [x] `features/balance/use-balance.tsx` — React Query: loading / error / retry, cancel on unmount
- [x] Balance on the contact detail screen and in list rows
- [x] `utils/solana-explorer.ts` + "View on Solana Explorer" button
- [x] Tests: address validation table, `formatSol` precision, explorer URL building, integer grouping

- [x] **Pulled forward from post-1.0 at the maintainer's request:** live SOL price card (Jupiter)
      and a Solana network stats card (epoch, slot, TPS, epoch progress) on the home screen

**DoD met.** Verified on physical Seeker hardware against mainnet: the SPL Token program address
reports 198796820 lamports over RPC and the app displays exactly `0.1987 SOL`. An invalid address
cannot be saved, and a failed lookup reads "Balance unavailable" rather than `0 SOL`. → tag `v0.3.0`

---

## Phase 4 — QR ✅

- [x] `expo-camera` installed; permission string in the `app.json` config plugin
- [x] Scanner screen with the full permission flow (explain → request → denied → settings), manual entry offered in every state
- [x] `utils/qr-payload.ts` — payload parsing (pure, 22 tests)
- [x] Scan → parse → validate → prefill the Add form
- [x] Invalid QR feedback without leaving the scanner
- [x] `react-native-qrcode-svg` QR generation, with a white quiet zone in both themes
- [x] Full-screen QR screen
- [x] Copy address (`@react-native-clipboard/clipboard`) with `Copied!` feedback, on both the detail and QR screens
- [x] Share via the native `Share` API
- [x] Tests: the complete QR payload parsing table, including Solana Pay and non-Solana codes

**DoD met.** Verified by the maintainer on the Seeker: the permission explanation precedes the
system dialog, a wallet QR prefills a valid address, a non-Solana QR is refused without leaving the
scanner, every contact renders a scannable QR, and copy and share both behave. → tag `v0.4.0`

---

## Phase 5 — Polish

- [x] Dark and light themes finalized and checked for contrast — the light theme's green was
      2.4:1 on a card, and the destructive button needed a fill distinct from its text colour.
      `constants/app-styles.test.ts` now asserts the whole grid in both themes.
- [x] Loading shimmers, not spinners, for balances — plus the price card, the network card and
      the contact list; the pulse stops when "remove animations" is on
- [x] Every error state has copy, and a retry where retrying makes sense — one `RetryNotice`
      serves the balance slot and both home cards
- [x] Edge cases: very long names, 500+ contacts, duplicate addresses, `0 SOL`, offline,
      airplane mode mid-request, denied camera permission, corrupt storage - 500+ contacts turned up a real bug: one `useBalance` per row meant one RPC request per
      contact. Now a single batched `getMultipleAccounts` per hundred addresses. - A long category no longer squeezes the name out of its row. - `0 SOL`, a missing account and a failed lookup are three different things on screen,
      and a test holds them apart.
- [x] Accessibility pass: labels, contrast, 200% font size, reduced motion
- [x] Haptics on copy / save / delete — with Android's own toast, not an in-app imitation
- [x] Screen brightness boost on the QR screen — ADR-013
- [x] ~~Seeker-specific touches~~ — **dropped.** Nothing in the docs made it more than a
      cosmetic "Seeker detected" badge, which is decoration, not a feature.
- [x] Cold start performance measured on a real device
- [x] `npm audit` — re-checked: still the same 15 moderate advisories, all transitive through
      Expo's build tooling. The ADR in `02-STACK.md` stands; revisit at the Phase 7 release build.

**DoD met.** Verified by the maintainer on the Seeker after a full native rebuild: skeletons
where the spinners were, every balance arriving from one batched read, `… unavailable · Retry`
across all three slots in airplane mode and recovering on tap, native toasts and haptics on copy,
save and delete, the QR screen brightening and handing the brightness back on the way out, the
light theme's validation text readable, 200% font size without clipping, no pulse with animations
turned off, and a long name and a long category sharing one row. → tag `v0.5.0`

---

## Phase 6 — Wallet integration _(shipped, then removed in Phase 9 — see ADR-017)_

> **Everything below was built and then taken back out.** It is kept as the record of what was
> tried and what it cost; nothing here is in the app any more.

> The plumbing already exists from Phase 1: `@wallet-ui/react-native-kit`,
> `MobileWalletProvider`, and the `react-native-quick-crypto` polyfill. This phase is about
> _using_ it. `e2e/fakewallet.sh` drives the flows without a real wallet.

- [x] Connect wallet via Mobile Wallet Adapter
- [x] "Save my wallet as a contact" — prefills the Add form rather than writing behind the user
- [x] MWA authorization caching — **already provided.** `MobileWalletProvider` builds an
      `AsyncStorageCache` under the key `authorization-cache` and restores it on mount. Verified in
      the library source rather than reimplemented.
- [x] Only then: Send SOL, signed exclusively by the external wallet - `EXPO_PUBLIC_CLUSTER=devnet` makes a transfer testable where a mistake costs nothing - amounts parse through `utils/sol-amount.ts` as exact `bigint` string arithmetic - the source signer and the fee payer are the same object, because kit refuses a message
      carrying two signers for one address — see [06-SOLANA.md](06-SOLANA.md)
- [x] ~~SIWS~~ — **dropped.** With no backend, the only party who could verify the signature is the
      app that just authorized the same wallet session; it proves nothing it did not already have.
      Revisit if a service, or Seeker Genesis Token verification, ever gives it something to prove.
- [x] ~~`.sol` / `.skr` name resolution~~ — **deferred to v1.1.** Both SDKs were checked:
      `@onsol/tldparser` (the one that handles `.skr`) pulls in ethers 6 and the Metaplex beet
      stack, and `@bonfida/spl-name-service` is `.sol`-only and still brings web3.js v1, spl-token
      and a Buffer polyfill. This app is kit-only by design. Revisit when a kit-native AllDomains
      client exists.
- [x] `e2e/fakewallet.sh` rewritten against the real UI — it had been driving the template demo's
      buttons since the Phase 1 reset, and nothing ran it

**DoD:** connecting and disconnecting is reliable; the app still works fully with no wallet
installed. → tag `v0.6.0`

---

## Phase 6.5 — First run _(unplanned; added during the design pass, 2026-09-06)_

Not in the original plan. It came out of the design canvas: the app had no way to say what it
is — or what it will never do — before someone hands it an address.

- [x] `components/ui/spinner.tsx` — a gradient arc for waits the app does not own, wired into
      `Button`'s `loading` state. The skeleton still owns everything whose shape is known
- [x] Introduction, shown once and skippable: what it is, "not a wallet", first action — and,
      from 2026-09-12, a fourth screen for the widgets, with every illustration rebuilt from the
      app's own components
- [x] `features/onboarding` — one key, injectable storage, failures biased towards **not** showing
      the introduction rather than repeating it forever
- [x] The introduction stands in front of the navigator, not beside it as a route, so a first run
      has no history to go back into and home never flashes behind a redirect
- [x] `ChainStatusStrip` — the SOL price and network cards become one line above the list, so
      the first contact sits about 340 px down instead of 500. `SolPriceCard` and
      `NetworkStatsCard` are gone; the epoch progress bar went with them
- [ ] Device pass on the Seeker

**DoD:** a first launch explains the app and its limits before asking for anything; the second
launch goes straight to the contact list.

---

## Phase 6.6 — Off the screen and onto the home screen _(unplanned; added 2026-09-06)_

Both items came from the same observation: the saved address is what people came for, and it was
always one or two screens away.

- [x] Contact rows carry the code and the copy button themselves — the right half of the card was
      empty, and both actions cost a trip through the detail screen
- [x] `modules/contact-widget` — an Android home-screen widget for one contact: QR, shortened
      address, a copy button, and a tap that deep-links back into the contact. See ADR-015
- [x] Pinning offered from the contact screen via the launcher's own dialog, hidden where the
      launcher will not take it
- [x] The book is pushed to the widget on every change — id, name and address, nothing else
- [x] Three sizes to pick from rather than one — 2x2 with the code, 2x1 and 4x1 with the name and
      address — one provider each, because a launcher's picker offers providers and not sizes
      _(added 2026-09-12)_
- [x] A widget dropped from the launcher's own picker arrives with no contact, says so, and taps
      through to `solcontacts://widget/<appWidgetId>` — the book with an Add on every row, which
      binds the choice to that widget. The same screen catches a widget whose contact was deleted
      _(added 2026-09-12)_
- [ ] Device pass on the Seeker: prebuild picks up the local module, all three sizes appear in the
      picker and render, copy works from each, a deleted contact degrades to "Contact unavailable"

**DoD:** an address can be shown and taken without opening the app at all.

---

## Phase 8 — Tabs, groups and Solana Night _(unplanned; added 2026-09-08)_

Three things at once, because they are the same thing: the home screen was carrying the wallet,
the whole book and every control, and the palette it carried them in was grey.

- [x] The **Solana Night** palette — a genuinely black ground, six gradients, eight group tones.
      Every pair measured against the thresholds `constants/app-styles.test.ts` already enforced,
      both ends of every gradient included. 124 palette assertions, up from 30
- [x] Black ink on every filled control, which is what lets the primary gradient be Solana's own
      purple-to-green at full strength. A first pass on violet-tinted neutrals with white ink was
      built and rejected: white text caps how bright a fill may go, and everything inside the band
      that leaves comes out timid
- [x] `expo-linear-gradient` for surfaces and fills, `react-native-svg` for the two corner glows
      a linear gradient cannot draw. See ADR-016
- [x] Space Grotesk on the two headline tokens only — body, labels and addresses keep the system
      font
- [x] A floating tab bar: **Contacts**, **Groups**, **Wallet**. The wallet card and the chain
      strip leave the top of the contact list, where they cost the first contact 500 px
      _(the Wallet tab went again in Phase 9)_
- [x] Schema **v2** — `category` becomes a real `ContactGroup` with a name and a stored tone, and
      `pinned` arrives beside it. The migration folds categories case-insensitively
- [x] Groups tab: tiles with counts and an all-or-nothing group balance, create, rename, recolour
      and delete. Deleting a group never deletes a contact
- [x] A group filter row above the contact list, a group chip on every row, pinned contacts first
- [x] The contact form files into a group, pins, and pastes an address — on a tap, never on mount
- [x] Rows fade in and slide when the list reorders under them; everything inert under
      "remove animations"
- [ ] Device pass on the Seeker

**DoD:** the app looks like something worth a screenshot, and a book of forty contacts is
navigable without scrolling past a wallet card.

---

## Phase 9 — Read-only _(unplanned; added 2026-09-12)_

The wallet connection earned its keep in one place — saving your own address — and charged a
native dependency, a session to cache and a failure surface for it. Sending was what justified
the rest, and an address book is not where people send from. See ADR-017.

- [x] The app-wide background becomes one glow mesh behind the whole navigator: four radial
      sources on black, four falloff stops each so a near-black OLED panel does not ring. The
      per-screen violet corner glow goes, so every screen shows the same background
- [x] Send SOL removed — the screen, `features/transfer`, and `utils/sol-amount.ts`, which
      nothing else parsed amounts for
- [x] The Wallet tab and its card removed; two tabs remain. The chain status strip went with the
      tab rather than moving, and took the network stats and Jupiter price hooks with it — with
      the price hook, the app's last non-RPC network destination
- [x] `@wallet-ui/react-native-kit` and `@solana-program/system` dropped, along with
      `MobileWalletProvider` and the fakewallet e2e harness. The RPC client it used to hand out
      is now `features/rpc/solana-rpc.ts` — `createSolanaRpc`, never given a signer
- [x] Onboarding, privacy policy and the security doc restated: the app cannot sign, rather than
      delegating signing
- [ ] Device pass on the Seeker

**DoD:** no wallet app is ever opened, balances still read, and `grep -ri "secretkey\|mnemonic\|seed phrase" --include=*.ts --include=*.tsx .` finds nothing.

---

## Phase 7 — dApp Store release

- [x] App icon, Android adaptive icon (foreground + monochrome) and both splash images —
      one definition in `scripts/generate-icons.py`, no SVG master to drift from it. `app.json`
      moved off the template's pale blue `#E6F4FE` and its `#ffffff` / `#000000` splash onto the
      real tokens, and gained a dark-mode splash image
- [x] Store icon 512×512 — `assets/store/icon-512.png`, generated from the same mark as the
      launcher icon by `scripts/generate-store-assets.py`
- [x] Feature banner 1200×600 — `assets/store/banner-1200x600.png`. The wordmark moved to Space
      Grotesk Bold at the same time, so the splash, the app and the banner letter the name alike
- [ ] 4–6 screenshots, min 1080px, identical aspect ratio and orientation
- [ ] Short description (**max 30 characters**) and long description written
- [x] Terms of Use written and published, and both policies reachable from an in-app About screen
      rather than only from the listing
- [x] Privacy policy published at a public URL —
      <https://heisenbergsolana.github.io/solcontacts-privacy.html>, alongside the HashWorks
      publisher landing page the Publisher Portal required
- [x] Release configuration hardened: the four unused permissions the Expo template and
      `expo-brightness` contribute are blocked, `allowBackup` is off so contacts cannot reach
      Google's cloud backup, and `versionCode` is declared so prebuild stops resetting it
- [x] Repository cleaned for publication — agent tooling untracked, README rewritten to describe
      the app that exists
- [ ] Generate a **dedicated** dApp Store signing keystore; back it up securely, off-repo
- [x] `eas.json` `dapp-store` profile — `buildType: "apk"`, arm64-v8a only, versionCode read
      from `app.json`
- [ ] Build the signed release APK; verify with `apksigner verify --print-certs`
- [ ] Install the release APK on a clean device and test every flow
- [ ] Test on real Seeker hardware if available
- [x] Publisher Portal: account and KYC/KYB done — publisher **HashWorks**, individual, verified
      2026-09-13. Storage needed no funding: the portal now offers a managed Cloudflare R2 bucket
      as the default, so ArDrive is opt-in rather than required
- [ ] Publisher wallet connected, and SOL on hand for the release NFT mint
- [ ] Submit; expect 3–5 business days of review
- [ ] Launch posts per [12-SOCIAL-LAUNCH.md](12-SOCIAL-LAUNCH.md)

**DoD:** live in the Solana dApp Store. → tag `v1.0.0`

---

## Post-1.0 backlog

Ordered by expected value, not by ease:

1. Export / import contacts (JSON) — the most requested feature for any address book
2. Multiple groups per contact, if one turns out to be too few
3. SPL token balances on the detail screen
4. Recent transactions for a contact
5. Contact avatars (deterministic identicon from the address)
6. Address labels shared via deep link
7. `.sol` / `.skr` name resolution — waiting on a kit-native AllDomains client; see Phase 6
8. Wallet connection, if a feature ever needs one — a new decision, not a revert of ADR-017
