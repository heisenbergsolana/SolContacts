import { describe, expect, it } from 'vitest'
import { formatInteger } from './format-integer'

describe('formatInteger', () => {
  it('leaves values below a thousand alone', () => {
    expect(formatInteger(0)).toBe('0')
    expect(formatInteger(999)).toBe('999')
  })

  it('groups thousands', () => {
    expect(formatInteger(1_697)).toBe('1,697')
    expect(formatInteger(1_000_000)).toBe('1,000,000')
  })

  it('groups a bigint slot, which BigInt.toLocaleString does not under Hermes', () => {
    expect(formatInteger(444_292_656n)).toBe('444,292,656')
  })

  it('stays exact for bigints beyond Number.MAX_SAFE_INTEGER', () => {
    expect(formatInteger(99_999_999_999_999_999n)).toBe('99,999,999,999,999,999')
  })

  it('keeps the sign outside the grouping', () => {
    expect(formatInteger(-1_234_567n)).toBe('-1,234,567')
  })

  it('truncates a fractional number rather than grouping a decimal point', () => {
    expect(formatInteger(1_697.8)).toBe('1,697')
  })
})
