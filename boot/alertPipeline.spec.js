import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

const create = vi.fn()

vi.mock('quasar', async (importOriginal) => ({
  ...(await importOriginal()),
  Notify: { create: (...args) => create(...args) }
}))

import { Alert, AlertError, AlertSuccess, AlertInfo, setAlertPolicy, getAlertPolicy, resetAlertDedupe } from './alerts'
import { useAlertStore } from '../stores/AlertStore'

let Alerts

const response = (status, data, config = { method: 'post', url: '/api/hr/employees/?page=2' }) => ({ status, data, config })

beforeEach(() => {
  setActivePinia(createPinia())
  Alerts = useAlertStore()
  create.mockReset()
  resetAlertDedupe()
  setAlertPolicy({
    success: { toast: true, history: true }, info: { toast: true, history: true },
    warning: { toast: true, history: true }, error: { toast: true, history: true }
  })
})

const toasts = () => create.mock.calls.map(([options]) => options)

describe('a successful response', () => {
  it('without alerts adds nothing to the history and a plain GET is silent', () => {
    Alert(response(200, { id: 1 }, { method: 'get', url: '/api/x/' }))

    expect(Alerts.data).toEqual([])
    expect(create).not.toHaveBeenCalled()
  })

  it('with one alert: toast now AND a line in the history', () => {
    Alert(response(201, { id: 1, alerts: [{ level: 'success', message: 'Employee created.' }] }))

    expect(toasts()[0]).toMatchObject({ type: 'positive', message: 'Employee created.' })
    expect(Alerts.data).toHaveLength(1)
    expect(Alerts.data[0]).toMatchObject({ level: 'success', message: 'Employee created.', read: false })
  })

  it('with several alerts: every one, in order, at every level (levels map to Quasar only here)', () => {
    Alert(response(200, {
      id: 1,
      alerts: [
        { level: 'success', message: 'Created.' },
        { level: 'info', message: 'Note.' },
        { level: 'warning', message: 'No profile.', code: 'employee_without_profile' },
        { level: 'error', message: 'Part failed.', code: 'partial' }
      ]
    }))

    expect(toasts().map(toast => toast.type)).toEqual(['positive', 'info', 'warning', 'negative'])
    expect(Alerts.data.map(alert => alert.level)).toEqual(['success', 'info', 'warning', 'error'])
  })

  it('keeps the code and the details of an alert', () => {
    Alert(response(200, { alerts: [{ level: 'warning', message: 'No profile.', code: 'employee_without_profile', details: { id: 7 } }] }))

    expect(Alerts.data[0]).toMatchObject({ code: 'employee_without_profile', details: { id: 7 } })
  })

  it('an alert without a code has code null', () => {
    Alert(response(200, { alerts: [{ level: 'info', message: 'Hello.' }] }))

    expect(Alerts.data[0].code).toBeNull()
  })

  it('records which request produced it - method and path only, no query string', () => {
    Alert(response(201, { alerts: [{ level: 'info', message: 'Hello.' }] }))

    expect(Alerts.data[0].request).toEqual({ method: 'POST', path: '/api/hr/employees/' })
  })

  it('a generic "Created successfully!" is a toast only - not history', () => {
    Alert(response(201, { id: 1 }))

    expect(toasts()[0].message).toBe('Created successfully!')
    expect(Alerts.data).toEqual([])
  })

  it('the older alert_success key still works (and is kept in the history)', () => {
    Alert(response(202, { alert_success: 'Saved.' }))

    expect(toasts()[0].message).toBe('Saved.')
    expect(Alerts.data[0].message).toBe('Saved.')
  })
})

describe('the status of a successful POST (201 / 202 / 204, never 200)', () => {
  it('202: an operation with a result says "Processed successfully!"', () => {
    Alert(response(202, { checked_in: true }, { method: 'post', url: '/api/saude/agendas/1/check_in/' }))

    expect(toasts()[0].message).toBe('Processed successfully!')
  })

  it('204 says what the method did: POST processed, DELETE deleted, PATCH modified', () => {
    Alert(response(204, '', { method: 'post', url: '/api/a/' }))
    Alert(response(204, '', { method: 'delete', url: '/api/b/1/' }))
    Alert(response(204, '', { method: 'patch', url: '/api/c/1/' }))

    expect(toasts().map(t => t.message)).toEqual(['Processed successfully!', 'Deleted successfully!', 'Modified successfully!'])
  })

  it('signing in, refreshing the token, switching context, 2FA and OTP stay silent', () => {
    for (const url of ['/api/login/', '/api/login/two_factor/', '/api/logout/', '/api/refresh_token/',
      '/api/resaas/context/', '/api/two_factor/confirm/', '/api/register/otp/request/']) {
      Alert(response(202, { ok: 1 }, { method: 'post', url }))
    }

    expect(toasts()).toEqual([])
  })

  it('a request can ask for no generic toast ({ silent: true }), but its alerts still show', () => {
    Alert(response(202, { valid: true }, { method: 'post', url: '/api/x/validate/', silent: true }))
    expect(toasts()).toEqual([])

    Alert(response(202, { alerts: [{ level: 'warning', message: 'Careful.' }] }, { method: 'post', url: '/api/login/' }))
    expect(toasts()[0].message).toBe('Careful.')
  })
})

