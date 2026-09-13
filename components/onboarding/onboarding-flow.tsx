import { ComponentType, useState } from 'react'
import { Pressable, ScrollView, Text, View } from 'react-native'
import { Button } from '@/components/ui/button'
import { Screen } from '@/components/ui/screen'
import { appStyles, radius, spacing, useAppTheme } from '@/constants/app-styles'
import { ContactBookArt, ScanArt, TrustArt, WidgetArt } from './onboarding-art'

interface Step {
  Art: ComponentType
  headline: string
  body: string
  cta: string
}

/**
 * Four screens, in the order the doubts arrive: what is this, is it safe, how does an address get
 * in, what do I get out of it.
 *
 * The second one is the one that earns its place. "Not a wallet" is the claim the store listing
 * makes, and this is the last moment to make it before someone hands the app an address. The
 * fourth exists because the widgets are the only part of the app that works without opening it,
 * and nothing else ever tells a first-run user they are there.
 */
const STEPS: Step[] = [
  {
    Art: ContactBookArt,
    headline: 'Every address you send to, in one place.',
    body: 'Save a wallet once — a name, a note, a group — and stop digging through old chats for 44 characters. Search it, pin it, read its balance at a glance.',
    cta: 'Next',
  },
  {
    Art: TrustArt,
    headline: 'Not a wallet. Ever.',
    body: 'SolContacts holds public addresses and nothing else. There is no signing path in the app at all — so there is nothing to approve, and nothing to lose.',
    cta: 'Next',
  },
  {
    Art: ScanArt,
    headline: 'Scan it, paste it, check it.',
    body: 'Point the camera at a wallet QR, or paste an address — SolContacts verifies it is a real Solana address before it lets you save it. The camera is used for nothing else.',
    cta: 'Next',
  },
  {
    Art: WidgetArt,
    headline: 'On your home screen, without opening the app.',
    body: 'Pin any contact as a widget in three sizes. Its QR is there to be scanned and its address is one tap from the clipboard — even with SolContacts closed.',
    cta: 'Get started',
  },
]

interface ProgressProps {
  step: number
}

function Progress({ step }: ProgressProps) {
  const theme = useAppTheme()

  return (
    <View
      accessibilityLabel={`Step ${step + 1} of ${STEPS.length}`}
      style={{ flexDirection: 'row', gap: spacing.xs, justifyContent: 'center' }}
    >
      {STEPS.map((_, index) => (
        <View
          key={index}
          style={{
            backgroundColor: index === step ? theme.primary : theme.border,
            borderRadius: radius.full,
            height: 6,
            width: index === step ? 20 : 6,
          }}
        />
      ))}
    </View>
  )
}

interface TopActionProps {
  label: string
  onPress: () => void
}

/** A quiet text control. Both of the ones up here are ways *out* of the step, not through it. */
function TopAction({ label, onPress }: TopActionProps) {
  const theme = useAppTheme()

  return (
    <Pressable
      accessibilityRole="button"
      hitSlop={spacing.md}
      onPress={onPress}
      style={({ pressed }) => ({ justifyContent: 'center', minHeight: 44, opacity: pressed ? 0.6 : 1 })}
    >
      <Text style={[appStyles.body, { color: theme.textMuted }]}>{label}</Text>
    </Pressable>
  )
}

export interface OnboardingFlowProps {
  /** Called when the last step is finished, or skipped from any step. */
  onDone: () => void
}

/**
 * The introduction, shown once.
 *
 * It ends on "Get started" rather than sending anyone straight to the scanner: the rest of the
 * app is not mounted behind this, so a jump into a screen with nothing to go back to is the one
 * thing a first run should not do.
 */
export function OnboardingFlow({ onDone }: OnboardingFlowProps) {
  const [step, setStep] = useState(0)
  const { Art, headline, body, cta } = STEPS[step]
  const last = step === STEPS.length - 1

  return (
    <Screen>
      <View style={{ flex: 1, gap: spacing.lg, paddingVertical: spacing.md }}>
        {/* Both controls keep their slot whether or not they are drawn, so the art below does not
            shift up and down as the steps change. */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', minHeight: 44 }}>
          {step === 0 ? <View /> : <TopAction label="‹ Back" onPress={() => setStep(step - 1)} />}
          {last ? <View /> : <TopAction label="Skip" onPress={onDone} />}
        </View>

        <ScrollView
          contentContainerStyle={{ flexGrow: 1, gap: spacing.xl, justifyContent: 'center' }}
          showsVerticalScrollIndicator={false}
        >
          <Art />
          <Headline body={body} headline={headline} />
        </ScrollView>

        <Progress step={step} />
        <Button label={cta} onPress={() => (last ? onDone() : setStep(step + 1))} />
      </View>
    </Screen>
  )
}

interface HeadlineProps {
  headline: string
  body: string
}

function Headline({ headline, body }: HeadlineProps) {
  const theme = useAppTheme()

  return (
    <View style={{ gap: spacing.sm }}>
      <Text accessibilityRole="header" style={[appStyles.display, { color: theme.text }]}>
        {headline}
      </Text>
      <Text style={[appStyles.body, { color: theme.textMuted, lineHeight: 24 }]}>{body}</Text>
    </View>
  )
}
