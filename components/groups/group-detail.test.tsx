import { fireEvent } from '@testing-library/react-native'
import { describe, expect, it, vi } from 'vitest'
import { GroupDetail } from '@/components/groups/group-detail'
import { makeContact, makeGroup, VALID_ADDRESSES } from '@/test/fixtures'
import { renderWithProviders } from '@/test/test-utils'

vi.mock('@react-native-clipboard/clipboard', () => ({ default: { setString: vi.fn() } }))
vi.mock('@/features/feedback/notify', () => ({ notify: vi.fn() }))

const group = makeGroup({ id: 'group-1', name: 'Friends' })
const members = [
  makeContact({ id: 'c1', name: 'Alex', address: VALID_ADDRESSES[0], groupId: 'group-1' }),
  makeContact({ id: 'c2', name: 'Robin', address: VALID_ADDRESSES[1], groupId: 'group-1' }),
]

const noBalance = () => ({ isError: false, isLoading: false })

function renderDetail(props: Partial<Parameters<typeof GroupDetail>[0]> = {}) {
  return renderWithProviders(
    <GroupDetail
      balanceFor={noBalance}
      group={group}
      members={members}
      onAddContact={vi.fn()}
      onEditGroup={vi.fn()}
      onOpenContact={vi.fn()}
      onShowQr={vi.fn()}
      onTogglePin={vi.fn()}
      {...props}
    />,
  )
}

describe('GroupDetail', () => {
  /** The whole point of the change: the tile counts members, so opening it shows them. */
  it('lists the contacts filed under the group', async () => {
    const { getByText } = await renderDetail()

    expect(getByText('Alex')).toBeVisible()
    expect(getByText('Robin')).toBeVisible()
  })

  it('counts them, and pluralises', async () => {
    const { getByText } = await renderDetail()
    expect(getByText(/2 contacts/)).toBeVisible()

    const { getByText: getOne } = await renderDetail({ members: [members[0]] })
    expect(getOne(/1 contact$/)).toBeVisible()
  })

  it('shows the group total when every balance is known', async () => {
    const { getByText } = await renderDetail({ totalLamports: 1_500_000_000n })

    expect(getByText(/1\.5 SOL/)).toBeVisible()
  })

  /** Undefined means at least one member's balance is still unknown — a partial sum would mislead. */
  it('shows no total while one is missing', async () => {
    const { queryByText } = await renderDetail({ totalLamports: undefined })

    expect(queryByText(/SOL/)).toBeNull()
  })

  it('adds a contact to this group', async () => {
    const onAddContact = vi.fn()
    const { getByRole } = await renderDetail({ onAddContact })

    fireEvent.press(getByRole('button', { name: 'Add a contact to Friends' }))

    expect(onAddContact).toHaveBeenCalledOnce()
  })

  it('opens the group for editing', async () => {
    const onEditGroup = vi.fn()
    const { getByRole } = await renderDetail({ onEditGroup })

    fireEvent.press(getByRole('button', { name: 'Edit group' }))

    expect(onEditGroup).toHaveBeenCalledOnce()
  })

  it('opens a member', async () => {
    const onOpenContact = vi.fn()
    const { getByText } = await renderDetail({ onOpenContact })

    fireEvent.press(getByText('Alex'))

    expect(onOpenContact).toHaveBeenCalledWith(members[0])
  })

  describe('with nothing in it', () => {
    /** A group can outlive its members, and an empty screen with no way forward is a dead end. */
    it('still offers both actions', async () => {
      const { getByRole } = await renderDetail({ members: [] })

      expect(getByRole('button', { name: 'Add contact' })).toBeVisible()
      expect(getByRole('button', { name: 'Edit group' })).toBeVisible()
    })

    it('names the group in the invitation', async () => {
      const { getByText } = await renderDetail({ members: [] })

      expect(getByText(/Add a contact to Friends/)).toBeVisible()
    })
  })
})
