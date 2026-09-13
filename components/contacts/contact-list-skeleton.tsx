import { View } from 'react-native'
import { Skeleton } from '@/components/ui/skeleton'
import { radius, spacing, useAppTheme } from '@/constants/app-styles'

/** Enough rows to fill the fold on a Seeker without pretending to know how many contacts exist. */
const PLACEHOLDER_ROWS = 4

/**
 * Placeholder rows shaped like `ContactListItem`, shown while the book loads.
 *
 * A full-screen spinner would say less and cost a layout jump when the real rows arrive.
 */
export function ContactListSkeleton() {
  const theme = useAppTheme()

  return (
    <View accessible accessibilityLabel="Loading contacts" style={{ gap: spacing.md }}>
      {Array.from({ length: PLACEHOLDER_ROWS }, (_, index) => (
        <View
          key={index}
          style={{
            backgroundColor: theme.surface,
            borderColor: theme.border,
            borderRadius: radius.md,
            borderWidth: 1,
            gap: spacing.sm,
            padding: spacing.lg,
          }}
        >
          <Skeleton height={18} width="55%" />
          <Skeleton height={14} width="80%" />
          <Skeleton height={12} width="35%" />
        </View>
      ))}
    </View>
  )
}
