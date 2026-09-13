import { Pressable, View } from 'react-native'
import QRCode from 'react-native-qrcode-svg'
import { radius, spacing } from '@/constants/app-styles'

export interface AddressQrTileProps {
  address: string
  contactName: string
  onPress?: () => void
  /** Edge of the code itself; the quiet zone is added around it. */
  size?: number
}

/**
 * The quiet zone stays white in both themes — scanners need the contrast, and an inverted code is
 * unreliable on many readers. Same rule as the full-screen QR.
 */
export function AddressQrTile({ address, contactName, onPress, size = 60 }: AddressQrTileProps) {
  const code = (
    <View style={{ backgroundColor: '#FFFFFF', borderRadius: radius.sm, padding: spacing.sm }}>
      <QRCode backgroundColor="#FFFFFF" color="#000000" size={size} value={address} />
    </View>
  )

  if (!onPress) return code

  return (
    <Pressable
      accessibilityHint="Opens the full-screen QR code"
      accessibilityLabel={`${contactName}'s address as a QR code`}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
    >
      {code}
    </Pressable>
  )
}
