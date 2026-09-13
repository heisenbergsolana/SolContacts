/**
 * WCAG 2.1 contrast ratios.
 *
 * It lives here so the palette's accessibility claims are checked by a test rather than by eye. A
 * colour that drifts below 4.5:1 in one theme looks fine in review and is unreadable only to the
 * person who could least afford it.
 */

function channels(hex: string): [number, number, number] {
  const value = hex.replace('#', '')
  if (!/^[0-9a-fA-F]{6}$/.test(value)) throw new Error(`Not a six-digit hex colour: ${hex}`)

  return [0, 2, 4].map((offset) => parseInt(value.slice(offset, offset + 2), 16)) as [number, number, number]
}

/** Relative luminance, 0 for black and 1 for white. */
export function relativeLuminance(hex: string): number {
  const [r, g, b] = channels(hex).map((raw) => {
    const channel = raw / 255
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** Contrast between two opaque colours, from 1 (identical) to 21 (black on white). */
export function contrastRatio(foreground: string, background: string): number {
  const a = relativeLuminance(foreground)
  const b = relativeLuminance(background)
  const [lighter, darker] = a > b ? [a, b] : [b, a]
  return (lighter + 0.05) / (darker + 0.05)
}
