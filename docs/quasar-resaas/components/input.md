# s-input

`s-input` (`components/engine/InputComponent.vue`) wraps `q-input` with the
RESAAS [translation](../features/translation.md) and layout preferences. Use it
instead of a raw `q-input`.

## What it does

- Translates `label`, `placeholder` and `hint` with `tdc()`.
- `dense` follows the user's layout preference (`User.ps.layout.dense`) unless
  passed; the field is `outlined` unless `filled` or `standout` is passed.
- `error` / `errorMessage` show a backend validation error on the field (a
  non-empty string in `error` is both the flag and the message, e.g.
  `:error="Store.errors?.name"`).
- `type="password"` adds a show/hide toggle in `append`; `type="search"` adds a
  search icon in `prepend`.
- Every other attribute is passed to `q-input`.

## Slots

Every named slot given by the caller (`append`, `prepend`, `before`, `after`,
`hint`, ...) is passed to `q-input`; the default slot too. A caller's `append`
replaces the password toggle, and a caller's `prepend` the search icon, instead
of rendering both.

A button inside the field:

```vue
<s-input v-model="newName" dense :label="tdc('Add allergy')" @keyup.enter="add">
  <template #append>
    <s-btn flat round dense icon="add" :disable="!newName.trim()" @click="add" />
  </template>
</s-input>
```

> Before slots were forwarded, `#append` / `#prepend` given to `s-input` were
> silently dropped.

Tests: `components/engine/InputComponent.spec.js`.
