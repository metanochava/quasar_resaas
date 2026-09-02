# Customizing fields

Field rendering starts entirely from the backend's schema, but there are two
independent layers you can reach for when the default output isn't right:
a backend-side config that ships as part of the schema, and a frontend-side
pass over the fields array before it reaches a form.

## Backend: `RESAAS.fields`

A model's `class RESAAS` can declare a `fields` dict keyed by field name.
Today this is read by the schema builder for one thing:
`FileField`/`ImageField`'s accepted MIME types, exposed to the frontend as
`accept`:

```python
class EntityType(BaseModel):
    logo = models.ImageField(upload_to=...)

    class RESAAS:
        fields = {
            "logo": {"accept": ".png,.jpg,.jpeg,.svg"},
        }
```

This flows straight into `schema.fields[].props.accept` for that field, so
any `s-*` component in the auto-generated form gets the right
`accept="..."` on its file input without frontend code. See the backend's
[Models & RESAAS](../../django-resaas/models/resaas-config.md).

## Frontend: mutating the built fields array

[`buildFormFromSchema({ app, model })`](../architecture/data-flow.md)
(`utils/autoForm.js`) returns a plain array of field descriptors — not a
reactive/opaque structure — so anything beyond what the backend config
covers (relabeling, forcing a different component, adding a prop, tweaking
a validation rule) is a normal array `find`/mutate before handing the
result to [`AutoForm`](../components/form.md):

```js
const result = await buildFormFromSchema({ app: 'hr', model: 'Employee' })

const status = result.fields.find(f => f.name === 'status')
if (status) {
  status.component = 's-select'          // force a select instead of s-input
  status.props.label = 'Current status'  // relabel
}
```

Each entry has this shape (built in `buildFormFromSchema`, one per backend
field):

| Key | Description |
|---|---|
| `name` | Field name, as declared on the backend model |
| `label` | Translated label (`tdc()` applied to `verbose_name`/`label`/`name`) |
| `component` | The `s-*` component to render — defaults to `'s-input'` when the schema doesn't specify one |
| `props` | Props to pass to `component`: `filled`/`dense`/`clearable` by default, plus `label`, `rules` (built from `required`/`min`/`max`/`min_length`/`max_length`/JSON validity), `options`/`emitValue`/`mapOptions` for a `choices` field, and `onFilter`/`options` for a relation field (debounced remote search, see below) |
| `ui` | Booleans the form template branches on: `isFile`, `isImage`, `isJson`, `isNumeric`, `isChar`, `isRelation` |

`AutoCrud` (see [AutoCrud](../components/auto-crud.md)) calls
`buildFormFromSchema` itself and doesn't expose this array for you to mutate
before rendering — this pattern is for building your own form (with
[`s-auto-form`](../components/form.md) directly) when a field needs
something `AutoCrud`'s defaults don't provide.

### Relation fields

A field whose `ui.isRelation` is `true` gets `props.onFilter` wired to a
debounced (350ms) remote search — by default against
`django_resaas/relations/?model=<relation>&search=<query>`, cached per
`relation::query` in memory for the component's lifetime. Pass your own
`fetchRelationOptions(relation, search)` to `buildFormFromSchema` to
override this (e.g. to filter by the current tenant, or hit a different
endpoint) without touching the rest of the pipeline.

## When to reach for a fully custom field instead

If a field's behavior can't be expressed as a prop tweak or a swapped
component — a genuinely different widget, cross-field logic, a value that
needs transforming before it's sent — build that one field by hand outside
`AutoForm`/`AutoCrud` and read/write the store's `form` object directly
(see [BaseStore](../stores/base-store.md)) instead of trying to force it
through the schema-driven pipeline.
