import { describe, expect, it } from 'vitest'
import { LoadingState } from '@/components/ui/loading-state'
import { renderWithProviders } from '@/test/test-utils'

describe('LoadingState', () => {
  /** The spinner is hidden from accessibility, so the wrapper is the only thing that can say it. */
  it('announces the wait once, under the label it was given', async () => {
    const { getByRole, getByText } = await renderWithProviders(<LoadingState label="Loading your groups…" />)

    expect(getByRole('progressbar', { name: 'Loading your groups…' })).toBeVisible()
    expect(getByText('Loading your groups…')).toBeVisible()
  })
})
