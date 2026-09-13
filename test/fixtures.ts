import { Contact, ContactGroup } from '@/types/contact'
import { KeyValueStorage } from '@/types/storage'

/** Real mainnet program addresses — a fake string that happens to be invalid proves nothing. */
export const VALID_ADDRESSES = [
  '11111111111111111111111111111111',
  'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
  'GsbwXfJraMomNxBcjK9jJ3YuPBQTd7pTvbwEfJvvZoP1',
] as const

export const INVALID_ADDRESSES = [
  '',
  '   ',
  'abc',
  '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
  '0OIl11111111111111111111111111111',
  '1111111111111111111111111111111111111111111111',
] as const

export function makeContact(overrides: Partial<Contact> = {}): Contact {
  return {
    id: 'contact-1',
    name: 'Alex',
    address: VALID_ADDRESSES[0],
    createdAt: '2026-09-01T08:00:00.000Z',
    updatedAt: '2026-09-01T08:00:00.000Z',
    ...overrides,
  }
}

export function makeGroup(overrides: Partial<ContactGroup> = {}): ContactGroup {
  return {
    id: 'group-1',
    name: 'Friends',
    tone: 'mint',
    createdAt: '2026-09-01T08:00:00.000Z',
    ...overrides,
  }
}

export interface FakeStorage extends KeyValueStorage {
  data: Map<string, string>
  failGetItem?: boolean
  failSetItem?: boolean
  /**
   * Milliseconds to stall each successive `setItem` call, by call index.
   *
   * Needed to expose write races: with an instant fake, two concurrent writes still land in
   * dispatch order, so an unqueued implementation would pass a concurrency test by luck. Make the
   * first write the slow one and the ordering bug becomes observable.
   */
  setItemDelaysMs?: number[]
}

/** In-memory KeyValueStorage with switchable failures — no native module, no mocking framework. */
export function createFakeStorage(initial: Record<string, string> = {}): FakeStorage {
  let setItemCalls = 0

  const store: FakeStorage = {
    data: new Map(Object.entries(initial)),
    async getItem(key) {
      if (store.failGetItem) throw new Error('getItem failed')
      return store.data.get(key) ?? null
    },
    async setItem(key, value) {
      const delay = store.setItemDelaysMs?.[setItemCalls++] ?? 0
      if (delay > 0) await new Promise((resolve) => setTimeout(resolve, delay))
      if (store.failSetItem) throw new Error('setItem failed')
      store.data.set(key, value)
    },
  }
  return store
}
