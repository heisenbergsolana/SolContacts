import { StyleSheet } from 'react-native'
import { GroupTone } from '@/types/contact'

/**
 * Design tokens for SolContacts. See docs/05-UI-UX.md for the rationale behind each value.
 *
 * Colours are the only tokens that vary by scheme, so they live in `palettes` and everything else is
 * scheme-independent. Components read colours through `useAppTheme()` and take the rest from here.
 */

/** 4-point scale. Screen padding is `lg`, card padding is `lg`, gap between cards is `md`. */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  /** Cards, rows and group tiles. */
  xl: 20,
  /** The two things that float: the tab bar and the wallet hero. */
  xxl: 24,
  full: 999,
} as const

/**
 * Addresses always use `mono`. Never render a wallet address in a proportional face — the whole
 * point is that a user can compare characters.
 */
export const typography = {
  /**
   * The two headline tokens carry the display face; body, labels and addresses stay on the system
   * font. A screen typeset entirely in a display face reads as a poster, and this one has addresses
   * on it. `features/display/use-app-fonts.ts` is what puts these names in scope.
   */
  display: { fontSize: 28, fontWeight: '700', fontFamily: 'SpaceGrotesk_700Bold', letterSpacing: -0.6 },
  title: { fontSize: 20, fontWeight: '600', fontFamily: 'SpaceGrotesk_600SemiBold', letterSpacing: -0.2 },
  body: { fontSize: 16, fontWeight: '400' },
  label: { fontSize: 13, fontWeight: '500', letterSpacing: 0.5, textTransform: 'uppercase' },
  mono: { fontSize: 15, fontWeight: '400', fontFamily: 'monospace' },
  caption: { fontSize: 12, fontWeight: '400' },
} as const

/**
 * Exactly two stops, because a gradient a reader can name has two.
 *
 * The tuple is what `expo-linear-gradient` wants for `colors`, so a token drops straight into the
 * prop with no spreading and no widening to `string[]`.
 */
export type Gradient = readonly [string, string]

export interface AppGradients {
  /**
   * Every filled control: buttons, the active tab pill, the add button.
   *
   * In dark this is Solana's own purple-to-green pair, at full strength. That is only possible
   * because the label on it is **black**: under white text a fill has to stay dark at both ends to
   * clear 4.5:1, while still clearing 3:1 against the screen, and the band left between those two
   * is narrow enough that every gradient in it comes out timid. Black ink inverts the problem —
   * the brighter the fill, the better the label reads — so the fill can be as loud as the brand is.
   *
   * Light needs a deeper green at the far end, because mint on white does not separate from the
   * page. Same idea, one stop darker.
   */
  primary: Gradient
  /** Every card and row. */
  card: Gradient
  /** The same card while it is held down. */
  cardPressed: Gradient
  /** The floating tab bar. */
  bar: Gradient
}

/**
 * Directions for `expo-linear-gradient`, so every surface in the app leans the same way.
 *
 * Surfaces run down the card and fills run across it: a button lit from the left reads as a control,
 * and a card lit from the top reads as a sheet of paper. Mixing the two makes neither read as either.
 */
export const gradientFlow = {
  surface: { start: { x: 0, y: 0 }, end: { x: 0.6, y: 1 } },
  fill: { start: { x: 0, y: 0 }, end: { x: 1, y: 0.6 } },
} as const

export interface AppPalette {
  bg: string
  surface: string
  surfaceAlt: string
  border: string
  /** For the two surfaces that float above the page and need a visible edge, not a hairline. */
  borderStrong: string
  text: string
  textMuted: string
  /**
   * Ink on a filled control — black, in both themes.
   *
   * Every fill in this palette is bright, so the label is dark. It is the choice that lets the
   * primary gradient be Solana's actual colours instead of two shades of the same violet. Never
   * used on `bg` or `surface`.
   */
  textOnFill: string
  primary: string
  accent: string
  danger: string
  /**
   * Fill for the destructive button, distinct from `danger`.
   *
   * `danger` has to read as text on a dark background, which makes it too light to carry a white
   * label. One token cannot do both jobs at 4.5:1 — `constants/app-styles.test.ts` proves it.
   */
  dangerSurface: string
  warning: string
  /**
   * Group colours, read as text on a chip. Light needs its own set: the dark tones are chosen to
   * glow on near-black and every one of them fails on white.
   */
  tones: Record<GroupTone, string>
  gradients: AppGradients
}

