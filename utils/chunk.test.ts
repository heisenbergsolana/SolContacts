import { describe, expect, it } from 'vitest'
import { chunk } from '@/utils/chunk'

describe('chunk', () => {
  it('returns nothing for an empty list', () => {
    expect(chunk([], 10)).toEqual([])
  })

  it('splits a list that divides evenly', () => {
    expect(chunk([1, 2, 3, 4], 2)).toEqual([
      [1, 2],
      [3, 4],
    ])
  })

  it('keeps the remainder as a shorter final run', () => {
    expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]])
  })

  it('returns a single run when the list is smaller than the size', () => {
    expect(chunk([1, 2], 100)).toEqual([[1, 2]])
  })

  it('rejects a size that would loop forever', () => {
    expect(() => chunk([1], 0)).toThrow()
  })
})
