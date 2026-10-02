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

let User
let Group

function mountSelector () {
  return mount(GroupSelector, {
    global: { plugins: [[Quasar, {}]], stubs: { 's-btn': SBtn, 's-tooltip': true } },
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
    await vi.waitFor(() => expect(push).toHaveBeenCalledWith({ name: 'home' }))
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
    await vi.waitFor(() => expect(push).toHaveBeenCalledWith({ name: 'home' }))
  })
})
