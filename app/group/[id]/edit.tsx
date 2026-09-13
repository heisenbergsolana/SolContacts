import { router, useLocalSearchParams } from 'expo-router'
import { Alert, Text, View } from 'react-native'
import { GroupForm } from '@/components/groups/group-form'
import { Button } from '@/components/ui/button'
import { LoadingState } from '@/components/ui/loading-state'
import { Screen } from '@/components/ui/screen'
import { appStyles, spacing, useAppTheme } from '@/constants/app-styles'
import { countByGroup } from '@/features/contacts/groups-service'
import { useContacts } from '@/features/contacts/use-contacts'
import { notify } from '@/features/feedback/notify'

export default function EditGroupScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const theme = useAppTheme()
  const { contacts, groups, status, editGroup, removeGroup } = useContacts()
  const group = groups.find((candidate) => candidate.id === id)

  // Opened by a deep link, this screen can render before storage has answered — "gone" would be
  // the wrong word for a group that is merely still being read.
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

  const members = countByGroup(contacts).get(group.id) ?? 0

  function confirmDelete() {
    if (!group) return

    Alert.alert(
      `Delete ${group.name}?`,
      members === 0
        ? 'This only removes the group.'
        : `The ${members} ${members === 1 ? 'contact' : 'contacts'} in it stay saved — they simply stop belonging to a group.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            void removeGroup(group.id).then((result) => {
              if (!result.ok) {
                notify(result.error.message, 'warning')
                return
              }
              notify('Group deleted', 'success')
              // Not `back()`: that is the group's own screen, which would greet the user with
              // "That group is gone" about the thing they just chose to delete.
              router.dismissAll()
            })
          },
        },
      ],
    )
  }

  return (
    <Screen>
      <GroupForm
        initial={{ name: group.name, tone: group.tone }}
        submitLabel="Save group"
        suggestedTone={group.tone}
        taken={groups.filter((other) => other.id !== group.id).map((other) => other.name)}
        onDelete={confirmDelete}
        onSubmit={async (values) => {
          const result = await editGroup(group.id, values)
          if (!result.ok) return result.error
          notify('Saved', 'success')
          router.back()
          return undefined
        }}
      />
    </Screen>
  )
}
