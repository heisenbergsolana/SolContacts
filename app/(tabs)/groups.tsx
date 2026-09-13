import { router } from 'expo-router'
import { useMemo } from 'react'
import { ScrollView, Text, View } from 'react-native'
import { GroupTile } from '@/components/groups/group-tile'
import { GroupsEmptyState } from '@/components/groups/groups-empty-state'
import { Button } from '@/components/ui/button'
import { HeaderAction } from '@/components/ui/header-action'
import { LoadingState } from '@/components/ui/loading-state'
import { ListEntrance } from '@/components/ui/list-entrance'
import { Screen } from '@/components/ui/screen'
import { TAB_BAR_CLEARANCE } from '@/components/ui/tab-bar'
import { appStyles, spacing, useAppTheme } from '@/constants/app-styles'
import { useBalances } from '@/features/balance/use-balances'
import { countByGroup, totalForGroup } from '@/features/contacts/groups-service'
import { useContacts } from '@/features/contacts/use-contacts'

export default function GroupsScreen() {
  const theme = useAppTheme()
  const { contacts, groups, status, error, reload } = useContacts()

  const addresses = useMemo(() => contacts.map((contact) => contact.address), [contacts])
  const balances = useBalances(addresses)

  const counts = useMemo(() => countByGroup(contacts), [contacts])
  const totals = useMemo(() => {
    const known = balances.data ?? new Map<string, bigint>()
    return new Map(groups.map((group) => [group.id, totalForGroup(contacts, group.id, known)]))
  }, [balances.data, contacts, groups])

  if (status === 'loading') {
    return (
      <Screen>
        <LoadingState fill label="Loading your groups…" />
      </Screen>
    )
  }

  if (status === 'error') {
    return (
      <Screen>
        <View style={{ gap: spacing.md, paddingVertical: spacing.xxl }}>
          <Text accessibilityRole="header" style={[appStyles.title, { color: theme.text }]}>
            Couldn’t load your groups
          </Text>
          <Text style={[appStyles.body, { color: theme.textMuted }]}>{error?.message}</Text>
          <Button label="Try again" onPress={() => void reload()} />
        </View>
      </Screen>
    )
  }

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={{ gap: spacing.lg, paddingBottom: TAB_BAR_CLEARANCE, paddingTop: spacing.lg }}
        style={{ flex: 1 }}
      >
        <View style={{ gap: spacing.xs }}>
          <View style={{ alignItems: 'center', flexDirection: 'row', gap: spacing.md }}>
            <Text accessibilityRole="header" style={[appStyles.display, { color: theme.text, flex: 1 }]}>
              Groups
            </Text>
            {/* Hidden while there are none: the empty state already carries the same action. */}
            {groups.length > 0 ? <HeaderAction label="New group" onPress={() => router.push('/group/new')} /> : null}
          </View>
          <Text style={[appStyles.caption, { color: theme.textMuted }]}>
            Friends, exchanges, your own wallets — sorted. Filter the list by any of them from the Contacts tab.
          </Text>
        </View>

        {groups.length === 0 ? (
          <GroupsEmptyState onCreateGroup={() => router.push('/group/new')} />
        ) : (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md }}>
            {groups.map((group, index) => (
              <ListEntrance index={index} key={group.id} style={{ flexBasis: '46%', flexGrow: 1 }}>
                <GroupTile
                  count={counts.get(group.id) ?? 0}
                  name={group.name}
                  tone={group.tone}
                  totalLamports={totals.get(group.id)}
                  onPress={() => router.push({ pathname: '/group/[id]', params: { id: group.id } })}
                />
              </ListEntrance>
            ))}
          </View>
        )}
      </ScrollView>
    </Screen>
  )
}
