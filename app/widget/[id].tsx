import { router, useLocalSearchParams } from 'expo-router'
import { useMemo } from 'react'
import { ScrollView, Text, View } from 'react-native'
import { LoadingState } from '@/components/ui/loading-state'
import { Screen } from '@/components/ui/screen'
import { WidgetContactPicker } from '@/components/widget/widget-contact-picker'
import { appStyles, spacing, useAppTheme } from '@/constants/app-styles'
import { orderContacts } from '@/features/contacts/contacts-service'
import { useContacts } from '@/features/contacts/use-contacts'
import { notify } from '@/features/feedback/notify'
import { bindWidgetContact } from '@/modules/contact-widget'
import { Contact } from '@/types/contact'

/**
 * Where a widget with nothing in it sends the user.
 *
 * The launcher's own picker drops a widget without asking which contact it is for — Android hands
 * the app the widget's id only once it has been placed. The empty widget deep-links here carrying
 * that id, and the choice made here is what fills it in.
 */
export default function WidgetContactScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const theme = useAppTheme()
  const { contacts, status } = useContacts()

  // A route parameter is a string from anywhere, including a hand-typed link. Anything that is not
  // a whole number is not a widget id, whatever it says.
  const appWidgetId = Number(id)
  const usable = Number.isInteger(appWidgetId) && appWidgetId > 0

  const ordered = useMemo(() => orderContacts(contacts), [contacts])

  function leave() {
    // Opened from the home screen, the app has no history to go back into.
    if (router.canGoBack()) router.back()
    else router.replace('/')
  }

  async function choose(contact: Contact) {
    const bound = await bindWidgetContact(appWidgetId, contact.id)
    if (!bound) {
      notify('That widget is no longer on the home screen', 'warning')
      return
    }
    notify(`${contact.name} is on your home screen`, 'success')
    leave()
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ gap: spacing.lg, paddingBottom: spacing.xxl, paddingTop: spacing.lg }}>
        <View style={{ gap: spacing.xs }}>
          <Text accessibilityRole="header" style={[appStyles.title, { color: theme.text }]}>
            Which address?
          </Text>
          <Text style={[appStyles.body, { color: theme.textMuted }]}>
            The one you pick shows its QR code and address on the widget you just added.
          </Text>
        </View>

        {!usable ? (
          <Text style={[appStyles.body, { color: theme.textMuted }]}>
            This link is not for a widget on your home screen. Add one from the launcher, then tap it.
          </Text>
        ) : status === 'loading' ? (
          <LoadingState label="Loading your contacts…" />
        ) : (
          <WidgetContactPicker contacts={ordered} onAddContact={() => router.push('/add')} onSelect={choose} />
        )}
      </ScrollView>
    </Screen>
  )
}
