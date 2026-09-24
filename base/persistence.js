// Persistence of BaseStore state in localStorage (createBaseStore's `persist`
// option - docs/quasar-resaas/stores/persistence.md).
//
// What it is for: UX only (search, filters, pagination, UI preferences
// survive F5). localStorage is NOT a security boundary: the user can edit
// every value, so nothing restored here authorizes anything. Tokens, the
// signed X-RESAAS-Context and permissions keep their own architecture and
// are never written by this module.
//
// Record: one localStorage key per store and scope, holding a versioned
// envelope { version, createdAt, updatedAt, expiresAt, state }.
//
// Every storage access is guarded: no storage, a quota error, corrupted JSON
// or a failing migration leave the store working in memory with its defaults.

import { markRaw, watch } from 'vue'

export const KEY_PREFIX = 'resaas:v1'
export const SCOPES = ['global', 'user', 'entity', 'branch']

// what `persist: true` saves on a BaseStore: operational preferences only
export const DEFAULT_INCLUDE = ['search', 'filters', 'pagination']

// transient/request state and API payloads: not saved unless a store lists
// the field in `include` on purpose (e.g. a non-sensitive catalogue)
export const DEFAULT_EXCLUDE = [
  'loading', 'saving', 'submitting', 'deleting', 'error', 'errors',
  'showPdf', 'pdf', 'rows', 'row', 'form', 'dirty'
]

// never saved, whatever the configuration: framework internals derived from
// the backend (schema, authorization) and security state
export const NEVER_PERSISTED = [
  '_config', 'url', 'app', 'model', '_schemaLoaded', 'schemaEndpoint',
  '_schemaFields', 'fields', 'actions', 'config', 'permissions', 'Permissions',
  'pdfConfig', 'paginationConfig',
  'access', 'refresh', 'tokens', 'token', 'ResaasContext', 'twoFactorStep',
  'password', 'temporary_password', 'recovery_codes', 'secret'
]

// nested keys dropped anywhere in a saved value (a filter object holding a
// password or a token by mistake)
const SENSITIVE_KEY = /password|secret|token|recovery_codes|private_?key|credential|^otp$|^access$|^refresh$/i

const DEFAULT_DEBOUNCE = 100
const DEFAULT_MAX_BYTES = 100 * 1024

const DEV = (() => {
  try { return Boolean(import.meta.env?.DEV) } catch { return false }
})()

// diagnostics without values (never print stored data)
function log(level, message) {
  if (!DEV) return
  // eslint-disable-next-line no-console
  console[level](`[persist] ${message}`)
}

// ============================================================
// Storage access
// ============================================================

let storageOverride

// tests / non-browser hosts: inject a Storage-like object (or null = none)
export function setPersistStorage(storage) {
  storageOverride = storage
}

function storage() {
  if (storageOverride !== undefined) return storageOverride
  try {
    return typeof window !== 'undefined' && window.localStorage ? window.localStorage : null
  } catch {
    return null // SecurityError (blocked cookies/storage)
  }
}

export function isStorageAvailable() {
  const s = storage()
  if (!s) return false
  try {
    const probe = `${KEY_PREFIX}:probe`
    s.setItem(probe, '1')
    s.removeItem(probe)
    return true
  } catch {
    return false
  }
}

function readRaw(key) {
  try { return storage()?.getItem(key) ?? null } catch { return null }
}

function writeRaw(key, value) {
  try {
    const s = storage()
    if (!s) return false
    s.setItem(key, value)
    return true
  } catch (error) {
    log('warn', `could not write ${key} (${error?.name || 'storage error'}); kept in memory only`)
    return false
  }
}

function removeRaw(key) {
  try { storage()?.removeItem(key) } catch { /* storage unavailable */ }
}

function allKeys() {
  try {
    const s = storage()
    if (!s) return []
    const keys = []
    for (let i = 0; i < s.length; i++) keys.push(s.key(i))
    return keys
  } catch {
    return []
  }
}

// ============================================================
// Keys
// ============================================================

const part = value => encodeURIComponent(String(value))

