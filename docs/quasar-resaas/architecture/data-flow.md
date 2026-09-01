# Data flow — from schema to screen

Real example: an edit page in the host app that uses `s-form-two`
(`front/src/pages/rh/cargo/CargoSEPage.vue`).

``` text
Page (CargoSEPage.vue)
   |
   |  buildFormFromSchema({ app, model })
   v
utils/autoForm.js
   |
   |  GET django_resaas/resaasapps/{app}/{model}/schema/
   v
services/api.js (HTTPAuth)
   |  + Authorization: Bearer <access>
   |  + X-RESAAS-Context: <token>   (see stores/user-context.md)
   v
django_resaas (backend)
   |
   v  { fields, actions, config, permissions, routes, ... }
utils/schema.js -> normalizeSchema()
   |
   v
buildFormFromSchema()
   - generates per-field validation `rules` (required, min/max, JSON)
   - resolves relation options (`ForeignKey`/`M2M`) via
     `django_resaas/relations/`, with caching and debounce (350ms)
   - returns { schema, fields, actions, config, permissions, ... }
   v
s-form-two / s-auto-form render the fields
```

## `buildFormFromSchema` (`utils/autoForm.js`)

Current signature:

``` js
buildFormFromSchema({ app, model, fetchRelationOptions } = {})
```

Throws `app/model required` if `app` or `model` aren't passed. For each field in
the schema:

-   detects the type (`isFileType`, `isNumericType`, `isCharType`,
    `isRelationType`) to decide which `s-*` component to use
    (`f.component || 's-input'`);
-   builds `rules` from `required`, `min_length`, `max_length`, `min`, `max`,
    and `JSONField`;
-   if the field is a relation, wires `onFilter` to a debounced fetcher with an
    in-memory cache (`__relationCache`) — avoids repeating requests while typing
    in a search combo.

> **Note:** `base/base_store.js` always calls
> `buildFormFromSchema({ app: this.safeApp, model: this.safeModel })` —
> this is the path consistent with the current signature. The example in
> `CargoSEPage.vue` calls `buildFormFromSchema({ module, model,
> schemaPath })`, which **does not match** the parameters the function
> actually reads (`app`, `model`, `fetchRelationOptions`); `module`/`schemaPath`
> are ignored. It's worth confirming whether that page is using an outdated
> version of the API before taking it as a reference.

## Requests via a store (`create`/`update`/`loadData`)

For pages that use a store created with `createBaseStore` (see
[BaseStore](../stores/base-store.md)), the same schema-fetch-render pattern
happens inside `store.init()`, and CRUD operations (`loadData`, `getById`,
`create`, `update`, `remove`) use `this.safeUrl` against the same
`HTTPAuth`/`url()`. Once `loadSchema()` has resolved, `safeUrl` prefers the
schema's own `model.endpoint` over the `app/model` convention - see
[BaseStore](../stores/base-store.md#immutable-config).
