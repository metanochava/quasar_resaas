import { describe, it, expect } from 'vitest'
import { semanticValue, isEmitValue } from './choice'
import { resolveRules } from './schema'
import { toWriteValue } from './payload'

const OPTIONS = [{ label: 'Inherit', value: 'inherit' }, { label: 'Required', value: 'required' }]
const emit = { emitValue: true, options: OPTIONS }

describe('semanticValue - the inverse of what emit-value does when the user picks', () => {
  it('a string choice loaded as the READ object becomes the plain value', () => {
    expect(semanticValue({ id: 'required', value: 'required', label: 'Required' }, emit)).toBe('required')
  })

  it('an integer choice keeps its type', () => {
    expect(semanticValue({ id: 2, value: 2, label: 'Two' }, { emitValue: true, options: [] })).toBe(2)
    expect(typeof semanticValue({ id: 2, value: 2, label: 'Two' }, { emitValue: true })).toBe('number')
  })

  it('a boolean choice keeps false (falsy values are not lost)', () => {
    expect(semanticValue({ id: false, value: false, label: 'No' }, { emitValue: true })).toBe(false)
  })

  it('an object with only an id is unwrapped by id', () => {
    expect(semanticValue({ id: 5, label: 'Five' }, { emitValue: true })).toBe(5)
  })

  it('a value that is already plain is left exactly as it is', () => {
    expect(semanticValue('required', emit)).toBe('required')
    expect(semanticValue(3, emit)).toBe(3)
    expect(semanticValue(false, emit)).toBe(false)
  })

  it('null / undefined / empty string stay untouched (nullable and optional choices)', () => {
    expect(semanticValue(null, emit)).toBeNull()
    expect(semanticValue(undefined, emit)).toBeUndefined()
    expect(semanticValue('', emit)).toBe('')
  })

  it('a multiple selection is unwrapped item by item', () => {
    expect(semanticValue([{ value: 'a', label: 'A' }, { value: 'b', label: 'B' }, 'c'], { emitValue: true })).toEqual(['a', 'b', 'c'])
  })

  it('does NOTHING when the select is not in emit-value mode (relations keep their object)', () => {
    const relation = { id: 7, value: 7, label: 'Ana Costa' }

    expect(semanticValue(relation, { emitValue: false })).toBe(relation)
    expect(semanticValue(relation, {})).toBe(relation)
  })

  it('an object that IS one of the options\' own values stays intact', () => {
    const options = [{ label: 'Range', value: { value: 1, unit: 'kg' } }]

    expect(semanticValue({ value: 1, unit: 'kg' }, { emitValue: true, options })).toEqual({ value: 1, unit: 'kg' })
  })

  it('a File is never touched', () => {
    const file = new File(['x'], 'x.txt')

    expect(semanticValue(file, { emitValue: true })).toBe(file)
  })
})

describe('isEmitValue - the flag arrives camelCased, kebab-cased or bare', () => {
  it('reads every spelling', () => {
    expect(isEmitValue({ emitValue: true })).toBe(true)
    expect(isEmitValue({ 'emit-value': true })).toBe(true)
    expect(isEmitValue({ 'emit-value': '' })).toBe(true)
    expect(isEmitValue({ emitValue: false })).toBe(false)
    expect(isEmitValue({})).toBe(false)
  })
})

describe('the rules judge the value, never the API shape', () => {
  const [, max] = resolveRules([{ type: 'required', message: 'r' }, { type: 'max_length', value: 10, message: 'Maximum 10 characters' }])
  const READ = { id: 'required', value: 'required', label: 'Required' }

  it('max_length passes for the READ object of a short choice', () => {
    expect(max(READ)).toBe(true)
  })

  it('max_length still fails a genuinely too long value', () => {
    expect(max('a-value-that-is-far-too-long')).toBe('Maximum 10 characters')
    expect(max({ id: 'a-value-that-is-far-too-long', value: 'a-value-that-is-far-too-long', label: 'x' })).toBe('Maximum 10 characters')
  })

  it('min_length is measured on the value too', () => {
    const [min] = resolveRules([{ type: 'min_length', value: 3, message: 'Minimum 3' }])

    expect(min({ value: 'ab', label: 'Ab' })).toBe('Minimum 3')
    expect(min({ value: 'abc', label: 'Abc' })).toBe(true)
  })

  it('a number is measured by its digits, not as undefined', () => {
    expect(max(12345)).toBe(true)
  })
})

describe('toWriteValue - the one READ -> WRITE normaliser', () => {
  it('unwraps a choice, an id-only object and lists; leaves plain values', () => {
    expect(toWriteValue({ id: 'a', value: 'a', label: 'A' })).toBe('a')
    expect(toWriteValue({ id: 4, label: 'Four' })).toBe(4)
    expect(toWriteValue([{ value: 1 }, { value: 2 }])).toEqual([1, 2])
    expect(toWriteValue('x')).toBe('x')
    expect(toWriteValue(null)).toBeNull()
  })
})
