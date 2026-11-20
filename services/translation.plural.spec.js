import { describe, it, expect, vi } from 'vitest'

const lang = vi.hoisted(() => ({ code: 'en-us' }))
vi.mock('../stores/LanguageStore', () => ({ useLanguageStore: () => ({ TraducaoMap: {} }) }))
vi.mock('../stores/UserStore', () => ({ useUserStore: () => ({ Language: lang }) }))

import { toPlural } from './translation'

describe('toPlural - a menu label in the plural, never twice', () => {
  it('English (en-us): a plural stays, a singular follows the rules', () => {
    lang.code = 'en-us'
    expect(toPlural('Sales')).toBe('Sales')
    expect(toPlural('Purchase orders')).toBe('Purchase orders')
    expect(toPlural('Printers')).toBe('Printers')
    expect(toPlural('Categories')).toBe('Categories')
    expect(toPlural('Customer')).toBe('Customers')
    expect(toPlural('Branch')).toBe('Branches')
    expect(toPlural('Class')).toBe('Classes')
    expect(toPlural('Entity')).toBe('Entities')
    expect(toPlural('Purchase order')).toBe('Purchase orders')
    expect(toPlural('Person')).toBe('People')
  })

  it('Portuguese (pt-pt)', () => {
    lang.code = 'pt-pt'
    expect(toPlural('Vendas')).toBe('Vendas')
    expect(toPlural('Cliente')).toBe('Clientes')
    expect(toPlural('Filial')).toBe('Filiais')
    // several words: as the translator wrote them
    expect(toPlural('Ordem de compra')).toBe('Ordem de compra')
    expect(toPlural('Tabs do telemóvel')).toBe('Tabs do telemóvel')
    expect(toPlural('Impressoras')).toBe('Impressoras')
    expect(toPlural('Acção')).toBe('Acções')
  })

  it('one is singular', () => {
    expect(toPlural('Customer', 1)).toBe('Customer')
  })
})
