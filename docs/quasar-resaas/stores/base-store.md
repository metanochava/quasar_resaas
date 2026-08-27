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
and derives `url` as `` `${app}/${model.toLowerCase()}s` ``. Actions should never
build this URL by hand — they always use the `safeApp`, `safeModel`, `safeUrl`
getters.

## Shared state

Every store created by `createBaseStore` shares:
`loading`, `saving`, `fields`, `rows`, `row`, `form`, `actions`, `config`,
`permissions`, `pdfConfig`, `search`, `filters`, `pagination` (`page`,
`rowsPerPage`, `rowsNumber`), and the PDF display state (`pdf`, `showPdf`).
`extend.state()` is merged on top — this is what `UserStore`, `BranchStore`,
etc. use to add their own fields (see [UserStore & context](user-context.md)).

## Main actions

-   `init()` — `assertConfig()` -> `loadSchemaOnce()` -> `loadData()`,
    with `beforeInit`/`afterInit` hooks.
-   `loadSchema()` / `loadSchemaOnce()` — calls
    `buildFormFromSchema({ app: this.safeApp, model: this.safeModel })`
    (see [Data flow](../architecture/data-flow.md)) and fills in
    `fields`, `actions`, `config`, `permissions`, `pdfConfig`.
-   `loadData(params)` — `GET safeUrl` with `page`, `page_size`,
    `search`, `filters`, and overrides; fills in `rows` and
    `pagination.rowsNumber`.
-   `getById(id)` — returns the cached `this.row` if the id already matches;
    otherwise does `GET safeUrl/{id}/` and syncs `row`/`form`.
-   `create()` / `update()` / `save()` — `save()` picks between the two
    depending on whether `this.form.id` exists; both sync `row`, `form`, and
    the `rows` list.
-   `remove()` — `DELETE`, removes from `rows` and calls `resetForm()`.
-   `getPdf(id)` / `getPdfList()` — request a PDF via `HTTPAuthBlob`, preferring
    the schema-provided `pdfConfig.detail_endpoint`/`list_endpoint` when
    available (falling back to a computed `safeUrl`-based path otherwise), and
    store a `Blob` URL in `pdf` (used by `s-pdf-render*`).
-   `resetForm()` — rebuilds `form` from `fields[].default`, or clears
    everything if the schema hasn't loaded yet.

## Hooks (`extend.hooks`)

`runHook(name, payload)` calls `extend.hooks[name]`, if it exists, with `this`
bound to the store. Available hooks:
`beforeInit/afterInit`, `beforeSchema/afterSchema`,
`beforeLoad/afterLoad`, `beforeGet/afterGet`, `beforeCreate/afterCreate`,
`beforeUpdate/afterUpdate`, `beforeDelete/afterDelete`. This is the preferred
extension point rather than overriding an entire action.

## `assertConfig()`

A safety guard called at the start of almost every action — throws an error if
`_config.app`/`_config.model` aren't set. It exists to fail fast when a store
is misconfigured, instead of a silent `undefined/undefineds` in the URL.
