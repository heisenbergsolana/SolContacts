import Svg, { Path, Rect } from 'react-native-svg'

export interface CopyIconProps {
  color: string
  size?: number
}

/**
 * Drawn rather than imported: the app needs exactly one glyph, and an icon font would be a
 * dependency and a bundled binary for a shape that is four vectors long.
 */
export function CopyIcon({ color, size = 18 }: CopyIconProps) {
  return (
    <Svg accessibilityElementsHidden fill="none" height={size} viewBox="0 0 24 24" width={size}>
      <Rect height={12} rx={3} stroke={color} strokeWidth={2} width={12} x={9} y={9} />
      <Path
        d="M5 15.5H4.5A1.5 1.5 0 0 1 3 14V4.5A1.5 1.5 0 0 1 4.5 3H14a1.5 1.5 0 0 1 1.5 1.5V5"
        stroke={color}
        strokeLinecap="round"
        strokeWidth={2}
      />
    </Svg>
  )
}
