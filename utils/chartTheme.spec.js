import { describe, it, expect } from 'vitest'

import { FALLBACK_PALETTE, chartColors, chartSurface, resolveColor } from './chartTheme'

const THEME = {
  primary: '#123456', secondary: '#654321', accent: '#aa00aa', info: '#00aaff',
  positive: '#00aa00', warning: '#ffaa00', negative: '#dd0000', card: '#fafafa', text_secondary: '#444444'
}

describe('chartTheme', () => {
  it('series colours are the Theme colours, in a fixed order', () => {
    expect(chartColors(THEME).slice(0, 7)).toEqual(['#123456', '#654321', '#aa00aa', '#00aaff', '#00aa00', '#ffaa00', '#dd0000'])
  })

  it('a colour missing from the Theme falls back to the validated palette, never a generated one', () => {
    const colors = chartColors({ primary: '#123456' })
    expect(colors[0]).toBe('#123456')
    expect(colors[1]).toBe(FALLBACK_PALETTE.light[1])
    expect(chartColors({}, true)[0]).toBe(FALLBACK_PALETTE.dark[0])
  })

  it('a series can ask for a semantic (status) colour of the Theme, or a literal colour', () => {
    expect(resolveColor(THEME, 'negative')).toBe('#dd0000')
    expect(resolveColor(THEME, 'positive')).toBe('#00aa00')
    expect(resolveColor(THEME, '#010203')).toBe('#010203')
    expect(resolveColor(THEME, '')).toBeNull()
  })

  it('ink and surface follow the Theme in light mode and stay legible in dark mode', () => {
    expect(chartSurface(THEME)).toMatchObject({ text: '#444444', surface: '#fafafa' })
    expect(chartSurface(THEME, true).text).toMatch(/^rgba\(255, 255, 255/)
  })
})
