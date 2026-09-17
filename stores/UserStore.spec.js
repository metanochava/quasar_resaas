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
