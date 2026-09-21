import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { reactive } from 'vue'

// The other form engine (Form / FormTwo / FormModal -> FormComponent): it renders the
// schema's own rules ({type, value, message}, resolved by utils/schema.js) onto the
// same s-select. Same cycle: SAVE raw -> READ {id, value, label} -> EDIT -> valid.
const patch = vi.fn()

vi.mock('../../services/api', () => ({
  HTTPAuth: { get: vi.fn(), patch: (...args) => patch(...args), post: vi.fn() },
  url: ({ url: path }) => path
}))
vi.mock('../../boot/alerts', () => ({ Alert: vi.fn(), AlertSuccess: vi.fn(), parseFieldErrors: () => ({}) }))
vi.mock('./RelationRecordDialog.vue', () => ({ default: { name: 'RelationRecordDialog', template: '<div />' } }))
vi.mock('../auto/FormSection.vue', () => ({ default: { name: 'FormSection', template: '<div><slot /></div>' } }))

import FormComponent from './FormComponent.vue'
import SelectComponent from './SelectComponent.vue'
import { mountWith, unmountAll, inBody } from '../user/account/_helpers'

let pinia

const FIELD = {
  name: 'two_factor_policy',
  type: 'CharField',
  label: 'Two-factor policy',
  component: 's-select',
  ui: { isRelation: false, isFile: false, isImage: false },
  props: {
    label: 'Two-factor policy',
    emitValue: true,
    mapOptions: true,
    options: [{ label: 'Inherit', value: 'inherit' }, { label: 'Required', value: 'required' }]
  },
  rules: [{ type: 'required', message: 'Required' }, { type: 'max_length', value: 10, message: 'Maximum 10 characters' }]
}

const READ = { id: 'required', value: 'required', label: 'Required' }

beforeEach(() => {
  pinia = createPinia()
  setActivePinia(pinia)
  patch.mockReset().mockResolvedValue({ data: { id: 7 } })
})

afterEach(() => unmountAll())

const makeStore = (form) => reactive({ fields: [FIELD], form, row: form, safeUrl: 'django_resaas/entitys', model: 'Entity' })

const mountForm = (store) => mountWith(FormComponent, pinia, {
  props: { store },
  global: { components: { 's-select': SelectComponent, 's-input': { name: 's-input', template: '<input />' } } }
})

describe('FormComponent EDIT - a Choice loaded from the API', () => {
  it('the record arrives after the form is open: no false "Maximum 10 characters", nothing touched', async () => {
    const store = makeStore(null)
    const wrapper = mountForm(store)
    await flushPromises()

    store.form = { id: 7, two_factor_policy: READ }
    await flushPromises()
    await new Promise(resolve => setTimeout(resolve, 50))

    const field = wrapper.find('.q-field')
    expect(field.text()).toContain('Required')
    expect(wrapper.find('.q-field--error').exists()).toBe(false)
    expect(inBody('.q-field__messages')?.textContent || '').not.toContain('Maximum')
  })

  it('SAVE without touching the select sends the plain value', async () => {
    const store = makeStore({ id: 7, two_factor_policy: READ })
    const wrapper = mountForm(store)
    await flushPromises()

    await wrapper.vm.save()
    await flushPromises()

    expect(patch).toHaveBeenCalledTimes(1)
    expect(patch.mock.calls[0][1].two_factor_policy).toBe('required')
  })

  it('a genuinely too long value is still rejected by the same rule', async () => {
    const store = makeStore({ id: 7, two_factor_policy: 'a-value-that-is-far-too-long' })
    const wrapper = mountForm(store)
    await flushPromises()

    const qSelect = wrapper.findComponent({ name: 'QSelect' })
    expect(await qSelect.vm.validate()).toBe(false)
  })
})
