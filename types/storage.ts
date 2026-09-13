/**
 * The subset of AsyncStorage this app uses.
 *
 * Narrow on purpose: it is trivial to fake in a test, and it keeps every feature that persists
 * something honest about how little it needs.
 */
export interface KeyValueStorage {
  getItem(key: string): Promise<string | null>
  setItem(key: string, value: string): Promise<void>
}
