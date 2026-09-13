import { LinearGradient } from 'expo-linear-gradient'
import { Pressable, Text, View } from 'react-native'
import { appStyles, gradientFlow, radius, spacing, useAppTheme } from '@/constants/app-styles'
import { GroupTone } from '@/types/contact'
import { formatSol } from '@/utils/lamports-to-sol'

export interface GroupTileProps {
  name: string
  tone: GroupTone
  count: number
  /** Absent while any member's balance is missing — see `totalForGroup`. */
  totalLamports?: bigint
  onPress(): void
}

/**
 * One group on the Groups tab.
 *
 * The tone appears as a swatch, the count and the edge — never as a wash behind the text. Every
 * pairing here is one `app-styles.test.ts` measures; a tinted background would not be.
 */
export function GroupTile({ name, tone, count, totalLamports, onPress }: GroupTileProps) {
  const theme = useAppTheme()
  const toneColour = theme.tones[tone]

  let subtitle = 'No contacts yet'
  if (count > 0) subtitle = totalLamports === undefined ? 'Balance unavailable' : `${formatSol(totalLamports)} SOL`

  return (
    <Pressable
      accessibilityHint="Opens this group"
      accessibilityLabel={`${name}, ${count} ${count === 1 ? 'contact' : 'contacts'}`}
      accessibilityRole="button"
      // The parent decides how wide a tile is; the grid on the Groups tab makes them two abreast.
      style={{ borderRadius: radius.xl, overflow: 'hidden' }}
      onPress={onPress}
    >
      {({ pressed }) => (
        <LinearGradient
          colors={pressed ? theme.gradients.cardPressed : theme.gradients.card}
          end={gradientFlow.surface.end}
          start={gradientFlow.surface.start}
          style={{
            borderColor: toneColour,
            borderRadius: radius.xl,
            borderWidth: 1,
            gap: spacing.md,
            minHeight: 128,
            padding: spacing.lg,
          }}
        >
          <View style={{ alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' }}>
            <View style={{ backgroundColor: toneColour, borderRadius: radius.md, height: 34, width: 34 }} />
            <Text style={[appStyles.title, { color: toneColour }]}>{count}</Text>
          </View>

          <View style={{ gap: 2 }}>
            <Text numberOfLines={1} style={[appStyles.body, { color: theme.text, fontWeight: '600' }]}>
              {name}
            </Text>
            <Text numberOfLines={1} style={[appStyles.caption, { color: theme.textMuted }]}>
              {subtitle}
            </Text>
          </View>
        </LinearGradient>
      )}
    </Pressable>
  )
}
