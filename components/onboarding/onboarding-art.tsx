import { LinearGradient } from 'expo-linear-gradient'
import { ReactNode } from 'react'
import { Text, View, ViewStyle } from 'react-native'
import Svg, { Path, Rect } from 'react-native-svg'
import { CopyIcon } from '@/components/ui/icons/copy-icon'
import { StarIcon } from '@/components/ui/icons/star-icon'
import { appStyles, gradientFlow, radius, spacing, useAppTheme } from '@/constants/app-styles'

/**
 * The four illustrations of the introduction.
 *
 * Each is built from the app's own furniture — the contact row, the validation tick, the scanner
 * frame, the widget — rather than from stock artwork, so the first thing someone sees is the thing
 * they are about to use. They are hidden from screen readers: the headline and body beside them
 * carry the meaning, and a decorative row read out row by row would only be in the way. The one
 * exception is `TrustArt`, whose claims *are* the content.
 */

/**
 * A decorative code: the three finder squares of a real QR with a fixed scatter between them.
 *
 * It does not decode, and that is deliberate — an illustration must never put a scannable address
 * in front of a camera.
 */
const GLYPH = [
  '#######.......#######',
  '#.....#..#....#.....#',
  '#.###.#.###...#.###.#',
  '#.###.#.#.....#.###.#',
  '#.###.#.##.##.#.###.#',
  '#.....#.##....#.....#',
  '#######.......#######',
  '........#............',
  '####.#.#..##...##..##',
  '#..####.#..#.#.#.##..',
  '#.##..#.##.####.#.#..',
  '...##..##..#....##.#.',
  '#..##.##...#.###.###.',
  '........##.....###...',
  '#######.#...#.#......',
  '#.....#..#...#....#..',
  '#.###.#.#....#....#.#',
  '#.###.#...#....###.##',
  '#.###.#.....#.#....#.',
  '#.....#.##.....##.###',
  '#######...#...##.#..#',
] as const

interface QrGlyphProps {
  /** The white tile's edge, in dp. The code inside it keeps the quiet zone a real one would. */
  size: number
}

function QrGlyph({ size }: QrGlyphProps) {
  const pad = Math.round(size * 0.09)
  const code = size - pad * 2

  return (
    <View style={{ backgroundColor: '#FFFFFF', borderRadius: radius.sm, padding: pad }}>
      <Svg height={code} viewBox={`0 0 ${GLYPH.length} ${GLYPH.length}`} width={code}>
        {GLYPH.map((row, y) =>
          row
            .split('')
            .map((cell, x) =>
              cell === '#' ? <Rect fill="#101418" height={1} key={`${x}-${y}`} width={1} x={x} y={y} /> : null,
            ),
        )}
      </Svg>
    </View>
  )
}

interface RowProps {
  name: string
  address: string
  balance: string
  group?: { label: string; tone: string }
  pinned?: boolean
  trailing: 'qr' | 'copy'
}

/** The contact row, cut down to what an illustration can hold. The real one is `contact-list-item`. */
function ContactRow({ name, address, balance, group, pinned = false, trailing }: RowProps) {
  const theme = useAppTheme()

  return (
    <LinearGradient
      colors={theme.gradients.card}
      end={gradientFlow.surface.end}
      start={gradientFlow.surface.start}
      style={{
        alignItems: 'center',
        borderColor: theme.border,
        borderRadius: radius.xl,
        borderWidth: 1,
        flexDirection: 'row',
        gap: spacing.md,
        padding: spacing.md,
      }}
    >
      <View style={{ flex: 1, gap: spacing.xs }}>
        <View style={{ alignItems: 'center', flexDirection: 'row', gap: spacing.sm }}>
          <Text numberOfLines={1} style={[appStyles.title, { color: theme.text, flexShrink: 1 }]}>
            {name}
          </Text>
          {pinned ? <StarIcon color={theme.warning} /> : null}
          {group ? (
            <View
              style={{
                backgroundColor: `${group.tone}22`,
                borderRadius: radius.full,
                paddingHorizontal: spacing.sm,
                paddingVertical: 2,
              }}
            >
              <Text style={[appStyles.caption, { color: group.tone, fontWeight: '600' }]}>{group.label}</Text>
            </View>
          ) : null}
        </View>
        <Text style={[appStyles.mono, { color: theme.textMuted }]}>{address}</Text>
        <Text style={[appStyles.caption, { color: theme.text }]}>{balance}</Text>
      </View>

      {trailing === 'qr' ? (
        <QrGlyph size={52} />
      ) : (
        <View
          style={{
            alignItems: 'center',
            backgroundColor: theme.surfaceAlt,
            borderColor: theme.border,
            borderRadius: radius.md,
            borderWidth: 1,
            height: 40,
            justifyContent: 'center',
            width: 40,
          }}
        >
          <CopyIcon color={theme.text} size={18} />
        </View>
      )}
    </LinearGradient>
  )
}

