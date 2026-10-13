import { describe, it, expect } from 'vitest'
import { entityTypeKey, findEntityType, entityTypeUrl } from './entityTypeHost'

const at = (href) => new URL(href)
const types = [{ id: 1, name: 'Saude' }, { id: 2, name: 'Seguradora' }]

describe('entityTypeHost', () => {
  it('reads the EntityType from the first subdomain label, skipping www', () => {
    expect(entityTypeKey(at('https://saude.dev.example.com/#/'))).toBe('saude')
    expect(entityTypeKey(at('https://www.saude.example.com/'))).toBe('saude')
  })

  it('reads it from the first path segment on an IP address', () => {
    expect(entityTypeKey(at('http://10.0.0.1:9000/saude/#/'))).toBe('saude')
    expect(entityTypeKey(at('http://10.0.0.1:9000/'))).toBe('')
  })

  it('matches the catalogue by name, case-insensitive, or null', () => {
    expect(findEntityType(types, at('https://saude.example.com/'))).toEqual(types[0])
    expect(findEntityType(types, at('https://farmacia.example.com/'))).toBeNull()
    expect(findEntityType([], at('https://saude.example.com/'))).toBeNull()
  })

  it('builds the address of another type on the same installation', () => {
    expect(entityTypeUrl(types[1], at('https://saude.dev.example.com/#/'))).toBe('https://seguradora.dev.example.com/')
    expect(entityTypeUrl(types[1], at('http://10.0.0.1:9000/saude/#/x'))).toBe('http://10.0.0.1:9000/Seguradora/')
  })
})
