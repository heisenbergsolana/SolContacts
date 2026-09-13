import AsyncStorage from '@react-native-async-storage/async-storage'
import { KeyValueStorage } from '@/types/storage'
import { ContactsDocument } from '@/types/contact'
import { appError, err, ok, Result } from '@/types/result'
import { CURRENT_SCHEMA_VERSION, emptyDocument, migrateDocument } from './contacts-migrations'
import { ContactsRepository } from './contacts-repository'

export const STORAGE_KEY = 'solcontacts:contacts:v1'
export const CORRUPT_KEY_PREFIX = 'solcontacts:contacts:corrupt:'

/**
 * Serialise writes.
 *
 * Two mutations dispatched in the same tick would both read the in-memory array, both serialise it,
 * and the second `setItem` would win — silently discarding the first. Chaining every write means
 * they land in order. A rejected task must not break the chain for the next writer, hence the
 * `catch` on the stored tail.
 */
function createWriteQueue() {
  let tail: Promise<unknown> = Promise.resolve()

  return function enqueue<T>(task: () => Promise<T>): Promise<T> {
    const run = tail.then(task, task)
    tail = run.catch(() => undefined)
    return run
  }
}

/**
 * AsyncStorage-backed contacts repository.
 *
 * `storage` is injectable so tests use an in-memory fake rather than mocking a native module, and
 * so swapping to MMKV or SQLite later touches this file only.
 */
export function createContactsStorage(storage: KeyValueStorage = AsyncStorage): ContactsRepository {
  const enqueue = createWriteQueue()

  return {
    async load(): Promise<Result<ContactsDocument>> {
      let raw: string | null
      try {
        raw = await storage.getItem(STORAGE_KEY)
      } catch (cause) {
        return err(appError('storage/read-failed', 'Your contacts could not be loaded.', cause))
      }

      if (raw === null) return ok(emptyDocument())

      let parsed: unknown
      try {
        parsed = JSON.parse(raw)
      } catch (cause) {
        await preserveCorrupt(storage, raw)
        return err(appError('storage/corrupt', 'Your saved contacts could not be read.', cause))
      }

      const migrated = migrateDocument(parsed)
      // Corrupt data is kept under a timestamped key rather than overwritten, so a bad write is
      // recoverable by hand. An unsupported *newer* schema is intact data, so it is left alone.
      if (!migrated.ok && migrated.error.code === 'storage/corrupt') {
        await preserveCorrupt(storage, raw)
      }
      return migrated
    },

    save(document: ContactsDocument): Promise<Result<void>> {
      return enqueue(async () => {
        try {
          const payload = JSON.stringify({ ...document, schemaVersion: CURRENT_SCHEMA_VERSION })
          await storage.setItem(STORAGE_KEY, payload)
          return ok(undefined)
        } catch (cause) {
          return err(appError('storage/write-failed', 'Your contacts could not be saved.', cause))
        }
      })
    },
  }
}

/** Best effort: never let a failed backup mask the original problem. */
async function preserveCorrupt(storage: KeyValueStorage, raw: string): Promise<void> {
  try {
    await storage.setItem(`${CORRUPT_KEY_PREFIX}${new Date().toISOString()}`, raw)
  } catch {
    // Nothing useful to do — the caller is already returning an error.
  }
}
