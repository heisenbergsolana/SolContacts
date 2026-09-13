import { fireEvent } from '@testing-library/react-native'
import { describe, expect, it, vi } from 'vitest'
import { CrashScreen } from '@/components/crash-screen'
import { renderWithProviders } from '@/test/test-utils'

describe('CrashScreen', () => {
  /** In an app that sits next to wallets, this is the sentence the reader actually needs. */
  it('says nothing was lost before it says anything else', async () => {
    const { getByText } = await renderWithProviders(<CrashScreen error={new Error('boom')} onRetry={vi.fn()} />)

    expect(getByText(/Your contacts are safe/)).toBeVisible()
    expect(getByText(/does not affect any wallet or any funds/)).toBeVisible()
  })

  /** The only thing a user can usefully quote into a bug report. */
  it('shows the error text', async () => {
    const { getByText } = await renderWithProviders(
      <CrashScreen error={new Error('Cannot read property id of undefined')} onRetry={vi.fn()} />,
    )

    expect(getByText('Cannot read property id of undefined')).toBeVisible()
  })

  it('retries what threw', async () => {
    const onRetry = vi.fn()
    const { getByRole } = await renderWithProviders(<CrashScreen error={new Error('boom')} onRetry={onRetry} />)

    fireEvent.press(getByRole('button', { name: 'Try again' }))

    expect(onRetry).toHaveBeenCalledOnce()
  })
})
