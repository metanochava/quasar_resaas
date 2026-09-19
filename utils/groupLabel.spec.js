import { describe, it, expect, vi } from 'vitest'

vi.mock('../services/translation', () => ({
  tdc: (text) => ({ Root: 'Raiz', 'Registered Nurse': 'Enfermeiro' }[text] || text)
}))

import { groupLabel } from './groupLabel'

describe('groupLabel', () => {
  it('translates the name of a group object', () => {
    expect(groupLabel({ id: '1', name: 'Root' })).toBe('Raiz')
    expect(groupLabel({ name: 'Registered Nurse' })).toBe('Enfermeiro')
  })
  it('falls back to label, then value, and accepts a plain string', () => {
    expect(groupLabel({ label: 'Root' })).toBe('Raiz')
    expect(groupLabel({ value: 'Root' })).toBe('Raiz')
    expect(groupLabel('Root')).toBe('Raiz')
  })
  it('keeps the legacy "<prefix>_<name>" convention of profileSplint', () => {
    expect(groupLabel({ name: 'saude_Root' })).toBe('Raiz')
  })
  it('is empty (not "undefined") without a group', () => {
    expect(groupLabel(null)).toBe('')
    expect(groupLabel({})).toBe('')
  })
  it('leaves an untranslated custom group name as typed', () => {
    expect(groupLabel({ name: 'My Custom Team' })).toBe('My Custom Team')
  })
})
