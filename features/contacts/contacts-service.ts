import { Contact, ContactId, CONTACT_LIMITS, GroupId } from '@/types/contact'
import { appError, err, ok, Result } from '@/types/result'
import { createId } from '@/utils/id'
import { isValidSolanaAddress } from '@/utils/solana-address'

/** What a form hands in. Timestamps and ids are the service's business, not the caller's. */
export interface ContactInput {
  name: string
  address: string
  note?: string
  /** The group to file this contact under. An empty string means "no group", same as absent. */
  groupId?: string
  pinned?: boolean
}

type NormalizedInput = Pick<Contact, 'name' | 'address' | 'note' | 'groupId' | 'pinned'>

/**
 * Trim, check limits, and drop empty optionals.
 *
 * The address is never case-normalised: base58 is case-sensitive, so changing a character's case
 * produces a *different address*. Trimming is safe and pasting frequently adds whitespace.
 */
function normalize(input: ContactInput): Result<NormalizedInput> {
  const name = input.name.trim()
  if (name.length === 0) {
    return err(appError('contact/invalid-name', 'Give this contact a name.'))
  }
  if (name.length > CONTACT_LIMITS.nameMax) {
    return err(appError('contact/invalid-name', `Names are limited to ${CONTACT_LIMITS.nameMax} characters.`))
  }

  const address = input.address.trim()
  if (!isValidSolanaAddress(address)) {
    return err(appError('contact/invalid-address', 'That is not a valid Solana address.'))
  }

  const note = input.note?.trim()
  if (note !== undefined && note.length > CONTACT_LIMITS.noteMax) {
    return err(appError('contact/invalid-note', `Notes are limited to ${CONTACT_LIMITS.noteMax} characters.`))
  }

  // The group id is not validated for length or shape here: it is not user text, and whether it
  // names a group that exists is a question about the document, which `normalize` cannot see. The
  // migration drops an id that names nothing, so a stale one degrades to "ungrouped".
  const groupId = input.groupId?.trim()

  return ok({
    name,
    address,
    // Absent, not empty: an empty string would round trip as a blank note rather than no note, and
    // `pinned: false` would round trip as a decision rather than a default.
    ...(note ? { note } : {}),
    ...(groupId ? { groupId } : {}),
    ...(input.pinned ? { pinned: true } : {}),
  })
}

export interface ContactTimestamps {
  /** Injectable so tests assert exact values instead of racing the clock. */
  now?: string
}

export function createContact(input: ContactInput, { now }: ContactTimestamps = {}): Result<Contact> {
  const normalized = normalize(input)
  if (!normalized.ok) return normalized

  const timestamp = now ?? new Date().toISOString()

  return ok({ id: createId(), ...normalized.value, createdAt: timestamp, updatedAt: timestamp })
}

/**
 * Apply an edit to an existing contact.
 *
 * `createdAt` and `id` are carried over untouched — an edit is not a new contact.
 */
export function updateContact(
  existing: Contact,
  input: ContactInput,
  { now }: ContactTimestamps = {},
): Result<Contact> {
  const normalized = normalize(input)
  if (!normalized.ok) return normalized

  return ok({
    id: existing.id,
    ...normalized.value,
    createdAt: existing.createdAt,
    updatedAt: now ?? new Date().toISOString(),
  })
}

/**
 * The first other contact already holding this address, if any.
 *
 * Saving the same wallet twice is allowed — one wallet can legitimately deserve two labels — so this
 * exists to *warn*, never to block. `excludeId` keeps a contact from flagging itself while editing.
 */
export function findDuplicateAddress(
  contacts: readonly Contact[],
  address: string,
  excludeId?: ContactId,
): Contact | undefined {
  const target = address.trim()
  return contacts.find((contact) => contact.address === target && contact.id !== excludeId)
}

/**
 * Filter by name or address, case-insensitively.
 *
 * Case-insensitive matching on a case-sensitive address is deliberate: it only affects what the user
 * finds, never what is stored, and nobody retypes base58 with the right capitalisation.
 */
export function searchContacts(contacts: readonly Contact[], query: string): Contact[] {
  const needle = query.trim().toLowerCase()
  if (needle.length === 0) return [...contacts]

  return contacts.filter(
    (contact) => contact.name.toLowerCase().includes(needle) || contact.address.toLowerCase().includes(needle),
  )
}

/**
 * What the chip row is filtering by.
 *
 * A group id would collide with the two other answers if they were all strings, so the group case
 * is an object — `'ungrouped'` is a real answer, not the absence of one.
 */
export type GroupFilter = 'all' | 'ungrouped' | { groupId: GroupId }

export function filterByGroup(contacts: readonly Contact[], filter: GroupFilter): Contact[] {
  if (filter === 'all') return [...contacts]
  if (filter === 'ungrouped') return contacts.filter((contact) => contact.groupId === undefined)
  return contacts.filter((contact) => contact.groupId === filter.groupId)
}

/**
 * Pinned contacts first, everything else in the order it was saved.
 *
 * Stable within each half: insertion order is the only order the user has ever chosen, and sorting
 * the rest alphabetically would move contacts around under a pin that was meant to move one.
 */
export function orderContacts(contacts: readonly Contact[]): Contact[] {
  const pinned = contacts.filter((contact) => contact.pinned)
  return pinned.length === 0 ? [...contacts] : [...pinned, ...contacts.filter((contact) => !contact.pinned)]
}
