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

## API reference

`s-btn` (`BtnComponent.vue`) declares no props of its own (`inheritAttrs:
false` + `useAttrs()`) — everything below is read directly off whatever
attrs the caller passes; anything not in this table falls straight through
to `q-btn` unchanged, so the [full QBtn prop list](https://quasar.dev/vue-components/button)
still applies.

| Attr | Overridden by layout preference | Default when omitted |
|---|---|---|
| `label` | — | Passed through `tdc()` for translation |
| `dense` | `User.ps.layout.button_dense` | Layout preference |
| `round` | `User.ps.layout.button_round` | Layout preference |
| `flat` | `User.ps.layout.button_style === 'flat'` | Layout preference |
| `outline` | `User.ps.layout.button_style === 'outline'` | Layout preference |
| `unelevated` | `User.ps.layout.button_style === 'unelevated'` | Layout preference |
| `push` | `User.ps.layout.button_style === 'push'` | Layout preference |
| `ripple` | `User.ps.animation.button_animation === 'ripple'` | Always set (not overridable via a prop — driven only by the animation preference) |

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
