import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { Quasar } from 'quasar'

const printing = vi.hoisted(() => ({
  loadPrinting: vi.fn(),
  documentPdf: vi.fn(async (code, id, { paper }) => ({ blob: new Blob(['%PDF'], { type: 'application/pdf' }), paper })),
  deviceChoice: vi.fn(() => null),
  rememberChoice: vi.fn(),
}))
vi.mock('../../services/printing', async (importOriginal) => ({ ...(await importOriginal()), ...printing }))
vi.mock('../../services/translation', () => ({ tdc: t => t }))

import PrintDialog from './PrintDialog.vue'

const VITALS = { code: 'saude.vital_signs', label: 'Vital signs', formats: ['a7', 'a6'], default_format: 'a7', printer: null }
const DATA = {
  documents: [VITALS],
  printers: [{ id: 'p1', name: 'Ward', paper_format: 'a6' }, { id: 'p2', name: 'Counter', paper_format: 'thermal_80' }],
  formats: [{ code: 'a7', label: 'A7 (half A6)' }, { code: 'a6', label: 'A6' }],
}
const stubs = {
  'q-dialog': { props: ['modelValue'], template: '<div v-if="modelValue"><slot /></div>' },
  's-modal-card': { template: '<div><slot /><slot name="footer" /></div>' },
  's-btn': { props: ['label', 'disable'], emits: ['click'], template: '<button v-bind="$attrs" :disabled="disable" @click="$emit(\'click\')">{{ label }}<slot /></button>' },
  's-tooltip': { template: '<span />' },
  's-select': { props: ['modelValue', 'options'], emits: ['update:modelValue'], template: '<select v-bind="$attrs" :data-options="JSON.stringify(options)" :value="modelValue" @change="$emit(\'update:modelValue\', $event.target.value)"><option v-for="o in options" :key="o.value" :value="o.value">{{ o.label }}</option></select>' },
  's-checkbox': { props: ['modelValue'], emits: ['update:modelValue'], template: '<input type="checkbox" v-bind="$attrs" :checked="modelValue" @change="$emit(\'update:modelValue\', $event.target.checked)" />' },
}

beforeEach(() => {
  vi.clearAllMocks()
  printing.loadPrinting.mockResolvedValue(DATA)
  globalThis.URL.createObjectURL = vi.fn(() => 'blob:preview')
  globalThis.URL.revokeObjectURL = vi.fn()
})

const mountDialog = () => mount(PrintDialog, { props: { modelValue: true, document: 'saude.vital_signs', objectId: 'v1' }, global: { plugins: [Quasar], stubs } })

describe('s-print-dialog', () => {
  it('previews the PDF on the default paper', async () => {
    const w = mountDialog()
    await flushPromises()
    expect(printing.documentPdf).toHaveBeenCalledWith('saude.vital_signs', 'v1', { paper: 'a7' })
    expect(w.find('iframe').attributes('src')).toBe('blob:preview')
  })

  it('offers only printers whose paper the document supports; another paper re-renders the preview', async () => {
    const w = mountDialog()
    await flushPromises()
    const printers = JSON.parse(w.find('[data-test="print-printer"]').attributes('data-options'))
    expect(printers.map(p => p.value)).toEqual(['p1'])

    await w.find('[data-test="print-paper"]').setValue('a6')
    await flushPromises()
    expect(printing.documentPdf).toHaveBeenLastCalledWith('saude.vital_signs', 'v1', { paper: 'a6' })
  })

  it('Print prints the previewed PDF and keeps the choice when asked', async () => {
    const w = mountDialog()
    await flushPromises()
    const print = vi.fn()
    Object.defineProperty(w.find('iframe').element, 'contentWindow', { value: { focus: () => {}, print } })

    await w.find('[data-test="print-remember"]').setValue(true)
    await w.find('[data-test="print-confirm"]').trigger('click')

    expect(print).toHaveBeenCalled()
    expect(printing.rememberChoice).toHaveBeenCalledWith('saude.vital_signs', { printer: null, paper: 'a7' })
    expect(w.emitted('printed')[0]).toEqual([{ document: 'saude.vital_signs', paper: 'a7' }])
  })

  it('a document this profile cannot print says so', async () => {
    printing.loadPrinting.mockResolvedValue({ ...DATA, documents: [] })
    const w = mountDialog()
    await flushPromises()
    expect(w.find('[data-test="print-dialog-unavailable"]').exists()).toBe(true)
    expect(printing.documentPdf).not.toHaveBeenCalled()
  })
})
