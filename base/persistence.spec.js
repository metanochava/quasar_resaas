import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { nextTick } from 'vue'

vi.mock('../services/api', () => ({
  url: ({ url }) => url,
  HTTPAuth: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() },
  HTTPAuthBlob: { get: vi.fn() },
  HTTPClient: { get: vi.fn(), post: vi.fn() }
}))
vi.mock('../utils/autoForm', () => ({ buildFormFromSchema: vi.fn() }))

const { buildFormFromSchema } = await import('../utils/autoForm')
const { HTTPAuth } = await import('../services/api')
const { createBaseStore } = await import('./base_store')
const { useUserStore } = await import('../stores/UserStore')
const {
  buildStorageKey, clearPersistedStates, isStorageAvailable, normalizePersistOptions,
  readPersistedState, serializePersistedState, deserializePersistedState, setPersistStorage
} = await import('./persistence')

let seq = 0
// a fresh store definition per test (Pinia keeps definitions by id)
const define = (persist, extend = {}) =>
  createBaseStore(`persist-test-${++seq}`, { app: 'demo', model: 'Thing' }, { persist, ...extend })

const reload = () => setActivePinia(createPinia())
// writes happen once per tick (the watcher batches a tick's mutations)
const settle = () => nextTick()

function signIn(user = 'u1', entity = 'e1', branch = 'b1') {
  const User = useUserStore()
  User.data = user ? { id: user } : null
  User.Entity = entity ? { id: entity } : null
  User.Branch = branch ? { id: branch } : null
  return User
}

const stored = key => JSON.parse(localStorage.getItem(key))

// a Storage whose calls can be counted/failed (jsdom's localStorage methods
// cannot be spied on through Storage.prototype)
function memoryStorage() {
  const data = new Map()
  return {
    getItem: vi.fn(k => (data.has(k) ? data.get(k) : null)),
    setItem: vi.fn((k, v) => { data.set(k, String(v)) }),
    removeItem: vi.fn(k => { data.delete(k) }),
    key: i => [...data.keys()][i] ?? null,
    get length() { return data.size }
  }
}
const keyOf = store => store.$persist.key()

