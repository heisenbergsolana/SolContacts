import { describe, expect, it } from 'vitest'
import { VALID_ADDRESSES } from '@/test/fixtures'
import { explorerAddressUrl, explorerTransactionUrl } from './solana-explorer'

describe('explorerAddressUrl', () => {
  it('omits the cluster parameter on mainnet', () => {
    expect(explorerAddressUrl(VALID_ADDRESSES[0], 'mainnet-beta')).toBe(
      `https://explorer.solana.com/address/${VALID_ADDRESSES[0]}`,
    )
  })

  it('includes the cluster parameter everywhere else', () => {
    expect(explorerAddressUrl(VALID_ADDRESSES[0], 'devnet')).toBe(
      `https://explorer.solana.com/address/${VALID_ADDRESSES[0]}?cluster=devnet`,
    )
  })

  it('trims whitespace so a pasted address does not break the URL', () => {
    expect(explorerAddressUrl(`  ${VALID_ADDRESSES[1]}  `, 'mainnet-beta')).toBe(
      `https://explorer.solana.com/address/${VALID_ADDRESSES[1]}`,
    )
  })
})

describe('explorerTransactionUrl', () => {
  const SIGNATURE = '5VERv8NMvzbJMEkV8xnrLkEaWRtSz9CosKDYjCJjBRnbJLgp8uirBgmQpjKhoR4tjF3ZpRzrFmBV6UjKdiSZkQUW'

  it('links to a mainnet transaction without a cluster parameter', () => {
    expect(explorerTransactionUrl(SIGNATURE, 'mainnet-beta')).toBe(`https://explorer.solana.com/tx/${SIGNATURE}`)
  })

  it('names the cluster for anything but mainnet', () => {
    expect(explorerTransactionUrl(SIGNATURE, 'devnet')).toBe(
      `https://explorer.solana.com/tx/${SIGNATURE}?cluster=devnet`,
    )
  })

  it('trims a signature that arrived with whitespace', () => {
    expect(explorerTransactionUrl(`  ${SIGNATURE}  `, 'mainnet-beta')).toBe(
      `https://explorer.solana.com/tx/${SIGNATURE}`,
    )
  })
})
