import { LinearGradient } from 'expo-linear-gradient'
import { Pressable } from 'react-native'
import { gradientFlow, radius, useAppTheme } from '@/constants/app-styles'
import { PlusIcon } from './icons/plus-icon'

export interface HeaderActionProps {
  /** Read out by the screen reader — the button is an icon, so this is the only name it has. */
  label: string
  onPress: () => void
}

/**
 * The screen's primary action, sitting in the top right beside the title.
 *
 * It used to float above the tab bar, where it overlapped the bar on shorter screens and covered
 * the last row on every one of them. Beside the title it collides with nothing, and the two tabs
 * each keep their own action — "add a contact" is not the same action as "add a group".
 */
export function HeaderAction({ label, onPress }: HeaderActionProps) {
  const theme = useAppTheme()

  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      hitSlop={8}
      style={({ pressed }) => ({
        borderRadius: radius.lg,
        // The accessibility floor from docs/05-UI-UX.md. `hitSlop` buys the rest.
        height: 44,
        opacity: pressed ? 0.85 : 1,
        overflow: 'hidden',
        transform: [{ scale: pressed ? 0.96 : 1 }],
        width: 44,
      })}
      onPress={onPress}
    >
      <LinearGradient
        colors={theme.gradients.primary}
        end={gradientFlow.fill.end}
        start={gradientFlow.fill.start}
        style={{ alignItems: 'center', flex: 1, justifyContent: 'center' }}
      >
        <PlusIcon color={theme.textOnFill} size={22} />
      </LinearGradient>
    </Pressable>
  )
}
