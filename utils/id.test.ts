import { describe, expect, it } from 'vitest'
import { createId } from './id'

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/

describe('createId', () => {
  it('produces a canonical v4 UUID', () => {
    expect(createId()).toMatch(UUID_V4)
  })

  it('sets the version nibble to 4 and the variant to 10xx', () => {
    for (let attempt = 0; attempt < 50; attempt++) {
      const id = createId()
      expect(id[14]).toBe('4')
      expect('89ab').toContain(id[19])
    }
  })

  it('does not repeat', () => {
    const ids = new Set(Array.from({ length: 1000 }, createId))
    expect(ids.size).toBe(1000)
  })
})
