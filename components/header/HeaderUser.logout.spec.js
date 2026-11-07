import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { Quasar } from 'quasar'
import { createPinia, setActivePinia } from 'pinia'

import HeaderUser from './HeaderUser.vue'
import BtnComponent from '../engine/BtnComponent.vue'
import TooltipComponent from '../engine/TooltipComponent.vue'
import { useUserStore } from '../../stores/UserStore'

// the sign-out dialog rendered inline (no teleport)
const inline = { template: '<div><slot /><slot name="footer" /></div>' }

let User

function mountHeader () {
  return mount(HeaderUser, {
    global: {
      plugins: [[Quasar, {}]],
      components: { 's-btn': BtnComponent, 's-tooltip': TooltipComponent, 's-modal-card': inline },
      mocks: { $router: { push: vi.fn() }, $route: { name: 'dashboard', fullPath: '/', path: '/', matched: [] } },
      stubs: { QDialog: inline, QMenu: inline, QExpansionItem: inline, RegisterEntity: true, GroupSelector: true, 'q-popup-proxy': inline },
    },
  })
}

beforeEach(() => {
  setActivePinia(createPinia())
  User = useUserStore()
  User.data = { id: 'u1', username: 'joao' }
  User.Entity = { id: 'e1', name: 'Clinic' }
  vi.spyOn(User, 'getMenus').mockResolvedValue()
  vi.spyOn(User, 'logout').mockResolvedValue()
})

afterEach(() => {
  delete process.env.SSO_URL
})

describe('HeaderUser - signing out with single sign-on', () => {
  beforeEach(() => { process.env.SSO_URL = 'https://auth.mytech.co.mz' })

  it('offers two explicit choices: every site, or this site only', async () => {
    const wrapper = mountHeader()

    await wrapper.find('[data-test="logout-everywhere"]').trigger('click')
    expect(User.logout).toHaveBeenLastCalledWith('e1', { onlyHere: false })

    await wrapper.find('[data-test="logout-only-here"]').trigger('click')
    expect(User.logout).toHaveBeenLastCalledWith('e1', { onlyHere: true })
  })
})

describe('HeaderUser - signing out without single sign-on', () => {
  it('keeps the Entity / Entity type choice and no site choice', () => {
    const wrapper = mountHeader()

    expect(wrapper.find('[data-test="logout-everywhere"]').exists()).toBe(false)
    expect(wrapper.find('[data-test="logout-only-here"]').exists()).toBe(false)
  })
})
