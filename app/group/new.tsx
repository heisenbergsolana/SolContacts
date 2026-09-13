import { router } from 'expo-router'
import { GroupForm } from '@/components/groups/group-form'
import { Screen } from '@/components/ui/screen'
import { nextTone } from '@/features/contacts/groups-service'
import { useContacts } from '@/features/contacts/use-contacts'
import { notify } from '@/features/feedback/notify'

export default function NewGroupScreen() {
  const { groups, addGroup } = useContacts()

  return (
    <Screen>
      <GroupForm
        submitLabel="Create group"
        suggestedTone={nextTone(groups)}
        taken={groups.map((group) => group.name)}
        onSubmit={async (values) => {
          const result = await addGroup(values)
          if (!result.ok) return result.error
          notify('Group created', 'success')
          router.back()
          return undefined
        }}
      />
    </Screen>
  )
}
