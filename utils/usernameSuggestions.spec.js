import { describe, it, expect } from 'vitest'

import {
  isValidUsername, nameWords, normalizeUsername, numberedUsernames, readableUsernames,
  usernameSuggestions, USERNAME_MAX_LENGTH
} from './usernameSuggestions'

describe('username suggestions', () => {
  it('builds readable forms from first name and surname, best first', () => {
    expect(readableUsernames('Dias Chavana').slice(0, 5)).toEqual([
      'dias.chavana', 'diaschavana', 'dias_chavana', 'dchavana', 'chavana.dias'
    ])
  })

  it('uses the middle name initial for extra readable forms', () => {
    const list = readableUsernames('Dias Manuel Chavana')
    expect(list).toContain('dias.m.chavana')
    expect(list).toContain('diaschavana.m')
    expect(list[0]).toBe('dias.chavana')
  })

  it('removes accents and special characters, splits hyphens and drops connectors', () => {
    expect(nameWords('João  da Silva-Costa')).toEqual(['joao', 'silva', 'costa'])
    expect(readableUsernames("Zé d'Ávila")[0]).toBe('ze.avila')
  })

  it('is deterministic', () => {
    expect(usernameSuggestions('Ana Maria Cossa')).toEqual(usernameSuggestions('Ana Maria Cossa'))
  })

  it('handles one word, repeated words and names with nothing usable', () => {
    expect(readableUsernames('Dias')).toEqual(['dias'])
    expect(readableUsernames('Dias Dias')[0]).toBe('dias')
    expect(readableUsernames('Al')).toEqual([])        // too short for a username
    expect(readableUsernames('***')).toEqual([])
    expect(usernameSuggestions('')).toEqual([])
  })

  it('every suggestion follows the backend rules, with no duplicates', () => {
    for (const name of ['Dias Chavana', 'Maria José dos Santos Pereira', 'A B', 'Ñandú Öztürk', 'x'.repeat(60) + ' y']) {
      const list = usernameSuggestions(name)
      expect(new Set(list).size).toBe(list.length)
      for (const value of list) {
        expect(isValidUsername(value)).toBe(true)
        expect(value.length).toBeLessThanOrEqual(USERNAME_MAX_LENGTH)
      }
    }
  })

  it('never uses long digit runs: numbers only as a short last-resort counter', () => {
    const list = usernameSuggestions('Dias Chavana')
    for (const value of list) expect(value).not.toMatch(/\d{3,}/)
    expect(list.slice(-3)).toEqual(['dias.chavana2', 'dias.chavana3', 'dias.chavana4'])
    expect(numberedUsernames('')).toEqual([])
  })

  it('validates like the backend', () => {
    expect(normalizeUsername('  Dias.Chavana ')).toBe('dias.chavana')
    for (const bad of ['258840000000', 'ab', '1dias', 'dias..chavana', 'dias.', 'dias chavana', 'dias@x', 'a'.repeat(31)]) {
      expect(isValidUsername(bad)).toBe(false)
    }
    expect(isValidUsername('dias_chavana2')).toBe(true)
  })
})
