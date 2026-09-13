# 07 — Security & Privacy

## The core invariant

> **SolContacts is not a wallet.**

The app never asks for, receives, stores, derives, logs, displays, or transmits:

- a private key
- a secret key
- a seed phrase or mnemonic
- a keypair
- a wallet password or PIN

It works exclusively with **public** Solana addresses — information that is already public
on-chain by definition.

Any pull request, patch, or generated code that introduces key material into this codebase is
rejected outright. There is no exception, no debug flag, no "temporary" version of this rule.

## What that means concretely

| Capability          | How it is handled                                                               |
| ------------------- | ------------------------------------------------------------------------------- |
| Viewing balances    | Read-only RPC query against a public address                                    |
| Sending SOL         | Not supported. The app has no signer and no transaction path at all.            |
| Connecting a wallet | Not supported. There is no wallet session, and nothing in the app asks for one. |
| Importing contacts  | Plain public addresses only; every one re-validated                             |

## Threat model

| Threat                                                      | Mitigation                                                                                                                                                                                                                |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Malicious QR code**                                       | Payload is parsed into a candidate string, then validated. Nothing is executed. Unknown formats are rejected, not guessed at. `amount`/`label` params in `solana:` URIs are ignored, and the app cannot send in any case. |
| **Clipboard hijacking** (malware swapping a copied address) | Out of the app's control, but the app reduces exposure: the user copies **from** a verified saved contact instead of from a chat message. The full address is always displayed for visual verification before use.        |
| **Typo / transcription error**                              | Validation blocks malformed addresses at input. Checksum-valid but wrong addresses cannot be detected by any client — hence the QR-first flow.                                                                            |
| **Look-alike address swap**                                 | Full monospace address shown on the detail screen; shortened form always takes characters from both ends, never just the start.                                                                                           |
| **Device loss**                                             | Contacts are public addresses; loss discloses nothing that is not already on-chain. No keys exist to steal.                                                                                                               |
| **Malicious dependency**                                    | Minimal dependency count, all pinned, every addition justified in `docs/02-STACK.md`. `npm audit` before each release.                                                                                                    |
| **Data exfiltration**                                       | The app has no analytics, no telemetry, no crash reporting SDK, and makes exactly one class of outbound request: RPC balance queries.                                                                                     |
| **Key theft during signing**                                | The app never signs. It has no signer, no wallet session and no transaction path — see `docs/06-SOLANA.md` and the grep in the checklist below.                                                                           |
| **Stale name resolution** (post-1.0)                        | `.sol`/`.skr` results are cached with timestamps and presented as "resolved at" — never as verified identity.                                                                                                             |

## Android permissions

Only two, both requested at the moment of use with an explanation first:

| Permission | Why                      | When requested                       |
| ---------- | ------------------------ | ------------------------------------ |
| `CAMERA`   | Scanning wallet QR codes | Only when the user opens the scanner |
| `INTERNET` | RPC balance queries      | Implicit; no runtime prompt          |

**Not requested and never to be added without a documented reason:** contacts, location,
storage/media, phone state, microphone, background location, notifications.

## Cluster

`EXPO_PUBLIC_CLUSTER=devnet` points the app at `https://api.devnet.solana.com` instead of
mainnet. It is the same class of destination — a public Solana RPC endpoint, named in
`constants/app-config.ts` like every other URL — and it exists so the balance reads can be
exercised against a test network. Shipped builds do not set it.

If the permission list ever grows, that change needs a line in this file explaining why —
reviewers of the dApp Store submission will ask.

## Data handling summary

- **Collected:** nothing.
- **Transmitted:** one thing, and nothing else — the public wallet addresses whose balances the
  user asks to see, sent to the configured Solana RPC endpoint.
- **Stored:** contacts, on the device only, in app-private storage.
- **Shared with third parties:** nothing.
- **Accounts:** none. No sign-up, no login, no email.

## Secrets in the repository

- No API keys, tokens, or endpoints with credentials in source.
- Configuration via `.env` (gitignored); `.env.example` documents the variable names only.
- `EXPO_PUBLIC_*` values are **bundled into the app** and are therefore not secret. Only
  values that are safe to publish may use that prefix.
- Signing keystores (`*.keystore`, `*.jks`) are gitignored and stored outside the repository.
  Losing the dApp Store signing key permanently blocks all future updates.

## Code review checklist (security)

Run through this before any release, and whenever address-handling code changes:

- [ ] No occurrence of `secretKey`, `privateKey`, `mnemonic`, `seed`, `Keypair.generate`,
      `fromSecretKey` anywhere in the source tree
- [ ] No `console.log` of an address, balance, or storage document in production paths
- [ ] All addresses reaching storage passed through `isValidSolanaAddress()`
- [ ] No RPC or explorer URL outside `constants/app-config.ts`
- [ ] No new permission in `app.json` without a justification in this file
- [ ] No new network destination beyond the configured RPC endpoint
- [ ] `npm audit` reviewed; no unaddressed high/critical advisory
- [ ] Delete confirmation still states that the wallet and funds are unaffected

## Privacy Policy (draft for the dApp Store listing)

> **SolContacts Privacy Policy**
> _Last updated: 13 September 2026_
>
> **Summary: SolContacts collects nothing.**
>
> **Information we collect.** None. SolContacts has no account system, no analytics, no
> telemetry, no advertising identifiers, and no crash reporting. We cannot see who uses the
> app or what they store in it.
>
> **Information stored on your device.** The wallet contacts you create — name, Solana
> address, and optional note and category — are stored only in the app's private storage on
> your device. They are never uploaded anywhere. Uninstalling the app deletes them.
>
> **Network requests.** SolContacts makes one kind of request.
>
> When you view a contact, the app may look up that address's SOL balance. The request goes to a
> third-party Solana RPC provider — currently **Helius** (helius.dev) — and, if that provider is
> unavailable, to Solana's public endpoint at `api.mainnet-beta.solana.com`. Either way the request
> contains the public wallet address being viewed, and the provider may log it under its own privacy
> policy. It contains nothing that identifies you: no account, no device identifier, no other
> contact from your address book.
>
> No other data is transmitted, ever.
>
> **Private keys.** SolContacts is not a wallet. It never requests, receives, stores, or
> transmits private keys, secret keys, or seed phrases. It cannot sign a transaction and cannot
> move funds.
>
> **Camera.** The camera is used only to scan QR codes, only while the scanner screen is open.
> No image or video is stored or transmitted.
>
> **Children.** SolContacts is not directed at children under 13.
>
> **Changes.** Material changes to this policy will be noted in the app's release notes.
>
> **Contact.** heisenbergsolana@gmail.com

Published at <https://heisenbergsolana.github.io/solcontacts-privacy.html>, alongside a
[Terms of Use](https://heisenbergsolana.github.io/solcontacts-terms.html) whose load-bearing clause
is the one that matters for an address book: a well-formed address is not a verified one, and
Solana transfers cannot be reversed.

Both are linked from the dApp Store listing **and** from the app's own About screen — a user who
already has the app should not have to go to a store page to find out what it does with their
addresses.

Neither document has been reviewed by a lawyer. They are written to be accurate and plain rather
than to be airtight, which is the right trade for a free, offline, account-less utility — but it is
a trade, and worth revisiting if the app ever collects anything or charges for anything.
