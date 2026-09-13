import Svg, { Path } from 'react-native-svg'

export interface CheckIconProps {
  color: string
  size?: number
}

export function CheckIcon({ color, size = 14 }: CheckIconProps) {
  return (
    <Svg accessibilityElementsHidden fill="none" height={size} viewBox="0 0 24 24" width={size}>
      <Path d="m5 12.5 4.5 4.5L19 7.5" stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.8} />
    </Svg>
  )
}
