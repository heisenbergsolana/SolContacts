import { PropsWithChildren } from 'react'
import { StyleSheet, View } from 'react-native'
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg'

/**
 * The app-wide background: three blue glows bled into black, one mesh behind every screen.
 *
 * Drawn as stacked SVG radial gradients rather than a linear gradient because the shape wanted
 * here is a set of soft blobs — a light source in a corner — and a linear gradient can only ever
 * produce a band across the screen.
 *
 * Each glow gets four stops instead of two. Two stops fall off linearly, which on a near-black
 * screen shows as visible rings; the eased middle stops approximate the falloff of real light and
 * hide the banding an OLED panel would otherwise make obvious.
 *
 * Nothing animates. This is on screen the whole time someone is reading an address off it.
 */

interface Glow {
  id: string
  /** Centre and radii of the ellipse, as a fraction of the screen. */
  cx: string
  cy: string
  rx: string
  ry: string
  color: string
  opacity: number
}

const GLOWS: readonly Glow[] = [
  /* Upper right: the dim one, far enough off the top edge that it reads as spill, not a spotlight. */
  { id: 'glow-top-right', cx: '80%', cy: '12%', rx: '70%', ry: '34%', color: '#15287d', opacity: 0.95 },
  /* A wide, low wash that carries blue across the whole bottom edge and joins the two below it. */
  { id: 'glow-bottom-wash', cx: '50%', cy: '108%', rx: '95%', ry: '32%', color: '#0c1a5c', opacity: 0.8 },
  /* Bottom right corner, deeper and more contained than the left. */
  { id: 'glow-bottom-right', cx: '104%', cy: '86%', rx: '46%', ry: '26%', color: '#101f6e', opacity: 0.9 },
  /* Bottom left: the brightest source, thrown diagonally up into the black middle. */
  { id: 'glow-bottom-left', cx: '2%', cy: '97%', rx: '64%', ry: '42%', color: '#1a34bd', opacity: 1 },
]

/** Offset/alpha pairs shaping one glow's falloff, hot core to nothing. */
const FALLOFF = [
  [0, 1],
  [0.35, 0.72],
  [0.65, 0.28],
  [1, 0],
] as const

export function DarkGlowBackground({ children }: PropsWithChildren) {
  return (
    <View style={styles.container}>
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <Svg style={StyleSheet.absoluteFill}>
          <Defs>
            {GLOWS.map((glow) => (
              <RadialGradient key={glow.id} id={glow.id} cx={glow.cx} cy={glow.cy} rx={glow.rx} ry={glow.ry}>
                {FALLOFF.map(([offset, alpha]) => (
                  <Stop key={offset} offset={offset} stopColor={glow.color} stopOpacity={alpha * glow.opacity} />
                ))}
              </RadialGradient>
            ))}
          </Defs>
          {GLOWS.map((glow) => (
            <Rect key={glow.id} fill={`url(#${glow.id})`} height="100%" width="100%" />
          ))}
        </Svg>
      </View>
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#000000',
    flex: 1,
  },
})