/** The list they will have in a minute: search, a pin, a group, a balance, the row's own controls. */
export function ContactBookArt() {
  const theme = useAppTheme()

  return (
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ gap: spacing.sm }}>
      <View
        style={{
          alignItems: 'center',
          backgroundColor: theme.surface,
          borderColor: theme.border,
          borderRadius: radius.lg,
          borderWidth: 1,
          flexDirection: 'row',
          gap: spacing.sm,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm + 2,
        }}
      >
        <Svg fill="none" height={18} viewBox="0 0 24 24" width={18}>
          <Path d="M11 4a7 7 0 1 1 0 14 7 7 0 0 1 0-14Z" stroke={theme.textMuted} strokeWidth={2} />
          <Path d="M20 20l-4-4" stroke={theme.textMuted} strokeLinecap="round" strokeWidth={2} />
        </Svg>
        <Text style={[appStyles.body, { color: theme.textMuted }]}>Search name or address…</Text>
      </View>

      <ContactRow
        address="7xKX…gAsU"
        balance="12.42 SOL"
        group={{ label: 'Friends', tone: theme.tones.mint }}
        name="Ada"
        pinned
        trailing="qr"
      />
      <ContactRow
        address="8Hd2…t72Q"
        balance="4.81 SOL"
        group={{ label: 'Mine', tone: theme.tones.violet }}
        name="My cold wallet"
        trailing="copy"
      />
    </View>
  )
}

interface ClaimProps {
  label: string
  tone: 'does' | 'never'
}

function Claim({ label, tone }: ClaimProps) {
  const theme = useAppTheme()
  const color = tone === 'does' ? theme.accent : theme.danger

  return (
    <View style={{ alignItems: 'center', flexDirection: 'row', gap: spacing.md }}>
      <Svg fill="none" height={20} viewBox="0 0 24 24" width={20}>
        {tone === 'does' ? (
          <Path d="M4 12.5l5 5L20 6.5" stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} />
        ) : (
          <Path d="M6 6l12 12M18 6L6 18" stroke={color} strokeLinecap="round" strokeWidth={2.2} />
        )}
      </Svg>
      <Text style={[appStyles.body, { color: theme.text, flexShrink: 1 }]}>{label}</Text>
    </View>
  )
}

interface ClaimGroupProps {
  heading: string
  tone: 'does' | 'never'
  claims: readonly string[]
}

function ClaimGroup({ heading, tone, claims }: ClaimGroupProps) {
  const theme = useAppTheme()

  return (
    <LinearGradient
      colors={theme.gradients.card}
      end={gradientFlow.surface.end}
      start={gradientFlow.surface.start}
      style={{
        borderColor: theme.border,
        borderRadius: radius.xl,
        borderWidth: 1,
        gap: spacing.md,
        padding: spacing.lg,
      }}
    >
      <Text style={[appStyles.label, { color: theme.textMuted }]}>{heading}</Text>
      {claims.map((claim) => (
        <Claim key={claim} label={claim} tone={tone} />
      ))}
    </LinearGradient>
  )
}

/**
 * The trust claim, in the app's own validation colours.
 *
 * Not decorative and not marketing: it is the one thing a user needs to be sure of before they
 * paste an address anywhere, so it is stated before anything is asked of them — and left readable
 * to a screen reader, unlike the other three.
 */
export function TrustArt() {
  return (
    <View style={{ gap: spacing.md }}>
      <ClaimGroup
        claims={[
          'Stores public addresses, on this device',
          'Reads balances from the network',
          'Works with no account and no server',
        ]}
        heading="What it does"
        tone="does"
      />
      <ClaimGroup
        claims={['Ask for a seed phrase', 'Hold or store a private key', 'Sign, send or move funds']}
        heading="What it never does"
        tone="never"
      />
    </View>
  )
}

