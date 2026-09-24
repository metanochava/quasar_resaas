import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

// createResaasContext() is the only real network call
// refreshResaasContext() makes - mocked so these tests are pure unit
// tests of the dedup behavior, not a real HTTP round trip.
const createResaasContext = vi.fn()

vi.mock('../services/tenantContext', () => ({
  createResaasContext: (...args) => createResaasContext(...args),
  clearResaasContext: vi.fn(),
  getResaasContext: vi.fn(),
}))

vi.mock('../services/api', () => ({
  HTTPAuth: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() },
  HTTPClient: { get: vi.fn(), post: vi.fn() },
  url: ({ url }) => url,
}))

vi.mock('../utils/autoForm', () => ({
  buildFormFromSchema: vi.fn(),
}))

vi.mock('./LanguageStore', () => ({
  useLanguageStore: () => ({ change: vi.fn() }),
}))

const { useUserStore } = await import('./UserStore')

beforeEach(() => {
  setActivePinia(createPinia())
  createResaasContext.mockReset()
})

describe('UserStore.refreshResaasContext', () => {
  it('collapses concurrent calls into a single createResaasContext() request', async () => {
    let resolveFn
    createResaasContext.mockReturnValue(
      new Promise(resolve => { resolveFn = resolve })
    )

    const User = useUserStore()
    User.Entity = { id: 'entity-1' }

    // Regression: MainLayout.vue, HomeDashboards.vue and
    // DashboardRenderer.vue each legitimately need to await a fresh
    // context before their own fetch on the same page load - without
    // this dedup, each call issued its OWN fresh (differently-signed
    // every time) token, repeatedly changing User.ResaasContext and
    // cascading through every watch(User.ResaasContext) elsewhere (a
    // burst of duplicate dashboard loads seen as "a loop").
    const call1 = User.refreshResaasContext()
    const call2 = User.refreshResaasContext()
    const call3 = User.refreshResaasContext()

    expect(createResaasContext).toHaveBeenCalledTimes(1)

    resolveFn({ token: 'fresh-token' })
    await Promise.all([call1, call2, call3])

    expect(User.ResaasContext).toBe('fresh-token')
  })

  it('issues a new request for the next call once the previous one settles', async () => {
    createResaasContext
      .mockResolvedValueOnce({ token: 'token-a' })
      .mockResolvedValueOnce({ token: 'token-b' })

    const User = useUserStore()
    User.Entity = { id: 'entity-1' }

    await User.refreshResaasContext()
    expect(User.ResaasContext).toBe('token-a')

    await User.refreshResaasContext()
    expect(User.ResaasContext).toBe('token-b')

    expect(createResaasContext).toHaveBeenCalledTimes(2)
  })

  it('clears the context and skips the request entirely without an Entity', async () => {
    const User = useUserStore()
    User.Entity = null

    const result = await User.refreshResaasContext()

    expect(result).toBeNull()
    expect(User.ResaasContext).toBeNull()
    expect(createResaasContext).not.toHaveBeenCalled()
  })
})

// ------------------------------------------------------------------
// A stored Entity/Branch/Group is a preference, never an authorization:
// when the backend refuses to issue a context for it, it is discarded.
// ------------------------------------------------------------------

const refused = status => Object.assign(new Error('refused'), { response: { status } })

describe('UserStore - refused context selection', () => {
  beforeEach(() => localStorage.clear())

  it.each([403, 400])('a %s from resaas/context discards the selection (memory and storage)', async (status) => {
    createResaasContext.mockRejectedValue(refused(status))
    const User = useUserStore()
    User.Entity = { id: 'entity-of-another-user' }
    User.Branch = { id: 'b1' }
    User.Group = { id: 'g1' }
    for (const key of ['userEntity', 'userBranch', 'userGroup', 'userBranchs', 'userGroups']) {
      localStorage.setItem(key, '{"id":"x"}')
    }

    await expect(User.refreshResaasContext()).rejects.toThrow('refused')

    expect([User.Entity, User.Branch, User.Group, User.ResaasContext]).toEqual([null, null, null, null])
    for (const key of ['userEntity', 'userBranch', 'userGroup', 'userBranchs', 'userGroups']) {
      expect(localStorage.getItem(key)).toBeNull()
    }
  })

  it('does not retry a refused selection (no loop)', async () => {
    createResaasContext.mockRejectedValue(refused(403))
    const User = useUserStore()
    User.Entity = { id: 'e1' }

    await User.refreshResaasContext().catch(() => {})
    await User.refreshResaasContext()
    await User.renewResaasContextQuietly()

    expect(createResaasContext).toHaveBeenCalledTimes(1)
  })

  it.each([
    ['a server error', Object.assign(new Error('boom'), { response: { status: 500 } })],
    ['a network error', new Error('Network Error')]
  ])('%s keeps the selection', async (_, error) => {
    createResaasContext.mockRejectedValue(error)
    const User = useUserStore()
    User.Entity = { id: 'e1' }
    localStorage.setItem('userEntity', '{"id":"e1"}')

    await expect(User.refreshResaasContext()).rejects.toThrow()

    expect(User.Entity).toEqual({ id: 'e1' })
    expect(localStorage.getItem('userEntity')).toBe('{"id":"e1"}')
  })
})

describe('UserStore.logout - what survives', () => {
  beforeEach(() => localStorage.clear())

  async function signedInAndLogout(arg, { fail = false } = {}) {
    const { HTTPAuth } = await import('../services/api')
    fail ? HTTPAuth.post.mockRejectedValueOnce(new Error('offline')) : HTTPAuth.post.mockResolvedValueOnce({ data: {} })
    const User = useUserStore()
    User.data = { id: 'u1' }
    User.Entity = { id: 'e1', name: 'Clinic' }
    User.Group = { id: 'g1', name: 'Doctor' }
    User.Permissions = new Set(['view_patient'])
    localStorage.setItem('userEntity', JSON.stringify(User.Entity))
    localStorage.setItem('userGroup', JSON.stringify(User.Group))
    localStorage.setItem('access', 'token')
    await User.logout(arg)
    return User
  }

  it('never writes the profile back (no "[object Object]") and clears it in memory', async () => {
    const User = await signedInAndLogout('e1')

    expect(localStorage.getItem('userGroup')).toBeNull()
    expect(User.Group).toBeNull()
    expect(User.can('view_patient')).toBe(false)
  })

  it('"log out of this Entity" keeps only the Entity as the login hint', async () => {
    await signedInAndLogout('e1')

    expect(JSON.parse(localStorage.getItem('userEntity'))).toEqual({ id: 'e1', name: 'Clinic' })
    expect(localStorage.getItem('access')).toBeNull()
  })

  it('"log out of the Entity type" keeps no Entity', async () => {
    await signedInAndLogout('x')

    expect(localStorage.getItem('userEntity')).toBeNull()
  })

  it('a failed logout request still clears the session on the device', async () => {
    const User = await signedInAndLogout('x', { fail: true })

    expect(localStorage.getItem('access')).toBeNull()
    expect(User.data).toBeNull()
    expect(User.isLogout).toBe(true)
  })
})
