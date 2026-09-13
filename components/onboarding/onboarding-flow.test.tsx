import { act, fireEvent } from '@testing-library/react-native'
import { describe, expect, it, vi } from 'vitest'
import { OnboardingFlow } from '@/components/onboarding/onboarding-flow'
import { renderWithProviders } from '@/test/test-utils'

/** Press a control and let the step change settle before the next assertion. */
async function press(element: Parameters<typeof fireEvent.press>[0]) {
  await act(async () => {
    fireEvent.press(element)
  })
}

describe('OnboardingFlow', () => {
  it('reaches the end only after all four steps', async () => {
    const onDone = vi.fn()
    const { getByText, queryByText } = await renderWithProviders(<OnboardingFlow onDone={onDone} />)

    expect(getByText('Every address you send to, in one place.')).toBeVisible()

    await press(getByText('Next'))
    expect(getByText('Not a wallet. Ever.')).toBeVisible()

    await press(getByText('Next'))
    expect(getByText('Scan it, paste it, check it.')).toBeVisible()

    await press(getByText('Next'))
    expect(getByText('On your home screen, without opening the app.')).toBeVisible()
    expect(onDone).not.toHaveBeenCalled()

    // The last step offers no way past it other than finishing.
    expect(queryByText('Skip')).toBeNull()

    await press(getByText('Get started'))
    expect(onDone).toHaveBeenCalledOnce()
  })

  it('lets someone leave from the first step', async () => {
    const onDone = vi.fn()
    const { getByText } = await renderWithProviders(<OnboardingFlow onDone={onDone} />)

    fireEvent.press(getByText('Skip'))
    expect(onDone).toHaveBeenCalledOnce()
  })

  /** Forwards is not the only direction: a claim worth reading twice must be reachable twice. */
  it('goes back a step, and offers no way back from the first', async () => {
    const { getByText, queryByText } = await renderWithProviders(<OnboardingFlow onDone={vi.fn()} />)

    expect(queryByText('‹ Back')).toBeNull()

    await press(getByText('Next'))
    await press(getByText('‹ Back'))

    expect(getByText('Every address you send to, in one place.')).toBeVisible()
  })

  /** The claim the store listing makes, made again before anything is asked of the user. */
  it('states what the app never does before asking for an address', async () => {
    const { getByText } = await renderWithProviders(<OnboardingFlow onDone={vi.fn()} />)

    await press(getByText('Next'))

    expect(getByText('Ask for a seed phrase')).toBeVisible()
    expect(getByText('Hold or store a private key')).toBeVisible()
    expect(getByText('Sign, send or move funds')).toBeVisible()
  })

  it('announces which step it is on', async () => {
    const { getByLabelText } = await renderWithProviders(<OnboardingFlow onDone={vi.fn()} />)

    expect(getByLabelText('Step 1 of 4')).toBeVisible()
  })
})
