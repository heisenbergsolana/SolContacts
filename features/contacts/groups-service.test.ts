import { describe, expect, it } from 'vitest'
import { makeContact, makeGroup, VALID_ADDRESSES } from '@/test/fixtures'
import { GROUP_TONES } from '@/types/contact'
import { countByGroup, createGroup, detachGroup, nextTone, totalForGroup, updateGroup } from './groups-service'

const NOW = '2026-09-08T10:00:00.000Z'

describe('nextTone', () => {
  it('starts at the head of the palette', () => {
    expect(nextTone([])).toBe(GROUP_TONES[0])
  })

  it('skips the tones already in use', () => {
    const groups = [makeGroup({ id: 'a', tone: 'mint' }), makeGroup({ id: 'b', tone: 'cyan' })]
    expect(nextTone(groups)).toBe('violet')
  })

  /**
   * Least-used, not "the next one along". A palette that marches on would repeat a colour while the
   * one freed by a deleted group sits unused.
   */
  it('reuses the colour a deleted group freed', () => {
    const groups = GROUP_TONES.filter((tone) => tone !== 'pink').map((tone) => makeGroup({ id: tone, tone }))
    expect(nextTone(groups)).toBe('pink')
  })

  it('repeats the least-used tone once every colour is taken', () => {
    const groups = GROUP_TONES.map((tone) => makeGroup({ id: tone, tone }))
    groups.push(makeGroup({ id: 'ninth', tone: GROUP_TONES[0] }))
    expect(nextTone(groups)).toBe(GROUP_TONES[1])
  })
})

describe('createGroup', () => {
  it('trims the name and picks a tone', () => {
    const result = createGroup({ name: '  Friends  ' }, [], { now: NOW })

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value.name).toBe('Friends')
    expect(result.value.tone).toBe(GROUP_TONES[0])
    expect(result.value.createdAt).toBe(NOW)
    expect(result.value.id).toBeTruthy()
  })

  it('honours a tone the user chose', () => {
    const result = createGroup({ name: 'Cold storage', tone: 'amber' }, [], { now: NOW })
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.value.tone).toBe('amber')
  })

  it.each(['', '   '])('rejects the blank name %p', (name) => {
    const result = createGroup({ name }, [])
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error.code).toBe('group/invalid-name')
  })

  it('rejects a name past the limit', () => {
    const result = createGroup({ name: 'a'.repeat(33) }, [])
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error.code).toBe('group/invalid-name')
  })

  /** Refused rather than merged: merging would move contacts the user never asked to move. */
  it.each(['Friends', 'friends', '  FRIENDS '])('refuses %p when a group by that name exists', (name) => {
    const result = createGroup({ name }, [makeGroup({ name: 'Friends' })])

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.code).toBe('group/duplicate-name')
      expect(result.error.message).toContain('Friends')
    }
  })
})

describe('updateGroup', () => {
  it('renames without touching the id, so its contacts stay attached', () => {
    const existing = makeGroup({ id: 'group-1', name: 'Friends', createdAt: NOW })
    const result = updateGroup(existing, { name: 'Close friends' }, [existing])

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value).toEqual({ ...existing, name: 'Close friends' })
  })

  it('changes the tone when one is given and keeps it when it is not', () => {
    const existing = makeGroup({ tone: 'mint' })

    const recoloured = updateGroup(existing, { name: existing.name, tone: 'rose' }, [existing])
    expect(recoloured.ok && recoloured.value.tone).toBe('rose')

    const renamed = updateGroup(existing, { name: 'Pals' }, [existing])
    expect(renamed.ok && renamed.value.tone).toBe('mint')
  })

  it('does not report the group as a duplicate of itself', () => {
    const existing = makeGroup({ id: 'group-1', name: 'Friends' })
    expect(updateGroup(existing, { name: 'friends' }, [existing]).ok).toBe(true)
  })

  it('refuses a rename onto another group', () => {
    const existing = makeGroup({ id: 'group-1', name: 'Friends' })
    const other = makeGroup({ id: 'group-2', name: 'Exchanges' })

    const result = updateGroup(existing, { name: 'Exchanges' }, [existing, other])
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error.code).toBe('group/duplicate-name')
  })
})

describe('detachGroup', () => {
  /** Deleting a folder on a desktop takes its files. Deleting a group here must not. */
  it('ungroups the members and keeps every contact', () => {
    const contacts = [
      makeContact({ id: 'a', groupId: 'group-1' }),
      makeContact({ id: 'b', groupId: 'group-2' }),
      makeContact({ id: 'c' }),
    ]

    const result = detachGroup(contacts, 'group-1')

    expect(result).toHaveLength(3)
    expect(result[0]).not.toHaveProperty('groupId')
    expect(result[1].groupId).toBe('group-2')
    expect(result[2]).toBe(contacts[2])
  })
})

describe('countByGroup', () => {
  it('counts members and leaves empty groups out', () => {
    const counts = countByGroup([
      makeContact({ id: 'a', groupId: 'group-1' }),
      makeContact({ id: 'b', groupId: 'group-1' }),
      makeContact({ id: 'c' }),
    ])

    expect(counts.get('group-1')).toBe(2)
    expect(counts.has('group-2')).toBe(false)
  })
})

describe('totalForGroup', () => {
  const first = makeContact({ id: 'a', address: VALID_ADDRESSES[0], groupId: 'group-1' })
  const second = makeContact({ id: 'b', address: VALID_ADDRESSES[1], groupId: 'group-1' })
  const elsewhere = makeContact({ id: 'c', address: VALID_ADDRESSES[2], groupId: 'group-2' })

  it('adds up only the members of the group', () => {
    const balances = new Map([
      [VALID_ADDRESSES[0], 1_500_000_000n],
      [VALID_ADDRESSES[1], 500_000_000n],
      [VALID_ADDRESSES[2], 9_000_000_000n],
    ])

    expect(totalForGroup([first, second, elsewhere], 'group-1', balances)).toBe(2_000_000_000n)
  })

  /** A total built from the lookups that happened to work is a wrong number, not a partial one. */
  it('reports nothing when a member has no balance yet', () => {
    const balances = new Map([[VALID_ADDRESSES[0], 1_500_000_000n]])
    expect(totalForGroup([first, second], 'group-1', balances)).toBeUndefined()
  })

  it('is zero for an empty group, not undefined', () => {
    expect(totalForGroup([elsewhere], 'group-1', new Map())).toBe(0n)
  })
})
