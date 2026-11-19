// Whether this page shares the API's session cookie with the single sign-on
// central domain (django_resaas docs/security/sessions-and-tokens.md).
//
// On *.mytech.co.mz every frontend talks to the same API host, whose HttpOnly
// refresh cookie the browser sends from any of them (same site). A page there
// does not need the central domain's redirects: a refresh in the background
// tells whether the browser is signed in, like Google's sites share one
// session. Only a site on its OWN domain (clinicaamal.co.mz: its API cookie
// is its own) still needs the single sign-on redirects.
import { apiOrigin } from './apiOrigin'
import { ssoUrl } from './sso'

// "saude.mytech.co.mz" -> "mytech.co.mz", "app.metano.cc" -> "metano.cc"
// (a country second level such as co.mz / com.br keeps three labels)
export function registrableDomain (host) {
  const labels = String(host || '').toLowerCase().replace(/\.$/, '').split('.').filter(Boolean)
  if (labels.length <= 2) return labels.join('.')
  const [second, top] = labels.slice(-2)
  const take = top.length === 2 && second.length <= 3 ? 3 : 2
  return labels.slice(-take).join('.')
}

function hostOf (value) {
  try {
    return new URL(value).hostname
  } catch {
    return ''
  }
}

function pageHost () {
  return window.location.hostname || hostOf(window.location.origin)
}

export function sameSite (a, b) {
  return Boolean(a && b) && registrableDomain(a) === registrableDomain(b)
}

// the API's session cookie is first-party on this page: a background refresh
// can find the session
export function cookieSessionPossible (host = pageHost()) {
  return sameSite(host, hostOf(apiOrigin()))
}

// ... and it is the same cookie the central domain has: no single sign-on
// redirect can find anything a background refresh does not
export function sharesCentralSession (host = pageHost()) {
  const central = hostOf(ssoUrl())
  return cookieSessionPossible(host) && sameSite(hostOf(apiOrigin()), central)
}
