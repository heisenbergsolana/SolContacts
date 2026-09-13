import { Text, View } from 'react-native'
import { appStyles, spacing, useAppTheme } from '@/constants/app-styles'
import { Button } from './ui/button'
import { Screen } from './ui/screen'

export interface CrashScreenProps {
  /** The error that got this far. Shown as a footnote, for a user who is reporting it. */
  error: Error
  /** Re-renders what threw. */
  onRetry: () => void
}

/**
 * What the app shows instead of a blank screen when a render throws.
 *
 * The first thing it says is that nothing was lost, because in an app that sits next to wallets a
 * crash is exactly where someone starts worrying about their money. Contacts live in local storage
 * and are not touched by a render failing, so saying so costs nothing and is the only sentence that
 * matters to the person reading it.
 *
 * The error text is last, small, and deliberately not translated into anything friendlier: it is
 * the only thing a user can usefully quote back in a bug report.
 */
export function CrashScreen({ error, onRetry }: CrashScreenProps) {
  const theme = useAppTheme()

  return (
    <Screen>
      <View style={{ flex: 1, gap: spacing.lg, justifyContent: 'center' }}>
        <Text style={[appStyles.display, { color: theme.text }]}>Something went wrong.</Text>
        <Text style={[appStyles.body, { color: theme.textMuted }]}>
          Your contacts are safe. They are stored on this device and nothing was lost. This does not affect any wallet
          or any funds.
        </Text>
        <View style={{ alignSelf: 'flex-start' }}>
          <Button label="Try again" onPress={onRetry} />
        </View>
        <Text selectable style={[appStyles.caption, { color: theme.textMuted }]}>
          {error.message}
        </Text>
      </View>
    </Screen>
  )
}
