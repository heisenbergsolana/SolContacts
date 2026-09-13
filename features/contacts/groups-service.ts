import { Contact, ContactGroup, CONTACT_LIMITS, GroupId, GROUP_TONES, GroupTone } from '@/types/contact'
import { appError, err, ok, Result } from '@/types/result'
import { createId } from '@/utils/id'

/** What the group sheet hands in. The id, the timestamp and the fallback tone are ours. */
export interface GroupInput {
  name: string
  /** Absent means "pick one" — see `nextTone`. */
  tone?: GroupTone
}

export interface GroupTimestamps {
  /** Injectable so tests assert exact values instead of racing the clock. */
  now?: string
}

/**
 * The tone to hand the next group: the least-used one, earliest in palette order on a tie.
 *
 * Least-used rather than "the next one along" because groups get deleted. Counting means the colour
 * freed by a deleted group is the one the next group gets, instead of the palette marching on and
 * repeating a colour that is currently free.
 */
export function nextTone(groups: readonly ContactGroup[]): GroupTone {
  const used = new Map<GroupTone, number>(GROUP_TONES.map((tone) => [tone, 0]))
  for (const group of groups) {
    used.set(group.tone, (used.get(group.tone) ?? 0) + 1)
  }

  return GROUP_TONES.reduce((best, tone) => ((used.get(tone) ?? 0) < (used.get(best) ?? 0) ? tone : best))
}

/** Case-insensitive, because two groups a user cannot tell apart are one group. */
function findByName(groups: readonly ContactGroup[], name: string, excludeId?: GroupId): ContactGroup | undefined {
  const needle = name.toLowerCase()
  return groups.find((group) => group.name.toLowerCase() === needle && group.id !== excludeId)
}

function normalizeName(name: string): Result<string> {
  const trimmed = name.trim()
  if (trimmed.length === 0) {
    return err(appError('group/invalid-name', 'Give this group a name.'))
  }
  if (trimmed.length > CONTACT_LIMITS.groupNameMax) {
    return err(appError('group/invalid-name', `Group names are limited to ${CONTACT_LIMITS.groupNameMax} characters.`))
  }
  return ok(trimmed)
}

/**
 * A new group, or the reason it cannot exist.
 *
 * A duplicate name is refused rather than merged. Merging would move contacts the user never asked
 * to move, and refusing tells them the group they wanted is already there.
 */
export function createGroup(
  input: GroupInput,
  groups: readonly ContactGroup[],
  { now }: GroupTimestamps = {},
): Result<ContactGroup> {
  const name = normalizeName(input.name)
  if (!name.ok) return name

  const clash = findByName(groups, name.value)
  if (clash) {
    return err(appError('group/duplicate-name', `There is already a group called “${clash.name}”.`))
  }

  return ok({
    id: createId(),
    name: name.value,
    tone: input.tone ?? nextTone(groups),
    createdAt: now ?? new Date().toISOString(),
  })
}

/**
 * Apply an edit to an existing group.
 *
 * `id` and `createdAt` are carried over untouched, so every contact pointing at this group keeps
 * pointing at it — a rename must never look like a delete and a create.
 */
export function updateGroup(
  existing: ContactGroup,
  input: GroupInput,
  groups: readonly ContactGroup[],
): Result<ContactGroup> {
  const name = normalizeName(input.name)
  if (!name.ok) return name

  const clash = findByName(groups, name.value, existing.id)
  if (clash) {
    return err(appError('group/duplicate-name', `There is already a group called “${clash.name}”.`))
  }

  return ok({ ...existing, name: name.value, tone: input.tone ?? existing.tone })
}

/**
 * Every contact with its membership of `groupId` removed.
 *
 * Deleting a group never deletes a contact. The contacts become ungrouped, which is what someone
 * deleting a folder expects and the opposite of what deleting a folder does on a desktop.
 */
export function detachGroup(contacts: readonly Contact[], groupId: GroupId): Contact[] {
  return contacts.map((contact) => {
    if (contact.groupId !== groupId) return contact
    const { groupId: removed, ...rest } = contact
    void removed
    return rest
  })
}

/** How many contacts each group holds, keyed by group id. Groups with none are absent. */
export function countByGroup(contacts: readonly Contact[]): Map<GroupId, number> {
  const counts = new Map<GroupId, number>()
  for (const contact of contacts) {
    if (contact.groupId === undefined) continue
    counts.set(contact.groupId, (counts.get(contact.groupId) ?? 0) + 1)
  }
  return counts
}

/**
 * The combined balance of a group's members, or `undefined` when any of them is missing.
 *
 * All or nothing on purpose. A total assembled from the members whose lookup happened to succeed
 * is a smaller number presented as a complete one, and this is the one screen where a number is
 * the whole point of the tile.
 */
export function totalForGroup(
  contacts: readonly Contact[],
  groupId: GroupId,
  balances: ReadonlyMap<string, bigint>,
): bigint | undefined {
  let total = 0n

  for (const contact of contacts) {
    if (contact.groupId !== groupId) continue
    const lamports = balances.get(contact.address)
    if (lamports === undefined) return undefined
    total += lamports
  }

  return total
}
