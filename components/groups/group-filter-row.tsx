import { ScrollView } from 'react-native'
import { GroupChip } from '@/components/groups/group-chip'
import { spacing } from '@/constants/app-styles'
import { GroupTone } from '@/types/contact'

export interface GroupFilterOption {
  /** `'all'`, `'ungrouped'`, or a group id. The screen owns what each one means. */
  key: string
  label: string
  tone?: GroupTone
  count: number
}

export interface GroupFilterRowProps {
  options: readonly GroupFilterOption[]
  selectedKey: string
  onSelect(key: string): void
}

/**
 * The filter row above the contact list.
 *
 * Horizontal rather than wrapped: a book with eight groups would otherwise push the first contact
 * two rows further down every time the screen opened, and the row is the one part of this screen
 * that is not what the user came for.
 */
export function GroupFilterRow({ options, selectedKey, onSelect }: GroupFilterRowProps) {
  return (
    <ScrollView
      contentContainerStyle={{ gap: spacing.sm, paddingRight: spacing.lg }}
      horizontal
      keyboardShouldPersistTaps="handled"
      showsHorizontalScrollIndicator={false}
    >
      {options.map((option) => (
        <GroupChip
          count={option.count}
          key={option.key}
          label={option.label}
          selected={option.key === selectedKey}
          tone={option.tone}
          onPress={() => onSelect(option.key)}
        />
      ))}
    </ScrollView>
  )
}
