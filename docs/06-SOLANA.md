# 06 — Solana Integration

The pure helpers described here live in `utils/` and contain **no React**. The one RPC client
lives in `features/rpc/solana-rpc.ts`.

## Network configuration

The cluster is defined in **`constants/app-config.ts`** and nowhere else:

```ts
export const CLUSTER_NAME: ClusterName = process.env.EXPO_PUBLIC_CLUSTER === 'devnet' ? 'devnet' : 'mainnet-beta'

export const PUBLIC_RPC_URL =
  CLUSTER_NAME === 'devnet' ? 'https://api.devnet.solana.com' : 'https://api.mainnet-beta.solana.com'

export const RPC_URL = process.env.EXPO_PUBLIC_RPC_URL ?? PUBLIC_RPC_URL

export const HAS_RPC_FALLBACK = RPC_URL !== PUBLIC_RPC_URL
```

`features/rpc/solana-rpc.ts` builds the app's only client from those URLs. One cluster is in play
at a time, which is why there is a single cluster and not a list.

**Rules:**

- No other file may contain an RPC or explorer URL. Ever.
- Shipped builds target **mainnet-beta**; `EXPO_PUBLIC_CLUSTER=devnet` switches a test build.
- `EXPO_PUBLIC_RPC_URL` allows overriding with a dedicated provider without a code change.

### Two endpoints, one client

The provider URL is the destination and Solana's public endpoint is the fallback. The client is
still a single exported `solanaRpc`; the failover lives in the transport beneath it, so no caller
and no test mock has to know about it.

```
getBalance ──▶ provider (EXPO_PUBLIC_RPC_URL)
                  │ fails
                  └──▶ api.mainnet-beta.solana.com
```

This exists because of a constraint that cannot be engineered away: **anything prefixed
`EXPO_PUBLIC_` is compiled into the shipped bundle and can be read out of the APK.** A provider key
in a mobile app is public by definition. Hiding it needs either a backend — ruled out for v1 — or a
paid provider plan that issues a keyless URL.

So the key is chosen to make the worst case survivable: a free-tier key whose only failure mode is
an exhausted quota, never one attached to a payment method. And when that quota does run out, the
app degrades to the slow public endpoint instead of showing every user a broken balance until the
next release reaches them.

An **aborted** request is never retried — the caller has already navigated away, and a second
attempt would only make a cancelled screen wait twice.

With no provider configured the two URLs are identical, so the app builds one transport and skips
the failover entirely.

## Address validation

```ts
// utils/solana-address.ts
import { isAddress } from '@solana/kit'

export function isValidSolanaAddress(candidate: string): boolean {
  return isAddress(candidate.trim())
}
```

For display shortening, **reuse the template's `utils/ellipsify.ts`** — it already takes
characters from both ends and ships with tests. Do not write a second shortener:

```ts
ellipsify('7xK4pFq...83n92P') // '7xK4..92P'
ellipsify(address, 4, '…') // custom delimiter
```

**What `isAddress` actually checks:** the string decodes from base58 to exactly 32 bytes.

**What it does not check:**

- that the account exists on-chain (an unused address is still a valid address)
- that the address is on the ed25519 curve (a PDA is a valid address and users may legitimately
  want to save one)
- that the address belongs to whoever the user thinks it does

That is the correct scope for an address book. The UI must not imply more certainty than this —
`✓ Valid Solana address` means well-formed, not verified-as-someone's.

**Never** implement a custom base58 or length check. One function, one source of truth.

## RPC client

**Do not construct your own RPC client.** There is exactly one, and it is read-only:

```ts
import { solanaRpc } from '@/features/rpc/solana-rpc'

const { value } = await solanaRpc.getBalance(address).send()
```

That single module keeps one cluster in play across every read, and it is the seam
`createRpcMock()` replaces in tests.

Kit's RPC calls are builders — you must call `.send()`:

```ts
const { value } = await rpc.getBalance(address).send()
```

All RPC calls must:

- have a timeout (default fetch has none — wrap with `AbortSignal.timeout(10_000)`)
- be cancellable when the screen unmounts
- return a `Result`, never throw into a component
- never be made in a render path or a list-scroll hot loop

**One row, one request is not a plan.** A list asks for every balance it needs in a single
`getMultipleAccounts` call (`features/balance/use-balances.tsx`), chunked at the RPC's limit of
100 keys and sliced with `dataSlice: { length: 0, offset: 0 }` so no account data crosses the
wire. A `null` entry means the address holds nothing — 0 lamports, not a failed read.

