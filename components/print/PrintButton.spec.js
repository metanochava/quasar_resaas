import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { Quasar } from 'quasar'

const printing = vi.hoisted(() => ({
  loadPrinting: vi.fn(),
  printDocument: vi.fn(async (code, id, { paper }) => paper || 'thermal_80'),
  deviceChoice: vi.fn(() => null),
  rememberChoice: vi.fn(),
}))
vi.mock('../../services/printing', async (importOriginal) => ({ ...(await importOriginal()), ...printing }))
vi.mock('../../boot/alerts', () => ({ Alert: vi.fn() }))
vi.mock('../../services/translation', () => ({ tdc: t => t }))

import PrintButton from './PrintButton.vue'

const RECEIPT = { code: 'sales.receipt', label: 'Receipt', formats: ['thermal_80', 'a4'], default_format: 'thermal_80', printer: null }
const DATA = {
  documents: [RECEIPT],
  printers: [{ id: 'p1', name: 'Office', paper_format: 'a4' }, { id: 'p2', name: 'Label', paper_format: 'a6' }],
  formats: [{ code: 'thermal_80', label: 'Thermal 80 mm' }, { code: 'a4', label: 'A4' }],
}

const stubs = {
  's-btn': { props: ['label'], emits: ['click'], template: '<button v-bind="$attrs" @click="$emit(\'click\')">{{ label }}<slot /></button>' },
  's-tooltip': { template: '<span />' },
  's-select': { props: ['modelValue', 'options'], emits: ['update:modelValue'], template: '<div v-bind="$attrs" :data-options="JSON.stringify(options)" />' },
  's-checkbox': { props: ['modelValue'], emits: ['update:modelValue'], template: '<input type="checkbox" v-bind="$attrs" :checked="modelValue" @change="$emit(\'update:modelValue\', $event.target.checked)" />' },
  'q-dialog': { props: ['modelValue'], template: '<div v-if="modelValue"><slot /></div>' },
  's-modal-card': { template: '<div><slot /><slot name="footer" /></div>' },
}

const mountBtn = (props = {}) => mount(PrintButton, { props: { document: 'sales.receipt', objectId: 's1', ...props }, global: { plugins: [Quasar], stubs } })

beforeEach(() => {
  vi.clearAllMocks()
  printing.loadPrinting.mockResolvedValue(DATA)
})

describe('s-print-btn', () => {
  it('prints on the default paper', async () => {
    const w = mountBtn()
    await flushPromises()

    await w.find('[data-test="print-main"]').trigger('click')
    await flushPromises()

    expect(printing.printDocument).toHaveBeenCalledWith('sales.receipt', 's1', { paper: null })
    expect(w.emitted('printed')[0]).toEqual([{ document: 'sales.receipt', paper: 'thermal_80' }])
  })

  it('is not shown when this profile cannot print the document here', async () => {
    printing.loadPrinting.mockResolvedValue({ ...DATA, documents: [] })
    const w = mountBtn()
    await flushPromises()

    expect(w.find('[data-test="print-btn"]').exists()).toBe(false)
  })

  it('the options offer only printers whose paper the document supports, and remember the choice', async () => {
    const w = mountBtn()
    await flushPromises()

    await w.find('[data-test="print-options"]').trigger('click')
    const printerOptions = JSON.parse(w.find('[data-test="print-printer"]').attributes('data-options'))
    expect(printerOptions.map(o => o.value)).toEqual(['p1'])

    await w.find('[data-test="print-remember"]').setValue(true)
    await w.find('[data-test="print-confirm"]').trigger('click')
    await flushPromises()

    expect(printing.rememberChoice).toHaveBeenCalledWith('sales.receipt', { printer: null, paper: 'thermal_80' })
    expect(printing.printDocument).toHaveBeenCalledWith('sales.receipt', 's1', { paper: 'thermal_80' })
  })
})
