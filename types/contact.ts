/** Opaque-ish alias so signatures read as intent rather than `string`. */
export type ContactId = string

export type GroupId = string

/**
 * The colour a group is recognised by.
 *
 * It lives here rather than with the palette because it is *stored*: a document written by one build
 * has to mean the same thing to the next one. `constants/app-styles.ts` maps each name to a hex per
 * theme, and may change those hexes freely — these names may not change.
 *
 * Eight, and no more. Past that the tones stop being tellable apart at chip size, which defeats the
 * only reason a group has a colour at all.
 */
export const GROUP_TONES = ['mint', 'cyan', 'violet', 'pink', 'amber', 'blue', 'lime', 'rose'] as const

export type GroupTone = (typeof GROUP_TONES)[number]

export function isGroupTone(value: unknown): value is GroupTone {
  return typeof value === 'string' && (GROUP_TONES as readonly string[]).includes(value)
}

/**
 * A named set of contacts — "Friends", "Exchanges", "My wallets".
 *
 * A group holds no contacts itself. Membership lives on the contact as `groupId`, so deleting a
 * group is one write and can never leave a list of ids pointing at contacts that are gone.
 */
export interface ContactGroup {
  id: GroupId
  /** Trimmed, 1-32 characters. Unique case-insensitively — two "Friends" are one group. */
  name: string
  tone: GroupTone
  /** ISO 8601 UTC, set once at creation. */
  createdAt: string
}

/**
 * A saved wallet contact. See docs/04-DATA-MODEL.md for the field rules.
 *
 * Optional fields are **absent** when empty, never stored as `''` or `false` — an empty string would
 * render as a blank note rather than no note, and would survive round trips as meaningful data.
 */
export interface Contact {
  id: ContactId
  /** Trimmed, 1-64 characters. */
  name: string
  /** A valid Solana address. Validated before it ever reaches storage. */
  address: string
  /** Trimmed, at most 280 characters. */
  note?: string
  /**
   * The group this contact belongs to — at most one, so a contact has one colour and the list has
   * one grouping. Absent means ungrouped, and an id naming no group is read back as ungrouped.
   */
  groupId?: GroupId
  /** Kept above the rest of the list. */
  pinned?: boolean
  /** ISO 8601 UTC, set once at creation. */
  createdAt: string
  /** ISO 8601 UTC, refreshed on every save. */
  updatedAt: string
}

/** Field length limits, enforced in the service layer and surfaced by the form. */
export const CONTACT_LIMITS = {
  nameMax: 64,
  noteMax: 280,
  groupNameMax: 32,
} as const

/**
 * The whole contact book, stored as a single document.
 *
 * Contacts are read as a set on every launch and mutated rarely, so one document means one read,
 * one write, and atomic updates — no index to keep consistent. Groups ride along for the same
 * reason: renaming a group and re-pointing its contacts has to be one write or neither.
 */
export interface ContactsDocument {
  schemaVersion: number
  /** Insertion order. Sorting is a UI concern, not a storage one. */
  contacts: Contact[]
  /** Insertion order, which is also the order the filter chips appear in. */
  groups: ContactGroup[]
}
