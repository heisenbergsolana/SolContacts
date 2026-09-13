/**
 * Group an integer with thousands separators.
 *
 * `Number.prototype.toLocaleString` handles this, but `BigInt.prototype.toLocaleString` is not
 * formatted by Hermes' Intl build — it silently falls back to `toString()`, so a slot renders as
 * `444292656` next to a TPS of `1,697`. Converting the bigint to a Number to get around that would
 * trade a cosmetic bug for a precision one, so the grouping is done on the digits directly.
 */
export function formatInteger(value: bigint | number): string {
  const text = typeof value === 'bigint' ? value.toString() : Math.trunc(value).toString()
  const negative = text.startsWith('-')
  const digits = negative ? text.slice(1) : text

  const grouped = digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return negative ? `-${grouped}` : grouped
}
