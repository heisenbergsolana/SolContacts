import { useState } from 'react'
import { Pressable, ScrollView, Text, View } from 'react-native'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { appStyles, radius, spacing, useAppTheme } from '@/constants/app-styles'
import { CONTACT_LIMITS, GROUP_TONES, GroupTone } from '@/types/contact'
import { AppError } from '@/types/result'

export interface GroupFormValues {
  name: string
  tone: GroupTone
}

export interface GroupFormProps {
  initial?: GroupFormValues
  submitLabel: string
  onSubmit(values: GroupFormValues): Promise<AppError | undefined>
  /** Offered when nothing is chosen yet — the palette's next free colour. */
  suggestedTone: GroupTone
  /** Names other groups already hold, so the form can say so before the service refuses. */
  taken: readonly string[]
  /** Only when editing. Confirmation is the screen's job, not the form's. */
  onDelete?: () => void
}

/**
 * Name a group and give it a colour.
 *
 * The colour is not decoration: it is how a contact's group is recognised at chip size, so it gets
 * equal billing with the name rather than hiding behind an "advanced" disclosure.
 */
export function GroupForm({ initial, submitLabel, onSubmit, suggestedTone, taken, onDelete }: GroupFormProps) {
  const theme = useAppTheme()
  const [name, setName] = useState(initial?.name ?? '')
  const [tone, setTone] = useState<GroupTone>(initial?.tone ?? suggestedTone)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<AppError | undefined>()

  const trimmed = name.trim()
  const duplicate = taken.some((other) => other.toLowerCase() === trimmed.toLowerCase())
  const canSubmit = trimmed.length > 0 && !duplicate && !submitting

  async function handleSubmit() {
    setSubmitting(true)
    setError(undefined)
    const failure = await onSubmit({ name, tone })
    setSubmitting(false)
    // On success the screen navigates away, so there is nothing to reset here.
    if (failure) setError(failure)
  }

  return (
    <ScrollView
      contentContainerStyle={{ gap: spacing.lg, paddingBottom: spacing.xxl }}
      keyboardShouldPersistTaps="handled"
    >
      <Input
        autoCapitalize="words"
        autoFocus={initial === undefined}
        hint={duplicate ? `There is already a group called “${trimmed}”` : undefined}
        hintTone={duplicate ? 'danger' : 'muted'}
        label="Group name"
        maxLength={CONTACT_LIMITS.groupNameMax}
        onChangeText={setName}
        placeholder="Friends"
        value={name}
      />

      <View style={{ gap: spacing.md }}>
        <Text style={[appStyles.label, { color: theme.textMuted }]}>Colour</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md }}>
          {GROUP_TONES.map((candidate) => {
            const selected = candidate === tone

            return (
              <Pressable
                accessibilityLabel={candidate}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                key={candidate}
                style={{
                  alignItems: 'center',
                  // The ring sits outside the swatch, so the choice is legible without relying on
                  // the colour itself to say which colour is chosen.
                  borderColor: selected ? theme.text : 'transparent',
                  borderRadius: radius.lg,
                  borderWidth: 2,
                  height: 44,
                  justifyContent: 'center',
                  width: 44,
                }}
                onPress={() => setTone(candidate)}
              >
                <View
                  style={{
                    backgroundColor: theme.tones[candidate],
                    borderRadius: radius.md,
                    height: 32,
                    width: 32,
                  }}
                />
              </Pressable>
            )
          })}
        </View>
      </View>

      {error ? <Text style={[appStyles.body, { color: theme.danger }]}>{error.message}</Text> : null}

      <Button disabled={!canSubmit} label={submitLabel} loading={submitting} onPress={() => void handleSubmit()} />

      {onDelete ? <Button label="Delete group" variant="danger" onPress={onDelete} /> : null}
    </ScrollView>
  )
}
