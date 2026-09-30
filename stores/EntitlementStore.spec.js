import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

const httpGet = vi.fn()
let context = 'ctx-a'

vi.mock('../services/api', () => ({
  url: ({ url }) => url,
  HTTPAuth: { get: (...args) => httpGet(...args) },
}))
vi.mock('../services/tenantContext', () => ({
  getResaasContext: () => context,
}))

const { useEntitlementStore } = await import('./EntitlementStore')

const RESTRICTED = {
  restricted: true,
  features: { multi_entity: false, advanced_audit: true },
  capacities: {
    branches: { limit: 3, used: 3 },
    users: { limit: 20, used: 4 },
    entities: { limit: null, used: 1 },
  },
}

beforeEach(() => {
  setActivePinia(createPinia())
  httpGet.mockReset()
  context = 'ctx-a'
})

describe('EntitlementStore', () => {
  it('reads resaas/entitlements/', async () => {
    httpGet.mockResolvedValueOnce({ data: RESTRICTED })
    const store = useEntitlementStore()

    await store.load()

    expect(httpGet).toHaveBeenCalledWith('resaas/entitlements/')
    expect(store.restricted).toBe(true)
    expect(store.getCapacity('users')).toEqual({ limit: 20, used: 4 })
  })

  it('answers features from what the backend listed when restricted', async () => {
    httpGet.mockResolvedValueOnce({ data: RESTRICTED })
    const store = useEntitlementStore()
    await store.load()

    expect(store.hasFeature('advanced_audit')).toBe(true)
    expect(store.hasFeature('multi_entity')).toBe(false)
    expect(store.hasFeature('unknown')).toBe(false)
  })

  it('does not hide anything when nothing is restricted or before loading', async () => {
    const store = useEntitlementStore()
    expect(store.loaded).toBe(false)
    expect(store.hasFeature('anything')).toBe(true)
    expect(store.canAdd('branches')).toBe(true)

    httpGet.mockResolvedValueOnce({ data: { restricted: false, features: {}, capacities: {} } })
    await store.load()
    expect(store.hasFeature('anything')).toBe(true)
  })

  it('canAdd stops exactly at the limit; a null limit is unlimited', async () => {
    httpGet.mockResolvedValueOnce({ data: RESTRICTED })
    const store = useEntitlementStore()
    await store.load()

    expect(store.canAdd('branches')).toBe(false)
    expect(store.canAdd('users')).toBe(true)
    expect(store.canAdd('users', 16)).toBe(true)
    expect(store.canAdd('users', 17)).toBe(false)
    expect(store.canAdd('entities', 1000)).toBe(true)
  })

  it('does not reload for the same context, reloads for another one', async () => {
    httpGet.mockResolvedValue({ data: RESTRICTED })
    const store = useEntitlementStore()

    await store.load()
    await store.load()
    expect(httpGet).toHaveBeenCalledTimes(1)

    context = 'ctx-b'
    await store.load()
    expect(httpGet).toHaveBeenCalledTimes(2)

    await store.load({ force: true })
    expect(httpGet).toHaveBeenCalledTimes(3)
  })
})
