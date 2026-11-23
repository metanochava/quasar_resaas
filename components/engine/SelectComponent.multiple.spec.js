import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { defineComponent, h, reactive } from 'vue'

vi.mock('../../services/api', () => ({ HTTPAuth: { get: vi.fn() }, url: ({ url: path }) => path }))
vi.mock('./RelationRecordDialog.vue', () => ({ default: { name: 'RelationRecordDialog', template: '<div />' } }))

import SelectComponent from './SelectComponent.vue'
import { mountWith, unmountAll } from '../user/account/_helpers'

let pinia
beforeEach(() => { pinia = createPinia(); setActivePinia(pinia) })
afterEach(() => unmountAll())

const OPTIONS = [{ label: 'Receipt', value: 'sales.receipt' }, { label: 'Vital signs', value: 'saude.vital_signs' }]

describe('s-select multiple: an array v-model', () => {
  it('settles instead of feeding its two watchers forever (add_printer froze)', async () => {
    const form = reactive({ documents: [] })
    let updates = 0
    const Page = defineComponent({
      setup: () => () => h(SelectComponent, {
        modelValue: form.documents,
        'onUpdate:modelValue': value => { updates += 1; if (updates < 50) form.documents = value },
        options: OPTIONS, multiple: true, emitValue: true, mapOptions: true,
      })
    })
    mountWith(Page, pinia, {})
    await flushPromises()

    // the page sets the array again (a load, a reset): still no loop
    form.documents = ['sales.receipt']
    await flushPromises()
    form.documents = []
    await flushPromises()

    expect(updates).toBeLessThan(5)
  })
})
