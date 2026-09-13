import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render } from '@testing-library/react-native'
import { Address } from '@solana/kit'
import { ReactElement } from 'react'
import { afterEach, vi } from 'vitest'

/**
 * Unmount every rendered tree between tests.
 *
 * React Native Testing Library registers this hook itself only when the runner exposes globals.
 * This project imports `describe`/`it`/`expect` explicitly, so `globals` is off and the automatic
 * registration never happens, leaving mounted trees to pile up across a file. The symptom is
 * misleading rather than obviously a leak: queries begin failing with "Unable to find an element",
 * while each test still passes when run in isolation — which looks like a bug in the component
 * under test.
 *
 * It lives here rather than in a `setupFiles` entry because setup files run outside vitest-native's
 * react-native transform, so importing this library there fails with a bare `SyntaxError`.
 */
afterEach(cleanup)

/** A fixed address so assertions stay deterministic. */
export const TEST_ADDRESS = 'GsbwXfJraMomNxBcjK9jJ3YuPBQTd7pTvbwEfJvvZoP1' as Address

/**
 * Render a component tree with the providers the app relies on.
 *
 * React Query is configured without retries and without a cache shared between tests, so a failing
 * query fails fast instead of hanging the test.
 *
 * `render` is async in React Native Testing Library v14 — always await this helper.
 */
export async function renderWithProviders(ui: ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { gcTime: 0, retry: false, staleTime: 0 } },
  })

  // The client is returned so a test can force a refetch and exercise the
  // success-then-failure path, where React Query keeps the last value and still reports an error.
  const screen = await render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>)

  return Object.assign(screen, { queryClient })
}

export interface RpcMockOptions {
  /** Lamports returned by `getBalance`, and by every account `getMultipleAccounts` reports. */
  balance?: bigint
  /**
   * Reject reads once this many sends have succeeded. `0` fails the first read, `1` lets the first
   * read succeed and fails every refetch after it.
   */
  failRpcAfter?: number
  /** Addresses `getMultipleAccounts` reports as having no account at all. */
  emptyAddresses?: readonly string[]
}

/**
 * Build a stand-in for `features/rpc/solana-rpc.ts`.
 *
 * This is the seam that replaces the network: no device and no RPC calls are involved, so the
 * tests stay fast and deterministic while still driving the real hooks and components.
 */
export function createRpcMock({ balance = 1_500_000_000n, emptyAddresses = [], failRpcAfter }: RpcMockOptions = {}) {
  const sends: Record<string, number> = {}

  /** Resolve with `value`, unless this read is past the configured failure point. */
  function send<T>(method: string, value: T) {
    return () => {
      const attempt = (sends[method] = (sends[method] ?? 0) + 1)
      if (failRpcAfter !== undefined && attempt > failRpcAfter) {
        return Promise.reject(new Error(`RPC ${method} unavailable`))
      }
      return Promise.resolve(value)
    }
  }

  return {
    getBalance: vi.fn((_address: Address) => ({ send: send('getBalance', { value: balance }) })),
    getMultipleAccounts: vi.fn((addresses: Address[]) => ({
      send: send('getMultipleAccounts', {
        // `null` is what the RPC returns for an address that has never held anything.
        value: addresses.map((one) => (emptyAddresses.includes(one) ? null : { lamports: balance })),
      }),
    })),
  }
}
