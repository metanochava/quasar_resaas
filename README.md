# 🚀 quasar_resaas

**The Vue 3 + Quasar companion to [django_resaas](https://github.com/metanochava/django_resaas) — turns backend schemas into working CRUD screens, without writing forms, tables or stores by hand.**

[![npm](https://img.shields.io/npm/v/quasar_resaas?logo=npm&logoColor=white)](https://www.npmjs.com/package/quasar_resaas)
[![Vue](https://img.shields.io/badge/vue-3-42b883?logo=vue.js&logoColor=white)](package.json)
[![Quasar](https://img.shields.io/badge/quasar-2-1976D2?logo=quasar&logoColor=white)](package.json)
[![License: MIT](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Status](https://img.shields.io/badge/status-active%20development-orange)](https://github.com/metanochava/quasar_resaas)

---

If you're consuming a [`django_resaas`](https://github.com/metanochava/django_resaas) API, you know the other half of the drill: a form per model, a table per list, a Pinia store per resource, tenant headers wired into every request… all of it **again**, screen after screen.

**quasar_resaas** solves that part. It's a Vue 3 + Quasar component/store/service library that reads the schema `django_resaas` already exposes for every model and renders the form, table, filters and CRUD flow from it — so your team writes business screens, not plumbing.

```bash
npm install quasar_resaas
```

---

## Table of contents

- [Why it exists](#-why-it-exists)
- [Features](#-features)
- [Installation & setup](#️-installation--setup)
- [Architecture](#-architecture)
- [Quick example](#-quick-example)
- [Tenant context & headers](#-tenant-context--headers)
- [Documentation site (docsRoutes)](#-documentation-site-docsroutes)
- [Auto components](#-auto-components)
- [Base stores](#-base-stores)
- [Tech stack](#-tech-stack)
- [Package exports](#-package-exports)
- [Documentation](#-documentation)
- [Releasing](#-releasing)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🎯 Why it exists

| Without quasar_resaas | With quasar_resaas |
|---|---|
| A hand-written form per model | `AutoForm` renders from the backend schema (`buildFormFromSchema`) |
| A hand-written table + filters per list | `AutoTable` + `AutoFilter` + `AutoCrud` |
| CRUD state re-implemented per Pinia store | `createBaseStore()` gives any resource list/pagination/filters/CRUD in one call |
| Auth + tenant headers wired manually into every request | `HTTPAuth` (axios) attaches them automatically |
| Ad-hoc PDF preview per screen | `PdfRender` / `PdfRenderPro` (pdfjs-dist) |
| Translations scattered per component | `tdc()` — one i18n helper, cascades from the backend |

---

## ✨ Features

* 🧬 **Schema-driven forms** — `buildFormFromSchema(app, model)` fetches `django_resaas`'s `/schema/` endpoint and turns fields, validation rules, choices and relations into ready-to-render field configs
* 🧱 **Auto CRUD kit** — `AutoCrud`, `AutoTable`, `AutoFilter`, `ActionForm`, `FormModal`, `ConfirmDeleteDialog` cover list/create/edit/delete with no custom pages
* 🗃️ **Base Pinia stores** — `createBaseStore()` gives any resource full CRUD state; ready-made stores ship for `User`, `Entity`, `EntityType`, `Branch`, `Group`, `Permission`, `Person`, `Employee`, `Language`, `Menu`, `Action`
* 🔐 **Tenant-aware HTTP client** — `HTTPAuth` / `HTTPClient` (axios) attach `Authorization`, `X-RESAAS-Context` and `L` on every request automatically
* 🌍 **Built-in i18n** — `tdc()` translation helper, backed by the same cascade as `django_resaas`
* 📄 **PDF preview** — `PdfRender` / `PdfRenderPro` for backend-generated documents (invoices, reports, lists)
* 🧩 **Ready layouts & pages** — `MainLayout`, `AuthLayout`, `CrudPage`, plus scaffolded list/edit/view pages for entity, branch, user, group, permission, employee
* 📖 **Self-hosted documentation site** — `docsRoutes` renders the `docs/` folder itself (this README's linked pages) as navigable screens inside the host app, under its own `MainLayout`
* 🔑 **Auth boot** — JWT login flow, token storage/refresh, encrypted local storage (`crypto-js`)
* 🎨 **Theme engine** — CSS variables + `services/theme.js` for per-entity branding

---

## ⚙️ Installation & setup

```bash
npm install quasar_resaas
```

Register components in your Quasar app's boot files:

```js
// boot/resaas.js
import { Components } from 'quasar_resaas'

export default ({ app }) => {
  app.use(Components)
}
```

```js
// quasar.config.js
boot: ['resaas', 'login_boot', 'alerts', 'cripto']
```

`quasar_resaas` expects to run inside a Quasar CLI (Vite) app that already provides **Vue 3**, **Quasar**, **Pinia** and **Vue Router** — it doesn't bundle them.

---

## 🧠 Architecture

```text
User
 ↓
Vue Page
 ↓
Components (Auto* / engine)
 ↓
Pinia Store (createBaseStore)
 ↓
HTTP Client (HTTPAuth / axios)
 ↓
django_resaas API
```

The frontend's job is to present the UI and hold local state — it never re-implements tenant, permission or validation rules already enforced by the backend; it just renders what the backend's schema describes.

---

## 🧪 Quick example

```js
import { buildFormFromSchema } from 'quasar_resaas'

const fields = ref([])
const formModel = ref({})

async function loadSchema() {
  // buildFormFromSchema() returns the full result object - fields,
  // actions, permissions, routes, ui, filters, pagination, pdf, schema
  const result = await buildFormFromSchema({ app: 'hr', model: 'Employee' })
  fields.value = result.fields
}
```

```vue
<AutoForm
  :fields="fields"
  :model="formModel"
/>
```

Or pull everything a screen typically needs in one call:

```js
import { useResaas } from 'quasar_resaas'

const { User, Entity, HTTPAuth, tdc, buildFormFromSchema } = useResaas()
```

---

## 🔐 Tenant context & headers

`quasar_resaas` speaks the same signed-context contract as `django_resaas` — no raw entity/branch/group values ever leave the browser as headers.

**1. Issue a context**, once the user picks an entity/branch/group:

```js
import { createResaasContext } from 'quasar_resaas'

await createResaasContext({ entity, branch, group })
// POSTs to /resaas/context/, stores the signed token it returns
```

**2. Every authenticated request sends it back automatically**, via the shared `axios` client:

| Header | Set by | Purpose |
|---|---|---|
| `Authorization` | `HTTPAuth` interceptor | `Bearer <JWT>` — who you are |
| `X-RESAAS-Context` | `HTTPAuth` interceptor | signed, short-lived tenant context — where you're operating |
| `L` | `HTTPAuth`/`HTTPClient` interceptor | active language id |
| `fek` / `fep` | interceptor (env-configured) | frontend key/secret checked by `FrontEndMiddleware` |

You never set these by hand — call `createResaasContext()` once per entity/branch/group switch and the interceptor in `services/api.js` takes care of the rest for every subsequent request.

---

## 📖 Documentation site (`docsRoutes`)

The `docs/` folder isn't just markdown for GitHub — it ships inside the package and renders as a real, navigable documentation site inside any app that installs `quasar_resaas`, attached under the host's own `MainLayout`, styled after the official Quasar Framework docs (product switcher, grouped sidebar, "on this page" outline).

It hosts **two separate documentation trees on the same site**:

| Product | Folder | Covers |
|---|---|---|
| [`quasar_resaas`](docs/quasar-resaas/README.md) | `docs/quasar-resaas/` | this library — components, stores, router, docs site itself |
| [`django_resaas`](docs/django-resaas/README.md) | `docs/django-resaas/` | the backend API it talks to — multi-tenancy, permissions, models |

There's no per-topic page to write: a single `DocsPage.vue` reads `docs/<product>/**/*.md` (bundled with the library, parsed at runtime with `marked`) and renders whichever one matches the route's `:product/:slug`, with a sidebar built from `docsNav[product]` and a product switcher built from `docsProducts`. Exactly like `restRoutes`, it's exported as a plain, flat route array for the host to spread wherever it mounts its own routes:

```js
import { restRoutes, authRoutes, docsRoutes } from 'quasar_resaas'

const routes = [
  ...authRoutes,
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      ...restRoutes,
      ...docsRoutes
      // → /docs                                     (redirects to /docs/quasar-resaas)
      // → /docs/quasar-resaas/architecture/overview
      // → /docs/django-resaas/architecture/multi-tenancy
    ]
  }
]
```

Internal links between docs (e.g. `docs/quasar-resaas/README.md` linking to `architecture/overview.md`) are rewritten on click into client-side navigation instead of dead `.md` hrefs, and correctly cross into the other product's tree if a link ever needs to.

---

## 🧩 Auto components

| Component | Role |
|---|---|
| `AutoForm` | Renders a form from a schema produced by `buildFormFromSchema` |
| `AutoTable` | Paginated, sortable table bound to a base store |
| `AutoFilter` | Filter bar generated from a model's filterable fields |
| `AutoCrud` | Wires `AutoTable` + `AutoFilter` + create/edit dialogs into one screen |
| `ActionForm` | Form for custom backend actions (`@action`-decorated endpoints) |
| `FormModal` | Modal wrapper around `AutoForm`/`Form` for create/edit dialogs |
| `ConfirmDeleteDialog` | Confirmation dialog wired to a store's `delete`/`restore` |
| `PdfRender` / `PdfRenderPro` | Preview backend-generated PDFs (pdfjs-dist) |

The `components/engine/*` set (`InputComponent`, `SelectComponent`, `DateComponent`, `UploadComponent`, …) are the field-level primitives `AutoForm` composes from a schema's field `type`.

---

## 🗃️ Base stores

```js
import { createBaseStore } from 'quasar_resaas'

export const useEmployeeStore = createBaseStore('employee', {
  app: 'hr',
  model: 'Employee'
})
```

Gives the resource list/pagination/filters, current item, and create/update/delete/restore actions wired to `HTTPAuth`, with no boilerplate per model.

---

## 🧰 Tech stack

| Layer | Technology |
|---|---|
| Framework | Vue 3 + Quasar 2 *(peer)* |
| State | Pinia *(peer)* |
| Routing | Vue Router *(peer)* |
| HTTP | `axios` |
| PDF | `pdfjs-dist` |
| Docs rendering | `marked` |
| Storage security | `crypto-js` |
| Misc | `figlet` (CLI banners) |

---

## 📦 Package exports

```js
import { ... } from 'quasar_resaas'              // components, stores, services, utils
import { ... } from 'quasar_resaas/auto-imports'  // Quasar auto-import config
import { ... } from 'quasar_resaas/core/...'      // core utilities
```

---

## 📚 Documentation

Full technical documentation lives in [`docs/`](docs/quasar-resaas/README.md), split into two products served by the same docs site (see above):

**`quasar_resaas`** (this library) — [`docs/quasar-resaas/`](docs/quasar-resaas/README.md)

- [Architecture](docs/quasar-resaas/architecture/overview.md) · [Data flow](docs/quasar-resaas/architecture/data-flow.md)
- [BaseStore](docs/quasar-resaas/stores/base-store.md) · [UserStore & context](docs/quasar-resaas/stores/user-context.md)
- [Form](docs/quasar-resaas/components/form.md) · [ActionForm](docs/quasar-resaas/components/action-form.md) · [s-btn](docs/quasar-resaas/components/button.md)
- [Router](docs/quasar-resaas/routing/routes.md) · [Layout](docs/quasar-resaas/layout/layout.md)
- [Permissions](docs/quasar-resaas/features/permissions.md) · [Translation](docs/quasar-resaas/features/translation.md)
- [API & headers](docs/quasar-resaas/api/backend-integration.md)
- [Creating a new frontend resource](docs/quasar-resaas/development/creating-resource.md)
- [Build](docs/quasar-resaas/deployment/build.md) · [Troubleshooting](docs/quasar-resaas/troubleshooting/common-errors.md)

**`django_resaas`** (backend) — [`docs/django-resaas/`](docs/django-resaas/README.md)

- [Architecture](docs/django-resaas/architecture/overview.md) · [Multi-tenancy](docs/django-resaas/architecture/multi-tenancy.md) · [Request lifecycle](docs/django-resaas/architecture/request-lifecycle.md)
- [Models & RESAAS](docs/django-resaas/models/resaas-config.md)
- [BaseAPIView](docs/django-resaas/api/base-api-view.md) · [Search](docs/django-resaas/api/search.md) · [Filters & pagination](docs/django-resaas/api/filters-pagination.md)
- [Permissions](docs/django-resaas/security/permissions.md)
- [Soft delete](docs/django-resaas/features/soft-delete.md) · [Files & PDF](docs/django-resaas/features/files-pdf.md)
- [Creating a new resource](docs/django-resaas/development/creating-resource.md)
- [Git flow & releases](docs/django-resaas/deployment/releases.md) · [Troubleshooting](docs/django-resaas/troubleshooting/common-errors.md)

---

## 🚀 Releasing

```bash
make push      # bump patch version, commit, push to main
make pushtag   # + tag the release
make publish   # + publish to npm
```

---

## 🤝 Contributing

Pull requests are welcome. For larger changes, please open an issue first to discuss direction.

```bash
git clone https://github.com/metanochava/quasar_resaas.git
cd quasar_resaas
npm install
```

---

## 📄 License

Distributed under the [MIT](LICENSE) license.

---

<div align="center">

Made by **[Metano Chavana](https://github.com/metanochava)**

</div>
