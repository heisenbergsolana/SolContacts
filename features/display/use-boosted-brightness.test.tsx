import { renderHook } from '@testing-library/react-native'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { restoreSystemBrightnessAsync, setBrightnessAsync } = vi.hoisted(() => ({
  restoreSystemBrightnessAsync: vi.fn(() => Promise.resolve()),
  setBrightnessAsync: vi.fn(() => Promise.resolve()),
}))

vi.mock('expo-brightness', () => ({ restoreSystemBrightnessAsync, setBrightnessAsync }))

const { useBoostedBrightness } = await import('./use-boosted-brightness')

describe('useBoostedBrightness', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('brightens the window while the screen is mounted', async () => {
    await renderHook(() => useBoostedBrightness())

    expect(setBrightnessAsync).toHaveBeenCalledWith(0.9)
  })

  /** Leaving the phone stuck at full brightness after backing out is the failure that matters. */
  it('hands brightness back on unmount', async () => {
    const { unmount } = await renderHook(() => useBoostedBrightness())
    expect(restoreSystemBrightnessAsync).not.toHaveBeenCalled()

    await unmount()

    expect(restoreSystemBrightnessAsync).toHaveBeenCalledOnce()
  })

  it('survives a device that refuses to change its brightness', async () => {
    setBrightnessAsync.mockRejectedValueOnce(new Error('not available'))

    const { unmount } = await renderHook(() => useBoostedBrightness())
    await unmount()

    expect(restoreSystemBrightnessAsync).toHaveBeenCalledOnce()
  })
})
