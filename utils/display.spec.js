import { describe, it, expect } from 'vitest'
import { displayValue, rawValue } from './display'

describe('displayValue', () => {
  it('prefers label, then value, then id', () => {
    expect(displayValue({ id: 'M', value: 'M', label: 'Masculine' })).toBe('Masculine')
    expect(displayValue({ id: 'x', value: 'v' })).toBe('v')
    expect(displayValue({ id: 'only-id' })).toBe('only-id')
  })
  it('never prints an object: all-null choice is empty', () => {
    expect(displayValue({ id: null, value: null, label: null })).toBe('')
  })
  it('passes plain values through', () => {
    expect(displayValue('India')).toBe('India')
    expect(displayValue(null)).toBe('')
    expect(rawValue({ value: 'M', label: 'Masculine' })).toBe('M')
  })
})
