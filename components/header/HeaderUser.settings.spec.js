import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
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

function mountHeader() {
  push = vi.fn()

  return mount(HeaderUser, {
    global: {
      plugins: [[Quasar, {}]],
      components: { 's-btn': BtnComponent, 's-tooltip': TooltipComponent },
      mocks: { $router: { push }, $route: { fullPath: '/', path: '/', matched: [] } },
      stubs: { QMenu: inline, QExpansionItem: inline, RegisterEntity: true, GroupSelector: true, 'q-popup-proxy': inline }
    }
  })
}

beforeEach(() => {
  setActivePinia(createPinia())
  User = useUserStore()
  User.data = { id: 'u1', username: 'joao', email: 'joao@example.com' }
})

describe('HeaderUser - the settings button', () => {
  it('opens the account PAGE (route "account"), not a modal', async () => {
    const wrapper = mountHeader()

    await wrapper.find('[data-test="header-settings"]').trigger('click')

    expect(push).toHaveBeenCalledWith({ name: 'account' })
  })

  it('no longer has any modal state to toggle', () => {
    expect(User.Settings).toBeUndefined()
    expect(User.toggleSettings).toBeUndefined()
  })
})
