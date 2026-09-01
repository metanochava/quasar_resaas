import { describe, it, expect, beforeAll, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

// url() reads process.env.API / API_PREFIX at module-eval time (Quasar's
// build normally injects these), so they must be set before the dynamic
// import below runs.
process.env.API = 'https://api.test'
process.env.API_PREFIX = 'v1'

// url() also calls useUserStore() for the 'nu' entity-type prefix - stub it
// out so this stays a focused unit test of the query-string building logic,
// not a test of UserStore itself (which pulls in a lot of unrelated
// machinery - see base_store.spec.js's own mock of '../services/api' for
// the same reasoning, the other way around).
vi.mock('../stores/UserStore', () => ({
  useUserStore: () => ({ EntityType: { name: 'Clinic' } }),
}))

// axios response/error interceptors in api.js call Alert(), which pulls in
// the real `quasar` package (a peerDependency the consuming app provides,
// not installed in this library's own devDependencies) - stub it out so
// this test only exercises url()'s own query-string logic.
vi.mock('../boot/alerts', () => ({ Alert: () => {} }))

let url

beforeAll(async () => {
  setActivePinia(createPinia())
  ;({ url } = await import('./api'))
})

describe('url()', () => {
  it('always includes format=json first', () => {
    expect(url({ type: 'u', url: 'demo/products', params: {} })).toBe(
      'https://api.test/v1/demo/products?format=json'
    )
  })

  it('appends the "nu" entity-type prefix', () => {
    expect(url({ type: 'nu', url: 'products', params: {} })).toBe(
      'https://api.test/v1/clinic/products?format=json'
    )
  })

  it('encodes special characters and spaces in param values', () => {
    const result = url({
      type: 'u',
      url: 'demo/products',
      params: { search: 'a b&c' },
    })

    const query = new URL(result).searchParams
    expect(query.get('search')).toBe('a b&c')
  })

  it('serializes an array param as repeated key=value pairs', () => {
    const result = url({
      type: 'u',
      url: 'demo/products',
      params: { status: ['active', 'pending'] },
    })

    const query = new URL(result).searchParams
    expect(query.getAll('status')).toEqual(['active', 'pending'])
  })

  it('supports multiple distinct filters and pagination params together', () => {
    const result = url({
      type: 'u',
      url: 'demo/products',
      params: { page: 2, page_size: 50, search: 'widget' },
    })

    const query = new URL(result).searchParams
    expect(query.get('page')).toBe('2')
    expect(query.get('page_size')).toBe('50')
    expect(query.get('search')).toBe('widget')
  })

  it('omits null/undefined param values entirely', () => {
    const result = url({
      type: 'u',
      url: 'demo/products',
      params: { search: undefined, filter: null, page: 1 },
    })

    const query = new URL(result).searchParams
    expect(query.has('search')).toBe(false)
    expect(query.has('filter')).toBe(false)
    expect(query.get('page')).toBe('1')
  })
})
