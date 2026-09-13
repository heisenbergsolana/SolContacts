import * as Haptics from 'expo-haptics'
import { ToastAndroid } from 'react-native'

export type FeedbackTone = 'neutral' | 'success' | 'warning'

function vibrate(tone: FeedbackTone): Promise<void> {
  switch (tone) {
    case 'success':
      return Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    case 'warning':
      return Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)
    case 'neutral':
      return Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
  }
}

/**
 * Confirm something the user just did: a short native toast plus a matching haptic.
 *
 * Android's own toast rather than one drawn in-app — it outlives the navigation that "Saved" and
 * "Contact deleted" trigger, and TalkBack already announces it.
 *
 * A failed haptic is swallowed on purpose. A device with no vibrator, or a user who has turned
 * haptics off, must not turn "address copied" into an unhandled rejection.
 */
export function notify(message: string, tone: FeedbackTone = 'neutral'): void {
  ToastAndroid.show(message, ToastAndroid.SHORT)
  vibrate(tone).catch(() => undefined)
}
