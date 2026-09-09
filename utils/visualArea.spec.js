import { describe, it, expect } from 'vitest'
import { backgroundConfigToStyle, interfaceConfigToStyle, overlayStyle } from './visualArea'

describe('backgroundConfigToStyle', () => {
  it('returns a fallback color when there is no config', () => {
    expect(backgroundConfigToStyle(null, { fallbackColor: '#111' })).toEqual({ backgroundColor: '#111' })
  })

  it('renders a color background', () => {
    expect(backgroundConfigToStyle({ type: 'color', value: '#ff0000' })).toEqual({ backgroundColor: '#ff0000' })
  })

  it('renders a gradient background as a raw CSS value', () => {
    expect(backgroundConfigToStyle({ type: 'gradient', value: 'linear-gradient(0deg, #000, #fff)' }))
      .toEqual({ background: 'linear-gradient(0deg, #000, #fff)' })
  })

  it('renders an image background with cover/center/no-repeat', () => {
    expect(backgroundConfigToStyle({ type: 'image', value: '/media/x.png' })).toEqual({
      backgroundImage: 'url("/media/x.png")',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
    })
  })

  it('renders transparent regardless of value', () => {
    expect(backgroundConfigToStyle({ type: 'transparent', value: null })).toEqual({ backgroundColor: 'transparent' })
  })

  it('falls back when type is set but value is empty', () => {
    expect(backgroundConfigToStyle({ type: 'gradient', value: '' }, { fallbackColor: '#222' }))
      .toEqual({ backgroundColor: '#222' })
  })
})

describe('interfaceConfigToStyle', () => {
  it('combines background and text color', () => {
    const style = interfaceConfigToStyle({
      background: { type: 'color', value: '#ff0000' },
      overlay: 0.3,
      text_color: '#ffffff',
    })
    expect(style).toEqual({ backgroundColor: '#ff0000', color: '#ffffff' })
  })

  it('omits color when text_color is not set', () => {
    const style = interfaceConfigToStyle({ background: { type: 'color', value: '#ff0000' }, overlay: 0, text_color: null })
    expect(style).toEqual({ backgroundColor: '#ff0000' })
  })
})

describe('overlayStyle', () => {
  it('returns null for falsy overlay', () => {
    expect(overlayStyle(0)).toBeNull()
    expect(overlayStyle(null)).toBeNull()
    expect(overlayStyle(undefined)).toBeNull()
  })

  it('returns an absolutely positioned dark layer for a truthy overlay', () => {
    const style = overlayStyle(0.4)
    expect(style.opacity).toBe(0.4)
    expect(style.position).toBe('absolute')
    expect(style.pointerEvents).toBe('none')
  })
})
