import { ClusterName, EXPLORER_BASE_URL } from '@/constants/app-config'

/**
 * Mainnet takes no `cluster` parameter; every other cluster requires one, and omitting it would
 * silently show a mainnet account for a devnet address. The cluster is passed in rather than read
 * from config so these stay pure, testable functions.
 */
function withCluster(path: string, cluster: ClusterName): string {
  const suffix = cluster === 'mainnet-beta' ? '' : `?cluster=${cluster}`
  return `${EXPLORER_BASE_URL}/${path}${suffix}`
}

/** A Solana Explorer link for an address. */
export function explorerAddressUrl(address: string, cluster: ClusterName): string {
  return withCluster(`address/${address.trim()}`, cluster)
}

/** A Solana Explorer link for a transaction signature. */
export function explorerTransactionUrl(signature: string, cluster: ClusterName): string {
  return withCluster(`tx/${signature.trim()}`, cluster)
}
