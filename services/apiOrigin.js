// The API's origin for this page (django_resaas docs/security/sessions-and-tokens.md, phase 3).
//
// Normally process.env.API (e.g. https://app.mytech.co.mz). A site on its own
// domain (clinicaamal.co.mz) is listed in process.env.API_SAME_ORIGIN_HOSTS:
// its web server proxies /api/ (and /media/) to the backend, so the page talks
// to its OWN origin - the session's HttpOnly cookie is then a first-party one
// (another domain's cookie is a third-party one the browsers block).
export function sameOriginHosts () {
  return String(process.env.API_SAME_ORIGIN_HOSTS || '')
    .split(',')
    .map(host => host.trim().toLowerCase())
    .filter(Boolean)
}

export function apiOrigin () {
  if (typeof window !== 'undefined' && sameOriginHosts().includes(window.location.hostname.toLowerCase())) {
    return window.location.origin
  }
  return process.env.API
}
