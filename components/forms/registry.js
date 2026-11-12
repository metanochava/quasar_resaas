// The components <s-dynamic-form> renders a field with. Each definition field
// type maps to an existing s-* component; a module registers its own for
// `type: "custom"` fields (or to replace a type) without touching the engine:
//
//   import { registerFormComponent } from 'quasar_resaas'
//   registerFormComponent('saude.vital-signs', VitalSignsInput)
//
// A component gets v-model (modelValue / update:modelValue), `field` (its
// definition), `label`, `error` / `errorMessage`, `readonly`, `disable`.
// Names are module.name (the backend validates them in a definition).

const BUILT_IN = {
  text: { component: 's-input' },
  textarea: { component: 's-input', props: { type: 'textarea', autogrow: true } },
  email: { component: 's-input', props: { type: 'email' } },
  phone: { component: 's-input', props: { type: 'tel' } },
  integer: { component: 's-input', props: { type: 'number', step: 1 } },
  decimal: { component: 's-input', props: { type: 'number', step: 'any' } },
  boolean: { component: 's-switch' },
  date: { component: 's-date' },
  time: { component: 's-time' },
  datetime: { component: 's-date-time' },
  select: { component: 's-select', props: { emitValue: true, mapOptions: true } },
  multiselect: { component: 's-multiselect', props: { emitValue: true, mapOptions: true } },
  relation: { component: 's-select', props: { emitValue: true, mapOptions: true } },
  file: { component: 's-file' },
  image: { component: 's-file', props: { accept: '.png,.jpg,.jpeg,.webp' } },
  editor: { component: 's-editor' }
}

const registered = new Map()

export function registerFormComponent (name, component, props = {}) {
  if (!/^[a-z][a-z0-9_-]*(\.[a-z][a-z0-9_-]*)*$/.test(name)) {
    throw new Error(`Form component names are module.name: "${name}"`)
  }
  registered.set(name, { component, props })
}

export function unregisterFormComponent (name) {
  registered.delete(name)
}

// { component, props } for a definition field - a registered component by
// name first, then the built-in one of its type; null when unknown (the form
// shows a placeholder instead of guessing)
export function resolveFormComponent (field) {
  if (field.component && registered.has(field.component)) return registered.get(field.component)
  if (registered.has(field.type)) return registered.get(field.type)
  if (field.type === 'custom') return null
  return BUILT_IN[field.type || 'text'] || null
}

export function formComponentNames () {
  return [...Object.keys(BUILT_IN), ...registered.keys()]
}
