import { router, useLocalSearchParams } from 'expo-router'
import { ContactForm } from '@/components/contacts/contact-form'
import { Screen } from '@/components/ui/screen'
import { useContacts } from '@/features/contacts/use-contacts'
import { notify } from '@/features/feedback/notify'

export default function AddContactScreen() {
  // `address` and `name` are filled in when the user arrives from the scanner; the address is still
  // validated by the form like any typed one — a scan is a convenience, not a vouch. `groupId`
  // arrives from a group's own screen, so adding from inside a group files it there by default.
  const { address, name, groupId } = useLocalSearchParams<{ address?: string; name?: string; groupId?: string }>()
  const { contacts, groups, addContact } = useContacts()

  return (
    <Screen>
      <ContactForm
        existing={contacts}
        groups={groups}
        initial={address === undefined && groupId === undefined ? undefined : { address, name, groupId }}
        submitLabel="Save Contact"
        onScan={() => router.push('/scan')}
        onSubmit={async (input) => {
          const result = await addContact(input)
          if (!result.ok) return result.error
          notify('Saved', 'success')
          router.back()
          return undefined
        }}
      />
    </Screen>
  )
}
