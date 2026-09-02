# quasar_resaas Documentation

This folder contains the technical documentation for the `quasar_resaas` frontend
library, companion to the `django_resaas` backend.

## Navigation

-   **Getting started** — [Installation](getting-started/installation.md), [Quick start](getting-started/quick-start.md)
-   **Architecture** — [Overview](architecture/overview.md), [Data flow](architecture/data-flow.md)
-   **Stores** — [BaseStore](stores/base-store.md), [UserStore & context](stores/user-context.md)
-   **Components** — [Form](components/form.md), [ActionForm](components/action-form.md), [AutoCrud](components/auto-crud.md), [s-btn](components/button.md)
-   **Features** — [Permissions](features/permissions.md), [Translation](features/translation.md), [Customizing fields](features/custom-fields.md)
-   **Routing** — [Router](routing/routes.md)
-   **Layout** — [Layout](layout/layout.md)
-   **API** — [API & headers](api/backend-integration.md), [Public exports](api/public-exports.md)
-   **Development** — [Creating a new resource](development/creating-resource.md)
-   **Deployment** — [Build](deployment/build.md)
-   **Troubleshooting** — [Common errors](troubleshooting/common-errors.md)

## Purpose

`quasar_resaas` provides Vue3/Quasar components, stores, and services that read the
schema exposed by `django_resaas` and generate forms, tables, filters, and CRUD flow
without hand-writing it on every screen.

This folder is rendered inside any app that installs the package, via `docsRoutes`
(mounted under its own `DocLayout` — see [Architecture](architecture/overview.md))
— it isn't just markdown for GitHub.
