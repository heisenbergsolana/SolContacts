import { act, fireEvent } from '@testing-library/react-native'
import { ComponentProps } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { GroupForm } from '@/components/groups/group-form'
import { renderWithProviders } from '@/test/test-utils'

/**
 * `fireEvent` does not flush the resulting re-render, so every interaction is wrapped in `act`, and
 * `waitFor` is avoided here for the reason spelled out in `contact-form.test.tsx`.
 */
async function renderForm(props: Partial<ComponentProps<typeof GroupForm>> = {}) {
  const onSubmit = vi.fn().mockResolvedValue(undefined)
  const rendered = await renderWithProviders(
    <GroupForm submitLabel="Create group" suggestedTone="mint" taken={[]} onSubmit={onSubmit} {...props} />,
  )
  const type = (value: string) =>
    act(async () => {
      fireEvent.changeText(rendered.getByLabelText('Group name'), value)
    })

  return { onSubmit, type, ...rendered }
}

describe('GroupForm', () => {
  it('keeps save disabled until the group has a name', async () => {
    const { getByRole, type } = await renderForm()
    const save = () => getByRole('button', { name: 'Create group' })

    expect(save()).toBeDisabled()

    await type('   ')
    expect(save()).toBeDisabled()

    await type('Friends')
    expect(save()).toBeEnabled()
  })

  /** Said by the form before the service refuses, so the user is not told after the fact. */
  it('refuses a name another group already holds, whatever the case', async () => {
    const { getByRole, getByText, type } = await renderForm({ taken: ['Friends'] })

    await type('friends')

    expect(getByText('There is already a group called “friends”')).toBeVisible()
    expect(getByRole('button', { name: 'Create group' })).toBeDisabled()
  })

  it('offers the suggested colour and submits the one that was chosen', async () => {
    const { getByRole, onSubmit, type } = await renderForm({ suggestedTone: 'cyan' })

    expect(getByRole('radio', { name: 'cyan', selected: true })).toBeVisible()

    await type('Cold storage')
    await act(async () => {
      fireEvent.press(getByRole('radio', { name: 'amber' }))
    })
    await act(async () => {
      fireEvent.press(getByRole('button', { name: 'Create group' }))
    })

    expect(onSubmit).toHaveBeenCalledWith({ name: 'Cold storage', tone: 'amber' })
  })

  it('offers deleting only when there is a group to delete', async () => {
    const withoutDelete = await renderForm()
    expect(withoutDelete.queryByText('Delete group')).toBeNull()

    const onDelete = vi.fn()
    const withDelete = await renderForm({ initial: { name: 'Friends', tone: 'mint' }, onDelete })
    fireEvent.press(withDelete.getByRole('button', { name: 'Delete group' }))
    expect(onDelete).toHaveBeenCalledOnce()
  })
})
