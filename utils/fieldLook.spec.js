import { describe, it, expect } from 'vitest'
import { fieldLook } from './fieldLook'

describe('fieldLook: every field looks the same, from the backend', () => {
  it('the LayoutSetting style and density, and the hint / error line reserved', () => {
    expect(fieldLook({}, { field_style: 'filled', dense: true })).toEqual({
      dense: true, outlined: false, filled: true, standout: false, borderless: false, bottomSlots: true,
    })
  })

  it('no setting: outlined, not dense', () => {
    const look = fieldLook({}, {})
    expect(look.outlined).toBe(true)
    expect(look.dense).toBe(false)
  })

  it('the component\'s own attributes win (inline code)', () => {
    const look = fieldLook({ standout: 'bg-primary text-white', dense: false, 'hide-bottom-space': '' }, { field_style: 'filled', dense: true })
    expect(look.standout).toBe('bg-primary text-white')
    expect(look.filled).toBe(false)
    expect(look.dense).toBe(false)
    expect(look.bottomSlots).toBe(false)
    expect(fieldLook({ borderless: '' }, { field_style: 'outlined' }).borderless).toBe(true)
  })
})
