import { describe, it, expect } from 'vitest'
import { parseFieldErrors, buildErrorMessage } from './alerts'

describe('parseFieldErrors - DRF validation error bodies become {field: "message"}', () => {
  it('collapses a single-message array per field, never leaving the array itself', () => {
    const result = parseFieldErrors({
      name: ['This field is required.'],
      email: ['Enter a valid email address.'],
    })

    expect(result).toEqual({
      name: 'This field is required.',
      email: 'Enter a valid email address.',
    })
    expect(Array.isArray(result.name)).toBe(false)
  })

  it('joins multiple messages for the same field into one string', () => {
    const result = parseFieldErrors({
      password: ['Too short.', 'Must contain a number.'],
    })

    expect(result.password).toBe('Too short. Must contain a number.')
  })

  it('flattens one level of nested serializer errors (e.g. a nested address)', () => {
    const result = parseFieldErrors({
      address: { country_code: ['Invalid data. Expected a dictionary, but got str.'] },
    })

    expect(result.address).toBe('Invalid data. Expected a dictionary, but got str.')
  })

  it('accepts a plain string per field, not just arrays', () => {
    const result = parseFieldErrors({ name: 'Already taken.' })
    expect(result.name).toBe('Already taken.')
  })

  it('excludes the reserved alert_*/detail keys - those are for the toast, not a field', () => {
    const result = parseFieldErrors({
      detail: 'Not found.',
      alert_error: 'Something went wrong.',
      name: ['Required.'],
    })

    expect(result).toEqual({ name: 'Required.' })
  })

  it('returns an empty object for non-dict bodies (string/array/null/undefined)', () => {
    expect(parseFieldErrors('plain string')).toEqual({})
    expect(parseFieldErrors(['a', 'b'])).toEqual({})
    expect(parseFieldErrors(null)).toEqual({})
    expect(parseFieldErrors(undefined)).toEqual({})
  })
})

describe('buildErrorMessage - one readable summary for the toast', () => {
  it('prefers detail when present', () => {
    expect(buildErrorMessage({ detail: 'Not found.' })).toBe('Not found.')
  })

  it('prefers alert_error over field errors', () => {
    expect(buildErrorMessage({
      alert_error: 'Custom failure.',
      name: ['Required.'],
    })).toBe('Custom failure.')
  })

  it('joins field errors as "field: message" pairs when there is no detail/alert_error', () => {
    const message = buildErrorMessage({
      name: ['This field is required.'],
      email: ['Enter a valid email address.'],
    })

    expect(message).toBe('name: This field is required. | email: Enter a valid email address.')
  })

  it('never renders "[object Object]" for a validation error body', () => {
    const message = buildErrorMessage({ name: ['This field is required.'] })
    expect(message).not.toContain('[object Object]')
  })

  it('passes a plain string body through untouched', () => {
    expect(buildErrorMessage('Server exploded.')).toBe('Server exploded.')
  })

  it('flattens a plain array body', () => {
    expect(buildErrorMessage(['Bad request.'])).toBe('Bad request.')
  })

  it('returns an empty string for an empty/unrecognized body', () => {
    expect(buildErrorMessage({})).toBe('')
    expect(buildErrorMessage(null)).toBe('')
  })
})
