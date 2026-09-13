import AsyncStorage from '@react-native-async-storage/async-storage'
import { KeyValueStorage } from '@/types/storage'

export const ONBOARDING_KEY = 'solcontacts:onboarding:v1'

/**
 * Whether the introduction has been shown.
 *
 * One boolean, so there is no document, no schema and nothing to migrate — if the shape ever grows
 * past this, it wants the contacts repository's treatment instead of a wider key.
 */
export interface OnboardingStore {
  hasSeen(): Promise<boolean>
  markSeen(): Promise<void>
}

/**
 * `storage` is injectable so tests use the in-memory fake rather than a native module.
 *
 * Both methods swallow their failures, in the same direction: **a broken store means the
 * introduction does not appear.** Showing it is a courtesy, and a courtesy that repeats on every
 * launch because a write keeps failing is worse than never offering it at all.
 */
export function createOnboardingStorage(storage: KeyValueStorage = AsyncStorage): OnboardingStore {
  return {
    async hasSeen(): Promise<boolean> {
      try {
        return (await storage.getItem(ONBOARDING_KEY)) !== null
      } catch {
        return true
      }
    },

    async markSeen(): Promise<void> {
      try {
        await storage.setItem(ONBOARDING_KEY, new Date().toISOString())
      } catch {
        // Nothing to tell the user: they have just seen the thing this records.
      }
    },
  }
}
