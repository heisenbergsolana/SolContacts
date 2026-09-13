import Clipboard from '@react-native-clipboard/clipboard'
import { useLocalSearchParams } from 'expo-router'
import { Share, Text, useWindowDimensions, View } from 'react-native'
import QRCode from 'react-native-qrcode-svg'
import { Button } from '@/components/ui/button'
import { LoadingState } from '@/components/ui/loading-state'
import { Screen } from '@/components/ui/screen'
import { appStyles, radius, spacing, useAppTheme } from '@/constants/app-styles'
import { useContacts } from '@/features/contacts/use-contacts'
import { useBoostedBrightness } from '@/features/display/use-boosted-brightness'
import { notify } from '@/features/feedback/notify'

export default function ContactQrScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const theme = useAppTheme()
  const { width } = useWindowDimensions()
  const { contacts, status } = useContacts()

  // A dark theme on a dimmed screen is a QR code another camera has to work for.
  useBoostedBrightness()

  const contact = contacts.find((candidate) => candidate.id === id)

  // Opened by a deep link, this screen can render before storage has answered. "No longer exists"
  // would be a lie for that moment — and the wrong one to tell about a saved address.
  if (status === 'loading') {
    return (
      <Screen>
        <LoadingState fill label="Loading the contact…" />
      </Screen>
    )
  }

  if (!contact) {
    return (
      <Screen>
        <Text style={[appStyles.body, { color: theme.textMuted }]}>That contact no longer exists.</Text>
      </Screen>
    )
  }

  function copyAddress() {
    if (!contact) return
    Clipboard.setString(contact.address)
    notify('Copied!')
  }

  async function shareAddress() {
    if (!contact) return
    // The platform's own sheet, never a home-grown imitation of one.
    await Share.share({ message: `${contact.name}'s Solana address:\n${contact.address}` })
  }

  // Leave room for the screen's padding; the QR is the point of this screen, so it gets the width.
  const qrSize = Math.min(width - spacing.lg * 4, 320)

  return (
    <Screen>
      <View style={{ alignItems: 'center', gap: spacing.lg, paddingTop: spacing.lg }}>
        <Text accessibilityRole="header" style={[appStyles.title, { color: theme.text }]}>
          {contact.name}
        </Text>

        {/* The QR keeps a white quiet zone regardless of theme: scanners need the contrast, and an
            inverted code is unreliable on many readers. */}
        <View style={{ backgroundColor: '#FFFFFF', borderRadius: radius.lg, padding: spacing.lg }}>
          <QRCode backgroundColor="#FFFFFF" color="#000000" size={qrSize} value={contact.address} />
        </View>

        <Text selectable style={[appStyles.mono, { color: theme.textMuted, textAlign: 'center' }]}>
          {contact.address}
        </Text>

        <View style={{ alignSelf: 'stretch', gap: spacing.md }}>
          <Button label="Copy address" onPress={copyAddress} />
          <Button label="Share" variant="secondary" onPress={() => void shareAddress()} />
        </View>
      </View>
    </Screen>
  )
}
