import Svg, { Circle, Path } from 'react-native-svg'

export interface TabIconProps {
  color: string
  size?: number
}

/** Drawn rather than imported, like every glyph here — see `copy-icon.tsx`. */
export function ContactsIcon({ color, size = 21 }: TabIconProps) {
  return (
    <Svg accessibilityElementsHidden fill="none" height={size} viewBox="0 0 24 24" width={size}>
      <Path
        d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
      />
      <Circle cx={12} cy={7} r={4} stroke={color} strokeWidth={2} />
    </Svg>
  )
}
