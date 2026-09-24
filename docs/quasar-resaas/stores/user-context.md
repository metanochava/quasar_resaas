# UserStore & tenant context

`stores/UserStore.js` is created with `createBaseStore('user', { app:
'django_resaas', model: 'User' }, {...})` — it inherits everything from
[BaseStore](base-store.md) and adds the essentials of authentication and
multi-tenancy on the frontend side.

## Session

-   `login(data, q)` — `POST login/`, stores `access`/`refresh` in local
    storage (365 days) and calls `me()`.
-   `me()` — `GET me/`, fills in `this.data` and switches the active language
    via `LanguageStore` if the backend returns `language`.
-   `refreshToken()` / `isTokenExpired(token)` / `checkSession()` —
    token renewal based on the decoded JWT's `exp` (no signature
    verification, payload only).
-   `logout(x)` — `x === 'N'` does only a local logout (e.g. a 401 coming
    from the interceptor); otherwise it calls `POST logout/` and clears all
    related storage (theme, tokens, entity/branch/group, permissions,
    "keep session" credentials) and the user's persisted store state
    ([Persistence](persistence.md#logout)). The local cleanup runs even when
    the request fails. The profile (`Group`) and `Permissions` never survive
    a logout. `logout(entityId)` ("log out of this Entity") keeps only
    `userEntity` as the hint for the next sign-in; `logout('x')` keeps no
    Entity.
-   `loadFromStorage()` — restores the entire state (theme, typography,
    entity/branch/group, tokens, permissions) from
    `localStorage`/`sessionStorage` on app startup.

## Permissions

`Permissions` is a `Set` of lowercase strings. The `can` and `hasPermission`
getters do the same check:
`state.Permissions.has(String(perm).toLowerCase())`. Components like
[`AutoCrud`](../components/auto-crud.md) call `useUserStore()` and this
getter directly (`User.can(action.permission)`) rather than receiving
permissions as a prop — see [Permissions](../features/permissions.md).

## Tenant context (`Entity` / `Branch` / `Group`)

The active tenant lives in three `UserStore` fields: `Entity`, `Branch`,
`Group`. Changing any of them goes through
`selectContext({ entity, branch, group })`, which:

1. updates the state and syncs `localStorage`
   (`userEntity`/`userBranch`/`userGroup`);
2. calls `refreshResaasContext()`.

`refreshResaasContext()` calls `createResaasContext` (see below) only
if `Entity.id` exists; otherwise it clears the context
(`clearResaasContext()`).

The stored Entity/Branch/Group are **preferences**, not authorization. When
`POST resaas/context/` refuses them, `discardContextSelection()` clears them
in memory and in localStorage (`userEntity`, `userBranch`, `userGroup`,
`userBranchs`, `userGroups`) together with the context token, and the user
picks an allowed one. A refusal is `403` (no access to that
Entity/Branch/Group) or `400` (it no longer exists). The next call finds no
Entity and makes no request, so a refused selection is never retried in a
loop. This covers an Entity kept by a previous user's
`logout(entityId)`. A network error or a `5xx` keeps the selection.

## Resolving the tenant from a public domain (`EntityStore.getSettings()`)

`Entity.getSettings()` (`stores/EntityStore.js`) is a **different, earlier** tenant-resolution
path than the `X-RESAAS-Context` flow above — it exists for public-facing sites (marketing pages
served without any login) that need to know which `Entity` they belong to, and pick up that
Entity's branding, before any session/token exists:

```js
async getSettings() {
  const { data } = await HTTPClient.get(url({ type: 'u', url: 'site' }))
  // HTTPClient - no auth header, no X-RESAAS-Context: this must work pre-session

  this.Theme = data.theme || {}
  this.LayoutSettings = data.layout_settings || {}
  this.AnimationSettings = data.animation_settings || {}
  this.Typography = data.typography || {}

  User.Entity = data.entity || null
  ...
}
```

It calls the **public** backend endpoint `GET {app}/site/` (`SiteAPIView`, `AllowAny`), which
resolves the `Entity` by matching the request's `Origin` header against `Entity.site` — see
[django_resaas: Resolução de tenant por domínio](../../django-resaas/architecture/multi-tenancy.md#resolução-de-tenant-por-domínio-endpoint-público-site).
No `entity` key in the response (unmatched domain, or no `Origin` sent) means `User.Entity` is
set to `null` — the request still comes back `200`, so callers must check `User.Entity?.id`, not
the HTTP status.

> [!WARNING]
> **`getSettings()` never touches `Entity.row`.** It only sets `User.Entity` (plus the Entity
> store's own `Theme`/`LayoutSettings`/`AnimationSettings`/`Typography` scalars). `this.row` is
> [BaseStore](base-store.md)'s generic-CRUD field — it is only ever assigned by `getById()`,
> `create()`, `update()` (and cleared by `invalidateRow()`). Reading `Entity.row?.id` right after
> `getSettings()` (e.g. to build a login-redirect URL) is always `undefined`; use
> `User.Entity?.id` instead. This was a real, shipped bug in more than one public-site layout
> (`src/sites/*/layouts/MainLayout*.vue` in the host app) before being found and fixed — search
> for `Entity?.row?.id` before reusing this pattern in a new site.

Typical usage, mirrored across every public site tree that has its own layout (one per business
domain, not part of this library):

```js
// src/sites/<site>/layouts/MainLayout.vue
async mounted() {
  await this.Entity.getSettings()
  if (this.User.Entity?.id) {
    // Entity resolved for this domain - theme/typography above are already in User.*
  } else {
    // no Entity matches this Origin - site.py had no match, or Origin wasn't sent
  }
}
```

## `services/tenantContext.js`

Generates and stores the context token sent to the backend:

``` js
createResaasContext({ entity, branch, group })
// POST resaas/context/  { entity_id, branch_id, group_id }
// -> setResaasContext(data.token)   (sessionStorage, key "resaasContext")
```

This token is the frontend-side equivalent of the tenant context described
in `django_resaas` (`entity_id`/`branch_id`/`group_id` — see the backend
documentation, `architecture/multi-tenancy.md`). The interceptor in
`services/api.js` reads it with `getResaasContext()` and sends it on
**every** authenticated call as `X-RESAAS-Context` (see
[API & headers](../api/backend-integration.md)). Without a selected `Entity`
there is no context token, so the backend has no way of knowing which tenant
to filter data by.

## `core/context.js`

Only stores the Pinia instance (`setPinia`/`getPinia`) so that
`base_store.js` and the services can access stores outside Vue components.

> [!NOTE]
> This file has no direct relationship to the "tenant context" above beyond
> the name — don't confuse the two "contexts".
