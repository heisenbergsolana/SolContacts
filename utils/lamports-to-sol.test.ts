import { describe, expect, it } from 'vitest'
import { formatSol, LAMPORTS_PER_SOL } from './lamports-to-sol'

describe('formatSol', () => {
  it('shows an exact zero as 0, not as a dash or an empty string', () => {
    expect(formatSol(0n)).toBe('0')
  })

  it('formats whole SOL without a decimal point', () => {
    expect(formatSol(LAMPORTS_PER_SOL)).toBe('1')
    expect(formatSol(12n * LAMPORTS_PER_SOL)).toBe('12')
  })

  it('trims trailing zeros', () => {
    expect(formatSol(500_000_000n)).toBe('0.5')
    expect(formatSol(1_420_000_000n)).toBe('1.42')
  })

  it('truncates below the requested precision rather than rounding up', () => {
    expect(formatSol(1_234_567_890n)).toBe('1.2345')
    expect(formatSol(1n)).toBe('0')
  })

  it('honours a custom precision', () => {
    expect(formatSol(1_234_567_890n, 9)).toBe('1.23456789')
    expect(formatSol(1_234_567_890n, 2)).toBe('1.23')
  })

  it('handles large round balances', () => {
    expect(formatSol(10_000_000n * LAMPORTS_PER_SOL)).toBe('10000000')
    expect(formatSol(10_000_000n * LAMPORTS_PER_SOL + 250_000_000n)).toBe('10000000.25')
  })

  /**
   * The regression guards against float maths coming back.
   *
   * Both values sit above 2^53 lamports and are not representable as doubles, so
   * `Number(lamports) / 1e9` gets them wrong. Most large values survive the float version intact,
   * which is exactly why a casual test does not catch it — these two were picked because they do
   * not. The second is the alarming one: a balance nine-nines short of 100 million SOL is displayed
   * as a flat, round 100000000.
   */
  it('stays exact where float division does not', () => {
    expect(9_007_199_254_740_995n).toBeGreaterThan(BigInt(Number.MAX_SAFE_INTEGER))

    // float: 9007199.254740996
    expect(formatSol(9_007_199_254_740_995n, 9)).toBe('9007199.254740995')

    // float: 100000000
    expect(formatSol(99_999_999_999_999_999n, 9)).toBe('99999999.999999999')
    expect(formatSol(99_999_999_999_999_999n)).toBe('99999999.9999')
  })

  it('handles a negative value without mangling the sign', () => {
    expect(formatSol(-1_500_000_000n)).toBe('-1.5')
  })
})
