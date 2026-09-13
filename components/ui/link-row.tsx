import { Pressable, Text, View } from 'react-native'
import { appStyles, spacing, useAppTheme } from '@/constants/app-styles'

export interface LinkRowProps {
  label: string
  /** What the row is for, when the label alone does not say it. */
  description?: string
  onPress: () => void
  /** Adds "Opens in your browser" to what a screen reader announces. */
  external?: boolean
}

/**
 * One tappable line in a list of destinations.
 *
 * The chevron is drawn as a character rather than an icon component: it is punctuation here, not a
 * glyph that means anything on its own, and it is hidden from the screen reader for the same reason.
 */
export function LinkRow({ label, description, onPress, external = false }: LinkRowProps) {
  const theme = useAppTheme()

  return (
    <Pressable
      accessibilityHint={external ? 'Opens in your browser' : undefined}
      accessibilityLabel={label}
      accessibilityRole="link"
      onPress={onPress}
      style={({ pressed }) => ({
        alignItems: 'center',
        flexDirection: 'row',
        gap: spacing.md,
        // The accessibility floor from docs/05-UI-UX.md.
        minHeight: 44,
        opacity: pressed ? 0.6 : 1,
        paddingVertical: spacing.sm,
      })}
    >
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={[appStyles.body, { color: theme.text }]}>{label}</Text>
        {description === undefined ? null : (
          <Text style={[appStyles.caption, { color: theme.textMuted }]}>{description}</Text>
        )}
      </View>
      <Text accessibilityElementsHidden style={[appStyles.body, { color: theme.textMuted }]}>
        ↗
      </Text>
    </Pressable>
  )
}
