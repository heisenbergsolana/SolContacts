import { describe, expect, it } from 'vitest'
import { AppGradients, AppPalette, palettes } from '@/constants/app-styles'
import { GROUP_TONES } from '@/types/contact'
import { contrastRatio } from '@/utils/contrast'

/** WCAG AA for body text. Every string this app renders is body size or smaller. */
const MIN_TEXT = 4.5

/** WCAG AA for a control or graphic that has to be told apart from what is behind it. */
const MIN_NON_TEXT = 3

const SURFACES = ['bg', 'surface', 'surfaceAlt'] as const satisfies readonly (keyof AppPalette)[]
const MEANINGFUL_TEXT = ['accent', 'danger', 'warning'] as const satisfies readonly (keyof AppPalette)[]

/**
 * The accessibility claim in docs/05-UI-UX.md, checked rather than asserted.
 *
 * It has already caught one: the light theme's green was a 2.4:1 restatement of the dark theme's,
 * which is a decorative colour pretending to be a validation message.
 */
describe.each(['dark', 'light'] as const)('%s palette', (scheme) => {
  const palette = palettes[scheme]

  it.each(SURFACES)('reads primary text on %s', (surface) => {
    expect(contrastRatio(palette.text, palette[surface])).toBeGreaterThanOrEqual(MIN_TEXT)
  })

  it.each(SURFACES)('reads muted text on %s', (surface) => {
    expect(contrastRatio(palette.textMuted, palette[surface])).toBeGreaterThanOrEqual(MIN_TEXT)
  })

  it.each(MEANINGFUL_TEXT)('reads %s as text on a card', (token) => {
    expect(contrastRatio(palette[token], palette.surface)).toBeGreaterThanOrEqual(MIN_TEXT)
  })

  it.each(['primary', 'dangerSurface'] as const)('reads a button label on the %s fill', (fill) => {
    expect(contrastRatio(palette.textOnFill, palette[fill])).toBeGreaterThanOrEqual(MIN_TEXT)
  })

  it.each(['primary', 'dangerSurface'] as const)('separates the %s fill from the screen', (fill) => {
    expect(contrastRatio(palette[fill], palette.bg)).toBeGreaterThanOrEqual(MIN_NON_TEXT)
  })

  /** The epoch progress bar: a graphic, so it only has to be distinguishable from its track. */
  it('separates the progress fill from its track', () => {
    expect(contrastRatio(palette.accent, palette.surfaceAlt)).toBeGreaterThanOrEqual(MIN_NON_TEXT)
  })

  /**
   * A gradient has two ends and the label sits across both of them.
   *
   * Checking only the flat `primary` token would prove the button readable at one end of itself,
   * which is how a gradient ships with an unreadable half. Both constraints pull in opposite
   * directions — the label caps how light the fill may go, the screen caps how dark — so the pair
   * below is what keeps the primary gradient inside that band.
   */
  const PRIMARY_STOPS = [0, 1] as const

  it.each(PRIMARY_STOPS)('reads a button label on stop %i of the primary gradient', (stop) => {
    expect(contrastRatio(palette.textOnFill, palette.gradients.primary[stop])).toBeGreaterThanOrEqual(MIN_TEXT)
  })

  it.each(PRIMARY_STOPS)('separates stop %i of the primary gradient from the screen', (stop) => {
    expect(contrastRatio(palette.gradients.primary[stop], palette.bg)).toBeGreaterThanOrEqual(MIN_NON_TEXT)
  })

  const SURFACE_GRADIENTS = ['card', 'cardPressed', 'bar'] as const satisfies readonly (keyof AppGradients)[]

  const SURFACE_STOPS = SURFACE_GRADIENTS.flatMap((name) => PRIMARY_STOPS.map((stop) => [name, stop] as const))

  it.each(SURFACE_STOPS)('reads primary text on the %s gradient at stop %i', (name, stop) => {
    expect(contrastRatio(palette.text, palette.gradients[name][stop])).toBeGreaterThanOrEqual(MIN_TEXT)
  })

  it.each(SURFACE_STOPS)('reads muted text on the %s gradient at stop %i', (name, stop) => {
    expect(contrastRatio(palette.textMuted, palette.gradients[name][stop])).toBeGreaterThanOrEqual(MIN_TEXT)
  })

  /**
   * A group tone is a label, not a decoration — it is the only thing telling two chips apart — so it
   * is held to the text threshold on every background a chip can land on, cards included.
   */
  const CHIP_BACKGROUNDS = [
    ['surface', palette.surface],
    ['surfaceAlt', palette.surfaceAlt],
    ['the card gradient at stop 0', palette.gradients.card[0]],
    ['the card gradient at stop 1', palette.gradients.card[1]],
  ] as const

  const TONE_CASES = GROUP_TONES.flatMap((tone) =>
    CHIP_BACKGROUNDS.map(([where, colour]) => [tone, where, colour] as const),
  )

  it.each(TONE_CASES)('reads the %s group tone on %s', (tone, _where, colour) => {
    expect(contrastRatio(palette.tones[tone], colour)).toBeGreaterThanOrEqual(MIN_TEXT)
  })
})
