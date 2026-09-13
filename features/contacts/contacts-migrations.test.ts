import { describe, expect, it } from 'vitest'
import { makeContact, makeGroup } from '@/test/fixtures'
import { GROUP_TONES } from '@/types/contact'
import { CURRENT_SCHEMA_VERSION, emptyDocument, isContact, isGroup, migrateDocument } from './contacts-migrations'

const NOW = '2026-09-08T10:00:00.000Z'

/** A v1 contact: its group was a free-text string on the contact itself. */
function makeLegacyContact(overrides: Record<string, unknown> = {}) {
  const { id, name, address, createdAt, updatedAt } = makeContact()
  return { id, name, address, createdAt, updatedAt, ...overrides }
}

describe('emptyDocument', () => {
  it('is a valid current-version document, not null', () => {
    expect(emptyDocument()).toEqual({ schemaVersion: CURRENT_SCHEMA_VERSION, contacts: [], groups: [] })
  })
})

describe('isContact', () => {
  it('accepts a complete contact', () => {
    expect(isContact(makeContact())).toBe(true)
  })

  it('accepts optional fields when present', () => {
    expect(isContact(makeContact({ note: 'cold wallet', groupId: 'group-1', pinned: true }))).toBe(true)
  })

  it.each(['id', 'name', 'address', 'createdAt', 'updatedAt'] as const)('rejects a missing %s', (field) => {
    const contact: Record<string, unknown> = { ...makeContact() }
    delete contact[field]
    expect(isContact(contact)).toBe(false)
  })

  it.each([null, undefined, 'string', 42, []])('rejects the non-object %s', (value) => {
    expect(isContact(value)).toBe(false)
  })

  it('rejects a non-string note', () => {
    expect(isContact({ ...makeContact(), note: 42 })).toBe(false)
  })

  /** `pinned: 'yes'` would be truthy everywhere it is read, so the type has to be checked. */
  it('rejects a non-boolean pin', () => {
    expect(isContact({ ...makeContact(), pinned: 'yes' })).toBe(false)
  })
})

describe('isGroup', () => {
  it('accepts a complete group', () => {
    expect(isGroup(makeGroup())).toBe(true)
  })

  /** There is no safe colour to guess for a label, so an unknown tone loses the whole group. */
  it('rejects a tone the palette does not have', () => {
    expect(isGroup({ ...makeGroup(), tone: 'chartreuse' })).toBe(false)
  })

  it.each(['id', 'name', 'createdAt', 'tone'] as const)('rejects a missing %s', (field) => {
    const group: Record<string, unknown> = { ...makeGroup() }
    delete group[field]
    expect(isGroup(group)).toBe(false)
  })
})

describe('migrateDocument', () => {
  it('passes a current document through', () => {
    const document = {
      schemaVersion: CURRENT_SCHEMA_VERSION,
      contacts: [makeContact({ groupId: 'group-1' })],
      groups: [makeGroup()],
    }
    expect(migrateDocument(document)).toEqual({ ok: true, value: document })
  })

  /** A document written before groups existed simply has no `groups` key. */
  it('reads a document with no groups key as a document with no groups', () => {
    const result = migrateDocument({ schemaVersion: CURRENT_SCHEMA_VERSION, contacts: [makeContact()] })
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.value.groups).toEqual([])
  })

  it('reports a newer schema instead of downgrading it', () => {
    const result = migrateDocument({ schemaVersion: CURRENT_SCHEMA_VERSION + 1, contacts: [] })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error.code).toBe('storage/unsupported-schema')
  })

  it('drops malformed contacts but keeps the valid ones', () => {
    const good = makeContact({ id: 'keep' })
    const result = migrateDocument({
      schemaVersion: CURRENT_SCHEMA_VERSION,
      contacts: [good, { id: 'broken' }, null],
      groups: [],
    })
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.value.contacts).toEqual([good])
  })

  it('drops a groupId that names no group rather than rendering a nameless chip', () => {
    const result = migrateDocument({
      schemaVersion: CURRENT_SCHEMA_VERSION,
      contacts: [makeContact({ groupId: 'deleted-group' })],
      groups: [],
    })
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.value.contacts[0]).not.toHaveProperty('groupId')
  })

  it.each([null, 'nonsense', 42, {}, { schemaVersion: 0, contacts: [] }, { schemaVersion: 1 }])(
    'reports corruption for %s',
    (value) => {
      const result = migrateDocument(value)
      expect(result.ok).toBe(false)
      if (!result.ok) expect(result.error.code).toBe('storage/corrupt')
    },
  )
})

