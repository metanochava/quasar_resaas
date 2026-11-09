import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const AlertWarning = vi.fn()

vi.mock('../boot/alerts', () => ({
  AlertWarning: (...args) => AlertWarning(...args),
}))

vi.mock('../services/translation', () => ({
  tdc: (text) => text,
}))

const { installAuthGuard } = await import('./authGuard')

let guardFn
const fakeRouter = {
  beforeEach: (fn) => { guardFn = fn }
}

beforeEach(() => {
  localStorage.clear()
  AlertWarning.mockClear()
  // the refresh-before-refusing path has its own tests below
  installAuthGuard(fakeRouter, { refreshPermissions: null })
})

describe('installAuthGuard - requiresAuth', () => {
  it('redirects to login when the route requires auth and there is no access token', () => {
    const result = guardFn({ meta: { requiresAuth: true }, fullPath: '/protected' })

    expect(result).toEqual({ name: 'login', query: { redirect: '/protected' } })
  })

  it('allows navigation when an access token is present', () => {
    localStorage.setItem('access', 'a-real-token')

    const result = guardFn({ meta: { requiresAuth: true }, fullPath: '/protected' })

    expect(result).toBeUndefined()
  })

  it('does not gate a route without requiresAuth', () => {
    const result = guardFn({ meta: {}, fullPath: '/public' })

    expect(result).toBeUndefined()
  })
})

describe('installAuthGuard - requiredRole', () => {
  // Regression: every restRoutes.js entry declares requiredRole
  // ('view_scaffold', 'add_app', 'view_dashboard_hr_...') but nothing
  // ever checked it - any logged-in user could navigate straight to any
  // route's URL regardless of their actual permissions.
  beforeEach(() => {
    localStorage.setItem('access', 'a-real-token')
  })

  it('redirects to the forbidden route when the user lacks the required permission', () => {
    localStorage.setItem('userPermissions', JSON.stringify(['view_hr_dashboard']))

    const result = guardFn({
      meta: { requiresAuth: true, requiredRole: 'add_app' },
      fullPath: '/add_app'
    })

    expect(result).toEqual({ name: 'dashboard' })
  })

  it('warns with the current profile and the target route when blocking navigation', () => {
    localStorage.setItem('userGroup', JSON.stringify({ name: 'Guest' }))
    localStorage.setItem('userPermissions', JSON.stringify([]))

    guardFn({
      meta: { requiresAuth: true, requiredRole: 'add_app', title: 'Add App' },
      name: 'add_app',
      fullPath: '/add_app'
    })

    expect(AlertWarning).toHaveBeenCalledTimes(1)
    expect(AlertWarning.mock.calls[0][0]).toContain('Guest')
    expect(AlertWarning.mock.calls[0][0]).toContain('Add App')
  })

  it('falls back to the route name when the route has no meta.title', () => {
    localStorage.setItem('userGroup', JSON.stringify({ name: 'Guest' }))

    guardFn({
      meta: { requiresAuth: true, requiredRole: 'add_app' },
      name: 'add_app',
      fullPath: '/add_app'
    })

    expect(AlertWarning.mock.calls[0][0]).toContain('add_app')
  })

  it('does not warn when navigation is allowed', () => {
    localStorage.setItem('userPermissions', JSON.stringify(['add_app']))

    guardFn({
      meta: { requiresAuth: true, requiredRole: 'add_app' },
      fullPath: '/add_app'
    })

    expect(AlertWarning).not.toHaveBeenCalled()
  })

  it('allows navigation when the user has the required permission', () => {
    localStorage.setItem('userPermissions', JSON.stringify(['add_app', 'view_hr_dashboard']))

    const result = guardFn({
      meta: { requiresAuth: true, requiredRole: 'add_app' },
      fullPath: '/add_app'
    })

    expect(result).toBeUndefined()
  })

  it('checks the permission case-insensitively, same as UserStore.can()', () => {
    localStorage.setItem('userPermissions', JSON.stringify(['ADD_APP']))

    const result = guardFn({
      meta: { requiresAuth: true, requiredRole: 'add_app' },
      fullPath: '/add_app'
    })

    expect(result).toBeUndefined()
  })

  it('blocks navigation when userPermissions was never stored at all', () => {
    const result = guardFn({
      meta: { requiresAuth: true, requiredRole: 'add_app' },
      fullPath: '/add_app'
    })

    expect(result).toEqual({ name: 'dashboard' })
  })

  it('does not gate a route without requiredRole', () => {
    const result = guardFn({
      meta: { requiresAuth: true },
      fullPath: '/any'
    })

    expect(result).toBeUndefined()
  })

  it('respects a custom forbiddenRouteName', () => {
    installAuthGuard(fakeRouter, { forbiddenRouteName: 'forbidden', refreshPermissions: null })

    const result = guardFn({
      meta: { requiresAuth: true, requiredRole: 'add_app' },
      fullPath: '/add_app'
    })

    expect(result).toEqual({ name: 'forbidden' })
  })
})

