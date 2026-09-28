import { describe, it, expect } from 'vitest'

import { highlightSegments, matchesSearch, normalizeSearch } from './highlight'

describe('highlight', () => {
  it('matches ignoring case and accents', () => {
    expect(matchesSearch('Médico Geral', 'medico')).toBe(true)
    expect(matchesSearch('Farmácia', 'FARMA')).toBe(true)
    expect(matchesSearch('Stock', 'venda')).toBe(false)
  })

  it('an empty search matches nothing (the caller shows everything)', () => {
    expect(matchesSearch('Anything', '')).toBe(false)
    expect(matchesSearch('Anything', '   ')).toBe(false)
    expect(normalizeSearch('  Ação ')).toBe('acao')
  })

  it('splits the original text, keeping its accents, around every match', () => {
    expect(highlightSegments('Médico e medicação', 'medic')).toEqual([
      { text: 'Médic', match: true },
      { text: 'o e ', match: false },
      { text: 'medic', match: true },
      { text: 'ação', match: false }
    ])
  })

  it('without a search the text is one plain segment', () => {
    expect(highlightSegments('view_paciente', '')).toEqual([{ text: 'view_paciente', match: false }])
    expect(highlightSegments('', 'x')).toEqual([])
  })
})
