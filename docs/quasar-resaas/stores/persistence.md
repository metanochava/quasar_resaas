# Store persistence (`persist`)

`createBaseStore(name, config, { persist })` can keep **part** of a store's
state in `localStorage`, so it survives a reload (F5) without a request.
The engine lives in `base/persistence.js`; `base/base_store.js` attaches it.
It is **opt-in**: a store without `persist` is exactly the plain Pinia store
it always was and touches no storage.

```text
Pinia store ── change ──► (batched, debounced) ──► localStorage
     ▲                                                  │
     └──────────── hydration when the store is created ─┘
```

What it is for: **UX** (search text, filters, pagination, UI preferences).
What it is not: a cache of API records, a session, or authorization.

## Why localStorage (and not cookies)

| | Cookie | localStorage |
|---|---|---|
| Sent to the backend | automatically, on **every** request to the domain | never (only what the code puts in a request) |
| Size | ~4 KB each; many cookies make request headers grow (`431 Request Header Fields Too Large`) | ~5 MB per origin, not part of requests |
| Readable by JS | yes (unless `HttpOnly`) | yes |

UI state does not belong in requests, so it goes to localStorage. No
quasar_resaas or dev/front code stores UI state in cookies today
(`services/storage.js` still offers `'c'`, unused), so there is nothing to
migrate from cookies.

## Basic use

```js
export const useThingStore = createBaseStore('thing', { app: 'demo', model: 'Thing' }, {
  persist: true
})
```

`persist: true` saves `search`, `filters` and `pagination`, scoped to the
current user + Entity + Branch (`scope: 'branch'`).

## Configuration

```js
persist: {
  enabled: true,            // false = off (same as omitting persist)
  scope: 'branch',          // 'global' | 'user' | 'entity' | 'branch' (default 'branch')
  include: ['search'],      // top-level state fields to save (default: search, filters, pagination)
  exclude: ['filters'],     // never saved, even if included
  version: 1,               // version of the saved shape (default 1)
  migrate: (state, fromVersion) => newState,  // optional, see Versions
  ttl: 7 * 24 * 60 * 60 * 1000,               // ms; null = no expiry (default)
  debounce: 100,            // ms; at most one write per window (default 100, 0 = every tick)
  maxBytes: 100 * 1024      // a bigger record is not saved (default 100 KB)
}
```

### What is saved

| Category | Fields | Rule |
|---|---|---|
| Default | `search`, `filters`, `pagination` | saved with `persist: true` |
| Transient / API payload | `loading`, `saving`, `submitting`, `deleting`, `error`, `errors`, `showPdf`, `pdf`, `rows`, `row`, `form`, `dirty` | not saved unless the store names the field in `include` (e.g. a non-sensitive catalogue) |
| Never | `_config`, `url`, `app`, `model`, `_schemaLoaded`, `schemaEndpoint`, `_schemaFields`, `fields`, `actions`, `config`, `permissions`, `Permissions`, `pdfConfig`, `paginationConfig`, `access`, `refresh`, `token(s)`, `ResaasContext`, `twoFactorStep`, `password`, `temporary_password`, `recovery_codes`, `secret` | removed even if listed in `include` |
| Nested keys | any key matching `password`, `secret`, `token`, `recovery_codes`, `private_key`, `credential`, `otp`, `access`, `refresh` | dropped inside saved objects (a filter holding a token by mistake) |
| Not serializable | functions, Promises, `File`/`Blob`, DOM nodes, `AbortController`, class instances, circular references | dropped (dev warning with the field path, never the value) |

Supported values: strings, numbers, booleans, `null`, arrays, plain objects
and `Date` (restored as a `Date`). `undefined` is dropped.

**Privacy.** Stores holding personal or clinical data (Patient, Health, HR,
Finance) must not list `rows`/`row`/`form` or search texts that contain
names in `include`. localStorage stays on the device after the tab closes.

## Scopes and keys

Every key is built by `buildStorageKey()`:

| Scope | Key | Needs |
|---|---|---|
| `global` | `resaas:v1:global:store:<store>` | nothing |
| `user` | `resaas:v1:user:<userId>:store:<store>` | signed-in user |
| `entity` | `resaas:v1:user:<userId>:entity:<entityId>:store:<store>` | user + Entity |
| `branch` | `resaas:v1:user:<userId>:entity:<entityId>:branch:<branchId>:store:<store>` | user + Entity + Branch |

The identity comes from `UserStore` (`data.id`, `Entity.id`, `Branch.id`).
While a scope's identity is unknown (not signed in yet, no Branch selected),
the store works in memory only and `store.$hydrated` is `false`.

### Switching user, Entity or Branch

The key is recomputed as soon as `UserStore` changes:

```text
Entity A ── state A saved (the last change, even in the same tick)
switch to Entity B ── persisted fields reset to their defaults
                  ── hydrate from B's record, if any
```

State of Entity A never shows up in Entity B, and User A's never shows up for
User B.

## Hydration

Synchronous, when the store is first used (`useThingStore()`), with no request:

```text
record found? ─ no ─► defaults
      │ yes
parse JSON ─ fails ─► remove record, defaults
envelope valid? ─ no ─► remove, defaults
expired (ttl)? ─ yes ─► remove, defaults
version differs? ─► migrate (or discard) ─ fails ─► remove, defaults
sanitize (configured fields only, same filter as a write)
$patch ─► store.$hydrated = true
```

