import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { Quasar, QMenu, QItem } from 'quasar'
import { createPinia, setActivePinia } from 'pinia'

const push = vi.fn().mockResolvedValue()
vi.mock('vue-router', () => ({ useRouter: () => ({ push }) }))

import GroupSelector from './GroupSelector.vue'
import { useUserStore } from '../stores/UserStore'
import { useGroupStore } from '../stores/GroupStore'

// a plain button standing in for s-btn: same click / dblclick events
const SBtn = {
  inheritAttrs: false,
  props: ['label', 'loading'],
  template: '<button data-test="group-selector" @click="$attrs.onClick" @dblclick="$attrs.onDblclick">{{ label }}<slot /></button>',
}

// a plain input standing in for s-input (v-model + keydown)
const SInput = {
  inheritAttrs: false,
  props: ['modelValue'],
  emits: ['update:modelValue'],
  template: '<input data-test="group-filter" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" @keydown="$attrs.onKeydown && $attrs.onKeydown($event)" />',
}

let User
let Group

function mountSelector () {
  return mount(GroupSelector, {
    global: { plugins: [[Quasar, {}]], stubs: { 's-btn': SBtn, 's-tooltip': true, 's-input': SInput } },
  })
}

beforeEach(() => {
  vi.useFakeTimers()
  setActivePinia(createPinia())
  User = useUserStore()
  User.Group = { id: 'g1', name: 'Doctor' }
  User.Groups = [{ id: 'g1', name: 'Doctor' }, { id: 'g2', name: 'Nurse' }]
  Group = useGroupStore()
  Group.select = vi.fn().mockResolvedValue()
  push.mockClear()
})

afterEach(() => vi.useRealTimers())

const menuOpen = (w) => w.findComponent(QMenu).props('modelValue')

describe('GroupSelector - click / double click', () => {
  it('one click opens the list of profiles', async () => {
    const w = mountSelector()

    await w.find('[data-test="group-selector"]').trigger('click')
    expect(menuOpen(w)).toBe(false) // waits: it could still be a double click
    vi.advanceTimersByTime(300)
    await w.vm.$nextTick()

    expect(menuOpen(w)).toBe(true)
    expect(Group.select).not.toHaveBeenCalled()
  })

  it('a double click reloads the current profile (Group.select) and does not open the list', async () => {
    const w = mountSelector()
    const button = w.find('[data-test="group-selector"]')

    await button.trigger('click')
    await button.trigger('click')
    await button.trigger('dblclick')
    vi.advanceTimersByTime(300)
    await w.vm.$nextTick()

    expect(Group.select).toHaveBeenCalledTimes(1)
    expect(Group.select).toHaveBeenCalledWith(User.Group)
    expect(menuOpen(w)).toBe(false)
    await vi.waitFor(() => expect(push).toHaveBeenCalledWith({ name: 'dashboard' }))
  })

  it('choosing a profile in the list also ends on the home page', async () => {
    const w = mountSelector()
    await w.find('[data-test="group-selector"]').trigger('click')
    vi.advanceTimersByTime(300)
    await w.vm.$nextTick()

    const items = w.findAllComponents(QItem)
    expect(items.length).toBe(2)
    await items[1].trigger('click')
    await vi.waitFor(() => expect(Group.select).toHaveBeenCalledWith(User.Groups[1]))
    await vi.waitFor(() => expect(push).toHaveBeenCalledWith({ name: 'dashboard' }))
  })
})

describe('GroupSelector - filter', () => {
  async function openMenu (w) {
    await w.find('[data-test="group-selector"]').trigger('click')
    vi.advanceTimersByTime(300)
    await w.vm.$nextTick()
  }

  it('the filter on top of the list narrows the profiles', async () => {
    const w = mountSelector()
    await openMenu(w)

    const input = [...document.body.querySelectorAll('[data-test="group-filter"]')].pop()
    expect(input).not.toBeNull()
    input.value = 'nur'
    input.dispatchEvent(new Event('input'))
    await w.vm.$nextTick()

    const labels = w.findAllComponents(QItem).map(i => i.text().trim())
    expect(labels).toEqual(['Nurse'])
  })

  it('Enter in the filter picks the first match', async () => {
    const w = mountSelector()
    await openMenu(w)

    const input = [...document.body.querySelectorAll('[data-test="group-filter"]')].pop()
    input.value = 'nur'
    input.dispatchEvent(new Event('input'))
    await w.vm.$nextTick()
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }))
    await w.vm.$nextTick()

    expect(Group.select).toHaveBeenCalledWith({ id: 'g2', name: 'Nurse' })
  })
})
