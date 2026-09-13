import { Text, View } from 'react-native'
import { RetryNotice } from '@/components/ui/retry-notice'
import { Skeleton } from '@/components/ui/skeleton'
import { appStyles, useAppTheme } from '@/constants/app-styles'
import { formatSol } from '@/utils/lamports-to-sol'

export interface BalanceLabelProps {
  lamports?: bigint
  isLoading: boolean
  isError: boolean
  onRetry?: () => void
  /** `title` on the detail screen, `caption` in a list row. */
  size?: 'caption' | 'title'
}

/**
 * A SOL balance, or an honest account of why there isn't one.
 *
 * A failed lookup never renders as `0 SOL`: zero and "we could not ask" mean very different things
 * to someone about to send funds. Loading shows a placeholder of the same size for the same reason,
 * so the row does not resize when the number lands.
 */
export function BalanceLabel({ lamports, isLoading, isError, onRetry, size = 'caption' }: BalanceLabelProps) {
  const theme = useAppTheme()
  const isTitle = size === 'title'
  const textStyle = isTitle ? appStyles.title : appStyles.caption

  if (isLoading) {
    return (
      <View
        accessible
        accessibilityLabel="Loading balance"
        style={{ justifyContent: 'center', minHeight: isTitle ? 26 : 20 }}
      >
        <Skeleton height={isTitle ? 20 : 12} width={isTitle ? 140 : 92} />
      </View>
    )
  }

  if (isError || lamports === undefined) {
    return <RetryNotice message="Balance unavailable" onRetry={onRetry} />
  }

  return <Text style={[textStyle, { color: theme.text }]}>{formatSol(lamports)} SOL</Text>
}
