import { describe, it, expect } from 'vitest'
import { evaluateCondition } from './formConditions'
import { applySchema, calculate, definitionFromSchema, fillEndpoint, validateData } from './formDefinition'

// the same rules as the backend (saas/core/forms) - the server decides again
const definition = {
  schema_version: '1.0',
  key: 'hotel.check_in',
  sections: [
    { key: 'guest', fields: [
      { name: 'full_name', type: 'text', required: true },
      { name: 'foreigner', type: 'boolean' },
      { name: 'passport', type: 'text', required_if: { field: 'foreigner', op: 'eq', value: true },
        visible_if: { field: 'foreigner', op: 'eq', value: true } }
    ] },
    { key: 'stay', fields: [
      { name: 'nights', type: 'integer', required: true, validators: [{ rule: 'min', value: 1 }] },
      { name: 'companions', type: 'repeater', max_items: 2, fields: [{ name: 'name', type: 'text', required: true }] }
    ] }
  ]
}

describe('conditions', () => {
  it('combine and only read data (no code)', () => {
    const data = { age: 17, country: 'MZ', tags: ['vip'], guest: { kind: 'adult' } }
    expect(evaluateCondition({ field: 'age', op: 'lt', value: 18 }, data)).toBe(true)
    expect(evaluateCondition({ all: [{ field: 'country', op: 'in', value: ['MZ'] }, { not: { field: 'tags', op: 'empty' } }] }, data)).toBe(true)
    expect(evaluateCondition({ field: 'guest.kind', op: 'eq', value: 'adult' }, data)).toBe(true)
    expect(evaluateCondition({ field: 'x', op: 'eval', value: 'alert(1)' }, data)).toBe(false)
    expect(evaluateCondition(null, data)).toBe(true)
  })
})

describe('validateData', () => {
  it('mirrors the server: required, required_if, rules, repeaters', () => {
    expect(validateData(definition, { foreigner: true, nights: 0, companions: [{ name: '' }, {}, {}] })).toEqual({
      full_name: ['This field is required.'],
      passport: ['This field is required.'],
      nights: ['Too small.'],
      'companions.0.name': ['This field is required.'],
      'companions.1.name': ['This field is required.'],
      'companions.2.name': ['This field is required.'],
      companions: ['Too many items.']
    })
    expect(validateData(definition, { full_name: 'Ana', foreigner: false, nights: 2 })).toEqual({})
  })

  it('calculates', () => {
    expect(calculate({ calculate: { op: 'product', of: ['nights', 'rate'] } }, { nights: 2, rate: '150.5' })).toBe(301)
    expect(calculate({ calculate: { op: 'concat', of: ['a', 'b'] } }, { a: 'Ana', b: 'Cossa' })).toBe('Ana Cossa')
  })
})

describe('Schema 1.0 compatibility', () => {
  const fields = [
    { name: 'id', type: 'UUIDField' },
    { name: 'nome', type: 'CharField', label: 'Name', required: true },
    { name: 'estado', type: 'CharField', choices: [{ value: 'a', label: 'Active' }] },
    { name: 'cliente', type: 'ForeignKey', label: 'Customer' }
  ]

  it('makes a schema form of the model fields', () => {
    const def = definitionFromSchema('sales.customer', fields)
    expect(def.sections[0].fields.map(f => [f.name, f.type, f.required])).toEqual([
      ['nome', 'text', true], ['estado', 'select', false], ['cliente', 'relation', false]
    ])
  })

  it('fills the from_schema fields of a hybrid form, keeping what the definition says', () => {
    const hybrid = applySchema({ sections: [{ key: 'm', fields: [{ name: 'nome', from_schema: true, label: 'Guest name' }, { name: 'notes', type: 'textarea' }] }] }, fields)
    expect(hybrid.sections[0].fields[0]).toMatchObject({ name: 'nome', type: 'text', required: true, label: 'Guest name' })
    expect(hybrid.sections[0].fields[1].type).toBe('textarea')
  })

  it('fills a workflow endpoint and refuses a missing parameter', () => {
    expect(fillEndpoint('hotel/stays/{id}/check_in/', { id: 'a b' })).toBe('hotel/stays/a%20b/check_in/')
    expect(() => fillEndpoint('hotel/stays/{id}/check_in/', {})).toThrow()
  })
})
