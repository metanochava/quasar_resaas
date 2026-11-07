import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

const post = vi.fn()
const get = vi.fn()
vi.mock('./api', () => ({
  HTTPAuth: { post: (...a) => post('auth', ...a) },
  HTTPClient: { post: (...a) => post('public', ...a), get: (...a) => get(...a) },
  url: ({ url, params }) => (params && Object.keys(params).length ? `${url}?${new URLSearchParams(params)}` : url),
}))

import * as sso from './sso'

const CENTRAL = 'https://auth.mytech.co.mz'
const CLIENT = 'https://docodela.co.mz'
const realLocation = window.location

function at (origin) {
  const location = { origin, pathname: '/', assign: vi.fn(), replace: vi.fn() }
  Object.defineProperty(window, 'location', { value: location, configurable: true })
  return location
}

function hashQuery (target) {
  return Object.fromEntries(new URLSearchParams(target.split('?')[1]))
}

beforeEach(() => {
  process.env.SSO_URL = CENTRAL + '/'
  sessionStorage.clear()
  localStorage.clear()
  post.mockReset()
  get.mockReset()
})

afterEach(() => {
  delete process.env.SSO_URL
  Object.defineProperty(window, 'location', { value: realLocation, configurable: true })
})

describe('sso - configuration', () => {
  it('is off without SSO_URL: nothing leaves the page', async () => {
    delete process.env.SSO_URL
    const location = at(CLIENT)

    expect(sso.ssoEnabled()).toBe(false)
    expect(await sso.startSilent()).toBe(false)
    expect(await sso.propagate()).toBe(false)
    expect(location.assign).not.toHaveBeenCalled()
  })

  it('knows the central domain from the client ones', () => {
    at(CENTRAL)
    expect(sso.isCentral()).toBe(true)
    at(CLIENT)
    expect(sso.isClient()).toBe(true)
  })

  it('PKCE: the S256 challenge matches the backend (base64url(sha256), no padding)', async () => {
    // same value as django_resaas sso_service.challenge_for() for this verifier
    expect(await sso.challengeFor('dBjftJeZ4CK-dkd3_I8uGaTsLlpxuNHr0FwVlkQWsc4'))
      .toBe('CCSwMrjW5l3-5tmmTab3eaK8pgRv85wfLreJh72vRhM')
  })
})

describe('sso - client', () => {
  it('asks the central domain silently, once per tab', async () => {
    const location = at(CLIENT)

    expect(await sso.startSilent()).toBe(true)
    const target = location.assign.mock.calls[0][0]
    expect(target.startsWith(`${CENTRAL}/#/sso?`)).toBe(true)

    const query = hashQuery(target)
    expect(query.prompt).toBe('none')
    expect(query.redirect_uri).toBe(`${CLIENT}/#/sso/callback`)
    expect(query.code_challenge).toHaveLength(43)
    expect(query.state).toBeTruthy()

    // the verifier stays in this tab, never in the URL
    expect(target).not.toContain(JSON.parse(sessionStorage.getItem('resaasSso')).verifier)

    expect(await sso.startSilent()).toBe(false)
    expect(location.assign).toHaveBeenCalledTimes(1)
  })

  it('never starts from the central domain itself', async () => {
    const location = at(CENTRAL)
    expect(await sso.startSilent()).toBe(false)
    expect(location.assign).not.toHaveBeenCalled()
  })

  it('the callback turns the code into a session with the stored verifier', async () => {
    const location = at(CLIENT)
    await sso.startSilent()
    const { state } = hashQuery(location.assign.mock.calls[0][0])
    const { verifier } = JSON.parse(sessionStorage.getItem('resaasSso'))
    const session = { tokens: { access: 'a', refresh: 'r' } }
    post.mockResolvedValue({ data: session })
    const startSession = vi.fn()

    expect(await sso.completeCallback({ code: 'c0de', state }, startSession)).toBe('session')
    expect(post).toHaveBeenCalledWith('public', 'sso/token/', {
      code: 'c0de', code_verifier: verifier, redirect_uri: `${CLIENT}/#/sso/callback`,
    })
    expect(startSession).toHaveBeenCalledWith(session)
    // spent: a replayed callback finds nothing
    expect(await sso.completeCallback({ code: 'c0de', state }, startSession)).toBe('login')
  })

  it('a callback with another state, or login_required, ends on the local login', async () => {
    const location = at(CLIENT)
    await sso.startSilent()
    const { state } = hashQuery(location.assign.mock.calls[0][0])

    expect(await sso.completeCallback({ code: 'x', state: 'forged' }, vi.fn())).toBe('login')

    sessionStorage.clear()
    await sso.startInteractive()
    const second = hashQuery(location.assign.mock.calls[1][0])
    expect(second.prompt).toBeUndefined()
    expect(await sso.completeCallback({ error: 'login_required', state: second.state }, vi.fn())).toBe('login')
    expect(post).not.toHaveBeenCalled()
    expect(state).not.toBe(second.state)
  })

  it('after a local login the session is handed to the central domain', async () => {
    const location = at(CLIENT)
    post.mockResolvedValue({ data: { code: 'c1' } })

    expect(await sso.afterLocalLogin({ replace: vi.fn() })).toBe(true)

    const [, endpoint, body] = post.mock.calls[0]
    expect(endpoint).toBe('sso/code/')
    expect(body.redirect_uri).toBe(`${CENTRAL}/#/sso/adopt`)

    const target = location.assign.mock.calls[0][0]
    expect(target.startsWith(`${CENTRAL}/#/sso/adopt?`)).toBe(true)
    const query = hashQuery(target)
    expect(query.code).toBe('c1')
    expect(await sso.challengeFor(query.verifier)).toBe(body.code_challenge)
    expect(query.redirect_uri).toBe(`${CLIENT}/#/sso/callback`)

    // back on the client: adopted, no new session needed
    expect(await sso.completeCallback({ code: 'c2', state: query.state }, vi.fn())).toBe('adopted')
  })

  it('a failed hand-over leaves the local login as it was', async () => {
    const location = at(CLIENT)
    post.mockRejectedValue(new Error('403'))
    expect(await sso.propagate()).toBe(false)
    expect(location.assign).not.toHaveBeenCalled()
  })
})

