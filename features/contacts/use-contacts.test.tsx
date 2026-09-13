import { act, renderHook, waitFor } from '@testing-library/react-native'
import { PropsWithChildren } from 'react'
import { describe, expect, it } from 'vitest'
import { createFakeStorage, makeContact, VALID_ADDRESSES } from '@/test/fixtures'
import { ContactsRepository } from './contacts-repository'
import { createContactsStorage, STORAGE_KEY } from './contacts-storage'
import { ContactsProvider, useContacts } from './use-contacts'

/** `renderHook` is async in React Native Testing Library v14, like `render`. Always await it. */
async function renderContacts(repository: ContactsRepository) {
  const wrapper = ({ children }: PropsWithChildren) => (
    <ContactsProvider repository={repository}>{children}</ContactsProvider>
  )
  return renderHook(() => useContacts(), { wrapper })
}

const input = { name: 'Alex', address: VALID_ADDRESSES[0] }

describe('ContactsProvider', () => {
  it('loads an empty book and becomes ready', async () => {
    const { result } = await renderContacts(createContactsStorage(createFakeStorage()))

    await waitFor(() => expect(result.current.status).toBe('ready'))
    expect(result.current.contacts).toEqual([])
  })

  it('loads what was already stored', async () => {
    const contact = makeContact()
    const storage = createFakeStorage({ [STORAGE_KEY]: JSON.stringify({ schemaVersion: 1, contacts: [contact] }) })

    const { result } = await renderContacts(createContactsStorage(storage))

    await waitFor(() => expect(result.current.status).toBe('ready'))
    expect(result.current.contacts).toEqual([contact])
  })

  it('surfaces a load failure instead of showing an empty book', async () => {
    const storage = createFakeStorage()
    storage.failGetItem = true

    const { result } = await renderContacts(createContactsStorage(storage))

    await waitFor(() => expect(result.current.status).toBe('error'))
    expect(result.current.error?.code).toBe('storage/read-failed')
  })

  it('adds a contact and persists it', async () => {
    const storage = createFakeStorage()
    const { result } = await renderContacts(createContactsStorage(storage))
    await waitFor(() => expect(result.current.status).toBe('ready'))

    await act(async () => {
      const added = await result.current.addContact(input)
      expect(added.ok).toBe(true)
    })

    expect(result.current.contacts).toHaveLength(1)
    expect(JSON.parse(storage.data.get(STORAGE_KEY) ?? '{}').contacts).toHaveLength(1)
  })

  it('rejects an invalid address without touching storage', async () => {
    const storage = createFakeStorage()
    const { result } = await renderContacts(createContactsStorage(storage))
    await waitFor(() => expect(result.current.status).toBe('ready'))

    await act(async () => {
      const added = await result.current.addContact({ name: 'Bad', address: 'nope' })
      expect(added.ok).toBe(false)
    })

    expect(result.current.contacts).toEqual([])
    expect(storage.data.has(STORAGE_KEY)).toBe(false)
  })

  it('does not add to the list when the write fails', async () => {
    const storage = createFakeStorage()
    const { result } = await renderContacts(createContactsStorage(storage))
    await waitFor(() => expect(result.current.status).toBe('ready'))

    storage.failSetItem = true
    await act(async () => {
      const added = await result.current.addContact(input)
      expect(added.ok).toBe(false)
      if (!added.ok) expect(added.error.code).toBe('storage/write-failed')
    })

    // The whole point of writing before updating state: nothing shows a contact that was not saved.
    expect(result.current.contacts).toEqual([])
  })

  it('edits a contact, keeping its id', async () => {
    const { result } = await renderContacts(createContactsStorage(createFakeStorage()))
    await waitFor(() => expect(result.current.status).toBe('ready'))

    let id = ''
    await act(async () => {
      const added = await result.current.addContact(input)
      if (added.ok) id = added.value.id
    })
    await act(async () => {
      await result.current.editContact(id, { ...input, name: 'Alexandra' })
    })

    expect(result.current.contacts[0].id).toBe(id)
    expect(result.current.contacts[0].name).toBe('Alexandra')
  })

  it('reports editing a contact that is gone', async () => {
    const { result } = await renderContacts(createContactsStorage(createFakeStorage()))
    await waitFor(() => expect(result.current.status).toBe('ready'))

    await act(async () => {
      const edited = await result.current.editContact('missing', input)
      expect(edited.ok).toBe(false)
      if (!edited.ok) expect(edited.error.code).toBe('contact/not-found')
    })
  })

  it('removes only the targeted contact', async () => {
    const { result } = await renderContacts(createContactsStorage(createFakeStorage()))
    await waitFor(() => expect(result.current.status).toBe('ready'))

    let id = ''
    await act(async () => {
      const first = await result.current.addContact(input)
      if (first.ok) id = first.value.id
      await result.current.addContact({ name: 'Blair', address: VALID_ADDRESSES[1] })
    })
    await act(async () => {
      await result.current.removeContact(id)
    })

    expect(result.current.contacts).toHaveLength(1)
    expect(result.current.contacts[0].name).toBe('Blair')
  })

  it('pins and unpins without going through the form', async () => {
    const { result } = await renderContacts(createContactsStorage(createFakeStorage()))
    await waitFor(() => expect(result.current.status).toBe('ready'))

    let id = ''
    await act(async () => {
      const added = await result.current.addContact(input)
      if (added.ok) id = added.value.id
    })

    await act(async () => {
      await result.current.setPinned(id, true)
    })
    expect(result.current.contacts[0].pinned).toBe(true)

    await act(async () => {
      await result.current.setPinned(id, false)
    })
    // Absent, not false: the pin is an optional like every other one.
    expect(result.current.contacts[0]).not.toHaveProperty('pinned')
  })

  it('adds a group and refuses a second one by the same name', async () => {
    const storage = createFakeStorage()
    const { result } = await renderContacts(createContactsStorage(storage))
    await waitFor(() => expect(result.current.status).toBe('ready'))

    await act(async () => {
      const added = await result.current.addGroup({ name: 'Friends' })
      expect(added.ok).toBe(true)
    })
    expect(result.current.groups).toHaveLength(1)
    expect(JSON.parse(storage.data.get(STORAGE_KEY) ?? '{}').groups).toHaveLength(1)

    await act(async () => {
      const clash = await result.current.addGroup({ name: 'friends' })
      expect(clash.ok).toBe(false)
      if (!clash.ok) expect(clash.error.code).toBe('group/duplicate-name')
    })
    expect(result.current.groups).toHaveLength(1)
  })

  it('renames a group without detaching its contacts', async () => {
    const { result } = await renderContacts(createContactsStorage(createFakeStorage()))
    await waitFor(() => expect(result.current.status).toBe('ready'))

    let groupId = ''
    await act(async () => {
      const group = await result.current.addGroup({ name: 'Friends' })
      if (group.ok) groupId = group.value.id
    })
    await act(async () => {
      await result.current.addContact({ ...input, groupId })
    })
    await act(async () => {
      await result.current.editGroup(groupId, { name: 'Close friends' })
    })

    expect(result.current.groups[0].name).toBe('Close friends')
    expect(result.current.contacts[0].groupId).toBe(groupId)
  })

  /** Deleting a folder on a desktop takes its files with it. This must not. */
  it('deletes a group and ungroups its contacts in one write', async () => {
    const storage = createFakeStorage()
    const { result } = await renderContacts(createContactsStorage(storage))
    await waitFor(() => expect(result.current.status).toBe('ready'))

    let groupId = ''
    await act(async () => {
      const group = await result.current.addGroup({ name: 'Friends' })
      if (group.ok) groupId = group.value.id
    })
    await act(async () => {
      await result.current.addContact({ ...input, groupId })
    })
    await act(async () => {
      const removed = await result.current.removeGroup(groupId)
      expect(removed.ok).toBe(true)
    })

    expect(result.current.groups).toEqual([])
    expect(result.current.contacts).toHaveLength(1)
    expect(result.current.contacts[0]).not.toHaveProperty('groupId')

    const stored = JSON.parse(storage.data.get(STORAGE_KEY) ?? '{}')
    expect(stored.groups).toEqual([])
    expect(stored.contacts[0]).not.toHaveProperty('groupId')
  })

  it('reports editing or deleting a group that is gone', async () => {
    const { result } = await renderContacts(createContactsStorage(createFakeStorage()))
    await waitFor(() => expect(result.current.status).toBe('ready'))

    await act(async () => {
      const edited = await result.current.editGroup('missing', { name: 'Friends' })
      expect(edited.ok).toBe(false)
      if (!edited.ok) expect(edited.error.code).toBe('group/not-found')

      const removed = await result.current.removeGroup('missing')
      expect(removed.ok).toBe(false)
      if (!removed.ok) expect(removed.error.code).toBe('group/not-found')
    })
  })
})
