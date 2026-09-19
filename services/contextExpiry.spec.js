import { describe, it, expect } from 'vitest'
import {
  contextExpiresAt, shouldRenewContext, errorDetail, isContextExpiredError,
  CONTEXT_EXPIRED_DETAIL, RENEW_MARGIN_MS, DEFAULT_TTL_SECONDS
} from './contextExpiry'

const jsonError = (status, detail) => ({ response: { status, data: { detail } } })
const blobError = (status, body) => ({ response: { status, data: new Blob([JSON.stringify(body)], { type: 'application/json' }) } })

describe('contextExpiresAt', () => {
  it('uses the backend expires_in when given', () => {
    expect(contextExpiresAt({ expires_in: 600 }, 1000)).toBe(1000 + 600 * 1000)
  })
  it('falls back to the 1h backend default', () => {
    expect(contextExpiresAt({}, 0)).toBe(DEFAULT_TTL_SECONDS * 1000)
    expect(contextExpiresAt(null, 0)).toBe(DEFAULT_TTL_SECONDS * 1000)
  })
})

describe('shouldRenewContext', () => {
  const expires = 10 * 60 * 1000

  it('is false while there is plenty of time left', () => {
    expect(shouldRenewContext(expires, 0)).toBe(false)
  })
  it('is true inside the safety margin and after expiry', () => {
    expect(shouldRenewContext(expires, expires - RENEW_MARGIN_MS)).toBe(true)
    expect(shouldRenewContext(expires, expires + 1)).toBe(true)
  })
  it('does not force a renewal when the expiry is unknown', () => {
    expect(shouldRenewContext(null, 999999999)).toBe(false)
    expect(shouldRenewContext(undefined, 999999999)).toBe(false)
    expect(shouldRenewContext('abc', 999999999)).toBe(false)
  })
})

describe('isContextExpiredError', () => {
  it('recognises the JSON 403 the API sends', async () => {
    expect(await isContextExpiredError(jsonError(403, CONTEXT_EXPIRED_DETAIL))).toBe(true)
  })
  it('recognises it inside a blob body (PDF/download requests)', async () => {
    expect(await isContextExpiredError(blobError(403, { detail: CONTEXT_EXPIRED_DETAIL }))).toBe(true)
    expect(await errorDetail(blobError(403, { detail: 'x' }))).toBe('x')
  })
  it('ignores other errors', async () => {
    expect(await isContextExpiredError(jsonError(403, 'Invalid RESAAS context.'))).toBe(false)
    expect(await isContextExpiredError(jsonError(500, CONTEXT_EXPIRED_DETAIL))).toBe(false)
    expect(await isContextExpiredError({})).toBe(false)
  })
  it('does not throw on a blob that is not JSON', async () => {
    const error = { response: { status: 403, data: new Blob(['%PDF'], { type: 'application/pdf' }) } }
    expect(await isContextExpiredError(error)).toBe(false)
  })
})
