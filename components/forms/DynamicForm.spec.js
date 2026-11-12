import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { Quasar } from 'quasar'
import { defineComponent, h } from 'vue'

// <s-dynamic-form>: wizard steps validated per step, conditions, repeaters, a
// module's own component (registry), a workflow submitted to its endpoint and
// the server's field errors shown back
const { http } = vi.hoisted(() => ({ http: { get: vi.fn(), post: vi.fn(), put: vi.fn(async () => ({})), delete: vi.fn(async () => ({})) } }))
vi.mock('../../services/api', () => ({ HTTPAuth: http, url: ({ url, params }) => `${url}${params ? '?' + new URLSearchParams(params) : ''}` }))
vi.mock('../../services/translation', () => ({ tdc: s => s }))

import DynamicForm from './DynamicForm.vue'
import { registerFormComponent, unregisterFormComponent } from './registry'

const Input = defineComponent({
  props: ['modelValue', 'label', 'errorMessage', 'readonly'],
  emits: ['update:modelValue'],
  setup (props, { emit, attrs }) {
    return () => h('label', { 'data-test': attrs['data-test'] }, [
      props.label,
      h('input', { value: props.modelValue ?? '', readonly: props.readonly, onInput: e => emit('update:modelValue', e.target.value) }),
      props.errorMessage ? h('span', { class: 'err' }, props.errorMessage) : null
    ])
  }
})

const stubs = {
  's-input': Input, 's-switch': Input, 's-select': Input,
  's-btn': { props: ['label', 'type'], emits: ['click'], template: '<button :type="type || \'button\'" @click="$emit(\'click\')">{{ label }}<slot /></button>' },
  's-tooltip': { template: '<span><slot /></span>' },
  's-card': { template: '<div><slot /></div>' }
}

const wizard = {
  schema_version: '1.0', key: 'hotel.check_in', mode: 'workflow', layout: 'wizard',
  submit: { endpoint: 'hotel/stays/{id}/check_in/', method: 'post' },
  sections: [
    { key: 'guest', label: 'Guest', fields: [
      { name: 'full_name', type: 'text', required: true },
      { name: 'foreigner', type: 'boolean' },
      { name: 'passport', type: 'text', visible_if: { field: 'foreigner', op: 'eq', value: 'yes' } }
    ] },
    { key: 'stay', label: 'Stay', fields: [
      { name: 'nights', type: 'integer', required: true },
      { name: 'companions', type: 'repeater', fields: [{ name: 'name', type: 'text' }] },
      { name: 'signature', type: 'custom', component: 'hotel.signature' }
    ] }
  ]
}

function mountForm (props) {
  return mount(DynamicForm, { props, global: { plugins: [Quasar], stubs } })
}

async function type (w, name, value) {
  await w.find(`[data-test="df-input-${name}"] input`).setValue(value)
}

beforeEach(() => vi.clearAllMocks())

describe('DynamicForm', () => {
  it('validates each wizard step before going on and shows conditional fields', async () => {
    const w = mountForm({ definition: wizard, params: { id: 's1' } })
    await flushPromises()
    await w.find('[data-test="df-next"]').trigger('click')
    expect(w.text()).toContain('This field is required.')

    expect(w.find('[data-test="df-input-passport"]').exists()).toBe(false)
    await type(w, 'foreigner', 'yes')
    expect(w.find('[data-test="df-input-passport"]').exists()).toBe(true)
    await type(w, 'full_name', 'Ana')
    await w.find('[data-test="df-next"]').trigger('click')
    expect(w.vm.errors).toEqual({})
  })

  it('renders a module\'s registered component and a repeater', async () => {
    registerFormComponent('hotel.signature', defineComponent({ props: ['label'], setup: () => () => h('canvas', { 'data-test': 'sig' }) }))
    const w = mountForm({ definition: { ...wizard, layout: 'sections' } })
    await flushPromises()
    expect(w.find('[data-test="df-input-signature"]').element.tagName).toBe('CANVAS')
    await w.find('[data-test="df-add-companions"]').trigger('click')
    expect(w.vm.data.companions).toEqual([{ name: null }])
    unregisterFormComponent('hotel.signature')
    expect(mountForm({ definition: { ...wizard, layout: 'sections' } }).find('[data-test="df-unknown-component"]').exists()).toBe(true)
  })

  it('submits a workflow to its endpoint and shows the server\'s field errors', async () => {
    http.post.mockRejectedValueOnce({ response: { data: { error: { message: 'Invalid', details: { nights: ['Too many nights.'] } } } } })
    const w = mountForm({ definition: { ...wizard, layout: 'sections' }, params: { id: 's1' } })
    await flushPromises()
    await type(w, 'full_name', 'Ana')
    await type(w, 'nights', '40')
    await w.vm.submit()
    await flushPromises()
    expect(http.post.mock.calls[0][0]).toBe('hotel/stays/s1/check_in/')
    expect(http.post.mock.calls[0][1]).toMatchObject({ full_name: 'Ana', nights: '40' })
    expect(w.text()).toContain('Too many nights.')

    http.post.mockResolvedValueOnce({ data: { ok: true } })
    await w.vm.submit()
    await flushPromises()
    expect(w.emitted('submitted')[0][0]).toEqual({ ok: true })
  })

  it('a declarative form without an endpoint hands the data to its page', async () => {
    const w = mountForm({ definition: { ...wizard, mode: 'declarative', layout: 'tabs', submit: undefined } })
    await flushPromises()
    await type(w, 'full_name', 'Ana')
    await type(w, 'nights', '2')
    await w.vm.submit()
    expect(w.emitted('submit')[0][0]).toMatchObject({ full_name: 'Ana', nights: '2' })
    expect(http.post).not.toHaveBeenCalled()
  })

  it('asks the backend for a form by key (the resolved layers)', async () => {
    http.get.mockResolvedValueOnce({ data: { definition: { ...wizard, layout: 'sections' }, layers: [{ level: 'platform' }] } })
    const w = mountForm({ formKey: 'hotel.check_in' })
    await flushPromises()
    expect(http.get.mock.calls[0][0]).toContain('django_resaas/forms/resolve/?key=hotel.check_in')
    expect(w.find('[data-test="df-input-full_name"]').exists()).toBe(true)
  })
})
