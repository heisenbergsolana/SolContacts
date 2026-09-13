import { CameraView, useCameraPermissions } from 'expo-camera'
import { router } from 'expo-router'
import { useRef, useState } from 'react'
import { Linking, Text, View } from 'react-native'
import { Button } from '@/components/ui/button'
import { Screen } from '@/components/ui/screen'
import { appStyles, radius, spacing, useAppTheme } from '@/constants/app-styles'
import { parseQrPayload } from '@/utils/qr-payload'
import { isValidSolanaAddress } from '@/utils/solana-address'

export default function ScanScreen() {
  const theme = useAppTheme()
  const [permission, requestPermission] = useCameraPermissions()
  const [rejected, setRejected] = useState<string | undefined>()

  /**
   * The camera fires `onBarcodeScanned` continuously while a code is in frame. Without this latch
   * a single scan navigates dozens of times before the screen unmounts. A ref rather than state
   * because the guard has to hold within the same tick.
   */
  const handled = useRef(false)

  function handleScan(data: string) {
    if (handled.current) return

    const candidate = parseQrPayload(data)
    if (!candidate || !isValidSolanaAddress(candidate)) {
      // Stay on the scanner: the user is holding the phone up to something, and dumping them back
      // to a form to read an error would waste that.
      setRejected(candidate ? 'That is not a valid Solana address.' : 'That is not a Solana wallet QR code.')
      return
    }

    handled.current = true
    // `replace`, not `push`: coming back from the form should reach Home, not the camera again.
    router.replace({ pathname: '/add', params: { address: candidate } })
  }

  // Permission has not been asked for yet — explain before prompting rather than firing a system
  // dialog at someone who has no idea why.
  if (!permission) {
    return <Screen />
  }

  if (!permission.granted) {
    const askedBefore = !permission.canAskAgain

    return (
      <Screen>
        <View style={{ gap: spacing.md, paddingTop: spacing.xl }}>
          <Text accessibilityRole="header" style={[appStyles.title, { color: theme.text }]}>
            Scan a wallet QR code
          </Text>
          <Text style={[appStyles.body, { color: theme.textMuted }]}>
            SolContacts uses the camera only to read wallet QR codes. Nothing is recorded, stored or uploaded.
          </Text>

          {askedBefore ? (
            <>
              <Text style={[appStyles.body, { color: theme.textMuted }]}>
                Camera access is currently blocked for this app in Android settings.
              </Text>
              <Button label="Open Settings" onPress={() => void Linking.openSettings()} />
            </>
          ) : (
            <Button label="Allow camera" onPress={() => void requestPermission()} />
          )}

          {/* Denial is never a dead end — typing the address is always available. */}
          <Button label="Enter address manually" variant="secondary" onPress={() => router.replace('/add')} />
        </View>
      </Screen>
    )
  }

  return (
    <Screen>
      <View style={{ gap: spacing.lg, paddingTop: spacing.lg }}>
        <View
          style={{
            aspectRatio: 1,
            backgroundColor: theme.surface,
            borderRadius: radius.lg,
            overflow: 'hidden',
          }}
        >
          <CameraView
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            facing="back"
            onBarcodeScanned={({ data }) => handleScan(data)}
            style={{ flex: 1 }}
          />
        </View>

        {/* A rejected scan changes only this line, and someone holding the phone up to a code is
            not looking at it — `polite` makes TalkBack read the refusal out. */}
        <Text
          accessibilityLiveRegion="polite"
          style={[appStyles.body, { color: rejected ? theme.danger : theme.textMuted, textAlign: 'center' }]}
        >
          {rejected ?? 'Point the camera at a Solana wallet QR code.'}
        </Text>

        <Button label="Enter address manually" variant="secondary" onPress={() => router.replace('/add')} />
      </View>
    </Screen>
  )
}
