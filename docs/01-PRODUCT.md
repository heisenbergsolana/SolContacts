# 01 — Product

## One-liner

**SolContacts — your Solana contacts, finally organized.**
A wallet address book for Solana users on Android and the Solana Seeker.

## The problem

Solana addresses are 32-44 character base58 strings. In practice people store them in
notes apps, chat messages with themselves, screenshots, and spreadsheets. That is:

- **error-prone** — one wrong character and funds are gone forever
- **slow** — scrolling a chat history to find "the cold wallet one"
- **unverifiable** — a plain-text note gives no confirmation the address is even valid
- **unsafe by habit** — copying from an untrusted source encourages clipboard-hijack risk

There is no lightweight, dedicated place to keep the handful of addresses you use weekly.

## The solution

A single-purpose address book that does one thing very well: **store, verify, and retrieve
Solana wallet addresses safely.** Every saved address is validated. Every contact is one tap
from a QR code, a copy button, a share sheet, and an explorer link.

## Target user

- Solana Seeker owners (primary — this is the dApp Store audience)
- Any Android Solana user who moves funds between more than two wallets
- Not aimed at traders, NFT collectors, or DeFi power users specifically — aimed at
  _anyone who types or pastes a Solana address more than once a month_

## Core value proposition

> The addresses you use are already in your phone. They're just in the wrong place.

## MVP scope (v1.0)

**In:**

- Create, read, update, delete wallet contacts (name, address, note, category)
- Client-side Solana address validation — invalid addresses cannot be saved
- Search contacts by name or address
- QR code scanning to add a contact
- QR code generation for each contact
- Copy address to clipboard with confirmation
- Native share sheet
- Read-only SOL balance lookup
- Solana Explorer deep link
- Dark-mode-first UI, offline-first local storage

**Out of v1.0 (deliberately):**

| Not building                    | Why                                                     |
| ------------------------------- | ------------------------------------------------------- |
| AI features                     | Not the problem being solved                            |
| Trading / swaps                 | Massive scope, regulatory surface, needs signing        |
| Social feed                     | Different product                                       |
| NFT marketplace                 | Different product                                       |
| Own token                       | No                                                      |
| Staking                         | Different product                                       |
| Backend / cloud sync            | Adds servers, privacy risk, and cost for zero MVP value |
| SPL token balances              | Post-1.0, once the core is stable                       |
| Transaction history             | Post-1.0                                                |
| `.sol` / `.skr` name resolution | Post-1.0 (Phase 6+) — depends on AllDomains             |
| Sending SOL                     | Out of scope. The app is read-only — see ADR-017        |
| iOS                             | dApp Store is Android; no v1 value                      |

Scope discipline is the point. Every item above is a real feature that would make this app
worse at launch, not better.

## Success criteria for v1.0

1. A new user can save their first contact in under 30 seconds without instructions.
2. It is **impossible** to save a malformed Solana address.
3. Cold start to interactive list: under 1 second on a Seeker.
4. Works fully offline except balance lookup, which degrades gracefully.
5. Zero private-key handling anywhere in the codebase — provable by inspection.
6. Accepted into the Solana dApp Store.

## Product principles

1. **One job.** If a feature does not help the user manage addresses, it does not ship.
2. **Never lose a contact.** Storage failures must be visible, not silent.
3. **Safety over convenience** for destructive actions; **convenience over ceremony** for
   everything else.
4. **Boring UI.** No crypto-maximalist neon clutter. Fast, readable, quiet.
5. **Trust is the product.** The app touches money-adjacent data; every design choice should
   make the user more confident, never less.
