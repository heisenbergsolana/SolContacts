export const LAMPORTS_PER_SOL = 1_000_000_000n

/**
 * Format a lamport balance as a SOL string.
 *
 * The division is done in `bigint` deliberately. The obvious `Number(lamports) / 1e9` — which is
 * what this template originally shipped — is exact for most values, which is precisely what makes
 * it dangerous: it fails only above 2^53 lamports (~9,007,199 SOL) and only for values that are not
 * representable as a double. A balance of 99999999.999999999 SOL formats as a flat `100000000`
 * under float maths. Displaying a wrong balance in an app people use to check wallets is not a
 * rounding detail, so the tests pin values that actually expose the difference.
 *
 * Trailing zeros are trimmed: `12.4200` reads as noise, `12.42` reads as a balance.
 */
export function formatSol(lamports: bigint, decimals = 4): string {
  const negative = lamports < 0n
  const magnitude = negative ? -lamports : lamports

  const whole = magnitude / LAMPORTS_PER_SOL
  const fraction = magnitude % LAMPORTS_PER_SOL
  const fractionText = fraction.toString().padStart(9, '0').slice(0, decimals).replace(/0+$/, '')

  const formatted = fractionText.length > 0 ? `${whole}.${fractionText}` : `${whole}`
  return negative ? `-${formatted}` : formatted
}
