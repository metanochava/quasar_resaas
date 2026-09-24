# Errors and alerts

Every failed request from the backend, and every extra message it wants shown alongside a normal
result, arrives in one contract — see
[django_resaas: Errors and alerts](../../django-resaas/api/errors-and-alerts.md) for the backend
side. This page documents how `quasar_resaas` reads and surfaces that contract on the frontend.

## Reading a failed request — `utils/apiContract.js`

```js
import { errorMessage, errorCode } from 'quasar_resaas'

try {
  await Store.save()
} catch (e) {
  actionError.value = errorMessage(e) || tdc('Could not save.')
  if (errorCode(e) === 'group_already_assigned') { /* branch on the stable code */ }
}
```

- `errorMessage(error)` — the human, translated message of a failed axios request (or `undefined`
  when the body carries no error at all). **Prefer this over reading `error.response.data.detail`
  by hand** — every component that built its own ad hoc fallback chain
  (`e?.response?.data?.detail || e?.response?.data?.[0] || ...`) was migrated onto it.
- `errorCode(error)` — the stable `code`, or `undefined`. Branch on this, **never** on the
  translated `message` text.
- `normalizeError(data)` — the lower-level function both are built on: returns
  `{code, message, details, fields, validation}` from a response body, or `null` when there is no
  error in it.
- `parseFieldErrors(data)` — reads `error.details` (the contract) into a flat
  `{field: "one message"}` map, ready for an `s-*` input's `:error-message`. Field validation stays
  at the fields; it does not go into the alert history below.

`normalizeError()` still understands the older `{"detail": "...", "code": "..."}` shape (and the
bare per-field map) as a fallback, purely so a body from a backend that predates this contract, or
one built by hand outside `resaas_exception_handler`, is not left unreadable — but the current
backend always answers `{"error": {...}}` (see the backend page's note on the removed legacy
aliases), so that fallback branch is not expected to run in practice. New code reads `error` only.

> [!WARNING]
> A relation/choice field kept in its READ shape (`{id, value, label}`) and sent back as-is is a
> different problem — see [BaseStore's write-payload normalisation](../stores/base-store.md) and
> the `"... is not a valid UUID."` entry in
> [Troubleshooting](../troubleshooting/common-errors.md).

## The one funnel — `boot/alerts.js`

`Alert(response)` / `AlertSuccess(...)` / `AlertError(error)` / `AlertInfo(...)` / `AlertWarning(...)`
are **the only** way a component should surface API feedback. **Never call Quasar's own
`Notify.create()` for API feedback** — the funnel applies one policy per level (toast and/or
history), drops duplicate messages, and keeps the history in the existing `AlertStore`:

```js
import { AlertSuccess, AlertError } from 'quasar_resaas'

try {
  await Store.removeById(item.id)
  AlertSuccess(tdc('Record deleted.'))
} catch (e) {
  AlertError(e)
}
```

- `AlertSuccess(data)` — a component's own success message (a string), or a full response object
  (reads `alert_success` and any `alerts` it carries).
- `AlertError(error)` — an axios error (or a response). Reads the contract via `normalizeError()`,
  falls back to a generic message, and never leaks raw backend internals to the toast.
- `Alert(response)` — dispatches by shape: an error-looking body goes through `AlertError`, a
  string through `AlertInfo`, otherwise any `alerts`/`alert_success`/... already on the payload.

That history is shown by the **existing** header notification component
(`HeaderNotifications`, "Alerts" tab: unread badge, filters, mark as read, remove, clear) — never
add a second button, store or toast layer for this.

## Levels

Backend levels (`success | info | warning | error`) are mapped to Quasar's own `Notify` types
(`levelToQuasar()`, `positive | info | warning | negative`) inside the funnel — components never
see or choose a Quasar type themselves.

## What does NOT go through this

Business notifications (a contract about to expire, an order awaiting approval — durable, meant to
reach the user outside of a single request/response) are `django_resaas.notifications`'s concern,
not this contract — see the backend's [Notifications](../../django-resaas/features/notifications.md).