describe('a failed response', () => {
  const failure = (status, data, config) => ({ response: response(status, data, config) })

  it('shows the contract message and keeps the code; the error is in the history once', () => {
    AlertError(failure(403, { error: { code: 'permission_denied', message: 'You cannot do this.', details: null }, detail: 'You cannot do this.' }))

    expect(toasts()[0]).toMatchObject({ type: 'negative', message: 'You cannot do this.' })
    expect(Alerts.data).toHaveLength(1)
    expect(Alerts.data[0]).toMatchObject({ level: 'error', code: 'permission_denied', message: 'You cannot do this.' })
  })

  it('a deprecated {detail} answer is still shown', () => {
    AlertError(failure(409, { detail: 'Already assigned.' }))

    expect(toasts()[0].message).toBe('Already assigned.')
  })

  it('validation errors: a general toast, but NOT a history entry (the fields carry the detail)', () => {
    AlertError(failure(400, { error: { message: 'Please correct the highlighted fields.', details: { email: ['Taken.'] } }, email: ['Taken.'] }))

    expect(toasts()[0].message).toBe('Please correct the highlighted fields.')
    expect(Alerts.data).toEqual([])
  })

  it('a 401 is the sign-in flow talking: toast, no history', () => {
    AlertError(failure(401, { error: { code: 'not_authenticated', message: 'Sign in.' } }))

    expect(create).toHaveBeenCalled()
    expect(Alerts.data).toEqual([])
  })

  it('an error answer may carry extra alerts; the error is not repeated among them', () => {
    AlertError(failure(409, {
      error: { code: 'group_already_assigned', message: 'Already assigned.', details: null },
      alerts: [{ level: 'info', message: 'Nothing was saved.' }]
    }))

    expect(Alerts.data.map(alert => alert.message).sort()).toEqual(['Already assigned.', 'Nothing was saved.'])
    expect(Alerts.data.filter(alert => alert.message === 'Already assigned.')).toHaveLength(1)
  })

  it('a 500 uses the generic message the backend sent (nothing technical)', () => {
    AlertError(failure(500, { error: { message: 'An unexpected error occurred. Please try again later.', details: null } }))

    expect(toasts()[0].message).toBe('An unexpected error occurred. Please try again later.')
  })

  it('with no usable body it falls back to the status text, as before', () => {
    AlertError(failure(404, {}))
    AlertError(failure(500, ''))

    expect(toasts().map(toast => toast.message)).toEqual(['Resource not found', 'Internal server error'])
  })

  it('goes through Alert() for a >=400 response', () => {
    Alert(response(403, { error: { code: 'permission_denied', message: 'No.' } }))

    expect(Alerts.data[0].code).toBe('permission_denied')
  })
})

describe('duplicates', () => {
  it('the same response seen twice (interceptor + a catch block) is one toast and one line', () => {
    const error = { response: response(403, { error: { code: 'permission_denied', message: 'No.' } }) }

    AlertError(error)
    AlertError(error)

    expect(create).toHaveBeenCalledTimes(1)
    expect(Alerts.data).toHaveLength(1)
  })

  it('different messages are not duplicates', () => {
    AlertInfo('One.')
    AlertInfo('Two.')

    expect(Alerts.data).toHaveLength(2)
  })
})

describe('the policy is central', () => {
  it('a level can be history-only (no toast) without touching any component', () => {
    setAlertPolicy({ info: { toast: false } })

    Alert(response(200, { alerts: [{ level: 'info', message: 'Quiet.' }] }))

    expect(create).not.toHaveBeenCalled()
    expect(Alerts.data[0].message).toBe('Quiet.')
  })

  it('a level can be toast-only', () => {
    setAlertPolicy({ success: { history: false } })

    AlertSuccess('Saved.')

    expect(create).toHaveBeenCalledTimes(1)
    expect(Alerts.data).toEqual([])
  })

  it('exposes a copy of the policy', () => {
    const policy = getAlertPolicy()
    policy.error.toast = false

    expect(getAlertPolicy().error.toast).toBe(true)
  })
})
