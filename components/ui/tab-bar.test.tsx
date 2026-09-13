import { fireEvent } from '@testing-library/react-native'
import { describe, expect, it, vi } from 'vitest'
import { ContactsIcon } from '@/components/ui/icons/contacts-icon'
import { GroupsIcon } from '@/components/ui/icons/groups-icon'
import { AppTabBar, TabBarItem } from '@/components/ui/tab-bar'
import { renderWithProviders } from '@/test/test-utils'

const ITEMS: TabBarItem[] = [
  { key: 'index', label: 'Contacts', icon: ContactsIcon },
  { key: 'groups', label: 'Groups', icon: GroupsIcon },
]

function renderBar(activeIndex = 0) {
  const onSelect = vi.fn()
  return {
    onSelect,
    rendered: renderWithProviders(
      <AppTabBar activeIndex={activeIndex} bottomInset={34} items={ITEMS} onSelect={onSelect} />,
    ),
  }
}

describe('AppTabBar', () => {
  it('names every tab, so an icon-only tab is never unlabelled to a screen reader', async () => {
    const { rendered } = renderBar()
    const { getByRole } = await rendered

    for (const item of ITEMS) {
      expect(getByRole('tab', { name: item.label })).toBeVisible()
    }
  })

  it('marks only the active tab as selected', async () => {
    const { rendered } = renderBar(1)
    const { getByRole } = await rendered

    expect(getByRole('tab', { name: 'Groups', selected: true })).toBeVisible()
    expect(getByRole('tab', { name: 'Contacts', selected: false })).toBeVisible()
  })

  /** Every label at once is a toolbar, not a tab bar — only the active tab spells itself out. */
  it('shows the label of the active tab and no other', async () => {
    const { rendered } = renderBar(1)
    const { getByText, queryByText } = await rendered

    expect(getByText('Groups')).toBeVisible()
    expect(queryByText('Contacts')).toBeNull()
  })

  it('reports the index that was pressed', async () => {
    const { onSelect, rendered } = renderBar(0)
    const { getByRole } = await rendered

    fireEvent.press(getByRole('tab', { name: 'Groups' }))

    expect(onSelect).toHaveBeenCalledWith(1)
  })

  /**
   * The bar floats, so nothing else applies the safe-area inset for it. Getting this wrong puts the
   * last tab underneath Android's gesture bar, where it cannot be pressed at all.
   */
  it('floats clear of the safe area', async () => {
    const { rendered } = renderBar()
    const { getByRole } = await rendered

    // The bar itself carries no role of its own — it is the parent of the tabs, nothing more.
    expect(getByRole('tab', { name: 'Contacts' }).parent).toHaveStyle({ bottom: 34 + 12 })
  })
})
