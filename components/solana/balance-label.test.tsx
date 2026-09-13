import { fireEvent } from '@testing-library/react-native'
import { describe, expect, it, vi } from 'vitest'
import { BalanceLabel } from '@/components/solana/balance-label'
import { renderWithProviders } from '@/test/test-utils'

describe('BalanceLabel', () => {
  it('announces that the balance is loading rather than rendering nothing', async () => {
    const { getByLabelText } = await renderWithProviders(<BalanceLabel isError={false} isLoading />)

    expect(getByLabelText('Loading balance')).toBeVisible()
  })

  /** The distinction the whole component exists for: an empty wallet is not a failed lookup. */
  it('renders a zero balance as 0 SOL, not as unavailable', async () => {
    const { getByText } = await renderWithProviders(<BalanceLabel isError={false} isLoading={false} lamports={0n} />)

    expect(getByText('0 SOL')).toBeVisible()
  })

  it('offers a retry when the lookup failed', async () => {
    const onRetry = vi.fn()
    const { getByText } = await renderWithProviders(<BalanceLabel isError isLoading={false} onRetry={onRetry} />)

    fireEvent.press(getByText('Balance unavailable · Retry'))
    expect(onRetry).toHaveBeenCalledOnce()
  })

  it('omits the retry affordance when there is nothing to retry with', async () => {
    const { getByText, toJSON } = await renderWithProviders(<BalanceLabel isError isLoading={false} />)

    expect(toJSON()).not.toBeNull()
    expect(getByText('Balance unavailable')).toBeVisible()
  })
})
