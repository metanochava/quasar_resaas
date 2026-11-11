import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { Quasar } from 'quasar'
import { createPinia, setActivePinia } from 'pinia'

const rows = [
  { id: 'r1', weekday: { id: 0, value: 0, label: 'Monday' }, opens_at: '08:00:00', closes_at: '12:00:00' },
  { id: 'r2', weekday: 0, opens_at: '14:00:00', closes_at: '17:00:00' },
]
const post = vi.fn(async () => ({ data: {} }))
vi.mock('../../services/api', () => ({
  url: ({ url }) => url,
  HTTPAuth: { get: vi.fn(async () => ({ data: { results: rows } })), post: (...a) => post(...a), delete: vi.fn(async () => ({})) },
}))

import BranchOpeningHours from './BranchOpeningHours.vue'
import { useUserStore } from '../../stores/UserStore'

const stubs = {
  's-card': { template: '<div><slot /></div>' },
  's-btn': { props: ['disable'], emits: ['click'], template: '<button :disabled="disable" @click="$emit(\'click\')"><slot /></button>' },
  's-tooltip': { template: '<span class="tip"><slot /></span>' },
  's-time': { props: ['modelValue'], template: '<input :value="modelValue" />' },
}

beforeEach(() => {
  setActivePinia(createPinia())
  post.mockClear()
})

describe('BranchOpeningHours', () => {
  it('shows the intervals by weekday and the other days as closed', async () => {
    useUserStore().Permissions = new Set(['list_branchopeninghours'])
    const w = mount(BranchOpeningHours, { props: { branchId: 'b1' }, global: { plugins: [Quasar], stubs } })
    await flushPromises()

    const days = w.findAll('[data-test="opening-day"]')
    expect(days).toHaveLength(7)
    expect(days[0].text()).toContain('08:00–12:00')
    expect(days[0].text()).toContain('14:00–17:00')
    expect(days[1].text()).toContain('Closed')
    expect(w.find('[data-test="opening-add"]').exists()).toBe(false)
  })

  it('adds an interval for the branch, with a tooltip on the button', async () => {
    useUserStore().Permissions = new Set(['list_branchopeninghours', 'add_branchopeninghours'])
    const w = mount(BranchOpeningHours, { props: { branchId: 'b1' }, global: { plugins: [Quasar], stubs } })
    await flushPromises()

    const button = w.find('[data-test="opening-add"]')
    expect(button.find('.tip').exists()).toBe(true)
    await button.trigger('click')
    await flushPromises()

    expect(post).toHaveBeenCalledWith('django_resaas/branchopeninghours/',
      { branch: 'b1', weekday: 0, opens_at: '08:00', closes_at: '17:00' })
  })
})
