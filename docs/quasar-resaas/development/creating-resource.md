# Creating a New Frontend Resource

Assumes the model already exists in the backend (django_resaas) with `RESAAS.crud = True` and its view registered — see
[`../../django-resaas/development/creating-resource.md`](../../django-resaas/development/creating-resource.md)
for that side.

Real example: `Cargo` (`front/src/pages/rh/cargo/`).

## 1. Pages

Three files per resource:

```
CargoLPage.vue   // list — uses <s-auto-crud>
CargoSEPage.vue  // create/edit — uses <s-form-two>
CargoVPage.vue   // view detail
```

`CargoLPage.vue` delegates everything to the automatic component. Its real
props are `app`/`model` (strings, both required), `route`, `ignoreFields`,
`ignoreFieldsFilter`, and `extraActions` — see
[AutoCrud](../components/auto-crud.md) for the full reference. There's no
`can`/`module` prop: `AutoCrud` reads `useUserStore()` internally to check
permissions on every action.

```vue
<s-auto-crud app="rh" model="Cargo"
  :ignoreFields="ignoreFields" route="view_cargo" />
```

`CargoSEPage.vue` loads the schema and, if the route has `:id`, the existing record:

```js
const data = await buildFormFromSchema({ module, model, schemaPath })
schema.value = data.schema

const id = route.params.id || route.query.id
if (id) selectedRow.value = (await HTTPAuth.get(url({ type:'u', url:`${module}/${model}s/${id}/` }))).data
```

> `buildFormFromSchema` in `utils/autoForm.js` expects `{ app, model }`, not `{ module, schemaPath }` — see [common errors](../troubleshooting/common-errors.md#app-model-required) before copying this file for a new resource.

## 2. Routes

One `<resource>Routes.js` file per resource, with the 4 standard actions and `requiredRole` matching the backend's permission codenames (`list_`, `add_`, `change_`, `view_` + model name):

```js
// pages/rh/cargo/cargoRoutes.js
export let cargoRoutes = [
  { path: '/list_cargo',   name: 'list_cargo',   component: () => import('./CargoLPage.vue'),
    meta: { title: tdc('View of')+' '+tdc('cargo'), requiresAuth: true, icon: 'list', requiredRole: 'list_cargo' } },
  { path: '/add_cargo',    name: 'add_cargo',    component: () => import('./CargoSEPage.vue'),
    meta: { requiresAuth: true, icon: 'add', requiredRole: 'add_cargo' } },
  { path: '/change_cargo/:id', name: 'change_cargo', component: () => import('./CargoSEPage.vue'),
    meta: { requiresAuth: true, icon: 'edit', requiredRole: 'change_cargo' } },
  { path: '/view_cargo/:id',   name: 'view_cargo',   component: () => import('./CargoVPage.vue'),
    meta: { requiresAuth: true, icon: 'visibility', requiredRole: 'view_cargo' } },
]
```

## 3. Aggregation

The resource's routes file is imported and spread into the module's `routes.js` (`pages/rh/routes.js`), which is in turn spread into `src/router/routes.js` alongside `quasar_resaas`'s own `restRoutes`/`authRoutes`/`docsRoutes`. There's no automatic registration — a new resource without this step simply doesn't appear in the router.

## 4. Side menu (optional)

Only needed if the resource requires a contextual side panel (`RightMenu.vue`). Registered in `src/core/rightMenus.js`:

```js
import CargoRightMenu from './../pages/rh/cargo/RightMenu.vue'
menu.registerRightMenu('view_cargo', CargoRightMenu)
```

Most resources (like the current `Cargo`) don't have a `RightMenu.vue` and can skip this step.

## 5. Permissions

`requiredRole` on each route must match the codenames (`list`, `add`,
`change`, `view`, `delete`) the backend exposes for the model — see
[`../../django-resaas/security/permissions.md`](../../django-resaas/security/permissions.md). `<s-auto-crud>` doesn't need any
extra wiring for this: it checks `User.can(...)` against each action's
`permission` (from `schema.permissions`) itself — see
[Permissions](../features/permissions.md).

## 6. Custom actions (`@resaas_action`) and refresh

A model whose backend view declares `@resaas_action(...)` (see
[`../../django-resaas/development/creating-resource.md`](../../django-resaas/development/creating-resource.md))
shows up in `schema.actions`, and `<s-auto-crud>`
([`components/auto/AutoCrud.vue`](../components/auto-crud.md)) already knows
how to run it - no extra wiring needed:

- it checks `hasPermission(action.permission)` before showing/running it;
- it resolves the URL via `resolveActionEndpoint(action, row)` -
  `.../{id}/confirm/` for a `detail: true` action, `.../export/` for a
  collection-level one;
- it uses `action.method` **as-is** (the single, unambiguous method the
  backend already resolved - never re-derived or guessed from the
  action's name);
- when `action.autorequest` is `true`, it fires the request itself and
  then reloads the list (`loadData()`).

If the same store also backs a **detail** view showing a single record
(`store.row`, via `getById()`), that view stays in sync separately, using
the exact same primitives `AutoCrud`'s list refresh uses under the hood -
see [BaseStore](../stores/base-store.md#main-actions):

```js
// after a custom action changes the record this page is showing
await store.refreshRow()          // row-only: re-fetches store.row, forced
// or, if the list on screen also needs to reflect it:
await store.loadData()            // list-only
// or both, independently:
await Promise.all([store.refreshRow(), store.loadData()])
```

No new "refresh" metadata was introduced for this - `refreshRow()`,
`invalidateRow()` and `loadData()` are the same general-purpose primitives
every other store action already uses.
