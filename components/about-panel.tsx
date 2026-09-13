import { ScrollView, Text, View } from 'react-native'
import { PRIVACY_POLICY_URL, PUBLISHER_URL, SOURCE_CODE_URL, TERMS_OF_USE_URL } from '@/constants/app-config'
import { appStyles, spacing, useAppTheme } from '@/constants/app-styles'
import { Card } from './ui/card'
import { LinkRow } from './ui/link-row'

export interface AboutPanelProps {
  /** Shown so a bug report can name a build. The route reads it; this does not go looking for it. */
  version: string
  /** Handed a URL to open. Kept as a prop so this file never reaches for `Linking` itself. */
  onOpen: (url: string) => void
}

/**
 * What the app says about itself: the version, the two things worth repeating, and the way to both
 * policies from inside the app rather than only from the store listing.
 */
export function AboutPanel({ version, onOpen }: AboutPanelProps) {
  const theme = useAppTheme()

  return (
    <ScrollView contentContainerStyle={{ gap: spacing.lg, paddingBottom: spacing.xxl }}>
      <View style={{ gap: spacing.xs }}>
        <Text accessibilityRole="header" style={[appStyles.display, { color: theme.text }]}>
          SolContacts
        </Text>
        <Text style={[appStyles.caption, { color: theme.textMuted }]}>Version {version}</Text>
      </View>

      <Card>
        <Text style={[appStyles.title, { color: theme.text }]}>Not a wallet</Text>
        <Text style={[appStyles.body, { color: theme.textMuted }]}>
          SolContacts never asks for a private key or a seed phrase, and could not use one. It has no wallet connection
          and cannot sign anything, so it cannot move funds. It only stores public wallet addresses, on this device.
        </Text>
      </Card>

      <Card>
        <Text style={[appStyles.title, { color: theme.text }]}>Before you send</Text>
        <Text style={[appStyles.body, { color: theme.textMuted }]}>
          A saved address is checked for being a well-formed Solana address — not for belonging to the person you mean.
          Solana transfers cannot be reversed, so check an address against its owner before you send to it.
        </Text>
      </Card>

      <View>
        <LinkRow external label="Privacy Policy" onPress={() => onOpen(PRIVACY_POLICY_URL)} />
        <LinkRow external label="Terms of Use" onPress={() => onOpen(TERMS_OF_USE_URL)} />
        <LinkRow
          external
          description="Read the code, or report a problem"
          label="Source code"
          onPress={() => onOpen(SOURCE_CODE_URL)}
        />
        <LinkRow external label="HashWorks" onPress={() => onOpen(PUBLISHER_URL)} />
      </View>

      <Text style={[appStyles.caption, { color: theme.textMuted }]}>
        Published by HashWorks. Open source under the MIT licence.
      </Text>
    </ScrollView>
  )
}
