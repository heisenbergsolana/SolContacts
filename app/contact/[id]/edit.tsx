import { router, useLocalSearchParams } from 'expo-router'
import { Text } from 'react-native'
import { ContactForm } from '@/components/contacts/contact-form'
import { LoadingState } from '@/components/ui/loading-state'
import { Screen } from '@/components/ui/screen'
import { appStyles, useAppTheme } from '@/constants/app-styles'
import { useContacts } from '@/features/contacts/use-contacts'
import { notify } from '@/features/feedback/notify'

export default function EditContactScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const theme = useAppTheme()
  const { contacts, groups, status, editContact } = useContacts()
  const contact = contacts.find((candidate) => candidate.id === id)

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

  return (
    <Screen>
      <ContactForm
        excludeId={contact.id}
        existing={contacts}
        groups={groups}
        initial={contact}
        submitLabel="Save Changes"
        onSubmit={async (input) => {
          const result = await editContact(contact.id, input)
          if (!result.ok) return result.error
          notify('Saved', 'success')
          router.back()
          return undefined
        }}
      />
    </Screen>
  )
}
