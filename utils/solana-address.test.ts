import { describe, expect, it } from 'vitest'
import { INVALID_ADDRESSES, VALID_ADDRESSES } from '@/test/fixtures'
import { isValidSolanaAddress } from './solana-address'

describe('isValidSolanaAddress', () => {
  it.each(VALID_ADDRESSES)('accepts %s', (address) => {
    expect(isValidSolanaAddress(address)).toBe(true)
  })

  it.each(INVALID_ADDRESSES)('rejects %s', (address) => {
    expect(isValidSolanaAddress(address)).toBe(false)
  })

  it('tolerates surrounding whitespace, which pasting often adds', () => {
    expect(isValidSolanaAddress(`  ${VALID_ADDRESSES[0]}  `)).toBe(true)
  })

  it('rejects an Ethereum address', () => {
    expect(isValidSolanaAddress('0x71C7656EC7ab88b098defB751B7401B5f6d8976F')).toBe(false)
  })

  it.each(['0', 'O', 'I', 'l'])('rejects an address containing the non-base58 character %s', (char) => {
    const address = char.repeat(32)
    expect(isValidSolanaAddress(address)).toBe(false)
  })
})
