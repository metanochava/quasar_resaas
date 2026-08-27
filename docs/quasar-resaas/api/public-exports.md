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
`ActionStore`, `AlertStore`, `EmployeeStore`, `GroupStore`, `LanguageStore`, `LoadStore`,
`PermissionStore` — see [stores/base-store.md](../stores/base-store.md) for how they're built
(`createBaseStore`) and [stores/user-context.md](../stores/user-context.md) for tenant context.

## Base

- `createBaseStore(name, config, extend)` — see [stores/base-store.md](../stores/base-store.md).

## Utils

- `buildFormFromSchema({ app, model, fetchRelationOptions })` — fetches and normalizes a
  resource's RESAAS schema into form-ready fields (see
  [../../django-resaas/api/schema-contract.md](../../django-resaas/api/schema-contract.md)
  for the underlying contract).
- `json` — `safeParse`.
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
- `MainLayout`, `AuthLayout` — page layouts.
- `CrudPage` — the ready-made CRUD screen (wraps `AutoCrud`/`AutoTable`/`AutoFilter`/`FormModal`
  described in [development/creating-resource.md](../development/creating-resource.md)).

## Not exported from the package root

A few things are used internally or only reachable by relative import, not `import {...} from
'quasar_resaas'`:

- Individual `Auto*` components (`AutoCrud.vue`, `AutoTable.vue`, `AutoFilter.vue`, `FormTwo.vue`,
  `ActionForm.vue`, `FormModal.vue`, `ConfirmDeleteDialog.vue`) — reach them through `Components`
  (registered globally under their `s-*` names) rather than importing the `.vue` files directly.
- `./auto-imports` — a separate `exports` subpath (`quasar_resaas/auto-imports`), not part of the
  default import; see [deployment/build.md](../deployment/build.md).
- `./core/*` — a separate `exports` subpath for direct file access under `core/`.
