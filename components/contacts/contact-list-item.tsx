import { LinearGradient } from 'expo-linear-gradient'
import { Pressable, Text, View } from 'react-native'
import { AddressQrTile } from '@/components/contacts/address-qr-tile'
import { CopyAddressButton } from '@/components/contacts/copy-address-button'
import { GroupTag } from '@/components/groups/group-tag'
import { BalanceLabel, BalanceLabelProps } from '@/components/solana/balance-label'
import { StarIcon } from '@/components/ui/icons/star-icon'
import { appStyles, gradientFlow, radius, spacing, useAppTheme } from '@/constants/app-styles'
import { Contact, ContactGroup } from '@/types/contact'
import { ellipsify } from '@/utils/ellipsify'

export interface ContactListItemProps {
  contact: Contact
  /** The contact's group, already looked up by the screen — the row never reaches for one. */
  group?: ContactGroup
  /** The balance slot's state, resolved by the screen — one lookup covers the whole list. */
  balance: BalanceLabelProps
  onPress: () => void
  onShowQr: () => void
  /** Long-press shortcut for the pin. The contact screen has the same control, spelled out. */
  onTogglePin: () => void
}

/**
 * Presentational only — it receives a contact and a callback, never reaches for storage.
 *
 * The address is shortened from both ends, because a look-alike address usually differs at the
 * tail. The accessibility label reads the address in full: a screen reader user gets no benefit
 * from an abbreviation they cannot expand.
 *
 * The right-hand column holds the two things a row is actually wanted for — show the code, take the
 * address — so neither costs a trip through the detail screen.
 */
export function ContactListItem({ contact, group, balance, onPress, onShowQr, onTogglePin }: ContactListItemProps) {
  const theme = useAppTheme()
  const pinned = contact.pinned === true

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${contact.name}, ${contact.address}`}
      accessibilityHint="Opens the contact. Hold to pin it to the top."
      accessibilityState={{ selected: pinned }}
      onLongPress={onTogglePin}
      onPress={onPress}
      style={{ borderRadius: radius.xl, overflow: 'hidden' }}
    >
      {({ pressed }) => (
        <LinearGradient
          colors={pressed ? theme.gradients.cardPressed : theme.gradients.card}
          end={gradientFlow.surface.end}
          start={gradientFlow.surface.start}
          style={{
            borderColor: pinned ? theme.borderStrong : theme.border,
            borderRadius: radius.xl,
            borderWidth: 1,
            flexDirection: 'row',
            gap: spacing.md,
            minHeight: 44,
            padding: spacing.md,
          }}
        >
          {/* `flexShrink` on the text column, fixed width on the right one: a long name gives way to
              the controls rather than pushing them off the card. */}
          <View style={{ flexShrink: 1, gap: spacing.xs, justifyContent: 'center' }}>
            <View style={{ alignItems: 'center', flexDirection: 'row', gap: spacing.sm }}>
              <Text numberOfLines={1} style={[appStyles.title, { color: theme.text, flexShrink: 1 }]}>
                {contact.name}
              </Text>
              {pinned ? <StarIcon color={theme.warning} /> : null}
              {group ? <GroupTag name={group.name} tone={group.tone} /> : null}
            </View>
            <Text style={[appStyles.mono, { color: theme.textMuted }]}>{ellipsify(contact.address)}</Text>
            <BalanceLabel {...balance} />
          </View>

          {/*
            Side by side rather than stacked. Stacked, the two controls set the row's height — 128 dp
            of column for a 60 dp code — and the code came out smaller than the space it was costing.
            In a row they cost the height of the code alone, which buys the code 12 dp it can use: 44
            characters of address is a 29-module symbol, and every module is worth having.
          */}
          <View style={{ alignItems: 'center', flexDirection: 'row', gap: spacing.sm, marginLeft: 'auto' }}>
            <AddressQrTile address={contact.address} contactName={contact.name} onPress={onShowQr} size={72} />
            <CopyAddressButton address={contact.address} contactName={contact.name} />
          </View>
        </LinearGradient>
      )}
    </Pressable>
  )
}
