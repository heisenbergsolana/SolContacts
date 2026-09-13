import { useCallback, useEffect, useMemo, useState } from 'react'
import { createOnboardingStorage, OnboardingStore } from './onboarding-storage'

export type OnboardingStatus = 'loading' | 'pending' | 'done'

export interface Onboarding {
  status: OnboardingStatus
  /** Leaves the introduction for good. */
  complete(): void
}

/**
 * Whether to show the introduction, and how to leave it.
 *
 * `complete()` moves the UI first and records the fact afterwards. The alternative — awaiting the
 * write — makes the last tap of the introduction feel like the slowest one, to buy a guarantee
 * worth nothing: the only cost of a lost write is seeing three screens again.
 *
 * There is one instance of this, in the root layout. It is deliberately not a context: nothing
 * else in the app needs to know, and the introduction is gone before the rest of it mounts.
 */
export function useOnboarding(store?: OnboardingStore): Onboarding {
  const onboarding = useMemo(() => store ?? createOnboardingStorage(), [store])
  const [status, setStatus] = useState<OnboardingStatus>('loading')

  useEffect(() => {
    let subscribed = true
    void onboarding.hasSeen().then((seen) => {
      if (subscribed) setStatus(seen ? 'done' : 'pending')
    })

    return () => {
      subscribed = false
    }
  }, [onboarding])

  const complete = useCallback(() => {
    setStatus('done')
    void onboarding.markSeen()
  }, [onboarding])

  return { status, complete }
}
