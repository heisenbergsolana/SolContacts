import { LinearGradient } from 'expo-linear-gradient'
import { ComponentType, useState } from 'react'
import { LayoutChangeEvent, Pressable } from 'react-native'
import Animated, {
  FadeIn,
  FadeOut,
  LinearTransition,
  useAnimatedStyle,
  useDerivedValue,
  withSpring,
} from 'react-native-reanimated'
import { appStyles, gradientFlow, radius, spacing, useAppTheme } from '@/constants/app-styles'
import { useReducedMotion } from './use-reduced-motion'

/**
 * Room a screen must leave below its content so the floating bar never covers the last row.
 *
 * The bar is 44 tall, sits 12 above the safe area, and wants 16 of air over it. Screens inside
 * `Screen` are already inset for the safe area, so this is the whole of it.
 */
export const TAB_BAR_CLEARANCE = 72

/**
 * Two tabs do not need a wide bar, and the one they had ate a row of the list on every screen.
 * 44 is as slim as it goes: the whole bar is the touch target, and that is the accessibility
 * floor from docs/05-UI-UX.md.
 */
const BAR_HEIGHT = 44

/** The bar's hairline. It is part of the height and of the width, so both have to allow for it. */
const BORDER = 1

/** Air between the pill and the bar's inside edge, the same on all four sides. */
const PILL_INSET = spacing.xs

/** Firm rather than bouncy: the pill should arrive with the screen, not settle after it. */
const SLIDE = { damping: 18, mass: 0.7, stiffness: 220 } as const

export interface TabBarItem {
  key: string
  label: string
  icon: ComponentType<{ color: string; size?: number }>
}

export interface TabBarProps {
  items: readonly TabBarItem[]
  activeIndex: number
  onSelect(index: number): void
  /** Bottom safe-area inset. The bar floats over the content, so nothing else applies it. */
  bottomInset: number
}

/**
 * The floating tab bar.
 *
 * Presentational: it is handed items and an index, never a navigation object, so it renders in a
 * test with no navigator around it.
 *
 * Absolutely positioned, which is what makes it float — a bar in the navigator's column would push
 * the list up and take the wash with it. Screens leave `TAB_BAR_CLEARANCE` at the bottom instead.
 */
export function AppTabBar({ items, activeIndex, onSelect, bottomInset }: TabBarProps) {
  const theme = useAppTheme()
  const reducedMotion = useReducedMotion()
  const [barWidth, setBarWidth] = useState(0)

  // The measured width is the border box; the tabs are laid out inside the border, so the pill has
  // to divide up the same space they do or it drifts a pixel further off with every tab.
  const slotWidth = barWidth > 0 ? (barWidth - BORDER * 2) / items.length : 0

  // A derived value rather than an effect assigning a shared value: the pill leaves with the
  // press, not one frame after the screen behind it has already changed.
  const position = useDerivedValue(() => (reducedMotion ? activeIndex : withSpring(activeIndex, SLIDE)))

  const pillStyle = useAnimatedStyle(
    () => ({ transform: [{ translateX: position.value * slotWidth }], width: slotWidth }),
    [slotWidth],
  )

  function measure(event: LayoutChangeEvent) {
    setBarWidth(event.nativeEvent.layout.width)
  }

  return (
    <LinearGradient
      colors={theme.gradients.bar}
      end={gradientFlow.surface.end}
      start={gradientFlow.surface.start}
      style={{
        borderColor: theme.borderStrong,
        borderRadius: radius.xxl,
        borderWidth: BORDER,
        bottom: bottomInset + spacing.md,
        flexDirection: 'row',
        height: BAR_HEIGHT,
        left: spacing.lg,
        overflow: 'hidden',
        position: 'absolute',
        right: spacing.lg,
      }}
      onLayout={measure}
    >
      {/* Behind the tabs, so the labels are never drawn under their own highlight. Stretched to the
          bar rather than given a height of its own: `BAR_HEIGHT` counts the border, the space inside
          it does not, and the two pixels of difference all landed under the pill. */}
      <Animated.View style={[{ bottom: 0, position: 'absolute', top: 0 }, pillStyle]}>
        <LinearGradient
          colors={theme.gradients.primary}
          end={gradientFlow.fill.end}
          start={gradientFlow.fill.start}
          style={{
            // A capsule inside a capsule: the bar's own corners are fully round at this height, so
            // a squarer pill would keep its inset along the straight edges and lose it in the curve.
            borderRadius: radius.full,
            bottom: PILL_INSET,
            left: PILL_INSET,
            position: 'absolute',
            right: PILL_INSET,
            top: PILL_INSET,
          }}
        />
      </Animated.View>

      {items.map((item, index) => {
        const active = index === activeIndex
        const Icon = item.icon

        return (
          <Pressable
            accessibilityLabel={item.label}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            key={item.key}
            style={{ alignItems: 'center', flex: 1, justifyContent: 'center' }}
            onPress={() => onSelect(index)}
          >
            <Animated.View
              layout={reducedMotion ? undefined : LinearTransition.duration(180)}
              style={{ alignItems: 'center', flexDirection: 'row', gap: spacing.xs }}
            >
              <Icon color={active ? theme.textOnFill : theme.textMuted} size={20} />
              {/* Only the active tab is labelled: three labels at once is a toolbar, not a bar. */}
              {active ? (
                <Animated.Text
                  entering={reducedMotion ? undefined : FadeIn.duration(120)}
                  exiting={reducedMotion ? undefined : FadeOut.duration(80)}
                  numberOfLines={1}
                  style={[appStyles.caption, { color: theme.textOnFill, fontSize: 12, fontWeight: '600' }]}
                >
                  {item.label}
                </Animated.Text>
              ) : null}
            </Animated.View>
          </Pressable>
        )
      })}
    </LinearGradient>
  )
}
