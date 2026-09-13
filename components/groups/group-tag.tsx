import { Text } from 'react-native'
import { appStyles, radius, spacing, useAppTheme } from '@/constants/app-styles'
import { GroupTone } from '@/types/contact'

export interface GroupTagProps {
  name: string
  tone: GroupTone
}

/**
 * The group a contact belongs to, shown on its row. Not a control — the row is already a button,
 * and a target inside a target is a target nobody hits on purpose.
 */
export function GroupTag({ name, tone }: GroupTagProps) {
  const theme = useAppTheme()

  return (
    <Text
      numberOfLines={1}
      style={[
        appStyles.caption,
        {
          backgroundColor: theme.surfaceAlt,
          borderRadius: radius.full,
          color: theme.tones[tone],
          fontSize: 11,
          fontWeight: '600',
          // A 32-character group name must not squeeze the contact's own name off its row.
          flexShrink: 1,
          overflow: 'hidden',
          paddingHorizontal: spacing.sm,
          paddingVertical: 2,
        },
      ]}
    >
      {name}
    </Text>
  )
}
