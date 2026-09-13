import { LinearGradient } from 'expo-linear-gradient'
import { PropsWithChildren } from 'react'
import { ViewStyle } from 'react-native'
import { gradientFlow, radius, spacing, useAppTheme } from '@/constants/app-styles'

export interface CardProps extends PropsWithChildren {
  style?: ViewStyle
}

/** The surface every grouped block on a screen sits on. */
export function Card({ children, style }: CardProps) {
  const theme = useAppTheme()

  return (
    <LinearGradient
      colors={theme.gradients.card}
      end={gradientFlow.surface.end}
      start={gradientFlow.surface.start}
      style={[
        {
          borderColor: theme.border,
          borderRadius: radius.xl,
          borderWidth: 1,
          gap: spacing.xs,
          padding: spacing.lg,
        },
        style,
      ]}
    >
      {children}
    </LinearGradient>
  )
}
