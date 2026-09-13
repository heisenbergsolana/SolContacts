import { describe, expect, it } from 'vitest'
import { VALID_ADDRESSES } from '@/test/fixtures'
import { parseQrPayload } from './qr-payload'
import { isValidSolanaAddress } from './solana-address'

const ADDRESS = VALID_ADDRESSES[2]

describe('parseQrPayload', () => {
  it('accepts a bare address', () => {
    expect(parseQrPayload(ADDRESS)).toBe(ADDRESS)
  })

  it('tolerates surrounding whitespace', () => {
    expect(parseQrPayload(`  ${ADDRESS}\n`)).toBe(ADDRESS)
  })

  it('unwraps a solana: URI', () => {
    expect(parseQrPayload(`solana:${ADDRESS}`)).toBe(ADDRESS)
  })

  it('accepts the scheme in any case', () => {
    expect(parseQrPayload(`SOLANA:${ADDRESS}`)).toBe(ADDRESS)
  })

  it('discards Solana Pay parameters', () => {
    expect(parseQrPayload(`solana:${ADDRESS}?amount=1.5&label=Alex&message=hi`)).toBe(ADDRESS)
  })

  it.each([
    `https://explorer.solana.com/address/${ADDRESS}`,
    `https://explorer.solana.com/address/${ADDRESS}?cluster=devnet`,
    `https://solscan.io/account/${ADDRESS}`,
    `https://solana.fm/address/${ADDRESS}`,
  ])('extracts the address from %s', (url) => {
    expect(parseQrPayload(url)).toBe(ADDRESS)
  })

  /**
   * A Solana Pay transaction request points at a merchant server rather than naming a recipient.
   * Partially honouring it — saving the URL, or the domain — would put something in the contact
   * book that is not a wallet.
   */
  it('refuses a Solana Pay transaction request', () => {
    expect(parseQrPayload('solana:https://merchant.example/pay?id=1')).toBeNull()
  })

  it.each([
    '',
    '   ',
    'solana:',
    'hello world',
    'https://example.com',
    'https://explorer.solana.com/tx/5xyz',
    'bitcoin:1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
    '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
    'wifi:S:MyNetwork;T:WPA;P:secret;;',
  ])('rejects %p', (payload) => {
    expect(parseQrPayload(payload)).toBeNull()
  })

  it('rejects text that merely contains an address among other words', () => {
    expect(parseQrPayload(`pay me at ${ADDRESS} thanks`)).toBeNull()
  })

  /**
   * Parsing does not vouch for the result. This payload is base58-shaped and the wrong length, so
   * the parser hands it on and validation is what turns it away — the division of labour the
   * scanner screen depends on.
   */
  it('returns candidates that validation still has to approve', () => {
    const tooShort = '1'.repeat(33)
    expect(parseQrPayload(tooShort)).toBe(tooShort)
    expect(isValidSolanaAddress(tooShort)).toBe(false)
  })

  it('produces a value that validates for every accepted form', () => {
    for (const payload of [ADDRESS, `solana:${ADDRESS}`, `https://explorer.solana.com/address/${ADDRESS}`]) {
      const parsed = parseQrPayload(payload)
      expect(parsed).not.toBeNull()
      expect(isValidSolanaAddress(parsed as string)).toBe(true)
    }
  })
})
