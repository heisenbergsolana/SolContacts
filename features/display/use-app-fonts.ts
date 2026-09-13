import { SpaceGrotesk_600SemiBold } from '@expo-google-fonts/space-grotesk/600SemiBold'
import { SpaceGrotesk_700Bold } from '@expo-google-fonts/space-grotesk/700Bold'
import { useFonts } from 'expo-font'

/**
 * Load the display face used by the `display` and `title` type tokens.
 *
 * Only the two weights the scale actually uses are imported, and by sub-path: the package's index
 * requires all five, which would put three unread faces in the APK.
 *
 * Resolves true once the app may paint — *including* when loading failed. A missing font means a
 * heading in the system face, which is worse than the design; a screen held forever behind a font
 * file is worse than that.
 */
export function useAppFonts(): boolean {
  const [loaded, error] = useFonts({ SpaceGrotesk_600SemiBold, SpaceGrotesk_700Bold })

  return loaded || error !== null
}
