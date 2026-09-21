import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

vi.mock('../../services/api', () => ({ HTTPAuth: { get: vi.fn() }, url: ({ url: path }) => path }))
vi.mock('./RelationRecordDialog.vue', () => ({ default: { name: 'RelationRecordDialog', template: '<div />' } }))

import SelectComponent from './SelectComponent.vue'
import { mountWith, unmountAll } from '../user/account/_helpers'
import { resolveRules } from '../../utils/schema'

let pinia

const OPTIONS = [{ label: 'Inherit', value: 'inherit' }, { label: 'Optional', value: 'optional' }, { label: 'Required', value: 'required' }]
const READ = { id: 'required', value: 'required', label: 'Required' }

beforeEach(() => {
  pinia = createPinia()
  setActivePinia(pinia)
})

afterEach(() => unmountAll())

function mountSelect(props, attrs = {}) {
  return mountWith(SelectComponent, pinia, {
    props,
    attrs: { emitValue: true, mapOptions: true, options: OPTIONS, ...attrs },
    global: { components: {} }
  })
}

const rules = resolveRules([{ type: 'max_length', value: 10, message: 'Maximum 10 characters' }])

describe('s-select - a choice loaded from the API', () => {
  it('holds the plain value from the very first render, and validates', async () => {
    const wrapper = mountSelect({ modelValue: READ }, { rules })
    await flushPromises()

    const qSelect = wrapper.findComponent({ name: 'QSelect' })
    expect(qSelect.props('modelValue')).toBe('required')
    expect(await qSelect.vm.validate()).toBe(true)
  })

  it('a value that arrives later is converted too - and handed back to the parent as the plain value', async () => {
    const wrapper = mountSelect({ modelValue: null }, { rules })
    await wrapper.setProps({ modelValue: READ })
    await flushPromises()

    const qSelect = wrapper.findComponent({ name: 'QSelect' })
    expect(qSelect.props('modelValue')).toBe('required')
    expect(await qSelect.vm.validate()).toBe(true)
    expect(wrapper.emitted('update:modelValue').at(-1)).toEqual(['required'])
  })

  it('a value that was already plain changes nothing and emits nothing', async () => {
    const wrapper = mountSelect({ modelValue: 'optional' }, { rules })
    await flushPromises()

    expect(wrapper.findComponent({ name: 'QSelect' }).props('modelValue')).toBe('optional')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('integer choices keep their type', async () => {
    const wrapper = mountSelect({ modelValue: { id: 2, value: 2, label: 'Two' } }, { options: [{ label: 'One', value: 1 }, { label: 'Two', value: 2 }] })
    await flushPromises()

    expect(wrapper.findComponent({ name: 'QSelect' }).props('modelValue')).toBe(2)
  })

  it('null stays null (an optional / nullable choice)', async () => {
    const wrapper = mountSelect({ modelValue: null })
    await flushPromises()

    expect(wrapper.findComponent({ name: 'QSelect' }).props('modelValue')).toBeNull()
  })

  it('a multiple choice loaded as READ objects becomes plain values', async () => {
    const wrapper = mountSelect({ modelValue: [{ value: 'inherit', label: 'Inherit' }, { value: 'optional', label: 'Optional' }] }, { multiple: true })
    await flushPromises()

    expect(wrapper.findComponent({ name: 'QSelect' }).props('modelValue')).toEqual(['inherit', 'optional'])
  })

  it('a relation select (no emit-value) keeps its READ object - FK/M2M are not choices', async () => {
    const relation = { id: 7, value: 7, label: 'Ana Costa' }
    const wrapper = mountSelect({ modelValue: relation }, { emitValue: false, mapOptions: false, options: [] })
    await flushPromises()

    expect(wrapper.findComponent({ name: 'QSelect' }).props('modelValue')).toEqual(relation)
  })

  it('the user picking a value still works exactly as before', async () => {
    const wrapper = mountSelect({ modelValue: READ })
    await flushPromises()

    wrapper.findComponent({ name: 'QSelect' }).vm.$emit('update:modelValue', 'optional')
    await flushPromises()

    expect(wrapper.emitted('update:modelValue').at(-1)).toEqual(['optional'])
  })
})
