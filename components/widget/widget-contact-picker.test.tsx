import { fireEvent } from '@testing-library/react-native'
import { describe, expect, it, vi } from 'vitest'
import { WidgetContactPicker } from '@/components/widget/widget-contact-picker'
import { makeContact, VALID_ADDRESSES } from '@/test/fixtures'
import { renderWithProviders } from '@/test/test-utils'

const noop = () => undefined

describe('WidgetContactPicker', () => {
  it('hands back the contact that was tapped', async () => {
    const onSelect = vi.fn()
    const ada = makeContact({ id: 'a', name: 'Ada', address: VALID_ADDRESSES[1] })
    const grace = makeContact({ id: 'g', name: 'Grace', address: VALID_ADDRESSES[2] })

    const { getByLabelText } = await renderWithProviders(
      <WidgetContactPicker contacts={[ada, grace]} onAddContact={noop} onSelect={onSelect} />,
    )

    fireEvent.press(getByLabelText(`Add Grace to the widget, ${VALID_ADDRESSES[2]}`))

    expect(onSelect).toHaveBeenCalledWith(grace)
  })

  /** A widget sent the user here to pick something. With nothing to pick, the way out is a contact. */
  it('offers to add a contact when the book is empty', async () => {
    const onAddContact = vi.fn()

    const { getByText } = await renderWithProviders(
      <WidgetContactPicker contacts={[]} onAddContact={onAddContact} onSelect={noop} />,
    )

    fireEvent.press(getByText('Add Contact'))

    expect(onAddContact).toHaveBeenCalledOnce()
  })
})
