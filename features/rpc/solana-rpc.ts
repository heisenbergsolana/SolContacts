import { createDefaultRpcTransport, createSolanaRpcFromTransport, type RpcTransport } from '@solana/kit'
import { HAS_RPC_FALLBACK, PUBLIC_RPC_URL, RPC_URL } from '@/constants/app-config'

/**
 * A transport that tries the configured provider and, if it fails, asks Solana's public endpoint
 * the same question.
 *
 * The provider key is bundled into the APK and cannot be kept secret, so the realistic failure is
 * an exhausted or abused quota — which would otherwise blank every balance in the app until a new
 * release shipped. The public endpoint is slow and rate limited, but it answers, and a slow balance
 * beats a broken one.
 *
 * An aborted request is not retried: the caller has already stopped caring, and going again would
 * only make a cancelled screen wait twice.
 */
function withPublicFallback(primary: RpcTransport, fallback: RpcTransport): RpcTransport {
  return async function failoverTransport<TResponse>(config: Parameters<RpcTransport>[0]) {
    try {
      return await primary<TResponse>(config)
    } catch (error) {
      if (config.signal?.aborted) throw error
      return await fallback<TResponse>(config)
    }
  }
}

const transport = HAS_RPC_FALLBACK
  ? withPublicFallback(createDefaultRpcTransport({ url: RPC_URL }), createDefaultRpcTransport({ url: PUBLIC_RPC_URL }))
  : createDefaultRpcTransport({ url: RPC_URL })

/**
 * The app's one RPC client, for the only thing it does over the network: reading balances.
 *
 * A module-level singleton rather than something handed down a provider, because there is nothing
 * to configure per render and nothing to tear down — the endpoints are fixed at build time by
 * `constants/app-config.ts`. Tests replace this module.
 *
 * Read-only by construction. It is never given a signer, and the app holds no key it could sign
 * with.
 */
export const solanaRpc = createSolanaRpcFromTransport(transport)
