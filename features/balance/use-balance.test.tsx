import { renderHook, waitFor } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { PropsWithChildren } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createRpcMock, TEST_ADDRESS } from '@/test/test-utils'

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

const { useBalance } = await import('./use-balance')

function renderBalance(walletAddress: string) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { gcTime: 0, retry: false } } })
  const wrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
  return renderHook(() => useBalance(walletAddress), { wrapper })
}

describe('useBalance', () => {
  beforeEach(() => {
    rpc.current = createRpcMock({ balance: 1_500_000_000n })
  })

  it('returns the balance in lamports as a bigint', async () => {
    const { result } = await renderBalance(TEST_ADDRESS)

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toBe(1_500_000_000n)
  })

  it('never queries for a malformed address', async () => {
    const { result } = await renderBalance('not-an-address')

    expect(result.current.fetchStatus).toBe('idle')
    expect(rpc.current?.getBalance).not.toHaveBeenCalled()
  })

  it('surfaces an RPC failure rather than reporting zero', async () => {
    rpc.current = createRpcMock({ failRpcAfter: 0 })

    const { result } = await renderBalance(TEST_ADDRESS)

    // The hook retries once with React Query's backoff, so this needs longer than waitFor's
    // one-second default before the query settles into an error.
    await waitFor(() => expect(result.current.isError).toBe(true), { timeout: 5_000 })
    // Zero and "unavailable" mean very different things to someone checking a wallet.
    expect(result.current.data).toBeUndefined()
  })
})
