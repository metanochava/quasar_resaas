# s-btn

`s-btn` (`components/engine/BtnComponent.vue`) is a thin wrapper around
`q-btn` that automatically applies the [theme engine](../layout/layout.md)
and [translation](../features/translation.md) — it doesn't introduce any
permission prop of its own.

## What it does

- Translates `label` with `tdc(label)` automatically.
- Applies `dense`, `round`, and the style (`flat`/`outline`/`unelevated`/
  `push`) from the user's layout preferences (`User.ps.layout`), unless the
  corresponding prop is passed explicitly.
- Applies animation (`ripple` or `pulse`) from `User.ps.animation`.
- All other props (`color`, `icon`, `loading`, `type`, `@click`, ...) pass
  straight through to the underlying `q-btn`.

## Does not do permission-gating

Despite what the name might suggest, `s-btn` does **not** hide itself based
on permission. The caller decides that with `v-if`:

``` vue
<s-btn
  v-if="User.can(store.permissions?.delete || 'delete_' + model.toLowerCase())"
  color="negative"
  icon="delete"
  :loading="store.saving"
  :label="tdc('Delete')"
  @click="deleteRecord"
/>
```

This is the pattern used in [`s-action-form`](action-form.md) and
[`s-form-two`](form.md) for all CRUD buttons — prefer the schema-provided
permission codename (`store.permissions.*`) over hand-building
`'<action>_' + model.toLowerCase()`, falling back to the convention only
when the store hasn't loaded a schema yet.

## Simple usage

``` vue
<s-btn color="primary" icon="save" label="Save" @click="save" />
```
