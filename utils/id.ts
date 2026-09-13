/** Byte → two-digit hex, precomputed so id generation is a lookup rather than a format call. */
const HEX = Array.from({ length: 256 }, (_, index) => (index + 0x100).toString(16).slice(1))

/**
 * A RFC 4122 version 4 UUID.
 *
 * Built from `crypto.getRandomValues` rather than `crypto.randomUUID()` on purpose: this app
 * polyfills crypto twice over (react-native-quick-crypto at the entry point and
 * react-native-get-random-values as a dependency), and `getRandomValues` is the primitive both are
 * guaranteed to provide. `randomUUID` is not universally present across those runtimes, and a
 * single code path is one less thing that can behave differently on device than in tests.
 */
export function createId(): string {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)

  // Pin the version (4) and variant (10xx) bits required by RFC 4122.
  bytes[6] = (bytes[6] & 0x0f) | 0x40
  bytes[8] = (bytes[8] & 0x3f) | 0x80

  const hex = Array.from(bytes, (byte) => HEX[byte])

  return [
    hex.slice(0, 4).join(''),
    hex.slice(4, 6).join(''),
    hex.slice(6, 8).join(''),
    hex.slice(8, 10).join(''),
    hex.slice(10, 16).join(''),
  ].join('-')
}
