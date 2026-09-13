import Clipboard from '@react-native-clipboard/clipboard'
import { useState } from 'react'
import { ScrollView, Switch, Text, View } from 'react-native'
import { GroupChip } from '@/components/groups/group-chip'
import { Button } from '@/components/ui/button'
import { HintTone, Input } from '@/components/ui/input'
import { appStyles, radius, spacing, useAppTheme } from '@/constants/app-styles'
import { ContactInput } from '@/features/contacts/contacts-service'
import { Contact, ContactGroup, CONTACT_LIMITS, ContactId } from '@/types/contact'
import { AppError } from '@/types/result'
import { isValidSolanaAddress } from '@/utils/solana-address'

export interface ContactFormProps {
  initial?: Partial<ContactInput>
  submitLabel: string
  onSubmit(input: ContactInput): Promise<AppError | undefined>
  /** Existing contacts, used only to warn about a duplicate address. */
  existing: readonly Contact[]
  /** The contact being edited, so it does not flag itself as its own duplicate. */
  excludeId?: ContactId
  /** Shows a Scan button beside the address field. Omitted when editing. */
  onScan?: () => void
  /** Every group the book has, so a contact can be filed without leaving this screen. */
  groups: readonly ContactGroup[]
}

interface AddressState {
  hint?: string
  tone: HintTone
  valid: boolean
}

/**
 * Describe the address field's state.
 *
 * "Valid" means well-formed base58, nothing more — never phrase it as if the address were verified
 * as belonging to anyone. A duplicate is a warning, not an error: one wallet can legitimately
 * deserve two labels.
 */
function describeAddress(raw: string, existing: readonly Contact[], excludeId?: ContactId): AddressState {
  const address = raw.trim()
  if (address.length === 0) return { tone: 'muted', valid: false }
  if (!isValidSolanaAddress(address)) return { hint: '✕ Invalid Solana address', tone: 'danger', valid: false }

  const duplicate = existing.find((contact) => contact.address === address && contact.id !== excludeId)
  if (duplicate) {
    return { hint: `✓ Valid — already saved as “${duplicate.name}”`, tone: 'warning', valid: true }
  }
  return { hint: '✓ Valid Solana address', tone: 'success', valid: true }
}

export function ContactForm({ initial, submitLabel, onSubmit, existing, excludeId, onScan, groups }: ContactFormProps) {
  const theme = useAppTheme()
  const [name, setName] = useState(initial?.name ?? '')
  const [address, setAddress] = useState(initial?.address ?? '')
  const [note, setNote] = useState(initial?.note ?? '')
  const [groupId, setGroupId] = useState(initial?.groupId ?? '')
  const [pinned, setPinned] = useState(initial?.pinned ?? false)
  const [pasteFailed, setPasteFailed] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<AppError | undefined>()

  const addressState = describeAddress(address, existing, excludeId)
  const canSubmit = name.trim().length > 0 && addressState.valid && !submitting

  async function handleSubmit() {
    setSubmitting(true)
    setError(undefined)
    const failure = await onSubmit({ name, address, note, groupId, pinned })
    setSubmitting(false)
    // On success the screen navigates away, so there is nothing to reset here.
    if (failure) setError(failure)
  }

  /**
   * Read the clipboard on an explicit tap, never on mount.
   *
   * Android announces every clipboard read to the user, and an app that silently rifles through it
   * on every screen open earns that announcement. One button, one read, one deliberate action.
   */
  async function pasteAddress() {
    const pasted = (await Clipboard.getString()).trim()
    const usable = isValidSolanaAddress(pasted)
    setPasteFailed(!usable)
    if (usable) setAddress(pasted)
  }

  return (
    <ScrollView
      contentContainerStyle={{ gap: spacing.lg, paddingBottom: spacing.xxl }}
      keyboardShouldPersistTaps="handled"
    >
      <Input
        autoCapitalize="words"
        label="Name"
        maxLength={CONTACT_LIMITS.nameMax}
        onChangeText={setName}
        placeholder="Address name"
        value={name}
      />

      <View style={{ gap: spacing.sm }}>
        <Input
          autoCapitalize="none"
          autoCorrect={false}
          hint={addressState.hint}
          hintTone={addressState.tone}
          label="Wallet Address"
          mono
          onChangeText={setAddress}
          placeholder="Solana address"
          value={address}
        />
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          {onScan ? (
            <View style={{ flexGrow: 1 }}>
              <Button label="Scan QR code" variant="secondary" onPress={onScan} />
            </View>
          ) : null}
          <View style={{ flexGrow: 1 }}>
            <Button label="Paste" variant="secondary" onPress={() => void pasteAddress()} />
          </View>
        </View>
        {pasteFailed ? (
          <Text accessibilityLiveRegion="polite" style={[appStyles.caption, { color: theme.danger }]}>
            The clipboard does not hold a Solana address.
          </Text>
        ) : null}
      </View>

      {groups.length > 0 ? (
        <View style={{ gap: spacing.sm }}>
          <Text style={[appStyles.label, { color: theme.textMuted }]}>Group</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
            {/* "None" is a choice, not the absence of one — it has to be pressable to undo a group. */}
            <GroupChip label="None" selected={groupId === ''} onPress={() => setGroupId('')} />
            {groups.map((group) => (
              <GroupChip
                key={group.id}
                label={group.name}
                selected={group.id === groupId}
                tone={group.tone}
                onPress={() => setGroupId(group.id)}
              />
            ))}
          </View>
        </View>
      ) : null}

      <View
        style={{
          alignItems: 'center',
          backgroundColor: theme.surface,
          borderColor: theme.border,
          borderRadius: radius.lg,
          borderWidth: 1,
          flexDirection: 'row',
          gap: spacing.md,
          minHeight: 56,
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.sm,
        }}
      >
        <View style={{ flexShrink: 1, gap: 2 }}>
          <Text style={[appStyles.body, { color: theme.text, fontWeight: '600' }]}>Pin to top</Text>
          <Text style={[appStyles.caption, { color: theme.textMuted }]}>Keeps this contact above the list</Text>
        </View>
        <Switch
          accessibilityLabel="Pin to top"
          // Not `textOnFill`: that ink is black now, and a black thumb on a lit track reads as off.
          thumbColor={theme.text}
          trackColor={{ false: theme.surfaceAlt, true: theme.primary }}
          value={pinned}
          onValueChange={setPinned}
          style={{ marginLeft: 'auto' }}
        />
      </View>

      <Input
        label="Note (optional)"
        maxLength={CONTACT_LIMITS.noteMax}
        multiline
        onChangeText={setNote}
        placeholder="Anything worth remembering"
        value={note}
      />

      {error ? <Text style={[appStyles.body, { color: theme.danger }]}>{error.message}</Text> : null}

      <View>
        <Button
          disabled={!canSubmit}
          label={submitting ? 'Saving…' : submitLabel}
          loading={submitting}
          onPress={() => void handleSubmit()}
        />
      </View>
    </ScrollView>
  )
}
