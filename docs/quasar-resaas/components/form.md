# Form (`s-form-two`)

`s-form-two` (`components/auto/FormTwo.vue`) is the full-page form for
creating/editing a record. Unlike `s-auto-form`, it doesn't receive
`schema`/`module`/`model` directly — it receives the already-loaded
[store](../stores/base-store.md) instance.

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `store` | `Object` | — | Resource store instance (see [BaseStore](../stores/base-store.md)); exposes `form`, `row`, `model`, `saving` |
| `ignoreFields` | `Array` | `[]` | Fields to hide from the form |
| `leftCol` / `centerCol` / `rightCol` | `String` | `col-3` / `col` / `col-4` | Column classes when the `left`/`right` slots are used |

## Slots

`header`, `left`, `center`, `right`, `footer` — when absent, the component
draws its own header (title + Cancel/Save), the form via `s-form` (engine) in
the center, and the footer via [`s-action-form`](action-form.md).

## Usage

``` vue
<s-form-two
  :store="cargoStore"
  :ignore-fields="['created_at', 'updated_at', 'created_by', 'updated_by']"
  @saved="onSaved"
/>
```

`isEdit` is computed from `store.form?.id`. The save button (`add_<model>`)
or edit button (`change_<model>`) only appears if `User.can(...)` allows it
— see [Permissions](../features/permissions.md).

## Relationship to other components

- **`s-auto-form`** (`AutoForm.vue`) is the **dialog/modal** form, driven
  by `schema` + `app`/`model` received as loose props instead of a store —
  used inside `s-form-modal`.
- **`s-auto-crud`** (`AutoCrud.vue`) combines `s-auto-table` +
  `s-form-modal` (which wraps `s-auto-form`) + `s-auto-filter` into a
  complete listing page. `s-form-two` is the dedicated (non-modal) page
  alternative to the same editing flow.

> ⚠️ Version note: the `store`-based API of `s-form-two` is the current one
> in the source code. Consumers using loose props (`schema`, `module`,
> `model`, `data`, `can-do`) are on a previously published version —
> check the installed version before copying examples.
