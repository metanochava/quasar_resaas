// Backend <-> frontend error contract, on REAL answers of django_resaas
// (tests/fixtures/branch-user-group-errors.json, captured from the backend test
// client against branchusergroups/: tenant scope, permission per action,
// relation validation). If the backend changes the shape, regenerate the fixture
// and this spec tells whether the funnel (apiContract) still reads it.
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { errorCode, errorMessage, normalizeError, parseFieldErrors } from './apiContract'

const __dirname = dirname(fileURLToPath(import.meta.url))
const answers = JSON.parse(
  readFileSync(join(__dirname, '../tests/fixtures/branch-user-group-errors.json'), 'utf-8')
)
const axiosError = (name) => ({ response: { status: answers[name].status, data: answers[name].body } })

describe('django_resaas error answers read by the frontend funnel', () => {
  it('every answer has exactly one top-level key, "error", and no repeated status', () => {
    for (const { body } of Object.values(answers)) {
      expect(Object.keys(body)).toEqual(['error'])
      expect(body.error).not.toHaveProperty('status')
      expect(typeof body.error.message).toBe('string')
    }
  })

  it('a relation outside the tenant lands on its field (400 validation)', () => {
    const error = normalizeError(answers.validation_400.body)

    expect(answers.validation_400.status).toBe(400)
    expect(error.validation).toBe(true)
    expect(parseFieldErrors(answers.validation_400.body)).toHaveProperty('branch')
    expect(error.fields.branch).toBeTruthy()
  })

  it('a refused business rule is told apart by its stable code, not by its text', () => {
    expect(errorCode(axiosError('own_active_group_400'))).toBe('cannot_remove_own_active_group')
    expect(normalizeError(answers.own_active_group_400.body).validation).toBe(false)
  })

  it.each([
    ['permission_403', 403, 'permission_denied'],
    ['other_tenant_404', 404, 'not_found'],
    ['anonymous_401', 401, 'not_authenticated'],
  ])('%s keeps HTTP %i and code %s', (name, status, code) => {
    expect(answers[name].status).toBe(status)
    expect(errorCode(axiosError(name))).toBe(code)
    expect(errorMessage(axiosError(name))).toBeTruthy()
  })
})
