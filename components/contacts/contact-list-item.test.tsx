import { fireEvent } from '@testing-library/react-native'
import { describe, expect, it, vi } from 'vitest'
import Clipboard from '@react-native-clipboard/clipboard'
import { ContactListItem } from '@/components/contacts/contact-list-item'
import { makeContact, makeGroup, VALID_ADDRESSES } from '@/test/fixtures'
import { renderWithProviders } from '@/test/test-utils'

vi.mock('@react-native-clipboard/clipboard', () => ({ default: { setString: vi.fn() } }))
vi.mock('@/features/feedback/notify', () => ({ notify: vi.fn() }))

const noop = () => undefined
const idle = { isError: false, isLoading: false, lamports: undefined, onRetry: noop }

describe('ContactListItem', () => {
  it('opens the full-screen code from the QR tile without opening the contact', async () => {
    const onPress = vi.fn()
    const onShowQr = vi.fn()
    const contact = makeContact({ name: 'Alex', address: VALID_ADDRESSES[2] })

    const { getByLabelText } = await renderWithProviders(
      <ContactListItem balance={idle} contact={contact} onPress={onPress} onShowQr={onShowQr} onTogglePin={noop} />,
    )

    fireEvent.press(getByLabelText("Alex's address as a QR code"))
    expect(onShowQr).toHaveBeenCalledOnce()
    expect(onPress).not.toHaveBeenCalled()
  })

  /** The row shows a shortened address; what lands on the clipboard must still be the whole thing. */
  it('copies the full address, not the shortened one', async () => {
    const contact = makeContact({ name: 'Alex', address: VALID_ADDRESSES[2] })

    const { getByLabelText } = await renderWithProviders(
      <ContactListItem balance={idle} contact={contact} onPress={noop} onShowQr={noop} onTogglePin={noop} />,
    )

    fireEvent.press(getByLabelText("Copy Alex's address"))
    expect(Clipboard.setString).toHaveBeenCalledWith(VALID_ADDRESSES[2])
  })

  it('shows the group it belongs to, and nothing when it belongs to none', async () => {
    const contact = makeContact({ groupId: 'group-1' })

    const withGroup = await renderWithProviders(
      <ContactListItem
        balance={idle}
        contact={contact}
        group={makeGroup({ name: 'Exchanges' })}
        onPress={noop}
        onShowQr={noop}
        onTogglePin={noop}
      />,
    )
    expect(withGroup.getByText('Exchanges')).toBeVisible()

    const without = await renderWithProviders(
      <ContactListItem balance={idle} contact={makeContact()} onPress={noop} onShowQr={noop} onTogglePin={noop} />,
    )
    expect(without.queryByText('Exchanges')).toBeNull()
  })

  /** The star is decoration; the pinned state has to reach a screen reader some other way. */
  it('announces a pinned contact as selected', async () => {
    const { getByRole } = await renderWithProviders(
      <ContactListItem
        balance={idle}
        contact={makeContact({ name: 'Alex', pinned: true })}
        onPress={noop}
        onShowQr={noop}
        onTogglePin={noop}
      />,
    )

    expect(getByRole('button', { name: `Alex, ${VALID_ADDRESSES[0]}`, selected: true })).toBeVisible()
  })

  it('toggles the pin on a long press, without opening the contact', async () => {
    const onPress = vi.fn()
    const onTogglePin = vi.fn()

    const { getByLabelText } = await renderWithProviders(
      <ContactListItem
        balance={idle}
        contact={makeContact({ name: 'Alex' })}
        onPress={onPress}
        onShowQr={noop}
        onTogglePin={onTogglePin}
      />,
    )

    fireEvent(getByLabelText(`Alex, ${VALID_ADDRESSES[0]}`), 'longPress')
    expect(onTogglePin).toHaveBeenCalledOnce()
    expect(onPress).not.toHaveBeenCalled()
  })
})
