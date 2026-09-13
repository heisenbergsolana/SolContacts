import { ToastAndroid } from 'react-native'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { notify } from '@/features/feedback/notify'

const { impactAsync, notificationAsync } = vi.hoisted(() => ({
  impactAsync: vi.fn(() => Promise.resolve()),
  notificationAsync: vi.fn(() => Promise.resolve()),
}))

vi.mock('expo-haptics', () => ({
  impactAsync,
  notificationAsync,
  ImpactFeedbackStyle: { Light: 'light' },
  NotificationFeedbackType: { Success: 'success', Warning: 'warning' },
}))

describe('notify', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(ToastAndroid, 'show').mockImplementation(() => undefined)
  })

  it('shows the message as a short toast', () => {
    notify('Copied!')

    expect(ToastAndroid.show).toHaveBeenCalledWith('Copied!', ToastAndroid.SHORT)
  })

  it('uses a light impact for a neutral confirmation', () => {
    notify('Copied!')

    expect(impactAsync).toHaveBeenCalledWith('light')
    expect(notificationAsync).not.toHaveBeenCalled()
  })

  it.each([
    ['success', 'success'],
    ['warning', 'warning'],
  ] as const)('uses the %s notification haptic', (tone, expected) => {
    notify('Saved', tone)

    expect(notificationAsync).toHaveBeenCalledWith(expected)
  })

  /** A phone with no vibrator must not turn a successful copy into an unhandled rejection. */
  it('survives a haptic the device cannot deliver', async () => {
    impactAsync.mockRejectedValueOnce(new Error('no vibrator'))

    expect(() => notify('Copied!')).not.toThrow()
    await Promise.resolve()
  })
})
