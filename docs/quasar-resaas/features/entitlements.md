# Entitlements

`useEntitlementStore()` exposes to the UI what the current tenant is entitled
to: **features** (e.g. `multi_entity`) and **capacities** (e.g. `branches`:
limit 3, used 3). It reads the backend's `GET resaas/entitlements/`
(django_resaas [Entitlements](../../django-resaas/security/entitlements.md)).

> [!IMPORTANT]
> This is **UX only**. Hiding a menu, disabling a "New" button or showing
> "3 / 3" does not protect anything. The backend refuses what the tenant is not
> entitled to, whatever the frontend shows:
> - 403 `feature_not_available`;
> - 403 `capacity_exceeded`, with `error.details` = `{capacity, limit, current}`;
> - 403 `module_not_available`.

Entitlements are not permissions: `User.can('add_branch')` says whether the
**user** may create a branch; `canAdd('branches')` says whether the **tenant**
still has room for one. A button that creates a branch should check both.

## Usage

```js
import { useEntitlementStore } from 'quasar_resaas'   // also in the auto-imports preset

const Entitlements = useEntitlementStore()
await Entitlements.load()          // once the RESAAS context is set

Entitlements.hasFeature('advanced_audit')   // true / false
Entitlements.getCapacity('branches')        // { limit: 3, used: 3 }, or null when unknown
Entitlements.canAdd('branches')             // false: 3 of 3 used
```

```vue
<s-btn
  :label="tdc('New branch')"
  :disable="!User.can('add_branch') || !Entitlements.canAdd('branches')"
/>
<span v-if="Entitlements.getCapacity('branches')?.limit">
  {{ Entitlements.getCapacity('branches').used }} / {{ Entitlements.getCapacity('branches').limit }}
</span>
```

## Behaviour

| State | `hasFeature(x)` | `canAdd(x)` |
|---|---|---|
| Not loaded yet | `true` | `true` |
| Backend not restricting (`restricted: false`) | `true` | `true` (limits are `null`) |
| Restricted | `true` only when the backend listed `x` as enabled | `used + adding <= limit`, and `true` when `limit` is `null` |

The store never hides something before it knows. The backend decides in the end.

- **Caching.** `load()` keeps the data for the current context token. It fetches
  again when the context changes (another Entity or Branch) or when called with
  `{ force: true }`.
- **After a 403 `capacity_exceeded`**, call `load({ force: true })` to refresh the
  counts. The message itself already reaches the user through the central alerts
  funnel ([Errors and alerts](errors-and-alerts.md)).

## API

| Member | Description |
|---|---|
| `load({ force })` | `GET resaas/entitlements/` (`HTTPAuth`; needs the signed context) |
| `restricted` | `null` (not loaded), `false`, `true` |
| `features` | `{ name: bool }` as listed by the backend |
| `capacities` | `{ name: { limit, used } }` |
| `hasFeature(name)`, `getCapacity(name)`, `canAdd(name, adding = 1)` | Getters described above |
| `reset()` | Clears the state (e.g. on logout) |

Source: `stores/EntitlementStore.js`. Tests: `stores/EntitlementStore.spec.js`.
