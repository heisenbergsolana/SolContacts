/**
 * The single place a cluster or RPC endpoint may be defined. Nothing else in the app may hardcode
 * one — see docs/06-SOLANA.md.
 */

export type ClusterName = 'mainnet-beta' | 'devnet'

/**
 * Mainnet by default, devnet when `EXPO_PUBLIC_CLUSTER=devnet` is set.
 *
 * The app only ever reads, so mainnet is the safe default rather than the risky one: devnet
 * reports 0 SOL for every address a user actually knows, which makes the balance feature
 * impossible to check on a real device.
 *
 * It stays a build-time switch anyway, for anyone testing against devnet — set the variable in
 * `.env` and rebuild the bundle; no native rebuild, no code change.
 */
export const CLUSTER_NAME: ClusterName = process.env.EXPO_PUBLIC_CLUSTER === 'devnet' ? 'devnet' : 'mainnet-beta'

/**
 * Solana's own endpoint for the cluster. Heavily rate limited and explicitly not intended for
 * production traffic, so it is the fallback rather than the destination — see `RPC_URL`.
 */
export const PUBLIC_RPC_URL =
  CLUSTER_NAME === 'devnet' ? 'https://api.devnet.solana.com' : 'https://api.mainnet-beta.solana.com'

/**
 * `EXPO_PUBLIC_RPC_URL` points the app at a real provider without a code change.
 *
 * Anything prefixed `EXPO_PUBLIC_` is bundled into the shipped app and is therefore **not secret**:
 * a key put here can be read out of the APK by anyone who wants it. Only ever use one whose worst
 * case is an exhausted quota — never one attached to a card or to anything that can be spent.
 *
 * Unset, the app runs on `PUBLIC_RPC_URL`, which works for development and will not hold up under
 * real traffic.
 */
export const RPC_URL = process.env.EXPO_PUBLIC_RPC_URL ?? PUBLIC_RPC_URL

/**
 * Whether the app has somewhere to fall back to. False when no provider is configured, in which
 * case the primary and the fallback would be the same endpoint and trying twice buys nothing.
 */
export const HAS_RPC_FALLBACK = RPC_URL !== PUBLIC_RPC_URL

/**
 * Solana Explorer. The app never fetches this — it is handed to `Linking.openURL` — but it lives
 * here anyway so that "every URL is in app-config.ts" stays literally true. A security check that
 * reports false positives is a check people learn to skip.
 */
export const EXPLORER_BASE_URL = 'https://explorer.solana.com'

/**
 * The pages the About screen opens, for the same reason as the explorer URL above: they are handed
 * to `Linking.openURL` rather than fetched, but every URL in this app lives in this file.
 *
 * The two policy links are also what the dApp Store listing points at, so a change here is a change
 * the listing has to follow.
 */
export const PRIVACY_POLICY_URL = 'https://heisenbergsolana.github.io/solcontacts-privacy.html'
export const TERMS_OF_USE_URL = 'https://heisenbergsolana.github.io/solcontacts-terms.html'
export const PUBLISHER_URL = 'https://heisenbergsolana.github.io'
export const SOURCE_CODE_URL = 'https://github.com/heisenbergsolana/SolContacts'
