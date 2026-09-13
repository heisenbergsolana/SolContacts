import { fireEvent } from '@testing-library/react-native'
import { describe, expect, it, vi } from 'vitest'
import { NotFoundPanel } from '@/components/not-found-panel'
import { renderWithProviders } from '@/test/test-utils'

describe('NotFoundPanel', () => {
  /** Reachable from outside the app via the solcontacts:// scheme, so it reassures before it explains. */
  it('says nothing was opened or changed', async () => {
    const { getByText } = await renderWithProviders(<NotFoundPanel onGoHome={vi.fn()} />)

    expect(getByText(/Nothing was opened and nothing was changed/)).toBeVisible()
  })

  it('offers the way back', async () => {
    const onGoHome = vi.fn()
    const { getByRole } = await renderWithProviders(<NotFoundPanel onGoHome={onGoHome} />)

    fireEvent.press(getByRole('button', { name: 'Go to contacts' }))

    expect(onGoHome).toHaveBeenCalledOnce()
  })
})
