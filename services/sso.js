// Single sign-on between the frontend domains of one deployment (backend:
// django_resaas core/services/sso_service.py - POST sso/code/, sso/token/).
//
// One domain is CENTRAL (process.env.SSO_URL, e.g. https://auth.mytech.co.mz);
// every other domain is a CLIENT. Without SSO_URL nothing here runs and the
// local login works exactly as before.
//
// Client, no session (authGuard):      -> central /sso?prompt=none
//   central has a session              -> code -> client /sso/callback -> own session
//   central has none                   -> client /sso/callback?error=login_required
//                                         -> the local login page (kept)
// Client, after a LOCAL login:         -> central /sso/adopt (it takes the session
//                                         over, so the other domains find it)
//                                         -> client /sso/callback (adopted)
// "Continue with single sign-on" on the local login page: like the first case
// without prompt=none (the central login page is shown when needed).
//
// Codes are single use, live seconds, are bound to their redirect_uri and a
// PKCE (S256) challenge; the backend only issues them for origins its CORS
// policy trusts. Tokens never travel in a URL. With hash routing everything
// after '#' stays in the browser (never sent to a server).
import { HTTPAuth, HTTPClient, url } from './api'

const PENDING = 'resaasSso'          // sessionStorage: the flow this tab started
const TRIED = 'resaasSsoTried'       // sessionStorage: silent attempt already made
const CENTRAL_NEXT = 'resaasSsoNext' // sessionStorage (central): /sso query to resume after login

export const CALLBACK_PATH = '/sso/callback'
export const ADOPT_PATH = '/sso/adopt'

export function ssoUrl () {
  return String(process.env.SSO_URL || '').replace(/\/+$/, '')
}

function ssoOrigin () {
  try {
    return new URL(ssoUrl()).origin
  } catch {
    return ''
  }
}

export function ssoEnabled () {
  return Boolean(ssoOrigin())
}

export function isCentral () {
  return ssoEnabled() && ssoOrigin() === window.location.origin
}

export function isClient () {
  return ssoEnabled() && !isCentral()
}

const hashUri = (origin, path) => `${origin}/#${path}`
export const callbackUri = () => hashUri(window.location.origin, CALLBACK_PATH)
export const adoptUri = () => hashUri(ssoOrigin(), ADOPT_PATH)

export function withQuery (uri, params) {
  const query = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== ''))
  return `${uri}${uri.includes('?') ? '&' : '?'}${query.toString()}`
}

// ---------------------------------------------------------------- PKCE

function base64url (bytes) {
  let text = ''
  bytes.forEach(b => { text += String.fromCharCode(b) })
  return btoa(text).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function randomToken (size = 32) {
  const bytes = new Uint8Array(size)
  crypto.getRandomValues(bytes)
  return base64url(bytes)
}

export async function challengeFor (verifier) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier))
  return base64url(new Uint8Array(digest))
}

// ---------------------------------------------------------------- storage

function readJSON (key) {
  try {
    return JSON.parse(sessionStorage.getItem(key) || 'null')
  } catch {
    return null
  }
}

function writeJSON (key, value) {
  try {
    sessionStorage.setItem(key, JSON.stringify(value))
  } catch {
    // private mode: the flow just will not resume
  }
}

function remove (key) {
  try {
    sessionStorage.removeItem(key)
  } catch {
    // nothing to clean
  }
}

export function takePending () {
  const pending = readJSON(PENDING)
  remove(PENDING)
  return pending
}

function silentTried () {
  try {
    return sessionStorage.getItem(TRIED) === '1'
  } catch {
    return true
  }
}

function markSilentTried () {
  try {
    sessionStorage.setItem(TRIED, '1')
  } catch {
    // ignore
  }
}

// ---------------------------------------------------------------- client

async function goToCentral ({ silent }) {
  const state = randomToken()
  const verifier = randomToken(48)
  writeJSON(PENDING, { mode: 'login', state, verifier })

  const target = withQuery(hashUri(ssoOrigin(), '/sso'), {
    redirect_uri: callbackUri(),
    state,
    code_challenge: await challengeFor(verifier),
    prompt: silent ? 'none' : undefined,
  })
  window.location.assign(target)
}

