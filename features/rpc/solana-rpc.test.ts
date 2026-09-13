import { beforeEach, describe, expect, it, vi } from 'vitest'

const PROVIDER_URL = 'https://mainnet.example-rpc.com/?api-key=test'
const PUBLIC_URL = 'https://api.mainnet-beta.solana.com'

const { createDefaultRpcTransport, createSolanaRpcFromTransport } = vi.hoisted(() => ({
  createDefaultRpcTransport: vi.fn(),
  createSolanaRpcFromTransport: vi.fn(),
}))

vi.mock('@solana/kit', () => ({ createDefaultRpcTransport, createSolanaRpcFromTransport }))

type Transport = (config: { payload: unknown; signal?: AbortSignal }) => Promise<unknown>

const primary = vi.fn<Transport>()
const publicEndpoint = vi.fn<Transport>()

/**
 * Load the module under a given configuration and hand back the transport it assembled.
 *
 * The endpoints are module-level constants read at import time, so each scenario needs a fresh
 * module registry rather than a mutated value.
 */
async function loadTransport(hasFallback: boolean): Promise<Transport> {
  vi.resetModules()
  vi.doMock('@/constants/app-config', () => ({
    RPC_URL: hasFallback ? PROVIDER_URL : PUBLIC_URL,
    PUBLIC_RPC_URL: PUBLIC_URL,
    HAS_RPC_FALLBACK: hasFallback,
  }))
  await import('./solana-rpc')
  return createSolanaRpcFromTransport.mock.calls.at(-1)?.[0] as Transport
}

describe('solanaRpc transport', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    createDefaultRpcTransport.mockImplementation(({ url }: { url: string }) =>
      url === PROVIDER_URL ? primary : publicEndpoint,
    )
  })

  it('answers from the configured provider when it is working', async () => {
    const transport = await loadTransport(true)
    primary.mockResolvedValueOnce({ result: 42 })

    await expect(transport({ payload: { method: 'getBalance' } })).resolves.toEqual({ result: 42 })
    expect(publicEndpoint).not.toHaveBeenCalled()
  })

  /** The failure that matters: a bundled key is extractable, so an exhausted quota is expected. */
  it('falls back to the public endpoint when the provider fails', async () => {
    const transport = await loadTransport(true)
    primary.mockRejectedValueOnce(new Error('429 Too Many Requests'))
    publicEndpoint.mockResolvedValueOnce({ result: 42 })

    await expect(transport({ payload: { method: 'getBalance' } })).resolves.toEqual({ result: 42 })
    expect(publicEndpoint).toHaveBeenCalledOnce()
  })

  it('does not retry a request the caller already abandoned', async () => {
    const transport = await loadTransport(true)
    const controller = new AbortController()
    controller.abort()
    primary.mockRejectedValueOnce(new Error('aborted'))

    await expect(transport({ payload: {}, signal: controller.signal })).rejects.toThrow('aborted')
    expect(publicEndpoint).not.toHaveBeenCalled()
  })

  it('surfaces the failure when the public endpoint is down too', async () => {
    const transport = await loadTransport(true)
    primary.mockRejectedValueOnce(new Error('provider down'))
    publicEndpoint.mockRejectedValueOnce(new Error('public down'))

    await expect(transport({ payload: {} })).rejects.toThrow('public down')
  })

  /** With no provider configured both ends would be the same endpoint, so asking twice buys nothing. */
  it('builds a single transport when no provider is configured', async () => {
    await loadTransport(false)

    expect(createDefaultRpcTransport).toHaveBeenCalledOnce()
    expect(createDefaultRpcTransport).toHaveBeenCalledWith({ url: PUBLIC_URL })
  })
})
