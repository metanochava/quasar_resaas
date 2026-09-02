# FAQ — Getting started with quasar_resaas

Practical answers, in the order you'll actually need them when building a
screen against a `django_resaas` API. See the backend's own
[`django_resaas` FAQ](https://github.com/metanochava/django_resaas/blob/main/docs/faq.md)
for the other half of this journey (creating the model/view the schema
below comes from).

## Installation

```bash
npm install quasar_resaas
```

```js
// boot/resaas.js
import { Components } from 'quasar_resaas'

export default ({ app }) => {
  app.use(Components)   // registers every s-* component globally
}
```

```js
// quasar.config.js
boot: ['resaas', 'login_boot', 'alerts', 'cripto']
```

`quasar_resaas` expects to run inside a Quasar CLI (Vite) app that
already provides Vue 3, Quasar, Pinia and Vue Router - it doesn't bundle
them (see `package.json`'s `peerDependencies`). It talks to a running
`django_resaas` backend - see that project's own
[installation FAQ](https://github.com/metanochava/django_resaas/blob/main/docs/faq.md#installation)
for standing one up.

```js
// .env (or quasar.config.js env block)
API=http://localhost:7002
API_PREFIX=api
```

---

## Como crio um formulário?

Two real components, for two different situations - see
[Form](components/form.md) for the full comparison:

**A modal/dialog form** (`s-auto-form` / `AutoForm.vue`) - driven by a
schema you fetch yourself:

```js
import { buildFormFromSchema } from 'quasar_resaas'

const schemaFields = ref([])
const showForm = ref(false)

const result = await buildFormFromSchema({ app: 'hr', model: 'Employee' })
schemaFields.value = result.fields
```

```vue
<!-- real props: modelValue (v-model), schema (the fields ARRAY - not
     "fields"), app/model (strings), data (record being edited, or
     omit/null to create) -->
<AutoForm
  v-model="showForm"
  :schema="schemaFields"
  app="hr"
  model="Employee"
  :data="editingRow"
  @saved="showForm = false"
/>
```

**A full page form** (`s-form-two` / `FormTwo.vue`) - driven by an
already-loaded [store](stores/base-store.md) instead:

```vue
<s-form-two
  :store="employeeStore"
  :ignore-fields="['created_at', 'updated_at', 'created_by', 'updated_by']"
  @saved="onSaved"
/>
```

You almost never build either one from scratch - `AutoCrud` already
wires the modal form in for you (see below).

## Como uso BaseStore?

```js
// stores/EmployeeStore.js
import { createBaseStore } from 'quasar_resaas'

export const useEmployeeStore = createBaseStore('employee', {
  app: 'hr',
  model: 'Employee',
})
```

```js
const Employee = useEmployeeStore()
await Employee.init()            // loadSchema() + loadData()
await Employee.getById(id)       // cached; { force: true } to bypass
Employee.form = { ...Employee.form, first_name: 'Ana' }
await Employee.save()            // create() or update() depending on form.id
```

Full action-by-action reference (including the PATCH-by-default rule,
pagination edge cases, and error handling) in
[BaseStore](stores/base-store.md).

## Quando uso AutoCrud?

`<s-auto-crud>` (`AutoCrud.vue`) when you want a complete list screen -
table, filters, create/edit dialog, delete/restore, custom actions, PDF -
with **zero** custom Vue code:

```vue
<s-auto-crud app="hr" model="Employee" route="view_employee" />
```

It fetches its own schema and manages its own state internally (it does
**not** use `createBaseStore`/Pinia - see
[Architecture](architecture/overview.md)).

Reach for `BaseStore` + your own components instead when the screen needs
something `AutoCrud` doesn't offer as-is: a non-tabular layout, a
multi-step wizard, cross-store logic (e.g. combining two resources on one
page), or a detail page that isn't really a list at all. Nothing stops
you from using both in the same app - most do, `AutoCrud` for routine
CRUD lists and `BaseStore` directly for anything bespoke.

## Como personalizo um campo?

Two layers, and they answer slightly different questions:

**Backend** (`RESAAS.fields` on the model) currently only affects
`FileField`/`ImageField`'s accepted MIME types:

```python
class Document(BaseModel):
    attachment = models.FileField(upload_to=...)

    class RESAAS:
        fields = {
            "attachment": {"accept": ".pdf,.doc,.docx"},
        }
```

**Frontend** - `buildFormFromSchema()`'s returned `fields` are plain
objects (`name`, `label`, `component`, `props`, `ui`, `rules`, ...) you
can freely inspect/mutate before handing them to `AutoForm`, for anything
beyond what the backend config covers - relabeling, forcing a different
component, adding a prop, tweaking a validation rule:

```js
const result = await buildFormFromSchema({ app: 'hr', model: 'Employee' })

const status = result.fields.find(f => f.name === 'status')
if (status) {
  status.component = 's-select'          // force a select instead of s-input
  status.props.label = 'Current status'  // relabel
}
```

## Como sobrescrevo o comportamento automático?

`createBaseStore(name, config, extend)`'s third argument is exactly for
this - `extend.actions` are spread **after** the base actions, so an
action with the same name **replaces** the built-in one entirely; hooks
(`extend.hooks`) run **alongside** the built-in behavior instead, which
is the gentler option when you just need to react to something:

```js
export const useEmployeeStore = createBaseStore('employee', {
  app: 'hr', model: 'Employee',
}, {
  actions: {
    // completely replaces the base loadData()
    async loadData(params = {}) {
      return await this.loadDataForMyOwnEndpoint(params)
    },
  },
  hooks: {
    // runs in addition to the base afterCreate()
    afterCreate(data) {
      this.notifySomethingElse(data)
    },
  },
})
```

See [BaseStore](stores/base-store.md#hooks-extendhooks) for the full list
of available hooks. When the override goes beyond what a store extension
can express - a genuinely different screen flow - build the page with
`BaseStore` + individual `s-*` components directly instead of
`AutoCrud`, per the previous answer.