// The ONE place a persisted-state key is built. null when the scope needs an
// identity that is not known yet (not signed in, no Entity/Branch selected):
// the store then stays in memory only.
export function buildStorageKey({ store, scope = 'global', identity = {} }) {
  if (!store) return null
  const { userId, entityId, branchId } = identity || {}

  if (scope === 'global') return `${KEY_PREFIX}:global:store:${part(store)}`
  if (!userId) return null
  const user = `${KEY_PREFIX}:user:${part(userId)}`

  if (scope === 'user') return `${user}:store:${part(store)}`
  if (!entityId) return null
  const entity = `${user}:entity:${part(entityId)}`

  if (scope === 'entity') return `${entity}:store:${part(store)}`
  if (!branchId) return null
  return `${entity}:branch:${part(branchId)}:store:${part(store)}`
}

// A single per-user UI value outside any store (e.g. the last route). Same
// namespace as the user's persisted stores, so logout
// (clearPersistedStates({ userId })) removes it too. No user = nothing is
// read or written.
export function userPreferenceKey(userId, name) {
  return userId ? `${KEY_PREFIX}:user:${part(userId)}:pref:${part(name)}` : null
}

export function getUserPreference(userId, name) {
  const key = userPreferenceKey(userId, name)
  return key ? readRaw(key) : null
}

export function setUserPreference(userId, name, value) {
  const key = userPreferenceKey(userId, name)
  if (!key) return false
  if (value === null || value === undefined) {
    removeRaw(key)
    return true
  }
  return writeRaw(key, String(value))
}

// ============================================================
// Options
// ============================================================

export function normalizePersistOptions(persist, storeName) {
  if (!persist) return null
  const options = persist === true ? {} : { ...persist }
  if (options.enabled === false) return null

  const scope = options.scope ?? 'branch'
  if (!SCOPES.includes(scope)) {
    throw new Error(`persist.scope of store "${storeName}" must be one of ${SCOPES.join(', ')}`)
  }

  const explicitInclude = Array.isArray(options.include) ? options.include : null
  const exclude = new Set([...(options.exclude || []), ...NEVER_PERSISTED])
  // a default-excluded field is saved only when the store names it
  const include = (explicitInclude || DEFAULT_INCLUDE).filter(
    key => !exclude.has(key) && (explicitInclude || !DEFAULT_EXCLUDE.includes(key))
  )

  return {
    store: storeName,
    scope,
    include,
    version: Number.isInteger(options.version) && options.version > 0 ? options.version : 1,
    ttl: options.ttl > 0 ? options.ttl : null,
    debounce: options.debounce >= 0 ? options.debounce : DEFAULT_DEBOUNCE,
    maxBytes: options.maxBytes > 0 ? options.maxBytes : DEFAULT_MAX_BYTES,
    migrate: typeof options.migrate === 'function' ? options.migrate : null
  }
}

// ============================================================
// Serialization
// ============================================================

function isPlainObject(value) {
  if (!value || typeof value !== 'object') return false
  const proto = Object.getPrototypeOf(value)
  return proto === Object.prototype || proto === null
}

// Plain JSON-safe copy: Date kept as {$date} (or as a Date with keepDates),
// sensitive keys, functions, Promises, File/Blob, DOM nodes, class instances
// and circular references dropped. `undefined` means "not serializable".
function toPlain(value, seen, path, keepDates = false) {
  if (value === null) return null
  const type = typeof value
  if (type === 'string' || type === 'boolean') return value
  if (type === 'number') return Number.isFinite(value) ? value : null
  if (type === 'undefined' || type === 'function' || type === 'symbol' || type === 'bigint') return undefined

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null
    return keepDates ? new Date(value.getTime()) : { $date: value.toISOString() }
  }

  if (seen.has(value)) {
    log('warn', `circular reference at ${path} not saved`)
    return undefined
  }

  if (Array.isArray(value)) {
    seen.add(value)
    const out = value.map((item, i) => {
      const plain = toPlain(item, seen, `${path}[${i}]`, keepDates)
      return plain === undefined ? null : plain
    })
    seen.delete(value)
    return out
  }

  if (!isPlainObject(value)) {
    log('warn', `${path} is not a plain value and was not saved`)
    return undefined
  }

  seen.add(value)
  const out = {}
  for (const [key, item] of Object.entries(value)) {
    if (SENSITIVE_KEY.test(key)) continue
    const plain = toPlain(item, seen, `${path}.${key}`, keepDates)
    if (plain !== undefined) out[key] = plain
  }
  seen.delete(value)
  return out
}

