import { Pressable, Text } from 'react-native'
import { appStyles, useAppTheme } from '@/constants/app-styles'

export interface RetryNoticeProps {
  /** What is missing, in plain language: "Balance unavailable". */
  message: string
  /** Omitted when retrying cannot help — the message then stands on its own. */
  onRetry?: () => void
}

/**
 * How this app reports a value it could not load: say what is missing, and offer another go.
 *
 * Never used for a whole screen. A failed lookup leaves the rest of the screen intact and only its
 * own slot admits to it. The text is deliberately short — it sits inside a list row.
 */
export function RetryNotice({ message, onRetry }: RetryNoticeProps) {
  const theme = useAppTheme()
  const label = <Text style={[appStyles.caption, { color: theme.textMuted }]}>{message}</Text>

  if (!onRetry) return label

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${message}. Tap to try again.`}
      // The line itself is one caption tall; the hit area is not.
      hitSlop={12}
      onPress={onRetry}
      style={{ alignSelf: 'flex-start', justifyContent: 'center', minHeight: 20 }}
    >
      <Text style={[appStyles.caption, { color: theme.textMuted }]}>{message} · Retry</Text>
    </Pressable>
  )
}
