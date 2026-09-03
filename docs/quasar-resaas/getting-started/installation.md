# Installation

`quasar_resaas` is a library, not a standalone app — it's installed inside an
existing Quasar CLI (Vite) project and wired up through that project's own
`quasar.config.js` and `src/boot/`. This page is the minimum needed to get a
fresh host app talking to it; see [Build & Installation](../deployment/build.md)
for the deeper mechanics (module format, auto-imports, how the package is
versioned and published).

## Requirements

The package declares Vue, Quasar, and Pinia as `peerDependencies` — the host
app must already have them installed:

```json
"peerDependencies": {
  "vue": "^3.0.0",
  "quasar": "^2.0.0",
  "pinia": "^2.0.0 || ^3.0.0 || ^4.0.0"
}
```

Vue Router isn't a declared peer dependency, but is required in practice —
[`restRoutes`/`authRoutes`/`docsRoutes`](../routing/routes.md) are plain route
arrays meant to be mounted into the host's own router.

A running `django_resaas` backend is also required — everything the library
renders (forms, tables, permissions) is driven by that API's schema. See the
backend's own
[Installation](../../django-resaas/getting-started/installation.md).

## 1. Install the package

`quasar_resaas` isn't published to npm — it's consumed directly from GitHub
(see [Build & Installation](../deployment/build.md#how-its-published) for why
this means no semver, and how to pick up new commits):

```json
// package.json
"dependencies": {
  "quasar_resaas": "github:metanochava/quasar_resaas"
}
```

```bash
npm install
```

## 2. Register the global `s-*` components

Every `s-*` component (`s-btn`, `s-card`, `s-auto-crud`, ...) only exists
after the host explicitly calls the library's `Components` export from one of
its **own** boot files — adding `quasar_resaas` to `package.json` alone does
nothing for this:

```js
// src/boot/theme_engine.js  (the name is up to you)
import { Components } from 'quasar_resaas'

export default ({ app }) => {
  Components({ app })
}
```

```js
// quasar.config.js
boot: ['pinia', 'i18n', 'axios', 'theme_engine']
```

> [!WARNING]
> Skipping this step fails at build/dev time with `Failed to resolve component:
> s-...` — see [Troubleshooting](../troubleshooting/common-errors.md).

## 3. Initialize the Pinia bridge

`base/base_store.js` and several services need a Pinia instance outside of
Vue components (interceptors, non-component modules). Call `setPinia()` once,
in the same boot (or any boot that runs after Pinia itself is installed):

```js
// src/boot/theme_engine.js
import { Components } from 'quasar_resaas'
import { setPinia } from 'quasar_resaas/core/context'

export default ({ app, store }) => {
  Components({ app })
  setPinia(store)
}
```

> [!WARNING]
> Skipping this throws `Pinia not initialized. Call setPinia(pinia) in boot.`
> the first time any store (`UserStore`, `EntityStore`, a store built with
> [`createBaseStore`](../stores/base-store.md), ...) is used.

## 4. Configure the environment

`services/api.js` builds every request's base URL and two required headers
from environment variables — set these in `.env` or `quasar.config.js`'s
`build.env`:

```bash
API=http://localhost:7002
API_PREFIX=api

# sent as the fek/fep headers on every request - required by the
# backend's FrontEndMiddleware (see django_resaas docs)
FRONT_END_KEY=...
FRONT_END_PASSWORD=...
```

`FRONT_END_KEY`/`FRONT_END_PASSWORD` identify *this frontend application* to
the backend (not a user) — see
[`../../django-resaas/architecture/middleware.md`](../../django-resaas/architecture/middleware.md)
for what the backend does with them.

## 5. Mount the routes and layouts

`restRoutes`, `authRoutes`, and `docsRoutes` are plain arrays the host mounts
into its own `src/router/routes.js`. `docsRoutes` brings its own `DocLayout`
and must stay a **top-level** entry — never nested inside another layout's
`children` — while `restRoutes` is mounted under the host's own `MainLayout`:

```js
import { restRoutes, authRoutes, docsRoutes } from 'quasar_resaas'
import { MainLayout } from 'quasar_resaas'

const routes = [
  ...authRoutes,
  ...docsRoutes,
  {
    path: '/',
    component: MainLayout,
    children: [
      { path: '', component: () => import('src/pages/IndexPage.vue'), name: 'home' },
      ...restRoutes
    ]
  }
]
```

See [Router](../routing/routes.md) for the full convention (`meta.title`,
`requiresAuth`, `requiredRole`).

## Next

Continue with [Quick start](quick-start.md) to define your first store and
render a working CRUD screen.
