# quasar_resaas Documentation

This folder contains the technical documentation for the `quasar_resaas` frontend
library, companion to the `django_resaas` backend.

## Navigation

-   [Architecture — Overview](architecture/overview.md)
-   [Architecture — Data flow](architecture/data-flow.md)
-   [Stores — BaseStore](stores/base-store.md)
-   [Stores — UserStore & context](stores/user-context.md)
-   [Components — Form](components/form.md)
-   [Components — ActionForm](components/action-form.md)
-   [Components — s-btn](components/button.md)
-   [Router](routing/routes.md)
-   [Layout](layout/layout.md)
-   [Permissions](features/permissions.md)
-   [Translation](features/translation.md)
-   [API & headers](api/backend-integration.md)
-   [Public exports](api/public-exports.md)
-   [Creating a new resource](development/creating-resource.md)
-   [Build](deployment/build.md)
-   [Troubleshooting](troubleshooting/common-errors.md)

## Purpose

`quasar_resaas` provides Vue3/Quasar components, stores, and services that read the
schema exposed by `django_resaas` and generate forms, tables, filters, and CRUD flow
without hand-writing it on every screen.

This folder is rendered inside any app that installs the package, via `docsRoutes`
(see [Architecture](architecture/overview.md)) — it isn't just markdown for GitHub.
