import { describe, expect, it } from 'vitest'
import { Text } from 'react-native'
import { ListEntrance } from '@/components/ui/list-entrance'
import { renderWithProviders } from '@/test/test-utils'

describe('ListEntrance', () => {
  it('renders its row either way', async () => {
    const { getByText } = await renderWithProviders(
      <ListEntrance index={0}>
        <Text>Alex</Text>
      </ListEntrance>,
    )

    expect(getByText('Alex')).toBeVisible()
  })

  /**
   * The wrapper stands between a row and the list, so it has to take part in the parent's layout —
   * without this, wrapping a grid tile collapses the grid to one column.
   */
  it('applies the layout it is given', async () => {
    const { getByText } = await renderWithProviders(
      <ListEntrance index={0} style={{ flexBasis: '46%', flexGrow: 1 }}>
        <Text>Alex</Text>
      </ListEntrance>,
    )

    expect(getByText('Alex').parent).toHaveStyle({ flexBasis: '46%', flexGrow: 1 })
  })
})
