import Svg, { Circle, Path } from 'react-native-svg'

export interface InfoIconProps {
  color: string
  size?: number
}

/** Drawn rather than imported, like every glyph here — see `copy-icon.tsx`. */
export function InfoIcon({ color, size = 21 }: InfoIconProps) {
  return (
    <Svg accessibilityElementsHidden fill="none" height={size} viewBox="0 0 24 24" width={size}>
      <Circle cx={12} cy={12} r={9} stroke={color} strokeWidth={2} />
      <Path d="M12 11.5v5" stroke={color} strokeLinecap="round" strokeWidth={2} />
      <Circle cx={12} cy={7.75} r={1.15} fill={color} />
    </Svg>
  )
}
