import { router } from 'expo-router'
import { useMemo, useState } from 'react'
import { FlatList, Text, View } from 'react-native'
import { ContactListItem } from '@/components/contacts/contact-list-item'
import { ContactListSkeleton } from '@/components/contacts/contact-list-skeleton'
import { ContactsEmptyState } from '@/components/contacts/contacts-empty-state'
import { GroupFilterOption, GroupFilterRow } from '@/components/groups/group-filter-row'
import { Button } from '@/components/ui/button'
import { HeaderAction } from '@/components/ui/header-action'
import { IconButton } from '@/components/ui/icon-button'
import { InfoIcon } from '@/components/ui/icons/info-icon'
import { ListEntrance } from '@/components/ui/list-entrance'
import { Input } from '@/components/ui/input'
import { Screen } from '@/components/ui/screen'
import { TAB_BAR_CLEARANCE } from '@/components/ui/tab-bar'
import { appStyles, spacing, useAppTheme } from '@/constants/app-styles'
import { useBalances } from '@/features/balance/use-balances'
import { filterByGroup, GroupFilter, orderContacts, searchContacts } from '@/features/contacts/contacts-service'
import { countByGroup } from '@/features/contacts/groups-service'
import { useContacts } from '@/features/contacts/use-contacts'
import { notify } from '@/features/feedback/notify'

const ALL = 'all'
const UNGROUPED = 'ungrouped'

function toFilter(key: string): GroupFilter {
  if (key === ALL || key === UNGROUPED) return key
  return { groupId: key }
}

