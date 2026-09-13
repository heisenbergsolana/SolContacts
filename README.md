# SolContacts

**Your Solana contacts, finally organized.**

A small, fast, native-feeling Solana wallet address book for Android and the
[Solana Seeker](https://solanamobile.com/), built with React Native (Expo) and
[`@solana/kit`](https://github.com/anza-xyz/kit).

---

## What it does

Save the Solana wallet addresses you actually use — your cold wallet, your trading
wallet, your friends — and stop pasting base58 strings from chat logs.

- **Wallet contacts** — name, address, optional note, a group, and a pin for the ones
  you reach for most
- **Address validation** — an invalid Solana address can never be saved
- **Groups** — colour-toned groups with contact counts and a combined balance; filter the
  book by group, rename or recolour a group, and delete one without ever deleting a contact
- **QR scanner** — add a contact by scanning a wallet QR code
- **QR generator** — every contact has a shareable QR code, shown at boosted screen
  brightness so it scans on the first try
- **Copy & share** — one tap, native share sheet
- **SOL balance** — read-only balance lookup over Solana RPC
- **Explorer** — open any contact on Solana Explorer
- **Home-screen widget** — three sizes, straight to a contact's QR code
- **Solana Night** — a genuinely black palette built for an OLED panel, with every colour pair
  measured against its contrast threshold in the test suite

## What it is **not**

SolContacts is **not a wallet.** It never asks for, stores, or transmits a private
key, secret key, or seed phrase. It has no wallet connection and no signer: it cannot
sign a transaction and cannot move funds, because no code path in it could.

It works only with **public** wallet addresses, stored on your device. No account, no
servers, no analytics, no tracking. The only network request it ever makes is a balance
lookup against a public Solana RPC endpoint.

See [docs/07-SECURITY-PRIVACY.md](docs/07-SECURITY-PRIVACY.md) and the
[privacy policy](https://heisenbergsolana.github.io/solcontacts-privacy.html).

## Tech stack

|            |                                                           |
| ---------- | --------------------------------------------------------- |
| Framework  | React Native 0.86 via **Expo SDK 57** + `expo-dev-client` |
| Language   | TypeScript (strict)                                       |
| Solana     | `@solana/kit`                                             |
| Storage    | AsyncStorage behind a repository interface                |
| Navigation | expo-router                                               |
| Widget     | a local Expo module, Kotlin                               |
| Testing    | vitest + vitest-native + React Native Testing Library     |
| Platform   | Android (Solana dApp Store target)                        |

Full rationale and sources: [docs/02-STACK.md](docs/02-STACK.md).

## Getting started

> Requires Node.js LTS, JDK 17, Android SDK, and an Android device or emulator.
> **Expo Go is not supported** — the home-screen widget is a local native module, so a
> custom dev build is required.

```bash
npm install
npx solana-mobile@latest doctor   # verify your environment
npm run android                   # build + launch the dev client
```

Verify a change with:

```bash
npm run typecheck && npm run lint:check && npm test
```

## Configuration

Network configuration lives in [`constants/app-config.ts`](constants/app-config.ts) and
nowhere else. Copy `.env.example` to `.env` to point the app at a different cluster or a
private RPC endpoint. Anything prefixed `EXPO_PUBLIC_` is bundled into the shipped app and
is therefore **not secret**.

## Documentation

| Doc                                                | Contents                                   |
| -------------------------------------------------- | ------------------------------------------ |
| [01-PRODUCT](docs/01-PRODUCT.md)                   | Vision, scope, non-goals, success criteria |
| [02-STACK](docs/02-STACK.md)                       | Verified technology decisions with sources |
| [03-ARCHITECTURE](docs/03-ARCHITECTURE.md)         | Folder structure and layering rules        |
| [04-DATA-MODEL](docs/04-DATA-MODEL.md)             | Contact schema, storage, migrations        |
| [05-UI-UX](docs/05-UI-UX.md)                       | Screens, wireframes, design tokens         |
| [06-SOLANA](docs/06-SOLANA.md)                     | Network config, RPC, validation, explorer  |
| [07-SECURITY-PRIVACY](docs/07-SECURITY-PRIVACY.md) | Security invariants and privacy policy     |
| [08-TESTING](docs/08-TESTING.md)                   | Test strategy                              |
| [09-ROADMAP](docs/09-ROADMAP.md)                   | Phase-by-phase plan                        |
| [10-DAPP-STORE](docs/10-DAPP-STORE.md)             | Release + submission runbook               |
| [11-BRANDING](docs/11-BRANDING.md)                 | Name, icon, colors, asset specs            |
| [12-SOCIAL-LAUNCH](docs/12-SOCIAL-LAUNCH.md)       | Launch plan                                |
| [13-GIT-WORKFLOW](docs/13-GIT-WORKFLOW.md)         | Branching and commit conventions           |

## License

[MIT](LICENSE).

Scaffolded from Solana Mobile's [`expo-kit-minimal`](https://github.com/solana-mobile/templates)
template, which is Apache-2.0 licensed — that licence is preserved as
[LICENSE-TEMPLATE-APACHE-2.0](LICENSE-TEMPLATE-APACHE-2.0).

---

Published by **HashWorks** · [heisenbergsolana.github.io](https://heisenbergsolana.github.io)
