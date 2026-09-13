import { describe, expect, it } from 'vitest'
import { makeContact, VALID_ADDRESSES } from '@/test/fixtures'
import {
  createContact,
  filterByGroup,
  findDuplicateAddress,
  GroupFilter,
  orderContacts,
  searchContacts,
  updateContact,
} from './contacts-service'

const NOW = '2026-09-04T12:00:00.000Z'
const input = { name: 'Alex', address: VALID_ADDRESSES[0] }

describe('createContact', () => {
  it('stamps both timestamps and generates an id', () => {
    const result = createContact(input, { now: NOW })

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value.createdAt).toBe(NOW)
    expect(result.value.updatedAt).toBe(NOW)
    expect(result.value.id).toHaveLength(36)
  })

  it('trims the name and the address', () => {
    const result = createContact({ name: '  Alex  ', address: `  ${VALID_ADDRESSES[0]}  ` }, { now: NOW })

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.name).toBe('Alex')
      expect(result.value.address).toBe(VALID_ADDRESSES[0])
    }
  })

  it('omits empty optionals rather than storing empty strings', () => {
    const result = createContact({ ...input, note: '   ', groupId: '', pinned: false }, { now: NOW })

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect('note' in result.value).toBe(false)
      expect('groupId' in result.value).toBe(false)
      // `pinned: false` would round trip as a decision rather than as the default.
      expect('pinned' in result.value).toBe(false)
    }
  })

  it('keeps the group and the pin when they are set', () => {
    const result = createContact({ ...input, groupId: ' group-1 ', pinned: true }, { now: NOW })

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.groupId).toBe('group-1')
      expect(result.value.pinned).toBe(true)
    }
  })

  it.each(['', '   '])('rejects the blank name %p', (name) => {
    const result = createContact({ ...input, name })

    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error.code).toBe('contact/invalid-name')
  })

  it('rejects a name over the limit', () => {
    const result = createContact({ ...input, name: 'a'.repeat(65) })

    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error.code).toBe('contact/invalid-name')
  })

  it('rejects an invalid address before it can reach storage', () => {
    const result = createContact({ ...input, address: 'not-an-address' })

    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error.code).toBe('contact/invalid-address')
  })

  it('rejects an over-long note', () => {
    expect(createContact({ ...input, note: 'a'.repeat(281) }).ok).toBe(false)
  })

  it('does not lowercase the address, which would change it', () => {
    const mixed = VALID_ADDRESSES[1]
    const result = createContact({ name: 'Token', address: mixed }, { now: NOW })

    expect(result.ok).toBe(true)
    if (result.ok) expect(result.value.address).toBe(mixed)
  })
})

describe('updateContact', () => {
  const existing = makeContact({ createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' })

  it('keeps the id and createdAt, and refreshes updatedAt', () => {
    const result = updateContact(existing, { name: 'Alexandra', address: existing.address }, { now: NOW })

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value.id).toBe(existing.id)
    expect(result.value.createdAt).toBe(existing.createdAt)
    expect(result.value.updatedAt).toBe(NOW)
    expect(result.value.name).toBe('Alexandra')
  })

  it('clears an optional field when it is emptied', () => {
    const withNote = makeContact({ note: 'old note' })
    const result = updateContact(withNote, { name: withNote.name, address: withNote.address, note: '' }, { now: NOW })

    expect(result.ok).toBe(true)
    if (result.ok) expect('note' in result.value).toBe(false)
  })

  it('applies the same validation as creation', () => {
    const result = updateContact(existing, { name: '', address: existing.address })

    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error.code).toBe('contact/invalid-name')
  })
})

describe('findDuplicateAddress', () => {
  const alex = makeContact({ id: 'a', name: 'Alex', address: VALID_ADDRESSES[0] })
  const blair = makeContact({ id: 'b', name: 'Blair', address: VALID_ADDRESSES[1] })

  it('finds another contact holding the same address', () => {
    expect(findDuplicateAddress([alex, blair], VALID_ADDRESSES[0])).toBe(alex)
  })

  it('returns undefined when the address is new', () => {
    expect(findDuplicateAddress([alex, blair], VALID_ADDRESSES[2])).toBeUndefined()
  })

  it('does not let a contact flag itself while being edited', () => {
    expect(findDuplicateAddress([alex, blair], VALID_ADDRESSES[0], 'a')).toBeUndefined()
  })
})

describe('searchContacts', () => {
  const alex = makeContact({ id: 'a', name: 'Alex', address: VALID_ADDRESSES[0] })
  const cold = makeContact({ id: 'b', name: 'My Cold Wallet', address: VALID_ADDRESSES[1] })
  const contacts = [alex, cold]

  it('returns everything for an empty or whitespace query', () => {
    expect(searchContacts(contacts, '')).toEqual(contacts)
    expect(searchContacts(contacts, '   ')).toEqual(contacts)
  })

  it('matches a name case-insensitively', () => {
    expect(searchContacts(contacts, 'aLeX')).toEqual([alex])
  })

  it('matches part of a name', () => {
    expect(searchContacts(contacts, 'cold')).toEqual([cold])
  })

  it('matches an address, case-insensitively', () => {
    expect(searchContacts(contacts, VALID_ADDRESSES[1].toLowerCase())).toEqual([cold])
  })

  it('matches a leading fragment of an address, as a user would paste', () => {
    expect(searchContacts(contacts, VALID_ADDRESSES[1].slice(0, 6))).toEqual([cold])
  })

  it('returns an empty array, never undefined, when nothing matches', () => {
    expect(searchContacts(contacts, 'zzz')).toEqual([])
  })

  it('does not hand back the caller its own array to mutate', () => {
    expect(searchContacts(contacts, '')).not.toBe(contacts)
  })
})

describe('filterByGroup', () => {
  const grouped = makeContact({ id: 'grouped', groupId: 'group-1' })
  const other = makeContact({ id: 'other', groupId: 'group-2' })
  const loose = makeContact({ id: 'loose' })
  const contacts = [grouped, other, loose]

  it.each([
    ['all', ['grouped', 'other', 'loose']],
    ['ungrouped', ['loose']],
  ] as const)('filters by %s', (filter, expected) => {
    expect(filterByGroup(contacts, filter as GroupFilter).map((contact) => contact.id)).toEqual(expected)
  })

  it('filters by a group', () => {
    expect(filterByGroup(contacts, { groupId: 'group-1' }).map((contact) => contact.id)).toEqual(['grouped'])
  })

  it('returns a copy rather than the array it was given', () => {
    expect(filterByGroup(contacts, 'all')).not.toBe(contacts)
  })
})

describe('orderContacts', () => {
  it('lifts pinned contacts to the top', () => {
    const contacts = [
      makeContact({ id: 'a' }),
      makeContact({ id: 'b', pinned: true }),
      makeContact({ id: 'c' }),
      makeContact({ id: 'd', pinned: true }),
    ]

    expect(orderContacts(contacts).map((contact) => contact.id)).toEqual(['b', 'd', 'a', 'c'])
  })

  /** Insertion order is the only order the user has chosen; a pin must not reshuffle the rest. */
  it('leaves the order alone when nothing is pinned', () => {
    const contacts = [makeContact({ id: 'a' }), makeContact({ id: 'b' })]
    expect(orderContacts(contacts).map((contact) => contact.id)).toEqual(['a', 'b'])
  })
})
