import { Stack, type ErrorBoundaryProps } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import 'react-native-reanimated'
import { AppProviders } from '@/components/app-providers'
import { DarkGlowBackground } from '@/components/dark-glow-background'
import { OnboardingFlow } from '@/components/onboarding/onboarding-flow'
import { CrashScreen } from '@/components/crash-screen'
import { LoadingState } from '@/components/ui/loading-state'
import { useAppTheme } from '@/constants/app-styles'
import { useAppFonts } from '@/features/display/use-app-fonts'
import { useOnboarding } from '@/features/onboarding/use-onboarding'

/**
 * Expo Router renders this instead of the tree below when a render throws, which in a release build
 * would otherwise be a blank screen.
 *
 * Deliberately outside `AppProviders`: if what threw was a provider, mounting the same providers
 * again to apologise for it would only throw a second time.
 */
export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  return (
    <DarkGlowBackground>
      <CrashScreen error={error} onRetry={() => void retry()} />
      <StatusBar style="light" />
    </DarkGlowBackground>
  )
}

/**
 * The introduction stands in front of the navigator rather than beside it as a route: a first run
 * then has no history to go back into, and the home screen never flashes behind a redirect.
 */
export default function RootLayout() {
  const theme = useAppTheme()
  const fontsReady = useAppFonts()
  const onboarding = useOnboarding()

  // Nothing paints until the display face is in scope, so no heading is drawn twice in two faces.
  const holding = !fontsReady || onboarding.status === 'loading'

  if (holding || onboarding.status !== 'done') {
    return (
      <AppProviders>
        <DarkGlowBackground>
          {/* No text until the display face is in scope — a heading drawn twice in two faces is
              worse than a moment without one. A spinner has no such problem. */}
          {holding ? <LoadingState fill /> : <OnboardingFlow onDone={onboarding.complete} />}
        </DarkGlowBackground>
        <StatusBar style="light" />
      </AppProviders>
    )
  }

  return (
    <AppProviders>
      <DarkGlowBackground>
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: 'transparent' },
            headerTintColor: theme.text,
            headerShadowVisible: false,
            contentStyle: { backgroundColor: 'transparent' },
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="about" options={{ title: 'About' }} />
          <Stack.Screen name="add" options={{ title: 'Add Contact' }} />
          <Stack.Screen name="scan" options={{ title: 'Scan QR' }} />
          <Stack.Screen name="contact/[id]/index" options={{ title: 'Contact' }} />
          <Stack.Screen name="contact/[id]/edit" options={{ title: 'Edit Contact' }} />
          <Stack.Screen name="contact/[id]/qr" options={{ title: 'QR Code' }} />
          <Stack.Screen name="widget/[id]" options={{ title: 'Add to Widget' }} />
          <Stack.Screen name="group/new" options={{ title: 'New Group' }} />
          <Stack.Screen name="group/[id]/index" options={{ title: 'Group' }} />
          <Stack.Screen name="group/[id]/edit" options={{ title: 'Edit Group' }} />
        </Stack>
      </DarkGlowBackground>
      <StatusBar style="light" />
    </AppProviders>
  )
}
