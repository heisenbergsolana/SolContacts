import Clipboard from '@react-native-clipboard/clipboard'
import { IconButton } from '@/components/ui/icon-button'
import { CopyIcon } from '@/components/ui/icons/copy-icon'
import { useAppTheme } from '@/constants/app-styles'
import { notify } from '@/features/feedback/notify'

export interface CopyAddressButtonProps {
  address: string
  /** Named in the accessibility label so a list of these stays distinguishable. */
  contactName: string
  size?: number
}

/** Copies a full address — never the shortened form the row displays. */
export function CopyAddressButton({ address, contactName, size }: CopyAddressButtonProps) {
  const theme = useAppTheme()

  return (
    <IconButton
      accessibilityHint="Copies the full wallet address to the clipboard"
      accessibilityLabel={`Copy ${contactName}'s address`}
      size={size}
      onPress={() => {
        Clipboard.setString(address)
        notify('Copied!')
      }}
    >
      <CopyIcon color={theme.text} />
    </IconButton>
  )
}
