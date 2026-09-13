/**
 * Split `items` into runs of at most `size`.
 *
 * It exists because RPC batch endpoints cap how many keys a single request may carry, and a
 * silently truncated batch would look exactly like a set of wallets that hold nothing.
 */
export function chunk<T>(items: readonly T[], size: number): T[][] {
  if (size < 1) throw new Error('chunk size must be at least 1')

  const chunks: T[][] = []
  for (let start = 0; start < items.length; start += size) {
    chunks.push(items.slice(start, start + size))
  }
  return chunks
}
