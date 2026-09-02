# AutoCrud (`s-auto-crud`)

`AutoCrud.vue` is a complete list screen — table, search, filters,
create/edit dialog, delete/restore, custom actions, PDF — for one schema, in
one tag, with **zero** custom Vue code:

```vue
<s-auto-crud app="hr" model="Employee" route="view_employee" />
```

It's the component behind the "generic scaffold/crud" routes and behind
every `<Resource>LPage.vue` that just delegates to it — see
[Creating a resource](../development/creating-resource.md).

## It does not use `createBaseStore`/Pinia

Unlike almost everything else in the library, `AutoCrud` keeps its own
local reactive state (`schema`, `fields`, `actions`, `rows`, `filters`,
`pagination`, …) instead of a [`BaseStore`](../stores/base-store.md)
instance — see [Architecture](../architecture/overview.md). It builds a
throwaway `store`-shaped `reactive()` object internally only to hand to
`s-form-modal` (which expects a store-like `{ fields, saving, app, model,
data, form }`), not a real Pinia store. Nothing outside the component reads
or writes this state.

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `app` | `String` | — (required) | Backend app label, e.g. `'hr'` |
| `model` | `String` | — (required) | Model name, e.g. `'Employee'` |
| `route` | `String \| Object` | `null` | Passed through; not read internally by `AutoCrud` itself, but pages set it for consistency with the router `meta.requiredRole` convention |
| `ignoreFields` | `Array` | `['created_at', 'updated_at', 'created_by', 'updated_by']` | Fields hidden from the table/form |
| `ignoreFieldsFilter` | `Array` | same as above | Fields hidden from the filter dialog |
| `extraActions` | `Array` | `[]` | Extra entries appended to `schema.actions` — use this for a client-only action the backend doesn't know about (e.g. opening a local dialog); it still goes through the same `@run-action` handling below |

There is no `can`/`module` prop — permissions are checked internally via
`useUserStore()`, and the endpoint is resolved from `app`/`model` (or from
`schema.model.endpoint` once the schema has loaded — see
[Data flow](../architecture/data-flow.md)).

## Lifecycle

On mount (and whenever `app`/`model` change), `AutoCrud`:

1. calls [`buildFormFromSchema({ app, model })`](../features/custom-fields.md)
   to fetch the schema, form fields, and actions;
2. seeds its local `pagination` from `schema.pagination.page_size`/
   `default_ordering`;
3. calls `loadData()` — `GET` against the model's endpoint with
   `page`/`page_size`/`ordering`/current filters.

## Composition

`AutoCrud`'s template is three components wired together:

- **`s-auto-table`** (`AutoTable.vue`) — renders `rows`/`columns`, emits
  `@request` (pagination/sort change), `@create`, `@edit`, `@delete`,
  `@run-action`, `@search`, `@objects` (all/active/deleted toggle — see
  [Soft delete](../../django-resaas/features/soft-delete.md)), and more.
- **`s-form-modal`** (`FormModal.vue`, wrapping [`s-auto-form`](form.md)) —
  the create/edit dialog, driven by the throwaway `store` object above.
- **`s-auto-filter`** (`AutoFilter.vue`) — the filter dialog, driven by
  `fields`/`schema.filters`.

`AutoCrud` itself only holds the state and the handlers each of these
emits into — it never renders a table row or a form field directly.

## Custom actions (`@resaas_action`)

An action declared on the backend with `@resaas_action(...)` shows up in
`schema.actions` and needs no extra wiring: `onRunAction(action, row)`

- checks `User.can(action.permission)` before showing/running it;
- resolves the endpoint via `resolveActionEndpoint(action, row)`
  (`utils/schema.js`) — when the action is detail-scoped (`action.detail`,
  falling back to the older `action.details` key for schemas that still
  send it — see the backend's
  [Schema 1.0 contract](../../django-resaas/api/schema-contract.md)) it
  substitutes `row.id` into the schema's own `{id}` placeholder in
  `action.endpoint`; a collection-level action uses `action.endpoint`
  unchanged;
- uses `action.method` **exactly as the backend resolved it** — the
  frontend never re-derives or guesses an HTTP method from the action's
  name;
- if `action.autorequest === true`, fires the request itself (`GET` with no
  body, anything else via `HTTPAuth.request({ method, url, data: {} })`)
  and reloads the list afterward.

If `action.autorequest` is not `true`, `AutoCrud` only emits `runaction` (a
component event, not the schema field) with `(action, row)` — the host page
is expected to open its own dialog/flow and call `loadData()` (exposed
implicitly via the same list refresh path) when it's done.

## PDF

If `schema.pdf.detail`/`schema.pdf.list` are present (see the backend's
[Files & PDF](../../django-resaas/features/files-pdf.md)), the corresponding
toolbar/row button fetches the PDF as a blob (`HTTPAuthBlob`) and opens it in
`s-pdf-render`, gated the same way as any other action by
`User.can(schema.pdf.detail_permission)`/`list_permission`.

## When to reach for `BaseStore` instead

`AutoCrud` covers the common case: a tabular list with the standard CRUD
flow. Reach for [`BaseStore`](../stores/base-store.md) plus your own
components when the screen needs something `AutoCrud` doesn't offer as-is —
a non-tabular layout, a multi-step wizard, cross-store logic (combining two
resources on one page), or a detail page that isn't really a list. Nothing
stops both from coexisting in the same app: `AutoCrud` for routine CRUD
lists, `BaseStore` directly for anything bespoke.
