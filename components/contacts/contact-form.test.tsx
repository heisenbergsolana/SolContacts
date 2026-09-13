import Clipboard from '@react-native-clipboard/clipboard'
import { act, fireEvent } from '@testing-library/react-native'
import { ComponentProps } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { makeContact, makeGroup, VALID_ADDRESSES } from '@/test/fixtures'
import { renderWithProviders } from '@/test/test-utils'
import { ContactForm } from './contact-form'

vi.mock('@react-native-clipboard/clipboard', () => ({ default: { getString: vi.fn(() => Promise.resolve('')) } }))

/**
 * `renderWithProviders` is async, like every RNTL v14 render. Use the queries it returns rather than
 * the global `screen`.
 *
 * `fireEvent` does not flush the resulting re-render, so every interaction is wrapped in `act`.
 * **Do not reach for `waitFor` here**: under vitest-native a single `waitFor` leaves the renderer in
 * a state where every later `render` in the same file produces a null tree, and the following tests
 * fail with "Unable to find an element" while still passing in isolation.
 */
async function renderForm(props: Partial<ComponentProps<typeof ContactForm>> = {}) {
  const onSubmit = vi.fn().mockResolvedValue(undefined)
  const rendered = await renderWithProviders(
    <ContactForm existing={[]} groups={[]} submitLabel="Save Contact" onSubmit={onSubmit} {...props} />,
  )
  const type = (label: string, value: string) =>
    act(async () => {
      fireEvent.changeText(rendered.getByLabelText(label), value)
    })

  return { onSubmit, type, ...rendered }
}

describe('ContactForm', () => {
  it('disables save until a name and a valid address are present', async () => {
    const { getByRole, type } = await renderForm()
    const save = () => getByRole('button', { name: 'Save Contact' })

    expect(save()).toBeDisabled()

    await type('Name', 'Alex')
    expect(save()).toBeDisabled()

    await type('Wallet Address', VALID_ADDRESSES[0])
    expect(save()).toBeEnabled()
  })

  it('rejects an invalid address and keeps save disabled', async () => {
    const { getByRole, getByText, type } = await renderForm()

    await type('Name', 'Alex')
    await type('Wallet Address', 'not-an-address')

    expect(getByText('✕ Invalid Solana address')).toBeVisible()
    expect(getByRole('button', { name: 'Save Contact' })).toBeDisabled()
  })

  it('confirms a well-formed address', async () => {
    const { getByText, type } = await renderForm()

    await type('Wallet Address', VALID_ADDRESSES[0])

    expect(getByText('✓ Valid Solana address')).toBeVisible()
  })

  it('says nothing until the address field has content', async () => {
    const { queryByText, toJSON } = await renderForm()

    expect(toJSON()).not.toBeNull()
    expect(queryByText('✕ Invalid Solana address')).toBeNull()
    expect(queryByText('✓ Valid Solana address')).toBeNull()
  })

  it('warns about a duplicate address without blocking the save', async () => {
    const existing = [makeContact({ id: 'a', name: 'Alex', address: VALID_ADDRESSES[0] })]
    const { getByRole, getByText, type } = await renderForm({ existing })

    await type('Name', 'Alex trading')
    await type('Wallet Address', VALID_ADDRESSES[0])

    expect(getByText('✓ Valid — already saved as “Alex”')).toBeVisible()
    expect(getByRole('button', { name: 'Save Contact' })).toBeEnabled()
  })

  it('does not let a contact flag itself while being edited', async () => {
    const contact = makeContact({ id: 'a', name: 'Alex', address: VALID_ADDRESSES[0] })
    const { getByText } = await renderForm({ existing: [contact], excludeId: 'a', initial: contact })

    expect(getByText('✓ Valid Solana address')).toBeVisible()
  })

  it('hands the raw values to the caller, leaving trimming to the service', async () => {
    const { getByRole, onSubmit, type } = await renderForm()

    await type('Name', '  Alex  ')
    await type('Wallet Address', VALID_ADDRESSES[0])
    await act(async () => {
      fireEvent.press(getByRole('button', { name: 'Save Contact' }))
    })

    expect(onSubmit).toHaveBeenCalledWith({
      name: '  Alex  ',
      address: VALID_ADDRESSES[0],
      note: '',
      groupId: '',
      pinned: false,
    })
  })

  it('starts from the contact it is editing, group and pin included', async () => {
    const initial = makeContact({ groupId: 'group-1', pinned: true })
    const { getByRole, onSubmit } = await renderForm({ initial, groups: [makeGroup({ id: 'group-1' })] })

    expect(getByRole('button', { name: 'Friends', selected: true })).toBeVisible()

    await act(async () => {
      fireEvent.press(getByRole('button', { name: 'Save Contact' }))
    })
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ groupId: 'group-1', pinned: true }))
  })

  it('files the contact under a group, and lets None take it back out', async () => {
    const groups = [makeGroup({ id: 'group-1', name: 'Friends' })]
    const { getByRole, onSubmit, type } = await renderForm({ groups })

    await type('Name', 'Alex')
    await type('Wallet Address', VALID_ADDRESSES[0])
    await act(async () => {
      fireEvent.press(getByRole('button', { name: 'Friends' }))
    })
    await act(async () => {
      fireEvent.press(getByRole('button', { name: 'Save Contact' }))
    })
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ groupId: 'group-1' }))

    await act(async () => {
      fireEvent.press(getByRole('button', { name: 'None' }))
    })
    await act(async () => {
      fireEvent.press(getByRole('button', { name: 'Save Contact' }))
    })
    expect(onSubmit).toHaveBeenLastCalledWith(expect.objectContaining({ groupId: '' }))
  })

  /**
   * Android tells the user every time an app reads the clipboard, so this must never happen on
   * mount — and a clipboard holding something else must not silently overwrite the field.
   */
  it('pastes only on a tap, and only a real address', async () => {
    vi.mocked(Clipboard.getString).mockResolvedValue('not an address')
    const { getByRole, getByText, queryByText } = await renderForm()

    expect(Clipboard.getString).not.toHaveBeenCalled()

    await act(async () => {
      fireEvent.press(getByRole('button', { name: 'Paste' }))
    })
    expect(getByText('The clipboard does not hold a Solana address.')).toBeVisible()

    vi.mocked(Clipboard.getString).mockResolvedValue(`  ${VALID_ADDRESSES[1]}  `)
    await act(async () => {
      fireEvent.press(getByRole('button', { name: 'Paste' }))
    })
    expect(queryByText('The clipboard does not hold a Solana address.')).toBeNull()
    expect(getByText('✓ Valid Solana address')).toBeVisible()
  })
})
