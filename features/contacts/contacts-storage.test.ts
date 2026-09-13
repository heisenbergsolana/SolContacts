import { describe, expect, it } from 'vitest'
import { createFakeStorage, makeContact, makeGroup } from '@/test/fixtures'
import { CURRENT_SCHEMA_VERSION } from './contacts-migrations'
import { CORRUPT_KEY_PREFIX, createContactsStorage, STORAGE_KEY } from './contacts-storage'

describe('createContactsStorage', () => {
  it('returns an empty document when nothing has been saved yet', async () => {
    const result = await createContactsStorage(createFakeStorage()).load()

    expect(result).toEqual({ ok: true, value: { schemaVersion: CURRENT_SCHEMA_VERSION, contacts: [], groups: [] } })
  })

  it('round trips every field', async () => {
    const storage = createFakeStorage()
    const repository = createContactsStorage(storage)
    const group = makeGroup()
    const contact = makeContact({ note: 'trading wallet', groupId: group.id, pinned: true })

    await repository.save({ schemaVersion: CURRENT_SCHEMA_VERSION, contacts: [contact], groups: [group] })
    const result = await repository.load()

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.contacts).toEqual([contact])
      expect(result.value.groups).toEqual([group])
    }
  })

  it('reports a read failure rather than pretending the book is empty', async () => {
    const storage = createFakeStorage()
    storage.failGetItem = true

    const result = await createContactsStorage(storage).load()

    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error.code).toBe('storage/read-failed')
  })

  it('reports a write failure', async () => {
    const storage = createFakeStorage()
    storage.failSetItem = true

    const result = await createContactsStorage(storage).save({ schemaVersion: 1, contacts: [], groups: [] })

    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error.code).toBe('storage/write-failed')
  })

  it('preserves unparseable data instead of discarding it', async () => {
    const storage = createFakeStorage({ [STORAGE_KEY]: '{ this is not json' })

    const result = await createContactsStorage(storage).load()

    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error.code).toBe('storage/corrupt')

    const preserved = [...storage.data.entries()].filter(([key]) => key.startsWith(CORRUPT_KEY_PREFIX))
    expect(preserved).toHaveLength(1)
    expect(preserved[0][1]).toBe('{ this is not json')
  })

  it('leaves a newer schema untouched rather than backing it up as corrupt', async () => {
    const payload = JSON.stringify({ schemaVersion: CURRENT_SCHEMA_VERSION + 1, contacts: [] })
    const storage = createFakeStorage({ [STORAGE_KEY]: payload })

    const result = await createContactsStorage(storage).load()

    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error.code).toBe('storage/unsupported-schema')
    expect([...storage.data.keys()].some((key) => key.startsWith(CORRUPT_KEY_PREFIX))).toBe(false)
    expect(storage.data.get(STORAGE_KEY)).toBe(payload)
  })

  it('does not lose a contact when writes are dispatched in the same tick', async () => {
    const storage = createFakeStorage()
    const repository = createContactsStorage(storage)
    const first = makeContact({ id: 'a', name: 'Alex' })
    const second = makeContact({ id: 'b', name: 'Blair' })

    // The first write is deliberately the slow one. Without the queue the second setItem lands
    // first and is then overwritten by the stale first, losing Blair.
    storage.setItemDelaysMs = [20, 0]

    await Promise.all([
      repository.save({ schemaVersion: 1, contacts: [first], groups: [] }),
      repository.save({ schemaVersion: 1, contacts: [first, second], groups: [] }),
    ])

    const result = await repository.load()
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.value.contacts).toEqual([first, second])
  })

  it('keeps serving writes after one of them fails', async () => {
    const storage = createFakeStorage()
    const repository = createContactsStorage(storage)

    storage.failSetItem = true
    const failed = await repository.save({ schemaVersion: 1, contacts: [], groups: [] })
    storage.failSetItem = false
    const recovered = await repository.save({ schemaVersion: 1, contacts: [makeContact()], groups: [] })

    expect(failed.ok).toBe(false)
    expect(recovered.ok).toBe(true)
  })

  it('always writes the current schema version', async () => {
    const storage = createFakeStorage()

    await createContactsStorage(storage).save({ schemaVersion: 999, contacts: [], groups: [] })

    expect(JSON.parse(storage.data.get(STORAGE_KEY) ?? '{}').schemaVersion).toBe(CURRENT_SCHEMA_VERSION)
  })
})