A page size restored from storage wins over the schema's `page_size`
(`loadSchema()` keeps it).

Record format:

```json
{ "version": 1, "createdAt": 1767225600000, "updatedAt": 1767225700000,
  "expiresAt": null, "state": { "search": "patient" } }
```

## Versions and migrations

Bump `version` when the saved shape changes. A record of an older version
goes through `migrate(state, fromVersion)` and is saved again as the new
version. Without `migrate`, or for a *newer* version (downgrade), or if
`migrate` throws, the record is removed and the defaults are used. The app
always starts.

```js
persist: {
  include: ['filters'],
  version: 2,
  migrate: (state, from) => (from === 1 ? { filters: { status: state.status } } : state)
}
```

## Writes

- Only the persisted fields are watched (not the whole state), with Vue's
  batched flush: several mutations in one tick make one callback.
- `debounce` (100 ms by default): at most one write per window. The write
  reads the state when it runs, so the last change wins.
- Nothing is written when the serialized state did not change (hydration
  itself never writes).
- Pending writes are flushed on `pagehide` (F5 just after a change keeps it).
- Measured in jsdom: a change costs ~0.2 ms with persistence (vs ~0.01 ms
  without). With `debounce: 0` every change is a `setItem` (~1 ms in jsdom).

## Store API

| Member | Effect |
|---|---|
| `store.$hydrated` | `true` once the store read its record (or found none) for the current identity |
| `store.$reset()` | Pinia's reset of the whole runtime state; the persisted copy follows like any change (defaults written) |
| `store.$clearPersistedState()` | removes the record; the runtime state stays as it is and is saved again on the next change |
| `store.$resetPersisted()` | removes the record **and** puts the persisted fields back to their defaults |
| `store.$persist.flush()` | writes a pending change now |
| `clearPersistedStates({ userId })` | removes every user/entity/branch record of a user (logout) |
| `clearPersistedStates({ all: true })` | removes every record written by this module |
| `getUserPreference(userId, name)` / `setUserPreference(userId, name, value)` | one per-user UI value outside a store (e.g. `last_route`), key `resaas:v1:user:<id>:pref:<name>`, removed at logout with the rest; no user = nothing read or written |

## Logout

`UserStore.logout()` removes every `user`/`entity`/`branch` record of the user
(`clearPersistedStates({ userId })`), cancels pending writes and, because
`data`, `Entity` and `Branch` change, every live persisted store goes back to
its defaults in memory. `global` records (device preferences) stay.

The local cleanup runs **whether or not** the `POST logout/` request succeeds.
Before, a failed request left the tokens in the browser.

`logout('N')` (session expired, from the 401 interceptor) clears nothing:
records are per user, so another user signing in never sees them.

## Security

localStorage is **not** a security boundary. Anyone at the device can read or
edit it.

- Nothing restored by `persist` authorizes anything. The backend still checks
  the session, the signed `X-RESAAS-Context` (sessionStorage, created by
  `POST resaas/context/`), permissions and object scope on every request.
- An Entity/Branch id in a key only picks a namespace. Editing it gives no
  context token and no data of that Entity: the store just reads another
  record.
- Planting `permissions`, `actions`, `rows`, tokens or a context in a record
  has no effect: those fields are never read back.
- Tokens, the context token and the UserStore session keys keep their own
  storage (see [UserStore & context](user-context.md)); `persist` does not
  move or copy them.

## Tabs

localStorage is shared by the tabs of one origin. Stores do **not** sync
live between tabs: each tab keeps its own state and the last write wins in
storage (the next reload reads it). A logout in another tab is caught by the
backend (`401`) on this tab's next request.

## Errors and unavailable storage

| Case | Behaviour |
|---|---|
| No `window`/`localStorage` (tests, SSR-like hosts), `SecurityError` | memory only |
| `QuotaExceededError` | the write is skipped, the store keeps working (dev warning) |
| Corrupted JSON / wrong shape | record removed, defaults |
| Record above `maxBytes` | not saved (dev warning) |

Development logs (Vite `DEV` only) start with `[persist]` and never contain
stored values: `hydrated <store>`, `discarded expired state`,
`migration 1 -> 2`, `corrupted state removed`.

## Real example: `PermissionStore`

```js
export const usePermissionStore = createBaseStore('permission', { app: 'auth', model: 'Permission' }, {
  persist: {
    include: ['search'],
    scope: 'user',
    ttl: 7 * 24 * 60 * 60 * 1000
  },
  state: () => ({ allPermissions: [], groupPermissions: [], search: '', ... })
})
```

The search box of the group permission editor survives F5 for 7 days, per
user. The permission lists (`allPermissions`, `groupPermissions`) are never
saved. They are loaded from the backend again.

## Troubleshooting

- **The state is not restored after F5.** Is the field in `include` (and not
  in the *Never* list)? Is the scope's identity known? A `branch` store
  hydrates only after `UserStore` has `data`, `Entity` and `Branch`
  (`store.$hydrated`). Look for `[persist]` warnings (corrupted, expired,
  version) in the dev console.
- **Old data after changing the store's state shape.** Bump `version` (and add
  `migrate` if the old data is worth keeping).
- **The schema's page size is ignored.** A page size restored from storage
  wins. `store.$resetPersisted()` goes back to the defaults.
- **Nothing is written.** Storage blocked, quota full, or the record is above
  `maxBytes`. The store still works in memory.
