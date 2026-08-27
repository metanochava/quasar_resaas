# quasar_resaas Architecture

## Overview

`quasar_resaas` isn't an app — it's a library installed inside a Quasar/Vue 3 app
(`main`) that connects to the `django_resaas` backend. Everything it exports (routes,
stores, components, services) is consumed by the host app; it never runs on its own.

``` text
Host app (e.g.: front)
       |
       v
quasar_resaas (boot: components.js, alerts.js)
       |
       +---- Stores (Pinia)      -> base/base_store.js
       +---- s-* Components      -> boot/components.js
       +---- Routes              -> restRoutes / authRoutes / docsRoutes
       +---- Composable          -> useResaas()
       |
       v
services/api.js (HTTPAuth / HTTPClient)
       |
       v
django_resaas (REST API)
```

## Entry point (`index.js`)

`index.js` is a facade — it re-exports everything the host app might need, grouped
by layer:

-   **Routers** — `restRoutes`, `authRoutes`, `docsRoutes` (see
    [Router](../routing/routes.md))
-   **Composable** — `useResaas()` (see below)
-   **Stores** — `UserStore`, `EntityStore`, `BranchStore`,
    `PermissionStore`, etc. (see [BaseStore](../stores/base-store.md))
-   **Base** — `createBaseStore` (store factory)
-   **Utils** — `buildFormFromSchema`, `json`, `text`, `profile`
-   **Services** — `api`, `app`, `base`, `data`, `storage`,
    `translation`, `theme`, `routing`, `token`
-   **Boot** — `alerts`, `Components` (global registration of `s-*`)
-   **Components/Layouts** — `MainLayout`, `AuthLayout`, `CrudPage`

## Component registration (`boot/components.js`)

Every component in the library is registered globally with the `s-` prefix (e.g.
`s-btn`, `s-auto-form`, `s-auto-crud`), so any page in the host app can use them
without an explicit import. See [Form](../components/form.md),
[ActionForm](../components/action-form.md), and [s-btn](../components/button.md).

## Pinia context (`core/context.js`)

`base/base_store.js` and several services need a Pinia instance outside of Vue
components. `setPinia(piniaInstance)` must be called once during the host app's
boot; `getPinia()` throws if that hasn't happened yet — this is the library's way
of failing fast instead of failing silently.

## `useResaas()`

A convenience composable (`composables/useResaas.js`) that returns, in a single
object, the most-used stores (`User`, `Entity`, `EntityType`, `Branch`, `Menu`,
`Person`), the HTTP clients (`HTTPAuth`, `HTTPClient`, `wsApi`, `url`),
`buildFormFromSchema`, `createBaseStore`, and `tdc` (translation). It doesn't
introduce new logic — it just avoids repeating several `useXStore()` calls on
every page.

## Connecting to the backend

All communication goes through `services/api.js`
([API & headers](../api/backend-integration.md)). There are no loose
`fetch`/`axios` calls on pages — the pattern is always a store or `HTTPAuth`
imported from the library.
