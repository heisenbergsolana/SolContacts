# 10 — Solana dApp Store Release Runbook

Verified against official documentation, September 2026. **Re-verify before submitting** —
these requirements change. Start at <https://docs.solanamobile.com/llms.txt>.

---

## Hard requirements

| Requirement       | Value                                                                                                    | Source                                                                                           |
| ----------------- | -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Artifact format   | **APK** — not `.aab`                                                                                     | [build-and-sign-an-apk](https://docs.solanamobile.com/dapp-store/build-and-sign-an-apk.md)       |
| Build type        | **Release, signed.** Debug builds are rejected                                                           | same                                                                                             |
| Signing key       | A **dedicated key for the dApp Store**. If the app is also on Google Play, it must use a _different_ key | same                                                                                             |
| App icon          | **512 × 512 px**                                                                                         | [listing-page-guidelines](https://docs.solanamobile.com/dapp-publishing/listing-page-guidelines) |
| Feature banner    | **1200 × 600 px**                                                                                        | same                                                                                             |
| Screenshots       | **min 1080 px**, all the same orientation, all the same aspect ratio                                     | same                                                                                             |
| Video (optional)  | `.mp4`, min 720p, 1920×1080 recommended                                                                  | same                                                                                             |
| Short description | **max 30 characters**                                                                                    | same                                                                                             |
| Submission        | Publisher Portal at <https://publish.solanamobile.com>                                                   | [submit-new-app](https://docs.solanamobile.com/dapp-store/submit-new-app.md)                     |
| Publisher account | Requires KYC / KYB                                                                                       | same                                                                                             |
| Cost              | ~**0.2 SOL** for transaction fees. Storage is free on the portal's managed Cloudflare R2 bucket          | same                                                                                             |
| Review time       | **3–5 business days**                                                                                    | same                                                                                             |

> **Losing the signing keystore means you can never update the app again.** Back it up in at
> least two places before you build anything with it. It is never committed to git.

---

## Step 1 — Generate the signing key

```bash
keytool -genkey -v -keystore solcontacts-dappstore.keystore \
  -alias solcontacts \
  -keyalg RSA -keysize 2048 -validity 10000
```

Store outside the repo (e.g. `~/keys/solcontacts/`). Record in a password manager:
keystore file, store password, key alias, key password.

`*.keystore` and `*.jks` are already in `.gitignore` — verify with `git status` before committing.

## Step 2 — Build the release APK

**With EAS** — the profile is committed as [`eas.json`](../eas.json):

```json
{
  "cli": { "version": ">= 12.0.0", "appVersionSource": "local" },
  "build": {
    "dapp-store": {
      "android": { "buildType": "apk" },
      "env": { "ORG_GRADLE_PROJECT_reactNativeArchitectures": "arm64-v8a" },
      "autoIncrement": false
    }
  }
}
```

```bash
npx eas-cli@latest build --platform android --profile dapp-store
```

Three decisions are baked into that profile:

- **`appVersionSource: "local"`** with **`autoIncrement: false`** — the version of record is
  `android.versionCode` in `app.json`, not a counter on EAS's servers. Bump it there, in a commit,
  so the number that shipped is visible in git.
- **`reactNativeArchitectures=arm64-v8a`** — the template builds four ABIs into one universal APK.
  The Seeker is arm64, and every extra ABI carries its own copy of Hermes and the native modules.
  Gradle reads the override from the `ORG_GRADLE_PROJECT_` environment variable; locally the same
  thing is `-PreactNativeArchitectures=arm64-v8a`.
- **`buildType: "apk"`** — the store rejects `.aab`.

EAS will offer to generate a keystore or use the one you supply — supply your own so you
control it.

**Locally (after `npx expo prebuild`):**

```groovy
// android/app/build.gradle
signingConfigs {
    dappStore {
        storeFile file("/absolute/path/to/solcontacts-dappstore.keystore")
        storePassword System.getenv("SOLCONTACTS_STORE_PASSWORD")
        keyAlias "solcontacts"
        keyPassword System.getenv("SOLCONTACTS_KEY_PASSWORD")
    }
}
buildTypes {
    release { signingConfig signingConfigs.dappStore }
}
```

```bash
cd android && ./gradlew assembleRelease -PreactNativeArchitectures=arm64-v8a
# output: android/app/build/outputs/apk/release/app-release.apk
```

> `android/` is generated and gitignored, so a signing block written into
> `android/app/build.gradle` by hand is erased by the next `expo prebuild`. Going this route
> means a config plugin that reinstates it on every prebuild. EAS avoids that problem entirely,
> which is why it is listed first.

Passwords come from environment variables, never from a committed file.

## Step 3 — Verify the APK

```bash
apksigner verify --print-certs app-release.apk
aapt dump badging app-release.apk | head -20   # confirm package, versionCode, versionName
```

Checklist:

- [ ] Signed with the dApp Store key (fingerprint matches your record)
- [ ] `versionCode` is higher than any previously submitted build
- [ ] `versionName` matches the git tag
- [ ] Package name is `com.solcontacts.app`
- [ ] Installs and runs on a **clean** device (uninstall the dev build first)

## Step 4 — Prepare listing assets

Store under `assets/store/`:

```
assets/store/
  icon-512.png            512×512, no alpha issues, follows Google Play icon design spec
  banner-1200x600.png
  screenshot-1-home.png       ≥1080px, portrait
  screenshot-2-detail.png     same aspect ratio
  screenshot-3-qr.png
  screenshot-4-scan.png
  screenshot-5-add.png
```

See [11-BRANDING.md](11-BRANDING.md) for the visual specification.

## Step 5 — Listing copy

**App name:** `SolContacts`

**Short description (≤ 30 chars)** — candidates, count carefully:

| Candidate                    | Length |
| ---------------------------- | ------ |
| `Your Solana address book`   | 24     |
| `Solana wallet address book` | 26     |
| `Save Solana addresses`      | 21     |

Recommended: `Your Solana address book` (24).

**Long description (draft):**

> Stop pasting wallet addresses from your notes app.
>
> SolContacts is a simple, fast address book for Solana. Save the wallets you actually use —
> your cold wallet, your trading wallet, your friends — and get them back in one tap.
>
> • **Validated addresses.** Every address is checked before it can be saved. A malformed
> Solana address simply cannot be stored.
> • **QR in and out.** Scan a wallet QR to add a contact, and show a QR for any contact you
> want to receive at.
> • **Copy and share.** One tap to copy, one tap to share through your phone's own share sheet.
> • **Balances.** See the SOL balance of any saved address at a glance.
> • **Explorer.** Jump straight to Solana Explorer for any contact.
>
> **SolContacts is not a wallet.** It never asks for a private key or seed phrase and never
> can. It works only with public wallet addresses, stored on your device. No account, no
> servers, no analytics, no tracking.
>
> Built for Solana Seeker.

**Category:** Utilities / Tools
**Tags:** wallet, utility, tools, address book, QR

## Step 6 — Publisher Portal submission

1. Sign in at <https://publish.solanamobile.com>
2. Create the publisher account, complete **KYC/KYB** — _start this early, it takes time_
3. Connect the publisher wallet (Phantom / Solflare / Backpack). This wallet controls all
   future updates — use one you will not lose
4. Configure storage — the portal now defaults to a **managed Cloudflare R2** bucket that is
   ready without any funding, and that is what SolContacts uses. ArDrive (pay-as-you-go Turbo
   credits, permanent Arweave storage) and a bring-your-own AWS S3 bucket remain as options;
   neither is required. _Observed in the portal 2026-09-13; the docs still describe the older
   ArDrive-or-S3 choice._
5. _Add a dApp → New dApp_; fill in name, descriptions, category, assets
6. _New Version_ → upload the signed release APK
7. Approve the signing requests for Arweave upload and release NFT minting (~0.2 SOL total)
8. Submit for review; the result arrives from `publishersupport@dappstore.solanamobile.com`
   within 3–5 business days

## Step 7 — Pre-submission checklist

**Build**

- [ ] Release APK, signed with the dedicated dApp Store key
- [ ] Version code incremented; version name matches the git tag
- [ ] Tested from a clean install on a real Android device
- [ ] Tested on Seeker hardware if available
- [ ] No debug menus, no placeholder copy, no `console.log` in production paths
- [ ] `build.gradle` declares the supported locales

**Function**

- [ ] Every screen reachable and every flow completable
- [ ] Works offline (except balances, which degrade gracefully)
- [ ] Camera permission denial handled with a manual-entry fallback
- [ ] Empty state, error states and loading states all verified

**Compliance**

- [ ] Complies with the [publisher policy](https://docs.solanamobile.com/dapp-store/publisher-policy.md)
- [ ] Privacy policy and terms of use live at public URLs and linked from the listing - <https://heisenbergsolana.github.io/solcontacts-privacy.html> - <https://heisenbergsolana.github.io/solcontacts-terms.html>
- [ ] No private key handling anywhere — see [07-SECURITY-PRIVACY.md](07-SECURITY-PRIVACY.md)
- [ ] Permission list minimal and justified

**Assets**

- [ ] Icon 512×512
- [ ] Banner 1200×600
- [ ] Screenshots ≥1080px, consistent aspect ratio and orientation
- [ ] Short description ≤ 30 characters (count it, don't estimate)

## Updates

Submitting an update uses the same portal flow with a new APK, an incremented `versionCode`,
**the same signing key**, and the same publisher wallet.
See [submit-an-update](https://docs.solanamobile.com/dapp-store/submit-an-update.md).

## If the submission is rejected

Rejections come with a reason. Fix, increment `versionCode`, rebuild, resubmit. Record what
happened in this file so the same mistake is not repeated.
