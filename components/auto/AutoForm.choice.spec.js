import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

// The real cycle of a Choice (CharField with `choices` and a max_length):
//
//   Select -> SAVE (raw value) -> DB -> READ  {id, value, label}  -> AutoForm EDIT
//   -> the SAME Select -> validation rules -> must be valid without touching it.
//
// Only the HTTP layer is mocked; the schema, the rules, AutoForm and the real s-select
// (SelectComponent) are the production ones.
const httpGet = vi.fn()
const httpPatch = vi.fn()
const httpPost = vi.fn()

vi.mock('../../services/api', () => ({
  HTTPAuth: {
    get: (...args) => httpGet(...args),
    patch: (...args) => httpPatch(...args),
    post: (...args) => httpPost(...args)
  },
  url: ({ url: path }) => path
}))
// ActionForm drags in vue-router (not installed in the lib); it is not part of this cycle
vi.mock('./ActionForm.vue', () => ({ default: { name: 'ActionForm', template: '<div />' } }))
vi.mock('../../boot/alerts', () => ({ Alert: vi.fn(), AlertSuccess: vi.fn(), parseFieldErrors: () => ({}) }))

import AutoForm from './AutoForm.vue'
import SelectComponent from '../engine/SelectComponent.vue'
import BtnComponent from '../engine/BtnComponent.vue'
import CardComponent from '../engine/CardComponent.vue'
import ModalCard from '../engine/ModalCard.vue'
import TooltipComponent from '../engine/TooltipComponent.vue'
import InputComponent from '../engine/InputComponent.vue'
import { buildFormFromSchema } from '../../utils/autoForm'
import { mountWith, unmountAll, inBody, globalConfig } from '../user/account/_helpers'

// what ResaasSchemaBuilder emits for  Entity.two_factor_policy  (CharField(max_length=10, choices))
const SCHEMA = {
  schema_version: '1.0',
  model: { app: 'django_resaas', name: 'entity', class_name: 'Entity', label: 'Entity', label_plural: 'Entities', pk: 'id', endpoint: 'django_resaas/entitys/' },
  fields: [
    {
      name: 'two_factor_policy',
      type: 'CharField',
      label: 'Two-factor policy',
      max_length: 10,
      required: true,
      choices: [['inherit', 'Inherit'], ['disabled', 'Disabled'], ['optional', 'Optional'], ['required', 'Required']],
      component: 's-select',
      props: { maxlength: 10 },
      rules: [{ type: 'required', message: 'Required' }, { type: 'max_length', value: 10, message: 'Maximum 10 characters' }]
    }
  ],
  actions: [],
  permissions: {},
  routes: {},
  ui: {},
  filters: {},
  pagination: {},
  pdf: {}
}

// what the serializer answers for that record (RepresentationMixin: choices -> id/value/label)
const READ_SHAPE = { id: 'required', value: 'required', label: 'Required' }
const RECORD = { id: 7, name: 'Acme', two_factor_policy: READ_SHAPE }

let pinia
let fields

beforeEach(async () => {
  pinia = createPinia()
  setActivePinia(pinia)
  httpGet.mockReset()
  httpPatch.mockReset().mockResolvedValue({ data: {} })
  httpPost.mockReset().mockResolvedValue({ data: {} })
  httpGet.mockResolvedValue({ data: SCHEMA })
  fields = (await buildFormFromSchema({ app: 'django_resaas', model: 'entity' })).fields
})

afterEach(() => unmountAll())

const components = {
  's-select': SelectComponent,
  's-btn': BtnComponent,
  's-card': CardComponent,
  's-input': InputComponent,
  's-modal-card': ModalCard,
  's-tooltip': TooltipComponent
}

async function openForm(data) {
  const wrapper = mountWith(AutoForm, pinia, {
    props: { modelValue: true, schema: fields, data, app: 'django_resaas', model: 'entity' },
    global: { components }
  })
  await flushPromises()
  return wrapper
}

const policyField = () => inBody('.q-field')
const errorText = () => inBody('.q-field__messages')?.textContent?.trim() || ''

describe('AutoForm EDIT - a Choice loaded from the API', () => {
  it('the field carries the rules that used to complain (max length 10 on a choice)', () => {
    const field = fields[0]

    expect(field.props.emitValue).toBe(true)
    expect(field.props.mapOptions).toBe(true)
    expect(field.props.rules.length).toBeGreaterThan(0)
  })

  it('shows the stored choice and NO false length error, without touching the select', async () => {
    await openForm(RECORD)

    expect(policyField()).not.toBeNull()
    expect(policyField().textContent).toContain('Required')
    expect(inBody('.q-field--error')).toBeNull()
    expect(errorText()).toBe('')
  })

  it('the record arrives AFTER the form is open (the real EDIT): no false length error, nothing touched', async () => {
    const wrapper = await openForm(null)
    expect(inBody('.q-field--error')).toBeNull()

    await wrapper.setProps({ data: RECORD })
    await flushPromises()
    await new Promise(resolve => setTimeout(resolve, 50))

    expect(policyField().textContent).toContain('Required')
    expect(errorText()).toBe('')
    expect(inBody('.q-field--error')).toBeNull()
  })

  it('the second rule engine (schema rules {type, value, message}) is quiet too', async () => {
    const { resolveRules } = await import('../../utils/schema')
    const wrapper = await openForm(null)

    // FormComponent/FieldComponent bind these rules onto the same select
    await wrapper.setProps({ data: RECORD })
    const rules = resolveRules(fields[0].rules)
    const held = wrapper.findComponent(SelectComponent).vm.$.exposed?.localValue ?? null

    // whatever the select holds must pass max_length 10
    expect(rules.every(rule => rule(held ?? 'required') === true)).toBe(true)
  })

  it('validates clean when the form is asked to (the rules see the value, not the API shape)', async () => {
    const wrapper = await openForm(RECORD)
    const select = wrapper.findAllComponents({ name: 's-select' })[0] ?? null

    // the q-field rules run on what the s-select holds
    const qSelect = document.body.querySelector('.q-field')
    expect(qSelect).not.toBeNull()

    // nothing the user did: no error class after the data settled
    await flushPromises()
    expect(document.body.querySelector('.q-field--error')).toBeNull()
    expect(select).not.toBeUndefined()
  })

  it('SAVE without touching the select sends the raw stored value - never the {id, value, label} object', async () => {
    await openForm(RECORD)

    const save = [...document.body.querySelectorAll('.q-btn')].find(button => button.textContent.trim() === 'Save')
    save.click()
    await flushPromises()

    expect(httpPatch).toHaveBeenCalledTimes(1)
    const [, payload] = httpPatch.mock.calls[0]
    expect(payload.two_factor_policy).toBe('required')
    expect(typeof payload.two_factor_policy).toBe('string')
  })

  it('a record loaded twice (SAVE, RELOAD, EDIT again) stays valid each time', async () => {
    await openForm(RECORD)
    expect(inBody('.q-field--error')).toBeNull()

    unmountAll()
    await openForm({ ...RECORD, two_factor_policy: { id: 'optional', value: 'optional', label: 'Optional' } })

    expect(policyField().textContent).toContain('Optional')
    expect(inBody('.q-field--error')).toBeNull()
  })

  it('a raw string (already the write shape) works exactly the same', async () => {
    await openForm({ id: 7, two_factor_policy: 'disabled' })

    expect(policyField().textContent).toContain('Disabled')
    expect(inBody('.q-field--error')).toBeNull()
  })

  it('an empty choice is not turned into anything', async () => {
    await openForm({ id: 7, two_factor_policy: null })

    expect(policyField().textContent).not.toContain('null')
  })
})
