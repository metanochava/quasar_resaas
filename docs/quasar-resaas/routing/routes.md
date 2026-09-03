# Router

The library doesn't mount the app's `vue-router` — it exports plain route
arrays for the host to mount however it wants.

## Exported arrays

| Export | File | Contents |
|---|---|---|
| `authRoutes` | `router/authRoutes.js` | `/auth/login` (in `AuthLayout`) and `/welcome` (in `MainLayout`) |
| `restRoutes` | `router/restRoutes.js` | generic scaffold/crud + `entity`, `entity_type`, `group`, `branch`, `user`, `permission`, `employee` routes |
| `docsRoutes` | `router/docsRoutes.js` | `/docs/:product/:slug(.*)*`, mounted under its own `DocLayout` (not `MainLayout`) — see [documentation (docsRoutes)](../README.md) |

Each page group (`pages/entity/entityRoute.js`, etc.) exports its own array
(`entityRoutes`, ...) which `restRoutes` aggregates via spread.

## `meta` convention

```js
{
  path: '/list_entity',
  name: 'list_entity',
  component: () => import('./EntityLPage.vue'),
  meta: {
    title: tdc('View of') + ' ' + tdc('entity'),
    requiresAuth: true,
    icon: 'list',
    requiredRole: 'list_entity',
  },
}
```

-   `title` — passed through [`tdc()`](../features/translation.md), translated at runtime.
-   `requiresAuth` — required by the host's authentication guard.
-   `icon` — used by the menu (e.g. `TopMenu`/`LeftMenu`) when listing routes.
-   `requiredRole` — permission codename, checked with
    [`User.can()`](../features/permissions.md). By convention the route
    name matches `requiredRole` (`list_entity` → `list_entity`).

Navigation-only routes (e.g. `docsRoutes`, `/welcome`) omit `requiredRole`.

## Mounting in the host

Confirmed in `/var/www/dev/front/src/router/routes.js` — the app consumes
the three arrays exactly as the README describes:

```js
import { restRoutes, authRoutes, docsRoutes } from 'quasar_resaas'
import { MainLayout, CrudPage } from 'quasar_resaas'

routes = [
  ...authRoutes,
  ...docsRoutes,
  {
    path: '/',
    component: MainLayout,
    children: [
      { path: '', component: () => import('src/pages/IndexPage.vue'), name: 'home' },
      { path: 'crud', component: CrudPage, name: 'crud_state' },
      { path: 'crud/:module/:model/go', component: CrudPage, name: 'crud_route' },
      ...restRoutes,
      ...stockRoutes,
      ...saudeRoutes,
      ...vendasRoutes,
    ],
  },
]
```

> [!NOTE]
> `docsRoutes` is a **top-level** entry (its own `DocLayout`, no app
> chrome) — it must sit alongside `authRoutes`, never nested inside
> `MainLayout`'s `children`. It used to be spread into `restRoutes` itself;
> that's no longer the case, so a host project upgrading past that change
> needs this import added explicitly, exactly as shown above.

The app's own module routes (`rhRoutes`, `saudeRoutes`, ...) follow the same
`meta` convention as the library's routes — there's no special handling.

## "Not found" route

`restRoutes` includes `/route/:route/:id` → `RotaEnexistente.vue`, used as
the fallback target when a resource route doesn't exist.
