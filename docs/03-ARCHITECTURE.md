# 03 — Architecture

> **Note.** Phase 0 planned a `src/` layered tree. The official `expo-kit-minimal` template
> ships a flat, feature-based layout with an `@/*` alias to the project root, and the tooling
> depends on it: the tsconfig path alias, the vitest coverage `include` globs, and every
> Solana Mobile example. We adopted the template's convention rather than fighting it.
> The layering _principles_ below are unchanged — only the folder names are.

## Principles

1. **Separation of concerns.** Routes render, features coordinate, utils compute, constants configure.
2. **One direction.** Dependencies point downward only. A lower layer never imports an upper one.
3. **Typed boundaries.** Every layer crossing goes through a type in `types/`.
4. **Swappable edges.** Storage and RPC sit behind interfaces so they can be replaced or faked
   in tests without touching UI.
5. **No duplication.** Address validation, shortening, and lamport math exist in exactly one place each.

## Folder structure

```
app/                          expo-router routes — thin, default exports
  _layout.tsx                 AppProviders + Stack
  (tabs)/
    _layout.tsx               the two tabs and the custom bar
    index.tsx                 Contacts: list, search, group filter
    groups.tsx                Groups: tiles, counts, group balances
  add.tsx                     Add contact (manual entry)
  scan.tsx                    QR scanner
  contact/
    [id]/index.tsx            Contact detail
    [id]/edit.tsx             Edit contact
    [id]/qr.tsx               Full-screen QR
  group/
    new.tsx                   Create a group
    [id].tsx                  Rename, recolour or delete one

components/
  app-providers.tsx           QueryClientProvider + ContactsProvider
  ui/                         primitives: button, input, card, screen, tab-bar, icons
  contacts/                   contact-list-item, contact-form, address-field, empty-state
  groups/                     group-chip, group-filter-row, group-tile, group-form, group-tag

constants/
  app-config.ts               cluster + RPC endpoint — the ONLY place endpoints live
  app-styles.ts               design tokens

features/
  contacts/
    contacts-repository.ts    the interface (the contract)
    contacts-storage.ts       AsyncStorage implementation
    contacts-migrations.ts    schemaVersion upgrades
    contacts-service.ts       normalization, validation, duplicate detection, list shaping
    groups-service.ts         group CRUD rules, tone assignment, per-group totals
    use-contacts.tsx          contacts and groups: one document, one hook
  balance/
    use-balance.tsx           one SOL balance via React Query
    use-balances.tsx          many balances in one batched RPC read
  rpc/
    solana-rpc.ts             the one read-only RPC client
  display/
    use-boosted-brightness.ts raises the window brightness for the QR screen
    use-app-fonts.ts          loads the display face before anything paints
  feedback/
    notify.ts                 native toast + haptic

types/
  contact.ts                  Contact, ContactGroup, GROUP_TONES, ContactsDocument
  result.ts                   Result<T, E> discriminated union

utils/                        pure functions — no React, no I/O
  ellipsify.ts                shorten an address for display  (ships with the template)
  solana-address.ts           validation
  lamports-to-sol.ts          bigint → display string
  solana-explorer.ts          explorer URL building
  qr-payload.ts               parse scanned QR content into a candidate address

modules/                      local Expo modules — native code that survives a prebuild
  contact-widget/             Android home-screen widget: QR, copy button, deep link back

test/
  test-utils.tsx              renderWithProviders, createRpcMock
```

Tests live next to their subject as `*.test.ts` / `*.test.tsx` — **except under `app/`, which
must contain no test files at all.**

Expo Router loads everything in `app/` through a `require.context` whose regex excludes only
`+api`, `+html` and `+middleware`. A test file there is bundled as a route, pulls
`@testing-library/react-native` into the app bundle, and the build dies on its `node:console`
import. The suite still passes; the break appears only when Metro bundles for a device.

There is no supported way to exclude a pattern, so `test/route-directory.test.ts` enforces the
rule instead. It is not a constraint in practice: a route file thin enough to obey the rule below
has nothing in it worth testing, and its content belongs in a component that does.
Imports across folders use the `@/` alias: `import { ellipsify } from '@/utils/ellipsify'`.

## Layering rules

```
app/        ──▶  features/  ──▶  utils/, types/, constants/
components/ ──▶  components/ui/, constants/, types/, utils/
utils/      ──▶  (nothing but types/)
```

**Hard rules, enforceable by review:**

- `components/` **must not** import from `features/`, storage, or data-fetching hooks.
  Components receive data and callbacks as props. This keeps them renderable in tests and
  reusable across screens.
- `utils/` **must not** import React. It is plain TypeScript.
- Storage **must not** know what a valid Solana address is — that is `utils/solana-address.ts`.
  Storage persists whatever it is given.
- `app/` route files stay thin: read params, call a hook, render components, handle navigation.
  No business logic, no direct storage or RPC calls.
- Only `constants/app-config.ts` may define a cluster, RPC URL, or explorer base URL.
- `modules/` is imported like any other folder (`@/modules/contact-widget`), but every export is
  optional at runtime: the native side is absent under vitest and on any non-Android target, so a
  missing module degrades to "no widget" rather than throwing.

## Data flow — adding a contact

```
  app/scan.tsx  or  app/add.tsx
        │  user input (raw string)
        ▼
  utils/qr-payload.ts          parse "solana:<addr>" or raw string
        │  candidate address
        ▼
  utils/solana-address.ts      isValidSolanaAddress()  ──▶ invalid: inline error, save blocked
        │  valid address
        ▼
  features/contacts/contacts-service.ts    normalize, check duplicates, stamp timestamps
        │  Contact
        ▼
  features/contacts/contacts-storage.ts    save()
        │
        ▼
  features/contacts/use-contacts.tsx       state updates ──▶ Home list re-renders
```

Validation happens **once**, in `utils/solana-address.ts`. Every other layer calls it —
nobody reimplements a base58 check.

## Error handling

Expected failures are values, not exceptions:

```ts
export type Result<T, E = AppError> = { ok: true; value: T } | { ok: false; error: E }
```

- **Expected failures** (invalid address, duplicate contact, network unreachable, storage read
  failure) are values. Screens decide how to present them.
- **Unexpected failures** (programmer error) throw and are caught by an error boundary.
- Balance lookup failing is **never** an error state for the whole screen — the contact still
  renders, the balance shows a retry affordance.

`utils/format-error.ts` from the template turns an `unknown` into a displayable string; restore
it from the template when the first error surface needs it.

## State management

No Redux, no Zustand, no MobX.

- **Contacts** (local, owned state) live in a React context populated by `use-contacts`,
  loaded once at startup.
- **Balances** (remote, cached state) use **React Query**, which the template already provides
  via `AppProviders`. This is what it is for: retries, staleness, and cancellation without
  hand-rolled effects.
- Search filtering is derived state, computed from the contacts array — never stored.

Revisit only if a profiler proves a real problem.

## Testing seams

| Seam                 | How it is faked                                                                     |
| -------------------- | ----------------------------------------------------------------------------------- |
| `ContactsRepository` | In-memory implementation of the same interface                                      |
| Solana RPC           | `createRpcMock()` from `test/test-utils.tsx`                                        |
| Providers            | `renderWithProviders()` from `test/test-utils.tsx`                                  |
| Native modules       | `vitest-native` presets (asyncStorage, gestureHandler, reanimated, safeAreaContext) |
| Camera               | Never tested directly — `utils/qr-payload.ts` holds the logic and is pure           |

The design goal: **all business logic testable without rendering a component or touching a device.**
