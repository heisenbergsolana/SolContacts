import Constants from 'expo-constants'
import { Linking } from 'react-native'
import { AboutPanel } from '@/components/about-panel'
import { Screen } from '@/components/ui/screen'

/**
 * Called About and not Settings because there is nothing here to set: the palette is fixed and the
 * cluster is chosen at build time. Inventing a switch so that a menu could justify its name would
 * make the app worse.
 */
export default function AboutScreen() {
  return (
    <Screen>
      <AboutPanel version={Constants.expoConfig?.version ?? '—'} onOpen={(url) => void Linking.openURL(url)} />
    </Screen>
  )
}
