import { ReactNode } from 'react'
import { Pressable, StyleSheet } from 'react-native'
import { radius, useAppTheme } from '@/constants/app-styles'

export interface IconButtonProps {
  /** Required: the button carries no text, so this is the only thing a screen reader can announce. */
  accessibilityLabel: string
  accessibilityHint?: string
  children: ReactNode
  onPress: () => void
  /** Both edges. Never below 44 — the accessibility floor from docs/05-UI-UX.md. */
  size?: number
}

/** A square, label-less control for places a full-width `Button` would not fit. */
export function IconButton({ accessibilityLabel, accessibilityHint, children, onPress, size = 44 }: IconButtonProps) {
  const theme = useAppTheme()

  return (
    <Pressable
      accessibilityHint={accessibilityHint}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      hitSlop={4}
      onPress={onPress}
      style={({ pressed }) => ({
        alignItems: 'center',
        backgroundColor: pressed ? theme.border : theme.surfaceAlt,
        borderColor: theme.border,
        borderRadius: radius.md,
        borderWidth: StyleSheet.hairlineWidth,
        height: size,
        justifyContent: 'center',
        width: size,
      })}
    >
      {children}
    </Pressable>
  )
}