describe('sso - central', () => {
  const request = { redirect_uri: `${CLIENT}/#/sso/callback`, state: 's1', code_challenge: 'x'.repeat(43) }

  it('with a session: a code for the client, then back', async () => {
    const location = at(CENTRAL)
    post.mockResolvedValue({ data: { code: 'c0de' } })

    await sso.authorize(request)

    expect(post).toHaveBeenCalledWith('auth', 'sso/code/', { redirect_uri: request.redirect_uri, code_challenge: request.code_challenge })
    expect(location.replace).toHaveBeenCalledWith(`${CLIENT}/#/sso/callback?code=c0de&state=s1`)
  })

  it('prompt=none without a session answers login_required - to a vouched destination only', async () => {
    const location = at(CENTRAL)
    get.mockResolvedValue({ data: { allowed: true } })

    expect(await sso.loginRequired({ ...request, prompt: 'none' })).toBe('answered')
    expect(location.replace).toHaveBeenCalledWith(`${CLIENT}/#/sso/callback?error=login_required&state=s1`)

    get.mockRejectedValue(new Error('400'))
    location.replace.mockClear()
    expect(await sso.loginRequired({ ...request, redirect_uri: 'https://evil.example/', prompt: 'none' })).toBe('refused')
    expect(location.replace).not.toHaveBeenCalled()
  })

  it('an interactive request goes through the central login and resumes after it', async () => {
    at(CENTRAL)
    expect(await sso.loginRequired(request)).toBe('login')

    const router = { replace: vi.fn() }
    expect(await sso.afterLocalLogin(router)).toBe(true)
    expect(router.replace).toHaveBeenCalledWith({ name: 'ssoAuthorize', query: request })

    // a plain login on the central domain later: nothing to resume
    expect(await sso.afterLocalLogin(router)).toBe(false)
  })

  it('adopt: the client code becomes the central session, then a validated way back', async () => {
    const location = at(CENTRAL)
    post
      .mockResolvedValueOnce({ data: { tokens: { access: 'a', refresh: 'r' } } })
      .mockResolvedValueOnce({ data: { code: 'c2' } })
    const startSession = vi.fn()

    await sso.adopt({ ...request, code: 'c1', verifier: 'v'.repeat(64) }, startSession)

    expect(post.mock.calls[0]).toEqual(['public', 'sso/token/', { code: 'c1', code_verifier: 'v'.repeat(64), redirect_uri: `${CENTRAL}/#/sso/adopt` }])
    expect(startSession).toHaveBeenCalled()
    expect(post.mock.calls[1][1]).toBe('sso/code/')
    expect(location.replace).toHaveBeenCalledWith(`${CLIENT}/#/sso/callback?code=c2&state=s1`)
  })

  it('adopt sends the central session it replaces, to be joined on the backend', async () => {
    at(CENTRAL)
    post.mockResolvedValueOnce({ data: { tokens: {} } }).mockResolvedValueOnce({ data: { code: 'c2' } })

    await sso.adopt({ ...request, code: 'c1', verifier: 'v'.repeat(64) }, vi.fn(), 'old-refresh')

    expect(post.mock.calls[0][2].previous_refresh).toBe('old-refresh')
  })
})

describe('sso - sign out of this site only', () => {
  it('ends this session only and this domain stops signing itself in, in every tab', async () => {
    const location = at(CLIENT)
    post.mockResolvedValue({ data: {} })

    await sso.signOutHereRequest('r1')

    expect(post).toHaveBeenCalledWith('auth', 'logout/', { refresh: 'r1' })
    sessionStorage.clear() // a new tab
    expect(sso.canStartSilent()).toBe(false)
    expect(await sso.startSilent()).toBe(false)
    expect(location.assign).not.toHaveBeenCalled()
  })

  it('a sign-in here (form or the single sign-on button) brings the automatic sign-in back', async () => {
    at(CLIENT)
    post.mockResolvedValue({ data: {} })
    await sso.signOutHereRequest('r1')

    await sso.startInteractive()
    sessionStorage.clear()
    expect(sso.canStartSilent()).toBe(true)

    await sso.signOutHereRequest('r1')
    post.mockResolvedValue({ data: { code: 'c1' } })
    await sso.afterLocalLogin({ replace: vi.fn() })
    sessionStorage.clear()
    expect(sso.optedOut()).toBe(false)
  })
})

describe('sso - sign out', () => {
  it('ends the whole family on the backend and does not ask the central domain again', async () => {
    const location = at(CLIENT)
    post.mockResolvedValue({ data: { ended: 3 } })

    await sso.signOutRequest()

    expect(post).toHaveBeenCalledWith('auth', 'sso/logout/', {})
    expect(await sso.startSilent()).toBe(false)
    expect(location.assign).not.toHaveBeenCalled()
  })
})