export function serializePersistedState(state) {
  const plain = toPlain(state, new WeakSet(), 'state')
  return plain === undefined ? null : JSON.stringify(plain)
}

export function deserializePersistedState(text) {
  return JSON.parse(text, (key, value) =>
    value && typeof value === 'object' && !Array.isArray(value) &&
    Object.keys(value).length === 1 && typeof value.$date === 'string'
      ? new Date(value.$date)
      : value
  )
}

// only the configured top-level fields (anything else in storage - edited
// by hand or left by an older version - is ignored)
export function pickPersisted(state, include) {
  const picked = {}
  for (const key of include) {
    if (state && key in state) picked[key] = state[key]
  }
  return picked
}

// ============================================================
// Read / write one record
// ============================================================

// -> { state, migrated } or null (nothing usable; bad records are removed)
export function readPersistedState(key, options, now = Date.now()) {
  const raw = readRaw(key)
  if (raw === null) return null

  let envelope
  try {
    envelope = deserializePersistedState(raw)
  } catch {
    removeRaw(key)
    log('warn', `corrupted state removed (${options.store})`)
    return null
  }

  if (!isPlainObject(envelope) || !isPlainObject(envelope.state) || !Number.isInteger(envelope.version)) {
    removeRaw(key)
    log('warn', `invalid state removed (${options.store})`)
    return null
  }

  if (envelope.expiresAt && envelope.expiresAt <= now) {
    removeRaw(key)
    log('info', `discarded expired state (${options.store})`)
    return null
  }

  let state = envelope.state
  let migrated = false

  if (envelope.version !== options.version) {
    if (envelope.version > options.version || !options.migrate) {
      removeRaw(key)
      log('info', `discarded state version ${envelope.version} (${options.store} expects ${options.version})`)
      return null
    }
    try {
      state = options.migrate(state, envelope.version)
      migrated = true
      log('info', `migration ${envelope.version} -> ${options.version} (${options.store})`)
    } catch {
      removeRaw(key)
      log('warn', `migration ${envelope.version} -> ${options.version} failed; defaults used (${options.store})`)
      return null
    }
    if (!isPlainObject(state)) {
      removeRaw(key)
      return null
    }
  }

  // sanitize: configured fields only, through the same filter as a write
  const clean = toPlain(pickPersisted(state, options.include), new WeakSet(), 'state', true)
  return { state: clean || {}, migrated, createdAt: envelope.createdAt }
}

// -> the serialized state written, or null when nothing was written
export function writePersistedState(key, options, state, { createdAt, now = Date.now() } = {}) {
  const body = serializePersistedState(pickPersisted(state, options.include))
  if (body === null) return null

  const envelope = `{"version":${options.version},"createdAt":${createdAt || now},` +
    `"updatedAt":${now},"expiresAt":${options.ttl ? now + options.ttl : null},"state":${body}}`

  if (envelope.length > options.maxBytes) {
    removeRaw(key)
    log('warn', `state of ${options.store} is larger than ${options.maxBytes} bytes and was not saved`)
    return null
  }

  return writeRaw(key, envelope) ? body : null
}

// ============================================================
// Live stores
// ============================================================

const controllers = new Set()

// Removes persisted states. `userId`: every user/entity/branch-scoped record
// of that user (logout). `all`: every record written by this module.
// Pending debounced writes of those records are cancelled so they cannot
// bring the data back.
export function clearPersistedStates({ userId = null, all = false } = {}) {
  const prefix = all ? `${KEY_PREFIX}:` : userId ? `${KEY_PREFIX}:user:${part(userId)}:` : null
  if (!prefix) return 0

  controllers.forEach(controller => controller.cancelIfUnder(prefix))

  const keys = allKeys().filter(key => key && key.startsWith(prefix))
  keys.forEach(removeRaw)
  if (keys.length) log('info', `cleared ${keys.length} persisted state(s)`)
  return keys.length
}

// Pending writes are flushed when the page is hidden/unloaded (F5 within the
// debounce window keeps the last change).
let unloadHooked = false
function hookUnload() {
  if (unloadHooked || typeof window === 'undefined' || !window.addEventListener) return
  unloadHooked = true
  window.addEventListener('pagehide', () => controllers.forEach(c => c.flush()))
}