describe('installAuthGuard - single sign-on', () => {
  const realLocation = window.location

  beforeEach(() => {
    sessionStorage.clear()
    process.env.SSO_URL = 'https://auth.mytech.co.mz'
    Object.defineProperty(window, 'location', {
      value: { origin: 'https://docodela.co.mz', pathname: '/', assign: vi.fn(), replace: vi.fn() },
      configurable: true,
    })
  })

  afterEach(() => {
    delete process.env.SSO_URL
    Object.defineProperty(window, 'location', { value: realLocation, configurable: true })
  })

  it('without a session, asks the central domain first (once per tab)', async () => {
    const first = await guardFn({ meta: { requiresAuth: true }, fullPath: '/protected' })
    expect(first).toBe(false)
    expect(window.location.assign).toHaveBeenCalledTimes(1)
    expect(window.location.assign.mock.calls[0][0]).toContain('https://auth.mytech.co.mz/#/sso?')

    // back with login_required: the local login page, no second trip
    const second = guardFn({ meta: { requiresAuth: true }, fullPath: '/protected' })
    expect(second).toEqual({ name: 'login', query: { redirect: '/protected' } })
    expect(window.location.assign).toHaveBeenCalledTimes(1)
  })

  it('opening the login page also tries the shared session first', async () => {
    expect(await guardFn({ name: 'login', meta: {}, fullPath: '/auth/login' })).toBe(false)
  })

  it('with a session nothing changes', () => {
    localStorage.setItem('access', 'a-real-token')
    expect(guardFn({ meta: { requiresAuth: true }, fullPath: '/protected' })).toBeUndefined()
    expect(window.location.assign).not.toHaveBeenCalled()
  })

  it('on the central domain itself the local login is shown', () => {
    window.location.origin = 'https://auth.mytech.co.mz'
    expect(guardFn({ meta: { requiresAuth: true }, fullPath: '/protected' })).toEqual({ name: 'login', query: { redirect: '/protected' } })
  })
})


describe('installAuthGuard - a permission the profile gained later', () => {
  // The menu is fetched on every load but 'userPermissions' only when a
  // profile is chosen: a permission added to the profile afterwards showed in
  // the menu and the route was still refused ("Admin" / view_employee).
  beforeEach(() => {
    localStorage.setItem('access', 'a-real-token')
    localStorage.setItem('userPermissions', JSON.stringify(['view_hr_dashboard']))
  })

  it('asks the backend once and lets the route through when the profile has it now', async () => {
    const refreshPermissions = vi.fn(async () => {
      localStorage.setItem('userPermissions', JSON.stringify(['view_hr_dashboard', 'view_employee']))
    })
    installAuthGuard(fakeRouter, { refreshPermissions })

    const result = await guardFn({ meta: { requiresAuth: true, requiredRole: 'view_employee' }, fullPath: '/employee/1' })

    expect(refreshPermissions).toHaveBeenCalledTimes(1)
    expect(result).toBeUndefined()
    expect(AlertWarning).not.toHaveBeenCalled()
  })

  it('still refuses when the refreshed permissions do not have it, and does not ask again right away', async () => {
    const refreshPermissions = vi.fn(async () => {})
    installAuthGuard(fakeRouter, { refreshPermissions })
    const to = { meta: { requiresAuth: true, requiredRole: 'add_app' }, fullPath: '/add_app' }

    expect(await guardFn(to)).toEqual({ name: 'dashboard' })
    expect(await guardFn(to)).toEqual({ name: 'dashboard' })

    expect(refreshPermissions).toHaveBeenCalledTimes(1)
    expect(AlertWarning).toHaveBeenCalledTimes(2)
  })

  it('a failed refresh refuses as before', async () => {
    installAuthGuard(fakeRouter, { refreshPermissions: vi.fn(async () => { throw new Error('offline') }) })

    const result = await guardFn({ meta: { requiresAuth: true, requiredRole: 'add_app' }, fullPath: '/add_app' })

    expect(result).toEqual({ name: 'dashboard' })
  })
})
