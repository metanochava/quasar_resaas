# Permissions

The frontend doesn't decide permissions — it only mirrors what the backend
(`django_resaas`, see its Permissions documentation) has already computed.
The UI only shows/hides; the final authority remains the API.

## `User.can()`

`UserStore` keeps the user's codenames in a `Set` and exposes two
equivalent getters:

```js
// stores/UserStore.js
Permissions: new Set(),           // state

hasPermission: (state) => (perm) => state.Permissions.has(String(perm).toLowerCase()),
can:           (state) => (perm) => state.Permissions.has(String(perm).toLowerCase()),
```

`Permissions` is rebuilt from `localStorage`
(`userPermissions`) in `loadFromStorage()`. Typical usage in a CRUD page:

```vue
<!-- pages/rh/cargo/CargoLPage.vue -->
<s-auto-crud app="rh" model="Cargo" route="view_cargo" />
```

`s-auto-crud` (see [AutoCrud](../components/auto-crud.md)) has no `can`
prop to pass — it calls `useUserStore()` internally and checks
`User.can(...)` against each action's `permission` from `schema.permissions`
to decide which actions to show (edit, delete, create) — see
[Form](../components/form.md) for how the modal form it opens
(`s-auto-form`) is gated the same way.

## Field-level permissions

A schema field can carry its own permissions (backend:
[Field-level permissions](../../django-resaas/security/field-permissions.md)):

```json
{"name": "salary", "permissions": {"view": "view_contract_salary", "change": "change_contract_salary"}}
```

`utils/fieldAccess.js` turns them into UX with `User.can()`.
`applyFieldAccess(fields, can)` returns a new list and never mutates the schema:

| User holds | Field in `store.fields` |
|---|---|
| view + change | unchanged |
| view only | `read_only: true`, `props.readonly`, no rules (never sent by `buildWritePayload`, never prefilled by `resetForm`) |
| change only | `write_only: true` (AutoCrud shows no column for it) |
| neither | removed |

It is applied where the schema becomes `fields`:

- `BaseStore.loadSchema()` keeps the raw list in `_schemaFields` and sets `fields` from it.
  `init()` calls `refreshFieldAccess()` on every call, so a group switch
  (`User.selectContext`) takes effect the next time a page initialises its store, without
  reloading the schema. Call `store.refreshFieldAccess()` yourself if a page stays mounted
  across a context switch.
- `s-auto-crud` applies it to its own `fields`.

A manual form that renders `<s-input v-model="Contract.form.salary">` directly bypasses
`store.fields`. Hide it with `User.can('view_contract_salary')`.

This is UX only. The serializer hides the value and answers `403` with
`error.code === 'field_permission_denied'` (`error.details.fields` lists the fields) when a
payload changes a field the current group may not write. Re-sending the unchanged value, which is
what a whole-form PATCH does, is accepted.

## Routes

By convention, each route's `meta.requiredRole` is the route's own name
(`list_cargo`, `add_cargo`, ...) — see [routing/routes.md](../routing/routes.md).
The host's navigation guard checks `User.can(to.meta.requiredRole)` before
allowing entry.

## Group-level permission management

The real admin screen is `pages/permission/PermissionManager.vue`, bound to
`PermissionStore` (`usePermissionStore`, a
[`base_store`](../stores/base-store.md) with `app: 'auth'`, `model: 'Permission'`):

-   `initPermissions(all, groupPerms, group)` — loads the universe of
    permissions and the selected group's own.
-   `buildApps()` — groups permissions by app/model (from
    `content_type.label`, format `"App | Model"`) and applies the search
    filter (`this.search`).
-   `hasPermission(id)` / `appState()` / `modelState()` — state
    (checked/indeterminate) for the per-app and per-model checkboxes.
-   `toggle(permission)` / `toggleModel()` / `toggleApp()` — change the
    selection **locally** only and mark the store `dirty`.
-   `saveGroupPermissions()` — sends the whole selection in one request,
    `POST auth/permissions/setGroupPermissions/` (`{group, permissions}`);
    `resetChanges()` discards it.

```text
q-checkbox (app)   ──toggleApp()──┐
q-checkbox (model) ──toggle()─────┴──> groupPermissions (local, dirty)
Save ──saveGroupPermissions()──> POST auth/permissions/setGroupPermissions/
```

The backend decides whether the save is allowed. It answers `403` or `404` with a stable
`error.code`, and the message is shown through the normal alert funnel:

| `error.code` | When |
|---|---|
| `permission_denied` | the current group lacks `change_group` |
| `group_not_in_entity` (404) | the group doesn't belong to the current Entity |
| `group_not_editable` | the group isn't `editable` (bootstrap/template groups) |
| `group_shared` | the group is shared with another Entity or is an EntityType template |
| `permission_not_held` | the save adds or removes a permission the current group doesn't hold (`error.details.permissions`) |

The last four only apply without `change_entitytype` (platform level, held by Root).

The group lists (`GroupStore`, the profile picker in `UserAdminStore.loadGroups()`) receive only the
current Entity's groups unless the user is platform level. The EntityType template picker
(`EntityTypeStore.loadGroups()`) therefore shows every group only to platform-level users. See
[django_resaas: Permissions → Managing group permissions](../../django-resaas/security/permissions.md).

> [!WARNING]
> `components/UserPermissioes.vue` and `components/PagePermissoes.vue` exist
> as mounting points (used in `MainLayout`'s `pagepermissoes` dialog) but are
> still unimplemented — just a title, no logic. Don't rely on them as a
> reference for behavior.
