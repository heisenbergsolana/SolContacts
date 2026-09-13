import { Text, View } from 'react-native'
import { Button } from '@/components/ui/button'
import { appStyles, spacing, useAppTheme } from '@/constants/app-styles'

export interface ContactsEmptyStateProps {
  onAddContact: () => void
}

/** Shown when the book is empty. An empty state without a next action is just a dead end. */
export function ContactsEmptyState({ onAddContact }: ContactsEmptyStateProps) {
  const theme = useAppTheme()

  return (
    <View style={{ alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xxl }}>
      <Text accessibilityRole="header" style={[appStyles.title, { color: theme.text }]}>
        No contacts yet
      </Text>
      <Text style={[appStyles.body, { color: theme.textMuted, textAlign: 'center' }]}>
        Save your first Solana wallet address and stop pasting it from your notes.
      </Text>
      <Button label="Add Contact" onPress={onAddContact} />
    </View>
  )
}
