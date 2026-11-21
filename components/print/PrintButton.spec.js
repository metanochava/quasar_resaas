import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { Quasar } from 'quasar'

const printing = vi.hoisted(() => ({ loadPrinting: vi.fn() }))
vi.mock('../../services/printing', async (importOriginal) => ({ ...(await importOriginal()), ...printing }))
vi.mock('../../services/translation', () => ({ tdc: t => t }))
vi.mock('./PrintDialog.vue', () => ({ default: { props: ['modelValue', 'document', 'objectId'], template: '<div v-if="modelValue" data-test="dialog-stub">{{ document }} {{ objectId }}</div>' } }))

import PrintButton from './PrintButton.vue'

const RECEIPT = { code: 'sales.receipt', label: 'Receipt', formats: ['thermal_80', 'a4'], default_format: 'thermal_80', printer: null }
const stubs = {
  's-btn': { props: ['label'], emits: ['click'], template: '<button v-bind="$attrs" @click="$emit(\'click\')">{{ label }}<slot /></button>' },
  's-tooltip': { template: '<span />' },
}
const mountBtn = (props = {}) => mount(PrintButton, { props: { document: 'sales.receipt', objectId: 's1', ...props }, global: { plugins: [Quasar], stubs } })

beforeEach(() => {
  vi.clearAllMocks()
  printing.loadPrinting.mockResolvedValue({ documents: [RECEIPT], printers: [], formats: [] })
})

describe('s-print-btn', () => {
  it('opens the print dialog (not the browser print window) for the document', async () => {
    const w = mountBtn()
    await flushPromises()
    expect(w.find('[data-test="dialog-stub"]').exists()).toBe(false)

    await w.find('[data-test="print-main"]').trigger('click')
    expect(w.find('[data-test="dialog-stub"]').text()).toBe('sales.receipt s1')
  })

  it('is not shown when this profile cannot print the document here', async () => {
    printing.loadPrinting.mockResolvedValue({ documents: [], printers: [], formats: [] })
    const w = mountBtn()
    await flushPromises()
    expect(w.find('[data-test="print-btn"]').exists()).toBe(false)
  })
})
