import { useEffect, useState } from 'react'
import { AccessibilityInfo } from 'react-native'

/**
 * Whether the system's "remove animations" setting is on.
 *
 * Read on mount and kept in sync afterwards: Android lets the setting change while the app is
 * running, and an animation that keeps looping after someone has just turned animations off is
 * precisely the thing they were trying to stop.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    let subscribed = true
    void AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (subscribed) setReduced(enabled)
    })

    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced)
    return () => {
      subscribed = false
      subscription.remove()
    }
  }, [])

  return reduced
}
