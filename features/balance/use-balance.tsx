import { address as toAddress } from '@solana/kit'
import { useQuery } from '@tanstack/react-query'
import { CLUSTER_NAME } from '@/constants/app-config'
import { solanaRpc } from '@/features/rpc/solana-rpc'
import { isValidSolanaAddress } from '@/utils/solana-address'

/** How long a fetched balance is treated as fresh. Balances move, but not every second. */
const STALE_TIME_MS = 30_000

/**
 * Read the SOL balance of any public address.
 *
 * Balances are never persisted. A cached balance shown after a restart is a misleading balance.
 * React Query keeps them in memory for the session only.
 */
export function useBalance(walletAddress: string) {
  return useQuery({
    // The cluster is part of the key: the same address holds different balances on devnet.
    queryKey: ['balance', CLUSTER_NAME, walletAddress],
    // `toAddress` throws on a malformed address, so the query never runs for one.
    enabled: isValidSolanaAddress(walletAddress),
    staleTime: STALE_TIME_MS,
    retry: 1,
    queryFn: async ({ signal }) => {
      const { value } = await solanaRpc.getBalance(toAddress(walletAddress.trim())).send({ abortSignal: signal })
      return value
    },
  })
}
