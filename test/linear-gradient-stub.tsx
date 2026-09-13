import { View, ViewProps } from 'react-native'

export interface LinearGradientStubProps extends ViewProps {
  colors: readonly string[]
  start?: { x: number; y: number }
  end?: { x: number; y: number }
  locations?: readonly number[]
}

/**
 * Stands in for `expo-linear-gradient` under vitest — see the alias in vitest.config.mts.
 *
 * The gradient props are dropped rather than rendered: a colour list on a `View` would surface in
 * snapshots as a prop that does nothing, and tests would start asserting on it.
 */
export function LinearGradient({ colors, start, end, locations, ...props }: LinearGradientStubProps) {
  void colors
  void start
  void end
  void locations

  return <View {...props} />
}
