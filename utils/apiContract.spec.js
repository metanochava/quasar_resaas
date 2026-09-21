import { describe, it, expect } from 'vitest'
import {
  LEVELS, levelToQuasar, normalizeAlerts, normalizeError, parseFieldErrors, buildErrorMessage, errorMessage, errorCode
} from './apiContract'

describe('levels', () => {
  it('the backend vocabulary is success / info / warning / error', () => {
    expect(LEVELS).toEqual(['success', 'info', 'warning', 'error'])
  })

  it('maps to Quasar on the client only', () => {
    expect(levelToQuasar('success')).toBe('positive')
    expect(levelToQuasar('error')).toBe('negative')
    expect(levelToQuasar('warning')).toBe('warning')
    expect(levelToQuasar('info')).toBe('info')
    expect(levelToQuasar('nonsense')).toBe('info')
  })
})

describe('normalizeError - the contract', () => {
  it('reads message, code and details', () => {
    const error = normalizeError({ error: { code: 'group_already_assigned', message: 'Already assigned.', details: null } })

    expect(error).toMatchObject({ code: 'group_already_assigned', message: 'Already assigned.', details: null, validation: false })
  })

  it('a missing code stays null - it is never invented', () => {
    expect(normalizeError({ error: { message: 'Not found.', details: null } }).code).toBeNull()
  })

  it('validation details are turned into one string per field', () => {
    const error = normalizeError({
      error: { message: 'Please correct the highlighted fields.', details: { email: ['Taken.', 'Invalid.'], mobile: ['Bad number.'] } }
    })

    expect(error.fields).toEqual({ email: 'Taken. Invalid.', mobile: 'Bad number.' })
    expect(error.validation).toBe(true)
    expect(error.message).toBe('Please correct the highlighted fields.')
  })

  it('does not read a status from the body', () => {
    expect(normalizeError({ error: { message: 'x' } })).not.toHaveProperty('status')
  })
})

describe('normalizeError - deprecated shapes are still understood', () => {
  it('{detail, code}', () => {
    expect(normalizeError({ detail: 'Nope.', code: 'permission_denied' })).toMatchObject({ code: 'permission_denied', message: 'Nope.' })
  })

  it('alert_error', () => {
    expect(normalizeError({ alert_error: 'Boom.' }).message).toBe('Boom.')
  })

  it('a bare field map', () => {
    const error = normalizeError({ name: ['Required.'] })

    expect(error.fields).toEqual({ name: 'Required.' })
    expect(error.validation).toBe(true)
    expect(error.message).toBe('name: Required.')
  })

  it('DRF NON_FIELD_ERRORS_KEY "error" as a list is a legacy message, not the contract', () => {
    expect(normalizeError({ error: ['Passwords do not match.'] }).message).toBe('Passwords do not match.')
  })

  it('nothing to say -> null', () => {
    expect(normalizeError({})).toBeNull()
    expect(normalizeError(null)).toBeNull()
    expect(normalizeError(undefined)).toBeNull()
  })

  it('a plain string body', () => {
    expect(normalizeError('Bad gateway').message).toBe('Bad gateway')
  })
})

describe('parseFieldErrors / buildErrorMessage keep working with both shapes', () => {
  it('reads error.details first', () => {
    expect(parseFieldErrors({ error: { message: 'x', details: { name: ['Required.'] } }, name: ['legacy alias'] })).toEqual({ name: 'Required.' })
  })

  it('does not treat the contract keys as fields', () => {
    expect(parseFieldErrors({ error: { message: 'x', details: null }, detail: 'x', code: 'c', alerts: [] })).toEqual({})
  })

  it('buildErrorMessage prefers the contract message', () => {
    expect(buildErrorMessage({ error: { message: 'Forbidden.' }, detail: 'old' })).toBe('Forbidden.')
  })
})

describe('normalizeAlerts', () => {
  it('returns [] when there are none', () => {
    expect(normalizeAlerts({ id: 1 })).toEqual([])
    expect(normalizeAlerts(null)).toEqual([])
    expect(normalizeAlerts({ alerts: 'nope' })).toEqual([])
  })

  it('keeps level, message, code and details', () => {
    expect(normalizeAlerts({ alerts: [{ level: 'warning', message: 'No profile.', code: 'employee_without_profile', details: { a: 1 } }] })).toEqual([
      { level: 'warning', message: 'No profile.', code: 'employee_without_profile', details: { a: 1 } }
    ])
  })

  it('an unknown level becomes info and an alert without a message is dropped', () => {
    const alerts = normalizeAlerts({ alerts: [{ level: 'negative', message: 'x' }, { level: 'info' }, null, { level: 'success', message: '' }] })

    expect(alerts).toEqual([{ level: 'info', message: 'x', code: null, details: null }])
  })

  it('several alerts keep their order', () => {
    const alerts = normalizeAlerts({ alerts: [{ level: 'success', message: 'a' }, { level: 'error', message: 'b' }] })

    expect(alerts.map(alert => alert.message)).toEqual(['a', 'b'])
  })
})

describe('errorMessage / errorCode', () => {
  it('read an axios error', () => {
    const error = { response: { status: 409, data: { error: { code: 'x_code', message: 'Conflict.' } } } }

    expect(errorMessage(error)).toBe('Conflict.')
    expect(errorCode(error)).toBe('x_code')
  })

  it('are undefined when there is nothing', () => {
    expect(errorMessage({})).toBeUndefined()
    expect(errorCode({ response: { data: { detail: 'x' } } })).toBeUndefined()
  })
})
