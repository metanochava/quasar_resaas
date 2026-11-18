import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { Quasar } from 'quasar'
import { createPinia, setActivePinia } from 'pinia'

import HeaderServices from './HeaderServices.vue'
import BtnComponent from '../engine/BtnComponent.vue'
import TooltipComponent from '../engine/TooltipComponent.vue'
import { useUserStore } from '../../stores/UserStore'
import { useEntityTypeStore } from '../../stores/EntityTypeStore'

const TYPES = [
  { id: 1, name: 'saude', icon: { url: '/s.png' } },
  { id: 2, name: 'escola', icon: null }
]

let getLayoutSettings

const mountMenu = () => mount(HeaderServices, {
  global: {
    plugins: [Quasar],
    components: { 's-btn': BtnComponent, 's-tooltip': TooltipComponent },
    stubs: { 's-card': { template: '<div><slot /></div>' } }
  }
})

beforeEach(() => {
  setActivePinia(createPinia())
  const EntityType = useEntityTypeStore()
  vi.spyOn(EntityType, 'getEntityTypes').mockImplementation(async () => {
    useUserStore().EntityTypes = TYPES
  })
  getLayoutSettings = vi.spyOn(EntityType, 'getLayoutSettings').mockResolvedValue()
})

afterEach(() => {
  window.history.replaceState({}, '', '/')
})

describe('HeaderServices - the EntityTypes menu', () => {
  it('lists every EntityType except the one of this host', async () => {
    // jsdom host is localhost: entityTypeKey() is the first label, "localhost"
    const wrapper = mountMenu()
    await flushPromises()

    expect(wrapper.vm.otherTypes.map(t => t.id)).toEqual([1, 2])
  })

  it("makes the host's EntityType current once, with its look", async () => {
    // jsdom's host is "localhost", so an EntityType named "localhost" is this host's
    const EntityType = useEntityTypeStore()
    EntityType.getEntityTypes.mockImplementation(async () => {
      useUserStore().EntityTypes = [...TYPES, { id: 3, name: 'localhost' }]
    })
    const wrapper = mountMenu()
    await flushPromises()

    expect(useUserStore().EntityType?.id).toBe(3)
    expect(EntityType.row?.id).toBe(3)
    expect(getLayoutSettings).toHaveBeenCalledTimes(1)
    expect(getLayoutSettings).toHaveBeenCalledWith(3)
    expect(wrapper.vm.otherTypes.map(t => t.id)).toEqual([1, 2])
  })

  it('opens the chosen EntityType site in a new tab', async () => {
    const open = vi.spyOn(window, 'open').mockImplementation(() => null)
    const wrapper = mountMenu()
    await flushPromises()

    wrapper.vm.openType(TYPES[0])

    expect(open).toHaveBeenCalledWith(expect.stringMatching(/^http:\/\/saude/), '_blank')
    open.mockRestore()
  })
})
