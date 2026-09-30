# Building a frontend module

A **module** is a folder of your application's frontend (Health, Sales, HR, ...)
built on `quasar_resaas`. The library provides the mechanisms: stores, forms,
tables, layouts and routing helpers. The module provides the domain screens.
`quasar_resaas` ships no business module.

A real example is the HR module of an application
(`front/src/pages/hr/`). It used to ship inside `quasar_resaas`
(`pages/hr`, `stores/EmployeeStore.js`, ...), and moved to the application
together with its backend (`back/hr`, see django_resaas
[Building a module](https://github.com/metanochava/django_resaas/blob/main/docs/development/building-a-module.md)).

## Layout

```
src/pages/hr/
├── routes.js            # export const hrRoutes = [...]
├── DashBoard.vue        # module pages...
├── employee/
│   ├── employeeRoute.js
│   ├── EmployeePage.vue      # list  (AutoCrud)
│   ├── EmployeeSEPage.vue    # create / edit
│   └── EmployeeVPage.vue     # view
└── stores/
    └── EmployeeStore.js # createBaseStore('employee', { app: 'hr', model: 'Employee' }, ...)
```

## Rules

- **Import only the package root**: `import { createBaseStore, tdc, HTTPAuth, FormTwo } from 'quasar_resaas'`.
  Never a deep path such as `quasar_resaas/components/...`: only the root, the auto-imports and
  `core/*` are exported (see [Public exports](../api/public-exports.md)), and a deep import
  breaks Vite in the application.
- **Stores** are built with `createBaseStore(name, { app, model }, extend)`
  ([BaseStore](../stores/base-store.md)); `app` is the backend app label (`'hr'`).
- **Routes**: the module exports one array. The application spreads it next to the library's
  `restRoutes`:

```js
// src/router/routes.js of the application
import { restRoutes, MainLayout } from 'quasar_resaas'
import { hrRoutes } from '../pages/hr/routes'

const routes = [
  {
    path: '/',
    component: MainLayout,
    children: [...restRoutes, ...hrRoutes],
  },
]
```

  A route's `meta.requiredRole` is the permission codename the backend checks
  (`list_employee`, `view_hr_dashboard`, ...). Hiding a route is UX only: the backend
  authorizes every request.
- **Menus** come from the backend (the user's effective permissions), not from the module's
  code.
- **Translations**: wrap user-facing strings in `tdc('English text')`. The module's
  translations live in its backend app (`<module>/lang/<code>.py`).

## Troubleshooting

| Symptom | Check |
|---|---|
| `Failed to resolve import "quasar_resaas/..."` | A deep import: import from `'quasar_resaas'` |
| A route opens a blank page / 404 | The module's routes are not spread into the application's routes |
| A page loads but every request answers 403 | The module is not active for the Entity (`EntityApp`) or the group lacks the permission |
