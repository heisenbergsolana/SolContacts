import { act, renderHook, waitFor } from '@testing-library/react-native'
import { describe, expect, it } from 'vitest'
import { createFakeStorage } from '@/test/fixtures'
import { createOnboardingStorage, ONBOARDING_KEY } from './onboarding-storage'
import { useOnboarding } from './use-onboarding'

describe('useOnboarding', () => {
  it('asks to show the introduction on a first launch', async () => {
    const { result } = await renderHook(() => useOnboarding(createOnboardingStorage(createFakeStorage())))

    await waitFor(() => expect(result.current.status).toBe('pending'))
  })

  it('stays out of the way once the introduction has been seen', async () => {
    const storage = createFakeStorage({ [ONBOARDING_KEY]: '2026-09-06T08:00:00.000Z' })
    const { result } = await renderHook(() => useOnboarding(createOnboardingStorage(storage)))

    await waitFor(() => expect(result.current.status).toBe('done'))
  })

  /** The UI moves on the tap; the write catches up afterwards. */
  it('leaves the introduction without waiting for the write', async () => {
    const storage = createFakeStorage()
    const { result } = await renderHook(() => useOnboarding(createOnboardingStorage(storage)))
    await waitFor(() => expect(result.current.status).toBe('pending'))

    await act(async () => {
      result.current.complete()
    })

    expect(result.current.status).toBe('done')
    await waitFor(() => expect(storage.data.has(ONBOARDING_KEY)).toBe(true))
  })
})
