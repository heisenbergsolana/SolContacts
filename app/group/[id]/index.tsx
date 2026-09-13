import { router, useLocalSearchParams } from 'expo-router'
import { useMemo } from 'react'
import { Text, View } from 'react-native'
import { GroupDetail } from '@/components/groups/group-detail'
import { Button } from '@/components/ui/button'
import { LoadingState } from '@/components/ui/loading-state'
import { Screen } from '@/components/ui/screen'
import { appStyles, spacing, useAppTheme } from '@/constants/app-styles'
import { useBalances } from '@/features/balance/use-balances'
import { orderContacts } from '@/features/contacts/contacts-service'
import { totalForGroup } from '@/features/contacts/groups-service'
import { useContacts } from '@/features/contacts/use-contacts'
import { notify } from '@/features/feedback/notify'

export default function GroupDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const theme = useAppTheme()
  const { contacts, groups, status, setPinned } = useContacts()
  const group = groups.find((candidate) => candidate.id === id)

  const members = useMemo(() => orderContacts(contacts.filter((contact) => contact.groupId === id)), [contacts, id])
  const addresses = useMemo(() => members.map((contact) => contact.address), [members])
  const balances = useBalances(addresses)

  const total = useMemo(
    () => (group ? totalForGroup(contacts, group.id, balances.data ?? new Map<string, bigint>()) : undefined),
    [balances.data, contacts, group],
  )

  // Opened by a deep link, this can render before storage has answered — "gone" would be the wrong
  // word for a group that is merely still being read.
  if (status === 'loading') {
    return (
      <Screen>
        <LoadingState fill label="Loading the group…" />
      </Screen>
    )
  }

  if (!group) {
    return (
      <Screen>
        <View style={{ gap: spacing.md, paddingVertical: spacing.xxl }}>
          <Text accessibilityRole="header" style={[appStyles.title, { color: theme.text }]}>
            That group is gone
          </Text>
          <Text style={[appStyles.body, { color: theme.textMuted }]}>It may have been deleted on another screen.</Text>
          <Button label="Back to groups" onPress={() => router.back()} />
        </View>
      </Screen>
    )
  }

  return (
    <Screen>
      <GroupDetail
        balanceFor={(address) => ({
          isError: balances.isError,
          isLoading: balances.isLoading,
          lamports: balances.data?.get(address),
          onRetry: () => void balances.refetch(),
        })}
        group={group}
        members={members}
        totalLamports={total}
        onAddContact={() => router.push({ pathname: '/add', params: { groupId: group.id } })}
        onEditGroup={() => router.push({ pathname: '/group/[id]/edit', params: { id: group.id } })}
        onOpenContact={(contact) => router.push({ pathname: '/contact/[id]', params: { id: contact.id } })}
        onShowQr={(contact) => router.push({ pathname: '/contact/[id]/qr', params: { id: contact.id } })}
        onTogglePin={(contact) => {
          const next = contact.pinned !== true
          void setPinned(contact.id, next).then((result) => {
            if (result.ok) notify(next ? 'Pinned to the top' : 'Unpinned', 'success')
          })
        }}
      />
    </Screen>
  )
}
