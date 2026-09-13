import { fireEvent } from '@testing-library/react-native'
import { describe, expect, it, vi } from 'vitest'
import { AboutPanel } from '@/components/about-panel'
import { PRIVACY_POLICY_URL, TERMS_OF_USE_URL } from '@/constants/app-config'
import { renderWithProviders } from '@/test/test-utils'

describe('AboutPanel', () => {
  /** The listing links these too, but someone already holding the app should not have to leave to read them. */
  it('opens the privacy policy', async () => {
    const onOpen = vi.fn()
    const { getByRole } = await renderWithProviders(<AboutPanel version="1.0.0" onOpen={onOpen} />)

    fireEvent.press(getByRole('link', { name: 'Privacy Policy' }))

    expect(onOpen).toHaveBeenCalledWith(PRIVACY_POLICY_URL)
  })

  it('opens the terms of use', async () => {
    const onOpen = vi.fn()
    const { getByRole } = await renderWithProviders(<AboutPanel version="1.0.0" onOpen={onOpen} />)

    fireEvent.press(getByRole('link', { name: 'Terms of Use' }))

    expect(onOpen).toHaveBeenCalledWith(TERMS_OF_USE_URL)
  })

  /** The app's central promise, and this is where someone goes to check it. */
  it('states that it cannot sign or move funds', async () => {
    const { getByText } = await renderWithProviders(<AboutPanel version="1.0.0" onOpen={vi.fn()} />)

    expect(getByText(/cannot sign anything, so it cannot move funds/)).toBeVisible()
  })

  /** A valid address is not a verified one — the one warning worth repeating inside the app. */
  it('warns that a saved address is not a verified owner', async () => {
    const { getByText } = await renderWithProviders(<AboutPanel version="1.0.0" onOpen={vi.fn()} />)

    expect(getByText(/not for belonging to the person you mean/)).toBeVisible()
  })

  it('shows the version it was given, so a bug report can name one', async () => {
    const { getByText } = await renderWithProviders(<AboutPanel version="1.2.3" onOpen={vi.fn()} />)

    expect(getByText('Version 1.2.3')).toBeVisible()
  })
})
