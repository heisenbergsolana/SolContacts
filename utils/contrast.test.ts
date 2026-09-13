import { describe, expect, it } from 'vitest'
import { contrastRatio, relativeLuminance } from '@/utils/contrast'

describe('relativeLuminance', () => {
  it('puts black at zero and white at one', () => {
    expect(relativeLuminance('#000000')).toBe(0)
    expect(relativeLuminance('#FFFFFF')).toBe(1)
  })

  it('rejects anything that is not a six-digit hex colour', () => {
    expect(() => relativeLuminance('#FFF')).toThrow()
    expect(() => relativeLuminance('rebeccapurple')).toThrow()
  })
})

describe('contrastRatio', () => {
  it('returns 21 for black on white', () => {
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 5)
  })

  it('returns 1 for a colour against itself', () => {
    expect(contrastRatio('#9945FF', '#9945FF')).toBe(1)
  })

  it('does not care which colour is the foreground', () => {
    expect(contrastRatio('#0B0D10', '#F2F4F7')).toBeCloseTo(contrastRatio('#F2F4F7', '#0B0D10'), 10)
  })

  it('accepts a colour written without the leading hash', () => {
    expect(contrastRatio('000000', 'FFFFFF')).toBeCloseTo(21, 5)
  })
})
