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
  's-modal-card': { props: ['title'], template: '<div data-test="modal"><div data-test="modal-title">{{ title }}</div><slot name="subheader" /><slot /></div>' },
  's-input': { props: ['modelValue'], emits: ['update:modelValue'], template: '<input data-test="calendar-day-search" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />' },
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


describe('CalendarWidget - the day modal: static search, the list scrolls', () => {
  // the dialog content rendered in place (QDialog teleports it)
  const openDay = async () => {
    const w = mount(CalendarWidget, {
      props: { widget: { name: 'my_calendar', count_label: 'Appointments' }, data },
      global: { plugins: [[Quasar, {}]], stubs: { ...stubs, 'q-dialog': { template: '<div><slot /></div>' } } },
    })
    w.findComponent(QDate).vm.$emit('update:model-value', '2026/10/05')
    await w.vm.$nextTick()
    return w
  }

  const names = (w) => w.findAll('[data-test="calendar-day-list"] .q-item').map(item => item.text())

  it('the search sits outside the scrolling list', async () => {
    const w = await openDay()
    const scroll = w.find('[data-test="calendar-day-scroll"]')

    expect(scroll.classes()).toContain('scroll')
    expect(scroll.find('[data-test="calendar-day-search"]').exists()).toBe(false)
    expect(scroll.find('[data-test="calendar-day-list"]').exists()).toBe(true)
  })

  it('filters by patient, status or time, ignoring case and accents', async () => {
    const w = await openDay()
    const search = w.find('[data-test="calendar-day-search"]')

    await search.setValue('MARÍA')
    expect(names(w)).toHaveLength(1)
    expect(names(w)[0]).toContain('Maria')

    await search.setValue('scheduled')
    expect(names(w)[0]).toContain('Rui')

    await search.setValue('10:00')
    expect(names(w)[0]).toContain('Rui')
  })

  it('the title keeps the day total; nothing found says so', async () => {
    const w = await openDay()

    await w.find('[data-test="calendar-day-search"]').setValue('zzz')

    expect(w.find('[data-test="calendar-day-empty"]').text()).toBe('No results')
    expect(w.find('[data-test="modal-title"]').text()).toContain('Appointments: 2')
  })
})
