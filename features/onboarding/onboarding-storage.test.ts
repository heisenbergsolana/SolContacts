import { describe, expect, it } from 'vitest'
import { createFakeStorage } from '@/test/fixtures'
import { createOnboardingStorage, ONBOARDING_KEY } from './onboarding-storage'

describe('createOnboardingStorage', () => {
  it('reports the introduction as unseen on a first launch', async () => {
    const store = createOnboardingStorage(createFakeStorage())

    expect(await store.hasSeen()).toBe(false)
  })

  it('remembers the introduction across a restart', async () => {
    const storage = createFakeStorage()
    await createOnboardingStorage(storage).markSeen()

    expect(await createOnboardingStorage(storage).hasSeen()).toBe(true)
  })

  it('records when it was seen, not merely that it was', async () => {
    const storage = createFakeStorage()
    await createOnboardingStorage(storage).markSeen()

    expect(Date.parse(storage.data.get(ONBOARDING_KEY) ?? '')).not.toBeNaN()
  })

  /**
   * The failure direction matters: an introduction that reappears on every launch because the
   * store is broken is worse than one that never appears at all.
   */
  it('treats an unreadable store as already seen', async () => {
    const storage = createFakeStorage()
    storage.failGetItem = true

    expect(await createOnboardingStorage(storage).hasSeen()).toBe(true)
  })

  it('survives a failed write', async () => {
    const storage = createFakeStorage()
    storage.failSetItem = true

    await expect(createOnboardingStorage(storage).markSeen()).resolves.toBeUndefined()
  })
})
