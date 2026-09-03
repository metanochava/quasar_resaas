# ActionForm (`s-action-form`)

`s-action-form` (`components/auto/ActionForm.vue`) is the action bar
(Cancel/Reset/Edit/Delete/Save) used in the footer of
[`s-form-two`](form.md) and any other store-driven form.

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `store` | `Object` | *required* | Resource store; uses `store.model`, `store.saving`, `store.row`/`store.form` |
| `reform` | `Object` | `null` | External form object (e.g. `resetForm()`, `delete()`) — falls back to `store` if absent |
| `buttons` | `Array` | `['cancel','reset','edit','delete','save']` | Which buttons to show |

## Emits

| Event | Payload | Fired when |
|---|---|---|
| `save` | — | Save button clicked |
| `cancel` | — | Cancel button clicked |
| `reset` | — | Reset button clicked, after `reform.resetForm()` runs |
| `delete` | `obj` (`store.form` at the time of deletion) | After `reform.delete()`/`store.delete()` resolves |

## Behavior

- `isEdit` = `!!(store.row?.id || store.form?.id)`; **Edit** is only
  visible when editing, **Save** only when creating.
- Each button is guarded by a permission: Delete requires
  `delete_<model>`, Edit requires `change_<model>`, Save requires
  `add_<model>` — see [Permissions](../features/permissions.md). The actual
  codename is read from `store.permissions.*` (populated from the schema
  response by `createBaseStore`'s `loadSchema()`), falling back to the
  `<action>_<model>` convention only when the store hasn't loaded a schema.
- `reset` calls `reform.resetForm()` if it exists; `delete` calls
  `reform.delete()` or, failing that, `store.delete()`.

## Usage

``` vue
<s-action-form
  :store="cargoStore"
  :buttons="['cancel', 'save']"
  @cancel="goBack"
  @save="save"
/>
```
