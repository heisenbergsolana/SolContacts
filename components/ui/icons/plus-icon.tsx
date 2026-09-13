import Svg, { Path } from 'react-native-svg'

export interface PlusIconProps {
  color: string
  size?: number
}

export function PlusIcon({ color, size = 24 }: PlusIconProps) {
  return (
    <Svg accessibilityElementsHidden fill="none" height={size} viewBox="0 0 24 24" width={size}>
      <Path d="M12 5v14M5 12h14" stroke={color} strokeLinecap="round" strokeWidth={2.4} />
    </Svg>
  )
}
