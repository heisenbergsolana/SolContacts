import { PropsWithChildren } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { DarkGlowBackground } from '@/components/dark-glow-background'
import { appStyles } from '@/constants/app-styles'

/**
 * The outer frame every screen sits in: the app's background, the safe area, and screen padding.
 *
 * Screens compose their own layout inside it — this deliberately does not impose a stack, because
 * the list screens scroll and the form screens do not.
 *
 * **It paints an opaque background, and must keep doing so.** The glow mesh used to live only
 * behind the whole navigator, with every screen transparent on top of it. That is what made a push
 * or a pop show both screens at once for a few frames: with nothing opaque in between, the
 * outgoing screen's text stayed legible through the incoming one. The mesh is static and identical
 * everywhere, so drawing it per screen looks the same and costs one SVG — and the one still behind
 * the navigator fills the sliver a transition briefly exposes at the edge.
 */
export function Screen({ children }: PropsWithChildren) {
  return (
    <DarkGlowBackground>
      <SafeAreaView style={appStyles.screen}>{children}</SafeAreaView>
    </DarkGlowBackground>
  )
}
