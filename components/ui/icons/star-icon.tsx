import Svg, { Path } from 'react-native-svg'

export interface StarIconProps {
  color: string
  size?: number
}

/** Filled, always: an outlined star reads as "not yet", which is the opposite of what a pin means. */
export function StarIcon({ color, size = 12 }: StarIconProps) {
  return (
    <Svg accessibilityElementsHidden height={size} viewBox="0 0 24 24" width={size}>
      <Path d="m12 2 2.9 6.3 6.9.8-5.1 4.7 1.4 6.8L12 17.3 5.9 20.6l1.4-6.8L2.2 9.1l6.9-.8z" fill={color} />
    </Svg>
  )
}
