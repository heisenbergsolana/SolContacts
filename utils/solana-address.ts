import { isAddress } from '@solana/kit'

/**
 * Is this a well-formed Solana address?
 *
 * `isAddress` checks that the string decodes from base58 to exactly 32 bytes. It does **not** check
 * that the account exists on chain, that it sits on the ed25519 curve (a PDA is a valid address and
 * a user may legitimately want to save one), or that it belongs to whoever they think it does.
 *
 * The UI must not imply more than that: "valid" here means well-formed, never verified-as-someone's.
 *
 * Never hand-roll a base58 or length check anywhere else — one function, one source of truth.
 */
export function isValidSolanaAddress(candidate: string): boolean {
  return isAddress(candidate.trim())
}