export default function ContactsScreen() {
  const theme = useAppTheme()
  const { contacts, groups, status, error, reload, setPinned } = useContacts()
  const [query, setQuery] = useState('')
  const [filterKey, setFilterKey] = useState<string>(ALL)

  const groupsById = useMemo(() => new Map(groups.map((group) => [group.id, group])), [groups])

  const options = useMemo<GroupFilterOption[]>(() => {
    if (groups.length === 0) return []

    const counts = countByGroup(contacts)
    const ungrouped = contacts.filter((contact) => contact.groupId === undefined).length

    return [
      { key: ALL, label: 'All', count: contacts.length },
      ...groups.map((group) => ({
        key: group.id,
        label: group.name,
        tone: group.tone,
        count: counts.get(group.id) ?? 0,
      })),
      // Offered only when there is something in it — an always-present empty bucket is clutter.
      ...(ungrouped > 0 ? [{ key: UNGROUPED, label: 'Ungrouped', count: ungrouped }] : []),
    ]
  }, [contacts, groups])

  // A group deleted from the other tab must not leave this screen filtering by nothing.
  const selectedKey = options.some((option) => option.key === filterKey) ? filterKey : ALL

  // Filtering is synchronous: the whole book is a local array of at most a few hundred contacts, so
  // debouncing would add latency and a moving target without saving any measurable work.
  const visible = useMemo(
    () => orderContacts(searchContacts(filterByGroup(contacts, toFilter(selectedKey)), query)),
    [contacts, query, selectedKey],
  )

  // Every saved address, not just the matching ones: the lookup is one request either way, and
  // re-running it on each keystroke would turn a search into a burst of RPC traffic.
  const addresses = useMemo(() => contacts.map((contact) => contact.address), [contacts])
  const balances = useBalances(addresses)

  if (status === 'loading') {
    return (
      <Screen>
        <View style={{ gap: spacing.md, paddingTop: spacing.lg }}>
          <Text accessibilityRole="header" style={[appStyles.display, { color: theme.text }]}>
            SolContacts
          </Text>
          <ContactListSkeleton />
        </View>
      </Screen>
    )
  }

  if (status === 'error') {
    return (
      <Screen>
        <View style={{ gap: spacing.md, paddingVertical: spacing.xxl }}>
          <Text accessibilityRole="header" style={[appStyles.title, { color: theme.text }]}>
            Couldn’t load your contacts
          </Text>
          <Text style={[appStyles.body, { color: theme.textMuted }]}>{error?.message}</Text>
          <Button label="Try again" onPress={() => void reload()} />
        </View>
      </Screen>
    )
  }

  return (
    <Screen>
      <FlatList
        contentContainerStyle={{ gap: spacing.md, paddingBottom: TAB_BAR_CLEARANCE, paddingTop: spacing.lg }}
        data={visible}
        /**
         * Tuned for a large book rather than the default's generous window: a few hundred contacts
         * are cheap to hold in state but not to keep mounted, and only a screenful is ever read.
         */
        initialNumToRender={10}
        keyExtractor={(contact) => contact.id}
        keyboardShouldPersistTaps="handled"
        maxToRenderPerBatch={10}
        windowSize={7}
        /**
         * The header scrolls with the list rather than pinning above it. The title is context, not
         * a control — a contact book whose contacts start below the fold would be a worse address
         * book for the sake of a nicer screenshot.
         */
        ListHeaderComponent={
          <View style={{ gap: spacing.md }}>
            <View style={{ alignItems: 'center', flexDirection: 'row', gap: spacing.md }}>
              <Text accessibilityRole="header" style={[appStyles.display, { color: theme.text, flex: 1 }]}>
                SolContacts
              </Text>
              {/* Stays put when the book is empty. A first-run screen is exactly where someone
                  wants to read what the app does with their addresses before typing one in. */}
              <IconButton accessibilityLabel="About SolContacts" onPress={() => router.push('/about')}>
                <InfoIcon color={theme.textMuted} size={20} />
              </IconButton>
              {/* Hidden while the book is empty: the empty state already carries the same action,
                  said better. */}
              {contacts.length > 0 ? <HeaderAction label="Add contact" onPress={() => router.push('/add')} /> : null}
            </View>

            {contacts.length > 0 ? (
              <Input
                accessibilityLabel="Search contacts"
                autoCapitalize="none"
                autoCorrect={false}
                onChangeText={setQuery}
                placeholder="Search name or address…"
                value={query}
              />
            ) : null}

            {options.length > 0 ? (
              <GroupFilterRow options={options} selectedKey={selectedKey} onSelect={setFilterKey} />
            ) : null}
          </View>
        }
        ListEmptyComponent={
          contacts.length === 0 ? (
            <ContactsEmptyState onAddContact={() => router.push('/add')} />
          ) : (
            <View style={{ alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xl }}>
              <Text style={[appStyles.body, { color: theme.textMuted }]}>
                {query.trim().length > 0 ? `Nothing matches “${query.trim()}”` : 'No contacts in this group yet'}
              </Text>
              <Button
                label={query.trim().length > 0 ? 'Clear search' : 'Show all contacts'}
                variant="secondary"
                onPress={() => {
                  setQuery('')
                  setFilterKey(ALL)
                }}
              />
            </View>
          )
        }
        renderItem={({ item, index }) => (
          <ListEntrance index={index}>
            <ContactListItem
              balance={{
                isError: balances.isError,
                isLoading: balances.isLoading,
                lamports: balances.data?.get(item.address),
                onRetry: () => void balances.refetch(),
              }}
              contact={item}
              group={item.groupId === undefined ? undefined : groupsById.get(item.groupId)}
              onPress={() => router.push({ pathname: '/contact/[id]', params: { id: item.id } })}
              onShowQr={() => router.push({ pathname: '/contact/[id]/qr', params: { id: item.id } })}
              onTogglePin={() => {
                const next = item.pinned !== true
                void setPinned(item.id, next).then((result) => {
                  if (result.ok) notify(next ? 'Pinned to the top' : 'Unpinned', 'success')
                })
              }}
            />
          </ListEntrance>
        )}
        style={{ flex: 1 }}
      />
    </Screen>
  )
}