describe('migrateDocument, v1 to v2', () => {
  it('turns each category into a group and points its contacts at it', () => {
    const result = migrateDocument(
      {
        schemaVersion: 1,
        contacts: [
          makeLegacyContact({ id: 'a', category: 'Friends' }),
          makeLegacyContact({ id: 'b', category: 'Exchanges' }),
          makeLegacyContact({ id: 'c', category: 'Friends' }),
        ],
      },
      { now: NOW },
    )

    expect(result.ok).toBe(true)
    if (!result.ok) return

    expect(result.value.groups.map((group) => group.name)).toEqual(['Friends', 'Exchanges'])
    expect(result.value.groups.map((group) => group.tone)).toEqual(['mint', 'cyan'])
    expect(result.value.groups.every((group) => group.createdAt === NOW)).toBe(true)

    const [friends] = result.value.groups
    expect(result.value.contacts.map((contact) => contact.groupId)).toEqual([
      friends.id,
      result.value.groups[1].id,
      friends.id,
    ])
  })

  /** Someone who typed "Friends" once and "friends" later meant one group both times. */
  it('folds two spellings of one category into a single group', () => {
    const result = migrateDocument(
      {
        schemaVersion: 1,
        contacts: [
          makeLegacyContact({ id: 'a', category: 'Friends' }),
          makeLegacyContact({ id: 'b', category: '  friends ' }),
        ],
      },
      { now: NOW },
    )

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value.groups).toHaveLength(1)
    // The first spelling wins, not the last one seen.
    expect(result.value.groups[0].name).toBe('Friends')
    expect(new Set(result.value.contacts.map((contact) => contact.groupId)).size).toBe(1)
  })

  it.each([undefined, '', '   '])('leaves a contact with the category %p ungrouped', (category) => {
    const result = migrateDocument({ schemaVersion: 1, contacts: [makeLegacyContact({ category })] }, { now: NOW })

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value.groups).toEqual([])
    expect(result.value.contacts[0]).not.toHaveProperty('groupId')
    expect(result.value.contacts[0]).not.toHaveProperty('category')
  })

  /** Nine categories and eight tones: a repeated colour is a duller book, never a lost one. */
  it('wraps the tones rather than refusing a ninth category', () => {
    const contacts = GROUP_TONES.map((_tone, index) => makeLegacyContact({ id: `c${index}`, category: `g${index}` }))
    contacts.push(makeLegacyContact({ id: 'ninth', category: 'ninth' }))

    const result = migrateDocument({ schemaVersion: 1, contacts }, { now: NOW })

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value.groups).toHaveLength(GROUP_TONES.length + 1)
    expect(result.value.groups[GROUP_TONES.length].tone).toBe(GROUP_TONES[0])
  })

  it('drops a malformed v1 contact instead of migrating it', () => {
    const result = migrateDocument(
      { schemaVersion: 1, contacts: [makeLegacyContact({ id: 'keep', category: 'Friends' }), { id: 'broken' }] },
      { now: NOW },
    )

    expect(result.ok).toBe(true)
    if (result.ok) expect(result.value.contacts.map((contact) => contact.id)).toEqual(['keep'])
  })

  it('stamps the migrated document with the current version', () => {
    const result = migrateDocument({ schemaVersion: 1, contacts: [] }, { now: NOW })
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.value.schemaVersion).toBe(CURRENT_SCHEMA_VERSION)
  })
})
