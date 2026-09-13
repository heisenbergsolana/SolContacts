# 12 — Social & Launch Plan

A small useful app with no audience is still a small useful app — but the dApp Store review,
the Solana Mobile community, and future users all respond to a project that looks alive.
This is a lightweight plan, not a marketing campaign.

## Presence checklist

| Channel            | Handle / URL                                                | Priority                     | When        |
| ------------------ | ----------------------------------------------------------- | ---------------------------- | ----------- |
| GitHub repo        | `github.com/<user>/solcontacts`                             | **must**                     | Phase 1     |
| X (Twitter)        | `@solcontacts_app` (check availability)                     | **must**                     | Phase 3–4   |
| Landing page       | `solcontacts.app` or GitHub Pages                           | should                       | Phase 6     |
| Privacy policy URL | landing page `/privacy`                                     | **must** (store requires it) | Phase 7     |
| Discord            | Solana Mobile community — participate, don't start your own | should                       | ongoing     |
| Product Hunt       | optional                                                    | nice                         | post-launch |

Do not create channels you will not maintain. An abandoned Discord looks worse than no Discord.

## GitHub repository presentation

- [x] Repository created and pushed (private)
- Clear `README.md` with screenshots as soon as they exist (Phase 5)
- Repository description: `Your Solana contacts, finally organized. A wallet address book for Solana Seeker.`
- Topics: `solana`, `solana-mobile`, `seeker`, `react-native`, `expo`, `typescript`, `dapp`,
  `address-book`, `mobile-wallet-adapter`
- Social preview image (1280×640) — GitHub _Settings → General → Social preview_
- Releases with real notes at each tag, not just tag names
- A pinned issue: "Roadmap" linking to `docs/09-ROADMAP.md`

## X account setup

**Handle:** `@solcontacts_app` (fall back to `@getsolcontacts` / `@solcontactsapp`)

**Bio (160 chars):**

> Your Solana contacts, finally organized. A simple wallet address book for Solana Seeker.
> Not a wallet — never touches your keys. Open source.

**Pinned post:** the launch thread below.
**Link:** the dApp Store listing once live; the GitHub repo until then.

## Build-in-public cadence

Roughly one post per completed phase. Each post = one screenshot or short screen recording +
two or three sentences. No thread required.

| Phase | Post                                                                                  |
| ----- | ------------------------------------------------------------------------------------- |
| 2     | "Contacts save and survive a restart. Boring, and the whole point." + list screenshot |
| 3     | "You can't save a broken Solana address any more." + validation feedback recording    |
| 4     | "Scan a wallet QR, get a contact." + scanner recording                                |
| 5     | Before/after polish comparison                                                        |
| 7     | Launch thread                                                                         |

Post the honest version, including what does not work yet. It reads as real, because it is.

## Launch thread (draft)

> **1/** I kept pasting Solana addresses out of my notes app.
> So I built SolContacts — a wallet address book for Solana. It's live on the Solana dApp
> Store today. 🧵
>
> **2/** The whole app does one thing: save the wallet addresses you actually use, and get
> them back in one tap. Name, address, note, category. That's it.
>
> **3/** Every address is validated before it can be saved. If it isn't a real Solana address,
> the save button doesn't work. No more one-character disasters.
> [screenshot: ✓ Valid Solana address]
>
> **4/** Scan a QR to add a contact. Show a QR to receive. Copy or share any address through
> your phone's normal share sheet.
> [screen recording]
>
> **5/** It is **not a wallet**. It never asks for a private key or seed phrase and it never
> can — it only handles public addresses, stored on your device. No account, no server, no
> analytics.
>
> **6/** Built with React Native + Expo and @solana/kit, targeting Solana Seeker. Open source:
> [github link]
>
> **7/** Download on the Solana dApp Store: [link]
> Feedback and issues welcome — this is v1 and I want to hear what's missing.

## Where to share at launch

- Solana Mobile Discord (developer + community channels — read the rules first)
- r/solana (follow the self-promotion rules; lead with the problem, not the link)
- Solana developer forums / Stack Exchange where address-book questions already exist
- Post the dApp Store listing link, not just the GitHub link — the store link is the conversion

## Landing page (minimal)

One page, static, hosted on GitHub Pages:

```
Hero:      SolContacts
           Your Solana contacts, finally organized.
           [ Get it on the Solana dApp Store ]

Screens:   3 screenshots side by side

Features:  Validated addresses · QR in & out · Balances · Explorer · Offline

Trust:     "Not a wallet. Never touches your keys. No account, no servers, no tracking."

Footer:    GitHub · Privacy Policy · Contact
```

`/privacy` serves the policy from [07-SECURITY-PRIVACY.md](07-SECURITY-PRIVACY.md) — this URL
is **required** by the store submission, so it must exist before Phase 7.

## Metrics worth watching

There is no analytics in the app, by design. So watch what is observable from outside:

- dApp Store installs (portal)
- GitHub stars and, more importantly, issues opened
- Replies asking for a specific feature — that is the post-1.0 backlog, prioritized by reality

## What not to do

- No airdrop, no token, no points program. The app has nothing to farm and pretending
  otherwise attracts the wrong users.
- No paid promotion for v1.
- No engagement-bait ("what's your biggest Solana pain point? 👇").
- No overclaiming security. "Never touches your keys" is true and sufficient; "bank-grade
  security" is meaningless and invites scrutiny you will fail.
