import { describe, it, expect, beforeEach, vi } from 'vitest'

// api.js reads process.env.API/API_PREFIX at module-eval time - see
// api.spec.js's own note on this.
process.env.API = 'https://api.test'
process.env.API_PREFIX = 'v1'

vi.mock('../boot/alerts', () => ({ Alert: () => {} }))
vi.mock('./storage', () => ({ getStorage: () => null }))

const userState = { access: 'old-access', refresh: 'valid-refresh' }
const refreshToken = vi.fn(async () => {
  userState.access = 'new-access'
  return { data: { access: 'new-access' } }
})
const logout = vi.fn()

vi.mock('../stores/UserStore', () => ({
  useUserStore: () => ({
    get access() { return userState.access },
    set access(v) { userState.access = v },
    get refresh() { return userState.refresh },
    set refresh(v) { userState.refresh = v },
    isTokenExpired: (token) => token === 'expired-refresh' || !token,
    refreshToken,
    logout,
  }),
}))

vi.mock('../stores/LoadStore', () => ({
  useLoadStore: () => ({ inc: () => {}, dec: () => {} }),
}))

// Each createClient() call in api.js does axios.create() once - capture
// every {instance, rejected} pair in creation order (HTTPClient,
// HTTPClientBlob, HTTPAuth, HTTPAuthBlob - see api.js's exports) so the
// tests below can drive HTTPAuth's own response-error interceptor
// directly, and assert whether a retried request went through *that*
// client instance.
const created = []

vi.mock('axios', () => ({
  default: {
    create: () => {
      const entry = { rejected: null }
      const instance = vi.fn(async () => ({ data: 'retried-ok' }))
      instance.interceptors = {
        request: { use: () => {} },
        response: {
          use: (_resolved, rejected) => { entry.rejected = rejected; entry.instance = instance },
        },
      }
      created.push(entry)
      return instance
    },
  },
}))

let HTTPAuthEntry

beforeEach(async () => {
  vi.resetModules()
  created.length = 0
  userState.access = 'old-access'
  userState.refresh = 'valid-refresh'
  refreshToken.mockClear()
  logout.mockClear()

  await import('./api')
  // HTTPClient, HTTPClientBlob, HTTPAuth, HTTPAuthBlob, in that order.
  HTTPAuthEntry = created[2]
})

function fake401(url = 'demo/products/') {
  return {
    response: { status: 401, data: { detail: 'Given token not valid for any token type' } },
    config: { url, headers: {} },
  }
}

describe('HTTPAuth 401 handling', () => {
  it('silently refreshes and retries once when the refresh token is still valid', async () => {
    const result = await HTTPAuthEntry.rejected(fake401())

    expect(refreshToken).toHaveBeenCalledTimes(1)
    expect(logout).not.toHaveBeenCalled()
    expect(HTTPAuthEntry.instance).toHaveBeenCalledTimes(1)
    expect(HTTPAuthEntry.instance.mock.calls[0][0].headers.Authorization).toBe('Bearer new-access')
    expect(result).toEqual({ data: 'retried-ok' })
  })

  it('logs out without retrying when the refresh token itself is expired', async () => {
    userState.refresh = 'expired-refresh'

    await expect(HTTPAuthEntry.rejected(fake401())).rejects.toBeTruthy()

    expect(refreshToken).not.toHaveBeenCalled()
    expect(logout).toHaveBeenCalledWith('N')
  })

  it('logs out without retrying when the refresh_token/ call itself 401s', async () => {
    await expect(HTTPAuthEntry.rejected(fake401('refresh_token/'))).rejects.toBeTruthy()

    expect(refreshToken).not.toHaveBeenCalled()
    expect(logout).toHaveBeenCalledWith('N')
  })

  it('never retries the same request twice', async () => {
    const error = fake401()
    error.config._retried = true

    await expect(HTTPAuthEntry.rejected(error)).rejects.toBeTruthy()

    expect(refreshToken).not.toHaveBeenCalled()
    expect(logout).toHaveBeenCalledWith('N')
  })

  it('logs out (without a second refresh attempt) when refreshToken() itself rejects', async () => {
    refreshToken.mockRejectedValueOnce(new Error('refresh failed'))

    await expect(HTTPAuthEntry.rejected(fake401())).rejects.toBeTruthy()

    expect(refreshToken).toHaveBeenCalledTimes(1)
    expect(logout).toHaveBeenCalledWith('N')
  })
})