// No session on a client domain: ask the central domain once per tab, without
// showing anything. Returns true when the page is leaving for it.
export function canStartSilent () {
  return isClient() && !silentTried()
}

export async function startSilent () {
  if (!canStartSilent()) return false
  markSilentTried()
  await goToCentral({ silent: true })
  return true
}

// "Continue with single sign-on" on the local login page.
export async function startInteractive () {
  if (!isClient()) return false
  markSilentTried()
  await goToCentral({ silent: false })
  return true
}

// After a LOCAL login on a client domain: hand the session to the central
// domain too, so the other domains find it. Returns true when the page is
// leaving for it; false (nothing happened) when SSO is off or it failed.
export async function propagate () {
  if (!isClient()) return false

  try {
    const verifier = randomToken(48)
    const { data } = await HTTPAuth.post(url({ type: 'u', url: 'sso/code/', params: {} }), {
      redirect_uri: adoptUri(),
      code_challenge: await challengeFor(verifier),
    })

    const state = randomToken()
    const returnVerifier = randomToken(48)
    writeJSON(PENDING, { mode: 'adopt', state, verifier: returnVerifier })
    markSilentTried()

    window.location.assign(withQuery(adoptUri(), {
      code: data.code,
      verifier,
      redirect_uri: callbackUri(),
      state,
      code_challenge: await challengeFor(returnVerifier),
    }))
    return true
  } catch {
    return false
  }
}

// The client's /sso/callback: returns 'session' (a new session started from
// the central one), 'adopted' (the local session was handed over), or
// 'login' (go to the local login page).
export async function completeCallback (query, startSession) {
  const pending = takePending()

  if (!pending || !query.state || query.state !== pending.state) return 'login'
  if (query.error) return 'login'
  if (pending.mode === 'adopt') return 'adopted'
  if (!query.code) return 'login'

  const { data } = await HTTPClient.post(url({ type: 'u', url: 'sso/token/', params: {} }), {
    code: query.code,
    code_verifier: pending.verifier,
    redirect_uri: callbackUri(),
  })
  await startSession(data)
  return 'session'
}

// ---------------------------------------------------------------- central

// The central /sso page with a session: a code for the client, then back.
export async function authorize (query) {
  const { data } = await HTTPAuth.post(url({ type: 'u', url: 'sso/code/', params: {} }), {
    redirect_uri: query.redirect_uri,
    code_challenge: query.code_challenge,
  })
  window.location.replace(withQuery(query.redirect_uri, { code: data.code, state: query.state }))
}

// The central /sso page without a session. prompt=none: answer at once
// (the client keeps its own login page) - but only to a destination the
// backend vouches for, never an open redirect. Returns 'answered',
// 'refused' (untrusted destination) or 'login' (show the central login).
export async function loginRequired (query) {
  if (query.prompt !== 'none') {
    writeJSON(CENTRAL_NEXT, query)
    return 'login'
  }

  try {
    await HTTPClient.get(url({ type: 'u', url: 'sso/redirect_check/', params: { redirect_uri: query.redirect_uri } }))
  } catch {
    return 'refused'
  }
  window.location.replace(withQuery(query.redirect_uri, { error: 'login_required', state: query.state }))
  return 'answered'
}

// After a login ON the central domain: the /sso request to resume, if any.
export function takeCentralNext () {
  const next = readJSON(CENTRAL_NEXT)
  remove(CENTRAL_NEXT)
  return next
}

// The central /sso/adopt page: redeem the client's code into a central
// session, then send the user back with a code the backend validated the
// destination for (no open redirect).
export async function adopt (query, startSession) {
  const { data } = await HTTPClient.post(url({ type: 'u', url: 'sso/token/', params: {} }), {
    code: query.code,
    code_verifier: query.verifier,
    redirect_uri: adoptUri(),
  })
  await startSession(data)
  await authorize(query)
}

// FormLogin, once a LOCAL login has started a session: on the central domain,
// resume the /sso request that sent the user there; on a client domain, hand
// the session to the central one. True when this took over the navigation.
export async function afterLocalLogin (router) {
  if (isCentral()) {
    const next = takeCentralNext()
    if (!next) return false
    await router.replace({ name: 'ssoAuthorize', query: next })
    return true
  }

  return propagate()
}
