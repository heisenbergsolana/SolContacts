import { describe, expect, it } from 'vitest'
import { GroupTile } from '@/components/groups/group-tile'
import { renderWithProviders } from '@/test/test-utils'

const noop = () => undefined

describe('GroupTile', () => {
  it('shows the group total when every member has a balance', async () => {
    const { getByText } = await renderWithProviders(
      <GroupTile count={2} name="Friends" tone="mint" totalLamports={2_500_000_000n} onPress={noop} />,
    )

    expect(getByText('2.5 SOL')).toBeVisible()
  })

  /** A total is missing, not zero, when a lookup failed — this tile must never invent a number. */
  it('says the balance is unavailable rather than showing 0 SOL', async () => {
    const { getByText, queryByText } = await renderWithProviders(
      <GroupTile count={2} name="Friends" tone="mint" onPress={noop} />,
    )

    expect(getByText('Balance unavailable')).toBeVisible()
    expect(queryByText('0 SOL')).toBeNull()
  })

  it('says an empty group is empty instead of asking about its balance', async () => {
    const { getByText } = await renderWithProviders(<GroupTile count={0} name="Friends" tone="mint" onPress={noop} />)

    expect(getByText('No contacts yet')).toBeVisible()
  })

  it('counts its contacts in the accessible name, since the number alone is just a digit', async () => {
    const { getByLabelText } = await renderWithProviders(
      <GroupTile count={1} name="Friends" tone="mint" totalLamports={0n} onPress={noop} />,
    )

    expect(getByLabelText('Friends, 1 contact')).toBeVisible()
  })
})
