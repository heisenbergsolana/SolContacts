import { LinearGradient } from 'expo-linear-gradient'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { appStyles, gradientFlow, radius, spacing, useAppTheme } from '@/constants/app-styles'
import { Spinner } from './spinner'

export type ButtonVariant = 'primary' | 'secondary' | 'danger'

export interface ButtonProps {
  label: string
  onPress: () => void
  /** For labels that only read as an option beside their neighbours — "2 × 2" says nothing alone. */
  accessibilityLabel?: string
  variant?: ButtonVariant
  disabled?: boolean
  /**
   * Shows a spinner beside the label and refuses presses. The label carries the news — a button
   * that loses its words while it waits tells the user less, not more.
   */
  loading?: boolean
}

/**
 * `minHeight: 44` is the accessibility floor from docs/05-UI-UX.md, not a visual choice — do not
 * shrink it. A disabled button is visibly dimmed as well as inert, so the state is never ambiguous.
 *
 * Only the primary variant is a gradient. The other two are flat on purpose: a screen where every
 * control shimmers has no primary action, and the destructive one least of all wants to look
 * inviting.
 */
export function Button({
  label,
  onPress,
  accessibilityLabel,
  variant = 'primary',
  disabled = false,
  loading = false,
}: ButtonProps) {
  const theme = useAppTheme()
  const inert = disabled || loading
  const background = { primary: 'transparent', secondary: theme.surfaceAlt, danger: theme.dangerSurface }[variant]

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ busy: loading, disabled: inert }}
      disabled={inert}
      onPress={onPress}
      style={({ pressed }) => ({
        alignItems: 'center',
        backgroundColor: background,
        // The secondary fill is close to the page behind it, so it takes the same hairline a card
        // does rather than relying on its label alone to mark where the control is.
        borderColor: theme.border,
        borderRadius: radius.lg,
        borderWidth: variant === 'secondary' ? StyleSheet.hairlineWidth : 0,
        justifyContent: 'center',
        minHeight: 44,
        // Loading outranks disabled: a waiting button is working, not inert, and the 0.4 dim
        // that says "you cannot press this" would be the wrong thing to say about it.
        opacity: loading ? 0.9 : disabled ? 0.4 : pressed ? 0.8 : 1,
        // Without this the gradient paints its own square corners over the radius above.
        overflow: 'hidden',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
      })}
    >
      {variant === 'primary' ? (
        <LinearGradient
          colors={theme.gradients.primary}
          end={gradientFlow.fill.end}
          start={gradientFlow.fill.start}
          style={StyleSheet.absoluteFill}
        />
      ) : null}
      <View style={{ alignItems: 'center', flexDirection: 'row', gap: spacing.sm }}>
        {loading ? <Spinner size={18} tone={variant === 'secondary' ? 'brand' : 'onFill'} /> : null}
        <Text
          style={[
            appStyles.body,
            { color: variant === 'secondary' ? theme.text : theme.textOnFill, fontWeight: '600' },
          ]}
        >
          {label}
        </Text>
      </View>
    </Pressable>
  )
}
