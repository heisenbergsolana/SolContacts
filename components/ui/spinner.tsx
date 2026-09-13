import { useEffect, useId, useState } from 'react'
import { Animated, Easing } from 'react-native'
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg'
import { useAppTheme } from '@/constants/app-styles'
import { useReducedMotion } from './use-reduced-motion'

/** One full turn. Fast enough to read as activity, slow enough not to buzz. */
const SPIN_MS = 900
/** How much of the ring is drawn. The 90° gap is what makes the rotation visible at all. */
const ARC = 0.75
/** Matches the skeleton's resting opacity, so the two read as one family when motion is off. */
const DIM = 0.35

const VIEWBOX = 24
const RADIUS = 9
const STROKE = 3
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

export interface SpinnerProps {
  /** Diameter in dp. */
  size?: number
  /** `onFill` on a filled button, where the brand gradient would fight the fill underneath. */
  tone?: 'brand' | 'onFill'
}

/**
 * An indeterminate spinner, for waits with no layout to hold.
 *
 * A skeleton is still the right answer wherever the shape of the result is known — see
 * `skeleton.tsx`. This is for the rest: a wallet round trip, a submitted transfer, work whose
 * duration is somebody else's to decide.
 *
 * Hidden from accessibility on purpose. The label beside it says what is happening, and the
 * button that owns it reports `busy`; a screen reader should hear that once, not twice.
 */
export function Spinner({ size = 20, tone = 'brand' }: SpinnerProps) {
  const theme = useAppTheme()
  const reducedMotion = useReducedMotion()
  // Lazy `useState` rather than a ref: the value must survive re-renders, and the React Compiler
  // forbids reading `ref.current` during render.
  const [turn] = useState(() => new Animated.Value(0))
  // React's ids carry ':', which is neither a valid SVG id nor usable in a url(#…) reference.
  const gradientId = `spinner-${useId().replace(/[^a-zA-Z0-9]/g, '')}`

  useEffect(() => {
    if (reducedMotion) return

    const loop = Animated.loop(
      Animated.timing(turn, {
        toValue: 1,
        duration: SPIN_MS,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    )
    loop.start()
    return () => loop.stop()
  }, [reducedMotion, turn])

  return (
    <Animated.View
      importantForAccessibility="no-hide-descendants"
      style={{
        height: size,
        opacity: reducedMotion ? DIM : 1,
        transform: [{ rotate: turn.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) }],
        width: size,
      }}
      testID="spinner"
    >
      <Svg height={size} viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`} width={size}>
        <Defs>
          <LinearGradient id={gradientId} x1="0" x2="1" y1="0" y2="1">
            <Stop offset="0" stopColor={theme.primary} />
            <Stop offset="1" stopColor={theme.accent} />
          </LinearGradient>
        </Defs>
        <Circle
          cx={VIEWBOX / 2}
          cy={VIEWBOX / 2}
          fill="none"
          r={RADIUS}
          stroke={tone === 'onFill' ? theme.textOnFill : `url(#${gradientId})`}
          strokeDasharray={`${CIRCUMFERENCE * ARC} ${CIRCUMFERENCE * (1 - ARC)}`}
          strokeLinecap="round"
          strokeWidth={STROKE}
        />
      </Svg>
    </Animated.View>
  )
}
