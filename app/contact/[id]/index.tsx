import Clipboard from '@react-native-clipboard/clipboard'
import { router, useLocalSearchParams } from 'expo-router'
import { useMemo } from 'react'
import { Alert, Linking, ScrollView, Share, Text, View } from 'react-native'
import { GroupTag } from '@/components/groups/group-tag'
import { BalanceLabel } from '@/components/solana/balance-label'
import { Button } from '@/components/ui/button'
import { LoadingState } from '@/components/ui/loading-state'
import { Screen } from '@/components/ui/screen'
import { appStyles, radius, spacing, useAppTheme } from '@/constants/app-styles'
import { CLUSTER_NAME } from '@/constants/app-config'
import { useBalance } from '@/features/balance/use-balance'
import { useContacts } from '@/features/contacts/use-contacts'
import { notify } from '@/features/feedback/notify'
import { isWidgetPinSupported, requestWidgetPin, WidgetSize } from '@/modules/contact-widget'
import { explorerAddressUrl } from '@/utils/solana-explorer'

/**
 * The launcher places each of these as its own widget, so the size is chosen here rather than by
 * dragging the widget's handles afterwards. Only the square has the room for a scannable code.
 */
const WIDGET_SIZES: readonly { size: WidgetSize; label: string; description: string }[] = [
  { size: 'square', label: '2 × 2', description: 'Add a 2 by 2 QR code widget' },
  { size: 'row', label: '2 × 1', description: 'Add a 2 by 1 address widget' },
  { size: 'wide', label: '4 × 1', description: 'Add a 4 by 1 address widget' },
]

export default function ContactDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const theme = useAppTheme()
  const { contacts, groups, status, removeContact, setPinned } = useContacts()
  const contact = contacts.find((candidate) => candidate.id === id)
  const balance = useBalance(contact?.address ?? '')
  // Read once: whether the launcher accepts pin requests cannot change while this screen is open,
  // and a button that silently does nothing is worse than no button.
  const canPinWidget = useMemo(() => isWidgetPinSupported(), [])

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

  const group = contact.groupId === undefined ? undefined : groups.find((each) => each.id === contact.groupId)
  const pinned = contact.pinned === true

  function copyAddress() {
    if (!contact) return
    Clipboard.setString(contact.address)
    notify('Copied!')
  }

  function togglePin() {
    if (!contact) return
    void setPinned(contact.id, !pinned).then((result) => {
      if (result.ok) notify(pinned ? 'Unpinned' : 'Pinned to the top', 'success')
    })
  }

  async function addToHomeScreen(size: WidgetSize) {
    if (!contact) return
    // A refusal here is the launcher's, not the user's — Android reports nothing about the dialog
    // the user then sees, so success is deliberately not announced.
    const accepted = await requestWidgetPin(contact.id, size)
    if (!accepted) notify('Your launcher would not add the widget', 'warning')
  }

  /**
   * The second line is not decoration. A user about to delete something wallet-shaped needs to be
   * told, in the same breath, that their funds are not involved.
   */
  function confirmDelete() {
    if (!contact) return
    Alert.alert(
      `Delete ${contact.name}?`,
      'This only removes the saved contact. It does not affect the wallet or any funds.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            void removeContact(contact.id).then((result) => {
              if (!result.ok) {
                Alert.alert('Could not delete', result.error.message)
                return
              }
              notify('Contact deleted', 'warning')
              router.back()
            })
          },
        },
      ],
    )
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ gap: spacing.lg, paddingBottom: spacing.xxl }}>
        <View style={{ alignItems: 'center', flexDirection: 'row', gap: spacing.sm }}>
          <Text accessibilityRole="header" style={[appStyles.display, { color: theme.text, flexShrink: 1 }]}>
            {contact.name}
          </Text>
          {group ? <GroupTag name={group.name} tone={group.tone} /> : null}
        </View>

        <View style={{ gap: spacing.xs }}>
          <Text style={[appStyles.label, { color: theme.textMuted }]}>Wallet Address</Text>
          {/* Always the full address, always monospace, always selectable — this is the screen where
              a user verifies what they are about to send to. */}
          <Text
            selectable
            style={[
              appStyles.mono,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
                borderRadius: radius.md,
                borderWidth: 1,
                color: theme.text,
                padding: spacing.md,
              },
            ]}
          >
            {contact.address}
          </Text>
        </View>

        <View style={{ gap: spacing.xs }}>
          <Text style={[appStyles.label, { color: theme.textMuted }]}>Balance</Text>
          <BalanceLabel
            isError={balance.isError}
            isLoading={balance.isLoading}
            lamports={balance.data}
            size="title"
            onRetry={() => void balance.refetch()}
          />
        </View>

        {contact.note ? (
          <View style={{ gap: spacing.xs }}>
            <Text style={[appStyles.label, { color: theme.textMuted }]}>Note</Text>
            <Text style={[appStyles.body, { color: theme.text }]}>{contact.note}</Text>
          </View>
        ) : null}

        <View style={{ gap: spacing.md }}>
          <Button label={pinned ? 'Unpin from the top' : 'Pin to the top'} variant="secondary" onPress={togglePin} />
          <Button label="Copy address" onPress={copyAddress} />
          <Button
            label="Share"
            variant="secondary"
            onPress={() => void Share.share({ message: `${contact.name}'s Solana address:\n${contact.address}` })}
          />
          <Button
            label="Show QR"
            variant="secondary"
            onPress={() => router.push({ pathname: '/contact/[id]/qr', params: { id: contact.id } })}
          />
          {canPinWidget ? (
            <View style={{ gap: spacing.sm }}>
              <Text style={[appStyles.label, { color: theme.textMuted }]}>Add to home screen</Text>
              <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                {WIDGET_SIZES.map(({ size, label, description }) => (
                  <View key={size} style={{ flex: 1 }}>
                    <Button
                      accessibilityLabel={description}
                      label={label}
                      variant="secondary"
                      onPress={() => void addToHomeScreen(size)}
                    />
                  </View>
                ))}
              </View>
              <Text style={[appStyles.caption, { color: theme.textMuted }]}>
                The square carries the QR code. The two rows carry the name and address, with the same copy button.
              </Text>
            </View>
          ) : null}
          <Button
            label="Edit"
            variant="secondary"
            onPress={() => router.push({ pathname: '/contact/[id]/edit', params: { id: contact.id } })}
          />
          <Button
            label="View on Solana Explorer"
            variant="secondary"
            onPress={() => void Linking.openURL(explorerAddressUrl(contact.address, CLUSTER_NAME))}
          />
          <Button label="Delete" variant="danger" onPress={confirmDelete} />
        </View>
      </ScrollView>
    </Screen>
  )
}
