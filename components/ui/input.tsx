import { TextInput, TextInputProps, Text, View } from 'react-native'
import { appStyles, radius, spacing, useAppTheme } from '@/constants/app-styles'

export type HintTone = 'muted' | 'danger' | 'success' | 'warning'

export interface InputProps extends Omit<TextInputProps, 'style'> {
  label?: string
  /** Helper or validation text shown under the field. */
  hint?: string
  hintTone?: HintTone
  /** Render the value in monospace. Always true for addresses. */
  mono?: boolean
}

export function Input({
  label,
  hint,
  hintTone = 'muted',
  mono = false,
  accessibilityLabel,
  ...inputProps
}: InputProps) {
  const theme = useAppTheme()
  const hintColor = {
    muted: theme.textMuted,
    danger: theme.danger,
    success: theme.accent,
    warning: theme.warning,
  }[hintTone]

  return (
    <View style={{ gap: spacing.xs }}>
      {label ? <Text style={[appStyles.label, { color: theme.textMuted }]}>{label}</Text> : null}
      <TextInput
        {...inputProps}
        // Spread first: passing `accessibilityLabel` through `...inputProps` after this line would
        // overwrite the label-derived fallback with `undefined` whenever a caller omits it.
        accessibilityLabel={accessibilityLabel ?? label}
        placeholderTextColor={theme.textMuted}
        style={[
          mono ? appStyles.mono : appStyles.body,
          {
            backgroundColor: theme.surface,
            borderColor: theme.border,
            borderRadius: radius.md,
            borderWidth: 1,
            color: theme.text,
            minHeight: 44,
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.md,
          },
        ]}
      />
      {/* The hint is the field's verdict on what was just typed, so it has to be announced rather
          than waited for until the next focus change. */}
      {hint ? (
        <Text accessibilityLiveRegion="polite" style={[appStyles.caption, { color: hintColor }]}>
          {hint}
        </Text>
      ) : null}
    </View>
  )
}
