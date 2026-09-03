# BaseStore (`base/base_store.js`)

`createBaseStore(name, config, extend)` is a Pinia store factory that gives any
resource (backend `app` + `model`) full CRUD without repeating code.

``` js
export const useBranchStore = createBaseStore(
  'branch',
  { app: 'django_resaas', model: 'Branch' },
  { state: () => ({}), actions: { /* extras specific to this store */ } }
)
```

## Immutable config

`BASE_CONFIG` is generated once (`Object.freeze`) from `config.app`/`config.model`,
and derives a fallback `url` as `` `${app}/${model.toLowerCase()}s` ``. Actions
should never build this URL by hand — they always use the `safeApp`, `safeModel`,
`safeUrl` getters.

> [!WARNING]
> **`safeUrl` is backend-authoritative.** Once `loadSchema()`/`init()` has resolved,
> `safeUrl` returns `schema.model.endpoint` (trailing slash normalized away) - the
> `{app}/{model}s` convention above only remains a fallback for a store that never
> loads its schema. Never re-derive the endpoint from `app`/`model` yourself when a
> schema is available - see [Data flow](../architecture/data-flow.md) and
> `base/schema_contract.spec.js` for the tested contract.

## Shared state

Every store created by `createBaseStore` shares:
`loading`, `saving`, `fields`, `rows`, `row`, `form`, `actions`, `config`,
`permissions`, `pdfConfig`, `paginationConfig`, `search`, `filters`,
`pagination` (`page`, `rowsPerPage`, `rowsNumber`), and the PDF display
state (`pdf`, `showPdf`). `extend.state()` is merged on top — this is what
`UserStore`, `BranchStore`, etc. use to add their own fields (see
[UserStore & context](user-context.md)).

`paginationConfig` holds the schema's own `pagination` block as-is
(`page_size`, `page_size_options`, `default_ordering`) - `loadSchema()`
also seeds `pagination.rowsPerPage` from `paginationConfig.page_size` when
present, so a model configured for a different default page size on the
backend doesn't silently stay at the local default of 10.

## Main actions

-   `init()` — `assertConfig()` -> `loadSchemaOnce()` -> `loadData()`,
    with `beforeInit`/`afterInit` hooks.
-   `loadSchema()` / `loadSchemaOnce()` — calls
    `buildFormFromSchema({ app: this.safeApp, model: this.safeModel })`
    (see [Data flow](../architecture/data-flow.md)) and fills in
    `fields`, `actions`, `config`, `permissions`, `pdfConfig`,
    `paginationConfig`, and `schemaEndpoint` (what `safeUrl` prefers).
-   `loadData(params)` — `GET safeUrl` with `page`, `page_size`,
    `search`, `filters`, and overrides; fills in `rows` and
    `pagination.rowsNumber`. On failure, `rows` keeps its last known-good
    value (never silently cleared) and `loading` still resets to `false`.
-   `getById(id, { force = false } = {})` — returns the cached `this.row`
    when the id already matches and `force` isn't set; otherwise does
    `GET safeUrl/{id}/` and syncs `row`/`form`. Pass `{ force: true }` to
    bypass the cache deliberately (e.g. after a custom action changed the
    record server-side).
-   `invalidateRow()` — clears `this.row` so the next `getById()` call
    re-fetches instead of returning the stale cached copy.
-   `refreshRow()` — re-fetches the currently loaded row by id
    (`getById(this.row.id, { force: true })`); a no-op when no row is
    loaded. The composition to reach for after a custom action: call
    `refreshRow()` for a row-only refresh, `loadData()` for a list-only
    refresh, or both together - see
    [Creating a new frontend resource](../development/creating-resource.md).
-   `create()` — `POST`, then **reloads the current page from the server**
    (`loadData()`) instead of unshifting the new row locally - a generic
    store has no way to know the list's real ordering/filters/page, and
    this keeps `pagination.rowsNumber` correct too.
-   `update({ method = 'patch' } = {})` — **`PATCH` by default**, since a
    form only rendering some of the schema's fields is normal and a `PUT`
    of a partial form would ask the backend to treat every missing field
    as absent. Pass `{ method: 'put' }` for a full replace when the form
    is known to always carry a complete representation. On failure,
    `this.row`/`this.form` are left exactly as they were - the store never
    pretends the backend accepted a change it rejected.
