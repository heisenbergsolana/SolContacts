import { Text, View } from 'react-native'
import { appStyles, spacing, useAppTheme } from '@/constants/app-styles'
import { Button } from './ui/button'

export interface NotFoundPanelProps {
  onGoHome: () => void
}

/**
 * What an unmatched route shows. The app registers a `solcontacts://` scheme, so this is reachable
 * by anyone who can put a link in front of the user — a stale share, a typo, a link built by hand.
 *
 * Expo Router has a built-in screen for this, but it prints the unmatched path, which is written
 * for whoever is developing the app. This one is written for whoever is holding the phone.
 */
export function NotFoundPanel({ onGoHome }: NotFoundPanelProps) {
  const theme = useAppTheme()

  return (
    <View style={{ flex: 1, gap: spacing.lg, justifyContent: 'center' }}>
      <Text accessibilityRole="header" style={[appStyles.display, { color: theme.text }]}>
        That link goes nowhere.
      </Text>
      <Text style={[appStyles.body, { color: theme.textMuted }]}>
        Nothing was opened and nothing was changed. Your contacts are where you left them.
      </Text>
      <View style={{ alignSelf: 'flex-start' }}>
        <Button label="Go to contacts" onPress={onGoHome} />
      </View>
    </View>
  )
}
