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
    "keep session" credentials).
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
It has no direct relationship to the "tenant context" above beyond the name
— don't confuse the two "contexts".
