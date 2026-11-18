// Where the session's tokens live (django_resaas docs/security/sessions-and-tokens.md):
// - the ACCESS token (minutes) only in memory (UserStore.access): a script
//   that reads the storage finds none; after a reload the next request first
//   mints one from the refresh token;
// - the REFRESH token, on a frontend of the API's own site (*.mytech.co.mz),
//   in an HttpOnly cookie no script reads: the store only keeps until when it
//   lives ('refreshUntil'); on any other site (an own domain) still in
//   localStorage. It rotates on every refresh.
import { getStorage } from './storage'

// whether a JWT is missing, unreadable or past its "exp"
export function tokenExpired(token) {
  if (!token) return true
  try {
    const payload = JSON.parse(atob(String(token).split('.')[1]))
    return !payload.exp || payload.exp * 1000 <= Date.now()
  } catch {
    return true
  }
}

// the stored refresh token while it can still renew the session, else null
export function liveRefreshToken() {
  const refresh = getStorage('l', 'refresh')
  return tokenExpired(refresh) ? null : refresh
}

// the HttpOnly refresh cookie still lives (we only know until when)
export function cookieSessionLive() {
  const until = Date.parse(getStorage('l', 'refreshUntil') || '')
  return Number.isFinite(until) && until > Date.now()
}

// a refresh can mint an access token: a stored refresh token, or the cookie
export function canRefresh() {
  return Boolean(liveRefreshToken()) || cookieSessionLive()
}

// a session exists: an access token in memory, or a refresh that can mint one
export function hasSessionToken(memoryAccess = null) {
  return Boolean(memoryAccess) || canRefresh()
}
