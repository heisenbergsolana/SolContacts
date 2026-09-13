# 08 — Testing

## Philosophy

Test the logic that would silently lose a contact or accept a bad address. Do not test that
React renders a `<View>`.

The architecture (see [03-ARCHITECTURE.md](03-ARCHITECTURE.md)) exists so that **every rule
worth testing lives in a pure function or a class behind an interface**. If something is hard
to test, that is usually a design signal, not a testing problem.

## Stack

| Tool                                | Role                                                                                                                                                                                                               |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `vitest` + `vitest-native`          | Runner. Resolves the **real** `react-native@0.86` against the Android platform and mocks the native modules (`asyncStorage`, `gestureHandler`, `reanimated`, `safeAreaContext`) via presets in `vitest.config.mts` |
| `@testing-library/react-native` v14 | Component and hook testing, user-centric queries. **`render` is async — always `await`**                                                                                                                           |
| `test/test-utils.tsx`               | `renderWithProviders()` and `createRpcMock()` — the RPC seam                                                                                                                                                       |
| In-memory `ContactsRepository`      | Storage fake — same interface, no AsyncStorage                                                                                                                                                                     |

```bash
npm test              # run once
npm run test:watch    # watch mode
npm run test:coverage
```

Coverage is collected from `app/`, `components/`, `constants/`, `features/` and `utils/`.

## The test pyramid here

```
        ╭───────────────╮
        │  1-2 flows    │   integration: add-contact end to end
      ╭─┴───────────────┴─╮
      │   components      │   render + interaction on the few that hold state
    ╭─┴───────────────────┴─╮
    │   pure functions      │   the bulk: validation, parsing, formatting, migrations
    ╰───────────────────────╯
```

## Coverage priorities

Ordered by "what breaks a user's trust if it's wrong":

### Must be tested — Phase 2

**`features/contacts/contacts-storage.ts` — the repository**

- save → load round trip preserves every field
- update mutates only the targeted contact and refreshes `updatedAt`
- delete removes exactly one contact
- loading with no stored document returns an empty document, not a crash
- loading corrupt JSON does not throw and does not silently wipe data
- concurrent writes do not lose a contact

**`features/contacts/contacts-service.ts`**

- trims name, note, category
- omits empty optional fields rather than storing `""`
- rejects an empty or whitespace-only name
- rejects an invalid address before it reaches storage
- flags a duplicate address without blocking the save
- sets `createdAt` once and updates `updatedAt` on every save

**Search**

- matches on name, case-insensitively
- matches on address substring
- matches partial/shortened input
- empty query returns everything
- no match returns an empty array, not `undefined`

**`features/contacts/contacts-migrations.ts`**

- a v1 fixture passes through unchanged
- an unknown future version is left untouched and reported
- each future migration gets its fixture the day it is written

### Must be tested — Phase 3

**`utils/solana-address.ts`**

- known-good mainnet addresses → valid
- empty string, whitespace, `null`-ish input → invalid
- too short / too long → invalid
- non-base58 characters (`0`, `O`, `I`, `l`) → invalid
- an Ethereum `0x…` address → invalid
- a valid address with surrounding whitespace → valid after trim
- case change on a valid address → different address, still validated on its own merits
- `shortenAddress` output length and that it takes characters from both ends
- `shortenAddress` on a string shorter than the window returns it unchanged

**`utils/lamports-to-sol.ts` — `formatSol`**

- `0n` → `"0"`
- `1_000_000_000n` → `"1"`
- `1_234_500_000n` → `"1.2345"`
- `500_000_000n` → `"0.5"`
- `1n` → rounds/truncates to `"0"` at 4 decimals (documented behavior, not accidental)
- a value above `Number.MAX_SAFE_INTEGER` lamports formats exactly — **the precision test**

**`utils/solana-explorer.ts`**

- mainnet URL has no `cluster` query param
- devnet URL has `?cluster=devnet`

### Must be tested — Phase 4

**`utils/qr-payload.ts`** — the whole table from [06-SOLANA.md](06-SOLANA.md):

- raw base58 address
- `solana:<address>`
- `solana:<address>?amount=1.5&label=Alex` → address only, params ignored
- an explorer URL
- an unrelated URL → `null`
- arbitrary text → `null`
- empty string → `null`

The camera is never unit tested. All QR intelligence lives in this pure function precisely so
it can be tested without a device.

### Component tests — keep few, keep meaningful

Worth testing:

- **AddressField**: typing an invalid address shows the error and disables save; typing a valid
  one enables it
- **ContactForm**: cannot submit with an empty name
- **Delete confirmation**: `CANCEL` does not delete; `DELETE` does
- **EmptyState**: renders when the list is empty and the CTA fires

Not worth testing: colors, spacing, icon presence, static copy.

### Integration test — one is enough

`add-contact.test.tsx`: open Add → type a name → paste a valid address → save → the contact
appears in the list → reload from the repository → it is still there.

## Conventions

- Test files sit next to their subject: `solana-address.ts` → `solana-address.test.ts`.
- Name tests as behavior: `it("rejects an address containing a zero character")`.
- **Never mock the thing you are testing.** Mock only the edges (AsyncStorage, fetch, Clipboard).
- Use real fixtures — real base58 addresses copied from a block explorer, not `"abc123"`.
- Keep a shared fixtures file: `test/fixtures.ts` with valid/invalid address constants and
  sample contacts. `test/test-utils.tsx` already exports `TEST_ADDRESS`.
- No snapshot tests. They record what the code does, not what it should do.
- Mock the RPC with `createRpcMock()`, never by mocking `features/rpc/solana-rpc.ts` ad hoc.

## Definition of done, per step

A step is not finished until all four pass:

```bash
npm run typecheck
npm run lint:check
npm test
```

plus the change was actually exercised on a device when it touches UI. `npm run ci` runs the
whole chain including `format:check` and an Android prebuild.

## What is deliberately not tested

- Camera hardware behavior
- Real network RPC responses (stubbed; live RPC is verified manually on-device)
- Native module internals
- Third-party library behavior
- Visual appearance — that is manual review against [05-UI-UX.md](05-UI-UX.md)
