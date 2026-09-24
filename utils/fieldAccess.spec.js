import { describe, it, expect } from 'vitest'
import { fieldAccess, applyFieldAccess } from './fieldAccess.js'

const salary = {
  name: 'salary',
  type: 'DecimalField',
  required: true,
  props: { label: 'Salary', rules: [() => true] },
  permissions: { view: 'view_contract_salary', change: 'change_contract_salary' }
}
const startDate = { name: 'start_date', type: 'DateField', props: { label: 'Start date' } }

const canOnly = (...perms) => perm => perms.includes(perm)

describe('fieldAccess', () => {
  it('a field without permissions is always viewable and changeable', () => {
    expect(fieldAccess(startDate, () => false)).toEqual({ view: true, change: true })
  })

  it('change falls back to the view permission when the schema declares none', () => {
    const f = { name: 'x', permissions: { view: 'view_x' } }
    expect(fieldAccess(f, canOnly('view_x'))).toEqual({ view: true, change: true })
    expect(fieldAccess(f, canOnly())).toEqual({ view: false, change: false })
  })

  it('fails closed when no permission checker is given', () => {
    expect(fieldAccess(salary, undefined)).toEqual({ view: false, change: false })
  })
})

describe('applyFieldAccess', () => {
  it('keeps a restricted field untouched when the user holds both permissions', () => {
    const out = applyFieldAccess([startDate, salary], canOnly('view_contract_salary', 'change_contract_salary'))
    expect(out).toEqual([startDate, salary])
  })

  it('removes the field when the user can neither view nor change it', () => {
    const out = applyFieldAccess([startDate, salary], canOnly())
    expect(out.map(f => f.name)).toEqual(['start_date'])
  })

  it('makes the field read_only (no rules, never sent) without the change permission', () => {
    const [, out] = applyFieldAccess([startDate, salary], canOnly('view_contract_salary'))
    expect(out.read_only).toBe(true)
    expect(out.props.readonly).toBe(true)
    expect(out.props.rules).toEqual([])
    expect(out.props.label).toBe('Salary')
  })

  it('makes the field write_only without the view permission', () => {
    const [, out] = applyFieldAccess([startDate, salary], canOnly('change_contract_salary'))
    expect(out.write_only).toBe(true)
    expect(out.read_only).toBeUndefined()
  })

  it('never mutates the schema fields it receives', () => {
    applyFieldAccess([salary], canOnly('view_contract_salary'))
    expect(salary.read_only).toBeUndefined()
    expect(salary.props.readonly).toBeUndefined()
  })
})
