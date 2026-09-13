import { render } from '@testing-library/react-native'
import { Text } from 'react-native'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useWidgetSync } from '@/features/widget/use-widget-sync'
import { syncWidgetContacts } from '@/modules/contact-widget'
import { makeContact, VALID_ADDRESSES } from '@/test/fixtures'

vi.mock('@/modules/contact-widget', () => ({ syncWidgetContacts: vi.fn() }))

function Harness({ contacts, ready }: { contacts: ReturnType<typeof makeContact>[]; ready: boolean }) {
  useWidgetSync(contacts, ready)
  return <Text>ready</Text>
}

describe('useWidgetSync', () => {
  beforeEach(() => vi.clearAllMocks())

  /** A widget must never show a note or a group — only what it draws is ever handed over. */
  it('pushes nothing but the id, name and address', async () => {
    const contact = makeContact({ address: VALID_ADDRESSES[1], note: 'private', groupId: 'group-1' })

    await render(<Harness contacts={[contact]} ready />)

    expect(syncWidgetContacts).toHaveBeenCalledWith([
      { id: contact.id, name: contact.name, address: VALID_ADDRESSES[1] },
    ])
  })

  /** An empty book while loading looks exactly like a deleted book. Wait until it is real. */
  it('stays quiet until the book has loaded', async () => {
    await render(<Harness contacts={[]} ready={false} />)

    expect(syncWidgetContacts).not.toHaveBeenCalled()
  })
})
