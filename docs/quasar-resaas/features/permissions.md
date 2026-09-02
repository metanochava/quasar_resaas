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
-   `toggle(permission)` — calls `POST .../permissions/:id/addToGroup/`
    or `.../removeFromGroup/`, with optimistic rollback on error.

```text
q-checkbox (app)   ──toggleApp()──┐
q-checkbox (model) ──toggle()─────┼──> HTTPClient.post(...)
                                   └──> groupPermissions updated
```

`components/UserPermissioes.vue` and `components/PagePermissoes.vue` exist
as mounting points (used in `MainLayout`'s `pagepermissoes` dialog) but are
still unimplemented — just a title, no logic. Don't rely on them as a
reference for behavior.
