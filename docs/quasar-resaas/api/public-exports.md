# Public exports (`import { ... } from 'quasar_resaas'`)

Everything below is exported from the package root (`index.js`). This is the reference a
consumer needs — previously there was no single list, only `index.js` itself.

## Routers

- `restRoutes`, `authRoutes`, `docsRoutes` (plus `docsProducts`, `docsNav`, `defaultDocsProduct` —
  see [routing/routes.md](../routing/routes.md))

## Composable

- `useResaas()` — bundles `tdc`, `safeParse`, `HTTPAuth`/`HTTPAuthBlob`/`HTTPClient`/
  `HTTPClientBlob`, `wsApi`, `url`, `buildFormFromSchema`, `createBaseStore`, and the `User`,
  `Entity`, `EntityType`, `Branch`, `Menu`, `Person` store instances into one call.

## Stores (Pinia)

`UserStore`, `EntityStore`, `EntityTypeStore`, `BranchStore`, `MenuStore`, `PersonStore`,
`ActionStore`, `AlertStore`, `GroupStore`, `LanguageStore`, `LoadStore`,
`PermissionStore`, `DashboardStore`, `EntitlementStore` ([Entitlements](../features/entitlements.md)) — see [stores/base-store.md](../stores/base-store.md) for how they're built
(`createBaseStore`) and [stores/user-context.md](../stores/user-context.md) for tenant context.

## Base

- `createBaseStore(name, config, extend)` — see [stores/base-store.md](../stores/base-store.md).

## Utils

- `buildFormFromSchema({ app, model, fetchRelationOptions })` — fetches and normalizes a
  resource's RESAAS schema into form-ready fields (see
  [../../django-resaas/api/schema-contract.md](../../django-resaas/api/schema-contract.md)
  for the underlying contract).
- `json` — `safeParse`, `JSONSafeParse`, `ascii` (**deprecated**: no caller; it is the only user of
  `figlet` and will be removed in a later release).
- `text` — string helpers.
- `profile` — user-profile helpers.
- `schema` — `normalizeSchema`, `schemaPermission`, `canSchema`, `resolveActionEndpoint`,
  `resolvePdfDetailEndpoint`, plus the canonical defaults `DEFAULT_UI`, `DEFAULT_FILTERS`,
  `DEFAULT_PAGINATION`, `DEFAULT_PDF`, and `RESAAS_SCHEMA_VERSION`. This is what makes the schema
  the single source of truth for UI/pagination/pdf defaults — see
  [architecture/data-flow.md](../architecture/data-flow.md).

## Services

`api` (`url`, `HTTPClient`, `HTTPClientBlob`, `HTTPAuth`, `HTTPAuthBlob`, `wsApi`), `app`, `base`,
`data`, `storage`, `translation` (`tdc`), `theme`, `routing`, `token` (`createToken`), and
`tenantContext` (`createResaasContext`, `getResaasContext`, `setResaasContext`,
`clearResaasContext` — see [stores/user-context.md](../stores/user-context.md)).

## Boot

- `alerts` (`Alert`).

## Components / layouts

- `Components` — the default export of `boot/components.js`, the full `s-*` component registry.
- `FormTwo`, `AutoCrud`, `PersonProfilePanel` — also by name, for an application's own pages
  (they are registered globally too, as `s-form-two` / `s-auto-crud`).
- `MainLayout`, `AuthLayout` — page layouts.
- `CrudPage` — the ready-made CRUD screen (wraps `AutoCrud`/`AutoTable`/`AutoFilter`/`FormModal`
  described in [development/creating-resource.md](../development/creating-resource.md)).

## Not exported from the package root

A few things are used internally or only reachable by relative import, not `import {...} from
'quasar_resaas'`:

- The other individual `Auto*` components (`AutoTable.vue`, `AutoFilter.vue`, `ActionForm.vue`,
  `FormModal.vue`, `ConfirmDeleteDialog.vue`) — reach them through `Components` (registered
  globally under their `s-*` names) rather than importing the `.vue` files directly. `AutoCrud`,
  `FormTwo` and `PersonProfilePanel` are named exports (see below).
- `./auto-imports` — a separate `exports` subpath (`quasar_resaas/auto-imports`), not part of the
  default import; see [deployment/build.md](../deployment/build.md).
- `./core/*` — a separate `exports` subpath for direct file access under `core/`.

## Removed: HR

HR is no longer part of `quasar_resaas` (nor of `django_resaas`): it is an application's own
module now (see [Building a module](../development/building-a-module.md)).

- `useEmployeeStore` (and the other HR stores) are no longer exported: an application that
  has the HR module imports them from its own folder.
- `restRoutes` no longer contains the HR routes (`list_employee`, `view_hr_dashboard`, ...):
  the application spreads its HR module's routes next to `restRoutes`.
- New: `FormTwo`, `AutoCrud`, `PersonProfilePanel` named exports, so a module's pages import
  everything from `'quasar_resaas'`.
