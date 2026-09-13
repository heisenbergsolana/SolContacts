import { FlatList, Text, View } from 'react-native'
import { ContactListItem } from '@/components/contacts/contact-list-item'
import { BalanceLabelProps } from '@/components/solana/balance-label'
import { Button } from '@/components/ui/button'
import { HeaderAction } from '@/components/ui/header-action'
import { ListEntrance } from '@/components/ui/list-entrance'
import { appStyles, radius, spacing, useAppTheme } from '@/constants/app-styles'
import { Contact, ContactGroup } from '@/types/contact'
import { formatSol } from '@/utils/lamports-to-sol'

export interface GroupDetailProps {
  group: ContactGroup
  /** The contacts filed under this group, already ordered by the screen. */
  members: readonly Contact[]
  /** Sum of the members' balances, or undefined while any one of them is still unknown. */
  totalLamports?: bigint
  /** One lookup covers the whole list, so the screen resolves it and hands each row its slot. */
  balanceFor: (address: string) => BalanceLabelProps
  onAddContact: () => void
  onEditGroup: () => void
  onOpenContact: (contact: Contact) => void
  onShowQr: (contact: Contact) => void
  onTogglePin: (contact: Contact) => void
}

/**
 * A group's contents.
 *
 * Tapping a group tile used to open the rename form directly, so a tile reading "5 contacts" led to
 * a screen showing none of them. The members are what the tile counts, so they are what it opens;
 * renaming, recolouring and deleting moved one tap further in, behind Edit group.
 */
export function GroupDetail({
  group,
  members,
  totalLamports,
  balanceFor,
  onAddContact,
  onEditGroup,
  onOpenContact,
  onShowQr,
  onTogglePin,
}: GroupDetailProps) {
  const theme = useAppTheme()

  const header = (
    <View style={{ gap: spacing.md, paddingBottom: spacing.md }}>
      <View style={{ alignItems: 'center', flexDirection: 'row', gap: spacing.md }}>
        <Text accessibilityRole="header" style={[appStyles.display, { color: theme.text, flex: 1 }]}>
          {group.name}
        </Text>
        <HeaderAction label={`Add a contact to ${group.name}`} onPress={onAddContact} />
      </View>

      <View style={{ alignItems: 'center', flexDirection: 'row', gap: spacing.sm }}>
        <View
          style={{
            backgroundColor: theme.tones[group.tone],
            borderRadius: radius.full,
            height: 10,
            width: 10,
          }}
        />
        <Text style={[appStyles.caption, { color: theme.textMuted }]}>
          {members.length === 1 ? '1 contact' : `${members.length} contacts`}
          {totalLamports === undefined ? '' : ` · ${formatSol(totalLamports)} SOL`}
        </Text>
      </View>

      <View style={{ alignSelf: 'flex-start' }}>
        <Button label="Edit group" variant="secondary" onPress={onEditGroup} />
      </View>
    </View>
  )

  if (members.length === 0) {
    return (
      <View style={{ flex: 1 }}>
        {header}
        <View style={{ gap: spacing.md }}>
          <Text accessibilityRole="header" style={[appStyles.title, { color: theme.text }]}>
            Nothing filed here yet
          </Text>
          <Text style={[appStyles.body, { color: theme.textMuted }]}>
            Add a contact to {group.name}, or file one you already have into it from its own screen.
          </Text>
          <View style={{ alignSelf: 'flex-start' }}>
            <Button label="Add contact" onPress={onAddContact} />
          </View>
        </View>
      </View>
    )
  }

  return (
    <FlatList
      contentContainerStyle={{ gap: spacing.md, paddingBottom: spacing.xxl }}
      data={members}
      keyExtractor={(contact) => contact.id}
      ListHeaderComponent={header}
      renderItem={({ item, index }) => (
        <ListEntrance index={index}>
          <ContactListItem
            balance={balanceFor(item.address)}
            contact={item}
            group={group}
            onPress={() => onOpenContact(item)}
            onShowQr={() => onShowQr(item)}
            onTogglePin={() => onTogglePin(item)}
          />
        </ListEntrance>
      )}
      style={{ flex: 1 }}
    />
  )
}
