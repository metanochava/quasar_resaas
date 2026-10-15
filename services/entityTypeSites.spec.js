import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  registerEntityTypeSite, getEntityTypeSite, clearEntityTypeSites,
  registerEntityTypeSiteContent, getEntityTypeSiteContent
} from './entityTypeSites'

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

describe('entityTypeSites content registry (code, not database)', () => {
  beforeEach(() => clearEntityTypeSites())

  it('finds the registered content by EntityType name, case-insensitive', () => {
    const content = { layout: 'split', hero: { title: 'Hello' } }
    registerEntityTypeSiteContent('Farmacia', content)
    expect(getEntityTypeSiteContent('farmacia')).toBe(content)
    expect(getEntityTypeSiteContent(' FARMACIA ')).toBe(content)
    expect(getEntityTypeSiteContent('Saude')).toBeNull()
  })

  it('refuses a registration without name or without an object', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    registerEntityTypeSiteContent('', {})
    registerEntityTypeSiteContent('Saude', null)
    registerEntityTypeSiteContent('Saude', ['not', 'an', 'object'])
    expect(getEntityTypeSiteContent('saude')).toBeNull()
    expect(warn).toHaveBeenCalledTimes(3)
    warn.mockRestore()
  })

  it('clearEntityTypeSites drops bodies and contents', () => {
    registerEntityTypeSite('Saude', () => Promise.resolve({}))
    registerEntityTypeSiteContent('Saude', { hero: {} })
    clearEntityTypeSites()
    expect(getEntityTypeSite('saude')).toBeNull()
    expect(getEntityTypeSiteContent('saude')).toBeNull()
  })
})