// Attaches persistence to a store instance (once). `identity()` returns
// { userId, entityId, branchId } (reactive source: UserStore); `watchIdentity`
// registers a callback run when it changes; `initialState()` gives a fresh
// default state (used to reset the persisted fields on a scope change).
export function attachPersistence(store, options, { identity, watchIdentity, initialState }) {
  if (!options || store.$persist) return store

  let key = null
  let timer = null
  let lastWritten = null
  let createdAt = null
  let suppress = false
  const restored = new Set()

  const current = () => pickPersisted(store.$state, options.include)

  function write() {
    timer = null
    if (!key) return
    const body = serializePersistedState(current())
    if (body === null || body === lastWritten) return
    const written = writePersistedState(key, options, store.$state, { createdAt })
    if (written !== null) {
      lastWritten = written
      createdAt = createdAt || Date.now()
    }
  }

  // at most one write per `debounce` window; the write reads the state at
  // that moment, so the last change always wins (no timer reset per mutation)
  function schedule() {
    if (suppress || !key) return
    if (options.debounce === 0) write()
    else if (!timer) timer = setTimeout(write, options.debounce)
  }

  // writes now whatever is pending (page hide/unload, tests)
  function flush() {
    if (timer) { clearTimeout(timer); timer = null }
    write()
  }

  // replaces the fields (an object $patch would MERGE nested objects: old
  // filters of another scope would survive)
  function patchSilently(state) {
    suppress = true
    try {
      store.$patch(target => {
        for (const [field, value] of Object.entries(state)) target[field] = value
      })
    } finally {
      suppress = false
    }
  }

  function hydrate() {
    key = buildStorageKey({ store: options.store, scope: options.scope, identity: identity() })
    lastWritten = null
    createdAt = null
    store.$hydrated = false
    restored.clear()
    if (!key) return

    const record = readPersistedState(key, options)
    if (record) {
      patchSilently(record.state)
      Object.keys(record.state).forEach(field => restored.add(field))
      createdAt = record.createdAt || null
      log('debug', `hydrated ${options.store}`)
    }
    lastWritten = serializePersistedState(current())
    if (record?.migrated) {
      lastWritten = null
      write() // saved again as the current version
    }
    store.$hydrated = true
  }

  // scope change (login, logout, other Entity/Branch): the old namespace
  // keeps its state, the new one starts from its own record or the defaults
  function rekey() {
    const next = buildStorageKey({ store: options.store, scope: options.scope, identity: identity() })
    if (next === key) return
    // the old scope gets its last change, even one made in this same tick
    // (the batched watcher has not run yet)
    if (timer) { clearTimeout(timer); timer = null }
    write()
    patchSilently(pickPersisted(initialState(), options.include))
    hydrate()
  }

  const controller = {
    flush,
    // the record was deleted on purpose: drop the pending write and treat the
    // current values as saved, so a scope change right after (logout) does
    // not write them back
    cancelIfUnder(prefix) {
      if (!key || !key.startsWith(prefix)) return
      if (timer) { clearTimeout(timer); timer = null }
      lastWritten = serializePersistedState(current())
    }
  }
  controllers.add(controller)
  hookUnload()

  // not state: markRaw keeps it out of Pinia's reactivity and $state
  store.$persist = markRaw({ options, key: () => key, flush, restored })
  store.$clearPersistedState = () => {
    if (timer) { clearTimeout(timer); timer = null }
    if (key) removeRaw(key)
    lastWritten = serializePersistedState(current()) // not re-written until it changes
  }
  store.$resetPersisted = () => {
    store.$clearPersistedState()
    patchSilently(pickPersisted(initialState(), options.include))
    lastWritten = serializePersistedState(current())
  }

  hydrate()
  // only the persisted fields are watched ($subscribe would deep-traverse the
  // whole state - rows included); the default 'pre' flush batches the
  // mutations of one tick into one callback
  watch(() => options.include.map(field => store.$state[field]), schedule, { deep: true })
  if (options.scope !== 'global') watchIdentity(rekey)

  return store
}

// fields restored from storage in this session (e.g. keep a restored
// rowsPerPage instead of the schema's default page size)
export function isPersistedField(store, field) {
  return Boolean(store.$persist?.restored.has(field))
}
