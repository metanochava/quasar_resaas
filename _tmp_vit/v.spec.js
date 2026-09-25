import { it, expect, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { Quasar } from 'quasar'
import { HTTPAuth } from './resaas_mock.js'
import VitalSignsDialog from './VitalSignsDialog.vue'
const INTAKE = { agenda: { id: 'ag1', date: '2026-09-25', time: '09:00' }, patient: { id: 'p1', nid: 'N', person: { full_name: 'Maria Flow', age: 40, gender: 'F' } },
  doctor: { full_name: 'Ana' }, professional: { id: 'e1', person: { full_name: 'Nurse Joy' } }, tipo: 'triagem', previous: { created_at: '2026-09-20T10:00:00Z', peso: '68' },
  limits: { temperatura: { min: 30, max: 45, unit: '°C' }, peso: { min: 0.3, max: 400, unit: 'kg' }, altura: { min: 0.3, max: 2.5, unit: 'm' }, ta_sistolica: { min: 50, max: 300, unit: 'mmHg' }, ta_diastolica: { min: 20, max: 200, unit: 'mmHg' }, frequencia_cardiaca: { min: 20, max: 250, unit: 'bpm' } } }
const stubs = { 's-modal-card': { template: '<form @submit.prevent="$emit(\'submit\')"><slot /><slot name="footer" /></form>' },
  's-btn': { props: ['label', 'disable'], template: '<button :data-test="$attrs[\'data-test\']" :disabled="disable">{{ label }}</button>' },
  's-input': { props: ['modelValue', 'errorMessage'], emits: ['update:modelValue'], template: '<div><input :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" /><span class="err">{{ errorMessage }}</span></div>' },
  'q-dialog': { template: '<div><slot /></div>' } }
beforeEach(() => { HTTPAuth.get.mockReset(); HTTPAuth.post.mockReset(); HTTPAuth.get.mockResolvedValue({ data: INTAKE }) })
const mountIt = () => mount(VitalSignsDialog, { props: { modelValue: true, context: { id: 'ag1' } }, global: { plugins: [[Quasar, {}]], stubs } })
const type = async (w, key, value) => { await w.find(`[data-test="vital-${key}"] input`).setValue(value); await flushPromises() }
it('flags, calculates and compares after the refactor', async () => {
  const w = mountIt(); await flushPromises()
  await type(w, 'temperatura', '38.6'); await type(w, 'peso', '70'); await type(w, 'altura', '1.75')
  await type(w, 'ta_sistolica', '150'); await type(w, 'ta_diastolica', '95'); await type(w, 'frequencia_cardiaca', '110')
  expect(w.find('[data-test="vital-temperatura"]').text()).toContain('Fever')
  expect(w.find('[data-test="calc-bmi"]').text()).toContain('22.9')
  expect(w.find('[data-test="calc-map"]').text()).toContain('113')
  expect(w.findAll('[data-test="vital-signs-alert"]').length).toBeGreaterThanOrEqual(3)
})
it('out of range blocks saving; save posts only vital signs', async () => {
  HTTPAuth.post.mockResolvedValue({ data: { id: 'dv1' } })
  const w = mountIt(); await flushPromises()
  await type(w, 'temperatura', '52')
  expect(w.find('[data-test="vital-signs-save"]').attributes('disabled')).toBeDefined()
  await type(w, 'temperatura', '37')
  await w.find('form').trigger('submit'); await flushPromises()
  expect(HTTPAuth.post.mock.calls[0][1]).toMatchObject({ agenda: 'ag1', temperatura: 37 })
  expect(HTTPAuth.post.mock.calls[0][1]).not.toHaveProperty('employee')
})
