# Quick start

This walks through the shortest path from a registered backend model to a
working screen: a Pinia store, a list page, and a store-driven edit form.
It assumes [installation](installation.md) is done and the backend model
already exists and is registered — see the backend's
[Quick start](../../django-resaas/getting-started/quick-start.md) for that
half first if it doesn't yet.

The example uses `app: 'hr'`, `model: 'Employee'` throughout — substitute
your own.

## 0. The fastest possible path: zero files

If you just need to look at a model's data — no route, no page file — every
installed host already has this for free via `CrudPage`
(`pages/CrudPage.vue`), reachable at `restRoutes`'s `/view_crud`:

```js
import { restRoutes } from 'quasar_resaas'
// restRoutes includes the generic /view_crud route, which renders
// CrudPage — an app/model picker wrapping <s-auto-crud>
```

Navigate to `/view_crud`, pick the module and model from the in-page
selectors, and you get a full `AutoCrud` list for that model with no code
at all (`CrudPage` also supports being deep-linked via `:app`/`:model`
route **params** if the host adds its own parametrized route pointing at
it — the bare `/view_crud` path itself carries none). This is useful for
exploring a new model or a one-off internal screen — real, permission-gated
resources still get their own route and page per the steps below.

## 1. A list screen: `AutoCrud`

For a real resource, the fastest path to a permission-gated list screen is
[`AutoCrud`](../components/auto-crud.md) behind its own route:

```vue
<!-- pages/hr/employee/EmployeeLPage.vue -->
<template>
  <s-auto-crud app="hr" model="Employee" route="view_employee" />
</template>
```

```js
// pages/hr/employee/employeeRoutes.js
import { tdc } from 'quasar_resaas'

export const employeeRoutes = [
  {
    path: '/list_employee',
    name: 'list_employee',
    component: () => import('./EmployeeLPage.vue'),
    meta: {
      title: tdc('View of') + ' ' + tdc('employee'),
      requiresAuth: true,
      icon: 'list',
      requiredRole: 'list_employee'
    }
  }
]
```

Spread `employeeRoutes` into the host's own route table (see
[Router](../routing/routes.md)) and the page is done — table, search,
filters, create/edit dialog, delete/restore, custom actions and PDF (if the
backend schema exposes them) all work with no further code. Full walkthrough,
including the create/edit/detail page trio: [Creating a resource](../development/creating-resource.md).

## 2. A Pinia store, for anything `AutoCrud` doesn't cover

Reach for [`BaseStore`](../stores/base-store.md) once a screen needs
something `AutoCrud` doesn't offer as-is — a dashboard widget, a
multi-step wizard, cross-store logic, a detail page that isn't a list:

```js
// stores/EmployeeStore.js
import { createBaseStore } from 'quasar_resaas'

export const useEmployeeStore = createBaseStore('employee', {
  app: 'hr',
  model: 'Employee'
})
```

```js
const Employee = useEmployeeStore()

await Employee.init()            // loadSchema() + loadData()
await Employee.getById(id)       // cached; { force: true } to bypass
Employee.form = { ...Employee.form, first_name: 'Ana' }
await Employee.save()            // create() or update(), based on form.id
```

## 3. A page-level form: `s-form-two`

For a full-page (non-modal) create/edit screen driven by the store from
step 2:

```vue
<s-form-two
  :store="Employee"
  :ignore-fields="['created_at', 'updated_at', 'created_by', 'updated_by']"
  @saved="onSaved"
/>
```

See [Form](../components/form.md) for the full comparison between
`s-form-two` (store-driven, full page) and `s-auto-form` (schema-driven,
modal — what `AutoCrud` uses internally).

## Where to go next

- [Customizing fields](../features/custom-fields.md) — relabel a field,
  swap its component, or change a validation rule without leaving the
  schema-driven pipeline.
- [Extending the store](../stores/base-store.md#extending-the-store) —
  override or hook into a store's behavior (`extend.actions`/`extend.hooks`)
  instead of building a screen from scratch.
- [Permissions](../features/permissions.md) — how `User.can(...)` and
  `requiredRole` gate everything above.
- [Public exports](../api/public-exports.md) — the full list of what
  `import { ... } from 'quasar_resaas'` gives you.