beforeEach(() => {
  localStorage.clear()
  setPersistStorage(undefined)
  reload()
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

// ------------------------------------------------------------------ basics

describe('persistence - basics', () => {
  it('writes changes to localStorage in a versioned envelope', async () => {
    const useThing = define({ scope: 'global', debounce: 0 })
    const store = useThing()

    store.setSearch('john')
    await settle()

    const record = stored(keyOf(store))
    expect(keyOf(store)).toBe(`resaas:v1:global:store:persist-test-${seq}`)
    expect(record.version).toBe(1)
    expect(record.expiresAt).toBeNull()
    expect(typeof record.createdAt).toBe('number')
    expect(record.state.search).toBe('john')
  })

  it('hydrates a new store (reload: a new Pinia) from localStorage', async () => {
    const useThing = define({ scope: 'global', debounce: 0 })
    useThing().setFilters({ status: 'active' })
    await settle()
    useThing().setRowsPerPage(50)
    await settle()

    reload()
    const store = useThing()

    expect(store.$hydrated).toBe(true)
    expect(store.filters).toEqual({ status: 'active' })
    expect(store.pagination.rowsPerPage).toBe(50)
  })

  it('debounces writes and flushes the last value', async () => {
    vi.useFakeTimers()
    const storage = memoryStorage()
    setPersistStorage(storage)
    const store = define({ scope: 'global', debounce: 100 })()

    for (let i = 0; i < 50; i++) {
      store.setSearch(`q${i}`)
      await settle()
    }
    expect(storage.setItem).not.toHaveBeenCalled()

    vi.advanceTimersByTime(100)
    expect(storage.setItem).toHaveBeenCalledTimes(1)
    expect(JSON.parse(storage.getItem(keyOf(store))).state.search).toBe('q49')
  })

  it('does not write when hydration or a no-op leaves the state unchanged', async () => {
    const storage = memoryStorage()
    setPersistStorage(storage)
    const useThing = define({ scope: 'global', debounce: 0 })
    useThing().setSearch('x')
    await settle()
    reload()
    storage.setItem.mockClear()

    const store = useThing()
    store.setSearch('x')
    await settle()

    expect(storage.setItem).not.toHaveBeenCalled()
  })

  it('keeps a restored page size instead of the schema default', async () => {
    const useThing = define({ scope: 'global', debounce: 0 })
    useThing().setRowsPerPage(50)
    await settle()
    reload()
    buildFormFromSchema.mockResolvedValue({ fields: [], pagination: { page_size: 10 } })

    const store = useThing()
    await store.loadSchema()

    expect(store.pagination.rowsPerPage).toBe(50)
  })
})

// ------------------------------------------------------------------ what is saved

describe('persistence - selection', () => {
  it('persist: true saves only search, filters and pagination', () => {
    const store = define(true)()
    signIn()
    store.$persist.flush()
    store.$patch({ search: 's', rows: [{ id: 1, name: 'Patient' }], form: { name: 'x' }, loading: true, errors: { a: 'b' } })
    store.$persist.flush()

    expect(Object.keys(stored(keyOf(store)).state).sort()).toEqual(['filters', 'pagination', 'search'])
  })

  it('include: only the listed fields are saved', async () => {
    const store = define({ scope: 'global', include: ['filters'], debounce: 0 })()
    store.setSearch('not saved')
    await settle()
    store.setFilters({ a: 1 })
    await settle()

    expect(stored(keyOf(store)).state).toEqual({ filters: { a: 1 } })
  })

  it('exclude: an excluded field is never saved, even if included', async () => {
    const store = define({ scope: 'global', include: ['search', 'filters'], exclude: ['search'], debounce: 0 })()
    store.setSearch('secret query')
    await settle()
    store.setFilters({ a: 1 })
    await settle()

    expect(stored(keyOf(store)).state).toEqual({ filters: { a: 1 } })
  })

  it('framework and security fields cannot be persisted, even when listed', () => {
    const options = normalizePersistOptions({ include: ['permissions', 'fields', 'access', 'ResaasContext', 'search'] }, 's')
    expect(options.include).toEqual(['search'])
  })

  it('nested sensitive keys, functions and non-plain values are dropped', async () => {
    const store = define({ scope: 'global', debounce: 0 })()
    store.setFilters({
      status: 'active',
      password: 'p',
      nested: { token: 't', ok: 1 },
      when: new Date('2026-01-02T03:04:05Z'),
      fn: () => 1,
      file: new Blob(['x'])
    })
    await settle()

    const { state } = readPersistedState(keyOf(store), store.$persist.options)
    expect(state.filters).toEqual({ status: 'active', nested: { ok: 1 }, when: new Date('2026-01-02T03:04:05Z') })
  })

  it('serialization round-trips dates, null and arrays, and survives circular references', () => {
    const loop = { a: 1 }
    loop.self = loop
    const text = serializePersistedState({ d: new Date(0), n: null, u: undefined, list: [1, 'x', null], loop })

    expect(deserializePersistedState(text)).toEqual({ d: new Date(0), n: null, list: [1, 'x', null], loop: { a: 1 } })
  })

  it('a state larger than maxBytes is not saved', async () => {
    const store = define({ scope: 'global', debounce: 0, maxBytes: 200 })()
    store.setSearch('x'.repeat(500))
    await settle()

    expect(localStorage.getItem(keyOf(store))).toBeNull()
    expect(store.search).toHaveLength(500) // still works in memory
  })
})

// ------------------------------------------------------------------ resilience

describe('persistence - resilience', () => {
  it('corrupted JSON: no crash, defaults, bad record removed', () => {
    const useThing = define({ scope: 'global' })
    const key = buildStorageKey({ store: `persist-test-${seq}`, scope: 'global' })
    localStorage.setItem(key, '{invalid-json')

    const store = useThing()

    expect(store.search).toBe('')
    expect(localStorage.getItem(key)).toBeNull()
  })

  it('a record without the envelope shape is discarded', () => {
    const useThing = define({ scope: 'global' })
    const key = buildStorageKey({ store: `persist-test-${seq}`, scope: 'global' })
    localStorage.setItem(key, JSON.stringify({ search: 'raw state' }))

    expect(useThing().search).toBe('')
    expect(localStorage.getItem(key)).toBeNull()
  })

  it('an old version is migrated and saved again as the new version', () => {
    const useThing = define({
      scope: 'global',
      version: 2,
      migrate: (state, from) => ({ search: `${state.query} (from v${from})` })
    })
    const key = buildStorageKey({ store: `persist-test-${seq}`, scope: 'global' })
    localStorage.setItem(key, JSON.stringify({ version: 1, createdAt: 1, updatedAt: 1, expiresAt: null, state: { query: 'old' } }))

    const store = useThing()

    expect(store.search).toBe('old (from v1)')
    expect(stored(key).version).toBe(2)
  })

  it('a failing migration: defaults, record removed, the app continues', () => {
    const useThing = define({ scope: 'global', version: 2, migrate: () => { throw new Error('boom') } })
    const key = buildStorageKey({ store: `persist-test-${seq}`, scope: 'global' })
    localStorage.setItem(key, JSON.stringify({ version: 1, createdAt: 1, updatedAt: 1, expiresAt: null, state: { search: 'x' } }))

    const store = useThing()

    expect(store.search).toBe('')
    expect(localStorage.getItem(key)).toBeNull()
  })

  it('an old version without migrate, or a newer version, is discarded', () => {
    const useThing = define({ scope: 'global', version: 2 })
    const key = buildStorageKey({ store: `persist-test-${seq}`, scope: 'global' })
    for (const version of [1, 3]) {
      localStorage.setItem(key, JSON.stringify({ version, createdAt: 1, updatedAt: 1, expiresAt: null, state: { search: 'x' } }))
      reload()
      expect(useThing().search).toBe('')
    }
  })

  it('TTL: a valid record hydrates, an expired one is discarded', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'))
    const useThing = define({ scope: 'global', ttl: 1000, debounce: 0 })
    useThing().setSearch('fresh')
    await settle()

    vi.setSystemTime(new Date('2026-01-01T00:00:00.500Z'))
    reload()
    expect(useThing().search).toBe('fresh')

    vi.setSystemTime(new Date('2026-01-01T00:00:02Z'))
    reload()
    const store = useThing()
    expect(store.search).toBe('')
    expect(localStorage.getItem(keyOf(store))).toBeNull()
  })

  it('QuotaExceededError: the store keeps working in memory', async () => {
    const storage = memoryStorage()
    storage.setItem.mockImplementation(() => { throw new DOMException('full', 'QuotaExceededError') })
    setPersistStorage(storage)
    const store = define({ scope: 'global', debounce: 0 })()

    expect(() => store.setSearch('x')).not.toThrow()
    await settle()
    expect(storage.setItem).toHaveBeenCalled()
    expect(store.search).toBe('x')
  })

  it('storage unavailable or throwing: Pinia continues normally', async () => {
    setPersistStorage(null)
    expect(isStorageAvailable()).toBe(false)
    const useThing = define({ scope: 'global', debounce: 0 })
    const store = useThing()
    store.setSearch('x')
    await settle()
    expect(store.search).toBe('x')

    setPersistStorage({
      getItem: () => { throw new Error('SecurityError') },
      setItem: () => { throw new Error('SecurityError') },
      removeItem: () => { throw new Error('SecurityError') },
      key: () => null,
      length: 0
    })
    reload()
    const other = useThing()
    expect(() => other.setSearch('y')).not.toThrow()
    expect(other.search).toBe('y')
  })
})

// ------------------------------------------------------------------ isolation

describe('persistence - user and tenant isolation', () => {
  it('scoped stores stay in memory until the user is known, then hydrate', async () => {
    const useThing = define({ scope: 'user', debounce: 0 })
    signIn('u1')
    useThing().setSearch('mine')
    await settle()
    reload()

    const store = useThing()
    expect(store.$hydrated).toBe(false)
    expect(store.search).toBe('')

    signIn('u1')
    expect(store.$hydrated).toBe(true)
    expect(store.search).toBe('mine')
  })

  it('User A state is never given to User B', async () => {
    const useThing = define({ scope: 'user', debounce: 0 })
    signIn('userA')
    const store = useThing()
    store.setFilters({ owner: 'A' })
    await settle()

    signIn('userB')
    expect(store.filters).toEqual({})
    store.setFilters({ owner: 'B' })
    await settle()

    signIn('userA')
    expect(store.filters).toEqual({ owner: 'A' })
  })

  it('Entity A state is not reused in Entity B', async () => {
    const useThing = define({ scope: 'entity', debounce: 0 })
    signIn('u1', 'entityA')
    const store = useThing()
    store.setFilters({ department: 'from A' })
    await settle()

    signIn('u1', 'entityB')
    expect(store.filters).toEqual({})

    signIn('u1', 'entityA')
    expect(store.filters).toEqual({ department: 'from A' })
  })

  it('Branch A and Branch B have independent states', async () => {
    const useThing = define({ scope: 'branch', debounce: 0 })
    signIn('u1', 'e1', 'branchA')
    const store = useThing()
    store.setSearch('A')
    await settle()

    signIn('u1', 'e1', 'branchB')
    expect(store.search).toBe('')
    store.setSearch('B')
    await settle()

    signIn('u1', 'e1', 'branchA')
    expect(store.search).toBe('A')
    expect(keyOf(store)).toBe(`resaas:v1:user:u1:entity:e1:branch:branchA:store:persist-test-${seq}`)
  })

  it('a pending (debounced) write goes to the old scope, not the new one', async () => {
    vi.useFakeTimers()
    const useThing = define({ scope: 'branch', debounce: 100 })
    signIn('u1', 'e1', 'b1')
    const store = useThing()
    const oldKey = keyOf(store)
    store.setSearch('typed in b1')
    await settle()

    signIn('u1', 'e1', 'b2')
    vi.advanceTimersByTime(200)

    expect(stored(oldKey).state.search).toBe('typed in b1')
    expect(localStorage.getItem(keyOf(store))).toBeNull()
  })

  it('logout clears the user-scoped records and keeps global preferences', async () => {
    const useGlobal = define({ scope: 'global', debounce: 0 })
    const useScoped = define({ scope: 'branch', debounce: 0 })
    const User = signIn('u1')
    useGlobal().setSearch('global pref')
    await settle()
    useScoped().setSearch('private')
    await settle()
    signIn('u2')
    useScoped().setSearch('other user')
    await settle()

    signIn('u1')
    HTTPAuth.post.mockRejectedValue(new Error('offline')) // even when the request fails
    await User.logout()

    const keys = Object.keys(localStorage)
    expect(keys.some(k => k.startsWith('resaas:v1:user:u1:'))).toBe(false)
    expect(keys.some(k => k.startsWith('resaas:v1:user:u2:'))).toBe(true)
    expect(keys).toContain(`resaas:v1:global:store:persist-test-${seq - 1}`)
    expect(useScoped().search).toBe('') // nothing left in memory for the next user
    expect(localStorage.getItem('access')).toBeNull()
  })

  it('clearPersistedStates cancels pending writes so they cannot bring data back', async () => {
    vi.useFakeTimers()
    const store = define({ scope: 'user', debounce: 100 })()
    signIn('u1')
    store.setSearch('pending')
    await settle()

    clearPersistedStates({ userId: 'u1' })
    vi.advanceTimersByTime(200)

    expect(Object.keys(localStorage).filter(k => k.startsWith('resaas:v1:user:u1:'))).toEqual([])
  })

  it('$clearPersistedState removes the record only; $resetPersisted also resets the fields', async () => {
    const store = define({ scope: 'global', debounce: 0 })()
    store.setSearch('x')
    await settle()

    store.$clearPersistedState()
    expect(localStorage.getItem(keyOf(store))).toBeNull()
    expect(store.search).toBe('x')

    store.setSearch('y')
    await settle()
    store.$resetPersisted()
    expect(localStorage.getItem(keyOf(store))).toBeNull()
    expect(store.search).toBe('')
  })
})

// ------------------------------------------------------------------ security

describe('persistence - localStorage is not authorization', () => {
  it('permissions/tokens/context planted in a record are ignored on hydration', () => {
    const useThing = define({ scope: 'global' })
    const key = buildStorageKey({ store: `persist-test-${seq}`, scope: 'global' })
    localStorage.setItem(key, JSON.stringify({
      version: 1, createdAt: 1, updatedAt: 1, expiresAt: null,
      state: {
        search: 'ok',
        permissions: { add: 'add_everything' },
        actions: [{ action: 'hard_delete', permission: null }],
        access: 'forged', ResaasContext: 'forged', rows: [{ id: 'other-entity-row' }],
        filters: { entity_id: 'another-entity', token: 'forged' }
      }
    }))

    const store = useThing()

    expect(store.search).toBe('ok')
    expect(store.permissions).toEqual({})
    expect(store.actions).toEqual([])
    expect(store.rows).toEqual([])
    expect(store.filters).toEqual({ entity_id: 'another-entity' }) // a UI filter value, nothing more
  })

  it('an edited entity id only selects a namespace: it creates no context or token', () => {
    const useThing = define({ scope: 'entity', debounce: 0 })
    const User = signIn('u1', 'another-entity')
    useThing()

    expect(User.ResaasContext).toBeNull()
    expect(sessionStorage.getItem('resaasContext')).toBeNull()
  })
})

// ------------------------------------------------------------------ compatibility

describe('persistence - backward compatibility', () => {
  it('a store without persist is the plain Pinia store and touches no storage', async () => {
    const storage = memoryStorage()
    setPersistStorage(storage)
    const useOld = createBaseStore(`legacy-${++seq}`, { app: 'demo', model: 'Thing' }, {
      state: () => ({ extra: 1 }),
      actions: { bump() { this.extra++ } }
    })
    const store = useOld()

    store.setSearch('x')
    await settle()
    store.bump()

    expect(store.$persist).toBeUndefined()
    expect(store.extra).toBe(2)
    expect(storage.setItem).not.toHaveBeenCalled()
    expect(storage.getItem).not.toHaveBeenCalled()
    expect(useOld.$id).toBe(`legacy-${seq}`)
  })

  it('persist: false or enabled: false turns it off', () => {
    expect(normalizePersistOptions(false, 's')).toBeNull()
    expect(normalizePersistOptions({ enabled: false }, 's')).toBeNull()
    expect(() => normalizePersistOptions({ scope: 'planet' }, 's')).toThrow(/scope/)
  })

  it('the real PermissionStore keeps its search per user, never the permissions', async () => {
    const { usePermissionStore } = await import('../stores/PermissionStore')
    signIn('u1')
    const Permission = usePermissionStore()
    Permission.search = 'patient'
    Permission.initPermissions([{ codename: 'view_patient' }], [{ codename: 'view_patient' }], { id: 1 })
    Permission.$persist.flush()

    const record = stored(Permission.$persist.key())
    expect(Permission.$persist.key()).toBe('resaas:v1:user:u1:store:permission')
    expect(record.state).toEqual({ search: 'patient' })
    expect(record.expiresAt - record.updatedAt).toBe(7 * 24 * 60 * 60 * 1000)
  })
})

// ------------------------------------------------------------------ per-user preferences

describe('per-user preferences (e.g. last_route)', () => {
  it('are kept per user and never read by another user', async () => {
    const { getUserPreference, setUserPreference } = await import('./persistence')
    setUserPreference('u1', 'last_route', '/saude/paciente/42')

    expect(getUserPreference('u1', 'last_route')).toBe('/saude/paciente/42')
    expect(getUserPreference('u2', 'last_route')).toBeNull()
    expect(localStorage.getItem('resaas:v1:user:u1:pref:last_route')).toBe('/saude/paciente/42')
  })

  it('without a user nothing is read or written', async () => {
    const { getUserPreference, setUserPreference } = await import('./persistence')

    expect(setUserPreference(null, 'last_route', '/x')).toBe(false)
    expect(getUserPreference(undefined, 'last_route')).toBeNull()
    expect(localStorage.length).toBe(0)
  })

  it('logout removes them with the rest of the user state', async () => {
    const { setUserPreference } = await import('./persistence')
    setUserPreference('u1', 'last_route', '/a')
    setUserPreference('u2', 'last_route', '/b')

    clearPersistedStates({ userId: 'u1' })

    expect(Object.keys(localStorage)).toEqual(['resaas:v1:user:u2:pref:last_route'])
  })
})
