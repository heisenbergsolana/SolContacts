import { Contact, ContactGroup, ContactsDocument, GROUP_TONES, isGroupTone } from '@/types/contact'
import { appError, err, ok, Result } from '@/types/result'
import { createId } from '@/utils/id'

export const CURRENT_SCHEMA_VERSION = 2

export function emptyDocument(): ContactsDocument {
  return { schemaVersion: CURRENT_SCHEMA_VERSION, contacts: [], groups: [] }
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0
}

function isOptionalString(value: unknown): value is string | undefined {
  return value === undefined || typeof value === 'string'
}

function isOptionalBoolean(value: unknown): value is boolean | undefined {
  return value === undefined || typeof value === 'boolean'
}

/**
 * Shape check for a single stored contact.
 *
 * Data read back from disk is untrusted: it may have been written by an older build, a future one,
 * or a partially failed write. A contact missing a required field is dropped rather than repaired,
 * because guessing a value here would invent data the user never entered.
 */
export function isContact(value: unknown): value is Contact {
  if (typeof value !== 'object' || value === null) return false
  const candidate = value as Record<string, unknown>

  return (
    isNonEmptyString(candidate.id) &&
    isNonEmptyString(candidate.name) &&
    isNonEmptyString(candidate.address) &&
    isNonEmptyString(candidate.createdAt) &&
    isNonEmptyString(candidate.updatedAt) &&
    isOptionalString(candidate.note) &&
    isOptionalString(candidate.groupId) &&
    isOptionalBoolean(candidate.pinned)
  )
}

/** A group with an unknown tone is dropped: there is no safe colour to guess for a label. */
export function isGroup(value: unknown): value is ContactGroup {
  if (typeof value !== 'object' || value === null) return false
  const candidate = value as Record<string, unknown>

  return (
    isNonEmptyString(candidate.id) &&
    isNonEmptyString(candidate.name) &&
    isNonEmptyString(candidate.createdAt) &&
    isGroupTone(candidate.tone)
  )
}

/** The v1 contact, which carried its group as a free-text string and had no pin. */
interface LegacyContact extends Omit<Contact, 'groupId' | 'pinned'> {
  category?: string
}

function isLegacyContact(value: unknown): value is LegacyContact {
  if (typeof value !== 'object' || value === null) return false
  const candidate = value as Record<string, unknown>

  return (
    isNonEmptyString(candidate.id) &&
    isNonEmptyString(candidate.name) &&
    isNonEmptyString(candidate.address) &&
    isNonEmptyString(candidate.createdAt) &&
    isNonEmptyString(candidate.updatedAt) &&
    isOptionalString(candidate.note) &&
    isOptionalString(candidate.category)
  )
}

/**
 * v1 → v2: the free-text `category` becomes a real group.
 *
 * Categories are matched case-insensitively, keeping the first spelling seen — someone who typed
 * "Friends" once and "friends" later meant one group both times, and ending up with two would be a
 * migration that made their book worse.
 *
 * Tones are handed out in palette order and wrap. Eight tones and a ninth category means a repeat,
 * which is a duller book than it could be but never a wrong one; the alternative is refusing to
 * migrate someone's data over a colour.
 */
function migrateV1ToV2(contacts: readonly unknown[], now: string): ContactsDocument {
  const groups: ContactGroup[] = []
  const byName = new Map<string, ContactGroup>()
  const migrated: Contact[] = []

  for (const value of contacts) {
    if (!isLegacyContact(value)) continue

    const { category, ...contact } = value
    const name = category?.trim()
    if (!name) {
      migrated.push(contact)
      continue
    }

    const key = name.toLowerCase()
    let group = byName.get(key)
    if (!group) {
      group = { id: createId(), name, tone: GROUP_TONES[groups.length % GROUP_TONES.length], createdAt: now }
      byName.set(key, group)
      groups.push(group)
    }

    migrated.push({ ...contact, groupId: group.id })
  }

  return { schemaVersion: CURRENT_SCHEMA_VERSION, contacts: migrated, groups }
}

/**
 * Drop a `groupId` that names no group.
 *
 * Deleting a group and re-pointing its contacts is one write, so this should never fire — but a
 * write interrupted between the two would leave exactly this, and a chip rendered for a group that
 * does not exist has no name and no colour to render with.
 */
function dropDanglingGroups(document: ContactsDocument): ContactsDocument {
  const known = new Set(document.groups.map((group) => group.id))

  return {
    ...document,
    contacts: document.contacts.map((contact) => {
      if (contact.groupId === undefined || known.has(contact.groupId)) return contact
      const { groupId, ...rest } = contact
      void groupId
      return rest
    }),
  }
}

export interface MigrationOptions {
  /** Injectable so tests assert exact timestamps instead of racing the clock. */
  now?: string
}

/**
 * Validate and upgrade a parsed document.
 *
 * A document from a *newer* schema is never modified — the app says so and refuses, rather than
 * dropping fields it does not understand and writing the loss back to disk.
 */
export function migrateDocument(parsed: unknown, { now }: MigrationOptions = {}): Result<ContactsDocument> {
  if (typeof parsed !== 'object' || parsed === null) {
    return err(appError('storage/corrupt', 'Saved contacts could not be read.'))
  }

  const candidate = parsed as Record<string, unknown>
  const version = candidate.schemaVersion

  if (typeof version !== 'number' || !Number.isInteger(version) || version < 1) {
    return err(appError('storage/corrupt', 'Saved contacts could not be read.'))
  }

  if (version > CURRENT_SCHEMA_VERSION) {
    return err(
      appError(
        'storage/unsupported-schema',
        'These contacts were saved by a newer version of SolContacts. Please update the app.',
      ),
    )
  }

  if (!Array.isArray(candidate.contacts)) {
    return err(appError('storage/corrupt', 'Saved contacts could not be read.'))
  }

  // Migrations run in order here as the schema grows: v2 -> v3, v3 -> v4, each a pure function.
  if (version === 1) {
    return ok(dropDanglingGroups(migrateV1ToV2(candidate.contacts, now ?? new Date().toISOString())))
  }

  return ok(
    dropDanglingGroups({
      schemaVersion: CURRENT_SCHEMA_VERSION,
      contacts: candidate.contacts.filter(isContact),
      // A document with no `groups` key at all is not corrupt, only empty of groups.
      groups: Array.isArray(candidate.groups) ? candidate.groups.filter(isGroup) : [],
    }),
  )
}
