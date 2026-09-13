import { createContext, PropsWithChildren, use, useCallback, useEffect, useMemo, useState } from 'react'
import { useWidgetSync } from '@/features/widget/use-widget-sync'
import { Contact, ContactGroup, ContactId, GroupId } from '@/types/contact'
import { AppError, appError, err, ok, Result } from '@/types/result'
import { ContactsRepository } from './contacts-repository'
import { CURRENT_SCHEMA_VERSION } from './contacts-migrations'
import { createContactsStorage } from './contacts-storage'
import { ContactInput, createContact, updateContact } from './contacts-service'
import { createGroup, detachGroup, GroupInput, updateGroup } from './groups-service'

export type ContactsStatus = 'loading' | 'ready' | 'error'

export interface ContactsContextValue {
  contacts: Contact[]
  groups: ContactGroup[]
  status: ContactsStatus
  error?: AppError
  addContact(input: ContactInput): Promise<Result<Contact>>
  editContact(id: ContactId, input: ContactInput): Promise<Result<Contact>>
  removeContact(id: ContactId): Promise<Result<void>>
  /** A pin is one tap on a row, so it gets its own call rather than a round trip through the form. */
  setPinned(id: ContactId, pinned: boolean): Promise<Result<Contact>>
  addGroup(input: GroupInput): Promise<Result<ContactGroup>>
  editGroup(id: GroupId, input: GroupInput): Promise<Result<ContactGroup>>
  removeGroup(id: GroupId): Promise<Result<void>>
  reload(): Promise<void>
}

const ContactsContext = createContext<ContactsContextValue | undefined>(undefined)

export function useContacts(): ContactsContextValue {
  const value = use(ContactsContext)
  if (!value) throw new Error('useContacts must be used inside <ContactsProvider>')
  return value
}

export interface ContactsProviderProps extends PropsWithChildren {
  /** Injectable so tests drive a fake repository instead of a native module. */
  repository?: ContactsRepository
}

/**
 * Owns the contact book for the session.
 *
 * Writes go to storage **first** and only update state once they land. The alternative — updating
 * optimistically and rolling back — means the list can briefly show a contact that was never saved,
 * which for an address book is worse than a moment's latency on a local write.
 */
export function ContactsProvider({ children, repository }: ContactsProviderProps) {
  const store = useMemo(() => repository ?? createContactsStorage(), [repository])
  const [contacts, setContacts] = useState<Contact[]>([])
  const [groups, setGroups] = useState<ContactGroup[]>([])
  const [status, setStatus] = useState<ContactsStatus>('loading')
  const [error, setError] = useState<AppError | undefined>()

  const reload = useCallback(async () => {
    setStatus('loading')
    const result = await store.load()
    if (result.ok) {
      setContacts(result.value.contacts)
      setGroups(result.value.groups)
      setError(undefined)
      setStatus('ready')
    } else {
      setError(result.error)
      setStatus('error')
    }
  }, [store])

  useEffect(() => {
    void reload()
  }, [reload])

  /**
   * Persist `next`, and adopt it as state only if the write succeeded.
   *
   * Both halves of the document go in together, so deleting a group and ungrouping its contacts is
   * one write that either lands or does not — never a book with contacts pointing at nothing.
   */
  const commit = useCallback(
    async (next: { contacts: Contact[]; groups: ContactGroup[] }): Promise<Result<void>> => {
      const written = await store.save({ schemaVersion: CURRENT_SCHEMA_VERSION, ...next })
      if (!written.ok) return written
      setContacts(next.contacts)
      setGroups(next.groups)
      return ok(undefined)
    },
    [store],
  )

  const addContact = useCallback(
    async (input: ContactInput): Promise<Result<Contact>> => {
      const created = createContact(input)
      if (!created.ok) return created

      const written = await commit({ contacts: [...contacts, created.value], groups })
      return written.ok ? ok(created.value) : written
    },
    [commit, contacts, groups],
  )

  const editContact = useCallback(
    async (id: ContactId, input: ContactInput): Promise<Result<Contact>> => {
      const existing = contacts.find((contact) => contact.id === id)
      if (!existing) return err(appError('contact/not-found', 'That contact no longer exists.'))

      const updated = updateContact(existing, input)
      if (!updated.ok) return updated

      const written = await commit({
        contacts: contacts.map((contact) => (contact.id === id ? updated.value : contact)),
        groups,
      })
      return written.ok ? ok(updated.value) : written
    },
    [commit, contacts, groups],
  )

  const removeContact = useCallback(
    async (id: ContactId): Promise<Result<void>> => {
      if (!contacts.some((contact) => contact.id === id)) {
        return err(appError('contact/not-found', 'That contact no longer exists.'))
      }
      return commit({ contacts: contacts.filter((contact) => contact.id !== id), groups })
    },
    [commit, contacts, groups],
  )

  const setPinned = useCallback(
    async (id: ContactId, pinned: boolean): Promise<Result<Contact>> => {
      const existing = contacts.find((contact) => contact.id === id)
      if (!existing) return err(appError('contact/not-found', 'That contact no longer exists.'))

      const updated = updateContact(existing, {
        name: existing.name,
        address: existing.address,
        note: existing.note,
        groupId: existing.groupId,
        pinned,
      })
      if (!updated.ok) return updated

      const written = await commit({
        contacts: contacts.map((contact) => (contact.id === id ? updated.value : contact)),
        groups,
      })
      return written.ok ? ok(updated.value) : written
    },
    [commit, contacts, groups],
  )

  const addGroup = useCallback(
    async (input: GroupInput): Promise<Result<ContactGroup>> => {
      const created = createGroup(input, groups)
      if (!created.ok) return created

      const written = await commit({ contacts, groups: [...groups, created.value] })
      return written.ok ? ok(created.value) : written
    },
    [commit, contacts, groups],
  )

  const editGroup = useCallback(
    async (id: GroupId, input: GroupInput): Promise<Result<ContactGroup>> => {
      const existing = groups.find((group) => group.id === id)
      if (!existing) return err(appError('group/not-found', 'That group no longer exists.'))

      const updated = updateGroup(existing, input, groups)
      if (!updated.ok) return updated

      const written = await commit({
        contacts,
        groups: groups.map((group) => (group.id === id ? updated.value : group)),
      })
      return written.ok ? ok(updated.value) : written
    },
    [commit, contacts, groups],
  )

  /** Deleting a group never deletes a contact — its members simply become ungrouped. */
  const removeGroup = useCallback(
    async (id: GroupId): Promise<Result<void>> => {
      if (!groups.some((group) => group.id === id)) {
        return err(appError('group/not-found', 'That group no longer exists.'))
      }
      return commit({ contacts: detachGroup(contacts, id), groups: groups.filter((group) => group.id !== id) })
    },
    [commit, contacts, groups],
  )

  // The provider is the one place that knows the whole book, so it is the one place that can keep
  // the home-screen widget honest.
  useWidgetSync(contacts, status === 'ready')

  const value = useMemo<ContactsContextValue>(
    () => ({
      contacts,
      groups,
      status,
      error,
      addContact,
      editContact,
      removeContact,
      setPinned,
      addGroup,
      editGroup,
      removeGroup,
      reload,
    }),
    [
      contacts,
      groups,
      status,
      error,
      addContact,
      editContact,
      removeContact,
      setPinned,
      addGroup,
      editGroup,
      removeGroup,
      reload,
    ],
  )

  return <ContactsContext value={value}>{children}</ContactsContext>
}
