# Backend Integration

## HTTP client

`services/api.js` creates four axios instances over `apiBaseUrl` (`${process.env.API}/${process.env.API_PREFIX}`):

```
HTTPClient      // unauthenticated
HTTPClientBlob  // unauthenticated, blob response
HTTPAuth        // authenticated
HTTPAuthBlob    // authenticated, blob response (e.g. PDF)
```

The `url({ type, url, params })` helper builds the final URL. `type: 'nu'` inserts the active `EntityType`'s name into the path (`.../<entityType>/<url>`); `type: 'u'` doesn't.

## Headers sent on every request

The request interceptor in `createClient()` adds, when `auth: true`:

| Header | Source | Purpose |
|---|---|---|
| `Authorization: Bearer <token>` | `User.access` or `localStorage` (`access`) | JWT authentication |
| `X-RESAAS-Context` | `sessionStorage` (`resaasContext`) | tenant context token (see below) |
| `L` | `sessionStorage` (`userLang`) | active language id |
| `fek` / `fep` | `process.env.FRONT_END_KEY` / `FRONT_END_PASSWORD` | application key/secret (identifies the front to the backend, independent of the user) |

On a `401` error, the interceptor itself calls `useUserStore().logout('N')`.

## Tenant context (`X-RESAAS-Context`)

The backend (django_resaas, doc `architecture/multi-tenancy.md` — `entity_id`, `branch_id`, `group_id`) doesn't receive these ids on every individual request. The frontend exchanges them **once** for an opaque token:

```js
// services/tenantContext.js
await createResaasContext({ entity, branch, group })
// POST resaas/context/  { entity_id, branch_id, group_id }
// -> { token } stored in sessionStorage as X-RESAAS-Context
```

Every subsequent authenticated request resends that token in the
`X-RESAAS-Context` header, and it's the backend that decodes it to apply the
`entity_id`/`branch_id` filters described in multi-tenancy.md. Without this
token, the backend has no way of knowing which entity/branch to apply.

`createResaasContext` throws:
- `Entity is required` — if called without `entity`;
- `RESAAS context token was not returned` — if the backend's response doesn't include a `token`.

## Form schema

`buildFormFromSchema({ app, model, fetchRelationOptions })` (`utils/autoForm.js`) requests the model's schema from the backend:

```
GET django_resaas/resaasapps/{app}/{model}/schema/
```

and converts each field (`ForeignKey`, `CharField`, `IntegerField`, …) into Quasar props (`rules`, `options`, `s-input`/etc. component), including an async `onFilter` with caching and debounce (350ms) for relation fields, which by default search on:

```
GET django_resaas/relations/?model={relation}&search={term}
```

Throws `app/model required` if `app` or `model` aren't passed — see [troubleshooting](../troubleshooting/common-errors.md#app-model-required).

## See also

- [Authentication and creating a resource](../development/creating-resource.md)
- [Common errors](../troubleshooting/common-errors.md)
