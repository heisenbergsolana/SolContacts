import { address as toAddress } from '@solana/kit'
import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { CLUSTER_NAME } from '@/constants/app-config'
import { solanaRpc } from '@/features/rpc/solana-rpc'
import { chunk } from '@/utils/chunk'
import { isValidSolanaAddress } from '@/utils/solana-address'

/** Matches `useBalance`: the same number is fresh for the same length of time on either screen. */
const STALE_TIME_MS = 30_000

/** `getMultipleAccounts` accepts at most 100 keys per request. */
const MAX_KEYS_PER_REQUEST = 100

export type BalanceMap = ReadonlyMap<string, bigint>

/**
 * Read the SOL balance of many addresses at once.
 *
 * The contact list used to mount one `useBalance` per row, which meant one RPC request per contact
 * — fine for a handful, a self-inflicted rate limit for a book of a few hundred. This asks once per
 * hundred addresses instead.
 *
 * `dataSlice` drops the account data from the response: this app only ever wants the lamports, and
 * an unbounded blob per contact is the difference between a small reply and a very large one.
 */
export function useBalances(addresses: readonly string[]) {
  // Sorted and de-duplicated so that two renders of the same book produce the same query key, and
  // one wallet saved under two names costs one lookup rather than two.
  const wanted = useMemo(() => [...new Set(addresses.filter(isValidSolanaAddress))].sort(), [addresses])

  return useQuery<BalanceMap>({
    queryKey: ['balances', CLUSTER_NAME, wanted],
    enabled: wanted.length > 0,
    staleTime: STALE_TIME_MS,
    retry: 1,
    queryFn: async ({ signal }) => {
      const balances = new Map<string, bigint>()

      for (const batch of chunk(wanted, MAX_KEYS_PER_REQUEST)) {
        const { value } = await solanaRpc
          .getMultipleAccounts(batch.map(toAddress), { dataSlice: { length: 0, offset: 0 }, encoding: 'base64' })
          .send({ abortSignal: signal })

        batch.forEach((walletAddress, index) => {
          // A null account is an address that holds nothing, which is 0 lamports — not a failed
          // read. A failed read rejects, and the whole map reports an error.
          balances.set(walletAddress, value[index]?.lamports ?? 0n)
        })
      }

      return balances
    },
  })
}