## Balance lookup

> ⚠️ **The template's own `lamportsToSol` was `Number(balance) / 1e9`** — the exact precision
> bug described below. It was removed in the Phase 1 reset; replace it with this version, and
> keep the precision test.

```ts
// utils/lamports-to-sol.ts
export const LAMPORTS_PER_SOL = 1_000_000_000n

/** Convert lamports to a display string. Never use floating point for the conversion. */
export function formatSol(value: bigint, decimals = 4): string {
  const whole = value / LAMPORTS_PER_SOL
  const frac = value % LAMPORTS_PER_SOL
  const fracStr = frac.toString().padStart(9, '0').slice(0, decimals).replace(/0+$/, '')
  return fracStr.length > 0 ? `${whole}.${fracStr}` : `${whole}`
}
```

**Critical:** lamport values are `bigint`. Converting through `Number` loses precision above
2^53 lamports (~9M SOL). Do the division in `bigint` and format as a string. Never
`Number(lamports) / 1e9`.

Display rules:

- 4 decimal places by default, trailing zeros trimmed (`12.42 SOL`, `0.5 SOL`, `0 SOL`)
- exact zero shows `0 SOL`, not `—`
- while loading, show a shimmer, not `0`
- on failure, show `Balance unavailable` with a retry — the contact is still fully usable

Balances are **never persisted**. A cached balance is a misleading balance.

## Explorer links

```ts
// utils/solana-explorer.ts
export function explorerAddressUrl(address: string, cluster: string): string {
  const suffix = cluster === 'mainnet-beta' ? '' : `?cluster=${cluster}`
  return `https://explorer.solana.com/address/${address}${suffix}`
}
```

The cluster comes from `AppConfig`, passed in — so the helper stays a pure, testable function.

Opened with `Linking.openURL()`. Mainnet links carry no cluster query parameter; devnet links must.

## QR payload parsing

Wallet QR codes are not all the same. `utils/qr-payload.ts` normalizes them:

| Input                                            | Result                              |
| ------------------------------------------------ | ----------------------------------- |
| `7xK4...92P` (raw base58)                        | that address                        |
| `solana:7xK4...92P`                              | that address                        |
| `solana:7xK4...92P?amount=1.5&label=Alex`        | that address (params ignored in v1) |
| `https://explorer.solana.com/address/7xK4...92P` | that address                        |
| anything else                                    | `null`                              |

```ts
export function parseQrPayload(raw: string): string | null
```

The extracted candidate is then run through `isValidSolanaAddress()` — parsing and validation
stay separate so both are independently testable. This function is **pure** and gets full
unit test coverage; the camera itself is never unit tested.

## No wallet connection, by design

SolContacts reads and nothing else. There is no Mobile Wallet Adapter dependency, no wallet
session, no signer and no transaction path — see `docs/07-SECURITY-PRIVACY.md`.

If sending is ever revisited, it is a new decision with a new ADR, not a switch to flip back on.

## Post-1.0 — `.sol` and `.skr` names

- `.skr` domains are issued to Seeker owners and resolve through **AllDomains** infrastructure;
  Solana Mobile publishes an "SKR Address Resolution Sample" for React Native.
- `.sol` domains resolve through SNS / AllDomains as well.
- Both need forward (name → address) and reverse (address → name) lookup.
- Resolution results must be cached with a timestamp and clearly marked as resolved-at-a-point-in-time.
  A name can be transferred; a stale reverse lookup shown as fact is a security problem.
- Verify the current SDK before implementing: <https://docs.solanamobile.com/solana-mobile-stack/skr-domain.md>

## Seeker detection

```ts
import { Platform } from 'react-native'

export const isSeekerDevice = (): boolean => Platform.constants.Model === 'Seeker'
```

On a Seeker: `Model: "Seeker"`, `Brand: "solanamobile"`, `Manufacturer: "Solana Mobile Inc."`.

**This is spoofable** and must only ever drive cosmetic behavior (a welcome message, a
Seeker-specific tip). Never gate a security decision or paid feature on it — that requires
verifying the Seeker Genesis Token in the user's wallet via signed proof.

Source: <https://docs.solanamobile.com/recipes/general/detecting-seeker-users.md>
