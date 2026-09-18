import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'

import FieldComponent from './FieldComponent.vue'

// FieldComponent.vue (s-field) is the single dispatch point every
// schema-driven page goes through (Model -> Schema -> FieldComponent ->
// specialized component - see app_schema.py's _resolve_ui()/
// utils/autoForm.js's buildFormFromSchema()). It must pick the widget
// from the field's own type/ui/component metadata alone - never from
// which model or field name it happens to be, so a plain stub per
// widget name is enough here: what matters is WHICH one got picked,
// not how that widget itself behaves (FileComponent.spec.js already
// covers s-file's own mechanics).
const stub = (name) => ({
  name,
  props: ['modelValue', 'accept', 'multiple', 'maxSize', 'label', 'rules'],
  template: `<div class="stub-${name}"></div>`
})

const globalStubs = {
  components: {
    's-input': stub('s-input'),
    's-file': stub('s-file'),
    's-select': stub('s-select'),
    's-switch': stub('s-switch'),
    's-date': stub('s-date'),
    's-editor': stub('s-editor'),
    's-multiselect': stub('s-multiselect')
  }
}

function mountField(field, modelValue = null) {
  return mount(FieldComponent, {
    props: { field, modelValue },
    global: globalStubs
  })
}

describe('FieldComponent (s-field) - generic dispatch by field metadata', () => {
  it('renders s-input for a plain CharField (regression: existing fields must keep working)', () => {
    const wrapper = mountField({ name: 'name', type: 'CharField' })
    expect(wrapper.find('.stub-s-input').exists()).toBe(true)
  })

  it('renders s-file for a FileField, from field.type alone, no field.component needed', () => {
    const wrapper = mountField({ name: 'contract_file', type: 'FileField' })
    expect(wrapper.find('.stub-s-file').exists()).toBe(true)
  })

  it('renders s-file for an ImageField, from field.type alone, no field.component needed', () => {
    const wrapper = mountField({ name: 'logo', type: 'ImageField' })
    expect(wrapper.find('.stub-s-file').exists()).toBe(true)
  })

  it('renders s-file for an ImageField regardless of which model/field it belongs to', () => {
    // Same field.type, deliberately different model/field names -
    // proves dispatch never branches on either (Person.photo,
    // Entity.logo, Product.image, Employee.contract_file, ...).
    for (const [model, name] of [['Person', 'photo'], ['Entity', 'logo'], ['Product', 'image']]) {
      const wrapper = mountField({ name, model, type: 'ImageField' })
      expect(wrapper.find('.stub-s-file').exists(), `${model}.${name}`).toBe(true)
    }
  })

  it('forwards the schema-resolved accept/multiple/maxSize props straight through to the widget', () => {
    const wrapper = mountField({
      name: 'photo',
      type: 'ImageField',
      props: { accept: 'image/*', multiple: false, maxSize: 2097152 }
    })

    const fileStub = wrapper.findComponent({ name: 's-file' })
    expect(fileStub.props('accept')).toBe('image/*')
    expect(fileStub.props('multiple')).toBe(false)
    expect(fileStub.props('maxSize')).toBe(2097152)
  })

  it('prefers an explicit backend-resolved field.component over guessing from type', () => {
    // The real schema pipeline (buildFormFromSchema) always sets this -
    // guessComponent() is only ever the fallback for a hand-built field.
    const wrapper = mountField({ name: 'x', type: 'CharField', component: 's-editor' })
    expect(wrapper.find('.stub-s-editor').exists()).toBe(true)
  })

  it('passes the current value through as v-model without transformation', () => {
    const file = new File(['x'], 'a.png', { type: 'image/png' })
    const wrapper = mountField({ name: 'photo', type: 'ImageField' }, file)

    expect(wrapper.findComponent({ name: 's-file' }).props('modelValue')).toStrictEqual(file)
  })
})
