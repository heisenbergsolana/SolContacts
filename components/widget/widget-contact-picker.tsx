import { LinearGradient } from 'expo-linear-gradient'
import { Pressable, Text, View } from 'react-native'
import { ContactsEmptyState } from '@/components/contacts/contacts-empty-state'
import { appStyles, gradientFlow, radius, spacing, useAppTheme } from '@/constants/app-styles'
import { Contact } from '@/types/contact'
import { ellipsify } from '@/utils/ellipsify'

export interface WidgetContactPickerProps {
  contacts: readonly Contact[]
  onSelect: (contact: Contact) => void
  onAddContact: () => void
}

/**
 * The list a widget sends you to: every saved contact, one tap from being the one it shows.
 *
 * Presentational — it is handed the book and two callbacks, never the widget id. The whole row is
 * the button rather than the pill inside it: a row-sized target is easier to hit than a 44 dp one,
 * and the pill still says what the tap will do.
 */
export function WidgetContactPicker({ contacts, onSelect, onAddContact }: WidgetContactPickerProps) {
  const theme = useAppTheme()

  if (contacts.length === 0) return <ContactsEmptyState onAddContact={onAddContact} />

  return (
    <View style={{ gap: spacing.sm }}>
      {contacts.map((contact) => (
        <Pressable
          accessibilityHint="Shows this address on the widget"
          accessibilityLabel={`Add ${contact.name} to the widget, ${contact.address}`}
          accessibilityRole="button"
          key={contact.id}
          style={{ borderRadius: radius.xl, overflow: 'hidden' }}
          onPress={() => onSelect(contact)}
        >
          {({ pressed }) => (
            <LinearGradient
              colors={pressed ? theme.gradients.cardPressed : theme.gradients.card}
              end={gradientFlow.surface.end}
              start={gradientFlow.surface.start}
              style={{
                alignItems: 'center',
                borderColor: theme.border,
                borderRadius: radius.xl,
                borderWidth: 1,
                flexDirection: 'row',
                gap: spacing.md,
                minHeight: 44,
                padding: spacing.md,
              }}
            >
              <View style={{ flexShrink: 1, gap: spacing.xs }}>
                <Text numberOfLines={1} style={[appStyles.title, { color: theme.text }]}>
                  {contact.name}
                </Text>
                <Text style={[appStyles.mono, { color: theme.textMuted }]}>{ellipsify(contact.address)}</Text>
              </View>

              <View
                style={{
                  backgroundColor: theme.surfaceAlt,
                  borderColor: theme.border,
                  borderRadius: radius.full,
                  borderWidth: 1,
                  marginLeft: 'auto',
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.xs,
                }}
              >
                <Text style={[appStyles.caption, { color: theme.text, fontWeight: '600' }]}>Add</Text>
              </View>
            </LinearGradient>
          )}
        </Pressable>
      ))}
    </View>
  )
}