/**
 * Solana Night.
 *
 * A genuinely black ground rather than a tinted grey, so the two brand colours are the only thing
 * on the screen with any chroma in it — and so the fills can carry Solana's own purple-to-green
 * gradient without competing with anything. The eight group tones are the one other place colour
 * is allowed to mean something, because there colour *is* the label.
 */
export const palettes: Record<'dark' | 'light', AppPalette> = {
  dark: {
    bg: '#07080B',
    surface: '#101219',
    surfaceAlt: '#1A1D26',
    border: '#272B36',
    borderStrong: '#333845',
    text: '#F7F9FC',
    textMuted: '#98A2B3',
    textOnFill: '#000000',
    primary: '#9945FF',
    accent: '#14F195',
    danger: '#FF6B6B',
    // Bright, like every other fill here, because the ink on it is black. One value serves both
    // themes: it is light enough to read black text and dark enough to separate from white.
    dangerSurface: '#F2555A',
    warning: '#FDB022',
    tones: {
      mint: '#14F195',
      cyan: '#22D3EE',
      violet: '#A78BFA',
      pink: '#F472B6',
      amber: '#FBBF24',
      blue: '#60A5FA',
      lime: '#A3E635',
      rose: '#FB7185',
    },
    gradients: {
      primary: ['#9945FF', '#14F195'],
      card: ['#12141C', '#0C0E14'],
      cardPressed: ['#1A1D26', '#141720'],
      bar: ['#171A22', '#101219'],
    },
  },
  light: {
    bg: '#FCFCFD',
    surface: '#F4F5F7',
    surfaceAlt: '#E9EBEF',
    border: '#DDE0E6',
    borderStrong: '#C8CCD4',
    text: '#0B0D12',
    textMuted: '#55606F',
    textOnFill: '#000000',
    primary: '#9945FF',
    // Darker than the dark theme's green by necessity: #14F195 on white is 2.4:1, unreadable.
    accent: '#067045',
    danger: '#C4271B',
    dangerSurface: '#F2555A',
    warning: '#8A4B00',
    tones: {
      mint: '#067045',
      cyan: '#0B5F76',
      violet: '#6D28D9',
      pink: '#BE185D',
      amber: '#8A4B00',
      blue: '#1D4ED8',
      lime: '#3F6212',
      rose: '#BE123C',
    },
    gradients: {
      // Mint does not separate from a white page, so the far stop goes a shade deeper. The near
      // stop is untouched: #9945FF reads black text and separates from white as it is.
      primary: ['#9945FF', '#0B8F5A'],
      card: ['#FFFFFF', '#F4F5F7'],
      cardPressed: ['#E9EBEF', '#E1E4EA'],
      bar: ['#FFFFFF', '#F2F3F6'],
    },
  },
}

/**
 * The active palette. SolContacts ships as Solana Night only — the app does not follow the
 * system light/dark setting, so the wallet address list never lands on a light background.
 */
export function useAppTheme(): AppPalette {
  return palettes.dark
}

/** Scheme-independent layout styles. Colours are applied inline from `useAppTheme()`. */
export const appStyles = StyleSheet.create({
  screen: {
    flex: 1,
    gap: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  stack: {
    gap: spacing.sm,
  },
  card: {
    borderRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  title: typography.title,
  display: typography.display,
  body: typography.body,
  label: typography.label,
  mono: typography.mono,
  caption: typography.caption,
})
