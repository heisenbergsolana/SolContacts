import { LinearGradient } from 'expo-linear-gradient'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { CheckIcon } from '@/components/ui/icons/check-icon'
import { appStyles, gradientFlow, radius, spacing, useAppTheme } from '@/constants/app-styles'
import { GroupTone } from '@/types/contact'

export interface GroupChipProps {
  label: string
  /** Absent on the two chips that are not groups — "All" and "Ungrouped". */
  tone?: GroupTone
  count?: number
  selected: boolean
  onPress(): void
}

/**
 * One filter in the row above the contact list.
 *
 * A selected chip is never signalled by colour alone: the toned ones gain a tick and a coloured
 * edge, and the untoned ones gain a fill. Colour is what tells two groups apart, so it cannot also
 * be what tells selected from not.
 *
 * The selected fill is `surfaceAlt` rather than a wash of the tone, so the label keeps the exact
 * contrast `app-styles.test.ts` measures — a tinted background would be a colour nothing checks.
 */
export function GroupChip({ label, tone, count, selected, onPress }: GroupChipProps) {
  const theme = useAppTheme()
  const toneColour = tone ? theme.tones[tone] : undefined
  const filled = selected && toneColour === undefined

  let labelColour = theme.text
  if (filled) labelColour = theme.textOnFill
  else if (selected && toneColour) labelColour = toneColour

  return (
    <Pressable
      accessibilityLabel={count === undefined ? label : `${label}, ${count} contacts`}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={({ pressed }) => ({
        alignItems: 'center',
        backgroundColor: filled ? 'transparent' : selected ? theme.surfaceAlt : theme.surface,
        borderColor: selected ? (toneColour ?? theme.border) : theme.border,
        borderRadius: radius.full,
        borderWidth: 1,
        flexDirection: 'row',
        gap: spacing.sm,
        // 36 is the visual height; the row itself is padded to the 44 dp target it sits in.
        height: 36,
        opacity: pressed ? 0.75 : 1,
        overflow: 'hidden',
        paddingHorizontal: spacing.md,
      })}
      onPress={onPress}
    >
      {filled ? (
        <LinearGradient
          colors={theme.gradients.primary}
          end={gradientFlow.fill.end}
          start={gradientFlow.fill.start}
          style={StyleSheet.absoluteFill}
        />
      ) : null}

      {toneColour ? (
        selected ? (
          <CheckIcon color={toneColour} />
        ) : (
          <View style={{ backgroundColor: toneColour, borderRadius: radius.full, height: 8, width: 8 }} />
        )
      ) : null}

      <Text numberOfLines={1} style={[appStyles.caption, { color: labelColour, fontSize: 13, fontWeight: '600' }]}>
        {label}
      </Text>

      {count === undefined ? null : (
        <Text style={[appStyles.caption, { color: labelColour, fontSize: 13, opacity: 0.7 }]}>{count}</Text>
      )}
    </Pressable>
  )
}
