import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { Quasar } from 'quasar'
import { createPinia, setActivePinia } from 'pinia'

import HeaderUser from './HeaderUser.vue'
import BtnComponent from '../engine/BtnComponent.vue'
import TooltipComponent from '../engine/TooltipComponent.vue'
import { useUserStore } from '../../stores/UserStore'

// q-menu content is only rendered when it opens - render it inline instead
const inline = { template: '<div><slot /></div>' }

let push
let User

function mountHeader(routeName) {
  push = vi.fn()

  return mount(HeaderUser, {
    global: {
      plugins: [[Quasar, {}]],
      components: { 's-btn': BtnComponent, 's-tooltip': TooltipComponent },
      mocks: { $router: { push }, $route: { name: routeName, fullPath: '/', path: '/', matched: [] } },
      stubs: { QMenu: inline, QExpansionItem: inline, RegisterEntity: true, GroupSelector: true, 'q-popup-proxy': inline }
    }
  })
}

beforeEach(() => {
  setActivePinia(createPinia())
  User = useUserStore()
  User.data = { id: 'u1', username: 'joao' }
  User.Group = { id: 'g1', name: 'Admin' }
  vi.spyOn(User, 'getMenus').mockResolvedValue()
})

describe('HeaderUser - the profile watcher', () => {
  it('does not move the user when the same profile is read again (e.g. on the site)', async () => {
    mountHeader('dashboard')

    User.Group = { id: 'g1', name: 'Admin' } // same profile, new object (loadFromStorage)
    await nextTick()

    expect(push).not.toHaveBeenCalled()
  })

  it('never takes the user away from the site', async () => {
    mountHeader('site')

    User.Group = { id: 'g2', name: 'Nurse' }
    await nextTick()

    expect(push).not.toHaveBeenCalled()
  })

  it('opens the dashboard after a real profile change', async () => {
    mountHeader('list_patient')

    User.Group = { id: 'g2', name: 'Nurse' }
    await nextTick()

    expect(push).toHaveBeenCalledWith({ name: 'dashboard' })
  })
})

describe('HeaderUser - the site button', () => {
  it('goes to the site (route "site")', () => {
    const wrapper = mountHeader('dashboard')

    expect(wrapper.find('[data-test="header-site"]').exists()).toBe(true)
  })
})
