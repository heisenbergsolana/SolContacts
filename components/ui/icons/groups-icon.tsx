import Svg, { Rect } from 'react-native-svg'
import { TabIconProps } from './contacts-icon'

/** Four tiles: the shape of a screen full of groups, which is what it opens. */
export function GroupsIcon({ color, size = 21 }: TabIconProps) {
  return (
    <Svg accessibilityElementsHidden fill="none" height={size} viewBox="0 0 24 24" width={size}>
      <Rect height={7} rx={2} stroke={color} strokeWidth={2} width={7} x={3} y={3} />
      <Rect height={7} rx={2} stroke={color} strokeWidth={2} width={7} x={14} y={3} />
      <Rect height={7} rx={2} stroke={color} strokeWidth={2} width={7} x={3} y={14} />
      <Rect height={7} rx={2} stroke={color} strokeWidth={2} width={7} x={14} y={14} />
    </Svg>
  )
}
