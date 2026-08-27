# Frontend Troubleshooting

## `app/model required`

Message thrown in `utils/autoForm.js`, function `buildFormFromSchema`. Happens if the call doesn't pass `app` and `model`:

```js
// WRONG — module/schemaPath don't exist in the function's signature
await buildFormFromSchema({ module, model, schemaPath })

// CORRECT
await buildFormFromSchema({ app: module, model })
```

See [api/backend-integration.md](../api/backend-integration.md#form-schema).

## `Pinia not initialized. Call setPinia(pinia) in boot.`

Thrown by `core/context.js` → `getPinia()`, called internally by every store in the library. The host's boot is missing a call to `setPinia(pinia)` — see [deployment/build.md](../deployment/build.md).

## `Entity is required` / `RESAAS context token was not returned`

Thrown by `services/tenantContext.js` → `createResaasContext()`:
- `Entity is required` — called without `entity`;
- `RESAAS context token was not returned` — the `resaas/context/` endpoint responded without a `token` in the body (backend rejecting the entity/branch/group combination, or an unexpected response).

Without a valid `X-RESAAS-Context`, subsequent requests to the backend have no active entity/branch — see [api/backend-integration.md](../api/backend-integration.md#tenant-context-x-resaas-context).

## `401` on any authenticated request

The response interceptor in `services/api.js` automatically calls `useUserStore().logout('N')` on any `401`. If the user is unexpectedly kicked out of their session, first check whether the `access` token in `localStorage`/`User.access` is still valid before suspecting permissions.

## "Failed to resolve component: s-..."

`s-*` components not registered — the boot that calls `Components({ app })` is missing. See [deployment/build.md](../deployment/build.md).

## Silent errors in stores (`console.error` without throwing)

`EntityStore.js`, `EntityTypeStore.js`, `PermissionStore.js`, and `UserStore.js` catch network/API failures with `try/catch` and only do `console.error('<action> error', e)` — the UI doesn't automatically get error feedback in these cases (`getSettings`, `loadGroups`, `toggleGroup`, `createGroup`, `getUserEntitys`, `savePermissions`, among others). If an action seems to "do nothing" with no visible message, check the browser console first before assuming the request was never made.
