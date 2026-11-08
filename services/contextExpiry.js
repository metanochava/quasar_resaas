// Pure helpers for the RESAAS-context renewal done by services/api.js.
// Kept free of stores/axios so the rules are unit-testable.

export const CONTEXT_EXPIRED_DETAIL = 'RESAAS context has expired.'

// Renew this long BEFORE the backend TTL runs out, so a request never
// leaves with a token that expires in flight.
export const RENEW_MARGIN_MS = 2 * 60 * 1000

// Backend default (ResaasContextService.get_ttl(): RESAAS_CONTEXT_TTL, 1h),
// only used when the issue response does not say how long the token lives.
export const DEFAULT_TTL_SECONDS = 60 * 60

export function contextExpiresAt(data, now = Date.now()) {
  const seconds = Number(data?.expires_in) > 0 ? Number(data.expires_in) : DEFAULT_TTL_SECONDS
  return now + seconds * 1000
}

// true when a stored expiry is close enough (or past) that the token
// should be re-issued before sending the next request. No stored expiry
// (token issued by an older client) = unknown, so do not force a renewal:
// the reactive 403-retry still covers it.
export function shouldRenewContext(expiresAt, now = Date.now(), margin = RENEW_MARGIN_MS) {
  const at = Number(expiresAt)
  return Number.isFinite(at) && at > 0 && now >= at - margin
}

// Which selection (user + Entity + Branch + Group) a context token was
// issued for. The token lives in this tab's sessionStorage, while the
// selection is restored from localStorage, shared by every tab of the site:
// after a profile switch or a different sign-in in another tab, a reload
// sent the old token for the new profile and every protected request came
// back 403. A token whose key differs from the current selection is
// re-issued before the request leaves.
const idOf = value => (value && typeof value === 'object' ? value.id : value) || ''

export function contextSelectionKey({ user, entity, branch, group } = {}) {
  return [user, entity, branch, group].map(idOf).join('|')
}

// true when there is a selection to issue a context for and the stored
// token was issued for another one (or for no recorded one: a token from an
// older client is re-issued once).
export function contextNeedsReissue(storedKey, selection) {
  if (!idOf(selection?.entity)) return false
  return storedKey !== contextSelectionKey(selection)
}

// The error body of a blob request (PDFs, downloads) is a Blob, not the
// JSON object - it has to be read before its `detail` can be compared.
export async function errorDetail(error) {
  const data = error?.response?.data

  if (typeof Blob !== 'undefined' && data instanceof Blob) {
    try {
      return JSON.parse(await data.text())?.detail
    } catch {
      return undefined
    }
  }

  return data?.detail
}

// The stable code the backend publishes for this exact condition
// (error.code, see utils/apiContract.js). The English text below is only the
// fallback for a backend that predates the contract.
export const CONTEXT_EXPIRED_CODE = 'resaas_context_expired'

export async function isContextExpiredError(error) {
  const status = error?.response?.status

  if (status !== 403 && status !== 401) return false

  const data = error?.response?.data

  if (data?.error?.code === CONTEXT_EXPIRED_CODE || data?.code === CONTEXT_EXPIRED_CODE) return true

  return (await errorDetail(error)) === CONTEXT_EXPIRED_DETAIL
}
