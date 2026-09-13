import { Text, View } from 'react-native'
import { Button } from '@/components/ui/button'
import { appStyles, spacing, useAppTheme } from '@/constants/app-styles'

export interface GroupsEmptyStateProps {
  onCreateGroup: () => void
}

/** An empty state with the next action in it, not a shrug. */
export function GroupsEmptyState({ onCreateGroup }: GroupsEmptyStateProps) {
  const theme = useAppTheme()

  return (
    <View style={{ alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xxl }}>
      <Text accessibilityRole="header" style={[appStyles.title, { color: theme.text, textAlign: 'center' }]}>
        No groups yet
      </Text>
      <Text style={[appStyles.body, { color: theme.textMuted, textAlign: 'center' }]}>
        Groups sort your contacts into the sets you actually use — friends, exchanges, your own wallets. A contact
        belongs to one at a time, and none by default.
      </Text>
      <Button label="Create a group" onPress={onCreateGroup} />
    </View>
  )
}
