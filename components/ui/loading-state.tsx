import { Text, View } from 'react-native'
import { appStyles, spacing, useAppTheme } from '@/constants/app-styles'
import { Spinner } from './spinner'

export interface LoadingStateProps {
  /** What is being waited for. Shown under the spinner and read out in its place. */
  label?: string
  /** Fills the screen it is on rather than sitting in the flow of one. */
  fill?: boolean
}

/**
 * The one wait the app shows when it has nothing else to put on screen.
 *
 * Wherever the shape of the result is already known, a skeleton is still the better answer — see
 * `skeleton.tsx`, which is why the contact list does not use this. This is for the rest: a screen
 * opened by a deep link before storage has answered, a form whose subject is still loading.
 *
 * The spinner itself is hidden from accessibility, so the wrapper carries the announcement — a
 * screen reader should hear "Loading" once, not once per moving part.
 */
export function LoadingState({ label = 'Loading…', fill = false }: LoadingStateProps) {
  const theme = useAppTheme()

  return (
    <View
      accessibilityLabel={label}
      accessibilityRole="progressbar"
      accessible
      style={{
        alignItems: 'center',
        flex: fill ? 1 : undefined,
        gap: spacing.md,
        justifyContent: 'center',
        paddingVertical: spacing.xxl,
      }}
    >
      <Spinner size={32} />
      <Text style={[appStyles.caption, { color: theme.textMuted }]}>{label}</Text>
    </View>
  )
}
