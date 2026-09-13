# 04 — Data Model

## The `Contact` type

```ts
// types/contact.ts
export type ContactId = string

export interface Contact {
  /** UUID v4, generated at creation, never reused. */
  id: ContactId
  /** Display name. Required, 1-64 chars after trimming. */
  name: string
  /** Base58 Solana address. Validated before it ever reaches storage. */
  address: string
  /** Optional free-text note, max 280 chars. */
  note?: string
  /** The group this contact belongs to — at most one. Absent means ungrouped. */
  groupId?: GroupId
  /** Kept above the rest of the list. Absent rather than `false` when off. */
  pinned?: boolean
  /** ISO 8601 UTC timestamp. */
  createdAt: string
  /** ISO 8601 UTC timestamp, updated on every mutation. */
  updatedAt: string
}
```

### Field rules

| Field       | Required | Constraints                                               | Enforced in                                |
| ----------- | -------- | --------------------------------------------------------- | ------------------------------------------ |
| `id`        | yes      | UUID v4, unique                                           | `utils/id.ts`                              |
| `name`      | yes      | trimmed, 1-64 chars, not only whitespace                  | `features/contacts/contacts-service.ts`    |
| `address`   | yes      | valid Solana address (see below)                          | `utils/solana-address.ts`                  |
| `note`      | no       | trimmed, ≤ 280 chars, omitted when empty                  | `features/contacts/contacts-service.ts`    |
| `groupId`   | no       | an id in `groups`; a dangling one reads back as ungrouped | `features/contacts/contacts-migrations.ts` |
| `pinned`    | no       | omitted when false                                        | `features/contacts/contacts-service.ts`    |
| `createdAt` | yes      | ISO 8601, set once                                        | `features/contacts/contacts-service.ts`    |
| `updatedAt` | yes      | ISO 8601, refreshed on save                               | `features/contacts/contacts-service.ts`    |

**Address validity** = the string is a valid Solana address per `@solana/kit`'s `isAddress()`:
base58-decodable to exactly 32 bytes. Note that this does **not** mean the address exists
on-chain or is on the ed25519 curve — a valid PDA is also a valid address, and that is correct
behavior for an address book.

### Normalization on save

1. `name`, `note`, `groupId` — `.trim()`; empty optional fields are **omitted**, not stored as `""`,
   and `pinned` is omitted when false rather than stored as a decision.
2. `address` — trimmed, never case-modified (base58 is case-sensitive; changing case changes the address).
3. `updatedAt` — set to `new Date().toISOString()`.
4. Duplicate check — the same address may be saved more than once (a wallet can legitimately
   have two labels), but the UI **warns** when the address already exists on another contact.

## Storage schema

One AsyncStorage key holds one JSON document:

```
Key:  "solcontacts:contacts:v1"
```

```ts
interface ContactsDocument {
  /** Schema version of this document. Bumped only by a migration. */
  schemaVersion: number // currently 2
  /** Contacts in insertion order; sorting is a UI concern. */
  contacts: Contact[]
  /** Groups in insertion order, which is also the filter-chip order. */
  groups: ContactGroup[]
}
```

Empty state is `{ schemaVersion: 2, contacts: [], groups: [] }` — never `null`, never a missing
key after first launch.

### The `ContactGroup` type

```ts
export interface ContactGroup {
  id: GroupId
  /** Trimmed, 1-32 chars. Unique case-insensitively — two "Friends" are one group. */
  name: string
  /** One of eight names in `GROUP_TONES`. A *stored* value, so the names may never change. */
  tone: GroupTone
  createdAt: string
}
```

A group holds no contacts. Membership lives on the contact as `groupId`, so deleting a group is
one write and can never leave a list of ids pointing at contacts that are gone. The reverse — a
`groupId` naming a group that no longer exists — is possible only if a write is interrupted
midway, and is read back as ungrouped rather than repaired.

`GROUP_TONES` lives in `types/contact.ts`, not with the palette: the hexes may change with a
redesign, the names may not, because they are on disk.

### Why a single document

Contacts are read as a whole set on every launch and mutated rarely. A single document means
one read, one write, atomic updates, and no index maintenance. Per-key storage would buy
nothing at this scale and complicate consistency.

### Write strategy

- **Read once** at app start into memory; the in-memory array is the source of truth for the session.
- **Write the whole document** after each mutation.
- Writes are serialized through a queue so two rapid mutations cannot interleave and lose data.
- A failed write must surface to the user — never fail silently. The in-memory state is rolled
  back to match what is actually persisted.

## Migrations

```ts
// features/contacts/contacts-migrations.ts
export const CURRENT_SCHEMA_VERSION = 2
```

Rules:

1. Every schema change bumps `CURRENT_SCHEMA_VERSION` and adds a pure migration function
   `migrate_N_to_N+1(doc): doc`.
2. Migrations run in order at load time, before any contact reaches the UI.
3. Migrations are **pure functions** over plain data — trivially unit-tested with fixtures.
4. A document with a version **newer** than the app understands is not modified. The app shows
   a "please update SolContacts" message rather than corrupting data by guessing.
5. Unparseable or corrupt data is never silently discarded — it is preserved under
   `solcontacts:contacts:corrupt:<timestamp>` and the user is told.

### v1 → v2 _(shipped)_

The free-text `category` became a real group. Each distinct category becomes a `ContactGroup`,
matched **case-insensitively** and keeping the first spelling seen — someone who typed "Friends"
once and "friends" later meant one group both times. Tones are handed out in palette order and
wrap: a ninth group repeats a colour, which is a duller book but never a lost one.

`pinned` needed no migration. It is optional and absent means false, so a v1 contact is already a
valid v2 contact once its category is gone.

Anticipated future migrations (do not implement early):

- v3: `groupId` → `groupIds: GroupId[]`, if one group per contact turns out to be too few
- v4: add `resolvedName?: { value: string; kind: "sol" | "skr"; checkedAt: string }`

## Export / import format (post-1.0)

Designed now so v1 storage does not block it later:

```json
{
  "format": "solcontacts-export",
  "version": 1,
  "exportedAt": "2026-09-04T10:00:00.000Z",
  "contacts": [
    {
      "name": "Alex",
      "address": "7xK...92P",
      "note": "trading",
      "category": "Personal",
      "createdAt": "2026-09-01T08:00:00.000Z",
      "updatedAt": "2026-09-01T08:00:00.000Z"
    }
  ]
}
```

`id` is intentionally omitted from exports — ids are regenerated on import to avoid collisions.
An import must re-validate every address; an export from an untrusted source is untrusted input.

## What is never stored

Explicitly, permanently, and by design:

- private keys, secret keys, seed phrases, mnemonics, keypairs
- wallet session tokens of any kind — there is no wallet connection
- balances (always fetched live, never persisted — a stale balance is a misleading balance)
- analytics, device identifiers, or any telemetry
- anything at all on a remote server — there is no server

See [07-SECURITY-PRIVACY.md](07-SECURITY-PRIVACY.md).
