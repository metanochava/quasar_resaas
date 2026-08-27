# Creating a New Frontend Resource

Assumes the model already exists in the backend (django_resaas) with `RESAAS.crud = True` and its view registered — see django_resaas's `development/creating-resource.md` for that side.

Real example: `Cargo` (`front/src/pages/rh/cargo/`).

## 1. Pages

Three files per resource:

```
CargoLPage.vue   // list — uses <s-auto-crud>
CargoSEPage.vue  // create/edit — uses <s-form-two>
CargoVPage.vue   // view detail
```

`CargoLPage.vue` delegates everything to the automatic component:

```vue
<s-auto-crud :module="module" :model="model" :can="User.can"
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

`requiredRole` on each route and `:can="User.can"` on `<s-auto-crud>` must match the codenames (`list`, `add`, `change`, `view`, `delete`) the backend exposes for the model — see django_resaas's `security/permissions.md`.
