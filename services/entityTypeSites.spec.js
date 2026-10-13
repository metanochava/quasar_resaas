import { describe, it, expect, beforeEach, vi } from 'vitest'
import { registerEntityTypeSite, getEntityTypeSite, clearEntityTypeSites } from './entityTypeSites'

describe('entityTypeSites registry', () => {
  beforeEach(() => clearEntityTypeSites())

  it('finds a registered site by EntityType name, case-insensitive', () => {
    const loader = () => Promise.resolve({})
    registerEntityTypeSite('Saude', loader)
    expect(getEntityTypeSite('saude')).toBe(loader)
    expect(getEntityTypeSite(' SAUDE ')).toBe(loader)
  })

  it('returns null for a type without a site', () => {
    expect(getEntityTypeSite('Seguradora')).toBeNull()
    expect(getEntityTypeSite(null)).toBeNull()
  })

  it('ignores a registration without name or loader', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    registerEntityTypeSite('', () => {})
    registerEntityTypeSite('Saude', 'not a function')
    expect(getEntityTypeSite('saude')).toBeNull()
    expect(warn).toHaveBeenCalledTimes(2)
    warn.mockRestore()
  })
})
