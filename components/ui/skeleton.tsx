import { useEffect, useState } from 'react'
import { Animated, DimensionValue, Easing } from 'react-native'
import { radius as radiusTokens, useAppTheme } from '@/constants/app-styles'
import { useReducedMotion } from './use-reduced-motion'

/** One direction of the pulse. Slow enough to read as "waiting", not as a blinking error. */
const PULSE_MS = 750
const DIM = 0.35

export interface SkeletonProps {
  /** Height of the line, in dp. Match it to the text it stands in for. */
  height: number
  width?: DimensionValue
  radius?: number
}

/**
 * A placeholder that occupies exactly the space its content will.
 *
 * A shimmer rather than a spinner: a spinner says "something is happening somewhere", a skeleton
 * says "this line is coming", and nothing on the screen jumps when the value finally arrives.
 *
 * Hidden from accessibility — the container that owns the slot announces what is loading, so a
 * screen reader hears "Loading balance" once instead of walking over decorative boxes.
 */
export function Skeleton({ height, width = '100%', radius = radiusTokens.sm }: SkeletonProps) {
  const theme = useAppTheme()
  const reducedMotion = useReducedMotion()
  // Lazy `useState` rather than a ref: the animated value must survive re-renders, and the React
  // Compiler forbids reading `ref.current` during render.
  const [opacity] = useState(() => new Animated.Value(DIM))

  useEffect(() => {
    if (reducedMotion) {
      opacity.setValue(DIM)
      return
    }

    const pulse = (toValue: number) =>
      Animated.timing(opacity, {
        toValue,
        duration: PULSE_MS,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      })

    const loop = Animated.loop(Animated.sequence([pulse(1), pulse(DIM)]))
    loop.start()
    return () => loop.stop()
  }, [opacity, reducedMotion])

  return (
    <Animated.View
      importantForAccessibility="no-hide-descendants"
      style={{ backgroundColor: theme.surfaceAlt, borderRadius: radius, height, opacity, width }}
    />
  )
}
