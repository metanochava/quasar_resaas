import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { Quasar, QDate, QDialog } from 'quasar'
import { createPinia, setActivePinia } from 'pinia'

vi.mock('vue-router', () => ({ useRouter: () => ({ push: vi.fn() }) }))

import CalendarWidget from './CalendarWidget.vue'

const data = {
  events: [
    { id: '1', title: 'Maria', start: '2026-10-05T09:00:00', end: '2026-10-05T09:30:00', status: 'Waiting', status_color: 'warning' },
    { id: '2', title: 'Rui', start: '2026-10-05T10:00:00', status: 'Scheduled', status_color: 'info' },
    { id: '3', title: 'Ana', start: '2026-10-07T08:00:00', status: 'Scheduled', status_color: 'info' },
  ],
}

// s-btn / s-modal-card stand-ins: a button and a card with title + body
const stubs = {
  's-btn': { template: '<button v-bind="$attrs" @click="$attrs.onClick"><slot /></button>', inheritAttrs: false },
  's-modal-card': { props: ['title'], template: '<div data-test="modal"><div data-test="modal-title">{{ title }}</div><slot /></div>' },
}

function mountCalendar (widget = { name: 'my_calendar', count_label: 'Appointments' }) {
  return mount(CalendarWidget, { props: { widget, data }, global: { plugins: [[Quasar, {}]], stubs } })
}

beforeEach(() => setActivePinia(createPinia()))

describe('CalendarWidget - the selected day', () => {
  it('shows the selected date and how many appointments it has', () => {
    const w = mountCalendar()

    expect(w.find('[data-test="calendar-day-header"]').text()).toContain('05/10/2026')
    expect(w.find('[data-test="calendar-day-count"]').text()).toBe('Appointments: 2')
  })

  it('clicking a day with appointments opens their list in a modal', async () => {
    const w = mountCalendar()

    w.findComponent(QDate).vm.$emit('update:model-value', '2026/10/07')
    await w.vm.$nextTick()

    expect(w.findComponent(QDialog).props('modelValue')).toBe(true)
    expect(w.find('[data-test="calendar-day-count"]').text()).toBe('Appointments: 1')
  })

  it('a day without appointments does not open the modal', async () => {
    const w = mountCalendar()

    w.findComponent(QDate).vm.$emit('update:model-value', '2026/10/20')
    await w.vm.$nextTick()

    expect(w.findComponent(QDialog).props('modelValue')).toBe(false)
    expect(w.find('[data-test="calendar-day-count"]').text()).toBe('Appointments: 0')
  })

  it('counts "Events" when the widget does not name what it counts', () => {
    expect(mountCalendar({ name: 'x' }).find('[data-test="calendar-day-count"]').text()).toBe('Events: 2')
  })
})