-   `save(options)` — picks between `create()` and `update(options)`
    depending on whether `this.form.id` exists, forwarding `options`
    (e.g. `{ method: 'put' }`) to `update()`.
-   `remove()` — `DELETE`, then reloads the current page. If the deleted
    row was the last one on a page beyond the first, steps back a page
    *before* reloading - the default DRF paginator 404s ("Invalid page")
    on a page number past the new last page, so reloading the same,
    now-empty page would turn a successful delete into a thrown error.
-   `getPdf(id)` / `getPdfList()` — request a PDF via `HTTPAuthBlob`, preferring
    the schema-provided `pdfConfig.detail_endpoint`/`list_endpoint` when
    available (falling back to a computed `safeUrl`-based path otherwise), and
    store a `Blob` URL in `pdf` (used by `s-pdf-render*`).
-   `resetForm()` — rebuilds `form` from `fields[].default`, or clears
    everything if the schema hasn't loaded yet.

## Errors

Every action follows the same shape: `loading`/`saving` is set at the
start and reset in a `finally` block, so it never gets stuck at `true`
after a failed request - even when the request throws. Errors are never
swallowed: they propagate to the caller with `error.response.status`/
`error.response.data` intact (the axios interceptor in `services/api.js`
always ends with `Promise.reject(error)`, whatever it does with `Alert()`
along the way), so a caller can branch on a `404`, show a `409` conflict's
own message, etc. See `base/base_store.spec.js`'s "HTTP error resilience"
tests for the exact, tested behavior.

## Search & filters reset pagination

`setSearch()`, `clearSearch()`, `setFilters()`, `updateFilter()`,
`removeFilter()` and `clearFilters()` all reset `pagination.page` to `1`.
Changing what's being searched/filtered for while sitting on page 5 of
the *old* result set would otherwise leave the store pointed at a page
that may not even exist under the new criteria.

## Hooks (`extend.hooks`)

`runHook(name, payload)` calls `extend.hooks[name]`, if it exists, with `this`
bound to the store. Available hooks:
`beforeInit/afterInit`, `beforeSchema/afterSchema`,
`beforeLoad/afterLoad`, `beforeGet/afterGet`, `beforeCreate/afterCreate`,
`beforeUpdate/afterUpdate`, `beforeDelete/afterDelete`. This is the preferred
extension point rather than overriding an entire action.

## Extending the store

`createBaseStore(name, config, extend)`'s third argument has two distinct
extension points, and they answer different questions:

- **`extend.actions`** is spread **after** the base actions
  (`...(extend.actions || {})`), so an action with the same name
  **replaces** the built-in one entirely — use this when the default
  implementation is fundamentally wrong for this resource (a non-standard
  endpoint, a different pagination shape, ...).
- **`extend.hooks`** (see [Hooks](#hooks-extendhooks) above) run
  **alongside** the built-in behavior instead — the gentler option when you
  just need to react to something (notify another store, trigger a
  side-effect) without changing what the base action itself does.

```js
export const useEmployeeStore = createBaseStore('employee', {
  app: 'hr', model: 'Employee'
}, {
  actions: {
    // completely replaces the base loadData()
    async loadData(params = {}) {
      return await this.loadDataForMyOwnEndpoint(params)
    }
  },
  hooks: {
    // runs in addition to the base afterCreate()
    afterCreate(data) {
      this.notifySomethingElse(data)
    }
  }
})
```

When the override goes beyond what either extension point can express — a
genuinely different screen flow — build the page with `BaseStore` plus
individual `s-*` components directly instead of
[`AutoCrud`](../components/auto-crud.md), which doesn't accept a store
extension at all (see [AutoCrud](../components/auto-crud.md#it-does-not-use-createbasestorepinia)).

## `assertConfig()`

A safety guard called at the start of almost every action — throws an error if
`_config.app`/`_config.model` aren't set. It exists to fail fast when a store
is misconfigured, instead of a silent `undefined/undefineds` in the URL.
