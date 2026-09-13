import { PropsWithChildren } from 'react'
import { StyleProp, View, ViewStyle } from 'react-native'
import Animated, { LinearTransition } from 'react-native-reanimated'
import { useReducedMotion } from './use-reduced-motion'

export interface ListEntranceProps extends PropsWithChildren {
  /** Kept so callers read the same at the call site; the stagger it used to drive is gone. */
  index: number
  /**
   * Layout for the wrapper itself. It stands between the row and the list, so a grid's sizing has
   * to live on it — a wrapper that does not participate in the parent's layout collapses the grid.
   */
  style?: StyleProp<ViewStyle>
}

/**
 * Slides a row to its new place when the list reorders around it.
 *
 * This is the half that earns its place: pinning a contact moves it to the top, and a row that
 * teleports there leaves the user checking whether it is the same row.
 *
 * It used to also fade each row up on mount, staggered. That animation answered no question anyone
 * had asked — and worse, a reanimated `entering` that does not get to run leaves the view at its
 * starting values, so rows sat at `opacity: 0` and the Groups tab came back from a tab switch
 * looking empty. A decorative animation is not worth a screen that intermittently shows nothing.
 *
 * Inert under "remove animations", the layout transition included.
 */
export function ListEntrance({ style, children }: ListEntranceProps) {
  const reducedMotion = useReducedMotion()

  // Still a view, so the layout is identical with animations on or off.
  if (reducedMotion) return <View style={style}>{children}</View>

  return (
    <Animated.View layout={LinearTransition.duration(220)} style={style}>
      {children}
    </Animated.View>
  )
}
