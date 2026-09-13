/**
 * Extract a candidate Solana address from scanned QR content.
 *
 * A QR code is untrusted input from an unknown party, so this **parses**, it never acts. It returns
 * a string that might be an address; the caller decides by running `isValidSolanaAddress` on it.
 * Keeping extraction and validation separate is what lets this be a pure, fully tested function
 * while the camera stays untested.
 *
 * Formats understood — anything else is rejected rather than guessed at:
 *
 * | Input                                          | Result           |
 * |------------------------------------------------|------------------|
 * | `7xK4…92P`                                     | that address     |
 * | `solana:7xK4…92P`                              | that address     |
 * | `solana:7xK4…92P?amount=1.5&label=Alex`        | that address     |
 * | `https://explorer.solana.com/address/7xK4…92P` | that address     |
 * | `solana:https://merchant.example/pay`          | `null`           |
 * | anything else                                  | `null`           |
 *
 * Solana Pay parameters (`amount`, `label`, `message`, `spl-token`, `reference`) are **deliberately
 * discarded**. This app saves contacts; it does not initiate transfers. Honouring an amount or a
 * label from a scanned code would let a crafted QR preset a value or attach a misleading name to
 * someone else's wallet.
 */

const SOLANA_SCHEME = 'solana:'

/**
 * Base58 excludes 0, O, I and l. A Solana address is 32 bytes, encoding to 32-44 characters.
 *
 * Anchored on purpose. An unanchored match would accept `bitcoin:1A1zP1…` and hand back the whole
 * string, which then fails validation as an "invalid Solana address" — technically safe, but it
 * tells the user the wrong thing about a QR code that was never a Solana address to begin with.
 */
const BARE_ADDRESS = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/

/** `/address/<base58>` (Explorer, Solana.fm) or `/account/<base58>` (Solscan). */
const EXPLORER_PATH = /\/(?:address|account)\/([1-9A-HJ-NP-Za-km-z]{32,44})/

function looksLikeUrl(value: string): boolean {
  return /^[a-z][a-z0-9+.-]*:\/\//i.test(value)
}

export function parseQrPayload(raw: string): string | null {
  const value = raw.trim()
  if (value.length === 0) return null

  if (value.toLowerCase().startsWith(SOLANA_SCHEME)) {
    const body = value.slice(SOLANA_SCHEME.length).split('?')[0]?.trim() ?? ''
    // A Solana Pay *transaction request* puts a URL here rather than a recipient. That is a
    // different feature with different consequences, so it is refused, not partially honoured.
    if (body.length === 0 || looksLikeUrl(body)) return null
    return body
  }

  if (looksLikeUrl(value)) {
    const match = EXPLORER_PATH.exec(value)
    return match?.[1] ?? null
  }

  // A bare payload is only a candidate if the whole string could be an address; returning arbitrary
  // scanned text would push the rejection into the UI as a confusing "invalid address" error.
  return BARE_ADDRESS.test(value) ? value : null
}
