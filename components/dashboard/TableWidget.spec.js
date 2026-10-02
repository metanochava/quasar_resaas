import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { Quasar } from 'quasar'
import { createPinia, setActivePinia } from 'pinia'

vi.mock('vue-router', () => ({ useRouter: () => ({ push: vi.fn() }) }))

import TableWidget from './TableWidget.vue'

const data = {
  columns: [
    { name: 'patient', label: 'Patient' },
    { name: 'vital_signs', label: 'Vital Signs', badge: { Recorded: 'positive', Pending: 'warning' } },
    { name: 'status', label: 'Status', badge: { Waiting: 'warning', Completed: 'positive' } },
  ],
  rows: [
    { id: '1', patient: 'Ana', vital_signs: 'Pending', status: 'Waiting' },
    { id: '2', patient: 'Rui', vital_signs: 'Recorded', status: 'No-show' },
    { id: '3', patient: 'Eva', vital_signs: '-', status: 'Completed' },
  ],
  pagination: { count: 3 },
}

function mountTable() {
  return mount(TableWidget, {
    props: { widget: { name: 'reception_queue' }, data },
    global: { plugins: [[Quasar, {}]], stubs: { 's-btn': true, 's-tooltip': true } },
  })
}

beforeEach(() => setActivePinia(createPinia()))

describe('TableWidget - badge columns', () => {
  it('renders a badge column value as a label with its backend color', () => {
    const badges = mountTable().findAll('[data-test="badge-vital_signs"]')

    expect(badges.map((b) => b.text())).toEqual(['Pending', 'Recorded'])
    expect(badges[0].classes()).toContain('bg-warning')
    expect(badges[1].classes()).toContain('bg-positive')
  })

  it('uses grey for a value with no color of its own', () => {
    const statuses = mountTable().findAll('[data-test="badge-status"]')

    expect(statuses.map((b) => b.text())).toEqual(['Waiting', 'No-show', 'Completed'])
    expect(statuses[1].classes()).toContain('bg-grey')
  })

  it('shows an empty value ("-") without a badge, and plain columns as text', () => {
    const w = mountTable()

    expect(w.findAll('[data-test="badge-vital_signs"]')).toHaveLength(2)
    expect(w.text()).toContain('Ana')
    expect(w.find('[data-test="badge-patient"]').exists()).toBe(false)
  })
})