/** The scanner's framing marks around a code, and the check the app runs on what comes out. */
export function ScanArt() {
  const theme = useAppTheme()

  return (
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ gap: spacing.md }}>
      <View style={{ alignItems: 'center', justifyContent: 'center' }}>
        <Svg fill="none" height={180} viewBox="0 0 200 200" width={180}>
          <Path d="M8 56V20a12 12 0 0 1 12-12h36" stroke={theme.primary} strokeLinecap="round" strokeWidth={5} />
          <Path d="M144 8h36a12 12 0 0 1 12 12v36" stroke={theme.primary} strokeLinecap="round" strokeWidth={5} />
          <Path d="M192 144v36a12 12 0 0 1-12 12h-36" stroke={theme.accent} strokeLinecap="round" strokeWidth={5} />
          <Path d="M56 192H20a12 12 0 0 1-12-12v-36" stroke={theme.accent} strokeLinecap="round" strokeWidth={5} />
        </Svg>
        {/* Inside the frame rather than beside it: what the camera is being pointed at is the code. */}
        <View style={{ position: 'absolute' }}>
          <QrGlyph size={116} />
        </View>
      </View>

      <LinearGradient
        colors={theme.gradients.card}
        end={gradientFlow.surface.end}
        start={gradientFlow.surface.start}
        style={{
          borderColor: theme.border,
          borderRadius: radius.xl,
          borderWidth: 1,
          gap: spacing.sm,
          padding: spacing.md,
        }}
      >
        <Text style={[appStyles.mono, { color: theme.text }]}>7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU</Text>
        <View style={{ alignItems: 'center', flexDirection: 'row', gap: spacing.sm }}>
          <Svg fill="none" height={16} viewBox="0 0 24 24" width={16}>
            <Path
              d="M4 12.5l5 5L20 6.5"
              stroke={theme.accent}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.6}
            />
          </Svg>
          <Text style={[appStyles.caption, { color: theme.accent }]}>Valid Solana address</Text>
        </View>
      </LinearGradient>
    </View>
  )
}

interface WidgetFrameProps {
  children: ReactNode
  height?: number
  style?: ViewStyle
}

/**
 * A widget as it sits on a home screen.
 *
 * The two blues are the widget's own surface, not palette tokens — it carries the app's glow mesh
 * in `modules/contact-widget/.../widget_surface.xml`, and an illustration of it that used the
 * app's card colours would be an illustration of something else.
 */
function WidgetFrame({ children, height, style }: WidgetFrameProps) {
  return (
    <LinearGradient
      colors={['#16276F', '#05070D']}
      end={{ x: 1, y: 0.1 }}
      start={{ x: 0, y: 1 }}
      style={[
        {
          borderColor: '#2A3350',
          borderRadius: radius.xxl,
          borderWidth: 1,
          height,
          padding: spacing.sm + 2,
        },
        style,
      ]}
    >
      {children}
    </LinearGradient>
  )
}

interface WidgetTextProps {
  name: string
  address: string
}

function WidgetText({ name, address }: WidgetTextProps) {
  const theme = useAppTheme()

  return (
    <View style={{ flex: 1 }}>
      <Text numberOfLines={1} style={[appStyles.caption, { color: theme.text, fontWeight: '700' }]}>
        {name}
      </Text>
      <Text numberOfLines={1} style={[appStyles.caption, { color: theme.textMuted, fontFamily: 'monospace' }]}>
        {address}
      </Text>
    </View>
  )
}

function WidgetCopyButton() {
  const theme = useAppTheme()

  return (
    <View
      style={{
        alignItems: 'center',
        backgroundColor: '#0B0E14CC',
        borderColor: '#2A3350',
        borderRadius: radius.md,
        borderWidth: 1,
        height: 32,
        justifyContent: 'center',
        width: 32,
      }}
    >
      <CopyIcon color={theme.text} size={15} />
    </View>
  )
}

/** The home screen the app leaves behind: one square widget and two rows. */
export function WidgetArt() {
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{ flexDirection: 'row', gap: spacing.md }}
    >
      <WidgetFrame height={150} style={{ width: 150 }}>
        <WidgetText address="7xKX…gAsU" name="Ada" />
        <View style={{ alignItems: 'flex-end', flexDirection: 'row', flex: 1, justifyContent: 'space-between' }}>
          <QrGlyph size={68} />
          <WidgetCopyButton />
        </View>
      </WidgetFrame>

      <View style={{ flex: 1, gap: spacing.md }}>
        <WidgetFrame height={69} style={{ alignItems: 'center', flexDirection: 'row', gap: spacing.sm }}>
          <QrGlyph size={48} />
          <WidgetText address="8Hd2…t72Q" name="Exchange" />
          <WidgetCopyButton />
        </WidgetFrame>
        <WidgetFrame style={{ alignItems: 'center', flex: 1, flexDirection: 'row', gap: spacing.sm }}>
          <WidgetText address="4pQm…7yTs" name="Mum" />
          <WidgetCopyButton />
        </WidgetFrame>
      </View>
    </View>
  )
}
