import { renderHook, waitFor } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { PropsWithChildren } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { VALID_ADDRESSES } from '@/test/fixtures'
import { createRpcMock } from '@/test/test-utils'

/**
 * A getter rather than a fixed object: each test installs its own client in `beforeEach`, and the
 * hook reads the export at call time, so the one it gets is the one the test just set.
 */
const rpc = vi.hoisted(() => ({ current: null as ReturnType<typeof createRpcMock> | null }))

vi.mock('@/features/rpc/solana-rpc', () => ({
  get solanaRpc() {
    return rpc.current
  },
}))

const { useBalances } = await import('./use-balances')

function renderBalances(addresses: readonly string[]) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { gcTime: 0, retry: false } } })
  const wrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
  return renderHook(() => useBalances(addresses), { wrapper })
}

describe('useBalances', () => {
  beforeEach(() => {
    rpc.current = createRpcMock({ balance: 1_500_000_000n })
  })

  it('reads every address in a single request', async () => {
    const { result } = await renderBalances(VALID_ADDRESSES)

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.get(VALID_ADDRESSES[0])).toBe(1_500_000_000n)
    expect(rpc.current?.getMultipleAccounts).toHaveBeenCalledOnce()
  })

  /** Two names for one wallet is a legitimate address book, and must not cost two lookups. */
  it('asks for a repeated address only once', async () => {
    const { result } = await renderBalances([VALID_ADDRESSES[0], VALID_ADDRESSES[0]])

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(rpc.current?.getMultipleAccounts).toHaveBeenCalledWith([VALID_ADDRESSES[0]], expect.anything())
  })

  it('reports an address that holds nothing as zero, not as missing', async () => {
    rpc.current = createRpcMock({ emptyAddresses: [VALID_ADDRESSES[1]] })

    const { result } = await renderBalances(VALID_ADDRESSES)

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.get(VALID_ADDRESSES[1])).toBe(0n)
  })

  it('skips malformed addresses instead of failing the whole book', async () => {
    const { result } = await renderBalances(['not-an-address', VALID_ADDRESSES[0]])

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.has('not-an-address')).toBe(false)
    expect(result.current.data?.get(VALID_ADDRESSES[0])).toBe(1_500_000_000n)
  })

  it('never queries for an empty book', async () => {
    const { result } = await renderBalances([])

    expect(result.current.fetchStatus).toBe('idle')
    expect(rpc.current?.getMultipleAccounts).not.toHaveBeenCalled()
  })

  it('surfaces an RPC failure rather than reporting every wallet as empty', async () => {
    rpc.current = createRpcMock({ failRpcAfter: 0 })

    const { result } = await renderBalances(VALID_ADDRESSES)

    await waitFor(() => expect(result.current.isError).toBe(true), { timeout: 5_000 })
    expect(result.current.data).toBeUndefined()
  })
})
