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

  it('encodes accented characters correctly', () => {
    const result = url({
      type: 'u',
      url: 'demo/products',
      params: { search: 'José Silva' },
    })

    const query = new URL(result).searchParams
    expect(query.get('search')).toBe('José Silva')
  })

  it('encodes literal &, =, and ? in param values without corrupting the query string', () => {
    const result = url({
      type: 'u',
      url: 'demo/products',
      params: { search: 'a&b=c?d' },
    })

    const query = new URL(result).searchParams
    expect(query.get('search')).toBe('a&b=c?d')
    // only the params we actually passed made it into the query string
    expect([...query.keys()]).toEqual(['format', 'search'])
  })

  it('keeps falsy-but-meaningful values: 0, false, and an empty string', () => {
    const result = url({
      type: 'u',
      url: 'demo/products',
      params: { page: 0, active: false, search: '' },
    })

    const query = new URL(result).searchParams
    expect(query.has('page')).toBe(true)
    expect(query.get('page')).toBe('0')
    expect(query.has('active')).toBe(true)
    expect(query.get('active')).toBe('false')
    expect(query.has('search')).toBe(true)
    expect(query.get('search')).toBe('')
  })

  it('a realistic multi-value filter set (search with accents + array filter) resolves correctly', () => {
    const result = url({
      type: 'u',
      url: 'demo/products',
      params: { search: 'José Silva', state: ['Active', 'Pending'] },
    })

    const query = new URL(result).searchParams
    expect(query.get('search')).toBe('José Silva')
    expect(query.getAll('state')).toEqual(['Active', 'Pending'])
  })

  it('encodes #, +, %, and / in param values without corrupting the query string', () => {
    const result = url({
      type: 'u',
      url: 'demo/products',
      params: { search: 'a#b+c%d/e' },
    })

    const query = new URL(result).searchParams
    expect(query.get('search')).toBe('a#b+c%d/e')
    expect([...query.keys()]).toEqual(['format', 'search'])
  })

  it('keeps a literal boolean true value', () => {
    const result = url({
      type: 'u',
      url: 'demo/products',
      params: { active: true },
    })

    const query = new URL(result).searchParams
    expect(query.get('active')).toBe('true')
  })

  it('an empty array param contributes no keys at all (deterministic no-op)', () => {
    const result = url({
      type: 'u',
      url: 'demo/products',
      params: { status: [] },
    })

    const query = new URL(result).searchParams
    expect(query.has('status')).toBe(false)
    expect([...query.keys()]).toEqual(['format'])
  })

  it('a plain string param produces the expected ?key=value', () => {
    const result = url({
      type: 'u',
      url: 'demo/products',
      params: { search: 'produto' },
    })

    expect(result).toBe(
      'https://api.test/v1/demo/products?format=json&search=produto'
    )
  })
})

describe('url() - path building (no duplicate/missing slashes)', () => {
  it('a path with a trailing slash, no trailing slash, and a stray leading slash all resolve to the same base', () => {
    const withTrailing = url({ type: 'u', url: 'demo/products/', params: {} })
    const withLeading = url({ type: 'u', url: '/demo/products/', params: {} })

    // both join onto apiBaseUrl with exactly one slash - no "//" anywhere
    // past the protocol, and the meaningful trailing slash (DRF's
    // APPEND_SLASH) is preserved either way
    expect(withTrailing).not.toMatch(/[^:]\/\//)
    expect(withLeading).not.toMatch(/[^:]\/\//)
    expect(withTrailing).toBe(withLeading)
    expect(withTrailing).toBe('https://api.test/v1/demo/products/?format=json')
  })

  it('a detail URL built from a trailing-slash-free safeUrl never doubles the slash', () => {
    // mirrors how base_store.js builds `${this.safeUrl}/${id}/`
    const result = url({ type: 'u', url: 'demo/products/42/', params: {} })
    expect(result).not.toMatch(/[^:]\/\//)
  })
})
